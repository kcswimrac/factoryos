/**
 * T5.3: Timeline Dependencies & Critical Path
 * Mounted at /api/timeline
 */
const express = require('express');
const router = express.Router();

// ── GET /items?projectId=X — list timeline items with dependencies ───────────
router.get('/items', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ success: false, error: 'projectId required' });

    const [items] = await pool.query(
      'SELECT * FROM timeline_items WHERE project_id = ? ORDER BY start_date, id',
      [projectId]
    );

    // Get all dependencies for these items
    const itemIds = items.map(i => i.id);
    let deps = [];
    if (itemIds.length > 0) {
      [deps] = await pool.query(
        'SELECT * FROM timeline_dependencies WHERE predecessor_id IN (?) OR successor_id IN (?)',
        [itemIds, itemIds]
      );
    }

    // Attach dependencies to items
    items.forEach(item => {
      item.predecessors = deps.filter(d => d.successor_id === item.id).map(d => d.predecessor_id);
      item.successors = deps.filter(d => d.predecessor_id === item.id).map(d => d.successor_id);
    });

    res.json({ success: true, data: { items, dependencies: deps } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── POST /items — create a timeline item ─────────────────────────────────────
router.post('/items', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, title, itemType, assignedTo, startDate, endDate, nodeId, phaseKey, notes } = req.body;

    const [result] = await pool.query(
      `INSERT INTO timeline_items (project_id, title, item_type, assigned_to, start_date, end_date, node_id, phase_key, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [projectId, title, itemType || 'task', assignedTo || null,
       startDate || null, endDate || null, nodeId || null, phaseKey || null, notes || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── PUT /items/:itemId ───────────────────────────────────────────────────────
router.put('/items/:itemId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const allowed = ['title', 'item_type', 'status', 'assigned_to', 'start_date', 'end_date',
                     'actual_start', 'actual_end', 'percent_complete', 'notes'];
    const updates = [];
    const params = [];
    for (const [key, val] of Object.entries(req.body)) {
      const col = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowed.includes(col)) { updates.push(`${col} = ?`); params.push(val); }
    }
    if (updates.length === 0) return res.status(400).json({ success: false, error: 'No fields' });
    params.push(req.params.itemId);
    await pool.query(`UPDATE timeline_items SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ success: true, message: 'Item updated' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── DELETE /items/:itemId ────────────────────────────────────────────────────
router.delete('/items/:itemId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM timeline_dependencies WHERE predecessor_id = ? OR successor_id = ?',
      [req.params.itemId, req.params.itemId]);
    await pool.query('DELETE FROM timeline_items WHERE id = ?', [req.params.itemId]);
    res.json({ success: true, message: 'Item and dependencies deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── POST /dependencies — add a dependency ────────────────────────────────────
router.post('/dependencies', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { predecessorId, successorId, dependencyType, lagDays } = req.body;

    if (predecessorId === successorId) {
      return res.status(400).json({ success: false, error: 'Item cannot depend on itself' });
    }

    await pool.query(
      `INSERT INTO timeline_dependencies (predecessor_id, successor_id, dependency_type, lag_days)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE dependency_type = VALUES(dependency_type), lag_days = VALUES(lag_days)`,
      [predecessorId, successorId, dependencyType || 'finish_to_start', lagDays || 0]
    );
    res.json({ success: true, message: 'Dependency added' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── DELETE /dependencies/:depId ──────────────────────────────────────────────
router.delete('/dependencies/:depId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM timeline_dependencies WHERE id = ?', [req.params.depId]);
    res.json({ success: true, message: 'Dependency removed' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── GET /critical-path?projectId=X — compute critical path ──────────────────
router.get('/critical-path', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ success: false, error: 'projectId required' });

    const [items] = await pool.query(
      'SELECT * FROM timeline_items WHERE project_id = ? AND status != ? ORDER BY start_date',
      [projectId, 'cancelled']
    );
    const itemIds = items.map(i => i.id);
    let deps = [];
    if (itemIds.length > 0) {
      [deps] = await pool.query(
        'SELECT * FROM timeline_dependencies WHERE predecessor_id IN (?)', [itemIds]
      );
    }

    // Build adjacency and compute forward/backward pass
    const itemMap = {};
    items.forEach(i => {
      const duration = i.start_date && i.end_date
        ? Math.max(1, Math.ceil((new Date(i.end_date) - new Date(i.start_date)) / 86400000))
        : 1;
      itemMap[i.id] = { ...i, duration, es: 0, ef: 0, ls: Infinity, lf: Infinity, slack: 0, successors: [], predecessors: [] };
    });

    deps.forEach(d => {
      if (itemMap[d.predecessor_id] && itemMap[d.successor_id]) {
        itemMap[d.predecessor_id].successors.push({ id: d.successor_id, lag: d.lag_days || 0 });
        itemMap[d.successor_id].predecessors.push({ id: d.predecessor_id, lag: d.lag_days || 0 });
      }
    });

    // Forward pass (earliest start/finish)
    const sorted = topologicalSort(Object.values(itemMap));
    sorted.forEach(node => {
      node.predecessors.forEach(pred => {
        const predNode = itemMap[pred.id];
        if (predNode) {
          node.es = Math.max(node.es, predNode.ef + pred.lag);
        }
      });
      node.ef = node.es + node.duration;
    });

    // Backward pass (latest start/finish)
    const projectEnd = Math.max(...sorted.map(n => n.ef), 0);
    sorted.reverse().forEach(node => {
      if (node.successors.length === 0) {
        node.lf = projectEnd;
      } else {
        node.successors.forEach(succ => {
          const succNode = itemMap[succ.id];
          if (succNode) {
            node.lf = Math.min(node.lf, succNode.ls - succ.lag);
          }
        });
      }
      node.ls = node.lf - node.duration;
      node.slack = node.ls - node.es;
    });

    const criticalPath = sorted.filter(n => Math.abs(n.slack) < 0.5).map(n => ({
      id: n.id, title: n.title, duration: n.duration, es: n.es, ef: n.ef, slack: n.slack
    }));

    res.json({
      success: true,
      data: {
        criticalPath,
        projectDuration: projectEnd,
        totalItems: items.length,
        criticalItems: criticalPath.length
      }
    });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Topological sort (Kahn's algorithm)
function topologicalSort(nodes) {
  const inDegree = {};
  const adj = {};
  nodes.forEach(n => { inDegree[n.id] = 0; adj[n.id] = []; });
  nodes.forEach(n => {
    n.successors.forEach(s => {
      if (inDegree[s.id] !== undefined) {
        inDegree[s.id]++;
        adj[n.id].push(s.id);
      }
    });
  });

  const queue = nodes.filter(n => inDegree[n.id] === 0);
  const sorted = [];
  while (queue.length > 0) {
    const node = queue.shift();
    sorted.push(node);
    adj[node.id].forEach(succId => {
      inDegree[succId]--;
      if (inDegree[succId] === 0) {
        sorted.push(nodes.find(n => n.id === succId));
      }
    });
  }
  return sorted.filter(Boolean);
}

module.exports = router;
