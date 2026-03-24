/**
 * T3.4: Power Budget Tracking
 * Supply rails, consumers, margin calculations, and thermal derating.
 *
 * Mounted at /api/power-budget
 */
const express = require('express');
const router = express.Router();

// ══════════════════════════════════════════════════════════════════════════════
// Power Rails
// ══════════════════════════════════════════════════════════════════════════════

// GET /?projectId=X — list all rails for a project with budget summary
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ success: false, error: 'projectId required' });

    const [rails] = await pool.query(
      'SELECT * FROM power_rails WHERE project_id = ? ORDER BY rail_name',
      [projectId]
    );

    // Calculate budget per rail
    for (const rail of rails) {
      const [consumers] = await pool.query(
        'SELECT * FROM power_consumers WHERE rail_id = ? ORDER BY consumer_name',
        [rail.id]
      );

      rail.consumers = consumers;

      // Calculate totals
      let typicalTotal = 0;
      let peakTotal = 0;
      for (const c of consumers) {
        const dutyCycle = parseFloat(c.duty_cycle_percent || 100) / 100;
        typicalTotal += parseFloat(c.typical_current_ma || 0) * dutyCycle;
        peakTotal += parseFloat(c.peak_current_ma || 0);
      }

      const maxCurrent = parseFloat(rail.max_current || 0);
      const efficiency = parseFloat(rail.efficiency_percent || 85) / 100;

      rail.budget = {
        typicalCurrentMa: Math.round(typicalTotal * 100) / 100,
        peakCurrentMa: Math.round(peakTotal * 100) / 100,
        maxCurrentMa: maxCurrent,
        typicalMarginMa: Math.round((maxCurrent - typicalTotal) * 100) / 100,
        peakMarginMa: Math.round((maxCurrent - peakTotal) * 100) / 100,
        typicalMarginPercent: maxCurrent > 0 ? Math.round(((maxCurrent - typicalTotal) / maxCurrent) * 10000) / 100 : 0,
        peakMarginPercent: maxCurrent > 0 ? Math.round(((maxCurrent - peakTotal) / maxCurrent) * 10000) / 100 : 0,
        typicalPowerMw: Math.round(typicalTotal * parseFloat(rail.nominal_voltage || 0) * 100) / 100,
        inputPowerMw: efficiency > 0 ? Math.round((typicalTotal * parseFloat(rail.nominal_voltage || 0) / efficiency) * 100) / 100 : 0,
        overBudget: peakTotal > maxCurrent && maxCurrent > 0,
        consumerCount: consumers.length
      };
    }

    // System-level summary
    let totalInputPower = 0;
    let overBudgetRails = 0;
    for (const rail of rails) {
      totalInputPower += rail.budget.inputPowerMw;
      if (rail.budget.overBudget) overBudgetRails++;
    }

    res.json({
      success: true,
      data: {
        rails,
        systemSummary: {
          totalRails: rails.length,
          totalInputPowerMw: Math.round(totalInputPower * 100) / 100,
          totalInputPowerW: Math.round(totalInputPower / 10) / 100,
          overBudgetRails,
          allWithinBudget: overBudgetRails === 0
        }
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /rails — create a power rail
router.post('/rails', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, nodeId, railName, nominalVoltage, voltageTolerancePercent,
            maxCurrent, sourceType, sourceComponent, efficiencyPercent, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO power_rails (project_id, node_id, rail_name, nominal_voltage,
       voltage_tolerance_percent, max_current, source_type, source_component,
       efficiency_percent, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, nodeId || null, railName, nominalVoltage,
       voltageTolerancePercent || 5.0, maxCurrent || null,
       sourceType || 'regulator', sourceComponent || null,
       efficiencyPercent || 85.0, notes || null]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /rails/:railId — update a rail
router.put('/rails/:railId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['rail_name', 'nominal_voltage', 'voltage_tolerance_percent',
                     'max_current', 'source_type', 'source_component', 'efficiency_percent', 'notes'];
    const updates = [];
    const params = [];

    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });

    params.push(req.params.railId);
    await pool.query(`UPDATE power_rails SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Rail updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /rails/:railId
router.delete('/rails/:railId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM power_consumers WHERE rail_id = ?', [req.params.railId]);
    await pool.query('DELETE FROM power_rails WHERE id = ?', [req.params.railId]);
    res.json({ success: true, message: 'Rail and consumers deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Power Consumers
// ══════════════════════════════════════════════════════════════════════════════

// POST /rails/:railId/consumers — add a consumer to a rail
router.post('/rails/:railId/consumers', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { nodeId, consumerName, typicalCurrentMa, peakCurrentMa, dutyCyclePercent, operatingMode, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO power_consumers (rail_id, node_id, consumer_name, typical_current_ma,
       peak_current_ma, duty_cycle_percent, operating_mode, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.railId, nodeId || null, consumerName,
       typicalCurrentMa || 0, peakCurrentMa || 0,
       dutyCyclePercent || 100, operatingMode || 'active', notes || null]
    );

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /consumers/:consumerId — update a consumer
router.put('/consumers/:consumerId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['consumer_name', 'typical_current_ma', 'peak_current_ma',
                     'duty_cycle_percent', 'operating_mode', 'notes', 'node_id'];
    const updates = [];
    const params = [];

    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });

    params.push(req.params.consumerId);
    await pool.query(`UPDATE power_consumers SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Consumer updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /consumers/:consumerId
router.delete('/consumers/:consumerId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM power_consumers WHERE id = ?', [req.params.consumerId]);
    res.json({ success: true, message: 'Consumer deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
