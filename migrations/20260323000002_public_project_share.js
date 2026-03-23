/**
 * Migration: Add public sharing to projects
 *
 * share_token  — random UUID used in the public URL
 * is_public    — when true, anyone with the link can view (no login)
 */
module.exports = {
  name: 'public_project_share',
  up: async (client) => {
    await client.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT gen_random_uuid(),
        ADD COLUMN IF NOT EXISTS is_public   BOOLEAN NOT NULL DEFAULT FALSE
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS projects_share_token_idx ON projects(share_token)
    `);
  },
  down: async (client) => {
    await client.query(`DROP INDEX IF EXISTS projects_share_token_idx`);
    await client.query(`
      ALTER TABLE projects
        DROP COLUMN IF EXISTS is_public,
        DROP COLUMN IF EXISTS share_token
    `);
  }
};
