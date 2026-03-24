/**
 * Create resource inventory tables (tools, lab assets, fixtures, test equipment)
 */
module.exports = {
  name: 'create_resources_tables',

  up: async (conn) => {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        global_artifact_id VARCHAR(8) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('tool', 'lab_asset', 'fixture', 'test_equipment') NOT NULL,
        quantity_total INT DEFAULT 1,
        quantity_available INT DEFAULT 1,
        location_label VARCHAR(255),
        status ENUM('available', 'checked_out', 'under_maintenance', 'lost') DEFAULT 'available',
        calibration_required BOOLEAN DEFAULT FALSE,
        calibration_due_at TIMESTAMP NULL,
        last_calibration_at TIMESTAMP NULL,
        calibration_interval_days INT,
        created_by VARCHAR(100),
        deleted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_resources_category (category),
        INDEX idx_resources_status (status),
        INDEX idx_resources_artifact (global_artifact_id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS resource_checkouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resource_id INT NOT NULL,
        checked_out_by_user_id VARCHAR(100),
        checked_out_by_name VARCHAR(255),
        quantity_checked_out INT DEFAULT 1,
        checked_out_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expected_return_at TIMESTAMP NULL,
        returned_at TIMESTAMP NULL,
        purpose_note TEXT,
        return_notes TEXT,
        linked_project_id VARCHAR(100),
        linked_project_name VARCHAR(255),
        linked_node_id VARCHAR(100),
        linked_artifact_id VARCHAR(100),
        INDEX idx_checkouts_resource (resource_id),
        INDEX idx_checkouts_user (checked_out_by_user_id),
        INDEX idx_checkouts_active (returned_at)
      )
    `);
  },

  down: async (conn) => {
    await conn.query('DROP TABLE IF EXISTS resource_checkouts').catch(() => {});
    await conn.query('DROP TABLE IF EXISTS resources').catch(() => {});
  }
};
