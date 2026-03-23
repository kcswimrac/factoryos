import React from 'react';
import {
  Box,
  Layers,
  GitBranch,
  Package,
  Hexagon,
  ShoppingCart,
  FileText,
  Check,
  AlertCircle
} from 'lucide-react';
import { NODE_TYPES, getAllowedChildTypes } from '../../config/designPhases';

const ICON_MAP = {
  Box,
  Layers,
  GitBranch,
  Package,
  Hexagon,
  ShoppingCart,
  FileText
};

const COLOR_MAP = {
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    borderSelected: 'border-violet-500',
    text: 'text-violet-400',
    hover: 'hover:bg-violet-500/20'
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    borderSelected: 'border-blue-500',
    text: 'text-blue-400',
    hover: 'hover:bg-blue-500/20'
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    borderSelected: 'border-cyan-500',
    text: 'text-cyan-400',
    hover: 'hover:bg-cyan-500/20'
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    borderSelected: 'border-green-500',
    text: 'text-green-400',
    hover: 'hover:bg-green-500/20'
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    borderSelected: 'border-amber-500',
    text: 'text-amber-400',
    hover: 'hover:bg-amber-500/20'
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    borderSelected: 'border-orange-500',
    text: 'text-orange-400',
    hover: 'hover:bg-orange-500/20'
  },
  gray: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    borderSelected: 'border-gray-500',
    text: 'text-gray-400',
    hover: 'hover:bg-gray-500/20'
  }
};

function NodeTypeSelector({
  value,
  onChange,
  parentType = null,
  showDisabled = true,
  layout = 'grid', // 'grid' or 'list'
  className = ''
}) {
  const allowedTypes = getAllowedChildTypes(parentType);

  const allTypes = Object.values(NODE_TYPES);

  return (
    <div className={className}>
      {parentType && (
        <p className="text-sm text-gray-400 mb-3">
          Allowed node types under {NODE_TYPES[parentType]?.name || 'root'}:
        </p>
      )}

      <div className={
        layout === 'grid'
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
          : 'space-y-2'
      }>
        {allTypes.map(nodeType => {
          const isAllowed = allowedTypes.includes(nodeType.code);
          const isSelected = value === nodeType.code;
          const Icon = ICON_MAP[nodeType.icon] || Box;
          const colors = COLOR_MAP[nodeType.color] || COLOR_MAP.gray;

          if (!showDisabled && !isAllowed) {
            return null;
          }

          return (
            <button
              key={nodeType.code}
              type="button"
              onClick={() => isAllowed && onChange(nodeType.code)}
              disabled={!isAllowed}
              className={`
                relative flex ${layout === 'grid' ? 'flex-col' : 'flex-row'} items-${layout === 'grid' ? 'center' : 'start'} gap-2
                p-4 rounded-lg border-2 transition-all
                ${isSelected
                  ? `${colors.bg} ${colors.borderSelected} ring-2 ring-${nodeType.color}-500/20`
                  : isAllowed
                    ? `bg-gray-800/30 ${colors.border} ${colors.hover} cursor-pointer`
                    : 'bg-gray-900/30 border-gray-700/50 opacity-50 cursor-not-allowed'
                }
              `}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className={`w-4 h-4 ${colors.text}`} />
                </div>
              )}

              <div className={`p-2 rounded-lg ${isSelected ? colors.bg : 'bg-gray-800/50'}`}>
                <Icon className={`w-6 h-6 ${isAllowed ? colors.text : 'text-gray-600'}`} />
              </div>

              <div className={layout === 'grid' ? 'text-center' : 'flex-1'}>
                <div className="flex items-center gap-1.5 justify-center">
                  <span className={`font-medium ${isAllowed ? 'text-white' : 'text-gray-500'}`}>
                    {nodeType.name}
                  </span>
                  {!nodeType.isPhysical && (
                    <span className="text-xs text-gray-500 italic">(doc)</span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${isAllowed ? 'text-gray-400' : 'text-gray-600'}`}>
                  {nodeType.description}
                </p>
              </div>

              {!isAllowed && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 rounded-lg">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <AlertCircle className="w-3 h-3" />
                    <span>Not allowed here</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {value && (
        <div className="mt-4 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${COLOR_MAP[NODE_TYPES[value]?.color]?.bg || ''}`}>
              {(() => {
                const Icon = ICON_MAP[NODE_TYPES[value]?.icon] || Box;
                return <Icon className={`w-5 h-5 ${COLOR_MAP[NODE_TYPES[value]?.color]?.text || ''}`} />;
              })()}
            </div>
            <div>
              <p className="text-sm text-white font-medium">
                Selected: {NODE_TYPES[value]?.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {NODE_TYPES[value]?.description}
              </p>
              {NODE_TYPES[value]?.allowedChildren?.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Can contain: {NODE_TYPES[value]?.allowedChildren?.map(c => NODE_TYPES[c]?.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NodeTypeSelector;
