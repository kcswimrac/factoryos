/**
 * Migration: Add public sharing to projects
 *
 * share_token  — random UUID used in the public URL
 * is_public    — when true, anyone with the link can view (no login)
 */
module.exports = {
  name: 'public_project_share',
  up: async (conn) => {
    await conn.query(`
      ALTER TABLE projects
        ADD COLUMN share_token VARCHAR(36) UNIQUE
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE projects
        ADD COLUMN is_public   TINYINT(1) NOT NULL DEFAULT 0
    `).catch(() => {});

    await conn.query(`
      CREATE INDEX projects_share_token_idx ON projects(share_token)
    `).catch(() => {});
  },
  down: async (conn) => {
    await conn.query(`DROP INDEX projects_share_token_idx ON projects`).catch(() => {});
    await conn.query(`ALTER TABLE projects DROP COLUMN is_public`).catch(() => {});
    await conn.query(`ALTER TABLE projects DROP COLUMN share_token`).catch(() => {});
  }
};
