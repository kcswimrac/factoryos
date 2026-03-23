/**
 * Migration: Create SOPs (Standard Operating Procedures) tables
 *
 * Tables:
 *   sops       — procedure header (title, version, status, project link)
 *   sop_steps  — ordered steps with hazards, tools, images
 */

exports.up = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS sops (
      id           SERIAL PRIMARY KEY,
      project_id   INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      title        VARCHAR(255) NOT NULL,
      description  TEXT,
      version      VARCHAR(50)  NOT NULL DEFAULT '1.0',
      revision     VARCHAR(10)  NOT NULL DEFAULT 'A',
      status       VARCHAR(50)  NOT NULL DEFAULT 'draft',
      linked_nodes JSONB        NOT NULL DEFAULT '[]',
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS sop_steps (
      id          SERIAL PRIMARY KEY,
      sop_id      INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
      step_order  INTEGER NOT NULL DEFAULT 0,
      title       VARCHAR(255),
      description TEXT,
      tools       JSONB NOT NULL DEFAULT '[]',
      hazards     JSONB NOT NULL DEFAULT '[]',
      images      JSONB NOT NULL DEFAULT '[]',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_sops_project_id      ON sops(project_id);
    CREATE INDEX IF NOT EXISTS idx_sop_steps_sop_id     ON sop_steps(sop_id);
    CREATE INDEX IF NOT EXISTS idx_sop_steps_step_order ON sop_steps(sop_id, step_order);
  `);
};

exports.down = async (client) => {
  await client.query('DROP TABLE IF EXISTS sop_steps CASCADE;');
  await client.query('DROP TABLE IF EXISTS sops CASCADE;');
};
