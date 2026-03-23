import React, { useState } from 'react';
import {
  Wrench, Settings, RotateCcw, ArrowUpCircle,
  Check, X, Clock, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { SERVICEABILITY_DIMENSIONS } from '../../config/designPhases';

const DIMENSION_ICONS = {
  maintenance: Settings,
  repair: Wrench,
  overhaul: RotateCcw,
  upgrade: ArrowUpCircle
};

const STATUS_COLORS = {
  complete: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: Check },
  incomplete: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Clock },
  not_applicable: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: X }
};

function ServiceabilityPanel({
  data = {},
  onChange,
  nodeId,
  domainLens = 'general',
  readOnly = false
}) {
  const [expandedDimension, setExpandedDimension] = useState(null);
  const dimensions = Object.values(SERVICEABILITY_DIMENSIONS);

  const handleAnswerChange = (dimensionCode, questionIndex, value) => {
    if (readOnly) return;

    const newData = {
      ...data,
      [dimensionCode]: {
        ...data[dimensionCode],
        answers: {
          ...(data[dimensionCode]?.answers || {}),
          [questionIndex]: value
        }
      }
    };
    onChange?.(newData);
  };

  const handleNotesChange = (dimensionCode, notes) => {
    if (readOnly) return;

    const newData = {
      ...data,
      [dimensionCode]: {
        ...data[dimensionCode],
        notes
      }
    };
    onChange?.(newData);
  };

  const getDimensionStatus = (dimensionCode) => {
    const dimensionData = data[dimensionCode];
    if (!dimensionData) return 'incomplete';

    const dimension = SERVICEABILITY_DIMENSIONS[dimensionCode];
    if (!dimension) return 'incomplete';

    const answers = dimensionData.answers || {};
    const questionCount = dimension.questions.length;
    const answeredCount = Object.values(answers).filter(v => v === 'yes' || v === 'no' || v === 'na').length;

    if (answeredCount === 0) return 'incomplete';
    if (answeredCount === questionCount) return 'complete';
    return 'incomplete';
  };

  const getOverallProgress = () => {
    const statuses = dimensions.map(d => getDimensionStatus(d.code));
    const complete = statuses.filter(s => s === 'complete').length;
    return Math.round((complete / dimensions.length) * 100);
  };

  const progress = getOverallProgress();

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Wrench className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0F2F4]">Serviceability Assessment</h3>
            <p className="text-sm text-[#6B7280]">Phase 3b - Evaluate maintenance, repair, overhaul, and upgrade considerations</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${
            progress >= 100 ? 'text-emerald-400' :
            progress >= 50 ? 'text-amber-400' :
            'text-[#6B7280]'
          }`}>
            {progress}%
          </span>
          <p className="text-xs text-[#6B7280]">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-6">
        <div
          className={`h-full transition-all duration-500 ${
            progress >= 100 ? 'bg-emerald-500' : 'bg-orange-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Evaluation Criteria Reference */}
      <div className="bg-[#0F1114] rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-[#6B7280]" />
          <span className="text-xs text-[#6B7280] uppercase tracking-wide">Evaluation Criteria</span>
        </div>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {['Access', 'Time', 'Tools', 'Skills', 'Parts'].map(criterion => (
            <div key={criterion} className="px-2 py-1 bg-[#1C1F24] text-[#6B7280] rounded text-center">
              {criterion}
            </div>
          ))}
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        {dimensions.map(dimension => {
          const Icon = DIMENSION_ICONS[dimension.code] || Wrench;
          const status = getDimensionStatus(dimension.code);
          const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.incomplete;
          const StatusIcon = statusStyle.icon;
          const isExpanded = expandedDimension === dimension.code;
          const dimensionData = data[dimension.code] || { answers: {}, notes: '' };

          return (
            <div
              key={dimension.code}
              className="bg-[#0F1114] rounded-lg overflow-hidden"
            >
              {/* Dimension Header */}
              <button
                type="button"
                onClick={() => setExpandedDimension(isExpanded ? null : dimension.code)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${statusStyle.bg}`}>
                    <Icon className={`w-4 h-4 ${statusStyle.text}`} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[#F0F2F4] font-medium">{dimension.name}</h4>
                    <p className="text-xs text-[#6B7280]">{dimension.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${statusStyle.bg} ${statusStyle.text}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status === 'complete' ? 'Complete' : status === 'not_applicable' ? 'N/A' : 'Incomplete'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 pt-0 border-t border-[#2A2F36]">
                  {/* Questions */}
                  <div className="space-y-3 mt-4">
                    {dimension.questions.map((question, idx) => {
                      const answer = dimensionData.answers[idx] || 'unanswered';

                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm text-[#B4BAC4]">{question}</p>
                          </div>
                          <div className="flex gap-1">
                            {['yes', 'no', 'na'].map(value => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleAnswerChange(dimension.code, idx, value)}
                                disabled={readOnly}
                                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                                  answer === value
                                    ? value === 'yes'
                                      ? 'bg-emerald-500 text-white'
                                      : value === 'no'
                                      ? 'bg-red-500 text-white'
                                      : 'bg-slate-500 text-white'
                                    : 'bg-[#1C1F24] text-[#6B7280] hover:bg-[#22262C]'
                                } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {value === 'na' ? 'N/A' : value.charAt(0).toUpperCase() + value.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Notes */}
                  <div className="mt-4">
                    <label className="block text-xs text-[#6B7280] mb-2">Notes</label>
                    <textarea
                      value={dimensionData.notes || ''}
                      onChange={(e) => handleNotesChange(dimension.code, e.target.value)}
                      disabled={readOnly}
                      placeholder={`Add notes about ${dimension.name.toLowerCase()}...`}
                      className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-orange-500 resize-none disabled:opacity-50"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ServiceabilityPanel;
