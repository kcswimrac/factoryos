import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  FileText,
  Download,
  Plus,
  Filter,
  Search,
  Calendar,
  Clock,
  User,
  ChevronRight,
  FlaskConical,
  Layers,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  PieChart,
  Activity,
  Target,
  CheckCircle2,
  FileBarChart,
  Folder,
  BookOpen,
  Eye
} from 'lucide-react';
import Header from '../../Header';

// Demo report data
const DEMO_REPORTS = [
  {
    id: 'rpt-baja-2025-cdr',
    name: 'BAJA 2025 - Complete Engineering Design Report',
    type: 'complete_design_report',
    source_module: 'design',
    project_name: 'BAJA SAE 2025',
    created_at: '2025-02-03T09:00:00Z',
    created_by: { name: 'John Martinez', role: 'Lead Engineer' },
    status: 'published',
    format: 'pdf',
    pages: 87,
    views: 234,
    featured: true,
    description: 'Comprehensive design documentation with full traceability from requirements through testing and correlation'
  },
  {
    id: 'rpt-001',
    name: 'Electric Bus Gen 1 - Monthly Progress Report',
    type: 'progress',
    source_module: 'design',
    project_name: 'Electric Bus Gen 1',
    created_at: '2025-01-15T10:30:00Z',
    created_by: { name: 'Sarah Chen', role: 'Program Manager' },
    status: 'published',
    format: 'pdf',
    pages: 24,
    views: 156
  },
  {
    id: 'rpt-002',
    name: 'Battery Cell Optimization - DOE Summary',
    type: 'doe_summary',
    source_module: 'doe',
    project_name: 'Electric Bus Gen 1',
    created_at: '2025-01-12T14:15:00Z',
    created_by: { name: 'Michael Torres', role: 'Materials Engineer' },
    status: 'published',
    format: 'pdf',
    pages: 12,
    views: 89
  },
  {
    id: 'rpt-003',
    name: 'Q4 2024 Quality Metrics Dashboard',
    type: 'quality_metrics',
    source_module: 'quality',
    project_name: 'All Projects',
    created_at: '2025-01-10T09:00:00Z',
    created_by: { name: 'David Park', role: 'Quality Manager' },
    status: 'published',
    format: 'dashboard',
    pages: null,
    views: 342
  },
  {
    id: 'rpt-004',
    name: 'Motor Assembly 8D Case Report - 8D-2024-047',
    type: '8d_report',
    source_module: 'quality',
    project_name: 'Electric Bus Gen 1',
    created_at: '2025-01-08T16:45:00Z',
    created_by: { name: 'James Wilson', role: 'Quality Engineer' },
    status: 'draft',
    format: 'pdf',
    pages: 18,
    views: 23
  },
  {
    id: 'rpt-005',
    name: 'SOP Compliance Audit Report - January 2025',
    type: 'sop_audit',
    source_module: 'sops',
    project_name: 'All Projects',
    created_at: '2025-01-05T11:30:00Z',
    created_by: { name: 'Lisa Martinez', role: 'Compliance Officer' },
    status: 'published',
    format: 'pdf',
    pages: 8,
    views: 67
  },
  {
    id: 'rpt-006',
    name: 'Inverter Thermal Performance - Test Results',
    type: 'test_results',
    source_module: 'doe',
    project_name: 'Electric Bus Gen 1',
    created_at: '2025-01-03T13:20:00Z',
    created_by: { name: 'Michael Torres', role: 'Materials Engineer' },
    status: 'published',
    format: 'pdf',
    pages: 15,
    views: 78
  }
];

