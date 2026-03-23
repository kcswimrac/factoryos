module.exports = {
  name: 'doe_phase1_extensions',
  up: async (client) => {
    // ── doe_studies: new columns ─────────────────────────────────────────────
    await client.query(`
      ALTER TABLE doe_studies
        ADD COLUMN IF NOT EXISTS hypothesis         TEXT,
        ADD COLUMN IF NOT EXISTS experiment_goal   VARCHAR(30)  DEFAULT 'screening',
        ADD COLUMN IF NOT EXISTS design_type       VARCHAR(50)  DEFAULT 'manual',
        ADD COLUMN IF NOT EXISTS resolution        VARCHAR(10),
        ADD COLUMN IF NOT EXISTS randomize_runs    BOOLEAN      DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS run_order_locked  BOOLEAN      DEFAULT FALSE
    `);

    // ── doe_factors: new columns ─────────────────────────────────────────────
    await client.query(`
      ALTER TABLE doe_factors
        ADD COLUMN IF NOT EXISTS factor_type   VARCHAR(30)  DEFAULT 'discrete',
        ADD COLUMN IF NOT EXISTS min_value     NUMERIC,
        ADD COLUMN IF NOT EXISTS max_value     NUMERIC,
        ADD COLUMN IF NOT EXISTS center_value  NUMERIC
    `);

    // ── doe_runs: new columns ────────────────────────────────────────────────
    await client.query(`
      ALTER TABLE doe_runs
        ADD COLUMN IF NOT EXISTS status       VARCHAR(30)   DEFAULT 'planned',
        ADD COLUMN IF NOT EXISTS operator     VARCHAR(255),
        ADD COLUMN IF NOT EXISTS started_at   TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS sop_link     VARCHAR(500),
        ADD COLUMN IF NOT EXISTS run_order    INTEGER
    `);

    // Back-fill run_order = run_number for existing rows
    await client.query(`
      UPDATE doe_runs SET run_order = run_number WHERE run_order IS NULL
    `);

    // ── doe_constraints ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS doe_constraints (
        id              SERIAL PRIMARY KEY,
        study_id        INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        description     TEXT,
        constraint_type VARCHAR(30) DEFAULT 'hard_limit',
        expression      TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS doe_constraints_study_idx ON doe_constraints(study_id)
    `);

    // ── doe_decisions ────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS doe_decisions (
        id                SERIAL PRIMARY KEY,
        study_id          INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        decision          TEXT NOT NULL,
        rejected_options  JSONB  DEFAULT '[]',
        confidence_level  VARCHAR(20) DEFAULT 'medium',
        affected_node_ids JSONB  DEFAULT '[]',
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS doe_decisions_study_uniq ON doe_decisions(study_id)
    `);
  },

  down: async (client) => {
    await client.query(`DROP TABLE IF EXISTS doe_decisions CASCADE`);
    await client.query(`DROP TABLE IF EXISTS doe_constraints CASCADE`);

    await client.query(`
      ALTER TABLE doe_runs
        DROP COLUMN IF EXISTS run_order,
        DROP COLUMN IF EXISTS sop_link,
        DROP COLUMN IF EXISTS completed_at,
        DROP COLUMN IF EXISTS started_at,
        DROP COLUMN IF EXISTS operator,
        DROP COLUMN IF EXISTS status
    `);

    await client.query(`
      ALTER TABLE doe_factors
        DROP COLUMN IF EXISTS center_value,
        DROP COLUMN IF EXISTS max_value,
        DROP COLUMN IF EXISTS min_value,
        DROP COLUMN IF EXISTS factor_type
    `);

    await client.query(`
      ALTER TABLE doe_studies
        DROP COLUMN IF EXISTS run_order_locked,
        DROP COLUMN IF EXISTS randomize_runs,
        DROP COLUMN IF EXISTS resolution,
        DROP COLUMN IF EXISTS design_type,
        DROP COLUMN IF EXISTS experiment_goal,
        DROP COLUMN IF EXISTS hypothesis
    `);
  }
};
