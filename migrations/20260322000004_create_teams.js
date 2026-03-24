/**
 * Migration: Create teams table + link projects to teams
 *
 * Teams are the top-level org grouping for projects.
 * Each project optionally belongs to a team.
 */
module.exports = {
  name: 'create_teams',
  up: async (conn) => {
    // Teams table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        slug        VARCHAR(100) UNIQUE,
        logo_url    TEXT,
        description TEXT,
        is_demo     TINYINT(1) NOT NULL DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add team_id to projects (nullable for backward compat)
    await conn.query(`
      ALTER TABLE projects
        ADD COLUMN team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL
    `).catch(() => {});

    // Add status to projects
    await conn.query(`
      ALTER TABLE projects
        ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active'
    `).catch(() => {});

    await conn.query(`
      CREATE INDEX projects_team_id_idx ON projects(team_id)
    `).catch(() => {});
  }
};
