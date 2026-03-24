/**
 * Demo Resources Data - Tool & Asset Inventory
 *
 * This is a shared-resource accountability system for tools, fixtures,
 * test equipment, and prototype lab hardware.
 *
 * NOT ERP/MRP - No procurement, costing, suppliers, or production inventory.
 *
 * Answers:
 * - Who has it?
 * - Where is it?
 * - When is it due back?
 * - Is it calibrated?
 * - Do we own any X?
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export const RESOURCE_CATEGORIES = {
  TOOL: 'tool',
  LAB_ASSET: 'lab_asset',
  FIXTURE: 'fixture',
  TEST_EQUIPMENT: 'test_equipment'
};

export const RESOURCE_STATUS = {
  AVAILABLE: 'available',
  CHECKED_OUT: 'checked_out',
  UNDER_MAINTENANCE: 'under_maintenance',
  LOST: 'lost'
};

export const ATTACHMENT_TYPES = {
  IMAGE: 'image',
  MANUAL: 'manual',
  CERTIFICATE: 'certificate',
  OTHER: 'other'
};

// Category display configuration
export const CATEGORY_CONFIG = {
  tool: {
    label: 'Tool',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  lab_asset: {
    label: 'Lab Asset',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  fixture: {
    label: 'Fixture',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  test_equipment: {
    label: 'Test Equipment',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30'
  }
};

// Status display configuration
export const STATUS_CONFIG = {
  available: {
    label: 'Available',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  checked_out: {
    label: 'Checked Out',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30'
  },
  under_maintenance: {
    label: 'Under Maintenance',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  },
  lost: {
    label: 'Lost',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  }
};

// =============================================================================
// DEMO USERS (for checkout references)
// =============================================================================

export const DEMO_USERS = {
  'user-001': { id: 'user-001', name: 'Alex Chen', email: 'alex.chen@factory-os.com', avatar: null },
  'user-002': { id: 'user-002', name: 'Jordan Rivera', email: 'jordan.rivera@factory-os.com', avatar: null },
  'user-003': { id: 'user-003', name: 'Sam Kim', email: 'sam.kim@factory-os.com', avatar: null },
  'user-004': { id: 'user-004', name: 'Taylor Martinez', email: 'taylor.martinez@factory-os.com', avatar: null },
  'user-005': { id: 'user-005', name: 'Casey Johnson', email: 'casey.johnson@factory-os.com', avatar: null }
};

// =============================================================================
// DEMO RESOURCES
// =============================================================================

export const DEMO_RESOURCES = [
  // ─────────────────────────────────────────────────────────────────────────
  // TOOLS (6)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'res-tool-001',
    org_id: 'org-demo-001',
    global_artifact_id: 'RES1TRQ1',
    name: 'Torque Wrench 10-200 Nm',
    description: 'Digital torque wrench with memory function. Range 10-200 Nm. Includes 1/2" drive socket adapter set.',
    category: RESOURCE_CATEGORIES.TOOL,
    quantity_total: 1,
    quantity_available: 0, // Currently checked out
    location_label: 'Tool Crib - Drawer 12',
    status: RESOURCE_STATUS.CHECKED_OUT,
    calibration_required: true,
    calibration_due_at: '2026-02-28T00:00:00Z',
    last_calibration_at: '2025-02-28T00:00:00Z',
    calibration_interval_days: 365,
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2026-01-28T14:30:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-tool-002',
    org_id: 'org-demo-001',
    global_artifact_id: 'RES2FLK1',
    name: 'Fluke 87V Multimeter',
    description: 'Industrial True-RMS multimeter with temperature measurement. Includes alligator clips and probe set.',
    category: RESOURCE_CATEGORIES.TOOL,
    quantity_total: 2,
    quantity_available: 2,
    location_label: 'Electronics Lab - Bench 3',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: true,
    calibration_due_at: '2026-06-15T00:00:00Z',
    last_calibration_at: '2025-06-15T00:00:00Z',
    calibration_interval_days: 365,
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-tool-003',
    org_id: 'org-demo-001',
    global_artifact_id: 'RES3CRP1',
    name: 'Crimp Tool Kit (Deutsch)',
    description: 'Deutsch DT/DTM connector crimping tool kit. Includes extraction tools and contact sizing gauge.',
    category: RESOURCE_CATEGORIES.TOOL,
    quantity_total: 1,
    quantity_available: 1,
    location_label: 'Electrical Bay - Cabinet A',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-08-10T09:00:00Z',
    updated_at: '2024-08-10T09:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-tool-004',
    org_id: 'org-demo-001',
    global_artifact_id: 'RES4FLR1',
    name: 'FLIR E8 Thermal Camera',
    description: 'Handheld thermal imaging camera. 320x240 resolution, -20C to 250C range. MSX image enhancement.',
    category: RESOURCE_CATEGORIES.TOOL,
    quantity_total: 1,
    quantity_available: 0, // Currently checked out
    location_label: 'Test Lab - Cabinet 2',
    status: RESOURCE_STATUS.CHECKED_OUT,
    calibration_required: true,
    calibration_due_at: '2026-04-01T00:00:00Z',
    last_calibration_at: '2025-04-01T00:00:00Z',
    calibration_interval_days: 365,
    created_at: '2024-03-20T11:00:00Z',
    updated_at: '2026-02-01T08:15:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-tool-005',
    org_id: 'org-demo-001',
    global_artifact_id: 'RES5DIA1',
    name: 'Dial Indicator Set',
    description: 'Mitutoyo dial indicator set with magnetic base. 0.001" resolution. Includes 3 indicator heads.',
    category: RESOURCE_CATEGORIES.TOOL,
    quantity_total: 3,
    quantity_available: 2, // One checked out
    location_label: 'Metrology Room - Drawer 5',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: true,
    calibration_due_at: '2026-03-15T00:00:00Z',
    last_calibration_at: '2025-03-15T00:00:00Z',
    calibration_interval_days: 365,
    created_at: '2024-01-10T14:00:00Z',
    updated_at: '2026-02-02T09:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-tool-006',
    org_id: 'org-demo-001',
    global_artifact_id: 'RES6RVN1',
    name: 'Rivnut Installation Tool',
    description: 'Manual rivnut/nutsert installation tool. M3-M10 range. Includes mandrel set.',
    category: RESOURCE_CATEGORIES.TOOL,
    quantity_total: 2,
    quantity_available: 2,
    location_label: 'Assembly Area - Tool Board',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-09-05T10:00:00Z',
    updated_at: '2024-09-05T10:00:00Z',
    created_by: 'user-005'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FIXTURES (4)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'res-fix-001',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESFXBJ1',
    name: 'Baja Chassis Welding Fixture',
    description: 'Precision welding fixture for Baja SAE chassis frame assembly. Steel construction with adjustable clamps.',
    category: RESOURCE_CATEGORIES.FIXTURE,
    quantity_total: 1,
    quantity_available: 1,
    location_label: 'Weld Shop - Bay 2',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-04-01T08:00:00Z',
    updated_at: '2024-04-01T08:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-fix-002',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESFXGB1',
    name: 'Gearbox Assembly Fixture',
    description: 'Aluminum fixture for gearbox assembly and bearing preload setup. Includes dial indicator mount.',
    category: RESOURCE_CATEGORIES.FIXTURE,
    quantity_total: 1,
    quantity_available: 1,
    location_label: 'Assembly Area - Bench 1',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-05-15T09:00:00Z',
    updated_at: '2024-05-15T09:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-fix-003',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESFXHR1',
    name: 'Bus Roof Harness Drill Template',
    description: 'Aluminum drill template for Electric Bus roof harness penetrations. Includes pilot holes and labels.',
    category: RESOURCE_CATEGORIES.FIXTURE,
    quantity_total: 1,
    quantity_available: 1,
    location_label: 'Electrical Bay - Wall Mount',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-07-20T10:00:00Z',
    updated_at: '2024-07-20T10:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-fix-004',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESFXBK1',
    name: 'Brake Pedal Box Assembly Fixture',
    description: 'Steel fixture for brake pedal box assembly. Includes master cylinder alignment pins.',
    category: RESOURCE_CATEGORIES.FIXTURE,
    quantity_total: 1,
    quantity_available: 1,
    location_label: 'Assembly Area - Bench 3',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-08-25T11:00:00Z',
    updated_at: '2024-08-25T11:00:00Z',
    created_by: 'user-005'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LAB ASSETS (6)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'res-lab-001',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESLBPI1',
    name: 'Raspberry Pi 4 Model B (4GB)',
    description: 'Raspberry Pi 4 Model B with 4GB RAM. Includes case, power supply, and 32GB SD card with Raspbian.',
    category: RESOURCE_CATEGORIES.LAB_ASSET,
    quantity_total: 6,
    quantity_available: 4, // 2 checked out
    location_label: 'Electronics Lab - Shelf A',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-02-10T10:00:00Z',
    updated_at: '2026-02-01T16:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-lab-002',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESLBJT1',
    name: 'Jetson Orin Nano Dev Kit',
    description: 'NVIDIA Jetson Orin Nano 8GB developer kit. Includes carrier board and power supply.',
    category: RESOURCE_CATEGORIES.LAB_ASSET,
    quantity_total: 2,
    quantity_available: 1, // 1 checked out
    location_label: 'Electronics Lab - Shelf B',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-11-01T09:00:00Z',
    updated_at: '2026-01-20T10:30:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-lab-003',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESLBCN1',
    name: 'CANable USB-CAN Adapter',
    description: 'USB to CAN bus adapter. Supports CAN 2.0A/B up to 1Mbps. Includes DB9 cable.',
    category: RESOURCE_CATEGORIES.LAB_ASSET,
    quantity_total: 5,
    quantity_available: 5,
    location_label: 'Electronics Lab - Drawer 3',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-03-15T11:00:00Z',
    updated_at: '2024-03-15T11:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-lab-004',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESLBHL1',
    name: 'Hall Sensor Assortment',
    description: 'Assorted Hall effect sensors (SS49E, A3144, AH3503). Various sensitivities for position and current sensing.',
    category: RESOURCE_CATEGORIES.LAB_ASSET,
    quantity_total: 30,
    quantity_available: 30,
    location_label: 'Components Cabinet - Bin H1',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-04-05T14:00:00Z',
    updated_at: '2024-04-05T14:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-lab-005',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESLBSG1',
    name: 'Strain Gauge Kit',
    description: 'Vishay strain gauge kit. Includes 350 ohm gauges, adhesive, and lead wire. 20 gauges per kit.',
    category: RESOURCE_CATEGORIES.LAB_ASSET,
    quantity_total: 20,
    quantity_available: 20,
    location_label: 'Test Lab - Cabinet 1',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-05-20T10:00:00Z',
    updated_at: '2024-05-20T10:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-lab-006',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESLBPT1',
    name: 'Pressure Transducers (0-500 psi)',
    description: 'Honeywell pressure transducers, 0-500 psi range, 4-20mA output. 1/4" NPT fitting.',
    category: RESOURCE_CATEGORIES.LAB_ASSET,
    quantity_total: 8,
    quantity_available: 8,
    location_label: 'Test Lab - Cabinet 1',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-06-10T09:00:00Z',
    updated_at: '2024-06-10T09:00:00Z',
    created_by: 'user-005'
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TEST EQUIPMENT (2) - For variety
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'res-test-001',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESTEOSC',
    name: 'Rigol DS1054Z Oscilloscope',
    description: '4-channel 50MHz digital oscilloscope. Includes probes and USB connectivity.',
    category: RESOURCE_CATEGORIES.TEST_EQUIPMENT,
    quantity_total: 2,
    quantity_available: 2,
    location_label: 'Electronics Lab - Bench 1',
    status: RESOURCE_STATUS.AVAILABLE,
    calibration_required: true,
    calibration_due_at: '2026-08-01T00:00:00Z',
    last_calibration_at: '2025-08-01T00:00:00Z',
    calibration_interval_days: 365,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    created_by: 'user-005'
  },
  {
    id: 'res-test-002',
    org_id: 'org-demo-001',
    global_artifact_id: 'RESTEPSU',
    name: 'Bench Power Supply (0-30V, 0-10A)',
    description: 'Adjustable DC bench power supply. Dual channel, 0-30V, 0-10A per channel.',
    category: RESOURCE_CATEGORIES.TEST_EQUIPMENT,
    quantity_total: 3,
    quantity_available: 3,
    location_label: 'Electronics Lab - Bench 2',
    status: RESOURCE_STATUS.UNDER_MAINTENANCE, // One unit under repair
    calibration_required: false,
    calibration_due_at: null,
    last_calibration_at: null,
    calibration_interval_days: null,
    created_at: '2024-02-20T11:00:00Z',
    updated_at: '2026-01-30T09:00:00Z',
    created_by: 'user-005'
  }
];

// =============================================================================
// DEMO CHECKOUTS (7 total: 5 open, 2 overdue)
// =============================================================================

export const DEMO_CHECKOUTS = [
  // ─────────────────────────────────────────────────────────────────────────
  // OVERDUE CHECKOUTS (2)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'checkout-001',
    org_id: 'org-demo-001',
    resource_id: 'res-tool-001', // Torque Wrench
    checked_out_by_user_id: 'user-001', // Alex Chen
    checked_out_at: '2026-01-25T09:00:00Z',
    expected_return_at: '2026-02-01T17:00:00Z', // OVERDUE
    returned_at: null,
    purpose_note: 'Baja 2025 frame torque verification - all critical fasteners',
    quantity_checked_out: 1,
    linked_project_id: 'proj-baja-2025', // Baja 2025 project
    linked_node_id: 'node-chassis-001',
    linked_artifact_id: null
  },
  {
    id: 'checkout-002',
    org_id: 'org-demo-001',
    resource_id: 'res-lab-002', // Jetson Orin
    checked_out_by_user_id: 'user-001', // Alex Chen
    checked_out_at: '2026-01-15T10:00:00Z',
    expected_return_at: '2026-01-25T17:00:00Z', // OVERDUE
    returned_at: null,
    purpose_note: 'Vision system development for autonomous navigation',
    quantity_checked_out: 1,
    linked_project_id: 'proj-ebus-gen1', // Electric Bus Gen1
    linked_node_id: 'node-perception-001',
    linked_artifact_id: null
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OPEN CHECKOUTS (not overdue) (3)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'checkout-003',
    org_id: 'org-demo-001',
    resource_id: 'res-tool-004', // FLIR Thermal Camera
    checked_out_by_user_id: 'user-002', // Jordan Rivera
    checked_out_at: '2026-02-01T08:15:00Z',
    expected_return_at: '2026-02-10T17:00:00Z',
    returned_at: null,
    purpose_note: 'Motor thermal testing under load conditions',
    quantity_checked_out: 1,
    linked_project_id: null,
    linked_node_id: null,
    linked_artifact_id: 'doe-motor-thermal-001' // DOE study link
  },
  {
    id: 'checkout-004',
    org_id: 'org-demo-001',
    resource_id: 'res-lab-001', // Raspberry Pi
    checked_out_by_user_id: 'user-003', // Sam Kim
    checked_out_at: '2026-02-01T16:00:00Z',
    expected_return_at: '2026-02-15T17:00:00Z',
    returned_at: null,
    purpose_note: 'CAN bus data logging prototype development',
    quantity_checked_out: 2,
    linked_project_id: null,
    linked_node_id: null,
    linked_artifact_id: null
  },
  {
    id: 'checkout-005',
    org_id: 'org-demo-001',
    resource_id: 'res-tool-005', // Dial Indicator
    checked_out_by_user_id: 'user-004', // Taylor Martinez
    checked_out_at: '2026-02-02T09:00:00Z',
    expected_return_at: '2026-02-08T17:00:00Z',
    returned_at: null,
    purpose_note: 'Spindle runout measurement on CNC lathe',
    quantity_checked_out: 1,
    linked_project_id: null,
    linked_node_id: null,
    linked_artifact_id: null
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HISTORICAL (RETURNED) CHECKOUTS (2) - for history view
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'checkout-006',
    org_id: 'org-demo-001',
    resource_id: 'res-tool-002', // Fluke Multimeter
    checked_out_by_user_id: 'user-002', // Jordan Rivera
    checked_out_at: '2026-01-10T10:00:00Z',
    expected_return_at: '2026-01-15T17:00:00Z',
    returned_at: '2026-01-14T16:30:00Z', // Returned early
    purpose_note: 'Battery pack voltage verification',
    quantity_checked_out: 1,
    linked_project_id: 'proj-ebus-gen1',
    linked_node_id: null,
    linked_artifact_id: null
  },
  {
    id: 'checkout-007',
    org_id: 'org-demo-001',
    resource_id: 'res-fix-001', // Baja Chassis Fixture
    checked_out_by_user_id: 'user-001', // Alex Chen
    checked_out_at: '2026-01-05T08:00:00Z',
    expected_return_at: '2026-01-20T17:00:00Z',
    returned_at: '2026-01-18T15:00:00Z',
    purpose_note: 'Baja 2025 chassis welding - main frame assembly',
    quantity_checked_out: 1,
    linked_project_id: 'proj-baja-2025',
    linked_node_id: 'node-chassis-001',
    linked_artifact_id: null
  }
];

// =============================================================================
// DEMO ATTACHMENTS
// =============================================================================

export const DEMO_ATTACHMENTS = [
  {
    id: 'attach-001',
    org_id: 'org-demo-001',
    resource_id: 'res-tool-001', // Torque Wrench
    attachment_type: ATTACHMENT_TYPES.CERTIFICATE,
    object_storage_key: null,
    external_url: 'https://example.com/certs/torque-wrench-cal-2025.pdf',
    title: 'Calibration Certificate 2025',
    file_name: 'torque-wrench-cal-2025.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 245000,
    created_at: '2025-02-28T10:00:00Z',
    uploaded_by: 'user-005'
  },
  {
    id: 'attach-002',
    org_id: 'org-demo-001',
    resource_id: 'res-tool-001', // Torque Wrench
    attachment_type: ATTACHMENT_TYPES.MANUAL,
    object_storage_key: null,
    external_url: 'https://example.com/manuals/digital-torque-wrench.pdf',
    title: 'User Manual',
    file_name: 'digital-torque-wrench-manual.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 1500000,
    created_at: '2024-06-15T10:00:00Z',
    uploaded_by: 'user-005'
  },
  {
    id: 'attach-003',
    org_id: 'org-demo-001',
    resource_id: 'res-tool-004', // FLIR Camera
    attachment_type: ATTACHMENT_TYPES.MANUAL,
    object_storage_key: null,
    external_url: 'https://example.com/manuals/flir-e8-user-guide.pdf',
    title: 'FLIR E8 User Guide',
    file_name: 'flir-e8-user-guide.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 3200000,
    created_at: '2024-03-20T11:00:00Z',
    uploaded_by: 'user-005'
  },
  {
    id: 'attach-004',
    org_id: 'org-demo-001',
    resource_id: 'res-fix-001', // Baja Chassis Fixture
    attachment_type: ATTACHMENT_TYPES.IMAGE,
    object_storage_key: null,
    external_url: 'https://example.com/images/baja-chassis-fixture.jpg',
    title: 'Fixture Photo',
    file_name: 'baja-chassis-fixture.jpg',
    mime_type: 'image/jpeg',
    file_size_bytes: 850000,
    created_at: '2024-04-01T08:00:00Z',
    uploaded_by: 'user-005'
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all resources for the demo organization
 */
