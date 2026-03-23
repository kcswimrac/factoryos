const express = require('express');
const router = express.Router();

// ── Phase configuration ──────────────────────────────────────────────────────

const PHASES = [
  { number: 1, name: 'requirements', displayName: 'Define Requirements' },
  { number: 2, name: 'research', displayName: 'Research & Development' },
  { number: 3, name: 'design', displayName: 'Design / CAD' },
  { number: 4, name: 'data_collection', displayName: 'Data Collection' },
  { number: 5, name: 'analysis', displayName: 'Analysis / Calculations' },
  { number: 6, name: 'testing', displayName: 'Testing / Validation' },
  { number: 7, name: 'correlation', displayName: 'Correlation' },
  { number: 8, name: 'serviceability', displayName: 'Serviceability' },
  { number: 9, name: 'manufacturability', displayName: 'Manufacturability' }
];

const DEFAULT_QUESTIONS = {
  1: [
    'Are all performance requirements clearly defined and measurable?',
    'Have all design constraints been identified and documented?',
    'Are success criteria quantifiable and verifiable?',
    'Are requirements within your team\'s control to achieve?'
  ],
  2: [
    'Have existing solutions been analyzed for applicability?',
    'Have alternative technologies been evaluated?',
    'Is proof-of-concept testing completed and documented?',
    'Does all R&D directly support meeting specifications?'
  ],
  3: [
    'Have all 3D models been completed for this component?',
    'Are detailed drawings generated with all critical dimensions?',
    'Is GD&T applied to all critical dimensions?',
    'Is each design feature mapped to a requirement?'
  ],
  4: [
    'Have all required measurements been gathered?',
    'Is test equipment specified and calibration documented?',
    'Are boundary conditions clearly defined?',
    'Is data quality confidence level established?'
  ],
  5: [
    'Have analytical methods (FEA, hand calcs) been applied?',
    'Are all assumptions documented?',
    'Are safety factors determined and justified?',
    'Does analysis validate design meets requirements?'
  ],
  6: [
    'Is a structured test plan documented with clear purposes?',
    'Are all failures documented with root causes?',
    'Are test results compared against specifications?',
    'Is statistical analysis of test runs completed?'
  ],
  7: [
    'Have analytical predictions been compared to test results?',
    'Is correlation accuracy calculated and acceptable?',
    'Are correlation coefficients documented?',
    'Are lessons learned captured for future designs?'
  ],
  8: [
    'Are routine maintenance requirements documented?',
    'Are tool requirements for service specified?',
    'Are service intervals defined?',
    'Is component accessibility adequate for field repair?'
  ],
  9: [
    'Has DFM analysis been completed?',
    'Are tooling requirements documented?',
    'Is cost breakdown analysis complete?',
    'Are quality control points defined?'
  ]
};

// ── GET / — list all design projects ─────────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      `SELECT dp.*,
         (SELECT COUNT(*) FROM design_phases ph WHERE ph.project_id = dp.id AND ph.status = 'completed') AS completed_phases
       FROM design_projects dp
       ORDER BY dp.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[DesignCycle] list error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch projects' });
  }
});

