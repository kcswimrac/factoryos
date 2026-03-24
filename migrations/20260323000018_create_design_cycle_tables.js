/**
 * Create design cycle (9-phase methodology) tables
 */
module.exports = {
  name: 'create_design_cycle_tables',

  up: async (conn) => {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_number VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        hierarchy_level ENUM('system', 'subsystem', 'component', 'part') DEFAULT 'component',
        status ENUM('active', 'completed', 'on_hold', 'cancelled') DEFAULT 'active',
        current_phase INT DEFAULT 1,
        overall_progress INT DEFAULT 0,
        owner VARCHAR(255),
        team_size INT DEFAULT 1,
        target_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_phases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        phase_number INT NOT NULL,
        phase_name VARCHAR(50) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
        progress_percentage INT DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_design_phases_project (project_id),
        UNIQUE KEY uq_project_phase (project_id, phase_number)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_phase_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phase_id INT NOT NULL,
        question_number INT NOT NULL,
        question_text TEXT NOT NULL,
        answer_status ENUM('unanswered', 'yes', 'no', 'na') DEFAULT 'unanswered',
        answer_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phase_questions_phase (phase_id),
        UNIQUE KEY uq_phase_question (phase_id, question_number)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_ai_chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        role ENUM('user', 'assistant', 'system') NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_design_chats_project (project_id)
      )
    `);
  },

  down: async (conn) => {
    await conn.query('DROP TABLE IF EXISTS design_ai_chats').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS design_phase_questions').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS design_phases').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS design_projects').catch(() => {});
  }
};
