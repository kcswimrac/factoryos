/**
 * Auth API Routes
 *
 * POST /api/auth/signup           — create account
 * POST /api/auth/login            — log in, get JWT
 * POST /api/auth/logout           — client-side, returns success
 * GET  /api/auth/me               — get current user
 * POST /api/auth/forgot-password  — request password reset email
 * POST /api/auth/reset-password   — reset password with token
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { signToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/auth/signup ────────────────────────────────────────────────────

router.post('/signup', async (req, res) => {
  const pool = req.app.locals.pool;
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }
  const emailLower = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [emailLower]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with that email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const displayName = name?.trim() || emailLower.split('@')[0];

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, created_at`,
      [emailLower, displayName, password_hash]
    );
    const user = userResult.rows[0];

    // Create a default team for this user
    const teamSlug = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${user.id}`;
    const teamResult = await pool.query(
      `INSERT INTO teams (name, slug, description, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [`${displayName}'s Team`, teamSlug, 'My workspace', user.id]
    );
    const teamId = teamResult.rows[0].id;

    // Add user as owner of their team
    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [teamId, user.id]
    );

    const token = signToken(user);
    res.status(201).json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name },
      team: { id: teamId }
    });
  } catch (err) {
    console.error('[Auth] Signup error:', err);
    res.status(500).json({ success: false, message: 'Signup failed. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  const pool = req.app.locals.pool;
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, name, password_hash FROM users WHERE LOWER(email) = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    if (!user || !user.password_hash) {
      // Generic message to prevent email enumeration
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  // JWT is stateless — client drops the token
  res.json({ success: true, message: 'Logged out' });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const result = await pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
  const pool = req.app.locals.pool;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE LOWER(email) = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];

    // Always respond the same way to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );

    const appUrl = process.env.APP_URL || 'https://factoryos-r7a3.polsia.app';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    // Log for now (email provider can be wired in later)
    console.log(`[Auth] Password reset for ${user.email}: ${resetUrl}`);

    // Try to send via Polsia email proxy if configured
    const polsiaApiKey = process.env.POLSIA_API_KEY || process.env.POLSIA_API_TOKEN;
    if (polsiaApiKey) {
      try {
        await sendResetEmail({ to: user.email, name: user.name, resetUrl, apiKey: polsiaApiKey });
      } catch (emailErr) {
        console.error('[Auth] Email send failed:', emailErr.message);
        // Don't fail the request — token is still valid, link is logged
      }
    }

    res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent.',
      // Return link in non-production so dev can test the flow
      ...(process.env.NODE_ENV !== 'production' && { reset_url: resetUrl })
    });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

router.post('/reset-password', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, name FROM users
       WHERE reset_token = $1 AND reset_token_expires > NOW()`,
      [token]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Reset link is invalid or has expired. Please request a new one.'
      });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await pool.query(
      `UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2`,
      [password_hash, user.id]
    );

    const authToken = signToken(user);
    res.json({
      success: true,
      message: 'Password reset successfully.',
      token: authToken,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('[Auth] Reset password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// ─── Email helper ─────────────────────────────────────────────────────────────

async function sendResetEmail({ to, name, resetUrl, apiKey }) {
  // Uses Polsia email proxy to send from factoryos@polsia.app
  const response = await fetch('https://polsia.com/api/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      to,
      from: 'factoryos@polsia.app',
      subject: 'Reset your FactoryOS password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="color: #00AE68;">Reset your password</h2>
          <p>Hi ${name || 'there'},</p>
          <p>We received a request to reset your FactoryOS password. Click the button below to choose a new one:</p>
          <a href="${resetUrl}" style="display:inline-block;background:#00AE68;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Reset Password</a>
          <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't request a reset, you can ignore this email.</p>
          <p style="color:#999;font-size:12px;">${resetUrl}</p>
        </div>
      `
    })
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Email proxy returned ${response.status}: ${text}`);
  }
}

// ─── PUT /api/auth/profile ────────────────────────────────────────────────────

router.put('/profile', authenticateToken, async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, email, currentPassword, newPassword } = req.body;

  try {
    // Fetch current user
    const userRes = await pool.query('SELECT id, email, name, password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!userRes.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = userRes.rows[0];

    const updates = [];
    const params  = [];

    // Update name
    if (name !== undefined && name.trim() !== user.name) {
      const trimmed = name.trim();
      if (!trimmed) return res.status(400).json({ success: false, message: 'Name cannot be empty' });
      updates.push(`name = $${params.length + 1}`);
      params.push(trimmed);
    }

    // Update email
    if (email !== undefined && email.toLowerCase().trim() !== user.email) {
      const emailLower = email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        return res.status(400).json({ success: false, message: 'Invalid email address' });
      }
      const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2', [emailLower, req.user.id]);
      if (existing.rows.length) {
        return res.status(409).json({ success: false, message: 'That email is already in use' });
      }
      updates.push(`email = $${params.length + 1}`);
      params.push(emailLower);
    }

    // Update password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
      }
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
      }
      const newHash = await bcrypt.hash(newPassword, 12);
      updates.push(`password_hash = $${params.length + 1}`);
      params.push(newHash);
    }

    if (!updates.length) {
      return res.json({ success: true, message: 'No changes to save', user: { id: user.id, email: user.email, name: user.name } });
    }

    params.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING id, email, name`,
      params
    );

    res.json({ success: true, message: 'Profile updated', user: result.rows[0] });
  } catch (err) {
    console.error('[Auth] Update profile error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

module.exports = router;
