/**
 * Create DOE experiment tables for Factory-os frontend compatibility
 * These are the tables expected by the /api/experiments endpoints
 */
module.exports = {
  name: 'create_doe_experiments_tables',

  up: async (conn) => {
    // Main experiments table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_experiments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        design_type VARCHAR(50) DEFAULT 'full_factorial',
        user_id INT DEFAULT 1,
        project_id INT,
        status ENUM('active', 'analyzed', 'completed', 'archived') DEFAULT 'active',
        total_runs INT DEFAULT 0,
        completed_runs INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_doe_experiments_user (user_id)
      )
    `);

    // Factor library
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_factors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        unit VARCHAR(50),
        description TEXT,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Response library
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        unit VARCHAR(50),
        description TEXT,
        goal ENUM('maximize', 'minimize', 'target') DEFAULT 'maximize',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Experiment-factor mapping with levels
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_experiment_factors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id INT NOT NULL,
        factor_id INT NOT NULL,
        low_level DOUBLE,
        high_level DOUBLE,
        center_point DOUBLE,
        INDEX idx_doe_ef_experiment (experiment_id),
        UNIQUE KEY uq_exp_factor (experiment_id, factor_id)
      )
    `);

    // Experiment-response mapping
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_experiment_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id INT NOT NULL,
        response_id INT NOT NULL,
        goal ENUM('maximize', 'minimize', 'target') DEFAULT 'maximize',
        target_value DOUBLE,
        INDEX idx_doe_er_experiment (experiment_id),
        UNIQUE KEY uq_exp_response (experiment_id, response_id)
      )
    `);

    // Individual runs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id INT NOT NULL,
        run_number INT NOT NULL,
        run_type ENUM('standard', 'center_point') DEFAULT 'standard',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_doe_runs_experiment (experiment_id)
      )
    `);

    // Factor levels per run
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_run_factor_levels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        run_id INT NOT NULL,
        factor_id INT NOT NULL,
        level_value DOUBLE,
        level_coded VARCHAR(5),
        INDEX idx_doe_rfl_run (run_id)
      )
    `);

    // Measurements per run
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_run_measurements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        run_id INT NOT NULL,
        response_id INT NOT NULL,
        measured_value DOUBLE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_doe_rm_run (run_id),
        UNIQUE KEY uq_run_response (run_id, response_id)
      )
    `);

    // Analysis results
    await conn.query(`
      CREATE TABLE IF NOT EXISTS doe_analysis_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id INT NOT NULL,
        response_id INT,
        results_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_doe_ar_experiment (experiment_id)
      )
    `);

    // Seed default factors
    const defaultFactors = [
      ['Temperature', '°C', 'Process temperature', 'thermal'],
      ['Pressure', 'psi', 'Process pressure', 'mechanical'],
      ['Speed', 'rpm', 'Rotational speed', 'mechanical'],
      ['Time', 'min', 'Process duration', 'temporal'],
      ['Feed Rate', 'mm/min', 'Material feed rate', 'mechanical'],
      ['Concentration', '%', 'Chemical concentration', 'chemical'],
      ['Voltage', 'V', 'Applied voltage', 'electrical'],
      ['Current', 'A', 'Applied current', 'electrical']
    ];

    for (const [name, unit, desc, cat] of defaultFactors) {
      await conn.query(
        'INSERT IGNORE INTO doe_factors (name, unit, description, category) VALUES (?, ?, ?, ?)',
        [name, unit, desc, cat]
      ).catch(() => {});
    }

    // Seed default responses
    const defaultResponses = [
      ['Strength', 'MPa', 'Material strength', 'maximize'],
      ['Surface Finish', 'Ra', 'Surface roughness', 'minimize'],
      ['Cycle Time', 's', 'Production cycle time', 'minimize'],
      ['Yield', '%', 'Process yield', 'maximize'],
      ['Hardness', 'HRC', 'Material hardness', 'target'],
      ['Weight', 'g', 'Component weight', 'minimize'],
      ['Dimensional Accuracy', 'mm', 'Deviation from nominal', 'minimize'],
      ['Power Consumption', 'W', 'Energy usage', 'minimize']
    ];

    for (const [name, unit, desc, goal] of defaultResponses) {
      await conn.query(
        'INSERT IGNORE INTO doe_responses (name, unit, description, goal) VALUES (?, ?, ?, ?)',
        [name, unit, desc, goal]
      ).catch(() => {});
    }
  },

  down: async (conn) => {
    await conn.query('DROP TABLE IF EXISTS doe_analysis_results').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS doe_run_measurements').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS doe_run_factor_levels').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS doe_runs').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS doe_experiment_responses').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS doe_experiment_factors').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS doe_responses').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS doe_factors').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS doe_experiments').catch(() => {});
  }
};
