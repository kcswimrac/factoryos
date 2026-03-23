/**
 * Migration: Add project_id to doe_studies and eightd_reports for proper data isolation
 * Backfills project_id from linked nodes where possible.
 */
module.exports = {
  name: '20260323000015_add_project_id_to_doe_eightd',
  async up(conn) {
    // ── doe_studies: add project_id column ──────────────────────────────────
    await conn.query(`
      ALTER TABLE doe_studies
        ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE
    `).catch(() => {});

    // Backfill from linked nodes (MySQL UPDATE JOIN syntax)
    await conn.query(`
      UPDATE doe_studies s
      JOIN nodes n ON n.id = s.node_id
      SET s.project_id = n.project_id
      WHERE s.project_id IS NULL
        AND n.project_id IS NOT NULL
    `);

    await conn.query(`
      CREATE INDEX doe_studies_project_idx ON doe_studies(project_id)
    `).catch(() => {});

    // ── eightd_reports: add project_id column ───────────────────────────────
    await conn.query(`
      ALTER TABLE eightd_reports
        ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE
    `).catch(() => {});

    // Backfill from linked nodes (via eightd_node_links) — MySQL UPDATE JOIN syntax
    await conn.query(`
      UPDATE eightd_reports r
      JOIN eightd_node_links l ON l.report_id = r.id
      JOIN nodes n ON n.id = l.node_id
      SET r.project_id = n.project_id
      WHERE r.project_id IS NULL
        AND n.project_id IS NOT NULL
    `);

    await conn.query(`
      CREATE INDEX eightd_reports_project_idx ON eightd_reports(project_id)
    `).catch(() => {});
  },

  async down(conn) {
    await conn.query(`ALTER TABLE doe_studies DROP COLUMN project_id`).catch(() => {});
    await conn.query(`ALTER TABLE eightd_reports DROP COLUMN project_id`).catch(() => {});
    await conn.query(`DROP INDEX doe_studies_project_idx ON doe_studies`).catch(() => {});
    await conn.query(`DROP INDEX eightd_reports_project_idx ON eightd_reports`).catch(() => {});
  }
};
