const express = require('express');
const router  = express.Router();
const { getProjectRole, getProjectForNode } = require('../middleware/rbac');

// ── RBAC helpers ─────────────────────────────────────────────────────────────

async function assertEditorRole(pool, res, projectId, userId) {
  if (!projectId) return true;
  const proj = await pool.query('SELECT is_demo FROM projects WHERE id = $1', [projectId]);
  if (proj.rows[0]?.is_demo) {
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

// Get project_id from an 8D report (via its first linked node)
async function getProjectForReport(pool, reportId) {
  const r = await pool.query(`
    SELECT n.project_id FROM eightd_node_links l
    JOIN nodes n ON n.id = l.node_id
    WHERE l.report_id = $1 AND n.project_id IS NOT NULL
    LIMIT 1
  `, [reportId]);
  return r.rows[0]?.project_id ? Number(r.rows[0].project_id) : null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const DISCIPLINES = ['d1','d2','d3','d4','d5','d6','d7','d8'];

function defaultDisciplines() {
  const d = {};
  DISCIPLINES.forEach(k => { d[k] = { status: 'open', notes: '', evidence: '' }; });
  return d;
}

function mergedDisciplines(existing) {
  const base = defaultDisciplines();
  if (!existing || typeof existing !== 'object') return base;
  DISCIPLINES.forEach(k => {
    if (existing[k]) {
      base[k] = {
        status:   existing[k].status   || 'open',
        notes:    existing[k].notes    || '',
        evidence: existing[k].evidence || ''
      };
    }
  });
  return base;
}

function computeStatus(disciplines) {
  const d = disciplines || {};
  const statuses = DISCIPLINES.map(k => (d[k] && d[k].status) || 'open');
  if (statuses.every(s => s === 'complete')) return 'closed';
  if (statuses.some(s => s !== 'open'))      return 'in_progress';
  return 'open';
}

// ── List all 8D reports ──────────────────────────────────────────────────────

router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const { project_id } = req.query;
  try {
    let query = `
      SELECT r.id, r.title, r.status, r.disciplines, r.created_at, r.updated_at,
             COUNT(l.node_id)::int AS linked_nodes
      FROM   eightd_reports r
      LEFT JOIN eightd_node_links l ON l.report_id = r.id
    `;
    const params = [];
    if (project_id) {
      query += ` WHERE r.project_id = $${params.length + 1}`;
      params.push(parseInt(project_id));
    }
    query += ' GROUP BY r.id ORDER BY r.updated_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, reports: result.rows });
  } catch (err) {
    console.error('[8D] list error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get reports linked to a node ─────────────────────────────────────────────

router.get('/node/:nodeId', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const nodeId = parseInt(req.params.nodeId);
    if (!nodeId) return res.status(400).json({ success: false, message: 'Invalid nodeId' });

    const result = await pool.query(`
      SELECT r.id, r.title, r.status, r.disciplines, r.created_at, r.updated_at
      FROM   eightd_reports r
      JOIN   eightd_node_links l ON l.report_id = r.id
      WHERE  l.node_id = $1
      ORDER BY r.updated_at DESC
    `, [nodeId]);
    res.json({ success: true, reports: result.rows });
  } catch (err) {
    console.error('[8D] list-for-node error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Get single report ────────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' });

    const rr = await pool.query('SELECT * FROM eightd_reports WHERE id=$1', [id]);
    if (!rr.rows.length) return res.status(404).json({ success: false, message: 'Report not found' });

    const report = rr.rows[0];
    report.disciplines = mergedDisciplines(report.disciplines);

    const ln = await pool.query(`
      SELECT n.id, n.name, n.part_number, n.type
      FROM   nodes n
      JOIN   eightd_node_links l ON l.node_id = n.id
      WHERE  l.report_id = $1
      ORDER  BY n.name
    `, [id]);
    report.linked_nodes = ln.rows;

    res.json({ success: true, report });
  } catch (err) {
    console.error('[8D] get error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Create report ────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const { title, node_id, project_id } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ success: false, message: 'title is required' });

    // RBAC: editor or admin required (check via linked node if provided)
    if (node_id) {
      const projectId = await getProjectForNode(pool, parseInt(node_id));
      if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
    }

    // Resolve project_id: use provided value, or derive from linked node
    let resolvedProjectId = project_id ? parseInt(project_id) : null;
    if (!resolvedProjectId && node_id) {
      const nodeRes = await pool.query('SELECT project_id FROM nodes WHERE id = $1', [parseInt(node_id)]);
      resolvedProjectId = nodeRes.rows[0]?.project_id || null;
    }

    const disciplines = defaultDisciplines();
    const rr = await pool.query(
      `INSERT INTO eightd_reports (title, status, disciplines, project_id, created_at, updated_at)
       VALUES ($1, 'open', $2, $3, NOW(), NOW()) RETURNING *`,
      [title.trim(), JSON.stringify(disciplines), resolvedProjectId]
    );
    const report = rr.rows[0];

    if (node_id) {
      const nid = parseInt(node_id);
      if (nid) {
        await pool.query(
          'INSERT INTO eightd_node_links (report_id, node_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [report.id, nid]
        );
      }
    }

    report.disciplines = mergedDisciplines(report.disciplines);
    res.status(201).json({ success: true, report });
  } catch (err) {
    console.error('[8D] create error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Update report ────────────────────────────────────────────────────────────

router.put('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' });

    const rr = await pool.query('SELECT * FROM eightd_reports WHERE id=$1', [id]);
    if (!rr.rows.length) return res.status(404).json({ success: false, message: 'Report not found' });

    // RBAC
    const projectId = await getProjectForReport(pool, id);
    if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

    const existing = rr.rows[0];
    const { title, disciplines } = req.body;

    const newTitle       = (title !== undefined) ? title.trim() : existing.title;
    const newDisciplines = disciplines ? mergedDisciplines(disciplines) : mergedDisciplines(existing.disciplines);
    const newStatus      = computeStatus(newDisciplines);

    const updated = await pool.query(
      `UPDATE eightd_reports SET title=$1, disciplines=$2, status=$3, updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [newTitle, JSON.stringify(newDisciplines), newStatus, id]
    );

    const report = updated.rows[0];
    report.disciplines = mergedDisciplines(report.disciplines);
    res.json({ success: true, report });
  } catch (err) {
    console.error('[8D] update error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Delete report ────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' });

    // RBAC
    const projectId = await getProjectForReport(pool, id);
    if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

    await pool.query('DELETE FROM eightd_reports WHERE id=$1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[8D] delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Link report to node ──────────────────────────────────────────────────────

router.post('/:id/link/:nodeId', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const reportId = parseInt(req.params.id);
    const nodeId   = parseInt(req.params.nodeId);
    if (!reportId || !nodeId) return res.status(400).json({ success: false, message: 'Invalid ids' });

    // RBAC: check the node's project
    const projectId = await getProjectForNode(pool, nodeId);
    if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

    await pool.query(
      'INSERT INTO eightd_node_links (report_id, node_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [reportId, nodeId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[8D] link error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Unlink report from node ──────────────────────────────────────────────────

router.delete('/:id/link/:nodeId', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const reportId = parseInt(req.params.id);
    const nodeId   = parseInt(req.params.nodeId);
    if (!reportId || !nodeId) return res.status(400).json({ success: false, message: 'Invalid ids' });

    // RBAC
    const projectId = await getProjectForNode(pool, nodeId);
    if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

    await pool.query(
      'DELETE FROM eightd_node_links WHERE report_id=$1 AND node_id=$2',
      [reportId, nodeId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[8D] unlink error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Attachments ──────────────────────────────────────────────────────────────

// GET /api/eightd/:reportId/attachments — list all attachments for a report
router.get('/:reportId/attachments', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const reportId = parseInt(req.params.reportId);
    if (!reportId) return res.status(400).json({ success: false, message: 'Invalid reportId' });

    const result = await pool.query(
      `SELECT id, report_id, disc_key, filename, mime_type, file_size, base64, description, created_at
       FROM   eightd_attachments
       WHERE  report_id = $1
       ORDER  BY disc_key, created_at ASC`,
      [reportId]
    );
    res.json({ success: true, attachments: result.rows });
  } catch (err) {
    console.error('[8D] attachments list error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/eightd/:reportId/attachments — upload a file attachment
router.post('/:reportId/attachments', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const reportId = parseInt(req.params.reportId);
    if (!reportId) return res.status(400).json({ success: false, message: 'Invalid reportId' });

    const { disc_key, filename, mime_type, file_size, base64, description } = req.body;
    if (!disc_key || !filename || !base64) {
      return res.status(400).json({ success: false, message: 'disc_key, filename, and base64 are required' });
    }
    if (!['d1','d2','d3','d4','d5','d6','d7','d8'].includes(disc_key)) {
      return res.status(400).json({ success: false, message: 'Invalid disc_key' });
    }
    // Enforce 5MB base64 limit (5MB binary → ~6.8MB base64)
    if (base64.length > 7 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File too large (max 5MB)' });
    }

    // Confirm report exists
    const rr = await pool.query('SELECT id FROM eightd_reports WHERE id=$1', [reportId]);
    if (!rr.rows.length) return res.status(404).json({ success: false, message: 'Report not found' });

    // RBAC
    const projectId = await getProjectForReport(pool, reportId);
    if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

    const result = await pool.query(
      `INSERT INTO eightd_attachments (report_id, disc_key, filename, mime_type, file_size, base64, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [reportId, disc_key, filename, mime_type || 'application/octet-stream', file_size || null, base64, description || '']
    );
    res.status(201).json({ success: true, attachment: result.rows[0] });
  } catch (err) {
    console.error('[8D] attachment upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/eightd/:reportId/attachments/:attachId — update description
router.patch('/:reportId/attachments/:attachId', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const reportId  = parseInt(req.params.reportId);
    const attachId  = parseInt(req.params.attachId);
    if (!reportId || !attachId) return res.status(400).json({ success: false, message: 'Invalid ids' });

    // RBAC
    const projectId = await getProjectForReport(pool, reportId);
    if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

    const { description } = req.body;
    await pool.query(
      'UPDATE eightd_attachments SET description=$1 WHERE id=$2 AND report_id=$3',
      [description || '', attachId, reportId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[8D] attachment patch error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/eightd/:reportId/attachments/:attachId — delete an attachment
router.delete('/:reportId/attachments/:attachId', async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const reportId = parseInt(req.params.reportId);
    const attachId = parseInt(req.params.attachId);
    if (!reportId || !attachId) return res.status(400).json({ success: false, message: 'Invalid ids' });

    // RBAC
    const projectId = await getProjectForReport(pool, reportId);
    if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

    await pool.query('DELETE FROM eightd_attachments WHERE id=$1 AND report_id=$2', [attachId, reportId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[8D] attachment delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
