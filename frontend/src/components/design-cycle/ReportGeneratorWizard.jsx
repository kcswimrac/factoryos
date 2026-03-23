import React, { useState, useMemo } from 'react';
import {
  FileText,
  Link,
  Calculator,
  FlaskConical,
  Shield,
  Award,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Download,
  Loader2,
  Globe,
  FolderTree,
  Clock,
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';
import {
  REPORT_TYPES,
  REPORT_FORMATS,
  REPORT_STATUS,
  COMPLETE_REPORT_SECTIONS
} from '../../config/designPhases';
import {
  generateReportStatusSummary,
  computeOverallStatus,
  getExportConfig
} from '../../utils/reportValidation';

// Icon mapping for report types
const REPORT_ICONS = {
  complete_design_report: BookOpen,
  design_summary: FileText,
  requirements_traceability: Link,
  analysis_pack: Calculator,
  test_validation_pack: FlaskConical,
  gate_approvals_audit: Shield,
  stakeholder_review: Users,
  competition_judging: Award
};

// Step definitions - varies based on report type
const getSteps = (reportType) => {
  if (reportType === 'complete_design_report') {
    return ['scope', 'type', 'structure', 'review'];
  }
  return ['scope', 'type', 'options', 'review'];
};

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

function StatusBadge({ status }) {
  const colors = {
    VALIDATED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    IN_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    DRAFT: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };

  const icons = {
    VALIDATED: CheckCircle2,
    IN_REVIEW: Clock,
    DRAFT: AlertCircle
  };

  const Icon = icons[status.code] || AlertCircle;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded border ${colors[status.code]}`}>
      <Icon className="w-3.5 h-3.5" />
      {status.label}
    </span>
  );
}

// =============================================================================
// SECTION STATUS CHIP
// =============================================================================

function SectionStatusChip({ status }) {
  const colors = {
    complete: 'bg-emerald-500/20 text-emerald-400',
    incomplete: 'bg-amber-500/20 text-amber-400',
    blocked: 'bg-red-500/20 text-red-400'
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[status.status]}`}>
      {status.label}
    </span>
  );
}

// =============================================================================
// BLOCKING ISSUES PANEL
// =============================================================================

