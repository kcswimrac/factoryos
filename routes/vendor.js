/**
 * Vendor & Procurement Routes (PURCH nodes only)
 *
 * GET    /api/nodes/:nodeId/vendor           - Get vendor info + cutsheets
 * PUT    /api/nodes/:nodeId/vendor           - Upsert vendor info
 * GET    /api/nodes/:nodeId/cutsheets        - List cutsheets
 * POST   /api/nodes/:nodeId/cutsheets        - Upload cutsheet (PDF/image, base64)
 * PATCH  /api/nodes/:nodeId/cutsheets/:id    - Update label
 * DELETE /api/nodes/:nodeId/cutsheets/:id    - Delete cutsheet
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const { requireRole } = require('../middleware/rbac');

// 10 MB limit for cutsheets (PDFs can be larger than images)
const MAX_CUTSHEET_SIZE = 10 * 1024 * 1024;
const MAX_CUTSHEET_B64 = Math.ceil(MAX_CUTSHEET_SIZE * 4 / 3);

// ── GET /api/nodes/:nodeId/vendor ─────────────────────────────────────────────
router.get('/:nodeId/vendor', async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId } = req.params;
  try {
    const [vendorRes, cutsheetsRes] = await Promise.all([
      pool.query(
        `SELECT id, node_id, vendor_name, vendor_part_number, vendor_url,
                specs_summary, lead_time, unit_price, pricing_notes,
                sourcing_status, created_at, updated_at
         FROM node_vendor_info WHERE node_id = $1`,
        [nodeId]
      ),
      pool.query(
        `SELECT id, node_id, label, file_name, mime_type, file_size, position, created_at
         FROM node_cutsheets WHERE node_id = $1
         ORDER BY position ASC, created_at ASC`,
        [nodeId]
      )
    ]);
    res.json({
      success: true,
      vendor: vendorRes.rows[0] || null,
      cutsheets: cutsheetsRes.rows
    });
  } catch (e) {
    console.error('[Vendor] GET error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── PUT /api/nodes/:nodeId/vendor ─────────────────────────────────────────────
router.put('/:nodeId/vendor', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId } = req.params;
  const {
    vendor_name = null,
    vendor_part_number = null,
    vendor_url = null,
    specs_summary = null,
    lead_time = null,
    unit_price = null,
    pricing_notes = null,
    sourcing_status = 'evaluating'
  } = req.body;

  const VALID_STATUSES = ['evaluating', 'approved', 'preferred', 'obsolete', 'on_order'];
  const status = VALID_STATUSES.includes(sourcing_status) ? sourcing_status : 'evaluating';

  try {
    const result = await pool.query(
      `INSERT INTO node_vendor_info
         (node_id, vendor_name, vendor_part_number, vendor_url, specs_summary,
          lead_time, unit_price, pricing_notes, sourcing_status, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
       ON CONFLICT (node_id) DO UPDATE SET
         vendor_name        = EXCLUDED.vendor_name,
         vendor_part_number = EXCLUDED.vendor_part_number,
         vendor_url         = EXCLUDED.vendor_url,
         specs_summary      = EXCLUDED.specs_summary,
         lead_time          = EXCLUDED.lead_time,
         unit_price         = EXCLUDED.unit_price,
         pricing_notes      = EXCLUDED.pricing_notes,
         sourcing_status    = EXCLUDED.sourcing_status,
         updated_at         = now()
       RETURNING id, node_id, vendor_name, vendor_part_number, vendor_url,
                 specs_summary, lead_time, unit_price, pricing_notes,
                 sourcing_status, updated_at`,
      [nodeId, vendor_name, vendor_part_number, vendor_url, specs_summary,
       lead_time, unit_price || null, pricing_notes, status]
    );
    res.json({ success: true, vendor: result.rows[0] });
  } catch (e) {
    console.error('[Vendor] PUT error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── GET /api/nodes/:nodeId/cutsheets ──────────────────────────────────────────
// Returns metadata only (no base64) for listing
router.get('/:nodeId/cutsheets', async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, node_id, label, file_name, mime_type, file_size, position, created_at
       FROM node_cutsheets WHERE node_id = $1
       ORDER BY position ASC, created_at ASC`,
      [nodeId]
    );
    res.json({ success: true, cutsheets: result.rows });
  } catch (e) {
    console.error('[Vendor] GET cutsheets error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── POST /api/nodes/:nodeId/cutsheets ─────────────────────────────────────────
router.post('/:nodeId/cutsheets', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId } = req.params;
  const {
    label = '',
    file_name = '',
    base64,
    mime_type = 'application/pdf',
    file_size
  } = req.body;

  if (!base64) {
    return res.status(400).json({ success: false, message: 'base64 data is required' });
  }
  if (base64.length > MAX_CUTSHEET_B64) {
    return res.status(413).json({ success: false, message: 'File exceeds 10MB size limit' });
  }

  try {
    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM node_cutsheets WHERE node_id = $1',
      [nodeId]
    );
    const position = posResult.rows[0].next_pos;

    const result = await pool.query(
      `INSERT INTO node_cutsheets (node_id, label, file_name, base64, mime_type, file_size, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, node_id, label, file_name, mime_type, file_size, position, created_at`,
      [nodeId, label, file_name, base64, mime_type, file_size || null, position]
    );
    res.json({ success: true, cutsheet: result.rows[0] });
  } catch (e) {
    console.error('[Vendor] POST cutsheet error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── GET /api/nodes/:nodeId/cutsheets/:cutsheetId/download ─────────────────────
// Returns base64 data for viewing/download
router.get('/:nodeId/cutsheets/:cutsheetId/download', async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId, cutsheetId } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, label, file_name, base64, mime_type FROM node_cutsheets
       WHERE id = $1 AND node_id = $2`,
      [cutsheetId, nodeId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    const cs = result.rows[0];
    // Stream back as binary
    const buf = Buffer.from(cs.base64, 'base64');
    res.setHeader('Content-Type', cs.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition',
      `inline; filename="${(cs.file_name || cs.label || 'document').replace(/"/g, "'")}"`)
    res.send(buf);
  } catch (e) {
    console.error('[Vendor] download error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── PATCH /api/nodes/:nodeId/cutsheets/:cutsheetId ────────────────────────────
router.patch('/:nodeId/cutsheets/:cutsheetId', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId, cutsheetId } = req.params;
  const { label } = req.body;
  try {
    await pool.query(
      'UPDATE node_cutsheets SET label = $1 WHERE id = $2 AND node_id = $3',
      [label || '', cutsheetId, nodeId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[Vendor] PATCH cutsheet error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ── DELETE /api/nodes/:nodeId/cutsheets/:cutsheetId ───────────────────────────
router.delete('/:nodeId/cutsheets/:cutsheetId', requireRole('editor'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { nodeId, cutsheetId } = req.params;
  try {
    await pool.query(
      'DELETE FROM node_cutsheets WHERE id = $1 AND node_id = $2',
      [cutsheetId, nodeId]
    );
    res.json({ success: true });
  } catch (e) {
    console.error('[Vendor] DELETE cutsheet error:', e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
