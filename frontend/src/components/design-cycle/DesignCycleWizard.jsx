import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  ChevronLeft,
  Info,
  ClipboardList,
  Layers,
  FlaskConical,
  FileText,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import NodeTypeBadge from './NodeTypeBadge';
import NodeTypeSelector from './NodeTypeSelector';
import RigorTierSelector from './RigorTierSelector';
import RigorTierBadge from './RigorTierBadge';
import PhaseNavigator from './PhaseNavigator';
import RequirementsManager from './RequirementsManager';
import AIScorePanel from './AIScorePanel';
import GateApprovalPanel from './GateApprovalPanel';
import InterfaceControlPanel from './InterfaceControlPanel';
import RevisionTimeline from './RevisionTimeline';
import ReportGeneratorWizard from './ReportGeneratorWizard';
import ReportHistoryPanel from './ReportHistoryPanel';
import ArtifactIndexViewer from './ArtifactIndexViewer';
import { NODE_TYPES, getAllowedChildTypes } from '../../config/designPhases';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'requirements', label: 'Requirements', icon: ClipboardList },
  { id: 'phases', label: 'Phases', icon: Layers },
  { id: 'analysis', label: 'Analysis & Test', icon: FlaskConical },
  { id: 'interfaces', label: 'Interfaces', icon: GitBranch },
  { id: 'reports', label: 'Reports', icon: FileText }
];

