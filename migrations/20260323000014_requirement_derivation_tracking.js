/**
 * Migration: Add requirement derivation tracking
 *
 * 1. Adds `source` text column to requirements (references external docs/standards)
 * 2. Creates `requirement_derivations` junction table for parent-child requirement linking
 */
module.exports = {
  name: 'requirement_derivation_tracking',
  up: async (client) => {
    // 1. Add source column to requirements
    await client.query(`
      ALTER TABLE requirements ADD COLUMN IF NOT EXISTS source TEXT
    `);

    // 2. Create derivations junction table
    await client.query(`
      CREATE TABLE IF NOT EXISTS requirement_derivations (
        id                   SERIAL PRIMARY KEY,
        parent_requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
        child_requirement_id  INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
        created_at            TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (parent_requirement_id, child_requirement_id)
      )
    `);

    // Indexes for fast bidirectional lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS req_derivations_parent_idx ON requirement_derivations(parent_requirement_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS req_derivations_child_idx ON requirement_derivations(child_requirement_id)
    `);
  },

  down: async (client) => {
    await client.query(`DROP TABLE IF EXISTS requirement_derivations`);
    await client.query(`ALTER TABLE requirements DROP COLUMN IF EXISTS source`);
  }
};
