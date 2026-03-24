-- ═══════════════════════════════════════════════════════════════════════
-- Factory-OS Complete Database Migration Script
-- Generated for MySQL Workbench
-- ═══════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS factoryos;
USE factoryos;

-- ─── Core Tables (from migrate.js) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS _migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  subscription_plan VARCHAR(255),
  subscription_expires_at TIMESTAMP NULL,
  subscription_updated_at TIMESTAMP NULL
);

-- ─── Migration: 20260320000001_create_nodes_table.js ───
CREATE TABLE IF NOT EXISTS nodes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        part_number VARCHAR(255) NOT NULL UNIQUE,
        type ENUM('ASSY','SYS','SUBSYS','SUBASSY','COMP','PURCH','DOC') NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES nodes(id) ON DELETE RESTRICT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE INDEX nodes_parent_id_idx ON nodes (parent_id);

CREATE INDEX nodes_part_number_idx ON nodes (part_number);

-- ─── Migration: 20260320000002_create_requirements_table.js ───
CREATE TABLE IF NOT EXISTS requirements (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        node_id      INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        req_id       VARCHAR(50) NOT NULL UNIQUE,
        title        VARCHAR(500) NOT NULL,
        description  TEXT,
        verification_method VARCHAR(50) NOT NULL DEFAULT 'test',
        status       VARCHAR(50) NOT NULL DEFAULT 'open',
        priority     VARCHAR(20) NOT NULL DEFAULT 'shall',
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS requirement_traces (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
        phase          VARCHAR(100) NOT NULL,
        evidence       TEXT,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE INDEX requirements_node_id_idx ON requirements(node_id);

CREATE INDEX req_traces_requirement_id_idx ON requirement_traces(requirement_id);

-- ─── Migration: 20260320000003_create_node_phases.js ───
ALTER TABLE nodes ADD COLUMN phase_mode VARCHAR(20) NOT NULL DEFAULT 'inherit';

CREATE TABLE IF NOT EXISTS node_phases (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        node_id       INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        phase         VARCHAR(50) NOT NULL,
        phase_order   INTEGER NOT NULL,
        status        VARCHAR(20) NOT NULL DEFAULT 'not_started',
        started_at    TIMESTAMP NULL,
        completed_at  TIMESTAMP NULL,
        notes         TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE(node_id, phase)
      );

CREATE INDEX node_phases_node_id_idx ON node_phases(node_id);

CREATE INDEX node_phases_status_idx ON node_phases(status);

-- ─── Migration: 20260321000001_create_phase_artifacts.js ───
CREATE TABLE IF NOT EXISTS phase_artifacts (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        node_id       INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        phase         VARCHAR(50) NOT NULL,
        artifact_type VARCHAR(50) NOT NULL,
        artifact_key  VARCHAR(100),
        data          JSON NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE UNIQUE INDEX phase_artifacts_single_key_idx
      ON phase_artifacts(node_id, phase, artifact_key);

CREATE INDEX phase_artifacts_node_phase_idx
      ON phase_artifacts(node_id, phase);

-- ─── Migration: 20260322000001_create_doe_tables.js ───
CREATE TABLE IF NOT EXISTS doe_studies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        objective TEXT,
        node_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'active',
        conclusions TEXT,
        recommended_settings TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS doe_factors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        study_id INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(100),
        levels JSON DEFAULT (JSON_ARRAY()),
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS doe_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        study_id INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        unit VARCHAR(100),
        target VARCHAR(50) DEFAULT 'maximize',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS doe_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        study_id INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        run_number INTEGER NOT NULL,
        factor_settings JSON DEFAULT (JSON_OBJECT()),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(study_id, run_number)
      );

CREATE TABLE IF NOT EXISTS doe_run_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        run_id INTEGER NOT NULL REFERENCES doe_runs(id) ON DELETE CASCADE,
        response_id INTEGER NOT NULL REFERENCES doe_responses(id) ON DELETE CASCADE,
        value NUMERIC,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(run_id, response_id)
      );

CREATE INDEX doe_factors_study_idx ON doe_factors(study_id);

CREATE INDEX doe_responses_study_idx ON doe_responses(study_id);

CREATE INDEX doe_runs_study_idx ON doe_runs(study_id);

CREATE INDEX doe_run_results_run_idx ON doe_run_results(run_id);

CREATE INDEX doe_studies_node_idx ON doe_studies(node_id);

DROP TABLE IF EXISTS doe_run_results CASCADE;

DROP TABLE IF EXISTS doe_runs CASCADE;

DROP TABLE IF EXISTS doe_responses CASCADE;

DROP TABLE IF EXISTS doe_factors CASCADE;

DROP TABLE IF EXISTS doe_studies CASCADE;

-- ─── Migration: 20260322000002_create_projects.js ───
CREATE TABLE IF NOT EXISTS projects (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        description TEXT,
        slug        VARCHAR(100) UNIQUE,
        is_demo     TINYINT(1) NOT NULL DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

ALTER TABLE nodes
        ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX nodes_project_id_idx ON nodes(project_id);

-- ─── Migration: 20260322000003_create_eightd_tables.js ───
CREATE TABLE IF NOT EXISTS eightd_reports (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(500) NOT NULL,
        status      VARCHAR(20)  NOT NULL DEFAULT 'open',
        disciplines JSON         NOT NULL,
        created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE INDEX eightd_reports_status_idx ON eightd_reports(status);

CREATE TABLE IF NOT EXISTS eightd_node_links (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        report_id  INTEGER NOT NULL REFERENCES eightd_reports(id) ON DELETE CASCADE,
        node_id    INTEGER NOT NULL REFERENCES nodes(id)          ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(report_id, node_id)
      );

CREATE INDEX eightd_node_links_node_idx   ON eightd_node_links(node_id);

CREATE INDEX eightd_node_links_report_idx ON eightd_node_links(report_id);

-- ─── Migration: 20260322000004_create_teams.js ───
CREATE TABLE IF NOT EXISTS teams (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(255) NOT NULL,
        slug        VARCHAR(100) UNIQUE,
        logo_url    TEXT,
        description TEXT,
        is_demo     TINYINT(1) NOT NULL DEFAULT 0,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

ALTER TABLE projects
        ADD COLUMN team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE projects
        ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active';

CREATE INDEX projects_team_id_idx ON projects(team_id);

-- ─── Migration: 20260322000005_rename_demo_teams.js ───
UPDATE teams SET name = 'Full Send Polytechnic',  slug = 'full-send',   description = 'Collegiate engineering team building the Baja SAE 2025 off-road vehicle.' WHERE slug = 'shit';

UPDATE teams SET name = 'Greyline Technologies',  slug = 'greyline',    description = 'Autonomous systems and defense drone development team.' WHERE slug = 'darpa-llc';

UPDATE teams SET name = 'Heavy Motion Industries', slug = 'heavy-motion', description = 'High-voltage hybrid powertrain development team.' WHERE slug = 'torque-pray';

UPDATE teams SET name = 'South Harmon Institute of Technology', slug = 'shit',       description = 'Collegiate engineering team building the Baja SAE 2025 off-road vehicle.' WHERE slug = 'full-send';

UPDATE teams SET name = 'Definitely Not DARPA, LLC',           slug = 'darpa-llc',  description = 'Autonomous systems research team. Totally civilian.'                   WHERE slug = 'greyline';

UPDATE teams SET name = 'Torque & Pray Heavy Industries',       slug = 'torque-pray', description = 'High-voltage hybrid powertrain development team.'                    WHERE slug = 'heavy-motion';

-- ─── Migration: 20260322000006_create_node_renders.js ───
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
    );

CREATE INDEX node_renders_node_id_idx ON node_renders (node_id);

DROP TABLE IF EXISTS node_renders CASCADE;

-- ─── Migration: 20260322000007_create_node_vendor_info.js ───
CREATE TABLE IF NOT EXISTS node_vendor_info (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      node_id           INTEGER NOT NULL UNIQUE REFERENCES nodes ON DELETE CASCADE,
      vendor_name       VARCHAR(255),
      vendor_part_number VARCHAR(255),
      vendor_url        TEXT,
      specs_summary     TEXT,
      lead_time         VARCHAR(255),
      unit_price        NUMERIC(12,4),
      pricing_notes     TEXT,
      sourcing_status   VARCHAR(50) DEFAULT 'evaluating',
      created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE INDEX node_vendor_info_node_id_idx ON node_vendor_info (node_id);

CREATE TABLE IF NOT EXISTS node_cutsheets (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      node_id     INTEGER NOT NULL REFERENCES nodes ON DELETE CASCADE,
      label       VARCHAR(255) DEFAULT '',
      file_name   VARCHAR(255),
      base64      TEXT,
      mime_type   VARCHAR(100) DEFAULT 'application/pdf',
      file_size   INTEGER,
      position    INTEGER DEFAULT 0,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX node_cutsheets_node_id_idx ON node_cutsheets (node_id);

DROP TABLE IF EXISTS node_cutsheets CASCADE;

DROP TABLE IF EXISTS node_vendor_info CASCADE;

-- ─── Migration: 20260322000008_create_eightd_attachments.js ───
CREATE TABLE IF NOT EXISTS eightd_attachments (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      report_id   INTEGER NOT NULL REFERENCES eightd_reports(id) ON DELETE CASCADE,
      disc_key    VARCHAR(4) NOT NULL,
      filename    TEXT NOT NULL,
      mime_type   VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
      file_size   INTEGER,
      base64      TEXT NOT NULL,
      description TEXT,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX eightd_attachments_report_id_idx
      ON eightd_attachments (report_id);

CREATE INDEX eightd_attachments_disc_idx
      ON eightd_attachments (report_id, disc_key);

DROP TABLE IF EXISTS eightd_attachments CASCADE;

-- ─── Migration: 20260322000009_create_auth_tables.js ───
ALTER TABLE users
        ADD COLUMN reset_token VARCHAR(255);

ALTER TABLE users
        ADD COLUMN reset_token_expires TIMESTAMP NULL;

ALTER TABLE teams
        ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS team_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, user_id)
      );

CREATE INDEX idx_team_members_user_id ON team_members(user_id);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);

-- ─── Migration: 20260322000010_create_project_members.js ───
CREATE TABLE IF NOT EXISTS project_members (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id      INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
        role         VARCHAR(20) NOT NULL DEFAULT 'viewer'
                       CHECK (role IN ('admin', 'editor', 'viewer')),
        invited_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
      );

CREATE INDEX idx_project_members_project_id ON project_members(project_id);

CREATE INDEX idx_project_members_user_id    ON project_members(user_id);

CREATE TABLE IF NOT EXISTS project_invites (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        email        VARCHAR(255) NOT NULL,
        role         VARCHAR(20) NOT NULL DEFAULT 'viewer'
                       CHECK (role IN ('admin', 'editor', 'viewer')),
        token        VARCHAR(255) NOT NULL UNIQUE,
        invited_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        expires_at   TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 7 DAY),
        accepted_at  TIMESTAMP NULL,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, email)
      );

CREATE INDEX idx_project_invites_token ON project_invites(token);

INSERT INTO project_members (project_id, user_id, role)
      SELECT
        p.id         AS project_id,
        tm.user_id   AS user_id,
        'admin'      AS role
      FROM projects p
      JOIN teams t ON t.id = p.team_id
      JOIN team_members tm ON tm.team_id = t.id AND tm.role = 'owner'
      WHERE p.is_demo = 0
      ON DUPLICATE KEY UPDATE role = role;

-- ─── Migration: 20260323000001_doe_phase1_extensions.js ───
ALTER TABLE doe_studies
        ADD COLUMN hypothesis         TEXT;

ALTER TABLE doe_studies
        ADD COLUMN experiment_goal   VARCHAR(30)  DEFAULT 'screening';

ALTER TABLE doe_studies
        ADD COLUMN design_type       VARCHAR(50)  DEFAULT 'manual';

ALTER TABLE doe_studies
        ADD COLUMN resolution        VARCHAR(10);

ALTER TABLE doe_studies
        ADD COLUMN randomize_runs    TINYINT(1)   DEFAULT 1;

ALTER TABLE doe_studies
        ADD COLUMN run_order_locked  TINYINT(1)   DEFAULT 0;

ALTER TABLE doe_factors
        ADD COLUMN factor_type   VARCHAR(30)  DEFAULT 'discrete';

ALTER TABLE doe_factors
        ADD COLUMN min_value     NUMERIC;

ALTER TABLE doe_factors
        ADD COLUMN max_value     NUMERIC;

ALTER TABLE doe_factors
        ADD COLUMN center_value  NUMERIC;

ALTER TABLE doe_runs
        ADD COLUMN status       VARCHAR(30)   DEFAULT 'planned';

ALTER TABLE doe_runs
        ADD COLUMN operator     VARCHAR(255);

ALTER TABLE doe_runs
        ADD COLUMN started_at   TIMESTAMP NULL;

ALTER TABLE doe_runs
        ADD COLUMN completed_at TIMESTAMP NULL;

ALTER TABLE doe_runs
        ADD COLUMN sop_link     VARCHAR(500);

ALTER TABLE doe_runs
        ADD COLUMN run_order    INTEGER;

UPDATE doe_runs SET run_order = run_number WHERE run_order IS NULL;

CREATE TABLE IF NOT EXISTS doe_constraints (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        study_id        INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        description     TEXT,
        constraint_type VARCHAR(30) DEFAULT 'hard_limit',
        expression      TEXT,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE INDEX doe_constraints_study_idx ON doe_constraints(study_id);

CREATE TABLE IF NOT EXISTS doe_decisions (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        study_id          INTEGER NOT NULL REFERENCES doe_studies(id) ON DELETE CASCADE,
        decision          TEXT NOT NULL,
        rejected_options  JSON  DEFAULT (JSON_ARRAY()),
        confidence_level  VARCHAR(20) DEFAULT 'medium',
        affected_node_ids JSON  DEFAULT (JSON_ARRAY()),
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE UNIQUE INDEX doe_decisions_study_uniq ON doe_decisions(study_id);

DROP TABLE IF EXISTS doe_decisions;

DROP TABLE IF EXISTS doe_constraints;

ALTER TABLE doe_runs DROP COLUMN run_order;

ALTER TABLE doe_runs DROP COLUMN sop_link;

ALTER TABLE doe_runs DROP COLUMN completed_at;

ALTER TABLE doe_runs DROP COLUMN started_at;

ALTER TABLE doe_runs DROP COLUMN operator;

ALTER TABLE doe_runs DROP COLUMN status;

ALTER TABLE doe_factors DROP COLUMN center_value;

ALTER TABLE doe_factors DROP COLUMN max_value;

ALTER TABLE doe_factors DROP COLUMN min_value;

ALTER TABLE doe_factors DROP COLUMN factor_type;

ALTER TABLE doe_studies DROP COLUMN run_order_locked;

ALTER TABLE doe_studies DROP COLUMN randomize_runs;

ALTER TABLE doe_studies DROP COLUMN resolution;

ALTER TABLE doe_studies DROP COLUMN design_type;

ALTER TABLE doe_studies DROP COLUMN experiment_goal;

ALTER TABLE doe_studies DROP COLUMN hypothesis;

-- ─── Migration: 20260323000002_public_project_share.js ───
ALTER TABLE projects
        ADD COLUMN share_token VARCHAR(36) UNIQUE DEFAULT (UUID());

ALTER TABLE projects
        ADD COLUMN is_public   TINYINT(1) NOT NULL DEFAULT 0;

CREATE INDEX projects_share_token_idx ON projects(share_token);

DROP INDEX projects_share_token_idx ON projects;

ALTER TABLE projects DROP COLUMN is_public;

ALTER TABLE projects DROP COLUMN share_token;

-- ─── Migration: 20260323000003_phase_revisions.js ───
CREATE TABLE IF NOT EXISTS node_phase_revisions (
        id                  INT AUTO_INCREMENT PRIMARY KEY,
        node_id             INTEGER NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        revision_label      VARCHAR(20) NOT NULL,
        triggered_by_phase  VARCHAR(50),
        regression_reason   TEXT,
        phase_snapshot      JSON NOT NULL,
        artifact_snapshot   JSON NOT NULL,
        created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE INDEX node_phase_revisions_node_idx
        ON node_phase_revisions(node_id);

CREATE UNIQUE INDEX node_phase_revisions_node_label_uniq
        ON node_phase_revisions(node_id, revision_label);

DROP TABLE IF EXISTS node_phase_revisions;

-- ─── Migration: 20260323000004_add_project_mode.js ───
ALTER TABLE projects
        ADD COLUMN project_mode VARCHAR(20) NOT NULL DEFAULT 'top_down';

ALTER TABLE projects DROP COLUMN project_mode;

-- ─── Migration: 20260323000005_discovery_workspace.js ───
CREATE TABLE IF NOT EXISTS discovery_objects (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title        VARCHAR(500) NOT NULL,
        description  TEXT,
        type         VARCHAR(50)  NOT NULL DEFAULT 'concept',
        maturity     VARCHAR(20)  NOT NULL DEFAULT 'raw',
        confidence   VARCHAR(20)  NOT NULL DEFAULT 'low',
        tags         JSON         NOT NULL,
        created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by   INTEGER      REFERENCES users(id) ON DELETE SET NULL
      );

CREATE INDEX discovery_objects_project_idx
        ON discovery_objects(project_id);

CREATE INDEX discovery_objects_type_idx
        ON discovery_objects(project_id, type);

CREATE TABLE IF NOT EXISTS discovery_attachments (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        object_id  INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        url        TEXT NOT NULL,
        label      VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE INDEX discovery_attachments_object_idx
        ON discovery_attachments(object_id);

DROP TABLE IF EXISTS discovery_attachments;

DROP TABLE IF EXISTS discovery_objects;

-- ─── Migration: 20260323000006_discovery_promotions.js ───
ALTER TABLE discovery_objects
        ADD COLUMN promoted_node_id INTEGER REFERENCES nodes(id) ON DELETE SET NULL;

ALTER TABLE discovery_objects
        ADD COLUMN promoted_at TIMESTAMP NULL;

ALTER TABLE discovery_objects
        ADD COLUMN promoted_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS discovery_promotions (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        object_id    INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        node_id      INTEGER REFERENCES nodes(id) ON DELETE SET NULL,
        promoted_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
        snapshot     JSON NOT NULL,
        promoted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE INDEX discovery_promotions_object_idx
        ON discovery_promotions(object_id);

CREATE INDEX discovery_promotions_node_idx
        ON discovery_promotions(node_id);

DROP TABLE IF EXISTS discovery_promotions;

ALTER TABLE discovery_objects DROP COLUMN promoted_by;

ALTER TABLE discovery_objects DROP COLUMN promoted_at;

ALTER TABLE discovery_objects DROP COLUMN promoted_node_id;

-- ─── Migration: 20260323000007_discovery_phase2.js ───
ALTER TABLE discovery_objects
        ADD COLUMN functional_cluster VARCHAR(100);

CREATE INDEX discovery_objects_cluster_idx
        ON discovery_objects(project_id, functional_cluster);

CREATE TABLE IF NOT EXISTS discovery_relationships (
        id                 INT AUTO_INCREMENT PRIMARY KEY,
        source_object_id   INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        target_object_id   INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        relationship_type  VARCHAR(50) NOT NULL,
        notes              TEXT,
        created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT discovery_relationships_unique UNIQUE (source_object_id, target_object_id, relationship_type)
      );

CREATE INDEX discovery_relationships_src_idx
        ON discovery_relationships(source_object_id);

CREATE INDEX discovery_relationships_tgt_idx
        ON discovery_relationships(target_object_id);

CREATE TABLE IF NOT EXISTS discovery_architectures (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name         VARCHAR(255) NOT NULL,
        description  TEXT,
        pros         TEXT,
        cons         TEXT,
        risks        TEXT,
        status       VARCHAR(20) NOT NULL DEFAULT 'active',
        kill_reason  TEXT,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE INDEX discovery_architectures_project_idx
        ON discovery_architectures(project_id);

CREATE TABLE IF NOT EXISTS discovery_architecture_objects (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        architecture_id  INTEGER NOT NULL REFERENCES discovery_architectures(id) ON DELETE CASCADE,
        object_id        INTEGER NOT NULL REFERENCES discovery_objects(id) ON DELETE CASCADE,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT discovery_arch_obj_unique UNIQUE (architecture_id, object_id)
      );

CREATE INDEX discovery_arch_obj_arch_idx
        ON discovery_architecture_objects(architecture_id);

CREATE INDEX discovery_arch_obj_obj_idx
        ON discovery_architecture_objects(object_id);

DROP TABLE IF EXISTS discovery_architecture_objects;

DROP TABLE IF EXISTS discovery_architectures;

DROP TABLE IF EXISTS discovery_relationships;

ALTER TABLE discovery_objects DROP COLUMN functional_cluster;

-- ─── Migration: 20260323000008_fix_demo_render_images.js ───
UPDATE node_renders SET url = ?
      WHERE url = ?
        AND node_id IN (
          SELECT n.id FROM nodes n
          JOIN projects p ON n.project_id = p.id
          WHERE p.slug = 'baja-sae-2025' AND p.is_demo = 1
        );

UPDATE node_renders SET url = ?
      WHERE url = ?
        AND node_id IN (
          SELECT n.id FROM nodes n
          JOIN projects p ON n.project_id = p.id
          WHERE p.is_demo = 1 AND p.slug != 'baja-sae-2025' AND p.slug != 'drone-demo'
        );

UPDATE node_renders SET url = ?
      WHERE url = ?;

-- ─── Migration: 20260323000009_remove_demo_renders.js ───
DELETE FROM node_renders
      WHERE source_type = 'url'
        AND url LIKE '/images/demo/%';

-- ─── Migration: 20260323000010_requirement_derivation_tracking.js ───
ALTER TABLE requirements ADD COLUMN source TEXT;

CREATE TABLE IF NOT EXISTS requirement_derivations (
        id                   INT AUTO_INCREMENT PRIMARY KEY,
        parent_requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
        child_requirement_id  INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (parent_requirement_id, child_requirement_id)
      );

CREATE INDEX req_derivations_parent_idx ON requirement_derivations(parent_requirement_id);

CREATE INDEX req_derivations_child_idx ON requirement_derivations(child_requirement_id);

DROP TABLE IF EXISTS requirement_derivations;

ALTER TABLE requirements DROP COLUMN source;

-- ─── Migration: 20260323000011_add_project_id_to_doe_eightd.js ───
ALTER TABLE doe_studies
        ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

UPDATE doe_studies s
      JOIN nodes n ON n.id = s.node_id
      SET s.project_id = n.project_id
      WHERE s.project_id IS NULL
        AND n.project_id IS NOT NULL;

CREATE INDEX doe_studies_project_idx ON doe_studies(project_id);

ALTER TABLE eightd_reports
        ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;

UPDATE eightd_reports r
      JOIN eightd_node_links l ON l.report_id = r.id
      JOIN nodes n ON n.id = l.node_id
      SET r.project_id = n.project_id
      WHERE r.project_id IS NULL
        AND n.project_id IS NOT NULL;

CREATE INDEX eightd_reports_project_idx ON eightd_reports(project_id);

ALTER TABLE doe_studies DROP COLUMN project_id;

ALTER TABLE eightd_reports DROP COLUMN project_id;

DROP INDEX doe_studies_project_idx ON doe_studies;

DROP INDEX eightd_reports_project_idx ON eightd_reports;

-- ─── Migration: 20260323000012_investor_contacts.js ───
CREATE TABLE IF NOT EXISTS investor_contacts (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        email      VARCHAR(255) NOT NULL,
        firm       VARCHAR(255),
        investor_type VARCHAR(50),
        message    TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE INDEX investor_contacts_email_idx ON investor_contacts(email);

CREATE INDEX investor_contacts_created_at_idx ON investor_contacts(created_at);

DROP TABLE IF EXISTS investor_contacts;

-- ─── Migration: 20260323000013_create_sop_tables.js ───
CREATE TABLE IF NOT EXISTS sops (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        project_id    INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        title         VARCHAR(255) NOT NULL,
        description   TEXT,
        version       VARCHAR(50)  DEFAULT '1.0',
        revision      VARCHAR(50)  DEFAULT 'A',
        status        VARCHAR(20)  DEFAULT 'draft'
                        CHECK (status IN ('draft', 'active', 'archived')),
        linked_nodes  JSON,
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS sop_steps (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        sop_id      INTEGER NOT NULL REFERENCES sops(id) ON DELETE CASCADE,
        step_order  INTEGER NOT NULL DEFAULT 1,
        title       VARCHAR(255),
        description TEXT,
        tools       JSON,
        hazards     JSON,
        images      JSON,
        created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE INDEX sops_project_id_idx     ON sops(project_id);

CREATE INDEX sop_steps_sop_id_idx    ON sop_steps(sop_id);

CREATE INDEX sop_steps_order_idx     ON sop_steps(sop_id, step_order);

DROP TABLE IF EXISTS sop_steps;

DROP TABLE IF EXISTS sops;

-- ─── Migration: 20260323000014_remove_old_heavy_motion_project.js ───
UPDATE nodes SET parent_id = NULL
    WHERE project_id IN (
      SELECT id FROM projects WHERE slug = 'edison-hybrid-truck'
    );

DELETE FROM nodes
    WHERE project_id IN (
      SELECT id FROM projects WHERE slug = 'edison-hybrid-truck'
    );

DELETE FROM projects WHERE slug = 'edison-hybrid-truck';

-- ─── Migration: 20260323000015_create_analytics_tables.js ───
CREATE TABLE IF NOT EXISTS page_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        path VARCHAR(500) NOT NULL,
        referrer VARCHAR(2000),
        user_agent VARCHAR(1000),
        ip_hash VARCHAR(64),
        utm_source VARCHAR(255),
        utm_medium VARCHAR(255),
        utm_campaign VARCHAR(255),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE INDEX idx_page_views_created_at ON page_views (created_at);

CREATE INDEX idx_page_views_path ON page_views (path);

CREATE INDEX idx_page_views_utm_source ON page_views (utm_source);

CREATE TABLE IF NOT EXISTS analytics_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_name VARCHAR(100) NOT NULL,
        event_data JSON,
        path VARCHAR(500),
        ip_hash VARCHAR(64),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE INDEX idx_analytics_events_name ON analytics_events (event_name);

CREATE INDEX idx_analytics_events_created_at ON analytics_events (created_at);

-- ─── Migration: 20260323000016_create_early_access_tables.js ───
CREATE TABLE IF NOT EXISTS access_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100),
        phone VARCHAR(20),
        email VARCHAR(255) NOT NULL,
        organization VARCHAR(255),
        team_name VARCHAR(255),
        secondary_name VARCHAR(255),
        secondary_role VARCHAR(100),
        secondary_email VARCHAR(255),
        voucher_code_attempted VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS university_vouchers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        voucher_code VARCHAR(50) NOT NULL UNIQUE,
        institution_name VARCHAR(255),
        max_users INT DEFAULT 10,
        contact_name VARCHAR(255),
        contact_role VARCHAR(100),
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255),
        organization VARCHAR(255),
        team_name VARCHAR(255),
        secondary_name VARCHAR(255),
        secondary_role VARCHAR(100),
        secondary_email VARCHAR(255),
        claimed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE INDEX idx_access_requests_email ON access_requests(email);

CREATE INDEX idx_university_vouchers_code ON university_vouchers(voucher_code);

DROP TABLE IF EXISTS access_requests;

DROP TABLE IF EXISTS university_vouchers;

-- ─── Migration: 20260323000017_create_experiment_shares.js ───
CREATE TABLE IF NOT EXISTS experiment_shares (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id INT NOT NULL,
        invited_email VARCHAR(255) NOT NULL,
        invited_name VARCHAR(255),
        access_level ENUM('view', 'contribute', 'execute') DEFAULT 'view',
        share_token VARCHAR(128) NOT NULL UNIQUE,
        created_by INT,
        status ENUM('pending', 'accepted', 'revoked', 'expired') DEFAULT 'pending',
        invite_message TEXT,
        accepted_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_experiment_shares_experiment (experiment_id),
        INDEX idx_experiment_shares_email (invited_email),
        INDEX idx_experiment_shares_token (share_token)
      );

CREATE TABLE IF NOT EXISTS experiment_share_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        share_id INT NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        activity_details JSON,
        actor_email VARCHAR(255),
        actor_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_share_activity_share (share_id)
      );

DROP TABLE IF EXISTS experiment_share_activity;

DROP TABLE IF EXISTS experiment_shares;

-- ─── Migration: 20260323000018_create_design_cycle_tables.js ───
CREATE TABLE IF NOT EXISTS design_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_number VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        hierarchy_level ENUM('system', 'subsystem', 'component', 'part') DEFAULT 'component',
        status ENUM('active', 'completed', 'on_hold', 'cancelled') DEFAULT 'active',
        current_phase INT DEFAULT 1,
        overall_progress INT DEFAULT 0,
        owner VARCHAR(255),
        team_size INT DEFAULT 1,
        target_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS design_phases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        phase_number INT NOT NULL,
        phase_name VARCHAR(50) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
        progress_percentage INT DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_design_phases_project (project_id),
        UNIQUE KEY uq_project_phase (project_id, phase_number)
      );

CREATE TABLE IF NOT EXISTS design_phase_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phase_id INT NOT NULL,
        question_number INT NOT NULL,
        question_text TEXT NOT NULL,
        answer_status ENUM('unanswered', 'yes', 'no', 'na') DEFAULT 'unanswered',
        answer_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_phase_questions_phase (phase_id),
        UNIQUE KEY uq_phase_question (phase_id, question_number)
      );

CREATE TABLE IF NOT EXISTS design_ai_chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        role ENUM('user', 'assistant', 'system') NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_design_chats_project (project_id)
      );

DROP TABLE IF EXISTS design_ai_chats;

DROP TABLE IF EXISTS design_phase_questions;

DROP TABLE IF EXISTS design_phases;

DROP TABLE IF EXISTS design_projects;

-- ─── Migration: 20260323000019_create_resources_tables.js ───
CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        global_artifact_id VARCHAR(8) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('tool', 'lab_asset', 'fixture', 'test_equipment') NOT NULL,
        quantity_total INT DEFAULT 1,
        quantity_available INT DEFAULT 1,
        location_label VARCHAR(255),
        status ENUM('available', 'checked_out', 'under_maintenance', 'lost') DEFAULT 'available',
        calibration_required BOOLEAN DEFAULT FALSE,
        calibration_due_at TIMESTAMP NULL,
        last_calibration_at TIMESTAMP NULL,
        calibration_interval_days INT,
        created_by VARCHAR(100),
        deleted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_resources_category (category),
        INDEX idx_resources_status (status),
        INDEX idx_resources_artifact (global_artifact_id)
      );

CREATE TABLE IF NOT EXISTS resource_checkouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resource_id INT NOT NULL,
        checked_out_by_user_id VARCHAR(100),
        checked_out_by_name VARCHAR(255),
        quantity_checked_out INT DEFAULT 1,
        checked_out_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expected_return_at TIMESTAMP NULL,
        returned_at TIMESTAMP NULL,
        purpose_note TEXT,
        return_notes TEXT,
        linked_project_id VARCHAR(100),
        linked_project_name VARCHAR(255),
        linked_node_id VARCHAR(100),
        linked_artifact_id VARCHAR(100),
        INDEX idx_checkouts_resource (resource_id),
        INDEX idx_checkouts_user (checked_out_by_user_id),
        INDEX idx_checkouts_active (returned_at)
      );

DROP TABLE IF EXISTS resource_checkouts;

DROP TABLE IF EXISTS resources;

-- ─── Migration: 20260323000020_create_doe_experiments_tables.js ───
CREATE TABLE IF NOT EXISTS doe_experiments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        design_type VARCHAR(50) DEFAULT 'full_factorial',
        user_id INT DEFAULT 1,
        project_id INT,
        status ENUM('active', 'analyzed', 'completed', 'archived') DEFAULT 'active',
        total_runs INT DEFAULT 0,
        completed_runs INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_doe_experiments_user (user_id)
      );

CREATE TABLE IF NOT EXISTS doe_factors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        unit VARCHAR(50),
        description TEXT,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS doe_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        unit VARCHAR(50),
        description TEXT,
        goal ENUM('maximize', 'minimize', 'target') DEFAULT 'maximize',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS doe_experiment_factors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id INT NOT NULL,
        factor_id INT NOT NULL,
        low_level DOUBLE,
        high_level DOUBLE,
        center_point DOUBLE,
        INDEX idx_doe_ef_experiment (experiment_id),
        UNIQUE KEY uq_exp_factor (experiment_id, factor_id)
      );

