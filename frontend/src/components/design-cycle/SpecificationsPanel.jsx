import React, { useState, useMemo } from 'react';
import {
  Ruler, Plus, ChevronDown, ChevronUp, Check, Clock, AlertTriangle,
  Link2, ExternalLink, Filter, Info, Layers, ArrowUpRight, FlaskConical
} from 'lucide-react';

// =============================================================================
// CONSTANTS
// =============================================================================

const SPEC_LEVELS = {
  vehicle: { name: 'Vehicle', color: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30' },
  system: { name: 'System', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  component: { name: 'Component', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' }
};

const VERIFICATION_LEVELS = {
  analysis: { name: 'Analysis', icon: '📊', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  test: { name: 'Test', icon: '🧪', color: 'text-green-400', bg: 'bg-green-500/20' },
  inspection: { name: 'Inspection', icon: '👁️', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  field_data: { name: 'Field Data', icon: '📈', color: 'text-purple-400', bg: 'bg-purple-500/20' }
};

const STATUS_CONFIG = {
  active: { icon: Check, label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  needs_quantification: { icon: AlertTriangle, label: 'Needs Quantification', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  changed: { icon: Clock, label: 'Changed', color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  deprecated: { icon: AlertTriangle, label: 'Deprecated', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get specifications for a node, including inherited specs from parent nodes
 */
export const getNodeSpecifications = (node, specifications = [], projectHierarchy = null) => {
  if (!specifications || specifications.length === 0) {
    return { nodeSpecs: [], inheritedSpecs: [] };
  }

  const nodeId = node?.id;
  const nodePath = node?.part_number || nodeId;

  // Filter specs owned by this node
  const nodeSpecs = specifications.filter(spec =>
    spec.node_path === nodePath ||
    spec.owning_node_id === nodeId ||
    spec.owning_node_part_number === nodePath
  );

  // Get inherited specs (from parent nodes or applicable to this level)
  const inheritedSpecs = specifications.filter(spec => {
    // Already owned by this node
    if (spec.node_path === nodePath || spec.owning_node_id === nodeId || spec.owning_node_part_number === nodePath) {
      return false;
    }

    // Vehicle-level specs apply to all nodes
    if (spec.level === 'vehicle') {
      return true;
    }

    // System-level specs apply to system and component nodes
    if (spec.level === 'system') {
      const nodeType = node?.type;
      if (nodeType === 'ASSY' || nodeType === 'SUBASSY' || nodeType === 'COMP') {
        // Check if spec is from a parent subsystem
        const specPath = spec.node_path || '';
        if (nodePath && specPath && nodePath.startsWith(specPath.split('-').slice(0, 2).join('-'))) {
          return true;
        }
      }
    }

    return false;
  });

  return { nodeSpecs, inheritedSpecs };
};

/**
 * Count specs with specific statuses
 */
export const countSpecsByStatus = (specs) => {
  return specs.reduce((acc, spec) => {
    acc[spec.status] = (acc[spec.status] || 0) + 1;
    return acc;
  }, {});
};

// =============================================================================
// SPEC ROW COMPONENT
// =============================================================================

function SpecRow({ spec, isInherited = false, onViewDetails, onNavigateToTest }) {
  const [expanded, setExpanded] = useState(false);
  const levelConfig = SPEC_LEVELS[spec.level] || SPEC_LEVELS.component;
  const statusConfig = STATUS_CONFIG[spec.status] || STATUS_CONFIG.active;
  const verificationConfig = VERIFICATION_LEVELS[spec.verification_level] || VERIFICATION_LEVELS.analysis;
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`bg-[#0F1114] rounded-lg overflow-hidden border ${statusConfig.border} ${isInherited ? 'opacity-90' : ''}`}>
      {/* Row Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-[#1C1F24] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`p-1.5 rounded ${levelConfig.bg}`}>
            <Ruler className={`w-4 h-4 ${levelConfig.color}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${levelConfig.bg} ${levelConfig.color}`}>
                {levelConfig.name}
              </span>
              {isInherited && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  Inherited
                </span>
              )}
              <h4 className="text-[#F0F2F4] font-medium text-sm truncate">{spec.title}</h4>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7280]">
              <span className="font-mono">{spec.spec_id}</span>
              <span className="flex items-center gap-1">
                <span className="text-[#9CA3AF]">{spec.metric}:</span>
                <span className="text-[#F0F2F4] font-semibold">{spec.target_value} {spec.units}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Verification Badge */}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${verificationConfig.bg} ${verificationConfig.color} flex items-center gap-1`}>
            <span>{verificationConfig.icon}</span>
            {verificationConfig.name}
          </span>

          {/* Status Badge */}
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="w-3 h-3" />
            {statusConfig.label}
          </span>

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#6B7280]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#6B7280]" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3 pt-0 border-t border-[#2A2F36]">
          <div className="mt-3 space-y-3">
            {/* Description */}
            {spec.description && (
              <div>
                <span className="text-xs text-[#6B7280]">Description</span>
                <p className="text-sm text-[#B4BAC4] mt-0.5">{spec.description}</p>
              </div>
            )}

            {/* Source */}
            {spec.source && (
              <div>
                <span className="text-xs text-[#6B7280]">Source</span>
                <p className="text-sm text-[#B4BAC4] mt-0.5">{spec.source}</p>
              </div>
            )}

            {/* Test Method */}
            {spec.test_method && (
              <div>
                <span className="text-xs text-[#6B7280]">Test Method</span>
                <p className="text-sm text-[#B4BAC4] mt-0.5">{spec.test_method}</p>
              </div>
            )}

            {/* Linked Tests */}
            {spec.linked_tests && spec.linked_tests.length > 0 && (
              <div>
                <span className="text-xs text-[#6B7280] flex items-center gap-1">
                  <FlaskConical className="w-3 h-3" />
                  Linked Tests
                </span>
                <div className="mt-1 space-y-1">
                  {spec.linked_tests.map((test, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 bg-[#1C1F24] rounded border border-[#2A2F36] hover:border-green-500/40 transition-colors cursor-pointer"
                      onClick={() => onNavigateToTest && onNavigateToTest(test.test_id)}
                    >
                      <FlaskConical className={`w-4 h-4 ${
                        test.status === 'passed' ? 'text-green-400' :
                        test.status === 'failed' ? 'text-red-400' :
                        test.status === 'in_progress' ? 'text-blue-400' :
                        'text-slate-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-green-400">{test.test_id}</span>
                          {test.status && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              test.status === 'passed' ? 'bg-green-500/20 text-green-400' :
                              test.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              test.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                              test.status === 'scheduled' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {test.status === 'passed' ? 'Passed' :
                               test.status === 'failed' ? 'Failed' :
                               test.status === 'in_progress' ? 'In Progress' :
                               test.status === 'scheduled' ? 'Scheduled' :
                               'Pending'}
                            </span>
                          )}
                          {test.type && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              test.type === 'prior' ? 'bg-slate-500/20 text-slate-400' :
                              'bg-indigo-500/20 text-indigo-400'
                            }`}>
                              {test.type === 'prior' ? 'Prior Test' : 'Current Validation'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#B4BAC4] truncate">{test.name}</p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-[#6B7280] flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Node Path */}
            {(spec.node_path || spec.owning_node_part_number) && (
              <div>
                <span className="text-xs text-[#6B7280]">Source Node</span>
                <p className="text-sm text-blue-400 font-mono mt-0.5">
                  {spec.node_path || spec.owning_node_part_number}
                </p>
              </div>
            )}

            {/* Linked Requirements */}
            {spec.linked_requirements && spec.linked_requirements.length > 0 && (
              <div>
                <span className="text-xs text-[#6B7280] flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  Linked Requirements
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {spec.linked_requirements.map((req, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#2A2F36]">
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(spec)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1C1F24] text-[#B4BAC4] rounded hover:bg-[#22262C] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Full Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function SpecificationsPanel({
  specifications = [],
  node,
  projectHierarchy = null,
  onAdd,
  onEdit,
  onViewDetails,
  onNavigateToTest,
  readOnly = false,
  showInheritedSpecs = true
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedSection, setExpandedSection] = useState('node'); // 'node' or 'inherited'

  // Get node specs and inherited specs
  const { nodeSpecs, inheritedSpecs } = useMemo(() => {
    return getNodeSpecifications(node, specifications, projectHierarchy);
  }, [node, specifications, projectHierarchy]);

  // Apply filter
  const filteredNodeSpecs = useMemo(() => {
    if (activeFilter === 'all') return nodeSpecs;
    return nodeSpecs.filter(spec => spec.status === activeFilter);
  }, [nodeSpecs, activeFilter]);

  const filteredInheritedSpecs = useMemo(() => {
    if (activeFilter === 'all') return inheritedSpecs;
    return inheritedSpecs.filter(spec => spec.status === activeFilter);
  }, [inheritedSpecs, activeFilter]);

  // Count by status
  const allSpecs = [...nodeSpecs, ...inheritedSpecs];
  const statusCounts = countSpecsByStatus(allSpecs);
  const totalCount = allSpecs.length;
  const needsQuantificationCount = statusCounts.needs_quantification || 0;

  // Check if node is functional group (no specs allowed)
  const isFunctionalGroup = node?.node_class === 'functional_group';

  if (isFunctionalGroup) {
    return (
      <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Ruler className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0F2F4]">Specifications & Requirements</h3>
            <p className="text-sm text-[#6B7280]">Engineering specifications for this node</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 bg-slate-800/50 border border-dashed border-slate-600 rounded-lg">
          <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-slate-300">Functional Grouping</p>
            <p className="text-xs text-slate-500">
              Specifications are attached to physical assemblies and components.
              Navigate to a child node to view or manage specifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
      {/* Section Summary */}
      <div className="bg-indigo-500/5 border border-indigo-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#B4BAC4] leading-relaxed">
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Purpose:</strong> Specifications define measurable engineering targets that drive design decisions and verification activities.
            </p>
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Hierarchy:</strong> Vehicle-level specs flow down to systems and components. Each node inherits applicable parent specs while owning its specific targets.
            </p>
            <p>
              <strong className="text-[#F0F2F4]">Verification:</strong> Each spec is linked to a verification method (Analysis, Test, Inspection, or Field Data) to ensure compliance is demonstrated.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Ruler className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0F2F4]">Specifications & Requirements</h3>
            <p className="text-sm text-[#6B7280]">
              {totalCount} specification{totalCount !== 1 ? 's' : ''}
              {nodeSpecs.length > 0 && ` (${nodeSpecs.length} owned`}
              {showInheritedSpecs && inheritedSpecs.length > 0 && `, ${inheritedSpecs.length} inherited`}
              {nodeSpecs.length > 0 && ')'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {needsQuantificationCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" />
              {needsQuantificationCount} needs quantification
            </span>
          )}
          {!readOnly && onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Spec
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-[#6B7280] flex-shrink-0" />
        {[
          { key: 'all', label: 'All', count: totalCount },
          { key: 'active', label: 'Active', count: statusCounts.active || 0 },
          { key: 'needs_quantification', label: 'Needs Quantification', count: statusCounts.needs_quantification || 0 },
          { key: 'changed', label: 'Changed', count: statusCounts.changed || 0 },
          { key: 'deprecated', label: 'Deprecated', count: statusCounts.deprecated || 0 }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
              activeFilter === filter.key
                ? 'bg-indigo-500 text-white'
                : 'bg-[#1C1F24] text-[#6B7280] hover:bg-[#22262C]'
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      {/* Specs Content */}
      {totalCount === 0 ? (
        <div className="text-center py-8">
          <Ruler className="w-12 h-12 text-[#2A2F36] mx-auto mb-3" />
          <p className="text-[#6B7280]">No specifications defined</p>
          <p className="text-xs text-[#6B7280] mt-1">
            Add engineering specifications to define measurable targets for this node
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Node Specs Section */}
          {filteredNodeSpecs.length > 0 && (
            <div>
              <button
                onClick={() => setExpandedSection(expandedSection === 'node' ? '' : 'node')}
                className="flex items-center justify-between w-full mb-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-medium text-[#F0F2F4]">Node Specifications</h4>
                  <span className="text-xs text-[#6B7280]">({filteredNodeSpecs.length})</span>
                </div>
                {expandedSection === 'node' ? (
                  <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                )}
              </button>
              {expandedSection === 'node' && (
                <div className="space-y-2">
                  {filteredNodeSpecs.map(spec => (
                    <SpecRow
                      key={spec.spec_id}
                      spec={spec}
                      isInherited={false}
                      onViewDetails={onViewDetails}
                      onNavigateToTest={onNavigateToTest}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Inherited Specs Section */}
          {showInheritedSpecs && filteredInheritedSpecs.length > 0 && (
            <div>
              <button
                onClick={() => setExpandedSection(expandedSection === 'inherited' ? '' : 'inherited')}
                className="flex items-center justify-between w-full mb-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-medium text-slate-300">Inherited Specifications</h4>
                  <span className="text-xs text-[#6B7280]">({filteredInheritedSpecs.length})</span>
                </div>
                {expandedSection === 'inherited' ? (
                  <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                )}
              </button>
              {expandedSection === 'inherited' && (
                <div className="space-y-2">
                  {filteredInheritedSpecs.map(spec => (
                    <SpecRow
                      key={spec.spec_id}
                      spec={spec}
                      isInherited={true}
                      onViewDetails={onViewDetails}
                      onNavigateToTest={onNavigateToTest}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
        <p className="text-xs text-indigo-300">
          <strong>Engineering Hierarchy:</strong> Vehicle-level specifications flow down to systems and components.
          Specifications marked "Needs Quantification" require numeric targets before verification can proceed.
        </p>
      </div>
    </div>
  );
}

export default SpecificationsPanel;
