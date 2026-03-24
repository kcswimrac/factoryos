/**
 * T2.4: Trade Study Scoring (Pugh Matrix)
 * Weighted criteria scoring for discovery trade studies.
 *
 * Mounted at /api/projects/:projectId/trade-studies
 */
const express = require('express');
const router = express.Router({ mergeParams: true });

// ── GET /:objectId/matrix — get full Pugh matrix for a trade study ───────────

router.get('/:objectId/matrix', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { objectId } = req.params;

    const [criteria] = await pool.query(
      'SELECT * FROM trade_study_criteria WHERE discovery_object_id = ? ORDER BY sort_order',
      [objectId]
    );

    const [options] = await pool.query(
      'SELECT * FROM trade_study_options WHERE discovery_object_id = ? ORDER BY sort_order',
      [objectId]
    );

    const [scores] = await pool.query(
      'SELECT * FROM trade_study_scores WHERE discovery_object_id = ?',
      [objectId]
    );

    // Build score lookup
    const scoreMap = {};
    scores.forEach(s => { scoreMap[`${s.criterion_id}-${s.option_id}`] = s; });

    // Calculate weighted totals per option
    const optionTotals = options.map(opt => {
      let weightedSum = 0;
      let totalWeight = 0;

      criteria.forEach(crit => {
        const key = `${crit.id}-${opt.id}`;
        const score = scoreMap[key]?.score || 0;
        weightedSum += score * parseFloat(crit.weight);
        totalWeight += parseFloat(crit.weight);
      });

      return {
        ...opt,
        weightedScore: totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0,
        totalWeight
      };
    });

    // Rank options
    optionTotals.sort((a, b) => b.weightedScore - a.weightedScore);
    optionTotals.forEach((opt, i) => { opt.rank = i + 1; });

    res.json({
      success: true,
      data: { criteria, options: optionTotals, scores, scoreMap }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /:objectId/criteria — add a scoring criterion ───────────────────────

router.post('/:objectId/criteria', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { objectId } = req.params;
    const { criterionName, weight = 1.0 } = req.body;

    const [countRows] = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM trade_study_criteria WHERE discovery_object_id = ?',
      [objectId]
    );

    const [result] = await pool.query(
      `INSERT INTO trade_study_criteria (discovery_object_id, criterion_name, weight, sort_order)
       VALUES (?, ?, ?, ?)`,
      [objectId, criterionName, weight, countRows[0].next]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /:objectId/criteria/:criterionId — update criterion ──────────────────

router.put('/:objectId/criteria/:criterionId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { criterionId } = req.params;
    const { criterionName, weight, sortOrder } = req.body;

    const updates = [];
    const params = [];
    if (criterionName !== undefined) { updates.push('criterion_name = ?'); params.push(criterionName); }
    if (weight !== undefined) { updates.push('weight = ?'); params.push(weight); }
    if (sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(sortOrder); }

    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });

    params.push(criterionId);
    await pool.query(`UPDATE trade_study_criteria SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Criterion updated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /:objectId/criteria/:criterionId ───────────────────────────────────

router.delete('/:objectId/criteria/:criterionId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM trade_study_scores WHERE criterion_id = ?', [req.params.criterionId]);
    await pool.query('DELETE FROM trade_study_criteria WHERE id = ?', [req.params.criterionId]);
    res.json({ success: true, message: 'Criterion deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /:objectId/options — add an option/alternative ──────────────────────

router.post('/:objectId/options', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { objectId } = req.params;
    const { optionName, description, isBaseline = false } = req.body;

    const [countRows] = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM trade_study_options WHERE discovery_object_id = ?',
      [objectId]
    );

    const [result] = await pool.query(
      `INSERT INTO trade_study_options (discovery_object_id, option_name, description, is_baseline, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [objectId, optionName, description || null, isBaseline, countRows[0].next]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── DELETE /:objectId/options/:optionId ───────────────────────────────────────

router.delete('/:objectId/options/:optionId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM trade_study_scores WHERE option_id = ?', [req.params.optionId]);
    await pool.query('DELETE FROM trade_study_options WHERE id = ?', [req.params.optionId]);
    res.json({ success: true, message: 'Option deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PUT /:objectId/scores — batch update scores (Pugh matrix cells) ──────────

router.put('/:objectId/scores', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { objectId } = req.params;
    const { scores } = req.body; // Array of { criterionId, optionId, score, notes }

    if (!Array.isArray(scores)) {
      return res.status(400).json({ success: false, error: 'scores must be an array' });
    }

    for (const s of scores) {
      await pool.query(
        `INSERT INTO trade_study_scores (discovery_object_id, criterion_id, option_id, score, notes)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score), notes = VALUES(notes), updated_at = NOW()`,
        [objectId, s.criterionId, s.optionId, s.score, s.notes || null]
      );
    }

    res.json({ success: true, message: `${scores.length} scores updated` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
