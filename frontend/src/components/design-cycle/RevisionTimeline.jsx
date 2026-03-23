import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  Clock,
  User,
  ChevronRight,
  ChevronDown,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Eye,
  Plus
} from 'lucide-react';
import { REVISION_TRIGGERS } from '../../config/designPhases';

const LIFECYCLE_STATUS = {
  draft: {
    label: 'Draft',
    color: 'bg-gray-500',
    textColor: 'text-gray-400',
    description: 'Work in progress'
  },
  candidate: {
    label: 'Candidate',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    description: 'Ready for review'
  },
  released: {
    label: 'Released',
    color: 'bg-green-500',
    textColor: 'text-green-400',
    description: 'Approved for use'
  },
  superseded: {
    label: 'Superseded',
    color: 'bg-purple-500',
    textColor: 'text-purple-400',
    description: 'Replaced by newer revision'
  }
};

const PHASE_CARRY_STATUS = {
  inherited: {
    label: 'Inherited',
    color: 'text-blue-400',
    icon: ArrowRight,
    description: 'Carried forward unchanged'
  },
  verified: {
    label: 'Verified',
    color: 'text-green-400',
    icon: CheckCircle,
    description: 'Reviewed and confirmed valid'
  },
  reopened: {
    label: 'Reopened',
    color: 'text-yellow-400',
    icon: AlertCircle,
    description: 'Needs re-work due to changes'
  }
};

function RevisionCard({ revision, isLatest, isCurrent, onSelect, onViewDiff, expanded, onToggle }) {
  const lifecycle = LIFECYCLE_STATUS[revision.lifecycle] || LIFECYCLE_STATUS.draft;
  const trigger = REVISION_TRIGGERS.find(t => t.key === revision.triggerType);

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      isCurrent ? 'border-violet-500 bg-violet-500/10' :
      isLatest ? 'border-green-500/50' : 'border-gray-700'
    }`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-800/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <GitCommit className={`w-5 h-5 ${
            isCurrent ? 'text-violet-400' : isLatest ? 'text-green-400' : 'text-gray-500'
          }`} />
          <span className="font-mono font-bold text-white">{revision.label}</span>
        </div>

        <div className={`px-2 py-0.5 rounded-full text-xs ${lifecycle.color}/20 ${lifecycle.textColor}`}>
          {lifecycle.label}
        </div>

        {isLatest && (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
            Latest
          </span>
        )}

        {isCurrent && (
          <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs rounded-full">
            Current
          </span>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(revision.createdAt).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {revision.createdBy}
          </span>
        </div>

        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </div>

      {expanded && (
        <div className="p-4 bg-gray-900/50 border-t border-gray-700 space-y-4">
          {/* Trigger Info */}
          {trigger && (
            <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
              <RotateCcw className="w-4 h-4 text-violet-400 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-white">{trigger.name}</span>
                <p className="text-xs text-gray-400 mt-0.5">{trigger.description}</p>
              </div>
            </div>
          )}

          {/* Change Summary */}
          {revision.changeSummary && (
            <div>
              <span className="text-xs text-gray-500">Change Summary</span>
              <p className="text-sm text-gray-300 mt-1">{revision.changeSummary}</p>
            </div>
          )}

          {/* Phase Carry-forward Status */}
          {revision.phaseStates && (
            <div>
              <span className="text-xs text-gray-500 mb-2 block">Phase Carry-forward Status</span>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {Object.entries(revision.phaseStates).map(([phaseKey, state]) => {
                  const statusConfig = PHASE_CARRY_STATUS[state] || PHASE_CARRY_STATUS.inherited;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={phaseKey}
                      className="p-2 bg-gray-800 rounded text-center"
                      title={statusConfig.description}
                    >
                      <span className="text-xs font-mono text-gray-500 block">{phaseKey}</span>
                      <StatusIcon className={`w-4 h-4 mx-auto mt-1 ${statusConfig.color}`} />
                      <span className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Learning Loop Link */}
          {revision.learningLoopId && (
            <div className="flex items-center gap-2 p-2 bg-violet-500/10 border border-violet-500/30 rounded-lg">
              <RotateCcw className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">
                Linked to Learning Loop #{revision.learningLoopId}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-700">
            {!isCurrent && (
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(revision); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Revision
              </button>
            )}
            {revision.parentRevisionId && (
              <button
                onClick={(e) => { e.stopPropagation(); onViewDiff(revision); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Changes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RevisionTimeline({
  revisions = [],
  currentRevisionId,
  onSelectRevision,
  onViewDiff,
  onCreateRevision,
  canCreateRevision = true
}) {
  const [expandedId, setExpandedId] = useState(null);

  const sortedRevisions = [...revisions].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const latestRevisionId = sortedRevisions[0]?.id;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-violet-400" />
          Revision History
        </h3>

        {canCreateRevision && (
          <button
            onClick={onCreateRevision}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Revision
          </button>
        )}
      </div>

      {revisions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <GitBranch className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No revisions yet</p>
          <p className="text-xs mt-1">Complete Phase 7 to create your first revision</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-700" />

          <div className="space-y-3">
            {sortedRevisions.map((revision) => (
              <RevisionCard
                key={revision.id}
                revision={revision}
                isLatest={revision.id === latestRevisionId}
                isCurrent={revision.id === currentRevisionId}
                onSelect={onSelectRevision}
                onViewDiff={onViewDiff}
                expanded={expandedId === revision.id}
                onToggle={() => setExpandedId(expandedId === revision.id ? null : revision.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Revision Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <span className="text-xs text-gray-500 mb-2 block">Phase Carry-forward Legend</span>
        <div className="flex flex-wrap gap-4">
          {Object.entries(PHASE_CARRY_STATUS).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <Icon className={`w-3 h-3 ${config.color}`} />
                <span className={config.color}>{config.label}</span>
                <span className="text-gray-600">- {config.description}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default RevisionTimeline;
