/**
 * Project Members API — RBAC management
 *
 * GET    /api/projects/:id/members          — list members + pending invites
 * POST   /api/projects/:id/members          — invite by email (admin only)
 * PUT    /api/projects/:id/members/:userId  — change role (admin only)
 * DELETE /api/projects/:id/members/:userId  — remove member (admin only)
 * GET    /api/projects/:id/my-role          — get caller's role on this project
 * GET    /api/invites/:token                — get invite info (public)
 * POST   /api/invites/:token/accept         — accept invite (auth required)
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const crypto = require('crypto');
const { getProjectRole, ROLE_RANK } = require('../middleware/rbac');

// ── Helper: require admin on the project in :id param ────────────────────────
async function requireAdmin(req, res, pool) {
  const projectId = Number(req.params.id);
  const userId    = req.user?.id;
  if (!userId) { res.status(401).json({ success: false, message: 'Authentication required' }); return false; }

  // Demo projects have no members management
  const [projRows] = await pool.query('SELECT is_demo FROM projects WHERE id = ?', [projectId]);
  if (!projRows[0]) { res.status(404).json({ success: false, message: 'Project not found' }); return false; }
  if (projRows[0].is_demo) { res.status(403).json({ success: false, message: 'Demo projects cannot have members' }); return false; }

  const role = await getProjectRole(pool, projectId, userId);
  if (!role) { res.status(403).json({ success: false, message: 'You do not have access to this project' }); return false; }
  if (role !== 'admin') { res.status(403).json({ success: false, message: 'Admin role required' }); return false; }
  return true;
}

// ── GET /api/projects/:id/my-role ────────────────────────────────────────────
router.get('/my-role', async (req, res) => {
  const pool      = req.app.locals.pool;
  const projectId = Number(req.params.id);
  const userId    = req.user?.id ?? null;

  // Check demo
  const [projRows] = await pool.query('SELECT is_demo FROM projects WHERE id = ?', [projectId]);
  if (!projRows[0]) return res.status(404).json({ success: false, message: 'Project not found' });

  if (projRows[0].is_demo) {
    return res.json({ success: true, role: 'viewer', is_demo: true });
  }

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const role = await getProjectRole(pool, projectId, userId);
  if (!role) return res.status(403).json({ success: false, message: 'No access' });

  res.json({ success: true, role, is_demo: false });
});

// ── GET /api/projects/:id/members ────────────────────────────────────────────
router.get('/members', async (req, res) => {
  const pool      = req.app.locals.pool;
  const projectId = Number(req.params.id);
  const userId    = req.user?.id ?? null;

  // Must be a member to see the member list
  const role = await getProjectRole(pool, projectId, userId);
  if (!role) return res.status(403).json({ success: false, message: 'Access denied' });

  const [memberRows] = await pool.query(`
    SELECT
      pm.id,
      pm.user_id,
      pm.role,
      pm.created_at,
      u.name,
      u.email,
      ib.name AS invited_by_name
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    LEFT JOIN users ib ON ib.id = pm.invited_by
    WHERE pm.project_id = ?
    ORDER BY
      CASE pm.role WHEN 'admin' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END,
      pm.created_at ASC
  `, [projectId]);

  // Pending invites (admin only)
  let invites = [];
  if (role === 'admin') {
    const [invRows] = await pool.query(`
      SELECT pi.id, pi.email, pi.role, pi.expires_at, pi.created_at,
             ib.name AS invited_by_name
      FROM project_invites pi
      LEFT JOIN users ib ON ib.id = pi.invited_by
      WHERE pi.project_id = ? AND pi.accepted_at IS NULL AND pi.expires_at > NOW()
      ORDER BY pi.created_at DESC
    `, [projectId]);
    invites = invRows;
  }

  res.json({ success: true, members: memberRows, pending_invites: invites, caller_role: role });
});

// ── POST /api/projects/:id/members — invite by email ─────────────────────────
router.post('/members', async (req, res) => {
  const pool      = req.app.locals.pool;
  const projectId = Number(req.params.id);

  if (!await requireAdmin(req, res, pool)) return;

  const { email, role } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'email required' });
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ success: false, message: 'role must be admin, editor, or viewer' });
  }

  // Check if user already exists
  const [existingRows] = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]
  );

  if (existingRows.length) {
    const inviteeId = existingRows[0].id;

    // Already a member?
    const [alreadyMemberRows] = await pool.query(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, inviteeId]
    );

    if (alreadyMemberRows.length) {
      return res.status(409).json({ success: false, message: 'User is already a member of this project' });
    }

    // Add directly
    const [insertResult] = await pool.query(`
      INSERT INTO project_members (project_id, user_id, role, invited_by)
      VALUES (?, ?, ?, ?)
    `, [projectId, inviteeId, role, req.user.id]);

    const [memberRows] = await pool.query('SELECT * FROM project_members WHERE id = ?', [insertResult.insertId]);

    return res.status(201).json({ success: true, member: memberRows[0], type: 'added' });
  }

  // User doesn't exist yet — create invite token
  const token = crypto.randomBytes(32).toString('hex');
  try {
    const [invResult] = await pool.query(`
      INSERT INTO project_invites (project_id, email, role, token, invited_by)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        role = VALUES(role),
        token = VALUES(token),
        invited_by = VALUES(invited_by),
        expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY),
        accepted_at = NULL
    `, [projectId, email.toLowerCase(), role, token, req.user.id]);

    const [invRows] = await pool.query(
      'SELECT * FROM project_invites WHERE project_id = ? AND email = ?',
      [projectId, email.toLowerCase()]
    );

    // Get project name for the response
    const [projRows] = await pool.query('SELECT name FROM projects WHERE id = ?', [projectId]);

    res.status(201).json({
      success: true,
      type: 'invited',
      invite: invRows[0],
      project_name: projRows[0]?.name,
      // In production you'd email this token; for now return it
      invite_url: `/accept-invite?token=${token}`
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Invite already sent' });
    throw err;
  }
});

// ── PUT /api/projects/:id/members/:userId — change role ──────────────────────
router.put('/members/:userId', async (req, res) => {
  const pool       = req.app.locals.pool;
  const projectId  = Number(req.params.id);
  const targetId   = Number(req.params.userId);

  if (!await requireAdmin(req, res, pool)) return;

  const { role } = req.body;
  if (!['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ success: false, message: 'role must be admin, editor, or viewer' });
  }

  // Can't demote the last admin
  if (role !== 'admin') {
    const [adminCountRows] = await pool.query(
      `SELECT COUNT(*) AS count FROM project_members WHERE project_id = ? AND role = 'admin'`,
      [projectId]
    );
    const [isCurrentAdminRows] = await pool.query(
      `SELECT role FROM project_members WHERE project_id = ? AND user_id = ?`,
      [projectId, targetId]
    );
    if (isCurrentAdminRows[0]?.role === 'admin' && adminCountRows[0].count <= 1) {
      return res.status(409).json({
        success: false,
        message: 'Cannot demote the last admin. Promote another member first.'
      });
    }
  }

  await pool.query(`
    UPDATE project_members
    SET role = ?, updated_at = NOW()
    WHERE project_id = ? AND user_id = ?
  `, [role, projectId, targetId]);

  const [rows] = await pool.query(
    'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, targetId]
  );

  if (!rows.length) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  res.json({ success: true, member: rows[0] });
});

// ── DELETE /api/projects/:id/members/:userId — remove member ─────────────────
router.delete('/members/:userId', async (req, res) => {
  const pool      = req.app.locals.pool;
  const projectId = Number(req.params.id);
  const targetId  = Number(req.params.userId);
  const callerId  = req.user?.id;

  // Allow self-removal OR admin removal
  const callerRole = await getProjectRole(pool, projectId, callerId);
  if (!callerRole) return res.status(403).json({ success: false, message: 'Access denied' });

  const isSelf  = callerId === targetId;
  const isAdmin = callerRole === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Admin role required to remove other members' });
  }

  // Check last admin guard
  const [targetMemberRows] = await pool.query(
    'SELECT role FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, targetId]
  );
  if (!targetMemberRows.length) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  if (targetMemberRows[0].role === 'admin') {
    const [adminCountRows] = await pool.query(
      `SELECT COUNT(*) AS count FROM project_members WHERE project_id = ? AND role = 'admin'`,
      [projectId]
    );
    if (adminCountRows[0].count <= 1) {
      return res.status(409).json({
        success: false,
        message: 'Cannot remove the last admin. Transfer ownership first.'
      });
    }
  }

  await pool.query(
    'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, targetId]
  );

  res.json({ success: true, message: 'Member removed' });
});

// ── DELETE /api/projects/:id/invites/:inviteId — cancel invite ───────────────
router.delete('/invites/:inviteId', async (req, res) => {
  const pool      = req.app.locals.pool;
  const projectId = Number(req.params.id);

  if (!await requireAdmin(req, res, pool)) return;

  await pool.query(
    'DELETE FROM project_invites WHERE id = ? AND project_id = ?',
    [req.params.inviteId, projectId]
  );
  res.json({ success: true, message: 'Invite cancelled' });
});

module.exports = router;
