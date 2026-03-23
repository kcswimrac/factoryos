import React from 'react';
import { Link } from 'react-router-dom';
import {
  X, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle,
  ClipboardList, FlaskConical, PenTool, Database, Calculator,
  TestTube2, GitMerge, Target, AlertCircle, FileText, Wrench,
  ShieldCheck, ExternalLink
} from 'lucide-react';
import { getPhaseColorClasses } from '../../config/designPhasesExplainerConfig';

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
 * PhaseDetailPanel - Modal panel displaying detailed information about a design phase
 *
 * This panel presents the authoritative definition of what each phase requires.
 * Content is normative, not advisory.
 */
function PhaseDetailPanel({
  phase,
  totalPhases = 7,
  onClose,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true
}) {
  if (!phase) return null;

  const colors = getPhaseColorClasses(phase);
  const PhaseIcon = ICON_MAP[phase.iconName] || Target;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0F1114] border border-[#2A2F36] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b border-[#2A2F36] ${colors.bgLight}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${colors.bg}`}>
              <PhaseIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className={`text-sm font-medium ${colors.text}`}>
                Phase {phase.number} of {totalPhases}
              </div>
              <h2 className="text-xl font-bold text-[#F0F2F4]">
                {phase.fullName}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B7280] hover:text-[#F0F2F4] hover:bg-[#1C1F24] rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Purpose */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F0F2F4] mb-3">
              <Target className={`w-5 h-5 ${colors.text}`} />
              Purpose
            </h3>
            <p className="text-[#B4BAC4] leading-relaxed">
              {phase.purpose}
            </p>
          </section>

          {/* Required Inputs */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F0F2F4] mb-3">
              <FileText className={`w-5 h-5 ${colors.text}`} />
              Required Inputs
            </h3>
            <ul className="space-y-2">
              {phase.requiredInputs.map((input, index) => (
                <li key={index} className="flex items-start gap-2 text-[#B4BAC4]">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colors.bg} flex-shrink-0`} />
                  {input}
                </li>
              ))}
            </ul>
          </section>

          {/* Required Outputs */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F0F2F4] mb-3">
              <CheckCircle2 className={`w-5 h-5 ${colors.text}`} />
              Required Outputs
            </h3>
            <ul className="space-y-2">
              {phase.requiredOutputs.map((output, index) => (
                <li key={index} className="flex items-start gap-2 text-[#B4BAC4]">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colors.bg} flex-shrink-0`} />
                  {output}
                </li>
              ))}
            </ul>
          </section>

          {/* Expected Artifacts */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F0F2F4] mb-3">
              <Wrench className={`w-5 h-5 ${colors.text}`} />
              Expected Artifacts (Node-Owned)
            </h3>
            <ul className="space-y-2">
              {phase.expectedArtifacts.map((artifact, index) => (
                <li key={index} className="flex items-start gap-2 text-[#B4BAC4]">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colors.bg} flex-shrink-0`} />
                  {artifact}
                </li>
              ))}
            </ul>
          </section>

          {/* Sub-Phases (Phase 3 only) */}
          {phase.subPhases && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F0F2F4] mb-4">
                <ClipboardList className={`w-5 h-5 ${colors.text}`} />
                Parallel Responsibilities
              </h3>
              <div className="space-y-4">
                {phase.subPhases.map((subPhase) => (
                  <div
                    key={subPhase.id}
                    className={`p-4 rounded-lg border ${colors.border} ${colors.bgLight}`}
                  >
                    <h4 className="font-semibold text-[#F0F2F4] mb-3">
                      {subPhase.id}: {subPhase.name}
                    </h4>
                    <ul className="space-y-2">
                      {subPhase.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-[#B4BAC4]">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colors.bg} flex-shrink-0`} />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Common Failure Modes */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F0F2F4] mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Common Failure Modes
            </h3>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <ul className="space-y-2">
                {phase.commonFailureModes.map((failure, index) => (
                  <li key={index} className="flex items-start gap-2 text-amber-200/90 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                    {failure}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Completion Criteria */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F0F2F4] mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Completion Criteria
            </h3>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-xs text-emerald-400 mb-3 font-medium">
                ALL conditions must be true before this phase is considered complete:
              </p>
              <ul className="space-y-2">
                {phase.completionCriteria.map((criteria, index) => (
                  <li key={index} className="flex items-start gap-2 text-emerald-200/90 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Key Statements */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F0F2F4] mb-3">
              <AlertCircle className={`w-5 h-5 ${colors.text}`} />
              Key Requirements
            </h3>
            <div className={`${colors.bgLight} border ${colors.border} rounded-lg p-4`}>
              <ul className="space-y-3">
                {phase.keyStatements.map((statement, index) => (
                  <li key={index} className="flex items-start gap-2 text-[#F0F2F4] text-sm font-medium">
                    <span className={`mt-1.5 w-2 h-2 rounded-full ${colors.bg} flex-shrink-0`} />
                    {statement}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Examples */}
          {phase.examples && phase.examples.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F0F2F4] mb-3">
                <FileText className={`w-5 h-5 ${colors.text}`} />
                Examples
              </h3>
              <div className="space-y-3">
                {phase.examples.map((example, index) => (
                  <div
                    key={index}
                    className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4"
                  >
                    <h4 className="text-sm font-medium text-[#F0F2F4] mb-2">
                      {example.title}
                    </h4>
                    <p className="text-sm text-[#9CA3AF] italic">
                      {example.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Design Review */}
          {phase.relatedReview && (
            <section>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[#F0F2F4] mb-3">
                <ShieldCheck className="w-5 h-5 text-red-400" />
                Related Design Review
              </h3>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                        {phase.relatedReview.type}
                      </span>
                      <span className="text-sm font-medium text-[#F0F2F4]">
                        {phase.relatedReview.name}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] mb-2">
                      <strong>Timing:</strong> {phase.relatedReview.timing}
                    </p>
                    <p className="text-sm text-red-200/80">
                      {phase.relatedReview.description}
                    </p>
                  </div>
                  <Link
                    to="/design/reviews"
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                  >
                    View Reviews
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between p-4 border-t border-[#2A2F36] bg-[#0F1114]">
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              canGoPrevious
                ? 'text-[#B4BAC4] hover:text-[#F0F2F4] hover:bg-[#1C1F24]'
                : 'text-[#3A3F46] cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous Phase
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPhases }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i + 1 === phase.number ? colors.bg : 'bg-[#2A2F36]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              canGoNext
                ? 'text-[#B4BAC4] hover:text-[#F0F2F4] hover:bg-[#1C1F24]'
                : 'text-[#3A3F46] cursor-not-allowed'
            }`}
          >
            Next Phase
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhaseDetailPanel;
