import React, { useState, useMemo, useEffect } from 'react';
import {
  Save, MessageSquare, ChevronRight, Check, Circle,
  Ruler, FileBox, FlaskConical, ClipboardCheck, Wrench,
  BookOpen, Layers, AlertTriangle, X,
  Image, Link2, Upload, Settings, Sparkles, Info
} from 'lucide-react';
import RigorTierBadge from './RigorTierBadge';
import { getNodeClassConfig } from '../../config/designPhases';
import { getNodeArtifactSummary } from '../../utils/treeViewUtils';
import { getNodeSpecifications, countSpecsByStatus } from './SpecificationsPanel';

// Import panels
import SpecificationsPanel from './SpecificationsPanel';
import NotebookPanel from './NotebookPanel';
import EngineeringStudyPanel from './EngineeringStudyPanel';
import NodeTestValidationPanel from './NodeTestValidationPanel';
import NodeManufacturingAssetsPanel from './NodeManufacturingAssetsPanel';

// =============================================================================
// WORKBENCH TAB CONFIGURATION
// =============================================================================

const WORKBENCH_TABS = [
  { id: 'specs', label: 'Specs', icon: Ruler, color: 'indigo' },
  { id: 'cad', label: 'CAD', icon: FileBox, color: 'violet' },
  { id: 'studies', label: 'Studies', icon: FlaskConical, color: 'cyan' },
  { id: 'tests', label: 'Tests', icon: ClipboardCheck, color: 'green' },
  { id: 'fixtures', label: 'Fixtures', icon: Wrench, color: 'orange' },
  { id: 'notebook', label: 'Notebook', icon: BookOpen, color: 'slate' }
];

// =============================================================================
// PHASE PROGRESS STRIP COMPONENT
// =============================================================================

