import React from 'react';
import {
  Settings, Car, Factory, Package, Zap, Heart, Plane, Check
} from 'lucide-react';
import { DOMAIN_LENSES } from '../../config/designPhases';

const ICON_MAP = {
  Settings,
  Car,
  Factory,
  Package,
  Zap,
  Heart,
  Plane
};

function DomainLensSelector({
  selectedLens = 'general',
  onSelect,
  disabled = false,
  showExamples = true,
  compact = false
}) {
  const lenses = Object.values(DOMAIN_LENSES);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {lenses.map(lens => {
          const Icon = ICON_MAP[lens.icon] || Settings;
          const isSelected = selectedLens === lens.code;

          return (
            <button
              key={lens.code}
              type="button"
              onClick={() => !disabled && onSelect?.(lens.code)}
              disabled={disabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1C1F24] text-[#B4BAC4] hover:bg-[#22262C]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={lens.description}
            >
              <Icon className="w-4 h-4" />
              {lens.name}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lenses.map(lens => {
        const Icon = ICON_MAP[lens.icon] || Settings;
        const isSelected = selectedLens === lens.code;

        return (
          <label
            key={lens.code}
            className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${
              isSelected
                ? 'bg-blue-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10'
                : 'bg-[#15181C] border-2 border-[#2A2F36] hover:border-[#3A3F46]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="domain_lens"
              value={lens.code}
              checked={isSelected}
              onChange={() => !disabled && onSelect?.(lens.code)}
              disabled={disabled}
              className="sr-only"
            />

            <div className={`p-3 rounded-lg ${
              isSelected ? 'bg-blue-500/30' : 'bg-[#1C1F24]'
            }`}>
              <Icon className={`w-6 h-6 ${
                isSelected ? 'text-blue-400' : 'text-[#6B7280]'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold ${
                  isSelected ? 'text-[#F0F2F4]' : 'text-[#B4BAC4]'
                }`}>
                  {lens.name}
                </h4>
                {isSelected && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-500/30 text-blue-400 rounded-full">
                    <Check className="w-3 h-3" />
                    Selected
                  </span>
                )}
              </div>
              <p className="text-sm text-[#6B7280] mt-1">{lens.description}</p>

              {showExamples && lens.exampleProducts?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {lens.exampleProducts.map((product, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs bg-[#1C1F24] text-[#6B7280] rounded"
                    >
                      {product}
                    </span>
                  ))}
                </div>
              )}

              {isSelected && Object.keys(lens.terminologyOverrides || {}).length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#2A2F36]">
                  <p className="text-xs text-[#6B7280] mb-2">Terminology adjustments:</p>
                  <div className="space-y-1">
                    {Object.entries(lens.terminologyOverrides).map(([generic, specific]) => (
                      <div key={generic} className="flex items-center gap-2 text-xs">
                        <span className="text-[#6B7280] line-through">{generic}</span>
                        <span className="text-[#6B7280]">&rarr;</span>
                        <span className="text-blue-400">{specific}</span>
                      </div>
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

export default DomainLensSelector;
