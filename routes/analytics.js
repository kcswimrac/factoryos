/**
 * Analytics API
 *
 * GET /api/analytics — returns last 30 days of page views, unique visitors,
 *                      demo starts/completions, and UTM attribution.
 *
 * Protected by authenticateToken — only logged-in users can view.
 */

const express = require('express');
const router = express.Router();

// Daily page views + unique visitors for the last 30 days
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const days = Math.min(parseInt(req.query.days) || 30, 90);

    // Daily traffic
    const [traffic] = await pool.query(`
      SELECT
        DATE(created_at) AS day,
        COUNT(*) AS page_views,
        COUNT(DISTINCT ip_hash) AS unique_visitors
      FROM page_views
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY day DESC
    `, [days]);

    // Top pages
    const [topPages] = await pool.query(`
      SELECT
        path,
        COUNT(*) AS views,
        COUNT(DISTINCT ip_hash) AS unique_visitors
      FROM page_views
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY path
      ORDER BY views DESC
      LIMIT 20
    `, [days]);

    // UTM attribution
    const [utmSources] = await pool.query(`
      SELECT
        utm_source,
        utm_medium,
        utm_campaign,
        COUNT(*) AS visits,
        COUNT(DISTINCT ip_hash) AS unique_visitors
      FROM page_views
      WHERE utm_source IS NOT NULL
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY utm_source, utm_medium, utm_campaign
      ORDER BY visits DESC
      LIMIT 20
    `, [days]);

    // Demo engagement events
    const [demoEvents] = await pool.query(`
      SELECT
        event_name,
        COUNT(*) AS count
      FROM analytics_events
      WHERE event_name IN ('demo_started', 'demo_step', 'demo_completed')
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY event_name
    `, [days]);

    // Demo funnel — daily starts vs completions
    const [demoFunnel] = await pool.query(`
      SELECT
        DATE(created_at) AS day,
        SUM(CASE WHEN event_name = 'demo_started' THEN 1 ELSE 0 END) AS demo_starts,
        SUM(CASE WHEN event_name = 'demo_completed' THEN 1 ELSE 0 END) AS demo_completions
      FROM analytics_events
      WHERE event_name IN ('demo_started', 'demo_completed')
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY day DESC
    `, [days]);

    // Totals summary
    const [totals] = await pool.query(`
      SELECT
        COUNT(*) AS total_page_views,
        COUNT(DISTINCT ip_hash) AS total_unique_visitors
      FROM page_views
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [days]);

    res.json({
      success: true,
      days,
      totals: totals[0],
      daily_traffic: traffic,
      top_pages: topPages,
      utm_sources: utmSources,
      demo_events: demoEvents,
      demo_funnel: demoFunnel,
    });
  } catch (err) {
    console.error('[Analytics] query error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
