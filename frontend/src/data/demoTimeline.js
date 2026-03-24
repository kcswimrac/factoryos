/**
 * Demo Timeline Data
 *
 * Timeline bars are DERIVED from real system objects and their timestamps.
 * This is NOT a generic task manager.
 */

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

export const BAR_STATUS = {
  COMPLETED: 'completed',
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk',
  OVERDUE: 'overdue',
  PLANNED: 'planned'
};

// Demo project timeline data
export const DEMO_TIMELINE_DATA = {
  year: 2025,
  today: '2025-01-15',
  projects: [
    {
      id: 'proj-baja-2025',
      name: 'Baja 2025',
      type: 'project',
      bar: {
        start: '2024-09-01',
        end: null,
        planned_start: '2024-09-01',
        planned_end: '2025-06-13',
        status: BAR_STATUS.ON_TRACK,
        progress: 45 // percent
      },
      milestones: [
        {
          type: MILESTONE_TYPES.BUILD_COMPLETE,
          name: 'Vehicle Build Complete',
          target_date: '2025-05-15',
          actual_date: null,
          status: 'pending'
        },
        {
          type: MILESTONE_TYPES.TESTING_COMPLETE,
          name: 'All Testing Complete',
          target_date: '2025-05-30',
          actual_date: null,
          status: 'pending'
        },
        {
          type: MILESTONE_TYPES.VALIDATION_COMPLETE,
          name: 'Validation Package Approved',
          target_date: '2025-06-06',
          actual_date: null,
          status: 'pending'
        },
        {
          type: MILESTONE_TYPES.REWORK_COMPLETE,
          name: 'Final Rework Complete',
          target_date: '2025-06-10',
          actual_date: null,
          status: 'pending'
        },
        {
          type: MILESTONE_TYPES.COMPETITION,
          name: 'Baja SAE Competition',
          target_date: '2025-06-13',
          actual_date: null,
          status: 'pending'
        }
      ],
      children: {
        tests: [
          {
            id: 'test-001',
            name: 'Suspension Load Test',
            type: 'test',
            parent: 'BAJA25-SU-100 - Front Suspension Assembly',
            bar: {
              start: '2025-03-01',
              end: null,
              planned_end: '2025-03-15',
              status: BAR_STATUS.PLANNED
            }
          },
          {
            id: 'test-002',
            name: 'Brake Performance Test',
            type: 'test',
            parent: 'BAJA25-BR-100 - Brake Assembly',
            bar: {
              start: '2025-03-15',
              end: null,
              planned_end: '2025-04-01',
              status: BAR_STATUS.PLANNED
            }
          },
          {
            id: 'test-003',
            name: 'Drivetrain Endurance Test',
            type: 'test',
            parent: 'BAJA25-DT-100 - Gearbox Assembly',
            bar: {
              start: '2024-12-15',
              end: '2025-01-03',
              planned_end: '2025-01-15',
              status: BAR_STATUS.COMPLETED
            }
          },
          {
            id: 'test-004',
            name: 'Frame Torsional Rigidity Test',
            type: 'test',
            parent: 'BAJA25-CH-100 - Frame Assembly',
            bar: {
              start: '2025-02-01',
              end: null,
              planned_end: '2025-02-15',
              status: BAR_STATUS.PLANNED
            }
          },
          {
            id: 'test-005',
            name: 'CVT Engagement Test',
            type: 'test',
            parent: 'BAJA25-DT-200 - CVT Assembly',
            bar: {
              start: '2025-04-01',
              end: null,
              planned_end: '2025-04-15',
              status: BAR_STATUS.PLANNED
            }
          },
          {
            id: 'test-006',
            name: 'Full Vehicle Shakedown',
            type: 'test',
            parent: 'BAJA25-000 - Vehicle',
            bar: {
              start: '2025-05-01',
              end: null,
              planned_end: '2025-05-15',
              status: BAR_STATUS.PLANNED
            }
          }
        ],
        fixtures: [
          {
            id: 'fixture-001',
            name: 'Chassis Weld Fixture',
            type: 'fixture',
            bar: {
              start: '2024-10-15',
              end: '2024-12-01',
              planned_end: '2024-11-30',
              status: BAR_STATUS.COMPLETED
            }
          },
          {
            id: 'fixture-002',
            name: 'Suspension Assembly Fixture',
            type: 'fixture',
            bar: {
              start: '2024-11-01',
              end: null,
              planned_end: '2025-01-15',
              status: BAR_STATUS.AT_RISK
            }
          },
          {
            id: 'fixture-003',
            name: 'Gearbox Housing Drill Fixture',
            type: 'fixture',
            bar: {
              start: '2024-11-15',
              end: '2024-12-20',
              planned_end: '2024-12-15',
              status: BAR_STATUS.COMPLETED
            }
          },
          {
            id: 'fixture-004',
            name: 'A-Arm Weld Jig',
            type: 'fixture',
            bar: {
              start: '2025-01-05',
              end: null,
              planned_end: '2025-02-01',
              status: BAR_STATUS.ON_TRACK
            }
          },
          {
            id: 'fixture-005',
            name: 'Brake Caliper Inspection Gauge',
            type: 'fixture',
            bar: {
              start: '2025-02-01',
              end: null,
              planned_end: '2025-02-15',
              status: BAR_STATUS.PLANNED
            }
          }
        ],
        studies: [
          {
            id: 'study-001',
            name: 'Gear Ratio Optimization DOE',
            type: 'doe',
            parent: 'BAJA25-DT-100 - Gearbox Assembly',
            bar: {
              start: '2024-10-01',
              end: '2024-11-15',
              status: BAR_STATUS.COMPLETED
            }
          },
          {
            id: 'study-002',
            name: 'Gearbox Thermal Analysis',
            type: 'parametric',
            parent: 'BAJA25-DT-100 - Gearbox Assembly',
            bar: {
              start: '2024-11-01',
              end: '2024-12-01',
              status: BAR_STATUS.COMPLETED
            }
          },
          {
            id: 'study-003',
            name: 'Front Suspension Geometry Trade Study',
            type: 'trade_study',
            parent: 'BAJA25-SU-100 - Front Suspension Assembly',
            bar: {
              start: '2024-09-15',
              end: '2024-10-30',
              status: BAR_STATUS.COMPLETED
            }
          },
          {
            id: 'study-004',
            name: 'Spring Rate Optimization DOE',
            type: 'doe',
            parent: 'BAJA25-SU-100 - Front Suspension Assembly',
            bar: {
              start: '2024-12-01',
              end: null,
              planned_end: '2025-01-30',
              status: BAR_STATUS.ON_TRACK
            }
          },
          {
            id: 'study-005',
            name: 'Input Shaft Fatigue Life Sensitivity',
            type: 'sensitivity',
            parent: 'BAJA25-DT-111 - Input Shaft',
            bar: {
              start: '2025-01-10',
              end: null,
              planned_end: '2025-02-15',
              status: BAR_STATUS.ON_TRACK
            }
          }
        ]
      },
      expandable: true,
      expanded: false
    },
    {
      id: 'proj-formula-2025',
      name: 'Formula 2025',
      type: 'project',
      bar: {
        start: '2024-10-15',
        end: null,
        planned_start: '2024-10-15',
        planned_end: '2025-08-01',
        status: BAR_STATUS.ON_TRACK,
        progress: 25
      },
      milestones: [
        {
          type: MILESTONE_TYPES.REVIEW,
          name: 'Design Review 1',
          target_date: '2025-02-01',
          actual_date: null,
          status: 'pending'
        },
        {
          type: MILESTONE_TYPES.BUILD_COMPLETE,
          name: 'Chassis Build Complete',
          target_date: '2025-04-15',
          actual_date: null,
          status: 'pending'
        },
        {
          type: MILESTONE_TYPES.TESTING_COMPLETE,
          name: 'Testing Complete',
          target_date: '2025-07-01',
          actual_date: null,
          status: 'pending'
        },
        {
          type: MILESTONE_TYPES.COMPETITION,
          name: 'Formula SAE Competition',
          target_date: '2025-08-01',
          actual_date: null,
          status: 'pending'
        }
      ],
      children: {
        tests: [
          {
            id: 'form-test-001',
            name: 'Monocoque Torsion Test',
            type: 'test',
            parent: 'FORM25-CH-100 - Monocoque',
            bar: {
              start: '2025-04-01',
              end: null,
              planned_end: '2025-04-15',
              status: BAR_STATUS.PLANNED
            }
          },
          {
            id: 'form-test-002',
            name: 'Aero Package Wind Tunnel',
            type: 'test',
            parent: 'FORM25-AE-100 - Aero Package',
            bar: {
              start: '2025-03-01',
              end: null,
              planned_end: '2025-03-15',
              status: BAR_STATUS.PLANNED
            }
          },
          {
            id: 'form-test-003',
            name: 'Powertrain Dyno Test',
            type: 'test',
            parent: 'FORM25-PT-100 - Powertrain',
            bar: {
              start: '2025-05-01',
              end: null,
              planned_end: '2025-05-30',
              status: BAR_STATUS.PLANNED
            }
          }
        ],
        fixtures: [
          {
            id: 'form-fix-001',
            name: 'Monocoque Layup Mold',
            type: 'fixture',
            bar: {
              start: '2024-11-01',
              end: null,
              planned_end: '2025-02-01',
              status: BAR_STATUS.ON_TRACK
            }
          },
          {
            id: 'form-fix-002',
            name: 'Suspension Pickup Jig',
            type: 'fixture',
            bar: {
              start: '2025-01-15',
              end: null,
              planned_end: '2025-03-01',
              status: BAR_STATUS.PLANNED
            }
          }
        ],
        studies: [
          {
            id: 'form-study-001',
            name: 'Aero Balance Optimization',
            type: 'doe',
            parent: 'FORM25-AE-100 - Aero Package',
            bar: {
              start: '2024-11-15',
              end: '2025-01-10',
              status: BAR_STATUS.COMPLETED
            }
          },
          {
            id: 'form-study-002',
            name: 'Suspension Kinematics Study',
            type: 'parametric',
            parent: 'FORM25-SU-100 - Suspension',
            bar: {
              start: '2024-12-01',
              end: null,
              planned_end: '2025-02-01',
              status: BAR_STATUS.ON_TRACK
            }
          }
        ]
      },
      expandable: true,
      expanded: false
    },
    {
      id: 'proj-clean-snowmobile-2025',
      name: 'Clean Snowmobile 2025',
      type: 'project',
      bar: {
        start: '2024-08-01',
        end: null,
        planned_start: '2024-08-01',
        planned_end: '2025-03-15',
        status: BAR_STATUS.AT_RISK,
        progress: 60
      },
      milestones: [
        {
          type: MILESTONE_TYPES.BUILD_COMPLETE,
          name: 'Powertrain Integration',
          target_date: '2025-01-30',
          actual_date: null,
          status: 'at_risk'
        },
        {
          type: MILESTONE_TYPES.TESTING_COMPLETE,
          name: 'Emissions Testing',
          target_date: '2025-02-28',
          actual_date: null,
          status: 'pending'
        },
        {
          type: MILESTONE_TYPES.COMPETITION,
          name: 'SAE Clean Snowmobile',
          target_date: '2025-03-15',
          actual_date: null,
          status: 'pending'
        }
      ],
      children: {
        tests: [],
        fixtures: [],
        studies: []
      },
      expandable: true,
      expanded: false
    }
  ]
};

// Helper to get month position (0-11)
export const getMonthPosition = (dateStr, year) => {
  const date = new Date(dateStr);
  if (date.getFullYear() < year) return -1;
  if (date.getFullYear() > year) return 12;
  return date.getMonth() + (date.getDate() / 31);
};

// Helper to calculate bar width as percentage
export const calculateBarPosition = (startDate, endDate, year) => {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  // Clamp to year boundaries
  const clampedStart = start < yearStart ? yearStart : start;
  const clampedEnd = end > yearEnd ? yearEnd : end;

  const yearDuration = yearEnd - yearStart;
  const startOffset = ((clampedStart - yearStart) / yearDuration) * 100;
  const width = ((clampedEnd - clampedStart) / yearDuration) * 100;

  return {
    left: Math.max(0, startOffset),
    width: Math.max(0, Math.min(100 - startOffset, width))
  };
};

export default DEMO_TIMELINE_DATA;
