module.exports = {
  name: 'create_doe_tables',
  up: async (conn) => {
    // DOE Studies — the main study record
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_studies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        objective TEXT,
        node_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'active',
        conclusions TEXT,
        recommended_settings TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // DOE Factors — input variables with discrete levels
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_factors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        study_id INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(100),
        levels JSON DEFAULT (JSON_ARRAY()),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // DOE Responses — output / measured variables
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        study_id INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(100),
        target VARCHAR(50) DEFAULT 'maximize',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // DOE Runs — rows in the test matrix
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        study_id INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        run_number INTEGER NOT NULL,
        factor_settings JSON DEFAULT (JSON_OBJECT()),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(study_id, run_number)
      )
    `);

    // DOE Run Results — measured values per run per response
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_run_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        run_id INTEGER NOT NULL REFERENCES doe_runs(id) ON DELETE CASCADE,
        response_id INTEGER NOT NULL REFERENCES doe_responses(id) ON DELETE CASCADE,
        value NUMERIC,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(run_id, response_id)
      )
    `);

    // Indexes
    await conn.query(`CREATE INDEX doe_factors_study_idx ON doe_factors(study_id)`).catch(() => {});
    await conn.query(`CREATE INDEX doe_responses_study_idx ON doe_responses(study_id)`).catch(() => {});
    await conn.query(`CREATE INDEX doe_runs_study_idx ON doe_runs(study_id)`).catch(() => {});
    await conn.query(`CREATE INDEX doe_run_results_run_idx ON doe_run_results(run_id)`).catch(() => {});
    await conn.query(`CREATE INDEX doe_studies_node_idx ON doe_studies(node_id)`).catch(() => {});
  },

  down: async (conn) => {
    await conn.query(`DROP TABLE IF EXISTS doe_run_results CASCADE`);
    await conn.query(`DROP TABLE IF EXISTS doe_runs CASCADE`);
    await conn.query(`DROP TABLE IF EXISTS doe_responses CASCADE`);
    await conn.query(`DROP TABLE IF EXISTS doe_factors CASCADE`);
    await conn.query(`DROP TABLE IF EXISTS doe_studies CASCADE`);
  }
};
