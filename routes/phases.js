/**
 * Phase Lifecycle API Routes
 *
 * 7-step engineering lifecycle attached to nodes:
 *   1. Requirements
 *   2. R&D
 *   3. Design/CAD   (with Serviceability + Manufacturability sub-sections)
 *   4. Data Collection
 *   5. Analysis/CAE
 *   6. Testing/Validation
 *   7. Correlation
 *
 * Gating rules:
 *   - Phases must be completed in order (can't skip ahead)
 *   - Each phase has required artifacts that MUST exist before marking complete
 *   - Iteration: can go back to an earlier phase, which resets all later phases
 *   - Nodes inherit parent phases by default, or own their lifecycle
 *
 * Routes:
 *   GET    /api/nodes/:id/phases                          - Get resolved phase statuses + gate info
 *   PUT    /api/nodes/:id/phases/:phase                   - Update phase status (enforces gating)
 *   PUT    /api/nodes/:id/phase-mode                      - Toggle own vs inherit
 *   POST   /api/nodes/:id/phases/init                     - Initialize phases for a node
 *   GET    /api/nodes/:id/phases/:phase/artifacts         - List artifacts for a phase
 *   POST   /api/nodes/:id/phases/:phase/artifacts         - Create artifact
 *   PUT    /api/nodes/:id/phases/:phase/artifacts/:aid    - Update artifact
 *   DELETE /api/nodes/:id/phases/:phase/artifacts/:aid    - Delete artifact
 */

const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/rbac');
const { createRevision } = require('./phase-revisions');

// The 7 engineering phases in order
// Serviceability and Manufacturability are sub-sections inside Design/CAD (not separate phases)
const PHASES = [
  { key: 'requirements',       order: 1, label: 'Requirements' },
  { key: 'rnd',                order: 2, label: 'R&D' },
  { key: 'design_cad',         order: 3, label: 'Design/CAD' },
  { key: 'data_collection',    order: 4, label: 'Data Collection' },
  { key: 'analysis_cae',       order: 5, label: 'Analysis/CAE' },
  { key: 'testing_validation', order: 6, label: 'Testing/Validation' },
  { key: 'correlation',        order: 7, label: 'Correlation' }
];

const PHASE_KEYS = PHASES.map(p => p.key);
const VALID_STATUSES = ['not_started', 'in_progress', 'complete'];

/**
 * Gate check: returns { ok: bool, missing: string[] } for a phase.
 * Called before allowing a phase to be marked 'complete'.
 */
