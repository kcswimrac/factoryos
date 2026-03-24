module.exports = {
  name: 'doe_phase1_extensions',
  up: async (conn) => {
    // ── doe_studies: new columns ─────────────────────────────────────────────
    await conn.query(`
      ALTER TABLE doe_studies
        ADD COLUMN hypothesis         TEXT
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_studies
        ADD COLUMN experiment_goal   VARCHAR(30)  DEFAULT 'screening'
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_studies
        ADD COLUMN design_type       VARCHAR(50)  DEFAULT 'manual'
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_studies
        ADD COLUMN resolution        VARCHAR(10)
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_studies
        ADD COLUMN randomize_runs    TINYINT(1)   DEFAULT 1
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_studies
        ADD COLUMN run_order_locked  TINYINT(1)   DEFAULT 0
    `).catch(() => {});

    // ── doe_factors: new columns ─────────────────────────────────────────────
    await conn.query(`
      ALTER TABLE doe_factors
        ADD COLUMN factor_type   VARCHAR(30)  DEFAULT 'discrete'
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_factors
        ADD COLUMN min_value     NUMERIC
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_factors
        ADD COLUMN max_value     NUMERIC
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_factors
        ADD COLUMN center_value  NUMERIC
    `).catch(() => {});

    // ── doe_runs: new columns ────────────────────────────────────────────────
    await conn.query(`
      ALTER TABLE doe_runs
        ADD COLUMN status       VARCHAR(30)   DEFAULT 'planned'
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_runs
        ADD COLUMN operator     VARCHAR(255)
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_runs
        ADD COLUMN started_at   TIMESTAMP NULL
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_runs
        ADD COLUMN completed_at TIMESTAMP NULL
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_runs
        ADD COLUMN sop_link     VARCHAR(500)
    `).catch(() => {});
    await conn.query(`
      ALTER TABLE doe_runs
        ADD COLUMN run_order    INTEGER
    `).catch(() => {});

    // Back-fill run_order = run_number for existing rows
    await conn.query(`
      UPDATE doe_runs SET run_order = run_number WHERE run_order IS NULL
    `);

    // ── doe_constraints ──────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_constraints (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        study_id        INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        description     TEXT,
        constraint_type VARCHAR(30) DEFAULT 'hard_limit',
        expression      TEXT,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE INDEX doe_constraints_study_idx ON doe_constraints(study_id)
    `).catch(() => {});

    // ── doe_decisions ────────────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_decisions (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        study_id          INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        decision          TEXT NOT NULL,
        rejected_options  JSON  DEFAULT (JSON_ARRAY()),
        confidence_level  VARCHAR(20) DEFAULT 'medium',
        affected_node_ids JSON  DEFAULT (JSON_ARRAY()),
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE UNIQUE INDEX doe_decisions_study_uniq ON doe_decisions(study_id)
    `).catch(() => {});
  },

  down: async (conn) => {
    await conn.query(`DROP TABLE IF EXISTS doe_decisions`);
    await conn.query(`DROP TABLE IF EXISTS doe_constraints`);

    await conn.query(`ALTER TABLE doe_runs DROP COLUMN run_order`).catch(() => {});
    await conn.query(`ALTER TABLE doe_runs DROP COLUMN sop_link`).catch(() => {});
    await conn.query(`ALTER TABLE doe_runs DROP COLUMN completed_at`).catch(() => {});
    await conn.query(`ALTER TABLE doe_runs DROP COLUMN started_at`).catch(() => {});
    await conn.query(`ALTER TABLE doe_runs DROP COLUMN operator`).catch(() => {});
    await conn.query(`ALTER TABLE doe_runs DROP COLUMN status`).catch(() => {});

    await conn.query(`ALTER TABLE doe_factors DROP COLUMN center_value`).catch(() => {});
    await conn.query(`ALTER TABLE doe_factors DROP COLUMN max_value`).catch(() => {});
    await conn.query(`ALTER TABLE doe_factors DROP COLUMN min_value`).catch(() => {});
    await conn.query(`ALTER TABLE doe_factors DROP COLUMN factor_type`).catch(() => {});

    await conn.query(`ALTER TABLE doe_studies DROP COLUMN run_order_locked`).catch(() => {});
    await conn.query(`ALTER TABLE doe_studies DROP COLUMN randomize_runs`).catch(() => {});
    await conn.query(`ALTER TABLE doe_studies DROP COLUMN resolution`).catch(() => {});
    await conn.query(`ALTER TABLE doe_studies DROP COLUMN design_type`).catch(() => {});
    await conn.query(`ALTER TABLE doe_studies DROP COLUMN experiment_goal`).catch(() => {});
    await conn.query(`ALTER TABLE doe_studies DROP COLUMN hypothesis`).catch(() => {});
  }
};
