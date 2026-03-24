/**
 * Migration: Discovery Workspace — Phase 2
 *
 * Extends discovery_objects with functional_cluster for clustering UI.
 * Adds relationship graph tables and architecture proposal tables.
 *
 * discovery_relationships — typed edges between discovery objects
 *   source_object_id -> target_object_id with relationship_type + notes
 *
 * discovery_architectures — competing system architecture proposals
 *   pros / cons / risks / status (active | selected | killed) / kill_reason
 *
 * discovery_architecture_objects — M2M: architecture <-> discovery_objects
 */
module.exports = {
  name: 'discovery_phase2',
  up: async (conn) => {

    // ── 1. Add functional_cluster to discovery_objects ──────────────────────
    await conn.query(`
      ALTER TABLE discovery_objects
        ADD COLUMN functional_cluster VARCHAR(100)
    `).catch(() => {});

    await conn.query(`
      CREATE INDEX discovery_objects_cluster_idx
        ON discovery_objects(project_id, functional_cluster)
    `).catch(() => {});

    // ── 2. Relationship graph ────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS discovery_relationships (
        id                 INT AUTO_INCREMENT PRIMARY KEY,
        source_object_id   INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        target_object_id   INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        relationship_type  VARCHAR(50) NOT NULL,
        notes              TEXT,
        created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT discovery_relationships_unique UNIQUE (source_object_id, target_object_id, relationship_type)
      )
    `);

    await conn.query(`
      CREATE INDEX discovery_relationships_src_idx
        ON discovery_relationships(source_object_id)
    `).catch(() => {});
    await conn.query(`
      CREATE INDEX discovery_relationships_tgt_idx
        ON discovery_relationships(target_object_id)
    `).catch(() => {});

    // ── 3. Architecture proposals ────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS discovery_architectures (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name         VARCHAR(255) NOT NULL,
        description  TEXT,
        pros         TEXT,
        cons         TEXT,
        risks        TEXT,
        status       VARCHAR(20) NOT NULL DEFAULT 'active',
        kill_reason  TEXT,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE INDEX discovery_architectures_project_idx
        ON discovery_architectures(project_id)
    `).catch(() => {});

    // ── 4. Architecture <-> Object junction ────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS discovery_architecture_objects (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        architecture_id  INTEGER NOT NULL REFERENCES discovery_architectures(id) ON DELETE CASCADE,
        object_id        INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT discovery_arch_obj_unique UNIQUE (architecture_id, object_id)
      )
    `);

    await conn.query(`
      CREATE INDEX discovery_arch_obj_arch_idx
        ON discovery_architecture_objects(architecture_id)
    `).catch(() => {});
    await conn.query(`
      CREATE INDEX discovery_arch_obj_obj_idx
        ON discovery_architecture_objects(object_id)
    `).catch(() => {});
  },

  down: async (conn) => {
    await conn.query(`DROP TABLE IF EXISTS discovery_architecture_objects`);
    await conn.query(`DROP TABLE IF EXISTS discovery_architectures`);
    await conn.query(`DROP TABLE IF EXISTS discovery_relationships`);
    await conn.query(`
      ALTER TABLE discovery_objects DROP COLUMN functional_cluster
    `).catch(() => {});
  }
};
