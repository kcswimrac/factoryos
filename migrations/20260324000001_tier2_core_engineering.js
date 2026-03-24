/**
 * Tier 2: Phase gate enforcement, traceability matrix, design reviews,
 * trade study scoring, and SOP execution tracking tables.
 */
module.exports = {
  name: 'tier2_core_engineering_value',

  up: async (conn) => {
    // ── T2.1: Phase gate enforcement ─────────────────────────────────────────
    // Tracks gate status per phase — gates must be approved before phase completion
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_phase_gates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        phase_key VARCHAR(10) NOT NULL,
        gate_type VARCHAR(50) NOT NULL,
        gate_name VARCHAR(100) NOT NULL,
        owner_role VARCHAR(100),
        status ENUM('not_required', 'pending', 'approved', 'rejected', 'waived') DEFAULT 'pending',
        approved_by VARCHAR(255),
        approved_at TIMESTAMP NULL,
        rejection_reason TEXT,
        waiver_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_project_phase_gate (project_id, phase_key, gate_type),
        INDEX idx_dpg_project (project_id)
      )
    `);

    // ── T2.3: Design review workflow ─────────────────────────────────────────
    // Formal design reviews (SRR, SDR, PDR, CDR, TRR) with findings/actions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        review_type ENUM('SRR', 'SDR', 'PDR', 'CDR', 'TRR', 'OTHER') NOT NULL,
        review_name VARCHAR(255) NOT NULL,
        description TEXT,
        phase_key VARCHAR(10),
        status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
        scheduled_date DATE,
        completed_date DATE,
        chairperson VARCHAR(255),
        attendees JSON,
        outcome ENUM('pass', 'pass_with_actions', 'fail', 'deferred') NULL,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dr_project (project_id)
      )
    `);

    // Design review findings / action items
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_review_findings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        review_id INT NOT NULL,
        finding_number INT NOT NULL,
        severity ENUM('critical', 'major', 'minor', 'observation') DEFAULT 'minor',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to VARCHAR(255),
        due_date DATE,
        status ENUM('open', 'in_progress', 'resolved', 'verified', 'closed', 'waived') DEFAULT 'open',
        resolution TEXT,
        resolved_at TIMESTAMP NULL,
        verified_by VARCHAR(255),
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_drf_review (review_id)
      )
    `);

    // ── T2.4: Trade study scoring ────────────────────────────────────────────
    // Pugh matrix / weighted scoring for discovery trade studies
    await conn.query(`
      CREATE TABLE IF NOT EXISTS trade_study_criteria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discovery_object_id INT NOT NULL,
        criterion_name VARCHAR(255) NOT NULL,
        weight DECIMAL(5,2) DEFAULT 1.0,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tsc_object (discovery_object_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS trade_study_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discovery_object_id INT NOT NULL,
        option_name VARCHAR(255) NOT NULL,
        description TEXT,
        is_baseline BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tso_object (discovery_object_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS trade_study_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discovery_object_id INT NOT NULL,
        criterion_id INT NOT NULL,
        option_id INT NOT NULL,
        score INT DEFAULT 0,
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_criterion_option (criterion_id, option_id),
        INDEX idx_tss_object (discovery_object_id)
      )
    `);

    // ── T2.5: SOP execution tracking ─────────────────────────────────────────
    // Track SOP execution sessions with per-step sign-off
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sop_executions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sop_id INT NOT NULL,
        started_by VARCHAR(255),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        status ENUM('in_progress', 'completed', 'aborted') DEFAULT 'in_progress',
        notes TEXT,
        INDEX idx_se_sop (sop_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS sop_execution_steps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        execution_id INT NOT NULL,
        step_id INT NOT NULL,
        step_order INT NOT NULL,
        status ENUM('pending', 'completed', 'skipped', 'failed') DEFAULT 'pending',
        completed_by VARCHAR(255),
        completed_at TIMESTAMP NULL,
        sign_off_notes TEXT,
        INDEX idx_ses_execution (execution_id)
      )
    `);
  },

  down: async (conn) => {
    const tables = [
      'sop_execution_steps', 'sop_executions',
      'trade_study_scores', 'trade_study_options', 'trade_study_criteria',
      'design_review_findings', 'design_reviews',
      'design_phase_gates'
    ];
    for (const t of tables) {
      await conn.query(`DROP TABLE IF EXISTS ${t}`).catch(() => {});
    }
  }
};
