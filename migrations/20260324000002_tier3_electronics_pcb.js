/**
 * Tier 3: Electronics / PCB domain support
 * - New node types for electronics (PCB, SCHEMATIC, HARNESS, SENSOR, FIRMWARE, CONNECTOR)
 * - Electronics properties table (voltage, current, power, thermal)
 * - EDA tool linking (KiCad, Altium, Eagle, EasyEDA)
 * - Component selection tracking (lifecycle, compliance, alternates)
 * - Power budget tracking (rails, consumers, margins)
 * - Electronics-specific gate types
 */
module.exports = {
  name: 'tier3_electronics_pcb_domain',

  up: async (conn) => {
    // ── T3.1: Expand node types ENUM to include electronics ──────────────────
    // MySQL ALTER ENUM by redefining the column
    await conn.query(`
      ALTER TABLE nodes MODIFY COLUMN type
        ENUM('ASSY','SYS','SUBSYS','SUBASSY','COMP','PURCH','DOC',
             'PCB','SCHEMATIC','HARNESS','SENSOR','FIRMWARE','CONNECTOR')
        NOT NULL
    `).catch(() => {});

    // Electronics-specific properties per node
    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_electronics_props (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id INT NOT NULL UNIQUE,
        domain ENUM('electrical', 'firmware', 'mechanical', 'mixed') DEFAULT 'electrical',
        voltage_rating VARCHAR(50),
        current_rating VARCHAR(50),
        power_rating VARCHAR(50),
        impedance VARCHAR(50),
        frequency_range VARCHAR(100),
        operating_temp_min DECIMAL(6,2),
        operating_temp_max DECIMAL(6,2),
        package_type VARCHAR(100),
        pin_count INT,
        rohs_compliant BOOLEAN DEFAULT TRUE,
        reach_compliant BOOLEAN,
        lead_free BOOLEAN DEFAULT TRUE,
        esd_sensitivity VARCHAR(50),
        thermal_resistance VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nep_node (node_id)
      )
    `);

    // ── T3.2: EDA tool linking ───────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS node_eda_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id INT NOT NULL,
        eda_tool ENUM('kicad', 'altium', 'eagle', 'easyeda', 'orcad', 'cadence', 'other') NOT NULL,
        project_url TEXT,
        schematic_url TEXT,
        pcb_layout_url TEXT,
        bom_url TEXT,
        gerber_url TEXT,
        repo_url TEXT,
        branch VARCHAR(255),
        last_sync_at TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nel_node (node_id)
      )
    `);

    // BOM entries imported from EDA tools
    await conn.query(`
      CREATE TABLE IF NOT EXISTS eda_bom_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eda_link_id INT NOT NULL,
        node_id INT NOT NULL,
        reference_designator VARCHAR(50),
        component_value VARCHAR(100),
        footprint VARCHAR(100),
        manufacturer VARCHAR(255),
        manufacturer_pn VARCHAR(255),
        distributor VARCHAR(100),
        distributor_pn VARCHAR(255),
        quantity INT DEFAULT 1,
        description TEXT,
        lifecycle_status ENUM('active', 'nrnd', 'obsolete', 'eol', 'unknown') DEFAULT 'unknown',
        last_checked_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ebb_link (eda_link_id),
        INDEX idx_ebb_node (node_id)
      )
    `);

    // ── T3.3: Component selection tracking ───────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS component_selections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id INT NOT NULL,
        selected_pn VARCHAR(255) NOT NULL,
        manufacturer VARCHAR(255),
        description TEXT,
        category VARCHAR(100),
        lifecycle_status ENUM('active', 'nrnd', 'obsolete', 'eol', 'unknown') DEFAULT 'active',
        datasheet_url TEXT,
        unit_price DECIMAL(12,4),
        moq INT,
        lead_time_days INT,
        stock_available INT,
        last_price_check TIMESTAMP NULL,
        derating_verified BOOLEAN DEFAULT FALSE,
        derating_notes TEXT,
        thermal_verified BOOLEAN DEFAULT FALSE,
        thermal_margin_percent DECIMAL(5,2),
        selection_rationale TEXT,
        status ENUM('candidate', 'selected', 'approved', 'rejected', 'obsolete') DEFAULT 'candidate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cs_node (node_id)
      )
    `);

    // Alternate/second-source components
    await conn.query(`
      CREATE TABLE IF NOT EXISTS component_alternates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        selection_id INT NOT NULL,
        alternate_pn VARCHAR(255) NOT NULL,
        manufacturer VARCHAR(255),
        compatibility ENUM('drop_in', 'form_fit', 'functional', 'partial') DEFAULT 'functional',
        notes TEXT,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ca_selection (selection_id)
      )
    `);

    // ── T3.4: Power budget tracking ──────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS power_rails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        node_id INT,
        rail_name VARCHAR(100) NOT NULL,
        nominal_voltage DECIMAL(8,3) NOT NULL,
        voltage_tolerance_percent DECIMAL(5,2) DEFAULT 5.0,
        max_current DECIMAL(8,3),
        source_type ENUM('regulator', 'converter', 'battery', 'external', 'other') DEFAULT 'regulator',
        source_component VARCHAR(255),
        efficiency_percent DECIMAL(5,2) DEFAULT 85.0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pr_project (project_id),
        INDEX idx_pr_node (node_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS power_consumers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rail_id INT NOT NULL,
        node_id INT,
        consumer_name VARCHAR(255) NOT NULL,
        typical_current_ma DECIMAL(10,3),
        peak_current_ma DECIMAL(10,3),
        duty_cycle_percent DECIMAL(5,2) DEFAULT 100.0,
        operating_mode VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pc_rail (rail_id)
      )
    `);

    // ── T3.5: Electronics-specific gate types ────────────────────────────────
    // Add to design_phase_gates — no new table needed, just more gate_type values.
    // The gate types are defined in code (routes/design-cycle.js GATE_TYPES).
  },

  down: async (conn) => {
    const tables = [
      'power_consumers', 'power_rails',
      'component_alternates', 'component_selections',
      'eda_bom_entries', 'node_eda_links',
      'node_electronics_props'
    ];
    for (const t of tables) {
      await conn.query(`DROP TABLE IF EXISTS ${t}`).catch(() => {});
    }
    // Revert ENUM (can't easily remove values, leave expanded)
  }
};
