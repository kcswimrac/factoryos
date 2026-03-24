/**
 * Formal Design Reviews Configuration
 *
 * Design reviews formalize decision-making at important milestones.
 * If the project does not pass (or passes with conditions), it goes no further.
 *
 * RULE: If a review fails or is conditional, the project goes no further
 * until conditions are closed.
 */

// =============================================================================
// REVIEW TYPES
// =============================================================================

export const REVIEW_TYPES = {
  SRR: 'SRR',
  SDR: 'SDR',
  PDR: 'PDR',
  CDR: 'CDR',
  EXPLORATORY: 'EXPLORATORY' // Scrappy Mode only
};

export const REVIEW_TYPE_CONFIG = {
  SRR: {
    code: 'SRR',
    name: 'System Requirements Review',
    shortName: 'SRR',
    description: 'Scheduled at end of product definition. Ensures functional and performance requirements are defined and satisfy the need.',
    timing: 'End of product definition',
    color: 'blue',
    icon: 'ClipboardList',
    minimumPhaseRequirements: [1], // Phase 1 completeness required
    requiredReportSections: [
      'problem_statement',
      'requirements_all_levels',
      'trace_matrix_snapshot',
      'constraints_non_goals',
      'assumptions_risk_summary'
    ]
  },
  SDR: {
    code: 'SDR',
    name: 'System Definition Review',
    shortName: 'SDR',
    description: 'End of conceptual design. Examines proposed system architecture and functional elements defining the concept.',
    timing: 'End of conceptual design',
    color: 'purple',
    icon: 'Network',
    minimumPhaseRequirements: [1, 2], // Phase 1-2 completeness required
    requiredReportSections: [
      'system_architecture',
      'functional_physical_hierarchy',
      'interface_definitions',
      'rd_summary',
      'assumptions_risk_summary'
    ]
  },
  PDR: {
    code: 'PDR',
    name: 'Preliminary Design Review',
    shortName: 'PDR',
    description: 'Demonstrates design meets requirements with acceptable risk within cost/schedule constraints before full detail. Establishes basis for detailed design.',
    timing: 'Before detailed design',
    color: 'cyan',
    icon: 'FileCheck',
    minimumPhaseRequirements: [1, 2, 3], // Phase 1-3 completeness + early 4/5 readiness
    requiredReportSections: [
      'design_alternative_rationale',
      'cad_completeness_status',
      'dfm_dfs_readiness',
      'verification_plan',
      'analysis_approach',
      'fixtures_tooling_needs',
      'risk_mitigation_plan'
    ]
  },
  CDR: {
    code: 'CDR',
    name: 'Critical Design Review',
    shortName: 'CDR',
    description: 'Demonstrates technical effort is on track to complete the product and meet requirements within cost/schedule. Audits detailed specs with manufacturing, assembly, operations. Verifies product fulfills needs from earlier reviews.',
    timing: 'Before production/build',
    color: 'red',
    icon: 'ShieldCheck',
    minimumPhaseRequirements: [1, 2, 3, 4, 5, 6], // Phase 1-6 completeness, Phase 7 readiness
    requiredReportSections: [
      'final_design_readiness',
      'analysis_results_assumptions',
      'test_results_vs_requirements',
      'manufacturing_plan_ctqs',
      'serviceability_plan',
      'correlation_status',
      'release_recommendation'
    ],
    blockedByViolatedAssumptions: true,
    blockedByHighRiskUnvalidated: true
  },
  EXPLORATORY: {
    code: 'EXPLORATORY',
    name: 'Exploratory Review',
    shortName: 'EXPLR',
    description: 'Scrappy Mode review without formal gate requirements. Creates technical debt items if criteria are bypassed.',
    timing: 'As needed (Scrappy Mode)',
    color: 'amber',
    icon: 'AlertTriangle',
    minimumPhaseRequirements: [],
    requiredReportSections: [],
    isScrappyModeOnly: true,
    requiresWatermark: true
  }
};

// =============================================================================
// REVIEW OUTCOMES
// =============================================================================

export const REVIEW_OUTCOMES = {
  PASS: 'pass',
  CONDITIONAL_PASS: 'conditional_pass',
  FAIL: 'fail'
};

export const REVIEW_OUTCOME_CONFIG = {
  pass: {
    code: 'pass',
    name: 'Pass',
    description: 'Review criteria satisfied. Proceed to next phase.',
    color: 'emerald',
    icon: 'CheckCircle',
    blocksProgress: false
  },
  conditional_pass: {
    code: 'conditional_pass',
    name: 'Conditional Pass',
    description: 'Criteria met with open items. Proceed, but Review Conditions must be closed by due date.',
    color: 'amber',
    icon: 'AlertCircle',
    blocksProgress: false,
    requiresConditions: true
  },
  fail: {
    code: 'fail',
    name: 'Fail',
    description: 'Critical criteria not met. Blocks progression past intended gate.',
    color: 'red',
    icon: 'XCircle',
    blocksProgress: true
  }
};

