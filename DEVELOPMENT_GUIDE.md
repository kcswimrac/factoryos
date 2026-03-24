# FactoryOS Development Guide

## System Goal

FactoryOS is **the operating system for modern manufacturing and hardware engineering**. It provides an integrated platform for engineering, quality, and production teams to manage the full product design lifecycle — from initial requirements through correlation and release — across mechanical, electrical/PCB, and firmware/software domains.

The platform captures the **7-phase engineering design cycle** (Requirements, R&D, Design/CAD+DFS+DFM, Data Collection, Analysis/CAE, Testing/Validation, Correlation) with phase gating, requirements traceability, and AI-assisted guidance.

### Target Users
- Mechanical engineers (CAD, FEA, testing)
- Electrical/PCB engineers (schematic, layout, component selection)
- Firmware/software engineers (embedded code, integration testing)
- Quality engineers (8D, root cause analysis, corrective actions)
- Engineering managers (executive dashboards, project timelines, resource allocation)
- Manufacturing/production teams (SOPs, tool inventory, DFM review)

---

## Architecture

```
factoryos/
├── server.js              Express server (dual-mode: React SPA + vanilla HTML)
├── frontend/              React + Vite + Tailwind (Factory-os UI)
│   ├── src/               100+ React components, services, contexts
│   ├── dist/              Built SPA (/doe, /design, /quality, etc.)
│   └── package.json       Frontend dependencies
├── public/                Vanilla HTML (factoryos-only features)
│   ├── app.html           Node tree editor (560KB)
│   ├── discovery.html     Discovery workspace
│   └── ...                10 more pages
├── routes/                27 API route modules (217+ endpoints)
├── migrations/            31 MySQL migrations
├── utils/                 Statistics engine + design generator
├── middleware/             Auth (JWT) + RBAC + analytics
├── vercel.json            Deployment config
└── .env.example           Environment variable documentation
```

### Key Technical Decisions
- **Backend:** Express.js + MySQL (mysql2/promise)
- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + React Router 7
- **Auth:** JWT tokens with role-based access (admin/editor/viewer)
- **AI:** OpenAI API via Polsia proxy (graceful fallback when not configured)
- **Real-time:** Pusher (optional) for live visitor count
- **Deployment:** Vercel serverless (@vercel/node)

---

## What Has Been Completed

### Phase 0 — MySQL Conversion
- Converted all 29 migrations from PostgreSQL to MySQL syntax
- Converted all 21 route files to use `?` placeholders (from `$1`)
- Updated server.js and migrate.js for mysql2/promise

### Phase 1 — React Frontend Integration
- Copied complete Factory-os React frontend to `frontend/`
- Configured Vite proxy to backend (port 3000)
- Installed React 18.3.1, Vite 5.1.4, Tailwind CSS 3.4.1
- Added early-access signup endpoint + migration

### Phase 2 — Backend Features
- **Statistics engine** (`utils/statistics.js`) — ANOVA with F-distribution p-values, main effects + 2-way interactions, residual diagnostics
- **Design generator** (`utils/designGenerator.js`) — Full/fractional factorial, Plackett-Burman
- **Experiments API** (`routes/experiments.js`) — 8 endpoints for DOE lifecycle
- **Experiment sharing** (`routes/experiment-shares.js`) — Token-based, 3 access levels, activity log
- **Design cycle** (`routes/design-cycle.js`) — 65 endpoints for 7-phase methodology
- **Resources** (`routes/resources-inventory.js`) — Tool/asset inventory, checkout/return
- **Visitors** (`routes/visitors.js`) — REST polling (serverless-compatible)

### Phase 3 — Frontend Pages & Design Cycle API
- Added Tailwind + PostCSS config (CSS now compiles properly)
- Fixed designCycleApi.js base URL for production
- Expanded design-cycle backend to 65 endpoints covering: requirements, gates, interfaces, AI score, revisions, learning loops, documents, project tree/nodes, reports

### Phase 4 — Preserve factoryos-only Features
- Dual-mode server: React SPA + vanilla HTML pages
- 12 vanilla HTML pages preserved (/app, /projects, /discovery, etc.)
- React Header updated with "Engineering Tools" section linking to vanilla pages
- All 27 backend route modules verified and mounted

