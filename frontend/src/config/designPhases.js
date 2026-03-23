// Engineering Design Cycle - 7-Phase Configuration
// Phase 3 includes sub-phases (3a: CAD, 3b: Serviceability, 3c: Manufacturability)
//
// =============================================================================
// DOMAIN LENS CONCEPT
// =============================================================================
//
// The Engineering Design Cycle is domain-agnostic by design. Projects may select
// a Domain Lens to add context-specific prompts, terminology, and examples without
// altering the fundamental 7-phase structure.
//
// Available Domain Lenses:
// - Vehicle: Automotive, motorsport, or mobility platforms
// - Industrial Equipment: Heavy machinery, factory equipment, tooling
// - Consumer Product: Electronics, appliances, consumer goods
// - Energy Systems: Power generation, storage, distribution equipment
// - Medical Device: Regulated medical and life sciences equipment
// - Aerospace: Aircraft, spacecraft, and related systems
// - General: Default lens with no domain-specific additions
//
// Domain lenses provide:
// - Context-specific terminology mappings
// - Industry-relevant example prompts
// - Domain-appropriate validation checklists
// - Regulatory guidance where applicable
//
// IMPORTANT: Domain lenses add context, not phases. The 7-phase structure
// remains constant across all project types.
// =============================================================================

// =============================================================================
// DOMAIN LENSES
// =============================================================================

export const DOMAIN_LENSES = {
  general: {
    code: 'general',
    name: 'General Engineering',
    description: 'Default lens for general engineering projects',
    icon: 'Settings',
    exampleProducts: ['Custom equipment', 'Prototypes', 'One-off designs'],
    terminologyOverrides: {}
  },
  vehicle: {
    code: 'vehicle',
    name: 'Vehicle / Mobility',
    description: 'Automotive, motorsport, and mobility platforms',
    icon: 'Car',
    exampleProducts: ['Cars', 'Motorcycles', 'Off-road vehicles', 'Electric vehicles'],
    terminologyOverrides: {
      'Platform Specification': 'Vehicle Specification',
      'System Test': 'Vehicle-Level Test',
      'End-to-End Test': 'Full Vehicle Test'
    }
  },
  industrial: {
    code: 'industrial',
    name: 'Industrial Equipment',
    description: 'Heavy machinery, factory equipment, and tooling',
    icon: 'Factory',
    exampleProducts: ['CNC machines', 'Conveyors', 'Hydraulic presses', 'Robotic cells'],
    terminologyOverrides: {
      'Platform Specification': 'Machine Specification',
      'End-to-End Test': 'Production Acceptance Test'
    }
  },
  consumer: {
    code: 'consumer',
    name: 'Consumer Product',
    description: 'Electronics, appliances, and consumer goods',
    icon: 'Package',
    exampleProducts: ['Appliances', 'Power tools', 'Electronics', 'Furniture'],
    terminologyOverrides: {
      'Platform Specification': 'Product Specification',
      'Reviewers': 'Product Management / QA'
    }
  },
  energy: {
    code: 'energy',
    name: 'Energy Systems',
    description: 'Power generation, storage, and distribution equipment',
    icon: 'Zap',
    exampleProducts: ['Battery systems', 'Inverters', 'Solar arrays', 'Wind turbines'],
    terminologyOverrides: {
      'Platform Specification': 'System Specification',
      'Safety Gate': 'Electrical Safety Gate'
    }
  },
  medical: {
    code: 'medical',
    name: 'Medical Device',
    description: 'Regulated medical and life sciences equipment',
    icon: 'Heart',
    exampleProducts: ['Diagnostic equipment', 'Surgical instruments', 'Implants'],
    terminologyOverrides: {
      'Safety Gate': 'Regulatory Compliance Gate',
      'Reviewers': 'Quality/Regulatory Affairs'
    }
  },
  aerospace: {
    code: 'aerospace',
    name: 'Aerospace',
    description: 'Aircraft, spacecraft, and related systems',
    icon: 'Plane',
    exampleProducts: ['Aircraft structures', 'Avionics', 'Propulsion systems'],
    terminologyOverrides: {
      'Safety Gate': 'Airworthiness Gate',
      'Reviewers': 'DER / Designated Engineering Representative'
    }
  }
};

// =============================================================================
// SPECIFICATION HIERARCHY
// =============================================================================
//
// The specification hierarchy is domain-agnostic. Projects may use any level
// as their entry point depending on scope.
//
// Top-level:    Platform or Product Specifications
//               (e.g., Vehicle Spec, Machine Spec, Device Spec)
//
// Mid-level:    System or Subsystem Specifications
//               (e.g., Powertrain Spec, Hydraulic System Spec, Control Module Spec)
//
// Bottom-level: Component Specifications
//               (e.g., Bracket Spec, Valve Spec, PCB Spec)
//
// All levels require:
// - Unique specification IDs
// - Version control with revision history
// - Traceability to parent specifications (where applicable)
// - Clear acceptance criteria
// =============================================================================

export const SPECIFICATION_LEVELS = {
  PLATFORM: {
    code: 'platform',
    name: 'Platform / Product',
    description: 'Top-level product or platform specification',
    examples: ['Vehicle specification', 'Machine specification', 'Device specification'],
    requiredSections: ['scope', 'performance_requirements', 'interfaces', 'constraints']
  },
  SYSTEM: {
    code: 'system',
    name: 'System',
    description: 'Major functional system within a platform',
    examples: ['Powertrain spec', 'Hydraulic system spec', 'Control system spec'],
    requiredSections: ['scope', 'functional_requirements', 'interfaces', 'performance']
  },
  SUBSYSTEM: {
    code: 'subsystem',
    name: 'Subsystem',
    description: 'Subsystem within a larger system',
    examples: ['Transmission spec', 'Cooling subsystem spec', 'Sensor module spec'],
    requiredSections: ['scope', 'functional_requirements', 'interfaces']
  },
  COMPONENT: {
    code: 'component',
    name: 'Component',
    description: 'Individual component specification',
    examples: ['Bracket spec', 'Valve spec', 'PCB spec', 'Housing spec'],
    requiredSections: ['scope', 'requirements', 'materials', 'dimensions']
  }
};

