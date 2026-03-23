/**
 * Demo ISR Drone Project - Tactical FPV ISR Drone System Design & Validation
 * 
 * A fully completed engineering lifecycle demonstration for a rugged,
 * field-deployable ISR/reconnaissance FPV drone intended for observation,
 * navigation, and remote situational awareness in harsh environments.
 * 
 * NOT a racing drone. NOT a weapon system.
 */

import {
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

// =============================================================================
// HELPER FUNCTIONS (Local copies for this file)
// =============================================================================

let isrIdCounter = 5000;
const generateIsrId = (prefix = 'node') => `${prefix}-${++isrIdCounter}`;

const generateCadThumbnail = (type = 'assembly', color = '#8B5CF6') => {
  const shapes = {
    assembly: `<rect x="20" y="30" width="60" height="40" rx="4" fill="${color}" opacity="0.3"/><rect x="30" y="20" width="40" height="30" rx="2" fill="${color}" opacity="0.5"/><circle cx="50" cy="50" r="15" fill="${color}" opacity="0.7"/>`,
    component: `<rect x="25" y="25" width="50" height="50" rx="8" fill="${color}" opacity="0.4"/><circle cx="50" cy="50" r="20" fill="${color}" opacity="0.6"/>`,
    fixture: `<polygon points="50,15 85,35 85,65 50,85 15,65 15,35" fill="${color}" opacity="0.4"/><rect x="35" y="35" width="30" height="30" fill="${color}" opacity="0.6"/>`,
    drone: `<ellipse cx="50" cy="50" rx="35" ry="20" fill="${color}" opacity="0.3"/><circle cx="20" cy="30" r="8" fill="${color}" opacity="0.6"/><circle cx="80" cy="30" r="8" fill="${color}" opacity="0.6"/><circle cx="20" cy="70" r="8" fill="${color}" opacity="0.6"/><circle cx="80" cy="70" r="8" fill="${color}" opacity="0.6"/>`,
    motor: `<circle cx="50" cy="50" r="25" fill="${color}" opacity="0.3"/><circle cx="50" cy="50" r="15" fill="${color}" opacity="0.5"/><rect x="45" y="20" width="10" height="60" fill="${color}" opacity="0.4"/>`,
    electronics: `<rect x="20" y="30" width="60" height="40" rx="2" fill="${color}" opacity="0.4"/><rect x="25" y="35" width="20" height="10" fill="${color}" opacity="0.7"/><rect x="55" y="35" width="20" height="10" fill="${color}" opacity="0.7"/><rect x="25" y="55" width="50" height="10" fill="${color}" opacity="0.6"/>`,
    camera: `<rect x="30" y="35" width="40" height="30" rx="3" fill="${color}" opacity="0.5"/><circle cx="50" cy="50" r="12" fill="${color}" opacity="0.7"/><circle cx="50" cy="50" r="6" fill="${color}" opacity="0.9"/>`,
    antenna: `<rect x="45" y="60" width="10" height="25" fill="${color}" opacity="0.5"/><ellipse cx="50" cy="35" rx="20" ry="25" fill="none" stroke="${color}" stroke-width="3" opacity="0.6"/>`,
    battery: `<rect x="20" y="35" width="60" height="30" rx="3" fill="${color}" opacity="0.5"/><rect x="80" y="42" width="5" height="16" fill="${color}" opacity="0.7"/>`
  };
  const shape = shapes[type] || shapes.assembly;
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#1F2937"/>${shape}</svg>`)}`;
};

const createFunctionalSubsystem = (name, partNumber, children = []) => ({
  id: generateIsrId('subsys'),
  type: NODE_TYPES.SUBSYS,
  node_class: NODE_CLASSES.FUNCTIONAL_GROUP,
  name,
  part_number: partNumber,
  allows_attachments: false,
  allows_revisions: false,
  children
});

const createAssembly = (name, partNumber, options = {}) => ({
  id: generateIsrId('assy'),
  type: NODE_TYPES.ASSY,
  node_class: options.node_class || NODE_CLASSES.PRODUCT,
  name,
  part_number: partNumber,
  allows_attachments: true,
  allows_revisions: true,
  revision: options.revision || 'A',
  phase: options.phase || 7,
  phase_status: options.phase_status || PHASE_STATUS.COMPLETED,
  rigor_tier: options.rigor_tier || 2,
  ai_score: options.ai_score || 88,
  cad_thumbnail: options.cad_thumbnail || (options.show_cad ? generateCadThumbnail(options.cad_type || 'assembly', options.cad_color || '#8B5CF6') : null),
  attachments: options.attachments || [],
  children: options.children || []
});

const createSubAssembly = (name, partNumber, options = {}) => ({
  id: generateIsrId('subassy'),
  type: NODE_TYPES.SUBASSY,
  node_class: options.node_class || NODE_CLASSES.PRODUCT,
  name,
  part_number: partNumber,
  allows_attachments: true,
  allows_revisions: true,
  revision: options.revision || 'A',
  phase: options.phase || 7,
  phase_status: options.phase_status || PHASE_STATUS.COMPLETED,
  rigor_tier: options.rigor_tier || 2,
  ai_score: options.ai_score || 85,
  cad_thumbnail: options.cad_thumbnail || (options.show_cad ? generateCadThumbnail(options.cad_type || 'assembly', options.cad_color || '#8B5CF6') : null),
  attachments: options.attachments || [],
  children: options.children || []
});

const createComponent = (name, partNumber, options = {}) => ({
  id: generateIsrId('comp'),
  type: NODE_TYPES.COMP,
  node_class: NODE_CLASSES.PRODUCT,
  name,
  part_number: partNumber,
  allows_attachments: true,
  allows_revisions: true,
  revision: options.revision || 'A',
  phase: options.phase || 7,
  phase_status: options.phase_status || PHASE_STATUS.COMPLETED,
  rigor_tier: options.rigor_tier || 2,
  ai_score: options.ai_score || 82,
  cad_thumbnail: options.cad_thumbnail || (options.show_cad ? generateCadThumbnail(options.cad_type || 'component', options.cad_color || '#10B981') : null),
  attachments: options.attachments || [],
  children: []
});

const createPurchasedPart = (name, partNumber, options = {}) => ({
  id: generateIsrId('purch'),
  type: NODE_TYPES.PURCH,
  node_class: NODE_CLASSES.PRODUCT,
  name,
  part_number: partNumber,
  allows_attachments: true,
  allows_revisions: true,
  revision: options.revision || 'A',
  phase: options.phase || 7,
  phase_status: options.phase_status || PHASE_STATUS.COMPLETED,
  attachments: options.attachments || [],
  children: []
});

const createManufacturingAsset = (name, partNumber, fixtureType, linkedNodes = [], options = {}) => ({
  id: generateIsrId('fixture'),
  type: NODE_TYPES.ASSY,
  node_class: NODE_CLASSES.MANUFACTURING_ASSET,
  fixture_type: fixtureType,
  name,
  part_number: partNumber,
  linked_product_nodes: linkedNodes,
  allows_attachments: true,
  allows_revisions: true,
  revision: options.revision || 'A',
  phase: options.phase || 7,
  phase_status: options.phase_status || PHASE_STATUS.COMPLETED,
  ai_score: options.ai_score || 90,
  cad_thumbnail: options.cad_thumbnail || generateCadThumbnail('fixture', '#F97316'),
  attachments: options.attachments || [],
  children: options.children || []
});

const createAttachment = (type, filename, description = '') => ({
  id: generateIsrId('attach'),
  type,
  filename,
  description,
  uploaded_at: '2025-01-15T00:00:00Z',
  status: 'uploaded'
});

const createEngineeringStudy = (name, studyId, type, intent, owningNodeId, options = {}) => ({
  id: generateIsrId('study'),
  study_id: studyId,
  name,
  type,
  intent,
  owning_node_id: owningNodeId,
  owning_node_part_number: options.owning_node_part_number || null,
  phase_contexts: options.phase_contexts || [],
  status: options.status || 'complete',
  created_at: options.created_at || '2025-01-10T00:00:00Z',
  factors: options.factors || [],
  responses: options.responses || [],
  design_type: options.design_type || null,
  run_count: options.run_count || null,
  parameter: options.parameter || null,
  range: options.range || null,
  step_count: options.step_count || null,
  alternatives: options.alternatives || [],
  criteria: options.criteria || [],
  weights: options.weights || [],
  linked_requirements: options.linked_requirements || [],
  results_summary: options.results_summary || null,
  attachments: options.attachments || []
});

const createTestCase = (name, testId, testLevel, owningNodeId, options = {}) => ({
  id: generateIsrId('test'),
  test_id: testId,
  name,
  test_level: testLevel,
  owning_node_id: owningNodeId,
  owning_node_part_number: options.owning_node_part_number || null,
  status: options.status || 'passed',
  scheduled_date: options.scheduled_date || '2025-01-20',
  executed_date: options.executed_date || '2025-01-20',
  acceptance_criteria: options.acceptance_criteria || '',
  result: options.result || null,
  pass_fail: options.pass_fail || 'pass',
  linked_requirements: options.linked_requirements || [],
  test_fixture_id: options.test_fixture_id || null,
  attachments: options.attachments || []
});

// =============================================================================
// AIRFRAME SYSTEM
// =============================================================================

const createAirframeSystem = () => createFunctionalSubsystem('Airframe System', 'ISR-AF', [
  createAssembly('Main Airframe Assembly', 'ISR-AF-100', {
    phase: 7, ai_score: 92,
    show_cad: true, cad_type: 'drone', cad_color: '#3B82F6',
    attachments: [
      createAttachment(ATTACHMENT_TYPES.CAD, 'airframe_assy.step'),
      createAttachment(ATTACHMENT_TYPES.DRAWING, 'DWG-ISR-AF-100.pdf'),
      createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'airframe_fea_report.pdf')
    ],
    children: [
      createSubAssembly('Center Plate Assembly', 'ISR-AF-110', {
        phase: 7, ai_score: 90,
        show_cad: true, cad_type: 'component', cad_color: '#3B82F6',
        children: [
          createComponent('Top Plate - Carbon Fiber', 'ISR-AF-111', { phase: 7, show_cad: true, cad_color: '#1F2937' }),
          createComponent('Bottom Plate - Carbon Fiber', 'ISR-AF-112', { phase: 7, show_cad: true, cad_color: '#1F2937' }),
          createComponent('Standoff Set - Aluminum 7075', 'ISR-AF-113', { phase: 7, show_cad: true, cad_color: '#9CA3AF' }),
          createPurchasedPart('Vibration Damper Grommets', 'ISR-AF-114')
        ]
      }),
      createSubAssembly('Motor Arm Assembly - Front Left', 'ISR-AF-120', {
        phase: 7, ai_score: 88,
        show_cad: true, cad_type: 'assembly', cad_color: '#3B82F6',
        children: [
          createComponent('Arm Tube - Carbon Fiber 16mm', 'ISR-AF-121', { phase: 7, show_cad: true }),
          createComponent('Motor Mount Plate', 'ISR-AF-122', { phase: 7, show_cad: true }),
          createComponent('Arm Clamp - CNC Aluminum', 'ISR-AF-123', { phase: 7, show_cad: true })
        ]
      }),
      createSubAssembly('Motor Arm Assembly - Front Right', 'ISR-AF-130', {
        phase: 7, ai_score: 88, children: [
          createComponent('Arm Tube - Carbon Fiber 16mm', 'ISR-AF-131', { phase: 7 }),
          createComponent('Motor Mount Plate', 'ISR-AF-132', { phase: 7 }),
          createComponent('Arm Clamp - CNC Aluminum', 'ISR-AF-133', { phase: 7 })
        ]
      }),
      createSubAssembly('Motor Arm Assembly - Rear Left', 'ISR-AF-140', {
        phase: 7, ai_score: 88, children: [
          createComponent('Arm Tube - Carbon Fiber 16mm', 'ISR-AF-141', { phase: 7 }),
          createComponent('Motor Mount Plate', 'ISR-AF-142', { phase: 7 }),
          createComponent('Arm Clamp - CNC Aluminum', 'ISR-AF-143', { phase: 7 })
        ]
      }),
      createSubAssembly('Motor Arm Assembly - Rear Right', 'ISR-AF-150', {
        phase: 7, ai_score: 88, children: [
          createComponent('Arm Tube - Carbon Fiber 16mm', 'ISR-AF-151', { phase: 7 }),
          createComponent('Motor Mount Plate', 'ISR-AF-152', { phase: 7 }),
          createComponent('Arm Clamp - CNC Aluminum', 'ISR-AF-153', { phase: 7 })
        ]
      }),
      createSubAssembly('Landing Gear Assembly', 'ISR-AF-160', {
        phase: 7, ai_score: 85,
        show_cad: true, cad_type: 'assembly', cad_color: '#6B7280',
        children: [
          createComponent('Landing Leg - Carbon Fiber', 'ISR-AF-161', { phase: 7 }),
          createComponent('Landing Foot - TPU Printed', 'ISR-AF-162', { phase: 7 }),
          createComponent('Leg Mount Bracket', 'ISR-AF-163', { phase: 7 })
        ]
      })
    ]
  }),
  createAssembly('Payload Bay Assembly', 'ISR-AF-200', {
    phase: 7, ai_score: 86,
    show_cad: true, cad_type: 'assembly', cad_color: '#6366F1',
    children: [
      createSubAssembly('Payload Mounting Frame', 'ISR-AF-210', {
        phase: 7, children: [
          createComponent('Payload Plate - Aluminum', 'ISR-AF-211', { phase: 7 }),
          createComponent('Quick-Release Mount', 'ISR-AF-212', { phase: 7 }),
          createPurchasedPart('Vibration Isolator Mount', 'ISR-AF-213')
        ]
      }),
      createSubAssembly('Protective Canopy', 'ISR-AF-220', {
        phase: 7, children: [
          createComponent('Canopy Shell - Polycarbonate', 'ISR-AF-221', { phase: 7 }),
          createComponent('Canopy Latch Set', 'ISR-AF-222', { phase: 7 })
        ]
      })
    ]
  })
]);