CREATE TABLE IF NOT EXISTS doe_experiment_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id INT NOT NULL,
        response_id INT NOT NULL,
        goal ENUM('maximize', 'minimize', 'target') DEFAULT 'maximize',
        target_value DOUBLE,
        INDEX idx_doe_er_experiment (experiment_id),
        UNIQUE KEY uq_exp_response (experiment_id, response_id)
      );

CREATE TABLE IF NOT EXISTS doe_runs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id INT NOT NULL,
        run_number INT NOT NULL,
        run_type ENUM('standard', 'center_point') DEFAULT 'standard',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_doe_runs_experiment (experiment_id)
      );

CREATE TABLE IF NOT EXISTS doe_run_factor_levels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        run_id INT NOT NULL,
        factor_id INT NOT NULL,
        level_value DOUBLE,
        level_coded VARCHAR(5),
        INDEX idx_doe_rfl_run (run_id)
      );

CREATE TABLE IF NOT EXISTS doe_run_measurements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        run_id INT NOT NULL,
        response_id INT NOT NULL,
        measured_value DOUBLE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_doe_rm_run (run_id),
        UNIQUE KEY uq_run_response (run_id, response_id)
      );

CREATE TABLE IF NOT EXISTS doe_analysis_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        experiment_id INT NOT NULL,
        response_id INT,
        results_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_doe_ar_experiment (experiment_id)
      );

