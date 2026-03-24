/**
 * Demo Quality (8D) Cases Data
 *
 * Each 8D case must link to at least one of:
 * - Project
 * - Node (assembly/part)
 * - Change Package
 * - Asset Instance
 */

export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
  OBSERVATION: 'observation'
};

export const PRIORITY_LEVELS = {
  URGENT: 'urgent',
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low'
};

export const CASE_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  PENDING_VERIFICATION: 'pending_verification',
  CLOSED: 'closed',
  CANCELLED: 'cancelled'
};

export const ACTION_TYPES = {
  CONTAINMENT: 'containment',
  CORRECTIVE: 'corrective',
  PREVENTIVE: 'preventive'
};

export const ACTION_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  CANCELLED: 'cancelled'
};

export const DISCIPLINE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
};

// Helper to generate case numbers
let caseCounter = 41;
const generateCaseNumber = () => `8D-2025-${String(++caseCounter).padStart(4, '0')}`;

// Demo team members
const TEAM_MEMBERS = {
  john: { id: 'user-001', name: 'John Smith', email: 'john.smith@example.com' },
  jane: { id: 'user-002', name: 'Jane Doe', email: 'jane.doe@example.com' },
  bob: { id: 'user-003', name: 'Bob Wilson', email: 'bob.wilson@example.com' },
  alice: { id: 'user-004', name: 'Alice Chen', email: 'alice.chen@example.com' },
  mike: { id: 'user-005', name: 'Mike Johnson', email: 'mike.johnson@example.com' }
};

