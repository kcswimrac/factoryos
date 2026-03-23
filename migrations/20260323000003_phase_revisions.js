/**
 * Migration: Phase regression / revision model
 *
 * When a node's phase lifecycle regresses (a completed phase is re-opened),
 * the current state is frozen as a numbered revision (Rev A, Rev B, …).
 *
 * node_phase_revisions
 *   node_id               — the node that owns the phase lifecycle
 *   revision_label        — "Rev A", "Rev B", … auto-assigned
 *   triggered_by_phase    — which phase was re-opened to cause this freeze
 *   regression_reason     — optional free-text from the engineer
 *   phase_snapshot        — JSONB array of all 7 phases at freeze time
 *                           [{ phase, status, started_at, completed_at, notes }]
 *   artifact_snapshot     — JSONB map of phase → [artifacts] at freeze time
 *   created_at            — when the revision was created
 */
module.exports = {
  name: 'phase_revisions',
  up: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS node_phase_revisions (
        id                  SERIAL PRIMARY KEY,
        node_id             INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        revision_label      VARCHAR(20) NOT NULL,
        triggered_by_phase  VARCHAR(50),
        regression_reason   TEXT,
        phase_snapshot      JSONB NOT NULL DEFAULT '[]',
        artifact_snapshot   JSONB NOT NULL DEFAULT '{}',
        created_at          TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS node_phase_revisions_node_idx
        ON node_phase_revisions(node_id)
    `);

    // revision_label must be unique per node
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS node_phase_revisions_node_label_uniq
        ON node_phase_revisions(node_id, revision_label)
    `);
  },
  down: async (client) => {
    await client.query(`DROP TABLE IF EXISTS node_phase_revisions CASCADE`);
  }
};
