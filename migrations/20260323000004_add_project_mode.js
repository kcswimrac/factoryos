/**
 * Migration: Add project_mode to projects
 *
 * project_mode:
 *   top_down   — engineer starts from known architecture (node tree first)
 *   bottom_up  — engineer starts from ideas (Discovery Workspace first)
 */
module.exports = {
  name: 'add_project_mode',
  up: async (conn) => {
    await conn.query(`
      ALTER TABLE projects
        ADD COLUMN project_mode VARCHAR(20) NOT NULL DEFAULT 'top_down'
    `).catch(() => {});
  },
  down: async (conn) => {
    await conn.query(`
      ALTER TABLE projects DROP COLUMN project_mode
    `).catch(() => {});
  }
};