// =============================================================================
// REVIEW STATUS
// =============================================================================

export const REVIEW_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// =============================================================================
// REVIEW SCOPE
// =============================================================================

export const REVIEW_SCOPE_TYPES = {
  PROJECT: 'project',
  NODE_SET: 'node_set'
};

// =============================================================================
// CONDITION SEVERITY
// =============================================================================

export const CONDITION_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const CONDITION_SEVERITY_CONFIG = {
  low: {
    code: 'low',
    name: 'Low',
    description: 'Minor item that should be addressed',
    color: 'blue',
    maxDaysToClose: 30
  },
  medium: {
    code: 'medium',
    name: 'Medium',
    description: 'Significant item requiring attention',
    color: 'amber',
    maxDaysToClose: 14
  },
  high: {
    code: 'high',
    name: 'High',
    description: 'Critical item that may block progress if not resolved',
    color: 'red',
    maxDaysToClose: 7
  }
};

// =============================================================================
// CONDITION STATUS
// =============================================================================

export const CONDITION_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  ACCEPTED_RISK: 'accepted_risk'
};

// =============================================================================
// ARTIFACT LINK TYPES
// =============================================================================

export const ARTIFACT_LINK_TYPES = {
  EVIDENCE: 'evidence',
  SLIDE_DECK: 'slide_deck',
  REPORT_PDF: 'report_pdf',
  MINUTES: 'minutes',
  DECISION_RECORD: 'decision_record'
};

// =============================================================================
// REPORT SECTIONS
// =============================================================================

export const REPORT_SECTIONS = {
  // SRR Sections
  problem_statement: {
    id: 'problem_statement',
    name: 'Problem Statement and Objectives',
    reviewType: 'SRR',
    order: 1
  },
  requirements_all_levels: {
    id: 'requirements_all_levels',
    name: 'Requirements/Specifications at All Three Levels',
    reviewType: 'SRR',
    order: 2
  },
  trace_matrix_snapshot: {
    id: 'trace_matrix_snapshot',
    name: 'Trace Matrix Snapshot',
    reviewType: 'SRR',
    order: 3
  },
  constraints_non_goals: {
    id: 'constraints_non_goals',
    name: 'Key Constraints and Non-Goals',
    reviewType: 'SRR',
    order: 4
  },
  assumptions_risk_summary: {
    id: 'assumptions_risk_summary',
    name: 'Assumptions and Risk Summary (Active)',
    reviewType: 'ALL',
    order: 99
  },

  // SDR Sections
  system_architecture: {
    id: 'system_architecture',
    name: 'System Architecture and Decomposition',
    reviewType: 'SDR',
    order: 1
  },
  functional_physical_hierarchy: {
    id: 'functional_physical_hierarchy',
    name: 'Functional vs Physical Hierarchy Clarity',
    reviewType: 'SDR',
    order: 2
  },
  interface_definitions: {
    id: 'interface_definitions',
    name: 'Interface Definitions (ICD Summary)',
    reviewType: 'SDR',
    order: 3
  },
  rd_summary: {
    id: 'rd_summary',
    name: 'R&D Summary Relevant to Architecture Choices',
    reviewType: 'SDR',
    order: 4
  },

  // PDR Sections
  design_alternative_rationale: {
    id: 'design_alternative_rationale',
    name: 'Selected Design Alternative Rationale (Trade Studies)',
    reviewType: 'PDR',
    order: 1
  },
  cad_completeness_status: {
    id: 'cad_completeness_status',
    name: 'CAD Completeness Status',
    reviewType: 'PDR',
    order: 2
  },
  dfm_dfs_readiness: {
    id: 'dfm_dfs_readiness',
    name: 'DFM/DFS Readiness',
    reviewType: 'PDR',
    order: 3
  },
  verification_plan: {
    id: 'verification_plan',
    name: 'Verification Plan and Methods',
    reviewType: 'PDR',
    order: 4
  },
  analysis_approach: {
    id: 'analysis_approach',
    name: 'Early Analysis Approach and Boundary Conditions Plan',
    reviewType: 'PDR',
    order: 5
  },
  fixtures_tooling_needs: {
    id: 'fixtures_tooling_needs',
    name: 'Identified Fixtures/Tooling Needs',
    reviewType: 'PDR',
    order: 6
  },
  risk_mitigation_plan: {
    id: 'risk_mitigation_plan',
    name: 'Risk Posture and Mitigation Plan',
    reviewType: 'PDR',
    order: 7
  },

  // CDR Sections
  final_design_readiness: {
    id: 'final_design_readiness',
    name: 'Final Design Package Readiness',
    reviewType: 'CDR',
    order: 1
  },
  analysis_results_assumptions: {
    id: 'analysis_results_assumptions',
    name: 'Analysis Results and Assumption Declarations',
    reviewType: 'CDR',
    order: 2
  },
  test_results_vs_requirements: {
    id: 'test_results_vs_requirements',
    name: 'Test Plans, Results, and Pass/Fail vs Requirements',
    reviewType: 'CDR',
    order: 3
  },
  manufacturing_plan_ctqs: {
    id: 'manufacturing_plan_ctqs',
    name: 'Manufacturing Plan and Inspection/CTQs',
    reviewType: 'CDR',
    order: 4
  },
  serviceability_plan: {
    id: 'serviceability_plan',
    name: 'Serviceability Plan and Maintenance Assumptions',
    reviewType: 'CDR',
    order: 5
  },
  correlation_status: {
    id: 'correlation_status',
    name: 'Correlation Status and Discrepancies',
    reviewType: 'CDR',
    order: 6
  },
  release_recommendation: {
    id: 'release_recommendation',
    name: 'Release Recommendation',
    reviewType: 'CDR',
    order: 7
  }
};