// =============================================================================
// NODE CLASSES (Functional vs Physical Distinction)
// =============================================================================

export const NODE_CLASSES = {
  FUNCTIONAL_GROUP: {
    code: 'functional_group',
    name: 'Functional Group',
    description: 'Organizational grouping - no parts, revisions, or attachments',
    allowsAttachments: false,
    allowsRevisions: false,
    allowsPhases: false,
    icon: 'Folder',
    color: 'slate',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
    textColor: 'text-slate-400'
  },
  PRODUCT: {
    code: 'product',
    name: 'Product',
    description: 'Physical buildable item - attachments, revisions, and phases allowed',
    allowsAttachments: true,
    allowsRevisions: true,
    allowsPhases: true,
    icon: 'Package',
    color: 'violet',
    bgColor: 'bg-violet-500/20',
    borderColor: 'border-violet-500/30',
    textColor: 'text-violet-400'
  },
  MANUFACTURING_ASSET: {
    code: 'manufacturing_asset',
    name: 'Manufacturing Asset',
    description: 'Fixtures, jigs, and tooling for production',
    allowsAttachments: true,
    allowsRevisions: true,
    allowsPhases: true,
    icon: 'Wrench',
    color: 'orange',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    textColor: 'text-orange-400'
  },
  TEST_ASSET: {
    code: 'test_asset',
    name: 'Test Asset',
    description: 'Test equipment and validation tools',
    allowsAttachments: true,
    allowsRevisions: true,
    allowsPhases: true,
    icon: 'FlaskConical',
    color: 'cyan',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400'
  }
};

// Get node class config by code
export function getNodeClassConfig(code) {
  return Object.values(NODE_CLASSES).find(nc => nc.code === code) || NODE_CLASSES.PRODUCT;
}

// Check if a node class allows attachments
export function nodeClassAllowsAttachments(classCode) {
  const config = getNodeClassConfig(classCode);
  return config?.allowsAttachments ?? true;
}

// Check if a node class allows revisions
export function nodeClassAllowsRevisions(classCode) {
  const config = getNodeClassConfig(classCode);
  return config?.allowsRevisions ?? true;
}

// Check if a node class allows phase tracking
export function nodeClassAllowsPhases(classCode) {
  const config = getNodeClassConfig(classCode);
  return config?.allowsPhases ?? true;
}

// =============================================================================
// NODE TYPES (Hierarchy Model)
// =============================================================================

export const NODE_TYPES = {
  ASSY: {
    code: 'ASSY',
    name: 'Assembly',
    description: 'Top-level physical product or deliverable',
    isPhysical: true,
    canBeRoot: true,
    icon: 'Box',
    color: 'violet',
    allowedChildren: ['SYS', 'SUBASSY', 'COMP', 'PURCH', 'DOC']
  },
  SYS: {
    code: 'SYS',
    name: 'System',
    description: 'Major functional grouping within an assembly',
    isPhysical: true,
    canBeRoot: false,
    icon: 'Layers',
    color: 'blue',
    allowedChildren: ['SUBSYS', 'SUBASSY', 'COMP', 'PURCH', 'DOC']
  },
  SUBSYS: {
    code: 'SUBSYS',
    name: 'Subsystem',
    description: 'Optional intermediate grouping',
    isPhysical: true,
    canBeRoot: false,
    icon: 'GitBranch',
    color: 'cyan',
    allowedChildren: ['SUBASSY', 'COMP', 'PURCH', 'DOC']
  },
  SUBASSY: {
    code: 'SUBASSY',
    name: 'Subassembly',
    description: 'Group of components manufactured or serviced together',
    isPhysical: true,
    canBeRoot: false,
    icon: 'Package',
    color: 'green',
    allowedChildren: ['COMP', 'PURCH', 'DOC']
  },
  COMP: {
    code: 'COMP',
    name: 'Component',
    description: 'Single designed part',
    isPhysical: true,
    canBeRoot: false,
    icon: 'Hexagon',
    color: 'amber',
    allowedChildren: ['DOC']
  },
  PURCH: {
    code: 'PURCH',
    name: 'Purchased Part',
    description: 'Buy item with interface requirements',
    isPhysical: true,
    canBeRoot: false,
    icon: 'ShoppingCart',
    color: 'orange',
    allowedChildren: ['DOC']
  },
  DOC: {
    code: 'DOC',
    name: 'Document Only',
    description: 'Non-physical node for specs, procedures, compliance',
    isPhysical: false,
    canBeRoot: true,
    icon: 'FileText',
    color: 'gray',
    allowedChildren: ['DOC']
  }
};

// Get allowed child types for a parent node type
export function getAllowedChildTypes(parentType) {
  if (!parentType) {
    // Root level - only Assembly and Document Only can be root
    return Object.values(NODE_TYPES).filter(t => t.canBeRoot).map(t => t.code);
  }
  return NODE_TYPES[parentType]?.allowedChildren || [];
}

// Validate parent-child relationship
export function isValidParentChild(parentType, childType) {
  if (!parentType) {
    return NODE_TYPES[childType]?.canBeRoot || false;
  }
  return NODE_TYPES[parentType]?.allowedChildren?.includes(childType) || false;
}

// =============================================================================
// REPORT TYPES
// =============================================================================

// Report validation status (computed, not user-set)
export const REPORT_STATUS = {
  VALIDATED: {
    code: 'VALIDATED',
    label: 'Validated',
    description: 'All tier requirements met, ready for release',
    color: 'emerald',
    allowValidatedExport: true
  },
  IN_REVIEW: {
    code: 'IN_REVIEW',
    label: 'In Review',
    description: 'Evidence largely complete but missing approvals or trace thresholds',
    color: 'amber',
    allowValidatedExport: false
  },
  DRAFT: {
    code: 'DRAFT',
    label: 'Draft',
    description: 'Incomplete evidence or significant missing artifacts',
    color: 'slate',
    allowValidatedExport: false
  }
};

