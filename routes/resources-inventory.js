const express = require('express');
const router = express.Router();

// Generate 8-char global artifact ID
function generateGlobalArtifactId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'RES';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ── GET /stats — aggregate resource statistics ───────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [totals] = await pool.query(
      `SELECT
         COUNT(*) AS total_resources,
         SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available,
         SUM(CASE WHEN status = 'checked_out' THEN 1 ELSE 0 END) AS checked_out,
         SUM(CASE WHEN status = 'under_maintenance' THEN 1 ELSE 0 END) AS under_maintenance,
         SUM(CASE WHEN calibration_required = 1 AND calibration_due_at < NOW() THEN 1 ELSE 0 END) AS calibration_overdue
       FROM resources WHERE deleted_at IS NULL`
    );

    const [overdue] = await pool.query(
      `SELECT COUNT(*) AS count FROM resource_checkouts
       WHERE returned_at IS NULL AND expected_return_at < NOW()`
    );

    res.json({
      success: true,
      data: {
        ...totals[0],
        overdue_checkouts: overdue[0].count
      }
    });
  } catch (err) {
    console.error('[Resources] stats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /overdue — overdue checkouts ─────────────────────────────────────────

router.get('/overdue', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      `SELECT rc.*, r.name AS resource_name, r.global_artifact_id
       FROM resource_checkouts rc
       JOIN resources r ON rc.resource_id = r.id
       WHERE rc.returned_at IS NULL AND rc.expected_return_at < NOW()
       ORDER BY rc.expected_return_at ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Resources] overdue error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /my-checkouts — user's active checkouts ──────────────────────────────

router.get('/my-checkouts', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const userId = req.query.userId || 'user-001';

    const [rows] = await pool.query(
      `SELECT rc.*, r.name AS resource_name, r.global_artifact_id, r.location_label
       FROM resource_checkouts rc
       JOIN resources r ON rc.resource_id = r.id
       WHERE rc.checked_out_by_user_id = ? AND rc.returned_at IS NULL
       ORDER BY rc.checked_out_at DESC`,
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Resources] my-checkouts error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET / — list all resources ───────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { category, status, search } = req.query;

    let sql = 'SELECT * FROM resources WHERE deleted_at IS NULL';
    const params = [];

    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (search) { sql += ' AND (name LIKE ? OR description LIKE ? OR global_artifact_id LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    sql += ' ORDER BY name ASC';

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Resources] list error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST / — create a resource ───────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const {
      name, description, category, quantityTotal = 1, locationLabel,
      calibrationRequired = false, calibrationIntervalDays, createdBy
    } = req.body;

    const globalArtifactId = generateGlobalArtifactId();

    const [result] = await pool.query(
      `INSERT INTO resources
       (global_artifact_id, name, description, category, quantity_total, quantity_available,
        location_label, calibration_required, calibration_interval_days, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [globalArtifactId, name, description, category, quantityTotal, quantityTotal,
       locationLabel, calibrationRequired, calibrationIntervalDays || null, createdBy || null]
    );

    res.status(201).json({
      success: true,
      data: { id: result.insertId, globalArtifactId, name }
    });
  } catch (err) {
    console.error('[Resources] create error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /:id — resource detail ───────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);

    const [resources] = await pool.query(
      'SELECT * FROM resources WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (resources.length === 0) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    const resource = resources[0];

    // Get active checkouts
    const [checkouts] = await pool.query(
      'SELECT * FROM resource_checkouts WHERE resource_id = ? AND returned_at IS NULL ORDER BY checked_out_at DESC',
      [id]
    );
    resource.active_checkouts = checkouts;

    res.json({ success: true, data: resource });
  } catch (err) {
    console.error('[Resources] get error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /:id — update resource ─────────────────────────────────────────────

router.patch('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);
    const allowed = ['name', 'description', 'category', 'quantity_total', 'location_label',
                     'status', 'calibration_required', 'calibration_due_at', 'calibration_interval_days'];

    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) {
        updates.push(`${col} = ?`);
        params.push(val);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    params.push(id);
    await pool.query(`UPDATE resources SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Resource updated' });
  } catch (err) {
    console.error('[Resources] update error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /:id — soft delete ────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);
    await pool.query('UPDATE resources SET deleted_at = NOW() WHERE id = ?', [id]);
    res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    console.error('[Resources] delete error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /:id/checkout — checkout a resource ─────────────────────────────────

router.post('/:id/checkout', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);
    const { userId, userName, quantity = 1, expectedReturnAt, purposeNote, linkedProjectId, linkedProjectName } = req.body;

    // Check availability
    const [resources] = await pool.query(
      'SELECT * FROM resources WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (resources.length === 0) {
      return res.status(404).json({ success: false, error: 'Resource not found' });
    }

    const resource = resources[0];
    if (resource.quantity_available < quantity) {
      return res.status(400).json({ success: false, error: 'Insufficient quantity available' });
    }

    // T5.6: Calibration enforcement — block checkout of overdue equipment
    if (resource.calibration_required && resource.calibration_due_at) {
      const dueDate = new Date(resource.calibration_due_at);
      if (dueDate < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Calibration overdue — this resource cannot be checked out until recalibrated',
          calibrationDueAt: resource.calibration_due_at
        });
      }
    }

    // Create checkout record
    const [result] = await pool.query(
      `INSERT INTO resource_checkouts
       (resource_id, checked_out_by_user_id, checked_out_by_name, quantity_checked_out,
        expected_return_at, purpose_note, linked_project_id, linked_project_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, userName, quantity, expectedReturnAt || null, purposeNote || null,
       linkedProjectId || null, linkedProjectName || null]
    );

    // Update resource availability
    await pool.query(
      `UPDATE resources SET quantity_available = quantity_available - ?,
       status = CASE WHEN quantity_available - ? <= 0 THEN 'checked_out' ELSE status END
       WHERE id = ?`,
      [quantity, quantity, id]
    );

    res.status(201).json({
      success: true,
      data: { checkoutId: result.insertId, resourceId: id, quantity }
    });
  } catch (err) {
    console.error('[Resources] checkout error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /:id/return — return a resource ─────────────────────────────────────

router.post('/:id/return', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);
    const { checkoutId, returnNotes } = req.body;

    const [checkouts] = await pool.query(
      'SELECT * FROM resource_checkouts WHERE id = ? AND resource_id = ? AND returned_at IS NULL',
      [checkoutId, id]
    );
    if (checkouts.length === 0) {
      return res.status(404).json({ success: false, error: 'Active checkout not found' });
    }

    const checkout = checkouts[0];

    // Mark as returned
    await pool.query(
      'UPDATE resource_checkouts SET returned_at = NOW(), return_notes = ? WHERE id = ?',
      [returnNotes || null, checkoutId]
    );

    // Restore availability
    await pool.query(
      `UPDATE resources SET quantity_available = quantity_available + ?,
       status = CASE WHEN quantity_available + ? >= quantity_total THEN 'available' ELSE status END
       WHERE id = ?`,
      [checkout.quantity_checked_out, checkout.quantity_checked_out, id]
    );

    res.json({ success: true, message: 'Resource returned successfully' });
  } catch (err) {
    console.error('[Resources] return error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /:id/history — checkout history ──────────────────────────────────────

router.get('/:id/history', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);

    const [rows] = await pool.query(
      'SELECT * FROM resource_checkouts WHERE resource_id = ? ORDER BY checked_out_at DESC LIMIT 50',
      [id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Resources] history error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
