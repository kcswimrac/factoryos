/**
 * Node Renders Routes
 * GET    /api/nodes/:nodeId/renders         - List all renders for a node
 * POST   /api/nodes/:nodeId/renders         - Add a render (url or base64)
 * PATCH  /api/nodes/:nodeId/renders/:id     - Update label
 * DELETE /api/nodes/:nodeId/renders/:id     - Delete a render
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { requireRole } = require('../middleware/rbac');

// GET /api/nodes/:nodeId/renders
router.get('/:nodeId/renders', async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT id, node_id, label, source_type, url, base64, mime_type, file_size, position, created_at
       FROM node_renders
       WHERE node_id = ?
       ORDER BY position ASC, created_at ASC`,
      [nodeId]
    );
    res.json({ success: true, renders: rows });
  } catch (e) {
    console.error('[Renders] GET error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/nodes/:nodeId/renders
router.post('/:nodeId/renders', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId } = req.params;
  const { label = '', source_type = 'url', url, base64, mime_type = 'image/jpeg', file_size } = req.body;

  if (source_type === 'url' && !url) {
    return res.status(400).json({ success: false, message: 'URL is required for url-type renders' });
  }
  if (source_type === 'base64' && !base64) {
    return res.status(400).json({ success: false, message: 'base64 data is required for uploaded renders' });
  }

  // Enforce 5MB limit on base64 payloads (~6.67MB base64 = 5MB binary)
  if (base64 && base64.length > 6_800_000) {
    return res.status(413).json({ success: false, message: 'Image exceeds 5MB size limit' });
  }

  try {
    const [posRows] = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM node_renders WHERE node_id = ?',
      [nodeId]
    );
    const position = posRows[0].next_pos;

    const [result] = await pool.query(
      `INSERT INTO node_renders (node_id, label, source_type, url, base64, mime_type, file_size, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nodeId, label, source_type, url || null, base64 || null, mime_type, file_size || null, position]
    );
    const [insertedRows] = await pool.query(
      `SELECT id, label, source_type, url, mime_type, file_size, position, created_at
       FROM node_renders WHERE id = ?`,
      [result.insertId]
    );
    res.json({ success: true, render: insertedRows[0] });
  } catch (e) {
    console.error('[Renders] POST error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// PATCH /api/nodes/:nodeId/renders/:renderId - update label
router.patch('/:nodeId/renders/:renderId', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId, renderId } = req.params;
  const { label } = req.body;

  try {
    await pool.query(
      'UPDATE node_renders SET label = ? WHERE id = ? AND node_id = ?',
      [label || '', renderId, nodeId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[Renders] PATCH error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// DELETE /api/nodes/:nodeId/renders/:renderId
router.delete('/:nodeId/renders/:renderId', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId, renderId } = req.params;

  try {
    await pool.query(
      'DELETE FROM node_renders WHERE id = ? AND node_id = ?',
      [renderId, nodeId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[Renders] DELETE error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
