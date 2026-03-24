import React from 'react';
import { Wrench, Hammer, Target, ScanLine, Package } from 'lucide-react';

const FIXTURE_CONFIG = {
  weld_fixture: {
    label: 'Weld Fixture',
    icon: Hammer,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30'
  },
  assembly_fixture: {
    label: 'Assembly Fixture',
    icon: Wrench,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30'
  },
  drill_fixture: {
    label: 'Drill Fixture',
    icon: Target,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30'
  },
  inspection_fixture: {
    label: 'Inspection Fixture',
    icon: ScanLine,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30'
  },
  handling_fixture: {
    label: 'Handling Fixture',
    icon: Package,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30'
  }
};

function FixtureTypeBadge({ type, size = 'md', showLabel = true }) {
  const config = FIXTURE_CONFIG[type] || FIXTURE_CONFIG.assembly_fixture;
  const Icon = config.icon;

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
    <span
      className={`
        inline-flex items-center gap-1 rounded border
        ${sizeClasses[size]}
        ${config.bgColor}
        ${config.color}
        ${config.borderColor}
      `}
      title={config.label}
    >
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export default FixtureTypeBadge;
