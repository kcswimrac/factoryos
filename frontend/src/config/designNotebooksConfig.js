/**
 * Design Notebooks Configuration
 *
 * A design notebook is a diary of the design. It does not need to be neat.
 * It must capture sketches, notes, decisions, and calculations.
 *
 * Each entry is:
 * - Page-numbered (auto-incremented per notebook, with audit for manual override)
 * - Dated (timestamp of creation)
 * - Signed (digitally, by the creating user)
 *
 * RULE: Notebook entries are append-only. Corrections must be new entries
 * that reference prior entries.
 */

// =============================================================================
// NOTEBOOK ENTRY TYPES
// =============================================================================

export const NOTEBOOK_ENTRY_TYPES = {
  NOTE: 'note',
  SKETCH: 'sketch',
  CALCULATION: 'calculation',
  DECISION: 'decision',
  MEETING_NOTES: 'meeting_notes',
  TEST_LOG: 'test_log',
  REFERENCE_POINTER: 'reference_pointer'
};

export const ENTRY_TYPE_CONFIG = {
  note: {
    code: 'note',
    name: 'Note',
    description: 'General engineering note - observations, ideas, quick captures',
    icon: 'FileText',
    color: 'blue',
    allowsAttachments: true,
    allowsArtifactLinks: true
  },
  sketch: {
    code: 'sketch',
    name: 'Sketch',
    description: 'Hand-drawn or whiteboard sketch - concept sketches, layout ideas, problem diagrams',
    icon: 'Pencil',
    color: 'purple',
    allowsAttachments: true,
    allowsArtifactLinks: true,
    requiresImage: true
  },
  calculation: {
    code: 'calculation',
    name: 'Calculation',
    description: 'Hand calculation or formula derivation - load calculations, sizing estimates, sanity checks',
    icon: 'Calculator',
    color: 'green',
    allowsAttachments: true,
    allowsArtifactLinks: true
  },
  decision: {
    code: 'decision',
    name: 'Decision',
    description: 'Formal decision record - trade-off rationale, go/no-go decisions, design choices',
    icon: 'CheckSquare',
    color: 'amber',
    allowsAttachments: true,
    allowsArtifactLinks: true,
    requiresRationale: true
  },
  meeting_notes: {
    code: 'meeting_notes',
    name: 'Meeting Notes',
    description: 'Meeting minutes or discussions - design reviews, vendor meetings, team discussions',
    icon: 'Users',
    color: 'cyan',
    allowsAttachments: true,
    allowsArtifactLinks: true,
    requiresAttendees: true
  },
  test_log: {
    code: 'test_log',
    name: 'Test Log',
    description: 'Test execution notes - lab observations, test setup details, anomalies',
    icon: 'FlaskConical',
    color: 'orange',
    allowsAttachments: true,
    allowsArtifactLinks: true
  },
  reference_pointer: {
    code: 'reference_pointer',
    name: 'Reference Pointer',
    description: 'External reference without embedded content - large CAD files, external reports, shared drive locations',
    icon: 'ExternalLink',
    color: 'slate',
    allowsAttachments: false,
    allowsArtifactLinks: true,
    requiresStorageLink: true
  }
};

// =============================================================================
// NOTEBOOK STATUS
// =============================================================================

export const NOTEBOOK_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived'
};

// =============================================================================
// NOTEBOOK SCOPE
// =============================================================================

