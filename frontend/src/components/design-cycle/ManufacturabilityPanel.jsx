import React, { useState } from 'react';
import {
  Factory, Beaker, Layers, TrendingUp,
  Check, Clock, HelpCircle, ChevronDown, ChevronUp,
  DollarSign, Gauge, Shield, Timer
} from 'lucide-react';
import { MANUFACTURABILITY_CONTEXTS } from '../../config/designPhases';

const CONTEXT_ICONS = {
  prototype: Beaker,
  low_volume: Layers,
  high_volume: TrendingUp
};

const CONTEXT_COLORS = {
  prototype: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
  low_volume: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  high_volume: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' }
};

const DFM_QUESTIONS = [
  { key: 'process_defined', text: 'Are manufacturing processes defined and documented?', required: true },
  { key: 'capability_confirmed', text: 'Has manufacturing capability been confirmed?', required: true },
  { key: 'cost_within_target', text: 'Is unit cost within target for production volume?', required: true },
  { key: 'quality_methods_defined', text: 'Are inspection and QC methods defined?', required: true },
  { key: 'lead_time_acceptable', text: 'Is production lead time acceptable?', required: true },
  { key: 'tooling_identified', text: 'Has required tooling been identified and justified?', required: false },
  { key: 'critical_dims_identified', text: 'Are critical dimensions identified with inspection methods?', required: true },
  { key: 'make_buy_documented', text: 'Are make/buy decisions documented with rationale?', required: true }
];

function ManufacturabilityPanel({
  data = {},
  onChange,
  nodeId,
  domainLens = 'general',
  readOnly = false
}) {
  const [showDetails, setShowDetails] = useState(true);
  const contexts = Object.values(MANUFACTURABILITY_CONTEXTS);

  const selectedContext = data.context || 'prototype';
  const answers = data.answers || {};
  const contextData = MANUFACTURABILITY_CONTEXTS[selectedContext];
  const contextStyle = CONTEXT_COLORS[selectedContext] || CONTEXT_COLORS.prototype;

  const handleContextChange = (context) => {
    if (readOnly) return;
    onChange?.({
      ...data,
      context
    });
  };

  const handleAnswerChange = (questionKey, value) => {
    if (readOnly) return;
    onChange?.({
      ...data,
      answers: {
        ...answers,
        [questionKey]: value
      }
    });
  };

  const handleNotesChange = (notes) => {
    if (readOnly) return;
    onChange?.({
      ...data,
      notes
    });
  };

  const handleCostChange = (field, value) => {
    if (readOnly) return;
    onChange?.({
      ...data,
      costData: {
        ...(data.costData || {}),
        [field]: value
      }
    });
  };

  const getProgress = () => {
    const requiredQuestions = DFM_QUESTIONS.filter(q => q.required);
    const answered = requiredQuestions.filter(q =>
      answers[q.key] === 'yes' || answers[q.key] === 'no' || answers[q.key] === 'na'
    ).length;
    return Math.round((answered / requiredQuestions.length) * 100);
  };

  const progress = getProgress();

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Factory className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0F2F4]">Manufacturability Assessment</h3>
            <p className="text-sm text-[#6B7280]">Phase 3c - Design for Manufacturing (DFM) evaluation</p>
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
            progress >= 100 ? 'bg-emerald-500' : 'bg-green-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Production Context Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#B4BAC4] mb-3">
          Production Context
        </label>
        <div className="grid grid-cols-3 gap-3">
          {contexts.map(context => {
            const Icon = CONTEXT_ICONS[context.code] || Factory;
            const colors = CONTEXT_COLORS[context.code] || CONTEXT_COLORS.prototype;
            const isSelected = selectedContext === context.code;

            return (
              <button
                key={context.code}
                type="button"
                onClick={() => handleContextChange(context.code)}
                disabled={readOnly}
                className={`p-4 rounded-lg text-left transition-all ${
                  isSelected
                    ? `${colors.bg} ${colors.border} border-2`
                    : 'bg-[#0F1114] border-2 border-[#2A2F36] hover:border-[#3A3F46]'
                } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${isSelected ? colors.text : 'text-[#6B7280]'}`} />
                  <span className={`font-medium ${isSelected ? colors.text : 'text-[#B4BAC4]'}`}>
                    {context.name}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280]">{context.typicalVolume}</p>
                {isSelected && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {context.focus.map((f, idx) => (
                      <span key={idx} className={`px-1.5 py-0.5 text-xs ${colors.bg} ${colors.text} rounded`}>
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Evaluation Criteria Reference */}
      <div className="bg-[#0F1114] rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-[#6B7280]" />
          <span className="text-xs text-[#6B7280] uppercase tracking-wide">Evaluation Criteria</span>
        </div>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {[
            { icon: Factory, label: 'Process' },
            { icon: Gauge, label: 'Capability' },
            { icon: DollarSign, label: 'Cost' },
            { icon: Shield, label: 'Quality' },
            { icon: Timer, label: 'Lead Time' }
          ].map(criterion => (
            <div key={criterion.label} className="flex items-center gap-1 px-2 py-1 bg-[#1C1F24] text-[#6B7280] rounded">
              <criterion.icon className="w-3 h-3" />
              {criterion.label}
            </div>
          ))}
        </div>
      </div>

      {/* Cost Data Section */}
      <div className="bg-[#0F1114] rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-[#F0F2F4]">Cost Estimate</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Target Unit Cost</label>
            <input
              type="text"
              value={data.costData?.target || ''}
              onChange={(e) => handleCostChange('target', e.target.value)}
              disabled={readOnly}
              placeholder="e.g., $45.00"
              className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-green-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Estimated Unit Cost</label>
            <input
              type="text"
              value={data.costData?.estimated || ''}
              onChange={(e) => handleCostChange('estimated', e.target.value)}
              disabled={readOnly}
              placeholder="e.g., $42.50"
              className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-green-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">Tooling Cost</label>
            <input
              type="text"
              value={data.costData?.tooling || ''}
              onChange={(e) => handleCostChange('tooling', e.target.value)}
              disabled={readOnly}
              placeholder="e.g., $15,000"
              className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-green-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* DFM Questions */}
      <div className="bg-[#0F1114] rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-[#F0F2F4]">DFM Checklist</span>
            <span className="text-xs text-[#6B7280]">
              ({Object.keys(answers).filter(k => answers[k]).length} / {DFM_QUESTIONS.length} answered)
            </span>
          </div>
          {showDetails ? (
            <ChevronUp className="w-4 h-4 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          )}
        </button>

        {showDetails && (
          <div className="p-4 pt-0 border-t border-[#2A2F36]">
            <div className="space-y-3 mt-4">
              {DFM_QUESTIONS.map(question => {
                const answer = answers[question.key] || 'unanswered';

                return (
                  <div key={question.key} className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-[#B4BAC4]">
                        {question.text}
                        {question.required && <span className="text-red-400 ml-1">*</span>}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {['yes', 'no', 'na'].map(value => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleAnswerChange(question.key, value)}
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
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-[#B4BAC4] mb-2">DFM Notes</label>
        <textarea
          value={data.notes || ''}
          onChange={(e) => handleNotesChange(e.target.value)}
          disabled={readOnly}
          placeholder="Add notes about manufacturing considerations, process plans, or cost breakdowns..."
          className="w-full px-3 py-2 bg-[#0F1114] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-green-500 resize-none disabled:opacity-50"
          rows={3}
        />
      </div>
    </div>
  );
}

export default ManufacturabilityPanel;