DROP TABLE IF EXISTS doe_analysis_results;

DROP TABLE IF EXISTS doe_run_measurements;

DROP TABLE IF EXISTS doe_run_factor_levels;

DROP TABLE IF EXISTS doe_runs;

DROP TABLE IF EXISTS doe_experiment_responses;

DROP TABLE IF EXISTS doe_experiment_factors;

DROP TABLE IF EXISTS doe_responses;

DROP TABLE IF EXISTS doe_factors;

DROP TABLE IF EXISTS doe_experiments;

-- ─── Migration: 20260323000021_expand_design_cycle_tables.js ───
CREATE TABLE IF NOT EXISTS design_requirements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        node_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type ENUM('performance', 'functional', 'constraint', 'interface', 'safety') DEFAULT 'performance',
        priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
        status ENUM('draft', 'active', 'verified', 'deferred') DEFAULT 'draft',
        target_value VARCHAR(100),
        unit VARCHAR(50),
        verification_method VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dr_project (project_id)
      );

CREATE TABLE IF NOT EXISTS design_requirement_traces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        requirement_id INT NOT NULL,
        trace_type ENUM('phase', 'test', 'analysis', 'document') NOT NULL,
        trace_target_id INT,
        trace_target_name VARCHAR(255),
        status ENUM('pending', 'satisfied', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_drt_req (requirement_id)
      );