### Audit Fixes — Vercel Deployment Readiness
- Fixed 5 hardcoded `localhost:3001` URLs in frontend
- Fixed migration timestamp duplicates (000004, 000017)
- Fixed migration ordering bug (discovery_promotions now after discovery_workspace)
- Made visitors.js serverless-compatible
- Added `.catch()` to sops.js transaction rollback
- Added graceful fallbacks for missing OPENAI_API_KEY
- Created `vercel.json` and `.env.example`

### Tier 1 — Statistical & Phase Model Fixes
- **T1.1:** Replaced fake p-value thresholds with proper F-distribution (regularized incomplete beta function via Lentz continued fraction)
- **T1.2:** Fixed `calculateResiduals()` to compute actual model-based predictions (was generating random noise)
- **T1.3:** Added 2-way interaction effects to ANOVA (AB, AC, BC, etc.)
- **T1.4:** Aligned backend to 7-phase model with 3a/3b/3c sub-phases (was incorrectly using 9 flat phases)

### Tier 2 — Core Engineering Value
- **T2.1: Phase gate enforcement** — `POST /api/design/:id/phases/:phaseKey/check-gate` validates: (a) all checklist questions answered, (b) required gates approved/waived, (c) prior phases completed. Returns `{ canAdvance, blockers[] }`. Gate CRUD at `/api/design/:id/phase-gates` with init, approve, reject, waive. Gate types match frontend config (cost, safety, manufacturability, serviceability).
- **T2.2: Traceability matrix engine** — `GET /api/design/:id/traceability-matrix` returns full matrix with verification status rollup (verified/in_progress/not_started), coverage percentages, critical requirement tracking. CSV export at `/export`. Bidirectional query at `/query?requirementId=X&traceType=test&status=satisfied`.
- **T2.3: Design review workflow** — New route `routes/design-reviews.js` mounted at `/api/design/:projectId/reviews`. Supports SRR/SDR/PDR/CDR/TRR review types. Findings with severity (critical/major/minor/observation), assigned_to, due dates, resolution tracking, verification sign-off. Finding summary with overdue count.
- **T2.4: Trade study scoring (Pugh matrix)** — New route `routes/trade-studies.js` mounted at `/api/projects/:projectId/trade-studies`. Weighted criteria, multiple options with baseline indicator, batch score updates, auto-calculated weighted totals and rankings.
- **T2.5: SOP execution mode** — New route `routes/sop-execution.js` mounted at `/api/sops/:sopId/executions`. Start execution session → sequential step sign-off (enforced order) → auto-complete when all steps done. Abort capability. Tracks who completed each step and when.

### Tier 3 — Electronics / PCB Domain
- **T3.1: Electronics node types** — Expanded ENUM with 6 new types: PCB, SCHEMATIC, HARNESS, SENSOR, FIRMWARE, CONNECTOR. New `node_electronics_props` table stores domain, voltage/current/power ratings, impedance, frequency range, operating temps, package type, pin count, RoHS/REACH/lead-free compliance, ESD sensitivity, thermal resistance.
- **T3.2: EDA tool linking** — New `node_eda_links` table supports KiCad, Altium, Eagle, EasyEDA, OrCAD, Cadence. Stores project/schematic/PCB/BOM/Gerber URLs + git repo link. BOM import via `eda_bom_entries` with ref designator, footprint, manufacturer PN, distributor PN, lifecycle status. Routes at `/api/nodes/:nodeId/eda`.
- **T3.3: Component selection** — New `component_selections` table with lifecycle tracking (active/NRND/obsolete/EOL), derating verification flag + notes, thermal verification + margin %, selection rationale, pricing/MOQ/lead time/stock. Second-source tracking via `component_alternates` with compatibility level (drop-in/form-fit/functional/partial). Routes at `/api/nodes/:nodeId/components`.
- **T3.4: Power budget tracking** — New `power_rails` table with nominal voltage, tolerance, max current, source type (regulator/converter/battery/external), efficiency. `power_consumers` with typical/peak current, duty cycle, operating mode. Auto-calculates: typical/peak margins (mA and %), power draw (mW), input power accounting for efficiency, system-level summary. Routes at `/api/power-budget`.
- **T3.5: Electronics phase gates** — 5 new gate types added to GATE_TYPES: schematic_review (phase 3a), pcb_layout_drc (3a), si_pi_analysis (5), emc_precompliance (6), power_budget (4). All enforce via existing check-gate endpoint.

