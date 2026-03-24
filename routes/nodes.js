/**
 * Node Engine API Routes
 *
 * Nodes represent design entities in the Factory-OS hierarchy:
 *   SYS → ASSY → SUBASSY → COMP
 *   PURCH, DOC, SUBSYS also supported
 *
 * Part numbers are user-assigned and unique (manually controlled by engineers).
 */

const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/rbac');

const VALID_TYPES = ['ASSY', 'SYS', 'SUBSYS', 'SUBASSY', 'COMP', 'PURCH', 'DOC'];

/**
 * Build a tree from a flat array of nodes.
 * O(n) using a map.
 */
function buildTree(rows) {
  const map = {};
  const roots = [];

  rows.forEach(row => {
    map[row.id] = { ...row, children: [] };
  });

  rows.forEach(row => {
    if (row.parent_id && map[row.parent_id]) {
      map[row.parent_id].children.push(map[row.id]);
    } else {
      roots.push(map[row.id]);
    }
  });

  return roots;
}

/**
 * POST /api/nodes
 * Create a new node. Requires editor role on the project.
 */
router.post('/', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, part_number, type, description, parent_id, project_id } = req.body;

  // Validate required fields
  if (!name || !part_number || !type) {
    return res.status(400).json({
      success: false,
      message: 'name, part_number, and type are required'
    });
  }

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `type must be one of: ${VALID_TYPES.join(', ')}`
    });
  }

  // Validate parent exists if provided
  if (parent_id !== undefined && parent_id !== null) {
    const [parentRows] = await pool.query('SELECT id FROM nodes WHERE id = ?', [parent_id]);
    if (parentRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Parent node with id ${parent_id} does not exist`
      });
    }
  }

  try {
    const [insertResult] = await pool.query(
      `INSERT INTO nodes (name, part_number, type, description, parent_id, project_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, part_number, type, description || null, parent_id || null, project_id || null]
    );

    const [nodeRows] = await pool.query('SELECT * FROM nodes WHERE id = ?', [insertResult.insertId]);

    res.status(201).json({ success: true, node: nodeRows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      // Unique constraint violation on part_number
      return res.status(409).json({
        success: false,
        message: `Part number '${part_number}' already exists`
      });
    }
    throw err;
  }
});

/**
 * GET /api/nodes
 * List all nodes.
 * ?tree=true  → return nested tree structure
 * ?tree=false → return flat array (default)
 */
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const tree = req.query.tree === 'true';

  const [rows] = await pool.query(
    'SELECT * FROM nodes ORDER BY part_number ASC'
  );

  if (tree) {
    const treeData = buildTree(rows);
    return res.json({ success: true, nodes: treeData, count: rows.length });
  }

  res.json({ success: true, nodes: rows, count: rows.length });
});

/**
 * GET /api/nodes/:id
 * Get a single node with all its direct children.
 * Uses a recursive CTE to fetch all descendants (full subtree).
 */
router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid node id' });
  }

  // Get the node itself
  const [nodeRows] = await pool.query('SELECT * FROM nodes WHERE id = ?', [id]);

  if (nodeRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  // Recursive CTE to get all descendants at all depths
  const [subtreeRows] = await pool.query(`
    WITH RECURSIVE subtree AS (
      -- Anchor: direct children
      SELECT *, 1 AS depth
      FROM nodes
      WHERE parent_id = ?

      UNION ALL

      -- Recursive: children of children
      SELECT n.*, s.depth + 1
      FROM nodes n
      INNER JOIN subtree s ON n.parent_id = s.id
    )
    SELECT * FROM subtree ORDER BY depth ASC, part_number ASC
  `, [id]);

  const node = nodeRows[0];
  node.children_flat = subtreeRows;
  node.children = buildTree([node, ...subtreeRows]).find(n => n.id === node.id)?.children || [];

  res.json({ success: true, node });
});

/**
 * PUT /api/nodes/:id
 * Update a node. Requires editor role on the project.
 */
router.put('/:id', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const { name, part_number, type, description, parent_id } = req.body;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid node id' });
  }

  // Ensure node exists
  const [existingRows] = await pool.query('SELECT * FROM nodes WHERE id = ?', [id]);
  if (existingRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  // Validate type if provided
  if (type && !VALID_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `type must be one of: ${VALID_TYPES.join(', ')}`
    });
  }

  // Prevent circular reference: new parent_id must not be a descendant of this node
  if (parent_id !== undefined && parent_id !== null && parent_id != existingRows[0].parent_id) {
    // Can't set parent to self
    if (Number(parent_id) === Number(id)) {
      return res.status(400).json({ success: false, message: 'A node cannot be its own parent' });
    }

    // Check if parent_id is a descendant of this node
    const [circularRows] = await pool.query(`
      WITH RECURSIVE descendants AS (
        SELECT id FROM nodes WHERE parent_id = ?
        UNION ALL
        SELECT n.id FROM nodes n INNER JOIN descendants d ON n.parent_id = d.id
      )
      SELECT id FROM descendants WHERE id = ?
    `, [id, parent_id]);

    if (circularRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot set parent to a descendant of this node (would create circular reference)'
      });
    }

    // Validate parent exists
    const [parentRows] = await pool.query('SELECT id FROM nodes WHERE id = ?', [parent_id]);
    if (parentRows.length === 0) {
      return res.status(400).json({ success: false, message: `Parent node ${parent_id} does not exist` });
    }
  }

  // Build dynamic update
  const updates = [];
  const values = [];

  if (name !== undefined) { updates.push(`name = ?`); values.push(name); }
  if (part_number !== undefined) { updates.push(`part_number = ?`); values.push(part_number); }
  if (type !== undefined) { updates.push(`type = ?`); values.push(type); }
  if (description !== undefined) { updates.push(`description = ?`); values.push(description); }
  if (parent_id !== undefined) { updates.push(`parent_id = ?`); values.push(parent_id || null); }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  try {
    await pool.query(
      `UPDATE nodes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedRows] = await pool.query('SELECT * FROM nodes WHERE id = ?', [id]);

    res.json({ success: true, node: updatedRows[0] });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: `Part number '${part_number}' already exists`
      });
    }
    throw err;
  }
});

/**
 * DELETE /api/nodes/:id
 * Delete a node. Requires editor role. Blocked if it has children.
 */
router.delete('/:id', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;

  if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid node id' });
  }

  // Check exists
  const [existingRows] = await pool.query('SELECT * FROM nodes WHERE id = ?', [id]);
  if (existingRows.length === 0) {
    return res.status(404).json({ success: false, message: 'Node not found' });
  }

  // Block if has children
  const [childRows] = await pool.query('SELECT id FROM nodes WHERE parent_id = ? LIMIT 1', [id]);
  if (childRows.length > 0) {
    return res.status(409).json({
      success: false,
      message: 'Cannot delete node with children. Remove or re-parent children first.'
    });
  }

  await pool.query('DELETE FROM nodes WHERE id = ?', [id]);

  res.json({ success: true, message: 'Node deleted', node: existingRows[0] });
});

module.exports = router;
