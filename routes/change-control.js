/**
 * T5.1: Change Control Workflow — ECR (Engineering Change Request) / ECN (Change Notice)
 * Mounted at /api/change-control
 */
const express = require('express');
const router = express.Router();

// ── ECR Number Generator ─────────────────────────────────────────────────────
async function nextEcrNumber(pool) {
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM change_requests');
  return `ECR-${new Date().getFullYear()}-${String(rows[0].cnt + 1).padStart(4, '0')}`;
}

async function nextEcnNumber(pool) {
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM change_notices');
  return `ECN-${new Date().getFullYear()}-${String(rows[0].cnt + 1).padStart(4, '0')}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Change Requests (ECR)
// ══════════════════════════════════════════════════════════════════════════════

router.get('/ecr', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, status } = req.query;
    let sql = 'SELECT * FROM change_requests WHERE 1=1';
    const params = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    rows.forEach(r => {
      if (typeof r.affected_nodes === 'string') r.affected_nodes = JSON.parse(r.affected_nodes);
      if (typeof r.affected_requirements === 'string') r.affected_requirements = JSON.parse(r.affected_requirements);
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/ecr', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const ecrNumber = await nextEcrNumber(pool);
    const { projectId, title, description, reason, priority, requestedBy, assignedTo,
            affectedNodes, affectedRequirements, impactAnalysis, costImpact, scheduleImpact, riskAssessment } = req.body;

    const [result] = await pool.query(
      `INSERT INTO change_requests (project_id, ecr_number, title, description, reason, priority,
       requested_by, assigned_to, affected_nodes, affected_requirements,
       impact_analysis, cost_impact, schedule_impact, risk_assessment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, ecrNumber, title, description || null, reason || 'design_improvement',
       priority || 'medium', requestedBy || null, assignedTo || null,
       JSON.stringify(affectedNodes || []), JSON.stringify(affectedRequirements || []),
       impactAnalysis || null, costImpact || null, scheduleImpact || null, riskAssessment || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, ecrNumber } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/ecr/:ecrId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM change_requests WHERE id = ?', [req.params.ecrId]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'ECR not found' });
    const ecr = rows[0];
    if (typeof ecr.affected_nodes === 'string') ecr.affected_nodes = JSON.parse(ecr.affected_nodes);
    if (typeof ecr.affected_requirements === 'string') ecr.affected_requirements = JSON.parse(ecr.affected_requirements);

    const [comments] = await pool.query(
      'SELECT * FROM change_request_comments WHERE change_request_id = ? ORDER BY created_at',
      [ecr.id]
    );
    ecr.comments = comments;

    const [ecns] = await pool.query('SELECT * FROM change_notices WHERE change_request_id = ?', [ecr.id]);
    ecr.changeNotices = ecns;

    res.json({ success: true, data: ecr });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/ecr/:ecrId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;

    // Validate status transition
    if (req.body.status) {
      const validStatuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'implemented', 'closed'];
      if (!validStatuses.includes(req.body.status)) {
        return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }
    }

    const allowed = ['title', 'description', 'reason', 'priority', 'status', 'assigned_to',
                     'affected_nodes', 'affected_requirements', 'impact_analysis',
                     'cost_impact', 'schedule_impact', 'risk_assessment'];
    const updates = [];
    const params = [];

    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) {
        updates.push(`${col} = ?`);
        params.push(['affected_nodes', 'affected_requirements'].includes(col) ? JSON.stringify(val) : val);
      }
    }

    // Auto-set timestamps based on status transitions
    if (req.body.status === 'submitted') { updates.push('submitted_at = NOW()'); }
    if (req.body.status === 'approved') {
      updates.push('approved_at = NOW()');
      if (req.body.approvedBy) { updates.push('approved_by = ?'); params.push(req.body.approvedBy); }
    }
    if (req.body.status === 'implemented') { updates.push('implemented_at = NOW()'); }
    if (req.body.status === 'closed') { updates.push('closed_at = NOW()'); }

    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });
    params.push(req.params.ecrId);
    await pool.query(`UPDATE change_requests SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'ECR updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/ecr/:ecrId/comments', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { author, comment } = req.body;
    await pool.query(
      'INSERT INTO change_request_comments (change_request_id, author, comment) VALUES (?, ?, ?)',
      [req.params.ecrId, author || 'Anonymous', comment]
    );
    res.status(201).json({ success: true, message: 'Comment added' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Change Notices (ECN) — created from approved ECRs
// ══════════════════════════════════════════════════════════════════════════════

router.post('/ecn', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const ecnNumber = await nextEcnNumber(pool);
    const { changeRequestId, title, effectivityDate, disposition, implementationSteps, verificationMethod } = req.body;

    const [result] = await pool.query(
      `INSERT INTO change_notices (change_request_id, ecn_number, title, effectivity_date,
       disposition, implementation_steps, verification_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [changeRequestId, ecnNumber, title, effectivityDate || null,
       disposition || 'rework', JSON.stringify(implementationSteps || []),
       verificationMethod || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, ecnNumber } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/ecn/:ecnId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['status', 'effectivity_date', 'disposition', 'implementation_steps', 'verification_method'];
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) {
        updates.push(`${col} = ?`);
        params.push(col === 'implementation_steps' ? JSON.stringify(val) : val);
      }
    }
    if (req.body.status === 'verified') {
      updates.push('verified_at = NOW()');
      if (req.body.verifiedBy) { updates.push('verified_by = ?'); params.push(req.body.verifiedBy); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });
    params.push(req.params.ecnId);
    await pool.query(`UPDATE change_notices SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'ECN updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
