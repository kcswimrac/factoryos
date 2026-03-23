module.exports = {
  name: '20260323000017_create_sop_tables',
  up: async (conn) => {
    // SOPs table — linked_nodes is a JSON array of node IDs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sops (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        project_id    INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        title         VARCHAR(255) NOT NULL,
        description   TEXT,
        version       VARCHAR(50)  DEFAULT '1.0',
        revision      VARCHAR(50)  DEFAULT 'A',
        status        VARCHAR(20)  DEFAULT 'draft'
                        CHECK (status IN ('draft', 'active', 'archived')),
        linked_nodes  JSON,
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // SOP steps — tools, hazards, images stored as JSON arrays inline
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sop_steps (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        sop_id      INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
        step_order  INTEGER NOT NULL DEFAULT 1,
        title       VARCHAR(255),
        description TEXT,
        tools       JSON,
        hazards     JSON,
        images      JSON,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Indexes
    await conn.query(`CREATE INDEX sops_project_id_idx     ON sops(project_id)`).catch(() => {});
    // MySQL doesn't support GIN indexes — skip for JSON columns
    await conn.query(`CREATE INDEX sop_steps_sop_id_idx    ON sop_steps(sop_id)`).catch(() => {});
    await conn.query(`CREATE INDEX sop_steps_order_idx     ON sop_steps(sop_id, step_order)`).catch(() => {});
  },
  down: async (conn) => {
    await conn.query(`DROP TABLE IF EXISTS sop_steps`);
    await conn.query(`DROP TABLE IF EXISTS sops`);
  }
};
