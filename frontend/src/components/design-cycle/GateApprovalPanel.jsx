import React, { useState } from 'react';
import {
  DollarSign,
  Shield,
  Factory,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Lock
} from 'lucide-react';
import { GATE_TYPES, RIGOR_TIERS } from '../../config/designPhases';

const GATE_ICONS = {
  cost: DollarSign,
  safety: Shield,
  manufacturability: Factory,
  serviceability: Wrench
};

const STATUS_CONFIG = {
  not_required: {
    label: 'Not Required',
    color: 'bg-gray-500/20',
    textColor: 'text-gray-400',
    icon: null
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    icon: Clock
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-500/20',
    textColor: 'text-green-400',
    icon: CheckCircle
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500/20',
    textColor: 'text-red-400',
    icon: XCircle
  },
  blocked: {
    label: 'Blocked',
    color: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    icon: AlertTriangle
  }
};

function GateCard({ gateKey, gate, gateData, rigorTier, onApprove, onReject, onComment, currentUserId }) {
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState('');

  const Icon = GATE_ICONS[gateKey] || Shield;
  const isRequired = RIGOR_TIERS[rigorTier]?.requiredGates?.includes(gateKey);
  const status = !isRequired ? 'not_required' : (gate?.status || 'pending');
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  const isOwner = gate?.ownerId === currentUserId;
  const canApprove = isRequired && status === 'pending' && isOwner;

  return (
    <div className={`border rounded-lg overflow-hidden ${
      status === 'rejected' ? 'border-red-500/50' :
      status === 'approved' ? 'border-green-500/50' :
      'border-gray-700'
    }`}>
      <div
        className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-800/50 transition-colors ${
          expanded ? 'bg-gray-800/30' : ''
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`p-2 rounded-lg ${statusConfig.color}`}>
          <Icon className={`w-5 h-5 ${statusConfig.textColor}`} />
        </div>

        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{gateData.name}</h4>
          <p className="text-xs text-gray-500">{gateData.ownerRole}</p>
        </div>

        <div className="flex items-center gap-2">
          {StatusIcon && <StatusIcon className={`w-4 h-4 ${statusConfig.textColor}`} />}
          <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.color} ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-gray-900/50 border-t border-gray-700 space-y-4">
          <p className="text-sm text-gray-400">{gateData.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Triggered at:</span>
              <span className="text-gray-300 ml-2">
                Phase {gateData.triggeredAtPhase}
                {gateData.triggeredAtSubPhase && gateData.triggeredAtSubPhase}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Owner:</span>
              <span className="text-gray-300 ml-2">
                {gate?.ownerName || gateData.ownerRole}
              </span>
            </div>
          </div>

          {gate?.approvedAt && (
            <div className="text-sm">
              <span className="text-gray-500">Approved:</span>
              <span className="text-green-400 ml-2">
                {new Date(gate.approvedAt).toLocaleDateString()} by {gate.approvedBy}
              </span>
            </div>
          )}

          {gate?.rejectedAt && (
            <div className="text-sm">
              <span className="text-gray-500">Rejected:</span>
              <span className="text-red-400 ml-2">
                {new Date(gate.rejectedAt).toLocaleDateString()} by {gate.rejectedBy}
              </span>
              {gate.rejectionReason && (
                <p className="text-red-300 mt-1 text-xs bg-red-500/10 p-2 rounded">
                  {gate.rejectionReason}
                </p>
              )}
            </div>
          )}

          {/* Comments */}
          {gate?.comments && gate.comments.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-gray-500">Comments</span>
              {gate.comments.map((c, idx) => (
                <div key={idx} className="bg-gray-800 rounded p-2 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-400 text-xs">{c.author}</span>
                    <span className="text-gray-600 text-xs">
                      {new Date(c.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300">{c.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {isRequired && status !== 'not_required' && (
            <div className="space-y-3 pt-2 border-t border-gray-700">
              {/* Comment Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={() => {
                    if (comment.trim()) {
                      onComment(gateKey, comment);
                      setComment('');
                    }
                  }}
                  disabled={!comment.trim()}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>

              {/* Approve/Reject Buttons */}
              {canApprove && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onApprove(gateKey)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Gate
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Rejection reason:');
                      if (reason) onReject(gateKey, reason);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {!canApprove && status === 'pending' && (
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Only the gate owner ({gateData.ownerRole}) can approve this gate
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GateApprovalPanel({ gates = {}, rigorTier = 2, onApprove, onReject, onComment, currentUserId }) {
  const requiredGates = RIGOR_TIERS[rigorTier]?.requiredGates || [];
  const allGatesApproved = requiredGates.every(g => gates[g]?.status === 'approved');
  const hasRejections = requiredGates.some(g => gates[g]?.status === 'rejected');

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-400" />
          Gate Approvals
        </h3>

        {requiredGates.length > 0 && (
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
            allGatesApproved
              ? 'bg-green-500/20 text-green-400'
              : hasRejections
              ? 'bg-red-500/20 text-red-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {allGatesApproved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                All Gates Approved
              </>
            ) : hasRejections ? (
              <>
                <XCircle className="w-4 h-4" />
                Gate Rejected
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                {requiredGates.filter(g => gates[g]?.status === 'approved').length}/{requiredGates.length} Approved
              </>
            )}
          </div>
        )}
      </div>

      {requiredGates.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No gates required for Tier {rigorTier}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(GATE_TYPES).map(([gateKey, gateData]) => (
            <GateCard
              key={gateKey}
              gateKey={gateKey}
              gate={gates[gateKey]}
              gateData={gateData}
              rigorTier={rigorTier}
              onApprove={onApprove}
              onReject={onReject}
              onComment={onComment}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default GateApprovalPanel;
