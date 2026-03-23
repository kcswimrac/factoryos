/**
 * Migration: Create requirements and requirement_traces tables
 *
 * Requirements attach to any node in the hierarchy.
 * Traces link requirements to phases/evidence for traceability.
 */
module.exports = {
  name: 'create_requirements_table',
  up: async (client) => {
    // Requirements table
    await client.query(`
      CREATE TABLE requirements (
        id           SERIAL PRIMARY KEY,
        node_id      INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        req_id       VARCHAR(50) NOT NULL UNIQUE,
        title        VARCHAR(500) NOT NULL,
        description  TEXT,
        verification_method VARCHAR(50) NOT NULL DEFAULT 'test',
        status       VARCHAR(50) NOT NULL DEFAULT 'open',
        priority     VARCHAR(20) NOT NULL DEFAULT 'shall',
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Traceability: link requirements to a phase + evidence
    await client.query(`
      CREATE TABLE requirement_traces (
        id             SERIAL PRIMARY KEY,
        requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
        phase          VARCHAR(100) NOT NULL,
        evidence       TEXT,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Indexes
    await client.query(`CREATE INDEX requirements_node_id_idx ON requirements(node_id)`);
    await client.query(`CREATE INDEX req_traces_requirement_id_idx ON requirement_traces(requirement_id)`);

    // Auto-sequence for req_id generation (global, ensures unique IDs across nodes)
    await client.query(`CREATE SEQUENCE IF NOT EXISTS req_id_seq START 1`);
  }
};