function PhaseProgressStrip({ phase, progress, totalPhases = 7, onOpenPhaseDrawer, checklistCompletion }) {
  const phaseKey = phase?.subPhase ? `${phase.number}${phase.subPhase}` : `${phase?.number || 1}`;
  const phaseLabel = phase?.name || 'Define Requirements';

  return (
    <div
      className="bg-[#1C1F24] border-b border-[#2A2F36] px-4 py-2 cursor-pointer hover:bg-[#22262C] transition-colors"
      onClick={onOpenPhaseDrawer}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#B4BAC4]">
            Phase {phaseKey} of {totalPhases}
          </span>
          <span className="text-xs text-[#6B7280]">•</span>
          <span className="text-xs text-[#6B7280] truncate max-w-[200px]">{phaseLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          {checklistCompletion && (
            <span className="text-xs text-[#6B7280]">
              {checklistCompletion.completed}/{checklistCompletion.total} completed
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-[#6B7280]" />
        </div>
      </div>
      {/* 7-segment progress bar */}
      <div className="flex gap-0.5 mt-2">
        {[1, 2, 3, 4, 5, 6, 7].map((seg) => {
          const isActive = phase?.number >= seg;
          const isCurrent = phase?.number === seg;
          return (
            <div
              key={seg}
              className={`h-1 flex-1 rounded-full transition-colors ${
                isCurrent
                  ? 'bg-blue-500'
                  : isActive
                    ? 'bg-emerald-500'
                    : 'bg-slate-700'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// NODE HEADER COMPONENT
// =============================================================================

function NodeHeader({ node, project, onSave, onOpenAI, saving }) {
  const nodeClassConfig = getNodeClassConfig(node?.node_class);
  const isFunctionalGroup = node?.node_class === 'functional_group';

  // Get domain badges
  const getDomainBadges = () => {
    if (!node?.domains || node.domains.length === 0) return null;
    return (
      <div className="flex gap-1">
        {node.domains.slice(0, 3).map((domain, idx) => (
          <span
            key={idx}
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400"
          >
            {domain}
          </span>
        ))}
        {node.domains.length > 3 && (
          <span className="text-[10px] text-slate-500">+{node.domains.length - 3}</span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#15181C] border-b border-[#2A2F36] px-4 py-3">
      <div className="flex items-start justify-between">
        {/* Node Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-[#F0F2F4] truncate">
              {node?.name || 'Select a node'}
            </h2>
            {node?.revision && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                Rev {node.revision}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {node?.part_number && (
              <span className="text-xs font-mono text-[#6B7280]">{node.part_number}</span>
            )}
            {nodeClassConfig && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${nodeClassConfig.bgColor} ${nodeClassConfig.textColor}`}>
                {nodeClassConfig.label}
              </span>
            )}
            {project?.rigorTier && (
              <RigorTierBadge tier={project.rigorTier} compact />
            )}
            {getDomainBadges()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-3">
          {/* AI Score Chip */}
          {node?.ai_score !== undefined && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-medium text-blue-400">{node.ai_score}%</span>
            </div>
          )}

          <button
            onClick={onOpenAI}
            className="p-2 rounded-lg bg-[#1C1F24] border border-[#2A2F36] text-[#B4BAC4] hover:bg-[#22262C] hover:text-[#F0F2F4] transition-colors"
            title="AI Assistant"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              saving
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// WORKBENCH TAB BUTTON COMPONENT
// =============================================================================

function WorkbenchTabButton({ tab, isActive, count, hasWarning, disabled, onClick }) {
  const Icon = tab.icon;
  const colorMap = {
    indigo: { active: 'bg-indigo-600 text-white', badge: 'bg-indigo-500' },
    violet: { active: 'bg-violet-600 text-white', badge: 'bg-violet-500' },
    cyan: { active: 'bg-cyan-600 text-white', badge: 'bg-cyan-500' },
    green: { active: 'bg-green-600 text-white', badge: 'bg-green-500' },
    orange: { active: 'bg-orange-600 text-white', badge: 'bg-orange-500' },
    slate: { active: 'bg-slate-600 text-white', badge: 'bg-slate-500' },
    blue: { active: 'bg-blue-600 text-white', badge: 'bg-blue-500' }
  };
  const colors = colorMap[tab.color] || colorMap.slate;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        disabled
          ? 'bg-[#1C1F24]/50 text-[#6B7280] cursor-not-allowed opacity-50'
          : isActive
            ? colors.active
            : 'bg-[#1C1F24] text-[#B4BAC4] hover:bg-[#22262C]'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{tab.label}</span>
      {count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          isActive ? 'bg-white/20 text-white' : colors.badge + '/20 text-' + tab.color + '-400'
        }`}>
          {count}
        </span>
      )}
      {hasWarning && (
        <AlertTriangle className="w-3 h-3 text-amber-400 absolute -top-1 -right-1" />
      )}
    </button>
  );
}

// =============================================================================
// CAD PANEL COMPONENT
// =============================================================================

function CADPanel({ node, onLinkCad, onUploadCad }) {
  const cadAttachments = node?.attachments?.filter(a =>
    a.type === 'cad' || a.type === 'drawing' || a.mime_type?.includes('cad')
  ) || [];

  return (
    <div className="p-4 space-y-4">
      {/* Section Summary */}
      <div className="bg-violet-500/5 border border-violet-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#B4BAC4] leading-relaxed">
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Purpose:</strong> CAD files capture the 3D geometry, mass properties, and spatial relationships that define how this node is physically realized. They serve as the single source of truth for manufacturing and analysis.
            </p>
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Method:</strong> CAD models are linked to specific nodes with revision tracking. Native files, STEP exports, and 2D drawings can all be attached. The system maintains parent-child relationships to ensure assemblies stay synchronized.
            </p>
            <p>
              <strong className="text-[#F0F2F4]">Outcome:</strong> Provides geometry for FEA/CFD analysis, generates manufacturing drawings, enables clash detection, and serves as the basis for toolpath generation and inspection criteria.
            </p>
          </div>
        </div>
      </div>

      {/* CAD Files Section */}
      {cadAttachments.length === 0 ? (
        <div className="text-center py-12">
          <FileBox className="w-12 h-12 text-[#6B7280] mx-auto mb-3" />
          <p className="text-[#B4BAC4] mb-2">No CAD files linked</p>
          <p className="text-xs text-[#6B7280] mb-4">Link or upload CAD files to this node</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={onLinkCad}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1C1F24] border border-[#2A2F36] text-[#B4BAC4] hover:bg-[#22262C] transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Link CAD
            </button>
            <button
              onClick={onUploadCad}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload CAD
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#F0F2F4]">CAD Files ({cadAttachments.length})</h3>
            <div className="flex gap-2">
              <button
                onClick={onLinkCad}
                className="text-xs px-2 py-1 rounded bg-[#1C1F24] text-[#B4BAC4] hover:bg-[#22262C]"
              >
                <Link2 className="w-3 h-3 inline mr-1" />
                Link
              </button>
              <button
                onClick={onUploadCad}
                className="text-xs px-2 py-1 rounded bg-violet-600/20 text-violet-400 hover:bg-violet-600/30"
              >
                <Upload className="w-3 h-3 inline mr-1" />
                Upload
              </button>
            </div>
          </div>
          {cadAttachments.map((cad, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-[#1C1F24] rounded-lg border border-[#2A2F36]">
              {cad.thumbnail_url ? (
                <img src={cad.thumbnail_url} alt="" className="w-12 h-9 object-cover rounded bg-[#0F1114]" />
              ) : (
                <div className="w-12 h-9 bg-[#0F1114] rounded flex items-center justify-center">
                  <FileBox className="w-5 h-5 text-violet-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#F0F2F4] truncate">{cad.filename || cad.name}</p>
                <p className="text-xs text-[#6B7280]">
                  {cad.format || 'Unknown format'} • Rev {cad.revision || 'A'}
                </p>
              </div>
              <button className="p-1.5 rounded hover:bg-[#22262C] text-[#6B7280] hover:text-[#F0F2F4]">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN NODE WORKBENCH PANEL
// =============================================================================

function NodeWorkbenchPanel({
  node,
  project,
  fullProjectData,
  phase,
  phaseProgress,
  checklistCompletion,
  onOpenPhaseDrawer,
  onSave,
  onOpenAI,
  onLinkCad,
  onUploadCad,
  onNavigateToTest,
  saving = false,
  readOnly = false
}) {
  // Persist last selected tab
  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('workbench-tab');
    return saved || 'specs';
  });

  // Get artifact counts for badges
  const artifactCounts = useMemo(() => {
    if (!node) return {};
    const summary = getNodeArtifactSummary(node);

    // Get spec counts
    const specs = fullProjectData?.specifications || [];
    const specResult = getNodeSpecifications(node, specs, fullProjectData?.root_node);
    const ownedSpecs = specResult.nodeSpecs || [];
    const specCounts = countSpecsByStatus(ownedSpecs);

    return {
      specs: ownedSpecs.length,
      specsNeedingQuantification: specCounts.needs_quantification || 0,
      cad: summary.cad,
      studies: summary.studies,
      tests: summary.tests,
      fixtures: summary.fixtures,
      notebook: node.notebook_entries?.length || 0
    };
  }, [node, fullProjectData, project]);

  // Smart default tab selection
  useEffect(() => {
    if (!node) return;

    // If node has 0 CAD and we're on CAD tab, switch to specs
    if (activeTab === 'cad' && artifactCounts.cad === 0) {
      setActiveTab('specs');
    }
    // If node has specs needing quantification, default to specs
    else if (artifactCounts.specsNeedingQuantification > 0 && activeTab !== 'specs') {
      setActiveTab('specs');
    }
  }, [node?.id]);

  // Persist tab selection
  useEffect(() => {
    sessionStorage.setItem('workbench-tab', activeTab);
  }, [activeTab]);

  // Get tab count for each tab
  const getTabCount = (tabId) => {
    switch (tabId) {
      case 'specs': return artifactCounts.specs;
      case 'cad': return artifactCounts.cad;
      case 'studies': return artifactCounts.studies;
      case 'tests': return artifactCounts.tests;
      case 'fixtures': return artifactCounts.fixtures;
      case 'notebook': return artifactCounts.notebook;
      default: return 0;
    }
  };

  // Check if tab has warning (e.g., specs needing quantification)
  const hasTabWarning = (tabId) => {
    if (tabId === 'specs' && artifactCounts.specsNeedingQuantification > 0) {
      return true;
    }
    return false;
  };

  // Check if tab is disabled
  const isTabDisabled = () => {
    return false;
  };

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0F1114] border border-[#2A2F36] rounded-xl">
        <div className="text-center">
          <Layers className="w-12 h-12 text-[#6B7280] mx-auto mb-3" />
          <p className="text-[#B4BAC4]">Select a node from the tree</p>
          <p className="text-xs text-[#6B7280] mt-1">to view and edit its details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0F1114] border border-[#2A2F36] rounded-xl overflow-hidden">
      {/* A) Sticky Node Header */}
      <NodeHeader
        node={node}
        project={project}
        onSave={onSave}
        onOpenAI={onOpenAI}
        saving={saving}
      />

      {/* B) Sticky Phase Progress Strip */}
      <PhaseProgressStrip
        phase={phase}
        progress={phaseProgress}
        onOpenPhaseDrawer={onOpenPhaseDrawer}
        checklistCompletion={checklistCompletion}
      />

      {/* C) Workbench Switcher Row */}
      <div className="bg-[#15181C] border-b border-[#2A2F36] px-3 py-2">
        <div className="flex gap-1 flex-wrap">
          {WORKBENCH_TABS.map(tab => (
            <WorkbenchTabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              count={getTabCount(tab.id)}
              hasWarning={hasTabWarning(tab.id)}
              disabled={isTabDisabled(tab.id)}
              onClick={() => !isTabDisabled(tab.id) && setActiveTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* D) Scrollable Workbench Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'specs' && (
          <SpecificationsPanel
            specifications={fullProjectData?.specifications || []}
            node={node}
            projectHierarchy={fullProjectData?.root_node}
            onAdd={() => console.log('Add specification')}
            onEdit={(spec) => console.log('Edit specification', spec)}
            onViewDetails={(spec) => console.log('View spec details', spec)}
            onNavigateToTest={onNavigateToTest}
            readOnly={readOnly}
            showInheritedSpecs={true}
          />
        )}

        {activeTab === 'cad' && (
          <CADPanel
            node={node}
            onLinkCad={() => onLinkCad?.(node)}
            onUploadCad={() => onUploadCad?.(node)}
          />
        )}

        {activeTab === 'studies' && (
          <EngineeringStudyPanel
            nodeId={node.id}
            nodeName={node.name}
            partNumber={node.part_number}
            studies={fullProjectData?.studies?.filter(s =>
              s.owning_node_part_number === node.part_number
            ) || []}
            onAddStudy={() => console.log('Add study')}
            onViewStudy={(study) => console.log('View study', study)}
            readOnly={readOnly}
          />
        )}

        {activeTab === 'tests' && (
          <NodeTestValidationPanel
            nodeId={node.id}
            nodeName={node.name}
            partNumber={node.part_number}
            testCases={fullProjectData?.test_cases?.filter(t =>
              t.owning_node_part_number === node.part_number
            ) || []}
            onAddTest={() => console.log('Add test')}
            onViewTest={(test) => console.log('View test', test)}
            onRunTest={(test) => console.log('Run test', test)}
            readOnly={readOnly}
          />
        )}

        {activeTab === 'fixtures' && (
          <NodeManufacturingAssetsPanel
            nodeId={node.id}
            nodeName={node.name}
            partNumber={node.part_number}
            fixtures={fullProjectData?.fixtures?.filter(f =>
              f.owning_node_part_number === node.part_number
            ) || []}
            onAddFixture={() => console.log('Add fixture')}
            onViewFixture={(fixture) => console.log('View fixture', fixture)}
            readOnly={readOnly}
          />
        )}

        {activeTab === 'notebook' && (
          <NotebookPanel
            nodeId={node.id}
            nodeName={node.name}
            projectId={project?.id}
            entries={node.notebook_entries || []}
            onAddEntry={(entry) => console.log('Add notebook entry:', entry)}
            onViewEntry={(entryId) => console.log('View notebook entry:', entryId)}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  );
}

export default NodeWorkbenchPanel;
