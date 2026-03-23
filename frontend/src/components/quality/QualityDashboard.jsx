import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  Plus,
  Filter,
  Search,
  Clock,
  User,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Calendar,
  Target,
  X,
  Link,
  Layers,
  Package,
  ArrowRight,
  Shield
} from 'lucide-react';
import PageSummary from '../ui/PageSummary';
import Header from '../../Header';
import { DEMO_8D_CASES, compute8DStats, SEVERITY_LEVELS, CASE_STATUS } from '../../data/demoQualityCases';
import { DEMO_PROJECTS } from '../../data/demoProjects';

// Severity badge component
const SeverityBadge = ({ severity }) => {
  const config = {
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', icon: AlertTriangle },
    major: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', icon: AlertCircle },
    minor: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: Info },
    observation: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30', icon: Eye }
  };
  const { bg, text, border, icon: Icon } = config[severity] || config.minor;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${bg} ${text} border ${border}`}>
      <Icon size={12} />
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
};

// Status badge component
const StatusBadge = ({ status }) => {
  const config = {
    open: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Open' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
    pending_verification: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending Verification' },
    closed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Closed' },
    cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelled' }
  };
  const { bg, text, label } = config[status] || config.open;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// Discipline progress indicator
const DisciplineProgress = ({ currentDiscipline, disciplines }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((d) => {
        const disc = disciplines?.find(disc => disc.number === d);
        const status = disc?.status || 'not_started';
        let bgColor = 'bg-[#2A2F36]';
        if (status === 'completed') bgColor = 'bg-green-500';
        else if (status === 'in_progress') bgColor = 'bg-blue-500';
        else if (status === 'skipped') bgColor = 'bg-gray-500';

        return (
          <div
            key={d}
            className={`w-4 h-4 rounded-sm ${bgColor} flex items-center justify-center`}
            title={`D${d}: ${disc?.name || ''} - ${status}`}
          >
            <span className="text-[8px] text-white font-medium">{d}</span>
          </div>
        );
      })}
    </div>
  );
};

// Case row component
const CaseRow = ({ case8d, onClick }) => {
  const isOverdue = case8d.status !== CASE_STATUS.CLOSED && new Date(case8d.due_date) < new Date();

  return (
    <div
      onClick={onClick}
      className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4 hover:border-blue-500/50 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-[#6B7280]">{case8d.case_number}</span>
            <SeverityBadge severity={case8d.severity} />
            <StatusBadge status={case8d.status} />
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                <Clock size={10} />
                Overdue
              </span>
            )}
          </div>
          <h3 className="text-[#F0F2F4] font-medium truncate mb-2">{case8d.title}</h3>
          <div className="flex items-center gap-4 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <User size={12} />
              {case8d.owner?.name}
            </span>
            <span className="flex items-center gap-1">
              <Target size={12} />
              {case8d.project_name} &gt; {case8d.node_name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Due: {new Date(case8d.due_date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {case8d.age_days}d old
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <DisciplineProgress currentDiscipline={case8d.current_discipline} disciplines={case8d.disciplines} />
          <div className="text-xs text-[#6B7280]">
            D{case8d.current_discipline}
          </div>
        </div>
        <ChevronRight size={20} className="text-[#6B7280] group-hover:text-blue-400 transition-colors" />
      </div>
    </div>
  );
};

// Stats card component
const StatsCard = ({ label, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    gray: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs opacity-80">{label}</div>
        </div>
        {Icon && <Icon size={24} className="opacity-50" />}
      </div>
    </div>
  );
};

// Helper function to flatten the tree
const flattenNodes = (nodes, projectName, path = '') => {
  let result = [];
  nodes.forEach(node => {
    const nodePath = path ? `${path} > ${node.name}` : node.name;
    result.push({
      id: node.id || node.part_number,
      name: node.name,
      part_number: node.part_number,
      path: nodePath,
      projectName
    });
    if (node.children && node.children.length > 0) {
      result = result.concat(flattenNodes(node.children, projectName, nodePath));
    }
  });
  return result;
};

// Link Requirement Modal - enforces that 8D cases must link to a project and node
const LinkRequirementModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Get projects from demo data
  const projects = useMemo(() => {
    return DEMO_PROJECTS.map(p => ({
      id: p.id,
      name: p.name
    }));
  }, []);

  // Get nodes for selected project
  const nodes = useMemo(() => {
    if (!selectedProject) return [];
    const project = DEMO_PROJECTS.find(p => p.id === selectedProject);
    if (!project || !project.root_node) return [];
    // root_node is a single node with children, wrap in array for flattenNodes
    return flattenNodes([project.root_node], project.name);
  }, [selectedProject]);

  // Filter nodes by search
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nodes;
    const lower = searchTerm.toLowerCase();
    return nodes.filter(n =>
      n.name.toLowerCase().includes(lower) ||
      n.part_number?.toLowerCase().includes(lower) ||
      n.path.toLowerCase().includes(lower)
    );
  }, [nodes, searchTerm]);

  const selectedProjectName = projects.find(p => p.id === selectedProject)?.name || '';
  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  const handleConfirm = () => {
    if (selectedProject && selectedNode && selectedNodeData) {
      onConfirm({
        projectId: selectedProject,
        projectName: selectedProjectName,
        nodeId: selectedNode,
        nodeName: selectedNodeData.name,
        nodePath: selectedNodeData.path,
        nodePartNumber: selectedNodeData.part_number
      });
    }
  };

  const handleClose = () => {
    setSelectedProject('');
    setSelectedNode('');
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2F36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F0F2F4]">Link Required</h2>
              <p className="text-sm text-[#6B7280]">8D cases must be linked to a design node</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-[#6B7280] hover:text-[#F0F2F4] rounded-lg hover:bg-[#2A2F36] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Info Banner */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3">
            <Info size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200/80">
              Quality cases must be linked to a specific part or assembly in your design structure.
              This ensures traceability and enables impact analysis.
            </p>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-[#F0F2F4] mb-2">
              <Layers size={14} className="inline mr-2 text-blue-400" />
              Select Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedNode('');
                setSearchTerm('');
              }}
              className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2.5 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="">Choose a project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Node Selection */}
          {selectedProject && (
            <div>
              <label className="block text-sm font-medium text-[#F0F2F4] mb-2">
                <Package size={14} className="inline mr-2 text-green-400" />
                Select Node
              </label>
              <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search nodes..."
                  className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg pl-9 pr-3 py-2 text-sm text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-[#2A2F36] rounded-lg bg-[#15181C]">
                {filteredNodes.length === 0 ? (
                  <div className="p-4 text-center text-[#6B7280] text-sm">
                    {searchTerm ? 'No matching nodes found' : 'No nodes available'}
                  </div>
                ) : (
                  filteredNodes.map(node => (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node.id)}
                      className={`w-full text-left p-3 border-b border-[#2A2F36] last:border-b-0 hover:bg-[#2A2F36] transition-colors ${
                        selectedNode === node.id ? 'bg-blue-500/20 border-l-2 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="font-medium text-[#F0F2F4] text-sm">{node.name}</div>
                      <div className="text-xs text-[#6B7280] truncate">{node.path}</div>
                      {node.part_number && (
                        <div className="text-xs text-blue-400 font-mono mt-1">{node.part_number}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Selected Summary */}
          {selectedProject && selectedNode && selectedNodeData && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <div className="text-xs text-green-400 font-medium mb-1">Selected Link:</div>
              <div className="flex items-center gap-2 text-sm text-[#F0F2F4]">
                <span>{selectedProjectName}</span>
                <ArrowRight size={14} className="text-[#6B7280]" />
                <span>{selectedNodeData.name}</span>
                {selectedNodeData.part_number && (
                  <span className="text-xs text-[#6B7280] font-mono">({selectedNodeData.part_number})</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#2A2F36]">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-[#6B7280] hover:text-[#F0F2F4] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedProject || !selectedNode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              selectedProject && selectedNode
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-[#2A2F36] text-[#6B7280] cursor-not-allowed'
            }`}
          >
            <Plus size={16} />
            Create 8D Case
          </button>
        </div>
      </div>
    </div>
  );
};

const QualityDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Handler for when link is confirmed
  const handleLinkConfirm = (linkData) => {
    setShowLinkModal(false);
    // In production, this would navigate to the new case form with link data pre-filled
    // For demo, we'll just show an alert and log the data
    console.log('Creating 8D case linked to:', linkData);
    // Could navigate to: /quality/new?project=${linkData.projectId}&node=${linkData.nodeId}
    alert(`8D Case will be created for:\nProject: ${linkData.projectName}\nNode: ${linkData.nodeName} (${linkData.nodePartNumber})`);
  };

  // Get unique projects for filter
  const projects = useMemo(() => {
    const projectSet = new Set(DEMO_8D_CASES.map(c => c.project_name));
    return Array.from(projectSet);
  }, []);

  // Filter cases
  const filteredCases = useMemo(() => {
    return DEMO_8D_CASES.filter(c => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!c.title.toLowerCase().includes(query) &&
            !c.case_number.toLowerCase().includes(query) &&
            !c.description?.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      // Severity filter
      if (severityFilter !== 'all' && c.severity !== severityFilter) return false;
      // Project filter
      if (projectFilter !== 'all' && c.project_name !== projectFilter) return false;
      return true;
    });
  }, [searchQuery, statusFilter, severityFilter, projectFilter]);

  // Compute stats
  const stats = useMemo(() => compute8DStats(DEMO_8D_CASES), []);

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F4] flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" />
              Quality (8D) Dashboard
            </h1>
            <p className="text-[#6B7280] mt-1">
              Track and resolve quality issues with the 8-Discipline methodology
            </p>
          </div>
          <button
            onClick={() => setShowLinkModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
            New 8D Case
          </button>
        </div>

        {/* Section Summary */}
        <PageSummary icon={Shield} iconColor="text-yellow-400" borderColor="border-yellow-500/30" bgColor="bg-yellow-500/5">
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Purpose:</strong> This section manages formal problem-solving and corrective actions using the 8-Discipline (8D) methodology. Every quality case must be linked to a specific design node to ensure traceability.
          </p>
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Method:</strong> Cases progress through D0-D8 disciplines with required documentation at each step. The system enforces root-cause analysis (D4), corrective action identification (D5-D6), and verification of effectiveness (D7) before closure.
          </p>
          <p>
            <strong className="text-[#F0F2F4]">Outcome:</strong> Captures failures with full context, enforces structured root-cause analysis, and prevents recurrence through verified corrective actions. Links quality escapes back to design decisions for continuous improvement.
          </p>
        </PageSummary>

        {/* Link Requirement Modal */}
        <LinkRequirementModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          onConfirm={handleLinkConfirm}
        />

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <StatsCard label="Total Cases" value={stats.total} icon={Target} color="gray" />
          <StatsCard label="Open" value={stats.open} icon={AlertCircle} color="blue" />
          <StatsCard label="In Progress" value={stats.inProgress} icon={Clock} color="blue" />
          <StatsCard label="Pending Verify" value={stats.pendingVerification} icon={Eye} color="yellow" />
          <StatsCard label="Closed" value={stats.closed} icon={CheckCircle2} color="green" />
          <StatsCard label="Critical" value={stats.critical} icon={AlertTriangle} color="red" />
          <StatsCard label="Overdue" value={stats.overdue} icon={XCircle} color="red" />
        </div>

        {/* Filters */}
        <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[#6B7280]" />
              <span className="text-sm text-[#6B7280]">Filters:</span>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="closed">Closed</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
              <option value="observation">Observation</option>
            </select>

            {/* Project Filter */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Cases List */}
        <div className="space-y-3">
          {filteredCases.length === 0 ? (
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-8 text-center">
              <AlertCircle size={48} className="mx-auto text-[#6B7280] mb-4" />
              <h3 className="text-[#F0F2F4] font-medium mb-2">No cases found</h3>
              <p className="text-[#6B7280] text-sm">
                Try adjusting your filters or create a new 8D case.
              </p>
            </div>
          ) : (
            filteredCases.map(case8d => (
              <CaseRow
                key={case8d.id}
                case8d={case8d}
                onClick={() => navigate(`/quality/${case8d.id}`)}
              />
            ))
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 text-center text-sm text-[#6B7280]">
          Showing {filteredCases.length} of {DEMO_8D_CASES.length} cases
        </div>
      </main>
    </div>
  );
};

export default QualityDashboard;
