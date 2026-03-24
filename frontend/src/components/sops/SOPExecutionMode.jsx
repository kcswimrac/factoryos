import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle,
  Circle,
  Clock,
  Package,
  AlertTriangle,
  Camera,
  Ruler,
  FileCheck,
  ListChecks,
  X,
  Menu,
  RotateCcw
} from 'lucide-react';

// Local storage key prefix for SOP execution progress
const STORAGE_KEY_PREFIX = 'sop-execution-';

// Part color mapping
const PART_COLORS = {
  blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', ring: 'ring-blue-500/50' },
  purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', ring: 'ring-purple-500/50' },
  green: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', ring: 'ring-green-500/50' },
  cyan: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400', ring: 'ring-cyan-500/50' },
  orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', ring: 'ring-orange-500/50' },
  amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', ring: 'ring-amber-500/50' },
  red: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', ring: 'ring-red-500/50' }
};

// Evidence type icons
const EVIDENCE_ICONS = {
  photo: Camera,
  measurement: Ruler,
  log: FileCheck,
  checklist: ListChecks,
  none: null
};

function SOPExecutionMode({ sop, onExit }) {
  // Current step index
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // Completed steps with timestamps: { stepId: timestamp }
  const [completedSteps, setCompletedSteps] = useState({});
  // QC checks completion: { stepId: { checkIndex: boolean } }
  const [qcChecks, setQcChecks] = useState({});
  // Show parts navigation drawer
  const [showPartsNav, setShowPartsNav] = useState(false);

  const steps = sop.steps || [];
  const parts = sop.parts || [];
  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex];

  // Get storage key for this SOP
  const storageKey = `${STORAGE_KEY_PREFIX}${sop.id}`;

  // Load progress from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.completedSteps) setCompletedSteps(data.completedSteps);
        if (data.qcChecks) setQcChecks(data.qcChecks);
        if (typeof data.currentStepIndex === 'number' && data.currentStepIndex < totalSteps) {
          setCurrentStepIndex(data.currentStepIndex);
        }
      }
    } catch (e) {
      console.error('Error loading SOP progress:', e);
    }
  }, [storageKey, totalSteps]);

  // Save progress to local storage
  const saveProgress = useCallback((newCompletedSteps, newQcChecks, newStepIndex) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        completedSteps: newCompletedSteps,
        qcChecks: newQcChecks,
        currentStepIndex: newStepIndex,
        lastUpdated: new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error saving SOP progress:', e);
    }
  }, [storageKey]);

  // Navigate to next step
  const goNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      const newIndex = currentStepIndex + 1;
      setCurrentStepIndex(newIndex);
      saveProgress(completedSteps, qcChecks, newIndex);
    }
  }, [currentStepIndex, totalSteps, completedSteps, qcChecks, saveProgress]);

  // Navigate to previous step
  const goPrev = useCallback(() => {
    if (currentStepIndex > 0) {
      const newIndex = currentStepIndex - 1;
      setCurrentStepIndex(newIndex);
      saveProgress(completedSteps, qcChecks, newIndex);
    }
  }, [currentStepIndex, completedSteps, qcChecks, saveProgress]);

  // Toggle step completion
  const toggleStepComplete = useCallback(() => {
    const stepId = currentStep.id;
    const newCompleted = { ...completedSteps };

    if (newCompleted[stepId]) {
      delete newCompleted[stepId];
    } else {
      newCompleted[stepId] = new Date().toISOString();
    }

    setCompletedSteps(newCompleted);
    saveProgress(newCompleted, qcChecks, currentStepIndex);
  }, [currentStep, completedSteps, qcChecks, currentStepIndex, saveProgress]);

  // Toggle QC check
  const toggleQcCheck = useCallback((checkIndex) => {
    const stepId = currentStep.id;
    const newQcChecks = { ...qcChecks };

    if (!newQcChecks[stepId]) {
      newQcChecks[stepId] = {};
    }

    newQcChecks[stepId][checkIndex] = !newQcChecks[stepId][checkIndex];
    setQcChecks(newQcChecks);
    saveProgress(completedSteps, newQcChecks, currentStepIndex);
  }, [currentStep, qcChecks, completedSteps, currentStepIndex, saveProgress]);

  // Navigate to specific step
  const goToStep = useCallback((index) => {
    setCurrentStepIndex(index);
    setShowPartsNav(false);
    saveProgress(completedSteps, qcChecks, index);
  }, [completedSteps, qcChecks, saveProgress]);

  // Reset progress
  const resetProgress = useCallback(() => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      setCompletedSteps({});
      setQcChecks({});
      setCurrentStepIndex(0);
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  // Get part info for current step
  const currentPart = useMemo(() => {
    if (!currentStep?.part) return null;
    return parts.find(p => p.id === currentStep.part);
  }, [currentStep, parts]);

  // Get steps grouped by part
  const stepsByPart = useMemo(() => {
    const grouped = {};
    steps.forEach((step, index) => {
      const partId = step.part || 'unknown';
      if (!grouped[partId]) {
        grouped[partId] = [];
      }
      grouped[partId].push({ ...step, globalIndex: index });
    });
    return grouped;
  }, [steps]);

  // Calculate completion stats
  const completionStats = useMemo(() => {
    const completed = Object.keys(completedSteps).length;
    return {
      completed,
      total: totalSteps,
      percentage: totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0
    };
  }, [completedSteps, totalSteps]);

  // Get color config for part
  const getPartColors = (color) => PART_COLORS[color] || PART_COLORS.blue;

  if (!currentStep) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F1114] text-white">
        <p>No steps available</p>
      </div>
    );
  }

  const partColors = getPartColors(currentPart?.color);
  const isCompleted = !!completedSteps[currentStep.id];
  const EvidenceIcon = EVIDENCE_ICONS[currentStep.evidence_required];

  return (
    <div className="fixed inset-0 bg-[#0F1114] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-[#15181C] border-b border-[#2A2F36] px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-[#6B7280] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Exit</span>
          </button>

          <div className="text-center flex-1 mx-4 min-w-0 overflow-hidden">
            <h1 className="text-sm font-semibold text-white truncate">{sop.title}</h1>
            <p className="text-xs text-[#6B7280]">
              Step {currentStepIndex + 1} of {totalSteps}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetProgress}
              className="p-2 text-[#6B7280] hover:text-white transition-colors"
              title="Reset progress"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPartsNav(!showPartsNav)}
              className="p-2 text-[#6B7280] hover:text-white transition-colors"
              title="Jump to part"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="h-1.5 bg-[#2A2F36] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
              style={{ width: `${completionStats.percentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-[#6B7280]">
            <span>{completionStats.completed} completed</span>
            <span>{completionStats.percentage}%</span>
          </div>
        </div>
      </header>

      {/* Parts Navigation Drawer */}
      {showPartsNav && (
        <div className="absolute inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPartsNav(false)}
          />
          <div className="relative ml-auto w-80 max-w-[90vw] bg-[#15181C] border-l border-[#2A2F36] h-full overflow-y-auto">
            <div className="p-4 border-b border-[#2A2F36] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Jump to Part</h2>
              <button onClick={() => setShowPartsNav(false)} className="text-[#6B7280] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {parts.map((part) => {
                const colors = getPartColors(part.color);
                const partSteps = stepsByPart[part.id] || [];
                const completedInPart = partSteps.filter(s => completedSteps[s.id]).length;

                return (
                  <div key={part.id} className={`rounded-lg border ${colors.border} ${colors.bg}`}>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-semibold ${colors.text}`}>
                          Part {part.id}: {part.name}
                        </h3>
                        <span className="text-xs text-[#6B7280]">
                          {completedInPart}/{partSteps.length}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280] mb-3">{part.description}</p>
                      <div className="space-y-1">
                        {partSteps.map((step) => (
                          <button
                            key={step.id}
                            onClick={() => goToStep(step.globalIndex)}
                            className={`w-full flex items-center gap-2 p-2 rounded text-left text-sm transition-colors ${
                              step.globalIndex === currentStepIndex
                                ? `${colors.bg} ${colors.text} ring-1 ${colors.ring}`
                                : 'hover:bg-[#1C1F24] text-[#B4BAC4]'
                            }`}
                          >
                            {completedSteps[step.id] ? (
                              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#4B5563] flex-shrink-0" />
                            )}
                            <span className="truncate">
                              {step.step_number}: {step.title || 'Step'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Step Card */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        <div className={`rounded-xl border-2 ${partColors.border} bg-[#15181C] overflow-hidden w-full max-w-full`}>
          {/* Part Header */}
          {currentPart && (
            <div className={`px-4 py-2 ${partColors.bg} border-b ${partColors.border}`}>
              <span className={`text-xs font-semibold uppercase tracking-wide ${partColors.text}`}>
                Part {currentPart.id}: {currentPart.name}
              </span>
            </div>
          )}

          {/* Step Header */}
          <div className="px-4 py-4 border-b border-[#2A2F36]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${partColors.bg} ${partColors.text} mb-2`}>
                  {currentStep.step_number}
                </span>
                <h2 className="text-xl font-bold text-white break-words">
                  {currentStep.title || `Step ${currentStep.step_number}`}
                </h2>
              </div>
              {isCompleted && (
                <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Materials Section */}
          {currentStep.materials && currentStep.materials.length > 0 && (
            <div className="px-4 py-4 bg-[#1C1F24] border-b border-[#2A2F36]">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-400">Materials</h3>
              </div>
              <div className="space-y-2">
                {currentStep.materials.map((material, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 py-2 px-3 bg-[#15181C] rounded-lg">
                    <span className="text-white font-medium break-words min-w-0 flex-1">{material.name}</span>
                    <span className="text-amber-400 font-mono text-sm whitespace-nowrap flex-shrink-0">{material.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instruction Section */}
          <div className="px-4 py-4 overflow-hidden">
            <p className="text-lg text-[#E5E7EB] leading-relaxed break-words">
              {currentStep.instruction}
            </p>

            {/* Evidence Required Badge */}
            {EvidenceIcon && currentStep.evidence_required !== 'none' && (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#6B7280]">
                <EvidenceIcon className="w-4 h-4" />
                <span className="capitalize">
                  {currentStep.evidence_required} {currentStep.verification_required ? 'required' : 'optional'}
                </span>
              </div>
            )}

            {/* Duration Estimate */}
            {currentStep.expected_duration_minutes > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]">
                <Clock className="w-4 h-4" />
                <span>
                  {currentStep.expected_duration_minutes >= 60
                    ? `${Math.floor(currentStep.expected_duration_minutes / 60)}h ${currentStep.expected_duration_minutes % 60}m`
                    : `${currentStep.expected_duration_minutes} min`
                  }
                </span>
              </div>
            )}
          </div>

          {/* QC Checks Section */}
          {currentStep.qc && currentStep.qc.length > 0 && (
            <div className="px-4 py-4 bg-amber-500/5 border-t border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-400">Quality Check</h3>
              </div>
              <div className="space-y-2">
                {currentStep.qc.map((check, idx) => {
                  const isChecked = qcChecks[currentStep.id]?.[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleQcCheck(idx)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                        isChecked
                          ? 'bg-green-500/20 border border-green-500/40'
                          : 'bg-[#1C1F24] border border-[#2A2F36] hover:border-amber-500/40'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isChecked ? 'bg-green-500' : 'border-2 border-[#4B5563]'
                      }`}>
                        {isChecked && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <span className={`text-sm break-words min-w-0 flex-1 ${isChecked ? 'text-green-400' : 'text-[#E5E7EB]'}`}>
                        {check}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Complete Step Button */}
          <div className="px-4 py-4 border-t border-[#2A2F36]">
            <button
              onClick={toggleStepComplete}
              className={`w-full flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 py-4 rounded-xl font-semibold text-lg transition-all ${
                isCompleted
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500/40'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isCompleted ? (
                <>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    Completed
                  </span>
                  <span className="text-sm font-normal text-green-400/70">
                    {new Date(completedSteps[currentStep.id]).toLocaleTimeString()}
                  </span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <Circle className="w-6 h-6" />
                  Mark Complete
                </span>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="flex-shrink-0 bg-[#15181C] border-t border-[#2A2F36] px-4 py-4 safe-area-bottom">
        <div className="flex items-center gap-3">
          <button
            onClick={goPrev}
            disabled={currentStepIndex === 0}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
              currentStepIndex === 0
                ? 'bg-[#1C1F24] text-[#4B5563] cursor-not-allowed'
                : 'bg-[#1C1F24] hover:bg-[#22262C] text-white border border-[#2A2F36]'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={goNext}
            disabled={currentStepIndex === totalSteps - 1}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
              currentStepIndex === totalSteps - 1
                ? 'bg-[#1C1F24] text-[#4B5563] cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default SOPExecutionMode;
