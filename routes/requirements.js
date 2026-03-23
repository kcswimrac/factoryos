/**
 * Requirements Management API
 *
 * Requirements attach to nodes in the design hierarchy.
 * Each requirement has a unique ID, title, description,
 * verification method, status, priority, optional source reference,
 * and optional parent-child derivation links.
 *
 * Derivation: a requirement can be "derived from" one or more parent requirements
 * (many-to-many). This creates a full traceability tree.
 *
 * Routes:
 *   GET    /api/requirements?node_id=X[&inherited=true]   — list reqs for a node
 *   GET    /api/requirements/coverage?node_id=X           — coverage stats
 *   GET    /api/requirements/project?project_id=X         — all reqs in project (for derivation dropdown)
 *   POST   /api/requirements                              — create requirement
 *   PUT    /api/requirements/:id                          — update requirement
 *   DELETE /api/requirements/:id                          — delete requirement
 *   POST   /api/requirements/:id/traces                   — add trace
 *   DELETE /api/requirement-traces/:traceId               — remove trace
 *   POST   /api/requirements/:id/derivations              — add parent derivation link
 *   DELETE /api/requirements/:id/derivations/:parentId    — remove parent derivation link
 */

const express = require('express');
const router = express.Router();
const { getProjectRole, getProjectForNode, getProjectForRequirement, getProjectForTrace } = require('../middleware/rbac');

/**
 * Inline role check helper — returns false and sends 403 if insufficient.
 * Handles demo projects (read-only) automatically.
 */
async function assertEditorRole(pool, res, projectId, userId) {
  if (!projectId) return true; // can't resolve, skip check
  // Check demo
  const [projRows] = await pool.query('SELECT is_demo FROM projects WHERE id = ?', [projectId]);
  if (projRows[0]?.is_demo) {
    res.status(403).json({ success: false, message: 'Demo projects are read-only' });
    return false;
  }
  const role = await getProjectRole(pool, projectId, userId);
  if (!role) {
    res.status(403).json({ success: false, message: 'You do not have access to this project' });
    return false;
  }
  if (role === 'viewer') {
    res.status(403).json({ success: false, message: 'Editor or Admin role required' });
    return false;
  }
  return true;
}

const VALID_VERIFICATION_METHODS = ['test', 'inspection', 'analysis', 'demonstration'];
const VALID_STATUSES = ['open', 'in_progress', 'verified', 'waived'];
const VALID_PRIORITIES = ['shall', 'should', 'may'];

/**
 * Helper: fetch derivation parents and children for a list of requirement IDs.
 * Returns { parentsMap, childrenMap } keyed by requirement id.
 */
async function fetchDerivations(pool, reqIds) {
  if (!reqIds || reqIds.length === 0) return { parentsMap: {}, childrenMap: {} };

  // Parents: requirements this req was derived FROM
  const [parentsRows] = await pool.query(`
    SELECT d.child_requirement_id, r.id, r.req_id, r.title, r.node_id,
           n.name AS node_name, n.part_number AS node_part_number
    FROM requirement_derivations d
    JOIN requirements r ON r.id = d.parent_requirement_id
    JOIN nodes n ON n.id = r.node_id
    WHERE d.child_requirement_id IN (?)
    ORDER BY r.req_id ASC
  `, [reqIds]);

  // Children: requirements derived FROM this req
  const [childrenRows] = await pool.query(`
    SELECT d.parent_requirement_id, r.id, r.req_id, r.title, r.node_id,
           n.name AS node_name, n.part_number AS node_part_number
    FROM requirement_derivations d
    JOIN requirements r ON r.id = d.child_requirement_id
    JOIN nodes n ON n.id = r.node_id
    WHERE d.parent_requirement_id IN (?)
    ORDER BY r.req_id ASC
  `, [reqIds]);

  const parentsMap = {};
  const childrenMap = {};

  parentsRows.forEach(row => {
    const cid = row.child_requirement_id;
    if (!parentsMap[cid]) parentsMap[cid] = [];
    parentsMap[cid].push({ id: row.id, req_id: row.req_id, title: row.title, node_id: row.node_id, node_name: row.node_name, node_part_number: row.node_part_number });
  });

  childrenRows.forEach(row => {
    const pid = row.parent_requirement_id;
    if (!childrenMap[pid]) childrenMap[pid] = [];
    childrenMap[pid].push({ id: row.id, req_id: row.req_id, title: row.title, node_id: row.node_id, node_name: row.node_name, node_part_number: row.node_part_number });
  });

  return { parentsMap, childrenMap };
}

