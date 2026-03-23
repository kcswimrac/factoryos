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
  up: async (conn) => {
    // Add phase_mode to nodes: 'own' = has its own lifecycle, 'inherit' = uses parent's
    await conn.query(`
      ALTER TABLE nodes ADD COLUMN phase_mode VARCHAR(20) NOT NULL DEFAULT 'inherit'
    `).catch(() => {});

    // Node phases table - tracks status per phase per node
    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_phases (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        node_id       INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        phase         VARCHAR(50) NOT NULL,
        phase_order   INTEGER NOT NULL,
        status        VARCHAR(20) NOT NULL DEFAULT 'not_started',
        started_at    TIMESTAMP NULL,
        completed_at  TIMESTAMP NULL,
        notes         TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE(node_id, phase)
      )
    `);

    await conn.query(`
      CREATE INDEX node_phases_node_id_idx ON node_phases(node_id)
    `).catch(() => {});

    await conn.query(`
      CREATE INDEX node_phases_status_idx ON node_phases(status)
    `).catch(() => {});
  }
};
