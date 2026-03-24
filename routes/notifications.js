/**
 * T5.5: Notification System — in-app notifications + webhook subscriptions
 * Mounted at /api/notifications
 */
const express = require('express');
const router = express.Router();

// ══════════════════════════════════════════════════════════════════════════════
// In-App Notifications
// ══════════════════════════════════════════════════════════════════════════════

// GET / — list notifications for a user
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { email, unreadOnly, limit } = req.query;
    if (!email) return res.status(400).json({ success: false, error: 'email required' });

    let sql = 'SELECT * FROM notifications WHERE user_email = ?';
    const params = [email];
    if (unreadOnly === 'true') { sql += ' AND read_at IS NULL'; }
    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit) || 50}`;

    const [rows] = await pool.query(sql, params);

    const [unreadCount] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM notifications WHERE user_email = ? AND read_at IS NULL',
      [email]
    );

    res.json({ success: true, data: { notifications: rows, unreadCount: unreadCount[0].cnt } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST / — create a notification (internal use / triggered by events)
router.post('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, userEmail, eventType, title, message, linkUrl } = req.body;

    const [result] = await pool.query(
      `INSERT INTO notifications (project_id, user_email, event_type, title, message, link_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [projectId || null, userEmail, eventType, title, message || null, linkUrl || null]
    );

    // Fire webhooks for this event type
    const [webhooks] = await pool.query(
      'SELECT * FROM webhook_subscriptions WHERE (project_id = ? OR project_id IS NULL) AND event_type = ? AND active = TRUE',
      [projectId, eventType]
    );

    for (const wh of webhooks) {
      // Non-blocking webhook delivery (fire and forget)
      fireWebhook(wh, { eventType, title, message, projectId, linkUrl }).catch(() => {});
      await pool.query('UPDATE webhook_subscriptions SET last_triggered_at = NOW() WHERE id = ?', [wh.id]);
    }

    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PUT /read — mark notifications as read
router.put('/read', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { email, notificationIds } = req.body;

    if (notificationIds && Array.isArray(notificationIds)) {
      await pool.query(
        'UPDATE notifications SET read_at = NOW() WHERE id IN (?) AND user_email = ?',
        [notificationIds, email]
      );
    } else {
      // Mark all as read
      await pool.query(
        'UPDATE notifications SET read_at = NOW() WHERE user_email = ? AND read_at IS NULL',
        [email]
      );
    }
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// Webhook Subscriptions
// ══════════════════════════════════════════════════════════════════════════════

router.get('/webhooks', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId } = req.query;
    let sql = 'SELECT * FROM webhook_subscriptions WHERE 1=1';
    const params = [];
    if (projectId) { sql += ' AND project_id = ?'; params.push(projectId); }
    sql += ' ORDER BY event_type';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/webhooks', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { projectId, eventType, webhookUrl, secret } = req.body;

    if (!webhookUrl || (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://'))) {
      return res.status(400).json({ success: false, error: 'webhookUrl must be a valid HTTP/HTTPS URL' });
    }
    const validEventTypes = ['gate_approved', 'gate_rejected', 'review_scheduled', 'finding_assigned',
      'finding_overdue', 'ecr_submitted', 'ecn_issued', 'calibration_due',
      'share_invite', 'sop_execution_complete', 'build_failed', 'custom'];
    if (!eventType || !validEventTypes.includes(eventType)) {
      return res.status(400).json({ success: false, error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` });
    }

    const [result] = await pool.query(
      'INSERT INTO webhook_subscriptions (project_id, event_type, webhook_url, secret) VALUES (?, ?, ?, ?)',
      [projectId || null, eventType, webhookUrl, secret || null]
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/webhooks/:webhookId', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    await pool.query('DELETE FROM webhook_subscriptions WHERE id = ?', [req.params.webhookId]);
    res.json({ success: true, message: 'Webhook deleted' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── Webhook delivery (non-blocking) ──────────────────────────────────────────
async function fireWebhook(subscription, payload) {
  try {
    const body = JSON.stringify({ event: payload, timestamp: new Date().toISOString() });
    const headers = { 'Content-Type': 'application/json' };
    if (subscription.secret) {
      const crypto = require('crypto');
      headers['X-Webhook-Signature'] = crypto.createHmac('sha256', subscription.secret).update(body).digest('hex');
    }
    await fetch(subscription.webhook_url, { method: 'POST', headers, body, signal: AbortSignal.timeout(5000) });
  } catch (err) {
    // Silent failure — webhook delivery is best-effort
  }
}

module.exports = router;
