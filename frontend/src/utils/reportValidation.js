/**
 * Report Validation and Composition Utilities
 *
 * Computes report validation status, evidence completeness, blocking issues,
 * and section-level status for the Complete Engineering Design Report.
 *
 * Key principle: Report status is computed, never user-set.
 * Draft export is always allowed; validated export requires VALIDATED status.
 */

import {
  REPORT_STATUS,
  COMPLETE_REPORT_SECTIONS,
  RIGOR_TIERS
} from '../config/designPhases';

// =============================================================================
// TIER-BASED REQUIREMENTS
// =============================================================================

/**
 * Get required artifacts for a given tier
 */
export function getRequiredArtifactsForTier(tier) {
  const tierConfig = RIGOR_TIERS[tier] || RIGOR_TIERS[2];

  return {
    // Phase 1: Requirements
    requirements: true,
    constraints: true,
    nonGoals: tier >= 2,

    // Phase 2: R&D
    tradeStudies: tier >= 2,
    doeStudies: tier >= 2,
    priorArtReview: tier >= 2,

    // Phase 3: Design
    cadModels: true,
    designDecisions: true,
    icdApproval: tier >= 2,
    serviceabilityReview: tier >= 2,
    manufacturabilityReview: tier >= 2,

    // Phase 4: Load Cases
    loadCaseDefinitions: true,
    analysisAssumptions: true,

    // Phase 5: Analysis
    analysisChecks: true,
    marginCalculations: tier >= 2,

    // Phase 6: Test
    testPlan: true,
    testResults: true,
    testReports: tier >= 2,

    // Phase 7: Correlation (Tier 3 only)
    correlationData: tier === 3,
    correlationReport: tier === 3,

    // Gates
    gateApprovals: tierConfig.gateRequirements || [],

    // Trace
    traceThreshold: tierConfig.traceThreshold || 0.8,

    // Total count for completeness calculation
    total: calculateTotalRequirements(tier)
  };
}

function calculateTotalRequirements(tier) {
  let total = 8; // Base requirements always needed
  if (tier >= 2) total += 8; // Additional Tier 2 requirements
  if (tier === 3) total += 3; // Correlation requirements
  return total;
}

// =============================================================================
// EVIDENCE COMPLETENESS
// =============================================================================

/**
 * Count present artifacts in scope
 */
export function countPresentArtifacts(project, scope, required) {
  let present = 0;
  const scopeNodes = getScopeNodes(project, scope);

  // Check requirements
  if (hasRequirements(scopeNodes)) present++;
  if (hasConstraints(scopeNodes)) present++;
  if (required.nonGoals && hasNonGoals(scopeNodes)) present++;

  // Check R&D artifacts
  if (required.tradeStudies && hasTradeStudies(project, scopeNodes)) present++;
  if (required.doeStudies && hasDoeStudies(project, scopeNodes)) present++;
  if (required.priorArtReview && hasPriorArtReview(scopeNodes)) present++;

  // Check design artifacts
  if (hasCadModels(scopeNodes)) present++;
  if (hasDesignDecisions(scopeNodes)) present++;
  if (required.icdApproval && hasIcdApproval(scopeNodes)) present++;
  if (required.serviceabilityReview && hasServiceabilityReview(scopeNodes)) present++;
  if (required.manufacturabilityReview && hasManufacturabilityReview(scopeNodes)) present++;

  // Check analysis artifacts
  if (hasLoadCases(scopeNodes)) present++;
  if (hasAnalysisChecks(project, scopeNodes)) present++;
  if (required.marginCalculations && hasMarginCalculations(scopeNodes)) present++;

  // Check test artifacts
  if (hasTestPlan(project, scopeNodes)) present++;
  if (hasTestResults(project, scopeNodes)) present++;
  if (required.testReports && hasTestReports(project, scopeNodes)) present++;

  // Check correlation (Tier 3)
  if (required.correlationData && hasCorrelationData(project, scopeNodes)) present++;

  return present;
}