function BlockingIssuesPanel({ blocking, expanded, onToggle }) {
  if (blocking.total === 0) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-300">
            {blocking.total} Blocking Issue{blocking.total !== 1 ? 's' : ''}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-red-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-red-400" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {blocking.missingArtifacts.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-red-300 mb-1">Missing Artifacts</h5>
              <div className="space-y-1">
                {blocking.missingArtifacts.map((item, idx) => (
                  <div key={idx} className="text-xs text-red-200/70 flex items-center gap-2">
                    <span className="text-red-400">•</span>
                    <span>Phase {item.phase}: {item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {blocking.missingGates.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-red-300 mb-1">Missing Gate Approvals</h5>
              <div className="space-y-1">
                {blocking.missingGates.map((item, idx) => (
                  <div key={idx} className="text-xs text-red-200/70 flex items-center gap-2">
                    <span className="text-red-400">•</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {blocking.traceCoverageGaps.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-red-300 mb-1">Trace Coverage Gaps</h5>
              <div className="space-y-1">
                {blocking.traceCoverageGaps.map((item, idx) => (
                  <div key={idx} className="text-xs text-red-200/70 flex items-center gap-2">
                    <span className="text-red-400">•</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {blocking.missingCorrelation.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-red-300 mb-1">Missing Correlation Data</h5>
              <div className="space-y-1">
                {blocking.missingCorrelation.map((item, idx) => (
                  <div key={idx} className="text-xs text-red-200/70 flex items-center gap-2">
                    <span className="text-red-400">•</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {blocking.missingInterfaceApprovals.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-red-300 mb-1">Missing Interface Approvals</h5>
              <div className="space-y-1">
                {blocking.missingInterfaceApprovals.map((item, idx) => (
                  <div key={idx} className="text-xs text-red-200/70 flex items-center gap-2">
                    <span className="text-red-400">•</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ReportGeneratorWizard({
  projectId,
  project = null,
  nodeId = null,
  nodeName = null,
  tier = 2,
  onGenerate,
  onClose
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState({
    scope: nodeId ? 'node' : 'project',
    nodeId: nodeId,
    nodeIds: nodeId ? [nodeId] : [],
    includeChildren: true,
    reportType: 'complete_design_report', // Default to Complete Design Report
    reportFormat: 'pdf',
    revisionId: null,
    includedPhases: null,
    // Section toggles for complete design report
    includedSections: Object.keys(COMPLETE_REPORT_SECTIONS).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}),
    exportMode: 'draft' // 'draft' or 'validated'
  });
  const [generating, setGenerating] = useState(false);
  const [blockingExpanded, setBlockingExpanded] = useState(false);

  const steps = getSteps(config.reportType);

  const updateConfig = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Compute report status summary
  const statusSummary = useMemo(() => {
    if (!project) {
      // Return mock data for demo
      return {
        status: REPORT_STATUS.DRAFT,
        evidence: 65,
        blocking: { total: 3, missingArtifacts: [], missingGates: [], traceCoverageGaps: [], missingCorrelation: [], missingInterfaceApprovals: [] },
        gates: { approved: 2, total: 4, percentage: 50 },
        trace: { traced: 12, total: 15, percentage: 80 },
        sections: {},
        canExportValidated: false,
        canExportDraft: true
      };
    }

    const scope = config.scope === 'project'
      ? { type: 'project' }
      : { type: 'node', nodeIds: config.nodeIds };

    return generateReportStatusSummary(project, scope, tier);
  }, [project, config.scope, config.nodeIds, tier]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const exportConfig = getExportConfig(statusSummary.status, config.exportMode);

      await onGenerate({
        project_id: projectId,
        node_id: config.scope === 'node' ? config.nodeId : null,
        node_ids: config.scope === 'node' ? config.nodeIds : null,
        include_children: config.includeChildren,
        report_type: config.reportType,
        report_format: config.reportFormat,
        revision_id: config.revisionId,
        included_phases: config.includedPhases,
        included_sections: config.reportType === 'complete_design_report' ? config.includedSections : null,
        export_mode: config.exportMode,
        export_config: exportConfig
      });
    } finally {
      setGenerating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return config.scope;
      case 1: return config.reportType;
      case 2: return config.reportFormat || config.reportType === 'complete_design_report';
      case 3: return true;
      default: return true;
    }
  };

  // Check if we need the structure step (for complete design report)
  const isCompleteReport = config.reportType === 'complete_design_report';

  return (
    <div className="bg-[#1C1F24] rounded-xl border border-[#2A2F36] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A2F36]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#F0F2F4]">Generate Report</h2>
            <p className="text-sm text-[#6B7280]">Step {currentStep + 1} of {steps.length}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#22262C] rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-[#6B7280]" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-1 px-4 py-2 bg-[#15181C]">
        {steps.map((step, idx) => (
          <div
            key={step}
            className={`flex-1 h-1 rounded-full transition-colors ${
              idx <= currentStep ? 'bg-blue-500' : 'bg-[#2A2F36]'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Step 1: Scope */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#F0F2F4]">Select Report Scope</h3>
            <p className="text-sm text-[#6B7280]">Choose what to include in the report.</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateConfig({ scope: 'project', nodeId: null, nodeIds: [] })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  config.scope === 'project'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[#2A2F36] hover:border-[#3A3F46]'
                }`}
              >
                <FolderTree className="w-8 h-8 text-blue-400 mb-2" />
                <h4 className="font-medium text-[#F0F2F4]">Entire Project</h4>
                <p className="text-sm text-[#6B7280] mt-1">
                  Generate report for all nodes in the project
                </p>
              </button>

              <button
                onClick={() => updateConfig({ scope: 'node', nodeId: nodeId, nodeIds: nodeId ? [nodeId] : [] })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  config.scope === 'node'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[#2A2F36] hover:border-[#3A3F46]'
                }`}
              >
                <FileText className="w-8 h-8 text-violet-400 mb-2" />
                <h4 className="font-medium text-[#F0F2F4]">Specific Node(s)</h4>
                <p className="text-sm text-[#6B7280] mt-1">
                  {nodeName ? `Report for "${nodeName}"` : 'Select specific nodes'}
                </p>
              </button>
            </div>

            {config.scope === 'node' && (
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeChildren}
                    onChange={(e) => updateConfig({ includeChildren: e.target.checked })}
                    className="w-4 h-4 rounded border-[#2A2F36] bg-[#15181C] text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-[#B4BAC4]">Include all child nodes</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Report Type */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-[#F0F2F4]">Select Report Type</h3>
            <p className="text-sm text-[#6B7280]">Choose the type of report to generate.</p>

            <div className="space-y-3">
              {Object.values(REPORT_TYPES).map((type, index) => {
                const Icon = REPORT_ICONS[type.key] || FileText;
                const isSelected = config.reportType === type.key;
                const isCompleteDesign = type.key === 'complete_design_report';

                return (
                  <button
                    key={type.key}
                    onClick={() => updateConfig({ reportType: type.key })}
                    className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? isCompleteDesign
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-blue-500 bg-blue-500/10'
                        : 'border-[#2A2F36] hover:border-[#3A3F46]'
                    } ${isCompleteDesign && index === 0 ? 'mb-4' : ''}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isSelected
                        ? isCompleteDesign ? 'bg-emerald-500/20' : 'bg-blue-500/20'
                        : 'bg-[#22262C]'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isSelected
                          ? isCompleteDesign ? 'text-emerald-400' : 'text-blue-400'
                          : 'text-[#6B7280]'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-[#F0F2F4]">{type.name}</h4>
                        {isSelected && <Check className={`w-4 h-4 ${isCompleteDesign ? 'text-emerald-400' : 'text-blue-400'}`} />}
                        {isCompleteDesign && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-medium">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6B7280] mt-0.5">{type.description}</p>

                      {/* Highlights for Complete Design Report */}
                      {isCompleteDesign && type.highlights && (
                        <div className="mt-2 space-y-1">
                          {type.highlights.map((highlight, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-emerald-400/80">
                              <span>•</span>
                              <span>{highlight}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Structure (for Complete Design Report) OR Options (for other reports) */}
        {currentStep === 2 && isCompleteReport && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-[#F0F2F4]">Scope & Structure</h3>
            <p className="text-sm text-[#6B7280]">Configure report sections and review validation status.</p>

            {/* Status Summary Panel */}
            <div className="bg-[#15181C] rounded-lg p-4 border border-[#2A2F36]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-[#9CA3AF]">Report Validation Status</h4>
                <StatusBadge status={statusSummary.status} />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#F0F2F4]">{statusSummary.evidence}%</div>
                  <div className="text-xs text-[#6B7280]">Evidence Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#F0F2F4]">{statusSummary.gates.approved}/{statusSummary.gates.total}</div>
                  <div className="text-xs text-[#6B7280]">Gates Approved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#F0F2F4]">{statusSummary.trace.percentage}%</div>
                  <div className="text-xs text-[#6B7280]">Trace Coverage</div>
                </div>
              </div>

              {/* Blocking Issues */}
              <BlockingIssuesPanel
                blocking={statusSummary.blocking}
                expanded={blockingExpanded}
                onToggle={() => setBlockingExpanded(!blockingExpanded)}
              />
            </div>

            {/* Section Toggles */}
            <div>
              <h4 className="text-sm font-medium text-[#9CA3AF] mb-3">Include Sections</h4>
              <p className="text-xs text-[#6B7280] mb-3">Section order is fixed and cannot be changed.</p>

              <div className="space-y-2">
                {Object.entries(COMPLETE_REPORT_SECTIONS)
                  .sort((a, b) => a[1].order - b[1].order)
                  .map(([key, section]) => {
                    const sectionStatus = statusSummary.sections[key] || { status: 'incomplete', label: 'Incomplete' };

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-[#15181C] rounded-lg border border-[#2A2F36]"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.includedSections[key]}
                            onChange={(e) => updateConfig({
                              includedSections: {
                                ...config.includedSections,
                                [key]: e.target.checked
                              }
                            })}
                            disabled={section.required}
                            className="w-4 h-4 rounded border-[#2A2F36] bg-[#0F1114] text-blue-500 focus:ring-blue-500 disabled:opacity-50"
                          />
                          <div>
                            <span className="text-sm text-[#F0F2F4]">
                              {section.order}. {section.name}
                            </span>
                            {section.required && (
                              <span className="ml-2 text-[10px] text-[#6B7280]">(Required)</span>
                            )}
                          </div>
                        </div>
                        <SectionStatusChip status={sectionStatus} />
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Output Format */}
            <div>
              <h4 className="text-sm font-medium text-[#9CA3AF] mb-3">Output Format</h4>
              <div className="flex gap-3">
                {REPORT_FORMATS.map(format => (
                  <button
                    key={format.key}
                    onClick={() => updateConfig({ reportFormat: format.key })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      config.reportFormat === format.key
                        ? 'border-blue-500 bg-blue-500/10 text-[#F0F2F4]'
                        : 'border-[#2A2F36] text-[#6B7280] hover:border-[#3A3F46]'
                    }`}
                  >
                    {format.key === 'pdf' && <FileText className="w-4 h-4" />}
                    {format.key === 'docx' && <FileText className="w-4 h-4" />}
                    {format.key === 'html' && <Globe className="w-4 h-4" />}
                    <span>{format.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Options (for non-complete reports) */}
        {currentStep === 2 && !isCompleteReport && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-[#F0F2F4]">Report Options</h3>

            {/* Format */}
            <div>
              <label className="text-sm font-medium text-[#9CA3AF] block mb-2">Output Format</label>
              <div className="flex gap-3">
                {REPORT_FORMATS.map(format => (
                  <button
                    key={format.key}
                    onClick={() => updateConfig({ reportFormat: format.key })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      config.reportFormat === format.key
                        ? 'border-blue-500 bg-blue-500/10 text-[#F0F2F4]'
                        : 'border-[#2A2F36] text-[#6B7280] hover:border-[#3A3F46]'
                    }`}
                  >
                    {format.key === 'pdf' && <FileText className="w-4 h-4" />}
                    {format.key === 'docx' && <FileText className="w-4 h-4" />}
                    {format.key === 'html' && <Globe className="w-4 h-4" />}
                    <span>{format.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Revision */}
            <div>
              <label className="text-sm font-medium text-[#9CA3AF] block mb-2">Revision Scope</label>
              <div className="flex gap-3">
                <button
                  onClick={() => updateConfig({ revisionId: null })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    config.revisionId === null
                      ? 'border-blue-500 bg-blue-500/10 text-[#F0F2F4]'
                      : 'border-[#2A2F36] text-[#6B7280] hover:border-[#3A3F46]'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Current State
                </button>
                <button
                  onClick={() => updateConfig({ revisionId: 'select' })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    config.revisionId !== null
                      ? 'border-blue-500 bg-blue-500/10 text-[#F0F2F4]'
                      : 'border-[#2A2F36] text-[#6B7280] hover:border-[#3A3F46]'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Specific Revision
                </button>
              </div>
            </div>

            {/* Phase Filter */}
            <div>
              <label className="text-sm font-medium text-[#9CA3AF] block mb-2">Include Phases</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateConfig({ includedPhases: null })}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                    config.includedPhases === null
                      ? 'border-blue-500 bg-blue-500/10 text-[#F0F2F4]'
                      : 'border-[#2A2F36] text-[#6B7280] hover:border-[#3A3F46]'
                  }`}
                >
                  All Phases
                </button>
                {['1', '2', '3a', '3b', '3c', '4', '5', '6', '7'].map(phase => {
                  const isIncluded = config.includedPhases === null ||
                    config.includedPhases?.includes(phase);
                  return (
                    <button
                      key={phase}
                      onClick={() => {
                        if (config.includedPhases === null) {
                          updateConfig({ includedPhases: [phase] });
                        } else {
                          const updated = isIncluded
                            ? config.includedPhases.filter(p => p !== phase)
                            : [...config.includedPhases, phase];
                          updateConfig({ includedPhases: updated.length > 0 ? updated : null });
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                        isIncluded && config.includedPhases !== null
                          ? 'border-blue-500 bg-blue-500/10 text-[#F0F2F4]'
                          : config.includedPhases === null
                          ? 'border-[#3A3F46] text-[#6B7280]'
                          : 'border-[#2A2F36] text-[#6B7280] hover:border-[#3A3F46]'
                      }`}
                    >
                      Phase {phase}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-[#F0F2F4]">Review and Export</h3>

            {/* Summary */}
            <div className="bg-[#15181C] rounded-lg p-4 space-y-3 border border-[#2A2F36]">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Scope</span>
                <span className="text-[#F0F2F4]">
                  {config.scope === 'project' ? 'Entire Project' : nodeName || 'Selected Node'}
                  {config.scope === 'node' && config.includeChildren && ' (+ children)'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Report Type</span>
                <span className="text-[#F0F2F4]">{REPORT_TYPES[config.reportType]?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B7280]">Format</span>
                <span className="text-[#F0F2F4] uppercase">{config.reportFormat}</span>
              </div>
              {!isCompleteReport && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Phases</span>
                  <span className="text-[#F0F2F4]">
                    {config.includedPhases === null ? 'All' : config.includedPhases.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Status for Complete Design Report */}
            {isCompleteReport && (
              <div className="bg-[#15181C] rounded-lg p-4 border border-[#2A2F36]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-[#9CA3AF]">Export Status</h4>
                  <StatusBadge status={statusSummary.status} />
                </div>

                {statusSummary.status.code !== 'VALIDATED' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-300">
                        <p className="font-medium">Report will include status markers:</p>
                        <ul className="mt-1 text-amber-200/70 text-xs space-y-1">
                          <li>• Cover page banner: "{statusSummary.status.label.toUpperCase()} REPORT – NOT VALIDATED"</li>
                          <li>• Diagonal watermark on every page</li>
                          <li>• Blocking Issues Summary as page 2</li>
                          <li>• Section-level status indicators</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Blocking Issues Summary */}
                {statusSummary.blocking.total > 0 && (
                  <BlockingIssuesPanel
                    blocking={statusSummary.blocking}
                    expanded={blockingExpanded}
                    onToggle={() => setBlockingExpanded(!blockingExpanded)}
                  />
                )}
              </div>
            )}

            {/* Draft Warnings for non-complete reports */}
            {!isCompleteReport && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-[#9CA3AF]">Completeness Notes</span>
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-300">
                      Reports can always be generated. Incomplete data will be marked with warnings.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-[#2A2F36] bg-[#15181C]">
        <button
          onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-4 py-2 text-[#6B7280] hover:text-[#F0F2F4] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep < steps.length - 1 ? (
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            {/* Draft Export - Always available */}
            <button
              onClick={() => {
                updateConfig({ exportMode: 'draft' });
                handleGenerate();
              }}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2 bg-[#2A2F36] hover:bg-[#3A3F46] text-[#F0F2F4] rounded-lg disabled:opacity-50"
            >
              {generating && config.exportMode === 'draft' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Draft PDF
                </>
              )}
            </button>

            {/* Validated Export - Only for complete reports with VALIDATED status */}
            {isCompleteReport && (
              <button
                onClick={() => {
                  updateConfig({ exportMode: 'validated' });
                  handleGenerate();
                }}
                disabled={generating || !statusSummary.canExportValidated}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  statusSummary.canExportValidated
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-[#2A2F36] text-[#6B7280]'
                }`}
                title={statusSummary.canExportValidated ? undefined : 'Report must be VALIDATED to export without watermarks'}
              >
                {generating && config.exportMode === 'validated' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Export Validated PDF
                  </>
                )}
              </button>
            )}

            {/* Simple generate for non-complete reports */}
            {!isCompleteReport && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Generate Report
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportGeneratorWizard;
