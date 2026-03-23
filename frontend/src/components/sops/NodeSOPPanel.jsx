import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Wrench,
  Factory,
  TestTube,
  Settings,
  Eye,
  AlertCircle,
  Globe,
  Building2,
  FolderOpen,
  FileCode
} from 'lucide-react';

// SOP Type configurations
const SOP_TYPES = {
  manufacturing: { label: 'Manufacturing', short: 'Mfg', icon: Factory, color: 'text-blue-400' },
  assembly: { label: 'Assembly', short: 'Assy', icon: Settings, color: 'text-purple-400' },
  test_execution: { label: 'Test Execution', short: 'Test', icon: TestTube, color: 'text-green-400' },
  service: { label: 'Service', short: 'Svc', icon: Wrench, color: 'text-amber-400' },
  inspection: { label: 'Inspection', short: 'Insp', icon: Eye, color: 'text-cyan-400' },
  rework_containment: { label: 'Rework', short: 'Rework', icon: AlertCircle, color: 'text-red-400' }
};

// SOP Scope configurations
const SOP_SCOPES = {
  global: { label: 'Global', icon: Globe, color: 'text-emerald-400' },
  org: { label: 'Org', icon: Building2, color: 'text-blue-400' },
  project: { label: 'Project', icon: FolderOpen, color: 'text-purple-400' },
  node: { label: 'Node', icon: FileCode, color: 'text-amber-400' },
  node_revision: { label: 'Rev', icon: FileCode, color: 'text-orange-400' }
};

// Status configurations
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-slate-500/20 text-slate-400 border-slate-500/40', icon: FileText },
  in_review: { label: 'In Review', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500/20 text-green-400 border-green-500/40', icon: CheckCircle },
  obsolete: { label: 'Obsolete', color: 'bg-red-500/20 text-red-400 border-red-500/40', icon: XCircle }
};

function NodeSOPPanel({ nodeId, nodeName, nodeRevisionId, projectId, sops = [] }) {
  const navigate = useNavigate();

  const handleCreateSOP = () => {
    // Navigate to SOP creation with node preselected
    navigate(`/sops/new?nodeId=${nodeId}&projectId=${projectId}`);
  };

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-4">
      {/* Header with Alpha Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-semibold text-[#F0F2F4]">SOPs</h3>
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded">
            ALPHA
          </span>
        </div>
        <button
          onClick={handleCreateSOP}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          New SOP
        </button>
      </div>

      {/* SOPs List */}
      {sops.length === 0 ? (
        <div className="text-center py-6">
          <ClipboardList className="w-8 h-8 text-[#4B5563] mx-auto mb-2" />
          <p className="text-xs text-[#6B7280]">No SOPs directly linked to this node</p>
          <p className="text-xs text-[#4B5563] mt-1">Global, Org, and Project SOPs may still apply</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sops.map(sop => {
            const typeConfig = SOP_TYPES[sop.sop_type];
            const statusConfig = STATUS_CONFIG[sop.status];
            const scopeConfig = SOP_SCOPES[sop.sop_scope_type];
            const TypeIcon = typeConfig?.icon || FileText;
            const StatusIcon = statusConfig?.icon || FileText;
            const ScopeIcon = scopeConfig?.icon || FileText;

            return (
              <Link
                key={sop.id}
                to={`/sops/${sop.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1C1F24] transition-colors group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <TypeIcon className={`w-4 h-4 flex-shrink-0 ${typeConfig?.color || 'text-gray-400'}`} />
                    {scopeConfig && sop.sop_scope_type !== 'node' && sop.sop_scope_type !== 'node_revision' && (
                      <ScopeIcon className={`w-3 h-3 flex-shrink-0 ${scopeConfig?.color || 'text-gray-400'}`} title={`${scopeConfig?.label} scope`} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-blue-400">{sop.global_artifact_id}</p>
                    <p className="text-sm text-[#F0F2F4] truncate group-hover:text-blue-400 transition-colors">
                      {sop.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border ${statusConfig?.color}`}>
                    <StatusIcon className="w-2.5 h-2.5" />
                    {statusConfig?.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#6B7280] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* View All Link */}
      {sops.length > 0 && (
        <Link
          to={`/sops?nodeId=${nodeId}`}
          className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-[#2A2F36] text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View all SOPs for this node
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

export default NodeSOPPanel;
