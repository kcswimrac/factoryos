/**
 * Migration: Create node_renders table
 * Stores CAD renders and rendered view images per node.
 */

exports.up = async (conn) => {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS node_renders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      node_id INTEGER NOT NULL REFERENCES nodes ON DELETE CASCADE,
      label VARCHAR(255) DEFAULT '',
      source_type VARCHAR(20) NOT NULL DEFAULT 'url',
      url TEXT,
      base64 TEXT,
      mime_type VARCHAR(50) DEFAULT 'image/jpeg',
      file_size INTEGER,
      position INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE INDEX node_renders_node_id_idx ON node_renders (node_id)
  `).catch(() => {});
};

exports.down = async (conn) => {
  await conn.query('DROP TABLE IF EXISTS node_renders CASCADE');
};

exports.name = '20260322000006_create_node_renders';
