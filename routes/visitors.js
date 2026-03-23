const express = require('express');
const router = express.Router();

// In-memory visitor tracking
let visitorCount = 0;
const clients = new Set();

// ── GET /stream — SSE stream for real-time visitor count ─────────────────────

router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  visitorCount++;
  clients.add(res);

  // Send current count to new client
  res.write(`data: ${JSON.stringify({ count: visitorCount })}\n\n`);

  // Broadcast updated count to all clients
  broadcastCount();

  // Handle client disconnect
  req.on('close', () => {
    visitorCount = Math.max(0, visitorCount - 1);
    clients.delete(res);
    broadcastCount();
  });
});

// ── GET /count — REST endpoint for polling ───────────────────────────────────

router.get('/count', (req, res) => {
  res.json({ success: true, data: { count: visitorCount } });
});

function broadcastCount() {
  const data = JSON.stringify({ count: visitorCount });
  for (const client of clients) {
    client.write(`data: ${data}\n\n`);
  }
}

module.exports = router;