export const getAllResources = () => DEMO_RESOURCES;

/**
 * Get a single resource by ID
 */
export const getResourceById = (id) => DEMO_RESOURCES.find(r => r.id === id);

/**
 * Get open checkouts for a resource
 */
export const getOpenCheckouts = (resourceId) =>
  DEMO_CHECKOUTS.filter(c => c.resource_id === resourceId && c.returned_at === null);

/**
 * Get all checkouts for a resource (including returned)
 */
export const getResourceHistory = (resourceId) =>
  DEMO_CHECKOUTS.filter(c => c.resource_id === resourceId)
    .sort((a, b) => new Date(b.checked_out_at) - new Date(a.checked_out_at));

/**
 * Get user's open checkouts
 */
export const getUserCheckouts = (userId) =>
  DEMO_CHECKOUTS.filter(c => c.checked_out_by_user_id === userId && c.returned_at === null);

/**
 * Get overdue checkouts
 */
export const getOverdueCheckouts = () => {
  const now = new Date();
  return DEMO_CHECKOUTS.filter(c =>
    c.returned_at === null &&
    c.expected_return_at &&
    new Date(c.expected_return_at) < now
  );
};

/**
 * Get resources with calibration due within N days
 */
export const getCalibrationDue = (days = 30) => {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return DEMO_RESOURCES.filter(r =>
    r.calibration_required &&
    r.calibration_due_at &&
    new Date(r.calibration_due_at) <= threshold
  );
};

