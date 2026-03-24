/**
 * Expand design cycle tables — requirements, gates, interfaces, revisions,
 * learning loops, documents, AI scores, project nodes, reports
 */
module.exports = {
  name: 'expand_design_cycle_tables',

  up: async (conn) => {
    // Requirements per project
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_requirements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        node_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('performance', 'functional', 'constraint', 'interface', 'safety') DEFAULT 'performance',
        priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
        status ENUM('draft', 'active', 'verified', 'deferred') DEFAULT 'draft',
        target_value VARCHAR(100),
        unit VARCHAR(50),
        verification_method VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dr_project (project_id)
      )
    `);

    // Requirement traces (links between requirements and phases/tests)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_requirement_traces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        requirement_id INT NOT NULL,
        trace_type ENUM('phase', 'test', 'analysis', 'document') NOT NULL,
        trace_target_id INT,
        trace_target_name VARCHAR(255),
        status ENUM('pending', 'satisfied', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_drt_req (requirement_id)
      )
    `);

    // Gate approvals
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_gates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        gate_key VARCHAR(50) NOT NULL,
        gate_name VARCHAR(100) NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'reset') DEFAULT 'pending',
        approved_by VARCHAR(255),
        approved_at TIMESTAMP NULL,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_project_gate (project_id, gate_key)
      )
    `);

    // Gate comments
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_gate_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gate_id INT NOT NULL,
        author VARCHAR(255),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dgc_gate (gate_id)
      )
    `);

    // Interfaces
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_interfaces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        interface_key VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        description TEXT,
        type VARCHAR(50),
        status ENUM('defined', 'approved', 'rejected') DEFAULT 'defined',
        source_node_id INT,
        target_node_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_project_interface (project_id, interface_key)
      )
    `);

    // AI Score history
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_ai_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        overall_score DECIMAL(5,2),
        phase_scores JSON,
        recommendations JSON,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_das_project (project_id)
      )
    `);

    // Revisions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_revisions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        revision_number VARCHAR(20) NOT NULL,
        title VARCHAR(255),
        description TEXT,
        lifecycle ENUM('draft', 'review', 'released', 'obsolete') DEFAULT 'draft',
        changed_by VARCHAR(255),
        snapshot_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_drev_project (project_id)
      )
    `);

    // Learning loops
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_learning_loops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        source_phase INT,
        target_phase INT,
        status ENUM('open', 'in_progress', 'completed') DEFAULT 'open',
        outcome TEXT,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dll_project (project_id)
      )
    `);

    // Documents/artifacts
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        phase_key VARCHAR(10),
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size INT,
        file_url TEXT,
        metadata JSON,
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dd_project (project_id)
      )
    `);

    // Project hierarchy nodes
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_nodes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        parent_id INT,
        name VARCHAR(255) NOT NULL,
        node_type ENUM('system', 'subsystem', 'component', 'part', 'assembly') DEFAULT 'component',
        description TEXT,
        status ENUM('active', 'completed', 'archived') DEFAULT 'active',
        sort_order INT DEFAULT 0,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dn_project (project_id),
        INDEX idx_dn_parent (parent_id)
      )
    `);

    // Reports
    await conn.query(`
      CREATE TABLE IF NOT EXISTS design_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        node_id INT,
        report_type VARCHAR(50) DEFAULT 'standard',
        title VARCHAR(255),
        status ENUM('queued', 'generating', 'completed', 'failed') DEFAULT 'queued',
        config_json JSON,
        result_json JSON,
        artifact_index JSON,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        INDEX idx_drep_project (project_id)
      )
    `);

    // Seed default gates for each phase transition
    // (gates are created per-project, not globally)
  },

  down: async (conn) => {
    const tables = [
      'design_reports', 'design_nodes', 'design_documents',
      'design_learning_loops', 'design_revisions', 'design_ai_scores',
      'design_interfaces', 'design_gate_comments', 'design_gates',
      'design_requirement_traces', 'design_requirements'
    ];
    for (const t of tables) {
      await conn.query(`DROP TABLE IF EXISTS ${t}`).catch(() => {});
    }
  }
};
