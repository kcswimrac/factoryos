module.exports = {
  name: 'create_nodes_table',
  up: async (client) => {
    // Create node type enum
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE node_type AS ENUM ('ASSY', 'SYS', 'SUBSYS', 'SUBASSY', 'COMP', 'PURCH', 'DOC');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create nodes table with self-referencing FK
    await client.query(`
      CREATE TABLE IF NOT EXISTS nodes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        part_number VARCHAR(255) NOT NULL UNIQUE,
        type node_type NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES nodes(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Index for fast parent_id lookups (children queries)
    await client.query(`
      CREATE INDEX IF NOT EXISTS nodes_parent_id_idx ON nodes (parent_id)
    `);

    // Index for part number lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS nodes_part_number_idx ON nodes (part_number)
    `);
  }
};
