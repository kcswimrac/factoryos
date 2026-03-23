import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  User,
  Users,
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  FileText,
  Paperclip,
  Download,
  Plus,
  Edit2,
  ExternalLink
} from 'lucide-react';
import Header from '../../Header';
import { DEMO_8D_CASES, SEVERITY_LEVELS, CASE_STATUS, ACTION_STATUS, DISCIPLINE_STATUS } from '../../data/demoQualityCases';

// Severity badge component
const SeverityBadge = ({ severity, size = 'md' }) => {
  const config = {
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: AlertTriangle },
    major: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', icon: AlertCircle },
    minor: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: Info },
    observation: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: Eye }
  };
  const { bg, text, border, icon: Icon } = config[severity] || config.minor;
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 rounded font-medium ${bg} ${text} border ${border} ${sizeClasses}`}>
      <Icon size={size === 'lg' ? 16 : 12} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

// Status badge component
const StatusBadge = ({ status, size = 'md' }) => {
  const config = {
    open: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Open' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
    pending_verification: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending Verification' },
    closed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Closed' },
    cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelled' }
  };
  const { bg, text, label } = config[status] || config.open;
  const sizeClasses = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center rounded font-medium ${bg} ${text} ${sizeClasses}`}>
      {label}
    </span>
  );
};

// Discipline tab component
const DisciplineTab = ({ discipline, isActive, onClick }) => {
  const statusColors = {
    completed: 'bg-green-500 text-white',
    in_progress: 'bg-blue-500 text-white',
    not_started: 'bg-[#2A2F36] text-[#6B7280]',
    skipped: 'bg-gray-600 text-gray-400'
  };

  const status = discipline?.status || 'not_started';
  const baseClasses = `w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-all cursor-pointer`;
  const activeClasses = isActive ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-[#0F1114]' : '';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${statusColors[status]} ${activeClasses}`}
      title={`D${discipline.number}: ${discipline.name} - ${status}`}
    >
      D{discipline.number}
    </button>
  );
};