/**
 * Compute evidence completeness score (0.0 to 1.0)
 */
export function computeEvidenceCompleteness(project, scope, tier) {
  const required = getRequiredArtifactsForTier(tier);
  const present = countPresentArtifacts(project, scope, required);
  return Math.min(1.0, present / required.total);
}

// =============================================================================
// BLOCKING ISSUES
// =============================================================================

/**
 * Compute blocking issues list
 */
export function computeBlockingIssues(project, scope, tier) {
  const scopeNodes = getScopeNodes(project, scope);
  const required = getRequiredArtifactsForTier(tier);

  return {
    missingArtifacts: findMissingArtifacts(project, scopeNodes, required),
    missingGates: findMissingGateApprovals(project, scopeNodes, tier),
    traceCoverageGaps: findTraceCoverageGaps(project, scopeNodes, required.traceThreshold),
    missingCorrelation: tier === 3 ? findMissingCorrelation(project, scopeNodes) : [],
    missingInterfaceApprovals: findMissingInterfaceApprovals(project, scopeNodes),
    get total() {
      return this.missingArtifacts.length +
        this.missingGates.length +
        this.traceCoverageGaps.length +
        this.missingCorrelation.length +
        this.missingInterfaceApprovals.length;
    }
  };
}

function findMissingArtifacts(project, scopeNodes, required) {
  const missing = [];

  if (!hasRequirements(scopeNodes)) {
    missing.push({ phase: '1', type: 'requirements', label: 'Requirements not defined', blocking: true });
  }
  if (!hasCadModels(scopeNodes)) {
    missing.push({ phase: '3', type: 'cad', label: 'CAD models not uploaded', blocking: true });
  }
  if (required.tradeStudies && !hasTradeStudies(project, scopeNodes)) {
    missing.push({ phase: '2', type: 'trade_study', label: 'Trade studies not completed', blocking: false });
  }
  if (required.doeStudies && !hasDoeStudies(project, scopeNodes)) {
    missing.push({ phase: '2', type: 'doe', label: 'DOE studies not completed', blocking: false });
  }
  if (!hasAnalysisChecks(project, scopeNodes)) {
    missing.push({ phase: '5', type: 'analysis', label: 'Analysis checks not completed', blocking: true });
  }
  if (!hasTestResults(project, scopeNodes)) {
    missing.push({ phase: '6', type: 'test', label: 'Test results not recorded', blocking: true });
  }
  if (required.correlationData && !hasCorrelationData(project, scopeNodes)) {
    missing.push({ phase: '7', type: 'correlation', label: 'Correlation data not provided', blocking: true });
  }
  if (required.serviceabilityReview && !hasServiceabilityReview(scopeNodes)) {
    missing.push({ phase: '3b', type: 'serviceability', label: 'Serviceability review incomplete', blocking: false });
  }
  if (required.manufacturabilityReview && !hasManufacturabilityReview(scopeNodes)) {
    missing.push({ phase: '3c', type: 'manufacturability', label: 'Manufacturability review incomplete', blocking: false });
  }
  if (!hasFixtures(project, scopeNodes)) {
    missing.push({ phase: '3c', type: 'fixtures', label: 'Manufacturing fixtures not linked', blocking: false });
  }

  return missing;
}

function findMissingGateApprovals(project, scopeNodes, tier) {
  const missing = [];
  const tierConfig = RIGOR_TIERS[tier] || RIGOR_TIERS[2];
  const requiredGates = tierConfig.gateRequirements || [];

  // Check each required gate
  requiredGates.forEach(gateType => {
    scopeNodes.forEach(node => {
      const nodeGates = node.gate_approvals || [];
      const gateForType = nodeGates.find(g => g.gate_type === gateType);

      if (!gateForType || gateForType.status !== 'approved') {
        missing.push({
          nodeId: node.id,
          nodeName: node.name,
          gateType: gateType,
          label: `${node.name}: ${gateType} gate not approved`
        });
      }
    });
  });

  return missing;
}