// =============================================================================
// PROPULSION SYSTEM
// =============================================================================

const createPropulsionSystem = () => createFunctionalSubsystem('Propulsion System', 'ISR-PR', [
  createAssembly('Motor Set Assembly', 'ISR-PR-100', {
    phase: 7, ai_score: 94,
    show_cad: true, cad_type: 'motor', cad_color: '#EF4444',
    attachments: [
      createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'motor_thrust_test_report.pdf'),
      createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'motor_thermal_analysis.pdf')
    ],
    children: [
      createSubAssembly('Motor Unit - Position 1 (FL)', 'ISR-PR-110', {
        phase: 7, ai_score: 92, children: [
          createPurchasedPart('Brushless Motor 2806.5 1300KV', 'ISR-PR-111'),
          createPurchasedPart('Motor Mounting Hardware M3', 'ISR-PR-112')
        ]
      }),
      createSubAssembly('Motor Unit - Position 2 (FR)', 'ISR-PR-120', {
        phase: 7, children: [
          createPurchasedPart('Brushless Motor 2806.5 1300KV', 'ISR-PR-121'),
          createPurchasedPart('Motor Mounting Hardware M3', 'ISR-PR-122')
        ]
      }),
      createSubAssembly('Motor Unit - Position 3 (RL)', 'ISR-PR-130', {
        phase: 7, children: [
          createPurchasedPart('Brushless Motor 2806.5 1300KV', 'ISR-PR-131'),
          createPurchasedPart('Motor Mounting Hardware M3', 'ISR-PR-132')
        ]
      }),
      createSubAssembly('Motor Unit - Position 4 (RR)', 'ISR-PR-140', {
        phase: 7, children: [
          createPurchasedPart('Brushless Motor 2806.5 1300KV', 'ISR-PR-141'),
          createPurchasedPart('Motor Mounting Hardware M3', 'ISR-PR-142')
        ]
      })
    ]
  }),
  createAssembly('ESC Assembly', 'ISR-PR-200', {
    phase: 7, ai_score: 91,
    show_cad: true, cad_type: 'electronics', cad_color: '#F59E0B',
    children: [
      createSubAssembly('ESC Stack - 4-in-1', 'ISR-PR-210', {
        phase: 7, children: [
          createPurchasedPart('4-in-1 ESC 55A BLHeli32', 'ISR-PR-211'),
          createComponent('ESC Heat Sink - Custom', 'ISR-PR-212', { phase: 7 }),
          createComponent('ESC Mounting Plate', 'ISR-PR-213', { phase: 7 })
        ]
      })
    ]
  }),
  createAssembly('Propeller Set Assembly', 'ISR-PR-300', {
    phase: 7, ai_score: 89,
    children: [
      createSubAssembly('Propeller Set - CW', 'ISR-PR-310', {
        phase: 7, children: [
          createPurchasedPart('Propeller 7x3.5 CW Carbon', 'ISR-PR-311'),
          createPurchasedPart('Propeller 7x3.5 CW Carbon (Spare)', 'ISR-PR-312')
        ]
      }),
      createSubAssembly('Propeller Set - CCW', 'ISR-PR-320', {
        phase: 7, children: [
          createPurchasedPart('Propeller 7x3.5 CCW Carbon', 'ISR-PR-321'),
          createPurchasedPart('Propeller 7x3.5 CCW Carbon (Spare)', 'ISR-PR-322')
        ]
      })
    ]
  })
]);

// =============================================================================
// FLIGHT CONTROL SYSTEM
// =============================================================================

const createFlightControlSystem = () => createFunctionalSubsystem('Flight Control System', 'ISR-FC', [
  createAssembly('Flight Controller Assembly', 'ISR-FC-100', {
    phase: 7, ai_score: 95,
    show_cad: true, cad_type: 'electronics', cad_color: '#10B981',
    attachments: [
      createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'fc_tuning_parameters.pdf'),
      createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'stability_test_report.pdf')
    ],
    children: [
      createSubAssembly('FC Stack Assembly', 'ISR-FC-110', {
        phase: 7, ai_score: 94, children: [
          createPurchasedPart('Flight Controller F7 Dual Gyro', 'ISR-FC-111'),
          createComponent('FC Soft Mount System', 'ISR-FC-112', { phase: 7 }),
          createComponent('FC Mounting Standoffs', 'ISR-FC-113', { phase: 7 })
        ]
      }),
      createSubAssembly('IMU Assembly', 'ISR-FC-120', {
        phase: 7, children: [
          createPurchasedPart('IMU MPU6000 (Primary)', 'ISR-FC-121'),
          createPurchasedPart('IMU ICM42688 (Secondary)', 'ISR-FC-122')
        ]
      })
    ]
  }),
  createAssembly('GPS/Compass Module Assembly', 'ISR-FC-200', {
    phase: 7, ai_score: 90,
    show_cad: true, cad_type: 'electronics', cad_color: '#8B5CF6',
    children: [
      createSubAssembly('GPS Unit', 'ISR-FC-210', {
        phase: 7, children: [
          createPurchasedPart('GPS M10 Dual-Band Module', 'ISR-FC-211'),
          createComponent('GPS Mast - Carbon Fiber', 'ISR-FC-212', { phase: 7 }),
          createComponent('GPS Ground Plane', 'ISR-FC-213', { phase: 7 })
        ]
      }),
      createSubAssembly('Magnetometer Unit', 'ISR-FC-220', {
        phase: 7, children: [
          createPurchasedPart('Magnetometer QMC5883L', 'ISR-FC-221')
        ]
      })
    ]
  }),
  createAssembly('Barometer Assembly', 'ISR-FC-300', {
    phase: 7, ai_score: 88, children: [
      createPurchasedPart('Barometer DPS310', 'ISR-FC-301'),
      createComponent('Baro Foam Shield', 'ISR-FC-302', { phase: 7 })
    ]
  })
]);

// =============================================================================
// POWER SYSTEM
// =============================================================================

const createPowerSystem = () => createFunctionalSubsystem('Power System', 'ISR-PW', [
  createAssembly('Battery Assembly', 'ISR-PW-100', {
    phase: 7, ai_score: 91,
    show_cad: true, cad_type: 'battery', cad_color: '#EAB308',
    attachments: [
      createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'battery_endurance_test.pdf'),
      createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'battery_thermal_profile.pdf')
    ],
    children: [
      createSubAssembly('Primary Battery Pack', 'ISR-PW-110', {
        phase: 7, ai_score: 92, children: [
          createPurchasedPart('LiPo 6S 1800mAh 100C', 'ISR-PW-111'),
          createComponent('Battery Tray - Quick Release', 'ISR-PW-112', { phase: 7 }),
          createComponent('Battery Strap - Kevlar Reinforced', 'ISR-PW-113', { phase: 7 })
        ]
      }),
      createSubAssembly('Battery Connector Assembly', 'ISR-PW-120', {
        phase: 7, children: [
          createPurchasedPart('XT60H Connector Set', 'ISR-PW-121'),
          createComponent('Anti-Spark Loop', 'ISR-PW-122', { phase: 7 })
        ]
      })
    ]
  }),
  createAssembly('Power Distribution Assembly', 'ISR-PW-200', {
    phase: 7, ai_score: 89,
    show_cad: true, cad_type: 'electronics', cad_color: '#DC2626',
    children: [
      createSubAssembly('PDB Unit', 'ISR-PW-210', {
        phase: 7, children: [
          createPurchasedPart('Power Distribution Board 12S', 'ISR-PW-211'),
          createComponent('PDB Mounting Hardware', 'ISR-PW-212', { phase: 7 })
        ]
      }),
      createSubAssembly('Voltage Regulator Assembly', 'ISR-PW-220', {
        phase: 7, children: [
          createPurchasedPart('BEC 5V 3A Switching', 'ISR-PW-221'),
          createPurchasedPart('BEC 12V 2A Switching', 'ISR-PW-222'),
          createComponent('Regulator Heat Sink Mount', 'ISR-PW-223', { phase: 7 })
        ]
      })
    ]
  }),
  createAssembly('Wire Harness Assembly', 'ISR-PW-300', {
    phase: 7, ai_score: 85, children: [
      createComponent('Main Power Harness', 'ISR-PW-301', { phase: 7 }),
      createComponent('Signal Wire Bundle', 'ISR-PW-302', { phase: 7 }),
      createPurchasedPart('Wire Loom - Abrasion Resistant', 'ISR-PW-303')
    ]
  })
]);

// =============================================================================
// COMMUNICATIONS SYSTEM
// =============================================================================

