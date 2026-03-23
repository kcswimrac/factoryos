# FactoryOS Consolidation Plan

> Merge the best of Factory-os (UI, features) into factoryos (reliable backbone).

---

## Phase 0: Switch Database from PostgreSQL to MySQL

The foundational change. factoryos currently uses `pg` with PostgreSQL-specific syntax. Factory-os already runs on MySQL (`mysql2`). Since the factoryos database hasn't been deployed yet, now is the time to switch.

### 0.1 — Swap Driver & Connection

- [ ] Replace `pg` with `mysql2` in `package.json`
- [ ] Update `server.js`: swap `new Pool(...)` → `mysql2/promise.createPool(...)`
- [ ] Update connection config: `DATABASE_URL` → individual `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` env vars
- [ ] Add `.env.example` with MySQL connection template

### 0.2 — Update Migration Runner

- [ ] Rewrite `migrate.js` to use `mysql2/promise` connection
- [ ] Change migration tracking table from PostgreSQL to MySQL syntax
- [ ] Update `npm run build` / `npm run migrate` scripts

### 0.3 — Convert Existing Migrations (PostgreSQL → MySQL)

All 22 migration files need syntax conversion:

| PostgreSQL Feature | MySQL Equivalent |
|---|---|
| `SERIAL PRIMARY KEY` | `INT AUTO_INCREMENT PRIMARY KEY` |
| `$1, $2, $3` params | `?` placeholders |
| `JSONB` columns | `JSON` columns |
| `GIN` indexes | Regular indexes (JSON search via `JSON_CONTAINS`) |
| `@>` containment operator | `JSON_CONTAINS()` function |
| `CREATE TYPE ... AS ENUM` | Inline `ENUM(...)` on column |
| `NOW() + INTERVAL '7 days'` | `DATE_ADD(NOW(), INTERVAL 7 DAY)` |
| `BOOLEAN` | `TINYINT(1)` |
| `TEXT DEFAULT ''` | `TEXT` (MySQL TEXT can't have defaults) |
| `ON UPDATE CURRENT_TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` (same) |

**Migration files to convert:**

- [ ] `20260320000001_create_nodes_table.js`
- [ ] `20260320000002_create_requirements_table.js`
- [ ] `20260320000003_create_node_phases.js`
- [ ] `20260321000001_create_phase_artifacts.js`
- [ ] `20260322000001_create_doe_tables.js`
- [ ] `20260322000002_create_projects.js`
- [ ] `20260322000003_create_eightd_tables.js`
- [ ] `20260322000004_create_teams.js`
- [ ] `20260322000005_rename_demo_teams.js`
- [ ] `20260322000006_create_node_renders.js`
- [ ] `20260322000007_create_node_vendor_info.js`
- [ ] `20260322000008_create_eightd_attachments.js`
- [ ] `20260322000009_create_auth_tables.js`
- [ ] `20260322000010_create_project_members.js`
- [ ] `20260323000001_doe_phase1_extensions.js`
- [ ] `20260323000002_public_project_share.js`
- [ ] `20260323000003_phase_revisions.js`
- [ ] `20260323000004_add_project_mode.js`
- [ ] `20260323000004_create_discovery_workspace.js`
- [ ] `20260323000005_discovery_workspace.js`
- [ ] `20260323000011_discovery_phase2.js`
- [ ] `20260323000012_fix_demo_render_images.js`
- [ ] `20260323000013_remove_demo_renders.js`
- [ ] `20260323000014_requirement_derivation_tracking.js`
- [ ] `20260323000015_add_project_id_to_doe_eightd.js`
- [ ] `20260323000016_investor_contacts.js`
- [ ] `20260323000017_create_sop_tables.js`
- [ ] `20260323000017_create_sops.js`
- [ ] `20260323000018_remove_old_heavy_motion_project.js`

### 0.4 — Convert All Route Query Params

Every route file uses `$1, $2` PostgreSQL params → `?` MySQL placeholders:

- [ ] `routes/auth.js`
- [ ] `routes/projects.js`
- [ ] `routes/nodes.js`
- [ ] `routes/phases.js`
- [ ] `routes/requirements.js`
- [ ] `routes/doe.js`
- [ ] `routes/eightd.js`
- [ ] `routes/teams.js`
- [ ] `routes/project-members.js`
- [ ] `routes/renders.js`
- [ ] `routes/vendor.js`
- [ ] `routes/sops.js`
- [ ] `routes/public-share.js`
- [ ] `routes/phase-revisions.js`
- [ ] `routes/discovery.js`
- [ ] `routes/discovery-ai.js`
- [ ] `routes/ai-guidance.js`
- [ ] `routes/demo-seed.js`
- [ ] `routes/export.js`
- [ ] `routes/onboarding.js`
- [ ] `server.js` (inline queries)

### 0.5 — Add Factory-os Schemas as New Migrations

Port these MySQL schemas from Factory-os into new factoryos migration files:

- [ ] **Experiment sharing** — `experiment_shares`, `experiment_share_activity` tables
- [ ] **Design cycle** — `design_projects`, `design_phases`, `phase_questions`, `design_ai_chats`, `design_documents` tables
- [ ] **Resources** — `resources`, `resource_checkouts`, `resource_attachments` tables + views (`v_resources_availability`, `v_overdue_checkouts`, `v_calibration_due`)
- [ ] **Seed data** — Standard factors, responses, demo user

---

## Phase 1: Add React + Vite Frontend

Replace vanilla HTML pages with a React SPA matching Factory-os's design language.

### 1.1 — Project Setup

- [ ] Add Vite + React + Tailwind CSS to factoryos
- [ ] Configure Vite proxy to forward `/api/*` to Express backend
- [ ] Update `package.json` scripts: `dev` runs both Vite + Express, `build` compiles React
- [ ] Move existing `public/` HTML files to `public/legacy/` (keep as fallback)

### 1.2 — Design System & Theme

- [ ] Port Factory-os CSS variables (dark industrial theme)
  - Backgrounds: `#0F1114`, `#15181C`, `#1C1F24`
  - Borders: `#2A2F36`, `#363C44`
  - Text: `#F0F2F4`, `#B4BAC4`, `#6B7280`
  - Accents: emerald `#10B981`, blue `#3B82F6`
- [ ] Set up Tailwind config with custom color tokens
- [ ] Install Lucide React icon library
- [ ] Create shared components: Button, Badge, Card, Modal, StatsCard

### 1.3 — Landing Page

- [ ] Port `FactoryOSLanding.jsx` — hero, focus strip, featured modules, 7-phase cycle, CTA
- [ ] Port early access form modal with Web3Forms integration
- [ ] Glassmorphism styling: `backdrop-blur-xl`, colored shadows, gradient backgrounds
- [ ] Responsive layout (mobile-first: `sm:`, `lg:` breakpoints)

### 1.4 — Core Layout & Routing

- [ ] Set up React Router with Factory-os's route structure
- [ ] Port `Header.jsx` — fixed navbar, backdrop blur, dropdown menus, tier badges
- [ ] Port `LoginPage.jsx` — adapt to factoryos JWT auth
- [ ] Create `AuthContext` — login/logout/switchOrg, localStorage token management
- [ ] Protected route wrapper (redirect to login if no token)

---

## Phase 2: Port Backend Features from Factory-os

Add the backend logic that Factory-os has but factoryos doesn't.

### 2.1 — Statistics Engine

- [ ] Port `backend/utils/statistics.js` → `utils/statistics.js`
  - `analyzeFullFactorial()` — ANOVA analysis
  - `calculateMainEffect()` — individual factor effects
  - `determineOptimalSettings()` — optimization with confidence intervals
  - `calculateResiduals()` — diagnostic residuals
- [ ] Add analysis API route: `POST /api/doe/experiments/:id/analyze`
- [ ] Store results in `analysis_results` table (JSON columns for ANOVA, effects, residuals)

### 2.2 — Design Generator

- [ ] Port `backend/utils/designGenerator.js` → `utils/designGenerator.js`
  - `generateFullFactorial()` — 2^k designs with center points
  - `generateFractionalFactorial()` — 2^(k-p) reduced designs
  - `generatePlackettBurman()` — screening designs (8, 12, 16, 20 runs)
- [ ] Add generation API: `POST /api/doe/experiments/:id/generate-runs`
- [ ] Auto-generate runs on experiment creation

### 2.3 — Experiment Sharing

- [ ] Port `backend/controllers/experimentShareController.js` → `routes/experiment-shares.js`
  - `POST /api/doe/experiments/:id/share` — create share token
  - `GET /api/share/experiment/:token` — view shared experiment
  - `POST /api/share/experiment/:token/accept` — accept invitation
  - `DELETE /api/doe/experiments/:id/share/:shareId` — revoke
  - `PATCH /api/doe/experiments/:id/share/:shareId` — update access level
- [ ] Token generation: `crypto.randomBytes(32).toString('hex')`
- [ ] Access levels: `view`, `contribute`, `execute`
- [ ] Activity logging in `experiment_share_activity`

### 2.4 — Resource Management

- [ ] Create `routes/resources.js`
  - `GET /api/resources` — list with filters (category, status, calibration)
  - `POST /api/resources` — create resource
  - `PUT /api/resources/:id` — update resource
  - `DELETE /api/resources/:id` — soft delete
  - `POST /api/resources/:id/checkout` — checkout workflow
  - `POST /api/resources/:id/return` — return workflow
  - `POST /api/resources/:id/calibrate` — record calibration
- [ ] Global artifact ID generation: `'RES' + 5 alphanumeric chars`
- [ ] Calibration tracking with due dates and intervals

### 2.5 — Organization Tiers

- [ ] Add tier system to teams/orgs:
  - **Free** — public projects, 1 user, basic DOE
  - **Professional** — private projects, 1 user, full DOE
  - **Team** — team visibility, 5 users, collaboration
  - **Enterprise** — SSO/SAML, unlimited users, executive dashboard
- [ ] Add `tier` column to teams table
- [ ] Create middleware: `requireTier('enterprise')` for gated features
- [ ] Feature flags per tier (max users, visibility options, module access)

---

## Phase 3: Port Frontend Pages

Adapt Factory-os's React components to work with factoryos's MySQL API.

### 3.1 — DOE Module

- [ ] Port `DOEPlatformHome.jsx` — experiment hub with stats cards
- [ ] Port `ExperimentWizard.jsx` — step-by-step experiment creation
- [ ] Port `DesignMatrixPage.jsx` — run matrix with editable measurements
- [ ] Port `AnalysisResultsPage.jsx` — ANOVA table, effect plots, optimal settings
- [ ] Port `ResponseSurfacePage.jsx` — 3D response surface visualization
- [ ] Port `ProcessControlPage.jsx` — control charts
- [ ] Port `ConfirmationRunPage.jsx` — validation runs
- [ ] Add Recharts visualizations: bar charts, Pareto, normal probability plots

### 3.2 — Design Cycle Module

- [ ] Port `DesignCycleHome.jsx` — project list with progress bars
- [ ] Port `DesignCycleWizard.jsx` — 9-phase guided workflow
- [ ] Port `ProjectTreeView.jsx` — hierarchical tree with color-coded icons
- [ ] Port `DesignCycleNewProject.jsx` — project creation form
- [ ] Port `DesignReviewsPage.jsx` — review tracking

### 3.3 — Timeline / Gantt

- [ ] Port `TimelinePage.jsx`
  - Gantt bars with actual vs planned dates
  - Status color coding (green/blue/yellow/red/gray)
  - Milestone markers (diamond icons)
  - Today marker (vertical red line)
  - Expandable project hierarchies
- [ ] Add timeline API: `GET /api/timeline` — aggregates project/phase dates

### 3.4 — Executive Dashboard

- [ ] Port `ExecutiveDashboard.jsx` (enterprise-tier only)
  - KPI statistics with trend indicators
  - Progress bars with threshold-based coloring
  - Violated assumptions tracking
  - 8D case summary
  - SOP request queue
- [ ] Wall mode (large text for physical displays)
- [ ] Auto-refresh every 60 seconds
- [ ] Time range selector (30d, 90d, etc.)

### 3.5 — Resources UI

- [ ] Port `ResourcesHome.jsx`
  - Category badges (Tool, Lab Asset, Fixture, Test Equipment)
  - Status badges (Available, Checked Out, Under Maintenance, Lost)
  - Availability ratio display
  - Calibration status indicators (Overdue, Due Soon, Calibrated)
  - Checkout/return modals
- [ ] Stats cards: total resources, checked out, overdue, calibration due

### 3.6 — Sharing UI

- [ ] Port `SharedExperimentPage.jsx` — public view for shared experiments
- [ ] Port `SharedWithMePage.jsx` — list of experiments shared with current user
- [ ] Share dialog in experiment detail page

### 3.7 — Quality Module

- [ ] Port `QualityDashboard.jsx` — quality case overview
- [ ] Port `QualityCaseDetail.jsx` — 8D case detail view

### 3.8 — Reporting Module

- [ ] Port `ReportingDashboard.jsx` — report generation hub
- [ ] Port `Baja2025DesignReport.jsx` — sample report template

---

## Phase 4: Preserve factoryos-Only Features

Ensure nothing is lost from the existing factoryos codebase during the React migration.

### 4.1 — Node Tree Editor

- [ ] Recreate `app.html` functionality in React
  - Left sidebar: collapsible node tree with drag-drop
  - Main panel: node details, properties, linked nodes
  - Part number system with node type hierarchy (ASSY, SYS, SUBSYS, etc.)
- [ ] Keep RBAC integration (admin/editor/viewer per project)

### 4.2 — Discovery Workspace

- [ ] Recreate `discovery.html` in React
  - AI-assisted research workspace
  - Chat interface with OpenAI integration
  - Phase-aware context for AI guidance
- [ ] Preserve all discovery API routes

### 4.3 — Requirements Traceability

- [ ] Port requirements management with derivation tracking
  - Parent → child requirement derivation
  - Traceability matrix
  - Status tracking per requirement

### 4.4 — Phase Revision History

- [ ] Port phase revision system
  - Version history for each phase
  - Diff view between revisions
  - Rollback capability

### 4.5 — SOP System

- [ ] Recreate `sops.html` in React
  - SOP list with search/filter
  - SOP detail view with steps, tools, hazards
  - Linked nodes via JSONB
  - Create/edit/archive workflows

### 4.6 — Public Share Links

- [ ] Recreate `/share/:token` page in React
  - Read-only public project view
  - No auth required

---

## Dependency Map

```
Phase 0 (MySQL)
   └──→ Phase 1 (React frontend)
           ├──→ Phase 3 (Port frontend pages)
           └──→ Phase 4 (Preserve factoryos features)
        Phase 2 (Port backend features)
           └──→ Phase 3 (Port frontend pages)
```

Phase 0 must be done first. Phase 1 and Phase 2 can run in parallel. Phases 3 and 4 depend on both being complete.

---

## Tech Stack (Final)

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts |
| Routing | React Router v6 |
| Backend | Express.js |
| Database | MySQL (mysql2/promise) |
| Auth | JWT + bcryptjs |
| AI | OpenAI API |
| Real-time | Pusher (optional) |
| Deployment | Render |
