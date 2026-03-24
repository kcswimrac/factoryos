import React from 'react';
import { Hexagon, Layers, Box } from 'lucide-react';
import { TEST_LEVELS } from '../../config/designPhases';

const LEVEL_ICONS = {
  component: Hexagon,
  system: Layers,
  full_system: Box
};

const LEVEL_COLORS = {
  component: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  system: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  full_system: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' }
};

function TestLevelBadge({
  level = 'component',
  size = 'sm',
  showLabel = true,
  showDescription = false,
  className = ''
}) {
  const testLevel = TEST_LEVELS[level];
  if (!testLevel) return null;

  const Icon = LEVEL_ICONS[level] || Hexagon;
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS.component;

  const sizeClasses = {
    xs: {
      wrapper: 'px-1.5 py-0.5',
      icon: 'w-3 h-3',
      text: 'text-xs',
      gap: 'gap-1'
    },
    sm: {
      wrapper: 'px-2 py-1',
      icon: 'w-3.5 h-3.5',
      text: 'text-xs',
      gap: 'gap-1.5'
    },
    md: {
      wrapper: 'px-3 py-1.5',
      icon: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-2'
    },
    lg: {
      wrapper: 'px-4 py-2',
      icon: 'w-5 h-5',
      text: 'text-sm',
      gap: 'gap-2'
    }
  };

  const sizes = sizeClasses[size] || sizeClasses.sm;

  if (showDescription) {
    return (
      <div className={`${colors.bg} ${colors.border} border rounded-lg p-3 ${className}`}>
        <div className={`flex items-center ${sizes.gap} mb-2`}>
          <Icon className={`${sizes.icon} ${colors.text}`} />
          <span className={`${sizes.text} font-medium ${colors.text}`}>
            {testLevel.name}
          </span>
        </div>
        <p className="text-xs text-[#6B7280]">{testLevel.description}</p>
        {testLevel.examples?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {testLevel.examples.map((example, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 text-xs bg-[#1C1F24] text-[#6B7280] rounded"
              >
                {example}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${sizes.gap} ${sizes.wrapper} ${colors.bg} ${colors.border} border rounded ${className}`}
      title={testLevel.description}
    >
      <Icon className={`${sizes.icon} ${colors.text}`} />
      {showLabel && (
        <span className={`${sizes.text} font-medium ${colors.text}`}>
          {testLevel.name.replace('-Level Test', '')}
        </span>
      )}
    </span>
  );
}

// Selector variant for choosing test levels
export function TestLevelSelector({
  selectedLevel = 'component',
  onSelect,
  disabled = false,
  compact = false,
  className = ''
}) {
  const levels = Object.values(TEST_LEVELS);

  if (compact) {
    return (
      <div className={`flex gap-1 ${className}`}>
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
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                isSelected
                  ? `${colors.bg} ${colors.text} ${colors.border} border`
                  : 'bg-[#1C1F24] text-[#6B7280] hover:bg-[#22262C] border border-transparent'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={level.description}
            >
              <Icon className="w-3 h-3" />
              {level.name.replace('-Level Test', '')}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {levels.map(level => {
        const Icon = LEVEL_ICONS[level.code] || Hexagon;
        const colors = LEVEL_COLORS[level.code] || LEVEL_COLORS.component;
        const isSelected = selectedLevel === level.code;

        return (
          <label
            key={level.code}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
              isSelected
                ? `${colors.bg} ${colors.border} border-2`
                : 'bg-[#0F1114] border-2 border-[#2A2F36] hover:border-[#3A3F46]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="test_level"
              value={level.code}
              checked={isSelected}
              onChange={() => !disabled && onSelect?.(level.code)}
              disabled={disabled}
              className="sr-only"
            />
            <div className={`p-2 rounded-lg ${isSelected ? colors.bg : 'bg-[#1C1F24]'}`}>
              <Icon className={`w-4 h-4 ${isSelected ? colors.text : 'text-[#6B7280]'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium ${isSelected ? colors.text : 'text-[#B4BAC4]'}`}>
                {level.name}
              </h4>
              <p className="text-xs text-[#6B7280] mt-0.5">{level.description}</p>
              {level.examples?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {level.examples.slice(0, 3).map((example, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 text-xs bg-[#1C1F24] text-[#6B7280] rounded"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

export default TestLevelBadge;