CREATE TABLE IF NOT EXISTS design_gates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        gate_key VARCHAR(50) NOT NULL,
        gate_name VARCHAR(100) NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'reset') DEFAULT 'pending',
        approved_by VARCHAR(255),
        approved_at TIMESTAMP NULL,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_project_gate (project_id, gate_key)
      );

CREATE TABLE IF NOT EXISTS design_gate_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gate_id INT NOT NULL,
        author VARCHAR(255),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dgc_gate (gate_id)
      );

CREATE TABLE IF NOT EXISTS design_interfaces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        interface_key VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        description TEXT,
        type VARCHAR(50),
        status ENUM('defined', 'approved', 'rejected') DEFAULT 'defined',
        source_node_id INT,
        target_node_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_project_interface (project_id, interface_key)
      );

CREATE TABLE IF NOT EXISTS design_ai_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        overall_score DECIMAL(5,2),
        phase_scores JSON,
        recommendations JSON,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_das_project (project_id)
      );

CREATE TABLE IF NOT EXISTS design_revisions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        revision_number VARCHAR(20) NOT NULL,
        title VARCHAR(255),
        description TEXT,
        lifecycle ENUM('draft', 'review', 'released', 'obsolete') DEFAULT 'draft',
        changed_by VARCHAR(255),
        snapshot_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_drev_project (project_id)
      );