/**
 * Helper: set derivation parents for a requirement.
 * Replaces all existing parents with the given list.
 */
async function setDerivationParents(pool, childId, parentIds) {
  if (!Array.isArray(parentIds)) return;
  // Remove self-references silently
  const validParentIds = parentIds.filter(pid => pid && Number(pid) !== childId);

  // Delete existing parents for this child
  await pool.query('DELETE FROM requirement_derivations WHERE child_requirement_id = ?', [childId]);

  if (validParentIds.length === 0) return;

  // Verify all parent requirement IDs exist
  const [existRows] = await pool.query('SELECT id FROM requirements WHERE id IN (?)', [validParentIds]);
  const existingIds = existRows.map(r => r.id);

  for (const pid of existingIds) {
    await pool.query(
      'INSERT IGNORE INTO requirement_derivations (parent_requirement_id, child_requirement_id) VALUES (?, ?)',
      [pid, childId]
    );
  }
}

/**
 * GET /api/requirements?node_id=X[&inherited=true]
 *
 * Returns requirements for a node, including source and derivation links.
 * With ?inherited=true, also returns requirements from ancestor nodes.
 */
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const nodeId = parseInt(req.query.node_id);
  const inherited = req.query.inherited === 'true';

  if (!nodeId || isNaN(nodeId)) {
    return res.status(400).json({ success: false, message: 'node_id query param required' });
  }

  // Verify node exists
  const [nodeCheckRows] = await pool.query('SELECT id, name, part_number, parent_id FROM nodes WHERE id = ?', [nodeId]);
  if (nodeCheckRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  let targetNodeIds = [nodeId];
  let ancestorChain = []; // [{id, name, part_number}] ordered from immediate parent → root

  if (inherited) {
    // Walk up the ancestor chain
    const [ancestorRows] = await pool.query(`
      WITH RECURSIVE ancestors AS (
        SELECT id, name, part_number, parent_id, 1 AS depth
        FROM nodes
        WHERE id = (SELECT parent_id FROM nodes WHERE id = ?)

        UNION ALL

        SELECT n.id, n.name, n.part_number, n.parent_id, a.depth + 1
        FROM nodes n
        INNER JOIN ancestors a ON n.id = a.parent_id
      )
      SELECT id, name, part_number, depth FROM ancestors ORDER BY depth ASC
    `, [nodeId]);

    ancestorChain = ancestorRows;
    targetNodeIds = [nodeId, ...ancestorChain.map(a => a.id)];
  }

  // Fetch requirements for all target nodes
  const [reqRows] = await pool.query(`
    SELECT r.*,
           n.name AS node_name,
           n.part_number AS node_part_number
    FROM requirements r
    JOIN nodes n ON n.id = r.node_id
    WHERE r.node_id IN (?)
    ORDER BY (r.node_id = ?) DESC, r.created_at ASC
  `, [targetNodeIds, nodeId]);

  const reqIds = reqRows.map(r => r.id);

  // Fetch traces
  let tracesMap = {};
  if (reqIds.length > 0) {
    const [traceRows] = await pool.query(`
      SELECT * FROM requirement_traces WHERE requirement_id IN (?) ORDER BY created_at ASC
    `, [reqIds]);
    traceRows.forEach(t => {
      if (!tracesMap[t.requirement_id]) tracesMap[t.requirement_id] = [];
      tracesMap[t.requirement_id].push(t);
    });
  }

  // Fetch derivation links
  const { parentsMap, childrenMap } = await fetchDerivations(pool, reqIds);

  // Annotate each requirement
  const requirements = reqRows.map(r => ({
    ...r,
    traces: tracesMap[r.id] || [],
    parents: parentsMap[r.id] || [],
    children: childrenMap[r.id] || [],
    inherited: r.node_id !== nodeId,
    inherited_from: r.node_id !== nodeId
      ? { id: r.node_id, name: r.node_name, part_number: r.node_part_number }
      : null
  }));

  // Coverage stats
  const own = requirements.filter(r => !r.inherited);
  const all = requirements;
  const coverage = {
    own_total: own.length,
    own_verified: own.filter(r => r.status === 'verified').length,
    own_open: own.filter(r => r.status === 'open').length,
    all_total: all.length,
    all_verified: all.filter(r => r.status === 'verified').length
  };

  res.json({ success: true, requirements, coverage });
});