function findTraceCoverageGaps(project, scopeNodes, threshold) {
  const gaps = [];

  scopeNodes.forEach(node => {
    const requirements = node.requirements || [];
    const traced = requirements.filter(r => r.verification_evidence && r.verification_evidence.length > 0);
    const coverage = requirements.length > 0 ? traced.length / requirements.length : 0;

    if (coverage < threshold) {
      gaps.push({
        nodeId: node.id,
        nodeName: node.name,
        coverage: coverage,
        threshold: threshold,
        label: `${node.name}: Trace coverage ${Math.round(coverage * 100)}% (required: ${Math.round(threshold * 100)}%)`
      });
    }
  });

  return gaps;
}

function findMissingCorrelation(project, scopeNodes) {
  const missing = [];

  // Look for test cases that should have correlation data
  const testCases = project.test_cases || [];
  const scopePartNumbers = scopeNodes.map(n => n.part_number);

  testCases
    .filter(tc => scopePartNumbers.includes(tc.owning_node_part_number))
    .filter(tc => tc.status === 'passed' || tc.status === 'failed')
    .forEach(tc => {
      if (!tc.correlation_factor && !tc.predicted_vs_actual) {
        missing.push({
          testId: tc.test_id,
          testName: tc.name,
          label: `${tc.name}: Missing correlation data`
        });
      }
    });

  return missing;
}

function findMissingInterfaceApprovals(project, scopeNodes) {
  const missing = [];

  scopeNodes.forEach(node => {
    const interfaces = node.interfaces || [];
    interfaces.forEach(iface => {
      if (iface.status !== 'approved' && iface.status !== 'released') {
        missing.push({
          nodeId: node.id,
          nodeName: node.name,
          interfaceId: iface.id,
          interfaceName: iface.name,
          label: `${node.name}: Interface "${iface.name}" not approved`
        });
      }
    });
  });

  return missing;
}

// =============================================================================
// SECTION STATUS
// =============================================================================

/**
 * Compute status for each report section
 */
export function computeSectionStatuses(project, scope, tier) {
  const scopeNodes = getScopeNodes(project, scope);
  const statuses = {};

  Object.entries(COMPLETE_REPORT_SECTIONS).forEach(([key, section]) => {
    statuses[key] = computeSingleSectionStatus(project, scopeNodes, section, tier);
  });

  return statuses;
}

