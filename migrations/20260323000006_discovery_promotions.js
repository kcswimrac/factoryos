/**
 * Migration: Discovery Workspace (Phase 3 promotion columns)
 *
 * The base discovery_objects and discovery_attachments tables were created by
 * the 20260323000005_discovery_workspace migration. This migration adds
 * the promotion-tracking columns to discovery_objects and creates the
 * discovery_promotions audit log table.
 */
module.exports = {
  name: '20260323000004_create_discovery_workspace',
  up: async (conn) => {
    // ── Add promotion columns to discovery_objects (try/catch = safe to re-run) ──
    await conn.query(`
      ALTER TABLE discovery_objects
        ADD COLUMN promoted_node_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL
    `).catch(() => {});

    await conn.query(`
      ALTER TABLE discovery_objects
        ADD COLUMN promoted_at TIMESTAMP NULL
    `).catch(() => {});

    await conn.query(`
      ALTER TABLE discovery_objects
        ADD COLUMN promoted_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    `).catch(() => {});

    // ── Promotions audit log ─────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS discovery_promotions (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        object_id    INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        node_id      INTEGER REFERENCES nodes(id) ON DELETE SET NULL,
        promoted_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
        snapshot     JSON NOT NULL,
        promoted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE INDEX discovery_promotions_object_idx
        ON discovery_promotions(object_id)
    `).catch(() => {});

    await conn.query(`
      CREATE INDEX discovery_promotions_node_idx
        ON discovery_promotions(node_id)
    `).catch(() => {});
  },

  down: async (conn) => {
    await conn.query(`DROP TABLE IF EXISTS discovery_promotions`);
    await conn.query(`ALTER TABLE discovery_objects DROP COLUMN promoted_by`).catch(() => {});
    await conn.query(`ALTER TABLE discovery_objects DROP COLUMN promoted_at`).catch(() => {});
    await conn.query(`ALTER TABLE discovery_objects DROP COLUMN promoted_node_id`).catch(() => {});
  }
};