// Action item component
const ActionItem = ({ action }) => {
  const statusConfig = {
    open: { icon: Circle, color: 'text-gray-400' },
    in_progress: { icon: Clock, color: 'text-blue-400' },
    completed: { icon: CheckCircle2, color: 'text-yellow-400' },
    verified: { icon: CheckCircle2, color: 'text-green-400' },
    cancelled: { icon: AlertCircle, color: 'text-red-400' }
  };
  const { icon: Icon, color } = statusConfig[action.status] || statusConfig.open;
  const isOverdue = action.status !== ACTION_STATUS.VERIFIED &&
                    action.status !== ACTION_STATUS.CANCELLED &&
                    new Date(action.due_date) < new Date();

  return (
    <div className="flex items-start gap-3 p-3 bg-[#15181C] rounded-lg border border-[#2A2F36]">
      <Icon size={20} className={color} />
      <div className="flex-1 min-w-0">
        <p className="text-[#F0F2F4] text-sm">{action.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-[#6B7280]">
          <span className="flex items-center gap-1">
            <User size={12} />
            {action.owner?.name}
          </span>
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
            <Calendar size={12} />
            Due: {new Date(action.due_date).toLocaleDateString()}
          </span>
          <span className={`px-2 py-0.5 rounded ${
            action.status === 'verified' ? 'bg-green-500/20 text-green-400' :
            action.status === 'completed' ? 'bg-yellow-500/20 text-yellow-400' :
            action.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {action.status.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};

// Evidence item component
const EvidenceItem = ({ evidence }) => {
  const typeIcons = {
    analysis: FileText,
    test_result: CheckCircle2,
    photo: Eye,
    document: FileText,
    study_reference: ExternalLink
  };
  const Icon = typeIcons[evidence.evidence_type] || FileText;

  return (
    <div className="flex items-center gap-3 p-3 bg-[#15181C] rounded-lg border border-[#2A2F36] hover:border-blue-500/30 transition-colors cursor-pointer">
      <div className="w-10 h-10 bg-[#2A2F36] rounded-lg flex items-center justify-center">
        <Icon size={18} className="text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#F0F2F4] text-sm font-medium truncate">{evidence.file_name}</p>
        <p className="text-[#6B7280] text-xs truncate">{evidence.description}</p>
      </div>
      <Download size={16} className="text-[#6B7280] hover:text-blue-400" />
    </div>
  );
};

// 5-Why display component
const FiveWhyDisplay = ({ fiveWhy }) => {
  if (!fiveWhy || fiveWhy.length === 0) return null;

  return (
    <div className="space-y-2">
      {fiveWhy.map((item, index) => (
        <div key={index} className="flex gap-3">
          <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
            {index + 1}
          </div>
          <div className="flex-1">
            <p className="text-[#6B7280] text-sm">{item.why}</p>
            <p className="text-[#F0F2F4] text-sm mt-1">{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const QualityCaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeDiscipline, setActiveDiscipline] = useState(null);

  // Find the case
  const case8d = useMemo(() => {
    return DEMO_8D_CASES.find(c => c.id === id);
  }, [id]);

  // Set initial active discipline
  React.useEffect(() => {
    if (case8d && activeDiscipline === null) {
      setActiveDiscipline(case8d.current_discipline);
    }
  }, [case8d, activeDiscipline]);

  if (!case8d) {
    return (
      <div className="min-h-screen bg-[#0F1114]">
        <Header />
        <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-[#6B7280] mb-4" />
            <h2 className="text-xl font-bold text-[#F0F2F4] mb-2">Case Not Found</h2>
            <p className="text-[#6B7280] mb-4">The requested 8D case could not be found.</p>
            <button
              onClick={() => navigate('/quality')}
              className="text-blue-400 hover:text-blue-300"
            >
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  const activeDisc = case8d.disciplines?.find(d => d.number === activeDiscipline) || case8d.disciplines?.[0];
  const actionsForDiscipline = case8d.actions?.filter(a => a.discipline === activeDiscipline) || [];
  const evidenceForDiscipline = case8d.evidence?.filter(e => e.discipline === activeDiscipline) || [];

  const isComplete = case8d.status === CASE_STATUS.CLOSED;
  const canExportValidated = isComplete && case8d.disciplines?.every(d => d.status === DISCIPLINE_STATUS.COMPLETED || d.status === DISCIPLINE_STATUS.SKIPPED);

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/quality')}
          className="flex items-center gap-2 text-[#6B7280] hover:text-[#F0F2F4] mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        {/* Case Header */}
        <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-mono text-[#6B7280]">{case8d.case_number}</span>
                <SeverityBadge severity={case8d.severity} size="lg" />
                <StatusBadge status={case8d.status} size="lg" />
              </div>
              <h1 className="text-2xl font-bold text-[#F0F2F4] mb-2">{case8d.title}</h1>
              <p className="text-[#B4BAC4]">{case8d.description}</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 bg-[#2A2F36] hover:bg-[#363B44] text-[#F0F2F4] px-4 py-2 rounded-lg transition-colors">
                <Edit2 size={16} />
                Edit
              </button>
            </div>
          </div>

          {/* Linked Objects */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Target size={16} className="text-blue-400" />
              <span>Linked to:</span>
              <span className="text-[#F0F2F4]">{case8d.project_name}</span>
              <ChevronRight size={14} />
              <span className="text-[#F0F2F4]">{case8d.node_name}</span>
              <span className="text-[#6B7280]">({case8d.node_part_number})</span>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-[#2A2F36] text-sm">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <User size={16} />
              <span>Owner:</span>
              <span className="text-[#F0F2F4]">{case8d.owner?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Users size={16} />
              <span>Team:</span>
              <span className="text-[#F0F2F4]">{case8d.team_members?.length} members</span>
            </div>
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Calendar size={16} />
              <span>Due:</span>
              <span className={`${new Date(case8d.due_date) < new Date() && case8d.status !== CASE_STATUS.CLOSED ? 'text-red-400' : 'text-[#F0F2F4]'}`}>
                {new Date(case8d.due_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Clock size={16} />
              <span>Age:</span>
              <span className="text-[#F0F2F4]">{case8d.age_days} days</span>
            </div>
          </div>
        </div>

        {/* Discipline Navigation */}
        <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#F0F2F4]">8D Disciplines</h2>
            <div className="text-sm text-[#6B7280]">
              Current: D{case8d.current_discipline}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {case8d.disciplines?.map((disc) => (
              <DisciplineTab
                key={disc.number}
                discipline={disc}
                isActive={activeDiscipline === disc.number}
                onClick={() => setActiveDiscipline(disc.number)}
              />
            ))}
          </div>
        </div>

        {/* Active Discipline Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Discipline Detail */}
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#F0F2F4]">
                  D{activeDisc?.number}: {activeDisc?.name}
                </h3>
                <span className={`px-3 py-1 rounded text-sm ${
                  activeDisc?.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  activeDisc?.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {activeDisc?.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Discipline-specific content */}
              {activeDisc?.number === 4 && activeDisc?.content?.five_why && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#6B7280] mb-3">5-Why Analysis</h4>
                  <FiveWhyDisplay fiveWhy={activeDisc.content.five_why} />
                </div>
              )}

              {activeDisc?.content?.root_cause && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#6B7280] mb-2">Root Cause</h4>
                  <div className="bg-[#15181C] border border-[#2A2F36] rounded-lg p-4">
                    <p className="text-[#F0F2F4]">{activeDisc.content.root_cause}</p>
                  </div>
                </div>
              )}

              {activeDisc?.content?.emergency_response && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#6B7280] mb-2">Emergency Response</h4>
                  <p className="text-[#F0F2F4]">{activeDisc.content.emergency_response}</p>
                </div>
              )}

              {activeDisc?.content?.is_is_not && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#6B7280] mb-3">IS / IS-NOT Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(activeDisc.content.is_is_not).map(([key, value]) => (
                      <div key={key} className="bg-[#15181C] border border-[#2A2F36] rounded-lg p-3">
                        <p className="text-xs text-[#6B7280] mb-1">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-[#F0F2F4]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeDisc?.content?.lessons_learned && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-[#6B7280] mb-2">Lessons Learned</h4>
                  <p className="text-[#F0F2F4]">{activeDisc.content.lessons_learned}</p>
                </div>
              )}

              {activeDisc?.status === 'not_started' && (
                <div className="text-center py-8 text-[#6B7280]">
                  <Circle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>This discipline has not been started yet.</p>
                  <button className="mt-4 flex items-center gap-2 mx-auto text-blue-400 hover:text-blue-300">
                    <Plus size={16} />
                    Start D{activeDisc.number}
                  </button>
                </div>
              )}

              {activeDisc?.completed_at && (
                <div className="pt-4 border-t border-[#2A2F36] text-sm text-[#6B7280]">
                  Completed on {new Date(activeDisc.completed_at).toLocaleString()}
                </div>
              )}
            </div>

            {/* Actions for this discipline */}
            {(actionsForDiscipline.length > 0 || [3, 5, 6, 7].includes(activeDiscipline)) && (
              <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#F0F2F4]">
                    Actions ({actionsForDiscipline.length})
                  </h3>
                  <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm">
                    <Plus size={16} />
                    Add Action
                  </button>
                </div>
                {actionsForDiscipline.length === 0 ? (
                  <div className="text-center py-6 text-[#6B7280]">
                    <p className="text-sm">No actions defined for this discipline yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actionsForDiscipline.map(action => (
                      <ActionItem key={action.id} action={action} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Evidence */}
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#F0F2F4]">Evidence</h3>
                <button className="text-blue-400 hover:text-blue-300">
                  <Paperclip size={16} />
                </button>
              </div>
              {evidenceForDiscipline.length === 0 ? (
                <p className="text-sm text-[#6B7280] text-center py-4">
                  No evidence for D{activeDiscipline}
                </p>
              ) : (
                <div className="space-y-2">
                  {evidenceForDiscipline.map(ev => (
                    <EvidenceItem key={ev.id} evidence={ev} />
                  ))}
                </div>
              )}
            </div>

            {/* Team */}
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
              <h3 className="font-semibold text-[#F0F2F4] mb-4">Team Members</h3>
              <div className="space-y-2">
                {case8d.team_members?.map(member => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <User size={14} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#F0F2F4] truncate">{member.name}</p>
                      <p className="text-xs text-[#6B7280]">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export */}
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
              <h3 className="font-semibold text-[#F0F2F4] mb-4">Export Report</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 bg-[#2A2F36] hover:bg-[#363B44] text-[#F0F2F4] px-4 py-2 rounded-lg transition-colors text-sm">
                  <Download size={16} />
                  Export Draft PDF
                </button>
                <button
                  disabled={!canExportValidated}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                    canExportValidated
                      ? 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-[#2A2F36] text-[#6B7280] cursor-not-allowed'
                  }`}
                >
                  <Download size={16} />
                  Export Validated PDF
                </button>
                {!canExportValidated && (
                  <p className="text-xs text-[#6B7280] text-center">
                    Complete all disciplines to export validated report
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default QualityCaseDetail;