// Report templates
const REPORT_TEMPLATES = [
  {
    id: 'tmpl-complete-design',
    name: 'Complete Engineering Design Report',
    description: 'End-to-end design record: requirements, design, analysis, test, and correlation',
    source: 'design',
    icon: BookOpen,
    color: 'indigo'
  },
  {
    id: 'tmpl-progress',
    name: 'Project Progress Report',
    description: 'Monthly or weekly progress summary with milestones and metrics',
    source: 'design',
    icon: TrendingUp,
    color: 'blue'
  },
  {
    id: 'tmpl-doe',
    name: 'DOE Experiment Summary',
    description: 'Complete DOE analysis with factors, responses, and recommendations',
    source: 'doe',
    icon: FlaskConical,
    color: 'purple'
  },
  {
    id: 'tmpl-8d',
    name: '8D Quality Report',
    description: 'Full 8-Discipline quality case report with root cause analysis',
    source: 'quality',
    icon: AlertTriangle,
    color: 'yellow'
  },
  {
    id: 'tmpl-metrics',
    name: 'Quality Metrics Dashboard',
    description: 'KPIs, trends, and quality performance indicators',
    source: 'quality',
    icon: PieChart,
    color: 'green'
  },
  {
    id: 'tmpl-sop',
    name: 'SOP Compliance Report',
    description: 'SOP adherence audit with gaps and recommendations',
    source: 'sops',
    icon: ClipboardList,
    color: 'cyan'
  },
  {
    id: 'tmpl-custom',
    name: 'Custom Report',
    description: 'Build a custom report from multiple data sources',
    source: 'all',
    icon: FileBarChart,
    color: 'gray'
  }
];

// Module colors and icons
const MODULE_CONFIG = {
  design: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Layers },
  doe: { color: 'text-purple-400', bg: 'bg-purple-500/20', icon: FlaskConical },
  quality: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: AlertTriangle },
  sops: { color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: ClipboardList }
};

