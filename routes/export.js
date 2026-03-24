/**
 * Export API
 *
 * Generates CSV downloads for BOM and Requirements.
 *
 * Routes:
 *   GET /api/export/bom          — BOM CSV (all nodes or filtered by ?project_id=X)
 *   GET /api/export/requirements — Requirements CSV (all or filtered by ?project_id=X)
 */

const express = require('express');
const router = express.Router();

// Phase display names
const PHASE_LABELS = {
  requirements:       'Requirements',
  rnd:                'R&D',
  design_cad:         'Design/CAD',
  data_collection:    'Data Collection',
  analysis_cae:       'Analysis/CAE',
  testing_validation: 'Testing/Validation',
  correlation:        'Correlation'
};

/**
 * Escape a value for CSV output.
 * Wraps in quotes if it contains commas, quotes, or newlines.
 */
function csvCell(val) {
  const str = val === null || val === undefined ? '' : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function buildCsv(rows) {
  return rows.map(row => row.map(csvCell).join(',')).join('\n');
}

/**
 * GET /api/export/bom
 *
 * Columns: Part Number, Name, Type, Parent Part Number, Phase Status,
 *          Requirements Count, Verified Requirements, Description
 */
router.get('/bom', async (req, res) => {
  const pool = req.app.locals.pool;
  const projectId = req.query.project_id ? parseInt(req.query.project_id) : null;

  try {
    // ── 1. Fetch nodes ──────────────────────────────────────────────────
    let nodesQuery, nodesParams;
    if (projectId && !isNaN(projectId)) {
      nodesQuery = `
        SELECT id, name, part_number, type, parent_id, description
        FROM nodes
        WHERE project_id = ?
        ORDER BY id
      `;
      nodesParams = [projectId];
    } else {
      nodesQuery = `
        SELECT id, name, part_number, type, parent_id, description
        FROM nodes
        ORDER BY id
      `;
      nodesParams = [];
    }

    const [nodes] = await pool.query(nodesQuery, nodesParams);

    if (nodes.length === 0) {
      // Return empty CSV with headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="bom-empty.csv"');
      return res.send(buildCsv([
        ['Part Number','Name','Type','Parent Part Number','Phase Status','Requirements Count','Verified Requirements','Description']
      ]));
    }

    // Build id → node map for parent lookups
    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });
    const nodeIds = nodes.map(n => n.id);

    // ── 2. Fetch phase summaries ────────────────────────────────────────
    const [phasesRows] = await pool.query(`
      SELECT
        node_id,
        COUNT(*) AS total_phases,
        SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS complete_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
        GROUP_CONCAT(
          CASE WHEN status = 'in_progress' THEN phase END
          ORDER BY phase_order SEPARATOR ', '
        ) AS active_phases
      FROM node_phases
      WHERE node_id IN (?)
      GROUP BY node_id
    `, [nodeIds]);

    const phaseMap = {};
    phasesRows.forEach(p => {
      const total   = parseInt(p.total_phases);
      const complete = parseInt(p.complete_count);
      const inProg  = parseInt(p.in_progress_count);

      if (complete === total && total > 0) {
        phaseMap[p.node_id] = 'All Complete';
      } else if (inProg > 0 && p.active_phases) {
        // Map phase keys to display names
        const activeLabels = p.active_phases.split(', ').map(ph => PHASE_LABELS[ph] || ph).join(', ');
        phaseMap[p.node_id] = 'In Progress: ' + activeLabels;
      } else if (complete > 0) {
        phaseMap[p.node_id] = complete + '/' + total + ' phases complete';
      } else {
        phaseMap[p.node_id] = 'Not Started';
      }
    });

    // ── 3. Fetch requirements counts ────────────────────────────────────
    const [reqRows] = await pool.query(`
      SELECT
        node_id,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS verified
      FROM requirements
      WHERE node_id IN (?)
      GROUP BY node_id
    `, [nodeIds]);

    const reqMap = {};
    reqRows.forEach(r => {
      reqMap[r.node_id] = { total: parseInt(r.total), verified: parseInt(r.verified) };
    });

    // ── 4. Build CSV ────────────────────────────────────────────────────
    const csvRows = [[
      'Part Number', 'Name', 'Type', 'Parent Part Number',
      'Phase Status', 'Requirements Count', 'Verified Requirements', 'Description'
    ]];

    nodes.forEach(n => {
      const parent = n.parent_id ? nodeMap[n.parent_id] : null;
      const reqs   = reqMap[n.id] || { total: 0, verified: 0 };
      csvRows.push([
        n.part_number,
        n.name,
        n.type,
        parent ? parent.part_number : '',
        phaseMap[n.id] || 'No Phases',
        reqs.total,
        reqs.verified,
        n.description || ''
      ]);
    });

    // ── 5. Determine filename ───────────────────────────────────────────
    let projectSlug = 'bom';
    if (projectId && !isNaN(projectId)) {
      const [projRows] = await pool.query('SELECT name FROM projects WHERE id = ?', [projectId]);
      if (projRows.length > 0) {
        projectSlug = projRows[0].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
    }

    const date = new Date().toISOString().split('T')[0];
    const filename = projectSlug + '-bom-' + date + '.csv';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(buildCsv(csvRows));

  } catch (err) {
    console.error('[Export] BOM error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/export/requirements
 *
 * Columns: Req ID, Title, Priority, Status, Verification Method,
 *          Assigned Node, Node Part Number
 */
router.get('/requirements', async (req, res) => {
  const pool = req.app.locals.pool;
  const projectId = req.query.project_id ? parseInt(req.query.project_id) : null;

  try {
    let query, params;
    if (projectId && !isNaN(projectId)) {
      query = `
        SELECT r.req_id, r.title, r.priority, r.status, r.verification_method,
               n.name AS node_name, n.part_number AS node_part_number
        FROM requirements r
        JOIN nodes n ON n.id = r.node_id
        WHERE n.project_id = ?
        ORDER BY r.req_id
      `;
      params = [projectId];
    } else {
      query = `
        SELECT r.req_id, r.title, r.priority, r.status, r.verification_method,
               n.name AS node_name, n.part_number AS node_part_number
        FROM requirements r
        JOIN nodes n ON n.id = r.node_id
        ORDER BY r.req_id
      `;
      params = [];
    }

    const [rows] = await pool.query(query, params);

    const csvRows = [[
      'Req ID', 'Title', 'Priority', 'Status', 'Verification Method',
      'Assigned Node', 'Node Part Number'
    ]];

    rows.forEach(r => {
      csvRows.push([
        r.req_id,
        r.title,
        r.priority || '',
        r.status || '',
        r.verification_method || '',
        r.node_name,
        r.node_part_number
      ]);
    });

    let projectSlug = 'requirements';
    if (projectId && !isNaN(projectId)) {
      const [projRows] = await pool.query('SELECT name FROM projects WHERE id = ?', [projectId]);
      if (projRows.length > 0) {
        projectSlug = projRows[0].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-requirements';
      }
    }

    const date = new Date().toISOString().split('T')[0];
    const filename = projectSlug + '-' + date + '.csv';

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.send(buildCsv(csvRows));

  } catch (err) {
    console.error('[Export] Requirements error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
