/**
 * Migration: Create projects table + add project_id to nodes
 *
 * Projects are the top-level containers for node trees.
 * Each node belongs to exactly one project.
 * Existing nodes without a project_id are treated as unassigned.
 */
module.exports = {
  name: 'create_projects',
  up: async (conn) => {
    // Projects table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        description TEXT,
        slug        VARCHAR(100) UNIQUE,
        is_demo     TINYINT(1) NOT NULL DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add project_id to nodes (nullable for backward compat)
    await conn.query(`
      ALTER TABLE nodes
        ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL
    `).catch(() => {});

    await conn.query(`
      CREATE INDEX nodes_project_id_idx ON nodes(project_id)
    `).catch(() => {});
  }
};
