/**
 * Migration: Add requirement derivation tracking
 *
 * 1. Adds `source` text column to requirements (references external docs/standards)
 * 2. Creates `requirement_derivations` junction table for parent-child requirement linking
 */
module.exports = {
  name: 'requirement_derivation_tracking',
  up: async (conn) => {
    // 1. Add source column to requirements
    await conn.query(`
      ALTER TABLE requirements ADD COLUMN source TEXT
    `).catch(() => {});

    // 2. Create derivations junction table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS requirement_derivations (
        id                   INT AUTO_INCREMENT PRIMARY KEY,
        parent_requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
        child_requirement_id  INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (parent_requirement_id, child_requirement_id)
      )
    `);

    // Indexes for fast bidirectional lookups
    await conn.query(`
      CREATE INDEX req_derivations_parent_idx ON requirement_derivations(parent_requirement_id)
    `).catch(() => {});
    await conn.query(`
      CREATE INDEX req_derivations_child_idx ON requirement_derivations(child_requirement_id)
    `).catch(() => {});
  },

  down: async (conn) => {
    await conn.query(`DROP TABLE IF EXISTS requirement_derivations`);
    await conn.query(`ALTER TABLE requirements DROP COLUMN source`).catch(() => {});
  }
};