const createCommunicationsSystem = () => createFunctionalSubsystem('Communications System', 'ISR-CM', [
  createAssembly('Control Link Assembly', 'ISR-CM-100', {
    phase: 7, ai_score: 93,
    show_cad: true, cad_type: 'antenna', cad_color: '#06B6D4',
    attachments: [
      createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'control_link_range_test.pdf'),
      createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'antenna_placement_study.pdf')
    ],
    children: [
      createSubAssembly('Receiver Unit', 'ISR-CM-110', {
        phase: 7, ai_score: 94, children: [
          createPurchasedPart('ELRS 915MHz Receiver', 'ISR-CM-111'),
          createComponent('Receiver Mount - Shielded', 'ISR-CM-112', { phase: 7 }),
          createPurchasedPart('ELRS Antenna Immortal-T', 'ISR-CM-113')
        ]
      }),
      createSubAssembly('Antenna Routing', 'ISR-CM-120', {
        phase: 7, children: [
          createComponent('Antenna Standoff - Composite', 'ISR-CM-121', { phase: 7 }),
          createPurchasedPart('SMA Extension Cable', 'ISR-CM-122')
        ]
      })
    ]
  }),
  createAssembly('Telemetry Assembly', 'ISR-CM-200', {
    phase: 7, ai_score: 88,
    show_cad: true, cad_type: 'electronics', cad_color: '#14B8A6',
    children: [
      createSubAssembly('Telemetry Radio', 'ISR-CM-210', {
        phase: 7, children: [
          createPurchasedPart('Telemetry Module 433MHz', 'ISR-CM-211'),
          createComponent('Telemetry Antenna Mount', 'ISR-CM-212', { phase: 7 })
        ]
      })
    ]
  })
]);

// =============================================================================
// VIDEO / ISR SYSTEM
// =============================================================================

const createVideoISRSystem = () => createFunctionalSubsystem('Video / ISR System', 'ISR-VI', [
  createAssembly('FPV Camera Assembly', 'ISR-VI-100', {
    phase: 7, ai_score: 91,
    show_cad: true, cad_type: 'camera', cad_color: '#7C3AED',
    attachments: [
      createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'video_latency_test.pdf'),
      createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'low_light_evaluation.pdf')
    ],
    children: [
      createSubAssembly('Primary FPV Camera', 'ISR-VI-110', {
        phase: 7, ai_score: 93, children: [
          createPurchasedPart('FPV Camera Micro - Low Light', 'ISR-VI-111'),
          createComponent('Camera Tilt Mount - Adjustable', 'ISR-VI-112', { phase: 7 }),
          createComponent('Camera Vibration Isolator', 'ISR-VI-113', { phase: 7 })
        ]
      })
    ]
  }),
  createAssembly('Video Transmitter Assembly', 'ISR-VI-200', {
    phase: 7, ai_score: 90,
    show_cad: true, cad_type: 'electronics', cad_color: '#A855F7',
    children: [
      createSubAssembly('VTX Unit', 'ISR-VI-210', {
        phase: 7, children: [
          createPurchasedPart('VTX 1.2W 5.8GHz', 'ISR-VI-211'),
          createComponent('VTX Cooling Heat Sink', 'ISR-VI-212', { phase: 7 }),
          createComponent('VTX Mounting Bracket', 'ISR-VI-213', { phase: 7 })
        ]
      }),
      createSubAssembly('Video Antenna Assembly', 'ISR-VI-220', {
        phase: 7, children: [
          createPurchasedPart('Patch Antenna 5.8GHz Directional', 'ISR-VI-221'),
          createPurchasedPart('Omni Antenna 5.8GHz RHCP', 'ISR-VI-222'),
          createComponent('Antenna Quick Disconnect', 'ISR-VI-223', { phase: 7 })
        ]
      })
    ]
  }),
  createAssembly('Recording System Assembly', 'ISR-VI-300', {
    phase: 7, ai_score: 87, children: [
      createSubAssembly('DVR Unit', 'ISR-VI-310', {
        phase: 7, children: [
          createPurchasedPart('Onboard DVR Module', 'ISR-VI-311'),
          createPurchasedPart('MicroSD Card 64GB Industrial', 'ISR-VI-312')
        ]
      })
    ]
  }),
  createAssembly('ISR Payload Camera Assembly', 'ISR-VI-400', {
    phase: 7, ai_score: 89,
    show_cad: true, cad_type: 'camera', cad_color: '#EC4899',
    children: [
      createSubAssembly('HD Recording Camera', 'ISR-VI-410', {
        phase: 7, children: [
          createPurchasedPart('Action Camera 4K Stabilized', 'ISR-VI-411'),
          createComponent('Gimbal Mount - 2-Axis', 'ISR-VI-412', { phase: 7 }),
          createComponent('Camera Quick Release Plate', 'ISR-VI-413', { phase: 7 })
        ]
      })
    ]
  })
]);

// =============================================================================
// NAVIGATION & SENSORS
// =============================================================================

const createNavigationSensorsSystem = () => createFunctionalSubsystem('Navigation & Sensors', 'ISR-NS', [
  createAssembly('Altitude Sensor Assembly', 'ISR-NS-100', {
    phase: 7, ai_score: 88,
    show_cad: true, cad_type: 'electronics', cad_color: '#0EA5E9',
    children: [
      createSubAssembly('Rangefinder Unit', 'ISR-NS-110', {
        phase: 7, children: [
          createPurchasedPart('Laser Rangefinder TFmini-S', 'ISR-NS-111'),
          createComponent('Rangefinder Mount', 'ISR-NS-112', { phase: 7 })
        ]
      }),
      createSubAssembly('Optical Flow Unit', 'ISR-NS-120', {
        phase: 7, children: [
          createPurchasedPart('Optical Flow Sensor PMW3901', 'ISR-NS-121'),
          createComponent('Flow Sensor Mount - Damped', 'ISR-NS-122', { phase: 7 })
        ]
      })
    ]
  }),
  createAssembly('Collision Avoidance Assembly', 'ISR-NS-200', {
    phase: 7, ai_score: 82, children: [
      createSubAssembly('Proximity Sensor Set', 'ISR-NS-210', {
        phase: 7, children: [
          createPurchasedPart('ToF Sensor Front', 'ISR-NS-211'),
          createPurchasedPart('ToF Sensor Rear', 'ISR-NS-212'),
          createComponent('Sensor Mounting Array', 'ISR-NS-213', { phase: 7 })
        ]
      })
    ]
  })
]);

// =============================================================================
// THERMAL / ENVIRONMENTAL PROTECTION
// =============================================================================

const createThermalEnvironmentalSystem = () => createFunctionalSubsystem('Thermal / Environmental Protection', 'ISR-TH', [
  createAssembly('ESC Cooling Assembly', 'ISR-TH-100', {
    phase: 7, ai_score: 87,
    show_cad: true, cad_type: 'component', cad_color: '#F97316',
    attachments: [
      createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'esc_thermal_study.pdf'),
      createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'thermal_endurance_test.pdf')
    ],
    children: [
      createSubAssembly('Active Cooling System', 'ISR-TH-110', {
        phase: 7, children: [
          createPurchasedPart('Cooling Fan 30mm', 'ISR-TH-111'),
          createComponent('Air Duct Assembly', 'ISR-TH-112', { phase: 7 }),
          createComponent('Heat Sink Array', 'ISR-TH-113', { phase: 7 })
        ]
      })
    ]
  }),
  createAssembly('Environmental Sealing Assembly', 'ISR-TH-200', {
    phase: 7, ai_score: 84, children: [
      createSubAssembly('Conformal Coating Set', 'ISR-TH-210', {
        phase: 7, children: [
          createPurchasedPart('Conformal Coating Spray', 'ISR-TH-211'),
          createComponent('Connector Sealing Boots', 'ISR-TH-212', { phase: 7 })
        ]
      }),
      createSubAssembly('Dust Protection', 'ISR-TH-220', {
        phase: 7, children: [
          createComponent('Air Filter - ESC Intake', 'ISR-TH-221', { phase: 7 }),
          createComponent('Dust Shield - Camera', 'ISR-TH-222', { phase: 7 })
        ]
      })
    ]
  }),
  createAssembly('Vibration Isolation Assembly', 'ISR-TH-300', {
    phase: 7, ai_score: 90,
    attachments: [
      createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'vibration_resonance_study.pdf')
    ],
    children: [
      createSubAssembly('FC Damping System', 'ISR-TH-310', {
        phase: 7, children: [
          createPurchasedPart('Silicone Damper Ball Set', 'ISR-TH-311'),
          createComponent('Damper Mounting Plate', 'ISR-TH-312', { phase: 7 })
        ]
      }),
      createSubAssembly('Camera Vibration Isolation', 'ISR-TH-320', {
        phase: 7, children: [
          createPurchasedPart('O-Ring Damper Set', 'ISR-TH-321'),
          createComponent('Camera Isolation Frame', 'ISR-TH-322', { phase: 7 })
        ]
      })
    ]
  })
]);

// =============================================================================
// GROUND CONTROL EQUIPMENT
// =============================================================================

const createGroundControlEquipment = () => createFunctionalSubsystem('Ground Control Equipment', 'ISR-GC', [
  createAssembly('Controller Assembly', 'ISR-GC-100', {
    phase: 7, ai_score: 92,
    show_cad: true, cad_type: 'electronics', cad_color: '#64748B',
    children: [
      createSubAssembly('Radio Controller', 'ISR-GC-110', {
        phase: 7, ai_score: 94, children: [
          createPurchasedPart('Radio TX EdgeTX Compatible', 'ISR-GC-111'),
          createPurchasedPart('ELRS TX Module 915MHz', 'ISR-GC-112'),
          createPurchasedPart('Controller Battery 2S 5000mAh', 'ISR-GC-113')
        ]
      })
    ]
  }),
  createAssembly('Video Receiver Assembly', 'ISR-GC-200', {
    phase: 7, ai_score: 90, children: [
      createSubAssembly('Video RX Unit', 'ISR-GC-210', {
        phase: 7, children: [
          createPurchasedPart('Video RX Diversity 5.8GHz', 'ISR-GC-211'),
          createPurchasedPart('Patch Antenna 5.8GHz', 'ISR-GC-212'),
          createPurchasedPart('Omni Antenna 5.8GHz', 'ISR-GC-213')
        ]
      })
    ]
  }),
  createAssembly('Display Assembly', 'ISR-GC-300', {
    phase: 7, ai_score: 88, children: [
      createSubAssembly('FPV Goggles', 'ISR-GC-310', {
        phase: 7, children: [
          createPurchasedPart('FPV Goggles OLED', 'ISR-GC-311'),
          createPurchasedPart('Goggles Battery 2S', 'ISR-GC-312'),
          createComponent('Goggles Foam Face Plate - Custom', 'ISR-GC-313', { phase: 7 })
        ]
      }),
      createSubAssembly('Ground Station Monitor', 'ISR-GC-320', {
        phase: 7, children: [
          createPurchasedPart('HD Monitor 7" Sunlight Readable', 'ISR-GC-321'),
          createComponent('Monitor Sun Hood', 'ISR-GC-322', { phase: 7 }),
          createComponent('Monitor Mount - Tripod Adapter', 'ISR-GC-323', { phase: 7 })
        ]
      })
    ]
  }),
  createAssembly('Field Kit Assembly', 'ISR-GC-400', {
    phase: 7, ai_score: 86, children: [
      createSubAssembly('Transport Case', 'ISR-GC-410', {
        phase: 7, children: [
          createPurchasedPart('Pelican Case 1560', 'ISR-GC-411'),
          createComponent('Custom Foam Insert', 'ISR-GC-412', { phase: 7 })
        ]
      }),
      createSubAssembly('Field Charging Kit', 'ISR-GC-420', {
        phase: 7, children: [
          createPurchasedPart('Field Charger Dual 6S', 'ISR-GC-421'),
          createPurchasedPart('XT60 Parallel Board', 'ISR-GC-422'),
          createPurchasedPart('Power Supply 24V 600W', 'ISR-GC-423')
        ]
      }),
      createSubAssembly('Spare Parts Kit', 'ISR-GC-430', {
        phase: 7, children: [
          createPurchasedPart('Propeller Spare Set (4)', 'ISR-GC-431'),
          createPurchasedPart('Motor Spare', 'ISR-GC-432'),
          createPurchasedPart('Hardware Kit - Field Repair', 'ISR-GC-433')
        ]
      })
    ]
  })
]);

