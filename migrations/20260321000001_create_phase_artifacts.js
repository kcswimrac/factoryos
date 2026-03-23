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
  up: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS phase_artifacts (
        id            SERIAL PRIMARY KEY,
        node_id       INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        phase         VARCHAR(50) NOT NULL,
        artifact_type VARCHAR(50) NOT NULL,
        artifact_key  VARCHAR(100),
        data          JSONB NOT NULL DEFAULT '{}',
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Single-record artifacts are unique per (node_id, phase, artifact_key)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS phase_artifacts_single_key_idx
      ON phase_artifacts(node_id, phase, artifact_key)
      WHERE artifact_key IS NOT NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS phase_artifacts_node_phase_idx
      ON phase_artifacts(node_id, phase)
    `);
  }
};
