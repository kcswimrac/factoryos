/**
 * Migration: Discovery Workspace
 *
 * discovery_objects — lightweight pre-architecture idea cards
 *   id          — PK
 *   project_id  — FK → projects (CASCADE)
 *   title       — required (only field needed at creation time)
 *   description — freeform notes
 *   type        — concept | mechanism | candidate_part | experiment |
 *                  observation | trade_study | interface_hypothesis | functional_chunk
 *   maturity    — raw | repeatable | promotable | formal   (default: raw)
 *   confidence  — low | medium | high                      (default: low)
 *   tags        — JSONB array of string labels
 *   created_at / updated_at
 *   created_by  — FK → users (SET NULL on delete)
 *
 * discovery_attachments — files/images pinned to an object
 *   id         — PK
 *   object_id  — FK → discovery_objects (CASCADE)
 *   url        — public URL (R2 or other)
 *   label      — optional human-readable name
 *   created_at
 */
module.exports = {
  name: 'discovery_workspace',
  up: async (client) => {
    // ── discovery_objects ───────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS discovery_objects (
        id           SERIAL PRIMARY KEY,
        project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title        VARCHAR(500) NOT NULL,
        description  TEXT,
        type         VARCHAR(50)  NOT NULL DEFAULT 'concept',
        maturity     VARCHAR(20)  NOT NULL DEFAULT 'raw',
        confidence   VARCHAR(20)  NOT NULL DEFAULT 'low',
        tags         JSONB        NOT NULL DEFAULT '[]',
        created_at   TIMESTAMPTZ  DEFAULT NOW(),
        updated_at   TIMESTAMPTZ  DEFAULT NOW(),
        created_by   INTEGER      REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS discovery_objects_project_idx
        ON discovery_objects(project_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS discovery_objects_type_idx
        ON discovery_objects(project_id, type)
    `);

    // ── discovery_attachments ───────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS discovery_attachments (
        id         SERIAL PRIMARY KEY,
        object_id  INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        url        TEXT NOT NULL,
        label      VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS discovery_attachments_object_idx
        ON discovery_attachments(object_id)
    `);
  },
  down: async (client) => {
    await client.query(`DROP TABLE IF EXISTS discovery_attachments CASCADE`);
    await client.query(`DROP TABLE IF EXISTS discovery_objects CASCADE`);
  }
};
