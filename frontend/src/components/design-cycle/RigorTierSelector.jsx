import React from 'react';
import { Shield, ShieldCheck, ShieldAlert, Check, Info } from 'lucide-react';
import { RIGOR_TIERS } from '../../config/designPhases';

const TIER_ICONS = {
  1: Shield,
  2: ShieldCheck,
  3: ShieldAlert
};

const TIER_COLORS = {
  1: {
    selected: 'border-gray-400 bg-gray-500/20',
    hover: 'hover:border-gray-500 hover:bg-gray-500/10',
    icon: 'text-gray-400'
  },
  2: {
    selected: 'border-blue-400 bg-blue-500/20',
    hover: 'hover:border-blue-500 hover:bg-blue-500/10',
    icon: 'text-blue-400'
  },
  3: {
    selected: 'border-red-400 bg-red-500/20',
    hover: 'hover:border-red-500 hover:bg-red-500/10',
    icon: 'text-red-400'
  }
};

function RigorTierSelector({ selectedTier, onSelect, disabled = false, showRequirements = true }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-300">Rigor Tier</h3>
        <div className="group relative">
          <Info className="w-4 h-4 text-gray-500 cursor-help" />
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 w-64 shadow-xl">
              <p className="font-medium mb-1">Rigor tiers determine:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li>Required gate approvals</li>
                <li>Requirement trace coverage threshold</li>
                <li>Interface approval requirements</li>
                <li>Artifact signing requirements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(RIGOR_TIERS).map(([tierNum, tierData]) => {
          const tier = parseInt(tierNum);
          const Icon = TIER_ICONS[tier];
          const colors = TIER_COLORS[tier];
          const isSelected = selectedTier === tier;

          return (
            <button
              key={tier}
              onClick={() => !disabled && onSelect(tier)}
              disabled={disabled}
              className={`relative p-4 rounded-lg border-2 transition-all text-left ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${
                isSelected
                  ? colors.selected
                  : `border-gray-700 bg-gray-800/50 ${colors.hover}`
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${colors.icon}`} />
                <span className="font-medium text-white">
                  Tier {tier}: {tierData.name}
                </span>
              </div>

              <p className="text-xs text-gray-400 mb-3">{tierData.description}</p>

              {showRequirements && (
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Trace Coverage:</span>
                    <span className="text-gray-300">{tierData.requirementTraceCoverage * 100}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Gates Required:</span>
                    <span className="text-gray-300">
                      {tierData.requiredGates.length === 0
                        ? 'None'
                        : tierData.requiredGates.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Interface Approval:</span>
                    <span className={tierData.requiresInterfaceApproval ? 'text-yellow-400' : 'text-gray-500'}>
                      {tierData.requiresInterfaceApproval ? 'Required' : 'Optional'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Signed Artifacts:</span>
                    <span className={tierData.requiresSignedArtifacts ? 'text-red-400' : 'text-gray-500'}>
                      {tierData.requiresSignedArtifacts ? 'Required' : 'Optional'}
                    </span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RigorTierSelector;
