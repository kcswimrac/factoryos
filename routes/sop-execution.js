/**
 * T2.5: SOP Execution Mode
 * Step-by-step execution tracking with per-step sign-off and completion.
 *
 * Mounted at /api/sops/:sopId/executions
 */
const express = require('express');
const router = express.Router({ mergeParams: true });

// ── GET / — list executions for an SOP ───────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { sopId } = req.params;

    const [rows] = await pool.query(
      `SELECT e.*,
         (SELECT COUNT(*) FROM sop_execution_steps s WHERE s.execution_id = e.id AND s.status = 'completed') AS completed_steps,
         (SELECT COUNT(*) FROM sop_execution_steps s WHERE s.execution_id = e.id) AS total_steps
       FROM sop_executions e
       WHERE e.sop_id = ?
       ORDER BY e.started_at DESC`,
      [sopId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST / — start a new execution session ───────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { sopId } = req.params;
    const { startedBy } = req.body;

    // Get SOP steps to create execution step records
    const [steps] = await pool.query(
      'SELECT id, step_order FROM sop_steps WHERE sop_id = ? ORDER BY step_order ASC',
      [sopId]
    );

    if (steps.length === 0) {
      return res.status(400).json({ success: false, error: 'SOP has no steps to execute' });
    }

    // Create execution record
    const [result] = await pool.query(
      'INSERT INTO sop_executions (sop_id, started_by) VALUES (?, ?)',
      [sopId, startedBy || 'Unknown']
    );
    const executionId = result.insertId;

    // Create step records for each SOP step
    for (const step of steps) {
      await pool.query(
        `INSERT INTO sop_execution_steps (execution_id, step_id, step_order)
         VALUES (?, ?, ?)`,
        [executionId, step.id, step.step_order]
      );
    }

    res.status(201).json({
      success: true,
      data: { id: executionId, totalSteps: steps.length, status: 'in_progress' }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /:executionId — get execution with step status ───────────────────────

router.get('/:executionId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { executionId } = req.params;

    const [executions] = await pool.query(
      'SELECT * FROM sop_executions WHERE id = ?',
      [executionId]
    );
    if (executions.length === 0) {
      return res.status(404).json({ success: false, error: 'Execution not found' });
    }

    const execution = executions[0];

    // Get step statuses joined with actual step content
    const [steps] = await pool.query(
      `SELECT es.*, ss.title AS step_title, ss.description AS step_description,
              ss.tools, ss.hazards, ss.images
       FROM sop_execution_steps es
       JOIN sop_steps ss ON es.step_id = ss.id
       WHERE es.execution_id = ?
       ORDER BY es.step_order ASC`,
      [executionId]
    );

    execution.steps = steps;
    execution.completedSteps = steps.filter(s => s.status === 'completed').length;
    execution.totalSteps = steps.length;
    execution.progress = steps.length > 0
      ? Math.round((execution.completedSteps / steps.length) * 100)
      : 0;

    // Find current step (first non-completed)
    execution.currentStep = steps.find(s => s.status === 'pending') || null;

    res.json({ success: true, data: execution });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /:executionId/steps/:stepId — sign off on a step ─────────────────────

router.put('/:executionId/steps/:stepId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { executionId, stepId } = req.params;
    const { status, completedBy, signOffNotes } = req.body;

    if (!['completed', 'skipped', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be completed, skipped, or failed' });
    }

    // Enforce sequential execution — check that all prior steps are done
    const [currentStep] = await pool.query(
      'SELECT step_order FROM sop_execution_steps WHERE execution_id = ? AND step_id = ?',
      [executionId, stepId]
    );
    if (currentStep.length === 0) {
      return res.status(404).json({ success: false, error: 'Step not found in this execution' });
    }

    const [priorIncomplete] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM sop_execution_steps
       WHERE execution_id = ? AND step_order < ? AND status = 'pending'`,
      [executionId, currentStep[0].step_order]
    );
    if (priorIncomplete[0].cnt > 0) {
      return res.status(400).json({
        success: false,
        error: 'Complete prior steps first — sequential execution required'
      });
    }

    // Update step
    await pool.query(
      `UPDATE sop_execution_steps
       SET status = ?, completed_by = ?, completed_at = NOW(), sign_off_notes = ?
       WHERE execution_id = ? AND step_id = ?`,
      [status, completedBy || 'Unknown', signOffNotes || null, executionId, stepId]
    );

    // Check if all steps are done — auto-complete execution
    const [remaining] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM sop_execution_steps
       WHERE execution_id = ? AND status = 'pending'`,
      [executionId]
    );

    if (remaining[0].cnt === 0) {
      await pool.query(
        "UPDATE sop_executions SET status = 'completed', completed_at = NOW() WHERE id = ?",
        [executionId]
      );
    }

    res.json({
      success: true,
      message: 'Step signed off',
      allComplete: remaining[0].cnt === 0
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /:executionId/abort — abort an execution ─────────────────────────────

router.put('/:executionId/abort', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { executionId } = req.params;
    const { notes } = req.body;

    await pool.query(
      "UPDATE sop_executions SET status = 'aborted', notes = ?, completed_at = NOW() WHERE id = ?",
      [notes || 'Aborted', executionId]
    );

    res.json({ success: true, message: 'Execution aborted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
