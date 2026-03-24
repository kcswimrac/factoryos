import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Filter,
  FlaskConical,
  Wrench,
  TestTube2,
  Target,
  Diamond,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Info,
  Database,
  BarChart3
} from 'lucide-react';
import PageSummary from '../ui/PageSummary';
import Header from '../../Header';
import { DEMO_TIMELINE_DATA, BAR_STATUS, calculateBarPosition } from '../../data/demoTimeline';

// Month labels
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Status colors
const STATUS_COLORS = {
  [BAR_STATUS.COMPLETED]: 'bg-green-500',
  [BAR_STATUS.ON_TRACK]: 'bg-blue-500',
  [BAR_STATUS.AT_RISK]: 'bg-yellow-500',
  [BAR_STATUS.OVERDUE]: 'bg-red-500',
  [BAR_STATUS.PLANNED]: 'bg-gray-500/50'
};

const STATUS_TEXT_COLORS = {
  [BAR_STATUS.COMPLETED]: 'text-green-400',
  [BAR_STATUS.ON_TRACK]: 'text-blue-400',
  [BAR_STATUS.AT_RISK]: 'text-yellow-400',
  [BAR_STATUS.OVERDUE]: 'text-red-400',
  [BAR_STATUS.PLANNED]: 'text-gray-400'
};

// Type icons
const TYPE_ICONS = {
  test: TestTube2,
  fixture: Wrench,
  doe: FlaskConical,
  parametric: FlaskConical,
  sensitivity: FlaskConical,
  trade_study: FlaskConical,
  project: Target
};

// Status badge component
const StatusBadge = ({ status }) => {
  const config = {
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Completed' },
    on_track: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'On Track' },
    at_risk: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'At Risk' },
    overdue: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Overdue' },
    planned: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Planned' }
  };
  const { bg, text, label } = config[status] || config.planned;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// Timeline bar component
const TimelineBar = ({ bar, year, showPlanned = true }) => {
  if (!bar) return null;

  const actualPos = calculateBarPosition(bar.start, bar.end, year);
  const plannedPos = bar.planned_end ? calculateBarPosition(bar.start, bar.planned_end, year) : null;

  return (
    <div className="relative h-6">
      {/* Planned bar (faint) */}
      {showPlanned && plannedPos && bar.status !== BAR_STATUS.COMPLETED && (
        <div
          className="absolute top-1 h-4 bg-gray-600/30 rounded-sm"
          style={{ left: `${plannedPos.left}%`, width: `${plannedPos.width}%` }}
        />
      )}
      {/* Actual bar */}
      <div
        className={`absolute top-1 h-4 rounded-sm ${STATUS_COLORS[bar.status] || 'bg-blue-500'}`}
        style={{ left: `${actualPos.left}%`, width: `${Math.max(actualPos.width, 0.5)}%` }}
      />
    </div>
  );
};

// Milestone marker component
const MilestoneMarker = ({ milestone, year }) => {
  const pos = calculateBarPosition(milestone.target_date, milestone.target_date, year);

  const statusColors = {
    completed: 'text-green-400',
    pending: 'text-blue-400',
    at_risk: 'text-yellow-400',
    missed: 'text-red-400'
  };

  return (
    <div
      className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
      style={{ left: `${pos.left}%` }}
      title={`${milestone.name}: ${new Date(milestone.target_date).toLocaleDateString()}`}
    >
      <Diamond size={12} className={`${statusColors[milestone.status] || 'text-blue-400'} fill-current`} />
    </div>
  );
};

// Today marker component
const TodayMarker = ({ year }) => {
  const today = new Date();
  if (today.getFullYear() !== year) return null;

  const pos = calculateBarPosition(today.toISOString(), today.toISOString(), year);

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
      style={{ left: `${pos.left}%` }}
    >
      <div className="absolute -top-5 -translate-x-1/2 text-xs text-red-400 whitespace-nowrap">
        Today
      </div>
    </div>
  );
};

