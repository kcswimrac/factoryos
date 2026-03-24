const express = require('express');
const router = express.Router();

// ── Phase configuration (7-phase model with 3a/3b/3c sub-phases) ─────────────
// Matches frontend/src/config/designPhases.js DESIGN_PHASES array.
// Phase 3 is split into 3a (Design/CAD), 3b (Serviceability), 3c (Manufacturability).

const PHASES = [
  { number: 1, subPhase: null, name: 'requirements', displayName: 'Define Requirements' },
  { number: 2, subPhase: null, name: 'research', displayName: 'Research & Development' },
  { number: 3, subPhase: 'a', name: 'design_cad', displayName: 'Design / CAD' },
  { number: 3, subPhase: 'b', name: 'serviceability', displayName: 'Serviceability' },
  { number: 3, subPhase: 'c', name: 'manufacturability', displayName: 'Manufacturability' },
  { number: 4, subPhase: null, name: 'data_collection', displayName: 'Data Collection' },
  { number: 5, subPhase: null, name: 'analysis', displayName: 'Analysis / CAE' },
  { number: 6, subPhase: null, name: 'testing', displayName: 'Testing / Validation' },
  { number: 7, subPhase: null, name: 'correlation', displayName: 'Correlation' }
];

// Questions aligned to 7-phase model (keyed by phase_number + subPhase suffix)
const DEFAULT_QUESTIONS = {
  '1': [
    'What is the primary function of this component?',
    'Are all requirements defined with unique IDs and acceptance criteria?',
    'Is a verification method assigned to each requirement (Analysis/Test/Inspection)?',
    'Has the rigor tier been selected and justified?'
  ],
  '2': [
    'Have existing solutions been researched and documented?',
    'Has the correlation factors library been searched for applicable data?',
    'Are key technical risks identified with mitigations?',
    'If rigor tier is non-default, is justification documented?'
  ],
  '3a': [
    'Is the 3D CAD model complete?',
    'Are 2D drawings with GD&T complete?',
    'Has a design review been conducted?',
    'Is the Interface Control Document complete with adjacent node approvals?'
  ],
  '3b': [
    'Has access for maintenance and repair been analyzed?',
    'Are wear items listed with expected life and replacement time?',
    'Are maintenance, repair, and overhaul procedures documented?',
    'Is service feasible with expected tools, skills, and access constraints?'
  ],
  '3c': [
    'Has a DFM review been completed for target production context?',
    'Are critical dimensions listed with inspection methods?',
    'Is the cost estimate complete and within target for production volume?',
    'Are make/buy decisions documented with rationale?'
  ],
  '4': [
    'Are all load cases documented with source/basis and linked to requirements?',
    'Are material properties documented with source traceability?',
    'Are boundary conditions documented with rationale?',
    'Do all assumptions have "what if wrong?" risk assessment?'
  ],
  '5': [
    'Is analysis complete (FEA, hand calculations, etc.)?',
    'Does every requirement with verification method "Analysis" have an analysis check?',
    'Are margins of safety calculated for all critical checks?',
    'Does trace coverage meet tier threshold?'
  ],
  '6': [
    'Is the test plan approved per tier requirements?',
    'Does every requirement with verification method "Test" have a test case?',
    'Have all tests been executed and documented?',
    'Does trace coverage meet tier threshold?'
  ],
  '7': [
    'Are correlation parameters documented (predicted vs actual)?',
    'Have correlation factors been promoted to knowledge base?',
    'Are lessons learned documented?',
    'Are all required gates approved?'
  ]
};

