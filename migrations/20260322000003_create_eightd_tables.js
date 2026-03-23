/**
 * Migration: 8D Problem-Solving tables
 *
 * eightd_reports  – standalone 8D reports (disciplines stored as JSONB)
 * eightd_node_links – many-to-many link between reports and nodes
 */
module.exports = {
  name: 'create_eightd_tables',
  up: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS eightd_reports (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(500) NOT NULL,
        status      VARCHAR(20)  NOT NULL DEFAULT 'open',
        disciplines JSONB        NOT NULL DEFAULT '{}',
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS eightd_reports_status_idx ON eightd_reports(status)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS eightd_node_links (
        id         SERIAL PRIMARY KEY,
        report_id  INTEGER NOT NULL REFERENCES eightd_reports(id) ON DELETE CASCADE,
        node_id    INTEGER NOT NULL REFERENCES nodes(id)          ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(report_id, node_id)
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS eightd_node_links_node_idx   ON eightd_node_links(node_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS eightd_node_links_report_idx ON eightd_node_links(report_id)
    `);
  }
};