// Complete Design Report sections with data source mappings
export const COMPLETE_REPORT_SECTIONS = {
  cover_page: {
    key: 'cover_page',
    name: 'Cover Page',
    required: true,
    order: 1,
    sources: ['project_info', 'revision', 'status']
  },
  executive_summary: {
    key: 'executive_summary',
    name: 'Executive Summary',
    required: true,
    order: 2,
    sources: ['phase_1_objectives', 'phase_7_decision', 'key_deltas', 'primary_cad'],
    constraints: { maxPages: 1, maxFigures: 1 }
  },
  design_problem: {
    key: 'design_problem',
    name: 'Design Problem and Objectives',
    required: true,
    order: 3,
    sources: ['requirements', 'constraints', 'non_goals', 'change_intent']
  },
  detailed_design: {
    key: 'detailed_design',
    name: 'Detailed Design Documentation',
    required: true,
    order: 4,
    sources: ['trade_studies', 'doe_results', 'prior_art', 'cad_models', 'design_decisions', 'icd', 'serviceability', 'manufacturability']
  },
  fea_test_plans: {
    key: 'fea_test_plans',
    name: 'FEA and Test Plans',
    required: true,
    order: 5,
    sources: ['load_cases', 'analysis_assumptions', 'analysis_methods', 'test_plan_matrix'],
    requiresTrace: true
  },
  testing_results: {
    key: 'testing_results',
    name: 'Testing Results',
    required: true,
    order: 6,
    sources: ['test_summary', 'test_plots', 'correlation_tables', 'pass_fail_statements']
  },
  bom_manufacturing: {
    key: 'bom_manufacturing',
    name: 'Bill of Materials and Manufacturing Process',
    required: true,
    order: 7,
    sources: ['bom', 'manufacturing_plans', 'ctqs', 'fixtures', 'assembly_sequence']
  },
  safety: {
    key: 'safety',
    name: 'Safety',
    required: true,
    order: 8,
    sources: ['safety_requirements', 'hazard_analysis', 'safety_gate_status', 'rule_references']
  },
  references: {
    key: 'references',
    name: 'References',
    required: false,
    order: 9,
    sources: ['citations', 'external_standards', 'contributors']
  },
  appendices: {
    key: 'appendices',
    name: 'Appendices',
    required: true,
    order: 10,
    sources: ['trace_matrix', 'calculations_index', 'doe_index', 'test_data_index', 'change_history', 'artifact_index']
  }
};

export const REPORT_TYPES = {
  complete_design_report: {
    key: 'complete_design_report',
    name: 'Complete Engineering Design Report',
    description: 'End-to-end design record aligned to SAE / academic / industry design review standards',
    subtitle: 'Comprehensive design documentation with full traceability',
    icon: 'BookOpen',
    isComposed: true,
    highlights: [
      'Executive summary',
      'Specifications → Design → Analysis → Test → Correlation',
      'Manufacturing, Serviceability, Safety',
      'Appendices with traceability'
    ],
    sections: Object.keys(COMPLETE_REPORT_SECTIONS),
    sectionConfig: COMPLETE_REPORT_SECTIONS
  },
  design_summary: {
    key: 'design_summary',
    name: 'Design Summary Report',
    description: 'Overview of design status, progress, and key decisions',
    icon: 'FileText',
    sections: ['overview', 'progress', 'decisions', 'metrics']
  },
  requirements_traceability: {
    key: 'requirements_traceability',
    name: 'Requirements and Traceability Report',
    description: 'Full requirements list with trace matrix',
    icon: 'Link',
    sections: ['requirements', 'trace_matrix', 'coverage']
  },
  analysis_pack: {
    key: 'analysis_pack',
    name: 'Analysis Report Pack',
    description: 'All analysis checks, methods, results, and margins',
    icon: 'Calculator',
    sections: ['load_cases', 'assumptions', 'analysis_checks', 'margins']
  },
  test_validation_pack: {
    key: 'test_validation_pack',
    name: 'Test and Validation Report Pack',
    description: 'Test plans, results, pass/fail summary',
    icon: 'FlaskConical',
    sections: ['test_plan', 'test_cases', 'results', 'summary']
  },
  gate_approvals_audit: {
    key: 'gate_approvals_audit',
    name: 'Gate and Approvals Audit Report',
    description: 'Gate status, approver history, escalations',
    icon: 'Shield',
    sections: ['gate_status', 'approval_history', 'escalations']
  },
  stakeholder_review: {
    key: 'stakeholder_review',
    name: 'Stakeholder Review Report',
    description: 'Comprehensive narrative format for reviewers, stakeholders, or customers',
    icon: 'Users',
    sections: [
      'executive_summary',
      'design_intent',
      'requirements_metrics',
      'trade_studies',
      'design_description',
      'serviceability_manufacturability',
      'analysis_results',
      'test_results',
      'correlation_learnings',
      'risk_management',
      'compliance_safety',
      'innovation_summary',
      'appendix'
    ]
  }
};

export const REPORT_FORMATS = [
  { key: 'pdf', name: 'PDF', icon: 'FileText' },
  { key: 'docx', name: 'Word Document', icon: 'FileText' },
  { key: 'html', name: 'HTML', icon: 'Globe' }
];

// =============================================================================
// RIGOR TIERS
// =============================================================================
//
// Rigor tiers scale documentation and gate requirements based on risk level.
// Examples provided are domain-agnostic; apply your domain lens for context.
//
// Tier selection criteria:
// - Consequence of failure (safety, financial, operational)
// - Complexity of design and interfaces
// - Regulatory or compliance requirements
// - Customer or stakeholder expectations
// =============================================================================

export const RIGOR_TIERS = {
  1: {
    name: 'Simple',
    description: 'Standard parts, low risk',
    examples: [
      'Brackets, covers, non-structural items',
      'Non-critical enclosures or guards',
      'Simple fixtures with no moving parts'
    ],
    requiredGates: [],
    requirementTraceCoverage: 0.5,
    requiresInterfaceApproval: false,
    requiresSignedArtifacts: false,
    color: 'gray'
  },
  2: {
    name: 'Standard',
    description: 'Moderate complexity/risk',
    examples: [
      'Structural members and load-bearing components',
      'Mechanisms and moving assemblies',
      'Fluid or electrical interfaces',
      'Components affecting system performance'
    ],
    requiredGates: ['cost'],
    requirementTraceCoverage: 0.8,
    requiresInterfaceApproval: true,
    requiresSignedArtifacts: false,
    color: 'blue'
  },
  3: {
    name: 'Critical',
    description: 'Safety-critical, high consequence',
    examples: [
      'Pressure vessels, lifting equipment, fall protection',
      'Braking systems, steering components (vehicles)',
      'Safety interlocks, emergency stops (equipment)',
      'Life-sustaining or implantable components (medical)',
      'Flight-critical structures (aerospace)'
    ],
    requiredGates: ['cost', 'safety', 'manufacturability', 'serviceability'],
    requirementTraceCoverage: 1.0,
    requiresInterfaceApproval: true,
    requiresSignedArtifacts: true,
    color: 'red'
  }
};

