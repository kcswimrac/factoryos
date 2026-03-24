import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Package,
  Box,
  Wrench,
  FlaskConical,
  FileText,
  Paperclip,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileBox,
  ClipboardCheck,
  Beaker,
  LineChart,
  Scale,
  Activity,
  Image,
  Link2,
  Upload,
  ExternalLink,
  Layers,
  Cog,
  FileBarChart,
  ClipboardList
} from 'lucide-react';
import { getNodeClassConfig, nodeClassAllowsAttachments } from '../../config/designPhases';
import {
  buildTreeViewModel,
  findNodeById,
  getSelectionType,
  VIRTUAL_FOLDER_TYPES,
  VIRTUAL_FOLDER_CONFIG,
  ARTIFACT_TYPES,
  TYPE_BADGES,
  getNodeArtifactSummary
} from '../../utils/treeViewUtils';
import { DEMO_SOPS } from '../../data/demoSOPs';
import { getNodeSupplierConstraintStatus, getNodeSupplierConstraintSummary, getSupplierRequirementsByNode, getPropagatedRequirementsForNode, getRequirementLink, getSupplierSourceById } from '../../data/demoSupplierRequirements';
import NodeManufactureButton from './NodeManufactureButton';

// =============================================================================
// ICON MAPPING
// =============================================================================

const ICON_MAP = {
  // Virtual folders
  [VIRTUAL_FOLDER_TYPES.CAD_DRAWINGS]: FileBox,
  [VIRTUAL_FOLDER_TYPES.STUDIES]: FlaskConical,
  [VIRTUAL_FOLDER_TYPES.TESTS]: ClipboardCheck,
  [VIRTUAL_FOLDER_TYPES.FIXTURES]: Wrench,
  // Artifacts
  [ARTIFACT_TYPES.CAD]: FileBox,
  [ARTIFACT_TYPES.DRAWING]: FileText,
  [ARTIFACT_TYPES.STUDY_DOE]: Beaker,
  [ARTIFACT_TYPES.STUDY_PARAMETRIC]: LineChart,
  [ARTIFACT_TYPES.STUDY_SENSITIVITY]: Activity,
  [ARTIFACT_TYPES.STUDY_TRADE]: Scale,
  [ARTIFACT_TYPES.STUDY_RELIABILITY]: Activity,
  [ARTIFACT_TYPES.TEST_CASE]: ClipboardCheck,
  [ARTIFACT_TYPES.FIXTURE]: Wrench
};

const ICON_COLORS = {
  [VIRTUAL_FOLDER_TYPES.CAD_DRAWINGS]: 'text-violet-400',
  [VIRTUAL_FOLDER_TYPES.STUDIES]: 'text-cyan-400',
  [VIRTUAL_FOLDER_TYPES.TESTS]: 'text-green-400',
  [VIRTUAL_FOLDER_TYPES.FIXTURES]: 'text-orange-400',
  [ARTIFACT_TYPES.CAD]: 'text-violet-400',
  [ARTIFACT_TYPES.DRAWING]: 'text-blue-400',
  [ARTIFACT_TYPES.STUDY_DOE]: 'text-cyan-400',
  [ARTIFACT_TYPES.STUDY_PARAMETRIC]: 'text-teal-400',
  [ARTIFACT_TYPES.STUDY_SENSITIVITY]: 'text-teal-400',
  [ARTIFACT_TYPES.STUDY_TRADE]: 'text-amber-400',
  [ARTIFACT_TYPES.STUDY_RELIABILITY]: 'text-rose-400',
  [ARTIFACT_TYPES.TEST_CASE]: 'text-green-400',
  [ARTIFACT_TYPES.FIXTURE]: 'text-orange-400'
};

const ICON_BG_COLORS = {
  [VIRTUAL_FOLDER_TYPES.CAD_DRAWINGS]: 'bg-violet-500/10',
  [VIRTUAL_FOLDER_TYPES.STUDIES]: 'bg-cyan-500/10',
  [VIRTUAL_FOLDER_TYPES.TESTS]: 'bg-green-500/10',
  [VIRTUAL_FOLDER_TYPES.FIXTURES]: 'bg-orange-500/10',
  [ARTIFACT_TYPES.CAD]: 'bg-violet-500/20',
  [ARTIFACT_TYPES.DRAWING]: 'bg-blue-500/20',
  [ARTIFACT_TYPES.STUDY_DOE]: 'bg-cyan-500/20',
  [ARTIFACT_TYPES.STUDY_PARAMETRIC]: 'bg-teal-500/20',
  [ARTIFACT_TYPES.STUDY_SENSITIVITY]: 'bg-teal-500/20',
  [ARTIFACT_TYPES.STUDY_TRADE]: 'bg-amber-500/20',
  [ARTIFACT_TYPES.STUDY_RELIABILITY]: 'bg-rose-500/20',
  [ARTIFACT_TYPES.TEST_CASE]: 'bg-green-500/20',
  [ARTIFACT_TYPES.FIXTURE]: 'bg-orange-500/20'
};

// =============================================================================
// TREE NODE COMPONENT
// =============================================================================

