import React from 'react';
import { Layers, Box, GitBranch, Hexagon, Check } from 'lucide-react';
import { SPECIFICATION_LEVELS } from '../../config/designPhases';

const LEVEL_ICONS = {
  platform: Layers,
  system: Box,
  subsystem: GitBranch,
  component: Hexagon
};

const LEVEL_COLORS = {
  platform: { bg: 'bg-violet-500/20', border: 'border-violet-500/50', text: 'text-violet-400' },
  system: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  subsystem: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  component: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' }
};

function SpecificationLevelSelector({
  selectedLevel = 'component',
  onSelect,
  disabled = false,
  showExamples = true,
  domainLens = null,
  compact = false
}) {
  const levels = Object.values(SPECIFICATION_LEVELS);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {levels.map(level => {
          const Icon = LEVEL_ICONS[level.code] || Hexagon;
          const colors = LEVEL_COLORS[level.code] || LEVEL_COLORS.component;
          const isSelected = selectedLevel === level.code;

          return (
            <button
              key={level.code}
              type="button"
              onClick={() => !disabled && onSelect?.(level.code)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? `${colors.bg} ${colors.border} ${colors.text} border-2`
                  : 'bg-[#1C1F24] text-[#B4BAC4] hover:bg-[#22262C] border-2 border-transparent'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={level.description}
            >
              <Icon className="w-4 h-4" />
              {level.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hierarchy Visualization */}
      <div className="bg-[#0F1114] rounded-lg p-4 mb-4">
        <p className="text-xs text-[#6B7280] mb-3 uppercase tracking-wide">Specification Hierarchy</p>
        <div className="flex items-center justify-between relative">
          {levels.map((level, idx) => {
            const Icon = LEVEL_ICONS[level.code] || Hexagon;
            const colors = LEVEL_COLORS[level.code] || LEVEL_COLORS.component;
            const isSelected = selectedLevel === level.code;

            return (
              <React.Fragment key={level.code}>
                {idx > 0 && (
                  <div className="flex-1 h-0.5 bg-[#2A2F36] mx-2" />
                )}
                <button
                  type="button"
                  onClick={() => !disabled && onSelect?.(level.code)}
                  disabled={disabled}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                    isSelected
                      ? `${colors.bg} ${colors.border} border-2 scale-110 shadow-lg`
                      : 'bg-[#1C1F24] border-2 border-transparent hover:border-[#3A3F46]'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? colors.text : 'text-[#6B7280]'}`} />
                  <span className={`text-xs font-medium ${
                    isSelected ? colors.text : 'text-[#6B7280]'
                  }`}>
                    {level.name.split(' / ')[0]}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Detail Cards */}
      {levels.map(level => {
        const Icon = LEVEL_ICONS[level.code] || Hexagon;
        const colors = LEVEL_COLORS[level.code] || LEVEL_COLORS.component;
        const isSelected = selectedLevel === level.code;

        return (
          <label
            key={level.code}
            className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
              isSelected
                ? `${colors.bg} border-2 ${colors.border} shadow-lg`
                : 'bg-[#15181C] border-2 border-[#2A2F36] hover:border-[#3A3F46]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="specification_level"
              value={level.code}
              checked={isSelected}
              onChange={() => !disabled && onSelect?.(level.code)}
              disabled={disabled}
              className="sr-only"
            />

            <div className={`p-3 rounded-lg ${isSelected ? colors.bg : 'bg-[#1C1F24]'}`}>
              <Icon className={`w-6 h-6 ${isSelected ? colors.text : 'text-[#6B7280]'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold ${isSelected ? 'text-[#F0F2F4]' : 'text-[#B4BAC4]'}`}>
                  {level.name}
                </h4>
                {isSelected && (
                  <span className={`flex items-center gap-1 px-2 py-0.5 text-xs ${colors.bg} ${colors.text} rounded-full`}>
                    <Check className="w-3 h-3" />
                    Selected
                  </span>
                )}
              </div>
              <p className="text-sm text-[#6B7280] mt-1">{level.description}</p>

              {showExamples && level.examples?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {level.examples.map((example, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-[#1C1F24] text-[#6B7280] rounded"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              )}

              {isSelected && level.requiredSections?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#2A2F36]">
                  <p className="text-xs text-[#6B7280] mb-2">Required specification sections:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {level.requiredSections.map(section => (
                      <span
                        key={section}
                        className={`px-2 py-0.5 text-xs ${colors.bg} ${colors.text} rounded`}
                      >
                        {section.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

export default SpecificationLevelSelector;
