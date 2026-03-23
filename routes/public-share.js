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
  const result = await pool.query(`
    SELECT p.*, t.name AS team_name, t.slug AS team_slug, t.logo_url AS team_logo_url
    FROM projects p
    LEFT JOIN teams t ON t.id = p.team_id
    WHERE p.share_token = $1 AND p.is_public = TRUE
  `, [token]);
  return result.rows[0] || null;
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
  const nodesResult = await pool.query(
    'SELECT * FROM nodes WHERE project_id = $1 ORDER BY part_number ASC',
    [project.id]
  );

  // Phase summary per node (batch query)
  let phaseSummaries = {};
  if (nodesResult.rows.length > 0) {
    const nodeIds = nodesResult.rows.map(n => n.id);
    const phaseRows = await pool.query(`
      SELECT node_id,
        COUNT(*) FILTER (WHERE status = 'complete')::int    AS complete,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
        COUNT(*)::int                                        AS total
      FROM node_phases
      WHERE node_id = ANY($1)
      GROUP BY node_id
    `, [nodeIds]);
    phaseRows.rows.forEach(r => {
      phaseSummaries[r.node_id] = {
        complete: r.complete,
        in_progress: r.in_progress,
        total: r.total,
        progress_pct: r.total > 0 ? Math.round((r.complete / 7) * 100) : 0
      };
    });
  }

  // Build tree
  const map = {};
  const roots = [];
  nodesResult.rows.forEach(r => {
    map[r.id] = { ...r, phase_summary: phaseSummaries[r.id] || null, children: [] };
  });
  nodesResult.rows.forEach(r => {
    if (r.parent_id && map[r.parent_id]) map[r.parent_id].children.push(map[r.id]);
    else roots.push(map[r.id]);
  });

  // Strip internal fields before returning
  const { share_token, ...safeProject } = project;

  res.json({
    success: true,
    project: safeProject,
    nodes: roots,
    node_count: nodesResult.rows.length
  });
});

// ─── GET /api/public/project/:token/nodes/:nid/phases ────────────────────────

router.get('/project/:token/nodes/:nid/phases', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token, nid } = req.params;

  const project = await resolvePublicProject(pool, token);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or not publicly shared' });

  const nodeResult = await pool.query(
    'SELECT id, phase_mode FROM nodes WHERE id = $1 AND project_id = $2',
    [nid, project.id]
  );
  if (!nodeResult.rows.length) return res.status(404).json({ success: false, message: 'Node not found in this project' });

  const phases = await pool.query(
    'SELECT * FROM node_phases WHERE node_id = $1 ORDER BY phase_order ASC',
    [nid]
  );

  res.json({ success: true, phases: phases.rows });
});

// ─── GET /api/public/project/:token/nodes/:nid/requirements ─────────────────

router.get('/project/:token/nodes/:nid/requirements', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token, nid } = req.params;

  const project = await resolvePublicProject(pool, token);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or not publicly shared' });

  const nodeResult = await pool.query(
    'SELECT id FROM nodes WHERE id = $1 AND project_id = $2',
    [nid, project.id]
  );
  if (!nodeResult.rows.length) return res.status(404).json({ success: false, message: 'Node not found in this project' });

  const reqs = await pool.query(
    'SELECT * FROM requirements WHERE node_id = $1 ORDER BY created_at ASC',
    [nid]
  );

  res.json({ success: true, requirements: reqs.rows });
});

// ─── GET /api/public/project/:token/nodes/:nid/renders ──────────────────────

router.get('/project/:token/nodes/:nid/renders', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token, nid } = req.params;

  const project = await resolvePublicProject(pool, token);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or not publicly shared' });

  const nodeResult = await pool.query(
    'SELECT id FROM nodes WHERE id = $1 AND project_id = $2',
    [nid, project.id]
  );
  if (!nodeResult.rows.length) return res.status(404).json({ success: false, message: 'Node not found in this project' });

  const renders = await pool.query(
    'SELECT * FROM node_renders WHERE node_id = $1 ORDER BY created_at ASC',
    [nid]
  );

  res.json({ success: true, renders: renders.rows });
});

// ─── GET /api/public/project/:token/nodes/:nid/artifacts ────────────────────
// Returns all phase artifacts for a node

router.get('/project/:token/nodes/:nid/artifacts', async (req, res) => {
  const pool = req.app.locals.pool;
  const { token, nid } = req.params;
  const { phase } = req.query; // optional filter

  const project = await resolvePublicProject(pool, token);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found or not publicly shared' });

  const nodeResult = await pool.query(
    'SELECT id FROM nodes WHERE id = $1 AND project_id = $2',
    [nid, project.id]
  );
  if (!nodeResult.rows.length) return res.status(404).json({ success: false, message: 'Node not found in this project' });

  let query = 'SELECT * FROM phase_artifacts WHERE node_id = $1';
  const params = [nid];
  if (phase) {
    query += ' AND phase = $2';
    params.push(phase);
  }
  query += ' ORDER BY phase, created_at ASC';

  const artifacts = await pool.query(query, params);

  res.json({ success: true, artifacts: artifacts.rows });
});

module.exports = router;
