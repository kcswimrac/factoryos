module.exports = {
  name: 'create_doe_tables',
  up: async (client) => {
    // DOE Studies — the main study record
    await client.query(`
      CREATE TABLE IF NOT EXISTS doe_studies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        objective TEXT,
        node_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'active',
        conclusions TEXT,
        recommended_settings TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // DOE Factors — input variables with discrete levels
    await client.query(`
      CREATE TABLE IF NOT EXISTS doe_factors (
        id SERIAL PRIMARY KEY,
        study_id INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(100),
        levels JSONB DEFAULT '[]',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // DOE Responses — output / measured variables
    await client.query(`
      CREATE TABLE IF NOT EXISTS doe_responses (
        id SERIAL PRIMARY KEY,
        study_id INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(100),
        target VARCHAR(50) DEFAULT 'maximize',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // DOE Runs — rows in the test matrix
    await client.query(`
      CREATE TABLE IF NOT EXISTS doe_runs (
        id SERIAL PRIMARY KEY,
        study_id INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        run_number INTEGER NOT NULL,
        factor_settings JSONB DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(study_id, run_number)
      )
    `);

    // DOE Run Results — measured values per run per response
    await client.query(`
      CREATE TABLE IF NOT EXISTS doe_run_results (
        id SERIAL PRIMARY KEY,
        run_id INTEGER NOT NULL REFERENCES doe_runs(id) ON DELETE CASCADE,
        response_id INTEGER NOT NULL REFERENCES doe_responses(id) ON DELETE CASCADE,
        value NUMERIC,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(run_id, response_id)
      )
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS doe_factors_study_idx ON doe_factors(study_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS doe_responses_study_idx ON doe_responses(study_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS doe_runs_study_idx ON doe_runs(study_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS doe_run_results_run_idx ON doe_run_results(run_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS doe_studies_node_idx ON doe_studies(node_id)`);
  },

  down: async (client) => {
    await client.query(`DROP TABLE IF EXISTS doe_run_results CASCADE`);
    await client.query(`DROP TABLE IF EXISTS doe_runs CASCADE`);
    await client.query(`DROP TABLE IF EXISTS doe_responses CASCADE`);
    await client.query(`DROP TABLE IF EXISTS doe_factors CASCADE`);
    await client.query(`DROP TABLE IF EXISTS doe_studies CASCADE`);
  }
};
