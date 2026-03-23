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
  const { rows } = await pool(req).query(sql, params);
  return rows;
}

async function getSopOrFail(req, res, id) {
  const rows = await q(req,
    'SELECT * FROM sops WHERE id = $1', [id]);
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
      sql += ' WHERE project_id = $1';
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
    const rows = await q(req, `
      INSERT INTO sops (project_id, title, description, version, revision, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      project_id || null,
      title.trim(),
      description || '',
      version  || '1.0',
      revision || 'A',
      status   || 'draft'
    ]);
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
      'SELECT * FROM sop_steps WHERE sop_id = $1 ORDER BY step_order ASC',
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

    const rows = await q(req, `
      UPDATE sops SET
        title        = COALESCE($1, title),
        description  = COALESCE($2, description),
        version      = COALESCE($3, version),
        revision     = COALESCE($4, revision),
        status       = COALESCE($5, status),
        linked_nodes = COALESCE($6, linked_nodes),
        updated_at   = NOW()
      WHERE id = $7
      RETURNING *
    `, [
      title       ? title.trim() : null,
      description !== undefined  ? description : null,
      version     || null,
      revision    || null,
      status      || null,
      linked_nodes ? JSON.stringify(linked_nodes) : null,
      sop.id
    ]);
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
    await q(req, 'DELETE FROM sops WHERE id = $1', [sop.id]);
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

    const client = await pool(req).connect();
    try {
      await client.query('BEGIN');
      for (const item of order) {
        await client.query(
          'UPDATE sop_steps SET step_order = $1, updated_at = NOW() WHERE id = $2 AND sop_id = $3',
          [item.step_order, item.id, sop.id]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    const steps = await q(req,
      'SELECT * FROM sop_steps WHERE sop_id = $1 ORDER BY step_order ASC',
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
      'SELECT COALESCE(MAX(step_order), 0) AS mx FROM sop_steps WHERE sop_id = $1',
      [sop.id]);
    const nextOrder = (maxRows[0].mx || 0) + 1;

    const { title, description, tools, hazards, images, step_order } = req.body;

    const rows = await q(req, `
      INSERT INTO sop_steps (sop_id, step_order, title, description, tools, hazards, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      sop.id,
      step_order !== undefined ? step_order : nextOrder,
      title       || '',
      description || '',
      JSON.stringify(tools   || []),
      JSON.stringify(hazards || []),
      JSON.stringify(images  || [])
    ]);
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

    const rows = await q(req, `
      UPDATE sop_steps SET
        title       = COALESCE($1, title),
        description = COALESCE($2, description),
        tools       = COALESCE($3, tools),
        hazards     = COALESCE($4, hazards),
        images      = COALESCE($5, images),
        step_order  = COALESCE($6, step_order),
        updated_at  = NOW()
      WHERE id = $7 AND sop_id = $8
      RETURNING *
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

    const rows = await q(req,
      'DELETE FROM sop_steps WHERE id = $1 AND sop_id = $2 RETURNING id',
      [req.params.stepId, sop.id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Step not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[SOP] delete step error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
