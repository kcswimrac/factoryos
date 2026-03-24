/**
 * T2.3: Design Review Workflow
 * Formal design reviews (SRR, SDR, PDR, CDR, TRR) with findings, action items, and sign-off.
 *
 * Mounted at /api/design/:projectId/reviews
 */
const express = require('express');
const router = express.Router({ mergeParams: true });

// ── GET / — list reviews for a project ───────────────────────────────────────

router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId } = req.params;

    const [rows] = await pool.query(
      `SELECT dr.*,
         (SELECT COUNT(*) FROM design_review_findings f WHERE f.review_id = dr.id) AS finding_count,
         (SELECT COUNT(*) FROM design_review_findings f WHERE f.review_id = dr.id AND f.status IN ('open','in_progress')) AS open_findings
       FROM design_reviews dr
       WHERE dr.project_id = ?
       ORDER BY dr.scheduled_date DESC`,
      [projectId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST / — schedule a new design review ────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId } = req.params;
    const { reviewType, reviewName, description, phaseKey, scheduledDate, chairperson, attendees } = req.body;

    const [result] = await pool.query(
      `INSERT INTO design_reviews (project_id, review_type, review_name, description, phase_key, scheduled_date, chairperson, attendees)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, reviewType, reviewName, description || null, phaseKey || null,
       scheduledDate || null, chairperson || null, JSON.stringify(attendees || [])]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /:reviewId — get review with findings ────────────────────────────────

router.get('/:reviewId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { reviewId } = req.params;

    const [reviews] = await pool.query('SELECT * FROM design_reviews WHERE id = ?', [reviewId]);
    if (reviews.length === 0) return res.status(404).json({ success: false, error: 'Review not found' });

    const review = reviews[0];
    review.attendees = typeof review.attendees === 'string' ? JSON.parse(review.attendees) : review.attendees;

    const [findings] = await pool.query(
      'SELECT * FROM design_review_findings WHERE review_id = ? ORDER BY finding_number',
      [reviewId]
    );
    review.findings = findings;

    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /:reviewId — update review (start, complete, set outcome) ────────────

router.put('/:reviewId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { reviewId } = req.params;
    const allowed = ['status', 'outcome', 'summary', 'completed_date', 'chairperson', 'scheduled_date'];
    const updates = [];
    const params = [];

    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No valid fields' });

    params.push(reviewId);
    await pool.query(`UPDATE design_reviews SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Review updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /:reviewId/findings — add a finding/action item ─────────────────────

router.post('/:reviewId/findings', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { reviewId } = req.params;
    const { severity, title, description, assignedTo, dueDate } = req.body;

    // Auto-increment finding number
    const [countRows] = await pool.query(
      'SELECT COALESCE(MAX(finding_number), 0) + 1 AS next_num FROM design_review_findings WHERE review_id = ?',
      [reviewId]
    );
    const findingNumber = countRows[0].next_num;

    const [result] = await pool.query(
      `INSERT INTO design_review_findings (review_id, finding_number, severity, title, description, assigned_to, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, findingNumber, severity || 'minor', title, description || null,
       assignedTo || null, dueDate || null]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, findingNumber } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /:reviewId/findings/:findingId — update finding status ───────────────

router.put('/:reviewId/findings/:findingId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { findingId } = req.params;
    const allowed = ['status', 'resolution', 'assigned_to', 'due_date', 'severity'];
    const updates = [];
    const params = [];

    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }

    // Auto-set timestamps
    if (req.body.status === 'resolved') {
      updates.push('resolved_at = NOW()');
    }
    if (req.body.status === 'verified' || req.body.status === 'closed') {
      updates.push('verified_at = NOW()');
      if (req.body.verifiedBy) { updates.push('verified_by = ?'); params.push(req.body.verifiedBy); }
    }

    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No valid fields' });

    params.push(findingId);
    await pool.query(`UPDATE design_review_findings SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Finding updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /:reviewId/findings/summary — finding status summary ─────────────────

router.get('/:reviewId/findings/summary', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { reviewId } = req.params;

    const [rows] = await pool.query(
      `SELECT status, severity, COUNT(*) AS count
       FROM design_review_findings WHERE review_id = ?
       GROUP BY status, severity`,
      [reviewId]
    );

    const [overdue] = await pool.query(
      `SELECT COUNT(*) AS count FROM design_review_findings
       WHERE review_id = ? AND status IN ('open','in_progress') AND due_date < CURDATE()`,
      [reviewId]
    );

    res.json({ success: true, data: { breakdown: rows, overdueCount: overdue[0].count } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