function TreeNode({
  node,
  level = 0,
  expandedNodes,
  onToggle,
  onSelect,
  selectedNodeId
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNodeId === node.id;
  const isVirtualFolder = node.isVirtualFolder;
  const isArtifact = node.isArtifact;
  const nodeClassConfig = getNodeClassConfig(node.node_class);
  const isFunctionalGroup = node.node_class === 'functional_group';

  // Get icon based on node type
  const getIcon = () => {
    // Virtual folders and artifacts have specific icons
    if (ICON_MAP[node.node_class]) {
      return ICON_MAP[node.node_class];
    }

    // Standard node icons
    if (isFunctionalGroup) {
      return isExpanded ? FolderOpen : Folder;
    }
    switch (node.node_class) {
      case 'manufacturing_asset':
        return Wrench;
      case 'test_asset':
        return FlaskConical;
      default:
        return node.type === 'ASSY' ? Package : Box;
    }
  };

  // Get icon color
  const getIconColor = () => {
    if (ICON_COLORS[node.node_class]) {
      return ICON_COLORS[node.node_class];
    }
    return nodeClassConfig?.textColor || 'text-[#6B7280]';
  };

  // Get icon background color
  const getIconBgColor = () => {
    if (ICON_BG_COLORS[node.node_class]) {
      return ICON_BG_COLORS[node.node_class];
    }
    return nodeClassConfig?.bgColor || 'bg-[#1C1F24]';
  };

  const Icon = getIcon();

  // Get status indicator for artifacts
  const getStatusIndicator = () => {
    // Study/test status
    if (isArtifact) {
      if (node.status === 'passed' || node.status === 'complete') {
        return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      }
      if (node.status === 'in_progress') {
        return <Clock className="w-3 h-3 text-amber-400" />;
      }
      if (node.status === 'failed') {
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      }
      return null;
    }

    // Product node phase status
    if (node.phase_status === 'completed') {
      return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
    }
    if (node.phase_status === 'in_progress') {
      return <Clock className="w-3 h-3 text-amber-400" />;
    }
    if (node.phase && node.phase < 7) {
      return <span className="text-xs text-[#6B7280]">P{node.phase}</span>;
    }
    return null;
  };

  // Get type badge for artifacts
  const getTypeBadge = () => {
    const badge = TYPE_BADGES[node.node_class];
    if (badge) {
      return (
        <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${badge.color}`}>
          {badge.label}
        </span>
      );
    }
    return null;
  };

  // Count attachments (only for product nodes, not artifacts)
  const attachmentCount = !isArtifact && !isVirtualFolder ? (node.attachments?.length || 0) : 0;

  // Get display name
  const displayName = isArtifact
    ? (node.name || node.study_id || node.test_id || 'Unnamed')
    : node.name;

  // Get secondary identifier
  const secondaryId = isArtifact
    ? (node.study_id || node.test_id || node.part_number)
    : node.part_number;

  return (
    <div>
      <div
        className={`
          flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-colors
          ${isSelected
            ? 'bg-blue-500/15 border border-blue-500/40'
            : 'hover:bg-[#22262C] border border-transparent'
          }
          ${isFunctionalGroup ? 'border-dashed' : ''}
          ${isVirtualFolder ? 'opacity-90' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Expand/Collapse Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
          className={`w-5 h-5 flex items-center justify-center flex-shrink-0 ${hasChildren ? '' : 'invisible'}`}
        >
          {hasChildren && (
            isExpanded
              ? <ChevronDown className="w-4 h-4 text-[#6B7280]" />
              : <ChevronRight className="w-4 h-4 text-[#6B7280]" />
          )}
        </button>

        {/* Node Icon */}
        <span className={`p-1 rounded flex-shrink-0 ${getIconBgColor()}`}>
          <Icon className={`w-3.5 h-3.5 ${getIconColor()}`} />
        </span>

        {/* Node Name & Part Number */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={`truncate font-medium ${
            isVirtualFolder ? 'text-[#9CA3AF] text-sm italic' :
            isArtifact ? 'text-[#E5E7EB] text-sm' :
            isFunctionalGroup ? 'text-slate-300' :
            'text-[#F0F2F4]'
          }`}>
            {displayName}
          </span>
          {secondaryId && !isVirtualFolder && (
            <span className="text-xs text-[#6B7280] font-mono truncate">
              {secondaryId}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Type Badge for artifacts */}
          {getTypeBadge()}

          {/* Revision */}
          {node.revision && !isArtifact && !isVirtualFolder && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
              {node.revision}
            </span>
          )}

          {/* AI Score */}
          {node.ai_score != null && node.ai_score > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              node.ai_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
              node.ai_score >= 60 ? 'bg-amber-500/20 text-amber-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {node.ai_score}%
            </span>
          )}

          {/* Attachments (product nodes only) */}
          {attachmentCount > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-[#6B7280]">
              <Paperclip className="w-3 h-3" />
              {attachmentCount}
            </span>
          )}

          {/* Artifact counts for product nodes */}
          {!isArtifact && !isVirtualFolder && node.artifactCounts && (
            <>
              {node.artifactCounts.specs > 0 && (
                <span
                  className={`text-[10px] ${node.artifactCounts.specsNeedingQuantification > 0 ? 'text-amber-400' : 'text-indigo-400'}`}
                  title={`${node.artifactCounts.specs} Specs${node.artifactCounts.specsNeedingQuantification > 0 ? ` (${node.artifactCounts.specsNeedingQuantification} need quantification)` : ''}`}
                >
                  {node.artifactCounts.specs}Sp{node.artifactCounts.specsNeedingQuantification > 0 && '!'}
                </span>
              )}
              {node.artifactCounts.studies > 0 && (
                <span className="text-[10px] text-cyan-400" title="Studies">
                  {node.artifactCounts.studies}S
                </span>
              )}
              {node.artifactCounts.tests > 0 && (
                <span className="text-[10px] text-green-400" title="Tests">
                  {node.artifactCounts.tests}T
                </span>
              )}
              {node.artifactCounts.fixtures > 0 && (
                <span className="text-[10px] text-orange-400" title="Fixtures">
                  {node.artifactCounts.fixtures}F
                </span>
              )}
            </>
          )}

          {/* SOP count indicator (ALPHA) */}
          {!isArtifact && !isVirtualFolder && node.sopCount > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-purple-400" title={`${node.sopCount} SOPs linked`}>
              <ClipboardList className="w-3 h-3" />
              {node.sopCount}
            </span>
          )}

          {/* Supplier Constraint Indicator */}
          {!isArtifact && !isVirtualFolder && (() => {
            const supplierStatus = getNodeSupplierConstraintStatus(node.part_number || node.id);
            const summary = getNodeSupplierConstraintSummary(node.part_number || node.id);
            if (!supplierStatus) return null;

            const statusConfig = {
              violated: { icon: '❌', color: 'text-red-400', title: `${summary.violatedCount} violated supplier constraint(s)` },
              unvalidated: { icon: '⚠️', color: 'text-amber-400', title: `${summary.totalCount - summary.validatedCount} unvalidated supplier constraint(s)` },
              validated: { icon: '✅', color: 'text-emerald-400', title: `${summary.validatedCount} validated supplier constraint(s)` },
              present: { icon: '📎', color: 'text-blue-400', title: `${summary.totalCount} supplier constraint(s)` }
            };

            const config = statusConfig[supplierStatus] || statusConfig.present;
            const hasPropagated = summary.propagatedCount > 0;

            return (
              <span className={`flex items-center gap-0.5 text-[10px] ${config.color}`} title={config.title}>
                <span>{config.icon}</span>
                {hasPropagated && <span className="text-purple-400" title={`${summary.propagatedCount} propagated from upstream`}>🔁</span>}
              </span>
            );
          })()}

          {/* Manufacture Button (physical nodes only) */}
          {!isArtifact && !isVirtualFolder && !isFunctionalGroup && (
            <NodeManufactureButton node={node} />
          )}

          {/* Status */}
          {getStatusIndicator()}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CAD PREVIEW COMPONENT
// =============================================================================

function CADPreview({ node, cad, onLinkCad, onUploadCad }) {
  const hasCad = cad && cad.length > 0;
  const primaryCad = cad?.[0];

  if (!hasCad) {
    return (
      <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
        <h4 className="text-sm font-medium text-[#9CA3AF] mb-3 flex items-center gap-2">
          <FileBox className="w-4 h-4 text-violet-400" />
          CAD Preview
        </h4>
        <div className="flex flex-col items-center justify-center py-6 bg-[#0F1114] rounded-lg border border-dashed border-[#2A2F36]">
          <Image className="w-12 h-12 text-[#4B5563] mb-3" />
          <p className="text-sm text-[#6B7280] mb-4">No CAD linked to this node</p>
          <div className="flex gap-2">
            <button
              onClick={() => onLinkCad?.(node)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-sm transition-colors"
            >
              <Link2 className="w-4 h-4" />
              Link CAD
            </button>
            <button
              onClick={() => onUploadCad?.(node)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22262C] hover:bg-[#2A2F36] text-[#B4BAC4] rounded-lg text-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload CAD
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine CAD tool from filename
  const getCadTool = (filename) => {
    if (!filename) return 'Unknown';
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'sldprt':
      case 'sldasm':
        return 'SolidWorks';
      case 'f3d':
      case 'f3z':
        return 'Fusion 360';
      case 'step':
      case 'stp':
        return 'STEP (Generic)';
      case 'iges':
      case 'igs':
        return 'IGES (Generic)';
      case 'dwg':
        return 'AutoCAD';
      case 'ipt':
      case 'iam':
        return 'Inventor';
      case 'catpart':
      case 'catproduct':
        return 'CATIA';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
      <h4 className="text-sm font-medium text-[#9CA3AF] mb-3 flex items-center gap-2">
        <FileBox className="w-4 h-4 text-violet-400" />
        CAD Preview
      </h4>

      {/* Thumbnail */}
      <div className="mb-3 bg-[#0F1114] rounded-lg overflow-hidden border border-[#2A2F36]">
        {node.cad_thumbnail ? (
          <img
            src={node.cad_thumbnail}
            alt="CAD Preview"
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="w-full h-32 flex items-center justify-center">
            <Package className="w-16 h-16 text-[#4B5563]" />
          </div>
        )}
      </div>

      {/* CAD Metadata */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">Tool</span>
          <span className="text-[#E5E7EB] flex items-center gap-1">
            <Cog className="w-3 h-3" />
            {getCadTool(primaryCad.name || primaryCad.filename)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">Filename</span>
          <span className="text-[#E5E7EB] font-mono text-xs truncate max-w-[150px]">
            {primaryCad.name || primaryCad.filename}
          </span>
        </div>
        {primaryCad.last_updated && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6B7280]">Last Updated</span>
            <span className="text-[#E5E7EB] text-xs">
              {new Date(primaryCad.last_updated).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Open in CAD Tool button */}
      <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg text-sm transition-colors">
        <ExternalLink className="w-4 h-4" />
        Open in CAD Tool
      </button>

      {/* Additional CAD files */}
      {cad.length > 1 && (
        <div className="mt-3 pt-3 border-t border-[#2A2F36]">
          <p className="text-xs text-[#6B7280] mb-2">+{cad.length - 1} more file(s)</p>
          <div className="space-y-1">
            {cad.slice(1).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                <FileText className="w-3 h-3" />
                <span className="truncate">{item.name || item.filename}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUPPLIER CONSTRAINTS PANEL
// =============================================================================

function SupplierConstraintsPanel({ node }) {
  const nodeId = node.part_number || node.id;
  const directRequirements = getSupplierRequirementsByNode(nodeId);
  const propagatedRequirements = getPropagatedRequirementsForNode(nodeId);
  const allRequirements = [...directRequirements, ...propagatedRequirements];

  if (allRequirements.length === 0) return null;

  const summary = getNodeSupplierConstraintSummary(nodeId);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'validated':
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Validated</span>;
      case 'violated':
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-400 border border-red-500/30">Violated</span>;
      case 'unvalidated':
      default:
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Unvalidated</span>;
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'high':
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/10 text-red-400">HIGH</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-400">MED</span>;
      case 'low':
      default:
        return <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-500/10 text-slate-400">LOW</span>;
    }
  };

  return (
    <div className="border border-blue-500/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-500/10 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">📎</span>
          <h4 className="text-sm font-medium text-blue-400">Supplier Constraints (OTS)</h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-400">✅ {summary.validatedCount}</span>
          {summary.violatedCount > 0 && <span className="text-red-400">❌ {summary.violatedCount}</span>}
          {(summary.totalCount - summary.validatedCount - summary.violatedCount) > 0 && (
            <span className="text-amber-400">⚠️ {summary.totalCount - summary.validatedCount - summary.violatedCount}</span>
          )}
        </div>
      </div>

      {/* Requirements List */}
      <div className="divide-y divide-[#2A2F36]">
        {/* Direct Requirements */}
        {directRequirements.map(req => {
          const link = getRequirementLink(req.id);
          return (
            <div key={req.id} className="p-3 hover:bg-[#1C1F24] transition-colors">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Supplier
                  </span>
                  {getRiskBadge(req.risk_level)}
                  {getStatusBadge(req.validation_status)}
                  {req.applicability_scope === 'downstream_propagation' && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-400" title="Propagates downstream">
                      ↓ Downstream
                    </span>
                  )}
                </div>
              </div>
              <h5 className="text-sm font-medium text-[#F0F2F4] mb-1">{req.title}</h5>
              <p className="text-xs text-[#6B7280] mb-2 line-clamp-2">{req.requirement_text}</p>
              {link && (
                <div className="bg-[#0F1114] rounded p-2 border-l-2 border-blue-500/50">
                  <p className="text-[10px] text-[#6B7280] mb-1">
                    Source: {req.source_title} ({req.source_revision}) — {req.source_section}
                  </p>
                  <p className="text-xs text-slate-400 italic">"{link.quoted_excerpt}"</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Propagated Requirements */}
        {propagatedRequirements.map(req => {
          const link = getRequirementLink(req.id);
          return (
            <div key={`prop-${req.id}`} className="p-3 hover:bg-[#1C1F24] transition-colors bg-purple-500/5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    🔁 Propagated
                  </span>
                  {getRiskBadge(req.risk_level)}
                  {getStatusBadge(req.validation_status)}
                </div>
              </div>
              <h5 className="text-sm font-medium text-[#F0F2F4] mb-1">{req.title}</h5>
              <p className="text-xs text-[#6B7280] mb-2 line-clamp-2">{req.requirement_text}</p>
              <p className="text-[10px] text-purple-400">
                From: {req.linked_node_id}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      {summary.violatedCount > 0 && (
        <div className="bg-red-500/10 px-3 py-2 border-t border-red-500/30">
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {summary.violatedCount} violated constraint(s) — Release blocked
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DETAIL PANELS
// =============================================================================

function ProductNodeDetailPanel({ node, onLinkCad, onUploadCad }) {
  const nodeClassConfig = getNodeClassConfig(node.node_class);
  const isFunctionalGroup = node.node_class === 'functional_group';
  const allowsAttachments = nodeClassAllowsAttachments(node.node_class);
  const artifactSummary = getNodeArtifactSummary(node);

  // Extract CAD from attachments
  const cadAttachments = (node.attachments || []).filter(
    att => att.type === 'cad' || att.type === 'drawing'
  );

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs rounded border ${nodeClassConfig?.bgColor} ${nodeClassConfig?.textColor} ${nodeClassConfig?.borderColor} ${isFunctionalGroup ? 'border-dashed' : ''}`}>
              {nodeClassConfig?.name}
            </span>
            {node.revision && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                Rev {node.revision}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-[#F0F2F4]">{node.name}</h3>
          {node.part_number && (
            <p className="text-sm text-[#6B7280] font-mono">{node.part_number}</p>
          )}
        </div>
        {node.ai_score != null && (
          <div className="text-right">
            <span className={`text-2xl font-bold ${
              node.ai_score >= 80 ? 'text-emerald-400' :
              node.ai_score >= 60 ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {node.ai_score}%
            </span>
            <p className="text-xs text-[#6B7280]">AI Score</p>
          </div>
        )}
      </div>

      {/* Functional Group Notice */}
      {isFunctionalGroup && (
        <div className="flex items-start gap-2 p-3 bg-slate-800/50 border border-dashed border-slate-600 rounded-lg">
          <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
          <div>
            <p className="text-sm text-slate-300 font-medium">Functional Grouping</p>
            <p className="text-xs text-slate-500">
              This is an organizational node. It cannot have attachments, revisions, or phase tracking.
              Navigate to child assemblies to manage physical parts.
            </p>
          </div>
        </div>
      )}

      {/* Phase Progress */}
      {!isFunctionalGroup && node.phase && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#6B7280]">Phase Progress</span>
            <span className="text-sm text-blue-400">Phase {node.phase} of 7</span>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5, 6, 7].map(p => (
              <div
                key={p}
                className={`h-2 flex-1 rounded-sm ${
                  p < node.phase ? 'bg-emerald-500' :
                  p === node.phase ? 'bg-blue-500' :
                  'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Artifact Summary - Specs first as required */}
      {!isFunctionalGroup && (artifactSummary.specs > 0 || artifactSummary.cad > 0 || artifactSummary.studies > 0 || artifactSummary.tests > 0 || artifactSummary.fixtures > 0) && (
        <div className="grid grid-cols-5 gap-2">
          <div className={`rounded-lg p-2 text-center ${artifactSummary.specsNeedingQuantification > 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-indigo-500/10'}`}>
            <div className={`text-lg font-bold ${artifactSummary.specsNeedingQuantification > 0 ? 'text-amber-400' : 'text-indigo-400'}`}>
              {artifactSummary.specs}
            </div>
            <div className={`text-xs ${artifactSummary.specsNeedingQuantification > 0 ? 'text-amber-300' : 'text-indigo-300'}`}>
              Specs{artifactSummary.specsNeedingQuantification > 0 && '!'}
            </div>
          </div>
          <div className="bg-violet-500/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-violet-400">{artifactSummary.cad}</div>
            <div className="text-xs text-violet-300">CAD</div>
          </div>
          <div className="bg-cyan-500/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-cyan-400">{artifactSummary.studies}</div>
            <div className="text-xs text-cyan-300">Studies</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-green-400">{artifactSummary.tests}</div>
            <div className="text-xs text-green-300">Tests</div>
          </div>
          <div className="bg-orange-500/10 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-orange-400">{artifactSummary.fixtures}</div>
            <div className="text-xs text-orange-300">Fixtures</div>
          </div>
        </div>
      )}

      {/* CAD Preview */}
      {!isFunctionalGroup && node.node_class === 'product' && (
        <CADPreview node={node} cad={cadAttachments} onLinkCad={onLinkCad} onUploadCad={onUploadCad} />
      )}

      {/* Supplier Constraints (OTS Requirements) Panel */}
      <SupplierConstraintsPanel node={node} />

      {/* Non-CAD Attachments */}
      {allowsAttachments && (
        <div>
          <h4 className="text-sm font-medium text-[#6B7280] mb-2 flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Other Attachments
          </h4>
          {node.attachments && node.attachments.filter(a => a.type !== 'cad' && a.type !== 'drawing').length > 0 ? (
            <div className="space-y-2">
              {node.attachments.filter(a => a.type !== 'cad' && a.type !== 'drawing').map((att, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-[#1C1F24] rounded-lg">
                  <FileText className="w-4 h-4 text-[#6B7280]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F0F2F4] truncate">{att.name || att.filename}</p>
                    <p className="text-xs text-[#6B7280]">{att.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6B7280] italic">No other attachments</p>
          )}
        </div>
      )}

      {/* Child Count */}
      {node.children && node.children.filter(c => !c.isVirtualFolder).length > 0 && (
        <div className="pt-3 border-t border-[#2A2F36]">
          <p className="text-sm text-[#6B7280]">
            Contains <span className="text-[#F0F2F4] font-medium">
              {node.children.filter(c => !c.isVirtualFolder).length}
            </span> child nodes
          </p>
        </div>
      )}
    </div>
  );
}

function CADDetailPanel({ node }) {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 text-xs rounded bg-violet-500/20 text-violet-400 border border-violet-500/30">
          CAD File
        </span>
      </div>
      <h3 className="text-lg font-semibold text-[#F0F2F4]">{node.name}</h3>

      {/* Preview */}
      <div className="bg-[#0F1114] rounded-lg overflow-hidden border border-[#2A2F36]">
        {node.cad_thumbnail ? (
          <img src={node.cad_thumbnail} alt="CAD Preview" className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 flex items-center justify-center">
            <Package className="w-24 h-24 text-[#4B5563]" />
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">CAD Tool</span>
          <span className="text-[#E5E7EB]">{node.cad_tool || 'Unknown'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">Parent Node</span>
          <span className="text-[#E5E7EB] font-mono text-xs">{node.parentPartNumber}</span>
        </div>
        {node.last_updated && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#6B7280]">Last Updated</span>
            <span className="text-[#E5E7EB]">{new Date(node.last_updated).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg transition-colors">
        <ExternalLink className="w-4 h-4" />
        Open in CAD Tool
      </button>
    </div>
  );
}

function StudyDetailPanel({ node }) {
  const getStudyTypeLabel = (type) => {
    switch (type) {
      case 'doe': return 'Design of Experiments (DOE)';
      case 'parametric': return 'Parametric Study';
      case 'sensitivity': return 'Sensitivity Analysis';
      case 'trade_study': return 'Trade Study';
      case 'reliability': return 'Reliability Analysis';
      default: return 'Engineering Study';
    }
  };

  const badge = TYPE_BADGES[node.node_class] || TYPE_BADGES[ARTIFACT_TYPES.STUDY_DOE];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={`px-2 py-0.5 text-xs rounded ${badge.color}`}>
          {badge.label}
        </span>
        <span className={`px-2 py-0.5 text-xs rounded ${
          node.status === 'complete' ? 'bg-emerald-500/20 text-emerald-400' :
          node.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
          'bg-slate-500/20 text-slate-400'
        }`}>
          {node.status?.replace('_', ' ') || 'Not started'}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-[#F0F2F4]">{node.name}</h3>
      <p className="text-sm text-[#6B7280]">{getStudyTypeLabel(node.type)}</p>

      {/* Study ID */}
      {node.study_id && (
        <div className="text-sm">
          <span className="text-[#6B7280]">Study ID: </span>
          <span className="font-mono text-cyan-400">{node.study_id}</span>
        </div>
      )}

      {/* Owning Node */}
      <div className="text-sm">
        <span className="text-[#6B7280]">Owning Node: </span>
        <span className="font-mono text-[#E5E7EB]">{node.owning_node_part_number}</span>
      </div>

      {/* Phase Contexts */}
      {node.phase_contexts && node.phase_contexts.length > 0 && (
        <div className="text-sm">
          <span className="text-[#6B7280]">Phase Contexts: </span>
          <span className="text-blue-400">{node.phase_contexts.join(', ')}</span>
        </div>
      )}

      {/* DOE-specific: Factors & Responses */}
      {node.type === 'doe' && (
        <>
          {node.factors && node.factors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[#6B7280] mb-2">Factors</h4>
              <div className="space-y-1">
                {node.factors.map((factor, idx) => (
                  <div key={idx} className="text-sm text-[#E5E7EB] bg-[#1C1F24] px-2 py-1 rounded">
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          )}
          {node.responses && node.responses.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[#6B7280] mb-2">Responses</h4>
              <div className="space-y-1">
                {node.responses.map((response, idx) => (
                  <div key={idx} className="text-sm text-[#E5E7EB] bg-[#1C1F24] px-2 py-1 rounded">
                    {response}
                  </div>
                ))}
              </div>
            </div>
          )}
          {node.design_type && (
            <div className="text-sm">
              <span className="text-[#6B7280]">Design Type: </span>
              <span className="text-[#E5E7EB]">{node.design_type}</span>
            </div>
          )}
          {node.run_count && (
            <div className="text-sm">
              <span className="text-[#6B7280]">Run Count: </span>
              <span className="text-[#E5E7EB]">{node.run_count}</span>
            </div>
          )}
        </>
      )}

      {/* Trade Study: Alternatives & Criteria */}
      {node.type === 'trade_study' && (
        <>
          {node.alternatives && node.alternatives.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[#6B7280] mb-2">Alternatives</h4>
              <div className="space-y-1">
                {node.alternatives.map((alt, idx) => (
                  <div key={idx} className="text-sm text-[#E5E7EB] bg-[#1C1F24] px-2 py-1 rounded">
                    {alt}
                  </div>
                ))}
              </div>
            </div>
          )}
          {node.criteria && node.criteria.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[#6B7280] mb-2">Criteria</h4>
              <div className="space-y-1">
                {node.criteria.map((criterion, idx) => (
                  <div key={idx} className="text-sm text-[#E5E7EB] bg-[#1C1F24] px-2 py-1 rounded flex justify-between">
                    <span>{criterion}</span>
                    {node.weights && node.weights[idx] && (
                      <span className="text-amber-400">{(node.weights[idx] * 100).toFixed(0)}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Linked Requirements */}
      {node.linked_requirements && node.linked_requirements.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#6B7280] mb-2">Linked Requirements</h4>
          <div className="flex flex-wrap gap-1">
            {node.linked_requirements.map((req, idx) => (
              <span key={idx} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                {req}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {node.results_summary && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <h4 className="text-sm font-medium text-emerald-400 mb-1">Results Summary</h4>
          <p className="text-sm text-[#E5E7EB]">{node.results_summary}</p>
        </div>
      )}
    </div>
  );
}

function TestDetailPanel({ node }) {
  const getLevelColor = (level) => {
    switch (level) {
      case 'component': return 'bg-blue-500/20 text-blue-400';
      case 'system': return 'bg-violet-500/20 text-violet-400';
      case 'full_system': return 'bg-amber-500/20 text-amber-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 text-xs rounded bg-green-500/20 text-green-400">
          TEST
        </span>
        <span className={`px-2 py-0.5 text-xs rounded ${getLevelColor(node.test_level)}`}>
          {node.test_level?.replace('_', ' ').toUpperCase()}
        </span>
        <span className={`px-2 py-0.5 text-xs rounded ${
          node.status === 'passed' ? 'bg-emerald-500/20 text-emerald-400' :
          node.status === 'failed' ? 'bg-red-500/20 text-red-400' :
          node.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400' :
          'bg-slate-500/20 text-slate-400'
        }`}>
          {node.status?.replace('_', ' ') || 'Not started'}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-[#F0F2F4]">{node.name}</h3>

      {/* Test ID */}
      {node.test_id && (
        <div className="text-sm">
          <span className="text-[#6B7280]">Test ID: </span>
          <span className="font-mono text-green-400">{node.test_id}</span>
        </div>
      )}

      {/* Owning Node */}
      <div className="text-sm">
        <span className="text-[#6B7280]">Validates Node: </span>
        <span className="font-mono text-[#E5E7EB]">{node.owning_node_part_number}</span>
      </div>

      {/* Dates */}
      {node.scheduled_date && (
        <div className="text-sm">
          <span className="text-[#6B7280]">Scheduled: </span>
          <span className="text-[#E5E7EB]">{node.scheduled_date}</span>
        </div>
      )}
      {node.executed_date && (
        <div className="text-sm">
          <span className="text-[#6B7280]">Executed: </span>
          <span className="text-[#E5E7EB]">{node.executed_date}</span>
        </div>
      )}

      {/* Acceptance Criteria */}
      {node.acceptance_criteria && (
        <div className="bg-[#1C1F24] rounded-lg p-3">
          <h4 className="text-sm font-medium text-[#6B7280] mb-1">Acceptance Criteria</h4>
          <p className="text-sm text-[#E5E7EB]">{node.acceptance_criteria}</p>
        </div>
      )}

      {/* Result */}
      {node.result && (
        <div className={`rounded-lg p-3 ${
          node.pass_fail === 'pass' ? 'bg-emerald-500/10 border border-emerald-500/30' :
          node.pass_fail === 'fail' ? 'bg-red-500/10 border border-red-500/30' :
          'bg-[#1C1F24]'
        }`}>
          <h4 className="text-sm font-medium text-[#6B7280] mb-1">Result</h4>
          <p className="text-sm text-[#E5E7EB]">{node.result}</p>
        </div>
      )}

      {/* Linked Requirements */}
      {node.linked_requirements && node.linked_requirements.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#6B7280] mb-2">Linked Requirements</h4>
          <div className="flex flex-wrap gap-1">
            {node.linked_requirements.map((req, idx) => (
              <span key={idx} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                {req}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Test Fixture */}
      {node.test_fixture_id && (
        <div className="text-sm">
          <span className="text-[#6B7280]">Test Fixture: </span>
          <span className="font-mono text-orange-400">{node.test_fixture_id}</span>
        </div>
      )}
    </div>
  );
}

function FixtureDetailPanel({ node }) {
  const getFixtureTypeLabel = (type) => {
    switch (type) {
      case 'weld_fixture': return 'Weld Fixture';
      case 'assembly_fixture': return 'Assembly Fixture';
      case 'drill_fixture': return 'Drill Fixture';
      case 'inspection_fixture': return 'Inspection Fixture';
      case 'handling_fixture': return 'Handling Fixture';
      default: return 'Manufacturing Fixture';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-2 py-0.5 text-xs rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
          FIXTURE
        </span>
        {node.revision && (
          <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
            Rev {node.revision}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-[#F0F2F4]">{node.name}</h3>
      <p className="text-sm text-[#6B7280]">{getFixtureTypeLabel(node.fixture_type)}</p>

      {/* Part Number */}
      {node.part_number && (
        <div className="text-sm">
          <span className="text-[#6B7280]">Part Number: </span>
          <span className="font-mono text-orange-400">{node.part_number}</span>
        </div>
      )}

      {/* Linked Product Nodes */}
      {node.linked_product_nodes && node.linked_product_nodes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#6B7280] mb-2">Linked Product Nodes</h4>
          <div className="space-y-1">
            {node.linked_product_nodes.map((pn, idx) => (
              <div key={idx} className="text-sm text-[#E5E7EB] bg-[#1C1F24] px-2 py-1 rounded font-mono">
                {pn}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase */}
      {node.phase && (
        <div className="text-sm">
          <span className="text-[#6B7280]">Current Phase: </span>
          <span className="text-blue-400">Phase {node.phase}</span>
        </div>
      )}

      {/* AI Score */}
      {node.ai_score != null && (
        <div className="text-sm">
          <span className="text-[#6B7280]">AI Score: </span>
          <span className={`font-bold ${
            node.ai_score >= 80 ? 'text-emerald-400' :
            node.ai_score >= 60 ? 'text-amber-400' :
            'text-red-400'
          }`}>
            {node.ai_score}%
          </span>
        </div>
      )}

      {/* Attachments */}
      {node.attachments && node.attachments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[#6B7280] mb-2 flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Attachments
          </h4>
          <div className="space-y-2">
            {node.attachments.map((att, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-[#1C1F24] rounded-lg">
                <FileText className="w-4 h-4 text-[#6B7280]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#F0F2F4] truncate">{att.name || att.filename}</p>
                  <p className="text-xs text-[#6B7280]">{att.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VirtualFolderDetailPanel({ node }) {
  const config = VIRTUAL_FOLDER_CONFIG[node.virtualFolderType];
  const itemCount = node.children?.length || 0;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Layers className={`w-5 h-5 ${ICON_COLORS[node.virtualFolderType]}`} />
        <h3 className="text-lg font-semibold text-[#F0F2F4]">{config?.name || node.name}</h3>
      </div>
      <p className="text-sm text-[#6B7280]">
        Contains {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </p>
      <div className="bg-[#1C1F24] rounded-lg p-3 border border-dashed border-[#2A2F36]">
        <p className="text-sm text-[#9CA3AF]">
          This is a virtual grouping folder. Select items inside to view their details.
        </p>
      </div>
    </div>
  );
}

/**
 * NodeDetailPanel - Routes to the appropriate detail panel based on selection type
 */
function NodeDetailPanel({ node, onLinkCad, onUploadCad }) {
  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-[#6B7280]">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a node to view details</p>
        </div>
      </div>
    );
  }

  const selectionType = getSelectionType(node);

  switch (selectionType) {
    case 'virtual_folder':
      return <VirtualFolderDetailPanel node={node} />;
    case 'cad':
      return <CADDetailPanel node={node} />;
    case 'study':
      return <StudyDetailPanel node={node} />;
    case 'test':
      return <TestDetailPanel node={node} />;
    case 'fixture':
      return <FixtureDetailPanel node={node} />;
    case 'product':
    case 'functional_group':
    case 'test_asset':
    default:
      return <ProductNodeDetailPanel node={node} onLinkCad={onLinkCad} onUploadCad={onUploadCad} />;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ProjectTreeView - Main component for navigating project hierarchy
 * with node-owned artifacts rendered under virtual folders
 */
function ProjectTreeView({
  project,
  onNodeSelect,
  onGenerateReport,
  onLinkCad,
  onUploadCad,
  selectedNodeId = null,
  className = '',
  showArtifactFilter = true,
  compact = false
}) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [internalSelectedId, setInternalSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [artifactFilter, setArtifactFilter] = useState(null); // null = show all

  // Build SOP index mapping node IDs and part numbers to SOP counts
  const sopIndex = useMemo(() => {
    const index = { byNodeId: {}, byPartNumber: {} };
    DEMO_SOPS.forEach(sop => {
      // Count SOPs by their scope_node_id (node-scoped SOPs)
      if (sop.scope_node_id) {
        index.byNodeId[sop.scope_node_id] = (index.byNodeId[sop.scope_node_id] || 0) + 1;
      }
      // Also count by node_id if different (legacy field)
      if (sop.node_id && sop.node_id !== sop.scope_node_id) {
        index.byNodeId[sop.node_id] = (index.byNodeId[sop.node_id] || 0) + 1;
      }
      // Count by part_number for matching with demo project data
      if (sop.scope_part_number) {
        index.byPartNumber[sop.scope_part_number] = (index.byPartNumber[sop.scope_part_number] || 0) + 1;
      }
    });
    return index;
  }, []);

  // Build enhanced tree with virtual folders and SOP counts
  const enhancedProject = useMemo(() => {
    return buildTreeViewModel(project, sopIndex);
  }, [project, sopIndex]);

  // Use controlled or internal selection
  const effectiveSelectedId = selectedNodeId !== null ? selectedNodeId : internalSelectedId;

  // Auto-expand first two levels on mount
  useEffect(() => {
    if (enhancedProject?.root_node) {
      const initialExpanded = new Set([enhancedProject.root_node.id]);
      if (enhancedProject.root_node.children) {
        enhancedProject.root_node.children.forEach(child => {
          initialExpanded.add(child.id);
          // Also expand virtual folders
          if (child.isVirtualFolder && child.children) {
            initialExpanded.add(child.id);
          }
        });
      }
      setExpandedNodes(initialExpanded);
    }
  }, [enhancedProject?.root_node?.id]);

  const handleToggle = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleSelect = (node) => {
    setInternalSelectedId(node.id);
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  };

  // Find the currently selected node for the detail panel
  const selectedNode = findNodeById(enhancedProject?.root_node, effectiveSelectedId);

  const handleExpandAll = () => {
    const allIds = new Set();
    const collectIds = (node) => {
      allIds.add(node.id);
      if (node.children) {
        node.children.forEach(collectIds);
      }
    };
    if (enhancedProject?.root_node) {
      collectIds(enhancedProject.root_node);
    }
    setExpandedNodes(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
  };

  if (!enhancedProject || !enhancedProject.root_node) {
    return (
      <div className={`bg-[#15181C] border border-[#2A2F36] rounded-xl p-8 text-center ${className}`}>
        <AlertCircle className="w-12 h-12 text-[#4B5563] mx-auto mb-3" />
        <p className="text-[#6B7280]">No project hierarchy available</p>
      </div>
    );
  }

  // Count nodes (excluding virtual folders and artifacts)
  const countProductNodes = (node) => {
    let count = node.isVirtualFolder || node.isArtifact ? 0 : 1;
    if (node.children) {
      node.children.forEach(child => {
        count += countProductNodes(child);
      });
    }
    return count;
  };

  const totalNodes = countProductNodes(enhancedProject.root_node);
  const artifactSummary = getNodeArtifactSummary(enhancedProject.root_node);

  return (
    <div className={`bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-[#2A2F36] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[#F0F2F4] flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            Project Structure
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <span>{totalNodes} nodes</span>
              {artifactSummary.specs > 0 && (
                <span className={artifactSummary.specsNeedingQuantification > 0 ? 'text-amber-400' : 'text-indigo-400'}>
                  {artifactSummary.specs} specs{artifactSummary.specsNeedingQuantification > 0 && ` (${artifactSummary.specsNeedingQuantification}!)`}
                </span>
              )}
              {artifactSummary.studies > 0 && (
                <span className="text-cyan-400">{artifactSummary.studies} studies</span>
              )}
              {artifactSummary.tests > 0 && (
                <span className="text-green-400">{artifactSummary.tests} tests</span>
              )}
              {artifactSummary.fixtures > 0 && (
                <span className="text-orange-400">{artifactSummary.fixtures} fixtures</span>
              )}
            </div>
            <button
              onClick={() => onGenerateReport && onGenerateReport(selectedNode)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors"
            >
              <FileBarChart className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-[#0F1114] border border-[#2A2F36] rounded-lg text-sm text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleExpandAll}
            className="px-3 py-1.5 text-xs bg-[#1C1F24] hover:bg-[#22262C] text-[#B4BAC4] rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1.5 text-xs bg-[#1C1F24] hover:bg-[#22262C] text-[#B4BAC4] rounded-lg transition-colors"
          >
            Collapse
          </button>
        </div>

        {/* Artifact Filter Toggle */}
        {showArtifactFilter && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-[#6B7280]">Highlight:</span>
            {['specs', 'studies', 'tests', 'fixtures'].map(type => (
              <button
                key={type}
                onClick={() => setArtifactFilter(artifactFilter === type ? null : type)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  artifactFilter === type
                    ? type === 'specs' ? 'bg-indigo-500/30 text-indigo-300' :
                      type === 'studies' ? 'bg-cyan-500/30 text-cyan-300' :
                      type === 'tests' ? 'bg-green-500/30 text-green-300' :
                      'bg-orange-500/30 text-orange-300'
                    : 'bg-[#1C1F24] text-[#6B7280] hover:bg-[#22262C]'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {compact ? (
        /* Compact mode: Tree only, no detail panel */
        <div className="flex-1 overflow-y-auto p-2">
          <TreeNode
            node={enhancedProject.root_node}
            level={0}
            expandedNodes={expandedNodes}
            onToggle={handleToggle}
            onSelect={handleSelect}
            selectedNodeId={effectiveSelectedId}
          />
        </div>
      ) : (
        /* Full mode: Tree + Detail Panel side by side */
        <div className="flex divide-x divide-[#2A2F36]">
          {/* Tree Panel */}
          <div className="w-1/2 max-h-[500px] overflow-y-auto p-2">
            <TreeNode
              node={enhancedProject.root_node}
              level={0}
              expandedNodes={expandedNodes}
              onToggle={handleToggle}
              onSelect={handleSelect}
              selectedNodeId={effectiveSelectedId}
            />
          </div>

          {/* Detail Panel */}
          <div className="w-1/2 max-h-[500px] overflow-y-auto bg-[#0F1114]/50">
            <NodeDetailPanel node={selectedNode} onLinkCad={onLinkCad} onUploadCad={onUploadCad} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectTreeView;
