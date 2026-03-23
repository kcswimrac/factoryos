import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle, Lock, RotateCcw } from 'lucide-react';
import { SCORING_WEIGHTS } from '../../config/designPhases';

function AIScorePanel({ score, breakdown, iterationCount, onViewHistory }) {
  const {
    currentScore = 0,
    scoreCap = 95,
    capReason = null,
    uncappedScore = 0
  } = score || {};

  const isCapped = capReason !== null;
  const scorePercentage = Math.min(currentScore, 100);
  const capPercentage = Math.min(scoreCap, 100);

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#F0F2F4] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          AI Engineering Score
        </h3>
        {iterationCount > 0 && (
          <span className="flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
            <RotateCcw className="w-3 h-3" />
            {iterationCount} iteration{iterationCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Main Score Display */}
      <div className="relative mb-6">
        <div className="flex items-end justify-between mb-2">
          <div>
            <span className="text-4xl font-bold text-[#F0F2F4]">{Math.round(currentScore)}</span>
            <span className="text-2xl text-[#6B7280]">%</span>
          </div>
          {isCapped && (
            <div className="flex items-center gap-1 text-amber-400 text-sm">
              <Lock className="w-4 h-4" />
              <span>Cap: {scoreCap}%</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
          {/* Cap indicator line */}
          {isCapped && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
              style={{ left: `${capPercentage}%` }}
            />
          )}
          {/* Score fill */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCapped ? 'bg-blue-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${scorePercentage}%` }}
          />
        </div>
      </div>

      {/* Cap Warning */}
      {isCapped && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-200">{capReason}</p>
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-[#6B7280] mb-3">Score Breakdown</h4>
        {Object.entries(SCORING_WEIGHTS).map(([key, config]) => {
          const phaseData = breakdown?.[key] || { weight: config.weight, earned: 0 };
          const percentage = (phaseData.earned / phaseData.weight) * 100 || 0;

          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-[#6B7280] w-24 truncate">{config.name}</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-[#6B7280] w-16 text-right">
                {phaseData.earned?.toFixed(1) || 0}/{phaseData.weight}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Iteration Status */}
      <div className="mt-4 pt-4 border-t border-[#2A2F36]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">Learning Loops</span>
          <span className={`${iterationCount > 0 ? 'text-emerald-400' : 'text-[#6B7280]'}`}>
            {iterationCount > 0 ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {iterationCount} completed
              </span>
            ) : (
              'Not started'
            )}
          </span>
        </div>
      </div>

      {onViewHistory && (
        <button
          onClick={onViewHistory}
          className="mt-4 w-full text-sm text-blue-400 hover:text-blue-300 text-center transition-colors"
        >
          View Score History
        </button>
      )}
    </div>
  );
}

export default AIScorePanel;
