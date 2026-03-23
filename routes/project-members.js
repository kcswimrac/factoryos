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
  const proj = await pool.query('SELECT is_demo FROM projects WHERE id = $1', [projectId]);
  if (!proj.rows[0]) { res.status(404).json({ success: false, message: 'Project not found' }); return false; }
  if (proj.rows[0].is_demo) { res.status(403).json({ success: false, message: 'Demo projects cannot have members' }); return false; }

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
  const proj = await pool.query('SELECT is_demo FROM projects WHERE id = $1', [projectId]);
  if (!proj.rows[0]) return res.status(404).json({ success: false, message: 'Project not found' });

  if (proj.rows[0].is_demo) {
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

  const members = await pool.query(`
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
    WHERE pm.project_id = $1
    ORDER BY
      CASE pm.role WHEN 'admin' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END,
      pm.created_at ASC
  `, [projectId]);

  // Pending invites (admin only)
  let invites = [];
  if (role === 'admin') {
    const inv = await pool.query(`
      SELECT pi.id, pi.email, pi.role, pi.expires_at, pi.created_at,
             ib.name AS invited_by_name
      FROM project_invites pi
      LEFT JOIN users ib ON ib.id = pi.invited_by
      WHERE pi.project_id = $1 AND pi.accepted_at IS NULL AND pi.expires_at > NOW()
      ORDER BY pi.created_at DESC
    `, [projectId]);
    invites = inv.rows;
  }

  res.json({ success: true, members: members.rows, pending_invites: invites, caller_role: role });
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
  const existing = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]
  );

  if (existing.rows.length) {
    const inviteeId = existing.rows[0].id;

    // Already a member?
    const alreadyMember = await pool.query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, inviteeId]
    );

    if (alreadyMember.rows.length) {
      return res.status(409).json({ success: false, message: 'User is already a member of this project' });
    }

    // Add directly
    const result = await pool.query(`
      INSERT INTO project_members (project_id, user_id, role, invited_by)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [projectId, inviteeId, role, req.user.id]);

    return res.status(201).json({ success: true, member: result.rows[0], type: 'added' });
  }

  // User doesn't exist yet — create invite token
  const token = crypto.randomBytes(32).toString('hex');
  try {
    const inv = await pool.query(`
      INSERT INTO project_invites (project_id, email, role, token, invited_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (project_id, email) DO UPDATE
        SET role = EXCLUDED.role,
            token = EXCLUDED.token,
            invited_by = EXCLUDED.invited_by,
            expires_at = NOW() + INTERVAL '7 days',
            accepted_at = NULL
      RETURNING *
    `, [projectId, email.toLowerCase(), role, token, req.user.id]);

    // Get project name for the response
    const proj = await pool.query('SELECT name FROM projects WHERE id = $1', [projectId]);

    res.status(201).json({
      success: true,
      type: 'invited',
      invite: inv.rows[0],
      project_name: proj.rows[0]?.name,
      // In production you'd email this token; for now return it
      invite_url: `/accept-invite?token=${token}`
    });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Invite already sent' });
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
    const adminCount = await pool.query(
      `SELECT COUNT(*)::int AS count FROM project_members WHERE project_id = $1 AND role = 'admin'`,
      [projectId]
    );
    const isCurrentAdmin = await pool.query(
      `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, targetId]
    );
    if (isCurrentAdmin.rows[0]?.role === 'admin' && adminCount.rows[0].count <= 1) {
      return res.status(409).json({
        success: false,
        message: 'Cannot demote the last admin. Promote another member first.'
      });
    }
  }

  const result = await pool.query(`
    UPDATE project_members
    SET role = $1, updated_at = NOW()
    WHERE project_id = $2 AND user_id = $3
    RETURNING *
  `, [role, projectId, targetId]);

  if (!result.rows.length) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  res.json({ success: true, member: result.rows[0] });
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
  const targetMember = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, targetId]
  );
  if (!targetMember.rows.length) {
    return res.status(404).json({ success: false, message: 'Member not found' });
  }

  if (targetMember.rows[0].role === 'admin') {
    const adminCount = await pool.query(
      `SELECT COUNT(*)::int AS count FROM project_members WHERE project_id = $1 AND role = 'admin'`,
      [projectId]
    );
    if (adminCount.rows[0].count <= 1) {
      return res.status(409).json({
        success: false,
        message: 'Cannot remove the last admin. Transfer ownership first.'
      });
    }
  }

  await pool.query(
    'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
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
    'DELETE FROM project_invites WHERE id = $1 AND project_id = $2',
    [req.params.inviteId, projectId]
  );
  res.json({ success: true, message: 'Invite cancelled' });
});

module.exports = router;
