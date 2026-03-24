/**
 * Migration: Phase regression / revision model
 *
 * When a node's phase lifecycle regresses (a completed phase is re-opened),
 * the current state is frozen as a numbered revision (Rev A, Rev B, ...).
 *
 * node_phase_revisions
 *   node_id               — the node that owns the phase lifecycle
 *   revision_label        — "Rev A", "Rev B", ... auto-assigned
 *   triggered_by_phase    — which phase was re-opened to cause this freeze
 *   regression_reason     — optional free-text from the engineer
 *   phase_snapshot        — JSON array of all 7 phases at freeze time
 *                           [{ phase, status, started_at, completed_at, notes }]
 *   artifact_snapshot     — JSON map of phase -> [artifacts] at freeze time
 *   created_at            — when the revision was created
 */
module.exports = {
  name: 'phase_revisions',
  up: async (conn) => {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_phase_revisions (
        id                  INT AUTO_INCREMENT PRIMARY KEY,
        node_id             INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        revision_label      VARCHAR(20) NOT NULL,
        triggered_by_phase  VARCHAR(50),
        regression_reason   TEXT,
        phase_snapshot      JSON NOT NULL,
        artifact_snapshot   JSON NOT NULL,
        created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE INDEX node_phase_revisions_node_idx
        ON node_phase_revisions(node_id)
    `).catch(() => {});

    // revision_label must be unique per node
    await conn.query(`
      CREATE UNIQUE INDEX node_phase_revisions_node_label_uniq
        ON node_phase_revisions(node_id, revision_label)
    `).catch(() => {});
  },
  down: async (conn) => {
    await conn.query(`DROP TABLE IF EXISTS node_phase_revisions`);
  }
};