// =============================================================================
// FIXTURES AND TEST ASSETS
// =============================================================================

const createISRFixtures = () => [
  createManufacturingAsset('Motor Thrust Test Stand', 'ISR-FIX-001', FIXTURE_TYPES.INSPECTION_FIXTURE, ['ISR-PR-110', 'ISR-PR-120', 'ISR-PR-130', 'ISR-PR-140'], {
    phase: 7, ai_score: 95,
    attachments: [createAttachment(ATTACHMENT_TYPES.CAD, 'thrust_test_stand.step')]
  }),
  createManufacturingAsset('Frame Stiffness Test Fixture', 'ISR-FIX-002', FIXTURE_TYPES.INSPECTION_FIXTURE, ['ISR-AF-100'], {
    phase: 7, ai_score: 92
  }),
  createManufacturingAsset('ESC Thermal Test Bench', 'ISR-FIX-003', FIXTURE_TYPES.INSPECTION_FIXTURE, ['ISR-PR-200'], {
    phase: 7, ai_score: 90
  }),
  createManufacturingAsset('Battery Discharge Test Fixture', 'ISR-FIX-004', FIXTURE_TYPES.INSPECTION_FIXTURE, ['ISR-PW-110'], {
    phase: 7, ai_score: 88
  }),
  createManufacturingAsset('Antenna Range Test Setup', 'ISR-FIX-005', FIXTURE_TYPES.INSPECTION_FIXTURE, ['ISR-CM-100', 'ISR-VI-200'], {
    phase: 7, ai_score: 91
  }),
  createManufacturingAsset('Camera Vibration Test Rig', 'ISR-FIX-006', FIXTURE_TYPES.INSPECTION_FIXTURE, ['ISR-VI-100', 'ISR-TH-300'], {
    phase: 7, ai_score: 89
  }),
  createManufacturingAsset('Sensor Calibration Fixture', 'ISR-FIX-007', FIXTURE_TYPES.INSPECTION_FIXTURE, ['ISR-FC-200', 'ISR-NS-100'], {
    phase: 7, ai_score: 93
  })
];

// =============================================================================
// MAIN PROJECT EXPORT
// =============================================================================

