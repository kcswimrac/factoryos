import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList, FlaskConical, PenTool, Database, Calculator,
  TestTube2, GitMerge, ChevronRight, Info
} from 'lucide-react';
import {
  DESIGN_PHASES,
  getPhaseById,
  getPhaseColorClasses,
  getPhaseStatusConfig,
  PHASE_STATUS
} from '../../config/designPhasesExplainerConfig';
import PhaseDetailPanel from './PhaseDetailPanel';

const ICON_MAP = {
  ClipboardList,
  FlaskConical,
  PenTool,
  Database,
  Calculator,
  TestTube2,
  GitMerge
};

/**
 * DesignPhaseTimelineExplainer - Horizontal timeline visualizing the 7-Phase Engineering Design Cycle
 *
 * This component is the authoritative definition of how engineering work is expected to be performed,
 * reviewed, and judged. It is normative, not advisory.
 *
 * Props:
 * - phaseStatus: Object mapping phase numbers to status ('not_started', 'in_progress', 'blocked', 'complete')
 * - onPhaseClick: Optional callback when a phase is clicked
 * - showStatus: Whether to show status indicators (default: true)
 * - compact: Use compact layout (default: false)
 */
function DesignPhaseTimelineExplainer({
  phaseStatus = {},
  onPhaseClick,
  showStatus = true,
  compact = false
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPhase, setSelectedPhase] = useState(null);

  // Handle deep linking via URL query param
  useEffect(() => {
    const phaseParam = searchParams.get('phase');
    if (phaseParam) {
      const phaseNum = parseInt(phaseParam, 10);
      if (phaseNum >= 1 && phaseNum <= 7) {
        setSelectedPhase(getPhaseById(phaseNum));
      }
    }
  }, [searchParams]);

  const handlePhaseClick = (phase) => {
    setSelectedPhase(phase);
    setSearchParams({ phase: phase.number.toString() });
    onPhaseClick?.(phase);
  };

  const handleClosePanel = () => {
    setSelectedPhase(null);
    searchParams.delete('phase');
    setSearchParams(searchParams);
  };

  const handlePreviousPhase = () => {
    if (selectedPhase && selectedPhase.number > 1) {
      const prevPhase = getPhaseById(selectedPhase.number - 1);
      setSelectedPhase(prevPhase);
      setSearchParams({ phase: prevPhase.number.toString() });
    }
  };

  const handleNextPhase = () => {
    if (selectedPhase && selectedPhase.number < 7) {
      const nextPhase = getPhaseById(selectedPhase.number + 1);
      setSelectedPhase(nextPhase);
      setSearchParams({ phase: nextPhase.number.toString() });
    }
  };

  const getStatusForPhase = (phaseNumber) => {
    return phaseStatus[phaseNumber] || PHASE_STATUS.NOT_STARTED;
  };

  return (
    <>
      <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#F0F2F4]">
                7-Phase Engineering Design Cycle
              </h3>
              <p className="text-sm text-[#6B7280]">
                Click any phase to view requirements, completion criteria, and common failure modes
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-[#2A2F36]" />

          {/* Phase Nodes */}
          <div className={`grid ${compact ? 'grid-cols-7 gap-2' : 'grid-cols-7 gap-4'}`}>
            {DESIGN_PHASES.map((phase) => {
              const colors = getPhaseColorClasses(phase);
              const status = getStatusForPhase(phase.number);
              const statusConfig = getPhaseStatusConfig(status);
              const PhaseIcon = ICON_MAP[phase.iconName] || ClipboardList;

              return (
                <button
                  key={phase.id}
                  onClick={() => handlePhaseClick(phase)}
                  className={`relative flex flex-col items-center group transition-all duration-200 ${
                    compact ? 'py-2' : 'py-4'
                  }`}
                >
                  {/* Phase Node */}
                  <div
                    className={`relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-200 group-hover:scale-110 ${
                      compact ? 'w-12 h-12' : 'w-16 h-16'
                    } ${
                      status === PHASE_STATUS.COMPLETE
                        ? 'bg-emerald-500/20 border-emerald-500'
                        : status === PHASE_STATUS.IN_PROGRESS
                        ? `${colors.bgLight} border-blue-500`
                        : status === PHASE_STATUS.BLOCKED
                        ? 'bg-red-500/20 border-red-500'
                        : `bg-[#1C1F24] border-[#2A2F36] group-hover:${colors.border}`
                    }`}
                  >
                    <PhaseIcon
                      className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} ${
                        status === PHASE_STATUS.COMPLETE
                          ? 'text-emerald-400'
                          : status === PHASE_STATUS.IN_PROGRESS
                          ? 'text-blue-400'
                          : status === PHASE_STATUS.BLOCKED
                          ? 'text-red-400'
                          : `text-[#6B7280] group-hover:${colors.text}`
                      }`}
                    />
                  </div>

                  {/* Phase Number Badge */}
                  <div
                    className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold z-20 ${
                      status === PHASE_STATUS.COMPLETE
                        ? 'bg-emerald-500 text-white'
                        : status === PHASE_STATUS.IN_PROGRESS
                        ? 'bg-blue-500 text-white'
                        : status === PHASE_STATUS.BLOCKED
                        ? 'bg-red-500 text-white'
                        : `${colors.bg} text-white`
                    }`}
                  >
                    {phase.number}
                  </div>

                  {/* Phase Title */}
                  <div className={`mt-3 text-center ${compact ? 'max-w-[80px]' : 'max-w-[100px]'}`}>
                    <span
                      className={`text-xs font-medium leading-tight block ${
                        status === PHASE_STATUS.COMPLETE
                          ? 'text-emerald-400'
                          : status === PHASE_STATUS.IN_PROGRESS
                          ? 'text-blue-400'
                          : status === PHASE_STATUS.BLOCKED
                          ? 'text-red-400'
                          : 'text-[#9CA3AF] group-hover:text-[#F0F2F4]'
                      }`}
                    >
                      {phase.shortName}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {showStatus && (
                    <div
                      className={`mt-2 px-2 py-0.5 rounded text-[10px] font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}
                    >
                      {statusConfig.label}
                    </div>
                  )}

                  {/* Click Indicator */}
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-[#2A2F36]">
          <p className="text-xs text-[#6B7280] text-center">
            <strong className="text-[#9CA3AF]">Engineering Rigor Requirement:</strong>{' '}
            Completing the full design cycle and then updating specifications for a second iteration
            is how design credibility is established. Each phase has mandatory completion criteria
            that must be satisfied before proceeding.
          </p>
        </div>
      </div>

      {/* Phase Detail Panel */}
      {selectedPhase && (
        <PhaseDetailPanel
          phase={selectedPhase}
          totalPhases={DESIGN_PHASES.length}
          onClose={handleClosePanel}
          onPrevious={handlePreviousPhase}
          onNext={handleNextPhase}
          canGoPrevious={selectedPhase.number > 1}
          canGoNext={selectedPhase.number < 7}
        />
      )}
    </>
  );
}

export default DesignPhaseTimelineExplainer;