export const GATE_TYPES = {
  cost: {
    name: 'Cost Gate',
    description: 'Verify design meets cost targets',
    ownerRole: 'Finance/Program Manager',
    triggeredAtPhase: 3,
    triggeredAtSubPhase: 'c',
    icon: 'DollarSign'
  },
  safety: {
    name: 'Safety Gate',
    description: 'Confirm all safety requirements verified',
    ownerRole: 'Safety Engineer',
    triggeredAtPhase: 6,
    triggeredAtSubPhase: null,
    icon: 'Shield'
  },
  manufacturability: {
    name: 'Manufacturability Gate',
    description: 'Confirm design can be produced',
    ownerRole: 'Manufacturing Engineer',
    triggeredAtPhase: 3,
    triggeredAtSubPhase: 'c',
    icon: 'Factory'
  },
  serviceability: {
    name: 'Serviceability Gate',
    description: 'Confirm design can be maintained',
    ownerRole: 'Service Engineering',
    triggeredAtPhase: 3,
    triggeredAtSubPhase: 'b',
    icon: 'Wrench'
  }
};

export const SCORING_WEIGHTS = {
  phase1: { weight: 5, name: 'Requirements' },
  phase2: { weight: 5, name: 'R&D' },
  phase3a: { weight: 15, name: 'Design/CAD' },
  phase3bc: { weight: 5, name: 'Service + Mfg' },
  phase4: { weight: 15, name: 'Data Collection' },
  phase5: { weight: 25, name: 'Analysis' },
  phase6: { weight: 15, name: 'Testing' },
  phase7: { weight: 15, name: 'Correlation' }
};

export const INTERFACE_TYPES = [
  { key: 'mechanical_envelope', name: 'Mechanical Envelope', description: 'Bounding box, keep-out zones', required: true },
  { key: 'mounting_datums', name: 'Mounting Datums', description: 'Primary/secondary/tertiary datums, fastener locations', required: true },
  { key: 'electrical', name: 'Electrical Connectors', description: 'Connector type, pinout, voltage/current', conditional: true },
  { key: 'fluid', name: 'Fluid Ports', description: 'Port size, thread type, pressure rating', conditional: true },
  { key: 'software', name: 'Software/Firmware', description: 'Protocol, data format, update method', conditional: true },
  { key: 'tolerance_stack', name: 'Tolerance Stack', description: 'Fit assumptions, worst-case analysis', required: true }
];

export const REVISION_TRIGGERS = [
  { key: 'phase7_correlation', name: 'Phase 7 Correlation', description: 'Learning from analysis-test comparison' },
  { key: 'dfm_issue', name: 'DFM Issue', description: 'Manufacturing discovered design problem' },
  { key: 'supplier_change', name: 'Supplier Change', description: 'Vendor or material substitution' },
  { key: 'cost_reduction', name: 'Cost Reduction', description: 'Value engineering changes' },
  { key: 'field_issue', name: 'Field Issue', description: 'Problem discovered in service' },
  { key: 'regulatory_change', name: 'Regulatory Change', description: 'New compliance requirements' }
];

// =============================================================================
// TEST VALIDATION LEVELS
// =============================================================================
//
// Testing and validation activities scale with the specification hierarchy.
// All test levels require traceability to requirements.
//
// Component-level tests:
//   Validate individual component meets its specification
//   Examples: Material tests, dimensional inspection, unit functional tests
//   Domain examples:
//   - Vehicle: Single part durability, material certification
//   - Equipment: Actuator stroke test, sensor calibration
//   - Consumer: Drop test, EMC compliance at component level
//
// System-level tests:
//   Validate integrated system meets system specification
//   Examples: Interface verification, subsystem functional tests
//   Domain examples:
//   - Vehicle: Brake system bench test, powertrain dyno test
//   - Equipment: Control loop response, hydraulic circuit test
//   - Consumer: Module integration test, firmware validation
//
// Full system / end-to-end tests:
//   Validate complete product meets platform specification
//   Examples: Full system integration, environmental testing, acceptance tests
//   Domain examples:
//   - Vehicle: Full vehicle dynamics test, durability proving grounds
//   - Equipment: Production acceptance test, factory commissioning
//   - Consumer: User acceptance test, regulatory certification test
//
// =============================================================================

export const TEST_LEVELS = {
  component: {
    code: 'component',
    name: 'Component-Level Test',
    description: 'Validate individual component meets its specification',
    examples: ['Material certification', 'Dimensional inspection', 'Unit functional test'],
    requiredTraceability: true
  },
  system: {
    code: 'system',
    name: 'System-Level Test',
    description: 'Validate integrated system meets system specification',
    examples: ['Interface verification', 'Subsystem functional test', 'Integration test'],
    requiredTraceability: true
  },
  full_system: {
    code: 'full_system',
    name: 'Full System / End-to-End Test',
    description: 'Validate complete product meets platform specification',
    examples: ['Full integration test', 'Environmental test', 'Acceptance test', 'Certification test'],
    requiredTraceability: true
  }
};

// =============================================================================
// SERVICEABILITY CONSIDERATIONS (Universal Engineering Lens)
// =============================================================================
//
// Serviceability applies to all engineered products regardless of domain.
// These considerations must be addressed in Phase 3b.
//
// Core serviceability dimensions:
// - Maintenance: Routine preventive actions to preserve function
// - Repair: Corrective actions to restore function after failure
// - Overhaul: Major restoration or refurbishment activities
// - Upgrade: Enhancement or modernization of existing systems
//
// Evaluation criteria (domain-independent):
// - Access: Can service personnel reach the item safely?
// - Time: What is the expected service duration?
// - Tools: What special tools or equipment are required?
// - Skills: What training or certification is needed?
// - Parts: Are replacement parts identifiable and available?
// =============================================================================

