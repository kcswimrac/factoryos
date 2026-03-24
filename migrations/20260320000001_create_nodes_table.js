module.exports = {
  name: 'create_nodes_table',
  up: async (conn) => {
    // MySQL uses inline ENUM on columns — no separate CREATE TYPE needed

    // Create nodes table with self-referencing FK
    await conn.query(`
      CREATE TABLE IF NOT EXISTS nodes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        part_number VARCHAR(255) NOT NULL UNIQUE,
        type ENUM('ASSY','SYS','SUBSYS','SUBASSY','COMP','PURCH','DOC') NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES nodes(id) ON DELETE RESTRICT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Index for fast parent_id lookups (children queries)
    await conn.query(`
      CREATE INDEX nodes_parent_id_idx ON nodes (parent_id)
    `).catch(() => {});

    // Index for part number lookups
    await conn.query(`
      CREATE INDEX nodes_part_number_idx ON nodes (part_number)
    `).catch(() => {});
  }
};
