/**
 * Migration: Create projects table + add project_id to nodes
 *
 * Projects are the top-level containers for node trees.
 * Each node belongs to exactly one project.
 * Existing nodes without a project_id are treated as unassigned.
 */
module.exports = {
  name: 'create_projects',
  up: async (client) => {
    // Projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        description TEXT,
        slug        VARCHAR(100) UNIQUE,
        is_demo     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add project_id to nodes (nullable for backward compat)
    await client.query(`
      ALTER TABLE nodes
        ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS nodes_project_id_idx ON nodes(project_id)
    `);
  }
};
