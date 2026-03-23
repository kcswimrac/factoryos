// Engineering Design Cycle Components
// 7-Phase Implementation with Sub-phases, Rigor Tiers, and AI Scoring
// Includes Project Hierarchy, Reports, and Rollup Metrics
// Domain-agnostic with Domain Lens support

// Core Phase Components
export { default as AIScorePanel } from './AIScorePanel';
export { default as RigorTierBadge } from './RigorTierBadge';
export { default as RigorTierSelector } from './RigorTierSelector';
export { default as RequirementsManager } from './RequirementsManager';
export { default as GateApprovalPanel } from './GateApprovalPanel';
export { default as PhaseNavigator } from './PhaseNavigator';
export { default as RevisionTimeline } from './RevisionTimeline';
export { default as InterfaceControlPanel } from './InterfaceControlPanel';

// Node Workbench Components (Consolidated Right Column)
export { default as NodeWorkbenchPanel } from './NodeWorkbenchPanel';
export { default as PhaseDrawer } from './PhaseDrawer';

// Domain-Agnostic Engineering Components
export { default as DomainLensSelector } from './DomainLensSelector';
export { default as SpecificationLevelSelector } from './SpecificationLevelSelector';
export { default as ServiceabilityPanel } from './ServiceabilityPanel';
export { default as ManufacturabilityPanel } from './ManufacturabilityPanel';
export { default as InnovationTracker } from './InnovationTracker';
export { default as TestLevelBadge, TestLevelSelector } from './TestLevelBadge';

// Node Type and Hierarchy Components
export { default as NodeTypeBadge } from './NodeTypeBadge';
export { default as NodeTypeSelector } from './NodeTypeSelector';
export { default as TreeFilters } from './TreeFilters';
export { default as TreeRollupMetrics } from './TreeRollupMetrics';

// Node Class Components (Functional vs Physical distinction)
export { default as NodeClassBadge } from './NodeClassBadge';
export {
  NodeClassIndicator,
  FunctionalGroupHeader,
  PhysicalNodeHeader
} from './NodeClassBadge';

// Manufacturing Asset Components
export { default as FixtureTypeBadge } from './FixtureTypeBadge';

// Node-Centric Artifact Components (DOE, fixtures, tests belong to nodes, not phases)
export { default as EngineeringStudyPanel } from './EngineeringStudyPanel';
export { default as NodeManufacturingAssetsPanel } from './NodeManufacturingAssetsPanel';
export { default as NodeTestValidationPanel } from './NodeTestValidationPanel';

// Specifications Panel (Engineering specs with hierarchy and inheritance)
export { default as SpecificationsPanel } from './SpecificationsPanel';
export { getNodeSpecifications, countSpecsByStatus } from './SpecificationsPanel';

// Design Notebook Component
export { default as NotebookPanel } from './NotebookPanel';

// Project Hierarchy Navigation
export { default as ProjectTreeView } from './ProjectTreeView';

// Report Components
export { default as ReportGeneratorWizard } from './ReportGeneratorWizard';
export { default as ReportHistoryPanel } from './ReportHistoryPanel';
export { default as ArtifactIndexViewer } from './ArtifactIndexViewer';

// Main Entry Points
export { default as DesignCycleHome } from './DesignCycleHome';
export { default as DesignCycleWizard } from './DesignCycleWizard';
