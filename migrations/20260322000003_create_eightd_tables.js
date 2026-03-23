/**
 * Migration: 8D Problem-Solving tables
 *
 * eightd_reports  – standalone 8D reports (disciplines stored as JSON)
 * eightd_node_links – many-to-many link between reports and nodes
 */
module.exports = {
  name: 'create_eightd_tables',
  up: async (conn) => {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS eightd_reports (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(500) NOT NULL,
        status      VARCHAR(20)  NOT NULL DEFAULT 'open',
        disciplines JSON         NOT NULL,
        created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE INDEX eightd_reports_status_idx ON eightd_reports(status)
    `).catch(() => {});

    await conn.query(`
      CREATE TABLE IF NOT EXISTS eightd_node_links (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        report_id  INTEGER NOT NULL REFERENCES eightd_reports(id) ON DELETE CASCADE,
        node_id    INTEGER NOT NULL REFERENCES nodes(id)          ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(report_id, node_id)
      )
    `);

    await conn.query(`
      CREATE INDEX eightd_node_links_node_idx   ON eightd_node_links(node_id)
    `).catch(() => {});
    await conn.query(`
      CREATE INDEX eightd_node_links_report_idx ON eightd_node_links(report_id)
    `).catch(() => {});
  }
};
