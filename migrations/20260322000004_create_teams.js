/**
 * Migration: Create teams table + link projects to teams
 *
 * Teams are the top-level org grouping for projects.
 * Each project optionally belongs to a team.
 */
module.exports = {
  name: 'create_teams',
  up: async (client) => {
    // Teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        slug        VARCHAR(100) UNIQUE,
        logo_url    TEXT,
        description TEXT,
        is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add team_id to projects (nullable for backward compat)
    await client.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL
    `);

    // Add status to projects
    await client.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active'
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS projects_team_id_idx ON projects(team_id)
    `);
  }
};