export const NOTEBOOK_SCOPE = {
  PROJECT: 'project',  // Project-level notebook (node_id is null)
  NODE: 'node'         // Node-level notebook (node_id is set)
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get entry type configuration
 */
export const getEntryTypeConfig = (entryType) => {
  return ENTRY_TYPE_CONFIG[entryType] || ENTRY_TYPE_CONFIG.note;
};

/**
 * Get color classes for entry type
 */
export const getEntryTypeColorClasses = (entryType) => {
  const config = getEntryTypeConfig(entryType);
  const colorMap = {
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    slate: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
  };
  return colorMap[config.color] || colorMap.blue;
};

/**
 * Compute SHA-256 hash for tamper evidence
 */
export const computeEntryHash = async (entry) => {
  const content = JSON.stringify({
    summary: entry.summary,
    body_markdown: entry.body_markdown,
    linked_artifact_ids: entry.linked_artifact_ids,
    referenced_storage_links: entry.referenced_storage_links,
    entry_type: entry.entry_type,
    entry_date: entry.entry_date
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verify entry hash for tamper detection
 */
export const verifyEntryHash = async (entry) => {
  const computedHash = await computeEntryHash(entry);
  return computedHash === entry.immutable_hash;
};

// =============================================================================
// DEMO DATA
// =============================================================================

export const DEMO_NOTEBOOKS = [
  {
    id: 'notebook-baja-2025-project',
    org_id: 'org-public-demo',
    project_id: 'proj-baja-2025',
    node_id: null, // Project-level notebook
    title: 'Baja 2025 Design Notebook',
    created_by: 'user-demo',
    created_at: '2024-09-05T00:00:00Z',
    status: NOTEBOOK_STATUS.ACTIVE
  },
  {
    id: 'notebook-baja-2025-gearbox',
    org_id: 'org-public-demo',
    project_id: 'proj-baja-2025',
    node_id: 'node-baja-gearbox',
    title: 'Gearbox Design Notebook',
    created_by: 'user-demo',
    created_at: '2024-09-15T00:00:00Z',
    status: NOTEBOOK_STATUS.ACTIVE
  }
];

export const DEMO_NOTEBOOK_ENTRIES = [
  {
    id: 'entry-001',
    notebook_id: 'notebook-baja-2025-project',
    page_number: 1,
    entry_date: '2024-09-05T10:30:00Z',
    signed_by: 'user-demo',
    signed_at: '2024-09-05T10:35:00Z',
    entry_type: NOTEBOOK_ENTRY_TYPES.DECISION,
    summary: 'Gearbox ratio selection rationale',
    body_markdown: `## Decision: Final Drive Ratio Selection

After reviewing the 2024 competition results and terrain analysis, we've decided on a final drive ratio of 8.5:1.

### Factors Considered
- Maximum vehicle speed target: 35 mph
- Engine peak torque RPM: 3600
- Expected terrain mix: 60% technical, 40% high-speed

### Alternatives Evaluated
1. 7.5:1 - Better top speed but insufficient torque for hill climbs
2. 8.5:1 - **Selected** - Best balance for expected course
3. 9.5:1 - Excessive for high-speed sections

### Reference
See trade study DOE-BAJA25-001 for parametric analysis.`,
    linked_artifact_ids: ['artifact-doe-baja25-001'],
    referenced_storage_links: [],
    immutable_hash: 'a1b2c3d4e5f6...'
  },
  {
    id: 'entry-002',
    notebook_id: 'notebook-baja-2025-gearbox',
    page_number: 1,
    entry_date: '2024-09-20T14:00:00Z',
    signed_by: 'user-demo',
    signed_at: '2024-09-20T14:05:00Z',
    entry_type: NOTEBOOK_ENTRY_TYPES.CALCULATION,
    summary: 'Gear face width calculation',
    body_markdown: `## Gear Face Width Sizing

Using Lewis equation for bending stress:

σ = (Wt * Pd) / (F * Y)

Where:
- Wt = tangential load = 450 lbs (from DOE-BAJA25-002)
- Pd = diametral pitch = 10
- Y = Lewis form factor = 0.32 (20° pressure angle, 24 teeth)
- σ_allow = 30,000 psi (4140 steel, hardened)

Solving for F:
F = (Wt * Pd) / (σ_allow * Y)
F = (450 * 10) / (30000 * 0.32)
F = 0.47"

**Result: Minimum face width = 0.5" (rounded up with margin)**

Added 25% safety factor for shock loading → Final face width = 0.625"`,
    linked_artifact_ids: [],
    referenced_storage_links: [],
    immutable_hash: 'b2c3d4e5f6g7...'
  },
  {
    id: 'entry-003',
    notebook_id: 'notebook-baja-2025-gearbox',
    page_number: 2,
    entry_date: '2024-10-01T09:00:00Z',
    signed_by: 'user-demo',
    signed_at: '2024-10-01T09:10:00Z',
    entry_type: NOTEBOOK_ENTRY_TYPES.SKETCH,
    summary: 'Gearbox housing concept layout',
    body_markdown: `## Initial Housing Concept

Whiteboard sketch from design session - see attached image.

Key features:
- Split case design for assembly access
- Integrated oil channels (no external lines)
- Mounting ears aligned with chassis pickup points
- Vent location raised to prevent water ingress

**Action items:**
- [ ] Model in CAD for FEA
- [ ] Check bearing bore concentricity requirements
- [ ] Verify oil fill/drain access`,
    linked_artifact_ids: ['artifact-sketch-housing-001'],
    referenced_storage_links: [],
    immutable_hash: 'c3d4e5f6g7h8...'
  }
];

export default {
  NOTEBOOK_ENTRY_TYPES,
  ENTRY_TYPE_CONFIG,
  NOTEBOOK_STATUS,
  NOTEBOOK_SCOPE,
  getEntryTypeConfig,
  getEntryTypeColorClasses,
  computeEntryHash,
  verifyEntryHash,
  DEMO_NOTEBOOKS,
  DEMO_NOTEBOOK_ENTRIES
};
