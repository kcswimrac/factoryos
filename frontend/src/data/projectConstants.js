/**
 * Project Constants - Shared constants for engineering projects
 *
 * Extracted to avoid circular dependencies between demoProjects.js and demoISRDrone.js
 */

export const NODE_CLASSES = {
  FUNCTIONAL_GROUP: 'functional_group',
  PRODUCT: 'product',
  MANUFACTURING_ASSET: 'manufacturing_asset',
  TEST_ASSET: 'test_asset'
};

export const NODE_TYPES = {
  ASSY: 'ASSY',
  SUBSYS: 'SUBSYS',
  SUBASSY: 'SUBASSY',
  COMP: 'COMP',
  PURCH: 'PURCH',
  DOC: 'DOC'
};

export const FIXTURE_TYPES = {
  WELD_FIXTURE: 'weld_fixture',
  ASSEMBLY_FIXTURE: 'assembly_fixture',
  DRILL_FIXTURE: 'drill_fixture',
  INSPECTION_FIXTURE: 'inspection_fixture',
  HANDLING_FIXTURE: 'handling_fixture'
};

export const PROJECT_MODES = {
  NEW_DESIGN: 'mode_a',
  PLATFORM_MOD: 'mode_b'
};

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  ARCHIVED: 'archived'
};

export const PHASE_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
};

export const ATTACHMENT_TYPES = {
  CAD: 'cad',
  DRAWING: 'drawing',
  TEST_REPORT: 'test_report',
  ANALYSIS: 'analysis',
  FIXTURE: 'fixture',
  WORK_INSTRUCTION: 'work_instruction',
  REQUIREMENTS: 'requirements',
  ICD: 'icd',
  SUPPLIER: 'supplier'
};

export const STUDY_TYPES = {
  DOE: 'doe',
  PARAMETRIC: 'parametric',
  SENSITIVITY: 'sensitivity',
  TRADE_STUDY: 'trade_study',
  RELIABILITY: 'reliability'
};

export const STUDY_INTENTS = {
  RESEARCH: 'research',
  VALIDATION: 'validation',
  OPTIMIZATION: 'optimization',
  REGRESSION: 'regression',
  CORRELATION: 'correlation'
};

export const TEST_LEVELS = {
  COMPONENT: 'component',
  SYSTEM: 'system',
  FULL_SYSTEM: 'full_system'
};
