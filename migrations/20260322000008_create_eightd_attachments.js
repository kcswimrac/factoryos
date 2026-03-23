/**
 * Migration: eightd_attachments
 * Adds per-discipline evidence/file upload support to 8D reports.
 */

exports.up = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS eightd_attachments (
      id          SERIAL PRIMARY KEY,
      report_id   INTEGER NOT NULL REFERENCES eightd_reports(id) ON DELETE CASCADE,
      disc_key    VARCHAR(4) NOT NULL,
      filename    TEXT NOT NULL,
      mime_type   VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
      file_size   INTEGER,
      base64      TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS eightd_attachments_report_id_idx
      ON eightd_attachments (report_id)
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS eightd_attachments_disc_idx
      ON eightd_attachments (report_id, disc_key)
  `);
};

exports.down = async (client) => {
  await client.query('DROP TABLE IF EXISTS eightd_attachments CASCADE');
};

exports.name = '20260322000008_create_eightd_attachments';
