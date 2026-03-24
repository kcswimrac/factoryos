/**
 * Migration: Create requirements and requirement_traces tables
 *
 * Requirements attach to any node in the hierarchy.
 * Traces link requirements to phases/evidence for traceability.
 */
module.exports = {
  name: 'create_requirements_table',
  up: async (conn) => {
    // Requirements table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS requirements (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        node_id      INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        req_id       VARCHAR(50) NOT NULL UNIQUE,
        title        VARCHAR(500) NOT NULL,
        description  TEXT,
        verification_method VARCHAR(50) NOT NULL DEFAULT 'test',
        status       VARCHAR(50) NOT NULL DEFAULT 'open',
        priority     VARCHAR(20) NOT NULL DEFAULT 'shall',
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Traceability: link requirements to a phase + evidence
    await conn.query(`
      CREATE TABLE IF NOT EXISTS requirement_traces (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
        phase          VARCHAR(100) NOT NULL,
        evidence       TEXT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes
    await conn.query(`CREATE INDEX requirements_node_id_idx ON requirements(node_id)`).catch(() => {});
    await conn.query(`CREATE INDEX req_traces_requirement_id_idx ON requirement_traces(requirement_id)`).catch(() => {});
  }
};
