import React from 'react';
import {
  ClipboardList,
  Search,
  Pencil,
  Wrench,
  Factory,
  Database,
  Calculator,
  FlaskConical,
  GitCompare,
  CheckCircle,
  Circle,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { DESIGN_PHASES, getPhaseKey } from '../../config/designPhases';

const PHASE_ICONS = {
  ClipboardList,
  Search,
  Pencil,
  Wrench,
  Factory,
  Database,
  Calculator,
  FlaskConical,
  GitCompare
};

const STATUS_STYLES = {
  completed: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    icon: CheckCircle
  },
  in_progress: {
    bg: 'bg-blue-500',
    border: 'border-blue-500',
    text: 'text-blue-400',
    icon: Circle
  },
  blocked: {
    bg: 'bg-red-500',
    border: 'border-red-500',
    text: 'text-red-400',
    icon: AlertTriangle
  },
  locked: {
    bg: 'bg-slate-600',
    border: 'border-slate-600',
    text: 'text-[#6B7280]',
    icon: Lock
  },
  pending: {
    bg: 'bg-slate-700',
    border: 'border-slate-700',
    text: 'text-[#6B7280]',
    icon: Circle
  }
};

function PhaseNode({ phase, phaseState, isActive, onClick, isSubPhase }) {
  const Icon = PHASE_ICONS[phase.icon] || Circle;
  const status = phaseState?.status || 'pending';
  const styles = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const StatusIcon = styles.icon;

  return (
    <button
      onClick={() => onClick(phase)}
      className={`relative flex items-center gap-3 p-3 rounded-lg transition-all w-full text-left ${
        isActive
          ? 'bg-blue-500/15 border border-blue-500/40'
          : 'hover:bg-[#22262C] border border-transparent'
      } ${isSubPhase ? 'ml-6' : ''}`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          status === 'completed' ? 'bg-emerald-500/20' :
          status === 'in_progress' ? 'bg-blue-500/20' :
          status === 'blocked' ? 'bg-red-500/20' :
          'bg-slate-700/50'
        }`}
      >
        <Icon className={`w-5 h-5 ${styles.text}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#6B7280]">
            {phase.number}{phase.subPhase || ''}
          </span>
          <span className={`text-sm font-medium ${isActive ? 'text-[#F0F2F4]' : 'text-[#B4BAC4]'}`}>
            {phase.shortName}
          </span>
        </div>
        <p className="text-xs text-[#6B7280] truncate">{phase.name}</p>
      </div>

      <div className="flex items-center gap-2">
        {phaseState?.hasGateBlock && (
          <AlertTriangle className="w-4 h-4 text-amber-400" title="Gate approval needed" />
        )}
        <StatusIcon className={`w-4 h-4 ${styles.text}`} />
      </div>
    </button>
  );
}

function PhaseNavigator({
  phases = [],
  activePhase,
  onPhaseSelect,
  compact = false,
  showProgress = true
}) {
  // Group phases by number for sub-phase handling
  const phaseGroups = DESIGN_PHASES.reduce((acc, phase) => {
    const key = phase.number;
    if (!acc[key]) acc[key] = [];
    acc[key].push(phase);
    return acc;
  }, {});

  // Get phase state by number and subphase
  const getPhaseState = (number, subPhase) => {
    return phases.find(p => p.number === number && p.subPhase === subPhase);
  };

  // Calculate progress
  const completedCount = phases.filter(p => p.status === 'completed').length;
  const totalCount = DESIGN_PHASES.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {Object.entries(phaseGroups).map(([number, groupPhases]) => {
          const num = parseInt(number);
          const hasSubPhases = groupPhases.length > 1;

          if (hasSubPhases) {
            return (
              <div key={num} className="flex items-center">
                {groupPhases.map((phase) => {
                  const state = getPhaseState(phase.number, phase.subPhase);
                  const isActive = activePhase?.number === phase.number &&
                                  activePhase?.subPhase === phase.subPhase;
                  const styles = STATUS_STYLES[state?.status || 'pending'];

                  return (
                    <button
                      key={getPhaseKey(phase.number, phase.subPhase)}
                      onClick={() => onPhaseSelect(phase)}
                      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-mono transition-all ${
                        isActive ? 'ring-2 ring-blue-400' : ''
                      } ${styles.bg}/30 ${styles.text}`}
                      title={phase.name}
                    >
                      {phase.number}{phase.subPhase}
                    </button>
                  );
                })}
                <div className="w-4 h-0.5 bg-slate-700" />
              </div>
            );
          }

          const phase = groupPhases[0];
          const state = getPhaseState(phase.number, phase.subPhase);
          const isActive = activePhase?.number === phase.number &&
                          activePhase?.subPhase === phase.subPhase;
          const styles = STATUS_STYLES[state?.status || 'pending'];

          return (
            <React.Fragment key={num}>
              <button
                onClick={() => onPhaseSelect(phase)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive ? 'ring-2 ring-blue-400' : ''
                } ${styles.bg}/30 ${styles.text}`}
                title={phase.name}
              >
                {phase.number}
              </button>
              {num < 7 && <div className="w-4 h-0.5 bg-slate-700" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-4">
      {showProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#6B7280]">Phase Progress</span>
            <span className="text-sm text-[#B4BAC4]">
              {completedCount}/{totalCount} completed
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        {Object.entries(phaseGroups).map(([number, groupPhases]) => {
          const num = parseInt(number);
          const hasSubPhases = groupPhases.length > 1;

          return (
            <div key={num}>
              {groupPhases.map((phase, idx) => {
                const state = getPhaseState(phase.number, phase.subPhase);
                const isActive = activePhase?.number === phase.number &&
                                activePhase?.subPhase === phase.subPhase;

                return (
                  <PhaseNode
                    key={getPhaseKey(phase.number, phase.subPhase)}
                    phase={phase}
                    phaseState={state}
                    isActive={isActive}
                    onClick={onPhaseSelect}
                    isSubPhase={hasSubPhases && idx > 0}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PhaseNavigator;
