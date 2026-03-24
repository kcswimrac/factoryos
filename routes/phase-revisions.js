/**
 * Phase Revision API Routes
 *
 * When a node's phase lifecycle regresses (a completed phase is re-opened),
 * the current state is frozen as a numbered revision: Rev A, Rev B, Rev C, …
 *
 * Each revision stores:
 *   - All 7 phase statuses (snapshot)
 *   - All phase artifacts (snapshot)
 *   - The phase that was re-opened (trigger)
 *   - An optional reason written by the engineer
 *
 * Routes:
 *   GET    /api/nodes/:id/phase-revisions               — list revisions
 *   GET    /api/nodes/:id/phase-revisions/:revId        — get single revision (full snapshot)
 *   POST   /api/nodes/:id/phase-revisions               — manually create revision (admin/editor)
 *   DELETE /api/nodes/:id/phase-revisions/:revId        — delete revision (admin only)
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { requireRole } = require('../middleware/rbac');

// Revision label sequence: Rev A, Rev B, ..., Rev Z, Rev AA, Rev AB, ...
function nextRevLabel(existing) {
  const labels = existing.map(r => r.revision_label).filter(l => /^Rev /.test(l));
  if (labels.length === 0) return 'Rev A';

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let max = labels[labels.length - 1].replace('Rev ', '');

  // Increment: Z → AA, AA → AB, AZ → BA, etc.
  function increment(s) {
    const arr = s.split('');
    let i = arr.length - 1;
    while (i >= 0) {
      const idx = chars.indexOf(arr[i]);
      if (idx < 25) {
        arr[i] = chars[idx + 1];
        return arr.join('');
      }
      arr[i] = 'A';
      i--;
    }
    return 'A' + arr.join('');
  }

  return 'Rev ' + increment(max);
}

/**
 * Snapshot the current phase state + artifacts for a node.
 * Returns { phaseSnapshot, artifactSnapshot }
 */
async function snapshotNode(pool, nodeId) {
  const [phases] = await pool.query(
    'SELECT phase, phase_order, status, started_at, completed_at, notes FROM node_phases WHERE node_id = ? ORDER BY phase_order ASC',
    [nodeId]
  );

  const [artifacts] = await pool.query(
    'SELECT id, phase, artifact_type, artifact_key, data, created_at FROM phase_artifacts WHERE node_id = ? ORDER BY phase, created_at ASC',
    [nodeId]
  );

  // Group artifacts by phase
  const artifactsByPhase = {};
  artifacts.forEach(a => {
    if (!artifactsByPhase[a.phase]) artifactsByPhase[a.phase] = [];
    artifactsByPhase[a.phase].push(a);
  });

  return {
    phaseSnapshot: phases,
    artifactSnapshot: artifactsByPhase
  };
}

/**
 * Create a new revision for a node. Called internally when a phase regresses.
 *
 * @param {object} pool
 * @param {number} nodeId
 * @param {string} triggeredByPhase  — phase key that was re-opened
 * @param {string} [reason]          — optional free-text reason
 * @returns {object} created revision row
 */
async function createRevision(pool, nodeId, triggeredByPhase, reason) {
  const [existing] = await pool.query(
    'SELECT revision_label FROM node_phase_revisions WHERE node_id = ? ORDER BY id ASC',
    [nodeId]
  );

  const label = nextRevLabel(existing);
  const { phaseSnapshot, artifactSnapshot } = await snapshotNode(pool, nodeId);

  const [result] = await pool.query(`
    INSERT INTO node_phase_revisions
      (node_id, revision_label, triggered_by_phase, regression_reason, phase_snapshot, artifact_snapshot)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    nodeId,
    label,
    triggeredByPhase || null,
    reason || null,
    JSON.stringify(phaseSnapshot),
    JSON.stringify(artifactSnapshot)
  ]);

  const [rows] = await pool.query('SELECT * FROM node_phase_revisions WHERE id = ?', [result.insertId]);
  return rows[0];
}

// ── GET /api/nodes/:id/phase-revisions ───────────────────────────────────────

router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const nodeId = parseInt(req.params.id);

  if (!nodeId) return res.status(400).json({ success: false, message: 'Invalid node id' });

  const [nodeRows] = await pool.query('SELECT id FROM nodes WHERE id = ?', [nodeId]);
  if (!nodeRows.length) return res.status(404).json({ success: false, message: 'Node not found' });

  const [rows] = await pool.query(`
    SELECT id, node_id, revision_label, triggered_by_phase, regression_reason, created_at
    FROM node_phase_revisions
    WHERE node_id = ?
    ORDER BY id ASC
  `, [nodeId]);

  res.json({ success: true, revisions: rows });
});

// ── GET /api/nodes/:id/phase-revisions/:revId ─────────────────────────────────

router.get('/:revId', async (req, res) => {
  const pool = req.app.locals.pool;
  const nodeId = parseInt(req.params.id);
  const revId  = parseInt(req.params.revId);

  if (!nodeId || !revId) return res.status(400).json({ success: false, message: 'Invalid id' });

  const [rows] = await pool.query(
    'SELECT * FROM node_phase_revisions WHERE id = ? AND node_id = ?',
    [revId, nodeId]
  );

  if (!rows.length) return res.status(404).json({ success: false, message: 'Revision not found' });

  res.json({ success: true, revision: rows[0] });
});

// ── POST /api/nodes/:id/phase-revisions ───────────────────────────────────────
// Manually create a revision (e.g. before a planned regression).

router.post('/', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const nodeId = parseInt(req.params.id);
  const { triggered_by_phase, regression_reason } = req.body;

  if (!nodeId) return res.status(400).json({ success: false, message: 'Invalid node id' });

  const [nodeRows] = await pool.query('SELECT id FROM nodes WHERE id = ?', [nodeId]);
  if (!nodeRows.length) return res.status(404).json({ success: false, message: 'Node not found' });

  const revision = await createRevision(pool, nodeId, triggered_by_phase, regression_reason);
  res.status(201).json({ success: true, revision });
});

// ── DELETE /api/nodes/:id/phase-revisions/:revId ──────────────────────────────

router.delete('/:revId', requireRole('admin'), async (req, res) => {
  const pool = req.app.locals.pool;
  const nodeId = parseInt(req.params.id);
  const revId  = parseInt(req.params.revId);

  // Fetch before deleting since MySQL doesn't support RETURNING
  const [rows] = await pool.query(
    'SELECT id, revision_label FROM node_phase_revisions WHERE id = ? AND node_id = ?',
    [revId, nodeId]
  );

  if (!rows.length) return res.status(404).json({ success: false, message: 'Revision not found' });

  await pool.query('DELETE FROM node_phase_revisions WHERE id = ? AND node_id = ?', [revId, nodeId]);
  res.json({ success: true, deleted: rows[0] });
});

module.exports = router;
module.exports.createRevision = createRevision;
