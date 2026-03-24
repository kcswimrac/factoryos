/**
 * 7-Phase Engineering Design Cycle Configuration
 *
 * This configuration defines the authoritative structure for engineering design work.
 * It is normative, not advisory. Phase completion rules enforced by the system
 * must align with the criteria defined here.
 *
 * This applies to:
 * - SAE Baja / Formula teams
 * - Vehicle programs
 * - General engineering projects (equipment, fixtures, industrial systems)
 */

export const DESIGN_PHASES = [
  {
    id: 1,
    number: 1,
    shortName: 'Requirements',
    fullName: 'Defining Requirements & Specifications',
    color: 'blue',
    iconName: 'ClipboardList',

    purpose: `This phase establishes the measurable targets that all subsequent design work must satisfy. Specifications are not aspirations—they are binding constraints that define success or failure. Without clear, measurable specifications at vehicle, system, and component levels, no objective evaluation of design quality is possible. This phase exists to prevent design work that cannot be judged.`,

    requiredInputs: [
      'Rules and regulations (competition rules, legal requirements, standards)',
      'Measured data from previous systems, testing, or benchmarking',
      'Customer / user needs (including marketing input when applicable)',
      'Operational environment constraints',
      'Budget and timeline constraints'
    ],

    requiredOutputs: [
      'Vehicle-level specifications',
      'System-level specifications',
      'Component-level specifications',
      'Specification traceability matrix',
      'Rationale documentation for each specification'
    ],

    expectedArtifacts: [
      'Requirements documents linked to nodes',
      'Specification sheets with measurable targets',
      'Assumptions & Risk items identifying specification uncertainty',
      'Data sources referenced for derived specifications'
    ],

    commonFailureModes: [
      'Specifications copied from previous year without re-evaluation',
      'Specifications that cannot be measured or verified',
      'Missing system-level or component-level breakdown',
      'Obvious requirements listed (e.g., "must pass tech inspection")',
      'No traceability between levels (vehicle → system → component)',
      'Specifications set without supporting data or rationale',
      'No documentation of specification changes or their justification'
    ],

    completionCriteria: [
      'Specifications exist at vehicle, system, and component levels',
      'All specifications are measurable and include acceptance criteria',
      'All specifications are derived from rules, data, or documented user needs',
      'Specification rationale is documented and defensible',
      'Specifications are concise enough to fit on a poster or single-page summary',
      'Engineers can explain when specs changed, why, and what justified the change',
      'No specification is included that the team cannot control or influence'
    ],

    keyStatements: [
      'Specifications must be relevant, measurable, value-added, and within the team\'s control.',
      'Obvious requirements (e.g., "must pass tech") must not be listed.',
      'Completing the full design cycle and then updating specifications for a second iteration is how design points are earned.',
      'If you cannot explain why a specification has a particular value, the specification is not complete.'
    ],

    examples: [
      {
        title: 'Vehicle-Level Specification Example',
        content: 'Target weight: 450 lbs ± 10 lbs (derived from lap time simulation showing 0.3s/lap improvement per 10 lb reduction, constrained by minimum weight rule of 400 lbs)'
      },
      {
        title: 'System-Level Specification Example',
        content: 'Suspension travel: 10" ± 0.5" (derived from measured terrain data showing 95th percentile bump height of 8", with 25% margin for unknowns)'
      }
    ],

    relatedReview: {
      type: 'SRR',
      name: 'System Requirements Review',
      timing: 'At end of Phase 1',
      description: 'Ensures functional and performance requirements are defined and satisfy the identified need. SRR validates that specifications at all levels are complete, measurable, and traceable.'
    }
  },

  {
    id: 2,
    number: 2,
    shortName: 'R&D',
    fullName: 'Research & Development',
    color: 'purple',
    iconName: 'FlaskConical',

    purpose: `Research and Development builds the knowledge required to make informed design decisions before committing to a final design. R&D reduces risk by answering critical questions using previous systems, surrogate test articles, or targeted experiments. This phase exists to prevent designs based on assumptions that could have been tested.`,

    requiredInputs: [
      'Specifications from Phase 1',
      'Known unknowns and high-risk design decisions',
      'Previous system data and lessons learned',
      'Available test articles and facilities',
      'R&D budget and timeline constraints'
    ],

    requiredOutputs: [
      'R&D test plans with clear objectives',
      'R&D results with documented conclusions',
      'Design recommendations based on R&D findings',
      'Updated risk assessments reflecting R&D outcomes'
    ],

    expectedArtifacts: [
      'DOEs / Studies linked to relevant system nodes',
      'Test data and analysis results',
      'Assumptions & Risk items updated with R&D findings',
      'Design decision documents citing R&D evidence'
    ],

    commonFailureModes: [
      'R&D performed without connection to specifications',
      'Testing for the sake of testing without clear objectives',
      'R&D results not documented or not used in design decisions',
      'Assuming previous designs are optimal without investigation',
      'R&D scope creep unrelated to critical design decisions',
      'No explanation of what was learned and how it affects design'
    ],

    completionCriteria: [
      'All high-risk design decisions have supporting R&D evidence',
      'R&D objectives trace directly to specifications or risk items',
      'R&D results are documented with clear conclusions',
      'Design recommendations are recorded and traceable to R&D findings',
      'Engineers can explain what was tested, why it mattered, and how it informed design'
    ],

    keyStatements: [
      'R&D must be directly relevant to meeting defined specifications.',
      'R&D may be performed on previous systems or surrogate test articles before the current system exists.',
      'R&D disconnected from specifications is insufficient and will not be credited.',
      'The purpose of R&D is to reduce risk, not to generate activity.'
    ],

    examples: [
      {
        title: 'Relevant R&D Example',
        content: 'Testing three suspension bushing materials on a previous vehicle to determine compliance vs. durability trade-off before specifying material for current design.'
      },
      {
        title: 'Insufficient R&D Example',
        content: 'Running the previous vehicle around the track "to see how it feels" without defined measurements, objectives, or documented conclusions.'
      }
    ],

    relatedReview: {
      type: 'SDR',
      name: 'System Definition Review',
      timing: 'At end of Phase 2 (conceptual design)',
      description: 'Examines proposed system architecture and functional elements that define the concept. SDR validates that R&D findings support the architectural direction before detailed design begins.'
    }
  },

  {
    id: 3,
    number: 3,
    shortName: 'Design',
    fullName: 'Design (CAD + Manufacturability + Serviceability)',
    color: 'cyan',
    iconName: 'PenTool',

    purpose: `Phase 3 translates specifications and R&D findings into a complete, producible, and serviceable design. This phase has three parallel, mandatory responsibilities: Design & CAD, Design for Serviceability (DFS), and Design for Manufacturability (DFM). These are not sequential and not optional. A design that exists only as a CAD model, without manufacturing and service planning, is incomplete.`,

    requiredInputs: [
      'Approved specifications from Phase 1',
      'R&D findings and recommendations from Phase 2',
      'Manufacturing capabilities and constraints',
      'Service requirements and operational context',
      'Interface definitions and system boundaries'
    ],

    requiredOutputs: [
      '3D CAD models (components, assemblies, full system)',
      'Engineering drawings (manufactured parts, assemblies, critical interfaces)',
      'Bill of Materials with make/buy decisions',
      'Manufacturing process plans and inspection requirements',
      'Service procedures and maintenance schedules',
      'Fixture and tooling requirements'
    ],

    expectedArtifacts: [
      'CAD models linked to design nodes',
      'Drawings with revision control',
      'Manufacturing plans and process documentation',
      'Fixtures linked to parts they support',
      'Service procedures and access analyses',
      'Make/buy decision records with rationale'
    ],

    commonFailureModes: [
      'CAD exists but no drawings for manufacturing',
      'Design complete but no service access considered',
      'Manufacturing process undefined or assumed',
      'Critical tolerances not identified',
      'Make/buy decisions made without documented rationale',
      'Fixtures required but not designed or linked',
      'Design changes made without updating related artifacts'
    ],

    completionCriteria: [
      'CAD and drawings are complete and revision-controlled',
      'Service procedures are defined and feasible',
      'Manufacturing processes and inspections are defined',
      'Fixtures and tooling are identified and linked',
      'Cost and production assumptions are documented',
      'No unresolved manufacturability or serviceability blockers exist',
      'Someone unfamiliar with the design could manufacture and assemble the system from documentation alone'
    ],

    keyStatements: [
      'Phase 3 consists of three parallel, mandatory responsibilities. These are not sequential and not optional.',
      'CAD models and drawings must be sufficient for someone unfamiliar with the design to manufacture and assemble the system correctly.',
      'A design that cannot be serviced predictably will fail in production, regardless of performance.',
      'If a design cannot be manufactured consistently, it is not complete, regardless of analysis quality.'
    ],

    subPhases: [
      {
        id: '3a',
        name: 'Design & CAD',
        requirements: [
          'Full 3D CAD required for components, assemblies, and full system/vehicle',
          'Clear separation of functional hierarchy and physical assembly hierarchy',
          'Drawings required for manufactured parts, assemblies, critical interfaces, and commodity parts with essential dimensions',
          'Revision control established and enforced',
          'Interface control documents for cross-system boundaries'
        ]
      },
      {
        id: '3b',
        name: 'Design for Serviceability (DFS)',
        requirements: [
          'Identify wear items, service intervals, and replacement procedures',
          'Perform access analysis: tool clearance, hand access, removal paths',
          'Consider single-person service where applicable',
          'Document standard vs. special tools required',
          'Define maintenance procedures and service assumptions',
          'Establish overhaul vs. field repair boundaries'
        ]
      },
      {
        id: '3c',
        name: 'Design for Manufacturability (DFM)',
        requirements: [
          'Identify manufacturing processes for all parts',
          'Define critical tolerances (CTQs) and inspection points',
          'Document cost and complexity considerations',
          'Record explicit make/buy decisions with rationale',
          'Consider prototype vs. volume production differences',
          'Identify required fixtures and tooling'
        ]
      }
    ],

    examples: [
      {
        title: 'Complete Phase 3 Example',
        content: 'Suspension upright: CAD model with GD&T drawing, machining process defined (5-axis CNC), inspection points for bearing bores, machining fixture designed and linked, service procedure for bearing replacement documented with required tools.'
      }
    ],

    relatedReview: {
      type: 'PDR',
      name: 'Preliminary Design Review',
      timing: 'At end of Phase 3',
      description: 'Demonstrates that the design meets requirements with acceptable risk within cost/schedule constraints. PDR establishes the basis for detailed data collection and analysis. CAD, DFM, and DFS readiness are assessed.'
    }
  },

  {
    id: 4,
    number: 4,
    shortName: 'Data Collection',
    fullName: 'Data Collection for Analysis',
    color: 'amber',
    iconName: 'Database',

    purpose: `Analysis is only as valid as its inputs. This phase ensures that boundary conditions, loads, material properties, and other analysis inputs are based on collected data rather than assumptions. Low-cost or simple data collection methods are acceptable if their limitations are understood and bounded.`,

    requiredInputs: [
      'Analysis requirements (what needs to be analyzed)',
      'Required boundary conditions and load cases',
      'Available data sources and collection methods',
      'Uncertainty requirements for critical inputs'
    ],

    requiredOutputs: [
      'Documented data with collection methodology',
      'Uncertainty estimates for all critical inputs',
      'Boundary condition definitions with supporting evidence',
      'Load case definitions with derivation rationale'
    ],

    expectedArtifacts: [
      'Test data linked to relevant nodes',
      'Assumptions & Risk items documenting data limitations',
      'Instrumentation records and calibration data',
      'Data processing methodology documentation'
    ],

    commonFailureModes: [
      'Using assumed values without attempting measurement',
      'No uncertainty estimates on critical inputs',
      '"We didn\'t have budget" used as justification for missing data',
      'Data collected but methodology not documented',
      'Load cases defined without physical basis',
      'Boundary conditions copied from literature without validation'
    ],

    completionCriteria: [
      'All critical analysis inputs have documented sources',
      'Data collection methodology is recorded and defensible',
      'Uncertainty estimates exist for inputs affecting critical conclusions',
      'Engineers can explain how data was collected, why it is valid, and what uncertainty exists',
      'Low-cost methods are explained and bounded appropriately'
    ],

    keyStatements: [
      'Boundary conditions and assumptions must be defined using collected data.',
      'Low-cost or simple methods are acceptable if explained and bounded.',
      '"We didn\'t have budget" is not acceptable justification for missing data.',
      'If you cannot explain where a number came from, you cannot use it in analysis.'
    ],

    examples: [
      {
        title: 'Acceptable Data Collection',
        content: 'Suspension loads derived from accelerometer data on previous vehicle over representative terrain, with 1.5x safety factor applied to account for sensor limitations and terrain variability.'
      },
      {
        title: 'Unacceptable Data Collection',
        content: 'Suspension loads assumed as "2G vertical" based on what another team used, with no measurement or validation.'
      }
    ]
  },

  {
    id: 5,
    number: 5,
    shortName: 'Analysis',
    fullName: 'Analysis / Calculations / CAE',
    color: 'green',
    iconName: 'Calculator',

    purpose: `Analysis builds confidence that the design will meet specifications before committing to manufacturing and testing. Analysis includes FEA, CFD, multi-body dynamics, and hand calculations. The goal is not to generate impressive simulations but to answer specific questions about design adequacy.`,

    requiredInputs: [
      'Complete design geometry from Phase 3',
      'Validated boundary conditions and loads from Phase 4',
      'Material properties with documented sources',
      'Analysis objectives tied to specifications'
    ],

    requiredOutputs: [
      'Analysis results with clear conclusions',
      'Model validation evidence (mesh convergence, sanity checks)',
      'Hand calculations as confidence checks',
      'Design recommendations based on analysis'
    ],

    expectedArtifacts: [
      'DOEs / Studies documenting analysis work',
      'Analysis reports linked to design nodes',
      'Hand calculation records',
      'Assumptions & Risk items updated based on analysis findings'
    ],

    commonFailureModes: [
      'FEA run without understanding of assumptions or limitations',
      'No mesh convergence study or model validation',
      'Results accepted without physical sanity check',
      'Hand calculations skipped because "FEA is more accurate"',
      'Analysis not connected to specific specifications',
      'Over-reliance on simulation without understanding uncertainty'
    ],

    completionCriteria: [
      'Analysis addresses all critical specifications',
      'Model setup and assumptions are documented',
      'Results include sanity checks against hand calculations',
      'Engineers can explain whether results make physical sense',
      'Analysis conclusions are actionable (pass/fail/modify)',
      'Uncertainty and safety factors are explicitly stated'
    ],

    keyStatements: [
      'Acceptable analysis includes FEA, CFD, multi-body dynamics, and hand calculations.',
      'Hand calculations are mandatory as confidence checks—they are not optional.',
      'Analysis exists to build confidence before manufacturing and testing, not to generate impressive images.',
      'If you cannot explain your assumptions and whether results make physical sense, the analysis is not complete.'
    ],

    examples: [
      {
        title: 'Complete Analysis Example',
        content: 'Upright FEA: mesh convergence study showing <2% stress change at final mesh density, hand calculation of bearing reaction forces matching FEA within 5%, maximum stress 180 MPa vs. 350 MPa allowable (SF=1.9), recommendation to proceed with manufacturing.'
      }
    ]
  },

  {
    id: 6,
    number: 6,
    shortName: 'Testing',
    fullName: 'Testing & Validation',
    color: 'orange',
    iconName: 'TestTube2',

    purpose: `Testing validates that the physical system meets specifications and that analysis predictions are accurate. Testing must occur at component, subsystem, and system levels. Testing without defined purpose or documentation does not count toward design validation.`,

    requiredInputs: [
      'Specifications to be validated',
      'Analysis predictions to be verified',
      'Test procedures and acceptance criteria',
      'Test articles and instrumentation'
    ],

    requiredOutputs: [
      'Test results with pass/fail determination',
      'Failure documentation and root cause analysis',
      'Comparison of test results to analysis predictions',
      'Recommendations for specification or design changes'
    ],

    expectedArtifacts: [
      'Test cases linked to requirements and specifications',
      'Test data and results documentation',
      'Failure reports and corrective actions',
      'Assumptions & Risk items updated based on test findings'
    ],

    commonFailureModes: [
      'Testing performed without defined acceptance criteria',
      'Failures not documented or root cause not investigated',
      'Test results not compared to analysis predictions',
      'Testing only at system level, skipping component validation',
      '"It worked" accepted without quantitative verification',
      'Test methodology not documented or repeatable'
    ],

    completionCriteria: [
      'Testing occurred at component, subsystem, and system levels',
      'All tests have defined purpose and acceptance criteria',
      'Test results are documented and compared to predictions',
      'Failures are documented with root cause analysis',
      'Specification or design updates are triggered where required',
      'Test methodology is documented and repeatable'
    ],

    keyStatements: [
      'Testing must occur at component level, system level, and full system/vehicle level where applicable.',
      'Failures must be documented—undocumented failures will recur.',
      'Test results may force specification updates, design changes, or re-analysis.',
      'Undocumented testing does not count toward design validation.'
    ],

    examples: [
      {
        title: 'Complete Testing Example',
        content: 'Suspension fatigue test: 100,000 cycles at 2G vertical load per test procedure TP-SUS-001, no visible cracking or permanent deformation, measured stiffness within 3% of analysis prediction, test documented in report TR-SUS-2025-003.'
      }
    ],

    relatedReview: {
      type: 'CDR',
      name: 'Critical Design Review',
      timing: 'After Phase 5-6, before production release',
      description: 'Demonstrates technical effort is on track to complete the product and meet requirements within cost/schedule. CDR audits detailed specs with manufacturing, assembly, and operations. Test results and analysis correlation are reviewed. Violated or high-risk unvalidated assumptions block CDR pass.'
    }
  },

  {
    id: 7,
    number: 7,
    shortName: 'Correlation',
    fullName: 'Correlation & Release',
    color: 'red',
    iconName: 'GitMerge',

    purpose: `Correlation closes the learning loop by comparing analysis predictions to test results and resolving discrepancies. This phase validates the engineering models used throughout the design cycle and reduces future testing burden by establishing model credibility. Release occurs only when correlation is complete and discrepancies are resolved.`,

    requiredInputs: [
      'Analysis predictions from Phase 5',
      'Test results from Phase 6',
      'Acceptance criteria for model correlation',
      'List of critical parameters requiring correlation'
    ],

    requiredOutputs: [
      'Correlation report comparing predictions to results',
      'Discrepancy analysis and resolution',
      'Updated models reflecting correlation findings',
      'Release approval with documented basis'
    ],

    expectedArtifacts: [
      'Correlation studies linked to relevant nodes',
      'Updated analysis models with validated parameters',
      'Release documentation and approval records',
      'Lessons learned for future design cycles'
    ],

    commonFailureModes: [
      'Analysis never compared to test results',
      'Discrepancies observed but not investigated',
      '"Close enough" accepted without quantitative criteria',
      'Models not updated to reflect real-world behavior',
      'Release declared without completing correlation',
      'Lessons learned not documented for future cycles'
    ],

    completionCriteria: [
      'Analysis predictions are compared to test results for all critical parameters',
      'Discrepancies are quantified and explained',
      'Models are updated where correlation reveals errors',
      'Release criteria are met and documented',
      'Lessons learned are captured for future iterations',
      'Engineers can explain how models were validated and what mismatches existed'
    ],

    keyStatements: [
      'Analysis must be compared to real-world results.',
      'Discrepancies must be explained and resolved—not ignored.',
      'Correlation may start simple but must be defensible.',
      'Correlation closes the learning loop and reduces future testing burden.',
      'A design cycle without correlation is incomplete, regardless of test success.'
    ],

    examples: [
      {
        title: 'Complete Correlation Example',
        content: 'Suspension FEA predicted 12mm deflection at 2G; test measured 14mm (17% error). Root cause: bushing compliance not modeled. Updated FEA with bushing stiffness from supplier data now predicts 13.8mm (1.5% error). Model validated for future use.'
      }
    ]
  }
];

