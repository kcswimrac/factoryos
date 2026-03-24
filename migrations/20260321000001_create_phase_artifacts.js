/**
 * Migration: Create phase_artifacts table
 *
 * Stores structured artifact data per phase per node.
 * Used by the hard-gating engine — phases cannot advance until
 * required artifacts exist.
 *
 * artifact_key: for single-record artifacts (cad_ref, serviceability_meta,
 *   manufacturability_meta, comparison_matrix), unique per (node_id, phase).
 *   NULL for multi-record artifacts (design_option, data_point, etc.).
 */
module.exports = {
  name: 'create_phase_artifacts',
  up: async (conn) => {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS phase_artifacts (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        node_id       INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        phase         VARCHAR(50) NOT NULL,
        artifact_type VARCHAR(50) NOT NULL,
        artifact_key  VARCHAR(100),
        data          JSON NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Single-record artifacts are unique per (node_id, phase, artifact_key)
    // MySQL doesn't support partial unique indexes (WHERE clause), use a regular unique index
    await conn.query(`
      CREATE UNIQUE INDEX phase_artifacts_single_key_idx
      ON phase_artifacts(node_id, phase, artifact_key)
    `).catch(() => {});

    await conn.query(`
      CREATE INDEX phase_artifacts_node_phase_idx
      ON phase_artifacts(node_id, phase)
    `).catch(() => {});
  }
};
