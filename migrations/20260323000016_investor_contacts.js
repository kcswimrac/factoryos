module.exports = {
  name: '20260323000016_investor_contacts',
  up: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_contacts (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        email      VARCHAR(255) NOT NULL,
        firm       VARCHAR(255),
        investor_type VARCHAR(50),
        message    TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS investor_contacts_email_idx ON investor_contacts(email)`);
    await client.query(`CREATE INDEX IF NOT EXISTS investor_contacts_created_at_idx ON investor_contacts(created_at)`);
  },
  down: async (client) => {
    await client.query(`DROP TABLE IF EXISTS investor_contacts`);
  }
};