/**
 * Get phase by ID or number
 */
export const getPhaseById = (id) => DESIGN_PHASES.find(p => p.id === id || p.number === id);

/**
 * Get phase color classes for UI
 */
export const getPhaseColorClasses = (phase) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      hover: 'hover:border-blue-500'
    },
    purple: {
      bg: 'bg-purple-500',
      bgLight: 'bg-purple-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      hover: 'hover:border-purple-500'
    },
    cyan: {
      bg: 'bg-cyan-500',
      bgLight: 'bg-cyan-500/20',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      hover: 'hover:border-cyan-500'
    },
    amber: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      hover: 'hover:border-amber-500'
    },
    green: {
      bg: 'bg-green-500',
      bgLight: 'bg-green-500/20',
      border: 'border-green-500/30',
      text: 'text-green-400',
      hover: 'hover:border-green-500'
    },
    orange: {
      bg: 'bg-orange-500',
      bgLight: 'bg-orange-500/20',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      hover: 'hover:border-orange-500'
    },
    red: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      hover: 'hover:border-red-500'
    }
  };
  return colorMap[phase.color] || colorMap.blue;
};

/**
 * Phase status definitions for demo/display
 */
export const PHASE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETE: 'complete'
};

export const getPhaseStatusConfig = (status) => {
  const statusMap = {
    not_started: {
      label: 'Not Started',
      color: 'text-[#6B7280]',
      bg: 'bg-[#2A2F36]',
      border: 'border-[#2A2F36]'
    },
    in_progress: {
      label: 'In Progress',
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30'
    },
    blocked: {
      label: 'Blocked',
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      border: 'border-red-500/30'
    },
    complete: {
      label: 'Complete',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30'
    }
  };
  return statusMap[status] || statusMap.not_started;
};

export default DESIGN_PHASES;
