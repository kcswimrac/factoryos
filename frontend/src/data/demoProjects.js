/**
 * Demo Projects Data for Engineering Design Cycle
 *
 * Implements disciplined hierarchical product structure:
 * - Functional Subsystems (organizational only, no parts)
 * - Physical Assemblies/Sub-Assemblies/Components (where parts live)
 *
 * Node Classes:
 * - functional_group: Organizational grouping (no attachments allowed)
 * - product: Physical buildable item (attachments, revisions, phases)
 * - manufacturing_asset: Fixtures, jigs, tooling
 * - test_asset: Test equipment and validation tools
 */

// Import constants from shared file (avoids circular dependency with demoISRDrone.js)
export {
  NODE_CLASSES,
  NODE_TYPES,
  FIXTURE_TYPES,
  PROJECT_MODES,
  PROJECT_STATUS,
  PHASE_STATUS,
  ATTACHMENT_TYPES,
  STUDY_TYPES,
  STUDY_INTENTS,
  TEST_LEVELS
} from './projectConstants.js';

import {
  NODE_CLASSES,
  NODE_TYPES,
  FIXTURE_TYPES,
  PROJECT_MODES,
  PROJECT_STATUS,
  PHASE_STATUS,
  ATTACHMENT_TYPES
} from './projectConstants.js';

import { ISR_DRONE } from './demoISRDrone.js';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

let idCounter = 1000;
const generateId = (prefix = 'node') => `${prefix}-${++idCounter}`;

// Generate placeholder CAD thumbnail SVG
const generateCadThumbnail = (type = 'assembly', color = '#8B5CF6') => {
  const shapes = {
    assembly: `<rect x="20" y="30" width="60" height="40" rx="4" fill="${color}" opacity="0.3"/><rect x="30" y="20" width="40" height="30" rx="2" fill="${color}" opacity="0.5"/><circle cx="50" cy="50" r="15" fill="${color}" opacity="0.7"/>`,
    component: `<rect x="25" y="25" width="50" height="50" rx="8" fill="${color}" opacity="0.4"/><circle cx="50" cy="50" r="20" fill="${color}" opacity="0.6"/>`,
    fixture: `<polygon points="50,15 85,35 85,65 50,85 15,65 15,35" fill="${color}" opacity="0.4"/><rect x="35" y="35" width="30" height="30" fill="${color}" opacity="0.6"/>`,
    gear: `<circle cx="50" cy="50" r="30" fill="${color}" opacity="0.3"/><circle cx="50" cy="50" r="20" fill="${color}" opacity="0.5"/><circle cx="50" cy="50" r="8" fill="${color}" opacity="0.8"/>`,
    frame: `<rect x="15" y="25" width="70" height="50" rx="2" fill="none" stroke="${color}" stroke-width="4" opacity="0.6"/><line x1="15" y1="50" x2="85" y2="50" stroke="${color}" stroke-width="3" opacity="0.4"/><line x1="50" y1="25" x2="50" y2="75" stroke="${color}" stroke-width="3" opacity="0.4"/>`
  };
  const shape = shapes[type] || shapes.assembly;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1F2937"/>${shape}</svg>`)}`;
};

// Create a functional subsystem (organizational only - NO attachments allowed)
const createFunctionalSubsystem = (name, partNumber, children = []) => ({
  id: generateId('subsys'),
  type: NODE_TYPES.SUBSYS,
  node_class: NODE_CLASSES.FUNCTIONAL_GROUP,
  name,
  part_number: partNumber,
  allows_attachments: false,
  allows_revisions: false,
  children
});

// Create a physical assembly (attachments allowed)
const createAssembly = (name, partNumber, options = {}) => ({
  id: generateId('assy'),
  type: NODE_TYPES.ASSY,
  node_class: options.node_class || NODE_CLASSES.PRODUCT,
  name,
  part_number: partNumber,
  allows_attachments: true,
  allows_revisions: true,
  revision: options.revision || 'A',
  phase: options.phase || 1,
  phase_status: options.phase_status || PHASE_STATUS.NOT_STARTED,
  rigor_tier: options.rigor_tier || 2,
  ai_score: options.ai_score || null,
  cad_thumbnail: options.cad_thumbnail || (options.show_cad ? generateCadThumbnail(options.cad_type || 'assembly', options.cad_color || '#8B5CF6') : null),
  attachments: options.attachments || [],
  children: options.children || []
});

// Create a physical sub-assembly
const createSubAssembly = (name, partNumber, options = {}) => ({
  id: generateId('subassy'),
  type: NODE_TYPES.SUBASSY,
  node_class: options.node_class || NODE_CLASSES.PRODUCT,
  name,
  part_number: partNumber,
  allows_attachments: true,
  allows_revisions: true,
  revision: options.revision || 'A',
  phase: options.phase || 1,
  phase_status: options.phase_status || PHASE_STATUS.NOT_STARTED,
  rigor_tier: options.rigor_tier || 2,
  ai_score: options.ai_score || null,
  cad_thumbnail: options.cad_thumbnail || (options.show_cad ? generateCadThumbnail(options.cad_type || 'assembly', options.cad_color || '#8B5CF6') : null),
  attachments: options.attachments || [],
  children: options.children || []
});

// Create a component (leaf node)
const createComponent = (name, partNumber, options = {}) => ({
  id: generateId('comp'),
  type: NODE_TYPES.COMP,
  node_class: NODE_CLASSES.PRODUCT,
  name,
  part_number: partNumber,
  allows_attachments: true,
  allows_revisions: true,
  revision: options.revision || 'A',
  phase: options.phase || 1,
  phase_status: options.phase_status || PHASE_STATUS.NOT_STARTED,
  rigor_tier: options.rigor_tier || 2,
  ai_score: options.ai_score || null,
  cad_thumbnail: options.cad_thumbnail || (options.show_cad ? generateCadThumbnail(options.cad_type || 'component', options.cad_color || '#10B981') : null),
  attachments: options.attachments || [],
  children: []
});

// Create a purchased part (leaf node)
const createPurchasedPart = (name, partNumber, options = {}) => ({
  id: generateId('purch'),
  type: NODE_TYPES.PURCH,
  node_class: NODE_CLASSES.PRODUCT,
  name,
  part_number: partNumber,
  allows_attachments: true,
  allows_revisions: true,
  revision: options.revision || 'A',
  phase: options.phase || 1,
  attachments: options.attachments || [],
  children: []
});

// Create a manufacturing asset (fixture/tooling)
const createManufacturingAsset = (name, partNumber, fixtureType, linkedNodes = [], options = {}) => ({
  id: generateId('fixture'),
  type: NODE_TYPES.ASSY,
  node_class: NODE_CLASSES.MANUFACTURING_ASSET,
  fixture_type: fixtureType,
  name,
  part_number: partNumber,
  linked_product_nodes: linkedNodes,
  allows_attachments: true,
  allows_revisions: true,
  revision: options.revision || 'A',
  phase: options.phase || 3,
  phase_status: options.phase_status || PHASE_STATUS.IN_PROGRESS,
  ai_score: options.ai_score || null,
  cad_thumbnail: options.cad_thumbnail || generateCadThumbnail('fixture', '#F97316'),
  attachments: options.attachments || [],
  children: options.children || []
});

// Create attachment placeholder
const createAttachment = (type, filename, description = '') => ({
  id: generateId('attach'),
  type,
  filename,
  description,
  uploaded_at: null,
  status: 'placeholder'
});

// Import study types for local use
import { STUDY_TYPES, STUDY_INTENTS, TEST_LEVELS } from './projectConstants.js';

// Create an engineering study (DOE, parametric, sensitivity, trade study)
const createEngineeringStudy = (name, studyId, type, intent, owningNodeId, options = {}) => ({
  id: generateId('study'),
  study_id: studyId,
  name,
  type,
  intent,
  owning_node_id: owningNodeId,
  owning_node_part_number: options.owning_node_part_number || null,
  phase_contexts: options.phase_contexts || [],
  status: options.status || 'complete',
  created_at: options.created_at || '2024-10-15T00:00:00Z',
  // DOE-specific fields
  factors: options.factors || [],
  responses: options.responses || [],
  design_type: options.design_type || null,
  run_count: options.run_count || null,
  // Parametric-specific fields
  parameter: options.parameter || null,
  range: options.range || null,
  step_count: options.step_count || null,
  // Trade study fields
  alternatives: options.alternatives || [],
  criteria: options.criteria || [],
  weights: options.weights || [],
  // Linked requirements
  linked_requirements: options.linked_requirements || [],
  // Results summary
  results_summary: options.results_summary || null,
  attachments: options.attachments || []
});

// Create a test case (owned by a node)
const createTestCase = (name, testId, testLevel, owningNodeId, options = {}) => ({
  id: generateId('test'),
  test_id: testId,
  name,
  test_level: testLevel,
  owning_node_id: owningNodeId,
  owning_node_part_number: options.owning_node_part_number || null,
  status: options.status || 'not_started',
  scheduled_date: options.scheduled_date || null,
  executed_date: options.executed_date || null,
  acceptance_criteria: options.acceptance_criteria || '',
  result: options.result || null,
  pass_fail: options.pass_fail || null,
  linked_requirements: options.linked_requirements || [],
  test_fixture_id: options.test_fixture_id || null,
  attachments: options.attachments || []
});

// =============================================================================
// BAJA 2025 PROJECT (Full depth example)
// =============================================================================

const createBaja2025Drivetrain = () => createFunctionalSubsystem('Drivetrain', 'BAJA25-DT', [
  // Gearbox Assembly
  createAssembly('Gearbox Assembly', 'BAJA25-DT-100', {
    phase: 4, ai_score: 78,
    show_cad: true, cad_type: 'gear', cad_color: '#8B5CF6',
    attachments: [
      createAttachment(ATTACHMENT_TYPES.CAD, 'gearbox_assy.sldasm'),
      createAttachment(ATTACHMENT_TYPES.DRAWING, 'DWG-BAJA25-DT-100.pdf')
    ],
    children: [
      createSubAssembly('Input Shaft Sub-Assembly', 'BAJA25-DT-110', {
        phase: 5, ai_score: 82,
        show_cad: true, cad_type: 'assembly', cad_color: '#6366F1',
        children: [
          createComponent('Input Shaft', 'BAJA25-DT-111', { phase: 5, ai_score: 85, show_cad: true }),
          createComponent('Input Bearing', 'BAJA25-DT-112', { phase: 5, show_cad: true, cad_type: 'component', cad_color: '#14B8A6' }),
          createComponent('Input Seal', 'BAJA25-DT-113', { phase: 5 })
        ]
      }),
      createSubAssembly('Output Shaft Sub-Assembly', 'BAJA25-DT-120', {
        phase: 4, ai_score: 75,
        show_cad: true, cad_type: 'assembly', cad_color: '#6366F1',
        children: [
          createComponent('Output Shaft', 'BAJA25-DT-121', { phase: 4, show_cad: true }),
          createComponent('Output Bearing', 'BAJA25-DT-122', { phase: 4, show_cad: true, cad_color: '#14B8A6' }),
          createComponent('Output Seal', 'BAJA25-DT-123', { phase: 4 })
        ]
      }),
      createSubAssembly('Selector Mechanism Sub-Assembly', 'BAJA25-DT-130', {
        phase: 3, ai_score: 68,
        show_cad: true, cad_type: 'assembly', cad_color: '#F59E0B',
        children: [
          createComponent('Shift Fork', 'BAJA25-DT-131', { phase: 3, show_cad: true }),
          createComponent('Selector Rod', 'BAJA25-DT-132', { phase: 3, show_cad: true }),
          createComponent('Detent Spring', 'BAJA25-DT-133', { phase: 3 })
        ]
      }),
      createSubAssembly('Housing Sub-Assembly', 'BAJA25-DT-140', {
        phase: 4, ai_score: 80,
        show_cad: true, cad_type: 'frame', cad_color: '#EC4899',
        children: [
          createComponent('Gearbox Housing', 'BAJA25-DT-141', { phase: 5, ai_score: 88, show_cad: true, cad_type: 'frame', cad_color: '#EC4899' }),
          createComponent('Fastener Kit', 'BAJA25-DT-142', { phase: 4 })
        ]
      })
    ]
  }),
  // Differential Assembly
  createAssembly('Differential Assembly', 'BAJA25-DT-200', {
    phase: 4, ai_score: 76,
    show_cad: true, cad_type: 'gear', cad_color: '#8B5CF6',
    children: [
      createSubAssembly('Ring and Pinion Sub-Assembly', 'BAJA25-DT-210', {
        phase: 5,
        children: [
          createComponent('Ring Gear', 'BAJA25-DT-211', { phase: 5 }),
          createComponent('Pinion Gear', 'BAJA25-DT-212', { phase: 5 })
        ]
      }),
      createSubAssembly('Carrier Sub-Assembly', 'BAJA25-DT-220', {
        phase: 4,
        children: [
          createComponent('Differential Carrier', 'BAJA25-DT-221', { phase: 4 }),
          createComponent('Spider Gears', 'BAJA25-DT-222', { phase: 4 }),
          createComponent('Cross Pin', 'BAJA25-DT-223', { phase: 4 })
        ]
      }),
      createSubAssembly('Bearing Stack Sub-Assembly', 'BAJA25-DT-230', {
        phase: 4,
        children: [
          createComponent('Tapered Roller Bearing', 'BAJA25-DT-231', { phase: 4 }),
          createPurchasedPart('Crush Sleeve', 'BAJA25-DT-232')
        ]
      })
    ]
  }),
  // Driveshaft Assembly
  createAssembly('Driveshaft Assembly', 'BAJA25-DT-300', {
    phase: 3, ai_score: 65,
    children: [
      createSubAssembly('Shaft Tube Sub-Assembly', 'BAJA25-DT-310', {
        phase: 3,
        children: [
          createComponent('Driveshaft Tube', 'BAJA25-DT-311', { phase: 3 }),
          createComponent('Yoke', 'BAJA25-DT-312', { phase: 3 })
        ]
      }),
      createSubAssembly('U-Joint Sub-Assembly', 'BAJA25-DT-320', {
        phase: 3,
        children: [
          createPurchasedPart('U-Joint', 'BAJA25-DT-321'),
          createComponent('Retaining Clip', 'BAJA25-DT-322', { phase: 3 })
        ]
      })
    ]
  }),
  // CVT Assembly
  createAssembly('CVT Assembly', 'BAJA25-DT-400', {
    phase: 4, ai_score: 72,
    children: [
      createSubAssembly('Primary Clutch Sub-Assembly', 'BAJA25-DT-410', {
        children: [
          createPurchasedPart('Primary Clutch', 'BAJA25-DT-411'),
          createComponent('Clutch Weights', 'BAJA25-DT-412', { phase: 3 })
        ]
      }),
      createSubAssembly('Secondary Clutch Sub-Assembly', 'BAJA25-DT-420', {
        children: [
          createPurchasedPart('Secondary Clutch', 'BAJA25-DT-421'),
          createComponent('Helix', 'BAJA25-DT-422', { phase: 3 })
        ]
      }),
      createSubAssembly('Belt Sub-Assembly', 'BAJA25-DT-430', {
        children: [
          createPurchasedPart('CVT Belt', 'BAJA25-DT-431'),
          createComponent('Belt Guard', 'BAJA25-DT-432', { phase: 4 })
        ]
      })
    ]
  })
]);