### Tier 4 — Git / Firmware Domain
- **T4.1: Git repo linking** — New `git_repos` table supports GitHub, GitLab, Bitbucket, Azure DevOps. Stores repo URL, default branch, language, last commit metadata. `git_commits` table caches commit history (batch import via webhook or manual sync). Routes at `/api/git/repos` with CRUD + commit import.
- **T4.2: Firmware modules** — New `firmware_modules` table: current_version, build_status (passing/failing/unstable), test_coverage_percent, language, compiler, target_platform, flash_size_kb, ram_usage_kb, entry_point, build_command, flash_command. Linked to repo and node. Routes at `/api/git/firmware`.
- **T4.3: HW-SW interface tracking** — Three new tables: `hw_sw_pin_maps` with 21 pin functions (GPIO, ADC, DAC, PWM, UART, SPI, I2C, CAN, USB, JTAG, etc.), PCB net names, connector references, voltage levels, pull configs. `hw_sw_register_maps` with peripheral name, address, width, access mode, reset value, bit field JSON. `hw_sw_protocols` supporting 12 protocols (CAN, SPI, I2C, UART, USB, Ethernet, LIN, Modbus, MQTT, BLE, WiFi, custom) with speed, address, message format JSON, timing requirements JSON. Routes at `/api/hw-sw`. Batch pin map import for spreadsheet workflows.
- **T4.4: Build/deploy tracking** — `firmware_builds` table with version, commit SHA, build status, test results JSON, binary size, build log. Auto-updates module version/status on new build. `hw_fw_compatibility` matrix: HW revision × FW version with compatibility level (full/partial/incompatible/untested) and release status (development/testing/released/deprecated). Routes at `/api/git/builds` and `/api/git/compatibility`.
- **T4.5: Code review linking** — `code_review_links` table links GitHub/GitLab PRs to requirements. Tracks PR number/URL/title/status, reviewer, review status (pending/approved/changes_requested), verification type (implements/tests/fixes/documents). Enables: "show me all PRs that implement requirement X" queries. Routes at `/api/git/code-reviews`.

