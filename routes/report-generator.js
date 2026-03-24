/**
 * T5.2: Report Auto-Generation
 * Generate reports from project data (traceability, phase summary, gate status, etc.)
 * Mounted at /api/reports
 */
const express = require('express');
const router = express.Router();

// ── GET / — list report jobs ─────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ success: false, error: 'projectId required' });
    const [rows] = await pool.query(
      'SELECT * FROM report_jobs WHERE project_id = ? ORDER BY created_at DESC',
      [projectId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── POST / — generate a report ───────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, reportType, title, config, fileFormat, generatedBy } = req.body;

    const [result] = await pool.query(
      `INSERT INTO report_jobs (project_id, report_type, title, config, file_format, generated_by, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?, 'generating', NOW())`,
      [projectId, reportType, title || `${reportType} Report`, JSON.stringify(config || {}),
       fileFormat || 'json', generatedBy || null]
    );
    const jobId = result.insertId;

    // Generate report synchronously (for serverless compatibility)
    try {
      const reportData = await generateReport(pool, projectId, reportType, config || {});

      await pool.query(
        "UPDATE report_jobs SET status = 'completed', result_data = ?, completed_at = NOW() WHERE id = ?",
        [JSON.stringify(reportData), jobId]
      );

      res.status(201).json({ success: true, data: { id: jobId, status: 'completed', report: reportData } });
    } catch (genErr) {
      await pool.query(
        "UPDATE report_jobs SET status = 'failed', error_message = ?, completed_at = NOW() WHERE id = ?",
        [genErr.message, jobId]
      );
      res.status(201).json({ success: true, data: { id: jobId, status: 'failed', error: genErr.message } });
    }
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── GET /:jobId — get report result ──────────────────────────────────────────
router.get('/:jobId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM report_jobs WHERE id = ?', [req.params.jobId]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Report not found' });
    const job = rows[0];
    if (typeof job.result_data === 'string') job.result_data = JSON.parse(job.result_data);
    if (typeof job.config === 'string') job.config = JSON.parse(job.config);
    res.json({ success: true, data: job });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── GET /:jobId/download — download report as CSV/JSON ───────────────────────
router.get('/:jobId/download', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM report_jobs WHERE id = ?', [req.params.jobId]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Report not found' });

    const job = rows[0];
    const data = typeof job.result_data === 'string' ? JSON.parse(job.result_data) : job.result_data;
    const filename = `${job.report_type}-${job.project_id}-${job.id}`;

    if (job.file_format === 'csv' && data.csv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(data.csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json(data);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Report Generators
// ══════════════════════════════════════════════════════════════════════════════

async function generateReport(pool, projectId, reportType, config) {
  switch (reportType) {
    case 'traceability_matrix': return generateTraceabilityReport(pool, projectId);
    case 'phase_summary': return generatePhaseSummary(pool, projectId);
    case 'gate_status': return generateGateStatus(pool, projectId);
    case 'bom_export': return generateBomExport(pool, projectId);
    case 'power_budget': return generatePowerBudgetReport(pool, projectId);
    case 'test_summary': return generateTestSummary(pool, projectId);
    case 'design_review_pack': return generateDesignReviewPack(pool, projectId);
    case 'full_design_report': return generateFullReport(pool, projectId);
    default: throw new Error(`Unknown report type: ${reportType}`);
  }
}

async function generateTraceabilityReport(pool, projectId) {
  const [reqs] = await pool.query('SELECT * FROM design_requirements WHERE project_id = ? ORDER BY id', [projectId]);
  const reqIds = reqs.map(r => r.id);
  let traces = [];
  if (reqIds.length > 0) {
    [traces] = await pool.query('SELECT * FROM design_requirement_traces WHERE requirement_id IN (?)', [reqIds]);
  }

  const escCsv = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
  const csvRows = reqs.map(r => {
    const rt = traces.filter(t => t.requirement_id === r.id);
    return [r.id, escCsv(r.title), r.type, r.priority, r.verification_method,
            rt.filter(t => t.trace_type === 'analysis').length,
            rt.filter(t => t.trace_type === 'test').length,
            rt.every(t => t.status === 'satisfied') && rt.length > 0 ? 'YES' : 'NO'].join(',');
  });

  return {
    type: 'traceability_matrix',
    generatedAt: new Date().toISOString(),
    requirementCount: reqs.length,
    traceCount: traces.length,
    requirements: reqs.map(r => ({
      ...r,
      traces: traces.filter(t => t.requirement_id === r.id)
    })),
    csv: ['Req ID,Title,Type,Priority,Verification,Analysis Traces,Test Traces,Verified', ...csvRows].join('\n')
  };
}

async function generatePhaseSummary(pool, projectId) {
  const [phases] = await pool.query(
    'SELECT * FROM design_phases WHERE project_id = ? ORDER BY phase_number', [projectId]);
  const [project] = await pool.query('SELECT * FROM design_projects WHERE id = ?', [projectId]);

  return {
    type: 'phase_summary', generatedAt: new Date().toISOString(),
    project: project[0] || {},
    phases: phases.map(p => ({
      phaseNumber: p.phase_number, name: p.display_name,
      status: p.status, progress: p.progress_percentage
    })),
    overallProgress: project[0]?.overall_progress || 0
  };
}

async function generateGateStatus(pool, projectId) {
  const [gates] = await pool.query('SELECT * FROM design_phase_gates WHERE project_id = ?', [projectId]);
  const approved = gates.filter(g => g.status === 'approved').length;
  const pending = gates.filter(g => g.status === 'pending').length;
  const rejected = gates.filter(g => g.status === 'rejected').length;

  return {
    type: 'gate_status', generatedAt: new Date().toISOString(),
    gates, summary: { total: gates.length, approved, pending, rejected }
  };
}

async function generateBomExport(pool, projectId) {
  const [nodes] = await pool.query(
    `SELECT n.*, nv.vendor_name, nv.vendor_part_number, nv.unit_price, nv.sourcing_status
     FROM nodes n LEFT JOIN node_vendor_info nv ON n.id = nv.node_id
     WHERE n.id IN (SELECT node_id FROM design_requirements WHERE project_id = ? UNION SELECT id FROM nodes)
     ORDER BY n.type, n.name`,
    [projectId]
  );

  const escCsv = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
  const csvRows = nodes.map(n =>
    [escCsv(n.part_number), escCsv(n.name), n.type, escCsv(n.vendor_name),
     escCsv(n.vendor_part_number), n.unit_price || '', n.sourcing_status || ''].join(',')
  );

  return {
    type: 'bom_export', generatedAt: new Date().toISOString(),
    partCount: nodes.length, nodes,
    csv: ['Part Number,Name,Type,Vendor,Vendor PN,Unit Price,Status', ...csvRows].join('\n')
  };
}

async function generatePowerBudgetReport(pool, projectId) {
  const [rails] = await pool.query('SELECT * FROM power_rails WHERE project_id = ?', [projectId]);
  for (const rail of rails) {
    const [consumers] = await pool.query('SELECT * FROM power_consumers WHERE rail_id = ?', [rail.id]);
    rail.consumers = consumers;
    let typical = 0, peak = 0;
    consumers.forEach(c => {
      typical += parseFloat(c.typical_current_ma || 0) * (parseFloat(c.duty_cycle_percent || 100) / 100);
      peak += parseFloat(c.peak_current_ma || 0);
    });
    rail.typicalMa = typical;
    rail.peakMa = peak;
    rail.marginPercent = rail.max_current > 0 ? ((rail.max_current - peak) / rail.max_current * 100) : 0;
  }
  return { type: 'power_budget', generatedAt: new Date().toISOString(), rails };
}

async function generateTestSummary(pool, projectId) {
  const [reqs] = await pool.query(
    "SELECT * FROM design_requirements WHERE project_id = ? AND verification_method = 'test'", [projectId]);
  const reqIds = reqs.map(r => r.id);
  let traces = [];
  if (reqIds.length > 0) {
    [traces] = await pool.query(
      "SELECT * FROM design_requirement_traces WHERE requirement_id IN (?) AND trace_type = 'test'", [reqIds]);
  }
  const passed = traces.filter(t => t.status === 'satisfied').length;
  return {
    type: 'test_summary', generatedAt: new Date().toISOString(),
    totalTestReqs: reqs.length, testTraces: traces.length, passed,
    coveragePercent: reqs.length > 0 ? Math.round(passed / reqs.length * 100) : 0
  };
}

async function generateDesignReviewPack(pool, projectId) {
  const [reviews] = await pool.query('SELECT * FROM design_reviews WHERE project_id = ? ORDER BY scheduled_date', [projectId]);
  for (const review of reviews) {
    const [findings] = await pool.query('SELECT * FROM design_review_findings WHERE review_id = ?', [review.id]);
    review.findings = findings;
  }
  return { type: 'design_review_pack', generatedAt: new Date().toISOString(), reviews };
}

async function generateFullReport(pool, projectId) {
  const [traceability, phases, gates, bom, power, tests, reviews] = await Promise.all([
    generateTraceabilityReport(pool, projectId),
    generatePhaseSummary(pool, projectId),
    generateGateStatus(pool, projectId),
    generateBomExport(pool, projectId),
    generatePowerBudgetReport(pool, projectId),
    generateTestSummary(pool, projectId),
    generateDesignReviewPack(pool, projectId)
  ]);
  return {
    type: 'full_design_report', generatedAt: new Date().toISOString(),
    sections: { traceability, phases, gates, bom, power, tests, reviews }
  };
}

module.exports = router;
