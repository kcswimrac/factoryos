/**
 * Migration: Create node_phases table + add phase_mode to nodes
 *
 * Adds the 9-step engineering lifecycle:
 *   Requirements -> R&D -> Design/CAD -> Serviceability -> Manufacturability
 *   -> Data Collection -> Analysis/CAE -> Testing/Validation -> Correlation
 *
 * Each node can own its phases or inherit from its parent.
 */
module.exports = {
  name: 'create_node_phases',
  up: async (client) => {
    // Add phase_mode to nodes: 'own' = has its own lifecycle, 'inherit' = uses parent's
    await client.query(`
      ALTER TABLE nodes ADD COLUMN IF NOT EXISTS phase_mode VARCHAR(20) NOT NULL DEFAULT 'inherit'
    `);

    // Node phases table - tracks status per phase per node
    await client.query(`
      CREATE TABLE IF NOT EXISTS node_phases (
        id            SERIAL PRIMARY KEY,
        node_id       INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        phase         VARCHAR(50) NOT NULL,
        phase_order   INTEGER NOT NULL,
        status        VARCHAR(20) NOT NULL DEFAULT 'not_started',
        started_at    TIMESTAMPTZ,
        completed_at  TIMESTAMPTZ,
        notes         TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(node_id, phase)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS node_phases_node_id_idx ON node_phases(node_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS node_phases_status_idx ON node_phases(status)
    `);
  }
};
