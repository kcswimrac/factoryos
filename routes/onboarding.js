/**
 * Onboarding API
 *
 * GET  /api/onboarding/status   — check if setup is needed (no teams exist)
 * POST /api/onboarding/setup    — create team + project in one shot
 * POST /api/onboarding/demo     — seed demo data and return first project id
 */

const express = require('express');
const router = express.Router();
const { trackEvent } = require('../middleware/analytics');

// GET /api/onboarding/status
router.get('/status', async (req, res) => {
  const pool = req.app.locals.pool;
  const result = await pool.query(`
    SELECT COUNT(*)::int AS team_count FROM teams WHERE is_demo = FALSE
  `);
  const teamCount = result.rows[0].team_count;
  res.json({ success: true, needs_onboarding: teamCount === 0 });
});

// POST /api/onboarding/setup — create team + project atomically
router.post('/setup', async (req, res) => {
  const pool = req.app.locals.pool;
  const { team_name, team_logo_url, project_name, project_description } = req.body;

  if (!team_name) return res.status(400).json({ success: false, message: 'team_name required' });
  if (!project_name) return res.status(400).json({ success: false, message: 'project_name required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create the team
    const teamSlug = team_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const teamResult = await client.query(
      `INSERT INTO teams (name, slug, logo_url) VALUES ($1, $2, $3) RETURNING *`,
      [team_name, teamSlug || null, team_logo_url || null]
    );
    const team = teamResult.rows[0];

    // Create the first project
    const projectSlug = project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const projectResult = await client.query(
      `INSERT INTO projects (name, description, slug, team_id, status) VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
      [project_name, project_description || null, projectSlug || null, team.id]
    );
    const project = projectResult.rows[0];

    await client.query('COMMIT');
    trackEvent(req, 'onboarding_completed', { team_id: team.id, project_id: project.id });
    res.status(201).json({ success: true, team, project });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Name already taken — try a different one.' });
    throw err;
  } finally {
    client.release();
  }
});

module.exports = router;
