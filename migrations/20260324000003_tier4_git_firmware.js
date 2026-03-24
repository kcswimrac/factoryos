/**
 * Tier 4: Git / Firmware domain support
 * - Git repository linking to project nodes
 * - Firmware module metadata (version, build, test coverage)
 * - Hardware-software interface tracking (pin maps, registers, protocols)
 * - Build/deploy tracking with HW-FW compatibility matrix
 * - Code review linking to requirement verification
 */
module.exports = {
  name: 'tier4_git_firmware_domain',

  up: async (conn) => {
    // ── T4.1: Git repository linking ─────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS git_repos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        node_id INT,
        repo_name VARCHAR(255) NOT NULL,
        repo_url TEXT NOT NULL,
        provider ENUM('github', 'gitlab', 'bitbucket', 'azure_devops', 'other') DEFAULT 'github',
        default_branch VARCHAR(100) DEFAULT 'main',
        description TEXT,
        language VARCHAR(50),
        last_commit_sha VARCHAR(64),
        last_commit_message TEXT,
        last_commit_author VARCHAR(255),
        last_commit_at TIMESTAMP NULL,
        webhook_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_gr_project (project_id),
        INDEX idx_gr_node (node_id)
      )
    `);

    // Commit history cache (populated via webhook or manual sync)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS git_commits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        repo_id INT NOT NULL,
        commit_sha VARCHAR(64) NOT NULL,
        message TEXT,
        author_name VARCHAR(255),
        author_email VARCHAR(255),
        committed_at TIMESTAMP,
        branch VARCHAR(255),
        files_changed INT DEFAULT 0,
        insertions INT DEFAULT 0,
        deletions INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_repo_sha (repo_id, commit_sha),
        INDEX idx_gc_repo (repo_id),
        INDEX idx_gc_date (committed_at)
      )
    `);

    // ── T4.2: Firmware module metadata ───────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS firmware_modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id INT NOT NULL,
        repo_id INT,
        module_name VARCHAR(255) NOT NULL,
        current_version VARCHAR(50),
        build_status ENUM('unknown', 'passing', 'failing', 'unstable') DEFAULT 'unknown',
        test_coverage_percent DECIMAL(5,2),
        language VARCHAR(50),
        compiler VARCHAR(100),
        target_platform VARCHAR(100),
        flash_size_kb INT,
        ram_usage_kb INT,
        entry_point VARCHAR(255),
        build_command TEXT,
        flash_command TEXT,
        notes TEXT,
        last_build_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_fm_node (node_id),
        INDEX idx_fm_repo (repo_id)
      )
    `);

    // ── T4.3: Hardware-software interface tracking ───────────────────────────
    // Pin maps: MCU pin → PCB net → connector → sensor/actuator
    await conn.query(`
      CREATE TABLE IF NOT EXISTS hw_sw_pin_maps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        fw_node_id INT,
        hw_node_id INT,
        mcu_pin VARCHAR(50) NOT NULL,
        pin_function ENUM('gpio_in', 'gpio_out', 'adc', 'dac', 'pwm', 'uart_tx', 'uart_rx',
                          'spi_mosi', 'spi_miso', 'spi_clk', 'spi_cs', 'i2c_sda', 'i2c_scl',
                          'can_tx', 'can_rx', 'usb_dp', 'usb_dm', 'jtag', 'power', 'ground',
                          'other') DEFAULT 'gpio_in',
        pcb_net_name VARCHAR(100),
        connector_ref VARCHAR(100),
        signal_name VARCHAR(255),
        voltage_level VARCHAR(20),
        direction ENUM('input', 'output', 'bidirectional', 'power') DEFAULT 'input',
        pull_config ENUM('none', 'pull_up', 'pull_down', 'open_drain') DEFAULT 'none',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pm_project (project_id),
        INDEX idx_pm_fw (fw_node_id),
        INDEX idx_pm_hw (hw_node_id)
      )
    `);

    // Register maps for peripherals and ICs
    await conn.query(`
      CREATE TABLE IF NOT EXISTS hw_sw_register_maps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id INT NOT NULL,
        peripheral_name VARCHAR(100) NOT NULL,
        register_name VARCHAR(100) NOT NULL,
        address VARCHAR(20) NOT NULL,
        width_bits INT DEFAULT 8,
        access ENUM('read', 'write', 'read_write', 'write_once') DEFAULT 'read_write',
        reset_value VARCHAR(20),
        description TEXT,
        bit_fields JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rm_node (node_id)
      )
    `);

    // Communication protocol interfaces
    await conn.query(`
      CREATE TABLE IF NOT EXISTS hw_sw_protocols (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        fw_node_id INT,
        hw_node_id INT,
        protocol ENUM('can', 'spi', 'i2c', 'uart', 'usb', 'ethernet', 'lin', 'modbus',
                       'mqtt', 'ble', 'wifi', 'custom') NOT NULL,
        bus_name VARCHAR(100),
        speed_hz INT,
        address VARCHAR(20),
        message_format JSON,
        timing_requirements JSON,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sp_project (project_id)
      )
    `);

    // ── T4.4: Build/deploy tracking ──────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS firmware_builds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        version VARCHAR(50) NOT NULL,
        commit_sha VARCHAR(64),
        build_status ENUM('queued', 'building', 'passed', 'failed') DEFAULT 'queued',
        test_results JSON,
        binary_size_bytes INT,
        build_log TEXT,
        built_at TIMESTAMP NULL,
        built_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fb_module (module_id)
      )
    `);

    // HW revision ↔ FW version compatibility matrix
    await conn.query(`
      CREATE TABLE IF NOT EXISTS hw_fw_compatibility (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        hw_revision VARCHAR(50) NOT NULL,
        hw_node_id INT,
        fw_version VARCHAR(50) NOT NULL,
        fw_module_id INT,
        compatibility ENUM('full', 'partial', 'incompatible', 'untested') DEFAULT 'untested',
        release_status ENUM('development', 'testing', 'released', 'deprecated') DEFAULT 'development',
        release_notes TEXT,
        released_at TIMESTAMP NULL,
        released_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_hw_fw (project_id, hw_revision, fw_version),
        INDEX idx_hfc_project (project_id)
      )
    `);

    // ── T4.5: Code review linking to requirements ────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS code_review_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        repo_id INT NOT NULL,
        requirement_id INT,
        pr_number INT,
        pr_url TEXT,
        pr_title VARCHAR(500),
        pr_status ENUM('open', 'merged', 'closed') DEFAULT 'open',
        commit_sha VARCHAR(64),
        review_status ENUM('pending', 'approved', 'changes_requested', 'dismissed') DEFAULT 'pending',
        reviewer VARCHAR(255),
        verification_type ENUM('implements', 'tests', 'fixes', 'documents') DEFAULT 'implements',
        notes TEXT,
        linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_crl_repo (repo_id),
        INDEX idx_crl_req (requirement_id)
      )
    `);
  },

  down: async (conn) => {
    const tables = [
      'code_review_links', 'hw_fw_compatibility', 'firmware_builds',
      'hw_sw_protocols', 'hw_sw_register_maps', 'hw_sw_pin_maps',
      'firmware_modules', 'git_commits', 'git_repos'
    ];
    for (const t of tables) {
      await conn.query(`DROP TABLE IF EXISTS ${t}`).catch(() => {});
    }
  }
};
