import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../Header';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Wrench,
  Factory,
  TestTube,
  Settings,
  Eye,
  AlertCircle,
  Globe,
  Building2,
  FolderOpen,
  FileCode,
  Warehouse,
  User,
  Users2,
  Lock,
  Target,
  Info,
  ChefHat
} from 'lucide-react';
import PageSummary from '../ui/PageSummary';
import { DEMO_SOPS } from '../../data/demoSOPs';

const API_URL = import.meta.env.VITE_API_URL || '';

// SOP Type configurations
const SOP_TYPES = {
  manufacturing: { label: 'Manufacturing', short: 'Mfg', icon: Factory, color: 'text-blue-400' },
  assembly: { label: 'Assembly', short: 'Assy', icon: Settings, color: 'text-purple-400' },
  test_execution: { label: 'Test Execution', short: 'Test', icon: TestTube, color: 'text-green-400' },
  service: { label: 'Service', short: 'Svc', icon: Wrench, color: 'text-amber-400' },
  inspection: { label: 'Inspection', short: 'Insp', icon: Eye, color: 'text-cyan-400' },
  rework_containment: { label: 'Rework/Containment', short: 'Rework', icon: AlertCircle, color: 'text-red-400' },
  cooking: { label: 'Cooking', short: 'Cook', icon: ChefHat, color: 'text-orange-400' }
};

