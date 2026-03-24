import React from 'react';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { RIGOR_TIERS } from '../../config/designPhases';

const TIER_ICONS = {
  1: Shield,
  2: ShieldCheck,
  3: ShieldAlert
};

const TIER_COLORS = {
  1: {
    bg: 'bg-gray-500/20',
    border: 'border-gray-500/30',
    text: 'text-gray-400',
    icon: 'text-gray-400'
  },
  2: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: 'text-blue-400'
  },
  3: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: 'text-red-400'
  }
};

function RigorTierBadge({ tier, size = 'md', showLabel = true, showDescription = false }) {
  const tierData = RIGOR_TIERS[tier];
  const colors = TIER_COLORS[tier] || TIER_COLORS[1];
  const Icon = TIER_ICONS[tier] || Shield;

  if (!tierData) return null;

  const sizeClasses = {
    sm: {
      container: 'px-2 py-0.5',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      container: 'px-3 py-1',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      container: 'px-4 py-2',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="inline-flex flex-col">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.border} ${sizes.container}`}
      >
        <Icon className={`${sizes.icon} ${colors.icon}`} />
        {showLabel && (
          <span className={`font-medium ${sizes.text} ${colors.text}`}>
            Tier {tier}: {tierData.name}
          </span>
        )}
      </div>
      {showDescription && (
        <p className="text-xs text-[#6B7280] mt-1 max-w-xs">
          {tierData.description}
        </p>
      )}
    </div>
  );
}

export default RigorTierBadge;