export const ISR_DRONE = {
  id: 'isr-drone-2025',
  name: 'Tactical FPV ISR Drone – System Design & Validation',
  description: 'A rugged, field-deployable ISR/reconnaissance FPV drone intended for observation, navigation, and remote situational awareness in harsh environments. Optimized for rapid deployment, stable low-latency video, robust control link, GPS-denied fallback, modular payload mounting, and field maintainability.',
  org_id: 'org-001',
  team: 'ISR Systems',
  mode: PROJECT_MODES.NEW_DESIGN,
  status: PROJECT_STATUS.COMPLETED,
  current_phase: 7,
  target_completion_date: '2025-06-01',
  created_at: '2024-08-01T00:00:00Z',
  updated_at: '2025-02-01T00:00:00Z',
  // Top-level vehicle node
  vehicle: createAssembly('Tactical FPV ISR Drone', 'ISR-DRONE-000', {
    phase: 7, ai_score: 91,
    show_cad: true, cad_type: 'drone', cad_color: '#3B82F6',
    attachments: [
      createAttachment(ATTACHMENT_TYPES.CAD, 'isr_drone_full_assy.step'),
      createAttachment(ATTACHMENT_TYPES.DRAWING, 'DWG-ISR-DRONE-000.pdf'),
      createAttachment(ATTACHMENT_TYPES.REQUIREMENTS, 'vehicle_requirements_spec.pdf')
    ],
    children: [
      createAirframeSystem(),
      createPropulsionSystem(),
      createFlightControlSystem(),
      createPowerSystem(),
      createCommunicationsSystem(),
      createVideoISRSystem(),
      createNavigationSensorsSystem(),
      createThermalEnvironmentalSystem(),
      createGroundControlEquipment()
    ]
  }),
  // Fixtures and test assets
  fixtures: createISRFixtures(),

  // ==========================================================================
  // ENGINEERING SPECIFICATIONS
  // ==========================================================================
  specifications: [
    // ========================================================================
    // VEHICLE-LEVEL SPECIFICATIONS (12 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-VEH-001',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Maximum Takeoff Mass',
      description: 'Total vehicle mass including payload, battery, and all systems at maximum operational configuration.',
      metric: 'Mass',
      target_value: '850',
      units: 'g',
      source: 'Derived from thrust-to-weight requirement (2.0:1 minimum) with available motor/prop combination. 850g AUW allows 1700g thrust margin.',
      test_method: 'Weigh complete vehicle on calibrated scale with all operational components',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-001'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-VEH-002',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Flight Endurance',
      description: 'Continuous flight time at cruise power with standard payload and environmental conditions.',
      metric: 'Duration',
      target_value: '25',
      units: 'min',
      source: 'Calculated from 1800mAh 6S battery at 15A average cruise draw. Field mission profile requires 20+ min with reserve.',
      test_method: 'Timed flight test at cruise throttle until voltage cutoff',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-002'],
      linked_tests: [
        { test_id: 'TST-ISR-VEH-001', name: 'Battery Endurance Validation', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-VEH-003',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Dash Speed',
      description: 'Maximum achievable ground speed in level flight.',
      metric: 'Speed',
      target_value: '120',
      units: 'km/h',
      source: 'Prop pitch and motor KV calculation. 7x3.5 props at 25,000 RPM theoretical max. Limited by FC for stability.',
      test_method: 'GPS-measured maximum speed run in both directions, average',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-003'],
      linked_tests: [
        { test_id: 'TST-ISR-VEH-002', name: 'Full Vehicle Dynamics Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-VEH-004',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Cruise Speed',
      description: 'Optimal ground speed for maximum endurance.',
      metric: 'Speed',
      target_value: '45',
      units: 'km/h',
      source: 'Empirical testing for optimal power-to-distance efficiency. Balances drag and motor efficiency.',
      test_method: 'GPS-measured speed during endurance test',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-VEH-005',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Wind Tolerance',
      description: 'Maximum sustained wind speed for stable operation.',
      metric: 'Speed',
      target_value: '40',
      units: 'km/h',
      source: 'Motor thrust margin analysis. 2:1 T/W ratio provides sufficient authority for 40 km/h gusts.',
      test_method: 'Flight stability test in measured wind conditions',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-005'],
      linked_tests: [
        { test_id: 'TST-ISR-VEH-003', name: 'Wind Tolerance Flight Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-VEH-006',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Operating Temperature Range',
      description: 'Ambient temperature range for safe operation.',
      metric: 'Temperature',
      target_value: '-10 to +45',
      units: '°C',
      source: 'Component derating analysis. LiPo battery and electronics temperature limits with margin.',
      test_method: 'Environmental chamber testing at temperature extremes',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-006'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-VEH-007',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Video Latency',
      description: 'Glass-to-glass video transmission latency.',
      metric: 'Time',
      target_value: '25',
      units: 'ms',
      source: 'Analog video system specification. Critical for FPV control responsiveness.',
      test_method: 'High-speed camera measurement of transmitted signal vs display',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-007'],
      linked_tests: [
        { test_id: 'TST-ISR-VI-001', name: 'Video Latency Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-VEH-008',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Control Link Range',
      description: 'Maximum reliable control link distance.',
      metric: 'Distance',
      target_value: '10',
      units: 'km',
      source: 'ELRS 915MHz specification with proper antenna configuration.',
      test_method: 'Range test with RSSI monitoring and failsafe verification',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-008'],
      linked_tests: [
        { test_id: 'TST-ISR-CM-001', name: 'Communications Range Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-VEH-009',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Field Battery Swap Time',
      description: 'Time to replace battery in field conditions.',
      metric: 'Time',
      target_value: '30',
      units: 'sec',
      source: 'Operational requirement for rapid turnaround between sorties.',
      test_method: 'Timed swap by trained operator',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-009'],
      linked_tests: [
        { test_id: 'TST-ISR-VEH-004', name: 'Field Battery Replacement Timed Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-VEH-010',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Setup-to-Launch Time',
      description: 'Time from case opening to airborne.',
      metric: 'Time',
      target_value: '120',
      units: 'sec',
      source: 'Rapid deployment requirement for time-critical missions.',
      test_method: 'Timed deployment by trained operator',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-010'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-VEH-011',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Vibration Survivability',
      description: 'Withstand vibration profile without damage.',
      metric: 'Acceleration',
      target_value: '5',
      units: 'g RMS',
      source: 'Transport vibration profile plus flight vibration margin.',
      test_method: 'Vibration table test per MIL-STD-810G',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-011'],
      linked_tests: [
        { test_id: 'TST-ISR-AF-001', name: 'Frame Vibration Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-VEH-012',
      level: 'vehicle',
      node_path: 'ISR-DRONE-000',
      owning_node_part_number: 'ISR-DRONE-000',
      title: 'Field Serviceability',
      description: 'All field-replaceable components accessible without special tools.',
      metric: 'Compliance',
      target_value: '100',
      units: '%',
      source: 'Operational requirement for field maintenance with standard toolkit.',
      test_method: 'Component replacement verification with standard tools',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VEH-012'],
      linked_tests: []
    },

    // ========================================================================
    // AIRFRAME SYSTEM SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-AF-001',
      level: 'system',
      node_path: 'ISR-AF',
      owning_node_part_number: 'ISR-AF-100',
      title: 'Frame Torsional Stiffness',
      description: 'Resistance to twisting under asymmetric loading.',
      metric: 'Stiffness',
      target_value: '150',
      units: 'Nm/deg',
      source: 'FEA analysis target for flight stability. Prevents flutter at high speed.',
      test_method: 'Torsion test fixture with dial indicator',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-AF-001'],
      linked_tests: [
        { test_id: 'TST-ISR-AF-002', name: 'Frame Stiffness Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-AF-002',
      level: 'system',
      node_path: 'ISR-AF',
      owning_node_part_number: 'ISR-AF-100',
      title: 'Vibration Attenuation',
      description: 'Motor vibration transmitted to flight controller.',
      metric: 'Attenuation',
      target_value: '-20',
      units: 'dB',
      source: 'FC gyro noise floor requirement. Soft mounting must attenuate motor harmonics.',
      test_method: 'Accelerometer measurement at motor and FC during hover',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-AF-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-AF-003',
      level: 'system',
      node_path: 'ISR-AF',
      owning_node_part_number: 'ISR-AF-200',
      title: 'Payload Mounting Capacity',
      description: 'Maximum payload mass on quick-release mount.',
      metric: 'Mass',
      target_value: '150',
      units: 'g',
      source: 'Derived from CG shift limits and available thrust margin.',
      test_method: 'Static load test of payload mount',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-AF-003'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-AF-004',
      level: 'system',
      node_path: 'ISR-AF',
      owning_node_part_number: 'ISR-AF-100',
      title: 'Field Repair Time - Arm Replacement',
      description: 'Time to replace damaged motor arm in field.',
      metric: 'Time',
      target_value: '5',
      units: 'min',
      source: 'Operational requirement for field maintainability.',
      test_method: 'Timed arm replacement by trained technician',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-AF-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-AF-005',
      level: 'system',
      node_path: 'ISR-AF',
      owning_node_part_number: 'ISR-AF-100',
      title: 'Total Frame Mass',
      description: 'Complete airframe assembly weight without propulsion or electronics.',
      metric: 'Mass',
      target_value: '180',
      units: 'g',
      source: 'Weight budget allocation from vehicle MTOM.',
      test_method: 'Weigh assembled frame on calibrated scale',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: ['REQ-ISR-AF-005'],
      linked_tests: []
    },

    // ========================================================================
    // PROPULSION SYSTEM SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-PR-001',
      level: 'system',
      node_path: 'ISR-PR',
      owning_node_part_number: 'ISR-PR-100',
      title: 'Thrust-to-Weight Ratio',
      description: 'Total static thrust divided by MTOM.',
      metric: 'Ratio',
      target_value: '2.0',
      units: ':1',
      source: 'Minimum for aggressive maneuvering and wind resistance.',
      test_method: 'Thrust stand measurement at full throttle',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-PR-001'],
      linked_tests: [
        { test_id: 'TST-ISR-PR-001', name: 'Propulsion Thrust Stand Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-PR-002',
      level: 'system',
      node_path: 'ISR-PR',
      owning_node_part_number: 'ISR-PR-110',
      title: 'Motor Temperature Limit',
      description: 'Maximum motor winding temperature during sustained operation.',
      metric: 'Temperature',
      target_value: '85',
      units: '°C',
      source: 'Motor manufacturer specification with derating for longevity.',
      test_method: 'Thermocouple measurement during thermal endurance test',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-PR-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-PR-003',
      level: 'system',
      node_path: 'ISR-PR',
      owning_node_part_number: 'ISR-PR-200',
      title: 'ESC Continuous Current Rating',
      description: 'Maximum continuous current per motor channel.',
      metric: 'Current',
      target_value: '40',
      units: 'A',
      source: 'Motor max current plus 20% headroom for transients.',
      test_method: 'Current measurement during full throttle test',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-PR-003'],
      linked_tests: [
        { test_id: 'TST-ISR-PR-002', name: 'ESC Thermal Endurance Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-PR-004',
      level: 'system',
      node_path: 'ISR-PR',
      owning_node_part_number: 'ISR-PR-300',
      title: 'Propeller Efficiency',
      description: 'Thrust per watt at cruise throttle.',
      metric: 'Efficiency',
      target_value: '8.5',
      units: 'g/W',
      source: 'Prop selection trade study optimization.',
      test_method: 'Thrust stand measurement with power meter',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-PR-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-PR-005',
      level: 'system',
      node_path: 'ISR-PR',
      owning_node_part_number: 'ISR-PR-100',
      title: 'Hover Power Draw',
      description: 'Total system power consumption at hover.',
      metric: 'Power',
      target_value: '280',
      units: 'W',
      source: 'Derived from motor efficiency curves and vehicle weight.',
      test_method: 'Power meter measurement during stable hover',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-PR-005'],
      linked_tests: []
    },

    // ========================================================================
    // FLIGHT CONTROL SYSTEM SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-FC-001',
      level: 'system',
      node_path: 'ISR-FC',
      owning_node_part_number: 'ISR-FC-100',
      title: 'Control Loop Rate',
      description: 'PID loop update frequency.',
      metric: 'Frequency',
      target_value: '8000',
      units: 'Hz',
      source: 'FC capability requirement for smooth high-speed control.',
      test_method: 'Blackbox log analysis',
      verification_level: 'analysis',
      status: 'verified',
      linked_requirements: ['REQ-ISR-FC-001'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-FC-002',
      level: 'system',
      node_path: 'ISR-FC',
      owning_node_part_number: 'ISR-FC-100',
      title: 'Attitude Stabilization Accuracy',
      description: 'Steady-state angle hold accuracy.',
      metric: 'Angle',
      target_value: '0.5',
      units: 'deg',
      source: 'Required for stable video capture.',
      test_method: 'Accelerometer comparison during hover',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-FC-002'],
      linked_tests: [
        { test_id: 'TST-ISR-FC-001', name: 'Flight Stability Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-FC-003',
      level: 'system',
      node_path: 'ISR-FC',
      owning_node_part_number: 'ISR-FC-120',
      title: 'IMU Drift Rate',
      description: 'Gyroscope drift during GPS-denied operation.',
      metric: 'Drift',
      target_value: '0.5',
      units: 'deg/min',
      source: 'Critical for GPS-denied position hold.',
      test_method: 'Static IMU test over 10 minute period',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-FC-003'],
      linked_tests: [
        { test_id: 'TST-ISR-FC-002', name: 'GPS-Denied Stabilization Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-FC-004',
      level: 'system',
      node_path: 'ISR-FC',
      owning_node_part_number: 'ISR-FC-100',
      title: 'Failsafe Recovery Time',
      description: 'Time to initiate return-to-home after link loss.',
      metric: 'Time',
      target_value: '1.0',
      units: 'sec',
      source: 'Safety requirement to prevent flyaway.',
      test_method: 'Failsafe test with deliberate link interruption',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-FC-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-FC-005',
      level: 'system',
      node_path: 'ISR-FC',
      owning_node_part_number: 'ISR-FC-100',
      title: 'Boot-to-Ready Time',
      description: 'Time from power-on to flight-ready state.',
      metric: 'Time',
      target_value: '15',
      units: 'sec',
      source: 'Rapid deployment requirement.',
      test_method: 'Timed measurement from power on to arming available',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-FC-005'],
      linked_tests: []
    },

    // ========================================================================
    // POWER SYSTEM SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-PW-001',
      level: 'system',
      node_path: 'ISR-PW',
      owning_node_part_number: 'ISR-PW-110',
      title: 'Battery Capacity',
      description: 'Usable battery capacity.',
      metric: 'Capacity',
      target_value: '1800',
      units: 'mAh',
      source: 'Endurance requirement with weight constraint.',
      test_method: 'Discharge test at 1C rate',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-PW-001'],
      linked_tests: [
        { test_id: 'TST-ISR-PW-001', name: 'Battery Endurance Validation', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-PW-002',
      level: 'system',
      node_path: 'ISR-PW',
      owning_node_part_number: 'ISR-PW-110',
      title: 'Voltage Sag Under Load',
      description: 'Maximum voltage drop at full throttle.',
      metric: 'Voltage',
      target_value: '2.0',
      units: 'V',
      source: 'ESC brown-out prevention margin.',
      test_method: 'Voltage measurement during full throttle burst',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-PW-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-PW-003',
      level: 'system',
      node_path: 'ISR-PW',
      owning_node_part_number: 'ISR-PW-120',
      title: 'Connector Temperature Rise',
      description: 'Maximum temperature increase at main connector.',
      metric: 'Temperature',
      target_value: '20',
      units: '°C',
      source: 'Connector current derating curve.',
      test_method: 'Thermocouple on connector during sustained load',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-PW-003'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-PW-004',
      level: 'system',
      node_path: 'ISR-PW',
      owning_node_part_number: 'ISR-PW-220',
      title: 'BEC Ripple Voltage',
      description: 'Peak-to-peak ripple on 5V rail.',
      metric: 'Voltage',
      target_value: '50',
      units: 'mVpp',
      source: 'Video system noise immunity requirement.',
      test_method: 'Oscilloscope measurement under load',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-PW-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-PW-005',
      level: 'system',
      node_path: 'ISR-PW',
      owning_node_part_number: 'ISR-PW-100',
      title: 'Battery Swap Time',
      description: 'Field battery replacement time.',
      metric: 'Time',
      target_value: '30',
      units: 'sec',
      source: 'Rapid turnaround operational requirement.',
      test_method: 'Timed replacement by trained operator',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-PW-005'],
      linked_tests: []
    },

    // ========================================================================
    // COMMUNICATIONS SYSTEM SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-CM-001',
      level: 'system',
      node_path: 'ISR-CM',
      owning_node_part_number: 'ISR-CM-100',
      title: 'Control Link Range',
      description: 'Maximum reliable bidirectional control range.',
      metric: 'Distance',
      target_value: '10',
      units: 'km',
      source: 'ELRS 915MHz specification with optimized antennas.',
      test_method: 'Range test with RSSI logging',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-CM-001'],
      linked_tests: [
        { test_id: 'TST-ISR-CM-001', name: 'Communications Range Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-CM-002',
      level: 'system',
      node_path: 'ISR-CM',
      owning_node_part_number: 'ISR-CM-100',
      title: 'Control Link Latency',
      description: 'Stick input to motor response time.',
      metric: 'Time',
      target_value: '5',
      units: 'ms',
      source: 'ELRS 500Hz mode specification.',
      test_method: 'High-speed camera analysis of input to response',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-CM-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-CM-003',
      level: 'system',
      node_path: 'ISR-CM',
      owning_node_part_number: 'ISR-CM-100',
      title: 'Packet Loss Threshold',
      description: 'Maximum acceptable packet loss for stable control.',
      metric: 'Rate',
      target_value: '1',
      units: '%',
      source: 'ELRS specification with redundancy.',
      test_method: 'Telemetry analysis during range test',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-CM-003'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-CM-004',
      level: 'system',
      node_path: 'ISR-CM',
      owning_node_part_number: 'ISR-CM-110',
      title: 'Antenna Durability',
      description: 'Antenna survival after drop impact.',
      metric: 'Compliance',
      target_value: '100',
      units: '%',
      source: 'Field durability requirement.',
      test_method: '1.5m drop test onto concrete',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-CM-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-CM-005',
      level: 'system',
      node_path: 'ISR-CM',
      owning_node_part_number: 'ISR-CM-100',
      title: 'Link Reconnect Time',
      description: 'Time to re-establish link after momentary loss.',
      metric: 'Time',
      target_value: '500',
      units: 'ms',
      source: 'ELRS fast reconnect specification.',
      test_method: 'Deliberate signal interrupt and recovery timing',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-CM-005'],
      linked_tests: []
    },

    // ========================================================================
    // VIDEO / ISR SYSTEM SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-VI-001',
      level: 'system',
      node_path: 'ISR-VI',
      owning_node_part_number: 'ISR-VI-100',
      title: 'Video Latency',
      description: 'Glass-to-glass video delay.',
      metric: 'Time',
      target_value: '25',
      units: 'ms',
      source: 'Analog video chain specification.',
      test_method: 'High-speed camera measurement',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VI-001'],
      linked_tests: [
        { test_id: 'TST-ISR-VI-001', name: 'Video Latency Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-VI-002',
      level: 'system',
      node_path: 'ISR-VI',
      owning_node_part_number: 'ISR-VI-110',
      title: 'Camera Resolution',
      description: 'FPV camera horizontal resolution.',
      metric: 'Resolution',
      target_value: '1200',
      units: 'TVL',
      source: 'Image quality for object recognition.',
      test_method: 'Resolution chart measurement',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VI-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-VI-003',
      level: 'system',
      node_path: 'ISR-VI',
      owning_node_part_number: 'ISR-VI-110',
      title: 'Low-Light Sensitivity',
      description: 'Minimum illumination for usable video.',
      metric: 'Illuminance',
      target_value: '0.01',
      units: 'lux',
      source: 'Dawn/dusk and indoor operation requirement.',
      test_method: 'Light meter verification at minimum usable image',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VI-003'],
      linked_tests: [
        { test_id: 'TST-ISR-VI-002', name: 'Low-Light Camera Evaluation', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-VI-004',
      level: 'system',
      node_path: 'ISR-VI',
      owning_node_part_number: 'ISR-VI-300',
      title: 'DVR Recording Duration',
      description: 'Continuous recording time on 64GB card.',
      metric: 'Duration',
      target_value: '120',
      units: 'min',
      source: 'Mission recording requirement.',
      test_method: 'Recording until card full',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VI-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-VI-005',
      level: 'system',
      node_path: 'ISR-VI',
      owning_node_part_number: 'ISR-VI-200',
      title: 'Video Link Range',
      description: 'Maximum range with acceptable video quality.',
      metric: 'Distance',
      target_value: '3',
      units: 'km',
      source: 'Analog 5.8GHz with 1.2W VTX specification.',
      test_method: 'Range test with video quality assessment',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-VI-005'],
      linked_tests: []
    },

    // ========================================================================
    // NAVIGATION & SENSORS SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-NS-001',
      level: 'system',
      node_path: 'ISR-NS',
      owning_node_part_number: 'ISR-FC-210',
      title: 'GPS Acquisition Time',
      description: 'Time to first fix (cold start).',
      metric: 'Time',
      target_value: '30',
      units: 'sec',
      source: 'M10 GPS module specification.',
      test_method: 'Timed acquisition in open sky',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-NS-001'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-NS-002',
      level: 'system',
      node_path: 'ISR-NS',
      owning_node_part_number: 'ISR-NS-100',
      title: 'Altitude Hold Accuracy',
      description: 'Vertical position hold tolerance.',
      metric: 'Distance',
      target_value: '0.5',
      units: 'm',
      source: 'Barometer/rangefinder fusion performance.',
      test_method: 'Hover altitude measurement over 5 minutes',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-NS-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-NS-003',
      level: 'system',
      node_path: 'ISR-NS',
      owning_node_part_number: 'ISR-FC-220',
      title: 'Heading Accuracy',
      description: 'Compass heading accuracy.',
      metric: 'Angle',
      target_value: '3',
      units: 'deg',
      source: 'Magnetometer specification after calibration.',
      test_method: 'Heading comparison to reference compass',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-NS-003'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-NS-004',
      level: 'system',
      node_path: 'ISR-NS',
      owning_node_part_number: 'ISR-FC-300',
      title: 'Barometric Stability',
      description: 'Barometer drift during flight.',
      metric: 'Drift',
      target_value: '1',
      units: 'm/hr',
      source: 'DPS310 specification with thermal compensation.',
      test_method: 'Static altitude log over 1 hour',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-NS-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-NS-005',
      level: 'system',
      node_path: 'ISR-NS',
      owning_node_part_number: 'ISR-FC-100',
      title: 'Calibration Retention',
      description: 'Sensor calibration retention after power cycle.',
      metric: 'Compliance',
      target_value: '100',
      units: '%',
      source: 'FC flash storage reliability.',
      test_method: 'Power cycle and calibration verification',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-NS-005'],
      linked_tests: []
    },

    // ========================================================================
    // THERMAL / ENVIRONMENTAL SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-TH-001',
      level: 'system',
      node_path: 'ISR-TH',
      owning_node_part_number: 'ISR-PR-200',
      title: 'ESC Temperature - Sustained Load',
      description: 'ESC FET temperature during continuous hover.',
      metric: 'Temperature',
      target_value: '75',
      units: '°C',
      source: 'ESC thermal derating with 85°C limit.',
      test_method: 'IR thermometer during 10 min hover',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-TH-001'],
      linked_tests: [
        { test_id: 'TST-ISR-PR-002', name: 'ESC Thermal Endurance Test', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-TH-002',
      level: 'system',
      node_path: 'ISR-TH',
      owning_node_part_number: 'ISR-AF-220',
      title: 'Enclosure Temperature Rise',
      description: 'Internal temperature increase above ambient.',
      metric: 'Temperature',
      target_value: '15',
      units: '°C',
      source: 'Electronics thermal margin.',
      test_method: 'Thermocouple measurement during flight',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-TH-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-TH-003',
      level: 'system',
      node_path: 'ISR-TH',
      owning_node_part_number: 'ISR-TH-200',
      title: 'Dust Ingress Resistance',
      description: 'IP rating for dust protection.',
      metric: 'Rating',
      target_value: 'IP5X',
      units: '',
      source: 'Field environment exposure requirement.',
      test_method: 'Dust chamber test per IEC 60529',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-TH-003'],
      linked_tests: [
        { test_id: 'TST-ISR-TH-001', name: 'Dust / Environmental Exposure Inspection', status: 'passed', type: 'current' }
      ]
    },
    {
      spec_id: 'SPEC-ISR-TH-004',
      level: 'system',
      node_path: 'ISR-TH',
      owning_node_part_number: 'ISR-TH-200',
      title: 'Rain Splash Tolerance',
      description: 'Water resistance rating.',
      metric: 'Rating',
      target_value: 'IPX4',
      units: '',
      source: 'Light rain operation requirement.',
      test_method: 'Spray test per IEC 60529',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-TH-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-TH-005',
      level: 'system',
      node_path: 'ISR-TH',
      owning_node_part_number: 'ISR-TH-300',
      title: 'Vibration Isolation Effectiveness',
      description: 'FC vibration level during flight.',
      metric: 'Vibration',
      target_value: '10',
      units: 'm/s² RMS',
      source: 'Gyro noise floor requirement.',
      test_method: 'Blackbox gyro noise analysis',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-TH-005'],
      linked_tests: []
    },

    // ========================================================================
    // GROUND CONTROL EQUIPMENT SPECIFICATIONS (5 specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-GC-001',
      level: 'system',
      node_path: 'ISR-GC',
      owning_node_part_number: 'ISR-GC-400',
      title: 'Station Setup Time',
      description: 'Time to deploy ground station from transport.',
      metric: 'Time',
      target_value: '60',
      units: 'sec',
      source: 'Rapid deployment requirement.',
      test_method: 'Timed setup by trained operator',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-GC-001'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-GC-002',
      level: 'system',
      node_path: 'ISR-GC',
      owning_node_part_number: 'ISR-GC-320',
      title: 'Display Visibility',
      description: 'Monitor readable in direct sunlight.',
      metric: 'Brightness',
      target_value: '1000',
      units: 'nits',
      source: 'Outdoor operation requirement.',
      test_method: 'Luminance meter measurement',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: ['REQ-ISR-GC-002'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-GC-003',
      level: 'system',
      node_path: 'ISR-GC',
      owning_node_part_number: 'ISR-GC-110',
      title: 'Controller Battery Runtime',
      description: 'Transmitter operation time on full charge.',
      metric: 'Duration',
      target_value: '8',
      units: 'hours',
      source: 'Full day operation without charging.',
      test_method: 'Continuous operation until low battery',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: ['REQ-ISR-GC-003'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-GC-004',
      level: 'system',
      node_path: 'ISR-GC',
      owning_node_part_number: 'ISR-GC-310',
      title: 'Goggles Recording Duration',
      description: 'DVR recording time in goggles.',
      metric: 'Duration',
      target_value: '60',
      units: 'min',
      source: 'Mission debrief recording.',
      test_method: 'Recording until storage full',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-GC-004'],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-GC-005',
      level: 'system',
      node_path: 'ISR-GC',
      owning_node_part_number: 'ISR-GC-410',
      title: 'Transport Case Size',
      description: 'Fits in standard vehicle trunk.',
      metric: 'Compliance',
      target_value: '100',
      units: '%',
      source: 'Vehicle transport requirement.',
      test_method: 'Fit check in reference vehicle',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: ['REQ-ISR-GC-005'],
      linked_tests: []
    },

    // ========================================================================
    // COMPONENT-LEVEL SPECIFICATIONS (25+ specs)
    // ========================================================================
    {
      spec_id: 'SPEC-ISR-C001',
      level: 'component',
      node_path: 'ISR-PR-111',
      owning_node_part_number: 'ISR-PR-111',
      title: 'Motor Shaft Diameter',
      description: 'Motor output shaft diameter for propeller mounting.',
      metric: 'Diameter',
      target_value: '5',
      units: 'mm',
      source: 'Standard M5 propeller bore.',
      test_method: 'Caliper measurement',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C002',
      level: 'component',
      node_path: 'ISR-PR-111',
      owning_node_part_number: 'ISR-PR-111',
      title: 'Motor Bearing Load Rating',
      description: 'Radial load capacity of motor bearings.',
      metric: 'Load',
      target_value: '50',
      units: 'N',
      source: 'Thrust loading plus safety factor.',
      test_method: 'Manufacturer specification verification',
      verification_level: 'analysis',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C003',
      level: 'component',
      node_path: 'ISR-FC-111',
      owning_node_part_number: 'ISR-FC-111',
      title: 'FC PCB Mounting Hole Pattern',
      description: 'Standard mounting hole spacing.',
      metric: 'Dimension',
      target_value: '30.5',
      units: 'mm',
      source: 'Standard 30.5x30.5mm pattern.',
      test_method: 'Dimensional inspection',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C004',
      level: 'component',
      node_path: 'ISR-CM-113',
      owning_node_part_number: 'ISR-CM-113',
      title: 'Antenna Connector Retention Force',
      description: 'SMA connector pull-out resistance.',
      metric: 'Force',
      target_value: '30',
      units: 'N',
      source: 'Vibration and handling requirement.',
      test_method: 'Pull test on connector',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C005',
      level: 'component',
      node_path: 'ISR-VI-113',
      owning_node_part_number: 'ISR-VI-113',
      title: 'Camera Mount Vibration Isolation',
      description: 'Camera isolator stiffness.',
      metric: 'Stiffness',
      target_value: '50',
      units: 'N/mm',
      source: 'Jello elimination frequency calculation.',
      test_method: 'Force-displacement measurement',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C006',
      level: 'component',
      node_path: 'ISR-PW-121',
      owning_node_part_number: 'ISR-PW-121',
      title: 'Battery Connector Current Rating',
      description: 'XT60 continuous current capacity.',
      metric: 'Current',
      target_value: '60',
      units: 'A',
      source: 'Connector manufacturer specification.',
      test_method: 'Temperature rise test at rated current',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C007',
      level: 'component',
      node_path: 'ISR-AF-121',
      owning_node_part_number: 'ISR-AF-121',
      title: 'Carbon Arm Wall Thickness',
      description: 'Carbon fiber tube wall thickness.',
      metric: 'Dimension',
      target_value: '1.5',
      units: 'mm',
      source: 'Structural analysis for impact resistance.',
      test_method: 'Micrometer measurement',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C008',
      level: 'component',
      node_path: 'ISR-PR-212',
      owning_node_part_number: 'ISR-PR-212',
      title: 'ESC Heat Sink Thermal Conductivity',
      description: 'Heat sink material thermal performance.',
      metric: 'Conductivity',
      target_value: '200',
      units: 'W/m·K',
      source: 'Thermal analysis requirement.',
      test_method: 'Material specification verification',
      verification_level: 'analysis',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C009',
      level: 'component',
      node_path: 'ISR-TH-212',
      owning_node_part_number: 'ISR-TH-212',
      title: 'Connector Boot Seal Compression',
      description: 'Gasket compression for water seal.',
      metric: 'Compression',
      target_value: '25',
      units: '%',
      source: 'Seal manufacturer recommendation.',
      test_method: 'Compression measurement',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C010',
      level: 'component',
      node_path: 'ISR-TH-113',
      owning_node_part_number: 'ISR-TH-113',
      title: 'Heat Sink Mounting Torque',
      description: 'Fastener torque for thermal contact.',
      metric: 'Torque',
      target_value: '0.5',
      units: 'Nm',
      source: 'Thermal interface material specification.',
      test_method: 'Torque wrench verification',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C011',
      level: 'component',
      node_path: 'ISR-AF-111',
      owning_node_part_number: 'ISR-AF-111',
      title: 'Top Plate Thickness',
      description: 'Carbon fiber top plate thickness.',
      metric: 'Dimension',
      target_value: '2.0',
      units: 'mm',
      source: 'Structural analysis.',
      test_method: 'Micrometer measurement',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C012',
      level: 'component',
      node_path: 'ISR-AF-113',
      owning_node_part_number: 'ISR-AF-113',
      title: 'Standoff Thread Specification',
      description: 'Standoff thread size and pitch.',
      metric: 'Thread',
      target_value: 'M3x0.5',
      units: '',
      source: 'Standard hardware compatibility.',
      test_method: 'Thread gauge verification',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C013',
      level: 'component',
      node_path: 'ISR-PR-311',
      owning_node_part_number: 'ISR-PR-311',
      title: 'Propeller Pitch',
      description: 'Propeller pitch specification.',
      metric: 'Pitch',
      target_value: '3.5',
      units: 'in',
      source: 'Efficiency optimization study.',
      test_method: 'Manufacturer specification',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C014',
      level: 'component',
      node_path: 'ISR-PR-311',
      owning_node_part_number: 'ISR-PR-311',
      title: 'Propeller Diameter',
      description: 'Propeller diameter specification.',
      metric: 'Diameter',
      target_value: '7',
      units: 'in',
      source: 'Frame arm length constraint.',
      test_method: 'Measurement',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C015',
      level: 'component',
      node_path: 'ISR-PW-111',
      owning_node_part_number: 'ISR-PW-111',
      title: 'Battery Cell Configuration',
      description: 'LiPo cell count.',
      metric: 'Configuration',
      target_value: '6S',
      units: '',
      source: 'ESC and motor voltage compatibility.',
      test_method: 'Cell count verification',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C016',
      level: 'component',
      node_path: 'ISR-PW-111',
      owning_node_part_number: 'ISR-PW-111',
      title: 'Battery C-Rating',
      description: 'Continuous discharge rate.',
      metric: 'Rate',
      target_value: '100',
      units: 'C',
      source: 'Current draw requirement with margin.',
      test_method: 'Manufacturer specification',
      verification_level: 'analysis',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C017',
      level: 'component',
      node_path: 'ISR-VI-211',
      owning_node_part_number: 'ISR-VI-211',
      title: 'VTX Output Power',
      description: 'Video transmitter RF power.',
      metric: 'Power',
      target_value: '1200',
      units: 'mW',
      source: 'Range requirement.',
      test_method: 'RF power meter measurement',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C018',
      level: 'component',
      node_path: 'ISR-FC-211',
      owning_node_part_number: 'ISR-FC-211',
      title: 'GPS Position Accuracy',
      description: 'Horizontal position accuracy (CEP).',
      metric: 'Accuracy',
      target_value: '1.5',
      units: 'm',
      source: 'M10 GPS specification.',
      test_method: 'Static position test vs survey point',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C019',
      level: 'component',
      node_path: 'ISR-NS-111',
      owning_node_part_number: 'ISR-NS-111',
      title: 'Rangefinder Max Range',
      description: 'Laser rangefinder maximum distance.',
      metric: 'Distance',
      target_value: '12',
      units: 'm',
      source: 'TFmini-S specification.',
      test_method: 'Range measurement at maximum distance',
      verification_level: 'test',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C020',
      level: 'component',
      node_path: 'ISR-VI-111',
      owning_node_part_number: 'ISR-VI-111',
      title: 'Camera FOV',
      description: 'Camera horizontal field of view.',
      metric: 'Angle',
      target_value: '155',
      units: 'deg',
      source: 'Wide-angle for situational awareness.',
      test_method: 'FOV chart measurement',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C021',
      level: 'component',
      node_path: 'ISR-GC-111',
      owning_node_part_number: 'ISR-GC-111',
      title: 'Transmitter Channel Count',
      description: 'Number of control channels.',
      metric: 'Count',
      target_value: '16',
      units: 'channels',
      source: 'Function assignment requirement.',
      test_method: 'Configuration verification',
      verification_level: 'demonstration',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C022',
      level: 'component',
      node_path: 'ISR-AF-161',
      owning_node_part_number: 'ISR-AF-161',
      title: 'Landing Leg Height',
      description: 'Ground clearance with landing gear.',
      metric: 'Height',
      target_value: '50',
      units: 'mm',
      source: 'Payload clearance requirement.',
      test_method: 'Height measurement',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C023',
      level: 'component',
      node_path: 'ISR-AF-162',
      owning_node_part_number: 'ISR-AF-162',
      title: 'Landing Foot Hardness',
      description: 'TPU landing foot durometer.',
      metric: 'Hardness',
      target_value: '95',
      units: 'Shore A',
      source: 'Impact absorption vs durability.',
      test_method: 'Durometer measurement',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C024',
      level: 'component',
      node_path: 'ISR-GC-411',
      owning_node_part_number: 'ISR-GC-411',
      title: 'Transport Case Internal Dimensions',
      description: 'Usable interior dimensions.',
      metric: 'Dimensions',
      target_value: '518 x 392 x 202',
      units: 'mm',
      source: 'Pelican 1560 specification.',
      test_method: 'Dimensional verification',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    },
    {
      spec_id: 'SPEC-ISR-C025',
      level: 'component',
      node_path: 'ISR-TH-311',
      owning_node_part_number: 'ISR-TH-311',
      title: 'Damper Ball Durometer',
      description: 'Silicone damper hardness.',
      metric: 'Hardness',
      target_value: '40',
      units: 'Shore A',
      source: 'Vibration isolation frequency calculation.',
      test_method: 'Durometer measurement',
      verification_level: 'inspection',
      status: 'verified',
      linked_requirements: [],
      linked_tests: []
    }
  ],

  // ==========================================================================
  // ENGINEERING STUDIES
  // ==========================================================================
  engineering_studies: [
    // Motor / Propeller Trade Study
    createEngineeringStudy('Motor / Propeller Trade Study', 'STD-ISR-PR-001', STUDY_TYPES.TRADE_STUDY, STUDY_INTENTS.OPTIMIZATION, 'ISR-PR-100', {
      owning_node_part_number: 'ISR-PR-100',
      phase_contexts: ['2', '3'],
      status: 'complete',
      alternatives: ['2806.5 1300KV + 7x3.5', '2806.5 1500KV + 6x3', '2807 1100KV + 7x4', '2806 1700KV + 6x2.5'],
      criteria: ['Thrust efficiency (g/W)', 'Max thrust', 'Noise level', 'Motor temperature', 'Weight'],
      weights: [0.30, 0.25, 0.15, 0.15, 0.15],
      linked_requirements: ['REQ-ISR-PR-001', 'REQ-ISR-PR-004'],
      results_summary: '2806.5 1300KV + 7x3.5 selected: best efficiency at 8.5 g/W, adequate thrust margin, acceptable noise. 1500KV option had higher thrust but worse efficiency.',
      attachments: [createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'motor_prop_trade_study.pdf')]
    }),
    
    // Battery Endurance Trade Study
    createEngineeringStudy('Battery Endurance Trade Study', 'STD-ISR-PW-001', STUDY_TYPES.TRADE_STUDY, STUDY_INTENTS.OPTIMIZATION, 'ISR-PW-100', {
      owning_node_part_number: 'ISR-PW-100',
      phase_contexts: ['2', '3'],
      status: 'complete',
      alternatives: ['6S 1300mAh 100C', '6S 1550mAh 100C', '6S 1800mAh 100C', '6S 2200mAh 75C'],
      criteria: ['Flight time', 'Weight penalty', 'Power handling', 'Pack dimensions'],
      weights: [0.35, 0.30, 0.20, 0.15],
      linked_requirements: ['REQ-ISR-VEH-002', 'REQ-ISR-PW-001'],
      results_summary: '6S 1800mAh 100C selected: optimal balance of 25 min endurance at 185g. 2200mAh provided only 3 min additional flight time but added 45g.',
      attachments: [createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'battery_trade_study.pdf')]
    }),
    
    // Control Link Antenna Placement Study
    createEngineeringStudy('Control Link Antenna Placement Study', 'STD-ISR-CM-001', STUDY_TYPES.PARAMETRIC, STUDY_INTENTS.OPTIMIZATION, 'ISR-CM-100', {
      owning_node_part_number: 'ISR-CM-100',
      phase_contexts: ['3', '4'],
      status: 'complete',
      parameter: 'Antenna position and orientation',
      range: '5 mounting positions tested',
      step_count: 5,
      linked_requirements: ['REQ-ISR-CM-001', 'REQ-ISR-CM-003'],
      results_summary: 'Rear-facing immortal-T on 45° standoff provides best omnidirectional coverage. Front-facing position showed 6dB null at 180° heading. Carbon frame causes 2-3dB attenuation when antenna is parallel to arms.',
      attachments: [createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'antenna_placement_study.pdf')]
    }),
    
    // Video Antenna Placement Study
    createEngineeringStudy('Video Antenna Placement Study', 'STD-ISR-VI-001', STUDY_TYPES.PARAMETRIC, STUDY_INTENTS.OPTIMIZATION, 'ISR-VI-200', {
      owning_node_part_number: 'ISR-VI-200',
      phase_contexts: ['3', '4'],
      status: 'complete',
      parameter: 'VTX antenna position and type',
      range: 'Patch vs omni, 4 positions',
      step_count: 8,
      linked_requirements: ['REQ-ISR-VI-005'],
      results_summary: 'Combination of rear-mounted patch (primary) + omni (backup) provides best coverage. Patch provides +6dBi gain forward. Omni covers rear sector when banking.',
      attachments: [createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'video_antenna_study.pdf')]
    }),
    
    // Frame Vibration / Resonance Study
    createEngineeringStudy('Frame Vibration / Resonance Study', 'STD-ISR-AF-001', STUDY_TYPES.DOE, STUDY_INTENTS.VALIDATION, 'ISR-AF-100', {
      owning_node_part_number: 'ISR-AF-100',
      phase_contexts: ['4', '5'],
      status: 'complete',
      factors: ['Arm length', 'Plate thickness', 'Standoff material'],
      responses: ['First resonance frequency', 'FC gyro noise', 'Video jello'],
      design_type: 'Fractional factorial 2^3-1',
      run_count: 4,
      linked_requirements: ['REQ-ISR-AF-001', 'REQ-ISR-AF-002'],
      results_summary: 'First resonance at 245 Hz well above motor operating range (max 150 Hz at full throttle). 2mm top plate + aluminum standoffs optimal. 1.5mm plate showed resonance at 180 Hz.',
      attachments: [createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'vibration_resonance_study.pdf')]
    }),
    
    // Thermal Study - ESC and VTX Cooling
    createEngineeringStudy('Thermal Study - ESC and VTX Cooling', 'STD-ISR-TH-001', STUDY_TYPES.PARAMETRIC, STUDY_INTENTS.VALIDATION, 'ISR-TH-100', {
      owning_node_part_number: 'ISR-TH-100',
      phase_contexts: ['4', '5'],
      status: 'complete',
      parameter: 'Cooling configuration',
      range: 'Passive vs 30mm fan, heat sink sizes',
      step_count: 6,
      linked_requirements: ['REQ-ISR-TH-001', 'REQ-ISR-PR-002'],
      results_summary: '30mm fan with ducted airflow reduces ESC temp by 18°C vs passive. VTX requires dedicated 15x15mm heat sink - temperature dropped from 92°C to 68°C. Active cooling mandatory for sustained operation >10 min.',
      attachments: [createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'thermal_study_report.pdf')]
    }),
    
    // Sensor Placement Study
    createEngineeringStudy('Sensor Placement Study', 'STD-ISR-NS-001', STUDY_TYPES.PARAMETRIC, STUDY_INTENTS.OPTIMIZATION, 'ISR-NS-100', {
      owning_node_part_number: 'ISR-NS-100',
      phase_contexts: ['3'],
      status: 'complete',
      parameter: 'Sensor mounting positions',
      range: 'GPS mast height, magnetometer distance from motors',
      step_count: 4,
      linked_requirements: ['REQ-ISR-NS-001', 'REQ-ISR-NS-003'],
      results_summary: 'GPS requires minimum 30mm mast height for clear sky view. Magnetometer must be >50mm from motor wires to avoid interference. Current placement achieves <3° heading error.',
      attachments: [createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'sensor_placement_study.pdf')]
    }),
    
    // Ground Station Ergonomics Study
    createEngineeringStudy('Ground Station Ergonomics Study', 'STD-ISR-GC-001', STUDY_TYPES.TRADE_STUDY, STUDY_INTENTS.RESEARCH, 'ISR-GC-400', {
      owning_node_part_number: 'ISR-GC-400',
      phase_contexts: ['2', '3'],
      status: 'complete',
      alternatives: ['Goggles only', 'Monitor only', 'Goggles + monitor', 'Tablet-based'],
      criteria: ['Situational awareness', 'Portability', 'Battery life', 'Sunlight visibility'],
      weights: [0.30, 0.25, 0.25, 0.20],
      linked_requirements: ['REQ-ISR-GC-001', 'REQ-ISR-GC-002'],
      results_summary: 'Goggles + monitor selected: goggles for primary pilot, sunlight-readable monitor for spotter/mission commander. Tablet rejected due to latency concerns.',
      attachments: [createAttachment(ATTACHMENT_TYPES.ANALYSIS, 'ground_station_ergonomics.pdf')]
    })
  ],

  // ==========================================================================
  // TEST CASES
  // ==========================================================================
  test_cases: [
    // Airframe Tests
    createTestCase('Frame Vibration Test', 'TST-ISR-AF-001', TEST_LEVELS.SYSTEM, 'ISR-AF-100', {
      owning_node_part_number: 'ISR-AF-100',
      status: 'passed',
      scheduled_date: '2025-01-10',
      executed_date: '2025-01-10',
      acceptance_criteria: 'Survive 5g RMS vibration profile without damage',
      result: 'Passed - no structural damage, all fasteners retained torque',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-AF-001', 'REQ-ISR-VEH-011'],
      test_fixture_id: 'ISR-FIX-002',
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'frame_vibration_test_report.pdf')]
    }),
    createTestCase('Frame Stiffness Test', 'TST-ISR-AF-002', TEST_LEVELS.SYSTEM, 'ISR-AF-100', {
      owning_node_part_number: 'ISR-AF-100',
      status: 'passed',
      scheduled_date: '2025-01-08',
      executed_date: '2025-01-08',
      acceptance_criteria: 'Torsional stiffness > 150 Nm/deg',
      result: '168 Nm/deg measured',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-AF-001'],
      test_fixture_id: 'ISR-FIX-002'
    }),
    
    // Propulsion Tests
    createTestCase('Propulsion Thrust Stand Test', 'TST-ISR-PR-001', TEST_LEVELS.SYSTEM, 'ISR-PR-100', {
      owning_node_part_number: 'ISR-PR-100',
      status: 'passed',
      scheduled_date: '2025-01-05',
      executed_date: '2025-01-05',
      acceptance_criteria: 'Total thrust > 1700g (2:1 T/W ratio at 850g AUW)',
      result: '1840g total thrust measured, 2.16:1 T/W achieved',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-PR-001'],
      test_fixture_id: 'ISR-FIX-001',
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'thrust_stand_test_report.pdf')]
    }),
    createTestCase('ESC Thermal Endurance Test', 'TST-ISR-PR-002', TEST_LEVELS.SYSTEM, 'ISR-PR-200', {
      owning_node_part_number: 'ISR-PR-200',
      status: 'passed',
      scheduled_date: '2025-01-12',
      executed_date: '2025-01-12',
      acceptance_criteria: 'ESC temperature < 85°C after 15 min sustained hover',
      result: '72°C maximum recorded with active cooling',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-TH-001'],
      test_fixture_id: 'ISR-FIX-003',
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'esc_thermal_test_report.pdf')]
    }),
    
    // Flight Control Tests
    createTestCase('Flight Stability Test', 'TST-ISR-FC-001', TEST_LEVELS.FULL_SYSTEM, 'ISR-FC-100', {
      owning_node_part_number: 'ISR-FC-100',
      status: 'passed',
      scheduled_date: '2025-01-18',
      executed_date: '2025-01-18',
      acceptance_criteria: 'Attitude hold within 0.5° during hover',
      result: '0.3° RMS attitude variation measured',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-FC-002'],
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'flight_stability_test_report.pdf')]
    }),
    createTestCase('GPS-Denied Stabilization Test', 'TST-ISR-FC-002', TEST_LEVELS.FULL_SYSTEM, 'ISR-FC-100', {
      owning_node_part_number: 'ISR-FC-100',
      status: 'passed',
      scheduled_date: '2025-01-20',
      executed_date: '2025-01-20',
      acceptance_criteria: 'Maintain stable hover with GPS disabled for 5 minutes',
      result: 'Stable hover maintained, 2.1m drift over 5 min (optical flow + baro only)',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-FC-003'],
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'gps_denied_test_report.pdf')]
    }),
    
    // Communications Tests
    createTestCase('Communications Range Test', 'TST-ISR-CM-001', TEST_LEVELS.FULL_SYSTEM, 'ISR-CM-100', {
      owning_node_part_number: 'ISR-CM-100',
      status: 'passed',
      scheduled_date: '2025-01-15',
      executed_date: '2025-01-15',
      acceptance_criteria: 'Reliable control link at 10 km LOS',
      result: 'Full control maintained at 12.3 km, RSSI -95dBm',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-CM-001', 'REQ-ISR-VEH-008'],
      test_fixture_id: 'ISR-FIX-005',
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'range_test_report.pdf')]
    }),
    
    // Video / ISR Tests
    createTestCase('Video Latency Test', 'TST-ISR-VI-001', TEST_LEVELS.SYSTEM, 'ISR-VI-100', {
      owning_node_part_number: 'ISR-VI-100',
      status: 'passed',
      scheduled_date: '2025-01-14',
      executed_date: '2025-01-14',
      acceptance_criteria: 'Glass-to-glass latency < 25 ms',
      result: '22 ms measured with high-speed camera',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-VI-001', 'REQ-ISR-VEH-007'],
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'video_latency_test_report.pdf')]
    }),
    createTestCase('Low-Light Camera Evaluation', 'TST-ISR-VI-002', TEST_LEVELS.SYSTEM, 'ISR-VI-110', {
      owning_node_part_number: 'ISR-VI-110',
      status: 'passed',
      scheduled_date: '2025-01-16',
      executed_date: '2025-01-16',
      acceptance_criteria: 'Usable video at 0.01 lux',
      result: 'Identifiable image at 0.008 lux, acceptable noise level',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-VI-003'],
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'low_light_evaluation.pdf')]
    }),
    
    // Power Tests
    createTestCase('Battery Endurance Validation', 'TST-ISR-PW-001', TEST_LEVELS.FULL_SYSTEM, 'ISR-PW-110', {
      owning_node_part_number: 'ISR-PW-110',
      status: 'passed',
      scheduled_date: '2025-01-22',
      executed_date: '2025-01-22',
      acceptance_criteria: 'Flight endurance > 25 min at cruise',
      result: '27.5 min flight time achieved at 45 km/h cruise',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-VEH-002', 'REQ-ISR-PW-001'],
      test_fixture_id: 'ISR-FIX-004',
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'endurance_test_report.pdf')]
    }),
    
    // Vehicle-Level Tests
    createTestCase('Full Vehicle Dynamics Test', 'TST-ISR-VEH-002', TEST_LEVELS.FULL_SYSTEM, 'ISR-DRONE-000', {
      owning_node_part_number: 'ISR-DRONE-000',
      status: 'passed',
      scheduled_date: '2025-01-25',
      executed_date: '2025-01-25',
      acceptance_criteria: 'Achieve 120 km/h dash speed, maintain control authority',
      result: '124 km/h achieved, stable control maintained throughout',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-VEH-003'],
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'dynamics_test_report.pdf')]
    }),
    createTestCase('Wind Tolerance Flight Test', 'TST-ISR-VEH-003', TEST_LEVELS.FULL_SYSTEM, 'ISR-DRONE-000', {
      owning_node_part_number: 'ISR-DRONE-000',
      status: 'passed',
      scheduled_date: '2025-01-28',
      executed_date: '2025-01-28',
      acceptance_criteria: 'Stable hover and navigation in 40 km/h sustained winds',
      result: 'Stable operation in 38 km/h winds with 45 km/h gusts',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-VEH-005'],
      attachments: [createAttachment(ATTACHMENT_TYPES.TEST_REPORT, 'wind_tolerance_test.pdf')]
    }),
    createTestCase('Field Battery Replacement Timed Test', 'TST-ISR-VEH-004', TEST_LEVELS.FULL_SYSTEM, 'ISR-DRONE-000', {
      owning_node_part_number: 'ISR-DRONE-000',
      status: 'passed',
      scheduled_date: '2025-01-30',
      executed_date: '2025-01-30',
      acceptance_criteria: 'Battery swap complete in < 30 seconds',
      result: '22 seconds average over 5 swaps by trained operator',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-VEH-009']
    }),
    
    // Environmental Tests
    createTestCase('Dust / Environmental Exposure Inspection', 'TST-ISR-TH-001', TEST_LEVELS.SYSTEM, 'ISR-TH-200', {
      owning_node_part_number: 'ISR-TH-200',
      status: 'passed',
      scheduled_date: '2025-02-01',
      executed_date: '2025-02-01',
      acceptance_criteria: 'IP5X dust protection verified',
      result: 'No dust ingress to electronics after 8-hour dust chamber exposure',
      pass_fail: 'pass',
      linked_requirements: ['REQ-ISR-TH-003']
    })
  ]
};

export default ISR_DRONE;