async function checkPhaseGate(pool, nodeId, phaseKey) {
  switch (phaseKey) {
    case 'requirements': {
      const [rows] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM requirements WHERE node_id = ?',
        [nodeId]
      );
      if (rows[0].cnt < 1) {
        return { ok: false, missing: ['At least 1 requirement must be attached to this node'] };
      }
      return { ok: true, missing: [] };
    }

    case 'rnd': {
      const [optRows] = await pool.query(
        "SELECT COUNT(*) AS cnt FROM phase_artifacts WHERE node_id=? AND phase='rnd' AND artifact_type='design_option'",
        [nodeId]
      );
      const [matrixRows] = await pool.query(
        "SELECT id FROM phase_artifacts WHERE node_id=? AND phase='rnd' AND artifact_key='comparison_matrix' AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.content')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.content')) != ''",
        [nodeId]
      );
      const missing = [];
      if (optRows[0].cnt < 2) missing.push('At least 2 design options required');
      if (matrixRows.length === 0) missing.push('Comparison table must be filled out');
      return { ok: missing.length === 0, missing };
    }

    case 'design_cad': {
      const [cadRows] = await pool.query(
        "SELECT id FROM phase_artifacts WHERE node_id=? AND phase='design_cad' AND artifact_key='cad_ref' AND (JSON_UNQUOTE(JSON_EXTRACT(data, '$.url')) IS NOT NULL OR JSON_UNQUOTE(JSON_EXTRACT(data, '$.filename')) IS NOT NULL)",
        [nodeId]
      );
      if (cadRows.length === 0) {
        return { ok: false, missing: ['CAD file upload or external link (Onshape/Fusion360 URL) required'] };
      }
      return { ok: true, missing: [] };
    }

    case 'data_collection': {
      const [dpRows] = await pool.query(
        "SELECT COUNT(*) AS cnt FROM phase_artifacts WHERE node_id=? AND phase='data_collection' AND artifact_type='data_point'",
        [nodeId]
      );
      if (dpRows[0].cnt < 1) {
        return { ok: false, missing: ['At least 1 data point required (with measurement method, tool, and confidence level)'] };
      }
      return { ok: true, missing: [] };
    }

    case 'analysis_cae': {
      const [aeRows] = await pool.query(
        "SELECT COUNT(*) AS cnt FROM phase_artifacts WHERE node_id=? AND phase='analysis_cae' AND artifact_type='analysis_entry'",
        [nodeId]
      );
      if (aeRows[0].cnt < 1) {
        return { ok: false, missing: ['At least 1 analysis entry required (with assumptions, method, result, and confidence level)'] };
      }
      return { ok: true, missing: [] };
    }

    case 'testing_validation': {
      const [trRows] = await pool.query(
        "SELECT COUNT(*) AS cnt FROM phase_artifacts WHERE node_id=? AND phase='testing_validation' AND artifact_type='test_result' AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.requirement_id')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.result')) IS NOT NULL",
        [nodeId]
      );
      if (trRows[0].cnt < 1) {
        return { ok: false, missing: ['At least 1 test result required, linked to a requirement with a documented result (pass/fail/value)'] };
      }
      return { ok: true, missing: [] };
    }

    case 'correlation': {
      const [ceRows] = await pool.query(
        "SELECT COUNT(*) AS cnt FROM phase_artifacts WHERE node_id=? AND phase='correlation' AND artifact_type='correlation_entry' AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.predicted')) IS NOT NULL AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.actual')) IS NOT NULL",
        [nodeId]
      );
      if (ceRows[0].cnt < 1) {
        return { ok: false, missing: ['At least 1 correlation entry required (with predicted value, actual value, and explanation)'] };
      }
      return { ok: true, missing: [] };
    }

    default:
      return { ok: true, missing: [] };
  }
}

/**
 * Compute gate info for all 7 phases (batch query for efficiency).
 * Returns map: { phaseKey: { ok, missing } }
 */
async function computeAllGates(pool, nodeId) {
  const gates = {};
  await Promise.all(
    PHASES.map(async (p) => {
      gates[p.key] = await checkPhaseGate(pool, nodeId, p.key);
    })
  );
  return gates;
}

/**
 * Initialize all 7 phase rows for a node.
 * Idempotent - skips phases that already exist.
 */
async function initializePhases(pool, nodeId) {
  const values = PHASES.map(p =>
    `(?, '${p.key}', ${p.order}, 'not_started')`
  ).join(', ');

  const params = PHASES.map(() => nodeId);

  await pool.query(`
    INSERT IGNORE INTO node_phases (node_id, phase, phase_order, status)
    VALUES ${values}
  `, params);
}

/**
 * Walk up the ancestor chain to find the node whose phases this node uses.
 */
async function resolvePhaseOwner(pool, nodeId) {
  const [nodeRows] = await pool.query(
    'SELECT id, phase_mode, parent_id FROM nodes WHERE id = ?',
    [nodeId]
  );

  if (nodeRows.length === 0) return null;
  const node = nodeRows[0];

  if (node.phase_mode === 'own') return node.id;

  if (!node.parent_id) return null;

  const [ancestorRows] = await pool.query(`
    WITH RECURSIVE ancestors AS (
      SELECT id, phase_mode, parent_id, 1 AS depth
      FROM nodes
      WHERE id = ?

      UNION ALL

      SELECT n.id, n.phase_mode, n.parent_id, a.depth + 1
      FROM nodes n
      INNER JOIN ancestors a ON n.id = a.parent_id
    )
    SELECT id, phase_mode FROM ancestors
    WHERE phase_mode = 'own'
    ORDER BY depth ASC
    LIMIT 1
  `, [node.parent_id]);

  if (ancestorRows.length === 0) return null;
  return ancestorRows[0].id;
}

// ─── Artifact CRUD ───────────────────────────────────────────────────────────

