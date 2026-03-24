import React, { useState } from 'react';
import {
  TrendingUp,
  Shield,
  Link2,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  XCircle,
  BarChart3
} from 'lucide-react';

function MetricCard({ title, icon: Icon, value, label, status, children, expandable = false }) {
  const [expanded, setExpanded] = useState(false);

  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
    neutral: 'text-gray-400'
  };

  return (
    <div className="bg-gray-800/30 rounded-lg border border-gray-700">
      <div
        className={`p-4 ${expandable ? 'cursor-pointer hover:bg-gray-700/20' : ''}`}
        onClick={() => expandable && setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${statusColors[status] || statusColors.neutral}`} />
            <span className="text-sm text-gray-400">{title}</span>
          </div>
          {expandable && (
            expanded
              ? <ChevronDown className="w-4 h-4 text-gray-500" />
              : <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
        <div className="mt-2">
          <span className={`text-2xl font-bold ${statusColors[status] || 'text-white'}`}>
            {value}
          </span>
          {label && (
            <span className="text-sm text-gray-500 ml-2">{label}</span>
          )}
        </div>
      </div>
      {expandable && expanded && children && (
        <div className="px-4 pb-4 border-t border-gray-700 mt-2 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

function WorstOffendersList({ offenders, type }) {
  if (!offenders || offenders.length === 0) {
    return (
      <p className="text-sm text-gray-500">No blocking issues found.</p>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-xs text-gray-400 uppercase">Blocking Issues</span>
      {offenders.map((offender, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <div>
              <span className="text-sm text-white">{offender.name}</span>
              <p className="text-xs text-gray-500">{offender.issue}</p>
            </div>
          </div>
          {type === 'score' && (
            <span className="text-sm text-red-400">{offender.score}%</span>
          )}
        </div>
      ))}
    </div>
  );
}

function TreeRollupMetrics({
  gateStatus = { status: 'pending', approved: 0, total: 4, blockers: [] },
  traceCoverage = { coverage: 0.85, required: 1.0, byNode: [] },
  aiScore = { rollup: 72, offenders: [] },
  phaseStatus = { complete: 5, total: 9, blocked: [] }
}) {
  // Determine gate status display
  const gateStatusDisplay = {
    approved: { label: 'All Approved', icon: CheckCircle, status: 'good' },
    pending: { label: 'Pending', icon: Clock, status: 'warning' },
    blocked: { label: 'Blocked', icon: XCircle, status: 'danger' }
  };
  const currentGateStatus = gateStatusDisplay[gateStatus.status] || gateStatusDisplay.pending;

  // Determine coverage status
  const coveragePercent = Math.round(traceCoverage.coverage * 100);
  const requiredPercent = Math.round(traceCoverage.required * 100);
  const coverageStatus = coveragePercent >= requiredPercent ? 'good' :
    coveragePercent >= requiredPercent * 0.8 ? 'warning' : 'danger';

  // Determine AI score status
  const scoreStatus = aiScore.rollup >= 80 ? 'good' :
    aiScore.rollup >= 60 ? 'warning' : 'danger';

  // Determine phase status
  const phasePercent = Math.round((phaseStatus.complete / phaseStatus.total) * 100);
  const phaseStatusType = phaseStatus.blocked?.length > 0 ? 'danger' :
    phasePercent === 100 ? 'good' : 'neutral';

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-white">Rollup Metrics</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Gate Status */}
        <MetricCard
          title="Gate Status"
          icon={currentGateStatus.icon}
          value={currentGateStatus.label}
          label={`${gateStatus.approved}/${gateStatus.total} approved`}
          status={currentGateStatus.status}
          expandable={gateStatus.blockers?.length > 0}
        >
          <WorstOffendersList offenders={gateStatus.blockers} type="gate" />
        </MetricCard>

        {/* Trace Coverage */}
        <MetricCard
          title="Trace Coverage"
          icon={Link2}
          value={`${coveragePercent}%`}
          label={`of ${requiredPercent}% required`}
          status={coverageStatus}
          expandable={traceCoverage.byNode?.length > 0}
        >
          <div className="space-y-2">
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  coverageStatus === 'good' ? 'bg-green-500' :
                  coverageStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(coveragePercent, 100)}%` }}
              />
            </div>
            {traceCoverage.byNode?.slice(0, 3).map((node, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{node.name}</span>
                <span className={node.coverage >= traceCoverage.required ? 'text-green-400' : 'text-red-400'}>
                  {Math.round(node.coverage * 100)}%
                </span>
              </div>
            ))}
          </div>
        </MetricCard>

        {/* AI Score Rollup */}
        <MetricCard
          title="AI Score (Rollup)"
          icon={TrendingUp}
          value={`${aiScore.rollup}%`}
          label="weighted average"
          status={scoreStatus}
          expandable={aiScore.offenders?.length > 0}
        >
          <WorstOffendersList offenders={aiScore.offenders} type="score" />
        </MetricCard>

        {/* Phase Status */}
        <MetricCard
          title="Phase Completion"
          icon={CheckCircle}
          value={`${phaseStatus.complete}/${phaseStatus.total}`}
          label={`phases (${phasePercent}%)`}
          status={phaseStatusType}
          expandable={phaseStatus.blocked?.length > 0}
        >
          <div className="space-y-2">
            <span className="text-xs text-gray-400 uppercase">Blocked Phases</span>
            {phaseStatus.blocked?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-white">{item.phase}</span>
                <span className="text-gray-500">- {item.reason}</span>
              </div>
            ))}
          </div>
        </MetricCard>
      </div>

      {/* Summary Bar */}
      <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Overall Readiness</span>
          <div className="flex items-center gap-4">
            {gateStatus.status === 'blocked' && (
              <span className="flex items-center gap-1 text-red-400">
                <XCircle className="w-4 h-4" />
                Gates blocked
              </span>
            )}
            {coverageStatus === 'danger' && (
              <span className="flex items-center gap-1 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                Low coverage
              </span>
            )}
            {gateStatus.status !== 'blocked' && coverageStatus !== 'danger' && (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-4 h-4" />
                On track
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TreeRollupMetrics;