/**
 * GET /api/requirements/coverage?node_id=X
 * Quick coverage summary (includes inherited).
 */
router.get('/coverage', async (req, res) => {
  const pool = req.app.locals.pool;
  const nodeId = parseInt(req.query.node_id);

  if (!nodeId || isNaN(nodeId)) {
    return res.status(400).json({ success: false, message: 'node_id required' });
  }

  // Get all ancestor node IDs
  const [ancestorRows] = await pool.query(`
    WITH RECURSIVE ancestors AS (
      SELECT id FROM nodes WHERE id = ?
      UNION ALL
      SELECT n.id FROM nodes n INNER JOIN ancestors a ON n.id = (SELECT parent_id FROM nodes WHERE id = a.id)
    )
    SELECT id FROM ancestors
  `, [nodeId]);

  const nodeIds = ancestorRows.map(r => r.id);

  const [statsRows] = await pool.query(`
    SELECT
      SUM(CASE WHEN node_id = ? THEN 1 ELSE 0 END)                              AS own_total,
      SUM(CASE WHEN node_id = ? AND status = 'verified' THEN 1 ELSE 0 END)      AS own_verified,
      COUNT(*)                                                                    AS all_total,
      SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END)                      AS all_verified
    FROM requirements
    WHERE node_id IN (?)
  `, [nodeId, nodeId, nodeIds]);

  res.json({ success: true, coverage: statsRows[0] });
});

/**
 * GET /api/requirements/project?project_id=X
 *
 * Returns all requirements in a project, ordered by req_id.
 * Used by the "Derived From" searchable dropdown in the requirement form.
 */
router.get('/project', async (req, res) => {
  const pool = req.app.locals.pool;
  const projectId = parseInt(req.query.project_id);

  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({ success: false, message: 'project_id query param required' });
  }

  const [rows] = await pool.query(`
    SELECT r.id, r.req_id, r.title, r.node_id,
           n.name AS node_name, n.part_number AS node_part_number
    FROM requirements r
    JOIN nodes n ON n.id = r.node_id
    JOIN project_nodes pn ON pn.node_id = n.id
    WHERE pn.project_id = ?
    ORDER BY r.req_id ASC
  `, [projectId]);

  res.json({ success: true, requirements: rows });
});

/**
 * POST /api/requirements
 * Create a requirement on a node.
 * Optional fields: source, parent_requirement_ids (array of req IDs)
 */