export const SERVICEABILITY_DIMENSIONS = {
  maintenance: {
    code: 'maintenance',
    name: 'Maintenance',
    description: 'Routine preventive actions to preserve function',
    questions: ['Maintenance interval defined?', 'Maintenance procedure documented?', 'Required tools identified?']
  },
  repair: {
    code: 'repair',
    name: 'Repair',
    description: 'Corrective actions to restore function after failure',
    questions: ['Fault isolation procedure defined?', 'Repair procedure documented?', 'Spare parts identified?']
  },
  overhaul: {
    code: 'overhaul',
    name: 'Overhaul',
    description: 'Major restoration or refurbishment activities',
    questions: ['Overhaul interval defined?', 'Overhaul scope documented?', 'Return-to-service criteria defined?']
  },
  upgrade: {
    code: 'upgrade',
    name: 'Upgrade',
    description: 'Enhancement or modernization of existing systems',
    questions: ['Upgrade path defined?', 'Backward compatibility addressed?', 'Retrofit procedure documented?']
  }
};

// =============================================================================
// MANUFACTURABILITY CONSIDERATIONS (Universal Engineering Lens)
// =============================================================================
//
// Manufacturability applies across production scales and industries.
// These considerations must be addressed in Phase 3c.
//
// Production context dimensions:
// - Prototype: One-off or small batch for validation (1-10 units typical)
// - Low-volume: Limited production runs (10-1000 units typical)
// - High-volume: Mass production (1000+ units typical)
// - Mixed: Combination of volumes across product variants
//
// Evaluation criteria (domain-independent):
// - Process: What manufacturing processes are required?
// - Capability: Does manufacturing have required capability?
// - Cost: What is the unit cost at target volume?
// - Quality: What inspection/QC methods are required?
// - Lead time: What is the production lead time?
// =============================================================================

export const MANUFACTURABILITY_CONTEXTS = {
  prototype: {
    code: 'prototype',
    name: 'Prototype',
    description: 'One-off or small batch for validation',
    typicalVolume: '1-10 units',
    focus: ['Feasibility', 'Process validation', 'Design iteration support']
  },
  low_volume: {
    code: 'low_volume',
    name: 'Low-Volume Production',
    description: 'Limited production runs',
    typicalVolume: '10-1000 units',
    focus: ['Process efficiency', 'Tooling justification', 'Quality consistency']
  },
  high_volume: {
    code: 'high_volume',
    name: 'High-Volume Production',
    description: 'Mass production',
    typicalVolume: '1000+ units',
    focus: ['Automation', 'Cycle time', 'Cost optimization', 'Statistical process control']
  }
};

// =============================================================================
// INNOVATION CRITERIA
// =============================================================================
//
// Innovation recognition is domain-agnostic. Innovation must be:
// - Identifiable: Clearly defined and documented
// - Engineered: Developed through systematic engineering process
// - Validated: Proven through analysis and/or testing
//
// Innovation can exist in:
// - Architecture: Novel system structure or integration approach
// - Process: New manufacturing or operational methods
// - Integration: Creative combination of existing technologies
// - Operation: Innovative use cases or operational modes
//
// Innovation is evaluated on merit, not domain. A novel bracket mounting
// scheme has equal standing to a novel propulsion concept if properly
// engineered and validated.
// =============================================================================

export const INNOVATION_CATEGORIES = {
  architecture: {
    code: 'architecture',
    name: 'Architecture Innovation',
    description: 'Novel system structure or integration approach',
    examples: ['New topology', 'Novel packaging', 'Integrated functions']
  },
  process: {
    code: 'process',
    name: 'Process Innovation',
    description: 'New manufacturing or operational methods',
    examples: ['Novel fabrication', 'New assembly sequence', 'Innovative QC method']
  },
  integration: {
    code: 'integration',
    name: 'Integration Innovation',
    description: 'Creative combination of existing technologies',
    examples: ['Cross-domain technology transfer', 'Multi-function components']
  },
  operation: {
    code: 'operation',
    name: 'Operational Innovation',
    description: 'Innovative use cases or operational modes',
    examples: ['New application', 'Extended operating envelope', 'Novel user interaction']
  }
};

