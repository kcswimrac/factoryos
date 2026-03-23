/**
 * Migration: Discovery Workspace (Phase 3 promotion columns)
 *
 * The base discovery_objects and discovery_attachments tables were created by
 * the 20260323000005_discovery_workspace migration. This migration adds
 * the promotion-tracking columns to discovery_objects and creates the
 * discovery_promotions audit log table.
 *
 * NOTE: Uses raw SQL (client.query) — NOT the pgm API.
 * The migrate.js runner passes a raw pg client, not a node-pg-migrate pgm object.
 */
module.exports = {
  name: '20260323000004_create_discovery_workspace',
  up: async (client) => {
    // ── Add promotion columns to discovery_objects (IF NOT EXISTS = safe to re-run) ──
    await client.query(`
      ALTER TABLE discovery_objects
        ADD COLUMN IF NOT EXISTS promoted_node_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL
    `);

    await client.query(`
      ALTER TABLE discovery_objects
        ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMP
    `);

    await client.query(`
      ALTER TABLE discovery_objects
        ADD COLUMN IF NOT EXISTS promoted_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    `);

    // ── Promotions audit log ─────────────────────────────────────────────────
    // Separate table for promotion history.
    // discovery_objects stores current promoted_node_id inline;
    // this table keeps the full audit trail with snapshot at time of promotion.
    await client.query(`
      CREATE TABLE IF NOT EXISTS discovery_promotions (
        id           SERIAL PRIMARY KEY,
        object_id    INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        node_id      INTEGER REFERENCES nodes(id) ON DELETE SET NULL,
        promoted_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
        snapshot     JSONB NOT NULL DEFAULT '{}',
        promoted_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS discovery_promotions_object_idx
        ON discovery_promotions(object_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS discovery_promotions_node_idx
        ON discovery_promotions(node_id)
    `);
  },

  down: async (client) => {
    await client.query(`DROP TABLE IF EXISTS discovery_promotions`);
    await client.query(`ALTER TABLE discovery_objects DROP COLUMN IF EXISTS promoted_by`);
    await client.query(`ALTER TABLE discovery_objects DROP COLUMN IF EXISTS promoted_at`);
    await client.query(`ALTER TABLE discovery_objects DROP COLUMN IF EXISTS promoted_node_id`);
  }
};
