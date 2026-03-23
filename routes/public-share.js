/**
 * Public Share API
 *
 * Unauthenticated read-only access to a project via its share token.
 *
 * GET  /api/public/project/:token              — project meta + full node tree
 * GET  /api/public/project/:token/nodes/:nid/phases       — phases for a node
 * GET  /api/public/project/:token/nodes/:nid/requirements — requirements
 * GET  /api/public/project/:token/nodes/:nid/renders      — CAD renders
 *
 * Share management (authenticated):
 * PUT  /api/projects/:id/share                 — toggle is_public / reset token
 *   body: { is_public: bool, reset_token?: bool }
 *   returns: { project: { id, is_public, share_token } }
 */

const express = require('express');
const router = express.Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

async function resolvePublicProject(pool, token) {
  const [rows] = await pool.query(`
    SELECT p.*, t.name AS team_name, t.slug AS team_slug, t.logo_url AS team_logo_url
    FROM projects p
    LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.share_token = ? AND p.is_public = TRUE
  `, [token]);
  return rows[0] || null;
}

// ─── GET /api/public/project/:token ─────────────────────────────────────────

router.get('/project/:token', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token } = req.params;

  const project = await resolvePublicProject(pool, token);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found or not publicly shared' });
  }

  // Full node tree
  const [nodesRows] = await pool.query(
    'SELECT * FROM nodes WHERE project_id = ? ORDER BY part_number ASC',
    [project.id]
  );

  // Phase summary per node (batch query)
  let phaseSummaries = {};
  if (nodesRows.length > 0) {
    const nodeIds = nodesRows.map(n => n.id);
    const [phaseRows] = await pool.query(`
      SELECT node_id,
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END)    AS complete,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
        COUNT(*)                                                  AS total
      FROM node_phases
      WHERE node_id IN (?)
      GROUP BY node_id
    `, [nodeIds]);
    phaseRows.forEach(r => {
      phaseSummaries[r.node_id] = {
        complete: parseInt(r.complete),
        in_progress: parseInt(r.in_progress),
        total: parseInt(r.total),
        progress_pct: parseInt(r.total) > 0 ? Math.round((parseInt(r.complete) / 7) * 100) : 0
      };
    });
  }

  // Build tree
  const map = {};
  const roots = [];
  nodesRows.forEach(r => {
    map[r.id] = { ...r, phase_summary: phaseSummaries[r.id] || null, children: [] };
  });
  nodesRows.forEach(r => {
    if (r.parent_id && map[r.parent_id]) map[r.parent_id].children.push(map[r.id]);
    else roots.push(map[r.id]);
  });

  // Strip internal fields before returning
  const { share_token, ...safeProject } = project;

  res.json({
    success: true,
    project: safeProject,
    nodes: roots,
    node_count: nodesRows.length
  });
});

// ─── GET /api/public/project/:token/nodes/:nid/phases ────────────────────────

router.get('/project/:token/nodes/:nid/phases', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token, nid } = req.params;

  const project = await resolvePublicProject(pool, token);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or not publicly shared' });

  const [nodeRows] = await pool.query(
    'SELECT id, phase_mode FROM nodes WHERE id = ? AND project_id = ?',
    [nid, project.id]
  );
  if (!nodeRows.length) return res.status(404).json({ success: false, message: 'Node not found in this project' });

  const [phases] = await pool.query(
    'SELECT * FROM node_phases WHERE node_id = ? ORDER BY phase_order ASC',
    [nid]
  );

  res.json({ success: true, phases });
});

// ─── GET /api/public/project/:token/nodes/:nid/requirements ─────────────────

router.get('/project/:token/nodes/:nid/requirements', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token, nid } = req.params;

  const project = await resolvePublicProject(pool, token);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or not publicly shared' });

  const [nodeRows] = await pool.query(
    'SELECT id FROM nodes WHERE id = ? AND project_id = ?',
    [nid, project.id]
  );
  if (!nodeRows.length) return res.status(404).json({ success: false, message: 'Node not found in this project' });

  const [reqs] = await pool.query(
    'SELECT * FROM requirements WHERE node_id = ? ORDER BY created_at ASC',
    [nid]
  );

  res.json({ success: true, requirements: reqs });
});

// ─── GET /api/public/project/:token/nodes/:nid/renders ──────────────────────

router.get('/project/:token/nodes/:nid/renders', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token, nid } = req.params;

  const project = await resolvePublicProject(pool, token);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or not publicly shared' });

  const [nodeRows] = await pool.query(
    'SELECT id FROM nodes WHERE id = ? AND project_id = ?',
    [nid, project.id]
  );
  if (!nodeRows.length) return res.status(404).json({ success: false, message: 'Node not found in this project' });

  const [renders] = await pool.query(
    'SELECT * FROM node_renders WHERE node_id = ? ORDER BY created_at ASC',
    [nid]
  );

  res.json({ success: true, renders });
});

// ─── GET /api/public/project/:token/nodes/:nid/artifacts ────────────────────
// Returns all phase artifacts for a node

router.get('/project/:token/nodes/:nid/artifacts', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token, nid } = req.params;
  const { phase } = req.query; // optional filter

  const project = await resolvePublicProject(pool, token);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or not publicly shared' });

  const [nodeRows] = await pool.query(
    'SELECT id FROM nodes WHERE id = ? AND project_id = ?',
    [nid, project.id]
  );
  if (!nodeRows.length) return res.status(404).json({ success: false, message: 'Node not found in this project' });

  let query = 'SELECT * FROM phase_artifacts WHERE node_id = ?';
  const params = [nid];
  if (phase) {
    query += ' AND phase = ?';
    params.push(phase);
  }
  query += ' ORDER BY phase, created_at ASC';

  const [artifacts] = await pool.query(query, params);

  res.json({ success: true, artifacts });
});

module.exports = router;
