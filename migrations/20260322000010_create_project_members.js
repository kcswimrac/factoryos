/**
 * RBAC: Project Members
 *
 * Adds per-project role-based access control with three roles:
 *   - admin  : Full access — manage members, settings, billing
 *   - editor : Create/edit nodes, requirements, DOE, 8D, phases
 *   - viewer : Read-only access to entire project
 *
 * Roles are per-project (user can be admin on Project A, viewer on Project B).
 * The team owner (created_by) is automatically admin on all team projects.
 *
 * Also adds a pending_invites table for email-based invitations.
 */
module.exports = {
  name: 'create_project_members',
  up: async (conn) => {
    // project_members: per-project role assignments
    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id      INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
        role         VARCHAR(20) NOT NULL DEFAULT 'viewer'
                       CHECK (role IN ('admin', 'editor', 'viewer')),
        invited_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
      )
    `);

    await conn.query(`
      CREATE INDEX idx_project_members_project_id ON project_members(project_id)
    `).catch(() => {});
    await conn.query(`
      CREATE INDEX idx_project_members_user_id    ON project_members(user_id)
    `).catch(() => {});

    // project_invites: pending email invitations
    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_invites (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        email        VARCHAR(255) NOT NULL,
        role         VARCHAR(20) NOT NULL DEFAULT 'viewer'
                       CHECK (role IN ('admin', 'editor', 'viewer')),
        token        VARCHAR(255) NOT NULL UNIQUE,
        invited_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        expires_at   TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 7 DAY),
        accepted_at  TIMESTAMP NULL,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, email)
      )
    `);

    await conn.query(`
      CREATE INDEX idx_project_invites_token ON project_invites(token)
    `).catch(() => {});

    // Backfill: for every existing project, add the team owner as admin
    await conn.query(`
      INSERT INTO project_members (project_id, user_id, role)
      SELECT
        p.id         AS project_id,
        tm.user_id   AS user_id,
        'admin'      AS role
      FROM projects p
      JOIN teams t ON t.id = p.team_id
      JOIN team_members tm ON tm.team_id = t.id AND tm.role = 'owner'
      WHERE p.is_demo = 0
      ON DUPLICATE KEY UPDATE role = role
    `);
  }
};
