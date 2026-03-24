/**
 * Create tables for early access signup and voucher management
 */
module.exports = {
  name: 'create_early_access_tables',

  up: async (conn) => {
    // Access requests table - stores early access signup submissions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS access_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255) NOT NULL,
        organization VARCHAR(255),
        team_name VARCHAR(255),
        secondary_name VARCHAR(255),
        secondary_role VARCHAR(100),
        secondary_email VARCHAR(255),
        voucher_code_attempted VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // University vouchers table - manages early access voucher codes
    await conn.query(`
      CREATE TABLE IF NOT EXISTS university_vouchers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        voucher_code VARCHAR(50) NOT NULL UNIQUE,
        institution_name VARCHAR(255),
        max_users INT DEFAULT 10,
        contact_name VARCHAR(255),
        contact_role VARCHAR(100),
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255),
        organization VARCHAR(255),
        team_name VARCHAR(255),
        secondary_name VARCHAR(255),
        secondary_role VARCHAR(100),
        secondary_email VARCHAR(255),
        claimed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create index for faster lookups
    await conn.query(`
      CREATE INDEX idx_access_requests_email ON access_requests(email)
    `).catch(() => {});

    await conn.query(`
      CREATE INDEX idx_university_vouchers_code ON university_vouchers(voucher_code)
    `).catch(() => {});
  },

  down: async (conn) => {
    await conn.query('DROP TABLE IF EXISTS access_requests').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS university_vouchers').catch(() => {});
  }
};