// SOP Scope configurations
const SOP_SCOPES = {
  global: { label: 'Global Process', short: 'Global', icon: Globe, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  org: { label: 'Organization', short: 'Org', icon: Building2, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  project: { label: 'Project', short: 'Project', icon: FolderOpen, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  node: { label: 'Node', short: 'Node', icon: FileCode, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  node_revision: { label: 'Node Revision', short: 'Rev', icon: FileCode, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
  asset_site: { label: 'Asset/Site', short: 'Asset', icon: Warehouse, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' }
};

// Status configurations
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400 border-slate-500/40', icon: FileText },
  in_review: { label: 'In Review', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400 border-green-500/40', icon: CheckCircle },
  obsolete: { label: 'Obsolete', color: 'bg-red-500/20 text-red-400 border-red-500/40', icon: XCircle }
};

// Visibility scope configurations (who can see/access the SOP)
const VISIBILITY_CONFIG = {
  user: { label: 'User (Private)', short: 'User', icon: Lock, color: 'text-slate-400' },
  org_group: { label: 'Org Group', short: 'Group', icon: Users2, color: 'text-purple-400' },
  org: { label: 'Organization', short: 'Org', icon: Building2, color: 'text-blue-400' },
  public: { label: 'Public', short: 'Public', icon: Globe, color: 'text-emerald-400' }
};

// Demo SOPs are imported from data/demoSOPs.js

// Helper component for grouped SOP sections
function SOPGroupSection({ title, icon: Icon, iconColor, bgColor, sops, navigate, showNode = false }) {
  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-3 ${bgColor} border-b border-[#2A2F36]`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-semibold text-[#F0F2F4]">{title}</h3>
        <span className="text-xs text-[#6B7280]">({sops.length})</span>
      </div>
      <table className="w-full">
        <thead className="bg-[#0F1114]">
          <tr>
            <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280] uppercase tracking-wide">GAID</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Title</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Type</th>
            {showNode && <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Node</th>}
            <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Status</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-[#6B7280] uppercase tracking-wide"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2A2F36]">
          {sops.map(sop => {
            const typeConfig = SOP_TYPES[sop.sop_type];
            const statusConfig = STATUS_CONFIG[sop.status];
            const TypeIcon = typeConfig?.icon || FileText;
            const StatusIcon = statusConfig?.icon || FileText;

            return (
              <tr
                key={sop.id}
                onClick={() => navigate(`/sops/${sop.id}`)}
                className="hover:bg-[#22262C] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-blue-400">{sop.global_artifact_id}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[#F0F2F4] font-medium text-sm">{sop.title}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <TypeIcon className={`w-4 h-4 ${typeConfig?.color || 'text-gray-400'}`} />
                    <span className="text-sm text-[#B4BAC4]">{typeConfig?.short || sop.sop_type}</span>
                  </div>
                </td>
                {showNode && (
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#B4BAC4]">{sop.node_name || '—'}</span>
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${statusConfig?.color || 'bg-gray-500/20 text-gray-400'}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig?.label || sop.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SOPListPage() {
  const navigate = useNavigate();
  const [sops, setSOPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterScope, setFilterScope] = useState('all');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [groupByScope, setGroupByScope] = useState(true);

  useEffect(() => {
    fetchSOPs();
  }, [filterType, filterStatus, filterProject, filterScope, filterVisibility]);

  const fetchSOPs = async () => {
    try {
      setLoading(true);
      // In production, fetch from API
      // const response = await fetch(`${API_URL}/api/sops?type=${filterType}&status=${filterStatus}`);
      // const data = await response.json();
      // setSOPs(data.data);

      // Demo data for Alpha
      setTimeout(() => {
        setSOPs(DEMO_SOPS);
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error('Error fetching SOPs:', error);
      setSOPs(DEMO_SOPS);
      setLoading(false);
    }
  };

  // Filter SOPs
  const filteredSOPs = sops.filter(sop => {
    const matchesSearch = sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.global_artifact_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sop.node_name && sop.node_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || sop.sop_type === filterType;
    const matchesStatus = filterStatus === 'all' || sop.status === filterStatus;
    const matchesProject = filterProject === 'all' || sop.project_name === filterProject;
    const matchesScope = filterScope === 'all' || sop.sop_scope_type === filterScope;
    const matchesVisibility = filterVisibility === 'all' || sop.visibility_scope === filterVisibility;
    return matchesSearch && matchesType && matchesStatus && matchesProject && matchesScope && matchesVisibility;
  });

  // Group SOPs by scope for display
  const groupedSOPs = groupByScope ? {
    global: filteredSOPs.filter(s => s.sop_scope_type === 'global'),
    org: filteredSOPs.filter(s => s.sop_scope_type === 'org'),
    project: filteredSOPs.filter(s => ['project', 'node', 'node_revision'].includes(s.sop_scope_type)),
    asset_site: filteredSOPs.filter(s => s.sop_scope_type === 'asset_site')
  } : null;

  // Get unique projects for filter
  const projects = [...new Set(sops.filter(s => s.project_name).map(s => s.project_name))];

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-8">
        {/* Page Header with Alpha Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-blue-400" />
            <h1 className="text-2xl font-bold text-[#F0F2F4]">
              Standard Operating Procedures
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded">
              ALPHA
            </span>
          </div>
          <button
            onClick={() => navigate('/sops/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New SOP
          </button>
        </div>

        {/* Section Summary */}
        <PageSummary icon={Target} iconColor="text-purple-400" borderColor="border-purple-500/30" bgColor="bg-purple-500/5">
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Purpose:</strong> This section defines and executes standard operating procedures for maintenance, service, inspection, and recurring operational tasks. SOPs declare scope (Global, Organization, Project, Node, or Asset/Site) to control where they apply.
          </p>
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Method:</strong> Each SOP contains versioned step sequences with approval workflows. Execution logs record who performed each step, when, and what observations were made. The system tracks due dates and flags overdue procedures.
          </p>
          <p>
            <strong className="text-[#F0F2F4]">Outcome:</strong> Ensures work is performed consistently by codifying tribal knowledge into repeatable procedures. Logs execution history for audit trails and supports scheduled and condition-based maintenance programs.
          </p>
        </PageSummary>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search SOPs by title, GAID, or node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#B4BAC4] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Scopes</option>
              {Object.entries(SOP_SCOPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#B4BAC4] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#B4BAC4] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Types</option>
              {Object.entries(SOP_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#B4BAC4] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#B4BAC4] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Visibility</option>
              {Object.entries(VISIBILITY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <button
              onClick={() => setGroupByScope(!groupByScope)}
              className={`px-3 py-2 border rounded-lg text-sm transition-colors ${
                groupByScope
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                  : 'bg-[#1C1F24] border-[#2A2F36] text-[#6B7280]'
              }`}
            >
              Group by Scope
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#2A2F36] border-t-blue-500 mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading SOPs...</p>
          </div>
        )}

        {/* SOP List */}
        {!loading && groupByScope && (
          <div className="space-y-6">
            {/* Global SOPs */}
            {groupedSOPs.global.length > 0 && (
              <SOPGroupSection
                title="Global Process SOPs"
                icon={Globe}
                iconColor="text-emerald-400"
                bgColor="bg-emerald-500/10"
                sops={groupedSOPs.global}
                navigate={navigate}
              />
            )}

            {/* Organization SOPs */}
            {groupedSOPs.org.length > 0 && (
              <SOPGroupSection
                title="Organization SOPs"
                icon={Building2}
                iconColor="text-blue-400"
                bgColor="bg-blue-500/10"
                sops={groupedSOPs.org}
                navigate={navigate}
              />
            )}

            {/* Project/Node SOPs - grouped by project */}
            {groupedSOPs.project.length > 0 && (
              <div className="space-y-4">
                {[...new Set(groupedSOPs.project.map(s => s.project_name))].map(projectName => (
                  <SOPGroupSection
                    key={projectName}
                    title={`Project: ${projectName}`}
                    icon={FolderOpen}
                    iconColor="text-purple-400"
                    bgColor="bg-purple-500/10"
                    sops={groupedSOPs.project.filter(s => s.project_name === projectName)}
                    navigate={navigate}
                    showNode={true}
                  />
                ))}
              </div>
            )}

            {/* Asset/Site SOPs */}
            {groupedSOPs.asset_site.length > 0 && (
              <SOPGroupSection
                title="Asset/Site SOPs"
                icon={Warehouse}
                iconColor="text-cyan-400"
                bgColor="bg-cyan-500/10"
                sops={groupedSOPs.asset_site}
                navigate={navigate}
              />
            )}

            {filteredSOPs.length === 0 && (
              <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-12 text-center">
                <ClipboardList className="w-12 h-12 text-[#4B5563] mx-auto mb-4" />
                <p className="text-[#6B7280]">No SOPs found matching your criteria</p>
                <button
                  onClick={() => navigate('/sops/new')}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
                >
                  Create First SOP
                </button>
              </div>
            )}
          </div>
        )}

        {/* Flat SOP List (when not grouped) */}
        {!loading && !groupByScope && (
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#0F1114]">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Scope</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Visibility</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">GAID</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Node</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2F36]">
                {filteredSOPs.map(sop => {
                  const typeConfig = SOP_TYPES[sop.sop_type];
                  const statusConfig = STATUS_CONFIG[sop.status];
                  const scopeConfig = SOP_SCOPES[sop.sop_scope_type];
                  const visibilityConfig = VISIBILITY_CONFIG[sop.visibility_scope];
                  const TypeIcon = typeConfig?.icon || FileText;
                  const StatusIcon = statusConfig?.icon || FileText;
                  const ScopeIcon = scopeConfig?.icon || FileText;
                  const VisibilityIcon = visibilityConfig?.icon || Globe;

                  return (
                    <tr
                      key={sop.id}
                      onClick={() => navigate(`/sops/${sop.id}`)}
                      className="hover:bg-[#22262C] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <ScopeIcon className={`w-4 h-4 ${scopeConfig?.color || 'text-gray-400'}`} />
                          <span className="text-xs text-[#B4BAC4]">{scopeConfig?.short || sop.sop_scope_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <VisibilityIcon className={`w-4 h-4 ${visibilityConfig?.color || 'text-gray-400'}`} />
                          <span className="text-xs text-[#B4BAC4]">{visibilityConfig?.short || sop.visibility_scope}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-blue-400">{sop.global_artifact_id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-[#F0F2F4] font-medium text-sm">{sop.title}</p>
                          <p className="text-xs text-[#6B7280]">{sop.project_name || sop.org_name || 'Global'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <TypeIcon className={`w-4 h-4 ${typeConfig?.color || 'text-gray-400'}`} />
                          <span className="text-sm text-[#B4BAC4]">{typeConfig?.short || sop.sop_type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#B4BAC4]">{sop.node_name || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${statusConfig?.color || 'bg-gray-500/20 text-gray-400'}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig?.label || sop.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredSOPs.length === 0 && (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-[#4B5563] mx-auto mb-4" />
                <p className="text-[#6B7280]">No SOPs found matching your criteria</p>
                <button
                  onClick={() => navigate('/sops/new')}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
                >
                  Create First SOP
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats Summary */}
        {!loading && filteredSOPs.length > 0 && (
          <div className="mt-4 flex items-center gap-6 text-xs text-[#6B7280]">
            <span>Showing {filteredSOPs.length} of {sops.length} SOPs</span>
            <span>Draft: {sops.filter(s => s.status === 'draft').length}</span>
            <span>In Review: {sops.filter(s => s.status === 'in_review').length}</span>
            <span>Approved: {sops.filter(s => s.status === 'approved').length}</span>
          </div>
        )}
      </main>
    </div>
  );
}

export default SOPListPage;