// Project row component
const ProjectRow = ({ project, year, isExpanded, onToggle }) => {
  const Icon = TYPE_ICONS[project.type] || Target;

  return (
    <div className="border-b border-[#2A2F36]">
      {/* Project header row */}
      <div className="flex items-center hover:bg-[#1C1F24]/50">
        {/* Left: Project info */}
        <div className="w-64 flex-shrink-0 p-3 flex items-center gap-2 border-r border-[#2A2F36]">
          <button
            onClick={onToggle}
            className="text-[#6B7280] hover:text-[#F0F2F4] p-1"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <Icon size={16} className="text-blue-400" />
          <span className="text-[#F0F2F4] font-medium truncate">{project.name}</span>
          <StatusBadge status={project.bar.status} />
        </div>
        {/* Right: Timeline */}
        <div className="flex-1 relative h-10 px-2">
          <TimelineBar bar={project.bar} year={year} />
          {/* Milestones */}
          <div className="absolute inset-0">
            {project.milestones?.map((m, i) => (
              <MilestoneMarker key={i} milestone={m} year={year} />
            ))}
          </div>
        </div>
      </div>

      {/* Expanded children */}
      {isExpanded && (
        <div className="bg-[#15181C]">
          {/* Tests section */}
          {project.children?.tests?.length > 0 && (
            <ChildSection
              title="Tests"
              icon={TestTube2}
              items={project.children.tests}
              year={year}
            />
          )}
          {/* Fixtures section */}
          {project.children?.fixtures?.length > 0 && (
            <ChildSection
              title="Fixtures"
              icon={Wrench}
              items={project.children.fixtures}
              year={year}
            />
          )}
          {/* Studies section */}
          {project.children?.studies?.length > 0 && (
            <ChildSection
              title="Studies"
              icon={FlaskConical}
              items={project.children.studies}
              year={year}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Child section component (Tests, Fixtures, Studies)
const ChildSection = ({ title, icon: Icon, items, year }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border-t border-[#2A2F36]/50">
      {/* Section header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center cursor-pointer hover:bg-[#1C1F24]/30"
      >
        <div className="w-64 flex-shrink-0 p-2 pl-8 flex items-center gap-2 border-r border-[#2A2F36]/50">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Icon size={14} className="text-[#6B7280]" />
          <span className="text-sm text-[#6B7280]">{title} ({items.length})</span>
        </div>
        <div className="flex-1" />
      </div>

      {/* Child items */}
      {isExpanded && items.map((item) => (
        <ChildRow key={item.id} item={item} year={year} />
      ))}
    </div>
  );
};

// Child row component (individual test, fixture, study)
const ChildRow = ({ item, year }) => {
  const Icon = TYPE_ICONS[item.type] || Circle;

  return (
    <div className="flex items-center hover:bg-[#1C1F24]/30">
      <div className="w-64 flex-shrink-0 p-2 pl-12 border-r border-[#2A2F36]/50">
        <div className="flex items-center gap-2">
          <Icon size={12} className={STATUS_TEXT_COLORS[item.bar?.status] || 'text-[#6B7280]'} />
          <span className="text-sm text-[#B4BAC4] truncate" title={item.name}>{item.name}</span>
        </div>
        {item.parent && (
          <div className="text-xs text-[#6B7280] truncate pl-4" title={item.parent}>
            {item.parent}
          </div>
        )}
      </div>
      <div className="flex-1 relative h-8 px-2">
        <TimelineBar bar={item.bar} year={year} showPlanned={true} />
      </div>
    </div>
  );
};

// Month grid header
const MonthGridHeader = ({ year }) => {
  return (
    <div className="flex items-center border-b border-[#2A2F36] bg-[#15181C] sticky top-0 z-20">
      <div className="w-64 flex-shrink-0 p-3 border-r border-[#2A2F36]">
        <span className="text-sm font-medium text-[#6B7280]">Project / Item</span>
      </div>
      <div className="flex-1 flex">
        {MONTHS.map((month, i) => (
          <div
            key={month}
            className="flex-1 text-center py-2 text-xs text-[#6B7280] border-r border-[#2A2F36]/30 last:border-r-0"
          >
            {month}
          </div>
        ))}
      </div>
    </div>
  );
};

// Legend component
const Legend = () => {
  return (
    <div className="flex items-center gap-6 text-xs text-[#6B7280]">
      <div className="flex items-center gap-2">
        <div className="w-4 h-2 bg-green-500 rounded-sm" />
        <span>Completed</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-2 bg-blue-500 rounded-sm" />
        <span>On Track</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-2 bg-yellow-500 rounded-sm" />
        <span>At Risk</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-2 bg-red-500 rounded-sm" />
        <span>Overdue</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-2 bg-gray-500/50 rounded-sm" />
        <span>Planned</span>
      </div>
      <div className="flex items-center gap-2">
        <Diamond size={12} className="text-blue-400 fill-current" />
        <span>Milestone</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-3 bg-red-500" />
        <span>Today</span>
      </div>
    </div>
  );
};

const TimelinePage = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(2025);
  const [expandedProjects, setExpandedProjects] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  // Get unique project names for filter
  const projectNames = useMemo(() => {
    return DEMO_TIMELINE_DATA.projects.map(p => p.name);
  }, []);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return DEMO_TIMELINE_DATA.projects.filter(p => {
      if (statusFilter !== 'all' && p.bar.status !== statusFilter) return false;
      if (projectFilter !== 'all' && p.name !== projectFilter) return false;
      return true;
    });
  }, [statusFilter, projectFilter]);

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    filteredProjects.forEach(p => { allExpanded[p.id] = true; });
    setExpandedProjects(allExpanded);
  };

  const collapseAll = () => {
    setExpandedProjects({});
  };

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F4] flex items-center gap-2">
              <Calendar className="text-blue-400" />
              Timeline
            </h1>
            <p className="text-[#6B7280] mt-1">
              Project progress derived from real system timestamps
            </p>
          </div>
        </div>

        {/* Section Summary */}
        <PageSummary icon={BarChart3} iconColor="text-blue-400" borderColor="border-blue-500/30" bgColor="bg-blue-500/5">
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Purpose:</strong> This section visualizes engineering reality over time, not task lists. It shows milestones, deadlines, and evidence-backed progress derived from actual system events rather than manual schedule entries.
          </p>
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Method:</strong> Timeline bars are automatically generated from experiment runs, design phase completions, test execution dates, and fixture ready dates. Status colors reflect actual progress against planned dates.
          </p>
          <p>
            <strong className="text-[#F0F2F4]">Outcome:</strong> Highlights blocked work and overdue validation by connecting schedule risk to actual engineering state. Leadership can see which projects have evidence gaps versus which are progressing with verified artifacts.
          </p>
        </PageSummary>

        {/* Derived Data Banner */}
        <div className="bg-blue-900/30 border border-blue-500/40 rounded-lg p-4 mb-6 flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-blue-300">Derived Timeline View</span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">Read Only</span>
            </div>
            <p className="text-sm text-[#9CA3AF]">
              This timeline is automatically generated from actual system events — experiment runs, design updates,
              quality cases, and SOP changes. Dates and milestones cannot be manually edited. To update the timeline,
              make changes in the source modules (DOE, Design, Quality, SOPs).
            </p>
          </div>
          <button className="flex-shrink-0 text-blue-400 hover:text-blue-300 p-1" title="Learn more about derived data">
            <Info size={16} />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[#6B7280]" />
                <span className="text-sm text-[#6B7280]">Filters:</span>
              </div>

              {/* Year selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="overdue">Overdue</option>
              </select>

              {/* Project filter */}
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-[#15181C] border border-[#2A2F36] rounded-lg px-3 py-2 text-sm text-[#F0F2F4] focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Projects</option>
                {projectNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Expand All
              </button>
              <span className="text-[#6B7280]">|</span>
              <button
                onClick={collapseAll}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-[#2A2F36]">
            <Legend />
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg overflow-hidden">
          {/* Month header */}
          <MonthGridHeader year={selectedYear} />

          {/* Timeline content with today marker */}
          <div className="relative">
            {/* Today marker spanning all rows */}
            <div className="absolute left-64 right-0 top-0 bottom-0 pointer-events-none">
              <TodayMarker year={selectedYear} />
            </div>

            {/* Project rows */}
            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center text-[#6B7280]">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p>No projects match the current filters.</p>
              </div>
            ) : (
              filteredProjects.map(project => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  year={selectedYear}
                  isExpanded={expandedProjects[project.id]}
                  onToggle={() => toggleProject(project.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-6 bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#B4BAC4]">
              <p className="font-medium text-[#F0F2F4] mb-1">Timeline is derived from real system data</p>
              <p>
                This timeline reflects actual progress based on project creation dates, phase completions,
                test execution dates, fixture ready dates, and study completion timestamps. Bars are not
                manually entered tasks - they represent real engineering work captured in the system.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TimelinePage;
