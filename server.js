const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Fail fast if DATABASE_URL is missing
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Make pool available to all route handlers via req.app.locals.pool
app.locals.pool = pool;

app.use(express.json({ limit: '15mb' }));

// Auth middleware
const { authenticateToken, optionalAuth } = require('./middleware/auth');

// Server-side analytics — track page views (no client JS needed)
const { trackPageViews } = require('./middleware/analytics');
app.use(trackPageViews);

// Health check endpoint (required for Render)
// Note: Does NOT query database to allow Neon auto-suspend
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Root redirect for custom domain — redirect to /projects dashboard
app.get('/', (req, res) => {
  res.redirect(301, '/projects');
});

// ── Auth routes (no authentication required) ────────────────────────────────
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// ── Demo seed (public, no auth required) ────────────────────────────────────
const demoSeedRouter = require('./routes/demo-seed');
app.use('/api/demo/seed', demoSeedRouter);

// ── Public share (unauthenticated read-only) ─────────────────────────────────
const publicShareRouter = require('./routes/public-share');
app.use('/api/public', publicShareRouter);

// ── Read-only API routes with optional auth (demo content accessible to all) ─
const teamsRouter = require('./routes/teams');
app.use('/api/teams', optionalAuth, teamsRouter);

const projectsRouter = require('./routes/projects');
app.use('/api/projects', optionalAuth, projectsRouter);

// ── Discovery Workspace (optionalAuth — must register BEFORE projectMembersRouter)
// IMPORTANT: app.use('/api/projects/:id', authenticateToken, ...) below would
// intercept these paths if they were registered after it. Register them here so
// optionalAuth handles them and the response is sent before the project-members
// catch-all ever runs.
const discoveryRouter = require('./routes/discovery');
app.use('/api/projects/:projectId/discovery', optionalAuth, discoveryRouter);

const discoveryAiRouter = require('./routes/discovery-ai');
app.use('/api/projects/:projectId/discovery', optionalAuth, discoveryAiRouter);

// ── Project members / RBAC management (auth required) ───────────────────────
const projectMembersRouter = require('./routes/project-members');
app.use('/api/projects/:id', authenticateToken, projectMembersRouter);

// ── Data API routes (optionalAuth — demo content readable without login) ─────
// Write operations within each router enforce their own RBAC (requireRole /
// assertEditorRole) which correctly blocks unauthenticated writes and demo
// project mutations.  GET handlers are intentionally open for demo browsing.
const nodesRouter = require('./routes/nodes');
app.use('/api/nodes', optionalAuth, nodesRouter);

const requirementsRouter = require('./routes/requirements');
app.use('/api/requirements', optionalAuth, requirementsRouter);

const phasesRouter = require('./routes/phases');
app.use('/api/nodes', optionalAuth, phasesRouter);

const phaseRevisionsRouter = require('./routes/phase-revisions');
app.use('/api/nodes/:id/phase-revisions', optionalAuth, phaseRevisionsRouter);

const aiGuidanceRouter = require('./routes/ai-guidance');
app.use('/api/nodes', optionalAuth, aiGuidanceRouter);

const doeRouter = require('./routes/doe');
app.use('/api/doe', optionalAuth, doeRouter);

const eightdRouter = require('./routes/eightd');
app.use('/api/eightd', optionalAuth, eightdRouter);

const sopsRouter = require('./routes/sops');
app.use('/api/sops', optionalAuth, sopsRouter);

const rendersRouter = require('./routes/renders');
app.use('/api/nodes', optionalAuth, rendersRouter);

const vendorRouter = require('./routes/vendor');
app.use('/api/nodes', optionalAuth, vendorRouter);

// Export routes remain auth-protected (not part of demo browsing flow)
const exportRouter = require('./routes/export');
app.use('/api/export', authenticateToken, exportRouter);

const onboardingRouter = require('./routes/onboarding');
app.use('/api/onboarding', onboardingRouter);

// ── Analytics (auth required — only logged-in users can view metrics) ────────
const analyticsRouter = require('./routes/analytics');
app.use('/api/analytics', authenticateToken, analyticsRouter);

// Bidirectional: GET /api/nodes/:nodeId/sops
// Returns all SOPs that include this node in their linked_nodes JSON array
app.get('/api/nodes/:nodeId/sops', optionalAuth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const nodeId = parseInt(req.params.nodeId, 10);
    const { rows } = await pool.query(
      `SELECT id, project_id, title, description, version, revision, status, linked_nodes, created_at, updated_at
       FROM sops
       WHERE linked_nodes @> $1::jsonb
       ORDER BY title ASC`,
      [JSON.stringify([nodeId])]
    );
    res.json({ success: true, sops: rows });
  } catch (err) {
    console.error('[SOPs] node-sops error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Auth pages
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Onboarding wizard
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'onboarding.html'));
});

// Projects dashboard — team/project list
app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projects.html'));
});

// App route - serves the node tree app (scoped to a project via ?project=ID)
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Discovery Workspace (project-scoped, ?project=ID)
app.get('/discovery', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'discovery.html'));
});

// SOPs (project-scoped, ?project=ID)
app.get('/sops', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sops.html'));
});

// Public share viewer — /share/:token
app.get('/share/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'share.html'));
});

// Investor pitch page
app.get('/invest', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'invest.html'));
});

// Investor contact form submission
app.post('/api/invest/contact', async (req, res) => {
  try {
    const { name, email, firm, type, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }
    // Log to database for tracking
    try {
      await pool.query(
        `INSERT INTO investor_contacts (name, email, firm, investor_type, message, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING`,
        [name, email, firm || null, type || null, message || null]
      );
    } catch (dbErr) {
      // Table may not exist yet — log and continue (don't block the UX)
      console.log('[Invest] DB log skipped:', dbErr.message);
    }
    console.log(`[Invest] Contact: ${name} <${email}> | ${firm || 'no firm'} | ${type || 'unknown'}`);
    res.json({ success: true, message: 'Message received.' });
  } catch (err) {
    console.error('[Invest] Contact error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// User settings page
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// 404 — must come after all routes and static middleware
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
