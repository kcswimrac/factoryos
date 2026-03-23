/**
 * Migration: node_vendor_info + node_cutsheets
 * Adds vendor/procurement data for PURCH (purchased) nodes.
 */

exports.up = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS node_vendor_info (
      id                SERIAL PRIMARY KEY,
      node_id           INTEGER NOT NULL UNIQUE REFERENCES nodes ON DELETE CASCADE,
      vendor_name       VARCHAR(255),
      vendor_part_number VARCHAR(255),
      vendor_url        TEXT,
      specs_summary     TEXT,
      lead_time         VARCHAR(255),
      unit_price        NUMERIC(12,4),
      pricing_notes     TEXT,
      sourcing_status   VARCHAR(50) DEFAULT 'evaluating',
      created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS node_vendor_info_node_id_idx ON node_vendor_info (node_id)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS node_cutsheets (
      id          SERIAL PRIMARY KEY,
      node_id     INTEGER NOT NULL REFERENCES nodes ON DELETE CASCADE,
      label       VARCHAR(255) DEFAULT '',
      file_name   VARCHAR(255),
      base64      TEXT,
      mime_type   VARCHAR(100) DEFAULT 'application/pdf',
      file_size   INTEGER,
      position    INTEGER DEFAULT 0,
      created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS node_cutsheets_node_id_idx ON node_cutsheets (node_id)
  `);
};

exports.down = async (client) => {
  await client.query('DROP TABLE IF EXISTS node_cutsheets CASCADE');
  await client.query('DROP TABLE IF EXISTS node_vendor_info CASCADE');
};

exports.name = '20260322000007_create_node_vendor_info';