function computeSingleSectionStatus(project, scopeNodes, section, tier) {
  const sourceChecks = {
    project_info: () => true, // Always available
    revision: () => scopeNodes.some(n => n.revision),
    status: () => true,
    phase_1_objectives: () => hasRequirements(scopeNodes),
    phase_7_decision: () => scopeNodes.some(n => n.phase === 7 && n.phase_status === 'completed'),
    key_deltas: () => scopeNodes.some(n => n.weight_delta || n.cost_delta || n.performance_delta),
    primary_cad: () => hasCadModels(scopeNodes),
    requirements: () => hasRequirements(scopeNodes),
    constraints: () => hasConstraints(scopeNodes),
    non_goals: () => hasNonGoals(scopeNodes),
    change_intent: () => true, // Optional
    trade_studies: () => hasTradeStudies(project, scopeNodes),
    doe_results: () => hasDoeStudies(project, scopeNodes),
    prior_art: () => hasPriorArtReview(scopeNodes),
    cad_models: () => hasCadModels(scopeNodes),
    design_decisions: () => hasDesignDecisions(scopeNodes),
    icd: () => hasIcdApproval(scopeNodes),
    serviceability: () => hasServiceabilityReview(scopeNodes),
    manufacturability: () => hasManufacturabilityReview(scopeNodes),
    load_cases: () => hasLoadCases(scopeNodes),
    analysis_assumptions: () => scopeNodes.some(n => n.analysis_assumptions),
    analysis_methods: () => hasAnalysisChecks(project, scopeNodes),
    test_plan_matrix: () => hasTestPlan(project, scopeNodes),
    test_summary: () => hasTestResults(project, scopeNodes),
    test_plots: () => hasTestReports(project, scopeNodes),
    correlation_tables: () => hasCorrelationData(project, scopeNodes),
    pass_fail_statements: () => hasTestResults(project, scopeNodes),
    bom: () => scopeNodes.some(n => n.children && n.children.length > 0),
    manufacturing_plans: () => hasManufacturabilityReview(scopeNodes),
    ctqs: () => scopeNodes.some(n => n.ctqs && n.ctqs.length > 0),
    fixtures: () => hasFixtures(project, scopeNodes),
    assembly_sequence: () => scopeNodes.some(n => n.assembly_sequence),
    safety_requirements: () => scopeNodes.some(n => (n.requirements || []).some(r => r.category === 'safety')),
    hazard_analysis: () => scopeNodes.some(n => n.hazard_analysis),
    safety_gate_status: () => scopeNodes.some(n => (n.gate_approvals || []).some(g => g.gate_type === 'safety')),
    rule_references: () => scopeNodes.some(n => n.rule_references),
    citations: () => scopeNodes.some(n => n.citations && n.citations.length > 0),
    external_standards: () => scopeNodes.some(n => n.external_standards),
    contributors: () => true,
    trace_matrix: () => hasRequirements(scopeNodes),
    calculations_index: () => hasAnalysisChecks(project, scopeNodes),
    doe_index: () => hasDoeStudies(project, scopeNodes),
    test_data_index: () => hasTestResults(project, scopeNodes),
    change_history: () => true,
    artifact_index: () => true
  };

  const sources = section.sources || [];
  const checks = sources.map(src => ({
    source: src,
    present: sourceChecks[src] ? sourceChecks[src]() : false,
    blocking: ['requirements', 'cad_models', 'analysis_methods', 'test_summary'].includes(src)
  }));

  const missing = checks.filter(c => !c.present);
  const hasBlocking = missing.some(m => m.blocking);

  if (missing.length === 0) {
    return { status: 'complete', label: 'Complete', color: 'emerald', missing: [] };
  }
  if (hasBlocking) {
    return { status: 'blocked', label: 'Blocked', color: 'red', missing };
  }
  return { status: 'incomplete', label: 'Incomplete', color: 'amber', missing };
}

// =============================================================================
// OVERALL STATUS
// =============================================================================

/**
 * Compute overall report validation status
 */
export function computeOverallStatus(project, scope, tier) {
  const evidence = computeEvidenceCompleteness(project, scope, tier);
  const blocking = computeBlockingIssues(project, scope, tier);
  const gatesApproved = areAllRequiredGatesApproved(project, scope, tier);
  const traceThresholdMet = isTraceCoverageMet(project, scope, tier);

  if (gatesApproved && traceThresholdMet && blocking.total === 0) {
    return REPORT_STATUS.VALIDATED;
  }
  if (evidence >= 0.8) {
    return REPORT_STATUS.IN_REVIEW;
  }
  return REPORT_STATUS.DRAFT;
}

function areAllRequiredGatesApproved(project, scope, tier) {
  const scopeNodes = getScopeNodes(project, scope);
  const tierConfig = RIGOR_TIERS[tier] || RIGOR_TIERS[2];
  const requiredGates = tierConfig.gateRequirements || [];

  if (requiredGates.length === 0) return true;

  return scopeNodes.every(node => {
    const nodeGates = node.gate_approvals || [];
    return requiredGates.every(gateType =>
      nodeGates.some(g => g.gate_type === gateType && g.status === 'approved')
    );
  });
}

