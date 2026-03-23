/**
 * Auth tables migration
 * - Adds reset_token fields to users
 * - Adds created_by to teams
 * - Creates team_members junction table
 *
 * Note: users.email uniqueness is already enforced by users_email_unique_idx
 * created in runCoreMigrations (LOWER(email) unique index).
 */
module.exports = {
  name: 'create_auth_tables',
  up: async (client) => {
    // Add reset token fields to users
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
        ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ
    `);

    // Add created_by to teams (who owns this team)
    await client.query(`
      ALTER TABLE teams
        ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    `);

    // Create team_members junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
    `);
  }
};
