const express = require('express');
const crypto = require('crypto');
const router = express.Router();

function generateShareToken() {
  return crypto.randomBytes(32).toString('hex');
}

// GET /shared-with-me?email=...
router.get('/shared-with-me', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const [shares] = await pool.query(
      `SELECT es.*, e.name AS experiment_name, e.description AS experiment_description,
              e.design_type, e.status AS experiment_status, e.total_runs, e.completed_runs,
              e.created_at AS experiment_created_at,
              u.name AS owner_name, u.email AS owner_email
       FROM experiment_shares es
       JOIN doe_experiments e ON es.experiment_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE es.invited_email = ? AND es.status IN ('pending', 'accepted')
       ORDER BY es.created_at DESC`,
      [email.toLowerCase()]
    );

    res.json({ success: true, data: shares });
  } catch (err) {
    console.error('[Shares] shared-with-me error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /token/:token
router.get('/token/:token', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { token } = req.params;

    const [shares] = await pool.query(
      `SELECT es.*, e.name AS experiment_name, e.description AS experiment_description,
              e.design_type, e.status AS experiment_status, e.total_runs, e.completed_runs,
              u.name AS owner_name, u.email AS owner_email
       FROM experiment_shares es
       JOIN doe_experiments e ON es.experiment_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE es.share_token = ?`,
      [token]
    );

    if (shares.length === 0) {
      return res.status(404).json({ success: false, error: 'Share not found or invalid token' });
    }

    const share = shares[0];
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return res.status(410).json({ success: false, error: 'This share link has expired' });
    }
    if (share.status === 'revoked') {
      return res.status(410).json({ success: false, error: 'This share has been revoked' });
    }

    res.json({ success: true, data: share });
  } catch (err) {
    console.error('[Shares] get-by-token error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /token/:token/accept
router.post('/token/:token/accept', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { token } = req.params;
    const { guestEmail, guestName } = req.body;

    const [shares] = await pool.query(
      'SELECT * FROM experiment_shares WHERE share_token = ?',
      [token]
    );
    if (shares.length === 0) {
      return res.status(404).json({ success: false, error: 'Share not found' });
    }

    const share = shares[0];
    if (share.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: share.status === 'accepted' ? 'Share already accepted' : 'Share is no longer valid'
      });
    }
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      await pool.query("UPDATE experiment_shares SET status = 'expired' WHERE id = ?", [share.id]);
      return res.status(410).json({ success: false, error: 'This share link has expired' });
    }

    await pool.query(
      "UPDATE experiment_shares SET status = 'accepted', accepted_at = NOW() WHERE id = ?",
      [share.id]
    );

    await pool.query(
      `INSERT INTO experiment_share_activity (share_id, activity_type, activity_details, actor_email, actor_name)
       VALUES (?, 'share_accepted', ?, ?, ?)`,
      [share.id, JSON.stringify({ acceptedAt: new Date().toISOString() }),
       guestEmail || share.invited_email, guestName || share.invited_name || 'Guest']
    );

    res.json({
      success: true,
      data: { experimentId: share.experiment_id, accessLevel: share.access_level, message: 'Share accepted successfully' }
    });
  } catch (err) {
    console.error('[Shares] accept error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /access/:experimentId
router.get('/access/:experimentId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { experimentId } = req.params;
    const { userId, email } = req.query;

    const [experiments] = await pool.query(
      'SELECT user_id FROM doe_experiments WHERE id = ?',
      [experimentId]
    );
    if (experiments.length === 0) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }

    if (userId && experiments[0].user_id === parseInt(userId)) {
      return res.json({ success: true, data: { hasAccess: true, accessType: 'owner', accessLevel: 'full' } });
    }

    if (email) {
      const [shares] = await pool.query(
        `SELECT access_level FROM experiment_shares
         WHERE experiment_id = ? AND invited_email = ? AND status = 'accepted'
         AND (expires_at IS NULL OR expires_at > NOW())`,
        [experimentId, email.toLowerCase()]
      );
      if (shares.length > 0) {
        return res.json({ success: true, data: { hasAccess: true, accessType: 'shared', accessLevel: shares[0].access_level } });
      }
    }

    res.json({ success: true, data: { hasAccess: false, accessType: null, accessLevel: null } });
  } catch (err) {
    console.error('[Shares] check-access error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /experiment/:experimentId
router.get('/experiment/:experimentId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { experimentId } = req.params;
    const userId = req.query.userId || 1;

    const [experiments] = await pool.query(
      'SELECT user_id FROM doe_experiments WHERE id = ?',
      [experimentId]
    );
    if (experiments.length === 0) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }

    const [shares] = await pool.query(
      `SELECT es.*, u.name AS creator_name, u.email AS creator_email
       FROM experiment_shares es
       LEFT JOIN users u ON es.created_by = u.id
       WHERE es.experiment_id = ?
       ORDER BY es.created_at DESC`,
      [experimentId]
    );

    res.json({ success: true, data: shares });
  } catch (err) {
    console.error('[Shares] list error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /experiment/:experimentId
router.post('/experiment/:experimentId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { experimentId } = req.params;
    const { invitedEmail, invitedName, accessLevel = 'view', inviteMessage, expiresInDays } = req.body;
    const createdBy = req.body.userId || 1;

    const [experiments] = await pool.query(
      'SELECT * FROM doe_experiments WHERE id = ?',
      [experimentId]
    );
    if (experiments.length === 0) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }

    const [existing] = await pool.query(
      `SELECT * FROM experiment_shares
       WHERE experiment_id = ? AND invited_email = ? AND status IN ('pending', 'accepted')`,
      [experimentId, invitedEmail]
    );
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'This email already has an active share' });
    }

    const shareToken = generateShareToken();
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const [result] = await pool.query(
      `INSERT INTO experiment_shares
       (experiment_id, invited_email, invited_name, access_level, share_token, created_by, expires_at, invite_message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [experimentId, invitedEmail, invitedName, accessLevel, shareToken, createdBy, expiresAt, inviteMessage]
    );

    const shareId = result.insertId;

    await pool.query(
      `INSERT INTO experiment_share_activity (share_id, activity_type, activity_details, actor_email, actor_name)
       VALUES (?, 'share_created', ?, 'owner', 'Experiment Owner')`,
      [shareId, JSON.stringify({ accessLevel, expiresAt, inviteMessage })]
    );

    res.status(201).json({
      success: true,
      data: { id: shareId, shareToken, shareLink: `/share/experiment/${shareToken}`, invitedEmail, accessLevel, expiresAt }
    });
  } catch (err) {
    console.error('[Shares] create error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /:shareId
router.delete('/:shareId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { shareId } = req.params;

    await pool.query("UPDATE experiment_shares SET status = 'revoked' WHERE id = ?", [shareId]);

    await pool.query(
      `INSERT INTO experiment_share_activity (share_id, activity_type, activity_details, actor_email, actor_name)
       VALUES (?, 'share_revoked', ?, 'owner', 'Experiment Owner')`,
      [shareId, JSON.stringify({ revokedAt: new Date().toISOString() })]
    );

    res.json({ success: true, message: 'Share revoked successfully' });
  } catch (err) {
    console.error('[Shares] revoke error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /:shareId/access
router.patch('/:shareId/access', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { shareId } = req.params;
    const { accessLevel } = req.body;

    if (!['view', 'contribute', 'execute'].includes(accessLevel)) {
      return res.status(400).json({ success: false, error: 'Invalid access level' });
    }

    await pool.query('UPDATE experiment_shares SET access_level = ? WHERE id = ?', [accessLevel, shareId]);
    res.json({ success: true, message: 'Access level updated successfully' });
  } catch (err) {
    console.error('[Shares] update-access error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /:shareId/activity
router.post('/:shareId/activity', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { shareId } = req.params;
    const { activityType, activityDetails, actorEmail, actorName } = req.body;

    const validTypes = ['experiment_viewed', 'measurement_added', 'analysis_run', 'note_added'];
    if (!validTypes.includes(activityType)) {
      return res.status(400).json({ success: false, error: 'Invalid activity type' });
    }

    await pool.query(
      `INSERT INTO experiment_share_activity (share_id, activity_type, activity_details, actor_email, actor_name)
       VALUES (?, ?, ?, ?, ?)`,
      [shareId, activityType, JSON.stringify(activityDetails || {}), actorEmail, actorName]
    );

    res.json({ success: true, message: 'Activity logged successfully' });
  } catch (err) {
    console.error('[Shares] log-activity error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /:shareId/activity
router.get('/:shareId/activity', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { shareId } = req.params;

    const [activities] = await pool.query(
      `SELECT * FROM experiment_share_activity WHERE share_id = ? ORDER BY created_at DESC LIMIT 100`,
      [shareId]
    );

    const parsed = activities.map(a => ({
      ...a,
      activity_details: typeof a.activity_details === 'string' ? JSON.parse(a.activity_details) : a.activity_details
    }));

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('[Shares] get-activity error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
