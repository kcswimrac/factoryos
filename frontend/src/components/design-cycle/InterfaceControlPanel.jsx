import React, { useState } from 'react';
import {
  Link2,
  Box,
  Crosshair,
  Zap,
  Droplet,
  Cpu,
  Ruler,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { INTERFACE_TYPES } from '../../config/designPhases';

const INTERFACE_ICONS = {
  mechanical_envelope: Box,
  mounting_datums: Crosshair,
  electrical: Zap,
  fluid: Droplet,
  software: Cpu,
  tolerance_stack: Ruler
};

const APPROVAL_STATUS = {
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
  }
};

function AdjacentNodeApproval({ node, onApprove, onReject, canApprove }) {
  const status = APPROVAL_STATUS[node.approvalStatus] || APPROVAL_STATUS.pending;
  const StatusIcon = status.icon;

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      node.approvalStatus === 'rejected' ? 'border-red-500/50 bg-red-500/5' :
      node.approvalStatus === 'approved' ? 'border-green-500/50 bg-green-500/5' :
      'border-gray-700 bg-gray-800/30'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${status.color}`}>
          <Link2 className={`w-4 h-4 ${status.textColor}`} />
        </div>
        <div>
          <span className="text-sm font-medium text-white">{node.nodeName}</span>
          <p className="text-xs text-gray-500">{node.nodeType}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusIcon className={`w-4 h-4 ${status.textColor}`} />
        <span className={`text-xs ${status.textColor}`}>{status.label}</span>

        {canApprove && node.approvalStatus === 'pending' && (
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => onApprove(node.nodeId)}
              className="p-1 text-green-400 hover:bg-green-500/20 rounded"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => onReject(node.nodeId)}
              className="p-1 text-red-400 hover:bg-red-500/20 rounded"
              title="Reject"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InterfaceCard({ interfaceType, interfaceData, onEdit, onDelete, expanded, onToggle }) {
  const typeConfig = INTERFACE_TYPES.find(t => t.key === interfaceType.key);
  const Icon = INTERFACE_ICONS[interfaceType.key] || Link2;
  const isComplete = interfaceData?.isComplete;

  return (
    <div className={`border rounded-lg overflow-hidden ${
      !isComplete && typeConfig?.required ? 'border-yellow-500/50' : 'border-gray-700'
    }`}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-800/50"
        onClick={onToggle}
      >
        <div className={`p-2 rounded-lg ${
          isComplete ? 'bg-green-500/20' : 'bg-gray-700/50'
        }`}>
          <Icon className={`w-5 h-5 ${isComplete ? 'text-green-400' : 'text-gray-400'}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{typeConfig?.name}</span>
            {typeConfig?.required && (
              <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                Required
              </span>
            )}
            {typeConfig?.conditional && (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                Conditional
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">{typeConfig?.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            !typeConfig?.conditional && <AlertTriangle className="w-4 h-4 text-yellow-400" />
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {expanded && interfaceData && (
        <div className="p-4 bg-gray-900/50 border-t border-gray-700 space-y-4">
          {/* Interface Details */}
          {interfaceData.specification && (
            <div>
              <span className="text-xs text-gray-500">Specification</span>
              <p className="text-sm text-gray-300 mt-1 font-mono bg-gray-800 p-2 rounded">
                {interfaceData.specification}
              </p>
            </div>
          )}

          {interfaceData.notes && (
            <div>
              <span className="text-xs text-gray-500">Notes</span>
              <p className="text-sm text-gray-300 mt-1">{interfaceData.notes}</p>
            </div>
          )}

          {/* Attached Documents */}
          {interfaceData.documents && interfaceData.documents.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">Attached Documents</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {interfaceData.documents.map((doc, idx) => (
                  <a
                    key={idx}
                    href={doc.url}
                    className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    {doc.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-700">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(interfaceType.key); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            {!typeConfig?.required && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(interfaceType.key); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InterfaceControlPanel({
  interfaces = {},
  adjacentNodes = [],
  rigorTier = 2,
  onEditInterface,
  onDeleteInterface,
  onAddInterface,
  onApproveNode,
  onRejectNode,
  currentUserId
}) {
  const [expandedKey, setExpandedKey] = useState(null);

  const requiredInterfaces = INTERFACE_TYPES.filter(t => t.required);
  const conditionalInterfaces = INTERFACE_TYPES.filter(t => t.conditional);

  const completedRequired = requiredInterfaces.filter(t => interfaces[t.key]?.isComplete).length;
  const allRequiredComplete = completedRequired === requiredInterfaces.length;

  const allNodesApproved = adjacentNodes.every(n => n.approvalStatus === 'approved');
  const requiresApproval = rigorTier >= 2;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Link2 className="w-5 h-5 text-violet-400" />
          Interface Control Document
        </h3>

        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
          allRequiredComplete && (!requiresApproval || allNodesApproved)
            ? 'bg-green-500/20 text-green-400'
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {allRequiredComplete ? (
            <>
              <CheckCircle className="w-4 h-4" />
              ICD Complete
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" />
              {completedRequired}/{requiredInterfaces.length} Required
            </>
          )}
        </div>
      </div>

      {/* Adjacent Node Approvals (Tier 2+) */}
      {requiresApproval && adjacentNodes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-400">Adjacent Node Approvals</span>
            <span className={`text-xs ${allNodesApproved ? 'text-green-400' : 'text-yellow-400'}`}>
              {adjacentNodes.filter(n => n.approvalStatus === 'approved').length}/{adjacentNodes.length} approved
            </span>
          </div>
          <div className="space-y-2">
            {adjacentNodes.map(node => (
              <AdjacentNodeApproval
                key={node.nodeId}
                node={node}
                onApprove={onApproveNode}
                onReject={onRejectNode}
                canApprove={node.ownerId === currentUserId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Required Interfaces */}
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-400 mb-3 block">Required Interfaces</span>
        <div className="space-y-2">
          {requiredInterfaces.map(interfaceType => (
            <InterfaceCard
              key={interfaceType.key}
              interfaceType={interfaceType}
              interfaceData={interfaces[interfaceType.key]}
              onEdit={onEditInterface}
              onDelete={onDeleteInterface}
              expanded={expandedKey === interfaceType.key}
              onToggle={() => setExpandedKey(expandedKey === interfaceType.key ? null : interfaceType.key)}
            />
          ))}
        </div>
      </div>

      {/* Conditional Interfaces */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-400">Conditional Interfaces</span>
          <button
            onClick={onAddInterface}
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
          >
            <Plus className="w-3 h-3" />
            Add Interface
          </button>
        </div>
        <div className="space-y-2">
          {conditionalInterfaces.map(interfaceType => {
            const hasData = interfaces[interfaceType.key];
            if (!hasData) return null;

            return (
              <InterfaceCard
                key={interfaceType.key}
                interfaceType={interfaceType}
                interfaceData={interfaces[interfaceType.key]}
                onEdit={onEditInterface}
                onDelete={onDeleteInterface}
                expanded={expandedKey === interfaceType.key}
                onToggle={() => setExpandedKey(expandedKey === interfaceType.key ? null : interfaceType.key)}
              />
            );
          })}

          {!Object.keys(interfaces).some(k => conditionalInterfaces.find(c => c.key === k)) && (
            <p className="text-sm text-gray-500 text-center py-4">
              No conditional interfaces added
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterfaceControlPanel;
