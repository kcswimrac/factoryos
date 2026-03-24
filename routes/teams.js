/**
 * Teams API
 *
 * GET  /api/teams                — list teams for authenticated user (+ demo teams)
 * POST /api/teams                — create team (auto-adds user as owner)
 * GET  /api/teams/:id            — get team (if member or demo)
 * GET  /api/teams/:id/projects   — get projects for team
 */

const express = require('express');
const router = express.Router();

// GET /api/teams — list teams for this user (+ demo teams visible to all)
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.user?.id || null;

  let rows;
  if (userId) {
    // Return: demo teams + teams the user is a member of
    [rows] = await pool.query(`
      SELECT
        t.*,
        COALESCE(tm.role, 'viewer') AS user_role,
        COUNT(p.id) AS project_count
      FROM teams t
      LEFT JOIN projects p ON p.team_id = t.id
      LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ?
      WHERE t.is_demo = TRUE OR tm.user_id = ?
      GROUP BY t.id, tm.role
      ORDER BY t.is_demo ASC,
        CASE WHEN t.is_demo THEN CASE t.slug WHEN 'greyline' THEN 1 WHEN 'full-send' THEN 2 WHEN 'heavy-motion' THEN 3 ELSE 99 END END ASC,
        t.created_at ASC
    `, [userId, userId]);
  } else {
    // No auth — return demo teams only
    [rows] = await pool.query(`
      SELECT
        t.*,
        'viewer' AS user_role,
        COUNT(p.id) AS project_count
      FROM teams t
      LEFT JOIN projects p ON p.team_id = t.id
      WHERE t.is_demo = TRUE
      GROUP BY t.id
      ORDER BY
        CASE t.slug WHEN 'greyline' THEN 1 WHEN 'full-send' THEN 2 WHEN 'heavy-motion' THEN 3 ELSE 99 END ASC,
        t.created_at ASC
    `);
  }

  res.json({ success: true, teams: rows });
});

// POST /api/teams — create team (auth required)
router.post('/', async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.user?.id;
  const { name, slug, description, logo_url } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'name required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO teams (name, slug, description, logo_url, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [name, slug || null, description || null, logo_url || null, userId || null]
    );
    const [teamRows] = await conn.query('SELECT * FROM teams WHERE id = ?', [result.insertId]);
    const team = teamRows[0];

    // Auto-add creator as owner
    if (userId) {
      await conn.query(
        `INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, 'owner')`,
        [team.id, userId]
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, team });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Slug already exists' });
    throw err;
  } finally {
    conn.release();
  }
});

// GET /api/teams/:id — get single team (demo or member)
router.get('/:id', async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.user?.id || null;

  const [rows] = await pool.query(`
    SELECT t.*
    FROM teams t
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ?
    WHERE t.id = ?
      AND (t.is_demo = TRUE OR tm.user_id = ?)
  `, [userId, req.params.id, userId]);

  if (!rows.length) return res.status(404).json({ success: false, message: 'Team not found' });
  res.json({ success: true, team: rows[0] });
});

// GET /api/teams/:id/projects — get projects for a team
router.get('/:id/projects', async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.user?.id || null;
  const teamId = parseInt(req.params.id);
  if (!teamId) return res.status(400).json({ success: false, message: 'Invalid team id' });

  // Check access
  const [accessRows] = await pool.query(`
    SELECT 1 FROM teams t
    LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ?
    WHERE t.id = ? AND (t.is_demo = TRUE OR tm.user_id = ?)
  `, [userId, teamId, userId]);

  if (!accessRows.length) return res.status(403).json({ success: false, message: 'Access denied' });

  const [rows] = await pool.query(`
    SELECT
      p.*,
      COUNT(n.id) AS node_count
    FROM projects p
    LEFT JOIN nodes n ON n.project_id = p.id
    WHERE p.team_id = ?
    GROUP BY p.id
    ORDER BY p.created_at ASC
  `, [teamId]);

  res.json({ success: true, projects: rows });
});

module.exports = router;
