/**
 * SOP (Standard Operating Procedure) API Routes
 *
 * GET    /api/sops?project_id=          — list SOPs for a project
 * POST   /api/sops                      — create SOP
 * GET    /api/sops/:id                  — get SOP with all steps
 * PUT    /api/sops/:id                  — update SOP header
 * DELETE /api/sops/:id                  — delete SOP (and all steps)
 *
 * POST   /api/sops/:id/steps            — add a step
 * PUT    /api/sops/:id/steps/:stepId    — update a step
 * DELETE /api/sops/:id/steps/:stepId    — delete a step
 * PUT    /api/sops/:id/steps/reorder    — reorder steps [{id, step_order}]
 */

const express = require('express');
const router  = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function pool(req) { return req.app.locals.pool; }

async function q(req, sql, params) {
  const [rows] = await pool(req).query(sql, params);
  return rows;
}

async function getSopOrFail(req, res, id) {
  const rows = await q(req,
    'SELECT * FROM sops WHERE id = ?', [id]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: 'SOP not found' });
    return null;
  }
  return rows[0];
}

// ── List SOPs ─────────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const { project_id } = req.query;
    let sql    = 'SELECT * FROM sops';
    const params = [];
    if (project_id) {
      sql += ' WHERE project_id = ?';
      params.push(parseInt(project_id, 10));
    }
    sql += ' ORDER BY created_at DESC';
    const rows = await q(req, sql, params);
    res.json({ success: true, sops: rows });
  } catch (err) {
    console.error('[SOP] list error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Create SOP ────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { project_id, title, description, version, revision, status } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }
    const [result] = await pool(req).query(`
      INSERT INTO sops (project_id, title, description, version, revision, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      project_id || null,
      title.trim(),
      description || '',
      version  || '1.0',
      revision || 'A',
      status   || 'draft'
    ]);
    const rows = await q(req, 'SELECT * FROM sops WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, sop: rows[0] });
  } catch (err) {
    console.error('[SOP] create error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get SOP with steps ────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const sop = await getSopOrFail(req, res, req.params.id);
    if (!sop) return;

    const steps = await q(req,
      'SELECT * FROM sop_steps WHERE sop_id = ? ORDER BY step_order ASC',
      [sop.id]);

    res.json({ success: true, sop, steps });
  } catch (err) {
    console.error('[SOP] get error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Update SOP header ─────────────────────────────────────────────────────────

router.put('/:id', async (req, res) => {
  try {
    const sop = await getSopOrFail(req, res, req.params.id);
    if (!sop) return;

    const { title, description, version, revision, status, linked_nodes } = req.body;

    await pool(req).query(`
      UPDATE sops SET
        title        = COALESCE(?, title),
        description  = COALESCE(?, description),
        version      = COALESCE(?, version),
        revision     = COALESCE(?, revision),
        status       = COALESCE(?, status),
        linked_nodes = COALESCE(?, linked_nodes),
        updated_at   = NOW()
      WHERE id = ?
    `, [
      title       ? title.trim() : null,
      description !== undefined  ? description : null,
      version     || null,
      revision    || null,
      status      || null,
      linked_nodes ? JSON.stringify(linked_nodes) : null,
      sop.id
    ]);
    const rows = await q(req, 'SELECT * FROM sops WHERE id = ?', [sop.id]);
    res.json({ success: true, sop: rows[0] });
  } catch (err) {
    console.error('[SOP] update error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Delete SOP ────────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const sop = await getSopOrFail(req, res, req.params.id);
    if (!sop) return;
    await q(req, 'DELETE FROM sops WHERE id = ?', [sop.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[SOP] delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Steps: Reorder (must be before /:stepId routes) ──────────────────────────

router.put('/:id/steps/reorder', async (req, res) => {
  try {
    const sop = await getSopOrFail(req, res, req.params.id);
    if (!sop) return;

    const { order } = req.body; // array of { id, step_order }
    if (!Array.isArray(order)) {
      return res.status(400).json({ success: false, message: 'order must be an array' });
    }

    const conn = await pool(req).getConnection();
    try {
      await conn.beginTransaction();
      for (const item of order) {
        await conn.query(
          'UPDATE sop_steps SET step_order = ?, updated_at = NOW() WHERE id = ? AND sop_id = ?',
          [item.step_order, item.id, sop.id]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    const steps = await q(req,
      'SELECT * FROM sop_steps WHERE sop_id = ? ORDER BY step_order ASC',
      [sop.id]);
    res.json({ success: true, steps });
  } catch (err) {
    console.error('[SOP] reorder error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Steps: Add ────────────────────────────────────────────────────────────────

router.post('/:id/steps', async (req, res) => {
  try {
    const sop = await getSopOrFail(req, res, req.params.id);
    if (!sop) return;

    // Auto-set step_order to max + 1
    const maxRows = await q(req,
      'SELECT COALESCE(MAX(step_order), 0) AS mx FROM sop_steps WHERE sop_id = ?',
      [sop.id]);
    const nextOrder = (maxRows[0].mx || 0) + 1;

    const { title, description, tools, hazards, images, step_order } = req.body;

    const [result] = await pool(req).query(`
      INSERT INTO sop_steps (sop_id, step_order, title, description, tools, hazards, images)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      sop.id,
      step_order !== undefined ? step_order : nextOrder,
      title       || '',
      description || '',
      JSON.stringify(tools   || []),
      JSON.stringify(hazards || []),
      JSON.stringify(images  || [])
    ]);
    const rows = await q(req, 'SELECT * FROM sop_steps WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, step: rows[0] });
  } catch (err) {
    console.error('[SOP] add step error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Steps: Update ─────────────────────────────────────────────────────────────

router.put('/:id/steps/:stepId', async (req, res) => {
  try {
    const sop = await getSopOrFail(req, res, req.params.id);
    if (!sop) return;

    const { title, description, tools, hazards, images, step_order } = req.body;

    await pool(req).query(`
      UPDATE sop_steps SET
        title       = COALESCE(?, title),
        description = COALESCE(?, description),
        tools       = COALESCE(?, tools),
        hazards     = COALESCE(?, hazards),
        images      = COALESCE(?, images),
        step_order  = COALESCE(?, step_order),
        updated_at  = NOW()
      WHERE id = ? AND sop_id = ?
    `, [
      title       !== undefined ? title       : null,
      description !== undefined ? description : null,
      tools       !== undefined ? JSON.stringify(tools)   : null,
      hazards     !== undefined ? JSON.stringify(hazards) : null,
      images      !== undefined ? JSON.stringify(images)  : null,
      step_order  !== undefined ? step_order  : null,
      req.params.stepId,
      sop.id
    ]);

    const rows = await q(req, 'SELECT * FROM sop_steps WHERE id = ? AND sop_id = ?', [req.params.stepId, sop.id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Step not found' });
    }
    res.json({ success: true, step: rows[0] });
  } catch (err) {
    console.error('[SOP] update step error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Steps: Delete ─────────────────────────────────────────────────────────────

router.delete('/:id/steps/:stepId', async (req, res) => {
  try {
    const sop = await getSopOrFail(req, res, req.params.id);
    if (!sop) return;

    const existing = await q(req,
      'SELECT id FROM sop_steps WHERE id = ? AND sop_id = ?',
      [req.params.stepId, sop.id]);

    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'Step not found' });
    }

    await q(req,
      'DELETE FROM sop_steps WHERE id = ? AND sop_id = ?',
      [req.params.stepId, sop.id]);

    res.json({ success: true });
  } catch (err) {
    console.error('[SOP] delete step error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