// Demo 8D Cases
export const DEMO_8D_CASES = [
  {
    id: '8d-case-001',
    case_number: '8D-2025-0042',
    title: 'Gearbox Input Shaft Fatigue Failure',
    description: 'Input shaft failed during endurance testing at 45 hours. Fractography indicates fatigue initiation at keyway radius.',
    severity: SEVERITY_LEVELS.CRITICAL,
    priority: PRIORITY_LEVELS.URGENT,
    owner: TEAM_MEMBERS.john,
    team_lead: TEAM_MEMBERS.john,
    created_by: TEAM_MEMBERS.jane,
    // Linking - must have at least one
    project_id: 'proj-baja-2025',
    project_name: 'Baja 2025',
    node_id: 'node-dt-110',
    node_name: 'Input Shaft Sub-Assembly',
    node_part_number: 'BAJA25-DT-110',
    change_package_id: null,
    asset_instance_id: null,
    // Status
    status: CASE_STATUS.IN_PROGRESS,
    current_discipline: 4,
    // Dates
    due_date: '2025-02-01',
    target_closure_date: '2025-02-15',
    actual_closure_date: null,
    created_at: '2025-01-03T10:30:00Z',
    updated_at: '2025-01-15T14:22:00Z',
    age_days: 12,
    // Team
    team_members: [
      { ...TEAM_MEMBERS.john, role: 'Team Lead' },
      { ...TEAM_MEMBERS.jane, role: 'Member' },
      { ...TEAM_MEMBERS.bob, role: 'SME' },
      { ...TEAM_MEMBERS.alice, role: 'Member' }
    ],
    // Disciplines
    disciplines: [
      {
        number: 0,
        name: 'Prepare',
        status: DISCIPLINE_STATUS.COMPLETED,
        completed_at: '2025-01-03T12:00:00Z',
        content: {
          emergency_response: 'Stopped all endurance testing pending investigation',
          symptom_description: 'Shaft fractured at keyway, vehicle immobilized during test'
        }
      },
      {
        number: 1,
        name: 'Team',
        status: DISCIPLINE_STATUS.COMPLETED,
        completed_at: '2025-01-03T14:00:00Z',
        content: {
          team_formed: true,
          champion: 'Dr. Smith (Faculty Advisor)'
        }
      },
      {
        number: 2,
        name: 'Problem',
        status: DISCIPLINE_STATUS.COMPLETED,
        completed_at: '2025-01-05T16:00:00Z',
        content: {
          is_is_not: {
            what_is: 'Input shaft fractured at keyway',
            what_is_not: 'Output shaft, gears, bearings unaffected',
            where_is: 'Keyway root on shaft',
            where_is_not: 'Other stress concentration areas',
            when_is: '45 hours into 100-hour endurance test',
            when_is_not: 'Not during initial break-in or peak load events'
          },
          quantified_impact: 'Vehicle 1 of 2 down, 55% through test program, 3 weeks to competition'
        }
      },
      {
        number: 3,
        name: 'Containment',
        status: DISCIPLINE_STATUS.COMPLETED,
        completed_at: '2025-01-06T10:00:00Z',
        content: {
          actions_taken: 'Replaced shaft in Vehicle 1, reduced test severity 20% pending root cause'
        }
      },
      {
        number: 4,
        name: 'Root Cause',
        status: DISCIPLINE_STATUS.IN_PROGRESS,
        completed_at: null,
        content: {
          five_why: [
            { why: 'Why did the shaft fail?', answer: 'Fatigue fracture at keyway' },
            { why: 'Why fatigue at keyway?', answer: 'Stress concentration exceeds endurance limit' },
            { why: 'Why high stress concentration?', answer: 'Sharp corner radius at keyway root' },
            { why: 'Why sharp radius?', answer: 'Drawing spec of 0.5mm min not achieved (measured 0.2mm)' },
            { why: 'Why not achieved?', answer: 'Inspection criteria did not include radius measurement' }
          ],
          root_cause: 'Insufficient inspection criteria for keyway radius - no measurement method specified'
        }
      },
      { number: 5, name: 'Corrective', status: DISCIPLINE_STATUS.NOT_STARTED, content: null },
      { number: 6, name: 'Implementation', status: DISCIPLINE_STATUS.NOT_STARTED, content: null },
      { number: 7, name: 'Prevention', status: DISCIPLINE_STATUS.NOT_STARTED, content: null },
      { number: 8, name: 'Closure', status: DISCIPLINE_STATUS.NOT_STARTED, content: null }
    ],
    // Actions
    actions: [
      {
        id: 'action-001',
        discipline: 3,
        action_type: ACTION_TYPES.CONTAINMENT,
        description: 'Replace failed shaft with spare',
        owner: TEAM_MEMBERS.bob,
        due_date: '2025-01-04',
        status: ACTION_STATUS.VERIFIED,
        completed_at: '2025-01-04T14:00:00Z',
        verified_at: '2025-01-04T16:00:00Z'
      },
      {
        id: 'action-002',
        discipline: 3,
        action_type: ACTION_TYPES.CONTAINMENT,
        description: 'Reduce endurance test severity by 20%',
        owner: TEAM_MEMBERS.john,
        due_date: '2025-01-05',
        status: ACTION_STATUS.VERIFIED,
        completed_at: '2025-01-05T09:00:00Z',
        verified_at: '2025-01-05T10:00:00Z'
      },
      {
        id: 'action-003',
        discipline: 5,
        action_type: ACTION_TYPES.CORRECTIVE,
        description: 'Update drawing with minimum radius callout of 1.0mm',
        owner: TEAM_MEMBERS.john,
        due_date: '2025-01-25',
        status: ACTION_STATUS.IN_PROGRESS,
        completed_at: null,
        verified_at: null
      },
      {
        id: 'action-004',
        discipline: 5,
        action_type: ACTION_TYPES.CORRECTIVE,
        description: 'Train inspectors on keyway radius inspection procedure',
        owner: TEAM_MEMBERS.jane,
        due_date: '2025-01-30',
        status: ACTION_STATUS.OPEN,
        completed_at: null,
        verified_at: null
      },
      {
        id: 'action-005',
        discipline: 5,
        action_type: ACTION_TYPES.CORRECTIVE,
        description: 'Manufacture inspection fixture for radius measurement',
        owner: TEAM_MEMBERS.bob,
        due_date: '2025-02-05',
        status: ACTION_STATUS.OPEN,
        completed_at: null,
        verified_at: null
      }
    ],
    // Evidence
    evidence: [
      {
        id: 'evidence-001',
        discipline: 2,
        evidence_type: 'analysis',
        description: 'Fractography report showing fatigue beach marks',
        file_name: 'Fractography_Report_BAJA25-DT-110.pdf'
      },
      {
        id: 'evidence-002',
        discipline: 4,
        evidence_type: 'analysis',
        description: 'FEA stress analysis at keyway',
        file_name: 'FEA_Stress_Keyway_Analysis.xlsx'
      },
      {
        id: 'evidence-003',
        discipline: 4,
        evidence_type: 'photo',
        description: 'Photo of fractured shaft',
        file_name: 'shaft_fracture_photo.jpg'
      }
    ]
  },
  {
    id: '8d-case-002',
    case_number: '8D-2025-0038',
    title: 'Weld Porosity on Chassis Frame Tubes',
    description: 'Multiple instances of weld porosity detected during dye penetrant inspection of chassis weld joints.',
    severity: SEVERITY_LEVELS.MAJOR,
    priority: PRIORITY_LEVELS.HIGH,
    owner: TEAM_MEMBERS.jane,
    team_lead: TEAM_MEMBERS.jane,
    created_by: TEAM_MEMBERS.bob,
    project_id: 'proj-baja-2025',
    project_name: 'Baja 2025',
    node_id: 'node-ch-100',
    node_name: 'Frame Assembly',
    node_part_number: 'BAJA25-CH-100',
    change_package_id: null,
    asset_instance_id: null,
    status: CASE_STATUS.PENDING_VERIFICATION,
    current_discipline: 6,
    due_date: '2025-01-28',
    target_closure_date: '2025-02-01',
    actual_closure_date: null,
    created_at: '2025-01-07T08:15:00Z',
    updated_at: '2025-01-14T11:30:00Z',
    age_days: 8,
    team_members: [
      { ...TEAM_MEMBERS.jane, role: 'Team Lead' },
      { ...TEAM_MEMBERS.bob, role: 'SME' },
      { ...TEAM_MEMBERS.mike, role: 'Member' }
    ],
    disciplines: [
      { number: 0, name: 'Prepare', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 1, name: 'Team', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 2, name: 'Problem', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 3, name: 'Containment', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 4, name: 'Root Cause', status: DISCIPLINE_STATUS.COMPLETED, content: {
        root_cause: 'Inadequate shielding gas coverage due to worn gas cup nozzle'
      }},
      { number: 5, name: 'Corrective', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 6, name: 'Implementation', status: DISCIPLINE_STATUS.IN_PROGRESS, content: {} },
      { number: 7, name: 'Prevention', status: DISCIPLINE_STATUS.NOT_STARTED, content: null },
      { number: 8, name: 'Closure', status: DISCIPLINE_STATUS.NOT_STARTED, content: null }
    ],
    actions: [
      {
        id: 'action-010',
        discipline: 5,
        action_type: ACTION_TYPES.CORRECTIVE,
        description: 'Replace all gas cup nozzles on welding equipment',
        owner: TEAM_MEMBERS.bob,
        due_date: '2025-01-20',
        status: ACTION_STATUS.VERIFIED
      },
      {
        id: 'action-011',
        discipline: 6,
        action_type: ACTION_TYPES.CORRECTIVE,
        description: 'Re-weld affected joints and re-inspect',
        owner: TEAM_MEMBERS.mike,
        due_date: '2025-01-25',
        status: ACTION_STATUS.IN_PROGRESS
      }
    ],
    evidence: []
  },
  {
    id: '8d-case-003',
    case_number: '8D-2025-0035',
    title: 'Paint Adhesion Failure on Body Panels',
    description: 'Paint peeling observed on front body panel after environmental testing.',
    severity: SEVERITY_LEVELS.MINOR,
    priority: PRIORITY_LEVELS.NORMAL,
    owner: TEAM_MEMBERS.bob,
    team_lead: TEAM_MEMBERS.bob,
    created_by: TEAM_MEMBERS.alice,
    project_id: 'proj-formula-2025',
    project_name: 'Formula 2025',
    node_id: 'node-body-001',
    node_name: 'Front Body Panel',
    node_part_number: 'FORM25-BD-100',
    change_package_id: null,
    asset_instance_id: null,
    status: CASE_STATUS.IN_PROGRESS,
    current_discipline: 7,
    due_date: '2025-02-10',
    target_closure_date: '2025-02-15',
    actual_closure_date: null,
    created_at: '2024-12-31T09:00:00Z',
    updated_at: '2025-01-12T16:45:00Z',
    age_days: 15,
    team_members: [
      { ...TEAM_MEMBERS.bob, role: 'Team Lead' },
      { ...TEAM_MEMBERS.alice, role: 'Member' }
    ],
    disciplines: [
      { number: 0, name: 'Prepare', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 1, name: 'Team', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 2, name: 'Problem', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 3, name: 'Containment', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 4, name: 'Root Cause', status: DISCIPLINE_STATUS.COMPLETED, content: {
        root_cause: 'Surface preparation inadequate - insufficient roughness for adhesion'
      }},
      { number: 5, name: 'Corrective', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 6, name: 'Implementation', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 7, name: 'Prevention', status: DISCIPLINE_STATUS.IN_PROGRESS, content: {} },
      { number: 8, name: 'Closure', status: DISCIPLINE_STATUS.NOT_STARTED, content: null }
    ],
    actions: [],
    evidence: []
  },
  {
    id: '8d-case-004',
    case_number: '8D-2025-0030',
    title: 'Brake Caliper Mounting Bolt Torque Variance',
    description: 'Audit found brake caliper bolts below specified torque on 2 of 4 vehicles.',
    severity: SEVERITY_LEVELS.CRITICAL,
    priority: PRIORITY_LEVELS.URGENT,
    owner: TEAM_MEMBERS.mike,
    team_lead: TEAM_MEMBERS.mike,
    created_by: TEAM_MEMBERS.john,
    project_id: 'proj-baja-2025',
    project_name: 'Baja 2025',
    node_id: 'node-br-100',
    node_name: 'Brake Assembly',
    node_part_number: 'BAJA25-BR-100',
    change_package_id: null,
    asset_instance_id: 'asset-vehicle-002',
    status: CASE_STATUS.CLOSED,
    current_discipline: 8,
    due_date: '2025-01-10',
    target_closure_date: '2025-01-12',
    actual_closure_date: '2025-01-11T17:00:00Z',
    created_at: '2025-01-08T14:00:00Z',
    updated_at: '2025-01-11T17:00:00Z',
    age_days: 3,
    team_members: [
      { ...TEAM_MEMBERS.mike, role: 'Team Lead' },
      { ...TEAM_MEMBERS.john, role: 'Member' }
    ],
    disciplines: [
      { number: 0, name: 'Prepare', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 1, name: 'Team', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 2, name: 'Problem', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 3, name: 'Containment', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 4, name: 'Root Cause', status: DISCIPLINE_STATUS.COMPLETED, content: {
        root_cause: 'Torque wrench out of calibration'
      }},
      { number: 5, name: 'Corrective', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 6, name: 'Implementation', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 7, name: 'Prevention', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 8, name: 'Closure', status: DISCIPLINE_STATUS.COMPLETED, content: {
        lessons_learned: 'Implement torque wrench calibration schedule and pre-use verification',
        recognition: 'Team completed in 3 days - excellent response to safety-critical issue'
      }}
    ],
    actions: [],
    evidence: []
  },
  {
    id: '8d-case-005',
    case_number: '8D-2025-0025',
    title: 'Suspension Bushing Premature Wear',
    description: 'Observation of accelerated wear on front A-arm bushings during routine inspection.',
    severity: SEVERITY_LEVELS.OBSERVATION,
    priority: PRIORITY_LEVELS.LOW,
    owner: TEAM_MEMBERS.alice,
    team_lead: TEAM_MEMBERS.alice,
    created_by: TEAM_MEMBERS.jane,
    project_id: 'proj-baja-2025',
    project_name: 'Baja 2025',
    node_id: 'node-su-111',
    node_name: 'Front A-Arm',
    node_part_number: 'BAJA25-SU-111',
    change_package_id: null,
    asset_instance_id: null,
    status: CASE_STATUS.OPEN,
    current_discipline: 2,
    due_date: '2025-02-28',
    target_closure_date: '2025-03-15',
    actual_closure_date: null,
    created_at: '2025-01-10T11:00:00Z',
    updated_at: '2025-01-14T09:30:00Z',
    age_days: 5,
    team_members: [
      { ...TEAM_MEMBERS.alice, role: 'Team Lead' }
    ],
    disciplines: [
      { number: 0, name: 'Prepare', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 1, name: 'Team', status: DISCIPLINE_STATUS.COMPLETED, content: {} },
      { number: 2, name: 'Problem', status: DISCIPLINE_STATUS.IN_PROGRESS, content: {} },
      { number: 3, name: 'Containment', status: DISCIPLINE_STATUS.NOT_STARTED, content: null },
      { number: 4, name: 'Root Cause', status: DISCIPLINE_STATUS.NOT_STARTED, content: null },
      { number: 5, name: 'Corrective', status: DISCIPLINE_STATUS.NOT_STARTED, content: null },
      { number: 6, name: 'Implementation', status: DISCIPLINE_STATUS.NOT_STARTED, content: null },
      { number: 7, name: 'Prevention', status: DISCIPLINE_STATUS.NOT_STARTED, content: null },
      { number: 8, name: 'Closure', status: DISCIPLINE_STATUS.NOT_STARTED, content: null }
    ],
    actions: [],
    evidence: []
  }
];

// Computed statistics
export const compute8DStats = (cases) => {
  const stats = {
    total: cases.length,
    open: cases.filter(c => c.status === CASE_STATUS.OPEN).length,
    inProgress: cases.filter(c => c.status === CASE_STATUS.IN_PROGRESS).length,
    pendingVerification: cases.filter(c => c.status === CASE_STATUS.PENDING_VERIFICATION).length,
    closed: cases.filter(c => c.status === CASE_STATUS.CLOSED).length,
    critical: cases.filter(c => c.severity === SEVERITY_LEVELS.CRITICAL && c.status !== CASE_STATUS.CLOSED).length,
    overdue: cases.filter(c => {
      if (c.status === CASE_STATUS.CLOSED) return false;
      return new Date(c.due_date) < new Date();
    }).length
  };
  return stats;
};

export default DEMO_8D_CASES;