function isTraceCoverageMet(project, scope, tier) {
  const scopeNodes = getScopeNodes(project, scope);
  const tierConfig = RIGOR_TIERS[tier] || RIGOR_TIERS[2];
  const threshold = tierConfig.traceThreshold || 0.8;

  return scopeNodes.every(node => {
    const requirements = node.requirements || [];
    if (requirements.length === 0) return true;

    const traced = requirements.filter(r => r.verification_evidence && r.verification_evidence.length > 0);
    return traced.length / requirements.length >= threshold;
  });
}

// =============================================================================
// GATE STATUS SUMMARY
// =============================================================================

/**
 * Compute gate status summary for display
 */
export function computeGateStatusSummary(project, scope, tier) {
  const scopeNodes = getScopeNodes(project, scope);
  const tierConfig = RIGOR_TIERS[tier] || RIGOR_TIERS[2];
  const requiredGates = tierConfig.gateRequirements || [];

  let approved = 0;
  let total = 0;

  scopeNodes.forEach(node => {
    const nodeGates = node.gate_approvals || [];
    requiredGates.forEach(gateType => {
      total++;
      if (nodeGates.some(g => g.gate_type === gateType && g.status === 'approved')) {
        approved++;
      }
    });
  });

  return { approved, total, percentage: total > 0 ? Math.round((approved / total) * 100) : 100 };
}

/**
 * Compute trace coverage summary for display
 */