/**
 * GET /api/nodes/:id/phases/:phase/artifacts
 */
router.get('/:id/phases/:phase/artifacts', async (req, res) => {
  const pool = req.app.locals.pool;
  const { id, phase } = req.params;

  if (!PHASE_KEYS.includes(phase)) {
    return res.status(400).json({ success: false, message: `Invalid phase: ${phase}` });
  }

  const [nodeRows] = await pool.query('SELECT id FROM nodes WHERE id = ?', [id]);
  if (nodeRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  const ownerId = await resolvePhaseOwner(pool, Number(id));
  const targetId = ownerId || Number(id);

  const [rows] = await pool.query(
    'SELECT * FROM phase_artifacts WHERE node_id=? AND phase=? ORDER BY created_at ASC',
    [targetId, phase]
  );

  res.json({ success: true, artifacts: rows });
});

/**
 * POST /api/nodes/:id/phases/:phase/artifacts
 * Body: { artifact_type, artifact_key (optional), data }
 */
router.post('/:id/phases/:phase/artifacts', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id, phase } = req.params;
  const { artifact_type, artifact_key, data } = req.body;

  if (!PHASE_KEYS.includes(phase)) {
    return res.status(400).json({ success: false, message: `Invalid phase: ${phase}` });
  }

  if (!artifact_type) {
    return res.status(400).json({ success: false, message: 'artifact_type is required' });
  }

  const [nodeRows] = await pool.query('SELECT id FROM nodes WHERE id = ?', [id]);
  if (nodeRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  const ownerId = await resolvePhaseOwner(pool, Number(id));
  const targetId = ownerId || Number(id);

  let rows;
  if (artifact_key) {
    // Upsert for single-record artifacts
    await pool.query(`
      INSERT INTO phase_artifacts (node_id, phase, artifact_type, artifact_key, data)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE data = VALUES(data), artifact_type = VALUES(artifact_type), updated_at = NOW()
    `, [targetId, phase, artifact_type, artifact_key, JSON.stringify(data || {})]);
    const [selRows] = await pool.query(
      'SELECT * FROM phase_artifacts WHERE node_id = ? AND phase = ? AND artifact_key = ?',
      [targetId, phase, artifact_key]
    );
    rows = selRows;
  } else {
    const [result] = await pool.query(`
      INSERT INTO phase_artifacts (node_id, phase, artifact_type, data)
      VALUES (?, ?, ?, ?)
    `, [targetId, phase, artifact_type, JSON.stringify(data || {})]);
    const [selRows] = await pool.query(
      'SELECT * FROM phase_artifacts WHERE id = ?',
      [result.insertId]
    );
    rows = selRows;
  }

  res.json({ success: true, artifact: rows[0] });
});

/**
 * PUT /api/nodes/:id/phases/:phase/artifacts/:aid
 * Body: { data }
 */
router.put('/:id/phases/:phase/artifacts/:aid', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id, phase, aid } = req.params;
  const { data } = req.body;

  if (!PHASE_KEYS.includes(phase)) {
    return res.status(400).json({ success: false, message: `Invalid phase: ${phase}` });
  }

  const [nodeRows] = await pool.query('SELECT id FROM nodes WHERE id = ?', [id]);
  if (nodeRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  const ownerId = await resolvePhaseOwner(pool, Number(id));
  const targetId = ownerId || Number(id);

  const [result] = await pool.query(`
    UPDATE phase_artifacts
    SET data = ?, updated_at = NOW()
    WHERE id = ? AND node_id = ? AND phase = ?
  `, [JSON.stringify(data || {}), aid, targetId, phase]);

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Artifact not found' });
  }

  const [rows] = await pool.query('SELECT * FROM phase_artifacts WHERE id = ?', [aid]);

  res.json({ success: true, artifact: rows[0] });
});

/**
 * DELETE /api/nodes/:id/phases/:phase/artifacts/:aid
 */
