/**
 * Demo SOPs Data (ALPHA) — SCOPE-BASED
 *
 * SOPs are executable engineering intent, not static documents.
 * An SOP does not require a project or a node. An SOP requires scope.
 * Every SOP must declare exactly one scope type.
 *
 * SOP Scope Types:
 * - global: Platform-wide procedure applicable to all orgs
 * - org: Organization-level, not tied to any project
 * - project: Project-level, not tied to any node
 * - node: Tied to a specific node (any revision)
 * - node_revision: Tied to a specific node+revision
 * - asset_site: Tied to a physical asset or site
 *
 * SOP Types:
 * - manufacturing: Part fabrication procedures
 * - assembly: Component integration procedures
 * - test_execution: Test procedure instructions
 * - service: Field service and maintenance
 * - inspection: Quality inspection procedures
 * - rework_containment: Corrective action procedures (8D-linked)
 */

// =============================================================================
// SOP TYPE DEFINITIONS
// =============================================================================

export const SOP_TYPES = {
  MANUFACTURING: 'manufacturing',
  ASSEMBLY: 'assembly',
  TEST_EXECUTION: 'test_execution',
  SERVICE: 'service',
  INSPECTION: 'inspection',
  REWORK_CONTAINMENT: 'rework_containment',
  COOKING: 'cooking'  // General cooking/food preparation procedures
};

export const SOP_SCOPE_TYPES = {
  GLOBAL: 'global',
  ORG: 'org',
  PROJECT: 'project',
  NODE: 'node',
  NODE_REVISION: 'node_revision',
  ASSET_SITE: 'asset_site'
};

// Visibility scope - who can see/access the SOP
export const VISIBILITY_SCOPE = {
  USER: 'user',           // Private to the creator
  ORG_GROUP: 'org_group', // Visible to members of a specific org group
  ORG: 'org',             // Visible to all organization members
  PUBLIC: 'public'        // Visible to everyone (read-only for non-members)
};

export const SOP_STATUS = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  OBSOLETE: 'obsolete'
};

export const EVIDENCE_TYPES = {
  PHOTO: 'photo',
  MEASUREMENT: 'measurement',
  LOG: 'log',
  SIGNATURE: 'signature',
  CHECKLIST: 'checklist',
  NONE: 'none'
};

export const WARNING_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// =============================================================================
// DEMO SOPs - GLOBAL (Platform-Wide)
// =============================================================================

