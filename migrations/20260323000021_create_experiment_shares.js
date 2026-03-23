/**
 * Create experiment sharing tables
 */
module.exports = {
  name: 'create_experiment_shares',

  up: async (conn) => {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS experiment_shares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id INT NOT NULL,
        invited_email VARCHAR(255) NOT NULL,
        invited_name VARCHAR(255),
        access_level ENUM('view', 'contribute', 'execute') DEFAULT 'view',
        share_token VARCHAR(128) NOT NULL UNIQUE,
        created_by INT,
        status ENUM('pending', 'accepted', 'revoked', 'expired') DEFAULT 'pending',
        invite_message TEXT,
        accepted_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_experiment_shares_experiment (experiment_id),
        INDEX idx_experiment_shares_email (invited_email),
        INDEX idx_experiment_shares_token (share_token)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS experiment_share_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        share_id INT NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        activity_details JSON,
        actor_email VARCHAR(255),
        actor_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_share_activity_share (share_id)
      )
    `);
  },

  down: async (conn) => {
    await conn.query('DROP TABLE IF EXISTS experiment_share_activity').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS experiment_shares').catch(() => {});
  }
};
