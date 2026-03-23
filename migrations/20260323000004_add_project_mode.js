/**
 * Migration: Add project_mode to projects
 *
 * project_mode:
 *   top_down   — engineer starts from known architecture (node tree first)
 *   bottom_up  — engineer starts from ideas (Discovery Workspace first)
 */
module.exports = {
  name: 'add_project_mode',
  up: async (client) => {
    await client.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS project_mode VARCHAR(20) NOT NULL DEFAULT 'top_down'
    `);
  },
  down: async (client) => {
    await client.query(`
      ALTER TABLE projects DROP COLUMN IF EXISTS project_mode
    `);
  }
};
