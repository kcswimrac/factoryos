import React from 'react';
import {
  Folder,
  FolderOpen,
  Package,
  Wrench,
  FlaskConical,
  Lock,
  FileX
} from 'lucide-react';
import { getNodeClassConfig, NODE_CLASSES } from '../../config/designPhases';

const ICON_MAP = {
  Folder,
  FolderOpen,
  Package,
  Wrench,
  FlaskConical
};

/**
 * NodeClassBadge - Renders a badge indicating the node class
 *
 * Functional groups render as folders to indicate organizational nature
 * Product nodes render as packages
 * Manufacturing/test assets have their own distinct styles
 *
 * Shows visual indicators when attachments/revisions are disallowed
 */
function NodeClassBadge({
  nodeClass,
  size = 'md',
  showLabel = true,
  showRestrictions = true,
  isExpanded = false,
  className = ''
}) {
  const config = getNodeClassConfig(nodeClass);

  if (!config) {
    return null;
  }

  // For functional groups, use folder icons based on expanded state
  let IconComponent;
  if (config.code === 'functional_group') {
    IconComponent = isExpanded ? FolderOpen : Folder;
  } else {
    IconComponent = ICON_MAP[config.icon] || Package;
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

  const isFunctionalGroup = config.code === 'functional_group';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`
          inline-flex items-center gap-1 rounded border
          ${config.bgColor}
          ${config.textColor}
          ${config.borderColor}
          ${sizeClasses[size]}
          ${isFunctionalGroup ? 'border-dashed' : ''}
        `}
        title={config.description}
      >
        <IconComponent className={iconSizes[size]} />
        {showLabel && (
          <span className="font-medium">{config.name}</span>
        )}
      </span>

      {/* Show restrictions for functional groups */}
      {showRestrictions && isFunctionalGroup && (
        <span
          className="inline-flex items-center gap-0.5 text-xs text-[#6B7280]"
          title="No attachments, revisions, or phase tracking allowed"
        >
          <FileX className="w-3 h-3" />
          <span className="hidden sm:inline">No attachments</span>
        </span>
      )}
    </div>
  );
}

/**
 * NodeClassIndicator - Compact indicator for tree views
 * Shows just an icon with tooltip for space-constrained contexts
 */
export function NodeClassIndicator({ nodeClass, isExpanded = false, className = '' }) {
  const config = getNodeClassConfig(nodeClass);

  if (!config) return null;

  let IconComponent;
  if (config.code === 'functional_group') {
    IconComponent = isExpanded ? FolderOpen : Folder;
  } else {
    IconComponent = ICON_MAP[config.icon] || Package;
  }

  const isFunctionalGroup = config.code === 'functional_group';

  return (
    <span
      className={`
        inline-flex items-center justify-center w-5 h-5 rounded
        ${config.bgColor}
        ${config.textColor}
        ${isFunctionalGroup ? 'border border-dashed' : ''}
        ${config.borderColor}
        ${className}
      `}
      title={`${config.name}: ${config.description}`}
    >
      <IconComponent className="w-3 h-3" />
    </span>
  );
}

/**
 * FunctionalGroupHeader - Special header style for functional group nodes
 * Renders like a folder with visual separation from physical nodes
 */
export function FunctionalGroupHeader({
  name,
  partNumber,
  isExpanded = false,
  childCount = 0,
  className = ''
}) {
  const Icon = isExpanded ? FolderOpen : Folder;

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        bg-[#1C1F24]/30 border border-dashed border-[#2A2F36]/50
        hover:bg-[#22262C]/30 transition-colors cursor-pointer
        ${className}
      `}
    >
      <Icon className="w-5 h-5 text-[#B4BAC4]" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#F0F2F4] truncate">{name}</span>
          {partNumber && (
            <span className="text-xs text-[#6B7280] font-mono">{partNumber}</span>
          )}
        </div>
      </div>
      {childCount > 0 && (
        <span className="text-xs text-[#6B7280] bg-[#2A2F36]/50 px-1.5 py-0.5 rounded">
          {childCount} items
        </span>
      )}
    </div>
  );
}

/**
 * PhysicalNodeHeader - Header style for product/asset nodes
 * Shows full capabilities (attachments, revisions, phase indicator)
 */
export function PhysicalNodeHeader({
  name,
  partNumber,
  nodeClass,
  revision,
  phase,
  aiScore,
  hasAttachments = false,
  className = ''
}) {
  const config = getNodeClassConfig(nodeClass);
  const IconComponent = ICON_MAP[config?.icon] || Package;

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        bg-[#1C1F24]/50 border border-[#2A2F36]
        hover:bg-[#22262C]/50 transition-colors cursor-pointer
        ${className}
      `}
    >
      <span className={`p-1 rounded ${config?.bgColor || 'bg-blue-500/20'}`}>
        <IconComponent className={`w-4 h-4 ${config?.textColor || 'text-blue-400'}`} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#F0F2F4] truncate">{name}</span>
          {partNumber && (
            <span className="text-xs text-[#6B7280] font-mono">{partNumber}</span>
          )}
          {revision && (
            <span className="text-xs text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">
              Rev {revision}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {phase && (
          <span className="text-xs text-[#6B7280]">
            Phase {phase}
          </span>
        )}
        {aiScore !== undefined && aiScore !== null && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            aiScore >= 90 ? 'bg-green-500/20 text-green-400' :
            aiScore >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {aiScore}%
          </span>
        )}
        {hasAttachments && (
          <span className="text-xs text-[#6B7280]">
            <Package className="w-3 h-3" />
          </span>
        )}
      </div>
    </div>
  );
}

export default NodeClassBadge;
