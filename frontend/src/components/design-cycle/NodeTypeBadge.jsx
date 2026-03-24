import React from 'react';
import {
  Box,
  Layers,
  GitBranch,
  Package,
  Hexagon,
  ShoppingCart,
  FileText,
  Folder,
  FolderOpen,
  FileX
} from 'lucide-react';
import { NODE_TYPES, getNodeClassConfig } from '../../config/designPhases';

const ICON_MAP = {
  Box,
  Layers,
  GitBranch,
  Package,
  Hexagon,
  ShoppingCart,
  FileText,
  Folder,
  FolderOpen
};

const COLOR_MAP = {
  violet: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  gray: 'bg-gray-500/20 text-[#6B7280] border-gray-500/30',
  slate: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
};

function NodeTypeBadge({
  type,
  nodeClass,
  size = 'md',
  showLabel = true,
  showDescription = false,
  showRestrictions = true,
  isExpanded = false,
  className = ''
}) {
  const nodeType = NODE_TYPES[type];
  const nodeClassConfig = nodeClass ? getNodeClassConfig(nodeClass) : null;

  if (!nodeType) {
    return null;
  }

  // For functional groups, override the icon to use folder
  const isFunctionalGroup = nodeClass === 'functional_group';
  let Icon;
  let colorClass;

  if (isFunctionalGroup) {
    Icon = isExpanded ? FolderOpen : Folder;
    colorClass = COLOR_MAP.slate;
  } else {
    Icon = ICON_MAP[nodeType.icon] || Box;
    colorClass = COLOR_MAP[nodeType.color] || COLOR_MAP.gray;
  }

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded-full border ${colorClass} ${sizeClasses[size]} ${isFunctionalGroup ? 'border-dashed' : ''}`}
        title={isFunctionalGroup ? 'Functional Group - organizational only' : nodeType.description}
      >
        <Icon className={iconSizes[size]} />
        {showLabel && (
          <span className="font-medium">
            {isFunctionalGroup ? 'Functional Group' : nodeType.name}
          </span>
        )}
      </span>
      {!nodeType.isPhysical && !isFunctionalGroup && (
        <span className="text-xs text-[#6B7280] italic">(non-physical)</span>
      )}
      {showRestrictions && isFunctionalGroup && (
        <span
          className="inline-flex items-center gap-0.5 text-xs text-[#6B7280]"
          title="No attachments, revisions, or phase tracking"
        >
          <FileX className="w-3 h-3" />
        </span>
      )}
      {showDescription && (
        <span className="text-xs text-[#6B7280] ml-1">
          {isFunctionalGroup ? nodeClassConfig?.description : nodeType.description}
        </span>
      )}
    </div>
  );
}

export default NodeTypeBadge;