// ── POST / — create a new design project ─────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { name, description, hierarchyLevel = 'component', owner, teamSize = 1, targetDate } = req.body;

    // Generate project number
    const year = new Date().getFullYear();
    const [countRows] = await pool.query('SELECT COUNT(*) AS cnt FROM design_projects');
    const num = String(countRows[0].cnt + 1).padStart(3, '0');
    const projectNumber = `PRJ-${year}-${num}`;

    const [result] = await pool.query(
      `INSERT INTO design_projects (project_number, name, description, hierarchy_level, owner, team_size, target_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectNumber, name, description, hierarchyLevel, owner, teamSize, targetDate || null]
    );
    const projectId = result.insertId;

    // Create all 9 phases with default questions
    for (const phase of PHASES) {
      const [phaseResult] = await pool.query(
        `INSERT INTO design_phases (project_id, phase_number, phase_name, display_name)
         VALUES (?, ?, ?, ?)`,
        [projectId, phase.number, phase.name, phase.displayName]
      );
      const phaseId = phaseResult.insertId;

      const questions = DEFAULT_QUESTIONS[phase.number];
      for (let i = 0; i < questions.length; i++) {
        await pool.query(
          `INSERT INTO design_phase_questions (phase_id, question_number, question_text)
           VALUES (?, ?, ?)`,
          [phaseId, i + 1, questions[i]]
        );
      }
    }

    res.status(201).json({
      success: true,
      data: { id: projectId, projectNumber, name }
    });
  } catch (err) {
    console.error('[DesignCycle] create error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// ── GET /:id — get project with all phases ───────────────────────────────────

router.get('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);

    const [projects] = await pool.query('SELECT * FROM design_projects WHERE id = ?', [id]);
    if (projects.length === 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const project = projects[0];

    // Get phases with questions
    const [phases] = await pool.query(
      'SELECT * FROM design_phases WHERE project_id = ? ORDER BY phase_number',
      [id]
    );

    for (const phase of phases) {
      const [questions] = await pool.query(
        'SELECT * FROM design_phase_questions WHERE phase_id = ? ORDER BY question_number',
        [phase.id]
      );
      phase.questions = questions;
    }

    project.phases = phases;

    res.json({ success: true, data: project });
  } catch (err) {
    console.error('[DesignCycle] get error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

// ── GET /:id/phases/:phaseNumber ─────────────────────────────────────────────

router.get('/:id/phases/:phaseNumber', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);
    const phaseNumber = parseInt(req.params.phaseNumber, 10);

    const [phases] = await pool.query(
      'SELECT * FROM design_phases WHERE project_id = ? AND phase_number = ?',
      [projectId, phaseNumber]
    );
    if (phases.length === 0) {
      return res.status(404).json({ success: false, error: 'Phase not found' });
    }

    const phase = phases[0];
    const [questions] = await pool.query(
      'SELECT * FROM design_phase_questions WHERE phase_id = ? ORDER BY question_number',
      [phase.id]
    );
    phase.questions = questions;

    res.json({ success: true, data: phase });
  } catch (err) {
    console.error('[DesignCycle] get-phase error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch phase' });
  }
});

// ── PUT /:id/phases/:phaseNumber — update phase status/notes ─────────────────

router.put('/:id/phases/:phaseNumber', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);
    const phaseNumber = parseInt(req.params.phaseNumber, 10);
    const { status, notes, progressPercentage } = req.body;

    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (progressPercentage !== undefined) { updates.push('progress_percentage = ?'); params.push(progressPercentage); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    params.push(projectId, phaseNumber);
    await pool.query(
      `UPDATE design_phases SET ${updates.join(', ')} WHERE project_id = ? AND phase_number = ?`,
      params
    );

    // Update project current_phase and overall_progress
    const [phases] = await pool.query(
      'SELECT phase_number, status, progress_percentage FROM design_phases WHERE project_id = ? ORDER BY phase_number',
      [projectId]
    );

    let currentPhase = 1;
    let totalProgress = 0;
    for (const p of phases) {
      totalProgress += (p.progress_percentage || 0);
      if (p.status === 'completed') currentPhase = p.phase_number + 1;
    }
    const overallProgress = Math.round(totalProgress / 9);

    await pool.query(
      'UPDATE design_projects SET current_phase = ?, overall_progress = ? WHERE id = ?',
      [Math.min(currentPhase, 9), overallProgress, projectId]
    );

    res.json({ success: true, message: 'Phase updated' });
  } catch (err) {
    console.error('[DesignCycle] update-phase error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update phase' });
  }
});

// ── PUT /:id/phases/:phaseNumber/questions/:questionNumber ───────────────────

router.put('/:id/phases/:phaseNumber/questions/:questionNumber', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);
    const phaseNumber = parseInt(req.params.phaseNumber, 10);
    const questionNumber = parseInt(req.params.questionNumber, 10);
    const { answerStatus, answerNotes } = req.body;

    // Find the phase
    const [phases] = await pool.query(
      'SELECT id FROM design_phases WHERE project_id = ? AND phase_number = ?',
      [projectId, phaseNumber]
    );
    if (phases.length === 0) {
      return res.status(404).json({ success: false, error: 'Phase not found' });
    }

    const updates = [];
    const params = [];
    if (answerStatus) { updates.push('answer_status = ?'); params.push(answerStatus); }
    if (answerNotes !== undefined) { updates.push('answer_notes = ?'); params.push(answerNotes); }

    params.push(phases[0].id, questionNumber);
    await pool.query(
      `UPDATE design_phase_questions SET ${updates.join(', ')} WHERE phase_id = ? AND question_number = ?`,
      params
    );

    // Recalculate phase progress based on answered questions
    const [questions] = await pool.query(
      'SELECT answer_status FROM design_phase_questions WHERE phase_id = ?',
      [phases[0].id]
    );
    const answered = questions.filter(q => q.answer_status === 'yes').length;
    const progress = Math.round((answered / questions.length) * 100);
    const phaseStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started';

    await pool.query(
      'UPDATE design_phases SET progress_percentage = ?, status = ? WHERE id = ?',
      [progress, phaseStatus, phases[0].id]
    );

    res.json({ success: true, message: 'Question updated', progress });
  } catch (err) {
    console.error('[DesignCycle] answer-question error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update question' });
  }
});

// ── POST /:id/chat — AI chat for design guidance ────────────────────────────

router.post('/:id/chat', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);
    const { message, role = 'user' } = req.body;

    // Store user message
    await pool.query(
      'INSERT INTO design_ai_chats (project_id, role, message) VALUES (?, ?, ?)',
      [projectId, role, message]
    );

    // Generate AI response (placeholder — integrate OpenAI in production)
    const aiResponse = `Thank you for your question about this design project. Based on the 9-phase engineering design methodology, I recommend focusing on completing the current phase's checklist items before moving forward. Each phase builds on the previous one, ensuring thorough engineering rigor.`;

    await pool.query(
      'INSERT INTO design_ai_chats (project_id, role, message) VALUES (?, ?, ?)',
      [projectId, 'assistant', aiResponse]
    );

    res.json({ success: true, data: { role: 'assistant', message: aiResponse } });
  } catch (err) {
    console.error('[DesignCycle] chat error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to process chat' });
  }
});

module.exports = router;