/**
 * Get attachments for a resource
 */
export const getResourceAttachments = (resourceId) =>
  DEMO_ATTACHMENTS.filter(a => a.resource_id === resourceId);

/**
 * Compute stats for the resources dashboard
 */
export const computeResourceStats = () => {
  const resources = DEMO_RESOURCES;
  const checkouts = DEMO_CHECKOUTS;
  const now = new Date();

  const openCheckouts = checkouts.filter(c => c.returned_at === null);
  const overdueCheckouts = openCheckouts.filter(c =>
    c.expected_return_at && new Date(c.expected_return_at) < now
  );

  const calibrationDue = resources.filter(r =>
    r.calibration_required &&
    r.calibration_due_at &&
    new Date(r.calibration_due_at) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  );

  const calibrationOverdue = resources.filter(r =>
    r.calibration_required &&
    r.calibration_due_at &&
    new Date(r.calibration_due_at) < now
  );

  return {
    totalResources: resources.length,
    totalByCategory: {
      tool: resources.filter(r => r.category === RESOURCE_CATEGORIES.TOOL).length,
      lab_asset: resources.filter(r => r.category === RESOURCE_CATEGORIES.LAB_ASSET).length,
      fixture: resources.filter(r => r.category === RESOURCE_CATEGORIES.FIXTURE).length,
      test_equipment: resources.filter(r => r.category === RESOURCE_CATEGORIES.TEST_EQUIPMENT).length
    },
    available: resources.filter(r => r.status === RESOURCE_STATUS.AVAILABLE).length,
    checkedOut: resources.filter(r => r.status === RESOURCE_STATUS.CHECKED_OUT).length,
    underMaintenance: resources.filter(r => r.status === RESOURCE_STATUS.UNDER_MAINTENANCE).length,
    openCheckouts: openCheckouts.length,
    overdueCheckouts: overdueCheckouts.length,
    calibrationDueSoon: calibrationDue.length,
    calibrationOverdue: calibrationOverdue.length
  };
};

/**
 * Check if checkout is overdue
 */
export const isCheckoutOverdue = (checkout) => {
  if (!checkout.expected_return_at || checkout.returned_at) return false;
  return new Date(checkout.expected_return_at) < new Date();
};

/**
 * Calculate days overdue
 */
export const getDaysOverdue = (checkout) => {
  if (!isCheckoutOverdue(checkout)) return 0;
  const now = new Date();
  const dueDate = new Date(checkout.expected_return_at);
  return Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
};

/**
 * Check if calibration is overdue
 */
export const isCalibrationOverdue = (resource) => {
  if (!resource.calibration_required || !resource.calibration_due_at) return false;
  return new Date(resource.calibration_due_at) < new Date();
};

/**
 * Check if calibration is due soon (within 30 days)
 */
export const isCalibrationDueSoon = (resource, days = 30) => {
  if (!resource.calibration_required || !resource.calibration_due_at) return false;
  const now = new Date();
  const dueDate = new Date(resource.calibration_due_at);
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return dueDate <= threshold && dueDate >= now;
};
