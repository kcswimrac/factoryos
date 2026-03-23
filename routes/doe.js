const express = require('express');
const router = express.Router();
const { getProjectRole, getProjectForNode, getProjectForDoeStudy } = require('../middleware/rbac');

// ── RBAC helper for DOE mutations ────────────────────────────────────────────
async function assertEditorRole(pool, res, projectId, userId) {
  if (!projectId) return true;
  const [projRows] = await pool.query('SELECT is_demo FROM projects WHERE id = ?', [projectId]);
  if (projRows[0]?.is_demo) {
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

// Helper: get project from any DOE entity (factor/response/run) via its study
async function getProjectForDoeEntity(pool, table, idField, entityId) {
  const [rows] = await pool.query(`
    SELECT n.project_id FROM ${table} e
    JOIN doe_studies s ON s.id = e.study_id
    LEFT JOIN nodes n ON n.id = s.node_id
    WHERE e.${idField} = ?
  `, [entityId]);
  return rows[0]?.project_id ? Number(rows[0].project_id) : null;
}

// ═════════════════════════════════════════════════════════════════════════════
//  DOE DESIGN GENERATION — pure-JS statistical engine
// ═════════════════════════════════════════════════════════════════════════════

/** Cartesian product of arrays */
function cartesian(arrays) {
  return arrays.reduce(function(acc, arr) {
    var result = [];
    acc.forEach(function(a) {
      arr.forEach(function(b) {
        result.push(a.concat([b]));
      });
    });
    return result;
  }, [[]]);
}

/** Shuffle array (Fisher-Yates) */
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

/**
 * Full Factorial — every combination of all factor levels.
 * Works for any number of factors/levels.
 */
function generateFullFactorial(factors) {
  var levelArrays = factors.map(function(f) { return f.levels; });
  return cartesian(levelArrays).map(function(combo, i) {
    var settings = {};
    factors.forEach(function(f, fi) { settings[f.id] = combo[fi]; });
    return { run_number: i + 1, factor_settings: settings, run_order: i + 1 };
  });
}

/**
 * 2-Level Fractional Factorial — standard Hadamard sign tables.
 * Resolution III = minimum aliasing of main effects.
 * Falls back to full factorial if k ≤ 3 or run count exceeds 64.
 */
var FRAC_FACTORIAL_TABLES = {
  // k factors → { generators, base_k } — generators define confounding structure
  4:  { base_k: 3, generators: [[0,1,2]] },              // 2^(4-1) = 8 runs, Res IV
  5:  { base_k: 3, generators: [[0,1,2],[0,1]] },        // 2^(5-2) = 8 runs, Res III
  6:  { base_k: 4, generators: [[0,1,2],[0,1,3]] },      // 2^(6-2) = 16 runs, Res IV
  7:  { base_k: 4, generators: [[0,1,2],[0,1,3],[1,2,3]] }, // 2^(7-3) = 16 runs
  8:  { base_k: 4, generators: [[0,1,2],[0,1,3],[0,2,3],[1,2,3]] },
};

function generateFractionalFactorial(factors) {
  var k = factors.length;
  // Use 2-level design — need exactly 2 levels per factor (use first/last)
  var twoLevelFactors = factors.map(function(f) {
    var lvls = f.levels && f.levels.length >= 2 ? f.levels : [f.levels[0], f.levels[0]];
    return { id: f.id, low: lvls[0], high: lvls[lvls.length - 1] };
  });

  var tbl = FRAC_FACTORIAL_TABLES[k];
  if (!tbl || k <= 3) {
    // Fall back to full factorial for small k
    return generateFullFactorial(factors);
  }

  var base_k = tbl.base_k;
  var n = Math.pow(2, base_k);

  // Build base Hadamard matrix for base_k columns
  var baseMatrix = [];
  for (var run = 0; run < n; run++) {
    var row = [];
    for (var col = 0; col < base_k; col++) {
      row.push((run >> col) & 1 ? 1 : -1);
    }
    baseMatrix.push(row);
  }

  // Add generator columns (XOR product of specified base columns → +1/-1)
  var fullMatrix = baseMatrix.map(function(row) { return row.slice(); });
  tbl.generators.forEach(function(gen) {
    fullMatrix.forEach(function(row, ri) {
      var val = gen.reduce(function(prod, colIdx) { return prod * baseMatrix[ri][colIdx]; }, 1);
      row.push(val);
    });
  });

  return fullMatrix.map(function(row, i) {
    var settings = {};
    twoLevelFactors.forEach(function(f, fi) {
      settings[f.id] = row[fi] === 1 ? f.high : f.low;
    });
    return { run_number: i + 1, factor_settings: settings, run_order: i + 1 };
  });
}

/** Taguchi orthogonal arrays — hardcoded standard tables */
var TAGUCHI_ARRAYS = {
  L4: {
    n_factors_max: 3, n_levels: 2, runs: 4,
    table: [[1,1,1],[1,2,2],[2,1,2],[2,2,1]]
  },
  L8: {
    n_factors_max: 7, n_levels: 2, runs: 8,
    table: [
      [1,1,1,1,1,1,1],[1,1,1,2,2,2,2],[1,2,2,1,1,2,2],
      [1,2,2,2,2,1,1],[2,1,2,1,2,1,2],[2,1,2,2,1,2,1],
      [2,2,1,1,2,2,1],[2,2,1,2,1,1,2]
    ]
  },
  L9: {
    n_factors_max: 4, n_levels: 3, runs: 9,
    table: [
      [1,1,1,1],[1,2,2,2],[1,3,3,3],[2,1,2,3],
      [2,2,3,1],[2,3,1,2],[3,1,3,2],[3,2,1,3],[3,3,2,1]
    ]
  },
  L12: {
    n_factors_max: 11, n_levels: 2, runs: 12,
    table: [
      [1,1,1,1,1,1,1,1,1,1,1],[1,1,1,1,1,2,2,2,2,2,2],
      [1,1,2,2,2,1,1,1,2,2,2],[1,2,1,2,2,1,2,2,1,1,2],
      [1,2,2,1,2,2,1,2,1,2,1],[1,2,2,2,1,2,2,1,2,1,1],
      [2,1,2,2,1,1,2,2,2,1,1],[2,1,2,1,2,2,2,1,1,2,1],
      [2,1,1,2,2,2,1,2,1,1,2],[2,2,2,1,1,1,1,2,2,2,1],
      [2,2,1,2,1,2,1,1,1,2,2],[2,2,1,1,2,1,2,1,2,1,2]
    ]
  },
  L16: {
    n_factors_max: 15, n_levels: 2, runs: 16,
    table: (function() {
      var rows = [];
      for (var r = 0; r < 16; r++) {
        var row = [];
        for (var c = 0; c < 15; c++) { row.push((r >> (c % 4)) & 1 ? 2 : 1); }
        rows.push(row);
      }
      return rows;
    })()
  },
  L18: {
    n_factors_max: 8, n_levels: 3, runs: 18,
    table: [
      [1,1,1,1,1,1,1,1],[1,1,2,2,2,2,2,2],[1,1,3,3,3,3,3,3],
      [1,2,1,1,2,2,3,3],[1,2,2,2,3,3,1,1],[1,2,3,3,1,1,2,2],
      [1,3,1,2,1,3,2,3],[1,3,2,3,2,1,3,1],[1,3,3,1,3,2,1,2],
      [2,1,1,3,3,2,2,1],[2,1,2,1,1,3,3,2],[2,1,3,2,2,1,1,3],
      [2,2,1,2,3,1,3,2],[2,2,2,3,1,2,1,3],[2,2,3,1,2,3,2,1],
      [2,3,1,3,2,3,1,2],[2,3,2,1,3,1,2,3],[2,3,3,2,1,2,3,1]
    ]
  }
};

function generateTaguchi(factors, arrayName) {
  var arr = TAGUCHI_ARRAYS[arrayName];
  if (!arr) throw new Error('Unknown Taguchi array: ' + arrayName);

  return arr.table.map(function(row, ri) {
    var settings = {};
    factors.forEach(function(f, fi) {
      if (fi >= arr.n_factors_max) return; // extra factors ignored
      var lvlIdx = (row[fi] || 1) - 1; // 1-indexed → 0-indexed
      var lvl = f.levels && f.levels[lvlIdx] !== undefined ? f.levels[lvlIdx] : String(row[fi]);
      settings[f.id] = lvl;
    });
    return { run_number: ri + 1, factor_settings: settings, run_order: ri + 1 };
  });
}

/**
 * Central Composite Design (CCD) for k continuous factors.
 * Returns: 2^k factorial points + 2k axial (star) points + n_center center points.
 * Factor levels: coded as -1 (low), +1 (high), ±alpha (axial), 0 (center).
 * We map coded values back to actual low/center/high using factor ranges.
 */
function generateCentralComposite(factors, n_center) {
  var k = factors.length;
  var alpha = parseFloat(Math.pow(Math.pow(2, k), 0.25).toFixed(4)); // rotatable CCD
  var runs = [];
  var rn = 1;

  function coded(f, code) {
    var lo = f.min_value != null ? parseFloat(f.min_value) : 0;
    var hi = f.max_value != null ? parseFloat(f.max_value) : 1;
    var center = f.center_value != null ? parseFloat(f.center_value) : (lo + hi) / 2;
    var half_range = (hi - lo) / 2;
    if (half_range === 0) return String(center);
    var actual = center + code * half_range;
    return String(Math.round(actual * 10000) / 10000);
  }

  // Factorial portion (±1)
  var factorial = cartesian(factors.map(function() { return [-1, 1]; }));
  factorial.forEach(function(combo) {
    var settings = {};
    factors.forEach(function(f, fi) { settings[f.id] = coded(f, combo[fi]); });
    runs.push({ run_number: rn++, factor_settings: settings, run_order: rn - 1 });
  });

  // Axial (star) points
  factors.forEach(function(f, fi) {
    [-alpha, alpha].forEach(function(a) {
      var settings = {};
      factors.forEach(function(f2, fi2) { settings[f2.id] = coded(f2, fi2 === fi ? a : 0); });
      runs.push({ run_number: rn++, factor_settings: settings, run_order: rn - 1 });
    });
  });

  // Center points
  var nc = (n_center != null && n_center >= 1) ? n_center : Math.max(3, Math.round(Math.sqrt(k)));
  for (var c = 0; c < nc; c++) {
    var settings = {};
    factors.forEach(function(f) { settings[f.id] = coded(f, 0); });
    runs.push({ run_number: rn++, factor_settings: settings, run_order: rn - 1 });
  }

  return runs;
}

/**
 * Box-Behnken Design — 3 levels per factor, no corner points (safer for constrained spaces).
 * Defined for 3–7 factors. Falls back to CCD for other counts.
 */
var BBD_TABLES = {
  3: [[1,1,0],[1,-1,0],[-1,1,0],[-1,-1,0],[1,0,1],[1,0,-1],[-1,0,1],[-1,0,-1],[0,1,1],[0,1,-1],[0,-1,1],[0,-1,-1],[0,0,0],[0,0,0],[0,0,0]],
  4: [[1,1,0,0],[1,-1,0,0],[-1,1,0,0],[-1,-1,0,0],[0,0,1,1],[0,0,1,-1],[0,0,-1,1],[0,0,-1,-1],[1,0,1,0],[1,0,-1,0],[-1,0,1,0],[-1,0,-1,0],[0,1,0,1],[0,1,0,-1],[0,-1,0,1],[0,-1,0,-1],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
};

function generateBoxBehnken(factors, n_center) {
  var k = factors.length;
  var tbl = BBD_TABLES[k];
  if (!tbl) {
    // Fallback to CCD
    return generateCentralComposite(factors, n_center);
  }

  function coded(f, code) {
    var lo = f.min_value != null ? parseFloat(f.min_value) : 0;
    var hi = f.max_value != null ? parseFloat(f.max_value) : 1;
    var center = f.center_value != null ? parseFloat(f.center_value) : (lo + hi) / 2;
    var half_range = (hi - lo) / 2;
    if (half_range === 0) return String(center);
    return String(Math.round((center + code * half_range) * 10000) / 10000);
  }

  // Replace trailing center points with n_center custom center runs
  var nc = n_center != null ? n_center : 3;
  var baseRuns = tbl.filter(function(row) { return row.some(function(v) { return v !== 0; }); });
  var runs = baseRuns.map(function(row, i) {
    var settings = {};
    factors.forEach(function(f, fi) { settings[f.id] = coded(f, row[fi] !== undefined ? row[fi] : 0); });
    return { run_number: i + 1, factor_settings: settings, run_order: i + 1 };
  });
  for (var c = 0; c < nc; c++) {
    var settings = {};
    factors.forEach(function(f) { settings[f.id] = coded(f, 0); });
    runs.push({ run_number: runs.length + 1, factor_settings: settings, run_order: runs.length });
  }
  return runs;
}

/**
 * Recommend design type based on factor count and goal.
 */
function recommendDesign(factorCount, goal) {
  if (goal === 'optimization') {
    if (factorCount <= 2) return { type: 'central_composite', reason: 'CCD ideal for 1-2 factor optimization with response surface modeling.' };
    if (factorCount <= 4) return { type: 'central_composite', reason: 'Central Composite Design for response surface and curvature detection.' };
    if (factorCount <= 7) return { type: 'box_behnken', reason: 'Box-Behnken efficient for 3–7 factors; avoids extreme corner runs.' };
    return { type: 'taguchi_l18', reason: 'L18 Taguchi array handles up to 8 factors efficiently for optimization.' };
  }
  // screening
  if (factorCount <= 3) return { type: 'full_factorial', reason: 'Full factorial feasible — every combination tested.' };
  if (factorCount <= 5) return { type: 'taguchi_l8', reason: 'L8 Taguchi: 8 runs for up to 7 factors. Efficient screening.' };
  if (factorCount <= 4) return { type: 'fractional_factorial', reason: 'Fractional factorial reduces runs while preserving main effect resolution.' };
  if (factorCount <= 8) return { type: 'taguchi_l18', reason: 'L18 Taguchi: 18 runs for up to 8 mixed-level factors.' };
  return { type: 'taguchi_l16', reason: 'L16 handles up to 15 two-level factors in 16 runs for large screening studies.' };
}

// ═════════════════════════════════════════════════════════════════════════════
//  STUDIES
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/doe/studies?node_id=X&project_id=Y
router.get('/studies', async (req, res) => {
  const pool = req.app.locals.pool;
  const { node_id, project_id } = req.query;
  try {
    let query = `
      SELECT
        s.id, s.title, s.objective, s.hypothesis, s.experiment_goal, s.design_type,
        s.node_id, s.status, s.created_at, s.updated_at,
        n.name AS node_name, n.part_number AS node_part_number,
        (SELECT COUNT(*) FROM doe_factors   WHERE study_id = s.id)::int AS factor_count,
        (SELECT COUNT(*) FROM doe_responses WHERE study_id = s.id)::int AS response_count,
        (SELECT COUNT(*) FROM doe_runs      WHERE study_id = s.id)::int AS run_count,
        EXISTS(SELECT 1 FROM doe_decisions  WHERE study_id = s.id) AS has_decision
      FROM doe_studies s
      LEFT JOIN nodes n ON n.id = s.node_id
    `;
    const params = [];
    const conditions = [];
    if (node_id) {
      conditions.push(`s.node_id = $${params.length + 1}`);
      params.push(parseInt(node_id));
    }
    if (project_id) {
      // Filter by project_id column (backfilled from nodes, set on create)
      conditions.push(`s.project_id = $${params.length + 1}`);
      params.push(parseInt(project_id));
    }
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY s.updated_at DESC';

    const [result] = await pool.query(query, params);
    res.json({ success: true, studies: result.rows });
  } catch (err) {
    console.error('[DOE] list studies error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/doe/studies
router.post('/studies', async (req, res) => {
  const pool = req.app.locals.pool;
  const { title, objective, hypothesis, experiment_goal, node_id, project_id } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Study title is required' });
  }
  if (!hypothesis || !hypothesis.trim()) {
    return res.status(400).json({ success: false, message: 'Hypothesis is required — explain why this experiment exists' });
  }
  try {
    // Resolve project_id: use provided value, or derive from linked node
    let resolvedProjectId = project_id ? parseInt(project_id) : null;
    if (!resolvedProjectId && node_id) {
      const [nodeRes] = await pool.query('SELECT project_id FROM nodes WHERE id = ?', [parseInt(node_id)]);
      resolvedProjectId = nodeRes[0]?.project_id || null;
    }

    const [result] = await pool.query(
      `INSERT INTO doe_studies (title, objective, hypothesis, experiment_goal, node_id, project_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [title.trim(), objective || null, hypothesis.trim(), experiment_goal || 'screening', node_id || null, resolvedProjectId]
    );
    res.status(201).json({ success: true, study: result[0] });
  } catch (err) {
    console.error('[DOE] create study error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/doe/studies/:id — full detail with constraints, decision
router.get('/studies/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = parseInt(req.params.id);
  try {
    const [studyRes] = await pool.query(
      `SELECT s.*, n.name AS node_name, n.part_number AS node_part_number
       FROM doe_studies s
       LEFT JOIN nodes n ON n.id = s.node_id
       WHERE s.id = ?`,
      [id]
    );
    if (!studyRes.length) {
      return res.status(404).json({ success: false, message: 'Study not found' });
    }

    const [factorsRes, responsesRes, runsRes, resultsRes, constraintsRes, decisionRes] = await Promise.all([
      pool.query(`SELECT * FROM doe_factors     WHERE study_id = ? ORDER BY sort_order, id`, [id]),
      pool.query(`SELECT * FROM doe_responses   WHERE study_id = ? ORDER BY sort_order, id`, [id]),
      pool.query(`SELECT * FROM doe_runs        WHERE study_id = ? ORDER BY run_number`,     [id]),
      pool.query(`SELECT rr.* FROM doe_run_results rr JOIN doe_runs r ON r.id = rr.run_id WHERE r.study_id = ?`, [id]),
      pool.query(`SELECT * FROM doe_constraints WHERE study_id = ? ORDER BY id`,             [id]),
      pool.query(`SELECT * FROM doe_decisions   WHERE study_id = ? LIMIT 1`,                 [id]),
    ]);

    const resultsByRun = {};
    resultsRes.rows.forEach(function(r) {
      if (!resultsByRun[r.run_id]) resultsByRun[r.run_id] = [];
      resultsByRun[r.run_id].push(r);
    });

    const runs = runsRes.map(function(run) {
      return Object.assign({}, run, { results: resultsByRun[run.id] || [] });
    });

    const study = Object.assign({}, studyRes[0], {
      factors:     factorsRes.rows,
      responses:   responsesRes.rows,
      runs:        runs,
      constraints: constraintsRes.rows,
      decision:    decisionRes[0] || null,
    });

    res.json({ success: true, study });
  } catch (err) {
    console.error('[DOE] get study error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/doe/studies/:id
router.put('/studies/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = parseInt(req.params.id);
  const { title, objective, hypothesis, experiment_goal, status, conclusions,
          recommended_settings, node_id, design_type, resolution,
          randomize_runs, run_order_locked } = req.body;

  // RBAC: editor or admin required
  const projectId = await getProjectForDoeStudy(pool, id);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  const fields = [];
  const values = [];
  let idx = 1;

  if (title               !== undefined) { fields.push(`title = $${idx++}`);               values.push(title); }
  if (objective           !== undefined) { fields.push(`objective = $${idx++}`);            values.push(objective); }
  if (hypothesis          !== undefined) { fields.push(`hypothesis = $${idx++}`);           values.push(hypothesis); }
  if (experiment_goal     !== undefined) { fields.push(`experiment_goal = $${idx++}`);      values.push(experiment_goal); }
  if (status              !== undefined) { fields.push(`status = $${idx++}`);               values.push(status); }
  if (conclusions         !== undefined) { fields.push(`conclusions = $${idx++}`);          values.push(conclusions); }
  if (recommended_settings !== undefined){ fields.push(`recommended_settings = $${idx++}`); values.push(recommended_settings); }
  if (node_id             !== undefined) { fields.push(`node_id = $${idx++}`);              values.push(node_id || null); }
  if (design_type         !== undefined) { fields.push(`design_type = $${idx++}`);          values.push(design_type); }
  if (resolution          !== undefined) { fields.push(`resolution = $${idx++}`);           values.push(resolution); }
  if (randomize_runs      !== undefined) { fields.push(`randomize_runs = $${idx++}`);       values.push(randomize_runs); }
  if (run_order_locked    !== undefined) { fields.push(`run_order_locked = $${idx++}`);     values.push(run_order_locked); }

  if (!fields.length) {
    return res.status(400).json({ success: false, message: 'Nothing to update' });
  }
  fields.push(`updated_at = NOW()`);
  values.push(id);

  try {
    const [result] = await pool.query(
      `UPDATE doe_studies SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
    if (!result.length) {
      return res.status(404).json({ success: false, message: 'Study not found' });
    }
    res.json({ success: true, study: result[0] });
  } catch (err) {
    console.error('[DOE] update study error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/doe/studies/:id
router.delete('/studies/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = parseInt(req.params.id);
  // RBAC: editor or admin required
  const projectId = await getProjectForDoeStudy(pool, id);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
  try {
    const [result] = await pool.query(`DELETE FROM doe_studies WHERE id = ?
    if (!result.length) {
      return res.status(404).json({ success: false, message: 'Study not found' });
    }
    res.json({ success: true, message: 'Study deleted' });
  } catch (err) {
    console.error('[DOE] delete study error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  DESIGN GENERATION
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/doe/studies/:id/design-recommendation
router.get('/studies/:id/design-recommendation', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = parseInt(req.params.id);
  try {
    const [studyRes] = await pool.query(`SELECT experiment_goal FROM doe_studies WHERE id = ?`, [id]);
    if (!studyRes.length) return res.status(404).json({ success: false, message: 'Study not found' });

    const [factorsRes] = await pool.query(`SELECT id, name, levels, factor_type FROM doe_factors WHERE study_id = ?`, [id]);
    const k = factorsRes.length;
    const goal = studyRes[0].experiment_goal || 'screening';

    const rec = recommendDesign(k, goal);

    // Compute run counts for each option
    var runCounts = {};
    var isContinuous = factorsRes.some(function(f) { return f.factor_type === 'continuous'; });

    if (k >= 2 && k <= 7) {
      // Full factorial count (only if reasonable)
      var ffCount = factorsRes.reduce(function(acc, f) {
        return acc * (f.levels && f.levels.length ? f.levels.length : 2);
      }, 1);
      if (ffCount <= 256) runCounts.full_factorial = ffCount;

      // Fractional factorial
      if (k >= 4 && k <= 8) {
        var tbl = FRAC_FACTORIAL_TABLES[k];
        if (tbl) runCounts.fractional_factorial = Math.pow(2, tbl.base_k);
      }

      // Taguchi
      ['L4','L8','L9','L12','L16','L18'].forEach(function(nm) {
        var a = TAGUCHI_ARRAYS[nm];
        if (a && k <= a.n_factors_max) runCounts['taguchi_' + nm.toLowerCase()] = a.runs;
      });

      // RSM
      if (isContinuous || k <= 5) {
        var nc = Math.max(3, Math.round(Math.sqrt(k)));
        runCounts.central_composite = Math.pow(2, k) + 2 * k + nc;
        if (BBD_TABLES[k]) runCounts.box_behnken = BBD_TABLES[k].length; // approximate
      }
    }

    res.json({ success: true, recommendation: rec, run_counts: runCounts, factor_count: k });
  } catch (err) {
    console.error('[DOE] design recommendation error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/doe/studies/:id/generate-design
router.post('/studies/:id/generate-design', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = parseInt(req.params.id);
  const { design_type, resolution, n_center, randomize, clear_existing } = req.body;

  if (!design_type) {
    return res.status(400).json({ success: false, message: 'design_type is required' });
  }

  // RBAC: editor or admin required
  const projectId0 = await getProjectForDoeStudy(pool, id);
  if (!await assertEditorRole(pool, res, projectId0, req.user?.id)) return;

  try {
    const [studyRes] = await pool.query(`SELECT * FROM doe_studies WHERE id = ?`, [id]);
    if (!studyRes.length) return res.status(404).json({ success: false, message: 'Study not found' });

    const [factorsRes] = await pool.query(
      `SELECT id, name, unit, levels, factor_type, min_value, max_value, center_value
       FROM doe_factors WHERE study_id = ? ORDER BY sort_order, id`,
      [id]
    );
    const factors = factorsRes.map(function(f) {
      return Object.assign({}, f, {
        levels: Array.isArray(f.levels) ? f.levels : (f.levels || []),
        min_value: f.min_value, max_value: f.max_value, center_value: f.center_value
      });
    });

    if (!factors.length) {
      return res.status(400).json({ success: false, message: 'Add at least one factor before generating a design' });
    }

    let runs;
    const dt = design_type.toLowerCase();

    if (dt === 'full_factorial') {
      runs = generateFullFactorial(factors);
    } else if (dt === 'fractional_factorial') {
      runs = generateFractionalFactorial(factors);
    } else if (dt.startsWith('taguchi_')) {
      const arrayName = dt.replace('taguchi_', '').toUpperCase();
      runs = generateTaguchi(factors, arrayName);
    } else if (dt === 'central_composite') {
      runs = generateCentralComposite(factors, n_center);
    } else if (dt === 'box_behnken') {
      runs = generateBoxBehnken(factors, n_center);
    } else {
      return res.status(400).json({ success: false, message: 'Unknown design_type: ' + design_type });
    }

    if (randomize) {
      const shuffled = shuffle(runs);
      runs = shuffled.map(function(r, i) { return Object.assign({}, r, { run_order: i + 1 }); });
    }

    // Persist: optionally clear existing runs, then insert new ones
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (clear_existing) {
        await client.query(`DELETE FROM doe_runs WHERE study_id = ?`, [id]);
      }

      const insertedRuns = [];
      for (const run of runs) {
        const r = await client.query(
          `INSERT INTO doe_runs (study_id, run_number, factor_settings, status, run_order) VALUES (?, ?, ?, 'planned', ?)`,
          [id, run.run_number, JSON.stringify(run.factor_settings), run.run_order]
        );
        insertedRuns.push(r[0]);
      }

      // Update study design_type + resolution
      await client.query(
        `UPDATE doe_studies SET design_type = ?, resolution = ?, randomize_runs = ?, updated_at = NOW() WHERE id = ?`,
        [design_type, resolution || null, !!randomize, id]
      );

      await client.query('COMMIT');
      res.json({ success: true, runs: insertedRuns, run_count: insertedRuns.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[DOE] generate design error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  FACTORS
// ═════════════════════════════════════════════════════════════════════════════

router.post('/studies/:id/factors', async (req, res) => {
  const pool = req.app.locals.pool;
  const studyId = parseInt(req.params.id);
  const { name, unit, levels, factor_type, min_value, max_value, center_value } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Factor name is required' });
  }
  // RBAC
  const projectId = await getProjectForDoeStudy(pool, studyId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
  try {
    const [countRes] = await pool.query(`SELECT COUNT(*) FROM doe_factors WHERE study_id = ?`, [studyId]);
    const sortOrder = parseInt(countRes[0].count);

    const [result] = await pool.query(
      `INSERT INTO doe_factors (study_id, name, unit, levels, sort_order, factor_type, min_value, max_value, center_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [studyId, name.trim(), unit || null, JSON.stringify(levels || []), sortOrder,
       factor_type || 'discrete', min_value || null, max_value || null, center_value || null]
    );
    await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [studyId]);
    res.status(201).json({ success: true, factor: result[0] });
  } catch (err) {
    console.error('[DOE] add factor error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/factors/:fid', async (req, res) => {
  const pool = req.app.locals.pool;
  const fid = parseInt(req.params.fid);
  const { name, unit, levels, factor_type, min_value, max_value, center_value } = req.body;

  // RBAC
  const projectId = await getProjectForDoeEntity(pool, 'doe_factors', 'id', fid);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  const fields = [];
  const values = [];
  let idx = 1;

  if (name         !== undefined) { fields.push(`name = $${idx++}`);         values.push(name); }
  if (unit         !== undefined) { fields.push(`unit = $${idx++}`);         values.push(unit); }
  if (levels       !== undefined) { fields.push(`levels = $${idx++}`);       values.push(JSON.stringify(levels)); }
  if (factor_type  !== undefined) { fields.push(`factor_type = $${idx++}`);  values.push(factor_type); }
  if (min_value    !== undefined) { fields.push(`min_value = $${idx++}`);    values.push(min_value); }
  if (max_value    !== undefined) { fields.push(`max_value = $${idx++}`);    values.push(max_value); }
  if (center_value !== undefined) { fields.push(`center_value = $${idx++}`); values.push(center_value); }

  if (!fields.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
  values.push(fid);

  try {
    const [result] = await pool.query(
      `UPDATE doe_factors SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
    if (!result.length) return res.status(404).json({ success: false, message: 'Factor not found' });
    if (result[0].study_id) {
      await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [result[0].study_id]);
    }
    res.json({ success: true, factor: result[0] });
  } catch (err) {
    console.error('[DOE] update factor error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/factors/:fid', async (req, res) => {
  const pool = req.app.locals.pool;
  const fid = parseInt(req.params.fid);
  // RBAC
  const projectId = await getProjectForDoeEntity(pool, 'doe_factors', 'id', fid);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
  try {
    const [result] = await pool.query(`DELETE FROM doe_factors WHERE id = ?
    if (!result.length) return res.status(404).json({ success: false, message: 'Factor not found' });
    await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [result[0].study_id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DOE] delete factor error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  RESPONSES
// ═════════════════════════════════════════════════════════════════════════════

router.post('/studies/:id/responses', async (req, res) => {
  const pool = req.app.locals.pool;
  const studyId = parseInt(req.params.id);
  const { name, unit, target } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Response name is required' });
  }
  // RBAC
  const projectId = await getProjectForDoeStudy(pool, studyId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
  try {
    const [countRes] = await pool.query(`SELECT COUNT(*) FROM doe_responses WHERE study_id = ?`, [studyId]);
    const sortOrder = parseInt(countRes[0].count);
    const [result] = await pool.query(
      `INSERT INTO doe_responses (study_id, name, unit, target, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [studyId, name.trim(), unit || null, target || 'maximize', sortOrder]
    );
    await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [studyId]);
    res.status(201).json({ success: true, response: result[0] });
  } catch (err) {
    console.error('[DOE] add response error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/responses/:rid', async (req, res) => {
  const pool = req.app.locals.pool;
  const rid = parseInt(req.params.rid);
  const { name, unit, target } = req.body;

  // RBAC: editor or admin required
  const projectId = await getProjectForDoeEntity(pool, 'doe_responses', 'id', rid);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  const fields = [];
  const values = [];
  let idx = 1;
  if (name   !== undefined) { fields.push(`name = $${idx++}`);   values.push(name); }
  if (unit   !== undefined) { fields.push(`unit = $${idx++}`);   values.push(unit); }
  if (target !== undefined) { fields.push(`target = $${idx++}`); values.push(target); }
  if (!fields.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
  values.push(rid);
  try {
    const [result] = await pool.query(
      `UPDATE doe_responses SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
    if (!result.length) return res.status(404).json({ success: false, message: 'Response not found' });
    if (result[0].study_id) {
      await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [result[0].study_id]);
    }
    res.json({ success: true, response: result[0] });
  } catch (err) {
    console.error('[DOE] update response error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/responses/:rid', async (req, res) => {
  const pool = req.app.locals.pool;
  const rid = parseInt(req.params.rid);
  // RBAC
  const projectId = await getProjectForDoeEntity(pool, 'doe_responses', 'id', rid);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
  try {
    const [result] = await pool.query(`DELETE FROM doe_responses WHERE id = ?
    if (!result.length) return res.status(404).json({ success: false, message: 'Response not found' });
    await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [result[0].study_id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DOE] delete response error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  CONSTRAINTS
// ═════════════════════════════════════════════════════════════════════════════

router.post('/studies/:id/constraints', async (req, res) => {
  const pool = req.app.locals.pool;
  const studyId = parseInt(req.params.id);
  const { name, description, constraint_type, expression } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Constraint name is required' });
  }
  // RBAC: editor or admin required
  const projectId = await getProjectForDoeStudy(pool, studyId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
  try {
    const [result] = await pool.query(
      `INSERT INTO doe_constraints (study_id, name, description, constraint_type, expression) VALUES (?, ?, ?, ?, ?)`,
      [studyId, name.trim(), description || null, constraint_type || 'hard_limit', expression || null]
    );
    await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [studyId]);
    res.status(201).json({ success: true, constraint: result[0] });
  } catch (err) {
    console.error('[DOE] add constraint error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/constraints/:cid', async (req, res) => {
  const pool = req.app.locals.pool;
  const cid = parseInt(req.params.cid);
  const { name, description, constraint_type, expression } = req.body;

  // RBAC: editor or admin required
  const projectId = await getProjectForDoeEntity(pool, 'doe_constraints', 'id', cid);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  const fields = [];
  const values = [];
  let idx = 1;
  if (name            !== undefined) { fields.push(`name = $${idx++}`);            values.push(name); }
  if (description     !== undefined) { fields.push(`description = $${idx++}`);     values.push(description); }
  if (constraint_type !== undefined) { fields.push(`constraint_type = $${idx++}`); values.push(constraint_type); }
  if (expression      !== undefined) { fields.push(`expression = $${idx++}`);      values.push(expression); }
  if (!fields.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
  values.push(cid);
  try {
    const [result] = await pool.query(
      `UPDATE doe_constraints SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
    if (!result.length) return res.status(404).json({ success: false, message: 'Constraint not found' });
    res.json({ success: true, constraint: result[0] });
  } catch (err) {
    console.error('[DOE] update constraint error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/constraints/:cid', async (req, res) => {
  const pool = req.app.locals.pool;
  const cid = parseInt(req.params.cid);
  // RBAC: editor or admin required
  const projectId = await getProjectForDoeEntity(pool, 'doe_constraints', 'id', cid);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
  try {
    const [result] = await pool.query(`DELETE FROM doe_constraints WHERE id = ?
    if (!result.length) return res.status(404).json({ success: false, message: 'Constraint not found' });
    await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [result[0].study_id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DOE] delete constraint error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  RUNS
// ═════════════════════════════════════════════════════════════════════════════

router.post('/studies/:id/runs', async (req, res) => {
  const pool = req.app.locals.pool;
  const studyId = parseInt(req.params.id);
  const { factor_settings, notes } = req.body;
  // RBAC
  const projectId = await getProjectForDoeStudy(pool, studyId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
  try {
    const [maxRes] = await pool.query(
      `SELECT COALESCE(MAX(run_number), 0) AS max_run FROM doe_runs WHERE study_id = ?`,
      [studyId]
    );
    const runNumber = parseInt(maxRes[0].max_run) + 1;
    const [result] = await pool.query(
      `INSERT INTO doe_runs (study_id, run_number, factor_settings, notes, status, run_order) VALUES (?, ?, ?, ?, 'planned', ?)`,
      [studyId, runNumber, JSON.stringify(factor_settings || {}), notes || null]
    );
    await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [studyId]);
    res.status(201).json({ success: true, run: result[0] });
  } catch (err) {
    console.error('[DOE] add run error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/runs/:runId', async (req, res) => {
  const pool = req.app.locals.pool;
  const runId = parseInt(req.params.runId);
  const { factor_settings, notes, status, operator, started_at, completed_at, sop_link } = req.body;

  // RBAC
  const projectId = await getProjectForDoeEntity(pool, 'doe_runs', 'id', runId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  const fields = [];
  const values = [];
  let idx = 1;

  if (factor_settings !== undefined) { fields.push(`factor_settings = $${idx++}`); values.push(JSON.stringify(factor_settings)); }
  if (notes           !== undefined) { fields.push(`notes = $${idx++}`);           values.push(notes); }
  if (status          !== undefined) { fields.push(`status = $${idx++}`);          values.push(status); }
  if (operator        !== undefined) { fields.push(`operator = $${idx++}`);        values.push(operator); }
  if (started_at      !== undefined) { fields.push(`started_at = $${idx++}`);      values.push(started_at); }
  if (completed_at    !== undefined) { fields.push(`completed_at = $${idx++}`);    values.push(completed_at); }
  if (sop_link        !== undefined) { fields.push(`sop_link = $${idx++}`);        values.push(sop_link); }

  if (!fields.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
  values.push(runId);

  try {
    const [result] = await pool.query(
      `UPDATE doe_runs SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
    if (!result.length) return res.status(404).json({ success: false, message: 'Run not found' });
    await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [result[0].study_id]);
    res.json({ success: true, run: result[0] });
  } catch (err) {
    console.error('[DOE] update run error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/doe/runs/:runId/status — dedicated status transition endpoint
router.put('/runs/:runId/status', async (req, res) => {
  const pool = req.app.locals.pool;
  const runId = parseInt(req.params.runId);
  const { status, operator } = req.body;

  // RBAC: editor or admin required
  const projectId = await getProjectForDoeEntity(pool, 'doe_runs', 'id', runId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  const VALID_STATUSES = ['planned', 'running', 'complete', 'invalid'];
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: 'status must be one of: ' + VALID_STATUSES.join(', ') });
  }

  const fields = [`status = ?`];
  const values = [status];
  let idx = 2;

  if (status === 'running' && !req.body.started_at) {
    fields.push(`started_at = NOW()`);
  }
  if (status === 'complete' || status === 'invalid') {
    fields.push(`completed_at = NOW()`);
  }
  if (operator !== undefined) {
    fields.push(`operator = $${idx++}`);
    values.push(operator);
  }
  values.push(runId);

  try {
    const [result] = await pool.query(
      `UPDATE doe_runs SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );
    if (!result.length) return res.status(404).json({ success: false, message: 'Run not found' });
    await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [result[0].study_id]);
    res.json({ success: true, run: result[0] });
  } catch (err) {
    console.error('[DOE] update run status error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/runs/:runId', async (req, res) => {
  const pool = req.app.locals.pool;
  const runId = parseInt(req.params.runId);
  // RBAC
  const projectId = await getProjectForDoeEntity(pool, 'doe_runs', 'id', runId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
  try {
    const [result] = await pool.query(`DELETE FROM doe_runs WHERE id = ?
    if (!result.length) return res.status(404).json({ success: false, message: 'Run not found' });
    await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [result[0].study_id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[DOE] delete run error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/runs/:runId/results', async (req, res) => {
  const pool = req.app.locals.pool;
  const runId = parseInt(req.params.runId);
  const { response_id, value, notes } = req.body;
  if (!response_id) {
    return res.status(400).json({ success: false, message: 'response_id is required' });
  }
  // RBAC
  const projectId = await getProjectForDoeEntity(pool, 'doe_runs', 'id', runId);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;
  try {
    await pool.query(
      `INSERT INTO doe_run_results (run_id, response_id, value, notes)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value), notes = VALUES(notes)`,
      [runId, parseInt(response_id), value !== undefined ? value : null, notes || null]
    );
    const [runRes] = await pool.query(`SELECT study_id FROM doe_runs WHERE id = ?`, [runId]);
    if (runRes.length) {
      await pool.query(`UPDATE doe_studies SET updated_at = NOW() WHERE id = ?`, [runRes[0].study_id]);
    }
    const [resultRows] = await pool.query('SELECT * FROM doe_run_results WHERE run_id = ? AND response_id = ?', [runId, parseInt(response_id)]);
    res.json({ success: true, result: resultRows[0] });
  } catch (err) {
    console.error('[DOE] upsert result error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  DECISIONS — non-negotiable, required to close a study
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/doe/studies/:id/decision
router.get('/studies/:id/decision', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = parseInt(req.params.id);
  try {
    const [result] = await pool.query(`SELECT * FROM doe_decisions WHERE study_id = ?`, [id]);
    res.json({ success: true, decision: result[0] || null });
  } catch (err) {
    console.error('[DOE] get decision error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/doe/studies/:id/decision — upsert the study decision
router.post('/studies/:id/decision', async (req, res) => {
  const pool = req.app.locals.pool;
  const id = parseInt(req.params.id);
  const { decision, rejected_options, confidence_level, affected_node_ids } = req.body;

  if (!decision || !decision.trim()) {
    return res.status(400).json({ success: false, message: 'decision text is required' });
  }

  // RBAC: editor or admin required
  const projectId = await getProjectForDoeStudy(pool, id);
  if (!await assertEditorRole(pool, res, projectId, req.user?.id)) return;

  try {
    await pool.query(
      `INSERT INTO doe_decisions (study_id, decision, rejected_options, confidence_level, affected_node_ids)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         decision = VALUES(decision),
         rejected_options = VALUES(rejected_options),
         confidence_level = VALUES(confidence_level),
         affected_node_ids = VALUES(affected_node_ids),
         updated_at = NOW()`,
      [id, decision.trim(),
       JSON.stringify(rejected_options || []),
       confidence_level || 'medium',
       JSON.stringify(affected_node_ids || [])]
    );

    const [result] = await pool.query(
      'SELECT * FROM doe_decisions WHERE study_id = ?',
      [id]
    );
    // Mark study as completed now that decision exists
    await pool.query(
      `UPDATE doe_studies SET status = 'completed', updated_at = NOW() WHERE id = ? AND status != 'completed'`,
      [id]
    );
    res.json({ success: true, decision: result[0] });
  } catch (err) {
    console.error('[DOE] save decision error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
