module.exports = {
  name: '20260323000017_create_sop_tables',
  up: async (client) => {
    // SOPs table — linked_nodes is a JSONB array of node IDs
    await client.query(`
      CREATE TABLE IF NOT EXISTS sops (
        id            SERIAL PRIMARY KEY,
        project_id    INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        title         VARCHAR(255) NOT NULL,
        description   TEXT DEFAULT '',
        version       VARCHAR(50)  DEFAULT '1.0',
        revision      VARCHAR(50)  DEFAULT 'A',
        status        VARCHAR(20)  DEFAULT 'draft'
                        CHECK (status IN ('draft', 'active', 'archived')),
        linked_nodes  JSONB        DEFAULT '[]',
        created_at    TIMESTAMPTZ  DEFAULT NOW(),
        updated_at    TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // SOP steps — tools, hazards, images stored as JSONB arrays inline
    await client.query(`
      CREATE TABLE IF NOT EXISTS sop_steps (
        id          SERIAL PRIMARY KEY,
        sop_id      INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
        step_order  INTEGER NOT NULL DEFAULT 1,
        title       VARCHAR(255) DEFAULT '',
        description TEXT         DEFAULT '',
        tools       JSONB        DEFAULT '[]',
        hazards     JSONB        DEFAULT '[]',
        images      JSONB        DEFAULT '[]',
        created_at  TIMESTAMPTZ  DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  DEFAULT NOW()
      )
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS sops_project_id_idx     ON sops(project_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS sops_linked_nodes_gin   ON sops USING GIN(linked_nodes)`);
    await client.query(`CREATE INDEX IF NOT EXISTS sop_steps_sop_id_idx    ON sop_steps(sop_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS sop_steps_order_idx     ON sop_steps(sop_id, step_order)`);
  },
  down: async (client) => {
    await client.query(`DROP TABLE IF EXISTS sop_steps`);
    await client.query(`DROP TABLE IF EXISTS sops`);
  }
};