export const DESIGN_PHASES = [
  {
    number: 1,
    subPhase: null,
    name: 'Define Requirements',
    shortName: 'Req',
    description: 'Establish clear, measurable specifications with unique IDs',
    icon: 'ClipboardList',
    scoringKey: 'phase1',
    requiredArtifacts: ['requirements_spec'],
    questions: [
      { key: 'primary_function', text: 'What is the primary function of this component?', type: 'text', required: true },
      { key: 'requirements_defined', text: 'Are all requirements defined with unique IDs and acceptance criteria?', type: 'boolean', required: true },
      { key: 'verification_methods', text: 'Is a verification method assigned to each requirement (Analysis/Test/Inspection)?', type: 'boolean', required: true },
      { key: 'rigor_tier_set', text: 'Has the rigor tier been selected and justified?', type: 'boolean', required: true }
    ],
    outputs: ['Requirements with IDs', 'Constraints list', 'Rigor tier assignment']
  },
  {
    number: 2,
    subPhase: null,
    name: 'Research & Development',
    shortName: 'R&D',
    description: 'Investigate existing solutions and alternatives',
    icon: 'Search',
    scoringKey: 'phase2',
    requiredArtifacts: ['risk_register'],
    questions: [
      { key: 'prior_art', text: 'Have existing solutions been researched and documented?', type: 'boolean', required: true },
      { key: 'knowledge_base_searched', text: 'Has the correlation factors library been searched for applicable data?', type: 'boolean', required: true },
      { key: 'risks_identified', text: 'Are key technical risks identified with mitigations?', type: 'boolean', required: true },
      { key: 'tier_justified', text: 'If rigor tier is non-default, is justification documented?', type: 'boolean', conditionalOn: 'rigor_tier_not_default' }
    ],
    outputs: ['Research summary', 'Risk register', 'Tier justification (if non-default)']
  },
  // Phase 3 Sub-phases
  {
    number: 3,
    subPhase: 'a',
    name: 'Design / CAD',
    shortName: 'CAD',
    description: 'Create the physical design with 3D models',
    icon: 'Pencil',
    scoringKey: 'phase3a',
    requiredArtifacts: ['cad_model'],
    interfaceControlRequired: true,
    questions: [
      { key: 'cad_complete', text: 'Is the 3D CAD model complete?', type: 'boolean', required: true },
      { key: 'drawings_complete', text: 'Are 2D drawings with GD&T complete?', type: 'boolean', required: true },
      { key: 'design_review_held', text: 'Has a design review been conducted?', type: 'boolean', required: true },
      { key: 'interface_control_complete', text: 'Is the Interface Control Document complete with adjacent node approvals?', type: 'boolean', required: true }
    ],
    outputs: ['3D model', 'Drawing package', 'BOM', 'Interface Control Document']
  },
  {
    number: 3,
    subPhase: 'b',
    name: 'Serviceability',
    shortName: 'Service',
    description: 'Ensure design supports maintenance, repair, overhaul, and upgrade throughout product lifecycle',
    icon: 'Wrench',
    scoringKey: 'phase3bc',
    requiredArtifacts: ['maintenance_procedures'],
    gates: ['serviceability'],
    engineeringLens: 'serviceability',
    questions: [
      { key: 'access_analyzed', text: 'Has access for maintenance and repair been analyzed?', type: 'boolean', required: true },
      { key: 'wear_items_listed', text: 'Are wear items listed with expected life and replacement time?', type: 'boolean', required: true },
      { key: 'maintenance_documented', text: 'Are maintenance, repair, and overhaul procedures documented?', type: 'boolean', required: true },
      { key: 'service_feasibility', text: 'Is service feasible with expected tools, skills, and access constraints?', type: 'boolean', required: true }
    ],
    outputs: ['Maintenance procedures', 'Wear item list', 'Tool list', 'Access analysis', 'Service time estimates']
  },
  {
    number: 3,
    subPhase: 'c',
    name: 'Manufacturability',
    shortName: 'DFM',
    description: 'Ensure design can be produced at target volume (prototype, low-volume, or high-volume)',
    icon: 'Factory',
    scoringKey: 'phase3bc',
    requiredArtifacts: ['dfm_report_signed'],
    gates: ['cost', 'manufacturability'],
    engineeringLens: 'manufacturability',
    questions: [
      { key: 'dfm_review_complete', text: 'Has a DFM review been completed for target production context?', type: 'boolean', required: true },
      { key: 'critical_dimensions_listed', text: 'Are critical dimensions listed with inspection methods?', type: 'boolean', required: true },
      { key: 'cost_estimate_complete', text: 'Is the cost estimate complete and within target for production volume?', type: 'boolean', required: true },
      { key: 'make_buy_documented', text: 'Are make/buy decisions documented with rationale?', type: 'boolean', required: true }
    ],
    outputs: ['Process plan', 'Critical dimensions', 'Cost estimate', 'QC plan', 'Production context specification']
  },
  {
    number: 4,
    subPhase: null,
    name: 'Data Collection',
    shortName: 'Data',
    description: 'Gather inputs for engineering analysis with full justification',
    icon: 'Database',
    scoringKey: 'phase4',
    requiredArtifacts: ['load_cases', 'assumptions_log'],
    questions: [
      { key: 'load_cases_justified', text: 'Are all load cases documented with source/basis and linked to requirements?', type: 'boolean', required: true },
      { key: 'material_properties_sourced', text: 'Are material properties documented with source traceability?', type: 'boolean', required: true },
      { key: 'boundary_conditions_justified', text: 'Are boundary conditions documented with rationale?', type: 'boolean', required: true },
      { key: 'assumptions_risk_assessed', text: 'Do all assumptions have "what if wrong?" risk assessment?', type: 'boolean', required: true }
    ],
    outputs: ['Load cases with justification', 'Material data with source', 'Assumptions with risk assessment']
  },
  {
    number: 5,
    subPhase: null,
    name: 'Analysis / CAE',
    shortName: 'Analysis',
    description: 'Verify design through engineering analysis with requirement traceability',
    icon: 'Calculator',
    scoringKey: 'phase5',
    requiredArtifacts: ['analysis_report', 'analysis_checks'],
    questions: [
      { key: 'analysis_complete', text: 'Is analysis complete (FEA, hand calculations, etc.)?', type: 'boolean', required: true },
      { key: 'requirements_traced', text: 'Does every requirement with verification method "Analysis" have an analysis check?', type: 'boolean', required: true },
      { key: 'margins_calculated', text: 'Are margins of safety calculated for all critical checks?', type: 'boolean', required: true },
      { key: 'trace_coverage_met', text: 'Does trace coverage meet tier threshold?', type: 'boolean', required: true }
    ],
    outputs: ['Analysis summary with requirement trace', 'Margin calculations', 'Trace coverage report']
  },
  {
    number: 6,
    subPhase: null,
    name: 'Testing / Validation',
    shortName: 'Test',
    description: 'Physically validate through testing with requirement traceability',
    icon: 'FlaskConical',
    scoringKey: 'phase6',
    requiredArtifacts: ['test_plan_approved', 'test_report_signed', 'test_cases'],
    gates: ['safety'],
    questions: [
      { key: 'test_plan_approved', text: 'Is the test plan approved per tier requirements?', type: 'boolean', required: true },
      { key: 'requirements_traced', text: 'Does every requirement with verification method "Test" have a test case?', type: 'boolean', required: true },
      { key: 'all_tests_executed', text: 'Have all tests been executed and documented?', type: 'boolean', required: true },
      { key: 'trace_coverage_met', text: 'Does trace coverage meet tier threshold?', type: 'boolean', required: true }
    ],
    outputs: ['Test report with requirement trace', 'Trace coverage report', 'Safety gate approval (Tier 3)']
  },
  {
    number: 7,
    subPhase: null,
    name: 'Correlation',
    shortName: 'Corr',
    description: 'Compare analysis to test, update knowledge base, and release',
    icon: 'GitCompare',
    scoringKey: 'phase7',
    requiredArtifacts: ['correlation_summary'],
    iterationUnlocking: true,
    questions: [
      { key: 'correlation_documented', text: 'Are correlation parameters documented (predicted vs actual)?', type: 'boolean', required: true },
      { key: 'correlation_factors_promoted', text: 'Have correlation factors been promoted to knowledge base (Tier 3)?', type: 'boolean', requiredTiers: [3] },
      { key: 'lessons_learned', text: 'Are lessons learned documented?', type: 'boolean', required: true },
      { key: 'all_gates_approved', text: 'Are all required gates approved?', type: 'boolean', required: true }
    ],
    outputs: ['Correlation summary', 'Knowledge base updates', 'Lessons learned', 'Release decision']
  }
];

