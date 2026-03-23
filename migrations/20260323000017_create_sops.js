/**
 * Migration: Create SOPs (Standard Operating Procedures) tables
 *
 * Tables:
 *   sops       — procedure header (title, version, status, project link)
 *   sop_steps  — ordered steps with hazards, tools, images
 */

exports.up = async (conn) => {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS sops (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      title        VARCHAR(255) NOT NULL,
      description  TEXT,
      version      VARCHAR(50)  NOT NULL DEFAULT '1.0',
      revision     VARCHAR(10)  NOT NULL DEFAULT 'A',
      status       VARCHAR(50)  NOT NULL DEFAULT 'draft',
      linked_nodes JSON         NOT NULL,
      created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS sop_steps (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      sop_id      INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
      step_order  INTEGER NOT NULL DEFAULT 0,
      title       VARCHAR(255),
      description TEXT,
      tools       JSON NOT NULL,
      hazards     JSON NOT NULL,
      images      JSON NOT NULL,
      created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`CREATE INDEX idx_sops_project_id      ON sops(project_id)`).catch(() => {});
  await conn.query(`CREATE INDEX idx_sop_steps_sop_id     ON sop_steps(sop_id)`).catch(() => {});
  await conn.query(`CREATE INDEX idx_sop_steps_step_order ON sop_steps(sop_id, step_order)`).catch(() => {});
};

exports.down = async (conn) => {
  await conn.query('DROP TABLE IF EXISTS sop_steps');
  await conn.query('DROP TABLE IF EXISTS sops');
};