// =============================================================================
// WATERMARK TYPES
// =============================================================================

export const WATERMARK_TYPES = {
  DRAFT: 'DRAFT – NOT VALIDATED',
  SCRAPPY_MODE: 'SCRAPPY MODE – NOT FOR PRODUCTION RELEASE',
  VIOLATED_ASSUMPTIONS: 'BLOCKED – VIOLATED ASSUMPTIONS EXIST',
  HIGH_RISK_UNVALIDATED: 'BLOCKED – HIGH-RISK ASSUMPTIONS UNVALIDATED'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get review type configuration
 */
export const getReviewTypeConfig = (reviewType) => {
  return REVIEW_TYPE_CONFIG[reviewType] || REVIEW_TYPE_CONFIG.EXPLORATORY;
};

/**
 * Get review type color classes
 */
export const getReviewTypeColorClasses = (reviewType) => {
  const config = getReviewTypeConfig(reviewType);
  const colorMap = {
    blue: { bg: 'bg-blue-500', bgLight: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    purple: { bg: 'bg-purple-500', bgLight: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    cyan: { bg: 'bg-cyan-500', bgLight: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    red: { bg: 'bg-red-500', bgLight: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    amber: { bg: 'bg-amber-500', bgLight: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    emerald: { bg: 'bg-emerald-500', bgLight: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' }
  };
  return colorMap[config.color] || colorMap.blue;
};

/**
 * Get outcome configuration
 */
export const getOutcomeConfig = (outcome) => {
  return REVIEW_OUTCOME_CONFIG[outcome] || REVIEW_OUTCOME_CONFIG.pass;
};

/**
 * Get required report sections for a review type
 */
export const getRequiredSectionsForReview = (reviewType) => {
  const config = getReviewTypeConfig(reviewType);
  if (!config.requiredReportSections) return [];

  return config.requiredReportSections.map(sectionId => REPORT_SECTIONS[sectionId]).filter(Boolean);
};

/**
 * Check if CDR can pass based on assumptions
 */
export const canCDRPass = (assumptions) => {
  if (!assumptions || assumptions.length === 0) return { canPass: true, blockers: [] };

  const blockers = [];

  // Check for violated assumptions
  const violated = assumptions.filter(a => a.status === 'violated');
  if (violated.length > 0) {
    blockers.push({
      type: 'violated_assumptions',
      count: violated.length,
      message: `${violated.length} violated assumption(s) exist`,
      watermark: WATERMARK_TYPES.VIOLATED_ASSUMPTIONS
    });
  }

  // Check for high-risk unvalidated assumptions
  const highRiskUnvalidated = assumptions.filter(a =>
    a.risk_level === 'high' && a.status !== 'validated'
  );
  if (highRiskUnvalidated.length > 0) {
    blockers.push({
      type: 'high_risk_unvalidated',
      count: highRiskUnvalidated.length,
      message: `${highRiskUnvalidated.length} high-risk assumption(s) are unvalidated`,
      watermark: WATERMARK_TYPES.HIGH_RISK_UNVALIDATED
    });
  }

  return {
    canPass: blockers.length === 0,
    blockers
  };
};

/**
 * Check phase completeness for review readiness
 */
export const checkReviewReadiness = (reviewType, phaseCompleteness) => {
  const config = getReviewTypeConfig(reviewType);
  const requiredPhases = config.minimumPhaseRequirements || [];

  const missingPhases = requiredPhases.filter(phase => {
    const phaseStatus = phaseCompleteness[phase];
    return phaseStatus !== 'completed' && phaseStatus !== 'complete';
  });

  return {
    isReady: missingPhases.length === 0,
    missingPhases,
    message: missingPhases.length > 0
      ? `Phase(s) ${missingPhases.join(', ')} must be complete before ${reviewType}`
      : `Ready for ${reviewType}`
  };
};

// =============================================================================
// REVIEW PREPARATION GUIDANCE
// =============================================================================

export const REVIEW_PREP_GUIDANCE = {
  title: 'Review Preparation Requirements',
  items: [
    'Material must be understandable to the audience.',
    'Presenters must account for what the audience knows and does not know.',
    'Avoid jargon unless defined.',
    'Order must follow a 3-step approach:',
    '  1. Present the entire concept and overall function',
    '  2. Describe major parts and how they relate',
    '  3. Tie parts back into the whole',
    'Use an agenda. (Required field for this review)',
    'Bring quality visuals appropriate to the audience. (Detailed drawings may confuse non-engineers)',
    'Be prepared for questions beyond slides.'
  ]
};

// =============================================================================
// DEMO DATA
// =============================================================================

export const DEMO_DESIGN_REVIEWS = [
  {
    id: 'review-baja-2025-srr',
    org_id: 'org-public-demo',
    project_id: 'proj-baja-2025',
    review_type: REVIEW_TYPES.SRR,
    scope_type: REVIEW_SCOPE_TYPES.PROJECT,
    scope_node_revision_set: {},
    baseline_snapshot_id: null,
    change_package_id: null,
    scheduled_at: '2024-09-30T14:00:00Z',
    completed_at: '2024-09-30T16:30:00Z',
    status: REVIEW_STATUS.COMPLETED,
    outcome: REVIEW_OUTCOMES.PASS,
    chair_user_id: 'user-advisor',
    attendees: ['user-demo', 'user-advisor', 'user-team-lead'],
    agenda: '1. Requirements overview\n2. Specification review\n3. Risk assessment\n4. Q&A',
    minutes_markdown: '## SRR Minutes\n\nAll requirements reviewed and approved. Minor clarifications needed on suspension travel spec.',
    created_by: 'user-demo'
  },
  {
    id: 'review-baja-2025-pdr',
    org_id: 'org-public-demo',
    project_id: 'proj-baja-2025',
    review_type: REVIEW_TYPES.PDR,
    scope_type: REVIEW_SCOPE_TYPES.NODE_SET,
    scope_node_revision_set: {
      'node-baja-drivetrain': 'rev-a',
      'node-baja-suspension': 'rev-a'
    },
    baseline_snapshot_id: null,
    change_package_id: null,
    scheduled_at: '2025-01-15T14:00:00Z',
    completed_at: null,
    status: REVIEW_STATUS.PLANNED,
    outcome: null,
    chair_user_id: 'user-advisor',
    attendees: ['user-demo', 'user-advisor', 'user-team-lead', 'user-manufacturing'],
    agenda: '1. Design overview\n2. CAD status\n3. DFM/DFS review\n4. Verification plan\n5. Risk review',
    minutes_markdown: null,
    created_by: 'user-demo'
  }
];

export const DEMO_REVIEW_CONDITIONS = [
  {
    id: 'condition-001',
    design_review_id: 'review-baja-2025-srr',
    condition_text: 'Update suspension travel specification with measured data from 2024 vehicle',
    severity: CONDITION_SEVERITY.MEDIUM,
    owner_user_id: 'user-demo',
    due_date: '2024-10-15',
    status: CONDITION_STATUS.CLOSED,
    closure_notes: 'Updated spec to 10" based on measured 2024 terrain data',
    closed_at: '2024-10-10T15:00:00Z'
  }
];

export default {
  REVIEW_TYPES,
  REVIEW_TYPE_CONFIG,
  REVIEW_OUTCOMES,
  REVIEW_OUTCOME_CONFIG,
  REVIEW_STATUS,
  REVIEW_SCOPE_TYPES,
  CONDITION_SEVERITY,
  CONDITION_SEVERITY_CONFIG,
  CONDITION_STATUS,
  ARTIFACT_LINK_TYPES,
  REPORT_SECTIONS,
  WATERMARK_TYPES,
  REVIEW_PREP_GUIDANCE,
  getReviewTypeConfig,
  getReviewTypeColorClasses,
  getOutcomeConfig,
  getRequiredSectionsForReview,
  canCDRPass,
  checkReviewReadiness,
  DEMO_DESIGN_REVIEWS,
  DEMO_REVIEW_CONDITIONS
};