const createBaja2025Chassis = () => createFunctionalSubsystem('Chassis & Structure', 'BAJA25-CH', [
  createAssembly('Main Frame Assembly', 'BAJA25-CH-100', {
    phase: 5, ai_score: 85,
    children: [
      createSubAssembly('Front Frame Sub-Assembly', 'BAJA25-CH-110', {
        phase: 5, ai_score: 88,
        children: [
          createComponent('Front Hoop', 'BAJA25-CH-111', { phase: 6, ai_score: 92 }),
          createComponent('Front Bracing', 'BAJA25-CH-112', { phase: 5 }),
          createComponent('Bumper Mount', 'BAJA25-CH-113', { phase: 5 })
        ]
      }),
      createSubAssembly('Main Hoop Sub-Assembly', 'BAJA25-CH-120', {
        phase: 5, ai_score: 90,
        children: [
          createComponent('Main Hoop', 'BAJA25-CH-121', { phase: 6, ai_score: 94 }),
          createComponent('Shoulder Harness Bar', 'BAJA25-CH-122', { phase: 5 }),
          createComponent('Lateral Bracing', 'BAJA25-CH-123', { phase: 5 })
        ]
      }),
      createSubAssembly('Rear Frame Sub-Assembly', 'BAJA25-CH-130', {
        phase: 4, ai_score: 78,
        children: [
          createComponent('Rear Hoop', 'BAJA25-CH-131', { phase: 5 }),
          createComponent('Engine Mount Tubes', 'BAJA25-CH-132', { phase: 4 }),
          createComponent('Rear Bracing', 'BAJA25-CH-133', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Floor Pan Assembly', 'BAJA25-CH-200', {
    phase: 4,
    children: [
      createSubAssembly('Driver Floor Sub-Assembly', 'BAJA25-CH-210', {
        children: [
          createComponent('Floor Pan', 'BAJA25-CH-211', { phase: 4 }),
          createComponent('Heel Cup', 'BAJA25-CH-212', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Body Panel Assembly', 'BAJA25-CH-300', {
    phase: 3,
    children: [
      createSubAssembly('Nose Cone Sub-Assembly', 'BAJA25-CH-310', {
        children: [
          createComponent('Nose Cone Shell', 'BAJA25-CH-311', { phase: 3 }),
          createComponent('Nose Mounting Brackets', 'BAJA25-CH-312', { phase: 3 })
        ]
      }),
      createSubAssembly('Side Pod Sub-Assembly', 'BAJA25-CH-320', {
        children: [
          createComponent('Side Pod LH', 'BAJA25-CH-321', { phase: 3 }),
          createComponent('Side Pod RH', 'BAJA25-CH-322', { phase: 3 })
        ]
      })
    ]
  })
]);

const createBaja2025Suspension = () => createFunctionalSubsystem('Suspension', 'BAJA25-SU', [
  createAssembly('Front Suspension Assembly', 'BAJA25-SU-100', {
    phase: 4, ai_score: 74,
    children: [
      createSubAssembly('Upper A-Arm Sub-Assembly', 'BAJA25-SU-110', {
        phase: 4,
        children: [
          createComponent('Upper A-Arm', 'BAJA25-SU-111', { phase: 4 }),
          createPurchasedPart('Rod End 3/8-24', 'BAJA25-SU-112'),
          createPurchasedPart('Misalignment Spacer', 'BAJA25-SU-113')
        ]
      }),
      createSubAssembly('Lower A-Arm Sub-Assembly', 'BAJA25-SU-120', {
        phase: 4,
        children: [
          createComponent('Lower A-Arm', 'BAJA25-SU-121', { phase: 4 }),
          createPurchasedPart('Rod End 1/2-20', 'BAJA25-SU-122'),
          createPurchasedPart('Misalignment Spacer', 'BAJA25-SU-123')
        ]
      }),
      createSubAssembly('Front Upright Sub-Assembly', 'BAJA25-SU-130', {
        phase: 5, ai_score: 80,
        children: [
          createComponent('Front Upright', 'BAJA25-SU-131', { phase: 5, ai_score: 82 }),
          createPurchasedPart('Wheel Bearing', 'BAJA25-SU-132'),
          createComponent('Spindle', 'BAJA25-SU-133', { phase: 5 })
        ]
      }),
      createSubAssembly('Front Shock Sub-Assembly', 'BAJA25-SU-140', {
        children: [
          createPurchasedPart('Fox Float 3 Shock', 'BAJA25-SU-141'),
          createComponent('Shock Mount Upper', 'BAJA25-SU-142', { phase: 4 }),
          createComponent('Shock Mount Lower', 'BAJA25-SU-143', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Rear Suspension Assembly', 'BAJA25-SU-200', {
    phase: 4, ai_score: 72,
    children: [
      createSubAssembly('Trailing Arm Sub-Assembly', 'BAJA25-SU-210', {
        phase: 4,
        children: [
          createComponent('Trailing Arm', 'BAJA25-SU-211', { phase: 4 }),
          createPurchasedPart('Pivot Bushing', 'BAJA25-SU-212'),
          createComponent('Axle Carrier', 'BAJA25-SU-213', { phase: 4 })
        ]
      }),
      createSubAssembly('Rear Shock Sub-Assembly', 'BAJA25-SU-220', {
        children: [
          createPurchasedPart('Fox Float 3 Shock', 'BAJA25-SU-221'),
          createComponent('Shock Mount', 'BAJA25-SU-222', { phase: 4 })
        ]
      }),
      createSubAssembly('CV Joint Sub-Assembly', 'BAJA25-SU-230', {
        children: [
          createPurchasedPart('CV Joint Inner', 'BAJA25-SU-231'),
          createPurchasedPart('CV Joint Outer', 'BAJA25-SU-232'),
          createComponent('CV Axle Shaft', 'BAJA25-SU-233', { phase: 4 })
        ]
      })
    ]
  })
]);

const createBaja2025Braking = () => createFunctionalSubsystem('Braking', 'BAJA25-BR', [
  createAssembly('Front Brake Assembly', 'BAJA25-BR-100', {
    phase: 5, ai_score: 82,
    children: [
      createSubAssembly('Caliper Sub-Assembly', 'BAJA25-BR-110', {
        phase: 5,
        children: [
          createPurchasedPart('Wilwood Caliper', 'BAJA25-BR-111'),
          createPurchasedPart('Brake Pads', 'BAJA25-BR-112'),
          createComponent('Caliper Bracket', 'BAJA25-BR-113', { phase: 5 })
        ]
      }),
      createSubAssembly('Rotor Sub-Assembly', 'BAJA25-BR-120', {
        phase: 5, ai_score: 85,
        children: [
          createComponent('Brake Rotor', 'BAJA25-BR-121', { phase: 5, ai_score: 88 }),
          createComponent('Rotor Hat', 'BAJA25-BR-122', { phase: 5 })
        ]
      })
    ]
  }),
  createAssembly('Rear Brake Assembly', 'BAJA25-BR-200', {
    phase: 4,
    children: [
      createSubAssembly('Inboard Brake Sub-Assembly', 'BAJA25-BR-210', {
        children: [
          createPurchasedPart('Wilwood Caliper', 'BAJA25-BR-211'),
          createComponent('Inboard Rotor', 'BAJA25-BR-212', { phase: 4 }),
          createComponent('Rotor Carrier', 'BAJA25-BR-213', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Pedal Box Assembly', 'BAJA25-BR-300', {
    phase: 4, ai_score: 75,
    children: [
      createSubAssembly('Master Cylinder Sub-Assembly', 'BAJA25-BR-310', {
        children: [
          createPurchasedPart('Master Cylinder', 'BAJA25-BR-311'),
          createPurchasedPart('Reservoir', 'BAJA25-BR-312'),
          createComponent('MC Bracket', 'BAJA25-BR-313', { phase: 4 })
        ]
      }),
      createSubAssembly('Pedal Sub-Assembly', 'BAJA25-BR-320', {
        children: [
          createComponent('Brake Pedal', 'BAJA25-BR-321', { phase: 4 }),
          createComponent('Pedal Pivot', 'BAJA25-BR-322', { phase: 4 }),
          createPurchasedPart('Pedal Pad', 'BAJA25-BR-323')
        ]
      }),
      createSubAssembly('Balance Bar Sub-Assembly', 'BAJA25-BR-330', {
        children: [
          createComponent('Balance Bar', 'BAJA25-BR-331', { phase: 4 }),
          createPurchasedPart('Adjuster Knob', 'BAJA25-BR-332')
        ]
      })
    ]
  }),
  createAssembly('Brake Line Assembly', 'BAJA25-BR-400', {
    phase: 3,
    children: [
      createSubAssembly('Hard Line Sub-Assembly', 'BAJA25-BR-410', {
        children: [
          createComponent('Front Brake Line', 'BAJA25-BR-411', { phase: 3 }),
          createComponent('Rear Brake Line', 'BAJA25-BR-412', { phase: 3 })
        ]
      }),
      createSubAssembly('Flex Line Sub-Assembly', 'BAJA25-BR-420', {
        children: [
          createPurchasedPart('Front Flex Hose', 'BAJA25-BR-421'),
          createPurchasedPart('Rear Flex Hose', 'BAJA25-BR-422')
        ]
      })
    ]
  })
]);

const createBaja2025Steering = () => createFunctionalSubsystem('Steering', 'BAJA25-ST', [
  createAssembly('Steering Rack Assembly', 'BAJA25-ST-100', {
    phase: 4, ai_score: 78,
    children: [
      createSubAssembly('Rack Housing Sub-Assembly', 'BAJA25-ST-110', {
        children: [
          createPurchasedPart('Steering Rack', 'BAJA25-ST-111'),
          createComponent('Rack Mount Clamp', 'BAJA25-ST-112', { phase: 4 })
        ]
      }),
      createSubAssembly('Tie Rod Sub-Assembly', 'BAJA25-ST-120', {
        children: [
          createComponent('Tie Rod', 'BAJA25-ST-121', { phase: 4 }),
          createPurchasedPart('Rod End', 'BAJA25-ST-122'),
          createComponent('Jam Nut', 'BAJA25-ST-123', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Steering Column Assembly', 'BAJA25-ST-200', {
    phase: 4,
    children: [
      createSubAssembly('Column Shaft Sub-Assembly', 'BAJA25-ST-210', {
        children: [
          createComponent('Steering Shaft Upper', 'BAJA25-ST-211', { phase: 4 }),
          createComponent('Steering Shaft Lower', 'BAJA25-ST-212', { phase: 4 }),
          createPurchasedPart('U-Joint', 'BAJA25-ST-213')
        ]
      }),
      createSubAssembly('Column Support Sub-Assembly', 'BAJA25-ST-220', {
        children: [
          createComponent('Column Bearing Housing', 'BAJA25-ST-221', { phase: 4 }),
          createPurchasedPart('Column Bearing', 'BAJA25-ST-222')
        ]
      })
    ]
  }),
  createAssembly('Steering Wheel Assembly', 'BAJA25-ST-300', {
    phase: 3,
    children: [
      createSubAssembly('Wheel Hub Sub-Assembly', 'BAJA25-ST-310', {
        children: [
          createPurchasedPart('Quick Release Hub', 'BAJA25-ST-311'),
          createPurchasedPart('Steering Wheel', 'BAJA25-ST-312')
        ]
      })
    ]
  })
]);

const createBaja2025Ergonomics = () => createFunctionalSubsystem('Ergonomics & Controls', 'BAJA25-ER', [
  createAssembly('Seat Assembly', 'BAJA25-ER-100', {
    phase: 4,
    children: [
      createSubAssembly('Seat Structure Sub-Assembly', 'BAJA25-ER-110', {
        children: [
          createPurchasedPart('Racing Seat', 'BAJA25-ER-111'),
          createComponent('Seat Mount LH', 'BAJA25-ER-112', { phase: 4 }),
          createComponent('Seat Mount RH', 'BAJA25-ER-113', { phase: 4 })
        ]
      }),
      createSubAssembly('Seat Slider Sub-Assembly', 'BAJA25-ER-120', {
        children: [
          createComponent('Slider Rail', 'BAJA25-ER-121', { phase: 4 }),
          createComponent('Slider Lock', 'BAJA25-ER-122', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Harness Assembly', 'BAJA25-ER-200', {
    phase: 4,
    children: [
      createSubAssembly('Belt Sub-Assembly', 'BAJA25-ER-210', {
        children: [
          createPurchasedPart('5-Point Harness', 'BAJA25-ER-211'),
          createComponent('Harness Mount Tab', 'BAJA25-ER-212', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Throttle Assembly', 'BAJA25-ER-300', {
    phase: 3,
    children: [
      createSubAssembly('Pedal Sub-Assembly', 'BAJA25-ER-310', {
        children: [
          createComponent('Throttle Pedal', 'BAJA25-ER-311', { phase: 3 }),
          createPurchasedPart('Return Spring', 'BAJA25-ER-312')
        ]
      }),
      createSubAssembly('Cable Sub-Assembly', 'BAJA25-ER-320', {
        children: [
          createPurchasedPart('Throttle Cable', 'BAJA25-ER-321'),
          createComponent('Cable Bracket', 'BAJA25-ER-322', { phase: 3 })
        ]
      })
    ]
  })
]);

const createBaja2025Electrical = () => createFunctionalSubsystem('Electrical', 'BAJA25-EL', [
  createAssembly('Kill Switch Assembly', 'BAJA25-EL-100', {
    phase: 4,
    children: [
      createSubAssembly('Primary Kill Sub-Assembly', 'BAJA25-EL-110', {
        children: [
          createPurchasedPart('Kill Switch', 'BAJA25-EL-111'),
          createComponent('Switch Bracket', 'BAJA25-EL-112', { phase: 4 })
        ]
      }),
      createSubAssembly('Secondary Kill Sub-Assembly', 'BAJA25-EL-120', {
        children: [
          createPurchasedPart('Lanyard Kill Switch', 'BAJA25-EL-121'),
          createComponent('Lanyard Mount', 'BAJA25-EL-122', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Wiring Harness Assembly', 'BAJA25-EL-200', {
    phase: 3,
    children: [
      createSubAssembly('Main Harness Sub-Assembly', 'BAJA25-EL-210', {
        children: [
          createComponent('Main Harness', 'BAJA25-EL-211', { phase: 3 }),
          createPurchasedPart('Fuse Block', 'BAJA25-EL-212'),
          createPurchasedPart('Relay', 'BAJA25-EL-213')
        ]
      })
    ]
  }),
  createAssembly('Lighting Assembly', 'BAJA25-EL-300', {
    phase: 2,
    children: [
      createSubAssembly('Headlight Sub-Assembly', 'BAJA25-EL-310', {
        children: [
          createPurchasedPart('LED Headlight', 'BAJA25-EL-311'),
          createComponent('Headlight Bracket', 'BAJA25-EL-312', { phase: 2 })
        ]
      }),
      createSubAssembly('Taillight Sub-Assembly', 'BAJA25-EL-320', {
        children: [
          createPurchasedPart('LED Taillight', 'BAJA25-EL-321'),
          createComponent('Taillight Bracket', 'BAJA25-EL-322', { phase: 2 })
        ]
      })
    ]
  })
]);

const createBaja2025Cooling = () => createFunctionalSubsystem('Powertrain Cooling', 'BAJA25-CO', [
  createAssembly('Engine Cooling Assembly', 'BAJA25-CO-100', {
    phase: 3,
    children: [
      createSubAssembly('Shroud Sub-Assembly', 'BAJA25-CO-110', {
        children: [
          createComponent('Fan Shroud', 'BAJA25-CO-111', { phase: 3 }),
          createComponent('Air Duct', 'BAJA25-CO-112', { phase: 3 })
        ]
      })
    ]
  }),
  createAssembly('CVT Cooling Assembly', 'BAJA25-CO-200', {
    phase: 3,
    children: [
      createSubAssembly('Intake Sub-Assembly', 'BAJA25-CO-210', {
        children: [
          createComponent('CVT Intake Duct', 'BAJA25-CO-211', { phase: 3 }),
          createComponent('Intake Scoop', 'BAJA25-CO-212', { phase: 3 })
        ]
      }),
      createSubAssembly('Exhaust Sub-Assembly', 'BAJA25-CO-220', {
        children: [
          createComponent('CVT Exhaust Duct', 'BAJA25-CO-221', { phase: 3 })
        ]
      })
    ]
  })
]);

// Continue in next part...

// =============================================================================
// BAJA 2025 COMPLETE PROJECT
// =============================================================================

// Milestone types for projects
export const MILESTONE_TYPES = {
  BUILD_COMPLETE: 'build_complete',
  TESTING_COMPLETE: 'testing_complete',
  VALIDATION_COMPLETE: 'validation_complete',
  REWORK_COMPLETE: 'rework_complete',
  RELEASE: 'release',
  COMPETITION: 'competition',
  REVIEW: 'review',
  CUSTOM: 'custom'
};

// Helper to create milestones
const createMilestone = (type, name, targetDate, status = 'pending', actualDate = null) => ({
  id: generateId('milestone'),
  type,
  name,
  target_date: targetDate,
  actual_date: actualDate,
  status,
  notes: null
});

export const BAJA_2025 = {
  id: 'proj-baja-2025',
  name: 'Baja 2025',
  description: 'BAJA SAE 2025 Competition Vehicle - New design with improved drivetrain and suspension',
  mode: PROJECT_MODES.NEW_DESIGN,
  status: PROJECT_STATUS.ACTIVE,
  rigor_tier: 2,
  current_phase: 4,
  // Phase status for 7-Phase Timeline Explainer
  phase_status_by_phase: {
    1: PHASE_STATUS.COMPLETED,  // Requirements complete
    2: PHASE_STATUS.COMPLETED,  // R&D complete
    3: PHASE_STATUS.IN_PROGRESS, // Design in progress (CAD partially complete, DFM/DFS ongoing)
    4: PHASE_STATUS.IN_PROGRESS, // Data collection ongoing
    5: PHASE_STATUS.NOT_STARTED, // Analysis not started
    6: PHASE_STATUS.NOT_STARTED, // Testing not started
    7: PHASE_STATUS.NOT_STARTED  // Correlation not started
  },
  created_at: '2024-09-01T00:00:00Z',
  target_completion_date: '2025-06-13',
  team: 'BAJA Racing Team',
  tags: ['competition', '2025', 'new-design', 'baja'],
  // Organization and visibility - Public Demo Org (Free tier, publicly visible)
  org_id: 'org-public-demo',
  visibility: 'public',
  // Project milestones - key dates for project tracking
  milestones: [
    createMilestone(MILESTONE_TYPES.BUILD_COMPLETE, 'Vehicle Build Complete', '2025-05-15', 'pending'),
    createMilestone(MILESTONE_TYPES.TESTING_COMPLETE, 'All Testing Complete', '2025-05-30', 'pending'),
    createMilestone(MILESTONE_TYPES.VALIDATION_COMPLETE, 'Validation Package Approved', '2025-06-06', 'pending'),
    createMilestone(MILESTONE_TYPES.REWORK_COMPLETE, 'Final Rework Complete', '2025-06-10', 'pending'),
    createMilestone(MILESTONE_TYPES.COMPETITION, 'Baja SAE Competition', '2025-06-13', 'pending')
  ],
  root_node: createAssembly('Vehicle', 'BAJA25-000', {
    phase: 4, ai_score: 75,
    show_cad: true, cad_type: 'frame', cad_color: '#8B5CF6',
    children: [
      createBaja2025Chassis(),
      createBaja2025Suspension(),
      createBaja2025Drivetrain(),
      createBaja2025Braking(),
      createBaja2025Steering(),
      createBaja2025Ergonomics(),
      createBaja2025Electrical(),
      createBaja2025Cooling()
    ]
  }),
  // Manufacturing Assets - Fixtures linked to lowest constraining node
  manufacturing_assets: [
    createManufacturingAsset('Chassis Weld Fixture', 'BAJA25-FIX-001', FIXTURE_TYPES.WELD_FIXTURE, ['BAJA25-CH-110', 'BAJA25-CH-120'], {
      phase: 5, ai_score: 88,
      attachments: [createAttachment(ATTACHMENT_TYPES.CAD, 'chassis_weld_fixture.sldasm')]
    }),
    createManufacturingAsset('Suspension Assembly Fixture', 'BAJA25-FIX-002', FIXTURE_TYPES.ASSEMBLY_FIXTURE, ['BAJA25-SU-100', 'BAJA25-SU-200'], {
      phase: 4, ai_score: 75
    }),
    createManufacturingAsset('Gearbox Housing Drill Fixture', 'BAJA25-FIX-003', FIXTURE_TYPES.DRILL_FIXTURE, ['BAJA25-DT-141'], {
      phase: 4, ai_score: 82,
      attachments: [createAttachment(ATTACHMENT_TYPES.CAD, 'gearbox_drill_fixture.sldasm')]
    }),
    createManufacturingAsset('A-Arm Weld Jig', 'BAJA25-FIX-004', FIXTURE_TYPES.WELD_FIXTURE, ['BAJA25-SU-111', 'BAJA25-SU-121'], {
      phase: 5, ai_score: 90
    }),
    createManufacturingAsset('Brake Caliper Inspection Gauge', 'BAJA25-FIX-005', FIXTURE_TYPES.INSPECTION_FIXTURE, ['BAJA25-BR-111'], {
      phase: 4, ai_score: 85
    }),
    createManufacturingAsset('Frame Assembly Stand', 'BAJA25-FIX-006', FIXTURE_TYPES.HANDLING_FIXTURE, ['BAJA25-CH-100'], {
      phase: 3
    }),
    createManufacturingAsset('Upright Machining Fixture', 'BAJA25-FIX-007', FIXTURE_TYPES.DRILL_FIXTURE, ['BAJA25-SU-131', 'BAJA25-SU-231'], {
      phase: 4, ai_score: 78,
      attachments: [
        createAttachment(ATTACHMENT_TYPES.CAD, 'upright_machining_fixture.sldasm'),
        createAttachment(ATTACHMENT_TYPES.WORK_INSTRUCTION, 'WI-upright-machining.pdf')
      ]
    })
  ],
  // Engineering Studies - DOE, parametric, trade studies owned by nodes
  engineering_studies: [
    // Gearbox Assembly DOEs
    createEngineeringStudy('Gear Ratio Optimization DOE', 'STD-DT-001', STUDY_TYPES.DOE, STUDY_INTENTS.OPTIMIZATION, 'BAJA25-DT-100', {
      owning_node_part_number: 'BAJA25-DT-100',
      phase_contexts: ['4', '5'],
      status: 'complete',
      factors: ['Final drive ratio', 'Primary reduction', 'CVT shift point'],
      responses: ['0-30 mph time', 'Hill climb time', 'Fuel efficiency'],
      design_type: 'Full factorial 2^3',
      run_count: 8,
      linked_requirements: ['REQ-DT-001', 'REQ-DT-002', 'REQ-DT-005'],
      results_summary: 'Optimal configuration: 8.5:1 final drive, 2.5:1 primary, 3200 RPM shift point',
      attachments: [createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'gear_ratio_doe_results.xlsx')]
    }),
    createEngineeringStudy('Gearbox Thermal Analysis', 'STD-DT-002', STUDY_TYPES.PARAMETRIC, STUDY_INTENTS.VALIDATION, 'BAJA25-DT-100', {
      owning_node_part_number: 'BAJA25-DT-100',
      phase_contexts: ['5'],
      status: 'complete',
      parameter: 'Oil volume',
      range: '200ml to 400ml',
      step_count: 5,
      linked_requirements: ['REQ-DT-008'],
      results_summary: 'Min 300ml required to maintain <100°C under sustained load'
    }),
    // Input Shaft sensitivity study
    createEngineeringStudy('Input Shaft Fatigue Life Sensitivity', 'STD-DT-003', STUDY_TYPES.SENSITIVITY, STUDY_INTENTS.VALIDATION, 'BAJA25-DT-111', {
      owning_node_part_number: 'BAJA25-DT-111',
      phase_contexts: ['5'],
      status: 'in_progress',
      linked_requirements: ['REQ-DT-010', 'REQ-DT-011'],
      results_summary: null
    }),
    // Suspension trade study
    createEngineeringStudy('Front Suspension Geometry Trade Study', 'STD-SU-001', STUDY_TYPES.TRADE_STUDY, STUDY_INTENTS.RESEARCH, 'BAJA25-SU-100', {
      owning_node_part_number: 'BAJA25-SU-100',
      phase_contexts: ['2', '3'],
      status: 'complete',
      alternatives: ['Double wishbone', 'MacPherson strut', 'Trailing arm'],
      criteria: ['Weight', 'Camber control', 'Manufacturing complexity', 'Adjustability'],
      weights: [0.25, 0.35, 0.20, 0.20],
      linked_requirements: ['REQ-SU-001', 'REQ-SU-002'],
      results_summary: 'Double wishbone selected - best camber control for rough terrain'
    }),
    createEngineeringStudy('Spring Rate Optimization DOE', 'STD-SU-002', STUDY_TYPES.DOE, STUDY_INTENTS.OPTIMIZATION, 'BAJA25-SU-100', {
      owning_node_part_number: 'BAJA25-SU-100',
      phase_contexts: ['4', '5'],
      status: 'complete',
      factors: ['Front spring rate', 'Rear spring rate', 'Damper setting'],
      responses: ['Body roll', 'Pitch rate', 'Driver comfort rating'],
      design_type: 'Fractional factorial 2^3-1',
      run_count: 4,
      linked_requirements: ['REQ-SU-003', 'REQ-SU-004'],
      results_summary: 'Front 250 lb/in, Rear 300 lb/in optimal for competition course'
    }),
    // Chassis research DOE
    createEngineeringStudy('Frame Tube Material Selection', 'STD-CH-001', STUDY_TYPES.TRADE_STUDY, STUDY_INTENTS.RESEARCH, 'BAJA25-CH-100', {
      owning_node_part_number: 'BAJA25-CH-100',
      phase_contexts: ['2'],
      status: 'complete',
      alternatives: ['4130 Steel', '1020 DOM', '4130 Normalized'],
      criteria: ['Strength-to-weight', 'Weldability', 'Cost', 'Availability'],
      weights: [0.35, 0.25, 0.20, 0.20],
      linked_requirements: ['REQ-CH-001', 'REQ-CH-005'],
      results_summary: '4130 Normalized selected for optimal strength/weldability balance'
    }),
    // Braking system DOE
    createEngineeringStudy('Brake Bias DOE', 'STD-BR-001', STUDY_TYPES.DOE, STUDY_INTENTS.VALIDATION, 'BAJA25-BR-100', {
      owning_node_part_number: 'BAJA25-BR-100',
      phase_contexts: ['4', '5', '6'],
      status: 'in_progress',
      factors: ['Front/rear bias ratio', 'Master cylinder bore', 'Pad compound'],
      responses: ['Stopping distance', 'Pedal feel', 'Fade resistance'],
      design_type: 'Central composite design',
      run_count: 15,
      linked_requirements: ['REQ-BR-001', 'REQ-BR-002', 'REQ-BR-003'],
      results_summary: null
    }),
    // Vehicle-level correlation study (Phase 7)
    createEngineeringStudy('Lap Time Correlation Study', 'STD-VEH-001', STUDY_TYPES.DOE, STUDY_INTENTS.CORRELATION, 'BAJA25-000', {
      owning_node_part_number: 'BAJA25-000',
      phase_contexts: ['7'],
      status: 'not_started',
      factors: ['Suspension setup', 'Tire pressure', 'Driver'],
      responses: ['Lap time', 'Predicted vs actual'],
      linked_requirements: ['REQ-VEH-001'],
      results_summary: null
    })
  ],
  // Test Cases - Owned by nodes they validate
  test_cases: [
    // Gearbox tests
    createTestCase('Gearbox Efficiency Test', 'TST-DT-001', TEST_LEVELS.SYSTEM, 'BAJA25-DT-100', {
      owning_node_part_number: 'BAJA25-DT-100',
      status: 'passed',
      scheduled_date: '2025-01-10',
      executed_date: '2025-01-10',
      acceptance_criteria: 'Efficiency > 92% at rated load',
      result: '94.2%',
      pass_fail: 'pass',
      linked_requirements: ['REQ-DT-001'],
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'gearbox_efficiency_report.pdf')]
    }),
    createTestCase('Gearbox Thermal Endurance Test', 'TST-DT-002', TEST_LEVELS.SYSTEM, 'BAJA25-DT-100', {
      owning_node_part_number: 'BAJA25-DT-100',
      status: 'in_progress',
      scheduled_date: '2025-01-15',
      acceptance_criteria: 'Oil temp < 100°C after 30 min sustained operation',
      linked_requirements: ['REQ-DT-008']
    }),
    createTestCase('Input Shaft Fatigue Test', 'TST-DT-003', TEST_LEVELS.COMPONENT, 'BAJA25-DT-111', {
      owning_node_part_number: 'BAJA25-DT-111',
      status: 'passed',
      scheduled_date: '2025-01-05',
      executed_date: '2025-01-05',
      acceptance_criteria: '100,000 cycles at design load without failure',
      result: '127,000 cycles to runout',
      pass_fail: 'pass',
      linked_requirements: ['REQ-DT-010'],
      test_fixture_id: 'BAJA25-FIX-TEST-001'
    }),
    createTestCase('Output Shaft Static Load Test', 'TST-DT-004', TEST_LEVELS.COMPONENT, 'BAJA25-DT-121', {
      owning_node_part_number: 'BAJA25-DT-121',
      status: 'not_started',
      scheduled_date: '2025-01-20',
      acceptance_criteria: 'No yield at 1.5x design torque',
      linked_requirements: ['REQ-DT-012']
    }),
    // Suspension tests
    createTestCase('Front Suspension Travel Test', 'TST-SU-001', TEST_LEVELS.SYSTEM, 'BAJA25-SU-100', {
      owning_node_part_number: 'BAJA25-SU-100',
      status: 'passed',
      executed_date: '2025-01-08',
      acceptance_criteria: 'Min 10" wheel travel',
      result: '11.2" measured',
      pass_fail: 'pass',
      linked_requirements: ['REQ-SU-005']
    }),
    createTestCase('A-Arm Weld Strength Test', 'TST-SU-002', TEST_LEVELS.COMPONENT, 'BAJA25-SU-111', {
      owning_node_part_number: 'BAJA25-SU-111',
      status: 'passed',
      executed_date: '2025-01-06',
      acceptance_criteria: 'Weld strength > parent material',
      result: 'Failed at 142% of design load in parent material',
      pass_fail: 'pass',
      linked_requirements: ['REQ-SU-010'],
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'a-arm_weld_test_report.pdf')]
    }),
    createTestCase('Upright Static Load Test', 'TST-SU-003', TEST_LEVELS.COMPONENT, 'BAJA25-SU-131', {
      owning_node_part_number: 'BAJA25-SU-131',
      status: 'in_progress',
      scheduled_date: '2025-01-18',
      acceptance_criteria: 'No permanent deformation at 2x design load',
      linked_requirements: ['REQ-SU-011']
    }),
    // Chassis tests
    createTestCase('Roll Cage FEA Correlation', 'TST-CH-001', TEST_LEVELS.SYSTEM, 'BAJA25-CH-100', {
      owning_node_part_number: 'BAJA25-CH-100',
      status: 'not_started',
      scheduled_date: '2025-02-01',
      acceptance_criteria: 'FEA prediction within 10% of measured deflection',
      linked_requirements: ['REQ-CH-002']
    }),
    createTestCase('Roll Cage Destructive Test', 'TST-CH-002', TEST_LEVELS.SYSTEM, 'BAJA25-CH-100', {
      owning_node_part_number: 'BAJA25-CH-100',
      status: 'not_started',
      scheduled_date: '2025-02-15',
      acceptance_criteria: 'Survive 350 lb applied at specified angle per SAE rules',
      linked_requirements: ['REQ-CH-001', 'REQ-CH-003']
    }),
    // Brake tests
    createTestCase('Brake Response Time Test', 'TST-BR-001', TEST_LEVELS.SYSTEM, 'BAJA25-BR-100', {
      owning_node_part_number: 'BAJA25-BR-100',
      status: 'passed',
      executed_date: '2025-01-12',
      acceptance_criteria: 'Full braking force within 0.3 seconds',
      result: '0.22 seconds',
      pass_fail: 'pass',
      linked_requirements: ['REQ-BR-004']
    }),
    createTestCase('Brake Fade Test', 'TST-BR-002', TEST_LEVELS.SYSTEM, 'BAJA25-BR-100', {
      owning_node_part_number: 'BAJA25-BR-100',
      status: 'not_started',
      scheduled_date: '2025-01-25',
      acceptance_criteria: 'Less than 15% pedal force increase after 10 stops from 25 mph',
      linked_requirements: ['REQ-BR-005']
    }),
    // Vehicle-level tests
    createTestCase('Full Vehicle Dynamics Test', 'TST-VEH-001', TEST_LEVELS.FULL_SYSTEM, 'BAJA25-000', {
      owning_node_part_number: 'BAJA25-000',
      status: 'not_started',
      scheduled_date: '2025-03-01',
      acceptance_criteria: 'Complete test course without failure, lap time under target',
      linked_requirements: ['REQ-VEH-001', 'REQ-VEH-002']
    }),
    createTestCase('Endurance Test - 4 Hour Run', 'TST-VEH-002', TEST_LEVELS.FULL_SYSTEM, 'BAJA25-000', {
      owning_node_part_number: 'BAJA25-000',
      status: 'not_started',
      scheduled_date: '2025-03-15',
      acceptance_criteria: 'Complete 4-hour endurance run without critical failure',
      linked_requirements: ['REQ-VEH-003']
    })
  ],
  // ==========================================================================
  // ENGINEERING SPECIFICATIONS - Full hierarchical spec coverage
  // Vehicle -> System -> Component levels
  // ==========================================================================
  specifications: [
    // ========================================================================
    // VEHICLE-LEVEL SPECIFICATIONS (12 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-VEH-001',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'Vehicle Dry Weight',
      description: 'Total vehicle weight without driver, fluids, or ballast. Critical for performance in hill climb, acceleration, and maneuverability events.',
      metric: 'Mass',
      target_value: '450',
      units: 'lbs',
      source: 'Competitive analysis of top 10 Baja SAE teams 2022-2024; lighter vehicles consistently score higher in dynamic events. Target derived from 2024 vehicle (485 lbs) with 7% reduction goal.',
      test_method: 'Weigh complete vehicle on calibrated scale with all components installed, fuel tank empty',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-VEH-001'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-VEH-002',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: '0-30 mph Acceleration Time',
      description: 'Vehicle acceleration performance target. Key metric for acceleration event competitiveness.',
      metric: 'Time',
      target_value: '4.5',
      units: 'sec',
      source: 'SAE Baja acceleration event scoring analysis; 4.5 sec places in top 20%. Based on Briggs 10 HP engine power curve and optimal CVT calibration from 2024 Gear Ratio DOE (STD-DT-001).',
      test_method: 'GPS-measured acceleration test on flat pavement, 95th percentile driver, ambient temp 60-80°F',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-VEH-002'],
      linked_tests: [
        { test_id: 'TST-VEH-001', name: 'Full Vehicle Dynamics Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-VEH-003',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'Maximum Speed',
      description: 'Top speed capability for endurance and hill climb events.',
      metric: 'Speed',
      target_value: '35',
      units: 'mph',
      source: 'Engine governor limit (3800 RPM) with 8.5:1 final drive and 23" tire diameter. Validated against 2024 endurance lap telemetry showing 32 mph average on straights.',
      test_method: 'GPS-measured on flat terrain with CVT fully shifted',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-VEH-003'],
      linked_tests: [
        { test_id: 'TST-VEH-001', name: 'Full Vehicle Dynamics Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-VEH-004',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'Minimum Ground Clearance',
      description: 'Clearance under lowest point of vehicle (excluding suspension deflection). Critical for rock crawl and rough terrain.',
      metric: 'Distance',
      target_value: '10',
      units: 'in',
      source: 'Rock crawl course analysis from 2023-2024 competitions; 10" clears 95% of obstacles. Lessons learned from 2024 where 8" clearance caused belly-out failures.',
      test_method: 'Measure clearance at lowest point with vehicle at static ride height, 180 lb driver',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-VEH-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-VEH-005',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'Minimum Turning Radius',
      description: 'Tightest turning circle achievable at full steering lock. Important for maneuverability event.',
      metric: 'Radius',
      target_value: '13',
      units: 'ft',
      source: 'SAE Baja maneuverability course dimensions require <15 ft turning radius for full points. 13 ft target provides margin for driver variability.',
      test_method: 'Measure tire track radius at full steering lock, both directions, average',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-VEH-005'],
      linked_tests: [
        { test_id: 'TST-VEH-001', name: 'Full Vehicle Dynamics Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-VEH-006',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'Braking Distance (20-0 mph)',
      description: 'Stopping distance from 20 mph to complete stop. Must meet SAE safety requirements.',
      metric: 'Distance',
      target_value: '22',
      units: 'ft',
      source: 'SAE Baja Rules 2025 Section B7.3 requires all four wheels to lock simultaneously within defined distance. 22 ft target provides 15% margin over rule minimum.',
      test_method: 'Measured on dry pavement, 180 lb driver, tires at competition pressure',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-VEH-006'],
      linked_tests: [
        { test_id: 'TST-BR-001', name: 'Brake Response Time Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-VEH-007',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'CG Height',
      description: 'Center of gravity height above ground plane. Lower CG improves stability and reduces rollover risk.',
      metric: 'Height',
      target_value: '16',
      units: 'in',
      source: 'Vehicle dynamics analysis; 16" CG height with 48" track width provides roll stability margin. Derived from 2024 tilt table test (18" measured) with engine relocation goal.',
      test_method: 'Tilt table method per SAE J874, vehicle at static ride height',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-VEH-007'],
      linked_tests: [
        { test_id: 'TST-VEH-001', name: 'Full Vehicle Dynamics Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-VEH-008',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'Static Roll Stability Angle',
      description: 'Angle at which vehicle would tip during static tilt test. Minimum 45° per SAE rules.',
      metric: 'Angle',
      target_value: '52',
      units: 'deg',
      source: 'SAE Baja Rules 2025 Section B5.1 requires minimum 45° static roll stability. 52° target provides 15% safety margin for CG variation with different drivers.',
      test_method: 'Tilt table test per SAE J874',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-VEH-008'],
      linked_tests: [
        { test_id: 'TST-VEH-001', name: 'Full Vehicle Dynamics Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-VEH-009',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'Endurance Run Duration',
      description: 'Target continuous operation time without critical failure.',
      metric: 'Duration',
      target_value: '4',
      units: 'hours',
      source: 'SAE Baja endurance event is 4 hours. Vehicle must complete full duration to score maximum points. 2024 vehicle DNF at 3.5 hours due to CVT belt failure.',
      test_method: 'Continuous operation test on representative terrain',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-VEH-009'],
      linked_tests: [
        { test_id: 'TST-VEH-002', name: 'Endurance Test - 4 Hour Run', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-VEH-010',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'Driver Envelope (95th percentile)',
      description: 'Vehicle must accommodate 95th percentile male driver per SAE rules.',
      metric: 'Percentile',
      target_value: '95',
      units: '%',
      source: 'SAE Baja Rules 2025 Section B3.2 mandatory driver accommodation requirement. Failure results in disqualification at technical inspection.',
      test_method: 'Fit check with 95th percentile template per SAE Baja rules',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-VEH-010'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-VEH-011',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'Fuel Capacity',
      description: 'Onboard fuel capacity for endurance event.',
      metric: 'Volume',
      target_value: '1.5',
      units: 'gal',
      source: 'Fuel consumption analysis: 0.35 gal/hr average x 4 hours = 1.4 gal minimum. 1.5 gal provides margin for variable terrain fuel economy.',
      test_method: 'Measure tank volume to filler neck',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-VEH-011'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-VEH-012',
      level: 'vehicle',
      node_path: 'BAJA25-000',
      owning_node_part_number: 'BAJA25-000',
      title: 'Serviceability - Engine Swap Time',
      description: 'Time to replace engine assembly with hand tools.',
      metric: 'Time',
      target_value: '30',
      units: 'min',
      source: 'Team operational requirement; enables field engine replacement during competition if needed. 2024 pit crew achieved 45 min; target 30 min with improved mounting design.',
      test_method: 'Timed engine removal and reinstallation by trained team member',
      verification_level: 'test',
      status: 'needs_quantification',
      linked_requirements: ['REQ-VEH-012'],
      linked_tests: []
    },
    // ========================================================================
    // DRIVETRAIN SYSTEM SPECIFICATIONS (8 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-DT-001',
      level: 'system',
      node_path: 'BAJA25-DT',
      owning_node_part_number: 'BAJA25-DT-100',
      title: 'Gearbox Output Torque Capacity',
      description: 'Maximum continuous torque capacity at gearbox output shaft.',
      metric: 'Torque',
      target_value: '180',
      units: 'ft-lb',
      source: 'Briggs 10 HP engine produces 14.5 ft-lb at 2600 RPM. With 8.5:1 reduction and 1.5 safety factor: 14.5 x 8.5 x 1.5 = 185 ft-lb. Rounded to 180 ft-lb design target.',
      test_method: 'Dyno test at max engine torque with 1.5 safety factor',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-DT-001'],
      linked_tests: [
        { test_id: 'TST-DT-001', name: 'Gearbox Efficiency Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-DT-002',
      level: 'system',
      node_path: 'BAJA25-DT',
      owning_node_part_number: 'BAJA25-DT-100',
      title: 'Final Drive Ratio',
      description: 'Overall gear reduction from engine to wheels (CVT at 1:1).',
      metric: 'Ratio',
      target_value: '8.5',
      units: ':1',
      source: 'Gear Ratio Optimization DOE (STD-DT-001) result: optimal 8.5:1 balances 0-30 acceleration (4.5 sec) with 35 mph top speed at 3800 RPM governor limit.',
      test_method: 'Calculate from gear tooth counts, verify with wheel speed vs engine RPM',
      verification_level: 'analysis',
      status: 'active',
      linked_requirements: ['REQ-DT-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-DT-003',
      level: 'system',
      node_path: 'BAJA25-DT',
      owning_node_part_number: 'BAJA25-DT-400',
      title: 'CVT Ratio Range',
      description: 'CVT ratio spread from low to high.',
      metric: 'Ratio',
      target_value: '3.5',
      units: ':1',
      source: 'Gaged GX9 CVT specification sheet. 3.5:1 range enables launch at low ratio (10.5 hp multiplied) while achieving 1:1 overdrive for top speed.',
      test_method: 'Measure primary and secondary sheave positions at extremes',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-DT-003'],
      linked_tests: [
        { test_id: 'TST-DT-001', name: 'Gearbox Efficiency Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-DT-004',
      level: 'system',
      node_path: 'BAJA25-DT',
      owning_node_part_number: 'BAJA25-DT-400',
      title: 'CVT Belt Slip Margin',
      description: 'Safety margin before belt slip at maximum load.',
      metric: 'Margin',
      target_value: '15',
      units: '%',
      source: 'CVT belt manufacturer recommendation; 15% margin prevents slip-induced heat buildup. 2024 endurance DNF root cause was belt slip at 8% margin under sustained hill climb.',
      test_method: 'Compare input vs output RPM under max load dyno test',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-DT-004'],
      linked_tests: [
        { test_id: 'TST-DT-001', name: 'Gearbox Efficiency Test', status: 'passed', type: 'current' },
        { test_id: 'TST-DT-002', name: 'Gearbox Thermal Endurance Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-DT-005',
      level: 'system',
      node_path: 'BAJA25-DT',
      owning_node_part_number: 'BAJA25-DT-100',
      title: 'Gearbox Efficiency',
      description: 'Power transmission efficiency at rated load.',
      metric: 'Efficiency',
      target_value: '92',
      units: '%',
      source: 'Target based on 2024 measured efficiency (89%) with upgraded bearings and improved gear tooth finish. Industry benchmark for single-stage spur gearboxes is 94-97%.',
      test_method: 'Back-to-back dyno test with calibrated torque transducers',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-DT-005'],
      linked_tests: [
        { test_id: 'TST-DT-001', name: 'Gearbox Efficiency Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-DT-006',
      level: 'system',
      node_path: 'BAJA25-DT',
      owning_node_part_number: 'BAJA25-DT-100',
      title: 'Gearbox Oil Temperature Limit',
      description: 'Maximum operating oil temperature under sustained load.',
      metric: 'Temperature',
      target_value: '100',
      units: '°C',
      source: 'Gearbox Thermal Analysis (STD-DT-002) result: 300ml minimum oil volume maintains <100°C. Synthetic 75W-90 gear oil rated to 120°C provides 20°C margin.',
      test_method: 'Thermocouple in oil sump during 30-minute sustained load test',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-DT-006'],
      linked_tests: [
        { test_id: 'TST-DT-002', name: 'Gearbox Thermal Endurance Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-DT-007',
      level: 'system',
      node_path: 'BAJA25-DT',
      owning_node_part_number: 'BAJA25-DT-200',
      title: 'Differential Lock Engagement Force',
      description: 'Force required to engage/disengage differential lock (if equipped).',
      metric: 'Force',
      target_value: '25',
      units: 'lbf',
      source: 'Driver ergonomics requirement; must be operable with one hand while driving. 25 lbf is 95th percentile single-hand pull force for seated operator.',
      test_method: 'Push-pull gauge test on engagement mechanism',
      verification_level: 'test',
      status: 'needs_quantification',
      linked_requirements: ['REQ-DT-007'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-DT-008',
      level: 'system',
      node_path: 'BAJA25-DT',
      owning_node_part_number: 'BAJA25-DT-300',
      title: 'Driveshaft Critical Speed',
      description: 'First bending mode frequency of driveshaft.',
      metric: 'RPM',
      target_value: '8000',
      units: 'RPM',
      source: 'NVH engineering practice: critical speed must be >2x max operating RPM. Max wheel speed at 35 mph = 3200 RPM. 8000 RPM provides 2.5x margin.',
      test_method: 'FEA modal analysis, validated with impact hammer test',
      verification_level: 'analysis',
      status: 'active',
      linked_requirements: ['REQ-DT-008'],
      linked_tests: []
    },
    // ========================================================================
    // SUSPENSION SYSTEM SPECIFICATIONS (6 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-SU-001',
      level: 'system',
      node_path: 'BAJA25-SU',
      owning_node_part_number: 'BAJA25-SU-100',
      title: 'Front Suspension Travel',
      description: 'Total usable wheel travel from full droop to full bump.',
      metric: 'Travel',
      target_value: '11',
      units: 'in',
      source: 'Front Suspension Geometry Trade Study (STD-SU-001): Double wishbone selected for camber control. 11" travel absorbs typical Baja terrain obstacles without bottoming.',
      test_method: 'Measure wheel travel with suspension through full range',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-SU-001'],
      linked_tests: [
        { test_id: 'TST-SU-001', name: 'Front Suspension Travel Test', status: 'in_progress', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-SU-002',
      level: 'system',
      node_path: 'BAJA25-SU',
      owning_node_part_number: 'BAJA25-SU-200',
      title: 'Rear Suspension Travel',
      description: 'Total usable wheel travel from full droop to full bump.',
      metric: 'Travel',
      target_value: '12',
      units: 'in',
      source: 'Rear bias (12" vs 11" front) per off-road vehicle dynamics best practice. Rear absorbs larger impacts during landing and rough terrain acceleration.',
      test_method: 'Measure wheel travel with suspension through full range',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-SU-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-SU-003',
      level: 'system',
      node_path: 'BAJA25-SU',
      owning_node_part_number: 'BAJA25-SU-100',
      title: 'Front Spring Rate',
      description: 'Wheel rate at ride height (includes motion ratio).',
      metric: 'Rate',
      target_value: '250',
      units: 'lb/in',
      source: 'Spring Rate Optimization DOE (STD-SU-002) result: Front 250 lb/in, Rear 300 lb/in optimal for competition course. Natural frequency ~2.5 Hz matches terrain input.',
      test_method: 'Measure wheel load vs displacement through working range',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-SU-003'],
      linked_tests: [
        { test_id: 'TST-SU-001', name: 'Front Suspension Travel Test', status: 'in_progress', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-SU-004',
      level: 'system',
      node_path: 'BAJA25-SU',
      owning_node_part_number: 'BAJA25-SU-200',
      title: 'Rear Spring Rate',
      description: 'Wheel rate at ride height (includes motion ratio).',
      metric: 'Rate',
      target_value: '300',
      units: 'lb/in',
      source: 'Spring Rate Optimization DOE (STD-SU-002) result: 20% stiffer rear prevents pitch-down under braking and squat under acceleration. 60/40 weight distribution considered.',
      test_method: 'Measure wheel load vs displacement through working range',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-SU-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-SU-005',
      level: 'system',
      node_path: 'BAJA25-SU',
      owning_node_part_number: 'BAJA25-SU-100',
      title: 'Static Front Sag',
      description: 'Suspension compression under static load (percentage of travel).',
      metric: 'Percentage',
      target_value: '30',
      units: '%',
      source: 'Off-road suspension tuning best practice: 25-33% static sag provides equal bump and droop travel for obstacle absorption. 30% target is midpoint.',
      test_method: 'Measure sag with 180 lb driver, full fuel',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-SU-005'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-SU-006',
      level: 'system',
      node_path: 'BAJA25-SU',
      owning_node_part_number: 'BAJA25-SU-100',
      title: 'Front Camber Change Rate',
      description: 'Camber change per inch of wheel travel.',
      metric: 'Rate',
      target_value: '-0.5',
      units: 'deg/in',
      source: 'Suspension kinematics analysis: -0.5 deg/in gains negative camber in bump for cornering grip. Front Suspension Geometry Trade Study (STD-SU-001) validation target.',
      test_method: 'Measure camber at 1-inch travel increments through full range',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-SU-006'],
      linked_tests: [
        { test_id: 'TST-SU-001', name: 'Front Suspension Travel Test', status: 'in_progress', type: 'current' }
      ]
    },
    // ========================================================================
    // BRAKING SYSTEM SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-BR-001',
      level: 'system',
      node_path: 'BAJA25-BR',
      owning_node_part_number: 'BAJA25-BR-100',
      title: 'Deceleration Capability',
      description: 'Maximum achievable deceleration on dry pavement.',
      metric: 'Deceleration',
      target_value: '0.9',
      units: 'g',
      source: 'Tire friction coefficient analysis; off-road tires on dry pavement achieve 0.9-1.0g. 0.9g target ensures brake system is tire-limited, not system-limited.',
      test_method: 'Data-logged braking test on dry pavement',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-BR-001'],
      linked_tests: [
        { test_id: 'TST-BR-001', name: 'Brake Response Time Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-BR-002',
      level: 'system',
      node_path: 'BAJA25-BR',
      owning_node_part_number: 'BAJA25-BR-300',
      title: 'Maximum Pedal Force',
      description: 'Force required for maximum braking.',
      metric: 'Force',
      target_value: '80',
      units: 'lbf',
      source: 'Driver ergonomics study; 80 lbf is achievable by 95th percentile male driver without power assist. SAE J1100 recommends <100 lbf for passenger vehicles.',
      test_method: 'Load cell measurement at brake pedal pad',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-BR-002'],
      linked_tests: [
        { test_id: 'TST-BR-001', name: 'Brake Response Time Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-BR-003',
      level: 'system',
      node_path: 'BAJA25-BR',
      owning_node_part_number: 'BAJA25-BR-120',
      title: 'Rotor Maximum Operating Temperature',
      description: 'Maximum rotor temperature during repeated braking.',
      metric: 'Temperature',
      target_value: '450',
      units: '°C',
      source: 'Brake pad friction material specification; EBC Greenstuff pads fade above 450°C. Rotor sizing must maintain <450°C during competition braking duty cycle.',
      test_method: 'Pyrometer measurement after 10 consecutive stops from 25 mph',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-BR-003'],
      linked_tests: [
        { test_id: 'TST-BR-002', name: 'Brake Fade Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-BR-004',
      level: 'system',
      node_path: 'BAJA25-BR',
      owning_node_part_number: 'BAJA25-BR-100',
      title: 'Front/Rear Brake Bias',
      description: 'Percentage of braking force on front axle.',
      metric: 'Percentage',
      target_value: '62',
      units: '%',
      source: 'Weight transfer calculation: 60/40 static weight distribution shifts to ~68/32 under 0.9g braking. 62% front bias prevents rear lockup while maximizing deceleration.',
      test_method: 'Calculate from line pressures and caliper areas, verify with tire lockup sequence',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-BR-004'],
      linked_tests: [
        { test_id: 'TST-BR-001', name: 'Brake Response Time Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-BR-005',
      level: 'system',
      node_path: 'BAJA25-BR',
      owning_node_part_number: 'BAJA25-BR-300',
      title: 'Brake Pedal Travel',
      description: 'Pedal travel from rest to maximum braking.',
      metric: 'Travel',
      target_value: '2.5',
      units: 'in',
      source: 'Driver feedback from 2024 vehicle; 2.5" travel provides good modulation feel. >3" travel required bleed procedure. Master cylinder bore sized accordingly.',
      test_method: 'Measure pedal position at rest and at 80 lbf input',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-BR-005'],
      linked_tests: [
        { test_id: 'TST-BR-001', name: 'Brake Response Time Test', status: 'scheduled', type: 'current' }
      ]
    },
    // ========================================================================
    // STEERING SYSTEM SPECIFICATIONS (4 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ST-001',
      level: 'system',
      node_path: 'BAJA25-ST',
      owning_node_part_number: 'BAJA25-ST-100',
      title: 'Steering Ratio',
      description: 'Overall steering ratio from wheel to road wheels.',
      metric: 'Ratio',
      target_value: '4.5',
      units: ':1',
      source: 'Off-road vehicle dynamics: Quick 4.5:1 ratio enables rapid steering correction on loose surfaces. Driver feedback from 2024 (6:1 ratio) indicated sluggish response.',
      test_method: 'Measure steering wheel angle vs road wheel angle',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-ST-001'],
      linked_tests: [
        { test_id: 'TST-VEH-001', name: 'Full Vehicle Dynamics Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ST-002',
      level: 'system',
      node_path: 'BAJA25-ST',
      owning_node_part_number: 'BAJA25-ST-100',
      title: 'Maximum Steering Angle',
      description: 'Maximum achievable steering angle at wheels.',
      metric: 'Angle',
      target_value: '38',
      units: 'deg',
      source: 'Turning radius geometry: 38° steering angle with 60" wheelbase achieves 13 ft turning radius target (SPEC-VEH-005). Verified with Ackermann calculation.',
      test_method: 'Measure wheel angle at full steering lock',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-ST-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ST-003',
      level: 'system',
      node_path: 'BAJA25-ST',
      owning_node_part_number: 'BAJA25-ST-100',
      title: 'Steering Effort at Rest',
      description: 'Force required to turn steering wheel with vehicle stationary.',
      metric: 'Force',
      target_value: '15',
      units: 'lbf',
      source: 'Driver ergonomics; 15 lbf rim force allows sustained operation without fatigue. No power steering available, so mechanical advantage must achieve target.',
      test_method: 'Spring scale measurement at steering wheel rim',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-ST-003'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ST-004',
      level: 'system',
      node_path: 'BAJA25-ST',
      owning_node_part_number: 'BAJA25-ST-100',
      title: 'Ackermann Percentage',
      description: 'Ackermann steering geometry percentage.',
      metric: 'Percentage',
      target_value: '85',
      units: '%',
      source: 'Vehicle dynamics literature; 80-90% Ackermann optimal for low-speed off-road use. Reduces tire scrub in tight turns. 100% Ackermann causes inside tire drag at high slip angles.',
      test_method: 'Calculate from toe-out on turns measurement',
      verification_level: 'analysis',
      status: 'active',
      linked_requirements: ['REQ-ST-004'],
      linked_tests: []
    },
    // ========================================================================
    // CHASSIS SYSTEM SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-CH-001',
      level: 'system',
      node_path: 'BAJA25-CH',
      owning_node_part_number: 'BAJA25-CH-100',
      title: 'Torsional Stiffness',
      description: 'Frame torsional rigidity measured at suspension pickups.',
      metric: 'Stiffness',
      target_value: '1200',
      units: 'ft-lb/deg',
      source: 'Frame stiffness analysis: 1200 ft-lb/deg exceeds combined spring rates (550 lb/in total) ensuring predictable suspension kinematics. 2024 frame measured 950 ft-lb/deg with noticeable flex.',
      test_method: 'Frame fixture test - apply torque and measure twist angle',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-CH-001'],
      linked_tests: [
        { test_id: 'TST-CH-001', name: 'Roll Cage FEA Correlation', status: 'passed', type: 'prior' }
      ]
    },
    {
      spec_id: 'SPEC-CH-002',
      level: 'system',
      node_path: 'BAJA25-CH',
      owning_node_part_number: 'BAJA25-CH-100',
      title: 'Bending Stiffness',
      description: 'Frame bending rigidity under vertical load.',
      metric: 'Stiffness',
      target_value: '850',
      units: 'lb/in',
      source: 'FEA analysis estimate; prevents excessive vertical deflection during landing loads. Target derived from 3g impact load case with 0.5" max deflection.',
      test_method: 'Three-point bend test on complete frame',
      verification_level: 'test',
      status: 'needs_quantification',
      linked_requirements: ['REQ-CH-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-CH-003',
      level: 'system',
      node_path: 'BAJA25-CH',
      owning_node_part_number: 'BAJA25-CH-120',
      title: 'Roll Cage Top Load',
      description: 'Minimum load capacity per SAE rules (350 lbf applied at specified angle).',
      metric: 'Load',
      target_value: '350',
      units: 'lbf',
      source: 'SAE Baja Rules 2025 Section B6.4 mandatory roll cage strength requirement. Failure results in disqualification. No margin added - design must demonstrate 350 lbf minimum.',
      test_method: 'Static load test per SAE Baja rules specifications',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-CH-003'],
      linked_tests: [
        { test_id: 'TST-CH-001', name: 'Roll Cage FEA Correlation', status: 'passed', type: 'prior' },
        { test_id: 'TST-CH-002', name: 'Roll Cage Destructive Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-CH-004',
      level: 'system',
      node_path: 'BAJA25-CH',
      owning_node_part_number: 'BAJA25-CH-120',
      title: 'Roll Cage Side Load',
      description: 'Minimum side impact load capacity per SAE rules.',
      metric: 'Load',
      target_value: '175',
      units: 'lbf',
      source: 'SAE Baja Rules 2025 Section B6.5 mandatory side impact protection requirement. 175 lbf at driver torso level with <1" permanent deformation.',
      test_method: 'Static load test per SAE Baja rules specifications',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-CH-004'],
      linked_tests: [
        { test_id: 'TST-CH-002', name: 'Roll Cage Destructive Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-CH-005',
      level: 'system',
      node_path: 'BAJA25-CH',
      owning_node_part_number: 'BAJA25-CH-100',
      title: 'Frame Weight',
      description: 'Weight of bare frame without components.',
      metric: 'Mass',
      target_value: '65',
      units: 'lbs',
      source: 'Weight budget allocation: 65 lbs frame + 385 lbs systems = 450 lbs vehicle target (SPEC-VEH-001). 2024 frame weighed 72 lbs; tube optimization reduces by 10%.',
      test_method: 'Weigh completed frame on calibrated scale',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-CH-005'],
      linked_tests: []
    },
    // ========================================================================
    // COMPONENT-LEVEL SPECIFICATIONS (20+ specs)
    // ========================================================================
    {
      spec_id: 'SPEC-DT-C001',
      level: 'component',
      node_path: 'BAJA25-DT-111',
      owning_node_part_number: 'BAJA25-DT-111',
      title: 'Input Shaft Diameter',
      description: 'Bearing journal diameter for input shaft.',
      metric: 'Diameter',
      target_value: '0.750',
      units: 'in',
      source: 'Standard bearing bore size; 0.750" uses common 6204-2RS bearing (20mm ID). Selected for availability and load capacity margin.',
      test_method: 'Micrometer measurement at bearing journals',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-DT-010'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-DT-C002',
      level: 'component',
      node_path: 'BAJA25-DT-111',
      owning_node_part_number: 'BAJA25-DT-111',
      title: 'Input Shaft Fatigue Life',
      description: 'Minimum fatigue life cycles at design load.',
      metric: 'Cycles',
      target_value: '100000',
      units: 'cycles',
      source: 'Endurance race estimate: 4 hours at average 2000 RPM = 480,000 revolutions. 100,000 cycles provides safety factor for stress concentrations.',
      test_method: 'Rotating bending fatigue test to runout',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-DT-011'],
      linked_tests: [
        { test_id: 'TST-DT-003', name: 'Input Shaft Fatigue Test', status: 'in_progress', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-DT-C003',
      level: 'component',
      node_path: 'BAJA25-DT-112',
      owning_node_part_number: 'BAJA25-DT-112',
      title: 'Input Bearing Dynamic Load Rating',
      description: 'Bearing C10 dynamic load capacity.',
      metric: 'Load',
      target_value: '4500',
      units: 'lbf',
      source: 'L10 bearing life calculation for 1000 hours at design load. 4500 lbf C10 rating provides L10 life of 2000+ hours at actual loads.',
      test_method: 'Manufacturer specification verification',
      verification_level: 'analysis',
      status: 'active',
      linked_requirements: ['REQ-DT-012'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-DT-C004',
      level: 'component',
      node_path: 'BAJA25-DT-121',
      owning_node_part_number: 'BAJA25-DT-121',
      title: 'Output Shaft Yield Strength',
      description: 'Minimum yield strength of output shaft material.',
      metric: 'Strength',
      target_value: '120000',
      units: 'psi',
      source: '4140 steel heat treated to 28-32 HRC provides 120 ksi yield. Selected for machinability and fatigue strength. Design stress is 60 ksi (2.0 SF).',
      test_method: 'Material certification or tensile test of sample',
      verification_level: 'analysis',
      status: 'active',
      linked_requirements: ['REQ-DT-013'],
      linked_tests: [
        { test_id: 'TST-DT-004', name: 'Output Shaft Static Load Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-DT-C005',
      level: 'component',
      node_path: 'BAJA25-DT-141',
      owning_node_part_number: 'BAJA25-DT-141',
      title: 'Gearbox Housing Wall Thickness',
      description: 'Minimum wall thickness for structural integrity.',
      metric: 'Thickness',
      target_value: '0.188',
      units: 'in',
      source: '6061-T6 aluminum housing FEA analysis: 0.188" (3/16") wall maintains <15 ksi stress under worst-case bearing loads. Lighter than 2024 design (0.25" wall).',
      test_method: 'CMM measurement or ultrasonic thickness gauge',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-DT-014'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-SU-C001',
      level: 'component',
      node_path: 'BAJA25-SU-111',
      owning_node_part_number: 'BAJA25-SU-111',
      title: 'Upper A-Arm Tube OD',
      description: 'Outer diameter of A-arm main tube.',
      metric: 'Diameter',
      target_value: '0.75',
      units: 'in',
      source: '4130 chromoly DOM tubing standard size. 0.75" OD provides buckling resistance while minimizing weight. FEA validation at 3g bump load.',
      test_method: 'Micrometer measurement',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-SU-010'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-SU-C002',
      level: 'component',
      node_path: 'BAJA25-SU-111',
      owning_node_part_number: 'BAJA25-SU-111',
      title: 'Upper A-Arm Wall Thickness',
      description: 'Wall thickness of A-arm tube.',
      metric: 'Thickness',
      target_value: '0.049',
      units: 'in',
      source: '4130 DOM tubing standard wall (18 gauge). Euler buckling analysis shows 2.5x safety factor at worst-case compression load.',
      test_method: 'Micrometer or ultrasonic measurement',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-SU-010'],
      linked_tests: [
        { test_id: 'TST-SU-002', name: 'A-Arm Weld Strength Test', status: 'passed', type: 'prior' }
      ]
    },
    {
      spec_id: 'SPEC-SU-C003',
      level: 'component',
      node_path: 'BAJA25-SU-131',
      owning_node_part_number: 'BAJA25-SU-131',
      title: 'Front Upright Ultimate Load',
      description: 'Ultimate load before failure at worst-case direction.',
      metric: 'Load',
      target_value: '4000',
      units: 'lbf',
      source: 'Suspension load case analysis: 3g lateral + 2g braking combined case = 2000 lbf at upright. 4000 lbf ultimate provides 2.0x safety factor.',
      test_method: 'Static load test to failure',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-SU-011'],
      linked_tests: [
        { test_id: 'TST-SU-003', name: 'Upright Static Load Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-SU-C004',
      level: 'component',
      node_path: 'BAJA25-SU-131',
      owning_node_part_number: 'BAJA25-SU-131',
      title: 'Front Upright Weight',
      description: 'Weight of machined upright without bearings.',
      metric: 'Mass',
      target_value: '1.8',
      units: 'lbs',
      source: 'Unsprung mass target: minimize for suspension response. 6061-T6 aluminum with topology-optimized pockets. 2024 upright weighed 2.4 lbs.',
      test_method: 'Scale measurement after machining',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-SU-012'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-SU-C005',
      level: 'component',
      node_path: 'BAJA25-SU-211',
      owning_node_part_number: 'BAJA25-SU-211',
      title: 'Trailing Arm Buckling Load',
      description: 'Critical buckling load under compression.',
      metric: 'Load',
      target_value: '5000',
      units: 'lbf',
      source: 'Rear suspension braking load case: max braking generates 2500 lbf compression in trailing arm. 5000 lbf critical load provides 2.0x margin.',
      test_method: 'FEA buckling analysis, validated with compression test',
      verification_level: 'analysis',
      status: 'active',
      linked_requirements: ['REQ-SU-013'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-BR-C001',
      level: 'component',
      node_path: 'BAJA25-BR-121',
      owning_node_part_number: 'BAJA25-BR-121',
      title: 'Brake Rotor Thickness',
      description: 'Rotor nominal thickness.',
      metric: 'Thickness',
      target_value: '0.200',
      units: 'in',
      source: 'Thermal mass calculation: 0.200" 4140 steel rotor absorbs braking energy without exceeding 450°C (SPEC-BR-003). Validated with thermal FEA.',
      test_method: 'Micrometer measurement at 4 locations, average',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-BR-010'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-BR-C002',
      level: 'component',
      node_path: 'BAJA25-BR-121',
      owning_node_part_number: 'BAJA25-BR-121',
      title: 'Brake Rotor Runout',
      description: 'Maximum allowable rotor lateral runout.',
      metric: 'Runout',
      target_value: '0.005',
      units: 'in',
      source: 'Brake caliper piston travel limit: excessive runout causes piston knockback and spongy pedal. 0.005" matches automotive OEM standards.',
      test_method: 'Dial indicator measurement when mounted on hub',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-BR-011'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-BR-C003',
      level: 'component',
      node_path: 'BAJA25-BR-321',
      owning_node_part_number: 'BAJA25-BR-321',
      title: 'Brake Pedal Stiffness',
      description: 'Pedal stiffness under load.',
      metric: 'Stiffness',
      target_value: '500',
      units: 'lbf/in',
      source: 'Driver feedback study: pedal deflection >0.15" at 80 lbf input feels "spongy". 500 lbf/in achieves 0.16" deflection at max pedal force.',
      test_method: 'Measure pedal deflection vs applied load',
      verification_level: 'test',
      status: 'active',
      linked_requirements: ['REQ-BR-012'],
      linked_tests: [
        { test_id: 'TST-BR-001', name: 'Brake Response Time Test', status: 'scheduled', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-CH-C001',
      level: 'component',
      node_path: 'BAJA25-CH-121',
      owning_node_part_number: 'BAJA25-CH-121',
      title: 'Main Hoop Tube OD',
      description: 'Outer diameter of main hoop tube (SAE minimum 1.0").',
      metric: 'Diameter',
      target_value: '1.0',
      units: 'in',
      source: 'SAE Baja Rules 2025 Section B6.2 specifies minimum 1.0" OD for primary roll structure. No margin added - design uses minimum allowed size for weight savings.',
      test_method: 'Micrometer measurement',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-CH-010'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-CH-C002',
      level: 'component',
      node_path: 'BAJA25-CH-121',
      owning_node_part_number: 'BAJA25-CH-121',
      title: 'Main Hoop Tube Wall Thickness',
      description: 'Wall thickness of main hoop tube (SAE minimum 0.083").',
      metric: 'Thickness',
      target_value: '0.095',
      units: 'in',
      source: 'SAE Baja Rules 2025 Section B6.2 minimum is 0.083". 0.095" (14 gauge) selected for weldability and provides 15% strength margin over minimum.',
      test_method: 'Ultrasonic thickness measurement',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-CH-011'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-CH-C003',
      level: 'component',
      node_path: 'BAJA25-CH-100',
      owning_node_part_number: 'BAJA25-CH-100',
      title: 'Weld Throat Size (Frame)',
      description: 'Minimum weld throat dimension for critical frame joints.',
      metric: 'Size',
      target_value: '0.083',
      units: 'in',
      source: 'AWS D1.1 structural welding code: throat = 0.707 x leg size. 0.083" throat requires 0.118" (1/8") minimum leg size. Matches wall thickness for full penetration.',
      test_method: 'Weld gauge measurement on sample joints',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-CH-012'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-CH-C004',
      level: 'component',
      node_path: 'BAJA25-CH-113',
      owning_node_part_number: 'BAJA25-CH-113',
      title: 'Bumper Mount Yield Load',
      description: 'Load at which bumper mount begins to yield.',
      metric: 'Load',
      target_value: '1500',
      units: 'lbf',
      source: 'Impact load analysis: 15 mph frontal impact with 0.5 ft crush distance = 1500 lbf average deceleration force. Mount designed to yield before frame tubes.',
      test_method: 'Static load test with load/deflection measurement',
      verification_level: 'test',
      status: 'needs_quantification',
      linked_requirements: ['REQ-CH-013'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ST-C001',
      level: 'component',
      node_path: 'BAJA25-ST-121',
      owning_node_part_number: 'BAJA25-ST-121',
      title: 'Tie Rod Tube OD',
      description: 'Outer diameter of tie rod tube.',
      metric: 'Diameter',
      target_value: '0.625',
      units: 'in',
      source: '4130 chromoly DOM tubing standard size. 0.625" OD balances buckling resistance with weight. Smaller than A-arms due to lower loads in steering linkage.',
      test_method: 'Micrometer measurement',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-ST-010'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ST-C002',
      level: 'component',
      node_path: 'BAJA25-ST-121',
      owning_node_part_number: 'BAJA25-ST-121',
      title: 'Tie Rod Buckling Load',
      description: 'Critical buckling load for tie rod in compression.',
      metric: 'Load',
      target_value: '2000',
      units: 'lbf',
      source: 'Steering load case: max tire lateral force (800 lbf) times steering lever arm ratio (2.0) = 1600 lbf. 2000 lbf provides 1.25x margin.',
      test_method: 'FEA buckling analysis',
      verification_level: 'analysis',
      status: 'active',
      linked_requirements: ['REQ-ST-011'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ER-C001',
      level: 'component',
      node_path: 'BAJA25-ER-121',
      owning_node_part_number: 'BAJA25-ER-121',
      title: 'Seat Slider Travel',
      description: 'Total seat fore/aft adjustment range.',
      metric: 'Travel',
      target_value: '4',
      units: 'in',
      source: 'Anthropometric data: 4" adjustment accommodates 5th to 95th percentile drivers per SAE J1100. Combined with pedal adjustment covers full driver range.',
      test_method: 'Measure slider travel from stop to stop',
      verification_level: 'inspection',
      status: 'active',
      linked_requirements: ['REQ-ER-001'],
      linked_tests: []
    }
  ]
};

// =============================================================================
// BAJA 2024 PROJECT (Completed - demonstrates reuse)
// =============================================================================

const createBaja2024Drivetrain = () => createFunctionalSubsystem('Drivetrain', 'BAJA24-DT', [
  createAssembly('Gearbox Assembly', 'BAJA24-DT-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 88,
    children: [
      createSubAssembly('Input Shaft Sub-Assembly', 'BAJA24-DT-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Input Shaft', 'BAJA24-DT-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Input Bearing', 'BAJA24-DT-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('Output Shaft Sub-Assembly', 'BAJA24-DT-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Output Shaft', 'BAJA24-DT-121', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Output Bearing', 'BAJA24-DT-122', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  // Reused in 2025 - Differential Assembly (same design)
  createAssembly('Differential Assembly', 'BAJA24-DT-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    reused_in: ['BAJA25-DT-200'],
    children: [
      createSubAssembly('Ring and Pinion Sub-Assembly', 'BAJA24-DT-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Ring Gear', 'BAJA24-DT-211', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Pinion Gear', 'BAJA24-DT-212', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('Carrier Sub-Assembly', 'BAJA24-DT-220', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Differential Carrier', 'BAJA24-DT-221', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Spider Gears', 'BAJA24-DT-222', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Driveshaft Assembly', 'BAJA24-DT-300', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 85,
    children: [
      createSubAssembly('Shaft Tube Sub-Assembly', 'BAJA24-DT-310', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Driveshaft Tube', 'BAJA24-DT-311', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createBaja2024Chassis = () => createFunctionalSubsystem('Chassis & Structure', 'BAJA24-CH', [
  createAssembly('Main Frame Assembly', 'BAJA24-CH-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 92,
    children: [
      createSubAssembly('Front Frame Sub-Assembly', 'BAJA24-CH-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Front Hoop', 'BAJA24-CH-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Front Bracing', 'BAJA24-CH-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('Main Hoop Sub-Assembly', 'BAJA24-CH-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Main Hoop', 'BAJA24-CH-121', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createBaja2024Suspension = () => createFunctionalSubsystem('Suspension', 'BAJA24-SU', [
  createAssembly('Front Suspension Assembly', 'BAJA24-SU-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 86,
    children: [
      createSubAssembly('Upper A-Arm Sub-Assembly', 'BAJA24-SU-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Upper A-Arm', 'BAJA24-SU-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('Front Upright Sub-Assembly', 'BAJA24-SU-130', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Front Upright', 'BAJA24-SU-131', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Rear Suspension Assembly', 'BAJA24-SU-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 84,
    children: [
      createSubAssembly('Trailing Arm Sub-Assembly', 'BAJA24-SU-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Trailing Arm', 'BAJA24-SU-211', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createBaja2024Braking = () => createFunctionalSubsystem('Braking', 'BAJA24-BR', [
  createAssembly('Front Brake Assembly', 'BAJA24-BR-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    children: [
      createSubAssembly('Caliper Sub-Assembly', 'BAJA24-BR-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Wilwood Caliper', 'BAJA24-BR-111'),
          createComponent('Caliper Bracket', 'BAJA24-BR-113', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Pedal Box Assembly', 'BAJA24-BR-300', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 88,
    children: [
      createSubAssembly('Master Cylinder Sub-Assembly', 'BAJA24-BR-310', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Master Cylinder', 'BAJA24-BR-311')
        ]
      })
    ]
  })
]);

const createBaja2024Steering = () => createFunctionalSubsystem('Steering', 'BAJA24-ST', [
  createAssembly('Steering Rack Assembly', 'BAJA24-ST-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 87,
    children: [
      createSubAssembly('Tie Rod Sub-Assembly', 'BAJA24-ST-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Tie Rod', 'BAJA24-ST-121', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createBaja2024Ergonomics = () => createFunctionalSubsystem('Ergonomics & Controls', 'BAJA24-ER', [
  createAssembly('Seat Assembly', 'BAJA24-ER-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 85,
    children: [
      createSubAssembly('Seat Structure Sub-Assembly', 'BAJA24-ER-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Racing Seat', 'BAJA24-ER-111')
        ]
      })
    ]
  })
]);

const createBaja2024Electrical = () => createFunctionalSubsystem('Electrical', 'BAJA24-EL', [
  createAssembly('Kill Switch Assembly', 'BAJA24-EL-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 92,
    children: [
      createSubAssembly('Primary Kill Sub-Assembly', 'BAJA24-EL-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Kill Switch', 'BAJA24-EL-111')
        ]
      })
    ]
  })
]);

const createBaja2024Cooling = () => createFunctionalSubsystem('Powertrain Cooling', 'BAJA24-CO', [
  createAssembly('Engine Cooling Assembly', 'BAJA24-CO-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 86,
    children: [
      createSubAssembly('Shroud Sub-Assembly', 'BAJA24-CO-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Fan Shroud', 'BAJA24-CO-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

export const BAJA_2024 = {
  id: 'proj-baja-2024',
  name: 'Baja 2024',
  description: 'BAJA SAE 2024 Competition Vehicle - Competed at Kansas, placed 15th overall',
  mode: PROJECT_MODES.NEW_DESIGN,
  status: PROJECT_STATUS.COMPLETED,
  rigor_tier: 2,
  current_phase: 7,
  // Phase status for 7-Phase Timeline Explainer - All phases complete
  phase_status_by_phase: {
    1: PHASE_STATUS.COMPLETED,
    2: PHASE_STATUS.COMPLETED,
    3: PHASE_STATUS.COMPLETED,
    4: PHASE_STATUS.COMPLETED,
    5: PHASE_STATUS.COMPLETED,
    6: PHASE_STATUS.COMPLETED,
    7: PHASE_STATUS.COMPLETED
  },
  created_at: '2023-09-01T00:00:00Z',
  completed_at: '2024-05-20T00:00:00Z',
  team: 'BAJA Racing Team',
  tags: ['competition', '2024', 'completed', 'baja'],
  // Organization and visibility - Public Demo Org (Free tier, publicly visible)
  org_id: 'org-public-demo',
  visibility: 'public',
  competition_results: { event: 'BAJA SAE Kansas 2024', overall_place: 15, design_place: 12 },
  root_node: createAssembly('Vehicle', 'BAJA24-000', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 88,
    children: [
      createBaja2024Chassis(),
      createBaja2024Suspension(),
      createBaja2024Drivetrain(),
      createBaja2024Braking(),
      createBaja2024Steering(),
      createBaja2024Ergonomics(),
      createBaja2024Electrical(),
      createBaja2024Cooling()
    ]
  }),
  manufacturing_assets: [
    createManufacturingAsset('Chassis Weld Fixture 2024', 'BAJA24-FIX-001', FIXTURE_TYPES.WELD_FIXTURE, ['BAJA24-CH-110'], {
      phase: 7, phase_status: PHASE_STATUS.COMPLETED
    })
  ]
};

// =============================================================================
// FORMULA SAE 2025 PROJECT (Electric - with Aerodynamics)
// =============================================================================

const createFSAE2025Frame = () => createFunctionalSubsystem('Frame & Chassis', 'FSAE25-FR', [
  createAssembly('Monocoque Assembly', 'FSAE25-FR-100', {
    phase: 4, ai_score: 80,
    children: [
      createSubAssembly('Front Bulkhead Sub-Assembly', 'FSAE25-FR-110', {
        phase: 5, ai_score: 85,
        children: [
          createComponent('Front Bulkhead', 'FSAE25-FR-111', { phase: 5, ai_score: 88 }),
          createComponent('Impact Attenuator Mount', 'FSAE25-FR-112', { phase: 5 }),
          createComponent('Anti-Intrusion Plate', 'FSAE25-FR-113', { phase: 5 })
        ]
      }),
      createSubAssembly('Tub Structure Sub-Assembly', 'FSAE25-FR-120', {
        phase: 4,
        children: [
          createComponent('Carbon Tub LH', 'FSAE25-FR-121', { phase: 4 }),
          createComponent('Carbon Tub RH', 'FSAE25-FR-122', { phase: 4 }),
          createComponent('Floor Panel', 'FSAE25-FR-123', { phase: 4 })
        ]
      }),
      createSubAssembly('Rear Bulkhead Sub-Assembly', 'FSAE25-FR-130', {
        phase: 4,
        children: [
          createComponent('Rear Bulkhead', 'FSAE25-FR-131', { phase: 4 }),
          createComponent('Motor Mount Interface', 'FSAE25-FR-132', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Roll Hoop Assembly', 'FSAE25-FR-200', {
    phase: 5, ai_score: 82,
    children: [
      createSubAssembly('Main Hoop Sub-Assembly', 'FSAE25-FR-210', {
        phase: 5,
        children: [
          createComponent('Main Hoop', 'FSAE25-FR-211', { phase: 6, ai_score: 90 }),
          createComponent('Main Hoop Bracing', 'FSAE25-FR-212', { phase: 5 })
        ]
      }),
      createSubAssembly('Front Hoop Sub-Assembly', 'FSAE25-FR-220', {
        phase: 5,
        children: [
          createComponent('Front Hoop', 'FSAE25-FR-221', { phase: 5 }),
          createComponent('Front Hoop Bracing', 'FSAE25-FR-222', { phase: 5 })
        ]
      })
    ]
  })
]);

const createFSAE2025Suspension = () => createFunctionalSubsystem('Suspension', 'FSAE25-SU', [
  createAssembly('Front Suspension Assembly', 'FSAE25-SU-100', {
    phase: 4, ai_score: 76,
    children: [
      createSubAssembly('Front Upright Sub-Assembly', 'FSAE25-SU-110', {
        phase: 5, ai_score: 82,
        children: [
          createComponent('Front Upright', 'FSAE25-SU-111', { phase: 5, ai_score: 85 }),
          createPurchasedPart('Wheel Bearing', 'FSAE25-SU-112'),
          createComponent('Brake Caliper Mount', 'FSAE25-SU-113', { phase: 5 })
        ]
      }),
      createSubAssembly('Upper Control Arm Sub-Assembly', 'FSAE25-SU-120', {
        phase: 4,
        children: [
          createComponent('Upper Control Arm', 'FSAE25-SU-121', { phase: 4 }),
          createPurchasedPart('Spherical Bearing', 'FSAE25-SU-122')
        ]
      }),
      createSubAssembly('Lower Control Arm Sub-Assembly', 'FSAE25-SU-130', {
        phase: 4,
        children: [
          createComponent('Lower Control Arm', 'FSAE25-SU-131', { phase: 4 }),
          createPurchasedPart('Spherical Bearing', 'FSAE25-SU-132')
        ]
      }),
      createSubAssembly('Front Rocker Sub-Assembly', 'FSAE25-SU-140', {
        phase: 4,
        children: [
          createComponent('Front Rocker', 'FSAE25-SU-141', { phase: 4 }),
          createComponent('Rocker Pivot', 'FSAE25-SU-142', { phase: 4 }),
          createPurchasedPart('Ohlins TTX25 Shock', 'FSAE25-SU-143')
        ]
      })
    ]
  }),
  createAssembly('Rear Suspension Assembly', 'FSAE25-SU-200', {
    phase: 4, ai_score: 74,
    children: [
      createSubAssembly('Rear Upright Sub-Assembly', 'FSAE25-SU-210', {
        phase: 4,
        children: [
          createComponent('Rear Upright', 'FSAE25-SU-211', { phase: 4 }),
          createPurchasedPart('Wheel Bearing', 'FSAE25-SU-212'),
          createComponent('Tripod Mount', 'FSAE25-SU-213', { phase: 4 })
        ]
      }),
      createSubAssembly('Rear Control Arms Sub-Assembly', 'FSAE25-SU-220', {
        phase: 4,
        children: [
          createComponent('Upper Control Arm', 'FSAE25-SU-221', { phase: 4 }),
          createComponent('Lower Control Arm', 'FSAE25-SU-222', { phase: 4 }),
          createComponent('Toe Link', 'FSAE25-SU-223', { phase: 4 })
        ]
      })
    ]
  })
]);

const createFSAE2025Drivetrain = () => createFunctionalSubsystem('Drivetrain', 'FSAE25-DT', [
  createAssembly('Motor Assembly', 'FSAE25-DT-100', {
    phase: 4, ai_score: 78,
    children: [
      createSubAssembly('Motor Mount Sub-Assembly', 'FSAE25-DT-110', {
        phase: 4,
        children: [
          createPurchasedPart('Emrax 228 Motor', 'FSAE25-DT-111'),
          createComponent('Motor Mount Plate', 'FSAE25-DT-112', { phase: 4 }),
          createComponent('Motor Adapter', 'FSAE25-DT-113', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Gear Reduction Assembly', 'FSAE25-DT-200', {
    phase: 3, ai_score: 68,
    children: [
      createSubAssembly('Planetary Stage Sub-Assembly', 'FSAE25-DT-210', {
        phase: 3,
        children: [
          createComponent('Sun Gear', 'FSAE25-DT-211', { phase: 3 }),
          createComponent('Planet Gears', 'FSAE25-DT-212', { phase: 3 }),
          createComponent('Ring Gear', 'FSAE25-DT-213', { phase: 3 }),
          createComponent('Planet Carrier', 'FSAE25-DT-214', { phase: 3 })
        ]
      }),
      createSubAssembly('Housing Sub-Assembly', 'FSAE25-DT-220', {
        phase: 3,
        children: [
          createComponent('Gearbox Housing', 'FSAE25-DT-221', { phase: 3 }),
          createComponent('End Cap', 'FSAE25-DT-222', { phase: 3 })
        ]
      })
    ]
  }),
  createAssembly('Half Shaft Assembly', 'FSAE25-DT-300', {
    phase: 4,
    children: [
      createSubAssembly('Half Shaft LH Sub-Assembly', 'FSAE25-DT-310', {
        children: [
          createComponent('Half Shaft LH', 'FSAE25-DT-311', { phase: 4 }),
          createPurchasedPart('Tripod Joint LH', 'FSAE25-DT-312')
        ]
      }),
      createSubAssembly('Half Shaft RH Sub-Assembly', 'FSAE25-DT-320', {
        children: [
          createComponent('Half Shaft RH', 'FSAE25-DT-321', { phase: 4 }),
          createPurchasedPart('Tripod Joint RH', 'FSAE25-DT-322')
        ]
      })
    ]
  })
]);

const createFSAE2025Braking = () => createFunctionalSubsystem('Braking', 'FSAE25-BR', [
  createAssembly('Front Brake Assembly', 'FSAE25-BR-100', {
    phase: 5, ai_score: 84,
    children: [
      createSubAssembly('Front Caliper Sub-Assembly', 'FSAE25-BR-110', {
        phase: 5,
        children: [
          createPurchasedPart('ISR Caliper', 'FSAE25-BR-111'),
          createComponent('Caliper Bracket', 'FSAE25-BR-112', { phase: 5 })
        ]
      }),
      createSubAssembly('Front Rotor Sub-Assembly', 'FSAE25-BR-120', {
        phase: 5,
        children: [
          createComponent('Front Rotor', 'FSAE25-BR-121', { phase: 5 }),
          createComponent('Rotor Hat', 'FSAE25-BR-122', { phase: 5 })
        ]
      })
    ]
  }),
  createAssembly('Rear Brake Assembly', 'FSAE25-BR-200', {
    phase: 4,
    children: [
      createSubAssembly('Rear Caliper Sub-Assembly', 'FSAE25-BR-210', {
        children: [
          createPurchasedPart('ISR Caliper', 'FSAE25-BR-211'),
          createComponent('Caliper Bracket', 'FSAE25-BR-212', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Pedal Box Assembly', 'FSAE25-BR-300', {
    phase: 4, ai_score: 76,
    children: [
      createSubAssembly('Pedal Cluster Sub-Assembly', 'FSAE25-BR-310', {
        children: [
          createComponent('Brake Pedal', 'FSAE25-BR-311', { phase: 4 }),
          createComponent('Throttle Pedal', 'FSAE25-BR-312', { phase: 4 }),
          createPurchasedPart('Pedal Position Sensor', 'FSAE25-BR-313')
        ]
      }),
      createSubAssembly('Master Cylinder Sub-Assembly', 'FSAE25-BR-320', {
        children: [
          createPurchasedPart('Tilton Master Cylinder', 'FSAE25-BR-321'),
          createComponent('Balance Bar', 'FSAE25-BR-322', { phase: 4 })
        ]
      })
    ]
  })
]);

const createFSAE2025Steering = () => createFunctionalSubsystem('Steering', 'FSAE25-ST', [
  createAssembly('Steering Rack Assembly', 'FSAE25-ST-100', {
    phase: 4, ai_score: 80,
    children: [
      createSubAssembly('Rack Sub-Assembly', 'FSAE25-ST-110', {
        children: [
          createPurchasedPart('Woodcraft Steering Rack', 'FSAE25-ST-111'),
          createComponent('Rack Mount', 'FSAE25-ST-112', { phase: 4 })
        ]
      }),
      createSubAssembly('Tie Rod Sub-Assembly', 'FSAE25-ST-120', {
        children: [
          createComponent('Tie Rod LH', 'FSAE25-ST-121', { phase: 4 }),
          createComponent('Tie Rod RH', 'FSAE25-ST-122', { phase: 4 }),
          createPurchasedPart('Rod Ends', 'FSAE25-ST-123')
        ]
      })
    ]
  }),
  createAssembly('Steering Column Assembly', 'FSAE25-ST-200', {
    phase: 3,
    children: [
      createSubAssembly('Column Sub-Assembly', 'FSAE25-ST-210', {
        children: [
          createComponent('Steering Column', 'FSAE25-ST-211', { phase: 3 }),
          createPurchasedPart('U-Joint', 'FSAE25-ST-212'),
          createPurchasedPart('Quick Release', 'FSAE25-ST-213')
        ]
      })
    ]
  })
]);

const createFSAE2025Aero = () => createFunctionalSubsystem('Aerodynamics', 'FSAE25-AE', [
  createAssembly('Front Wing Assembly', 'FSAE25-AE-100', {
    phase: 4, ai_score: 72,
    children: [
      createSubAssembly('Main Plane Sub-Assembly', 'FSAE25-AE-110', {
        phase: 4,
        children: [
          createComponent('Main Plane', 'FSAE25-AE-111', { phase: 4 }),
          createComponent('Flap 1', 'FSAE25-AE-112', { phase: 4 }),
          createComponent('Flap 2', 'FSAE25-AE-113', { phase: 4 })
        ]
      }),
      createSubAssembly('Endplate Sub-Assembly', 'FSAE25-AE-120', {
        phase: 4,
        children: [
          createComponent('Endplate LH', 'FSAE25-AE-121', { phase: 4 }),
          createComponent('Endplate RH', 'FSAE25-AE-122', { phase: 4 })
        ]
      }),
      createSubAssembly('Mount Sub-Assembly', 'FSAE25-AE-130', {
        phase: 3,
        children: [
          createComponent('Nose Mount Bracket', 'FSAE25-AE-131', { phase: 3 }),
          createComponent('Wing Adjuster', 'FSAE25-AE-132', { phase: 3 })
        ]
      })
    ]
  }),
  createAssembly('Rear Wing Assembly', 'FSAE25-AE-200', {
    phase: 4, ai_score: 70,
    children: [
      createSubAssembly('Main Element Sub-Assembly', 'FSAE25-AE-210', {
        phase: 4,
        children: [
          createComponent('Rear Main Plane', 'FSAE25-AE-211', { phase: 4 }),
          createComponent('Rear Flap 1', 'FSAE25-AE-212', { phase: 4 }),
          createComponent('Rear Flap 2', 'FSAE25-AE-213', { phase: 4 })
        ]
      }),
      createSubAssembly('Rear Endplate Sub-Assembly', 'FSAE25-AE-220', {
        phase: 4,
        children: [
          createComponent('Rear Endplate LH', 'FSAE25-AE-221', { phase: 4 }),
          createComponent('Rear Endplate RH', 'FSAE25-AE-222', { phase: 4 })
        ]
      }),
      createSubAssembly('Support Structure Sub-Assembly', 'FSAE25-AE-230', {
        phase: 4,
        children: [
          createComponent('Wing Mount Pylon', 'FSAE25-AE-231', { phase: 4 }),
          createComponent('Cross Brace', 'FSAE25-AE-232', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Undertray Assembly', 'FSAE25-AE-300', {
    phase: 3, ai_score: 65,
    children: [
      createSubAssembly('Floor Sub-Assembly', 'FSAE25-AE-310', {
        phase: 3,
        children: [
          createComponent('Undertray Floor', 'FSAE25-AE-311', { phase: 3 }),
          createComponent('Strakes', 'FSAE25-AE-312', { phase: 3 })
        ]
      }),
      createSubAssembly('Diffuser Sub-Assembly', 'FSAE25-AE-320', {
        phase: 3,
        children: [
          createComponent('Diffuser Panel', 'FSAE25-AE-321', { phase: 3 }),
          createComponent('Diffuser Strakes', 'FSAE25-AE-322', { phase: 3 })
        ]
      })
    ]
  })
]);

const createFSAE2025Electrical = () => createFunctionalSubsystem('Electrical', 'FSAE25-EL', [
  createAssembly('HV Battery Pack Assembly', 'FSAE25-EL-100', {
    phase: 4, ai_score: 74, rigor_tier: 3,
    children: [
      createSubAssembly('Accumulator Container Sub-Assembly', 'FSAE25-EL-110', {
        phase: 4, rigor_tier: 3,
        children: [
          createComponent('Accumulator Housing', 'FSAE25-EL-111', { phase: 4, rigor_tier: 3 }),
          createComponent('Cell Holders', 'FSAE25-EL-112', { phase: 4 }),
          createPurchasedPart('Battery Cells', 'FSAE25-EL-113')
        ]
      }),
      createSubAssembly('BMS Sub-Assembly', 'FSAE25-EL-120', {
        phase: 4, rigor_tier: 3,
        children: [
          createPurchasedPart('BMS Master', 'FSAE25-EL-121'),
          createPurchasedPart('Cell Boards', 'FSAE25-EL-122'),
          createComponent('BMS Wiring', 'FSAE25-EL-123', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('Inverter Assembly', 'FSAE25-EL-200', {
    phase: 4, rigor_tier: 3,
    children: [
      createSubAssembly('Inverter Mount Sub-Assembly', 'FSAE25-EL-210', {
        children: [
          createPurchasedPart('Cascadia Inverter', 'FSAE25-EL-211'),
          createComponent('Inverter Bracket', 'FSAE25-EL-212', { phase: 4 })
        ]
      })
    ]
  }),
  createAssembly('LV System Assembly', 'FSAE25-EL-300', {
    phase: 3,
    children: [
      createSubAssembly('ECU Sub-Assembly', 'FSAE25-EL-310', {
        children: [
          createPurchasedPart('PE3 ECU', 'FSAE25-EL-311'),
          createComponent('ECU Mount', 'FSAE25-EL-312', { phase: 3 })
        ]
      }),
      createSubAssembly('LV Harness Sub-Assembly', 'FSAE25-EL-320', {
        children: [
          createComponent('Main LV Harness', 'FSAE25-EL-321', { phase: 3 }),
          createComponent('Sensor Harness', 'FSAE25-EL-322', { phase: 3 })
        ]
      })
    ]
  })
]);

const createFSAE2025Cooling = () => createFunctionalSubsystem('Cooling', 'FSAE25-CO', [
  createAssembly('Motor Cooling Assembly', 'FSAE25-CO-100', {
    phase: 3, ai_score: 68,
    children: [
      createSubAssembly('Radiator Sub-Assembly', 'FSAE25-CO-110', {
        children: [
          createPurchasedPart('Radiator', 'FSAE25-CO-111'),
          createComponent('Radiator Mount', 'FSAE25-CO-112', { phase: 3 }),
          createPurchasedPart('Electric Fan', 'FSAE25-CO-113')
        ]
      }),
      createSubAssembly('Coolant Circuit Sub-Assembly', 'FSAE25-CO-120', {
        children: [
          createComponent('Coolant Lines', 'FSAE25-CO-121', { phase: 3 }),
          createPurchasedPart('Water Pump', 'FSAE25-CO-122'),
          createPurchasedPart('Expansion Tank', 'FSAE25-CO-123')
        ]
      })
    ]
  }),
  createAssembly('Inverter Cooling Assembly', 'FSAE25-CO-200', {
    phase: 3,
    children: [
      createSubAssembly('Cold Plate Sub-Assembly', 'FSAE25-CO-210', {
        children: [
          createComponent('Cold Plate', 'FSAE25-CO-211', { phase: 3 }),
          createComponent('TIM Pad', 'FSAE25-CO-212', { phase: 3 })
        ]
      })
    ]
  })
]);

export const FSAE_2025 = {
  id: 'proj-fsae-2025',
  name: 'Formula SAE 2025',
  description: 'Formula SAE 2025 Electric Competition Vehicle - Advanced aero package with in-board motors',
  mode: PROJECT_MODES.NEW_DESIGN,
  status: PROJECT_STATUS.ACTIVE,
  rigor_tier: 3,
  current_phase: 4,
  // Phase status for 7-Phase Timeline Explainer - Higher rigor tier, more careful progression
  phase_status_by_phase: {
    1: PHASE_STATUS.COMPLETED,  // Requirements complete and reviewed
    2: PHASE_STATUS.COMPLETED,  // R&D complete with documented findings
    3: PHASE_STATUS.IN_PROGRESS, // Design in progress (CAD 80%, DFM 60%, DFS 40%)
    4: PHASE_STATUS.IN_PROGRESS, // Data collection started for analysis
    5: PHASE_STATUS.NOT_STARTED, // Analysis pending data
    6: PHASE_STATUS.NOT_STARTED, // Testing not started
    7: PHASE_STATUS.NOT_STARTED  // Correlation not started
  },
  created_at: '2024-08-15T00:00:00Z',
  target_completion: '2025-05-01T00:00:00Z',
  team: 'Formula Racing Team',
  tags: ['competition', '2025', 'electric', 'fsae'],
  // Organization and visibility - Acme Industrial (Team tier, team-only visibility)
  org_id: 'org-acme-industrial',
  visibility: 'team_only',
  root_node: createAssembly('Vehicle', 'FSAE25-000', {
    phase: 4, ai_score: 74,
    children: [
      createFSAE2025Frame(),
      createFSAE2025Suspension(),
      createFSAE2025Drivetrain(),
      createFSAE2025Braking(),
      createFSAE2025Steering(),
      createFSAE2025Aero(),
      createFSAE2025Electrical(),
      createFSAE2025Cooling()
    ]
  }),
  manufacturing_assets: [
    createManufacturingAsset('Front Wing Assembly Jig', 'FSAE25-FIX-001', FIXTURE_TYPES.ASSEMBLY_FIXTURE, ['FSAE25-AE-100'], {
      phase: 4, ai_score: 75
    }),
    createManufacturingAsset('Monocoque Layup Mold', 'FSAE25-FIX-002', FIXTURE_TYPES.ASSEMBLY_FIXTURE, ['FSAE25-FR-100'], {
      phase: 5
    })
  ]
};

// =============================================================================
// FORMULA SAE 2024 PROJECT (Completed)
// =============================================================================

const createFSAE2024Frame = () => createFunctionalSubsystem('Frame & Chassis', 'FSAE24-FR', [
  createAssembly('Monocoque Assembly', 'FSAE24-FR-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 88,
    children: [
      createSubAssembly('Front Bulkhead Sub-Assembly', 'FSAE24-FR-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Front Bulkhead', 'FSAE24-FR-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createFSAE2024Suspension = () => createFunctionalSubsystem('Suspension', 'FSAE24-SU', [
  createAssembly('Front Suspension Assembly', 'FSAE24-SU-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 86,
    children: [
      createSubAssembly('Front Upright Sub-Assembly', 'FSAE24-SU-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Front Upright', 'FSAE24-SU-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createFSAE2024Drivetrain = () => createFunctionalSubsystem('Drivetrain', 'FSAE24-DT', [
  createAssembly('Motor Assembly', 'FSAE24-DT-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 84,
    children: [
      createSubAssembly('Motor Mount Sub-Assembly', 'FSAE24-DT-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Emrax 208 Motor', 'FSAE24-DT-111'),
          createComponent('Motor Mount', 'FSAE24-DT-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createFSAE2024Braking = () => createFunctionalSubsystem('Braking', 'FSAE24-BR', [
  createAssembly('Brake Assembly', 'FSAE24-BR-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    reused_in: ['FSAE25-BR-100'],
    children: [
      createSubAssembly('Caliper Sub-Assembly', 'FSAE24-BR-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('ISR Caliper', 'FSAE24-BR-111')
        ]
      })
    ]
  })
]);

const createFSAE2024Steering = () => createFunctionalSubsystem('Steering', 'FSAE24-ST', [
  createAssembly('Steering Assembly', 'FSAE24-ST-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 85,
    children: [
      createSubAssembly('Rack Sub-Assembly', 'FSAE24-ST-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Steering Rack', 'FSAE24-ST-111')
        ]
      })
    ]
  })
]);

const createFSAE2024Aero = () => createFunctionalSubsystem('Aerodynamics', 'FSAE24-AE', [
  createAssembly('Front Wing Assembly', 'FSAE24-AE-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 82,
    reused_in: ['FSAE25-AE-100'],
    children: [
      createSubAssembly('Main Plane Sub-Assembly', 'FSAE24-AE-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Main Plane', 'FSAE24-AE-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Rear Wing Assembly', 'FSAE24-AE-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 80,
    children: [
      createSubAssembly('Main Element Sub-Assembly', 'FSAE24-AE-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Rear Main Plane', 'FSAE24-AE-211', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createFSAE2024Electrical = () => createFunctionalSubsystem('Electrical', 'FSAE24-EL', [
  createAssembly('HV Battery Pack Assembly', 'FSAE24-EL-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 86, rigor_tier: 3,
    children: [
      createSubAssembly('Accumulator Sub-Assembly', 'FSAE24-EL-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Accumulator Housing', 'FSAE24-EL-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createFSAE2024Cooling = () => createFunctionalSubsystem('Cooling', 'FSAE24-CO', [
  createAssembly('Cooling Assembly', 'FSAE24-CO-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 84,
    children: [
      createSubAssembly('Radiator Sub-Assembly', 'FSAE24-CO-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Radiator', 'FSAE24-CO-111')
        ]
      })
    ]
  })
]);

export const FSAE_2024 = {
  id: 'proj-fsae-2024',
  name: 'Formula SAE 2024',
  description: 'Formula SAE 2024 Electric Competition Vehicle - Competed at Michigan',
  mode: PROJECT_MODES.NEW_DESIGN,
  status: PROJECT_STATUS.COMPLETED,
  rigor_tier: 3,
  current_phase: 7,
  // Phase status for 7-Phase Timeline Explainer - All phases complete
  phase_status_by_phase: {
    1: PHASE_STATUS.COMPLETED,
    2: PHASE_STATUS.COMPLETED,
    3: PHASE_STATUS.COMPLETED,
    4: PHASE_STATUS.COMPLETED,
    5: PHASE_STATUS.COMPLETED,
    6: PHASE_STATUS.COMPLETED,
    7: PHASE_STATUS.COMPLETED
  },
  created_at: '2023-08-15T00:00:00Z',
  completed_at: '2024-05-15T00:00:00Z',
  team: 'Formula Racing Team',
  tags: ['competition', '2024', 'electric', 'completed', 'fsae'],
  // Organization and visibility - Acme Industrial (Team tier, team-only visibility)
  org_id: 'org-acme-industrial',
  visibility: 'team_only',
  competition_results: { event: 'FSAE Michigan 2024', overall_place: 22, design_place: 18 },
  root_node: createAssembly('Vehicle', 'FSAE24-000', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 85,
    children: [
      createFSAE2024Frame(),
      createFSAE2024Suspension(),
      createFSAE2024Drivetrain(),
      createFSAE2024Braking(),
      createFSAE2024Steering(),
      createFSAE2024Aero(),
      createFSAE2024Electrical(),
      createFSAE2024Cooling()
    ]
  }),
  manufacturing_assets: [
    createManufacturingAsset('Wing Mold 2024', 'FSAE24-FIX-001', FIXTURE_TYPES.ASSEMBLY_FIXTURE, ['FSAE24-AE-100'], {
      phase: 7, phase_status: PHASE_STATUS.COMPLETED
    })
  ]
};

// =============================================================================
// ELECTRIC BUS GEN 1 PROJECT (Completed Baseline)
// =============================================================================

const createEBus1Body = () => createFunctionalSubsystem('Body & Structure', 'EBUS1-BD', [
  createAssembly('Body Shell Assembly', 'EBUS1-BD-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 92,
    children: [
      createSubAssembly('Floor Assembly Sub-Assembly', 'EBUS1-BD-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Floor Panel', 'EBUS1-BD-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Cross Members', 'EBUS1-BD-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Floor Covering', 'EBUS1-BD-113', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('Side Structure Sub-Assembly', 'EBUS1-BD-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Side Panel LH', 'EBUS1-BD-121', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Side Panel RH', 'EBUS1-BD-122', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Window Frames', 'EBUS1-BD-123', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('Roof Assembly Sub-Assembly', 'EBUS1-BD-130', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Roof Panel', 'EBUS1-BD-131', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Roof Bows', 'EBUS1-BD-132', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createEBus1Chassis = () => createFunctionalSubsystem('Chassis & Running Gear', 'EBUS1-CH', [
  createAssembly('Frame Assembly', 'EBUS1-CH-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 94,
    children: [
      createSubAssembly('Main Frame Sub-Assembly', 'EBUS1-CH-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Frame Rail LH', 'EBUS1-CH-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Frame Rail RH', 'EBUS1-CH-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Cross Members', 'EBUS1-CH-113', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('Motor Mount Sub-Assembly', 'EBUS1-CH-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Motor Mount Bracket', 'EBUS1-CH-121', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Isolator Mounts', 'EBUS1-CH-122', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Front Axle Assembly', 'EBUS1-CH-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    children: [
      createSubAssembly('Axle Beam Sub-Assembly', 'EBUS1-CH-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Front Axle Beam', 'EBUS1-CH-211'),
          createComponent('Steering Knuckle LH', 'EBUS1-CH-212', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Steering Knuckle RH', 'EBUS1-CH-213', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Rear Axle Assembly', 'EBUS1-CH-300', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 91,
    children: [
      createSubAssembly('Drive Axle Sub-Assembly', 'EBUS1-CH-310', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Rear Axle Housing', 'EBUS1-CH-311'),
          createComponent('Axle Shafts', 'EBUS1-CH-312', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Suspension Assembly', 'EBUS1-CH-400', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 89,
    children: [
      createSubAssembly('Air Spring Sub-Assembly', 'EBUS1-CH-410', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Air Springs', 'EBUS1-CH-411'),
          createPurchasedPart('Shock Absorbers', 'EBUS1-CH-412'),
          createComponent('Suspension Links', 'EBUS1-CH-413', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createEBus1Propulsion = () => createFunctionalSubsystem('Propulsion', 'EBUS1-PR', [
  createAssembly('Traction Motor Assembly', 'EBUS1-PR-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    children: [
      createSubAssembly('Motor Unit Sub-Assembly', 'EBUS1-PR-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Traction Motor', 'EBUS1-PR-111'),
          createComponent('Motor Adapter Plate', 'EBUS1-PR-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Cooling Jacket', 'EBUS1-PR-113', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Gear Reduction Assembly', 'EBUS1-PR-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 88,
    children: [
      createSubAssembly('Gearbox Sub-Assembly', 'EBUS1-PR-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Reduction Gearbox', 'EBUS1-PR-211'),
          createComponent('Input Coupling', 'EBUS1-PR-212', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createEBus1Braking = () => createFunctionalSubsystem('Braking', 'EBUS1-BR', [
  createAssembly('Service Brake Assembly', 'EBUS1-BR-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 93,
    children: [
      createSubAssembly('Front Brake Sub-Assembly', 'EBUS1-BR-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Air Disc Brake', 'EBUS1-BR-111'),
          createComponent('Brake Rotor', 'EBUS1-BR-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('Rear Brake Sub-Assembly', 'EBUS1-BR-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Air Disc Brake', 'EBUS1-BR-121'),
          createComponent('Brake Rotor', 'EBUS1-BR-122', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Parking Brake Assembly', 'EBUS1-BR-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 91,
    children: [
      createSubAssembly('Park Brake Sub-Assembly', 'EBUS1-BR-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Spring Brake Chamber', 'EBUS1-BR-211')
        ]
      })
    ]
  })
]);

const createEBus1Steering = () => createFunctionalSubsystem('Steering', 'EBUS1-ST', [
  createAssembly('Steering Gear Assembly', 'EBUS1-ST-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    children: [
      createSubAssembly('Power Steering Sub-Assembly', 'EBUS1-ST-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Power Steering Gear', 'EBUS1-ST-111'),
          createPurchasedPart('Hydraulic Pump', 'EBUS1-ST-112'),
          createComponent('Steering Column', 'EBUS1-ST-113', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createEBus1Electrical = () => createFunctionalSubsystem('Electrical Power', 'EBUS1-EL', [
  createAssembly('HV Battery System Assembly', 'EBUS1-EL-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 91, rigor_tier: 3,
    children: [
      createSubAssembly('Battery Pack Sub-Assembly', 'EBUS1-EL-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, rigor_tier: 3,
        children: [
          createComponent('Battery Enclosure', 'EBUS1-EL-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createPurchasedPart('Battery Modules', 'EBUS1-EL-112'),
          createComponent('Bus Bars', 'EBUS1-EL-113', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('BMS Sub-Assembly', 'EBUS1-EL-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('BMS Controller', 'EBUS1-EL-121'),
          createComponent('Cell Monitoring Boards', 'EBUS1-EL-122', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Inverter Assembly', 'EBUS1-EL-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 88, rigor_tier: 3,
    children: [
      createSubAssembly('Inverter Unit Sub-Assembly', 'EBUS1-EL-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Traction Inverter', 'EBUS1-EL-211'),
          createComponent('Inverter Mount', 'EBUS1-EL-212', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('HV Cables', 'EBUS1-EL-213', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('DC-DC Assembly', 'EBUS1-EL-300', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    children: [
      createSubAssembly('DC-DC Converter Sub-Assembly', 'EBUS1-EL-310', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('DC-DC Converter', 'EBUS1-EL-311'),
          createComponent('Converter Bracket', 'EBUS1-EL-312', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createEBus1Thermal = () => createFunctionalSubsystem('Thermal Management', 'EBUS1-TM', [
  createAssembly('Inverter Cooling Loop Assembly', 'EBUS1-TM-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 88,
    children: [
      createSubAssembly('Cold Plate Sub-Assembly', 'EBUS1-TM-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Cold Plate', 'EBUS1-TM-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('TIM Pad', 'EBUS1-TM-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Mounting Hardware', 'EBUS1-TM-113', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('Hose & Fittings Sub-Assembly', 'EBUS1-TM-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Coolant Hose', 'EBUS1-TM-121', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createPurchasedPart('Quick Connect Fitting', 'EBUS1-TM-122'),
          createComponent('Clamp', 'EBUS1-TM-123', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Battery Cooling Loop Assembly', 'EBUS1-TM-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 86,
    children: [
      createSubAssembly('Chiller Interface Sub-Assembly', 'EBUS1-TM-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Chiller Manifold', 'EBUS1-TM-211', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createPurchasedPart('Temperature Sensor', 'EBUS1-TM-212'),
          createPurchasedPart('Pressure Sensor', 'EBUS1-TM-213')
        ]
      }),
      createSubAssembly('Distribution Manifold Sub-Assembly', 'EBUS1-TM-220', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Manifold Block', 'EBUS1-TM-221', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Flow Balancing Valve', 'EBUS1-TM-222', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Chiller Assembly', 'EBUS1-TM-300', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 89,
    children: [
      createSubAssembly('Chiller Unit Sub-Assembly', 'EBUS1-TM-310', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Refrigerant Chiller', 'EBUS1-TM-311'),
          createComponent('Chiller Mount', 'EBUS1-TM-312', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createEBus1Doors = () => createFunctionalSubsystem('Doors & Accessibility', 'EBUS1-DR', [
  createAssembly('Front Door Assembly', 'EBUS1-DR-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 92,
    children: [
      createSubAssembly('Door Mechanism Sub-Assembly', 'EBUS1-DR-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Door Panel', 'EBUS1-DR-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createPurchasedPart('Door Actuator', 'EBUS1-DR-112'),
          createComponent('Door Track', 'EBUS1-DR-113', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createPurchasedPart('Door Controller', 'EBUS1-DR-114')
        ]
      }),
      createSubAssembly('Door Seal Sub-Assembly', 'EBUS1-DR-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Weather Seal', 'EBUS1-DR-121')
        ]
      })
    ]
  }),
  createAssembly('Rear Door Assembly', 'EBUS1-DR-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    children: [
      createSubAssembly('Door Mechanism Sub-Assembly', 'EBUS1-DR-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Door Panel', 'EBUS1-DR-211', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createPurchasedPart('Door Actuator', 'EBUS1-DR-212')
        ]
      })
    ]
  })
]);

const createEBus1Interior = () => createFunctionalSubsystem('Interior & Controls', 'EBUS1-IN', [
  createAssembly('Driver Station Assembly', 'EBUS1-IN-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 88,
    children: [
      createSubAssembly('Instrument Cluster Sub-Assembly', 'EBUS1-IN-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Display Unit', 'EBUS1-IN-111'),
          createComponent('Cluster Housing', 'EBUS1-IN-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      }),
      createSubAssembly('Control Panel Sub-Assembly', 'EBUS1-IN-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createComponent('Switch Panel', 'EBUS1-IN-121', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createPurchasedPart('Control Switches', 'EBUS1-IN-122')
        ]
      })
    ]
  }),
  createAssembly('Seating Assembly', 'EBUS1-IN-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    children: [
      createSubAssembly('Passenger Seat Sub-Assembly', 'EBUS1-IN-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED,
        children: [
          createPurchasedPart('Passenger Seats', 'EBUS1-IN-211'),
          createComponent('Seat Mounting', 'EBUS1-IN-212', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

export const EBUS_GEN1 = {
  id: 'proj-ebus-gen1',
  name: 'Electric Bus Gen 1',
  description: 'Electric Transit Bus Generation 1 - First production electric bus platform for urban transit',
  mode: PROJECT_MODES.NEW_DESIGN,
  status: PROJECT_STATUS.COMPLETED,
  rigor_tier: 3,
  current_phase: 7,
  // Phase status for 7-Phase Timeline Explainer - All phases complete, production baseline
  phase_status_by_phase: {
    1: PHASE_STATUS.COMPLETED,
    2: PHASE_STATUS.COMPLETED,
    3: PHASE_STATUS.COMPLETED,
    4: PHASE_STATUS.COMPLETED,
    5: PHASE_STATUS.COMPLETED,
    6: PHASE_STATUS.COMPLETED,
    7: PHASE_STATUS.COMPLETED
  },
  created_at: '2022-01-15T00:00:00Z',
  completed_at: '2023-06-30T00:00:00Z',
  team: 'Commercial Vehicle Engineering',
  tags: ['commercial', 'electric', 'transit', 'production', 'baseline'],
  // Organization and visibility - MegaCorp Engineering (Enterprise tier, private)
  org_id: 'org-megacorp-enterprise',
  visibility: 'private',
  production_info: { units_produced: 45, in_service: 42 },
  baseline: { id: 'baseline-ebus-gen1-prod', type: 'as_built', version: '1.2.0', frozen_at: '2023-06-30T00:00:00Z' },
  root_node: createAssembly('Bus', 'EBUS1-000', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    children: [
      createEBus1Body(),
      createEBus1Chassis(),
      createEBus1Propulsion(),
      createEBus1Braking(),
      createEBus1Steering(),
      createEBus1Electrical(),
      createEBus1Thermal(),
      createEBus1Doors(),
      createEBus1Interior()
    ]
  }),
  manufacturing_assets: [
    createManufacturingAsset('Door Alignment Fixture', 'EBUS1-FIX-001', FIXTURE_TYPES.ASSEMBLY_FIXTURE, ['EBUS1-DR-110'], {
      phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 92
    }),
    createManufacturingAsset('Frame Weld Cell', 'EBUS1-FIX-002', FIXTURE_TYPES.WELD_FIXTURE, ['EBUS1-CH-110'], {
      phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 94
    })
  ]
};

// =============================================================================
// ELECTRIC BUS GEN 2 PROJECT (Platform Modification)
// =============================================================================

const createEBus2Body = () => createFunctionalSubsystem('Body & Structure', 'EBUS2-BD', [
  createAssembly('Body Shell Assembly', 'EBUS2-BD-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 92,
    evidence_reuse: 'direct', baseline_node: 'EBUS1-BD-100',
    children: [
      createSubAssembly('Floor Assembly Sub-Assembly', 'EBUS2-BD-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createComponent('Floor Panel', 'EBUS2-BD-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Cross Members', 'EBUS2-BD-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createEBus2Chassis = () => createFunctionalSubsystem('Chassis & Running Gear', 'EBUS2-CH', [
  createAssembly('Frame Assembly', 'EBUS2-CH-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 94,
    evidence_reuse: 'direct', baseline_node: 'EBUS1-CH-100',
    children: [
      createSubAssembly('Main Frame Sub-Assembly', 'EBUS2-CH-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createComponent('Frame Rail LH', 'EBUS2-CH-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createComponent('Frame Rail RH', 'EBUS2-CH-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  }),
  createAssembly('Suspension Assembly', 'EBUS2-CH-400', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 89,
    evidence_reuse: 'direct', baseline_node: 'EBUS1-CH-400',
    children: [
      createSubAssembly('Air Spring Sub-Assembly', 'EBUS2-CH-410', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createPurchasedPart('Air Springs', 'EBUS2-CH-411')
        ]
      })
    ]
  })
]);

const createEBus2Propulsion = () => createFunctionalSubsystem('Propulsion', 'EBUS2-PR', [
  createAssembly('Traction Motor Assembly', 'EBUS2-PR-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    evidence_reuse: 'direct', baseline_node: 'EBUS1-PR-100',
    children: [
      createSubAssembly('Motor Unit Sub-Assembly', 'EBUS2-PR-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createPurchasedPart('Traction Motor', 'EBUS2-PR-111')
        ]
      })
    ]
  })
]);

const createEBus2Braking = () => createFunctionalSubsystem('Braking', 'EBUS2-BR', [
  createAssembly('Service Brake Assembly', 'EBUS2-BR-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 93,
    evidence_reuse: 'direct', baseline_node: 'EBUS1-BR-100',
    children: [
      createSubAssembly('Front Brake Sub-Assembly', 'EBUS2-BR-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createPurchasedPart('Air Disc Brake', 'EBUS2-BR-111')
        ]
      })
    ]
  })
]);

const createEBus2Steering = () => createFunctionalSubsystem('Steering', 'EBUS2-ST', [
  createAssembly('Steering Gear Assembly', 'EBUS2-ST-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    evidence_reuse: 'direct', baseline_node: 'EBUS1-ST-100',
    children: [
      createSubAssembly('Power Steering Sub-Assembly', 'EBUS2-ST-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createPurchasedPart('Power Steering Gear', 'EBUS2-ST-111')
        ]
      })
    ]
  })
]);

// MODIFIED: Electrical Power - Inverter revision changed
const createEBus2Electrical = () => createFunctionalSubsystem('Electrical Power', 'EBUS2-EL', [
  createAssembly('HV Battery System Assembly', 'EBUS2-EL-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 91, rigor_tier: 3,
    evidence_reuse: 'direct', baseline_node: 'EBUS1-EL-100',
    children: [
      createSubAssembly('Battery Pack Sub-Assembly', 'EBUS2-EL-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createComponent('Battery Enclosure', 'EBUS2-EL-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createPurchasedPart('Battery Modules', 'EBUS2-EL-112')
        ]
      })
    ]
  }),
  // CHANGED: Inverter Assembly - Rev B with improved comms
  createAssembly('Inverter Assembly', 'EBUS2-EL-200', {
    phase: 5, phase_status: PHASE_STATUS.IN_PROGRESS, ai_score: 78, rigor_tier: 3,
    revision: 'B', change_type: 'function',
    change_description: 'Upgraded inverter with improved CAN communications and thermal monitoring',
    baseline_node: 'EBUS1-EL-200', baseline_revision: 'A',
    children: [
      createSubAssembly('Inverter Unit Sub-Assembly', 'EBUS2-EL-210', {
        phase: 5, phase_status: PHASE_STATUS.IN_PROGRESS, revision: 'B',
        children: [
          createPurchasedPart('Traction Inverter Gen2', 'EBUS2-EL-211'),
          createComponent('Inverter Mount', 'EBUS2-EL-212', { phase: 5, revision: 'B' }),
          createComponent('HV Cables', 'EBUS2-EL-213', { phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct' }),
          createComponent('Comms Interface Board', 'EBUS2-EL-214', { phase: 4, revision: 'A' })
        ]
      })
    ]
  }),
  // CHANGED: DC-DC Assembly - Updated model
  createAssembly('DC-DC Assembly', 'EBUS2-EL-300', {
    phase: 4, phase_status: PHASE_STATUS.IN_PROGRESS, ai_score: 72,
    revision: 'B', change_type: 'supplier',
    change_description: 'New DC-DC converter supplier with higher efficiency',
    baseline_node: 'EBUS1-EL-300', baseline_revision: 'A',
    children: [
      createSubAssembly('DC-DC Converter Sub-Assembly', 'EBUS2-EL-310', {
        phase: 4, phase_status: PHASE_STATUS.IN_PROGRESS, revision: 'B',
        children: [
          createPurchasedPart('DC-DC Converter v2', 'EBUS2-EL-311'),
          createComponent('Converter Bracket', 'EBUS2-EL-312', { phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct' })
        ]
      })
    ]
  })
]);

const createEBus2Thermal = () => createFunctionalSubsystem('Thermal Management', 'EBUS2-TM', [
  // CHANGED: Inverter Cooling Loop - revised for new inverter
  createAssembly('Inverter Cooling Loop Assembly', 'EBUS2-TM-100', {
    phase: 4, phase_status: PHASE_STATUS.IN_PROGRESS, ai_score: 70,
    revision: 'B', change_type: 'function',
    change_description: 'Revised cooling loop for Gen2 inverter thermal requirements',
    baseline_node: 'EBUS1-TM-100', baseline_revision: 'A',
    children: [
      createSubAssembly('Cold Plate Sub-Assembly', 'EBUS2-TM-110', {
        phase: 4, phase_status: PHASE_STATUS.IN_PROGRESS, revision: 'B',
        children: [
          createComponent('Cold Plate v2', 'EBUS2-TM-111', { phase: 4, revision: 'B' }),
          createComponent('TIM Pad', 'EBUS2-TM-112', { phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct' }),
          createComponent('Mounting Hardware', 'EBUS2-TM-113', { phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct' })
        ]
      }),
      createSubAssembly('Hose & Fittings Sub-Assembly', 'EBUS2-TM-120', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createComponent('Coolant Hose', 'EBUS2-TM-121', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createPurchasedPart('Quick Connect Fitting', 'EBUS2-TM-122')
        ]
      })
    ]
  }),
  createAssembly('Battery Cooling Loop Assembly', 'EBUS2-TM-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 86,
    evidence_reuse: 'direct', baseline_node: 'EBUS1-TM-200',
    children: [
      createSubAssembly('Chiller Interface Sub-Assembly', 'EBUS2-TM-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createComponent('Chiller Manifold', 'EBUS2-TM-211', { phase: 7, phase_status: PHASE_STATUS.COMPLETED }),
          createPurchasedPart('Temperature Sensor', 'EBUS2-TM-212')
        ]
      })
    ]
  })
]);

// MODIFIED: Door Assembly - revised mechanism
const createEBus2Doors = () => createFunctionalSubsystem('Doors & Accessibility', 'EBUS2-DR', [
  createAssembly('Front Door Assembly', 'EBUS2-DR-100', {
    phase: 5, phase_status: PHASE_STATUS.IN_PROGRESS, ai_score: 80,
    revision: 'B', change_type: 'function',
    change_description: 'Improved door mechanism with faster open/close cycle',
    baseline_node: 'EBUS1-DR-100', baseline_revision: 'A',
    children: [
      createSubAssembly('Door Mechanism Sub-Assembly', 'EBUS2-DR-110', {
        phase: 5, phase_status: PHASE_STATUS.IN_PROGRESS, revision: 'B',
        regression_check: true,
        children: [
          createComponent('Door Panel', 'EBUS2-DR-111', { phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct' }),
          createPurchasedPart('Door Actuator v2', 'EBUS2-DR-112'),
          createComponent('Door Track v2', 'EBUS2-DR-113', { phase: 5, revision: 'B' }),
          createPurchasedPart('Door Controller v2', 'EBUS2-DR-114')
        ]
      })
    ]
  }),
  createAssembly('Rear Door Assembly', 'EBUS2-DR-200', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 90,
    evidence_reuse: 'direct', baseline_node: 'EBUS1-DR-200',
    children: [
      createSubAssembly('Door Mechanism Sub-Assembly', 'EBUS2-DR-210', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createComponent('Door Panel', 'EBUS2-DR-211', { phase: 7, phase_status: PHASE_STATUS.COMPLETED })
        ]
      })
    ]
  })
]);

const createEBus2Interior = () => createFunctionalSubsystem('Interior & Controls', 'EBUS2-IN', [
  createAssembly('Driver Station Assembly', 'EBUS2-IN-100', {
    phase: 7, phase_status: PHASE_STATUS.COMPLETED, ai_score: 88,
    evidence_reuse: 'direct', baseline_node: 'EBUS1-IN-100',
    children: [
      createSubAssembly('Instrument Cluster Sub-Assembly', 'EBUS2-IN-110', {
        phase: 7, phase_status: PHASE_STATUS.COMPLETED, evidence_reuse: 'direct',
        children: [
          createPurchasedPart('Display Unit', 'EBUS2-IN-111')
        ]
      })
    ]
  })
]);

export const EBUS_GEN2 = {
  id: 'proj-ebus-gen2',
  name: 'Electric Bus Gen 2',
  description: 'Electric Transit Bus Generation 2 - Platform modification with improved inverter, thermal management, and door systems',
  mode: PROJECT_MODES.PLATFORM_MOD,
  status: PROJECT_STATUS.ACTIVE,
  rigor_tier: 3,
  current_phase: 4,
  // Phase status for 7-Phase Timeline Explainer - Platform mod with inherited baseline
  phase_status_by_phase: {
    1: PHASE_STATUS.COMPLETED,  // Delta requirements from Gen1 baseline
    2: PHASE_STATUS.COMPLETED,  // R&D for modified systems only
    3: PHASE_STATUS.IN_PROGRESS, // Design changes in progress
    4: PHASE_STATUS.IN_PROGRESS, // Data collection for changed systems
    5: PHASE_STATUS.NOT_STARTED, // Analysis of changes pending
    6: PHASE_STATUS.NOT_STARTED, // Delta validation pending
    7: PHASE_STATUS.NOT_STARTED  // Correlation of changes pending
  },
  created_at: '2024-03-01T00:00:00Z',
  target_completion: '2025-09-30T00:00:00Z',
  team: 'Commercial Vehicle Engineering',
  tags: ['commercial', 'electric', 'transit', 'platform-mod', 'gen2'],
  // Organization and visibility - MegaCorp Engineering (Enterprise tier, private)
  org_id: 'org-megacorp-enterprise',
  visibility: 'private',
  baseline_reference: {
    project_id: 'proj-ebus-gen1',
    baseline_id: 'baseline-ebus-gen1-prod',
    baseline_version: '1.2.0'
  },
  change_package: {
    id: 'cp-ebus-gen2-001',
    name: 'Gen 2 Platform Upgrade Package',
    status: 'in_review',
    summary: 'Upgraded inverter with improved comms, revised thermal loop, improved door mechanism',
    items: [
      {
        id: 'ci-001',
        node_id: 'EBUS2-EL-200',
        change_type: 'function',
        description: 'Inverter Assembly - Gen2 with improved CAN communications',
        from_revision: 'A',
        to_revision: 'B'
      },
      {
        id: 'ci-002',
        node_id: 'EBUS2-EL-300',
        change_type: 'supplier',
        description: 'DC-DC Assembly - New supplier with higher efficiency',
        from_revision: 'A',
        to_revision: 'B'
      },
      {
        id: 'ci-003',
        node_id: 'EBUS2-TM-100',
        change_type: 'function',
        description: 'Inverter Cooling Loop - Revised for Gen2 inverter thermal requirements',
        from_revision: 'A',
        to_revision: 'B'
      },
      {
        id: 'ci-004',
        node_id: 'EBUS2-DR-100',
        change_type: 'function',
        description: 'Front Door Assembly - Improved mechanism with faster cycle',
        from_revision: 'A',
        to_revision: 'B'
      }
    ],
    regression_requirements: [
      {
        id: 'rr-001',
        trigger: 'Inverter interface change',
        requirement: 'Verify CAN communications with all vehicle systems',
        test_type: 'comms_regression',
        linked_nodes: ['EBUS2-EL-200', 'EBUS2-EL-100']
      },
      {
        id: 'rr-002',
        trigger: 'Door mechanism change',
        requirement: 'Verify door fit and clearance to body structure',
        test_type: 'fit_check',
        linked_nodes: ['EBUS2-DR-110', 'EBUS2-BD-100']
      },
      {
        id: 'rr-003',
        trigger: 'Thermal loop change',
        requirement: 'Verify cooling performance under max load',
        test_type: 'thermal_validation',
        linked_nodes: ['EBUS2-TM-100', 'EBUS2-EL-200']
      }
    ]
  },
  evidence_reuse: [
    { node_id: 'EBUS2-BD-100', reuse_class: 'direct', source: 'EBUS1-BD-100' },
    { node_id: 'EBUS2-CH-100', reuse_class: 'direct', source: 'EBUS1-CH-100' },
    { node_id: 'EBUS2-PR-100', reuse_class: 'direct', source: 'EBUS1-PR-100' },
    { node_id: 'EBUS2-BR-100', reuse_class: 'direct', source: 'EBUS1-BR-100' },
    { node_id: 'EBUS2-ST-100', reuse_class: 'direct', source: 'EBUS1-ST-100' },
    { node_id: 'EBUS2-EL-100', reuse_class: 'direct', source: 'EBUS1-EL-100' },
    { node_id: 'EBUS2-TM-200', reuse_class: 'direct', source: 'EBUS1-TM-200' },
    { node_id: 'EBUS2-DR-200', reuse_class: 'direct', source: 'EBUS1-DR-200' },
    { node_id: 'EBUS2-IN-100', reuse_class: 'direct', source: 'EBUS1-IN-100' }
  ],
  root_node: createAssembly('Bus', 'EBUS2-000', {
    phase: 4, ai_score: 82,
    children: [
      createEBus2Body(),
      createEBus2Chassis(),
      createEBus2Propulsion(),
      createEBus2Braking(),
      createEBus2Steering(),
      createEBus2Electrical(),
      createEBus2Thermal(),
      createEBus2Doors(),
      createEBus2Interior()
    ]
  }),
  manufacturing_assets: [
    createManufacturingAsset('Door Alignment Fixture v2', 'EBUS2-FIX-001', FIXTURE_TYPES.ASSEMBLY_FIXTURE, ['EBUS2-DR-110'], {
      phase: 4, ai_score: 75,
      revision: 'B', change_type: 'form',
      change_description: 'Modified fixture for revised door track geometry',
      baseline_fixture: 'EBUS1-FIX-001'
    }),
    createManufacturingAsset('Frame Weld Cell', 'EBUS2-FIX-002', FIXTURE_TYPES.WELD_FIXTURE, ['EBUS2-CH-110'], {
      phase: 7, phase_status: PHASE_STATUS.COMPLETED,
      evidence_reuse: 'direct', baseline_fixture: 'EBUS1-FIX-002'
    })
  ]
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const countNodes = (node, filter = () => true) => {
  if (!node) return 0;
  let count = filter(node) ? 1 : 0;
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      count += countNodes(child, filter);
    }
  }
  return count;
};

export const flattenTree = (node, result = []) => {
  if (!node) return result;
  result.push(node);
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      flattenTree(child, result);
    }
  }
  return result;
};

export const calculateProjectStats = (project) => {
  if (!project || !project.root_node) {
    return { totalNodes: 0, productNodes: 0, manufacturingAssets: 0, completedPhases: 0, inProgressPhases: 0, avgAiScore: 0 };
  }
  
  const allNodes = flattenTree(project.root_node);
  const manufacturingNodes = project.manufacturing_assets?.flatMap(f => flattenTree(f)) || [];
  const productNodes = allNodes.filter(n => n.node_class === NODE_CLASSES.PRODUCT || n.node_class === NODE_CLASSES.FUNCTIONAL_GROUP);
  const nodesWithScores = allNodes.filter(n => n.ai_score != null && n.ai_score > 0);

  return {
    totalNodes: allNodes.length,
    productNodes: productNodes.length,
    manufacturingAssets: manufacturingNodes.length,
    completedPhases: allNodes.filter(n => n.phase_status === PHASE_STATUS.COMPLETED).length,
    inProgressPhases: allNodes.filter(n => n.phase_status === PHASE_STATUS.IN_PROGRESS).length,
    avgAiScore: nodesWithScores.length > 0 
      ? Math.round(nodesWithScores.reduce((sum, n) => sum + n.ai_score, 0) / nodesWithScores.length)
      : 0,
    evidenceReuse: project.evidence_reuse?.length || 0,
    changeItems: project.change_package?.items?.length || 0,
    regressionRequirements: project.change_package?.regression_requirements?.length || 0
  };
};

// =============================================================================
// SOP DEMO DATA
// =============================================================================

export const SOP_STATUS = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  OBSOLETE: 'obsolete'
};

export const SOP_TYPES = {
  MANUFACTURING: 'manufacturing',
  ASSEMBLY: 'assembly',
  TEST_EXECUTION: 'test_execution',
  SERVICE: 'service',
  INSPECTION: 'inspection',
  REWORK: 'rework'
};

export const SOP_SCOPE_TYPES = {
  GLOBAL: 'global',
  ORG: 'org',
  PROJECT: 'project',
  NODE: 'node',
  ASSET_INSTANCE: 'asset_instance'
};

export const REQUEST_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  CANCELED: 'canceled'
};

// Helper to create SOP definitions
const createSOP = (id, number, title, type, scopeType, options = {}) => ({
  id,
  sop_number: number,
  title,
  sop_type: type,
  scope_type: scopeType,
  project_id: options.project_id || null,
  node_id: options.node_id || null,
  asset_instance_id: options.asset_instance_id || null,
  purpose: options.purpose || '',
  version: options.version || 1,
  status: options.status || SOP_STATUS.APPROVED,
  approved_by: options.approved_by || 'user-admin-001',
  approved_at: options.approved_at || '2025-01-15T10:00:00Z',
  review_interval_days: options.review_interval_days || null,
  tags: options.tags || [],
  steps: options.steps || [],
  created_at: options.created_at || '2025-01-01T00:00:00Z'
});

// Helper to create SOP steps
const createSOPStep = (stepNumber, title, instructions, options = {}) => ({
  id: generateId('sop-step'),
  step_number: stepNumber,
  title,
  instructions_richtext: instructions,
  required: options.required !== false,
  requires_photo: options.requires_photo || false,
  requires_measurement: options.requires_measurement || false,
  measurement_unit: options.measurement_unit || null,
  measurement_min: options.measurement_min || null,
  measurement_max: options.measurement_max || null,
  expected_duration_minutes: options.expected_duration_minutes || null,
  assets: options.assets || []
});

// Helper to create SOP schedules
const createSOPSchedule = (id, sopId, scopeType, options = {}) => ({
  id,
  sop_id: sopId,
  scope_type: scopeType,
  node_id: options.node_id || null,
  asset_instance_id: options.asset_instance_id || null,
  cadence_type: options.cadence_type || 'interval_days',
  interval_days: options.interval_days || null,
  cron_expression: options.cron_expression || null,
  lead_time_days: options.lead_time_days || 7,
  assignment_mode: options.assignment_mode || 'unassigned',
  assigned_to_user_id: options.assigned_to_user_id || null,
  assigned_to_role: options.assigned_to_role || null,
  escalation_days: options.escalation_days || [0, 3, 7],
  is_active: options.is_active !== false,
  next_due_at: options.next_due_at || null
});

// Helper to create SOP requests
const createSOPRequest = (id, sopId, options = {}) => ({
  id,
  sop_schedule_id: options.sop_schedule_id || null,
  sop_id: sopId,
  sop_title: options.sop_title || '',
  scope_type_snapshot: options.scope_type || 'global',
  project_id_snapshot: options.project_id || null,
  node_id_snapshot: options.node_id || null,
  asset_instance_id_snapshot: options.asset_instance_id || null,
  requested_for_due_at: options.due_at,
  requested_at: options.requested_at || '2025-01-01T00:00:00Z',
  request_source: options.request_source || 'scheduled',
  assigned_to_user_id: options.assigned_to_user_id || null,
  assigned_to_role: options.assigned_to_role || null,
  status: options.status || REQUEST_STATUS.OPEN,
  related_execution_id: options.related_execution_id || null
});

// =============================================================================
// DEMO SOPs FOR BAJA 2025
// =============================================================================

export const DEMO_SOPS_BAJA_2025 = [
  createSOP('sop-baja-001', 'SOP-BAJA-001', 'CVT Belt Inspection Procedure', SOP_TYPES.INSPECTION, SOP_SCOPE_TYPES.NODE, {
    project_id: 'proj-baja-2025',
    node_id: 'node-baja-cvt',
    purpose: 'Inspect CVT belt for wear, cracking, and proper tension to ensure reliable power transmission.',
    tags: ['maintenance', 'drivetrain', 'cvt'],
    review_interval_days: 180,
    steps: [
      createSOPStep(1, 'Safety Lockout', 'Ensure vehicle is off and key removed. Engage parking brake. Place wheel chocks.', { required: true }),
      createSOPStep(2, 'Remove CVT Cover', 'Remove the 4x M6 bolts securing the CVT cover. Set aside with hardware.', { expected_duration_minutes: 5, assets: [{ asset_type: 'image', storage_key_or_url: '/demo/sop-images/cvt-cover-removal.jpg', caption: 'CVT cover bolt locations' }] }),
      createSOPStep(3, 'Visual Belt Inspection', 'Inspect belt surface for cracks, glazing, fraying, or chunking. Document any defects.', { requires_photo: true, expected_duration_minutes: 3 }),
      createSOPStep(4, 'Measure Belt Width', 'Using calipers, measure belt width at 3 locations. Min acceptable: 28.5mm.', { requires_measurement: true, measurement_unit: 'mm', measurement_min: 28.5, measurement_max: 32.0, expected_duration_minutes: 5 }),
      createSOPStep(5, 'Check Sheave Alignment', 'Using straight edge, verify primary and secondary sheaves are aligned within 1mm.', { requires_photo: true, expected_duration_minutes: 5, assets: [{ asset_type: 'image', storage_key_or_url: '/demo/sop-images/sheave-alignment.jpg', caption: 'Proper sheave alignment check' }] }),
      createSOPStep(6, 'Verify Spring Tension', 'Check that CVT spring returns sheave fully when released.', { required: true }),
      createSOPStep(7, 'Check for Debris', 'Remove any debris, dirt, or foreign material from CVT housing.', { expected_duration_minutes: 3 }),
      createSOPStep(8, 'Clean Components', 'Wipe down sheave faces with clean lint-free cloth. Do NOT use lubricant.', { expected_duration_minutes: 5 }),
      createSOPStep(9, 'Reinstall Cover', 'Reinstall CVT cover. Torque bolts to 8 Nm in star pattern.', { expected_duration_minutes: 5 }),
      createSOPStep(10, 'Document Findings', 'Record overall belt condition and any concerns for maintenance log.', { requires_photo: true })
    ]
  }),
  createSOP('sop-baja-002', 'SOP-BAJA-002', 'Chassis Torque Audit', SOP_TYPES.INSPECTION, SOP_SCOPE_TYPES.NODE, {
    project_id: 'proj-baja-2025',
    node_id: 'node-baja-chassis',
    purpose: 'Verify all critical fasteners are properly torqued to specification.',
    tags: ['safety', 'chassis', 'fasteners'],
    review_interval_days: 90,
    steps: [
      createSOPStep(1, 'Gather Tools', 'Obtain calibrated torque wrench (10-80 Nm range), socket set, and torque specification sheet.', { required: true }),
      createSOPStep(2, 'Suspension Pickup Points', 'Check all 8 suspension pickup bolts. Spec: 45 Nm for M10, 25 Nm for M8.', { requires_measurement: true, measurement_unit: 'Nm', expected_duration_minutes: 15, assets: [{ asset_type: 'image', storage_key_or_url: '/demo/sop-images/suspension-pickups.jpg', caption: 'Suspension pickup locations' }] }),
      createSOPStep(3, 'Engine Mount Bolts', 'Check all 4 engine mount bolts. Spec: 35 Nm.', { requires_measurement: true, measurement_unit: 'Nm', expected_duration_minutes: 10 }),
      createSOPStep(4, 'Roll Cage Joints', 'Verify all roll cage bolted joints. Spec: 50 Nm for main hoop, 35 Nm for bracing.', { requires_measurement: true, measurement_unit: 'Nm', expected_duration_minutes: 20 }),
      createSOPStep(5, 'Steering Column Mounts', 'Check steering column U-joints and mounts. Spec: 25 Nm.', { required: true, expected_duration_minutes: 10 }),
      createSOPStep(6, 'Document Results', 'Record any fasteners requiring re-torque and final values.', { requires_photo: true })
    ]
  }),
  createSOP('sop-baja-003', 'SOP-BAJA-003', 'Brake Bleed Procedure', SOP_TYPES.SERVICE, SOP_SCOPE_TYPES.NODE, {
    project_id: 'proj-baja-2025',
    node_id: 'node-baja-brakes',
    purpose: 'Remove air from brake hydraulic system to ensure firm pedal feel and maximum braking performance.',
    tags: ['safety', 'brakes', 'hydraulic'],
    review_interval_days: null, // On-demand, not scheduled
    steps: [
      createSOPStep(1, 'Gather Materials', 'DOT 4 brake fluid (new, sealed container), clear tubing, catch container, 8mm wrench.', { required: true }),
      createSOPStep(2, 'Check Fluid Level', 'Verify master cylinder reservoir is full. Top up if needed with DOT 4.', { requires_photo: true, expected_duration_minutes: 2 }),
      createSOPStep(3, 'Bleed Rear Right', 'Attach tubing to RR bleeder. Open bleeder, pump pedal 5x, hold, close bleeder. Repeat until no bubbles.', { requires_photo: true, expected_duration_minutes: 10 }),
      createSOPStep(4, 'Bleed Rear Left', 'Repeat bleeding process for rear left caliper.', { expected_duration_minutes: 10 }),
      createSOPStep(5, 'Bleed Front Right', 'Repeat bleeding process for front right caliper.', { expected_duration_minutes: 10 }),
      createSOPStep(6, 'Bleed Front Left', 'Repeat bleeding process for front left caliper.', { expected_duration_minutes: 10 }),
      createSOPStep(7, 'Pedal Feel Check', 'Pump brake pedal 10x. Pedal should be firm within first 1 inch of travel.', { required: true }),
      createSOPStep(8, 'Final Fluid Level', 'Top up master cylinder to MAX line. Install cap securely.', { requires_photo: true }),
      createSOPStep(9, 'Test Drive', 'Perform low-speed brake test. Verify straight-line stopping and no fade.', { required: true })
    ]
  })
];

// =============================================================================
// DEMO SOPs FOR ELECTRIC BUS GEN 1
// =============================================================================

export const DEMO_SOPS_EBUS_GEN1 = [
  createSOP('sop-ebus-001', 'SOP-EBUS-001', 'HV Isolation Check Procedure', SOP_TYPES.INSPECTION, SOP_SCOPE_TYPES.NODE, {
    project_id: 'proj-ebus-gen1',
    node_id: 'node-ebus-hv-battery',
    purpose: 'Verify high voltage system isolation resistance meets safety requirements before any HV work.',
    tags: ['safety', 'hv', 'electrical', 'critical'],
    review_interval_days: 30,
    steps: [
      createSOPStep(1, 'PPE Verification', 'Don Class 0 HV gloves, safety glasses, and arc-rated clothing. Verify glove inspection current.', { required: true, requires_photo: true, assets: [{ asset_type: 'image', storage_key_or_url: '/demo/sop-images/hv-ppe.jpg', caption: 'Required HV PPE' }] }),
      createSOPStep(2, 'Isolate HV System', 'Open HV service disconnect. Verify disconnect is in OPEN position. Install LOTO tag.', { required: true, requires_photo: true, expected_duration_minutes: 5 }),
      createSOPStep(3, 'Wait Discharge Period', 'Wait minimum 5 minutes for capacitor discharge before proceeding.', { required: true, expected_duration_minutes: 5 }),
      createSOPStep(4, 'Absence of Voltage Test', 'Using rated meter, verify 0V between HV+ and chassis, HV- and chassis, HV+ and HV-.', { required: true, requires_measurement: true, measurement_unit: 'V', measurement_min: 0, measurement_max: 50, expected_duration_minutes: 5 }),
      createSOPStep(5, 'Isolation Resistance Test', 'Using megohmmeter at 500V, measure isolation resistance. Minimum: 500 ohms/volt.', { required: true, requires_measurement: true, measurement_unit: 'MΩ', measurement_min: 0.5, expected_duration_minutes: 10, assets: [{ asset_type: 'image', storage_key_or_url: '/demo/sop-images/megohmmeter-setup.jpg', caption: 'Megohmmeter connection points' }] }),
      createSOPStep(6, 'Document Results', 'Record all measurements in HV safety log. Note any anomalies.', { required: true, requires_photo: true })
    ]
  }),
  createSOP('sop-ebus-002', 'SOP-EBUS-002', 'Inverter Commissioning Checklist', SOP_TYPES.TEST_EXECUTION, SOP_SCOPE_TYPES.NODE, {
    project_id: 'proj-ebus-gen1',
    node_id: 'node-ebus-inverter',
    purpose: 'Systematic commissioning procedure for traction inverter initial power-up and verification.',
    tags: ['commissioning', 'inverter', 'electrical'],
    review_interval_days: null,
    steps: [
      createSOPStep(1, 'Pre-Power Inspection', 'Verify all HV connections are torqued to spec. Check for debris or damage.', { required: true, requires_photo: true, expected_duration_minutes: 15 }),
      createSOPStep(2, 'Coolant System Verification', 'Verify coolant loop is filled, bled, and pump operational. Check for leaks.', { required: true, expected_duration_minutes: 10 }),
      createSOPStep(3, 'LV Power-Up', 'Apply 12V auxiliary power. Verify inverter status LEDs and CAN communication.', { requires_photo: true, expected_duration_minutes: 5 }),
      createSOPStep(4, 'Parameter Download', 'Connect diagnostic laptop. Download motor parameters and verify match to nameplate.', { required: true, expected_duration_minutes: 15, assets: [{ asset_type: 'link', storage_key_or_url: 'https://docs.example.com/inverter-params', caption: 'Inverter parameter reference' }] }),
      createSOPStep(5, 'HV Pre-Charge Test', 'Enable HV with motor disconnected. Verify pre-charge completes within 2 seconds.', { required: true, requires_measurement: true, measurement_unit: 's', measurement_max: 2.0, expected_duration_minutes: 5 }),
      createSOPStep(6, 'Motor Phase Check', 'At low voltage, verify motor phase sequence. Correct if reversed.', { required: true, expected_duration_minutes: 10 }),
      createSOPStep(7, 'No-Load Spin Test', 'With motor connected, command 100 RPM. Verify smooth rotation, no vibration.', { required: true, requires_photo: true, expected_duration_minutes: 10 }),
      createSOPStep(8, 'Temperature Monitoring', 'Run at 1000 RPM for 5 min. Verify IGBT temp < 80°C, motor temp < 60°C.', { requires_measurement: true, measurement_unit: '°C', measurement_max: 80, expected_duration_minutes: 10 }),
      createSOPStep(9, 'Final Documentation', 'Complete commissioning form. Attach all test data and photos to record.', { required: true, requires_photo: true })
    ]
  }),
  createSOP('sop-ebus-003', 'SOP-EBUS-003', 'Coolant Fill and Bleed Procedure', SOP_TYPES.SERVICE, SOP_SCOPE_TYPES.NODE, {
    project_id: 'proj-ebus-gen1',
    node_id: 'node-ebus-thermal',
    purpose: 'Properly fill and bleed the thermal management coolant loop to ensure optimal heat transfer.',
    tags: ['thermal', 'coolant', 'maintenance'],
    review_interval_days: 365,
    steps: [
      createSOPStep(1, 'Prepare Coolant', 'Use only approved coolant (50/50 glycol/DI water). Verify 2 gallons available.', { required: true }),
      createSOPStep(2, 'Open Bleed Points', 'Open bleed valves at: radiator high point, inverter inlet, motor inlet.', { expected_duration_minutes: 5, assets: [{ asset_type: 'image', storage_key_or_url: '/demo/sop-images/bleed-points.jpg', caption: 'Coolant bleed valve locations' }] }),
      createSOPStep(3, 'Fill Reservoir', 'Fill expansion tank to MAX line. Allow air to escape through bleed points.', { expected_duration_minutes: 10 }),
      createSOPStep(4, 'Start Pump - Low Speed', 'Run coolant pump at 25% for 2 minutes. Monitor bleed points for bubbles.', { expected_duration_minutes: 3 }),
      createSOPStep(5, 'Close Bleed Points', 'When steady stream (no bubbles) at each bleed point, close valve.', { requires_photo: true }),
      createSOPStep(6, 'Top Up Reservoir', 'Add coolant to maintain level between MIN and MAX.', { expected_duration_minutes: 2 }),
      createSOPStep(7, 'Pump Speed Ramp', 'Increase pump to 50%, then 75%, then 100%. Check for leaks at each step.', { expected_duration_minutes: 5 }),
      createSOPStep(8, 'Thermal Cycle', 'Run system until coolant reaches 60°C, then cool to ambient. Check level.', { requires_measurement: true, measurement_unit: '°C', expected_duration_minutes: 30 }),
      createSOPStep(9, 'Final Level Check', 'After thermal cycle, verify level still between MIN/MAX. Top up if needed.', { requires_photo: true })
    ]
  })
];

// =============================================================================
// GLOBAL SOPs (Not tied to any project/node)
// =============================================================================

export const DEMO_SOPS_GLOBAL = [
  createSOP('sop-global-001', 'SOP-GLB-001', 'Quarterly Shop Safety Inspection', SOP_TYPES.INSPECTION, SOP_SCOPE_TYPES.GLOBAL, {
    purpose: 'Comprehensive quarterly inspection of shop safety equipment, housekeeping, and compliance.',
    tags: ['safety', 'compliance', 'quarterly'],
    review_interval_days: 365,
    steps: [
      createSOPStep(1, 'Fire Extinguishers', 'Verify all extinguishers present, charged, and inspection tag current.', { required: true, requires_photo: true, expected_duration_minutes: 10 }),
      createSOPStep(2, 'Emergency Exits', 'Verify all emergency exits clear, illuminated, and doors operational.', { required: true, requires_photo: true, expected_duration_minutes: 5 }),
      createSOPStep(3, 'First Aid Stations', 'Check first aid kit inventory. Restock expired or missing items.', { requires_photo: true, expected_duration_minutes: 10 }),
      createSOPStep(4, 'Eye Wash Stations', 'Test each eye wash station. Verify flow and clarity.', { requires_photo: true, expected_duration_minutes: 10 }),
      createSOPStep(5, 'PPE Availability', 'Verify safety glasses, hearing protection, and gloves stocked at each station.', { expected_duration_minutes: 10 }),
      createSOPStep(6, 'Housekeeping', 'Inspect for trip hazards, proper storage, and clear aisles.', { requires_photo: true, expected_duration_minutes: 15 }),
      createSOPStep(7, 'Machine Guards', 'Verify all machine guards in place and secure.', { required: true, expected_duration_minutes: 20 }),
      createSOPStep(8, 'Electrical Panels', 'Check all panels have 36" clearance and are properly labeled.', { requires_photo: true, expected_duration_minutes: 10 }),
      createSOPStep(9, 'Chemical Storage', 'Verify SDS sheets current, chemicals properly stored and labeled.', { required: true, expected_duration_minutes: 15 }),
      createSOPStep(10, 'Complete Report', 'Document all findings, corrective actions needed, and sign off.', { required: true, requires_photo: true })
    ]
  })
];

// =============================================================================
// SOP SCHEDULES
// =============================================================================

export const DEMO_SOP_SCHEDULES = [
  // Every 90 days - CVT Belt Inspection
  createSOPSchedule('sched-001', 'sop-baja-001', SOP_SCOPE_TYPES.NODE, {
    node_id: 'node-baja-cvt',
    cadence_type: 'interval_days',
    interval_days: 90,
    lead_time_days: 7,
    assignment_mode: 'role',
    assigned_to_role: 'technician',
    escalation_days: [0, 3, 7],
    next_due_at: '2025-04-15T00:00:00Z'
  }),
  // Monthly - Global Safety Inspection
  createSOPSchedule('sched-002', 'sop-global-001', SOP_SCOPE_TYPES.GLOBAL, {
    cadence_type: 'interval_days',
    interval_days: 90, // Quarterly
    lead_time_days: 14,
    assignment_mode: 'role',
    assigned_to_role: 'safety_officer',
    escalation_days: [0, 7, 14],
    next_due_at: '2025-04-01T00:00:00Z'
  }),
  // Every 30 days - HV Isolation Check
  createSOPSchedule('sched-003', 'sop-ebus-001', SOP_SCOPE_TYPES.NODE, {
    node_id: 'node-ebus-hv-battery',
    cadence_type: 'interval_days',
    interval_days: 30,
    lead_time_days: 7,
    assignment_mode: 'user',
    assigned_to_user_id: 'user-mike-chen',
    escalation_days: [0, 3, 7],
    next_due_at: '2025-02-15T00:00:00Z'
  })
];

// =============================================================================
// SOP REQUESTS (DEMO STATES)
// =============================================================================

export const DEMO_SOP_REQUESTS = [
  // OVERDUE request - HV Isolation Check (6 days overdue)
  createSOPRequest('req-001', 'sop-ebus-001', {
    sop_schedule_id: 'sched-003',
    sop_title: 'HV Isolation Check Procedure',
    scope_type: SOP_SCOPE_TYPES.NODE,
    project_id: 'proj-ebus-gen1',
    node_id: 'node-ebus-hv-battery',
    due_at: '2025-01-20T00:00:00Z',
    requested_at: '2025-01-13T00:00:00Z',
    request_source: 'scheduled',
    assigned_to_user_id: 'user-mike-chen',
    status: REQUEST_STATUS.OVERDUE
  }),
  // OVERDUE request - Global Safety Inspection (11 days overdue)
  createSOPRequest('req-002', 'sop-global-001', {
    sop_schedule_id: 'sched-002',
    sop_title: 'Quarterly Shop Safety Inspection',
    scope_type: SOP_SCOPE_TYPES.GLOBAL,
    due_at: '2025-01-15T00:00:00Z',
    requested_at: '2025-01-01T00:00:00Z',
    request_source: 'scheduled',
    assigned_to_role: 'safety_officer',
    status: REQUEST_STATUS.OVERDUE
  }),
  // IN_PROGRESS request - Torque Audit (started Jan 26)
  createSOPRequest('req-003', 'sop-baja-002', {
    sop_title: 'Chassis Torque Audit',
    scope_type: SOP_SCOPE_TYPES.NODE,
    project_id: 'proj-baja-2025',
    node_id: 'node-baja-chassis',
    due_at: '2025-01-30T00:00:00Z',
    requested_at: '2025-01-20T00:00:00Z',
    request_source: 'manual',
    assigned_to_user_id: 'user-john-smith',
    status: REQUEST_STATUS.IN_PROGRESS,
    related_execution_id: 'exec-001'
  }),
  // OPEN request - CVT Belt Inspection (due Jan 28)
  createSOPRequest('req-004', 'sop-baja-001', {
    sop_schedule_id: 'sched-001',
    sop_title: 'CVT Belt Inspection Procedure',
    scope_type: SOP_SCOPE_TYPES.NODE,
    project_id: 'proj-baja-2025',
    node_id: 'node-baja-cvt',
    due_at: '2025-01-28T00:00:00Z',
    requested_at: '2025-01-21T00:00:00Z',
    request_source: 'scheduled',
    assigned_to_user_id: 'user-john-smith',
    status: REQUEST_STATUS.OPEN
  }),
  // OPEN request - Brake Bleed (due Feb 1)
  createSOPRequest('req-005', 'sop-baja-003', {
    sop_title: 'Brake Bleed Procedure',
    scope_type: SOP_SCOPE_TYPES.NODE,
    project_id: 'proj-baja-2025',
    node_id: 'node-baja-brakes',
    due_at: '2025-02-01T00:00:00Z',
    requested_at: '2025-01-25T00:00:00Z',
    request_source: 'manual',
    assigned_to_user_id: 'user-sarah-lee',
    status: REQUEST_STATUS.OPEN
  }),
  // OPEN request - Coolant Fill (due Feb 15)
  createSOPRequest('req-006', 'sop-ebus-003', {
    sop_title: 'Coolant Fill and Bleed Procedure',
    scope_type: SOP_SCOPE_TYPES.NODE,
    project_id: 'proj-ebus-gen1',
    node_id: 'node-ebus-thermal',
    due_at: '2025-02-15T00:00:00Z',
    requested_at: '2025-02-01T00:00:00Z',
    request_source: 'scheduled',
    assigned_to_role: 'technician',
    status: REQUEST_STATUS.OPEN
  })
];

// All demo SOPs combined
export const DEMO_SOPS = [
  ...DEMO_SOPS_BAJA_2025,
  ...DEMO_SOPS_EBUS_GEN1,
  ...DEMO_SOPS_GLOBAL
];

// Helper functions for SOPs
export const getSOPsByProject = (projectId) => DEMO_SOPS.filter(sop => sop.project_id === projectId);
export const getSOPsByNode = (nodeId) => DEMO_SOPS.filter(sop => sop.node_id === nodeId);
export const getGlobalSOPs = () => DEMO_SOPS.filter(sop => sop.scope_type === SOP_SCOPE_TYPES.GLOBAL);
export const getSOPById = (sopId) => DEMO_SOPS.find(sop => sop.id === sopId);
export const getSOPRequestsByStatus = (status) => DEMO_SOP_REQUESTS.filter(req => req.status === status);
export const getOverdueSOPRequests = () => DEMO_SOP_REQUESTS.filter(req => req.status === REQUEST_STATUS.OVERDUE);
export const getDueSOPRequests = (days = 7) => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return DEMO_SOP_REQUESTS.filter(req => {
    const dueDate = new Date(req.requested_for_due_at);
    return req.status === REQUEST_STATUS.OPEN && dueDate <= futureDate;
  });
};

// =============================================================================
// EXECUTIVE DASHBOARD DEMO DATA (CORPORATE ONLY)
// =============================================================================

export const PLAN_TIERS = {
  FREE: 'free',
  PROFESSIONAL: 'professional',
  TEAM: 'team',
  CORPORATE: 'corporate',
  ENTERPRISE: 'enterprise'
};

export const USER_ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EXECUTIVE_VIEWER: 'executive_viewer',
  CORPORATE_ADMIN: 'corporate_admin'
};

// Demo Organizations with Plan Tiers
export const DEMO_ORG_PLANS = [
  {
    org_id: 'org-megacorp-enterprise',
    org_name: 'MegaCorp Engineering',
    plan_tier: PLAN_TIERS.CORPORATE,
    status: 'active',
    max_users: null, // unlimited
    max_projects: null,
    features: {
      executive_dashboard: true,
      sso: true,
      audit_trails: true,
      advanced_reporting: true
    }
  },
  {
    org_id: 'org-acme-industrial',
    org_name: 'Acme Industrial',
    plan_tier: PLAN_TIERS.TEAM,
    status: 'active',
    max_users: 10,
    max_projects: 5,
    features: {
      executive_dashboard: false, // Not available on Team plan
      sso: false,
      audit_trails: true,
      advanced_reporting: false
    }
  },
  {
    org_id: 'org-public-demo',
    org_name: 'Public Demo Org',
    plan_tier: PLAN_TIERS.FREE,
    status: 'active',
    max_users: 1,
    max_projects: 2,
    features: {
      executive_dashboard: false,
      sso: false,
      audit_trails: false,
      advanced_reporting: false
    }
  }
];

// Demo Executive Dashboard Data (for Corporate org)
export const DEMO_EXECUTIVE_DASHBOARD = {
  generated_at: '2025-01-27T14:45:00Z',
  org: {
    id: 'org-megacorp-enterprise',
    name: 'MegaCorp Engineering',
    plan_tier: PLAN_TIERS.CORPORATE
  },
  scrappy_mode_active: true,
  scrappy_mode_projects: ['proj-ebus-gen2'],
  widgets: {
    delivery_health: {
      active_projects: 7,
      due_30_days: 2,
      due_60_days: 3,
      due_90_days: 5,
      overdue_projects: 1,
      nearest_deadline: {
        project_id: 'proj-baja-2025',
        project_name: 'Baja 2025',
        due_date: '2025-06-13',
        days_remaining: 139
      }
    },
    engineering_rigor: {
      phase_completion: {
        phase_1: 89,
        phase_2: 78,
        phase_3: 45,
        phase_4: 34,
        phase_5: 22,
        phase_6: 12,
        phase_7: 5
      },
      blocked_releases: {
        total: 3,
        reasons: {
          unmet_phase_rules: 2,
          violated_assumptions: 0,
          missing_correlation: 0,
          open_critical_8d: 1
        }
      }
    },
    risk_assumptions: {
      engineering_risk_present: true,
      violated_assumptions: 2,
      high_risk_unvalidated: 5,
      top_risks: [
        { id: 'risk-001', title: 'Frame tube yield strength margin', severity: 'critical', review_date: '2025-02-01', node: 'Chassis Frame' },
        { id: 'risk-002', title: 'Motor continuous temp limit', severity: 'high', review_date: '2025-02-15', node: 'Traction Motor' },
        { id: 'risk-003', title: 'Battery SOC estimation accuracy', severity: 'high', review_date: '2025-02-10', node: 'BMS' },
        { id: 'risk-004', title: 'Inverter cooling capacity', severity: 'medium', review_date: '2025-03-01', node: 'Thermal System' },
        { id: 'risk-005', title: 'CVT ratio calculation model', severity: 'medium', review_date: '2025-02-20', node: 'CVT Assembly' }
      ]
    },
    doe_studies: {
      active_studies: 4,
      completed_this_month: 12,
      needs_revalidation: 2
    },
    testing: {
      tests_executed_week: 23,
      open_failed_tests: 3,
      regression_tests_due: 8
    },
    sop_compliance: {
      due_7_days: 4,
      overdue: 2,
      last_maintenance: [
        { asset: 'CNC Mill #3', completed_at: '2025-01-15T10:30:00Z' },
        { asset: 'Welding Station A', completed_at: '2025-01-20T14:00:00Z' },
        { asset: 'Press Brake #1', completed_at: '2025-01-22T09:15:00Z' }
      ]
    },
    quality_8d: {
      open_by_severity: {
        critical: 1,
        high: 3,
        medium: 7,
        low: 2
      },
      opened_this_week: 2,
      aging_over_30_days: 4,
      linked_to_violations: 1
    },
    artifact_throughput: {
      cad_uploads_week: 15,
      fixtures_created_month: 8,
      part_numbers_issued_week: 23
    }
  }
};

// Demo Violated Assumptions (for Executive Dashboard)
export const DEMO_VIOLATED_ASSUMPTIONS = [
  {
    id: 'assume-001',
    title: 'Motor peak torque duration assumption',
    node_name: 'Traction Motor',
    project_name: 'Electric Bus Gen 1',
    severity: 'high',
    status: 'violated',
    violated_at: '2025-01-22T11:30:00Z',
    violation_reason: 'Thermal test showed motor overtemp at 45s sustained peak torque vs 60s assumed'
  },
  {
    id: 'assume-002',
    title: 'Supplier lead time for custom gears',
    node_name: 'Gearbox Assembly',
    project_name: 'Baja 2025',
    severity: 'medium',
    status: 'violated',
    violated_at: '2025-01-25T09:00:00Z',
    violation_reason: 'Supplier notified 12-week lead time vs 8-week assumed'
  }
];

// Demo Open 8D Cases
export const DEMO_8D_CASES = [
  {
    id: '8d-001',
    case_number: '8D-2025-0042',
    title: 'Inverter IGBT overheat during hill climb test',
    severity: 'critical',
    project_name: 'Electric Bus Gen 1',
    node_name: 'Traction Inverter',
    opened_at: '2025-01-20T08:00:00Z',
    current_discipline: 'D4',
    owner: 'Mike Chen',
    linked_to_assumption: 'assume-001'
  },
  {
    id: '8d-002',
    case_number: '8D-2025-0041',
    title: 'CVT belt premature wear at high RPM',
    severity: 'high',
    project_name: 'Baja 2025',
    node_name: 'CVT Assembly',
    opened_at: '2025-01-18T14:30:00Z',
    current_discipline: 'D5',
    owner: 'John Smith',
    linked_to_assumption: null
  },
  {
    id: '8d-003',
    case_number: '8D-2025-0040',
    title: 'Brake fade under repeated hard stops',
    severity: 'high',
    project_name: 'Baja 2025',
    node_name: 'Brake System',
    opened_at: '2025-01-15T10:00:00Z',
    current_discipline: 'D6',
    owner: 'Sarah Lee',
    linked_to_assumption: null
  }
];

// Helper to check if org has executive dashboard access
export const hasExecutiveDashboardAccess = (orgId, userRole) => {
  const orgPlan = DEMO_ORG_PLANS.find(p => p.org_id === orgId);
  if (!orgPlan) return false;

  const isPlanEligible = [PLAN_TIERS.CORPORATE, PLAN_TIERS.ENTERPRISE].includes(orgPlan.plan_tier);
  const isRoleEligible = [USER_ROLES.CORPORATE_ADMIN, USER_ROLES.EXECUTIVE_VIEWER, USER_ROLES.MANAGER].includes(userRole);

  return isPlanEligible && isRoleEligible;
};

// =============================================================================
// EXPORTS
// =============================================================================

export const DEMO_PROJECTS = [
  BAJA_2025,
  BAJA_2024,
  FSAE_2025,
  FSAE_2024,
  EBUS_GEN1,
  EBUS_GEN2,
  ISR_DRONE
];

export const getProjectById = (id) => DEMO_PROJECTS.find(p => p.id === id);
export const getActiveProjects = () => DEMO_PROJECTS.filter(p => p.status === PROJECT_STATUS.ACTIVE);
export const getCompletedProjects = () => DEMO_PROJECTS.filter(p => p.status === PROJECT_STATUS.COMPLETED);
export const getPlatformModProjects = () => DEMO_PROJECTS.filter(p => p.mode === PROJECT_MODES.PLATFORM_MOD);
export const getProjectsByTeam = (team) => DEMO_PROJECTS.filter(p => p.team === team);

// Get projects by organization ID
export const getProjectsByOrg = (orgId) => DEMO_PROJECTS.filter(p => p.org_id === orgId);

// Get projects visible to an organization
// Each org only sees their own projects - demonstrates org isolation
export const getVisibleProjects = (orgId) => {
  return DEMO_PROJECTS.filter(p => p.org_id === orgId);
};

export default DEMO_PROJECTS;
