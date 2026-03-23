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
  const r = await pool.query(`
    SELECT 1 FROM teams t
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $2
    WHERE t.id = $1 AND (t.is_demo = TRUE OR tm.user_id = $2)
  `, [teamId, userId]);
  return r.rows.length > 0;
}

// ── GET /api/projects ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const pool   = req.app.locals.pool;
  const userId = req.user?.id || null;

  const result = await pool.query(`
    SELECT
      p.*,
      t.name AS team_name,
      t.slug AS team_slug,
      t.logo_url AS team_logo_url,
      COUNT(DISTINCT n.id)::int AS node_count,
      COALESCE(pm.role, CASE WHEN t.is_demo THEN 'viewer' ELSE NULL END) AS user_role
    FROM projects p
    LEFT JOIN teams t ON t.id = p.team_id
    LEFT JOIN nodes n ON n.project_id = p.id
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $1
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
    WHERE t.is_demo = TRUE
       OR tm.user_id = $1
       OR pm.user_id = $1
    GROUP BY p.id, t.id, pm.role
    ORDER BY p.is_demo ASC, p.created_at ASC
  `, [userId]);
  res.json({ success: true, projects: result.rows });
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO projects (name, description, slug, team_id, status, project_mode)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description || null, slug || null, team_id || null, status || 'active', resolvedMode]
    );
    const project = result.rows[0];

    // Auto-add creator as admin in project_members
    if (userId) {
      await client.query(`
        INSERT INTO project_members (project_id, user_id, role, invited_by)
        VALUES ($1, $2, 'admin', $2)
        ON CONFLICT (project_id, user_id) DO NOTHING
      `, [project.id, userId]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, project: { ...project, user_role: 'admin' } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Slug already exists' });
    throw err;
  } finally {
    client.release();
  }
});

// ── GET /api/projects/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const pool   = req.app.locals.pool;
  const userId = req.user?.id || null;

  const result = await pool.query(`
    SELECT
      p.*,
      t.name AS team_name,
      t.slug AS team_slug,
      t.logo_url AS team_logo_url,
      COALESCE(pm.role, CASE WHEN t.is_demo THEN 'viewer' ELSE NULL END) AS user_role
    FROM projects p
    LEFT JOIN teams t ON t.id = p.team_id
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $2
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
    WHERE p.id = $1
      AND (t.is_demo = TRUE OR tm.user_id = $2 OR pm.user_id = $2)
  `, [req.params.id, userId]);

  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Project not found' });
  res.json({ success: true, project: result.rows[0] });
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
  let idx = 1;

  if (is_public !== undefined) {
    updates.push(`is_public = $${idx++}`);
    values.push(Boolean(is_public));
  }
  if (reset_token) {
    updates.push(`share_token = gen_random_uuid()`);
  }

  values.push(projectId);

  const result = await pool.query(
    `UPDATE projects SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, name, is_public, share_token`,
    values
  );

  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Project not found' });

  const project = result.rows[0];
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

  const result = await pool.query(
    'SELECT id, name, is_public, share_token FROM projects WHERE id = $1',
    [projectId]
  );
  if (!result.rows.length) return res.status(404).json({ success: false, message: 'Project not found' });

  const project = result.rows[0];
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
  const access = await pool.query(`
    SELECT p.id FROM projects p
    LEFT JOIN teams t ON t.id = p.team_id
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $2
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
    WHERE p.id = $1
      AND (t.is_demo = TRUE OR tm.user_id = $2 OR pm.user_id = $2)
  `, [projectId, userId]);
  if (!access.rows.length) return res.status(403).json({ success: false, message: 'Access denied' });

  const result = await pool.query(
    'SELECT * FROM nodes WHERE project_id = $1 ORDER BY part_number ASC',
    [projectId]
  );

  // Build tree
  const map   = {};
  const roots = [];
  result.rows.forEach(r => { map[r.id] = { ...r, children: [] }; });
  result.rows.forEach(r => {
    if (r.parent_id && map[r.parent_id]) map[r.parent_id].children.push(map[r.id]);
    else roots.push(map[r.id]);
  });

  res.json({ success: true, nodes: roots, count: result.rows.length });
});

module.exports = router;