CREATE TABLE IF NOT EXISTS design_learning_loops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        source_phase INT,
        target_phase INT,
        status ENUM('open', 'in_progress', 'completed') DEFAULT 'open',
        outcome TEXT,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dll_project (project_id)
      );

CREATE TABLE IF NOT EXISTS design_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        phase_key VARCHAR(10),
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50),
        file_size INT,
        file_url TEXT,
        metadata JSON,
        uploaded_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dd_project (project_id)
      );

CREATE TABLE IF NOT EXISTS design_nodes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        parent_id INT,
        name VARCHAR(255) NOT NULL,
        node_type ENUM('system', 'subsystem', 'component', 'part', 'assembly') DEFAULT 'component',
        description TEXT,
        status ENUM('active', 'completed', 'archived') DEFAULT 'active',
        sort_order INT DEFAULT 0,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dn_project (project_id),
        INDEX idx_dn_parent (parent_id)
      );

CREATE TABLE IF NOT EXISTS design_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        node_id INT,
        report_type VARCHAR(50) DEFAULT 'standard',
        title VARCHAR(255),
        status ENUM('queued', 'generating', 'completed', 'failed') DEFAULT 'queued',
        config_json JSON,
        result_json JSON,
        artifact_index JSON,
        file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        INDEX idx_drep_project (project_id)
      );

