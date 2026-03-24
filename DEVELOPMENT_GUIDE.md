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

---

## What Still Needs to Be Done

### Tier 2 — Core Engineering Value (COMPLETED)

| # | Action | Module | Effort | Status |
|---|--------|--------|--------|--------|
| T2.1 | **Phase gate enforcement** — check-gate endpoint validates questions, gates, and prior phases before advancement | Design Cycle | 3 days | DONE |
| T2.2 | **Traceability matrix engine** — full matrix, CSV export, bidirectional query endpoint | Requirements | 3 days | DONE |
| T2.3 | **Design review workflow** — SRR/PDR/CDR/TRR with findings, action items, severity, sign-off | Design Reviews | 5 days | DONE |
| T2.4 | **Trade study scoring matrix** — weighted criteria, options, batch scoring, ranked results | Trade Studies | 2 days | DONE |
| T2.5 | **SOP execution mode** — sequential step-by-step with sign-off, auto-complete, abort | SOP Execution | 2 days | DONE |

### Tier 3 — Electronics / PCB Domain (New Capability)

| # | Action | Module | Effort | Status |
|---|--------|--------|--------|--------|
| T3.1 | **Add electronics node types** — PCB, SCHEMATIC, HARNESS, SENSOR with electrical properties (voltage, current, impedance, thermal) | Nodes | 3 days | NOT STARTED |
| T3.2 | **EDA tool linking** — Store KiCad/Altium project URLs, import BOM from EDA tools | Nodes + Vendor | 3 days | NOT STARTED |
| T3.3 | **Component selection workflow** — parametric search (Digi-Key/Mouser API), lifecycle checking, derating verification | Vendor | 5 days | NOT STARTED |
| T3.4 | **Power budget tracking** — supply rails, consumers, margin calculations, thermal derating | New module | 3 days | NOT STARTED |
| T3.5 | **Electronics-specific phase gates** — schematic review, layout DRC, SI/PI analysis checkpoints | Design Cycle | 2 days | NOT STARTED |

### Tier 4 — Git / Firmware Domain (New Capability)

| # | Action | Module | Effort | Status |
|---|--------|--------|--------|--------|
| T4.1 | **Git repo linking** — associate repos with project nodes, display commit timeline alongside design phases, link commits to requirement verification | New module | 3 days | NOT STARTED |
| T4.2 | **Firmware node type** — version tracking, build status, test coverage per firmware module | Nodes | 2 days | NOT STARTED |
| T4.3 | **HW-SW interface tracking** — pin maps (MCU pin → PCB net → connector → sensor), register maps, protocol specs (CAN, SPI, I2C, UART), timing requirements | New module | 5 days | NOT STARTED |
| T4.4 | **Build/deploy tracking** — firmware version ↔ hardware revision compatibility matrix, OTA tracking | New module | 3 days | NOT STARTED |
| T4.5 | **Code review linking** — associate GitHub PRs/commits with requirement verification evidence | Requirements | 2 days | NOT STARTED |

### Tier 5 — Platform Maturity (Scale & Polish)

| # | Action | Module | Effort | Status |
|---|--------|--------|--------|--------|
| T5.1 | **Change control workflow** — ECR/ECN with impact analysis, approval chain | New module | 5 days | NOT STARTED |
| T5.2 | **Report auto-generation** — PDF reports from project data (traceability matrix, phase summary, gate status) | Reporting | 5 days | NOT STARTED |
| T5.3 | **Timeline dependency tracking** — critical path, resource allocation, drag-to-reschedule | Timeline | 3 days | NOT STARTED |
| T5.4 | **Real LLM integration** — context-aware AI guidance using actual project data as context | AI Guidance | 3 days | NOT STARTED |
| T5.5 | **Notification system** — email/webhook alerts for gate approvals, overdue items, share invites, calibration due | New module | 5 days | NOT STARTED |
| T5.6 | **Calibration enforcement** — block checkout of uncalibrated equipment | Resources | 1 day | NOT STARTED |

---

## Module Current State Assessment

### Scores (1-10 = useless to production-ready)

| Module | Score | Key Strength | Key Gap |
|--------|-------|-------------|---------|
| **Design Cycle** | 5/10 | Excellent 7-phase config with sub-phases and rigor tiers | No gate enforcement — can skip phases freely |
| **Node Tree** | 6/10 | Good mech BOM hierarchy (7 node types) | No electronics/firmware node types |
| **Requirements** | 5/10 | Derivation chains + verification methods | No traceability matrix, no bidirectional queries |
| **DOE / Statistics** | 7/10 | Proper F-distribution, interactions, residuals | Missing RSM, Box-Behnken, Taguchi |
| **Quality (8D)** | 5/10 | 8-discipline framework | No RCA tools, no action tracking |
| **Resources** | 8.5/10 | Production-ready inventory + checkout | Minor: no barcode scan, no enforcement |
| **Discovery** | 7/10 | 8 object types, maturity tracking | No trade study scoring |
| **SOPs** | 6/10 | Good authoring structure | No execution mode, no approval workflow |
| **Timeline** | 6/10 | Gantt-style monthly view | No dependency tracking |
| **Executive** | 6/10 | Access-gated dashboard | Demo KPIs, no real aggregation |
| **Reporting** | 5/10 | Report library structure | No auto-generation from project data |

### Domain Coverage

| Domain | Coverage | Key Gaps |
|--------|----------|----------|
| **Mechanical** | 70% | Missing: tolerances, materials DB, cost rollup, DFMEA |
| **Electrical/PCB** | 10% | Missing: EDA linking, power budget, SI/PI, component selection |
| **Firmware/Software** | 5% | Missing: git linking, HW-SW interfaces, build tracking |
| **Cross-Domain** | 5% | Missing: constraint propagation, unified BOM, interface language |

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
