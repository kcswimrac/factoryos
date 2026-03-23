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

// ══════════════════════════════════════════════════════════════════════════════
// Phase 3: Extended Design Cycle Endpoints
// ══════════════════════════════════════════════════════════════════════════════

// ── PUT /:id — update project ────────────────────────────────────────────────

router.put('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);
    const allowed = ['name', 'description', 'hierarchy_level', 'status', 'owner', 'team_size', 'target_date'];
    const updates = [];
    const params = [];

    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No valid fields' });

    params.push(id);
    await pool.query(`UPDATE design_projects SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Project updated' });
  } catch (err) {
    console.error('[DesignCycle] update-project error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /:id — delete project ─────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM design_projects WHERE id = ?', [id]);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    console.error('[DesignCycle] delete-project error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /:id/phases/:phaseNumber/complete ───────────────────────────────────

router.post('/:id/phases/:phaseNumber/complete', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);
    const phaseNumber = req.params.phaseNumber;

    await pool.query(
      "UPDATE design_phases SET status = 'completed', progress_percentage = 100 WHERE project_id = ? AND phase_number = ?",
      [projectId, phaseNumber]
    );

    // Mark all questions as 'yes'
    const [phases] = await pool.query(
      'SELECT id FROM design_phases WHERE project_id = ? AND phase_number = ?',
      [projectId, phaseNumber]
    );
    if (phases.length > 0) {
      await pool.query(
        "UPDATE design_phase_questions SET answer_status = 'yes' WHERE phase_id = ?",
        [phases[0].id]
      );
    }

    res.json({ success: true, message: 'Phase completed' });
  } catch (err) {
    console.error('[DesignCycle] complete-phase error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Requirements Management
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:id/requirements', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_requirements WHERE project_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/requirements', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { title, description, type, priority, targetValue, unit, verificationMethod, nodeId } = req.body;
    const [result] = await pool.query(
      `INSERT INTO design_requirements (project_id, node_id, title, description, type, priority, target_value, unit, verification_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, nodeId || null, title, description, type || 'performance', priority || 'medium',
       targetValue || null, unit || null, verificationMethod || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:id/requirements/:reqId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['title', 'description', 'type', 'priority', 'status', 'target_value', 'unit', 'verification_method'];
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No valid fields' });
    params.push(req.params.reqId);
    await pool.query(`UPDATE design_requirements SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Requirement updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:id/requirements/:reqId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM design_requirements WHERE id = ?', [req.params.reqId]);
    res.json({ success: true, message: 'Requirement deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/requirements/:reqId/traces', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_requirement_traces WHERE requirement_id = ?',
      [req.params.reqId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/requirements/:reqId/traces', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { traceType, traceTargetId, traceTargetName, status } = req.body;
    const [result] = await pool.query(
      `INSERT INTO design_requirement_traces (requirement_id, trace_type, trace_target_id, trace_target_name, status)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.reqId, traceType, traceTargetId || null, traceTargetName || null, status || 'pending']
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/requirements/trace-coverage', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = req.params.id;
    const [total] = await pool.query('SELECT COUNT(*) AS cnt FROM design_requirements WHERE project_id = ?', [projectId]);
    const [traced] = await pool.query(
      `SELECT COUNT(DISTINCT r.id) AS cnt FROM design_requirements r
       JOIN design_requirement_traces t ON r.id = t.requirement_id
       WHERE r.project_id = ?`,
      [projectId]
    );
    const totalCount = total[0].cnt;
    const tracedCount = traced[0].cnt;
    res.json({
      success: true,
      data: { total: totalCount, traced: tracedCount, coverage: totalCount > 0 ? Math.round((tracedCount / totalCount) * 100) : 0 }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Gate Approvals
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:id/gates', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT g.*, (SELECT JSON_ARRAYAGG(JSON_OBJECT("id", c.id, "author", c.author, "comment", c.comment, "created_at", c.created_at)) FROM design_gate_comments c WHERE c.gate_id = g.id) AS comments FROM design_gates g WHERE g.project_id = ? ORDER BY g.gate_key',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/gates/:gateKey/approve', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { approvedBy } = req.body;
    await pool.query(
      `INSERT INTO design_gates (project_id, gate_key, gate_name, status, approved_by, approved_at)
       VALUES (?, ?, ?, 'approved', ?, NOW())
       ON DUPLICATE KEY UPDATE status = 'approved', approved_by = VALUES(approved_by), approved_at = NOW()`,
      [req.params.id, req.params.gateKey, `Gate ${req.params.gateKey}`, approvedBy || 'System']
    );
    res.json({ success: true, message: 'Gate approved' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/gates/:gateKey/reject', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { reason } = req.body;
    await pool.query(
      `INSERT INTO design_gates (project_id, gate_key, gate_name, status, rejection_reason)
       VALUES (?, ?, ?, 'rejected', ?)
       ON DUPLICATE KEY UPDATE status = 'rejected', rejection_reason = VALUES(rejection_reason)`,
      [req.params.id, req.params.gateKey, `Gate ${req.params.gateKey}`, reason || '']
    );
    res.json({ success: true, message: 'Gate rejected' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/gates/:gateKey/comments', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { comment, author } = req.body;
    // Ensure gate exists
    await pool.query(
      `INSERT IGNORE INTO design_gates (project_id, gate_key, gate_name) VALUES (?, ?, ?)`,
      [req.params.id, req.params.gateKey, `Gate ${req.params.gateKey}`]
    );
    const [gates] = await pool.query(
      'SELECT id FROM design_gates WHERE project_id = ? AND gate_key = ?',
      [req.params.id, req.params.gateKey]
    );
    if (gates.length > 0) {
      await pool.query(
        'INSERT INTO design_gate_comments (gate_id, author, comment) VALUES (?, ?, ?)',
        [gates[0].id, author || 'Anonymous', comment]
      );
    }
    res.json({ success: true, message: 'Comment added' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/gates/:gateKey/reset', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query(
      `UPDATE design_gates SET status = 'pending', approved_by = NULL, approved_at = NULL, rejection_reason = NULL
       WHERE project_id = ? AND gate_key = ?`,
      [req.params.id, req.params.gateKey]
    );
    res.json({ success: true, message: 'Gate reset' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Interfaces
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:id/interfaces', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM design_interfaces WHERE project_id = ?', [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:id/interfaces/:interfaceKey', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { name, description, type, status, sourceNodeId, targetNodeId } = req.body;
    await pool.query(
      `INSERT INTO design_interfaces (project_id, interface_key, name, description, type, status, source_node_id, target_node_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), type = VALUES(type),
       status = VALUES(status), source_node_id = VALUES(source_node_id), target_node_id = VALUES(target_node_id)`,
      [req.params.id, req.params.interfaceKey, name, description, type, status || 'defined', sourceNodeId, targetNodeId]
    );
    res.json({ success: true, message: 'Interface updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:id/interfaces/:interfaceKey', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM design_interfaces WHERE project_id = ? AND interface_key = ?',
      [req.params.id, req.params.interfaceKey]);
    res.json({ success: true, message: 'Interface deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/interfaces/adjacent-nodes', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      `SELECT DISTINCT dn.* FROM design_nodes dn
       JOIN design_interfaces di ON (dn.id = di.source_node_id OR dn.id = di.target_node_id)
       WHERE di.project_id = ?`,
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/interfaces/adjacent-nodes/:nodeId/approve', async (req, res) => {
  res.json({ success: true, message: 'Adjacent node approved' });
});

router.post('/:id/interfaces/adjacent-nodes/:nodeId/reject', async (req, res) => {
  res.json({ success: true, message: 'Adjacent node rejected' });
});

// ══════════════════════════════════════════════════════════════════════════════
// AI Score
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:id/ai-score', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);

    // Calculate score from phase completion
    const [phases] = await pool.query(
      'SELECT progress_percentage FROM design_phases WHERE project_id = ?',
      [projectId]
    );
    const avgProgress = phases.length > 0
      ? phases.reduce((s, p) => s + (p.progress_percentage || 0), 0) / phases.length
      : 0;

    const phaseScores = {};
    const [phasesDetail] = await pool.query(
      'SELECT phase_number, phase_name, progress_percentage FROM design_phases WHERE project_id = ? ORDER BY phase_number',
      [projectId]
    );
    phasesDetail.forEach(p => { phaseScores[p.phase_name] = p.progress_percentage || 0; });

    res.json({
      success: true,
      data: {
        overall_score: Math.round(avgProgress),
        phase_scores: phaseScores,
        recommendations: avgProgress < 50
          ? ['Complete more phase checklist items to improve your score']
          : ['Good progress! Focus on remaining incomplete phases']
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/ai-score/history', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_ai_scores WHERE project_id = ? ORDER BY calculated_at DESC LIMIT 20',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/ai-score/recalculate', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);

    const [phases] = await pool.query(
      'SELECT phase_name, progress_percentage FROM design_phases WHERE project_id = ?',
      [projectId]
    );
    const phaseScores = {};
    phases.forEach(p => { phaseScores[p.phase_name] = p.progress_percentage || 0; });
    const overall = phases.length > 0
      ? Math.round(phases.reduce((s, p) => s + (p.progress_percentage || 0), 0) / phases.length)
      : 0;

    await pool.query(
      'INSERT INTO design_ai_scores (project_id, overall_score, phase_scores, recommendations) VALUES (?, ?, ?, ?)',
      [projectId, overall, JSON.stringify(phaseScores), JSON.stringify(['Score recalculated'])]
    );

    res.json({ success: true, data: { overall_score: overall, phase_scores: phaseScores } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Revisions
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:id/revisions', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_revisions WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/revisions/:revId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM design_revisions WHERE id = ?', [req.params.revId]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Revision not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/revisions', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { title, description, changedBy } = req.body;
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM design_revisions WHERE project_id = ?', [req.params.id]
    );
    const revNum = `REV-${String(countRows[0].cnt + 1).padStart(3, '0')}`;

    const [result] = await pool.query(
      `INSERT INTO design_revisions (project_id, revision_number, title, description, changed_by)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.id, revNum, title, description, changedBy]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, revisionNumber: revNum } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/revisions/:revId/diff', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT snapshot_json FROM design_revisions WHERE id = ?', [req.params.revId]);
    res.json({ success: true, data: { diff: rows.length > 0 ? rows[0].snapshot_json : null } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:id/revisions/:revId/lifecycle', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { lifecycle } = req.body;
    await pool.query('UPDATE design_revisions SET lifecycle = ? WHERE id = ?', [lifecycle, req.params.revId]);
    res.json({ success: true, message: 'Lifecycle updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Learning Loops
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:id/learning-loops', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_learning_loops WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/learning-loops', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { title, description, sourcePhase, targetPhase } = req.body;
    const [result] = await pool.query(
      `INSERT INTO design_learning_loops (project_id, title, description, source_phase, target_phase)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.id, title, description, sourcePhase, targetPhase]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/learning-loops/:loopId/complete', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { outcome } = req.body;
    await pool.query(
      "UPDATE design_learning_loops SET status = 'completed', outcome = ?, completed_at = NOW() WHERE id = ?",
      [outcome || null, req.params.loopId]
    );
    res.json({ success: true, message: 'Learning loop completed' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Rigor Tier
// ══════════════════════════════════════════════════════════════════════════════

router.put('/:id/rigor-tier', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { tier } = req.body;
    await pool.query('UPDATE design_projects SET hierarchy_level = ? WHERE id = ?', [tier, req.params.id]);
    res.json({ success: true, message: 'Rigor tier updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Documents / Artifacts
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:id/phases/:phaseKey/documents', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_documents WHERE project_id = ? AND phase_key = ? ORDER BY created_at DESC',
      [req.params.id, req.params.phaseKey]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/phases/:phaseKey/documents', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { filename, fileType, fileSize, fileUrl, metadata, uploadedBy } = req.body;
    const [result] = await pool.query(
      `INSERT INTO design_documents (project_id, phase_key, filename, file_type, file_size, file_url, metadata, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, req.params.phaseKey, filename, fileType, fileSize, fileUrl, JSON.stringify(metadata || {}), uploadedBy]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:id/documents/:docId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM design_documents WHERE id = ?', [req.params.docId]);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Knowledge Base
// ══════════════════════════════════════════════════════════════════════════════

router.post('/:id/promote-to-knowledge', async (req, res) => {
  // Placeholder — knowledge base integration
  res.json({ success: true, message: 'Promoted to knowledge base' });
});

// ══════════════════════════════════════════════════════════════════════════════
// Project Hierarchy (Node Tree)
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:id/tree', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_nodes WHERE project_id = ? ORDER BY sort_order, name',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/nodes/:nodeId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM design_nodes WHERE id = ?', [req.params.nodeId]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Node not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/nodes', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { name, nodeType, description, parentId, sortOrder } = req.body;
    const [result] = await pool.query(
      `INSERT INTO design_nodes (project_id, parent_id, name, node_type, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, parentId || null, name, nodeType || 'component', description || null, sortOrder || 0]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:id/nodes/:nodeId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['name', 'node_type', 'description', 'status', 'sort_order', 'parent_id'];
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No valid fields' });
    params.push(req.params.nodeId);
    await pool.query(`UPDATE design_nodes SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Node updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/:id/nodes/:nodeId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM design_nodes WHERE id = ?', [req.params.nodeId]);
    res.json({ success: true, message: 'Node deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/:id/nodes/:nodeId/type', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { node_type } = req.body;
    await pool.query('UPDATE design_nodes SET node_type = ? WHERE id = ?', [node_type, req.params.nodeId]);
    res.json({ success: true, message: 'Node type updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/nodes/:nodeId/allowed-children', async (req, res) => {
  // All types can be children
  res.json({ success: true, data: ['system', 'subsystem', 'component', 'part', 'assembly'] });
});

router.get('/:id/rollup-metrics', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = req.params.id;
    const [phases] = await pool.query(
      'SELECT phase_name, progress_percentage, status FROM design_phases WHERE project_id = ?',
      [projectId]
    );
    const [reqs] = await pool.query('SELECT COUNT(*) AS cnt FROM design_requirements WHERE project_id = ?', [projectId]);
    const [nodes] = await pool.query('SELECT COUNT(*) AS cnt FROM design_nodes WHERE project_id = ?', [projectId]);
    res.json({
      success: true,
      data: { phases, requirementCount: reqs[0].cnt, nodeCount: nodes[0].cnt }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/nodes/:nodeId/rollup-metrics', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [children] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM design_nodes WHERE parent_id = ?',
      [req.params.nodeId]
    );
    res.json({ success: true, data: { childCount: children[0].cnt } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/:id/nodes/:nodeId/move', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { new_parent_id } = req.body;
    await pool.query('UPDATE design_nodes SET parent_id = ? WHERE id = ?', [new_parent_id, req.params.nodeId]);
    res.json({ success: true, message: 'Node moved' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Node-specific endpoints
router.get('/:id/nodes/:nodeId/requirements', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_requirements WHERE project_id = ? AND node_id = ?',
      [req.params.id, req.params.nodeId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/nodes/:nodeId/phases', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_phases WHERE project_id = ? ORDER BY phase_number',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/nodes/:nodeId/artifacts', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_documents WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Engineering Reports
// ══════════════════════════════════════════════════════════════════════════════

router.get('/:id/report-options', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'design_review', name: 'Design Review Report', description: 'Comprehensive design review document' },
      { id: 'requirements_trace', name: 'Requirements Traceability', description: 'Requirements trace matrix' },
      { id: 'phase_summary', name: 'Phase Summary', description: 'Summary of all phase completions' },
      { id: 'gate_status', name: 'Gate Status Report', description: 'Gate approval status overview' }
    ]
  });
});

router.get('/:id/nodes/:nodeId/report-options', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'node_detail', name: 'Node Detail Report', description: 'Detailed report for this node' },
      { id: 'node_requirements', name: 'Node Requirements', description: 'Requirements allocated to this node' }
    ]
  });
});

router.post('/:id/reports/run', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { reportType, title, config } = req.body;
    const [result] = await pool.query(
      `INSERT INTO design_reports (project_id, report_type, title, config_json, status)
       VALUES (?, ?, ?, ?, 'completed')`,
      [req.params.id, reportType || 'standard', title || 'Report', JSON.stringify(config || {})]
    );
    // Mark as completed immediately (placeholder)
    await pool.query(
      "UPDATE design_reports SET status = 'completed', completed_at = NOW(), result_json = ? WHERE id = ?",
      [JSON.stringify({ generated: true }), result.insertId]
    );
    res.status(201).json({ success: true, data: { id: result.insertId, status: 'completed' } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/reports/:reportId/status', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT id, status, completed_at FROM design_reports WHERE id = ?',
      [req.params.reportId]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Report not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/reports', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_reports WHERE project_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/nodes/:nodeId/reports', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_reports WHERE project_id = ? AND node_id = ? ORDER BY created_at DESC',
      [req.params.id, req.params.nodeId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/reports/:reportId/download', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT * FROM design_reports WHERE id = ?', [req.params.reportId]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Report not found' });
    // Return JSON as downloadable content (placeholder for PDF generation)
    res.setHeader('Content-Disposition', `attachment; filename="report-${req.params.reportId}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/reports/:reportId/artifact-index', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query('SELECT artifact_index FROM design_reports WHERE id = ?', [req.params.reportId]);
    res.json({ success: true, data: rows.length > 0 ? rows[0].artifact_index : [] });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/reports/:reportId/validate', async (req, res) => {
  res.json({ success: true, data: { valid: true, errors: [], warnings: [] } });
});

module.exports = router;