### Tier 5 — Platform Maturity
- **T5.1: Change control (ECR/ECN)** — New `routes/change-control.js`. ECR: auto-numbered (ECR-YYYY-NNNN), 8 reason types, priority, status workflow (draft→submitted→under_review→approved→implemented→closed), affected nodes/requirements JSON, impact/cost/schedule/risk analysis fields, comment threads. ECN: created from approved ECRs, auto-numbered (ECN-YYYY-NNNN), effectivity date, disposition (rework/scrap/use_as_is/return_to_vendor), implementation steps JSON, verification sign-off. 8 endpoints.
- **T5.2: Report auto-generation** — New `routes/report-generator.js`. 8 report types: traceability_matrix, phase_summary, gate_status, design_review_pack, bom_export, power_budget, test_summary, full_design_report. Each generates structured JSON from live database queries. CSV export for traceability and BOM. Full design report aggregates all 7 sub-reports. Stored in `report_jobs` table with status tracking. 4 endpoints.
- **T5.3: Timeline dependencies** — New `routes/timeline-deps.js`. Timeline items with 6 types (milestone/task/phase/review/test/delivery), actual vs planned dates, percent complete, node/phase linking. Dependencies with 4 types (FS/SS/FF/SF) + lag. **Critical path algorithm**: topological sort (Kahn's), forward pass (earliest start/finish), backward pass (latest start/finish), slack calculation. 7 endpoints.
- **T5.4: Real LLM integration** — Updated `routes/design-cycle.js` chat endpoint. When OPENAI_API_KEY is set: pulls project name, all phase statuses/progress, requirement counts, gate statuses, chat history (last 10 messages) → builds system prompt with full project context → sends to GPT-4o-mini. Falls back to phase-aware static guidance when AI not configured.
- **T5.5: Notification system** — New `routes/notifications.js`. In-app notifications with 12 event types (gate_approved/rejected, review_scheduled, finding_assigned/overdue, ecr_submitted, ecn_issued, calibration_due, share_invite, sop_execution_complete, build_failed, custom). Read/unread tracking, batch mark-as-read. Webhook subscriptions with HMAC-SHA256 signing, best-effort delivery with 5s timeout. 6 endpoints.
- **T5.6: Calibration enforcement** — Updated `routes/resources-inventory.js` checkout endpoint. Before allowing checkout, checks `calibration_required` and `calibration_due_at`. Returns 400 error with due date if calibration is overdue. Zero-impact on non-calibrated resources.

---

## All Tiers Complete

All 25 action items across 5 tiers have been implemented. The platform now has:
- **300+ API endpoints** across 37 route files
- **35 database migrations** creating 50+ tables
- **Full cross-domain support**: mechanical, electrical/PCB, firmware/software
- **Complete engineering lifecycle**: requirements → design → analysis → test → correlation
- **Enterprise features**: change control, formal reviews, notifications, reports

### Tier 2 — Core Engineering Value (COMPLETED)

| # | Action | Module | Effort | Status |
|---|--------|--------|--------|--------|
| T2.1 | **Phase gate enforcement** — check-gate endpoint validates questions, gates, and prior phases before advancement | Design Cycle | 3 days | DONE |
| T2.2 | **Traceability matrix engine** — full matrix, CSV export, bidirectional query endpoint | Requirements | 3 days | DONE |
| T2.3 | **Design review workflow** — SRR/PDR/CDR/TRR with findings, action items, severity, sign-off | Design Reviews | 5 days | DONE |
| T2.4 | **Trade study scoring matrix** — weighted criteria, options, batch scoring, ranked results | Trade Studies | 2 days | DONE |
| T2.5 | **SOP execution mode** — sequential step-by-step with sign-off, auto-complete, abort | SOP Execution | 2 days | DONE |

### Tier 3 — Electronics / PCB Domain (COMPLETED)

| # | Action | Module | Effort | Status |
|---|--------|--------|--------|--------|
| T3.1 | **Electronics node types** — PCB, SCHEMATIC, HARNESS, SENSOR, FIRMWARE, CONNECTOR + properties table | Nodes + electronics.js | 3 days | DONE |
| T3.2 | **EDA tool linking** — KiCad/Altium/Eagle/EasyEDA/OrCAD + BOM import/export per link | electronics.js | 3 days | DONE |
| T3.3 | **Component selection** — lifecycle status, derating verification, thermal verification, alternates/second-source | electronics.js | 5 days | DONE |
| T3.4 | **Power budget tracking** — rails with source/efficiency, consumers with duty cycle, auto-calculated margins | power-budget.js | 3 days | DONE |
| T3.5 | **Electronics phase gates** — schematic_review, pcb_layout_drc, si_pi_analysis, emc_precompliance, power_budget | design-cycle.js | 2 days | DONE |

### Tier 4 — Git / Firmware Domain (COMPLETED)

| # | Action | Module | Effort | Status |
|---|--------|--------|--------|--------|
| T4.1 | **Git repo linking** — repos with commit history, webhook-ready sync, multi-provider | git-repos.js | 3 days | DONE |
| T4.2 | **Firmware modules** — version, build status, test coverage, compiler, flash/RAM, build/flash commands | git-repos.js | 2 days | DONE |
| T4.3 | **HW-SW interfaces** — pin maps (21 pin functions), register maps with bit fields, 12 protocols with timing | hw-sw-interfaces.js | 5 days | DONE |
| T4.4 | **Build/deploy tracking** — build log + test results, HW↔FW compatibility matrix with release status | git-repos.js | 3 days | DONE |
| T4.5 | **Code review linking** — PRs linked to requirements with verification type (implements/tests/fixes/documents) | git-repos.js | 2 days | DONE |

### Tier 5 — Platform Maturity (COMPLETED)

| # | Action | Module | Effort | Status |
|---|--------|--------|--------|--------|
| T5.1 | **Change control** — ECR/ECN with auto-numbering, impact analysis, approval chain, comments | change-control.js | 5 days | DONE |
| T5.2 | **Report auto-generation** — 8 report types from live data, CSV export, JSON download | report-generator.js | 5 days | DONE |
| T5.3 | **Timeline dependencies** — items with deps, 4 dep types, critical path (forward/backward pass) | timeline-deps.js | 3 days | DONE |
| T5.4 | **Real LLM integration** — context-aware chat with project phases/reqs/gates as context | design-cycle.js | 3 days | DONE |
| T5.5 | **Notifications + webhooks** — in-app notifications, mark-read, webhook subscriptions with HMAC signing | notifications.js | 5 days | DONE |
| T5.6 | **Calibration enforcement** — blocks checkout of overdue calibration resources | resources-inventory.js | 1 day | DONE |

---

## Module Current State Assessment (Post Tier 5)

### Scores (1-10 = useless to production-ready)

| Module | Score | Key Strength | Key Gap |
|--------|-------|-------------|---------|
| **Design Cycle** | 7/10 | 7-phase config + AI chat with project context | No mandatory gate enforcement in UI |
| **Node Tree** | 7/10 | Mech BOM + electronics properties + vendor info | No constraint propagation between nodes |
| **Requirements** | 7.5/10 | Derivation chains + traceability matrix report + traces | No bidirectional live queries (report-only) |
| **DOE / Statistics** | 7/10 | F-distribution, interactions, residuals, constraints | Missing RSM, Box-Behnken, Taguchi |
| **Quality (8D)** | 5/10 | 8-discipline framework | No RCA tools, no action tracking |
| **Resources** | 9/10 | Inventory + checkout + calibration enforcement | Minor: no barcode scan |
| **Discovery** | 8/10 | 8 object types, maturity tracking, trade studies (Pugh) | No weighted scoring export |
| **SOPs** | 7.5/10 | Authoring + execution mode + compliance locking | No e-signature |
| **Timeline** | 8/10 | Dependencies + critical path (forward/backward pass) | No resource leveling |
| **Executive** | 6/10 | Access-gated dashboard | Demo KPIs, no real aggregation |
| **Reporting** | 8/10 | 8 auto-generated report types from live data | No PDF export (JSON/CSV only) |
| **Change Control** | 7.5/10 | ECR/ECN workflow with impact analysis | No approval routing |
| **Notifications** | 7/10 | In-app + webhooks with HMAC signing | No email transport |
| **Git/Firmware** | 7/10 | Firmware modules, builds, HW-FW compat matrix | No CI/CD integration |
| **HW-SW Interface** | 7/10 | Pin maps, register maps, protocols | No auto-generation from EDA |

### Domain Coverage

| Domain | Coverage | Key Gaps |
|--------|----------|----------|
| **Mechanical** | 75% | Missing: tolerances, materials DB, cost rollup, DFMEA |
| **Electrical/PCB** | 55% | Missing: SI/PI analysis, auto-schematic import |
| **Firmware/Software** | 50% | Missing: CI/CD hooks, RTOS task modeling |
| **Cross-Domain** | 35% | Missing: constraint propagation, unified BOM view |

---

## Deep-Dive Audit (2026-03-24) — Findings & Fixes

### CRITICAL Issues (FIXED)

| # | Issue | File | Fix Applied |
|---|-------|------|------------|
| 1 | PostgreSQL `$N` placeholders in MySQL database (~40 instances) | `routes/doe.js` | Replaced all `$${idx++}` with `?` in 6 PUT endpoints |
| 2 | Syntax error: missing backtick + params in DELETE factor | `routes/doe.js:740` | Rewrote to SELECT first then DELETE with proper params |
| 3 | Syntax error: missing backtick + params in DELETE constraint | `routes/doe.js:894` | Same fix as #2 |
| 4 | Enum mismatch: firmware_builds uses `passed/failed`, firmware_modules uses `passing/failing` | `routes/git-repos.js:243` | Added status mapping: `passed→passing`, `failed→failing` |
| 5 | Duplicate SOP migration with conflicting schemas | `migrations/20260323000017b` | Deleted legacy migration file |

### MEDIUM Issues (FIXED)

| # | Issue | File | Fix Applied |
|---|-------|------|------------|
| 6 | BOM export query selected ALL nodes (no project scoping) | `routes/report-generator.js:173` | Scoped to `design_requirements.node_id WHERE project_id = ?` |
| 7 | Critical path topological sort bug: pushed to `sorted` instead of `queue` | `routes/timeline-deps.js:217` | Fixed Kahn's algorithm to enqueue correctly |
| 8 | Missing GET individual firmware module | `routes/git-repos.js` | Added `GET /firmware/:moduleId` |
| 9 | Missing DELETE firmware module | `routes/git-repos.js` | Added `DELETE /firmware/:moduleId` |
| 10 | Missing DELETE firmware build | `routes/git-repos.js` | Added `DELETE /builds/:buildId` |
| 11 | Missing DELETE compatibility entry | `routes/git-repos.js` | Added `DELETE /compatibility/:compatId` |
| 12 | Missing GET individual register map | `routes/hw-sw-interfaces.js` | Added `GET /register-maps/:regId` |
| 13 | Missing GET individual protocol | `routes/hw-sw-interfaces.js` | Added `GET /protocols/:protocolId` |

### Remaining Action Plan (Not Yet Done)

| Priority | Action | Effort | Notes |
|----------|--------|--------|-------|
| HIGH | Add rate limiting to `/api/onboarding/setup` | 1 hour | Unauthenticated endpoint allows unlimited team creation |
| HIGH | Add `req.user` validation on write operations in routes without RBAC | 2 days | 31 of 38 route files rely solely on `optionalAuth` |
| MEDIUM | Document multiple-router mount order for `/api/nodes` | 1 hour | 5 routers share the path — order-dependent |
| MEDIUM | Add DELETE endpoint for electronics properties | 30 min | `DELETE /api/nodes/:nodeId/electronics` |
| LOW | Fill migration number gap (000007-000010) | 30 min | Cosmetic — functionality unaffected |
| LOW | Standardize index naming conventions across migrations | 1 hour | Mix of `idx_table_col` and `table_col_idx` |

---

## Environment Variables

See `.env.example` for the complete list. Critical ones for deployment:

```bash
# Database (required)
DB_HOST=your-mysql-host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=factoryos

# Auth (required)
JWT_SECRET=secure-random-string

# App URL (required for share links)
APP_URL=https://your-app.vercel.app

# AI (optional — features gracefully disabled)
OPENAI_API_KEY=sk-...

# Real-time (optional)
VITE_PUSHER_KEY=your-pusher-key
```

---

## File Reference

### Backend Routes (27 files)
| Route | Path | Endpoints | Phase |
|-------|------|-----------|-------|
| auth | /api/auth | 7 | P0 |
| nodes | /api/nodes | 5 | P0 |
| requirements | /api/requirements | 10 | P0 |
| phases | /api/nodes/:id/phases | 7 | P0 |
| phase-revisions | /api/nodes/:id/phase-revisions | 4 | P0 |
| ai-guidance | /api/nodes/:id/ai-guidance | 2 | P0 |
| discovery | /api/projects/:id/discovery | 16 | P0 |
| discovery-ai | /api/projects/:id/discovery/ai | 3 | P0 |
| doe | /api/doe | 23 | P0 |
| eightd | /api/eightd | 12 | P0 |
| sops | /api/sops | 9 | P0 |
| renders | /api/nodes/:id/renders | 4 | P0 |
| vendor | /api/nodes/:id/vendor | 7 | P0 |
| teams | /api/teams | 4 | P0 |
| projects | /api/projects | 6 | P0 |
| project-members | /api/projects/:id/members | 6 | P0 |
| export | /api/export | 2 | P0 |
| analytics | /api/analytics | 1 | P0 |
| onboarding | /api/onboarding | 2 | P0 |
| public-share | /api/public | 5 | P0 |
| demo-seed | /api/demo/seed | 3 | P0 |
| early-access | /api/early-access | 1 | P1 |
| experiments | /api/experiments | 8 | P2 |
| experiment-shares | /api/experiment-shares | 10 | P2 |
| design-cycle | /api/design | 65 | P2+P3 |
| resources-inventory | /api/resources | 11 | P2 |
| visitors | /api/visitors | 2 | P2 |

### Migrations (31 files)
All in `migrations/` directory, numbered `20260320000001` through `20260323000025`.

### Frontend Pages
- **React SPA:** /, /login, /doe/*, /design/*, /quality/*, /timeline, /sops/*, /reporting/*, /executive, /resources, /share/experiment/*, /shared-with-me, /help
- **Vanilla HTML:** /projects, /app, /discovery, /sops/workspace, /onboarding, /settings, /invest, /share/:token, /login/classic, /reset-password

---

*Last updated: 2026-03-24*
*Session: https://claude.ai/code/session_01LMPNmUFuowUQ7tVC3ZTAkc*
