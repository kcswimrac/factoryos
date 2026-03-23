/**
 * Server-side analytics middleware
 *
 * Logs page views for HTML page routes (not API calls).
 * Captures referrer, user agent, UTM params, and a hashed IP for unique visitors.
 * Fires asynchronously — never blocks the response.
 */

const crypto = require('crypto');

// Salt rotates daily so we can count unique visitors per day
// without storing real IPs
function hashIP(ip) {
  const daySalt = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return crypto.createHash('sha256').update(ip + daySalt).digest('hex');
}

// Only track page routes, skip API/static asset requests
const TRACKED_PATHS = new Set([
  '/', '/projects', '/app', '/discovery', '/sops',
  '/login', '/onboarding', '/invest', '/settings',
  '/reset-password'
]);

function isTrackedPath(path) {
  // Exact match or /share/:token
  return TRACKED_PATHS.has(path) || path.startsWith('/share/');
}

function parseUTM(query) {
  return {
    utm_source: query.utm_source || null,
    utm_medium: query.utm_medium || null,
    utm_campaign: query.utm_campaign || null,
  };
}

function trackPageViews(req, res, next) {
  // Continue immediately — logging is async
  next();

  if (!isTrackedPath(req.path)) return;

  const pool = req.app.locals.pool;
  if (!pool) return;

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  const utm = parseUTM(req.query);

  pool.query(
    `INSERT INTO page_views (path, referrer, user_agent, ip_hash, utm_source, utm_medium, utm_campaign, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      req.path,
      req.headers.referer || null,
      req.headers['user-agent'] || null,
      hashIP(ip),
      utm.utm_source,
      utm.utm_medium,
      utm.utm_campaign,
      req.user?.id || null,
    ]
  ).catch(err => {
    // Silently fail — analytics should never break the app
    if (!err.message.includes('does not exist')) {
      console.error('[Analytics] page_view error:', err.message);
    }
  });
}

/**
 * Log a custom analytics event (call from route handlers)
 *
 * Usage:
 *   const { trackEvent } = require('../middleware/analytics');
 *   trackEvent(req, 'demo_started', { step: 1 });
 */
function trackEvent(req, eventName, eventData = {}) {
  const pool = req.app.locals.pool;
  if (!pool) return;

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

  pool.query(
    `INSERT INTO analytics_events (event_name, event_data, path, ip_hash, user_id, session_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      eventName,
      JSON.stringify(eventData),
      req.path,
      hashIP(ip),
      req.user?.id || null,
      req.headers['x-session-id'] || null,
    ]
  ).catch(err => {
    if (!err.message.includes('does not exist')) {
      console.error('[Analytics] event error:', err.message);
    }
  });
}

module.exports = { trackPageViews, trackEvent };
