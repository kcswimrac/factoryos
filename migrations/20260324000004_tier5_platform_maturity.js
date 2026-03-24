/**
 * Tier 5: Platform maturity — change control, report generation,
 * timeline dependencies, notifications, calibration enforcement.
 */
module.exports = {
  name: 'tier5_platform_maturity',

  up: async (conn) => {
    // ── T5.1: Change control (ECR / ECN) ─────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS change_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        ecr_number VARCHAR(30) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        reason ENUM('design_improvement', 'cost_reduction', 'field_issue', 'supplier_change',
                     'regulatory', 'manufacturing', 'customer_request', 'other') DEFAULT 'design_improvement',
        priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
        status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'implemented', 'closed') DEFAULT 'draft',
        requested_by VARCHAR(255),
        assigned_to VARCHAR(255),
        affected_nodes JSON,
        affected_requirements JSON,
        impact_analysis TEXT,
        cost_impact TEXT,
        schedule_impact TEXT,
        risk_assessment TEXT,
        submitted_at TIMESTAMP NULL,
        approved_by VARCHAR(255),
        approved_at TIMESTAMP NULL,
        implemented_at TIMESTAMP NULL,
        closed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cr_project (project_id),
        INDEX idx_cr_status (status)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS change_request_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        change_request_id INT NOT NULL,
        author VARCHAR(255),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_crc_cr (change_request_id)
      )
    `);

    // Engineering Change Notice (approved ECR becomes ECN)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS change_notices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        change_request_id INT NOT NULL,
        ecn_number VARCHAR(30) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        effectivity_date DATE,
        disposition ENUM('rework', 'scrap', 'use_as_is', 'return_to_vendor') DEFAULT 'rework',
        implementation_steps JSON,
        verification_method TEXT,
        verified_by VARCHAR(255),
        verified_at TIMESTAMP NULL,
        status ENUM('pending', 'in_progress', 'verified', 'closed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cn_cr (change_request_id)
      )
    `);

    // ── T5.2: Report generation queue ────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS report_jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        report_type ENUM('traceability_matrix', 'phase_summary', 'gate_status',
                         'design_review_pack', 'bom_export', 'power_budget',
                         'test_summary', 'full_design_report') NOT NULL,
        title VARCHAR(255),
        config JSON,
        status ENUM('queued', 'generating', 'completed', 'failed') DEFAULT 'queued',
        result_data JSON,
        file_format ENUM('json', 'csv', 'html') DEFAULT 'json',
        generated_by VARCHAR(255),
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rj_project (project_id)
      )
    `);

    // ── T5.3: Timeline dependencies ──────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS timeline_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        item_type ENUM('milestone', 'task', 'phase', 'review', 'test', 'delivery') DEFAULT 'task',
        status ENUM('planned', 'in_progress', 'completed', 'blocked', 'cancelled') DEFAULT 'planned',
        assigned_to VARCHAR(255),
        start_date DATE,
        end_date DATE,
        actual_start DATE,
        actual_end DATE,
        percent_complete INT DEFAULT 0,
        node_id INT,
        phase_key VARCHAR(10),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ti_project (project_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS timeline_dependencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        predecessor_id INT NOT NULL,
        successor_id INT NOT NULL,
        dependency_type ENUM('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish') DEFAULT 'finish_to_start',
        lag_days INT DEFAULT 0,
        UNIQUE KEY uq_dep (predecessor_id, successor_id),
        INDEX idx_td_pred (predecessor_id),
        INDEX idx_td_succ (successor_id)
      )
    `);

    // ── T5.5: Notifications ──────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        user_email VARCHAR(255),
        event_type ENUM('gate_approved', 'gate_rejected', 'review_scheduled', 'finding_assigned',
                        'finding_overdue', 'ecr_submitted', 'ecn_issued', 'calibration_due',
                        'share_invite', 'sop_execution_complete', 'build_failed', 'custom') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        link_url TEXT,
        read_at TIMESTAMP NULL,
        delivered_via ENUM('in_app', 'email', 'webhook') DEFAULT 'in_app',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_n_user (user_email),
        INDEX idx_n_unread (user_email, read_at)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS webhook_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        event_type VARCHAR(50) NOT NULL,
        webhook_url TEXT NOT NULL,
        secret VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        last_triggered_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ws_project (project_id)
      )
    `);
  },

  down: async (conn) => {
    const tables = [
      'webhook_subscriptions', 'notifications',
      'timeline_dependencies', 'timeline_items',
      'report_jobs',
      'change_notices', 'change_request_comments', 'change_requests'
    ];
    for (const t of tables) {
      await conn.query(`DROP TABLE IF EXISTS ${t}`).catch(() => {});
    }
  }
};
