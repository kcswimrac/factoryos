/**
 * T4.3: Hardware-Software Interface Tracking
 * Pin maps, register maps, communication protocols.
 *
 * Mounted at /api/hw-sw
 */
const express = require('express');
const router = express.Router();

// ══════════════════════════════════════════════════════════════════════════════
// Pin Maps (MCU pin → PCB net → connector → sensor)
// ══════════════════════════════════════════════════════════════════════════════

router.get('/pin-maps', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, fwNodeId, hwNodeId } = req.query;
    let sql = 'SELECT * FROM hw_sw_pin_maps WHERE 1=1';
    const params = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    if (fwNodeId) { sql += ' AND fw_node_id = ?'; params.push(fwNodeId); }
    if (hwNodeId) { sql += ' AND hw_node_id = ?'; params.push(hwNodeId); }
    sql += ' ORDER BY mcu_pin';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/pin-maps', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, fwNodeId, hwNodeId, mcuPin, pinFunction, pcbNetName,
            connectorRef, signalName, voltageLevel, direction, pullConfig, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO hw_sw_pin_maps (project_id, fw_node_id, hw_node_id, mcu_pin, pin_function,
       pcb_net_name, connector_ref, signal_name, voltage_level, direction, pull_config, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, fwNodeId || null, hwNodeId || null, mcuPin, pinFunction || 'gpio_in',
       pcbNetName || null, connectorRef || null, signalName || null,
       voltageLevel || null, direction || 'input', pullConfig || 'none', notes || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/pin-maps/:pinId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['mcu_pin', 'pin_function', 'pcb_net_name', 'connector_ref',
                     'signal_name', 'voltage_level', 'direction', 'pull_config', 'notes',
                     'fw_node_id', 'hw_node_id'];
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });
    params.push(req.params.pinId);
    await pool.query(`UPDATE hw_sw_pin_maps SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Pin map updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/pin-maps/:pinId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM hw_sw_pin_maps WHERE id = ?', [req.params.pinId]);
    res.json({ success: true, message: 'Pin map entry deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Batch import pin maps (from spreadsheet or EDA tool)
router.post('/pin-maps/batch', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, pins } = req.body;
    if (!Array.isArray(pins)) return res.status(400).json({ success: false, error: 'pins must be an array' });

    let imported = 0;
    for (const p of pins) {
      await pool.query(
        `INSERT INTO hw_sw_pin_maps (project_id, fw_node_id, hw_node_id, mcu_pin, pin_function,
         pcb_net_name, connector_ref, signal_name, voltage_level, direction, pull_config, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [projectId, p.fwNodeId || null, p.hwNodeId || null, p.mcuPin, p.pinFunction || 'gpio_in',
         p.pcbNetName || null, p.connectorRef || null, p.signalName || null,
         p.voltageLevel || null, p.direction || 'input', p.pullConfig || 'none', p.notes || null]
      );
      imported++;
    }
    res.json({ success: true, data: { imported } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Register Maps
// ══════════════════════════════════════════════════════════════════════════════

router.get('/register-maps', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { nodeId } = req.query;
    if (!nodeId) return res.status(400).json({ success: false, error: 'nodeId required' });
    const [rows] = await pool.query(
      'SELECT * FROM hw_sw_register_maps WHERE node_id = ? ORDER BY peripheral_name, address',
      [nodeId]
    );
    // Parse bit_fields JSON
    rows.forEach(r => {
      if (typeof r.bit_fields === 'string') r.bit_fields = JSON.parse(r.bit_fields);
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/register-maps', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { nodeId, peripheralName, registerName, address, widthBits, access, resetValue, description, bitFields } = req.body;

    const [result] = await pool.query(
      `INSERT INTO hw_sw_register_maps (node_id, peripheral_name, register_name, address, width_bits, access, reset_value, description, bit_fields)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nodeId, peripheralName, registerName, address, widthBits || 8,
       access || 'read_write', resetValue || '0x00', description || null,
       JSON.stringify(bitFields || null)]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/register-maps/:regId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['peripheral_name', 'register_name', 'address', 'width_bits',
                     'access', 'reset_value', 'description', 'bit_fields'];
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) {
        updates.push(`${col} = ?`);
        params.push(col === 'bit_fields' ? JSON.stringify(val) : val);
      }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });
    params.push(req.params.regId);
    await pool.query(`UPDATE hw_sw_register_maps SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Register map updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/register-maps/:regId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM hw_sw_register_maps WHERE id = ?', [req.params.regId]);
    res.json({ success: true, message: 'Register map entry deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Communication Protocols
// ══════════════════════════════════════════════════════════════════════════════

router.get('/protocols', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ success: false, error: 'projectId required' });
    const [rows] = await pool.query(
      'SELECT * FROM hw_sw_protocols WHERE project_id = ? ORDER BY protocol, bus_name',
      [projectId]
    );
    rows.forEach(r => {
      if (typeof r.message_format === 'string') r.message_format = JSON.parse(r.message_format);
      if (typeof r.timing_requirements === 'string') r.timing_requirements = JSON.parse(r.timing_requirements);
    });
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/protocols', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, fwNodeId, hwNodeId, protocol, busName, speedHz,
            address, messageFormat, timingRequirements, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO hw_sw_protocols (project_id, fw_node_id, hw_node_id, protocol, bus_name,
       speed_hz, address, message_format, timing_requirements, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, fwNodeId || null, hwNodeId || null, protocol, busName || null,
       speedHz || null, address || null, JSON.stringify(messageFormat || null),
       JSON.stringify(timingRequirements || null), notes || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/protocols/:protocolId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['protocol', 'bus_name', 'speed_hz', 'address',
                     'message_format', 'timing_requirements', 'notes', 'fw_node_id', 'hw_node_id'];
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) {
        updates.push(`${col} = ?`);
        params.push(['message_format', 'timing_requirements'].includes(col) ? JSON.stringify(val) : val);
      }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });
    params.push(req.params.protocolId);
    await pool.query(`UPDATE hw_sw_protocols SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Protocol updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/protocols/:protocolId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM hw_sw_protocols WHERE id = ?', [req.params.protocolId]);
    res.json({ success: true, message: 'Protocol deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