export function computeTraceSummary(project, scope) {
  const scopeNodes = getScopeNodes(project, scope);
  let totalReqs = 0;
  let tracedReqs = 0;

  scopeNodes.forEach(node => {
    const requirements = node.requirements || [];
    totalReqs += requirements.length;
    tracedReqs += requirements.filter(r => r.verification_evidence && r.verification_evidence.length > 0).length;
  });

  return {
    traced: tracedReqs,
    total: totalReqs,
    percentage: totalReqs > 0 ? Math.round((tracedReqs / totalReqs) * 100) : 100
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getScopeNodes(project, scope) {
  if (!project || !project.root_node) return [];

  if (scope.type === 'project') {
    return flattenNodes(project.root_node);
  }

  if (scope.type === 'node' && scope.nodeIds) {
    const allNodes = flattenNodes(project.root_node);
    return allNodes.filter(n => scope.nodeIds.includes(n.id));
  }

  return flattenNodes(project.root_node);
}

function flattenNodes(node, result = []) {
  if (!node) return result;

  // Only include physical nodes (not virtual folders)
  if (node.node_class === 'product' || node.node_class === 'manufacturing_asset') {
    result.push(node);
  }

  if (node.children) {
    node.children.forEach(child => flattenNodes(child, result));
  }

  return result;
}

function hasRequirements(nodes) {
  return nodes.some(n => n.requirements && n.requirements.length > 0);
}

function hasConstraints(nodes) {
  return nodes.some(n => n.constraints && n.constraints.length > 0);
}

function hasNonGoals(nodes) {
  return nodes.some(n => n.non_goals && n.non_goals.length > 0);
}

function hasTradeStudies(project, nodes) {
  const studies = project.engineering_studies || [];
  const partNumbers = nodes.map(n => n.part_number);
  return studies.some(s =>
    s.type === 'trade_study' && partNumbers.includes(s.owning_node_part_number)
  );
}

function hasDoeStudies(project, nodes) {
  const studies = project.engineering_studies || [];
  const partNumbers = nodes.map(n => n.part_number);
  return studies.some(s =>
    s.type === 'doe' && partNumbers.includes(s.owning_node_part_number)
  );
}

function hasPriorArtReview(nodes) {
  return nodes.some(n => n.prior_art_review || (n.citations && n.citations.length > 0));
}

function hasCadModels(nodes) {
  return nodes.some(n =>
    n.attachments && n.attachments.some(a => a.type === 'cad')
  );
}

function hasDesignDecisions(nodes) {
  return nodes.some(n => n.design_decisions && n.design_decisions.length > 0);
}

function hasIcdApproval(nodes) {
  return nodes.some(n => n.icd_status === 'approved' || n.icd_status === 'released');
}

function hasServiceabilityReview(nodes) {
  return nodes.some(n => n.serviceability_considerations || n.serviceability_review_complete);
}

function hasManufacturabilityReview(nodes) {
  return nodes.some(n => n.manufacturability_considerations || n.manufacturability_review_complete);
}

function hasLoadCases(nodes) {
  return nodes.some(n => n.load_cases && n.load_cases.length > 0);
}

function hasAnalysisChecks(project, nodes) {
  // Check for engineering studies of analysis type or analysis_checks on nodes
  const studies = project.engineering_studies || [];
  const partNumbers = nodes.map(n => n.part_number);
  const hasStudies = studies.some(s =>
    (s.type === 'sensitivity' || s.type === 'parametric') &&
    partNumbers.includes(s.owning_node_part_number)
  );
  const hasNodeChecks = nodes.some(n => n.analysis_checks && n.analysis_checks.length > 0);
  return hasStudies || hasNodeChecks;
}

function hasMarginCalculations(nodes) {
  return nodes.some(n =>
    n.analysis_checks && n.analysis_checks.some(ac => ac.margin_of_safety !== undefined)
  );
}

function hasTestPlan(project, nodes) {
  const testCases = project.test_cases || [];
  const partNumbers = nodes.map(n => n.part_number);
  return testCases.some(tc => partNumbers.includes(tc.owning_node_part_number));
}

function hasTestResults(project, nodes) {
  const testCases = project.test_cases || [];
  const partNumbers = nodes.map(n => n.part_number);
  return testCases.some(tc =>
    partNumbers.includes(tc.owning_node_part_number) &&
    (tc.status === 'passed' || tc.status === 'failed')
  );
}

function hasTestReports(project, nodes) {
  const testCases = project.test_cases || [];
  const partNumbers = nodes.map(n => n.part_number);
  return testCases.some(tc =>
    partNumbers.includes(tc.owning_node_part_number) &&
    tc.attachments && tc.attachments.some(a => a.type === 'test_report')
  );
}

function hasCorrelationData(project, nodes) {
  const testCases = project.test_cases || [];
  const partNumbers = nodes.map(n => n.part_number);
  return testCases.some(tc =>
    partNumbers.includes(tc.owning_node_part_number) &&
    (tc.correlation_factor || tc.predicted_vs_actual)
  );
}

function hasFixtures(project, nodes) {
  const fixtures = project.manufacturing_assets || [];
  const partNumbers = nodes.map(n => n.part_number);
  return fixtures.some(f =>
    f.linked_product_nodes && f.linked_product_nodes.some(pn => partNumbers.includes(pn))
  );
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

/**
 * Get export configuration based on status and mode
 */
export function getExportConfig(status, mode) {
  const isDraft = mode === 'draft' || status.code !== 'VALIDATED';

  return {
    watermark: isDraft ? status.code : null,
    banner: isDraft ? `${status.label.toUpperCase()} REPORT – NOT VALIDATED` : null,
    includeBlockingIssues: isDraft,
    validationStamp: !isDraft
  };
}

/**
 * Generate complete report status summary for UI display
 */
export function generateReportStatusSummary(project, scope, tier) {
  const status = computeOverallStatus(project, scope, tier);
  const evidence = computeEvidenceCompleteness(project, scope, tier);
  const blocking = computeBlockingIssues(project, scope, tier);
  const gates = computeGateStatusSummary(project, scope, tier);
  const trace = computeTraceSummary(project, scope);
  const sections = computeSectionStatuses(project, scope, tier);

  return {
    status,
    evidence: Math.round(evidence * 100),
    blocking,
    gates,
    trace,
    sections,
    canExportValidated: status.allowValidatedExport,
    canExportDraft: true // Always true
  };
}