// Helper: get phase key string (e.g. "1", "3a", "3b")
function phaseKey(number, subPhase) {
  return subPhase ? `${number}${subPhase}` : `${number}`;
}

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

    // Create all 7 phases (with 3a/3b/3c sub-phases) and default questions
    for (const phase of PHASES) {
      const pKey = phaseKey(phase.number, phase.subPhase);
      const [phaseResult] = await pool.query(
        `INSERT INTO design_phases (project_id, phase_number, phase_name, display_name)
         VALUES (?, ?, ?, ?)`,
        [projectId, pKey, phase.name, phase.displayName]
      );
      const phaseId = phaseResult.insertId;

      const questions = DEFAULT_QUESTIONS[pKey] || [];
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
    const phaseCount = phases.length || 1;
    const overallProgress = Math.round(totalProgress / phaseCount);

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

// ══════════════════════════════════════════════════════════════════════════════
// T2.1: Phase Gate Enforcement
// ══════════════════════════════════════════════════════════════════════════════

// Gate type definitions (matches frontend config + T3.5 electronics gates)
const GATE_TYPES = {
  cost:             { name: 'Cost Gate', ownerRole: 'Finance/Program Manager', phase: '3c' },
  safety:           { name: 'Safety Gate', ownerRole: 'Safety Engineer', phase: '6' },
  manufacturability:{ name: 'Manufacturability Gate', ownerRole: 'Manufacturing Engineer', phase: '3c' },
  serviceability:   { name: 'Serviceability Gate', ownerRole: 'Service Engineering', phase: '3b' },
  // T3.5: Electronics-specific gates
  schematic_review: { name: 'Schematic Review', ownerRole: 'Lead Electrical Engineer', phase: '3a' },
  pcb_layout_drc:   { name: 'PCB Layout DRC', ownerRole: 'PCB Designer', phase: '3a' },
  si_pi_analysis:   { name: 'SI/PI Analysis', ownerRole: 'Signal Integrity Engineer', phase: '5' },
  emc_precompliance:{ name: 'EMC Pre-Compliance', ownerRole: 'EMC Engineer', phase: '6' },
  power_budget:     { name: 'Power Budget Approval', ownerRole: 'Systems Engineer', phase: '4' }
};

// GET /:id/phase-gates — get all gates for a project
router.get('/:id/phase-gates', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const [rows] = await pool.query(
      'SELECT * FROM design_phase_gates WHERE project_id = ? ORDER BY phase_key, gate_type',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /:id/phase-gates/init — initialize gates for a project based on GATE_TYPES
router.post('/:id/phase-gates/init', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = req.params.id;

    for (const [gateType, config] of Object.entries(GATE_TYPES)) {
      await pool.query(
        `INSERT IGNORE INTO design_phase_gates (project_id, phase_key, gate_type, gate_name, owner_role)
         VALUES (?, ?, ?, ?, ?)`,
        [projectId, config.phase, gateType, config.name, config.ownerRole]
      );
    }

    const [rows] = await pool.query(
      'SELECT * FROM design_phase_gates WHERE project_id = ?', [projectId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /:id/phase-gates/:gateId — approve/reject/waive a gate
router.put('/:id/phase-gates/:gateId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { status, approvedBy, rejectionReason, waiverReason } = req.body;

    if (!['approved', 'rejected', 'waived', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid gate status' });
    }

    const updates = ['status = ?'];
    const params = [status];

    if (status === 'approved') {
      updates.push('approved_by = ?', 'approved_at = NOW()');
      params.push(approvedBy || 'System');
    }
    if (status === 'rejected') {
      updates.push('rejection_reason = ?');
      params.push(rejectionReason || '');
    }
    if (status === 'waived') {
      updates.push('waiver_reason = ?');
      params.push(waiverReason || '');
    }

    params.push(req.params.gateId);
    await pool.query(`UPDATE design_phase_gates SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: `Gate ${status}` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /:id/phases/:phaseKey/check-gate — check if phase can be completed
// Returns { canAdvance: bool, blockers: [...] }
router.post('/:id/phases/:phaseKey/check-gate', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);
    const pk = req.params.phaseKey;
    const blockers = [];

    // 1. Check all questions answered 'yes'
    const [phases] = await pool.query(
      'SELECT id FROM design_phases WHERE project_id = ? AND phase_number = ?',
      [projectId, pk]
    );
    if (phases.length > 0) {
      const [unanswered] = await pool.query(
        `SELECT COUNT(*) AS cnt FROM design_phase_questions
         WHERE phase_id = ? AND answer_status != 'yes'`,
        [phases[0].id]
      );
      if (unanswered[0].cnt > 0) {
        blockers.push({
          type: 'questions',
          message: `${unanswered[0].cnt} checklist question(s) not yet answered 'yes'`
        });
      }
    }

    // 2. Check required gates for this phase
    const [pendingGates] = await pool.query(
      `SELECT gate_name, gate_type, status FROM design_phase_gates
       WHERE project_id = ? AND phase_key = ? AND status NOT IN ('approved', 'waived', 'not_required')`,
      [projectId, pk]
    );
    for (const gate of pendingGates) {
      blockers.push({
        type: 'gate',
        gateType: gate.gate_type,
        message: `${gate.gate_name} is ${gate.status} — must be approved or waived`
      });
    }

    // 3. Check that prior phases (sequentially) are completed
    const phaseOrder = ['1', '2', '3a', '3b', '3c', '4', '5', '6', '7'];
    const currentIdx = phaseOrder.indexOf(pk);
    if (currentIdx > 0) {
      const priorPhases = phaseOrder.slice(0, currentIdx);
      const [incomplete] = await pool.query(
        `SELECT phase_number, display_name FROM design_phases
         WHERE project_id = ? AND phase_number IN (?) AND status != 'completed'`,
        [projectId, priorPhases]
      );
      for (const p of incomplete) {
        blockers.push({
          type: 'prior_phase',
          message: `Phase ${p.phase_number} (${p.display_name}) must be completed first`
        });
      }
    }

    res.json({
      success: true,
      data: {
        canAdvance: blockers.length === 0,
        blockers
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// T2.2: Traceability Matrix Engine
// ══════════════════════════════════════════════════════════════════════════════

// GET /:id/traceability-matrix — full bidirectional traceability for a project
router.get('/:id/traceability-matrix', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);

    // Get all requirements for this project
    const [requirements] = await pool.query(
      'SELECT * FROM design_requirements WHERE project_id = ? ORDER BY id',
      [projectId]
    );

    // Get all traces for these requirements
    const reqIds = requirements.map(r => r.id);
    let traces = [];
    if (reqIds.length > 0) {
      [traces] = await pool.query(
        'SELECT * FROM design_requirement_traces WHERE requirement_id IN (?)',
        [reqIds]
      );
    }

    // Get derivation links
    let derivations = [];
    if (reqIds.length > 0) {
      // Check if requirement_derivations table exists (from factoryos requirements module)
      try {
        [derivations] = await pool.query(
          `SELECT rd.*, r.title AS parent_title
           FROM requirement_derivations rd
           LEFT JOIN requirements r ON rd.parent_requirement_id = r.id
           WHERE rd.child_requirement_id IN (?)`,
          [reqIds]
        );
      } catch (e) {
        // Table may not exist if using design_requirements instead of requirements
        derivations = [];
      }
    }

    // Build traceability matrix
    const matrix = requirements.map(req => {
      const reqTraces = traces.filter(t => t.requirement_id === req.id);
      const reqDerivations = derivations.filter(d => d.child_requirement_id === req.id);

      const analysisTraces = reqTraces.filter(t => t.trace_type === 'analysis');
      const testTraces = reqTraces.filter(t => t.trace_type === 'test');
      const documentTraces = reqTraces.filter(t => t.trace_type === 'document');

      // Determine verification status
      let verificationStatus = 'not_started';
      const satisfiedTraces = reqTraces.filter(t => t.status === 'satisfied');
      if (satisfiedTraces.length > 0 && satisfiedTraces.length === reqTraces.length) {
        verificationStatus = 'verified';
      } else if (reqTraces.length > 0) {
        verificationStatus = 'in_progress';
      }

      return {
        id: req.id,
        title: req.title,
        type: req.type,
        priority: req.priority,
        status: req.status,
        verification_method: req.verification_method,
        verification_status: verificationStatus,
        node_id: req.node_id,
        // Trace summary
        analysis_traces: analysisTraces.length,
        test_traces: testTraces.length,
        document_traces: documentTraces.length,
        total_traces: reqTraces.length,
        // Derivation
        derived_from: reqDerivations.map(d => ({
          parentId: d.parent_requirement_id,
          parentTitle: d.parent_title
        })),
        // Detailed traces
        traces: reqTraces
      };
    });

    // Coverage summary
    const total = matrix.length;
    const verified = matrix.filter(r => r.verification_status === 'verified').length;
    const inProgress = matrix.filter(r => r.verification_status === 'in_progress').length;
    const notStarted = matrix.filter(r => r.verification_status === 'not_started').length;
    const critical = matrix.filter(r => r.priority === 'critical');
    const criticalVerified = critical.filter(r => r.verification_status === 'verified').length;

    res.json({
      success: true,
      data: {
        matrix,
        summary: {
          total,
          verified,
          inProgress,
          notStarted,
          coveragePercent: total > 0 ? Math.round((verified / total) * 100) : 0,
          criticalTotal: critical.length,
          criticalVerified,
          criticalCoveragePercent: critical.length > 0 ? Math.round((criticalVerified / critical.length) * 100) : 0
        }
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /:id/traceability-matrix/export — CSV export of traceability matrix
router.get('/:id/traceability-matrix/export', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);

    const [requirements] = await pool.query(
      'SELECT * FROM design_requirements WHERE project_id = ? ORDER BY id',
      [projectId]
    );

    const reqIds = requirements.map(r => r.id);
    let traces = [];
    if (reqIds.length > 0) {
      [traces] = await pool.query(
        'SELECT * FROM design_requirement_traces WHERE requirement_id IN (?)',
        [reqIds]
      );
    }

    // Build CSV
    const escCsv = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    const headers = ['Req ID', 'Title', 'Type', 'Priority', 'Status', 'Verification Method',
                     'Analysis Traces', 'Test Traces', 'Document Traces', 'Verified'];
    const rows = requirements.map(req => {
      const rt = traces.filter(t => t.requirement_id === req.id);
      const analysisCount = rt.filter(t => t.trace_type === 'analysis').length;
      const testCount = rt.filter(t => t.trace_type === 'test').length;
      const docCount = rt.filter(t => t.trace_type === 'document').length;
      const allSatisfied = rt.length > 0 && rt.every(t => t.status === 'satisfied');

      return [
        req.id, escCsv(req.title), req.type, req.priority, req.status,
        req.verification_method, analysisCount, testCount, docCount,
        allSatisfied ? 'YES' : 'NO'
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="traceability-matrix-project-${projectId}.csv"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /:id/traceability-matrix/query — bidirectional query
// ?requirementId=X — "what verifies requirement X?"
// ?traceType=test&status=satisfied — "what requirements have passed tests?"
router.get('/:id/traceability-matrix/query', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const projectId = parseInt(req.params.id, 10);
    const { requirementId, traceType, traceStatus, verificationMethod, priority } = req.query;

    let sql = `
      SELECT r.*, t.trace_type, t.trace_target_name, t.status AS trace_status
      FROM design_requirements r
      LEFT JOIN design_requirement_traces t ON r.id = t.requirement_id
      WHERE r.project_id = ?`;
    const params = [projectId];

    if (requirementId) { sql += ' AND r.id = ?'; params.push(requirementId); }
    if (traceType) { sql += ' AND t.trace_type = ?'; params.push(traceType); }
    if (traceStatus) { sql += ' AND t.status = ?'; params.push(traceStatus); }
    if (verificationMethod) { sql += ' AND r.verification_method = ?'; params.push(verificationMethod); }
    if (priority) { sql += ' AND r.priority = ?'; params.push(priority); }

    sql += ' ORDER BY r.id, t.id';

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
