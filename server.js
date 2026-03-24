const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'factoryos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Root route — handled at the bottom of the file (React SPA or vanilla fallback)

// ── Auth routes (no authentication required) ────────────────────────────────
const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

// ── Demo seed (public, no auth required) ────────────────────────────────────
const demoSeedRouter = require('./routes/demo-seed');
app.use('/api/demo/seed', demoSeedRouter);

// ── Early access signups (public, no auth required) ────────────────────────────
const earlyAccessRouter = require('./routes/early-access');
app.use('/api/early-access', earlyAccessRouter);

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

// ── Phase 2: Factory-os frontend-compatible API routes ──────────────────────

// Experiments (DOE frontend — full factorial analysis engine)
const experimentsRouter = require('./routes/experiments');
app.use('/api/experiments', optionalAuth, experimentsRouter);

// Experiment sharing (token-based guest access)
const experimentSharesRouter = require('./routes/experiment-shares');
app.use('/api/experiment-shares', optionalAuth, experimentSharesRouter);

// Design cycle (9-phase engineering methodology)
const designCycleRouter = require('./routes/design-cycle');
app.use('/api/design', optionalAuth, designCycleRouter);

// Design reviews (T2.3 — SRR/PDR/CDR with findings and sign-off)
const designReviewsRouter = require('./routes/design-reviews');
app.use('/api/design/:projectId/reviews', optionalAuth, designReviewsRouter);

// Trade studies (T2.4 — Pugh matrix scoring)
const tradeStudiesRouter = require('./routes/trade-studies');
app.use('/api/projects/:projectId/trade-studies', optionalAuth, tradeStudiesRouter);

// Resources (tool & asset inventory with checkout/return)
const resourcesInventoryRouter = require('./routes/resources-inventory');
app.use('/api/resources', optionalAuth, resourcesInventoryRouter);

// SOP execution (T2.5 — step-by-step with sign-off)
const sopExecutionRouter = require('./routes/sop-execution');
app.use('/api/sops/:sopId/executions', optionalAuth, sopExecutionRouter);

// Visitors (live SSE count)
const visitorsRouter = require('./routes/visitors');
app.use('/api/visitors', visitorsRouter);

// Knowledge base search (placeholder for design cycle)
app.get('/api/knowledge/search', (req, res) => {
  res.json({ success: true, data: [] });
});

// Bidirectional: GET /api/nodes/:nodeId/sops
// Returns all SOPs that include this node in their linked_nodes JSON array
app.get('/api/nodes/:nodeId/sops', optionalAuth, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const nodeId = parseInt(req.params.nodeId, 10);
    const [rows] = await pool.query(
      `SELECT id, project_id, title, description, version, revision, status, linked_nodes, created_at, updated_at
       FROM sops
       WHERE JSON_CONTAINS(linked_nodes, ?)
       ORDER BY title ASC`,
      [JSON.stringify(nodeId)]
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

// ══════════════════════════════════════════════════════════════════════════════
// STATIC FILES & PAGE ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// Serve built React frontend (Phase 1 — Factory-os UI)
const reactDistPath = path.join(__dirname, 'frontend', 'dist');
if (fs.existsSync(reactDistPath)) {
  app.use('/assets', express.static(path.join(reactDistPath, 'assets')));
}

// Serve vanilla HTML static files (Phase 4 — factoryos-only features)
app.use(express.static(path.join(__dirname, 'public')));

// ── React SPA routes (Factory-os frontend) ──────────────────────────────────
// These routes serve the React SPA for the modern Factory-os UI
const reactRoutes = [
  '/doe', '/doe/*',
  '/design', '/design/*',
  '/quality', '/quality/*',
  '/timeline',
  '/reporting', '/reporting/*',
  '/executive',
  '/resources',
  '/shared-with-me',
  '/share/experiment/*',
  '/help'
];

const serveReactApp = (req, res) => {
  const indexPath = path.join(reactDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback: redirect to vanilla projects page if React build not available
    res.redirect('/projects');
  }
};

reactRoutes.forEach(route => app.get(route, serveReactApp));

// ── Root route — serve React landing page ────────────────────────────────────
app.get('/', (req, res) => {
  const indexPath = path.join(reactDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.redirect('/projects');
  }
});

// ── React login (Factory-os frontend login) ──────────────────────────────────
// Vanilla login kept at /login/classic for backward compatibility
app.get('/login', (req, res) => {
  const indexPath = path.join(reactDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

app.get('/login/classic', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ── factoryos-only vanilla HTML pages (preserved from Phase 4) ───────────────

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Onboarding wizard
app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'onboarding.html'));
});

// Projects dashboard — team/project list (factoryos node tree launcher)
app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projects.html'));
});

// Node tree app (factoryos core — scoped to a project via ?project=ID)
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.html'));
});

// Discovery Workspace (project-scoped, ?project=ID)
app.get('/discovery', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'discovery.html'));
});

// SOPs workspace (factoryos vanilla — React version at /sops via SPA)
app.get('/sops/workspace', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sops.html'));
});

// Public share viewer — /share/:token (factoryos project share)
app.get('/share/:token', (req, res) => {
  // Don't intercept /share/experiment/* (React SPA handles those)
  if (req.params.token === 'experiment') return serveReactApp(req, res);
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
    try {
      await pool.query(
        `INSERT IGNORE INTO investor_contacts (name, email, firm, investor_type, message, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [name, email, firm || null, type || null, message || null]
      );
    } catch (dbErr) {
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

// ── Catch-all: try React SPA, then 404 ──────────────────────────────────────
app.use((req, res) => {
  // For non-API requests, try React SPA first
  if (!req.path.startsWith('/api/')) {
    const indexPath = path.join(reactDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
