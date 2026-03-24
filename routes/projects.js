/**
 * Projects API
 *
 * GET  /api/projects           — list projects for this user (+ demo)
 * POST /api/projects           — create project (must be team member); auto-adds creator as admin
 * GET  /api/projects/:id       — get project (if accessible)
 * GET  /api/projects/:id/nodes — get nodes for project (tree)
 *
 * RBAC roles (project_members table):
 *   admin  — full access
 *   editor — create/edit nodes, requirements, phases, DOE, 8D
 *   viewer — read-only
 *
 * Access: demo team/project = viewer for all; private = must be in project_members
 * (team members who are not yet in project_members get viewer by default)
 */

const express = require('express');
const router = express.Router();
const { getProjectRole } = require('../middleware/rbac');

// ── Helper: check if user can access a team (member or demo) ─────────────────
async function canAccessTeam(pool, teamId, userId) {
  const [rows] = await pool.query(`
    SELECT 1 FROM teams t
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ?
    WHERE t.id = ? AND (t.is_demo = TRUE OR tm.user_id = ?)
  `, [userId, teamId, userId]);
  return rows.length > 0;
}

// ── GET /api/projects ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const pool   = req.app.locals.pool;
  const userId = req.user?.id || null;

  try {
    const [rows] = await pool.query(`
      SELECT
        p.*,
        t.name AS team_name,
        t.slug AS team_slug,
        t.logo_url AS team_logo_url,
        COUNT(DISTINCT n.id) AS node_count,
        COALESCE(pm.role, CASE WHEN t.is_demo THEN 'viewer' ELSE NULL END) AS user_role
      FROM projects p
      LEFT JOIN teams t ON t.id = p.team_id
      LEFT JOIN nodes n ON n.project_id = p.id
      LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ?
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
      WHERE t.is_demo = TRUE
         OR tm.user_id = ?
         OR pm.user_id = ?
      GROUP BY p.id, t.id, pm.role
      ORDER BY p.is_demo ASC, p.created_at ASC
    `, [userId, userId, userId, userId]);
    res.json({ success: true, projects: rows });
  } catch (err) {
    console.error('[GET /api/projects] DB error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load projects' });
  }
});

// ── POST /api/projects ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const pool   = req.app.locals.pool;
  const userId = req.user?.id || null;
  const { name, description, slug, team_id, status, project_mode } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name required' });

  const resolvedMode = ['top_down', 'bottom_up'].includes(project_mode) ? project_mode : 'top_down';

  // Check team access
  if (team_id) {
    const access = await canAccessTeam(pool, team_id, userId);
    if (!access) return res.status(403).json({ success: false, message: 'You do not have access to this team' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO projects (name, description, slug, team_id, status, project_mode)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description || null, slug || null, team_id || null, status || 'active', resolvedMode]
    );
    const [projectRows] = await conn.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    const project = projectRows[0];

    // Auto-add creator as admin in project_members
    if (userId) {
      await conn.query(`
        INSERT IGNORE INTO project_members (project_id, user_id, role, invited_by)
        VALUES (?, ?, 'admin', ?)
      `, [project.id, userId, userId]);
    }

    await conn.commit();
    res.status(201).json({ success: true, project: { ...project, user_role: 'admin' } });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Slug already exists' });
    throw err;
  } finally {
    conn.release();
  }
});

// ── GET /api/projects/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const pool   = req.app.locals.pool;
  const userId = req.user?.id || null;

  const [rows] = await pool.query(`
    SELECT
      p.*,
      t.name AS team_name,
      t.slug AS team_slug,
      t.logo_url AS team_logo_url,
      COALESCE(pm.role, CASE WHEN t.is_demo THEN 'viewer' ELSE NULL END) AS user_role
    FROM projects p
    LEFT JOIN teams t ON t.id = p.team_id
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ?
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    WHERE p.id = ?
      AND (t.is_demo = TRUE OR tm.user_id = ? OR pm.user_id = ?)
  `, [userId, userId, req.params.id, userId, userId]);

  if (!rows.length) return res.status(404).json({ success: false, message: 'Project not found' });
  res.json({ success: true, project: rows[0] });
});

// ── PUT /api/projects/:id/share ───────────────────────────────────────────────
// Toggle public sharing (admin only).
// Body: { is_public: bool, reset_token?: bool }
router.put('/:id/share', async (req, res) => {
  const pool   = req.app.locals.pool;
  const userId = req.user?.id || null;
  const projectId = parseInt(req.params.id);

  if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });
  if (!projectId) return res.status(400).json({ success: false, message: 'Invalid project id' });

  // Must be admin on this project
  const role = await getProjectRole(pool, projectId, userId);
  if (!role || role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin role required to manage sharing' });
  }

  const { is_public, reset_token } = req.body;

  // Build update
  const updates = ['updated_at = NOW()'];
  const values  = [];

  if (is_public !== undefined) {
    updates.push(`is_public = ?`);
    values.push(Boolean(is_public));
  }
  if (reset_token) {
    updates.push(`share_token = UUID()`);
  }

  values.push(projectId);

  await pool.query(
    `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const [rows] = await pool.query(
    'SELECT id, name, is_public, share_token FROM projects WHERE id = ?',
    [projectId]
  );

  if (!rows.length) return res.status(404).json({ success: false, message: 'Project not found' });

  const project = rows[0];
  const appBase = process.env.APP_BASE_URL || '';
  const share_url = `${appBase}/share/${project.share_token}`;

  res.json({ success: true, project, share_url });
});

// ── GET /api/projects/:id/share ────────────────────────────────────────────────
// Get current share state (admin only).
router.get('/:id/share', async (req, res) => {
  const pool   = req.app.locals.pool;
  const userId = req.user?.id || null;
  const projectId = parseInt(req.params.id);

  if (!userId) return res.status(401).json({ success: false, message: 'Authentication required' });

  const role = await getProjectRole(pool, projectId, userId);
  if (!role || role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin role required' });
  }

  const [rows] = await pool.query(
    'SELECT id, name, is_public, share_token FROM projects WHERE id = ?',
    [projectId]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Project not found' });

  const project = rows[0];
  const appBase = process.env.APP_BASE_URL || '';
  const share_url = `${appBase}/share/${project.share_token}`;

  res.json({ success: true, project, share_url });
});

// ── GET /api/projects/:id/nodes ───────────────────────────────────────────────
router.get('/:id/nodes', async (req, res) => {
  const pool      = req.app.locals.pool;
  const userId    = req.user?.id || null;
  const projectId = parseInt(req.params.id);
  if (!projectId) return res.status(400).json({ success: false, message: 'Invalid project id' });

  // Check project access (demo, team member, or project member)
  const [accessRows] = await pool.query(`
    SELECT p.id FROM projects p
    LEFT JOIN teams t ON t.id = p.team_id
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ?
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
    WHERE p.id = ?
      AND (t.is_demo = TRUE OR tm.user_id = ? OR pm.user_id = ?)
  `, [userId, userId, projectId, userId, userId]);
  if (!accessRows.length) return res.status(403).json({ success: false, message: 'Access denied' });

  const [rows] = await pool.query(
    'SELECT * FROM nodes WHERE project_id = ? ORDER BY part_number ASC',
    [projectId]
  );

  // Build tree
  const map   = {};
  const roots = [];
  rows.forEach(r => { map[r.id] = { ...r, children: [] }; });
  rows.forEach(r => {
    if (r.parent_id && map[r.parent_id]) map[r.parent_id].children.push(map[r.id]);
    else roots.push(map[r.id]);
  });

  res.json({ success: true, nodes: roots, count: rows.length });
});

module.exports = router;