// Helper functions
export function getPhase(number, subPhase = null) {
  return DESIGN_PHASES.find(p => p.number === number && p.subPhase === subPhase);
}

export function getPhaseKey(number, subPhase = null) {
  return subPhase ? `${number}${subPhase}` : `${number}`;
}

export function isPhase3Complete(phases) {
  const phase3a = phases.find(p => p.number === 3 && p.subPhase === 'a');
  const phase3b = phases.find(p => p.number === 3 && p.subPhase === 'b');
  const phase3c = phases.find(p => p.number === 3 && p.subPhase === 'c');

  return phase3a?.status === 'completed' &&
         phase3b?.status === 'completed' &&
         phase3c?.status === 'completed';
}

export function getRequiredGatesForTier(tier) {
  return RIGOR_TIERS[tier]?.requiredGates || [];
}

export function calculateAIScore(phases, requirements, gates, hasIteration) {
  let score = 0;
  const breakdown = {};

  // Calculate score per phase based on completion and quality
  DESIGN_PHASES.forEach(phaseConfig => {
    const phase = phases.find(p =>
      p.number === phaseConfig.number && p.subPhase === phaseConfig.subPhase
    );

    if (phase && phase.status === 'completed') {
      const weight = SCORING_WEIGHTS[phaseConfig.scoringKey]?.weight || 0;
      const quality = phase.qualityScore || 1.0;
      const earned = weight * quality;

      if (!breakdown[phaseConfig.scoringKey]) {
        breakdown[phaseConfig.scoringKey] = { weight: 0, earned: 0 };
      }
      breakdown[phaseConfig.scoringKey].weight += weight;
      breakdown[phaseConfig.scoringKey].earned += earned;
      score += earned;
    }
  });

  // Apply iteration cap
  const scoreCap = hasIteration ? 100 : 95;
  const cappedScore = Math.min(score, scoreCap);

  return {
    currentScore: cappedScore,
    uncappedScore: score,
    scoreCap,
    capReason: hasIteration ? null : 'Complete a Phase 1 revision linked to Phase 7 outputs to unlock full score',
    breakdown
  };
}

// =============================================================================
// ENGINEERING STUDIES (Node-Owned Artifacts)
// =============================================================================
//
// Engineering studies are first-class artifacts that BELONG TO physical nodes,
// not phases. Phases reference studies but do not own them.
//
// Key principle: Artifacts belong to product nodes. Phases enforce requirements
// and surface relevant artifacts, but do not contain them.
//
// Studies can be associated with multiple phase contexts without duplication.
// =============================================================================

export const ENGINEERING_STUDY_TYPES = {
  doe: {
    code: 'doe',
    name: 'Design of Experiments (DOE)',
    description: 'Structured factorial or fractional factorial experiment to identify factor effects',
    icon: 'FlaskConical',
    color: 'violet',
    applicablePhases: [2, 4, 6, 7],
    requiredFields: ['factors', 'responses', 'design_type', 'run_count']
  },
  parametric: {
    code: 'parametric',
    name: 'Parametric Study',
    description: 'Single-factor sweep to understand parameter sensitivity',
    icon: 'TrendingUp',
    color: 'blue',
    applicablePhases: [2, 4, 5],
    requiredFields: ['parameter', 'range', 'step_count', 'response']
  },
  sensitivity: {
    code: 'sensitivity',
    name: 'Sensitivity Analysis',
    description: 'Assessment of output variation due to input uncertainty',
    icon: 'Activity',
    color: 'amber',
    applicablePhases: [4, 5],
    requiredFields: ['input_variables', 'output_variables', 'variation_method']
  },
  trade_study: {
    code: 'trade_study',
    name: 'Trade Study',
    description: 'Comparison of design alternatives against weighted criteria',
    icon: 'Scale',
    color: 'cyan',
    applicablePhases: [2, 3],
    requiredFields: ['alternatives', 'criteria', 'weights', 'scores']
  },
  reliability: {
    code: 'reliability',
    name: 'Reliability Analysis',
    description: 'Statistical analysis of failure modes and life prediction',
    icon: 'Shield',
    color: 'red',
    applicablePhases: [5, 6, 7],
    requiredFields: ['failure_modes', 'distribution', 'life_target']
  }
};

export const STUDY_INTENTS = {
  research: {
    code: 'research',
    name: 'Research',
    description: 'Explore unknowns, develop understanding before committing to design',
    phaseAlignment: [2],
    evidenceValue: 'informational'
  },
  validation: {
    code: 'validation',
    name: 'Validation',
    description: 'Confirm design meets requirements through analysis or test',
    phaseAlignment: [5, 6],
    evidenceValue: 'primary'
  },
  optimization: {
    code: 'optimization',
    name: 'Optimization',
    description: 'Find optimal configuration within a validated design space',
    phaseAlignment: [3, 4, 5],
    evidenceValue: 'supplementary'
  },
  regression: {
    code: 'regression',
    name: 'Regression',
    description: 'Verify unchanged behavior after design modification',
    phaseAlignment: [5, 6],
    evidenceValue: 'primary'
  },
  correlation: {
    code: 'correlation',
    name: 'Correlation',
    description: 'Compare analysis predictions to test results',
    phaseAlignment: [7],
    evidenceValue: 'primary'
  }
};

// =============================================================================
// NODE-CENTRIC ARTIFACT OWNERSHIP MODEL
// =============================================================================
//
// Core principle: Engineering artifacts belong to physical nodes (subsystems,
// assemblies, components). Phases reference artifacts but do not own them.
//
// Benefits:
// - Artifacts visible in node view regardless of current phase
// - Multiple studies can exist per node across different phases
// - Fixtures and test equipment co-located with the nodes they support
// - Phase views act as filters/checkers, not containers
//
// Implementation:
// - Each artifact has an owning_node_id (required)
// - Each artifact may have phase_context tags (optional, for surfacing in phase views)
// - Phase completion checks for required evidence by querying node artifacts
// =============================================================================

