/**
 * T3.1-T3.5: Electronics / PCB Domain Routes
 *
 * Endpoints:
 *   /api/nodes/:nodeId/electronics      — T3.1 electronics properties
 *   /api/nodes/:nodeId/eda              — T3.2 EDA tool linking
 *   /api/nodes/:nodeId/eda/:linkId/bom  — T3.2 BOM management
 *   /api/nodes/:nodeId/components       — T3.3 component selection
 *   /api/power-budget                   — T3.4 power rails & consumers
 */
const express = require('express');
const router = express.Router();

// ══════════════════════════════════════════════════════════════════════════════
// T3.1: Electronics Properties per Node
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:nodeId/electronics', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM node_electronics_props WHERE node_id = ?',
      [req.params.nodeId]
    );
    res.json({ success: true, data: rows[0] || null });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:nodeId/electronics', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const nodeId = parseInt(req.params.nodeId, 10);
    const fields = [
      'domain', 'voltage_rating', 'current_rating', 'power_rating', 'impedance',
      'frequency_range', 'operating_temp_min', 'operating_temp_max', 'package_type',
      'pin_count', 'rohs_compliant', 'reach_compliant', 'lead_free', 'esd_sensitivity',
      'thermal_resistance', 'notes'
    ];

    const cols = ['node_id'];
    const vals = [nodeId];
    const updateParts = [];

    for (const f of fields) {
      const camel = f.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      if (req.body[camel] !== undefined || req.body[f] !== undefined) {
        const val = req.body[camel] !== undefined ? req.body[camel] : req.body[f];
        cols.push(f);
        vals.push(val);
        updateParts.push(`${f} = VALUES(${f})`);
      }
    }

    if (updateParts.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields provided' });
    }

    const placeholders = cols.map(() => '?').join(', ');
    await pool.query(
      `INSERT INTO node_electronics_props (${cols.join(', ')})
       VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE ${updateParts.join(', ')}`,
      vals
    );

    res.json({ success: true, message: 'Electronics properties saved' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE electronics properties (reset to defaults)
router.delete('/:nodeId/electronics', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM node_electronics WHERE node_id = ?', [req.params.nodeId]);
    res.json({ success: true, message: 'Electronics properties removed' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// T3.2: EDA Tool Linking
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:nodeId/eda', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM node_eda_links WHERE node_id = ? ORDER BY created_at DESC',
      [req.params.nodeId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:nodeId/eda', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { edaTool, projectUrl, schematicUrl, pcbLayoutUrl, bomUrl, gerberUrl, repoUrl, branch, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO node_eda_links (node_id, eda_tool, project_url, schematic_url, pcb_layout_url, bom_url, gerber_url, repo_url, branch, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.nodeId, edaTool, projectUrl || null, schematicUrl || null,
       pcbLayoutUrl || null, bomUrl || null, gerberUrl || null, repoUrl || null,
       branch || null, notes || null]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:nodeId/eda/:linkId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['eda_tool', 'project_url', 'schematic_url', 'pcb_layout_url',
                     'bom_url', 'gerber_url', 'repo_url', 'branch', 'notes'];
    const updates = [];
    const params = [];

    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });

    params.push(req.params.linkId);
    await pool.query(`UPDATE node_eda_links SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'EDA link updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:nodeId/eda/:linkId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM eda_bom_entries WHERE eda_link_id = ?', [req.params.linkId]);
    await pool.query('DELETE FROM node_eda_links WHERE id = ?', [req.params.linkId]);
    res.json({ success: true, message: 'EDA link deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── BOM import/management per EDA link ───────────────────────────────────────

router.get('/:nodeId/eda/:linkId/bom', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM eda_bom_entries WHERE eda_link_id = ? ORDER BY reference_designator',
      [req.params.linkId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:nodeId/eda/:linkId/bom', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { entries } = req.body; // Array of BOM entries

    if (!Array.isArray(entries)) {
      return res.status(400).json({ success: false, error: 'entries must be an array' });
    }

    let imported = 0;
    for (const e of entries) {
      await pool.query(
        `INSERT INTO eda_bom_entries
         (eda_link_id, node_id, reference_designator, component_value, footprint,
          manufacturer, manufacturer_pn, distributor, distributor_pn, quantity, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.params.linkId, req.params.nodeId, e.referenceDesignator || e.ref,
         e.componentValue || e.value, e.footprint, e.manufacturer, e.manufacturerPn || e.mpn,
         e.distributor, e.distributorPn || e.dpn, e.quantity || 1, e.description || null]
      );
      imported++;
    }

    // Update sync timestamp
    await pool.query('UPDATE node_eda_links SET last_sync_at = NOW() WHERE id = ?', [req.params.linkId]);

    res.status(201).json({ success: true, data: { imported } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:nodeId/eda/:linkId/bom', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM eda_bom_entries WHERE eda_link_id = ?', [req.params.linkId]);
    res.json({ success: true, message: 'BOM cleared' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// T3.3: Component Selection & Lifecycle
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:nodeId/components', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM component_selections WHERE node_id = ? ORDER BY status, created_at DESC',
      [req.params.nodeId]
    );

    // Get alternates for each selection
    for (const sel of rows) {
      const [alts] = await pool.query(
        'SELECT * FROM component_alternates WHERE selection_id = ?',
        [sel.id]
      );
      sel.alternates = alts;
    }

    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:nodeId/components', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const {
      selectedPn, manufacturer, description, category, lifecycleStatus,
      datasheetUrl, unitPrice, moq, leadTimeDays, stockAvailable,
      deratingVerified, deratingNotes, thermalVerified, thermalMarginPercent,
      selectionRationale, status
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO component_selections
       (node_id, selected_pn, manufacturer, description, category, lifecycle_status,
        datasheet_url, unit_price, moq, lead_time_days, stock_available,
        derating_verified, derating_notes, thermal_verified, thermal_margin_percent,
        selection_rationale, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.nodeId, selectedPn, manufacturer || null, description || null,
       category || null, lifecycleStatus || 'active', datasheetUrl || null,
       unitPrice || null, moq || null, leadTimeDays || null, stockAvailable || null,
       deratingVerified || false, deratingNotes || null, thermalVerified || false,
       thermalMarginPercent || null, selectionRationale || null, status || 'candidate']
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:nodeId/components/:selectionId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = [
      'selected_pn', 'manufacturer', 'description', 'category', 'lifecycle_status',
      'datasheet_url', 'unit_price', 'moq', 'lead_time_days', 'stock_available',
      'derating_verified', 'derating_notes', 'thermal_verified', 'thermal_margin_percent',
      'selection_rationale', 'status', 'last_price_check'
    ];
    const updates = [];
    const params = [];

    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });

    params.push(req.params.selectionId);
    await pool.query(`UPDATE component_selections SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Component selection updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:nodeId/components/:selectionId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM component_alternates WHERE selection_id = ?', [req.params.selectionId]);
    await pool.query('DELETE FROM component_selections WHERE id = ?', [req.params.selectionId]);
    res.json({ success: true, message: 'Component selection deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Alternate components ─────────────────────────────────────────────────────

router.post('/:nodeId/components/:selectionId/alternates', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { alternatePn, manufacturer, compatibility, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO component_alternates (selection_id, alternate_pn, manufacturer, compatibility, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.selectionId, alternatePn, manufacturer || null,
       compatibility || 'functional', notes || null]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:nodeId/components/:selectionId/alternates/:altId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM component_alternates WHERE id = ?', [req.params.altId]);
    res.json({ success: true, message: 'Alternate deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
