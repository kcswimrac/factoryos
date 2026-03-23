import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ClipboardList, Network, FileCheck, ShieldCheck, AlertTriangle,
  Plus, Filter, Search, Clock, User, ChevronRight, CheckCircle2,
  XCircle, AlertCircle, Calendar, X, Link, Info, FileText,
  Users, Target, Hash, ChevronDown, ChevronUp, Eye
} from 'lucide-react';
import PageSummary from '../ui/PageSummary';
import Header from '../../Header';
import {
  REVIEW_TYPES,
  REVIEW_TYPE_CONFIG,
  REVIEW_OUTCOMES,
  REVIEW_OUTCOME_CONFIG,
  REVIEW_STATUS,
  CONDITION_SEVERITY,
  CONDITION_SEVERITY_CONFIG,
  CONDITION_STATUS,
  REVIEW_PREP_GUIDANCE,
  getReviewTypeConfig,
  getReviewTypeColorClasses,
  getOutcomeConfig,
  getRequiredSectionsForReview,
  checkReviewReadiness,
  canCDRPass,
  DEMO_DESIGN_REVIEWS,
  DEMO_REVIEW_CONDITIONS
} from '../../config/designReviewsConfig';
import { DEMO_PROJECTS } from '../../data/demoProjects';

// =============================================================================
// ICON MAP
// =============================================================================

const ICON_MAP = {
  ClipboardList,
  Network,
  FileCheck,
  ShieldCheck,
  AlertTriangle
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// Review Type Badge
const ReviewTypeBadge = ({ reviewType, size = 'md' }) => {
  const config = getReviewTypeConfig(reviewType);
  const colors = getReviewTypeColorClasses(reviewType);
  const Icon = ICON_MAP[config.icon] || ClipboardList;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded ${colors.bgLight} ${colors.text} border ${colors.border} ${sizeClasses[size]}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />
      {config.shortName}
    </span>
  );
};

// Outcome Badge
const OutcomeBadge = ({ outcome }) => {
  if (!outcome) return null;
  const config = getOutcomeConfig(outcome);
  const colorMap = {
    emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30'
  };
  const IconMap = {
    CheckCircle: CheckCircle2,
    AlertCircle: AlertCircle,
    XCircle: XCircle
  };
  const Icon = IconMap[config.icon] || CheckCircle2;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${colorMap[config.color]}`}>
      <Icon className="w-3 h-3" />
      {config.name}
    </span>
  );
};

// Status Badge
const StatusBadge = ({ status }) => {
  const config = {
    planned: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Planned' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
    completed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Completed' }
  };
  const { bg, text, label } = config[status] || config.planned;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// Condition Severity Badge
const ConditionSeverityBadge = ({ severity }) => {
  const config = CONDITION_SEVERITY_CONFIG[severity];
  if (!config) return null;

  const colorMap = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${colorMap[config.color]}`}>
      {config.name}
    </span>
  );
};

// Stats Card
const StatsCard = ({ label, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6B7280] mb-1">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-50" />
      </div>
    </div>
  );
};

// Review Row
const ReviewRow = ({ review, conditions, onClick }) => {
  const config = getReviewTypeConfig(review.review_type);
  const colors = getReviewTypeColorClasses(review.review_type);
  const project = DEMO_PROJECTS.find(p => p.id === review.project_id);
  const reviewConditions = conditions.filter(c => c.design_review_id === review.id);
  const openConditions = reviewConditions.filter(c => c.status === CONDITION_STATUS.OPEN);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[#1C1F24] border rounded-lg p-4 hover:border-blue-500/50 transition-all cursor-pointer group ${colors.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <ReviewTypeBadge reviewType={review.review_type} />
            <StatusBadge status={review.status} />
            {review.outcome && <OutcomeBadge outcome={review.outcome} />}
            {openConditions.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                <AlertCircle className="w-3 h-3" />
                {openConditions.length} Open Conditions
              </span>
            )}
          </div>

          <h3 className="text-[#F0F2F4] font-medium mb-2">
            {config.name} - {project?.name || 'Unknown Project'}
          </h3>

          <div className="flex items-center gap-4 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {review.status === REVIEW_STATUS.COMPLETED ? 'Completed' : 'Scheduled'}: {formatDate(review.status === REVIEW_STATUS.COMPLETED ? review.completed_at : review.scheduled_at)}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Chair: {review.chair_user_id}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {review.attendees?.length || 0} Attendees
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-blue-400 transition-colors" />
      </div>
    </div>
  );
};