router.delete('/:id/phases/:phase/artifacts/:aid', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id, phase, aid } = req.params;

  if (!PHASE_KEYS.includes(phase)) {
    return res.status(400).json({ success: false, message: `Invalid phase: ${phase}` });
  }

  const [nodeRows] = await pool.query('SELECT id FROM nodes WHERE id = ?', [id]);
  if (nodeRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  const ownerId = await resolvePhaseOwner(pool, Number(id));
  const targetId = ownerId || Number(id);

  const [result] = await pool.query(
    'DELETE FROM phase_artifacts WHERE id=? AND node_id=? AND phase=?',
    [aid, targetId, phase]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Artifact not found' });
  }

  res.json({ success: true });
});

// ─── Phase Lifecycle CRUD ────────────────────────────────────────────────────

/**
 * GET /api/nodes/:id/phases
 *
 * Returns the resolved phase statuses for a node, plus gate info per phase.
 */
router.get('/:id/phases', async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid node id' });
  }

  const [nodeRows] = await pool.query(
    'SELECT id, name, part_number, phase_mode, parent_id FROM nodes WHERE id = ?',
    [id]
  );
  if (nodeRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  const node = nodeRows[0];
  const ownerId = await resolvePhaseOwner(pool, Number(id));

  // Compute gate info for all phases (against the owner)
  const gateTargetId = ownerId || Number(id);
  const gates = await computeAllGates(pool, gateTargetId);

  if (!ownerId) {
    return res.json({
      success: true,
      phase_mode: node.phase_mode,
      owner_node_id: null,
      inherited: false,
      phases: PHASES.map(p => ({
        phase: p.key,
        label: p.label,
        order: p.order,
        status: 'not_started',
        started_at: null,
        completed_at: null,
        notes: null,
        gate_satisfied: gates[p.key].ok,
        gate_missing: gates[p.key].missing
      })),
      summary: { total: 7, not_started: 7, in_progress: 0, complete: 0, progress_pct: 0 }
    });
  }

  const [phasesRows] = await pool.query(
    'SELECT * FROM node_phases WHERE node_id = ? ORDER BY phase_order ASC',
    [ownerId]
  );

  const phaseMap = {};
  phasesRows.forEach(r => { phaseMap[r.phase] = r; });

  const phases = PHASES.map(p => {
    const db = phaseMap[p.key];
    return {
      phase: p.key,
      label: p.label,
      order: p.order,
      status: db ? db.status : 'not_started',
      started_at: db ? db.started_at : null,
      completed_at: db ? db.completed_at : null,
      notes: db ? db.notes : null,
      gate_satisfied: gates[p.key].ok,
      gate_missing: gates[p.key].missing
    };
  });

  const complete = phases.filter(p => p.status === 'complete').length;
  const inProgress = phases.filter(p => p.status === 'in_progress').length;

  let ownerName = null;
  if (ownerId !== Number(id)) {
    const [ownerRows] = await pool.query('SELECT name, part_number FROM nodes WHERE id = ?', [ownerId]);
    if (ownerRows.length > 0) {
      ownerName = { id: ownerId, name: ownerRows[0].name, part_number: ownerRows[0].part_number };
    }
  }

  res.json({
    success: true,
    phase_mode: node.phase_mode,
    owner_node_id: ownerId,
    inherited: ownerId !== Number(id),
    inherited_from: ownerName,
    phases,
    summary: {
      total: 7,
      not_started: 7 - complete - inProgress,
      in_progress: inProgress,
      complete,
      progress_pct: Math.round((complete / 7) * 100)
    }
  });
});

/**
 * PUT /api/nodes/:id/phases/:phase
 *
 * Update a phase's status. Enforces gating rules:
 *   - To set a phase to 'in_progress': all previous phases must be 'complete'
 *   - To set a phase to 'complete': the phase must be 'in_progress' AND gate is satisfied
 *   - Iteration: setting an earlier phase back to 'in_progress' resets all later phases
 */
