/**
 * Discovery Workspace API
 *
 * GET    /api/projects/:projectId/discovery           — list all objects
 * POST   /api/projects/:projectId/discovery           — create object
 * GET    /api/projects/:projectId/discovery/:id       — get single object (with attachments)
 * PUT    /api/projects/:projectId/discovery/:id       — update object
 * DELETE /api/projects/:projectId/discovery/:id       — delete object
 *
 * POST   /api/projects/:projectId/discovery/:id/attachments      — add attachment
 * DELETE /api/projects/:projectId/discovery/:id/attachments/:aid — remove attachment
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { getProjectRole } = require('../middleware/rbac');

const VALID_TYPES = [
  'concept', 'mechanism', 'candidate_part', 'experiment',
  'observation', 'trade_study', 'interface_hypothesis', 'functional_chunk'
];
const VALID_MATURITY    = ['raw', 'repeatable', 'promotable', 'formal'];
const VALID_CONFIDENCE  = ['low', 'medium', 'high'];

// ── Helper: verify project access + return role ───────────────────────────────
async function requireProjectAccess(req, res, minRole) {
  const pool      = req.app.locals.pool;
  const userId    = req.user?.id || null;
  const projectId = parseInt(req.params.projectId);
  if (!projectId || isNaN(projectId)) {
    res.status(400).json({ success: false, message: 'Invalid project id' });
    return null;
  }

  // Check project exists
  const [prRows] = await pool.query(
    `SELECT p.*, t.is_demo FROM projects p LEFT JOIN teams t ON t.id = p.team_id WHERE p.id = ?`,
    [projectId]
  );
  if (!prRows.length) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return null;
  }
  const project = prRows[0];

  if (project.is_demo) return { projectId, role: 'viewer' };

  // Get user role
  const role = await getProjectRole(pool, projectId, userId);
  if (!role) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return null;
  }

  const roleRank = { viewer: 0, editor: 1, admin: 2 };
  const minRank  = roleRank[minRole] ?? 0;
  if ((roleRank[role] ?? -1) < minRank) {
    res.status(403).json({ success: false, message: 'Insufficient permissions' });
    return null;
  }

  return { projectId, role };
}

// ── GET /api/projects/:projectId/discovery ────────────────────────────────────
router.get('/', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'viewer');
  if (!ctx) return;

  const pool      = req.app.locals.pool;
  const { projectId } = ctx;

  const { type, maturity, confidence } = req.query;

  let where = 'WHERE d.project_id = ?';
  const params = [projectId];

  if (type && VALID_TYPES.includes(type)) {
    params.push(type);
    where += ` AND d.type = ?`;
  }
  if (maturity && VALID_MATURITY.includes(maturity)) {
    params.push(maturity);
    where += ` AND d.maturity = ?`;
  }
  if (confidence && VALID_CONFIDENCE.includes(confidence)) {
    params.push(confidence);
    where += ` AND d.confidence = ?`;
  }

  const [rows] = await pool.query(`
    SELECT
      d.*,
      COALESCE(
        JSON_ARRAYAGG(
          IF(a.id IS NOT NULL,
            JSON_OBJECT('id', a.id, 'object_id', a.object_id, 'url', a.url, 'label', a.label, 'created_at', a.created_at),
            NULL)
        ),
        JSON_ARRAY()
      ) AS attachments
    FROM discovery_objects d
    LEFT JOIN discovery_attachments a ON a.object_id = d.id
    ${where}
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `, params);

  // Clean up null entries from JSON_ARRAYAGG
  for (const row of rows) {
    if (Array.isArray(row.attachments)) {
      row.attachments = row.attachments.filter(a => a !== null);
    } else if (typeof row.attachments === 'string') {
      try {
        const parsed = JSON.parse(row.attachments);
        row.attachments = Array.isArray(parsed) ? parsed.filter(a => a !== null) : [];
      } catch(e) { row.attachments = []; }
    }
  }

  res.json({ success: true, objects: rows });
});

// ── POST /api/projects/:projectId/discovery ───────────────────────────────────
router.post('/', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool      = req.app.locals.pool;
  const { projectId } = ctx;
  const userId    = req.user?.id || null;

  const { title, description, type, maturity, confidence, tags } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }

  const resolvedType       = VALID_TYPES.includes(type)       ? type       : 'concept';
  const resolvedMaturity   = VALID_MATURITY.includes(maturity) ? maturity   : 'raw';
  const resolvedConfidence = VALID_CONFIDENCE.includes(confidence) ? confidence : 'low';
  const resolvedTags       = Array.isArray(tags) ? JSON.stringify(tags) : '[]';

  const [result] = await pool.query(`
    INSERT INTO discovery_objects
      (project_id, title, description, type, maturity, confidence, tags, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    projectId,
    title.trim(),
    description?.trim() || null,
    resolvedType,
    resolvedMaturity,
    resolvedConfidence,
    resolvedTags,
    userId
  ]);

  const [newRows] = await pool.query('SELECT * FROM discovery_objects WHERE id = ?', [result.insertId]);
  res.json({ success: true, object: { ...newRows[0], attachments: [] } });
});

// ── GET /api/projects/:projectId/discovery/:id ────────────────────────────────
router.get('/:id', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'viewer');
  if (!ctx) return;

  const pool      = req.app.locals.pool;
  const { projectId } = ctx;
  const objId     = parseInt(req.params.id);

  const [rows] = await pool.query(`
    SELECT
      d.*,
      COALESCE(
        JSON_ARRAYAGG(
          IF(a.id IS NOT NULL,
            JSON_OBJECT('id', a.id, 'object_id', a.object_id, 'url', a.url, 'label', a.label, 'created_at', a.created_at),
            NULL)
        ),
        JSON_ARRAY()
      ) AS attachments
    FROM discovery_objects d
    LEFT JOIN discovery_attachments a ON a.object_id = d.id
    WHERE d.id = ? AND d.project_id = ?
    GROUP BY d.id
  `, [objId, projectId]);

  if (!rows.length) {
    return res.status(404).json({ success: false, message: 'Object not found' });
  }

  const obj = rows[0];
  if (Array.isArray(obj.attachments)) {
    obj.attachments = obj.attachments.filter(a => a !== null);
  } else if (typeof obj.attachments === 'string') {
    try {
      const parsed = JSON.parse(obj.attachments);
      obj.attachments = Array.isArray(parsed) ? parsed.filter(a => a !== null) : [];
    } catch(e) { obj.attachments = []; }
  }

  res.json({ success: true, object: obj });
});

// ── PUT /api/projects/:projectId/discovery/:id ────────────────────────────────
router.put('/:id', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool      = req.app.locals.pool;
  const { projectId } = ctx;
  const objId     = parseInt(req.params.id);

  // Verify ownership
  const [existing] = await pool.query(
    `SELECT id FROM discovery_objects WHERE id = ? AND project_id = ?`,
    [objId, projectId]
  );
  if (!existing.length) {
    return res.status(404).json({ success: false, message: 'Object not found' });
  }

  const { title, description, type, maturity, confidence, tags, functional_cluster } = req.body;

  // Build SET clause dynamically (only update provided fields)
  const sets = [];
  const params = [];

  if (title !== undefined) {
    if (!title.trim()) return res.status(400).json({ success: false, message: 'title cannot be empty' });
    params.push(title.trim());
    sets.push(`title = ?`);
  }
  if (description !== undefined) {
    params.push(description?.trim() || null);
    sets.push(`description = ?`);
  }
  if (type !== undefined && VALID_TYPES.includes(type)) {
    params.push(type);
    sets.push(`type = ?`);
  }
  if (maturity !== undefined && VALID_MATURITY.includes(maturity)) {
    params.push(maturity);
    sets.push(`maturity = ?`);
  }
  if (confidence !== undefined && VALID_CONFIDENCE.includes(confidence)) {
    params.push(confidence);
    sets.push(`confidence = ?`);
  }
  if (tags !== undefined && Array.isArray(tags)) {
    params.push(JSON.stringify(tags));
    sets.push(`tags = ?`);
  }
  if (functional_cluster !== undefined) {
    params.push(functional_cluster ? functional_cluster.trim() || null : null);
    sets.push(`functional_cluster = ?`);
  }

  if (!sets.length) {
    return res.status(400).json({ success: false, message: 'No valid fields to update' });
  }

  sets.push(`updated_at = NOW()`);
  params.push(objId);

  await pool.query(
    `UPDATE discovery_objects SET ${sets.join(', ')} WHERE id = ?`,
    params
  );

  const [updatedRows] = await pool.query('SELECT * FROM discovery_objects WHERE id = ?', [objId]);
  res.json({ success: true, object: updatedRows[0] });
});

// ── DELETE /api/projects/:projectId/discovery/:id ─────────────────────────────
router.delete('/:id', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool      = req.app.locals.pool;
  const { projectId } = ctx;
  const objId     = parseInt(req.params.id);

  const [existing] = await pool.query(
    `SELECT id FROM discovery_objects WHERE id = ? AND project_id = ?`,
    [objId, projectId]
  );

  if (!existing.length) {
    return res.status(404).json({ success: false, message: 'Object not found' });
  }

  await pool.query(
    `DELETE FROM discovery_objects WHERE id = ? AND project_id = ?`,
    [objId, projectId]
  );

  res.json({ success: true });
});

// ── POST /api/projects/:projectId/discovery/:id/attachments ───────────────────
router.post('/:id/attachments', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool      = req.app.locals.pool;
  const { projectId } = ctx;
  const objId     = parseInt(req.params.id);
  const { url, label } = req.body;

  if (!url) return res.status(400).json({ success: false, message: 'url is required' });

  // Verify object belongs to this project
  const [check] = await pool.query(
    `SELECT id FROM discovery_objects WHERE id = ? AND project_id = ?`,
    [objId, projectId]
  );
  if (!check.length) {
    return res.status(404).json({ success: false, message: 'Object not found' });
  }

  const [result] = await pool.query(
    `INSERT INTO discovery_attachments (object_id, url, label) VALUES (?, ?, ?)`,
    [objId, url, label?.trim() || null]
  );

  const [newRows] = await pool.query('SELECT * FROM discovery_attachments WHERE id = ?', [result.insertId]);

  // Touch updated_at on parent object
  await pool.query(`UPDATE discovery_objects SET updated_at = NOW() WHERE id = ?`, [objId]);

  res.json({ success: true, attachment: newRows[0] });
});

// ── DELETE /api/projects/:projectId/discovery/:id/attachments/:aid ────────────
router.delete('/:id/attachments/:aid', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool      = req.app.locals.pool;
  const { projectId } = ctx;
  const objId     = parseInt(req.params.id);
  const aidId     = parseInt(req.params.aid);

  // Verify object belongs to project
  const [check] = await pool.query(
    `SELECT id FROM discovery_objects WHERE id = ? AND project_id = ?`,
    [objId, projectId]
  );
  if (!check.length) {
    return res.status(404).json({ success: false, message: 'Object not found' });
  }

  const [existing] = await pool.query(
    `SELECT id FROM discovery_attachments WHERE id = ? AND object_id = ?`,
    [aidId, objId]
  );
  if (!existing.length) {
    return res.status(404).json({ success: false, message: 'Attachment not found' });
  }

  await pool.query(
    `DELETE FROM discovery_attachments WHERE id = ? AND object_id = ?`,
    [aidId, objId]
  );

  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════
// PHASE 2A — GRAPH (objects + relationship edges)
// GET /api/projects/:projectId/discovery/graph
// ══════════════════════════════════════════════════════════════════════════
router.get('/graph', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'viewer');
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;

  const [nodes, edges] = await Promise.all([
    pool.query(
      `SELECT id, title, type, maturity, confidence, functional_cluster
       FROM discovery_objects WHERE project_id = ? ORDER BY id`,
      [projectId]
    ).then(([rows]) => rows),
    pool.query(
      `SELECT r.id, r.source_object_id, r.target_object_id,
              r.relationship_type, r.notes
       FROM discovery_relationships r
       JOIN discovery_objects o ON o.id = r.source_object_id
       WHERE o.project_id = ?`,
      [projectId]
    ).then(([rows]) => rows),
  ]);

  res.json({ success: true, nodes, edges });
});

// ── POST   /api/projects/:projectId/discovery/relationships ──────────────
const VALID_REL_TYPES = [
  'interacts_with', 'depends_on', 'supports', 'conflicts_with',
  'candidate_for', 'derived_from', 'validated_by',
];

router.post('/relationships', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;
  const { source_object_id, target_object_id, relationship_type, notes } = req.body;

  if (!source_object_id || !target_object_id || !relationship_type) {
    return res.status(400).json({ success: false, message: 'source_object_id, target_object_id, and relationship_type required' });
  }
  if (!VALID_REL_TYPES.includes(relationship_type)) {
    return res.status(400).json({ success: false, message: `relationship_type must be one of: ${VALID_REL_TYPES.join(', ')}` });
  }
  if (source_object_id === target_object_id) {
    return res.status(400).json({ success: false, message: 'Cannot link an object to itself' });
  }

  // Verify both objects belong to this project
  const [checkRows] = await pool.query(
    `SELECT id FROM discovery_objects WHERE id IN (?, ?) AND project_id = ?`,
    [source_object_id, target_object_id, projectId]
  );
  if (checkRows.length < 2) {
    return res.status(400).json({ success: false, message: 'One or both objects not found in this project' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO discovery_relationships (source_object_id, target_object_id, relationship_type, notes)
       VALUES (?, ?, ?, ?)`,
      [source_object_id, target_object_id, relationship_type, notes || null]
    );
    const [newRows] = await pool.query('SELECT * FROM discovery_relationships WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, relationship: newRows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'This relationship already exists' });
    }
    throw err;
  }
});

// ── DELETE /api/projects/:projectId/discovery/relationships/:id ──────────
router.delete('/relationships/:relId', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;
  const relId = parseInt(req.params.relId);

  // Verify relationship belongs to this project
  const [checkRows] = await pool.query(
    `SELECT r.id FROM discovery_relationships r
     JOIN discovery_objects o ON o.id = r.source_object_id
     WHERE r.id = ? AND o.project_id = ?`,
    [relId, projectId]
  );
  if (!checkRows.length) {
    return res.status(404).json({ success: false, message: 'Relationship not found' });
  }

  await pool.query(`DELETE FROM discovery_relationships WHERE id = ?`, [relId]);
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════
// PHASE 2B — ARCHITECTURES
// ══════════════════════════════════════════════════════════════════════════

// ── GET  /api/projects/:projectId/discovery/architectures ─────────────────
router.get('/architectures', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'viewer');
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;

  const [rows] = await pool.query(
    `SELECT a.*,
      COALESCE(
        (SELECT JSON_ARRAYAGG(JSON_OBJECT(
          'id', o.id, 'title', o.title, 'type', o.type,
          'maturity', o.maturity, 'functional_cluster', o.functional_cluster
        ))
        FROM discovery_architecture_objects dao
        JOIN discovery_objects o ON o.id = dao.object_id
        WHERE dao.architecture_id = a.id
        ), JSON_ARRAY()
      ) AS objects
     FROM discovery_architectures a
     WHERE a.project_id = ?
     ORDER BY a.created_at ASC`,
    [projectId]
  );

  // Parse objects if returned as string
  for (const row of rows) {
    if (typeof row.objects === 'string') {
      try { row.objects = JSON.parse(row.objects); } catch(e) { row.objects = []; }
    }
  }

  res.json({ success: true, architectures: rows });
});

// ── POST /api/projects/:projectId/discovery/architectures ─────────────────
router.post('/architectures', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;
  const { name, description, pros, cons, risks } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  const [result] = await pool.query(
    `INSERT INTO discovery_architectures (project_id, name, description, pros, cons, risks)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [projectId, name.trim(), description || null, pros || null, cons || null, risks || null]
  );
  const [newRows] = await pool.query('SELECT * FROM discovery_architectures WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, architecture: { ...newRows[0], objects: [] } });
});

// ── PUT  /api/projects/:projectId/discovery/architectures/:archId ─────────
router.put('/architectures/:archId', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;
  const archId = parseInt(req.params.archId);

  const [existing] = await pool.query(
    `SELECT id FROM discovery_architectures WHERE id = ? AND project_id = ?`,
    [archId, projectId]
  );
  if (!existing.length) {
    return res.status(404).json({ success: false, message: 'Architecture not found' });
  }

  const { name, description, pros, cons, risks, status, kill_reason } = req.body;
  const VALID_STATUS = ['active', 'selected', 'killed'];
  if (status && !VALID_STATUS.includes(status)) {
    return res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUS.join(', ')}` });
  }

  const sets = [], params = [];
  if (name !== undefined)        { params.push(name.trim());            sets.push(`name = ?`); }
  if (description !== undefined) { params.push(description || null);    sets.push(`description = ?`); }
  if (pros !== undefined)        { params.push(pros || null);           sets.push(`pros = ?`); }
  if (cons !== undefined)        { params.push(cons || null);           sets.push(`cons = ?`); }
  if (risks !== undefined)       { params.push(risks || null);          sets.push(`risks = ?`); }
  if (status)                    { params.push(status);                 sets.push(`status = ?`); }
  if (kill_reason !== undefined) { params.push(kill_reason || null);   sets.push(`kill_reason = ?`); }

  if (!sets.length) return res.status(400).json({ success: false, message: 'No fields to update' });

  sets.push(`updated_at = NOW()`);
  params.push(archId);

  await pool.query(
    `UPDATE discovery_architectures SET ${sets.join(', ')} WHERE id = ?`,
    params
  );
  const [updatedRows] = await pool.query('SELECT * FROM discovery_architectures WHERE id = ?', [archId]);
  res.json({ success: true, architecture: updatedRows[0] });
});

// ── DELETE /api/projects/:projectId/discovery/architectures/:archId ───────
router.delete('/architectures/:archId', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;
  const archId = parseInt(req.params.archId);

  const [existing] = await pool.query(
    `SELECT id FROM discovery_architectures WHERE id = ? AND project_id = ?`,
    [archId, projectId]
  );
  if (!existing.length) return res.status(404).json({ success: false, message: 'Architecture not found' });

  await pool.query(
    `DELETE FROM discovery_architectures WHERE id = ? AND project_id = ?`,
    [archId, projectId]
  );
  res.json({ success: true });
});

// ── POST /api/projects/:projectId/discovery/architectures/:archId/objects ──
router.post('/architectures/:archId/objects', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;
  const archId = parseInt(req.params.archId);
  const { object_id } = req.body;

  if (!object_id) return res.status(400).json({ success: false, message: 'object_id required' });

  const [[archRows], [objRows]] = await Promise.all([
    pool.query(`SELECT id FROM discovery_architectures WHERE id = ? AND project_id = ?`, [archId, projectId]),
    pool.query(`SELECT id FROM discovery_objects WHERE id = ? AND project_id = ?`, [object_id, projectId]),
  ]);
  if (!archRows.length) return res.status(404).json({ success: false, message: 'Architecture not found' });
  if (!objRows.length)  return res.status(400).json({ success: false, message: 'Object not found in this project' });

  try {
    await pool.query(
      `INSERT INTO discovery_architecture_objects (architecture_id, object_id) VALUES (?, ?)`,
      [archId, object_id]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Object already linked' });
    throw err;
  }
});

// ── DELETE /api/projects/:projectId/discovery/architectures/:archId/objects/:objId
router.delete('/architectures/:archId/objects/:objId', async (req, res) => {
  const ctx = await requireProjectAccess(req, res, 'editor');
  if (!ctx) return;

  const pool = req.app.locals.pool;
  const { projectId } = ctx;
  const archId = parseInt(req.params.archId);
  const objId  = parseInt(req.params.objId);

  const [arch] = await pool.query(
    `SELECT id FROM discovery_architectures WHERE id = ? AND project_id = ?`,
    [archId, projectId]
  );
  if (!arch.length) return res.status(404).json({ success: false, message: 'Architecture not found' });

  await pool.query(
    `DELETE FROM discovery_architecture_objects WHERE architecture_id = ? AND object_id = ?`,
    [archId, objId]
  );
  res.json({ success: true });
});

module.exports = router;