export const NODE_ARTIFACT_TYPES = {
  engineering_study: {
    code: 'engineering_study',
    name: 'Engineering Study',
    description: 'DOE, parametric, sensitivity, or trade study owned by this node',
    ownershipLevel: ['assembly', 'subassembly', 'component'],
    phaseVisibility: 'all',
    icon: 'FlaskConical',
    color: 'violet'
  },
  manufacturing_fixture: {
    code: 'manufacturing_fixture',
    name: 'Manufacturing Fixture',
    description: 'Tooling used to fabricate or assemble this node',
    ownershipLevel: ['assembly', 'subassembly'],
    phaseVisibility: ['3c', '4', '6'],
    icon: 'Wrench',
    color: 'orange'
  },
  test_fixture: {
    code: 'test_fixture',
    name: 'Test Fixture',
    description: 'Equipment used to validate this node',
    ownershipLevel: ['assembly', 'subassembly', 'component'],
    phaseVisibility: ['5', '6', '7'],
    icon: 'FlaskConical',
    color: 'cyan'
  },
  test_case: {
    code: 'test_case',
    name: 'Test Case',
    description: 'Individual test verifying a requirement for this node',
    ownershipLevel: ['assembly', 'subassembly', 'component'],
    phaseVisibility: ['6'],
    icon: 'CheckCircle',
    color: 'green'
  },
  analysis_check: {
    code: 'analysis_check',
    name: 'Analysis Check',
    description: 'Analysis result verifying a requirement for this node',
    ownershipLevel: ['assembly', 'subassembly', 'component'],
    phaseVisibility: ['5'],
    icon: 'Calculator',
    color: 'blue'
  }
};

// Phase artifact requirements - what artifacts must exist on nodes for phase completion
export const PHASE_ARTIFACT_REQUIREMENTS = {
  '2': {
    description: 'R&D phase may surface research studies',
    optional: ['engineering_study'],
    required: []
  },
  '3c': {
    description: 'Manufacturability phase requires fixtures for Tier 2+ assemblies',
    optional: ['engineering_study'],
    required: [],
    conditionalRequired: {
      tier: [2, 3],
      nodeType: ['assembly', 'subassembly'],
      artifacts: ['manufacturing_fixture']
    }
  },
  '5': {
    description: 'Analysis phase requires analysis checks traced to requirements',
    optional: ['engineering_study'],
    required: ['analysis_check'],
    requirementCoverage: {
      verificationMethod: 'analysis',
      minCoverage: { 1: 0.5, 2: 0.8, 3: 1.0 }
    }
  },
  '6': {
    description: 'Testing phase requires test cases and may require fixtures',
    optional: ['engineering_study', 'test_fixture'],
    required: ['test_case'],
    requirementCoverage: {
      verificationMethod: 'test',
      minCoverage: { 1: 0.5, 2: 0.8, 3: 1.0 }
    }
  },
  '7': {
    description: 'Correlation phase requires correlation studies for Tier 3',
    optional: ['engineering_study'],
    required: [],
    conditionalRequired: {
      tier: [3],
      artifacts: ['engineering_study'],
      studyIntent: 'correlation'
    }
  }
};

// Helper: Get artifacts belonging to a node
export function getNodeArtifacts(node, artifactType = null) {
  const artifacts = node.artifacts || [];
  if (artifactType) {
    return artifacts.filter(a => a.type === artifactType);
  }
  return artifacts;
}

// Helper: Get artifacts relevant to a phase (from all descendant nodes)
export function getPhaseRelevantArtifacts(node, phaseKey) {
  const phaseVisibility = {
    '1': [],
    '2': ['engineering_study'],
    '3a': [],
    '3b': [],
    '3c': ['manufacturing_fixture', 'engineering_study'],
    '4': ['engineering_study'],
    '5': ['analysis_check', 'engineering_study'],
    '6': ['test_case', 'test_fixture', 'engineering_study'],
    '7': ['engineering_study']
  };

  const relevantTypes = phaseVisibility[phaseKey] || [];
  const nodeArtifacts = node.artifacts || [];

  return nodeArtifacts.filter(a =>
    relevantTypes.includes(a.type) ||
    (a.phase_contexts && a.phase_contexts.includes(phaseKey))
  );
}

// Helper: Check if node meets phase artifact requirements
export function checkPhaseArtifactRequirements(node, phaseKey, tier) {
  const requirements = PHASE_ARTIFACT_REQUIREMENTS[phaseKey];
  if (!requirements) return { met: true, missing: [] };

  const missing = [];
  const nodeArtifacts = node.artifacts || [];

  // Check required artifacts
  for (const artifactType of requirements.required) {
    const hasArtifact = nodeArtifacts.some(a => a.type === artifactType);
    if (!hasArtifact) {
      missing.push({
        type: artifactType,
        reason: `Required for Phase ${phaseKey}`
      });
    }
  }

  // Check conditional requirements
  if (requirements.conditionalRequired) {
    const cond = requirements.conditionalRequired;
    const tierMatch = !cond.tier || cond.tier.includes(tier);
    const nodeTypeMatch = !cond.nodeType || cond.nodeType.includes(node.node_type?.toLowerCase());

    if (tierMatch && nodeTypeMatch) {
      for (const artifactType of cond.artifacts) {
        let hasArtifact = nodeArtifacts.some(a => a.type === artifactType);

        // Check study intent if specified
        if (hasArtifact && cond.studyIntent && artifactType === 'engineering_study') {
          hasArtifact = nodeArtifacts.some(a =>
            a.type === artifactType && a.intent === cond.studyIntent
          );
        }

        if (!hasArtifact) {
          missing.push({
            type: artifactType,
            reason: `Required for Tier ${tier} ${node.node_type} in Phase ${phaseKey}`,
            conditional: true
          });
        }
      }
    }
  }

  return {
    met: missing.length === 0,
    missing
  };
}

export default DESIGN_PHASES;
