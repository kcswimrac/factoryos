/**
 * Migration: Add project_id to doe_studies and eightd_reports for proper data isolation
 * Backfills project_id from linked nodes where possible.
 */
module.exports = {
  name: '20260323000015_add_project_id_to_doe_eightd',
  async up(client) {
    // ── doe_studies: add project_id column ──────────────────────────────────
    await client.query(`
      ALTER TABLE doe_studies
        ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE
    `);

    // Backfill from linked nodes
    await client.query(`
      UPDATE doe_studies s
      SET project_id = n.project_id
      FROM nodes n
      WHERE n.id = s.node_id
        AND s.project_id IS NULL
        AND n.project_id IS NOT NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS doe_studies_project_idx ON doe_studies(project_id)
    `);

    // ── eightd_reports: add project_id column ───────────────────────────────
    await client.query(`
      ALTER TABLE eightd_reports
        ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE
    `);

    // Backfill from linked nodes (via eightd_node_links)
    await client.query(`
      UPDATE eightd_reports r
      SET project_id = n.project_id
      FROM eightd_node_links l
      JOIN nodes n ON n.id = l.node_id
      WHERE l.report_id = r.id
        AND r.project_id IS NULL
        AND n.project_id IS NOT NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS eightd_reports_project_idx ON eightd_reports(project_id)
    `);
  },

  async down(client) {
    await client.query(`ALTER TABLE doe_studies DROP COLUMN IF EXISTS project_id`);
    await client.query(`ALTER TABLE eightd_reports DROP COLUMN IF EXISTS project_id`);
    await client.query(`DROP INDEX IF EXISTS doe_studies_project_idx`);
    await client.query(`DROP INDEX IF EXISTS eightd_reports_project_idx`);
  }
};