export const DEMO_SOPS_GLOBAL = [
  // Global SOP: ESD Handling Procedure
  {
    id: 'sop-global-001',
    global_artifact_id: 'SOP00010',
    sop_scope_type: SOP_SCOPE_TYPES.GLOBAL,
    visibility_scope: VISIBILITY_SCOPE.PUBLIC,  // Global SOPs are public
    visibility_org_group_id: null,
    // No org, project, or node - this is global
    scope_org_id: null,
    scope_project_id: null,
    scope_node_id: null,
    scope_node_revision_id: null,
    sop_type: SOP_TYPES.MANUFACTURING,
    title: 'ESD Handling Procedure',
    purpose: 'Standard procedure for handling electrostatic discharge (ESD) sensitive components. Applicable to all organizations working with electronic assemblies, PCBs, and sensitive semiconductors.',
    status: SOP_STATUS.APPROVED,

    preconditions: [
      { id: 'pre-1', description: 'ESD workstation set up and grounded', verification_method: 'Visual check of grounding connection' },
      { id: 'pre-2', description: 'ESD wrist strap available and tested', verification_method: 'Wrist strap tester verification' },
      { id: 'pre-3', description: 'ESD-safe packaging available for components', verification_method: 'Visual check' }
    ],

    required_tools: [
      { id: 'tool-1', tool_name: 'ESD wrist strap', tool_id: null, specification: '1MΩ resistor, tested daily' },
      { id: 'tool-2', tool_name: 'ESD mat', tool_id: null, specification: 'Grounded to common point' },
      { id: 'tool-3', tool_name: 'ESD-safe containers', tool_id: null, specification: 'Pink or black conductive' },
      { id: 'tool-4', tool_name: 'Ionizer', tool_id: null, specification: 'For isolated workstations' }
    ],

    required_parts: [],

    safety_warnings: [
      { id: 'warn-1', level: WARNING_LEVELS.MEDIUM, warning_text: 'ESD damage is invisible and cumulative. Components may function initially but fail prematurely.', ppe_required: ['ESD smock'] },
      { id: 'warn-2', level: WARNING_LEVELS.LOW, warning_text: 'Do not handle ESD-sensitive items without grounding', ppe_required: [] }
    ],

    steps: [
      { id: 'step-1', step_number: 1, instruction: 'Test ESD wrist strap using wrist strap tester. Green light indicates pass. Do not proceed if red.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 1, step_image_url: null },
      { id: 'step-2', step_number: 2, instruction: 'Connect wrist strap to grounded mat or common point ground. Ensure metal contact with skin.', verification_required: true, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 1, step_image_url: null },
      { id: 'step-3', step_number: 3, instruction: 'Remove ESD-sensitive components from packaging only at ESD workstation. Keep components on ESD mat.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 2, step_image_url: null },
      { id: 'step-4', step_number: 4, instruction: 'When transporting ESD-sensitive items, use ESD-safe bags or containers. Never transport unprotected.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 1, step_image_url: null },
      { id: 'step-5', step_number: 5, instruction: 'Return all unused components to ESD-safe packaging before removing wrist strap.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 2, step_image_url: null }
    ],

    acceptance_criteria: [
      { id: 'acc-1', criterion: 'Wrist strap tested and passed before handling', requirement_id: null, verification: 'Wrist strap tester' },
      { id: 'acc-2', criterion: 'All ESD-sensitive items stored in ESD-safe containers', requirement_id: null, verification: 'Visual inspection' }
    ],

    evidence_to_capture: [
      { id: 'ev-1', type: EVIDENCE_TYPES.CHECKLIST, description: 'ESD wrist strap test log', mandatory: true }
    ],

    linked_artifacts: [],

    created_by: 'system',
    created_by_name: 'System Admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    approved_by: 'system-admin',
    approved_at: '2024-01-15T00:00:00Z'
  },

  // Global SOP: PPE Requirements
  {
    id: 'sop-global-002',
    global_artifact_id: 'SOP00011',
    sop_scope_type: SOP_SCOPE_TYPES.GLOBAL,
    visibility_scope: VISIBILITY_SCOPE.PUBLIC,  // Global SOPs are public
    visibility_org_group_id: null,
    scope_org_id: null,
    scope_project_id: null,
    scope_node_id: null,
    scope_node_revision_id: null,
    sop_type: SOP_TYPES.INSPECTION,
    title: 'General PPE Requirements',
    purpose: 'Standard procedure for selecting and using appropriate Personal Protective Equipment (PPE) in manufacturing and assembly environments. All personnel must follow these requirements.',
    status: SOP_STATUS.APPROVED,

    preconditions: [
      { id: 'pre-1', description: 'PPE available and in serviceable condition', verification_method: 'Visual inspection' },
      { id: 'pre-2', description: 'Worker trained on proper PPE use', verification_method: 'Training record' }
    ],

    required_tools: [],

    required_parts: [],

    safety_warnings: [
      { id: 'warn-1', level: WARNING_LEVELS.HIGH, warning_text: 'Failure to wear appropriate PPE may result in serious injury. Compliance is mandatory.', ppe_required: [] }
    ],

    steps: [
      { id: 'step-1', step_number: 1, instruction: 'Identify hazards in work area: chemical, mechanical, electrical, thermal, noise, optical.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 5, step_image_url: null },
      { id: 'step-2', step_number: 2, instruction: 'Select PPE appropriate for identified hazards per PPE Selection Matrix (see linked document).', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 3, step_image_url: null },
      { id: 'step-3', step_number: 3, instruction: 'Inspect PPE before use. Check for damage, wear, expiration dates. Do not use damaged PPE.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 2, step_image_url: null },
      { id: 'step-4', step_number: 4, instruction: 'Don PPE properly. Ensure proper fit and coverage. Safety glasses must have side shields.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 2, step_image_url: null },
      { id: 'step-5', step_number: 5, instruction: 'Maintain PPE during use. Replace if damaged or contaminated. Report defective PPE immediately.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 0, step_image_url: null }
    ],

    acceptance_criteria: [
      { id: 'acc-1', criterion: 'Appropriate PPE selected for all identified hazards', requirement_id: null, verification: 'Supervisor verification' },
      { id: 'acc-2', criterion: 'PPE in serviceable condition with no damage', requirement_id: null, verification: 'Visual inspection' }
    ],

    evidence_to_capture: [
      { id: 'ev-1', type: EVIDENCE_TYPES.CHECKLIST, description: 'PPE selection checklist', mandatory: true }
    ],

    linked_artifacts: [],

    created_by: 'system',
    created_by_name: 'System Admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    approved_by: 'system-admin',
    approved_at: '2024-01-15T00:00:00Z'
  }
];

// =============================================================================
// DEMO SOPs - ORGANIZATION (Org-Wide)
// =============================================================================

export const DEMO_SOPS_ORG = [
  // Organization SOP: Torque Wrench Calibration
  {
    id: 'sop-org-001',
    global_artifact_id: 'SOP00020',
    sop_scope_type: SOP_SCOPE_TYPES.ORG,
    visibility_scope: VISIBILITY_SCOPE.ORG,  // Visible to all org members
    visibility_org_group_id: null,
    scope_org_id: 'org-baja',
    org_name: 'Baja Racing',
    scope_project_id: null,
    scope_node_id: null,
    scope_node_revision_id: null,
    sop_type: SOP_TYPES.INSPECTION,
    title: 'Torque Wrench Calibration Verification',
    purpose: 'Organization-wide procedure for verifying torque wrench calibration before use. Applies to all projects within the organization. Ensures accurate fastener torque for safety-critical applications.',
    status: SOP_STATUS.APPROVED,

    preconditions: [
      { id: 'pre-1', description: 'Calibration standard (proving unit) available', verification_method: 'Equipment check' },
      { id: 'pre-2', description: 'Torque wrench clean and in good mechanical condition', verification_method: 'Visual inspection' }
    ],

    required_tools: [
      { id: 'tool-1', tool_name: 'Torque calibration proving unit', tool_id: 'CAL-TRQ-001', specification: 'Traceable to NIST, calibration current' },
      { id: 'tool-2', tool_name: 'Calibration log book', tool_id: null, specification: 'Form CAL-001' }
    ],

    required_parts: [],

    safety_warnings: [
      { id: 'warn-1', level: WARNING_LEVELS.MEDIUM, warning_text: 'Using uncalibrated tools can lead to fastener failure. Verify calibration before critical work.', ppe_required: [] }
    ],

    steps: [
      { id: 'step-1', step_number: 1, instruction: 'Check calibration sticker on torque wrench. If expired or missing, do not use until recalibrated.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 1, step_image_url: null },
      { id: 'step-2', step_number: 2, instruction: 'Connect torque wrench to proving unit. Ensure square drive fully engaged.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 1, step_image_url: null },
      { id: 'step-3', step_number: 3, instruction: 'Apply torque at 20%, 60%, and 100% of wrench capacity. Record proving unit readings.', verification_required: true, evidence_required: EVIDENCE_TYPES.MEASUREMENT, expected_duration_minutes: 5, step_image_url: null },
      { id: 'step-4', step_number: 4, instruction: 'Calculate error percentage: (Indicated - Actual) / Actual × 100%. Acceptable: ±4% at all points.', verification_required: true, evidence_required: EVIDENCE_TYPES.LOG, expected_duration_minutes: 3, step_image_url: null },
      { id: 'step-5', step_number: 5, instruction: 'If within tolerance, log verification and proceed with work. If out of tolerance, quarantine tool for recalibration.', verification_required: true, evidence_required: EVIDENCE_TYPES.LOG, expected_duration_minutes: 2, step_image_url: null }
    ],

    acceptance_criteria: [
      { id: 'acc-1', criterion: 'Torque wrench within ±4% at all test points', requirement_id: null, verification: 'Proving unit measurement' },
      { id: 'acc-2', criterion: 'Calibration sticker current (within 12 months)', requirement_id: null, verification: 'Visual inspection' }
    ],

    evidence_to_capture: [
      { id: 'ev-1', type: EVIDENCE_TYPES.PHOTO, description: 'Calibration sticker', mandatory: true },
      { id: 'ev-2', type: EVIDENCE_TYPES.MEASUREMENT, description: 'Proving unit readings at 20%, 60%, 100%', mandatory: true },
      { id: 'ev-3', type: EVIDENCE_TYPES.LOG, description: 'Verification result (pass/fail)', mandatory: true }
    ],

    linked_artifacts: [],

    created_by: 'user-001',
    created_by_name: 'Quality Manager',
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-15T10:00:00Z',
    approved_by: 'org-admin',
    approved_at: '2024-09-10T00:00:00Z'
  },

  // Organization SOP: Shop Cleanliness
  {
    id: 'sop-org-002',
    global_artifact_id: 'SOP00021',
    sop_scope_type: SOP_SCOPE_TYPES.ORG,
    visibility_scope: VISIBILITY_SCOPE.ORG,  // Visible to all org members
    visibility_org_group_id: null,
    scope_org_id: 'org-ebus',
    org_name: 'Electric Vehicles Inc',
    scope_project_id: null,
    scope_node_id: null,
    scope_node_revision_id: null,
    sop_type: SOP_TYPES.INSPECTION,
    title: 'Daily Shop Cleanliness Inspection',
    purpose: 'Organization-wide procedure for daily inspection of shop cleanliness and organization. 5S compliance check applicable to all work areas and projects.',
    status: SOP_STATUS.APPROVED,

    preconditions: [
      { id: 'pre-1', description: 'End of shift or designated inspection time', verification_method: 'Schedule check' },
      { id: 'pre-2', description: '5S inspection checklist available', verification_method: 'Form check' }
    ],

    required_tools: [
      { id: 'tool-1', tool_name: '5S Inspection Checklist', tool_id: null, specification: 'Form 5S-001' }
    ],

    required_parts: [],

    safety_warnings: [
      { id: 'warn-1', level: WARNING_LEVELS.LOW, warning_text: 'Slip/trip hazards from cluttered workspace', ppe_required: ['Safety shoes'] }
    ],

    steps: [
      { id: 'step-1', step_number: 1, instruction: 'Sort: Verify no unnecessary items in work area. Red-tag items that do not belong.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 5, step_image_url: null },
      { id: 'step-2', step_number: 2, instruction: 'Set in Order: All tools returned to designated locations. Shadow boards complete.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 5, step_image_url: null },
      { id: 'step-3', step_number: 3, instruction: 'Shine: Work surfaces clean. Floor swept. No spills or debris.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 5, step_image_url: null },
      { id: 'step-4', step_number: 4, instruction: 'Standardize: Labeling consistent. Visual controls in place and visible.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 3, step_image_url: null },
      { id: 'step-5', step_number: 5, instruction: 'Sustain: Note any systemic issues. Log and escalate recurring problems.', verification_required: true, evidence_required: EVIDENCE_TYPES.LOG, expected_duration_minutes: 2, step_image_url: null }
    ],

    acceptance_criteria: [
      { id: 'acc-1', criterion: 'All 5S categories pass daily inspection', requirement_id: null, verification: 'Checklist sign-off' },
      { id: 'acc-2', criterion: 'No safety hazards present', requirement_id: null, verification: 'Visual inspection' }
    ],

    evidence_to_capture: [
      { id: 'ev-1', type: EVIDENCE_TYPES.CHECKLIST, description: '5S daily inspection form', mandatory: true }
    ],

    linked_artifacts: [],

    created_by: 'user-006',
    created_by_name: 'Shop Supervisor',
    created_at: '2024-08-01T00:00:00Z',
    updated_at: '2024-08-15T10:00:00Z',
    approved_by: 'org-admin',
    approved_at: '2024-08-10T00:00:00Z'
  }
];

// =============================================================================
// DEMO SOPs - BAJA 2025 (Node-Scoped)
// =============================================================================

export const DEMO_SOPS_BAJA_2025 = [
  // 1. Manufacturing SOP: Weld Fixture Setup and Tack Sequence
  {
    id: 'sop-baja-001',
    global_artifact_id: 'SOP00001',
    sop_scope_type: SOP_SCOPE_TYPES.NODE_REVISION,
    visibility_scope: VISIBILITY_SCOPE.ORG,  // Visible to all org members
    visibility_org_group_id: null,
    scope_org_id: 'org-baja',
    org_id: 'org-baja',
    scope_project_id: 'proj-baja-2025',
    project_id: 'proj-baja-2025',
    project_name: 'Baja 2025',
    scope_node_id: 'node-chassis-weldment',
    scope_part_number: 'BAJA25-CH-110', // Maps to Frame Weldment in demo project
    node_id: 'node-chassis-weldment',
    node_name: 'Frame Weldment',
    scope_node_revision_id: 'rev-chassis-a',
    node_revision_id: 'rev-chassis-a',
    node_revision: 'A',
    sop_type: SOP_TYPES.MANUFACTURING,
    title: 'Weld Fixture Setup and Tack Sequence',
    purpose: 'Standard setup procedure for chassis weld fixture prior to tack welding. This SOP ensures consistent tube alignment and weld quality across all chassis builds. Must be executed by certified welders only.',
    status: SOP_STATUS.DRAFT,

    preconditions: [
      { id: 'pre-1', description: 'Weld fixture FIX-001 available and calibration current (within 90 days)', verification_method: 'Visual check of calibration sticker' },
      { id: 'pre-2', description: 'All tube components cut to length per drawing DWG-CHASSIS-001', verification_method: 'Dimensional verification against cut list' },
      { id: 'pre-3', description: 'Welder certified for steel MIG welding per AWS D1.1', verification_method: 'Certification check in training database' },
      { id: 'pre-4', description: 'Welding area clean and free of flammable materials', verification_method: 'Area inspection' }
    ],

    required_tools: [
      { id: 'tool-1', tool_name: 'MIG welder', tool_id: 'TOOL-MIG-001', specification: 'Miller 251 or equivalent with 0.030" ER70S-6 wire' },
      { id: 'tool-2', tool_name: 'Dial caliper', tool_id: 'TOOL-CAL-001', specification: '0-6" range, 0.001" resolution, calibration current' },
      { id: 'tool-3', tool_name: 'Hex key set', tool_id: null, specification: '3/16" required for fixture clamps' },
      { id: 'tool-4', tool_name: 'Torque wrench', tool_id: 'TOOL-TRQ-001', specification: '10-50 ft-lbs range, calibration current' },
      { id: 'tool-5', tool_name: 'Wire brush', tool_id: null, specification: 'Stainless steel bristles for pre-weld cleaning' },
      { id: 'tool-6', tool_name: 'Angle grinder', tool_id: null, specification: 'With flap disc for tack grinding if needed' }
    ],

    required_parts: [
      { id: 'part-1', part_number: 'TUBE-MAIN-001', node_id: null, quantity: 2, description: 'Main frame tube 1.5" OD x 0.120" wall' },
      { id: 'part-2', part_number: 'TUBE-CROSS-002', node_id: null, quantity: 4, description: 'Cross member tube 1.25" OD x 0.095" wall' },
      { id: 'part-3', part_number: 'GUSSET-001', node_id: null, quantity: 8, description: 'Corner gusset 0.125" steel plate' }
    ],

    safety_warnings: [
      { id: 'warn-1', level: WARNING_LEVELS.HIGH, warning_text: 'Full welding PPE required: auto-darkening helmet (shade 10+), leather gloves, welding jacket, safety glasses underneath', ppe_required: ['Welding helmet', 'Leather gloves', 'Welding jacket', 'Safety glasses'] },
      { id: 'warn-2', level: WARNING_LEVELS.MEDIUM, warning_text: 'Ensure adequate ventilation - welding fumes are hazardous. Use local exhaust ventilation or respirator.', ppe_required: ['Respirator if ventilation inadequate'] },
      { id: 'warn-3', level: WARNING_LEVELS.LOW, warning_text: 'Hot metal - allow 15 minutes cooling before handling bare-handed', ppe_required: [] }
    ],

    steps: [
      { id: 'step-1', step_number: 1, instruction: 'Inspect weld fixture FIX-001 for damage, debris, and wear. Clean all locating surfaces with wire brush. Verify all clamp mechanisms operate smoothly.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 5 },
      { id: 'step-2', step_number: 2, instruction: 'Verify fixture calibration sticker is current (within 90 days). Record calibration date and next due date in production log.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 2 },
      { id: 'step-3', step_number: 3, instruction: 'Load primary main tube into fixture location A. Ensure tube seats fully against all three locator pins. Tube end should be flush with datum face.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 3 },
      { id: 'step-4', step_number: 4, instruction: 'Engage fixture clamps in sequence: C1, C2, C3. Torque each clamp to 15 ft-lbs using calibrated torque wrench. Record all torque values in log.', verification_required: true, evidence_required: EVIDENCE_TYPES.LOG, expected_duration_minutes: 5 },
      { id: 'step-5', step_number: 5, instruction: 'Verify tube position at datum points D1, D2, D3 using dial caliper. All dimensions must be within ±0.5mm of nominal per DWG-CHASSIS-001. Record all measurements.', verification_required: true, evidence_required: EVIDENCE_TYPES.MEASUREMENT, expected_duration_minutes: 8 },
      { id: 'step-6', step_number: 6, instruction: 'Tack weld at locations T1, T2, T3 per drawing DWG-CHASSIS-001. Use 1/4" tack welds with 75A, 18V settings. Allow 30 seconds cooling between tacks.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 10 }
    ],

    acceptance_criteria: [
      { id: 'acc-1', criterion: 'Tube alignment within ±0.5mm at all datum points D1, D2, D3', requirement_id: 'REQ-FRAME-001', verification: 'Dimensional measurement with dial caliper' },
      { id: 'acc-2', criterion: 'Tack welds free of visible porosity, cracks, and undercut', requirement_id: 'REQ-WELD-001', verification: 'Visual inspection per AWS D1.1' },
      { id: 'acc-3', criterion: 'All fixture clamps properly engaged and torqued to 15 ±1 ft-lbs', requirement_id: null, verification: 'Torque wrench verification' },
      { id: 'acc-4', criterion: 'Tack weld size 1/4" ±1/16"', requirement_id: 'REQ-WELD-002', verification: 'Fillet weld gauge' }
    ],

    evidence_to_capture: [
      { id: 'ev-1', type: EVIDENCE_TYPES.PHOTO, description: 'Fixture condition before loading - show cleanliness and calibration sticker', mandatory: true },
      { id: 'ev-2', type: EVIDENCE_TYPES.PHOTO, description: 'Calibration sticker close-up with date visible', mandatory: true },
      { id: 'ev-3', type: EVIDENCE_TYPES.MEASUREMENT, description: 'Datum point measurements D1, D2, D3 with actual values', mandatory: true },
      { id: 'ev-4', type: EVIDENCE_TYPES.PHOTO, description: 'Completed tack welds at T1, T2, T3', mandatory: true },
      { id: 'ev-5', type: EVIDENCE_TYPES.LOG, description: 'Torque values for all clamps C1, C2, C3', mandatory: false }
    ],

    linked_artifacts: [
      { id: 'link-1', artifact_type: 'fixture', artifact_id: 'fix-chassis-001', artifact_name: 'FIX-001: Chassis Weld Fixture', link_purpose: 'Required fixture for setup' },
      { id: 'link-2', artifact_type: 'requirement', artifact_id: 'req-frame-001', artifact_name: 'REQ-FRAME-001: Frame Dimensional Tolerance', link_purpose: 'Defines acceptance criteria for tube alignment' },
      { id: 'link-3', artifact_type: 'requirement', artifact_id: 'req-weld-001', artifact_name: 'REQ-WELD-001: Weld Quality Requirements', link_purpose: 'Defines acceptance criteria for tack welds' }
    ],

    created_by: 'user-001',
    created_by_name: 'Alex Welder',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-18T14:30:00Z'
  },

  // 2. Test Execution SOP: CVT Belt Slip Characterization Test
  {
    id: 'sop-baja-002',
    global_artifact_id: 'SOP00002',
    sop_scope_type: SOP_SCOPE_TYPES.NODE_REVISION,
    visibility_scope: VISIBILITY_SCOPE.ORG_GROUP,  // Visible to powertrain team
    visibility_org_group_id: 'org-group-powertrain',
    scope_org_id: 'org-baja',
    org_id: 'org-baja',
    scope_project_id: 'proj-baja-2025',
    project_id: 'proj-baja-2025',
    project_name: 'Baja 2025',
    scope_node_id: 'node-cvt-assembly',
    scope_part_number: 'BAJA25-DT-400', // Maps to CVT Assembly in demo project
    node_id: 'node-cvt-assembly',
    node_name: 'CVT Assembly',
    scope_node_revision_id: 'rev-cvt-b',
    node_revision_id: 'rev-cvt-b',
    node_revision: 'B',
    sop_type: SOP_TYPES.TEST_EXECUTION,
    title: 'CVT Belt Slip Characterization Test',
    purpose: 'Characterize CVT belt slip under varying torque and RPM conditions to validate belt tension and sheave settings. Data used to correlate simulation models and optimize clutch engagement.',
    status: SOP_STATUS.DRAFT,

    preconditions: [
      { id: 'pre-1', description: 'CVT assembly installed on dyno test stand per setup drawing', verification_method: 'Visual verification against setup drawing' },
      { id: 'pre-2', description: 'Belt tension set to 25 lbs per specification', verification_method: 'Belt tension gauge measurement' },
      { id: 'pre-3', description: 'DAQ system calibrated and channels verified', verification_method: 'Calibration verification in test software' },
      { id: 'pre-4', description: 'Engine coolant at operating temperature (180-200°F)', verification_method: 'Coolant temp gauge reading' },
      { id: 'pre-5', description: 'Safety shields in place around rotating equipment', verification_method: 'Visual inspection' }
    ],

    required_tools: [
      { id: 'tool-1', tool_name: 'Dyno test stand', tool_id: 'TEST-DYNO-001', specification: 'With torque sensor 0-100 Nm range' },
      { id: 'tool-2', tool_name: 'RPM sensors (2)', tool_id: 'TEST-RPM-001', specification: 'Optical tachometer, primary and secondary sheave' },
      { id: 'tool-3', tool_name: 'IR temperature gun', tool_id: 'TEST-IR-001', specification: 'For belt temperature monitoring' },
      { id: 'tool-4', tool_name: 'Belt tension gauge', tool_id: 'TEST-TENS-001', specification: 'Krikit-style, 0-50 lbs range' },
      { id: 'tool-5', tool_name: 'DAQ system', tool_id: 'TEST-DAQ-001', specification: 'Minimum 1kHz sample rate, 8 channels' }
    ],

    required_parts: [
      { id: 'part-1', part_number: 'BELT-CVT-001', node_id: 'node-cvt-belt', quantity: 1, description: 'CVT belt - new, unused' },
      { id: 'part-2', part_number: 'FLUID-CVT-001', node_id: null, quantity: 1, description: 'CVT fluid - full reservoir' }
    ],

    safety_warnings: [
      { id: 'warn-1', level: WARNING_LEVELS.HIGH, warning_text: 'Rotating equipment hazard - never reach near CVT while engine running. Use remote start only.', ppe_required: ['Safety glasses', 'Hearing protection', 'Close-toed shoes'] },
      { id: 'warn-2', level: WARNING_LEVELS.HIGH, warning_text: 'Hot surfaces - belt and sheaves reach 200°F+ during testing. Allow 10 min cooldown before inspection.', ppe_required: ['Heat-resistant gloves for post-test inspection'] },
      { id: 'warn-3', level: WARNING_LEVELS.MEDIUM, warning_text: 'Exhaust fumes - ensure adequate ventilation or exhaust extraction', ppe_required: [] }
    ],

    steps: [
      { id: 'step-1', step_number: 1, instruction: 'Verify test stand setup per drawing TEST-CVT-SETUP-001. Confirm all sensors connected and responding in DAQ software.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 10 },
      { id: 'step-2', step_number: 2, instruction: 'Record baseline belt tension using belt tension gauge. Target: 25 ±2 lbs. Record actual value.', verification_required: true, evidence_required: EVIDENCE_TYPES.MEASUREMENT, expected_duration_minutes: 5 },
      { id: 'step-3', step_number: 3, instruction: 'Start engine and warm up to operating temperature (180-200°F coolant). Monitor for unusual noises or vibrations.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 10 },
      { id: 'step-4', step_number: 4, instruction: 'Begin test sequence: increase engine RPM in 500 RPM increments from 2000-4500 RPM. Hold each point for 30 seconds. Record primary and secondary sheave RPM.', verification_required: true, evidence_required: EVIDENCE_TYPES.LOG, expected_duration_minutes: 15 },
      { id: 'step-5', step_number: 5, instruction: 'At each RPM point, record: primary RPM, secondary RPM, calculated slip ratio, belt temperature (IR gun), torque output.', verification_required: true, evidence_required: EVIDENCE_TYPES.LOG, expected_duration_minutes: 0 },
      { id: 'step-6', step_number: 6, instruction: 'Apply load steps: 10%, 25%, 50%, 75%, 100% of max torque at 3500 RPM. Record slip ratio at each load point.', verification_required: true, evidence_required: EVIDENCE_TYPES.LOG, expected_duration_minutes: 20 },
      { id: 'step-7', step_number: 7, instruction: 'Return to idle, allow 5 minute cooldown. Monitor belt temperature decrease rate.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 5 },
      { id: 'step-8', step_number: 8, instruction: 'Shutdown engine. After 10 minute cooldown, inspect belt for glazing, wear, or damage. Photo document belt condition.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 10 }
    ],

    acceptance_criteria: [
      { id: 'acc-1', criterion: 'Belt slip ratio < 5% at all RPM points under no load', requirement_id: 'REQ-CVT-001', verification: 'Data log analysis' },
      { id: 'acc-2', criterion: 'Belt slip ratio < 8% at 100% load', requirement_id: 'REQ-CVT-002', verification: 'Data log analysis' },
      { id: 'acc-3', criterion: 'Belt temperature < 220°F during all test conditions', requirement_id: 'REQ-CVT-003', verification: 'IR temperature readings' },
      { id: 'acc-4', criterion: 'No visible belt glazing, cracking, or abnormal wear', requirement_id: 'REQ-CVT-004', verification: 'Visual inspection' }
    ],

    evidence_to_capture: [
      { id: 'ev-1', type: EVIDENCE_TYPES.MEASUREMENT, description: 'Initial belt tension measurement', mandatory: true },
      { id: 'ev-2', type: EVIDENCE_TYPES.LOG, description: 'Complete test data log (CSV export from DAQ)', mandatory: true },
      { id: 'ev-3', type: EVIDENCE_TYPES.PHOTO, description: 'Belt condition pre-test', mandatory: true },
      { id: 'ev-4', type: EVIDENCE_TYPES.PHOTO, description: 'Belt condition post-test', mandatory: true },
      { id: 'ev-5', type: EVIDENCE_TYPES.CHECKLIST, description: 'Test setup verification checklist', mandatory: true }
    ],

    linked_artifacts: [
      { id: 'link-1', artifact_type: 'fixture', artifact_id: 'fix-dyno-001', artifact_name: 'TEST-DYNO-001: CVT Dyno Test Stand', link_purpose: 'Required test fixture' },
      { id: 'link-2', artifact_type: 'test_case', artifact_id: 'test-cvt-slip-001', artifact_name: 'TC-CVT-001: Belt Slip Characterization', link_purpose: 'Parent test case' },
      { id: 'link-3', artifact_type: 'requirement', artifact_id: 'req-cvt-001', artifact_name: 'REQ-CVT-001: Belt Slip Limits', link_purpose: 'Defines pass/fail criteria' }
    ],

    created_by: 'user-002',
    created_by_name: 'Jordan Test',
    created_at: '2025-01-16T14:30:00Z',
    updated_at: '2025-01-19T09:00:00Z'
  },

  // 3. Service SOP: CVT Belt Inspection and Replacement
  {
    id: 'sop-baja-003',
    global_artifact_id: 'SOP00003',
    sop_scope_type: SOP_SCOPE_TYPES.NODE,
    visibility_scope: VISIBILITY_SCOPE.USER,  // Private draft SOP
    visibility_org_group_id: null,
    scope_org_id: 'org-baja',
    org_id: 'org-baja',
    scope_project_id: 'proj-baja-2025',
    project_id: 'proj-baja-2025',
    project_name: 'Baja 2025',
    scope_node_id: 'node-cvt-assembly',
    scope_part_number: 'BAJA25-DT-400', // Maps to CVT Assembly in demo project
    node_id: 'node-cvt-assembly',
    node_name: 'CVT Assembly',
    // Node-scoped (any revision), not revision-specific
    scope_node_revision_id: null,
    node_revision_id: null,
    node_revision: null,
    sop_type: SOP_TYPES.SERVICE,
    title: 'CVT Belt Inspection and Replacement',
    purpose: 'Field service procedure for inspecting CVT belt condition and performing replacement when necessary. Applicable for routine maintenance and post-incident inspection.',
    status: SOP_STATUS.DRAFT,

    preconditions: [
      { id: 'pre-1', description: 'Vehicle safely supported on stands with engine off', verification_method: 'Visual verification' },
      { id: 'pre-2', description: 'CVT cover removed and accessible', verification_method: 'Cover removed' },
      { id: 'pre-3', description: 'Engine and CVT at ambient temperature (not hot)', verification_method: 'Touch test - comfortable to handle' },
      { id: 'pre-4', description: 'Replacement belt available if replacement needed', verification_method: 'Parts verification' }
    ],

    required_tools: [
      { id: 'tool-1', tool_name: 'Belt tension gauge', tool_id: null, specification: 'Krikit-style, 0-50 lbs' },
      { id: 'tool-2', tool_name: 'Socket set', tool_id: null, specification: '8mm, 10mm, 12mm' },
      { id: 'tool-3', tool_name: 'Pry bar', tool_id: null, specification: 'For sheave spreading' },
      { id: 'tool-4', tool_name: 'Flashlight', tool_id: null, specification: 'For visual inspection' },
      { id: 'tool-5', tool_name: 'Clean rags', tool_id: null, specification: 'Lint-free' },
      { id: 'tool-6', tool_name: 'Belt width gauge', tool_id: null, specification: 'For wear measurement' }
    ],

    required_parts: [
      { id: 'part-1', part_number: 'BELT-CVT-001', node_id: 'node-cvt-belt', quantity: 1, description: 'Replacement CVT belt (if needed)' }
    ],

    safety_warnings: [
      { id: 'warn-1', level: WARNING_LEVELS.HIGH, warning_text: 'Ensure engine is OFF and key removed before any CVT work', ppe_required: ['Safety glasses'] },
      { id: 'warn-2', level: WARNING_LEVELS.MEDIUM, warning_text: 'Belt may have sharp edges if damaged - wear gloves when handling', ppe_required: ['Work gloves'] },
      { id: 'warn-3', level: WARNING_LEVELS.LOW, warning_text: 'Keep CVT area clean - debris can cause premature wear', ppe_required: [] }
    ],

    steps: [
      { id: 'step-1', step_number: 1, instruction: 'Visually inspect belt for cracks, fraying, glazing, or unusual wear patterns. Use flashlight to inspect both belt faces.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 5 },
      { id: 'step-2', step_number: 2, instruction: 'Check belt width at three locations using belt width gauge. Record measurements. Minimum acceptable width: 28mm (new: 30mm).', verification_required: true, evidence_required: EVIDENCE_TYPES.MEASUREMENT, expected_duration_minutes: 5 },
      { id: 'step-3', step_number: 3, instruction: 'Measure belt tension using tension gauge. Target: 25 ±2 lbs. Record actual value.', verification_required: true, evidence_required: EVIDENCE_TYPES.MEASUREMENT, expected_duration_minutes: 3 },
      { id: 'step-4', step_number: 4, instruction: 'Inspect sheave faces for scoring, pitting, or debris. Clean sheave faces with lint-free rag if debris present.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 5 },
      { id: 'step-5', step_number: 5, instruction: 'If replacement required: spread secondary sheave using pry bar, remove old belt. Note belt orientation.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 5 },
      { id: 'step-6', step_number: 6, instruction: 'Install new belt: route around primary sheave first, then secondary. Ensure belt seats fully in both sheave grooves.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 5 },
      { id: 'step-7', step_number: 7, instruction: 'Verify belt tension: 25 ±2 lbs. Adjust if necessary per service manual procedure.', verification_required: true, evidence_required: EVIDENCE_TYPES.MEASUREMENT, expected_duration_minutes: 5 },
      { id: 'step-8', step_number: 8, instruction: 'Rotate assembly by hand through 3 full revolutions. Verify belt tracks smoothly without binding.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 3 },
      { id: 'step-9', step_number: 9, instruction: 'Reinstall CVT cover. Torque fasteners to 8 Nm.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 5 },
      { id: 'step-10', step_number: 10, instruction: 'Start engine, let idle for 2 minutes. Listen for unusual noises. Shut down and verify belt position.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 5 }
    ],

    acceptance_criteria: [
      { id: 'acc-1', criterion: 'Belt width ≥ 28mm at all measurement points', requirement_id: 'REQ-SVC-001', verification: 'Belt width gauge measurement' },
      { id: 'acc-2', criterion: 'Belt tension 25 ±2 lbs', requirement_id: 'REQ-SVC-002', verification: 'Tension gauge measurement' },
      { id: 'acc-3', criterion: 'No visible cracks, fraying, or glazing on belt', requirement_id: 'REQ-SVC-003', verification: 'Visual inspection' },
      { id: 'acc-4', criterion: 'Smooth operation through 3 hand rotations', requirement_id: null, verification: 'Functional check' }
    ],

    evidence_to_capture: [
      { id: 'ev-1', type: EVIDENCE_TYPES.PHOTO, description: 'Belt condition overview', mandatory: true },
      { id: 'ev-2', type: EVIDENCE_TYPES.MEASUREMENT, description: 'Belt width measurements (3 locations)', mandatory: true },
      { id: 'ev-3', type: EVIDENCE_TYPES.MEASUREMENT, description: 'Belt tension measurement', mandatory: true },
      { id: 'ev-4', type: EVIDENCE_TYPES.PHOTO, description: 'Sheave condition', mandatory: false },
      { id: 'ev-5', type: EVIDENCE_TYPES.PHOTO, description: 'New belt installed (if replaced)', mandatory: false }
    ],

    linked_artifacts: [
      { id: 'link-1', artifact_type: 'requirement', artifact_id: 'req-svc-001', artifact_name: 'REQ-SVC-001: Belt Service Limits', link_purpose: 'Defines replacement criteria' },
      { id: 'link-2', artifact_type: 'cad_artifact', artifact_id: 'cad-cvt-assy', artifact_name: 'CAD: CVT Assembly', link_purpose: 'Reference for component location' }
    ],

    created_by: 'user-003',
    created_by_name: 'Sam Service',
    created_at: '2025-01-17T09:15:00Z',
    updated_at: '2025-01-17T09:15:00Z'
  }
];

// =============================================================================
// DEMO SOPs - ELECTRIC BUS GEN 1 (Node-Scoped)
// =============================================================================

export const DEMO_SOPS_ELECTRIC_BUS = [
  // 4. Assembly SOP: Battery Box Installation Procedure
  {
    id: 'sop-ebus-001',
    global_artifact_id: 'SOP00004',
    sop_scope_type: SOP_SCOPE_TYPES.NODE_REVISION,
    visibility_scope: VISIBILITY_SCOPE.ORG,  // Visible to all org members
    visibility_org_group_id: null,
    scope_org_id: 'org-ebus',
    org_id: 'org-ebus',
    scope_project_id: 'proj-ebus-gen1',
    project_id: 'proj-ebus-gen1',
    project_name: 'Electric Bus Gen 1',
    scope_node_id: 'node-battery-boxes',
    scope_part_number: 'EBUS1-EL-100', // Maps to HV Battery System Assembly in demo project
    node_id: 'node-battery-boxes',
    node_name: 'HV Battery System Assembly',
    scope_node_revision_id: 'rev-batt-a',
    node_revision_id: 'rev-batt-a',
    node_revision: 'A',
    sop_type: SOP_TYPES.ASSEMBLY,
    title: 'Battery Box Installation Procedure',
    purpose: 'Standard procedure for installing battery box assemblies into the chassis structure. Covers mechanical mounting, HV connection verification, and pre-energization checks.',
    status: SOP_STATUS.DRAFT,

    preconditions: [
      { id: 'pre-1', description: 'Chassis structure complete and inspected per QC checklist', verification_method: 'QC sign-off sheet' },
      { id: 'pre-2', description: 'Battery box assemblies tested and tagged for installation', verification_method: 'Test tag verification' },
      { id: 'pre-3', description: 'HV system de-energized and LOTO applied', verification_method: 'LOTO tag verification' },
      { id: 'pre-4', description: 'All installers HV-qualified per training records', verification_method: 'Training database check' },
      { id: 'pre-5', description: 'Lift equipment inspected and rated for battery box weight', verification_method: 'Equipment inspection tag' }
    ],

    required_tools: [
      { id: 'tool-1', tool_name: 'Overhead crane or forklift', tool_id: null, specification: 'Rated for 500 kg minimum' },
      { id: 'tool-2', tool_name: 'Torque wrench', tool_id: null, specification: '50-200 Nm range, calibrated' },
      { id: 'tool-3', tool_name: 'Insulated tools (1000V)', tool_id: null, specification: 'IEC 60900 rated' },
      { id: 'tool-4', tool_name: 'Multimeter', tool_id: null, specification: 'CAT III 1000V rated' },
      { id: 'tool-5', tool_name: 'Alignment pins', tool_id: null, specification: 'M12 pilot pins for mounting holes' },
      { id: 'tool-6', tool_name: 'Thread locker', tool_id: null, specification: 'Loctite 243 or equivalent' }
    ],

    required_parts: [
      { id: 'part-1', part_number: 'BATT-BOX-001', node_id: 'node-battery-box-1', quantity: 1, description: 'Battery box assembly #1' },
      { id: 'part-2', part_number: 'BATT-BOX-002', node_id: 'node-battery-box-2', quantity: 1, description: 'Battery box assembly #2' },
      { id: 'part-3', part_number: 'MOUNT-HW-001', node_id: null, quantity: 1, description: 'Mounting hardware kit' },
      { id: 'part-4', part_number: 'GASKET-BATT-001', node_id: null, quantity: 2, description: 'Battery box seal gasket' }
    ],

    safety_warnings: [
      { id: 'warn-1', level: WARNING_LEVELS.HIGH, warning_text: 'HIGH VOLTAGE HAZARD - HV system must be de-energized and LOTO applied before any work. Verify with multimeter before touching any HV components.', ppe_required: ['HV-rated gloves (Class 0)', 'Safety glasses', 'Arc flash suit if energized work required'] },
      { id: 'warn-2', level: WARNING_LEVELS.HIGH, warning_text: 'CRUSHING HAZARD - Battery boxes weigh 400kg+. Use appropriate lifting equipment. Keep hands clear during lift operations.', ppe_required: ['Steel-toed boots', 'Hard hat'] },
      { id: 'warn-3', level: WARNING_LEVELS.MEDIUM, warning_text: 'Only HV-qualified personnel may perform HV connections', ppe_required: [] }
    ],

    steps: [
      { id: 'step-1', step_number: 1, instruction: 'Verify LOTO applied to HV system. Confirm with multimeter that no voltage present at battery connection points.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 10 },
      { id: 'step-2', step_number: 2, instruction: 'Inspect chassis mounting points for damage, corrosion, or debris. Clean all mating surfaces.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 15 },
      { id: 'step-3', step_number: 3, instruction: 'Install seal gaskets on battery box mating faces. Verify gasket seats fully in groove with no gaps.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 10 },
      { id: 'step-4', step_number: 4, instruction: 'Position battery box #1 above mounting location using overhead crane. Use taglines for positioning control.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 15 },
      { id: 'step-5', step_number: 5, instruction: 'Lower battery box onto chassis. Insert alignment pins in two diagonal holes first. Verify alignment before inserting remaining fasteners.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 10 },
      { id: 'step-6', step_number: 6, instruction: 'Apply thread locker to all mounting bolts. Install bolts hand-tight in star pattern.', verification_required: false, evidence_required: EVIDENCE_TYPES.NONE, expected_duration_minutes: 10 },
      { id: 'step-7', step_number: 7, instruction: 'Torque mounting bolts to 150 Nm in three passes (50 Nm, 100 Nm, 150 Nm) using star pattern. Mark each bolt after final torque.', verification_required: true, evidence_required: EVIDENCE_TYPES.LOG, expected_duration_minutes: 20 },
      { id: 'step-8', step_number: 8, instruction: 'Repeat steps 4-7 for battery box #2.', verification_required: true, evidence_required: EVIDENCE_TYPES.LOG, expected_duration_minutes: 45 },
      { id: 'step-9', step_number: 9, instruction: 'Connect HV cables between battery boxes per wiring diagram. Torque HV connections to 25 Nm. Apply torque seal.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 30 },
      { id: 'step-10', step_number: 10, instruction: 'Perform insulation resistance test on HV system. Minimum 1 MΩ/V required (400V system = 400 MΩ minimum).', verification_required: true, evidence_required: EVIDENCE_TYPES.MEASUREMENT, expected_duration_minutes: 15 },
      { id: 'step-11', step_number: 11, instruction: 'Install HV connection covers. Verify all covers seated and latched.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 10 },
      { id: 'step-12', step_number: 12, instruction: 'Complete installation checklist and apply "Installation Complete" tag to battery system.', verification_required: true, evidence_required: EVIDENCE_TYPES.SIGNATURE, expected_duration_minutes: 10 }
    ],

    acceptance_criteria: [
      { id: 'acc-1', criterion: 'All mounting bolts torqued to 150 ±10 Nm and marked', requirement_id: 'REQ-BATT-001', verification: 'Torque log and visual mark check' },
      { id: 'acc-2', criterion: 'HV connections torqued to 25 ±2 Nm with torque seal', requirement_id: 'REQ-HV-001', verification: 'Torque log and torque seal verification' },
      { id: 'acc-3', criterion: 'Insulation resistance ≥ 400 MΩ', requirement_id: 'REQ-HV-002', verification: 'Insulation resistance test report' },
      { id: 'acc-4', criterion: 'All seal gaskets properly seated with no visible gaps', requirement_id: 'REQ-BATT-002', verification: 'Visual inspection' }
    ],

    evidence_to_capture: [
      { id: 'ev-1', type: EVIDENCE_TYPES.CHECKLIST, description: 'LOTO verification checklist', mandatory: true },
      { id: 'ev-2', type: EVIDENCE_TYPES.PHOTO, description: 'Chassis mounting points before installation', mandatory: true },
      { id: 'ev-3', type: EVIDENCE_TYPES.PHOTO, description: 'Gasket installation', mandatory: true },
      { id: 'ev-4', type: EVIDENCE_TYPES.LOG, description: 'Bolt torque values (all 24 bolts)', mandatory: true },
      { id: 'ev-5', type: EVIDENCE_TYPES.PHOTO, description: 'HV connections with torque seal', mandatory: true },
      { id: 'ev-6', type: EVIDENCE_TYPES.MEASUREMENT, description: 'Insulation resistance test result', mandatory: true },
      { id: 'ev-7', type: EVIDENCE_TYPES.SIGNATURE, description: 'Installation completion sign-off', mandatory: true }
    ],

    linked_artifacts: [
      { id: 'link-1', artifact_type: 'requirement', artifact_id: 'req-batt-001', artifact_name: 'REQ-BATT-001: Battery Mounting Requirements', link_purpose: 'Defines mounting torque specs' },
      { id: 'link-2', artifact_type: 'requirement', artifact_id: 'req-hv-001', artifact_name: 'REQ-HV-001: HV Connection Requirements', link_purpose: 'Defines HV connection specs' },
      { id: 'link-3', artifact_type: 'requirement', artifact_id: 'req-hv-002', artifact_name: 'REQ-HV-002: Insulation Requirements', link_purpose: 'Defines insulation test criteria' }
    ],

    created_by: 'user-004',
    created_by_name: 'Pat Assembly',
    created_at: '2025-01-18T11:00:00Z',
    updated_at: '2025-01-18T11:00:00Z'
  },

  // 5. Inspection SOP: HV Cable Routing Inspection
  {
    id: 'sop-ebus-002',
    global_artifact_id: 'SOP00005',
    sop_scope_type: SOP_SCOPE_TYPES.NODE_REVISION,
    visibility_scope: VISIBILITY_SCOPE.PUBLIC,  // Shared publicly for reference
    visibility_org_group_id: null,
    scope_org_id: 'org-ebus',
    org_id: 'org-ebus',
    scope_project_id: 'proj-ebus-gen1',
    project_id: 'proj-ebus-gen1',
    project_name: 'Electric Bus Gen 1',
    scope_node_id: 'node-electrical-subsystem',
    scope_part_number: 'EBUS1-EL', // Maps to Electrical Power subsystem in demo project
    node_id: 'node-electrical-subsystem',
    node_name: 'Electrical Power',
    scope_node_revision_id: 'rev-elec-a',
    node_revision_id: 'rev-elec-a',
    node_revision: 'A',
    sop_type: SOP_TYPES.INSPECTION,
    title: 'HV Cable Routing Inspection',
    purpose: 'Quality inspection procedure for high voltage cable routing and protection. Ensures all HV cables meet bend radius, clearance, and protection requirements per design specifications.',
    status: SOP_STATUS.DRAFT,

    preconditions: [
      { id: 'pre-1', description: 'HV cable installation complete', verification_method: 'Installation sign-off sheet' },
      { id: 'pre-2', description: 'HV system de-energized and LOTO applied', verification_method: 'LOTO tag verification' },
      { id: 'pre-3', description: 'All cable labels and route markers installed', verification_method: 'Visual verification' },
      { id: 'pre-4', description: 'Inspector HV-qualified', verification_method: 'Training database check' }
    ],

    required_tools: [
      { id: 'tool-1', tool_name: 'Bend radius gauge', tool_id: null, specification: 'For 35mm and 50mm cable sizes' },
      { id: 'tool-2', tool_name: 'Feeler gauges', tool_id: null, specification: 'For clearance measurements' },
      { id: 'tool-3', tool_name: 'Flashlight', tool_id: null, specification: 'High-intensity for inspection' },
      { id: 'tool-4', tool_name: 'Inspection mirror', tool_id: null, specification: 'Telescoping' },
      { id: 'tool-5', tool_name: 'Inspection checklist', tool_id: null, specification: 'Form QC-HV-001' },
      { id: 'tool-6', tool_name: 'Digital camera', tool_id: null, specification: 'For documentation' }
    ],

    required_parts: [],

    safety_warnings: [
      { id: 'warn-1', level: WARNING_LEVELS.HIGH, warning_text: 'HV HAZARD - Verify LOTO before inspection. Even de-energized HV cables may retain charge.', ppe_required: ['HV-rated gloves', 'Safety glasses'] },
      { id: 'warn-2', level: WARNING_LEVELS.LOW, warning_text: 'Confined space entry may be required - follow confined space procedures if applicable', ppe_required: [] }
    ],

    steps: [
      { id: 'step-1', step_number: 1, instruction: 'Verify LOTO applied. Confirm with LOTO owner before beginning inspection.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 5 },
      { id: 'step-2', step_number: 2, instruction: 'Obtain routing diagram and inspection checklist (Form QC-HV-001). Verify drawing revision matches installed configuration.', verification_required: true, evidence_required: EVIDENCE_TYPES.CHECKLIST, expected_duration_minutes: 5 },
      { id: 'step-3', step_number: 3, instruction: 'Inspect cable labels at both ends and every 1m interval. Verify labels match routing diagram and are legible.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 15 },
      { id: 'step-4', step_number: 4, instruction: 'Verify bend radius at all routing points using bend radius gauge. Minimum 8x cable OD required (35mm cable = 280mm min radius).', verification_required: true, evidence_required: EVIDENCE_TYPES.MEASUREMENT, expected_duration_minutes: 20 },
      { id: 'step-5', step_number: 5, instruction: 'Measure clearance from moving components, hot surfaces, and sharp edges. Minimum 25mm clearance required at all points.', verification_required: true, evidence_required: EVIDENCE_TYPES.MEASUREMENT, expected_duration_minutes: 20 },
      { id: 'step-6', step_number: 6, instruction: 'Verify conduit and protective sleeving at all frame penetrations. No exposed cable allowed within 100mm of frame edges.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 15 },
      { id: 'step-7', step_number: 7, instruction: 'Inspect cable ties and clamps. Verify proper spacing (max 300mm), correct orientation, and no cable damage from over-tightening.', verification_required: true, evidence_required: EVIDENCE_TYPES.PHOTO, expected_duration_minutes: 15 }
    ],

    acceptance_criteria: [
      { id: 'acc-1', criterion: 'All bends ≥ 8x cable OD', requirement_id: 'REQ-HV-ROUTE-001', verification: 'Bend radius gauge measurement' },
      { id: 'acc-2', criterion: 'Clearance ≥ 25mm from moving/hot/sharp items', requirement_id: 'REQ-HV-ROUTE-002', verification: 'Feeler gauge or ruler measurement' },
      { id: 'acc-3', criterion: 'Protective sleeving at all penetrations', requirement_id: 'REQ-HV-ROUTE-003', verification: 'Visual inspection' },
      { id: 'acc-4', criterion: 'Labels present and legible at all required points', requirement_id: 'REQ-HV-ROUTE-004', verification: 'Visual inspection' },
      { id: 'acc-5', criterion: 'Cable ties max 300mm spacing, no damage', requirement_id: 'REQ-HV-ROUTE-005', verification: 'Visual inspection and measurement' }
    ],

    evidence_to_capture: [
      { id: 'ev-1', type: EVIDENCE_TYPES.CHECKLIST, description: 'LOTO verification', mandatory: true },
      { id: 'ev-2', type: EVIDENCE_TYPES.PHOTO, description: 'Cable labels (representative sample)', mandatory: true },
      { id: 'ev-3', type: EVIDENCE_TYPES.MEASUREMENT, description: 'Bend radius measurements at critical points', mandatory: true },
      { id: 'ev-4', type: EVIDENCE_TYPES.MEASUREMENT, description: 'Clearance measurements at critical points', mandatory: true },
      { id: 'ev-5', type: EVIDENCE_TYPES.PHOTO, description: 'Frame penetration protection', mandatory: true },
      { id: 'ev-6', type: EVIDENCE_TYPES.PHOTO, description: 'Any non-conformances found', mandatory: false },
      { id: 'ev-7', type: EVIDENCE_TYPES.SIGNATURE, description: 'Inspector sign-off', mandatory: true }
    ],

    linked_artifacts: [
      { id: 'link-1', artifact_type: 'requirement', artifact_id: 'req-hv-route-001', artifact_name: 'REQ-HV-ROUTE-001: HV Routing Requirements', link_purpose: 'Defines all routing criteria' },
      { id: 'link-2', artifact_type: 'cad_artifact', artifact_id: 'cad-hv-routing', artifact_name: 'DWG: HV Cable Routing Diagram', link_purpose: 'Reference for correct routing' }
    ],

    created_by: 'user-005',
    created_by_name: 'Quinn QC',
    created_at: '2025-01-19T08:45:00Z',
    updated_at: '2025-01-19T08:45:00Z'
  }
];

// =============================================================================
// DEMO SOPs - COOKING (General Procedures)
// =============================================================================

export const DEMO_SOPS_COOKING = [
  // Cooking SOP: Poolish Pizza Dough, 72 Hour Cold Ferment
  {
    id: 'SOP-COOK-001',
    slug: 'poolish-pizza-dough-72h',
    global_artifact_id: 'SOP00020',
    sop_scope_type: SOP_SCOPE_TYPES.GLOBAL,
    visibility_scope: VISIBILITY_SCOPE.PUBLIC,
    visibility_org_group_id: null,
    scope_org_id: null,
    scope_project_id: null,
    scope_node_id: null,
    scope_node_revision_id: null,
    sop_type: SOP_TYPES.COOKING,
    category: 'Cooking',
    tags: ['pizza', 'dough', 'poolish', 'fermentation'],
    revision: 'A',
    effective_date: '2026-02-16',
    title: 'Poolish Pizza Dough, 72 Hour Cold Ferment',
    purpose: 'Produce consistent high gluten pizza dough using a poolish starter and a 72 hour cold fermentation for improved flavor, extensibility, and bake performance.',
    summary: 'High gluten poolish dough SOP producing 4 x 370g balls with a 72 hour cold ferment for improved flavor and extensibility.',
    yield_info: '4 dough balls, 370 g each (12" pizzas)',
    allergens: ['Wheat', 'gluten'],
    status: SOP_STATUS.APPROVED,

    // Part/Phase definitions for execution mode navigation
    parts: [
      { id: 'A', name: 'Poolish', description: 'T minus 18 hours - Make poolish starter', color: 'blue' },
      { id: 'B', name: 'Mix Dough', description: 'T minus 72 hours - Combine ingredients', color: 'purple' },
      { id: 'C', name: 'Rest, Divide, Ball', description: 'Form dough balls', color: 'green' },
      { id: 'D', name: 'Cold Ferment', description: '72 hour refrigeration', color: 'cyan' },
      { id: 'PD', name: 'Pizza Day', description: 'Final prep and shaping', color: 'orange' }
    ],

    preconditions: [
      { id: 'pre-cook-1', description: 'All ingredients measured and staged', verification_method: 'Visual check' },
      { id: 'pre-cook-2', description: 'Stand mixer clean and assembled with dough hook', verification_method: 'Visual check' },
      { id: 'pre-cook-3', description: 'Digital scale calibrated and zeroed', verification_method: 'Tare test' },
      { id: 'pre-cook-4', description: 'Refrigerator space available for 72-hour ferment', verification_method: 'Visual check' }
    ],

    required_tools: [
      { id: 'tool-cook-1', tool_name: 'Digital scale', tool_id: null, specification: '0.1 g accuracy minimum, 0.01 g preferred for poolish yeast' },
      { id: 'tool-cook-2', tool_name: 'Stand mixer with dough hook', tool_id: null, specification: 'KitchenAid or equivalent' },
      { id: 'tool-cook-3', tool_name: 'Medium bowl', tool_id: null, specification: 'For poolish fermentation' },
      { id: 'tool-cook-4', tool_name: 'Half sheet pan', tool_id: null, specification: 'For cold fermentation' },
      { id: 'tool-cook-5', tool_name: 'Plastic wrap', tool_id: null, specification: 'For covering' },
      { id: 'tool-cook-6', tool_name: 'Bench scraper', tool_id: null, specification: 'For dividing dough' },
      { id: 'tool-cook-7', tool_name: 'Damp towel', tool_id: null, specification: 'For bench rest' },
      { id: 'tool-cook-8', tool_name: 'Thermometer (optional)', tool_id: null, specification: 'For water temperature' }
    ],

    required_parts: [
      { id: 'part-poolish-1', part_number: 'ING-FLOUR-HG', quantity: '47 g', description: 'High gluten flour (13%+ protein) - for poolish' },
      { id: 'part-poolish-2', part_number: 'ING-YEAST-ADY', quantity: '0.12 g', description: 'Active dry yeast - for poolish' },
      { id: 'part-poolish-3', part_number: 'ING-WATER', quantity: '47 g', description: 'Cold water (40°F / 5°C) - for poolish' },
      { id: 'part-dough-1', part_number: 'ING-FLOUR-HG', quantity: '453 g', description: 'High gluten flour (13%+ protein) - for final dough' },
      { id: 'part-dough-2', part_number: 'ING-MALT-LD', quantity: '9 g', description: 'Low diastatic malt' },
      { id: 'part-dough-3', part_number: 'ING-WATER', quantity: '70 g', description: 'Warm water (85°F / 30°C) - for yeast activation' },
      { id: 'part-dough-4', part_number: 'ING-YEAST-ADY', quantity: '4.5 g', description: 'Active dry yeast - for final dough' },
      { id: 'part-dough-5', part_number: 'ING-WATER', quantity: '225 g', description: 'Cold water (40°F / 5°C) - for final dough' },
      { id: 'part-dough-6', part_number: 'ING-SALT-SEA', quantity: '9 g', description: 'Fine sea salt' },
      { id: 'part-dough-7', part_number: 'ING-OIL-EVOO', quantity: '5 g', description: 'Extra virgin olive oil' },
      { id: 'part-dust-1', part_number: 'ING-SEMOLINA', quantity: '1/2 cup', description: 'Semolina - for bench dusting' },
      { id: 'part-dust-2', part_number: 'ING-FLOUR-HG', quantity: '1/2 cup', description: 'High gluten flour - for bench dusting' }
    ],

    safety_warnings: [
      { id: 'warn-cook-1', level: WARNING_LEVELS.MEDIUM, warning_text: 'Contains wheat and gluten allergens. Ensure workspace is free of cross-contamination for allergy-sensitive environments.', ppe_required: [] },
      { id: 'warn-cook-2', level: WARNING_LEVELS.LOW, warning_text: 'Stand mixer can be hazardous. Keep hands clear of moving dough hook.', ppe_required: [] },
      { id: 'warn-cook-3', level: WARNING_LEVELS.LOW, warning_text: 'Hot water (85°F) used for yeast activation. Use caution when handling.', ppe_required: [] }
    ],

    // Enhanced steps with part, title, materials, and qc for execution mode
    steps: [
      // Part A: Poolish (T minus 18 hours)
      {
        id: 'step-A1',
        step_number: 'A1',
        part: 'A',
        title: 'Mix Poolish',
        materials: [
          { name: 'High gluten flour', amount: '47 g' },
          { name: 'Active dry yeast', amount: '0.12 g' },
          { name: 'Cold water', amount: '47 g (40°F / 5°C)' }
        ],
        instruction: 'Add flour to a medium bowl. Add yeast. Add cold water. Stir until combined, about 45 seconds. Cover tightly with plastic wrap.',
        qc: null,
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.MEASUREMENT,
        expected_duration_minutes: 5,
        step_image_url: null,
        step_image_alt_text: 'Poolish mixture in bowl'
      },
      {
        id: 'step-A2',
        step_number: 'A2',
        part: 'A',
        title: 'Ferment Poolish',
        materials: null,
        instruction: 'Leave covered at room temperature for 18 hours.',
        qc: [
          'Poolish is bubbly and expanded',
          'Pleasant fermented aroma',
          'Not collapsed into liquid'
        ],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.PHOTO,
        expected_duration_minutes: 1080,
        step_image_url: null,
        step_image_alt_text: 'Properly fermented poolish'
      },

      // Part B: Mix dough (T minus 72 hours)
      {
        id: 'step-B1',
        step_number: 'B1',
        part: 'B',
        title: 'Dry Blend',
        materials: [
          { name: 'High gluten flour', amount: '453 g' },
          { name: 'Low diastatic malt', amount: '9 g' }
        ],
        instruction: 'Combine flour and malt in a bowl. Mix by hand until uniform.',
        qc: null,
        verification_required: false,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 3,
        step_image_url: null
      },
      {
        id: 'step-B2',
        step_number: 'B2',
        part: 'B',
        title: 'Activate Yeast',
        materials: [
          { name: 'Warm water', amount: '70 g (85°F / 30°C)' },
          { name: 'Active dry yeast', amount: '4.5 g' }
        ],
        instruction: 'Add warm water to small bowl. Add yeast. Whisk until foamy (~45 seconds).',
        qc: ['Yeast mixture is foamy'],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 2,
        step_image_url: null
      },
      {
        id: 'step-B3',
        step_number: 'B3',
        part: 'B',
        title: 'Initial Hydration',
        materials: [
          { name: 'Dry flour mixture', amount: 'from B1' },
          { name: 'Yeast water', amount: 'from B2' },
          { name: 'Cold water', amount: '225 g (40°F / 5°C)' }
        ],
        instruction: 'Add dry flour mixture to stand mixer. Pour in yeast water. Start mixer on low. Slowly add cold water in small increments. Increase to medium and mix 2-3 minutes until combined.',
        qc: null,
        verification_required: false,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 5,
        step_image_url: null
      },
      {
        id: 'step-B4',
        step_number: 'B4',
        part: 'B',
        title: 'Add Poolish',
        materials: [
          { name: 'Poolish', amount: 'all (~94 g fermented)' }
        ],
        instruction: 'Add entire poolish to mixer. Mix on medium for 2 minutes.',
        qc: null,
        verification_required: false,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 3,
        step_image_url: null
      },
      {
        id: 'step-B5',
        step_number: 'B5',
        part: 'B',
        title: 'Salt and Oil',
        materials: [
          { name: 'Fine sea salt', amount: '9 g' },
          { name: 'Extra virgin olive oil', amount: '5 g' }
        ],
        instruction: 'Add salt. Mix 1 minute at medium-high. Add olive oil. Mix 1-2 minutes until dough loses surface shine.',
        qc: [
          'Dough is cohesive',
          'Dough is elastic',
          'Slightly tacky, not sticky or dry'
        ],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.PHOTO,
        expected_duration_minutes: 4,
        step_image_url: null,
        step_image_alt_text: 'Properly mixed dough texture'
      },

      // Part C: Rest, divide, ball
      {
        id: 'step-C1',
        step_number: 'C1',
        part: 'C',
        title: 'Bench Rest',
        materials: null,
        instruction: 'Remove dough from mixer. Knead gently for 1 minute on clean surface. Cover with damp towel. Rest 20 minutes.',
        qc: null,
        verification_required: false,
        evidence_required: EVIDENCE_TYPES.LOG,
        expected_duration_minutes: 22,
        step_image_url: null
      },
      {
        id: 'step-C2',
        step_number: 'C2',
        part: 'C',
        title: 'Divide',
        materials: null,
        instruction: 'Cut dough into 4 pieces using bench scraper. Scale each piece to exactly 370 g. Adjust as needed.',
        qc: ['Each piece weighs 370 g ± 5 g'],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.MEASUREMENT,
        expected_duration_minutes: 4,
        step_image_url: null
      },
      {
        id: 'step-C3',
        step_number: 'C3',
        part: 'C',
        title: 'Ball',
        materials: null,
        instruction: 'Form tight balls with smooth tops and sealed bottoms using cupped hands. Use bench scraper to assist rotation.',
        qc: [
          'Smooth top surface',
          'Bottom seam fully closed',
          'Uniform round shape'
        ],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.PHOTO,
        expected_duration_minutes: 6,
        step_image_url: null,
        step_image_alt_text: 'Sealed dough ball bottom'
      },

      // Part D: Cold ferment
      {
        id: 'step-D1',
        step_number: 'D1',
        part: 'D',
        title: 'Arrange for Ferment',
        materials: null,
        instruction: 'Place dough balls on sheet pan with space between each. Cover tightly with plastic wrap, ensuring no exposed dough.',
        qc: null,
        verification_required: false,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 2,
        step_image_url: null
      },
      {
        id: 'step-D2',
        step_number: 'D2',
        part: 'D',
        title: 'Cold Ferment 72 Hours',
        materials: null,
        instruction: 'Refrigerate for 72 hours. Log start time for tracking.',
        qc: [
          'Balls have expanded',
          'Balls are relaxed',
          'No drying or cracking',
          'Plastic not ruptured'
        ],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.LOG,
        expected_duration_minutes: 4320,
        step_image_url: null,
        step_image_alt_text: 'Properly fermented dough balls'
      },

      // Pizza Day
      {
        id: 'step-PD1',
        step_number: 'PD1',
        part: 'PD',
        title: 'Warm Up Dough',
        materials: null,
        instruction: 'Remove dough from refrigerator 1-2 hours before bake. Let rest at room temperature.',
        qc: ['Dough is room temperature', 'Dough is pliable'],
        verification_required: false,
        evidence_required: EVIDENCE_TYPES.LOG,
        expected_duration_minutes: 90,
        step_image_url: null
      },
      {
        id: 'step-PD2',
        step_number: 'PD2',
        part: 'PD',
        title: 'Preheat Oven',
        materials: null,
        instruction: 'Preheat oven to 500°F / 260°C for 1 hour with two baking steels (upper and lower racks).',
        qc: ['Oven at 500°F', 'Steels fully heated (1 hour)'],
        verification_required: false,
        evidence_required: EVIDENCE_TYPES.LOG,
        expected_duration_minutes: 60,
        step_image_url: null
      },
      {
        id: 'step-PD3',
        step_number: 'PD3',
        part: 'PD',
        title: 'Prepare Dusting',
        materials: [
          { name: 'Semolina', amount: '1/2 cup' },
          { name: 'High gluten flour', amount: '1/2 cup' }
        ],
        instruction: 'Mix semolina and flour to create bench dusting blend. Dust bench and top of dough ball generously.',
        qc: null,
        verification_required: false,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 2,
        step_image_url: null
      },
      {
        id: 'step-PD4',
        step_number: 'PD4',
        part: 'PD',
        title: 'Shape Pizza',
        materials: null,
        instruction: 'Press edges to define rim, leaving center slightly thicker. Flip and repeat. Stretch to ~10" on bench using fingertips. Final hand stretch to 11.5" using gravity — drape over knuckles and rotate.',
        qc: [
          'Even thickness except rim',
          'No tears or holes',
          '11.5" diameter achieved'
        ],
        verification_required: false,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 3,
        step_image_url: null
      }
    ],

    acceptance_criteria: [
      { id: 'acc-cook-1', criterion: 'Poolish shows active fermentation (bubbly, not collapsed)', requirement_id: null, verification: 'Visual inspection at 18 hours' },
      { id: 'acc-cook-2', criterion: 'Final dough is cohesive, elastic, slightly tacky', requirement_id: null, verification: 'Touch test after mixing' },
      { id: 'acc-cook-3', criterion: 'Each ball weighs exactly 370 g', requirement_id: null, verification: 'Scale measurement' },
      { id: 'acc-cook-4', criterion: 'All ball bottoms are fully sealed', requirement_id: null, verification: 'Visual inspection' },
      { id: 'acc-cook-5', criterion: 'Dough relaxed and extensible after 72-hour ferment', requirement_id: null, verification: 'Stretch test before shaping' }
    ],

    evidence_to_capture: [
      { id: 'ev-cook-1', type: EVIDENCE_TYPES.LOG, description: 'Poolish start time', mandatory: true },
      { id: 'ev-cook-2', type: EVIDENCE_TYPES.LOG, description: 'Dough mix time', mandatory: true },
      { id: 'ev-cook-3', type: EVIDENCE_TYPES.MEASUREMENT, description: 'Ball weights (all 4)', mandatory: true },
      { id: 'ev-cook-4', type: EVIDENCE_TYPES.LOG, description: 'Cold ferment start time', mandatory: true },
      { id: 'ev-cook-5', type: EVIDENCE_TYPES.LOG, description: 'Bake observations and results', mandatory: false }
    ],

    common_failures: [
      { id: 'fail-1', failure_mode: 'Dough snaps back during shaping', cause: 'Dough too cold or under-relaxed', remedy: 'Allow more warm-up time before shaping' },
      { id: 'fail-2', failure_mode: 'Dough tears during stretch', cause: 'Overstretched or weak gluten development', remedy: 'Rest dough longer, ensure proper mixing time' },
      { id: 'fail-3', failure_mode: 'Excess stickiness', cause: 'Insufficient dusting or slow handling', remedy: 'Use more flour/semolina blend, work faster' },
      { id: 'fail-4', failure_mode: 'Over-fermented poolish (liquid/collapsed)', cause: 'Fermented longer than 18 hours or too warm', remedy: 'Discard and restart; use colder water or cooler room' }
    ],

    linked_artifacts: [],

    created_by: 'user-chef-001',
    created_by_name: 'Head Chef',
    created_at: '2026-02-16T00:00:00Z',
    updated_at: '2026-02-16T00:00:00Z',
    approved_by: 'user-chef-001',
    approved_at: '2026-02-16T00:00:00Z'
  },

  // Cooking SOP: Carnitas-Style Mexican Gravy (Lard-Based)
  {
    id: 'SOP-COOK-002',
    slug: 'carnitas-mexican-gravy',
    global_artifact_id: 'SOP00021',
    sop_scope_type: SOP_SCOPE_TYPES.GLOBAL,
    visibility_scope: VISIBILITY_SCOPE.PUBLIC,
    visibility_org_group_id: null,
    scope_org_id: null,
    scope_project_id: null,
    scope_node_id: null,
    scope_node_revision_id: null,
    sop_type: SOP_TYPES.COOKING,
    category: 'Cooking',
    tags: ['gravy', 'mexican', 'carnitas', 'lard', 'sauce', 'roux'],
    revision: 'A',
    effective_date: '2026-02-19',
    title: 'Carnitas-Style Mexican Gravy (Lard-Based)',
    purpose: 'Produce a rich, flavorful Mexican-style gravy using lard (preferably carnitas drippings) as the base fat. This sauce is ideal for smothering burritos, fries, and other dishes where a savory, slightly spiced gravy enhances the meal.',
    summary: 'Lard-based Mexican gravy with chili powder and oregano. 6 servings. 20-30 min active time.',
    yield_info: '6 servings',
    allergens: ['Wheat', 'gluten'],
    status: SOP_STATUS.APPROVED,

    // Part/Phase definitions for execution mode navigation
    parts: [
      { id: 'PREP', name: 'Preparation', description: 'Measure and prepare dry ingredients', color: 'amber' },
      { id: 'COOK', name: 'Cooking', description: 'Build roux and hydrate', color: 'orange' },
      { id: 'FINISH', name: 'Finish', description: 'Simmer and rest', color: 'green' }
    ],

    preconditions: [
      { id: 'pre-gravy-1', description: 'All ingredients measured and staged', verification_method: 'Visual check' },
      { id: 'pre-gravy-2', description: 'Large saucepan clean and ready', verification_method: 'Visual check' },
      { id: 'pre-gravy-3', description: 'Whisk available for continuous stirring', verification_method: 'Visual check' },
      { id: 'pre-gravy-4', description: 'Carnitas drippings strained (if using)', verification_method: 'Visual check' }
    ],

    required_tools: [
      { id: 'tool-gravy-1', tool_name: 'Large saucepan', tool_id: null, specification: '2-3 quart capacity' },
      { id: 'tool-gravy-2', tool_name: 'Whisk', tool_id: null, specification: 'Metal or silicone' },
      { id: 'tool-gravy-3', tool_name: 'Small mixing bowl', tool_id: null, specification: 'For dry mix' },
      { id: 'tool-gravy-4', tool_name: 'Measuring cups/spoons', tool_id: null, specification: 'Standard US measures' },
      { id: 'tool-gravy-5', tool_name: 'Fine mesh strainer', tool_id: null, specification: 'For straining drippings (if needed)' }
    ],

    required_parts: [
      { id: 'ing-gravy-1', part_number: 'ING-FLOUR-AP', quantity: '½ cup', description: 'All-purpose flour' },
      { id: 'ing-gravy-2', part_number: 'ING-CHILI-PWD', quantity: '2 tablespoons', description: 'Chili powder' },
      { id: 'ing-gravy-3', part_number: 'ING-ONION-PWD', quantity: '2 teaspoons', description: 'Onion powder' },
      { id: 'ing-gravy-4', part_number: 'ING-OREGANO-MX', quantity: '1 teaspoon', description: 'Dried Mexican oregano' },
      { id: 'ing-gravy-5', part_number: 'ING-SALT', quantity: '1 teaspoon', description: 'Salt' },
      { id: 'ing-gravy-6', part_number: 'ING-LARD', quantity: '6 tablespoons', description: 'Lard (preferred: strained carnitas drippings)' },
      { id: 'ing-gravy-7', part_number: 'ING-WATER', quantity: '4 cups', description: 'Water' }
    ],

    safety_warnings: [
      { id: 'warn-gravy-1', level: WARNING_LEVELS.MEDIUM, warning_text: 'Hot fat can cause severe burns. Never add water too quickly to hot roux.', ppe_required: [] },
      { id: 'warn-gravy-2', level: WARNING_LEVELS.LOW, warning_text: 'Contains wheat/gluten allergens. Ensure workspace is free of cross-contamination for allergy-sensitive environments.', ppe_required: [] },
      { id: 'warn-gravy-3', level: WARNING_LEVELS.LOW, warning_text: 'Continuous stirring required during hydration to prevent lumps and scorching.', ppe_required: [] }
    ],

    // Enhanced steps with part, title, materials, and qc for execution mode
    steps: [
      // Part PREP: Preparation
      {
        id: 'step-PREP1',
        step_number: 'PREP1',
        part: 'PREP',
        title: 'Dry Mix',
        materials: [
          { name: 'All-purpose flour', amount: '½ cup' },
          { name: 'Chili powder', amount: '2 tablespoons' },
          { name: 'Onion powder', amount: '2 teaspoons' },
          { name: 'Dried Mexican oregano', amount: '1 teaspoon' },
          { name: 'Salt', amount: '1 teaspoon' }
        ],
        instruction: 'Combine flour, chili powder, onion powder, oregano, and salt in a small bowl. Mix thoroughly until uniform color throughout.',
        qc: [
          'No visible flour streaks',
          'Spices evenly distributed',
          'No lumps'
        ],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 3,
        step_image_url: null
      },

      // Part COOK: Cooking
      {
        id: 'step-COOK1',
        step_number: 'COOK1',
        part: 'COOK',
        title: 'Heat Fat',
        materials: [
          { name: 'Lard or carnitas drippings', amount: '6 tablespoons' }
        ],
        instruction: 'In a large saucepan, heat lard or strained carnitas drippings over LOW heat until fully melted and warm but not smoking.',
        qc: [
          'Fat is fully melted',
          'No smoking',
          'Even heat distribution'
        ],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 3,
        step_image_url: null,
        step_image_alt_text: 'Melted lard in saucepan'
      },
      {
        id: 'step-COOK2',
        step_number: 'COOK2',
        part: 'COOK',
        title: 'Build Roux',
        materials: [
          { name: 'Dry mixture', amount: 'from PREP1' }
        ],
        instruction: 'Whisk the dry mixture into the hot fat. Stir continuously until smooth. Cook on low heat until the mixture darkens slightly and develops a toasted aroma. Do not allow burning.',
        qc: [
          'Smooth paste, no lumps',
          'Slightly darkened color',
          'Toasted aroma present',
          'No burnt smell'
        ],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 5,
        step_image_url: null,
        step_image_alt_text: 'Toasted roux in pan'
      },
      {
        id: 'step-COOK3',
        step_number: 'COOK3',
        part: 'COOK',
        title: 'Hydration',
        materials: [
          { name: 'Water', amount: '4 cups' }
        ],
        instruction: 'Slowly add water in small increments (about ½ cup at a time), whisking continuously to prevent clumping. Ensure each addition is fully incorporated before adding more. Continue until all water is added.',
        qc: [
          'No lumps forming',
          'Smooth consistency',
          'All water incorporated'
        ],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 8,
        step_image_url: null
      },

      // Part FINISH: Finish
      {
        id: 'step-FINISH1',
        step_number: 'FINISH1',
        part: 'FINISH',
        title: 'Simmer',
        materials: null,
        instruction: 'Bring the gravy to a gentle simmer and cook for approximately 5 minutes, stirring occasionally. The sauce should thicken and become smooth.',
        qc: [
          'Gravy coats back of spoon',
          'Smooth texture',
          'No raw flour taste'
        ],
        verification_required: true,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 5,
        step_image_url: null
      },
      {
        id: 'step-FINISH2',
        step_number: 'FINISH2',
        part: 'FINISH',
        title: 'Rest',
        materials: null,
        instruction: 'Remove from heat and allow to rest for 10 minutes before serving. Gravy will continue to thicken slightly as it rests.',
        qc: [
          'Proper consistency achieved',
          'Ready for service'
        ],
        verification_required: false,
        evidence_required: EVIDENCE_TYPES.NONE,
        expected_duration_minutes: 10,
        step_image_url: null
      }
    ],

    acceptance_criteria: [
      { id: 'acc-gravy-1', criterion: 'Dry mix is uniform with no lumps or streaks', requirement_id: null, verification: 'Visual inspection' },
      { id: 'acc-gravy-2', criterion: 'Roux is smooth and toasted without burning', requirement_id: null, verification: 'Visual and smell check' },
      { id: 'acc-gravy-3', criterion: 'Final gravy is smooth with no lumps', requirement_id: null, verification: 'Visual inspection' },
      { id: 'acc-gravy-4', criterion: 'Gravy coats spoon properly', requirement_id: null, verification: 'Spoon test' }
    ],

    evidence_to_capture: [
      { id: 'ev-gravy-1', type: EVIDENCE_TYPES.LOG, description: 'Batch start time', mandatory: false },
      { id: 'ev-gravy-2', type: EVIDENCE_TYPES.LOG, description: 'Fat source used (carnitas drippings or lard)', mandatory: true }
    ],

    common_failures: [
      { id: 'fail-gravy-1', failure_mode: 'Lumpy gravy', cause: 'Water added too quickly or insufficient whisking', remedy: 'Strain through fine mesh, or blend with immersion blender' },
      { id: 'fail-gravy-2', failure_mode: 'Burnt taste', cause: 'Heat too high during roux stage', remedy: 'Discard and restart with lower heat' },
      { id: 'fail-gravy-3', failure_mode: 'Too thick', cause: 'Over-reduced or insufficient water', remedy: 'Add water 2 tablespoons at a time until desired consistency' },
      { id: 'fail-gravy-4', failure_mode: 'Too thin', cause: 'Insufficient cooking time', remedy: 'Continue simmering until proper thickness achieved' },
      { id: 'fail-gravy-5', failure_mode: 'Raw flour taste', cause: 'Roux not cooked long enough', remedy: 'Simmer longer to cook out raw flour flavor' }
    ],

    // Operational Notes
    operational_notes: [
      'Carnitas drippings will produce a richer, deeper flavor and darker color.',
      'Strain drippings through fine mesh to remove solids before use.',
      'For a thinner sauce, add water 2 tablespoons at a time after simmering.',
      'For service line use, hold warm above 140°F and stir periodically.'
    ],

    // Use Cases
    use_cases: [
      'Burritos',
      'Smothered fries',
      'Chili dogs',
      'Smoked burger enhancement',
      'Breakfast tacos'
    ],

    // Preferred fat source note
    notes: 'Preferred Fat Source: Use freshly strained carnitas drippings for best flavor. If unavailable, use high-quality pork lard.',

    linked_artifacts: [],

    created_by: 'user-chef-001',
    created_by_name: 'Head Chef',
    created_at: '2026-02-19T00:00:00Z',
    updated_at: '2026-02-19T00:00:00Z',
    approved_by: 'user-chef-001',
    approved_at: '2026-02-19T00:00:00Z'
  }
];

// =============================================================================
// COMBINED DEMO SOPs (All Scopes)
// =============================================================================

export const DEMO_SOPS = [
  ...DEMO_SOPS_GLOBAL,
  ...DEMO_SOPS_ORG,
  ...DEMO_SOPS_BAJA_2025,
  ...DEMO_SOPS_ELECTRIC_BUS,
  ...DEMO_SOPS_COOKING
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const getSOPById = (id) => DEMO_SOPS.find(sop => sop.id === id);

export const getSOPsByProject = (projectId) =>
  DEMO_SOPS.filter(sop => sop.project_id === projectId || sop.scope_project_id === projectId);

export const getSOPsByNode = (nodeId) =>
  DEMO_SOPS.filter(sop => sop.node_id === nodeId || sop.scope_node_id === nodeId);

export const getSOPsByType = (sopType) =>
  DEMO_SOPS.filter(sop => sop.sop_type === sopType);

export const getSOPsByStatus = (status) =>
  DEMO_SOPS.filter(sop => sop.status === status);

export const getApprovedSOPs = () =>
  DEMO_SOPS.filter(sop => sop.status === SOP_STATUS.APPROVED);

export const getDraftSOPs = () =>
  DEMO_SOPS.filter(sop => sop.status === SOP_STATUS.DRAFT);

// =============================================================================
// SCOPE-BASED HELPER FUNCTIONS
// =============================================================================

export const getSOPsByScopeType = (scopeType) =>
  DEMO_SOPS.filter(sop => sop.sop_scope_type === scopeType);

export const getGlobalSOPs = () =>
  DEMO_SOPS.filter(sop => sop.sop_scope_type === SOP_SCOPE_TYPES.GLOBAL);

export const getOrgSOPs = (orgId = null) =>
  DEMO_SOPS.filter(sop =>
    sop.sop_scope_type === SOP_SCOPE_TYPES.ORG &&
    (orgId === null || sop.scope_org_id === orgId)
  );

export const getProjectSOPs = (projectId) =>
  DEMO_SOPS.filter(sop =>
    sop.sop_scope_type === SOP_SCOPE_TYPES.PROJECT &&
    sop.scope_project_id === projectId
  );

export const getNodeSOPs = (nodeId) =>
  DEMO_SOPS.filter(sop =>
    (sop.sop_scope_type === SOP_SCOPE_TYPES.NODE || sop.sop_scope_type === SOP_SCOPE_TYPES.NODE_REVISION) &&
    sop.scope_node_id === nodeId
  );

// Get SOPs visible to a project (includes Global, Org, and Project-scoped)
export const getVisibleSOPsForProject = (projectId, orgId) => {
  return DEMO_SOPS.filter(sop =>
    sop.sop_scope_type === SOP_SCOPE_TYPES.GLOBAL ||
    (sop.sop_scope_type === SOP_SCOPE_TYPES.ORG && sop.scope_org_id === orgId) ||
    sop.scope_project_id === projectId
  );
};

// Get SOPs visible to a node (includes Global, Org, Project, Node scoped)
export const getVisibleSOPsForNode = (nodeId, projectId, orgId) => {
  return DEMO_SOPS.filter(sop =>
    sop.sop_scope_type === SOP_SCOPE_TYPES.GLOBAL ||
    (sop.sop_scope_type === SOP_SCOPE_TYPES.ORG && sop.scope_org_id === orgId) ||
    (sop.sop_scope_type === SOP_SCOPE_TYPES.PROJECT && sop.scope_project_id === projectId) ||
    sop.scope_node_id === nodeId
  );
};

// =============================================================================
// VISIBILITY SCOPE HELPER FUNCTIONS
// =============================================================================

export const getSOPsByVisibility = (visibilityScope) =>
  DEMO_SOPS.filter(sop => sop.visibility_scope === visibilityScope);

export const getUserSOPs = (userId = null) =>
  DEMO_SOPS.filter(sop =>
    sop.visibility_scope === VISIBILITY_SCOPE.USER &&
    (userId === null || sop.created_by === userId)
  );

export const getOrgGroupSOPs = (orgGroupId = null) =>
  DEMO_SOPS.filter(sop =>
    sop.visibility_scope === VISIBILITY_SCOPE.ORG_GROUP &&
    (orgGroupId === null || sop.visibility_org_group_id === orgGroupId)
  );

export const getOrgVisibleSOPs = (orgId = null) =>
  DEMO_SOPS.filter(sop =>
    sop.visibility_scope === VISIBILITY_SCOPE.ORG &&
    (orgId === null || sop.scope_org_id === orgId)
  );

export const getPublicSOPs = () =>
  DEMO_SOPS.filter(sop => sop.visibility_scope === VISIBILITY_SCOPE.PUBLIC);

export default DEMO_SOPS;