-- (dynamic DROP TABLE removed - not needed for fresh install)

-- ─── Migration: 20260324000001_tier2_core_engineering.js ───
CREATE TABLE IF NOT EXISTS design_phase_gates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        phase_key VARCHAR(10) NOT NULL,
        gate_type VARCHAR(50) NOT NULL,
        gate_name VARCHAR(100) NOT NULL,
        owner_role VARCHAR(100),
        status ENUM('not_required', 'pending', 'approved', 'rejected', 'waived') DEFAULT 'pending',
        approved_by VARCHAR(255),
        approved_at TIMESTAMP NULL,
        rejection_reason TEXT,
        waiver_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_project_phase_gate (project_id, phase_key, gate_type),
        INDEX idx_dpg_project (project_id)
      );

CREATE TABLE IF NOT EXISTS design_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        review_type ENUM('SRR', 'SDR', 'PDR', 'CDR', 'TRR', 'OTHER') NOT NULL,
        review_name VARCHAR(255) NOT NULL,
        description TEXT,
        phase_key VARCHAR(10),
        status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
        scheduled_date DATE,
        completed_date DATE,
        chairperson VARCHAR(255),
        attendees JSON,
        outcome ENUM('pass', 'pass_with_actions', 'fail', 'deferred') NULL,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dr_project (project_id)
      );

CREATE TABLE IF NOT EXISTS design_review_findings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        review_id INT NOT NULL,
        finding_number INT NOT NULL,
        severity ENUM('critical', 'major', 'minor', 'observation') DEFAULT 'minor',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to VARCHAR(255),
        due_date DATE,
        status ENUM('open', 'in_progress', 'resolved', 'verified', 'closed', 'waived') DEFAULT 'open',
        resolution TEXT,
        resolved_at TIMESTAMP NULL,
        verified_by VARCHAR(255),
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_drf_review (review_id)
      );

CREATE TABLE IF NOT EXISTS trade_study_criteria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discovery_object_id INT NOT NULL,
        criterion_name VARCHAR(255) NOT NULL,
        weight DECIMAL(5,2) DEFAULT 1.0,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tsc_object (discovery_object_id)
      );

CREATE TABLE IF NOT EXISTS trade_study_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discovery_object_id INT NOT NULL,
        option_name VARCHAR(255) NOT NULL,
        description TEXT,
        is_baseline BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tso_object (discovery_object_id)
      );

CREATE TABLE IF NOT EXISTS trade_study_scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discovery_object_id INT NOT NULL,
        criterion_id INT NOT NULL,
        option_id INT NOT NULL,
        score INT DEFAULT 0,
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_criterion_option (criterion_id, option_id),
        INDEX idx_tss_object (discovery_object_id)
      );

CREATE TABLE IF NOT EXISTS sop_executions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sop_id INT NOT NULL,
        started_by VARCHAR(255),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        status ENUM('in_progress', 'completed', 'aborted') DEFAULT 'in_progress',
        notes TEXT,
        INDEX idx_se_sop (sop_id)
      );

CREATE TABLE IF NOT EXISTS sop_execution_steps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        execution_id INT NOT NULL,
        step_id INT NOT NULL,
        step_order INT NOT NULL,
        status ENUM('pending', 'completed', 'skipped', 'failed') DEFAULT 'pending',
        completed_by VARCHAR(255),
        completed_at TIMESTAMP NULL,
        sign_off_notes TEXT,
        INDEX idx_ses_execution (execution_id)
      );

-- (dynamic DROP TABLE removed - not needed for fresh install)

-- ─── Migration: 20260324000002_tier3_electronics_pcb.js ───
ALTER TABLE nodes MODIFY COLUMN type
        ENUM('ASSY','SYS','SUBSYS','SUBASSY','COMP','PURCH','DOC',
             'PCB','SCHEMATIC','HARNESS','SENSOR','FIRMWARE','CONNECTOR')
        NOT NULL;

CREATE TABLE IF NOT EXISTS node_electronics_props (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id INT NOT NULL UNIQUE,
        domain ENUM('electrical', 'firmware', 'mechanical', 'mixed') DEFAULT 'electrical',
        voltage_rating VARCHAR(50),
        current_rating VARCHAR(50),
        power_rating VARCHAR(50),
        impedance VARCHAR(50),
        frequency_range VARCHAR(100),
        operating_temp_min DECIMAL(6,2),
        operating_temp_max DECIMAL(6,2),
        package_type VARCHAR(100),
        pin_count INT,
        rohs_compliant BOOLEAN DEFAULT TRUE,
        reach_compliant BOOLEAN,
        lead_free BOOLEAN DEFAULT TRUE,
        esd_sensitivity VARCHAR(50),
        thermal_resistance VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nep_node (node_id)
      );

CREATE TABLE IF NOT EXISTS node_eda_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id INT NOT NULL,
        eda_tool ENUM('kicad', 'altium', 'eagle', 'easyeda', 'orcad', 'cadence', 'other') NOT NULL,
        project_url TEXT,
        schematic_url TEXT,
        pcb_layout_url TEXT,
        bom_url TEXT,
        gerber_url TEXT,
        repo_url TEXT,
        branch VARCHAR(255),
        last_sync_at TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nel_node (node_id)
      );

CREATE TABLE IF NOT EXISTS eda_bom_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        eda_link_id INT NOT NULL,
        node_id INT NOT NULL,
        reference_designator VARCHAR(50),
        component_value VARCHAR(100),
        footprint VARCHAR(100),
        manufacturer VARCHAR(255),
        manufacturer_pn VARCHAR(255),
        distributor VARCHAR(100),
        distributor_pn VARCHAR(255),
        quantity INT DEFAULT 1,
        description TEXT,
        lifecycle_status ENUM('active', 'nrnd', 'obsolete', 'eol', 'unknown') DEFAULT 'unknown',
        last_checked_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ebb_link (eda_link_id),
        INDEX idx_ebb_node (node_id)
      );

CREATE TABLE IF NOT EXISTS component_selections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id INT NOT NULL,
        selected_pn VARCHAR(255) NOT NULL,
        manufacturer VARCHAR(255),
        description TEXT,
        category VARCHAR(100),
        lifecycle_status ENUM('active', 'nrnd', 'obsolete', 'eol', 'unknown') DEFAULT 'active',
        datasheet_url TEXT,
        unit_price DECIMAL(12,4),
        moq INT,
        lead_time_days INT,
        stock_available INT,
        last_price_check TIMESTAMP NULL,
        derating_verified BOOLEAN DEFAULT FALSE,
        derating_notes TEXT,
        thermal_verified BOOLEAN DEFAULT FALSE,
        thermal_margin_percent DECIMAL(5,2),
        selection_rationale TEXT,
        status ENUM('candidate', 'selected', 'approved', 'rejected', 'obsolete') DEFAULT 'candidate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cs_node (node_id)
      );

