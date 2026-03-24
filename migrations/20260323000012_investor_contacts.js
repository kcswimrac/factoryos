module.exports = {
  name: '20260323000012_investor_contacts',
  up: async (conn) => {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS investor_contacts (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        email      VARCHAR(255) NOT NULL,
        firm       VARCHAR(255),
        investor_type VARCHAR(50),
        message    TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`CREATE INDEX investor_contacts_email_idx ON investor_contacts(email)`).catch(() => {});
    await conn.query(`CREATE INDEX investor_contacts_created_at_idx ON investor_contacts(created_at)`).catch(() => {});
  },
  down: async (conn) => {
    await conn.query(`DROP TABLE IF EXISTS investor_contacts`);
  }
};