router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const {
    node_id,
    title,
    description,
    verification_method = 'test',
    status = 'open',
    priority = 'shall',
    source,
    parent_requirement_ids
  } = req.body;

  if (!node_id || !title) {
    return res.status(400).json({ success: false, message: 'node_id and title are required' });
  }

  if (!VALID_VERIFICATION_METHODS.includes(verification_method)) {
    return res.status(400).json({
      success: false,
      message: `verification_method must be one of: ${VALID_VERIFICATION_METHODS.join(', ')}`
    });
  }
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `priority must be one of: ${VALID_PRIORITIES.join(', ')}`
    });
  }

  // Verify node exists
  const [nodeCheckRows] = await pool.query('SELECT id FROM nodes WHERE id = ?', [node_id]);
  if (nodeCheckRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  // RBAC: editor or admin required
  const projectId = await getProjectForNode(pool, node_id);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  // Get next sequence value for req_id
  // Use a table-based sequence or just generate from MAX
  const [seqRows] = await pool.query('SELECT COALESCE(MAX(CAST(SUBSTRING(req_id, 5) AS UNSIGNED)), 0) + 1 AS next_val FROM requirements');
  const nextVal = seqRows[0].next_val;
  const reqIdStr = 'REQ-' + String(nextVal).padStart(4, '0');

  const [insertResult] = await pool.query(
    `INSERT INTO requirements (node_id, req_id, title, description, verification_method, status, priority, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [node_id, reqIdStr, title, description || null, verification_method, status, priority, source || null]
  );

  const [newReqRows] = await pool.query(`
    SELECT r.*, n.name AS node_name, n.part_number AS node_part_number
    FROM requirements r
    JOIN nodes n ON n.id = r.node_id
    WHERE r.id = ?
  `, [insertResult.insertId]);

  const newReq = newReqRows[0];

  // Set derivation parents if provided
  if (Array.isArray(parent_requirement_ids) && parent_requirement_ids.length > 0) {
    await setDerivationParents(pool, newReq.id, parent_requirement_ids);
  }

  // Fetch derivation data for response
  const { parentsMap, childrenMap } = await fetchDerivations(pool, [newReq.id]);

  res.status(201).json({
    success: true,
    requirement: {
      ...newReq,
      traces: [],
      parents: parentsMap[newReq.id] || [],
      children: childrenMap[newReq.id] || []
    }
  });
});

/**
 * PUT /api/requirements/:id
 * Update a requirement. All fields optional.
 * Supply parent_requirement_ids array to replace derivation links.
 */
router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid requirement id' });
  }

  const [existingRows] = await pool.query('SELECT * FROM requirements WHERE id = ?', [id]);
  if (existingRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Requirement not found' });
  }

  // RBAC: editor or admin required
  const projectId = await getProjectForRequirement(pool, id);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  const { title, description, verification_method, status, priority, source, parent_requirement_ids } = req.body;

  if (verification_method && !VALID_VERIFICATION_METHODS.includes(verification_method)) {
    return res.status(400).json({
      success: false,
      message: `verification_method must be one of: ${VALID_VERIFICATION_METHODS.join(', ')}`
    });
  }
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_STATUSES.join(', ')}`
    });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `priority must be one of: ${VALID_PRIORITIES.join(', ')}`
    });
  }

  const updates = [];
  const values = [];

  if (title !== undefined) { updates.push(`title = ?`); values.push(title); }
  if (description !== undefined) { updates.push(`description = ?`); values.push(description || null); }
  if (verification_method !== undefined) { updates.push(`verification_method = ?`); values.push(verification_method); }
  if (status !== undefined) { updates.push(`status = ?`); values.push(status); }
  if (priority !== undefined) { updates.push(`priority = ?`); values.push(priority); }
  if (source !== undefined) { updates.push(`source = ?`); values.push(source || null); }

  // Update derivation parents if provided
  if (Array.isArray(parent_requirement_ids)) {
    await setDerivationParents(pool, Number(id), parent_requirement_ids);
  }

  if (updates.length === 0 && !Array.isArray(parent_requirement_ids)) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  let updatedReq;
  if (updates.length > 0) {
    updates.push(`updated_at = NOW()`);
    values.push(id);

    await pool.query(
      `UPDATE requirements SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    const [updatedRows] = await pool.query('SELECT * FROM requirements WHERE id = ?', [id]);
    updatedReq = updatedRows[0];
  } else {
    updatedReq = existingRows[0];
  }

  // Fetch traces
  const [traceRows] = await pool.query(
    'SELECT * FROM requirement_traces WHERE requirement_id = ? ORDER BY created_at ASC',
    [id]
  );

  // Fetch derivation data
  const { parentsMap, childrenMap } = await fetchDerivations(pool, [Number(id)]);

  res.json({
    success: true,
    requirement: {
      ...updatedReq,
      traces: traceRows,
      parents: parentsMap[Number(id)] || [],
      children: childrenMap[Number(id)] || []
    }
  });
});

/**
 * DELETE /api/requirements/:id
 */
router.delete('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid requirement id' });
  }

  const [existingRows] = await pool.query('SELECT * FROM requirements WHERE id = ?', [id]);
  if (existingRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Requirement not found' });
  }

  // RBAC: editor or admin required
  const projectId = await getProjectForRequirement(pool, id);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  await pool.query('DELETE FROM requirements WHERE id = ?', [id]);
  res.json({ success: true, message: 'Requirement deleted', requirement: existingRows[0] });
});

/**
 * POST /api/requirements/:id/traces
 * Add a traceability record to a requirement.
 */
router.post('/:id/traces', async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const { phase, evidence } = req.body;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid requirement id' });
  }
  if (!phase) {
    return res.status(400).json({ success: false, message: 'phase is required' });
  }

  const [existingRows] = await pool.query('SELECT id FROM requirements WHERE id = ?', [id]);
  if (existingRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Requirement not found' });
  }

  // RBAC: editor or admin required
  const projectId = await getProjectForRequirement(pool, id);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  const [insertResult] = await pool.query(
    `INSERT INTO requirement_traces (requirement_id, phase, evidence) VALUES (?, ?, ?)`,
    [id, phase.trim(), evidence ? evidence.trim() : null]
  );

  const [traceRows] = await pool.query('SELECT * FROM requirement_traces WHERE id = ?', [insertResult.insertId]);

  res.status(201).json({ success: true, trace: traceRows[0] });
});

/**
 * DELETE /api/requirement-traces/:traceId
 */
router.delete('/traces/:traceId', async (req, res) => {
  const pool = req.app.locals.pool;
  const { traceId } = req.params;

  if (!Number.isInteger(Number(traceId)) || Number(traceId) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid trace id' });
  }

  const [existingRows] = await pool.query('SELECT * FROM requirement_traces WHERE id = ?', [traceId]);
  if (existingRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Trace not found' });
  }

  // RBAC: editor or admin required
  const projectId = await getProjectForTrace(pool, traceId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  await pool.query('DELETE FROM requirement_traces WHERE id = ?', [traceId]);
  res.json({ success: true, message: 'Trace deleted' });
});

/**
 * POST /api/requirements/:id/derivations
 * Add a single parent derivation link.
 * Body: { parent_requirement_id: number }
 */
router.post('/:id/derivations', async (req, res) => {
  const pool = req.app.locals.pool;
  const childId = parseInt(req.params.id);
  const { parent_requirement_id } = req.body;

  if (!Number.isInteger(childId) || childId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid requirement id' });
  }
  if (!parent_requirement_id || !Number.isInteger(Number(parent_requirement_id))) {
    return res.status(400).json({ success: false, message: 'parent_requirement_id is required' });
  }
  if (childId === Number(parent_requirement_id)) {
    return res.status(400).json({ success: false, message: 'A requirement cannot be derived from itself' });
  }

  const [childCheckRows] = await pool.query('SELECT id FROM requirements WHERE id = ?', [childId]);
  if (childCheckRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Requirement not found' });
  }
  const [parentCheckRows] = await pool.query('SELECT id FROM requirements WHERE id = ?', [parent_requirement_id]);
  if (parentCheckRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Parent requirement not found' });
  }

  const projectId = await getProjectForRequirement(pool, childId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  await pool.query(
    'INSERT IGNORE INTO requirement_derivations (parent_requirement_id, child_requirement_id) VALUES (?, ?)',
    [parent_requirement_id, childId]
  );

  res.status(201).json({ success: true, message: 'Derivation link added' });
});

/**
 * DELETE /api/requirements/:id/derivations/:parentId
 * Remove a parent derivation link.
 */
router.delete('/:id/derivations/:parentId', async (req, res) => {
  const pool = req.app.locals.pool;
  const childId = parseInt(req.params.id);
  const parentId = parseInt(req.params.parentId);

  if (!Number.isInteger(childId) || childId <= 0 || !Number.isInteger(parentId) || parentId <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid requirement id' });
  }

  const projectId = await getProjectForRequirement(pool, childId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  await pool.query(
    'DELETE FROM requirement_derivations WHERE parent_requirement_id = ? AND child_requirement_id = ?',
    [parentId, childId]
  );

  res.json({ success: true, message: 'Derivation link removed' });
});

module.exports = router;
