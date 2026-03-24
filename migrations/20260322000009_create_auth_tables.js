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
  up: async (conn) => {
    // Add reset token fields to users
    await conn.query(`
      ALTER TABLE users
        ADD COLUMN reset_token VARCHAR(255)
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE users
        ADD COLUMN reset_token_expires TIMESTAMP NULL
    `).catch(() => {});

    // Add created_by to teams (who owns this team)
    await conn.query(`
      ALTER TABLE teams
        ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    `).catch(() => {});

    // Create team_members junction table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      )
    `);

    await conn.query(`
      CREATE INDEX idx_team_members_user_id ON team_members(user_id)
    `).catch(() => {});
    await conn.query(`
      CREATE INDEX idx_team_members_team_id ON team_members(team_id)
    `).catch(() => {});
  }
};
