import React, { useState } from 'react';
import {
  FlaskConical, TrendingUp, Activity, Scale, Shield,
  Plus, ChevronDown, ChevronUp, Check, Clock, X,
  Link2, FileText, BarChart3, Settings, Info
} from 'lucide-react';
import { ENGINEERING_STUDY_TYPES, STUDY_INTENTS } from '../../config/designPhases';

const TYPE_ICONS = {
  doe: FlaskConical,
  parametric: TrendingUp,
  sensitivity: Activity,
  trade_study: Scale,
  reliability: Shield
};

const TYPE_COLORS = {
  doe: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  parametric: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  sensitivity: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  trade_study: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  reliability: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
};

const STATUS_CONFIG = {
  draft: { icon: Settings, label: 'Draft', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  in_progress: { icon: Clock, label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  complete: { icon: Check, label: 'Complete', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  archived: { icon: X, label: 'Archived', color: 'text-slate-400', bg: 'bg-slate-500/20' }
};

function EngineeringStudyPanel({
  studies = [],
  nodeId,
  nodeName,
  onAdd,
  onUpdate,
  onRemove,
  onViewDetails,
  readOnly = false
}) {
  const [expandedStudy, setExpandedStudy] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudy, setNewStudy] = useState({
    name: '',
    type: 'doe',
    intent: 'validation',
    phase_contexts: [],
    linkedRequirements: []
  });

  const handleAddStudy = () => {
    if (!newStudy.name.trim()) return;

    const study = {
      id: `STD-${nodeId}-${Date.now()}`,
      ...newStudy,
      owning_node_id: nodeId,
      status: 'draft',
      created_at: new Date().toISOString()
    };

    onAdd?.(study);
    setNewStudy({
      name: '',
      type: 'doe',
      intent: 'validation',
      phase_contexts: [],
      linkedRequirements: []
    });
    setShowAddForm(false);
  };

  const togglePhaseContext = (phase) => {
    setNewStudy(prev => ({
      ...prev,
      phase_contexts: prev.phase_contexts.includes(phase)
        ? prev.phase_contexts.filter(p => p !== phase)
        : [...prev.phase_contexts, phase]
    }));
  };

  const getStudiesByIntent = () => {
    const grouped = {};
    studies.forEach(study => {
      const intent = study.intent || 'validation';
      if (!grouped[intent]) grouped[intent] = [];
      grouped[intent].push(study);
    });
    return grouped;
  };

  const studiesByIntent = getStudiesByIntent();

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
      {/* Section Summary */}
      <div className="bg-cyan-500/5 border border-cyan-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#B4BAC4] leading-relaxed">
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Purpose:</strong> Engineering studies systematically explore the design space to validate assumptions, optimize parameters, and make data-driven decisions before committing to hardware.
            </p>
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Method:</strong> Studies are organized by type (DOE, parametric, sensitivity, trade study) and linked to the nodes they inform. Each study documents factors, responses, and the analysis approach used.
            </p>
            <p>
              <strong className="text-[#F0F2F4]">Outcome:</strong> Provides documented rationale for design decisions, identifies optimal parameter values, quantifies sensitivities, and builds confidence before moving to physical prototypes.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0F2F4]">Engineering Studies</h3>
            <p className="text-sm text-[#6B7280]">
              DOE, parametric, sensitivity, and trade studies owned by this node
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6B7280]">
            {studies.length} {studies.length === 1 ? 'study' : 'studies'}
          </span>
          {!readOnly && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Study
            </button>
          )}
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && !readOnly && (
        <div className="bg-[#0F1114] rounded-lg p-4 mb-6 border border-[#2A2F36]">
          <h4 className="text-sm font-medium text-[#F0F2F4] mb-4">New Engineering Study</h4>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Study Name</label>
              <input
                type="text"
                value={newStudy.name}
                onChange={(e) => setNewStudy(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Gear Ratio Optimization DOE"
                className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-violet-500"
              />
            </div>

            {/* Type and Intent */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Study Type</label>
                <select
                  value={newStudy.type}
                  onChange={(e) => setNewStudy(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm focus:outline-none focus:border-violet-500"
                >
                  {Object.values(ENGINEERING_STUDY_TYPES).map(type => (
                    <option key={type.code} value={type.code}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Intent</label>
                <select
                  value={newStudy.intent}
                  onChange={(e) => setNewStudy(prev => ({ ...prev, intent: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm focus:outline-none focus:border-violet-500"
                >
                  {Object.values(STUDY_INTENTS).map(intent => (
                    <option key={intent.code} value={intent.code}>{intent.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Phase Contexts */}
            <div>
              <label className="block text-xs text-[#6B7280] mb-2">Phase Contexts (where this study is relevant)</label>
              <div className="flex flex-wrap gap-2">
                {['2', '3', '4', '5', '6', '7'].map(phase => (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => togglePhaseContext(phase)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      newStudy.phase_contexts.includes(phase)
                        ? 'bg-violet-500 text-white'
                        : 'bg-[#1C1F24] text-[#6B7280] hover:bg-[#22262C]'
                    }`}
                  >
                    Phase {phase}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-[#1C1F24] text-[#B4BAC4] rounded-lg text-sm hover:bg-[#22262C] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStudy}
                disabled={!newStudy.name.trim()}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Study
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Studies List */}
      {studies.length === 0 ? (
        <div className="text-center py-8">
          <FlaskConical className="w-12 h-12 text-[#2A2F36] mx-auto mb-3" />
          <p className="text-[#6B7280]">No engineering studies yet</p>
          <p className="text-xs text-[#6B7280] mt-1">
            Add DOE, parametric, or trade studies to document design investigations
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(studiesByIntent).map(([intent, intentStudies]) => (
            <div key={intent} className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[#6B7280] uppercase tracking-wide">
                  {STUDY_INTENTS[intent]?.name || intent}
                </span>
                <span className="text-xs text-[#6B7280]">
                  ({intentStudies.length})
                </span>
              </div>

              {intentStudies.map(study => {
                const Icon = TYPE_ICONS[study.type] || FlaskConical;
                const colors = TYPE_COLORS[study.type] || TYPE_COLORS.doe;
                const statusConfig = STATUS_CONFIG[study.status] || STATUS_CONFIG.draft;
                const StatusIcon = statusConfig.icon;
                const isExpanded = expandedStudy === study.id;

                return (
                  <div
                    key={study.id}
                    className={`bg-[#0F1114] rounded-lg overflow-hidden border ${colors.border}`}
                  >
                    {/* Study Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedStudy(isExpanded ? null : study.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          <Icon className={`w-4 h-4 ${colors.text}`} />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                              {ENGINEERING_STUDY_TYPES[study.type]?.name || study.type}
                            </span>
                            <h4 className="text-[#F0F2F4] font-medium">{study.name}</h4>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-[#6B7280]">
                              Intent: {STUDY_INTENTS[study.intent]?.name || study.intent}
                            </span>
                            {study.phase_contexts?.length > 0 && (
                              <span className="text-xs text-[#6B7280]">
                                Phases: {study.phase_contexts.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${statusConfig.bg} ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-[#2A2F36]">
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {/* Study Details */}
                          <div className="space-y-3">
                            <div>
                              <span className="text-xs text-[#6B7280]">Study ID</span>
                              <p className="text-sm text-[#B4BAC4] font-mono">{study.id}</p>
                            </div>
                            {study.factors && (
                              <div>
                                <span className="text-xs text-[#6B7280]">Factors</span>
                                <p className="text-sm text-[#B4BAC4]">{study.factors.join(', ')}</p>
                              </div>
                            )}
                            {study.responses && (
                              <div>
                                <span className="text-xs text-[#6B7280]">Responses</span>
                                <p className="text-sm text-[#B4BAC4]">{study.responses.join(', ')}</p>
                              </div>
                            )}
                            {study.run_count && (
                              <div>
                                <span className="text-xs text-[#6B7280]">Run Count</span>
                                <p className="text-sm text-[#B4BAC4]">{study.run_count} runs</p>
                              </div>
                            )}
                          </div>

                          {/* Linked Requirements */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Link2 className="w-4 h-4 text-[#6B7280]" />
                              <span className="text-xs text-[#6B7280]">Linked Requirements</span>
                            </div>
                            {study.linkedRequirements?.length > 0 ? (
                              <div className="space-y-1">
                                {study.linkedRequirements.map(req => (
                                  <span
                                    key={req}
                                    className="inline-block px-2 py-0.5 text-xs bg-[#1C1F24] text-[#B4BAC4] rounded mr-1 mb-1"
                                  >
                                    {req}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-[#6B7280] italic">No linked requirements</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#2A2F36]">
                          {onViewDetails && (
                            <button
                              onClick={() => onViewDetails(study)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1C1F24] text-[#B4BAC4] rounded hover:bg-[#22262C] transition-colors"
                            >
                              <BarChart3 className="w-3 h-3" />
                              View Results
                            </button>
                          )}
                          {!readOnly && (
                            <>
                              <button
                                onClick={() => onUpdate?.(study.id, { status: study.status === 'complete' ? 'in_progress' : 'complete' })}
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-colors ${
                                  study.status === 'complete'
                                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                                {study.status === 'complete' ? 'Mark In Progress' : 'Mark Complete'}
                              </button>
                              <button
                                onClick={() => onRemove?.(study.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-xs text-cyan-300">
          <strong>Node-centric ownership:</strong> Studies belong to this node and are visible here regardless of the current phase.
          Phase views will surface relevant studies without moving or duplicating them.
        </p>
      </div>
    </div>
  );
}

export default EngineeringStudyPanel;