CREATE TABLE IF NOT EXISTS component_alternates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        selection_id INT NOT NULL,
        alternate_pn VARCHAR(255) NOT NULL,
        manufacturer VARCHAR(255),
        compatibility ENUM('drop_in', 'form_fit', 'functional', 'partial') DEFAULT 'functional',
        notes TEXT,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ca_selection (selection_id)
      );

CREATE TABLE IF NOT EXISTS power_rails (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        node_id INT,
        rail_name VARCHAR(100) NOT NULL,
        nominal_voltage DECIMAL(8,3) NOT NULL,
        voltage_tolerance_percent DECIMAL(5,2) DEFAULT 5.0,
        max_current DECIMAL(8,3),
        source_type ENUM('regulator', 'converter', 'battery', 'external', 'other') DEFAULT 'regulator',
        source_component VARCHAR(255),
        efficiency_percent DECIMAL(5,2) DEFAULT 85.0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pr_project (project_id),
        INDEX idx_pr_node (node_id)
      );

CREATE TABLE IF NOT EXISTS power_consumers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rail_id INT NOT NULL,
        node_id INT,
        consumer_name VARCHAR(255) NOT NULL,
        typical_current_ma DECIMAL(10,3),
        peak_current_ma DECIMAL(10,3),
        duty_cycle_percent DECIMAL(5,2) DEFAULT 100.0,
        operating_mode VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pc_rail (rail_id)
      );

-- (dynamic DROP TABLE removed - not needed for fresh install)

-- ─── Migration: 20260324000003_tier4_git_firmware.js ───
CREATE TABLE IF NOT EXISTS git_repos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        node_id INT,
        repo_name VARCHAR(255) NOT NULL,
        repo_url TEXT NOT NULL,
        provider ENUM('github', 'gitlab', 'bitbucket', 'azure_devops', 'other') DEFAULT 'github',
        default_branch VARCHAR(100) DEFAULT 'main',
        description TEXT,
        language VARCHAR(50),
        last_commit_sha VARCHAR(64),
        last_commit_message TEXT,
        last_commit_author VARCHAR(255),
        last_commit_at TIMESTAMP NULL,
        webhook_secret VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_gr_project (project_id),
        INDEX idx_gr_node (node_id)
      );

CREATE TABLE IF NOT EXISTS git_commits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        repo_id INT NOT NULL,
        commit_sha VARCHAR(64) NOT NULL,
        message TEXT,
        author_name VARCHAR(255),
        author_email VARCHAR(255),
        committed_at TIMESTAMP,
        branch VARCHAR(255),
        files_changed INT DEFAULT 0,
        insertions INT DEFAULT 0,
        deletions INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_repo_sha (repo_id, commit_sha),
        INDEX idx_gc_repo (repo_id),
        INDEX idx_gc_date (committed_at)
      );

CREATE TABLE IF NOT EXISTS firmware_modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id INT NOT NULL,
        repo_id INT,
        module_name VARCHAR(255) NOT NULL,
        current_version VARCHAR(50),
        build_status ENUM('unknown', 'passing', 'failing', 'unstable') DEFAULT 'unknown',
        test_coverage_percent DECIMAL(5,2),
        language VARCHAR(50),
        compiler VARCHAR(100),
        target_platform VARCHAR(100),
        flash_size_kb INT,
        ram_usage_kb INT,
        entry_point VARCHAR(255),
        build_command TEXT,
        flash_command TEXT,
        notes TEXT,
        last_build_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_fm_node (node_id),
        INDEX idx_fm_repo (repo_id)
      );

CREATE TABLE IF NOT EXISTS hw_sw_pin_maps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        fw_node_id INT,
        hw_node_id INT,
        mcu_pin VARCHAR(50) NOT NULL,
        pin_function ENUM('gpio_in', 'gpio_out', 'adc', 'dac', 'pwm', 'uart_tx', 'uart_rx',
                          'spi_mosi', 'spi_miso', 'spi_clk', 'spi_cs', 'i2c_sda', 'i2c_scl',
                          'can_tx', 'can_rx', 'usb_dp', 'usb_dm', 'jtag', 'power', 'ground',
                          'other') DEFAULT 'gpio_in',
        pcb_net_name VARCHAR(100),
        connector_ref VARCHAR(100),
        signal_name VARCHAR(255),
        voltage_level VARCHAR(20),
        direction ENUM('input', 'output', 'bidirectional', 'power') DEFAULT 'input',
        pull_config ENUM('none', 'pull_up', 'pull_down', 'open_drain') DEFAULT 'none',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pm_project (project_id),
        INDEX idx_pm_fw (fw_node_id),
        INDEX idx_pm_hw (hw_node_id)
      );

CREATE TABLE IF NOT EXISTS hw_sw_register_maps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        node_id INT NOT NULL,
        peripheral_name VARCHAR(100) NOT NULL,
        register_name VARCHAR(100) NOT NULL,
        address VARCHAR(20) NOT NULL,
        width_bits INT DEFAULT 8,
        access ENUM('read', 'write', 'read_write', 'write_once') DEFAULT 'read_write',
        reset_value VARCHAR(20),
        description TEXT,
        bit_fields JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rm_node (node_id)
      );

CREATE TABLE IF NOT EXISTS hw_sw_protocols (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        fw_node_id INT,
        hw_node_id INT,
        protocol ENUM('can', 'spi', 'i2c', 'uart', 'usb', 'ethernet', 'lin', 'modbus',
                       'mqtt', 'ble', 'wifi', 'custom') NOT NULL,
        bus_name VARCHAR(100),
        speed_hz INT,
        address VARCHAR(20),
        message_format JSON,
        timing_requirements JSON,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sp_project (project_id)
      );

CREATE TABLE IF NOT EXISTS firmware_builds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        version VARCHAR(50) NOT NULL,
        commit_sha VARCHAR(64),
        build_status ENUM('queued', 'building', 'passed', 'failed') DEFAULT 'queued',
        test_results JSON,
        binary_size_bytes INT,
        build_log TEXT,
        built_at TIMESTAMP NULL,
        built_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fb_module (module_id)
      );

CREATE TABLE IF NOT EXISTS hw_fw_compatibility (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        hw_revision VARCHAR(50) NOT NULL,
        hw_node_id INT,
        fw_version VARCHAR(50) NOT NULL,
        fw_module_id INT,
        compatibility ENUM('full', 'partial', 'incompatible', 'untested') DEFAULT 'untested',
        release_status ENUM('development', 'testing', 'released', 'deprecated') DEFAULT 'development',
        release_notes TEXT,
        released_at TIMESTAMP NULL,
        released_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_hw_fw (project_id, hw_revision, fw_version),
        INDEX idx_hfc_project (project_id)
      );

CREATE TABLE IF NOT EXISTS code_review_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        repo_id INT NOT NULL,
        requirement_id INT,
        pr_number INT,
        pr_url TEXT,
        pr_title VARCHAR(500),
        pr_status ENUM('open', 'merged', 'closed') DEFAULT 'open',
        commit_sha VARCHAR(64),
        review_status ENUM('pending', 'approved', 'changes_requested', 'dismissed') DEFAULT 'pending',
        reviewer VARCHAR(255),
        verification_type ENUM('implements', 'tests', 'fixes', 'documents') DEFAULT 'implements',
        notes TEXT,
        linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_crl_repo (repo_id),
        INDEX idx_crl_req (requirement_id)
      );

-- (dynamic DROP TABLE removed - not needed for fresh install)

