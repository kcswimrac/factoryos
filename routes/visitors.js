const express = require('express');
const router = express.Router();

// ── GET /stream — SSE stream for real-time visitor count ─────────────────────
// Note: SSE requires persistent connections. On Vercel serverless, this endpoint
// will return a single event then close. For true real-time, use Pusher (frontend
// already has Pusher integration in Header.jsx).

router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  // Send a single count event (serverless-compatible)
  res.write(`data: ${JSON.stringify({ count: 1, note: 'Use Pusher for real-time tracking' })}\n\n`);

  // On serverless, end the response to avoid hanging
  if (process.env.VERCEL) {
    res.end();
    return;
  }

  // On traditional servers, keep connection open
  req.on('close', () => {
    // Client disconnected
  });
});

// ── GET /count — REST endpoint for polling (serverless-compatible) ───────────

router.get('/count', async (req, res) => {
  try {
    // Try to get count from database (serverless-safe)
    const pool = req.app.locals.pool;
    if (pool) {
      const [rows] = await pool.query(
        "SELECT COUNT(*) AS cnt FROM page_views WHERE viewed_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)"
      ).catch(() => [[{ cnt: 0 }]]);
      return res.json({ success: true, data: { count: rows[0].cnt || 0 } });
    }
    res.json({ success: true, data: { count: 0 } });
  } catch (err) {
    res.json({ success: true, data: { count: 0 } });
  }
});

module.exports = router;