function DesignCycleWizard({
  node,
  parentNode,
  isNew = false,
  onClose,
  onSave,
  fetchRequirements,
  fetchPhases,
  fetchReports,
  fetchArtifacts,
  onGenerateReport,
  onDownloadReport
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    name: '',
    node_type: 'COMP',
    part_number: '',
    description: '',
    rigor_tier: 2,
    ...node
  });
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [requirements, setRequirements] = useState([]);
  const [phases, setPhases] = useState([]);
  const [reports, setReports] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [activePhase, setActivePhase] = useState(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [errors, setErrors] = useState({});

  // Load data when node changes
  useEffect(() => {
    if (node && !isNew) {
      loadNodeData();
    }
  }, [node?.id]);

  const loadNodeData = async () => {
    setLoading(true);
    try {
      // Load requirements
      if (fetchRequirements) {
        const reqs = await fetchRequirements(node.id);
        setRequirements(reqs);
      }

      // Load phases
      if (fetchPhases) {
        const phaseData = await fetchPhases(node.id);
        setPhases(phaseData);
      }

      // Load reports
      if (fetchReports) {
        const reportData = await fetchReports(node.id);
        setReports(reportData);
      }

      // Load artifacts
      if (fetchArtifacts) {
        const artifactData = await fetchArtifacts(node.id);
        setArtifacts(artifactData);
      }
    } catch (err) {
      console.error('Failed to load node data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear field error
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.node_type) {
      newErrors.node_type = 'Node type is required';
    }

    // Validate parent-child relationship
    if (parentNode) {
      const allowedChildren = getAllowedChildTypes(parentNode.node_type);
      if (!allowedChildren.includes(formData.node_type)) {
        newErrors.node_type = `${NODE_TYPES[formData.node_type]?.name} cannot be a child of ${NODE_TYPES[parentNode.node_type]?.name}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await onSave(formData);
      setIsDirty(false);
    } catch (err) {
      console.error('Failed to save:', err);
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = async (config) => {
    try {
      await onGenerateReport(node.id, config);
      setShowReportGenerator(false);
      // Reload reports
      if (fetchReports) {
        const reportData = await fetchReports(node.id);
        setReports(reportData);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  const renderTabContent = () => {
    if (loading && activeTab !== 'overview') {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className={`w-full px-4 py-2 bg-gray-900 border rounded-lg text-white focus:outline-none ${
                      errors.name ? 'border-red-500' : 'border-gray-700 focus:border-violet-500'
                    }`}
                    placeholder="Enter node name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-400 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Part Number</label>
                  <input
                    type="text"
                    value={formData.part_number}
                    onChange={(e) => handleFieldChange('part_number', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                    placeholder="e.g., COMP-001"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Rigor Tier</label>
                  <RigorTierSelector
                    value={formData.rigor_tier}
                    onChange={(tier) => handleFieldChange('rigor_tier', tier)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-violet-500 resize-none"
                    placeholder="Brief description of this node"
                  />
                </div>
              </div>
            </div>

            {/* Node Type */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Node Type</h3>
              {errors.node_type && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.node_type}
                  </p>
                </div>
              )}
              <NodeTypeSelector
                value={formData.node_type}
                onChange={(type) => handleFieldChange('node_type', type)}
                parentType={parentNode?.node_type}
                layout="grid"
              />
            </div>

            {/* Current Status */}
            {!isNew && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Current Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <span className="text-sm text-gray-400">Current Phase</span>
                    <p className="text-2xl font-bold text-white mt-1">
                      {node?.current_phase || '--'}
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <span className="text-sm text-gray-400">AI Score</span>
                    <p className={`text-2xl font-bold mt-1 ${
                      (node?.ai_score || 0) >= 80 ? 'text-green-400' :
                      (node?.ai_score || 0) >= 60 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {node?.ai_score ?? '--'}%
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <span className="text-sm text-gray-400">Gate Status</span>
                    <p className="text-2xl font-bold text-white mt-1 flex items-center gap-2">
                      {node?.gate_status === 'approved' ? (
                        <><CheckCircle className="w-5 h-5 text-green-400" /> Approved</>
                      ) : node?.gate_status === 'blocked' ? (
                        <><AlertCircle className="w-5 h-5 text-red-400" /> Blocked</>
                      ) : (
                        'Pending'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Revision Timeline */}
            {!isNew && node?.revisions && (
              <RevisionTimeline
                revisions={node.revisions}
                currentRevision={node.revision_number}
              />
            )}
          </div>
        );

      case 'requirements':
        return (
          <RequirementsManager
            requirements={requirements}
            nodeId={node?.id}
            rigorTier={formData.rigor_tier}
            onUpdate={setRequirements}
          />
        );

      case 'phases':
        return (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-4">
              <PhaseNavigator
                phases={phases}
                activePhase={activePhase}
                onPhaseSelect={setActivePhase}
                showProgress={true}
              />
            </div>
            <div className="col-span-8">
              {activePhase ? (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-sm text-gray-500 font-mono">
                        Phase {activePhase.number}{activePhase.subPhase || ''}
                      </span>
                      <h3 className="text-lg font-semibold text-white">{activePhase.name}</h3>
                    </div>
                    <RigorTierBadge tier={formData.rigor_tier} />
                  </div>
                  <p className="text-gray-400 mb-4">{activePhase.description}</p>

                  {/* Phase Artifacts */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-400">Required Artifacts</h4>
                    {activePhase.artifacts?.map((artifact, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                      >
                        <span className="text-sm text-white">{artifact.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          artifact.status === 'complete'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {artifact.status || 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Gate Approval */}
                  {activePhase.hasGate && (
                    <div className="mt-6">
                      <GateApprovalPanel
                        phaseNumber={activePhase.number}
                        subPhase={activePhase.subPhase}
                        rigorTier={formData.rigor_tier}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
                  <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Select a phase to view details</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6">
            <AIScorePanel
              nodeId={node?.id}
              score={node?.ai_score}
              subscores={node?.ai_subscores}
              history={node?.score_history}
            />
          </div>
        );

      case 'interfaces':
        return (
          <InterfaceControlPanel
            nodeId={node?.id}
            interfaces={node?.interfaces}
          />
        );

      case 'reports':
        return (
          <div className="space-y-6">
            {showReportGenerator ? (
              <div>
                <button
                  onClick={() => setShowReportGenerator(false)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Reports
                </button>
                <ReportGeneratorWizard
                  projectId={node?.project_id}
                  nodeId={node?.id}
                  nodeName={node?.name}
                  onGenerate={handleGenerateReport}
                  onCancel={() => setShowReportGenerator(false)}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Reports</h3>
                  <button
                    onClick={() => setShowReportGenerator(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Generate New Report
                  </button>
                </div>

                <ReportHistoryPanel
                  reports={reports}
                  onDownload={onDownloadReport}
                  loading={loading}
                />

                {artifacts.length > 0 && (
                  <ArtifactIndexViewer
                    artifacts={artifacts}
                    reportId={reports[0]?.id}
                  />
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {node && !isNew && (
              <NodeTypeBadge type={formData.node_type} size="md" />
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                {isNew ? 'Create New Node' : formData.name || 'Edit Node'}
              </h2>
              {formData.part_number && (
                <p className="text-sm text-gray-500 font-mono">{formData.part_number}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="text-sm text-yellow-400">Unsaved changes</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50 text-white rounded-lg transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-800 bg-gray-900/50">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error Banner */}
        {errors.submit && (
          <div className="mx-4 mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.submit}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default DesignCycleWizard;