-- ─── Migration: 20260324000004_tier5_platform_maturity.js ───
CREATE TABLE IF NOT EXISTS change_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        ecr_number VARCHAR(30) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        reason ENUM('design_improvement', 'cost_reduction', 'field_issue', 'supplier_change',
                     'regulatory', 'manufacturing', 'customer_request', 'other') DEFAULT 'design_improvement',
        priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
        status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'implemented', 'closed') DEFAULT 'draft',
        requested_by VARCHAR(255),
        assigned_to VARCHAR(255),
        affected_nodes JSON,
        affected_requirements JSON,
        impact_analysis TEXT,
        cost_impact TEXT,
        schedule_impact TEXT,
        risk_assessment TEXT,
        submitted_at TIMESTAMP NULL,
        approved_by VARCHAR(255),
        approved_at TIMESTAMP NULL,
        implemented_at TIMESTAMP NULL,
        closed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cr_project (project_id),
        INDEX idx_cr_status (status)
      );

CREATE TABLE IF NOT EXISTS change_request_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        change_request_id INT NOT NULL,
        author VARCHAR(255),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_crc_cr (change_request_id)
      );

CREATE TABLE IF NOT EXISTS change_notices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        change_request_id INT NOT NULL,
        ecn_number VARCHAR(30) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        effectivity_date DATE,
        disposition ENUM('rework', 'scrap', 'use_as_is', 'return_to_vendor') DEFAULT 'rework',
        implementation_steps JSON,
        verification_method TEXT,
        verified_by VARCHAR(255),
        verified_at TIMESTAMP NULL,
        status ENUM('pending', 'in_progress', 'verified', 'closed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cn_cr (change_request_id)
      );

CREATE TABLE IF NOT EXISTS report_jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        report_type ENUM('traceability_matrix', 'phase_summary', 'gate_status',
                         'design_review_pack', 'bom_export', 'power_budget',
                         'test_summary', 'full_design_report') NOT NULL,
        title VARCHAR(255),
        config JSON,
        status ENUM('queued', 'generating', 'completed', 'failed') DEFAULT 'queued',
        result_data JSON,
        file_format ENUM('json', 'csv', 'html') DEFAULT 'json',
        generated_by VARCHAR(255),
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rj_project (project_id)
      );

CREATE TABLE IF NOT EXISTS timeline_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        item_type ENUM('milestone', 'task', 'phase', 'review', 'test', 'delivery') DEFAULT 'task',
        status ENUM('planned', 'in_progress', 'completed', 'blocked', 'cancelled') DEFAULT 'planned',
        assigned_to VARCHAR(255),
        start_date DATE,
        end_date DATE,
        actual_start DATE,
        actual_end DATE,
        percent_complete INT DEFAULT 0,
        node_id INT,
        phase_key VARCHAR(10),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ti_project (project_id)
      );

CREATE TABLE IF NOT EXISTS timeline_dependencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        predecessor_id INT NOT NULL,
        successor_id INT NOT NULL,
        dependency_type ENUM('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish') DEFAULT 'finish_to_start',
        lag_days INT DEFAULT 0,
        UNIQUE KEY uq_dep (predecessor_id, successor_id),
        INDEX idx_td_pred (predecessor_id),
        INDEX idx_td_succ (successor_id)
      );

CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        user_email VARCHAR(255),
        event_type ENUM('gate_approved', 'gate_rejected', 'review_scheduled', 'finding_assigned',
                        'finding_overdue', 'ecr_submitted', 'ecn_issued', 'calibration_due',
                        'share_invite', 'sop_execution_complete', 'build_failed', 'custom') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        link_url TEXT,
        read_at TIMESTAMP NULL,
        delivered_via ENUM('in_app', 'email', 'webhook') DEFAULT 'in_app',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_n_user (user_email),
        INDEX idx_n_unread (user_email, read_at)
      );

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT,
        event_type VARCHAR(50) NOT NULL,
        webhook_url TEXT NOT NULL,
        secret VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        last_triggered_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ws_project (project_id)
      );

-- (dynamic DROP TABLE removed - not needed for fresh install)

-- ─── Record applied migrations ─────────────────────────────────────
INSERT IGNORE INTO _migrations (name) VALUES ('create_nodes_table');
INSERT IGNORE INTO _migrations (name) VALUES ('create_requirements_table');
INSERT IGNORE INTO _migrations (name) VALUES ('create_node_phases');
INSERT IGNORE INTO _migrations (name) VALUES ('create_phase_artifacts');
INSERT IGNORE INTO _migrations (name) VALUES ('create_doe_tables');
INSERT IGNORE INTO _migrations (name) VALUES ('create_projects');
INSERT IGNORE INTO _migrations (name) VALUES ('create_eightd_tables');
INSERT IGNORE INTO _migrations (name) VALUES ('create_teams');
INSERT IGNORE INTO _migrations (name) VALUES ('rename_demo_teams');
INSERT IGNORE INTO _migrations (name) VALUES ('20260322000006_create_node_renders');
INSERT IGNORE INTO _migrations (name) VALUES ('20260322000007_create_node_vendor_info');
INSERT IGNORE INTO _migrations (name) VALUES ('20260322000008_create_eightd_attachments');
INSERT IGNORE INTO _migrations (name) VALUES ('create_auth_tables');
INSERT IGNORE INTO _migrations (name) VALUES ('create_project_members');
INSERT IGNORE INTO _migrations (name) VALUES ('doe_phase1_extensions');
INSERT IGNORE INTO _migrations (name) VALUES ('public_project_share');
INSERT IGNORE INTO _migrations (name) VALUES ('phase_revisions');
INSERT IGNORE INTO _migrations (name) VALUES ('add_project_mode');
INSERT IGNORE INTO _migrations (name) VALUES ('discovery_workspace');
INSERT IGNORE INTO _migrations (name) VALUES ('20260323000004_create_discovery_workspace');
INSERT IGNORE INTO _migrations (name) VALUES ('discovery_phase2');
INSERT IGNORE INTO _migrations (name) VALUES ('20260323000008_fix_demo_render_images');
INSERT IGNORE INTO _migrations (name) VALUES ('20260323000009_remove_demo_renders');
INSERT IGNORE INTO _migrations (name) VALUES ('requirement_derivation_tracking');
INSERT IGNORE INTO _migrations (name) VALUES ('20260323000011_add_project_id_to_doe_eightd');
INSERT IGNORE INTO _migrations (name) VALUES ('20260323000012_investor_contacts');
INSERT IGNORE INTO _migrations (name) VALUES ('20260323000013_create_sop_tables');
INSERT IGNORE INTO _migrations (name) VALUES ('20260323000014_remove_old_heavy_motion_project');
INSERT IGNORE INTO _migrations (name) VALUES ('create_analytics_tables');
INSERT IGNORE INTO _migrations (name) VALUES ('create_early_access_tables');
INSERT IGNORE INTO _migrations (name) VALUES ('create_experiment_shares');
INSERT IGNORE INTO _migrations (name) VALUES ('create_design_cycle_tables');
INSERT IGNORE INTO _migrations (name) VALUES ('create_resources_tables');
INSERT IGNORE INTO _migrations (name) VALUES ('create_doe_experiments_tables');
INSERT IGNORE INTO _migrations (name) VALUES ('expand_design_cycle_tables');
INSERT IGNORE INTO _migrations (name) VALUES ('tier2_core_engineering_value');
INSERT IGNORE INTO _migrations (name) VALUES ('tier3_electronics_pcb_domain');
INSERT IGNORE INTO _migrations (name) VALUES ('tier4_git_firmware_domain');
INSERT IGNORE INTO _migrations (name) VALUES ('tier5_platform_maturity');
