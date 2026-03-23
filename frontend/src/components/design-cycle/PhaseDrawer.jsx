import React, { useState } from 'react';
import {
  X, ChevronLeft, ChevronRight, Check, Circle, Clock,
  ClipboardCheck, FileText, AlertTriangle, Lightbulb,
  Link2, FlaskConical, Wrench, Factory, Save
} from 'lucide-react';
import { DESIGN_PHASES, getPhaseKey } from '../../config/designPhases';

// =============================================================================
// STATUS ICON HELPER
// =============================================================================

function getStatusIcon(status) {
  switch (status) {
    case 'yes':
    case 'completed':
      return <Check className="w-5 h-5 text-emerald-400" />;
    case 'no':
    case 'failed':
      return <X className="w-5 h-5 text-red-400" />;
    case 'in_progress':
      return <Clock className="w-5 h-5 text-amber-400" />;
    default:
      return <Circle className="w-5 h-5 text-slate-500" />;
  }
}

// =============================================================================
// PHASE LIST ITEM
// =============================================================================

function PhaseListItem({ phase, isActive, isCompleted, onClick }) {
  const phaseKey = getPhaseKey(phase.number, phase.subPhase);

  return (
    <button
      onClick={() => onClick(phase)}
      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : isCompleted
            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            : 'bg-[#1C1F24] text-[#B4BAC4] hover:bg-[#22262C]'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-xs font-mono ${isActive ? 'text-blue-200' : 'text-[#6B7280]'}`}>
          {phaseKey}
        </span>
        <span className="text-sm font-medium truncate">{phase.shortName || phase.name}</span>
        {isCompleted && !isActive && (
          <Check className="w-3 h-3 text-emerald-400 ml-auto" />
        )}
      </div>
    </button>
  );
}

// =============================================================================
// GUIDED QUESTIONS SECTION
// =============================================================================

function GuidedQuestionsSection({ answers, onAnswerChange, onNotesChange }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[#F0F2F4] flex items-center gap-2">
        <ClipboardCheck className="w-4 h-4 text-blue-400" />
        Guided Questions
      </h3>
      <div className="space-y-3">
        {answers?.map((answer, idx) => (
          <div key={idx} className="bg-[#0F1114] rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">{getStatusIcon(answer.status)}</div>
              <div className="flex-1">
                <p className="text-sm text-[#F0F2F4] mb-2">
                  {answer.question}
                  {answer.required && <span className="text-red-400 ml-1">*</span>}
                </p>
                <div className="flex gap-1.5 mb-2">
                  {['yes', 'no', 'in_progress'].map(status => (
                    <button
                      key={status}
                      onClick={() => onAnswerChange(idx, status)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        answer.status === status
                          ? status === 'yes'
                            ? 'bg-emerald-500 text-white'
                            : status === 'no'
                              ? 'bg-red-500 text-white'
                              : 'bg-amber-500 text-white'
                          : 'bg-[#1C1F24] text-[#B4BAC4] hover:bg-[#22262C]'
                      }`}
                    >
                      {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Add notes..."
                  value={answer.notes || ''}
                  onChange={(e) => onNotesChange(idx, e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#1C1F24] border border-[#2A2F36] rounded text-xs text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500 resize-none"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// AI SUGGESTIONS SECTION
// =============================================================================

function AISuggestionsSection({ suggestions, onNavigate }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#F0F2F4] flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        AI Suggestions
      </h3>
      <div className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 p-2 rounded-lg text-xs ${
              suggestion.type === 'integration'
                ? 'bg-blue-500/10 border border-blue-500/30'
                : 'bg-amber-500/10 border border-amber-500/30'
            }`}
          >
            {suggestion.type === 'integration' ? (
              <Link2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-[#F0F2F4]">{suggestion.text}</p>
              {suggestion.tool && (
                <button
                  onClick={() => onNavigate?.(suggestion.tool)}
                  className="mt-1 text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <FlaskConical className="w-3 h-3" />
                  Open {suggestion.tool.toUpperCase()}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// PHASE NOTES SECTION
// =============================================================================

function PhaseNotesSection({ notes, onChange }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[#F0F2F4] flex items-center gap-2">
        <FileText className="w-4 h-4 text-blue-400" />
        Phase Notes
      </h3>
      <textarea
        placeholder="Add general notes for this phase..."
        value={notes || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-[#0F1114] border border-[#2A2F36] rounded-lg text-sm text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500 resize-none"
        rows={3}
      />
    </div>
  );
}

// =============================================================================
// MAIN PHASE DRAWER COMPONENT
// =============================================================================

function PhaseDrawer({
  isOpen,
  onClose,
  activePhase,
  allPhases,
  currentPhaseData,
  suggestions,
  onPhaseSelect,
  onAnswerChange,
  onNotesChange,
  onPhaseNotesChange,
  onSave,
  onNavigate,
  saving
}) {
  if (!isOpen) return null;

  const phaseKey = getPhaseKey(activePhase.number, activePhase.subPhase);

  // Get phase completion status
  const getPhaseStatus = (phase) => {
    const data = allPhases?.find(p =>
      p.number === phase.number && p.subPhase === phase.subPhase
    );
    return data?.status || 'pending';
  };

  // Navigate to previous phase
  const goToPreviousPhase = () => {
    const currentIdx = DESIGN_PHASES.findIndex(p =>
      p.number === activePhase.number && p.subPhase === activePhase.subPhase
    );
    if (currentIdx > 0) {
      onPhaseSelect(DESIGN_PHASES[currentIdx - 1]);
    }
  };

  // Navigate to next phase
  const goToNextPhase = () => {
    const currentIdx = DESIGN_PHASES.findIndex(p =>
      p.number === activePhase.number && p.subPhase === activePhase.subPhase
    );
    if (currentIdx < DESIGN_PHASES.length - 1) {
      onPhaseSelect(DESIGN_PHASES[currentIdx + 1]);
    }
  };

  const currentPhaseIdx = DESIGN_PHASES.findIndex(p =>
    p.number === activePhase.number && p.subPhase === activePhase.subPhase
  );
  const hasPrevious = currentPhaseIdx > 0;
  const hasNext = currentPhaseIdx < DESIGN_PHASES.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#15181C] border-l border-[#2A2F36] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2F36]">
          <div>
            <h2 className="text-lg font-semibold text-[#F0F2F4]">
              Phase {phaseKey}: {activePhase.name}
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">{activePhase.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1C1F24] text-[#6B7280] hover:text-[#F0F2F4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-4 py-2 border-b border-[#2A2F36] bg-[#0F1114]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#6B7280]">Phase Progress</span>
            <span className="text-sm font-medium text-blue-400">{currentPhaseData?.progress || 0}%</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${currentPhaseData?.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-5 gap-0">
            {/* Phase List (left sidebar within drawer) */}
            <div className="col-span-2 border-r border-[#2A2F36] p-3 bg-[#0F1114]">
              <h3 className="text-xs font-medium text-[#6B7280] mb-2 uppercase">Phases</h3>
              <div className="space-y-1">
                {DESIGN_PHASES.map((phase) => (
                  <PhaseListItem
                    key={getPhaseKey(phase.number, phase.subPhase)}
                    phase={phase}
                    isActive={
                      phase.number === activePhase.number &&
                      phase.subPhase === activePhase.subPhase
                    }
                    isCompleted={getPhaseStatus(phase) === 'completed'}
                    onClick={onPhaseSelect}
                  />
                ))}
              </div>
            </div>

            {/* Phase Content (right side within drawer) */}
            <div className="col-span-3 p-4 space-y-6">
              {/* Guided Questions */}
              <GuidedQuestionsSection
                answers={currentPhaseData?.answers}
                onAnswerChange={onAnswerChange}
                onNotesChange={onNotesChange}
              />

              {/* Phase Notes */}
              <PhaseNotesSection
                notes={currentPhaseData?.notes}
                onChange={onPhaseNotesChange}
              />

              {/* AI Suggestions */}
              <AISuggestionsSection
                suggestions={suggestions}
                onNavigate={onNavigate}
              />

              {/* Phase-specific panels */}
              {activePhase.subPhase === 'b' && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">Serviceability Review</span>
                  </div>
                  <p className="text-xs text-[#B4BAC4]">
                    Complete serviceability analysis in the main workbench panel.
                  </p>
                </div>
              )}

              {activePhase.subPhase === 'c' && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Factory className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Manufacturability Review</span>
                  </div>
                  <p className="text-xs text-[#B4BAC4]">
                    Complete DFM analysis in the main workbench panel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with navigation */}
        <div className="border-t border-[#2A2F36] px-4 py-3 flex items-center justify-between bg-[#0F1114]">
          <button
            onClick={goToPreviousPhase}
            disabled={!hasPrevious}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              hasPrevious
                ? 'bg-[#1C1F24] text-[#B4BAC4] hover:bg-[#22262C]'
                : 'bg-[#1C1F24]/50 text-[#6B7280] cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              saving
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Progress'}
          </button>

          <button
            onClick={goToNextPhase}
            disabled={!hasNext}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              hasNext
                ? 'bg-[#1C1F24] text-[#B4BAC4] hover:bg-[#22262C]'
                : 'bg-[#1C1F24]/50 text-[#6B7280] cursor-not-allowed'
            }`}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export default PhaseDrawer;
