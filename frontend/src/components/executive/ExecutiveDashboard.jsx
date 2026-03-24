import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Clock, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, Calendar, FileText, Wrench, Shield, BarChart3,
  Target, Activity, Maximize2, Minimize2, Users, Package,
  AlertCircle, ChevronRight, Zap, Eye
} from 'lucide-react';
import PageSummary from '../ui/PageSummary';
import { useAuth } from '../../context/AuthContext';
import Header from '../../Header';
import {
  DEMO_EXECUTIVE_DASHBOARD,
  DEMO_VIOLATED_ASSUMPTIONS,
  DEMO_8D_CASES,
  DEMO_SOP_REQUESTS,
  hasExecutiveDashboardAccess,
  PLAN_TIERS,
  USER_ROLES
} from '../../data/demoProjects';

// =============================================================================
// EXECUTIVE DASHBOARD (CORPORATE ONLY)
// =============================================================================

const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const { currentOrg, user, isAuthenticated } = useAuth();
  const [isWallMode, setIsWallMode] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      handleRefresh();
    }, 60000);

    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }, 500);
  };

  // Check access - for demo, we'll show it for the Enterprise org
  const userRole = USER_ROLES.CORPORATE_ADMIN; // Demo: assume corporate admin
  const canAccess = currentOrg?.tier === PLAN_TIERS.ENTERPRISE ||
                    currentOrg?.tier === 'enterprise' ||
                    currentOrg?.id === 'org-megacorp-enterprise';

  // If no access, show access denied
  if (!canAccess) {
    return (
      <div className="min-h-screen bg-[#0A0C0F]">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#F0F2F4] mb-2">Executive Dashboard</h2>
            <p className="text-[#6B7280] mb-6">
              This feature is available for Corporate and Enterprise plans only.
            </p>
            <div className="bg-[#15181C] border border-[#2A2F36] rounded-lg p-4 mb-6">
              <p className="text-sm text-[#9CA3AF]">
                Current Organization: <span className="text-[#F0F2F4]">{currentOrg?.name || 'None'}</span>
              </p>
              <p className="text-sm text-[#9CA3AF] mt-1">
                Plan: <span className="text-[#F0F2F4] capitalize">{currentOrg?.tier || 'Free'}</span>
              </p>
            </div>
            <p className="text-sm text-[#6B7280]">
              Switch to <span className="text-amber-400">MegaCorp Engineering</span> (Enterprise)
              using the organization switcher to view the demo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const data = DEMO_EXECUTIVE_DASHBOARD;
  const widgets = data.widgets;

  // Format time ago
  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  // Widget Card component
  const WidgetCard = ({ title, icon: Icon, children, className = '', alert = false }) => (
    <div className={`bg-[#15181C] border ${alert ? 'border-red-500/50' : 'border-[#2A2F36]'} rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${alert ? 'text-red-400' : 'text-blue-400'}`} />
        <h3 className={`font-semibold ${isWallMode ? 'text-lg' : 'text-sm'} ${alert ? 'text-red-400' : 'text-[#F0F2F4]'}`}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );

  // KPI Stat component
  const KPIStat = ({ label, value, trend, alert = false, onClick }) => (
    <div
      className={`${onClick ? 'cursor-pointer hover:bg-[#1C1F24]' : ''} p-2 rounded-lg transition`}
      onClick={onClick}
    >
      <p className={`text-xs text-[#6B7280] ${isWallMode ? 'text-sm' : ''}`}>{label}</p>
      <p className={`font-bold ${isWallMode ? 'text-3xl' : 'text-xl'} ${alert ? 'text-red-400' : 'text-[#F0F2F4]'}`}>
        {value}
      </p>
      {trend && <p className="text-xs text-emerald-400">{trend}</p>}
    </div>
  );

  // Progress bar component
  const ProgressBar = ({ value, label, color = 'blue' }) => (
    <div className="flex items-center gap-3">
      <span className={`text-xs text-[#6B7280] w-8 ${isWallMode ? 'text-sm w-10' : ''}`}>{label}</span>
      <div className="flex-1 h-2 bg-[#2A2F36] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            value >= 80 ? 'bg-emerald-500' :
            value >= 50 ? 'bg-blue-500' :
            value >= 25 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs text-[#F0F2F4] w-10 text-right ${isWallMode ? 'text-sm w-12' : ''}`}>{value}%</span>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#0A0C0F] ${isWallMode ? '' : ''}`}>
      {!isWallMode && <Header />}

      <div className={`${isWallMode ? 'p-6' : 'pt-20 p-6'} max-w-[1800px] mx-auto`}>
        {/* Top Bar */}
        <div className={`flex items-center justify-between mb-6 ${isWallMode ? 'mb-8' : ''}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className={`${isWallMode ? 'w-8 h-8' : 'w-6 h-6'} text-amber-400`} />
              <h1 className={`font-bold text-[#F0F2F4] ${isWallMode ? 'text-3xl' : 'text-xl'}`}>
                {data.org.name}
              </h1>
              <span className="px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                ENTERPRISE
              </span>
            </div>

            {data.scrappy_mode_active && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className={`text-amber-400 ${isWallMode ? 'text-base' : 'text-sm'}`}>
                  SCRAPPY MODE: {data.scrappy_mode_projects.length} project
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Current Time */}
            <div className={`text-[#6B7280] ${isWallMode ? 'text-xl' : 'text-sm'}`}>
              <Clock className="w-4 h-4 inline mr-1" />
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              {' '}
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Refresh Status */}
            <div className="flex items-center gap-2 text-[#6B7280]">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 hover:bg-[#1C1F24] rounded-lg transition"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <span className={`${isWallMode ? 'text-base' : 'text-xs'}`}>
                {formatTimeAgo(lastRefreshed)}
              </span>
            </div>

            {/* Time Range Filter */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg px-3 py-1.5 text-sm text-[#F0F2F4]"
            >
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
              <option value="ytd">Year to Date</option>
            </select>

            {/* Wall Display Toggle */}
            <button
              onClick={() => setIsWallMode(!isWallMode)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-sm text-[#B4BAC4] hover:text-[#F0F2F4] transition"
            >
              {isWallMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isWallMode ? 'Exit Wall Mode' : 'Wall Display'}
            </button>
          </div>
        </div>

        {/* Section Summary */}
        {!isWallMode && (
          <PageSummary icon={Eye} iconColor="text-amber-400" borderColor="border-amber-500/30" bgColor="bg-amber-500/5">
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Purpose:</strong> This section provides high-level visibility into engineering health across the organization. It aggregates KPIs from all system modules into a unified view for leadership and program oversight.
            </p>
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Method:</strong> Widgets pull real-time data from Design (7-phase completion), DOE (study status), Testing (pass/fail rates), Quality (8D case counts), and SOPs (compliance metrics). Auto-refresh ensures current state visibility.
            </p>
            <p>
              <strong className="text-[#F0F2F4]">Outcome:</strong> Surfaces risks, overdue validation, and blocked milestones without requiring drill-down into individual projects. Intended for leadership decisions and program oversight, not daily execution tasks.
            </p>
          </PageSummary>
        )}

        {/* Risk Banner */}
        {widgets.risk_assumptions.engineering_risk_present && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className={`${isWallMode ? 'w-8 h-8' : 'w-6 h-6'} text-red-400`} />
            <div>
              <p className={`font-semibold text-red-400 ${isWallMode ? 'text-xl' : 'text-base'}`}>
                ENGINEERING RISK PRESENT
              </p>
              <p className={`text-red-300/80 ${isWallMode ? 'text-base' : 'text-sm'}`}>
                {widgets.risk_assumptions.violated_assumptions} violated assumptions require immediate attention
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400 ml-auto" />
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className={`grid gap-4 ${isWallMode ? 'grid-cols-3 gap-6' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>

          {/* B) Delivery Health */}
          <WidgetCard title="Delivery Health" icon={Target}>
            <div className="grid grid-cols-2 gap-2">
              <KPIStat label="Active Projects" value={widgets.delivery_health.active_projects} />
              <KPIStat label="Due 30 Days" value={widgets.delivery_health.due_30_days} />
              <KPIStat label="Due 60 Days" value={widgets.delivery_health.due_60_days} />
              <KPIStat label="Due 90 Days" value={widgets.delivery_health.due_90_days} />
            </div>
            <div className="mt-3 pt-3 border-t border-[#2A2F36]">
              <KPIStat
                label="OVERDUE PROJECTS"
                value={widgets.delivery_health.overdue_projects}
                alert={widgets.delivery_health.overdue_projects > 0}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-[#2A2F36]">
              <p className="text-xs text-[#6B7280]">Nearest Deadline</p>
              <p className={`text-[#F0F2F4] font-medium ${isWallMode ? 'text-lg' : 'text-sm'}`}>
                {widgets.delivery_health.nearest_deadline.project_name}
              </p>
              <p className="text-xs text-blue-400">
                {widgets.delivery_health.nearest_deadline.due_date} ({widgets.delivery_health.nearest_deadline.days_remaining} days)
              </p>
            </div>
          </WidgetCard>

          {/* C) Engineering Rigor */}
          <WidgetCard title="Engineering Rigor (7-Phase)" icon={Activity} className="row-span-2">
            <div className="space-y-2 mb-4">
              {Object.entries(widgets.engineering_rigor.phase_completion).map(([phase, value]) => (
                <ProgressBar
                  key={phase}
                  label={phase.replace('phase_', 'P')}
                  value={value}
                />
              ))}
            </div>
            <div className="pt-3 border-t border-[#2A2F36]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6B7280]">Blocked Releases</span>
                <span className={`font-bold ${isWallMode ? 'text-xl' : 'text-lg'} ${widgets.engineering_rigor.blocked_releases.total > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {widgets.engineering_rigor.blocked_releases.total}
                </span>
              </div>
              {widgets.engineering_rigor.blocked_releases.total > 0 && (
                <div className="space-y-1">
                  {Object.entries(widgets.engineering_rigor.blocked_releases.reasons).map(([reason, count]) => (
                    count > 0 && (
                      <div key={reason} className="flex items-center justify-between text-xs">
                        <span className="text-[#6B7280] capitalize">{reason.replace(/_/g, ' ')}</span>
                        <span className="text-red-400">{count}</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </WidgetCard>

          {/* D) Risk & Assumptions */}
          <WidgetCard
            title="Risk & Assumptions"
            icon={AlertTriangle}
            alert={widgets.risk_assumptions.violated_assumptions > 0}
          >
            <div className="grid grid-cols-2 gap-2">
              <KPIStat
                label="Violated"
                value={widgets.risk_assumptions.violated_assumptions}
                alert={widgets.risk_assumptions.violated_assumptions > 0}
              />
              <KPIStat
                label="High-Risk Unvalidated"
                value={widgets.risk_assumptions.high_risk_unvalidated}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-[#2A2F36]">
              <p className="text-xs text-[#6B7280] mb-2">Top Risks</p>
              <div className="space-y-2">
                {widgets.risk_assumptions.top_risks.slice(0, 3).map((risk, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`w-2 h-2 rounded-full ${
                      risk.severity === 'critical' ? 'bg-red-500' :
                      risk.severity === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <span className="text-[#B4BAC4] truncate flex-1">{risk.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </WidgetCard>

          {/* E) DOE / Studies */}
          <WidgetCard title="DOE / Studies" icon={BarChart3}>
            <div className="grid grid-cols-2 gap-2">
              <KPIStat label="Active Studies" value={widgets.doe_studies.active_studies} />
              <KPIStat label="Completed (Month)" value={widgets.doe_studies.completed_this_month} />
            </div>
            {widgets.doe_studies.needs_revalidation > 0 && (
              <div className="mt-3 pt-3 border-t border-[#2A2F36]">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{widgets.doe_studies.needs_revalidation} need revalidation</span>
                </div>
              </div>
            )}
          </WidgetCard>

          {/* F) Testing & Validation */}
          <WidgetCard title="Testing & Validation" icon={CheckCircle}>
            <div className="space-y-2">
              <KPIStat label="Tests Executed (Week)" value={widgets.testing.tests_executed_week} />
              <KPIStat
                label="Open Failed Tests"
                value={widgets.testing.open_failed_tests}
                alert={widgets.testing.open_failed_tests > 0}
              />
              <KPIStat label="Regression Tests Due" value={widgets.testing.regression_tests_due} />
            </div>
          </WidgetCard>

          {/* G) SOP Compliance */}
          <WidgetCard
            title="SOP Compliance"
            icon={FileText}
            alert={widgets.sop_compliance.overdue > 0}
          >
            <div className="grid grid-cols-2 gap-2">
              <KPIStat label="Due in 7 Days" value={widgets.sop_compliance.due_7_days} />
              <KPIStat
                label="OVERDUE"
                value={widgets.sop_compliance.overdue}
                alert={widgets.sop_compliance.overdue > 0}
              />
            </div>
            <div className="mt-3 pt-3 border-t border-[#2A2F36]">
              <p className="text-xs text-[#6B7280] mb-2">Last Maintenance</p>
              <div className="space-y-1">
                {widgets.sop_compliance.last_maintenance.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-[#B4BAC4]">{item.asset}</span>
                    <span className="text-[#6B7280]">
                      {new Date(item.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </WidgetCard>

          {/* H) 8D Quality */}
          <WidgetCard
            title="8D Quality"
            icon={Shield}
            alert={widgets.quality_8d.open_by_severity.critical > 0}
          >
            <div className="mb-3">
              <p className="text-xs text-[#6B7280] mb-2">Open by Severity</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className={`font-bold ${widgets.quality_8d.open_by_severity.critical > 0 ? 'text-red-400' : 'text-[#F0F2F4]'}`}>
                    {widgets.quality_8d.open_by_severity.critical}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-[#F0F2F4] font-bold">{widgets.quality_8d.open_by_severity.high}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-[#F0F2F4] font-bold">{widgets.quality_8d.open_by_severity.medium}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-[#F0F2F4] font-bold">{widgets.quality_8d.open_by_severity.low}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#2A2F36]">
              <KPIStat label="Opened This Week" value={widgets.quality_8d.opened_this_week} />
              <KPIStat label="Aging (>30d)" value={widgets.quality_8d.aging_over_30_days} />
            </div>
            {widgets.quality_8d.linked_to_violations > 0 && (
              <div className="mt-2 text-xs text-red-400">
                {widgets.quality_8d.linked_to_violations} linked to violated assumptions
              </div>
            )}
          </WidgetCard>

          {/* I) Artifact Throughput */}
          <WidgetCard title="Artifact Throughput" icon={Package}>
            <div className="space-y-2">
              <KPIStat label="CAD Uploads (Week)" value={widgets.artifact_throughput.cad_uploads_week} />
              <KPIStat label="Fixtures Created (Month)" value={widgets.artifact_throughput.fixtures_created_month} />
              <KPIStat label="Part Numbers Issued" value={widgets.artifact_throughput.part_numbers_issued_week} />
            </div>
          </WidgetCard>

        </div>

        {/* Violated Assumptions Detail */}
        {DEMO_VIOLATED_ASSUMPTIONS.length > 0 && (
          <div className="mt-6">
            <h3 className={`font-semibold text-red-400 mb-3 ${isWallMode ? 'text-xl' : 'text-base'}`}>
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              Violated Assumptions Requiring Action
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {DEMO_VIOLATED_ASSUMPTIONS.map((assumption) => (
                <div
                  key={assumption.id}
                  className="bg-red-500/5 border border-red-500/30 rounded-lg p-4 hover:bg-red-500/10 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-medium text-[#F0F2F4] ${isWallMode ? 'text-lg' : 'text-sm'}`}>
                        {assumption.title}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-1">
                        {assumption.project_name} / {assumption.node_name}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      assumption.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {assumption.severity}
                    </span>
                  </div>
                  <p className="text-xs text-red-300/80 mt-2">{assumption.violation_reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open Critical 8Ds */}
        {DEMO_8D_CASES.filter(c => c.severity === 'critical').length > 0 && (
          <div className="mt-6">
            <h3 className={`font-semibold text-red-400 mb-3 ${isWallMode ? 'text-xl' : 'text-base'}`}>
              <XCircle className="w-5 h-5 inline mr-2" />
              Critical 8D Cases
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {DEMO_8D_CASES.filter(c => c.severity === 'critical').map((case8d) => (
                <div
                  key={case8d.id}
                  className="bg-[#15181C] border border-red-500/30 rounded-lg p-4 hover:border-red-500/50 transition cursor-pointer"
                  onClick={() => navigate(`/quality/${case8d.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#6B7280]">{case8d.case_number}</span>
                    <span className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded">
                      {case8d.current_discipline}
                    </span>
                  </div>
                  <p className={`font-medium text-[#F0F2F4] ${isWallMode ? 'text-base' : 'text-sm'}`}>
                    {case8d.title}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {case8d.project_name} • Owner: {case8d.owner}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
