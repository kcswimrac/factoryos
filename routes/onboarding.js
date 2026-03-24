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
  const [rows] = await pool.query(`
    SELECT COUNT(*) AS team_count FROM teams WHERE is_demo = FALSE
  `);
  const teamCount = rows[0].team_count;
  res.json({ success: true, needs_onboarding: teamCount === 0 });
});

// POST /api/onboarding/setup — create team + project atomically
router.post('/setup', async (req, res) => {
  const pool = req.app.locals.pool;
  const { team_name, team_logo_url, project_name, project_description } = req.body;

  if (!team_name) return res.status(400).json({ success: false, message: 'team_name required' });
  if (!project_name) return res.status(400).json({ success: false, message: 'project_name required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Create the team
    const teamSlug = team_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [teamResult] = await conn.query(
      `INSERT INTO teams (name, slug, logo_url) VALUES (?, ?, ?)`,
      [team_name, teamSlug || null, team_logo_url || null]
    );
    const teamId = teamResult.insertId;
    const [teamRows] = await conn.query(`SELECT * FROM teams WHERE id = ?`, [teamId]);
    const team = teamRows[0];

    // Create the first project
    const projectSlug = project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [projectResult] = await conn.query(
      `INSERT INTO projects (name, description, slug, team_id, status) VALUES (?, ?, ?, ?, 'active')`,
      [project_name, project_description || null, projectSlug || null, teamId]
    );
    const projectId = projectResult.insertId;
    const [projectRows] = await conn.query(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    const project = projectRows[0];

    await conn.commit();
    trackEvent(req, 'onboarding_completed', { team_id: team.id, project_id: project.id });
    res.status(201).json({ success: true, team, project });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Name already taken — try a different one.' });
    throw err;
  } finally {
    conn.release();
  }
});

module.exports = router;
