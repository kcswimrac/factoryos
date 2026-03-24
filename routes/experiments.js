const express = require('express');
const router = express.Router();
const { analyzeFullFactorial } = require('../utils/statistics');
const { generateDesign } = require('../utils/designGenerator');

// ── Factor and response metadata (must be before /:id) ──────────────────────

router.get('/meta/factors', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM doe_factors ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Experiments] meta/factors error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/meta/responses', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM doe_responses ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Experiments] meta/responses error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Run measurements (must be before /:id) ───────────────────────────────────

router.put('/runs/measurements', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { runId, responseId, measuredValue, notes } = req.body;

    await pool.query(
      `INSERT INTO doe_run_measurements (run_id, response_id, measured_value, notes)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE measured_value = VALUES(measured_value), notes = VALUES(notes)`,
      [runId, responseId, measuredValue, notes]
    );

    // Update completed_runs count on the experiment
    const [runRows] = await pool.query(
      'SELECT experiment_id FROM doe_runs WHERE id = ?',
      [runId]
    );
    if (runRows.length > 0) {
      const expId = runRows[0].experiment_id;
      const [countRows] = await pool.query(
        `SELECT COUNT(DISTINCT r.id) AS completed
         FROM doe_runs r
         JOIN doe_run_measurements m ON r.id = m.run_id
         WHERE r.experiment_id = ? AND m.measured_value IS NOT NULL`,
        [expId]
      );
      await pool.query(
        'UPDATE doe_experiments SET completed_runs = ? WHERE id = ?',
        [countRows[0].completed, expId]
      );
    }

    res.json({ success: true, data: { runId, responseId, measuredValue } });
  } catch (err) {
    console.error('[Experiments] update measurement error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Base experiment routes ───────────────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const userId = req.query.userId || 1;

    const [rows] = await pool.query(
      `SELECT * FROM doe_experiments WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Experiments] list error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const {
      name, description, designType, factors, responses,
      userId = 1, projectId = null
    } = req.body;

    // Generate design matrix
    const designRuns = generateDesign(designType, factors);
    const totalRuns = designRuns.length;

    // Insert experiment
    const [result] = await pool.query(
      `INSERT INTO doe_experiments (name, description, design_type, user_id, project_id, total_runs, status)
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [name, description, designType, userId, projectId, totalRuns]
    );
    const experimentId = result.insertId;

    // Insert factors
    for (const factor of factors) {
      await pool.query(
        `INSERT INTO doe_experiment_factors (experiment_id, factor_id, low_level, high_level, center_point)
         VALUES (?, ?, ?, ?, ?)`,
        [experimentId, factor.id, factor.lowLevel, factor.highLevel,
         factor.centerPoint || (factor.lowLevel + factor.highLevel) / 2]
      );
    }

    // Insert responses
    for (const resp of responses) {
      await pool.query(
        `INSERT INTO doe_experiment_responses (experiment_id, response_id, goal, target_value)
         VALUES (?, ?, ?, ?)`,
        [experimentId, resp.id, resp.goal || 'maximize', resp.targetValue || null]
      );
    }

    // Insert runs
    for (const run of designRuns) {
      const [runResult] = await pool.query(
        `INSERT INTO doe_runs (experiment_id, run_number, run_type)
         VALUES (?, ?, ?)`,
        [experimentId, run.runNumber, run.runType]
      );
      const runId = runResult.insertId;

      // Insert factor levels for each run
      for (const fl of run.factorLevels) {
        await pool.query(
          `INSERT INTO doe_run_factor_levels (run_id, factor_id, level_value, level_coded)
           VALUES (?, ?, ?, ?)`,
          [runId, fl.factorId, fl.levelValue, fl.levelCoded]
        );
      }
    }

    res.status(201).json({
      success: true,
      data: { id: experimentId, name, designType, totalRuns }
    });
  } catch (err) {
    console.error('[Experiments] create error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Parameterized routes (must be LAST) ──────────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);

    const [experiments] = await pool.query(
      'SELECT * FROM doe_experiments WHERE id = ?',
      [id]
    );
    if (experiments.length === 0) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }

    const experiment = experiments[0];

    // Get factors
    const [factors] = await pool.query(
      `SELECT ef.*, f.name as factor_name, f.unit
       FROM doe_experiment_factors ef
       JOIN doe_factors f ON ef.factor_id = f.id
       WHERE ef.experiment_id = ?`,
      [id]
    );

    // Get responses
    const [responses] = await pool.query(
      `SELECT er.*, r.name as response_name, r.unit
       FROM doe_experiment_responses er
       JOIN doe_responses r ON er.response_id = r.id
       WHERE er.experiment_id = ?`,
      [id]
    );

    // Get runs with factor levels and measurements
    const [runs] = await pool.query(
      'SELECT * FROM doe_runs WHERE experiment_id = ? ORDER BY run_number',
      [id]
    );

    for (const run of runs) {
      const [factorLevels] = await pool.query(
        `SELECT rfl.*, f.name as factor_name
         FROM doe_run_factor_levels rfl
         JOIN doe_factors f ON rfl.factor_id = f.id
         WHERE rfl.run_id = ?`,
        [run.id]
      );
      run.factor_levels = factorLevels;

      const [measurements] = await pool.query(
        `SELECT rm.*, r.name as response_name
         FROM doe_run_measurements rm
         JOIN doe_responses r ON rm.response_id = r.id
         WHERE rm.run_id = ?`,
        [run.id]
      );
      run.measurements = measurements;
    }

    experiment.factors = factors;
    experiment.responses = responses;
    experiment.runs = runs;

    res.json({ success: true, data: experiment });
  } catch (err) {
    console.error('[Experiments] get by id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/analysis', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);

    const [results] = await pool.query(
      'SELECT * FROM doe_analysis_results WHERE experiment_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    if (results.length === 0) {
      return res.json({ success: true, data: null });
    }

    const result = results[0];
    result.results_json = typeof result.results_json === 'string'
      ? JSON.parse(result.results_json)
      : result.results_json;

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Experiments] get analysis error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/analyze', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);
    const responseId = req.query.responseId || null;

    // Get experiment with runs, factor levels, and measurements
    const [experiments] = await pool.query(
      'SELECT * FROM doe_experiments WHERE id = ?',
      [id]
    );
    if (experiments.length === 0) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }

    // Get factors
    const [factors] = await pool.query(
      `SELECT ef.factor_id as id, f.name, ef.low_level, ef.high_level
       FROM doe_experiment_factors ef
       JOIN doe_factors f ON ef.factor_id = f.id
       WHERE ef.experiment_id = ?`,
      [id]
    );

    // Get responses
    const [responses] = await pool.query(
      `SELECT er.response_id as id, r.name, er.goal
       FROM doe_experiment_responses er
       JOIN doe_responses r ON er.response_id = r.id
       WHERE er.experiment_id = ?`,
      [id]
    );

    // Get runs with data
    const [runs] = await pool.query(
      'SELECT * FROM doe_runs WHERE experiment_id = ?',
      [id]
    );

    for (const run of runs) {
      const [factorLevels] = await pool.query(
        `SELECT rfl.factor_id, rfl.level_value, rfl.level_coded, f.name as factor_name
         FROM doe_run_factor_levels rfl
         JOIN doe_factors f ON rfl.factor_id = f.id
         WHERE rfl.run_id = ?`,
        [run.id]
      );
      run.factor_levels = factorLevels;

      const [measurements] = await pool.query(
        'SELECT * FROM doe_run_measurements WHERE run_id = ?',
        [run.id]
      );
      run.measurements = measurements;
    }

    // Run analysis for each response (or just the specified one)
    const targetResponses = responseId
      ? responses.filter(r => r.id === parseInt(responseId))
      : responses;

    const analysisResults = {};
    for (const response of targetResponses) {
      try {
        analysisResults[response.name] = analyzeFullFactorial(runs, factors, response);
      } catch (err) {
        analysisResults[response.name] = { error: err.message };
      }
    }

    // Store results
    await pool.query(
      `INSERT INTO doe_analysis_results (experiment_id, response_id, results_json)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE results_json = VALUES(results_json)`,
      [id, responseId || targetResponses[0]?.id, JSON.stringify(analysisResults)]
    );

    // Update experiment status
    await pool.query(
      "UPDATE doe_experiments SET status = 'analyzed' WHERE id = ?",
      [id]
    );

    res.json({ success: true, data: analysisResults });
  } catch (err) {
    console.error('[Experiments] analyze error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