router.put('/:id/phases/:phase', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id, phase } = req.params;
  const { status, notes, regression_reason } = req.body;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid node id' });
  }

  if (!PHASE_KEYS.includes(phase)) {
    return res.status(400).json({
      success: false,
      message: `Invalid phase. Must be one of: ${PHASE_KEYS.join(', ')}`
    });
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }

  const [nodeRows] = await pool.query(
    'SELECT id, phase_mode, parent_id FROM nodes WHERE id = ?',
    [id]
  );
  if (nodeRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  const ownerId = await resolvePhaseOwner(pool, Number(id));
  if (!ownerId) {
    return res.status(400).json({
      success: false,
      message: 'No phase lifecycle assigned. Set phase_mode to "own" first or assign one to a parent node.'
    });
  }

  if (ownerId !== Number(id)) {
    return res.status(403).json({
      success: false,
      message: 'This node inherits its phases. Modify the phase owner node instead.',
      owner_node_id: ownerId
    });
  }

  const [phasesRows] = await pool.query(
    'SELECT * FROM node_phases WHERE node_id = ? ORDER BY phase_order ASC',
    [ownerId]
  );

  const phaseMap = {};
  phasesRows.forEach(r => { phaseMap[r.phase] = r; });

  const targetPhase = PHASES.find(p => p.key === phase);
  const targetOrder = targetPhase.order;
  const currentRecord = phaseMap[phase];
  const currentStatus = currentRecord ? currentRecord.status : 'not_started';

  // ── Gating Logic ──────────────────────────────────

  if (status === 'in_progress') {
    const previousPhases = PHASES.filter(p => p.order < targetOrder);
    const incomplete = previousPhases.filter(p => {
      const rec = phaseMap[p.key];
      return !rec || rec.status !== 'complete';
    });

    if (incomplete.length > 0 && currentStatus === 'not_started') {
      return res.status(400).json({
        success: false,
        message: `Cannot start "${targetPhase.label}". Complete these phases first: ${incomplete.map(p => p.label).join(', ')}`,
        blocked_by: incomplete.map(p => p.key)
      });
    }

    // REGRESSION: reopening a complete phase — freeze current state as a revision
    if (currentStatus === 'complete') {
      // Create a revision snapshot BEFORE resetting anything
      try {
        await createRevision(pool, ownerId, phase, regression_reason || null);
      } catch (revErr) {
        // Non-fatal — log but don't block the regression
        console.warn('[Phase Revisions] Failed to create revision:', revErr.message);
      }

      const laterPhases = PHASES.filter(p => p.order > targetOrder).map(p => p.key);
      if (laterPhases.length > 0) {
        await pool.query(`
          UPDATE node_phases
          SET status = 'not_started', started_at = NULL, completed_at = NULL, updated_at = NOW()
          WHERE node_id = ? AND phase IN (?)
        `, [ownerId, laterPhases]);
      }
    }
  }

  if (status === 'complete') {
    if (currentStatus !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: `Cannot complete "${targetPhase.label}". Phase must be in progress first (current: ${currentStatus}).`
      });
    }

    // ── Hard gate: check required artifacts ──
    const gate = await checkPhaseGate(pool, ownerId, phase);
    if (!gate.ok) {
      return res.status(400).json({
        success: false,
        message: `Cannot complete "${targetPhase.label}". Required artifacts missing.`,
        gate_missing: gate.missing
      });
    }
  }

  if (status === 'not_started') {
    const laterPhases = PHASES.filter(p => p.order > targetOrder).map(p => p.key);
    if (laterPhases.length > 0) {
      await pool.query(`
        UPDATE node_phases
        SET status = 'not_started', started_at = NULL, completed_at = NULL, updated_at = NOW()
        WHERE node_id = ? AND phase IN (?)
      `, [ownerId, laterPhases]);
    }
  }

  // ── Update the target phase ──────────────────────

  const now = new Date();
  const updateFields = {
    status,
    updated_at: now,
    started_at: status === 'in_progress' ? now : (currentRecord ? currentRecord.started_at : null),
    completed_at: status === 'complete' ? now : null,
    notes: notes !== undefined ? notes : (currentRecord ? currentRecord.notes : null)
  };

  if (currentRecord) {
    await pool.query(`
      UPDATE node_phases
      SET status = ?, started_at = ?, completed_at = ?, notes = ?, updated_at = ?
      WHERE node_id = ? AND phase = ?
    `, [updateFields.status, updateFields.started_at, updateFields.completed_at,
        updateFields.notes, updateFields.updated_at, ownerId, phase]);
  } else {
    await pool.query(`
      INSERT INTO node_phases (node_id, phase, phase_order, status, started_at, completed_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [ownerId, phase, targetOrder, updateFields.status,
        updateFields.started_at, updateFields.completed_at, updateFields.notes]);
  }

  // Return updated phases
  const [updatedRows] = await pool.query(
    'SELECT * FROM node_phases WHERE node_id = ? ORDER BY phase_order ASC',
    [ownerId]
  );

  // Recompute gates
  const gates = await computeAllGates(pool, ownerId);

  const phases = PHASES.map(p => {
    const db = updatedRows.find(r => r.phase === p.key);
    return {
      phase: p.key,
      label: p.label,
      order: p.order,
      status: db ? db.status : 'not_started',
      started_at: db ? db.started_at : null,
      completed_at: db ? db.completed_at : null,
      notes: db ? db.notes : null,
      gate_satisfied: gates[p.key].ok,
      gate_missing: gates[p.key].missing
    };
  });

  const complete = phases.filter(p => p.status === 'complete').length;
  const inProgress = phases.filter(p => p.status === 'in_progress').length;

  res.json({
    success: true,
    updated_phase: phase,
    phases,
    summary: {
      total: 7,
      not_started: 7 - complete - inProgress,
      in_progress: inProgress,
      complete,
      progress_pct: Math.round((complete / 7) * 100)
    }
  });
});

/**
 * PUT /api/nodes/:id/phase-mode
 *
 * Toggle between 'own' and 'inherit'.
 * When switching to 'own': initializes 7 phase rows.
 */
router.put('/:id/phase-mode', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const { mode } = req.body;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid node id' });
  }

  if (!mode || !['own', 'inherit'].includes(mode)) {
    return res.status(400).json({ success: false, message: 'mode must be "own" or "inherit"' });
  }

  const [nodeRows] = await pool.query('SELECT id, parent_id, phase_mode FROM nodes WHERE id = ?', [id]);
  if (nodeRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  const node = nodeRows[0];

  if (mode === 'inherit' && !node.parent_id) {
    return res.status(400).json({
      success: false,
      message: 'Root nodes cannot inherit phases (no parent). Use "own" mode.'
    });
  }

  await pool.query('UPDATE nodes SET phase_mode = ?, updated_at = NOW() WHERE id = ?', [mode, id]);

  if (mode === 'own') {
    await initializePhases(pool, Number(id));
  }

  res.json({
    success: true,
    node_id: Number(id),
    phase_mode: mode,
    message: mode === 'own'
      ? 'Phase lifecycle initialized. This node now owns its 7-step progression.'
      : 'Phase mode set to inherit. This node will use its parent\'s lifecycle.'
  });
});

/**
 * POST /api/nodes/:id/phases/init
 *
 * Explicitly initialize phases for a node. Also sets phase_mode to 'own'.
 */
router.post('/:id/phases/init', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid node id' });
  }

  const [nodeRows] = await pool.query('SELECT id FROM nodes WHERE id = ?', [id]);
  if (nodeRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  await pool.query('UPDATE nodes SET phase_mode = ?, updated_at = NOW() WHERE id = ?', ['own', id]);
  await initializePhases(pool, Number(id));

  const [phasesRows] = await pool.query(
    'SELECT * FROM node_phases WHERE node_id = ? ORDER BY phase_order ASC',
    [id]
  );

  const gates = await computeAllGates(pool, Number(id));

  const phases = PHASES.map(p => {
    const db = phasesRows.find(r => r.phase === p.key);
    return {
      phase: p.key,
      label: p.label,
      order: p.order,
      status: db ? db.status : 'not_started',
      started_at: db ? db.started_at : null,
      completed_at: db ? db.completed_at : null,
      notes: db ? db.notes : null,
      gate_satisfied: gates[p.key].ok,
      gate_missing: gates[p.key].missing
    };
  });

  res.json({
    success: true,
    node_id: Number(id),
    phase_mode: 'own',
    phases,
    summary: { total: 7, not_started: 7, in_progress: 0, complete: 0, progress_pct: 0 }
  });
});

// Export PHASES constant for use by other modules
router.PHASES = PHASES;

module.exports = router;