// Create Review Modal
const CreateReviewModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    review_type: REVIEW_TYPES.SRR,
    project_id: '',
    scope_type: 'project',
    scheduled_at: '',
    chair_user_id: '',
    attendees: [],
    agenda: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#0F1114] border border-[#2A2F36] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2F36]">
          <div>
            <h2 className="text-xl font-bold text-[#F0F2F4]">Schedule Design Review</h2>
            <p className="text-sm text-[#6B7280] mt-1">Create a new formal design review</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B7280] hover:text-[#F0F2F4] hover:bg-[#1C1F24] rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Review Type Selection */}
          <div>
            <label className="block text-sm font-medium text-[#F0F2F4] mb-3">Review Type</label>
            <div className="grid grid-cols-4 gap-3">
              {Object.values(REVIEW_TYPE_CONFIG).filter(c => !c.isScrappyModeOnly).map(config => {
                const Icon = ICON_MAP[config.icon] || ClipboardList;
                const colors = getReviewTypeColorClasses(config.code);
                const isSelected = formData.review_type === config.code;

                return (
                  <button
                    key={config.code}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, review_type: config.code }))}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? `${colors.bgLight} ${colors.border} ${colors.text}`
                        : 'bg-[#1C1F24] border-[#2A2F36] text-[#6B7280] hover:border-[#3A3F46]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-2 ${isSelected ? '' : 'opacity-60'}`} />
                    <span className="text-xs font-medium">{config.shortName}</span>
                    <p className="text-[10px] mt-1 opacity-70">{config.timing}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-[#F0F2F4] mb-2">Project</label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
              className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a project...</option>
              {DEMO_PROJECTS.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {/* Schedule Date/Time */}
          <div>
            <label className="block text-sm font-medium text-[#F0F2F4] mb-2">Scheduled Date & Time</label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
              className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Agenda */}
          <div>
            <label className="block text-sm font-medium text-[#F0F2F4] mb-2">Agenda (Required)</label>
            <textarea
              value={formData.agenda}
              onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
              placeholder="1. Design overview&#10;2. Requirements review&#10;3. Risk assessment&#10;4. Q&A"
              rows={4}
              className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* Review Preparation Guidance */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-blue-400 mb-2">
              <Info className="w-4 h-4" />
              {REVIEW_PREP_GUIDANCE.title}
            </h4>
            <ul className="space-y-1">
              {REVIEW_PREP_GUIDANCE.items.slice(0, 5).map((item, idx) => (
                <li key={idx} className="text-xs text-blue-300/80 flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#2A2F36]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1C1F24] text-[#B4BAC4] rounded-lg hover:bg-[#22262C] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.project_id || !formData.scheduled_at || !formData.agenda}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Schedule Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Review Detail Modal
const ReviewDetailModal = ({ review, conditions, onClose, onRecordOutcome }) => {
  const [expandedSections, setExpandedSections] = useState(['agenda', 'conditions']);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [outcomeData, setOutcomeData] = useState({
    outcome: REVIEW_OUTCOMES.PASS,
    minutes: '',
    newConditions: []
  });

  if (!review) return null;

  const config = getReviewTypeConfig(review.review_type);
  const colors = getReviewTypeColorClasses(review.review_type);
  const project = DEMO_PROJECTS.find(p => p.id === review.project_id);
  const reviewConditions = conditions.filter(c => c.design_review_id === review.id);
  const requiredSections = getRequiredSectionsForReview(review.review_type);

  const toggleSection = (section) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0F1114] border border-[#2A2F36] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-[#2A2F36] ${colors.bgLight}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colors.bg}`}>
              {(() => {
                const Icon = ICON_MAP[config.icon] || ClipboardList;
                return <Icon className="w-6 h-6 text-white" />;
              })()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ReviewTypeBadge reviewType={review.review_type} size="lg" />
                <StatusBadge status={review.status} />
                {review.outcome && <OutcomeBadge outcome={review.outcome} />}
              </div>
              <h2 className="text-xl font-bold text-[#F0F2F4]">
                {config.name}
              </h2>
              <p className="text-sm text-[#6B7280]">{project?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B7280] hover:text-[#F0F2F4] hover:bg-[#1C1F24] rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Review Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1C1F24] rounded-lg p-4">
              <p className="text-xs text-[#6B7280] mb-1">Scheduled Date</p>
              <p className="text-[#F0F2F4]">{formatDate(review.scheduled_at)}</p>
            </div>
            <div className="bg-[#1C1F24] rounded-lg p-4">
              <p className="text-xs text-[#6B7280] mb-1">Chair</p>
              <p className="text-[#F0F2F4]">{review.chair_user_id}</p>
            </div>
            <div className="bg-[#1C1F24] rounded-lg p-4">
              <p className="text-xs text-[#6B7280] mb-1">Attendees</p>
              <div className="flex flex-wrap gap-1">
                {review.attendees?.map((attendee, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-xs bg-[#2A2F36] text-[#B4BAC4] rounded">
                    {attendee}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-[#1C1F24] rounded-lg p-4">
              <p className="text-xs text-[#6B7280] mb-1">Status</p>
              <StatusBadge status={review.status} />
            </div>
          </div>

          {/* Purpose */}
          <div className="bg-[#1C1F24] rounded-lg p-4">
            <h3 className="text-sm font-medium text-[#F0F2F4] mb-2">Review Purpose</h3>
            <p className="text-sm text-[#B4BAC4]">{config.description}</p>
          </div>

          {/* Agenda Section */}
          <div className="bg-[#1C1F24] rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('agenda')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#22262C] transition-colors"
            >
              <h3 className="flex items-center gap-2 text-sm font-medium text-[#F0F2F4]">
                <ClipboardList className="w-4 h-4 text-[#6B7280]" />
                Agenda
              </h3>
              {expandedSections.includes('agenda') ? (
                <ChevronUp className="w-4 h-4 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6B7280]" />
              )}
            </button>
            {expandedSections.includes('agenda') && (
              <div className="px-4 pb-4">
                <pre className="text-sm text-[#B4BAC4] whitespace-pre-wrap font-mono bg-[#0F1114] p-3 rounded-lg">
                  {review.agenda || 'No agenda provided'}
                </pre>
              </div>
            )}
          </div>

          {/* Required Report Sections */}
          <div className="bg-[#1C1F24] rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('sections')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#22262C] transition-colors"
            >
              <h3 className="flex items-center gap-2 text-sm font-medium text-[#F0F2F4]">
                <FileText className="w-4 h-4 text-[#6B7280]" />
                Required Report Sections ({requiredSections.length})
              </h3>
              {expandedSections.includes('sections') ? (
                <ChevronUp className="w-4 h-4 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6B7280]" />
              )}
            </button>
            {expandedSections.includes('sections') && (
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {requiredSections.map((section, idx) => (
                    <div key={section.id} className="flex items-center gap-3 p-2 bg-[#0F1114] rounded-lg">
                      <span className="w-6 h-6 flex items-center justify-center text-xs font-medium bg-[#2A2F36] text-[#6B7280] rounded">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-[#B4BAC4]">{section.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Review Conditions */}
          <div className="bg-[#1C1F24] rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('conditions')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#22262C] transition-colors"
            >
              <h3 className="flex items-center gap-2 text-sm font-medium text-[#F0F2F4]">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Review Conditions ({reviewConditions.length})
              </h3>
              {expandedSections.includes('conditions') ? (
                <ChevronUp className="w-4 h-4 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6B7280]" />
              )}
            </button>
            {expandedSections.includes('conditions') && (
              <div className="px-4 pb-4">
                {reviewConditions.length === 0 ? (
                  <p className="text-sm text-[#6B7280] text-center py-4">No conditions recorded</p>
                ) : (
                  <div className="space-y-3">
                    {reviewConditions.map(condition => (
                      <div key={condition.id} className="p-3 bg-[#0F1114] rounded-lg border border-[#2A2F36]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <ConditionSeverityBadge severity={condition.severity} />
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                condition.status === CONDITION_STATUS.CLOSED
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {condition.status === CONDITION_STATUS.CLOSED ? 'Closed' : 'Open'}
                              </span>
                            </div>
                            <p className="text-sm text-[#F0F2F4] mb-2">{condition.condition_text}</p>
                            <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                Owner: {condition.owner_user_id}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {new Date(condition.due_date).toLocaleDateString()}
                              </span>
                            </div>
                            {condition.closure_notes && (
                              <p className="mt-2 text-xs text-emerald-300 bg-emerald-500/10 p-2 rounded">
                                <strong>Closure:</strong> {condition.closure_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Minutes (if completed) */}
          {review.minutes_markdown && (
            <div className="bg-[#1C1F24] rounded-lg p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-[#F0F2F4] mb-3">
                <FileText className="w-4 h-4 text-[#6B7280]" />
                Meeting Minutes
              </h3>
              <div className="prose prose-invert prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-[#B4BAC4] bg-[#0F1114] p-3 rounded-lg">
                  {review.minutes_markdown}
                </pre>
              </div>
            </div>
          )}

          {/* Record Outcome (if not completed) */}
          {review.status !== REVIEW_STATUS.COMPLETED && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="flex items-center gap-2 text-sm font-medium text-blue-400 mb-3">
                <Target className="w-4 h-4" />
                Record Review Outcome
              </h3>

              {!showOutcomeForm ? (
                <button
                  onClick={() => setShowOutcomeForm(true)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Record Outcome
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Outcome Selection */}
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(REVIEW_OUTCOME_CONFIG).map(outcomeConfig => {
                      const isSelected = outcomeData.outcome === outcomeConfig.code;
                      const colorMap = {
                        emerald: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
                        amber: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
                        red: 'bg-red-500/20 border-red-500/50 text-red-400'
                      };

                      return (
                        <button
                          key={outcomeConfig.code}
                          type="button"
                          onClick={() => setOutcomeData(prev => ({ ...prev, outcome: outcomeConfig.code }))}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            isSelected
                              ? colorMap[outcomeConfig.color]
                              : 'bg-[#1C1F24] border-[#2A2F36] text-[#6B7280] hover:border-[#3A3F46]'
                          }`}
                        >
                          <span className="text-sm font-medium">{outcomeConfig.name}</span>
                          <p className="text-[10px] mt-1 opacity-70">{outcomeConfig.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Minutes */}
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Meeting Minutes</label>
                    <textarea
                      value={outcomeData.minutes}
                      onChange={(e) => setOutcomeData(prev => ({ ...prev, minutes: e.target.value }))}
                      placeholder="Record key decisions and action items..."
                      rows={4}
                      className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowOutcomeForm(false)}
                      className="px-4 py-2 bg-[#1C1F24] text-[#B4BAC4] rounded-lg hover:bg-[#22262C] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onRecordOutcome?.(review.id, outcomeData);
                        setShowOutcomeForm(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                    >
                      Submit Outcome
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#2A2F36] bg-[#0F1114]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#B4BAC4] hover:text-[#F0F2F4] hover:bg-[#1C1F24] rounded-lg transition-colors"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1C1F24] text-[#B4BAC4] rounded-lg hover:bg-[#22262C] transition-colors">
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

function DesignReviewsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [reviews, setReviews] = useState(DEMO_DESIGN_REVIEWS);
  const [conditions, setConditions] = useState(DEMO_REVIEW_CONDITIONS);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Compute stats
  const stats = useMemo(() => {
    const byType = {};
    const byStatus = { planned: 0, in_progress: 0, completed: 0 };
    const byOutcome = { pass: 0, conditional_pass: 0, fail: 0 };
    const openConditions = conditions.filter(c => c.status === CONDITION_STATUS.OPEN).length;

    reviews.forEach(review => {
      byType[review.review_type] = (byType[review.review_type] || 0) + 1;
      byStatus[review.status] = (byStatus[review.status] || 0) + 1;
      if (review.outcome) {
        byOutcome[review.outcome] = (byOutcome[review.outcome] || 0) + 1;
      }
    });

    return { byType, byStatus, byOutcome, openConditions, total: reviews.length };
  }, [reviews, conditions]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      if (filterType !== 'all' && review.review_type !== filterType) return false;
      if (filterStatus !== 'all' && review.status !== filterStatus) return false;
      if (searchQuery) {
        const project = DEMO_PROJECTS.find(p => p.id === review.project_id);
        const searchLower = searchQuery.toLowerCase();
        if (!project?.name.toLowerCase().includes(searchLower) &&
            !review.review_type.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [reviews, filterType, filterStatus, searchQuery]);

  const handleCreateReview = (formData) => {
    const newReview = {
      id: `review-${Date.now()}`,
      org_id: 'org-public-demo',
      ...formData,
      scope_node_revision_set: {},
      baseline_snapshot_id: null,
      change_package_id: null,
      completed_at: null,
      status: REVIEW_STATUS.PLANNED,
      outcome: null,
      created_by: 'current-user'
    };
    setReviews(prev => [newReview, ...prev]);
  };

  const handleRecordOutcome = (reviewId, outcomeData) => {
    setReviews(prev => prev.map(review =>
      review.id === reviewId
        ? {
            ...review,
            status: REVIEW_STATUS.COMPLETED,
            outcome: outcomeData.outcome,
            minutes_markdown: outcomeData.minutes,
            completed_at: new Date().toISOString()
          }
        : review
    ));
    setSelectedReview(null);
  };

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Page Summary */}
        <PageSummary
          icon={ShieldCheck}
          iconColor="text-red-400"
          borderColor="border-red-500/30"
          bgColor="bg-red-500/5"
        >
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Purpose:</strong> Design reviews formalize decision-making at important engineering milestones. They serve as gates that must be passed before proceeding to the next phase.
          </p>
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Method:</strong> Schedule SRR (System Requirements), SDR (System Definition), PDR (Preliminary Design), or CDR (Critical Design) reviews. Each review type has specific required inputs and completion criteria. Outcomes are Pass, Conditional Pass (with tracked conditions), or Fail (blocks progression).
          </p>
          <p>
            <strong className="text-[#F0F2F4]">Outcome:</strong> Creates formal documentation of engineering decisions. Establishes clear gates that prevent premature advancement. Tracks conditions and action items to resolution.
          </p>
        </PageSummary>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F4]">Design Reviews</h1>
            <p className="text-[#6B7280]">Formal milestone reviews and gate management</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule Review
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <StatsCard label="Total Reviews" value={stats.total} icon={ClipboardList} color="blue" />
          <StatsCard label="Planned" value={stats.byStatus.planned} icon={Calendar} color="purple" />
          <StatsCard label="Completed" value={stats.byStatus.completed} icon={CheckCircle2} color="emerald" />
          <StatsCard label="Passed" value={stats.byOutcome.pass} icon={CheckCircle2} color="emerald" />
          <StatsCard label="Conditional" value={stats.byOutcome.conditional_pass} icon={AlertCircle} color="amber" />
          <StatsCard label="Open Conditions" value={stats.openConditions} icon={AlertTriangle} color="red" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6B7280]" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {Object.values(REVIEW_TYPE_CONFIG).filter(c => !c.isScrappyModeOnly).map(config => (
                <option key={config.code} value={config.code}>{config.shortName}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 bg-[#1C1F24] rounded-xl border border-[#2A2F36]">
              <ShieldCheck className="w-12 h-12 text-[#2A2F36] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#F0F2F4] mb-2">No Reviews Found</h3>
              <p className="text-[#6B7280] mb-4">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Schedule your first design review to get started'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Schedule Review
              </button>
            </div>
          ) : (
            filteredReviews.map(review => (
              <ReviewRow
                key={review.id}
                review={review}
                conditions={conditions}
                onClick={() => setSelectedReview(review)}
              />
            ))
          )}
        </div>

        {/* Review Type Legend */}
        <div className="mt-8 p-4 bg-[#15181C] border border-[#2A2F36] rounded-xl">
          <h3 className="text-sm font-medium text-[#F0F2F4] mb-4">Design Review Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(REVIEW_TYPE_CONFIG).filter(c => !c.isScrappyModeOnly).map(config => {
              const colors = getReviewTypeColorClasses(config.code);
              const Icon = ICON_MAP[config.icon] || ClipboardList;

              return (
                <div key={config.code} className={`p-3 rounded-lg border ${colors.border} ${colors.bgLight}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                    <span className={`font-medium ${colors.text}`}>{config.shortName}</span>
                  </div>
                  <p className="text-xs text-[#6B7280]">{config.timing}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Modals */}
      <CreateReviewModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateReview}
      />

      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          conditions={conditions}
          onClose={() => setSelectedReview(null)}
          onRecordOutcome={handleRecordOutcome}
        />
      )}
    </div>
  );
}

export default DesignReviewsPage;