// Stats card component
const StatsCard = ({ label, value, icon: Icon, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
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
          {trend && (
            <div className="flex items-center gap-1 text-xs mt-1">
              <TrendingUp size={12} />
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && <Icon size={24} className="opacity-50" />}
      </div>
    </div>
  );
};

// Report row component
const ReportRow = ({ report, onClick }) => {
  const config = MODULE_CONFIG[report.source_module] || MODULE_CONFIG.design;
  const Icon = report.type === 'complete_design_report' ? BookOpen : config.icon;
  const isPublished = report.status === 'published';
  const isFeatured = report.featured;

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-4 transition-all cursor-pointer group ${
        isFeatured
          ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/40 hover:border-indigo-500'
          : 'bg-[#1C1F24] border border-[#2A2F36] hover:border-blue-500/50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 ${isFeatured ? 'bg-indigo-500/20' : config.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={isFeatured ? 'text-indigo-400' : config.color} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {isFeatured && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400">
                  Featured
                </span>
              )}
              <h3 className="text-[#F0F2F4] font-medium truncate">{report.name}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                isPublished
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                {isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            {report.description && (
              <p className="text-sm text-[#B4BAC4] mb-2">{report.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-[#6B7280] flex-wrap">
              <span className="flex items-center gap-1">
                <Folder size={12} />
                {report.project_name}
              </span>
              <span className="flex items-center gap-1">
                <User size={12} />
                {report.created_by.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(report.created_at).toLocaleDateString()}
              </span>
              {report.pages && (
                <span className="flex items-center gap-1">
                  <FileText size={12} />
                  {report.pages} pages
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {report.views} views
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Download action
            }}
            className="p-2 text-[#6B7280] hover:text-blue-400 hover:bg-[#2A2F36] rounded-lg transition-colors"
            title="Download"
          >
            <Download size={16} />
          </button>
          <ChevronRight size={20} className="text-[#6B7280] group-hover:text-blue-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};

// Template card component
const TemplateCard = ({ template, onClick }) => {
  const Icon = template.icon;
  const colorClasses = {
    indigo: 'border-indigo-500/30 hover:border-indigo-500 bg-indigo-500/5',
    blue: 'border-blue-500/30 hover:border-blue-500 bg-blue-500/5',
    purple: 'border-purple-500/30 hover:border-purple-500 bg-purple-500/5',
    yellow: 'border-yellow-500/30 hover:border-yellow-500 bg-yellow-500/5',
    green: 'border-green-500/30 hover:border-green-500 bg-green-500/5',
    cyan: 'border-cyan-500/30 hover:border-cyan-500 bg-cyan-500/5',
    gray: 'border-[#2A2F36] hover:border-blue-500 bg-[#15181C]'
  };
  const iconColors = {
    indigo: 'text-indigo-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400',
    gray: 'text-gray-400'
  };

  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-lg border ${colorClasses[template.color]} transition-all`}
    >
      <div className="flex items-start gap-3">
        <Icon size={24} className={iconColors[template.color]} />
        <div>
          <h4 className="text-[#F0F2F4] font-medium text-sm">{template.name}</h4>
          <p className="text-xs text-[#6B7280] mt-1">{template.description}</p>
        </div>
      </div>
    </button>
  );
};

const ReportingDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTemplates, setShowTemplates] = useState(false);

  // Filter reports
  const filteredReports = useMemo(() => {
    return DEMO_REPORTS.filter(r => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!r.name.toLowerCase().includes(query) &&
            !r.project_name.toLowerCase().includes(query) &&
            !r.created_by.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Source filter
      if (sourceFilter !== 'all' && r.source_module !== sourceFilter) return false;
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });
  }, [searchQuery, sourceFilter, statusFilter]);

  // Compute stats
  const stats = useMemo(() => {
    const total = DEMO_REPORTS.length;
    const published = DEMO_REPORTS.filter(r => r.status === 'published').length;
    const drafts = DEMO_REPORTS.filter(r => r.status === 'draft').length;
    const totalViews = DEMO_REPORTS.reduce((sum, r) => sum + r.views, 0);
    return { total, published, drafts, totalViews };
  }, []);

  const handleCreateReport = (template) => {
    // In production, this would navigate to the report builder with template
    console.log('Creating report from template:', template);
    alert(`Creating ${template.name}...\n\nThis would open the report builder wizard.`);
    setShowTemplates(false);
  };

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F4] flex items-center gap-2">
              <BarChart3 className="text-blue-400" />
              Reporting
            </h1>
            <p className="text-[#6B7280] mt-1">
              Generate and manage reports across all modules
            </p>
          </div>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} />
            New Report
          </button>
        </div>

        {/* Report Templates Panel */}
        {showTemplates && (
          <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#F0F2F4]">Choose a Report Template</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-[#6B7280] hover:text-[#F0F2F4] text-sm"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {REPORT_TEMPLATES.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => handleCreateReport(template)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatsCard label="Total Reports" value={stats.total} icon={FileText} color="gray" />
          <StatsCard label="Published" value={stats.published} icon={CheckCircle2} color="green" />
          <StatsCard label="Drafts" value={stats.drafts} icon={Clock} color="yellow" />
          <StatsCard label="Total Views" value={stats.totalViews} icon={Activity} color="blue" trend="+12% this week" />
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
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#15181C] border border-[#2A2F36] rounded-lg pl-9 pr-4 py-2 text-sm text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Sources</option>
              <option value="design">Design</option>
              <option value="doe">DOE</option>
              <option value="quality">Quality</option>
              <option value="sops">SOPs</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.length === 0 ? (
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-8 text-center">
              <FileText size={48} className="mx-auto text-[#6B7280] mb-4" />
              <h3 className="text-[#F0F2F4] font-medium mb-2">No reports found</h3>
              <p className="text-[#6B7280] text-sm mb-4">
                Try adjusting your filters or create a new report.
              </p>
              <button
                onClick={() => setShowTemplates(true)}
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <Plus size={16} />
                Create your first report
              </button>
            </div>
          ) : (
            filteredReports.map(report => (
              <ReportRow
                key={report.id}
                report={report}
                onClick={() => {
                  if (report.id === 'rpt-baja-2025-cdr') {
                    navigate('/reporting/baja-2025-design-report');
                  } else {
                    console.log('View report:', report.id);
                  }
                }}
              />
            ))
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 text-center text-sm text-[#6B7280]">
          Showing {filteredReports.length} of {DEMO_REPORTS.length} reports
        </div>
      </main>
    </div>
  );
};

export default ReportingDashboard;
