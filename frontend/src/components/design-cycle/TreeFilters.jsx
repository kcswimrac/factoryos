import React, { useState } from 'react';
import {
  Filter,
  X,
  ChevronDown,
  Box,
  Shield,
  AlertTriangle,
  GitBranch,
  RotateCcw
} from 'lucide-react';
import { NODE_TYPES, RIGOR_TIERS } from '../../config/designPhases';

function TreeFilters({
  filters,
  onChange,
  onReset,
  nodeCount = 0,
  filteredCount = 0
}) {
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters = filters.nodeTypes?.length > 0 ||
    filters.tiers?.length > 0 ||
    filters.gateStatus ||
    filters.revisionState;

  const handleNodeTypeToggle = (type) => {
    const current = filters.nodeTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onChange({ ...filters, nodeTypes: updated });
  };

  const handleTierToggle = (tier) => {
    const current = filters.tiers || [];
    const updated = current.includes(tier)
      ? current.filter(t => t !== tier)
      : [...current, tier];
    onChange({ ...filters, tiers: updated });
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg">
      {/* Filter Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-white">Filters</span>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 text-xs bg-violet-500/20 text-violet-400 rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {filteredCount} of {nodeCount} nodes
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expanded Filters */}
      {expanded && (
        <div className="p-4 border-t border-gray-700 space-y-4">
          {/* Node Type Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase">Node Type</span>
              {filters.nodeTypes?.length > 0 && (
                <button
                  onClick={() => onChange({ ...filters, nodeTypes: [] })}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(NODE_TYPES).map(type => (
                <button
                  key={type.code}
                  onClick={() => handleNodeTypeToggle(type.code)}
                  className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                    filters.nodeTypes?.includes(type.code)
                      ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                      : 'bg-gray-700/30 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Rigor Tier Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase">Rigor Tier</span>
              {filters.tiers?.length > 0 && (
                <button
                  onClick={() => onChange({ ...filters, tiers: [] })}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {Object.entries(RIGOR_TIERS).map(([tier, config]) => (
                <button
                  key={tier}
                  onClick={() => handleTierToggle(parseInt(tier))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    filters.tiers?.includes(parseInt(tier))
                      ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                      : 'bg-gray-700/30 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Tier {tier}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Gate Status Filter */}
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase block mb-2">Gate Status</span>
            <div className="flex gap-2">
              {[
                { key: null, label: 'All', icon: null },
                { key: 'blocked', label: 'Blocked', icon: AlertTriangle },
                { key: 'pending', label: 'Pending', icon: Shield },
                { key: 'approved', label: 'Approved', icon: Shield }
              ].map(status => (
                <button
                  key={status.key || 'all'}
                  onClick={() => onChange({ ...filters, gateStatus: status.key })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    filters.gateStatus === status.key
                      ? status.key === 'blocked'
                        ? 'bg-red-500/20 border-red-500 text-red-400'
                        : status.key === 'pending'
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                        : status.key === 'approved'
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : 'bg-violet-500/20 border-violet-500 text-violet-400'
                      : 'bg-gray-700/30 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {status.icon && <status.icon className="w-3.5 h-3.5" />}
                  <span>{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Revision State Filter */}
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase block mb-2">Revision State</span>
            <div className="flex gap-2">
              {[
                { key: null, label: 'All' },
                { key: 'draft', label: 'Draft' },
                { key: 'candidate', label: 'Candidate' },
                { key: 'released', label: 'Released' }
              ].map(state => (
                <button
                  key={state.key || 'all'}
                  onClick={() => onChange({ ...filters, revisionState: state.key })}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    filters.revisionState === state.key
                      ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                      : 'bg-gray-700/30 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {state.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-700">
              <button
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TreeFilters;
