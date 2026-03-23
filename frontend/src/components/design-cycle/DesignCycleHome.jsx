import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Folder,
  FolderOpen,
  Settings,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import NodeTypeBadge from './NodeTypeBadge';
import TreeFilters from './TreeFilters';
import TreeRollupMetrics from './TreeRollupMetrics';
import RigorTierBadge from './RigorTierBadge';
import { NODE_TYPES } from '../../config/designPhases';

function TreeNode({
  node,
  level = 0,
  expanded,
  onToggle,
  onSelect,
  selectedId,
  onContextMenu
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 cursor-pointer rounded-lg transition-colors ${
          isSelected
            ? 'bg-violet-500/20 border border-violet-500'
            : 'hover:bg-gray-800/50 border border-transparent'
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node.id);
          }}
          className={`p-0.5 rounded hover:bg-gray-700 transition-colors ${
            hasChildren ? '' : 'invisible'
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {/* Folder Icon */}
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-400" />
          ) : (
            <Folder className="w-4 h-4 text-amber-400" />
          )
        ) : (
          <FileText className="w-4 h-4 text-gray-500" />
        )}

        {/* Node Type Badge */}
        <NodeTypeBadge type={node.node_type} size="sm" showLabel={false} />

        {/* Name and Part Number */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {node.name}
            </span>
            {node.part_number && (
              <span className="text-xs text-gray-500 font-mono">
                {node.part_number}
              </span>
            )}
          </div>
        </div>

        {/* Rigor Tier */}
        {node.rigor_tier && (
          <RigorTierBadge tier={node.rigor_tier} size="sm" />
        )}

        {/* Phase Status Indicator */}
        {node.phase_status && (
          <div className="flex items-center gap-1">
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              node.phase_status === 'completed' ? 'bg-green-500/20 text-green-400' :
              node.phase_status === 'in_progress' ? 'bg-violet-500/20 text-violet-400' :
              node.phase_status === 'blocked' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {node.current_phase || '--'}
            </span>
          </div>
        )}

        {/* Context Menu */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e, node);
          }}
          className="p-1 rounded hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreVertical className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DesignCycleHome({
  projectId,
  projectName = 'Design Project',
  onNodeSelect,
  onCreateNode,
  onGenerateReport,
  fetchTree,
  fetchRollupMetrics
}) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [rollupMetrics, setRollupMetrics] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Load tree data
  useEffect(() => {
    loadTree();
  }, [projectId, filters]);

  const loadTree = async () => {
    setLoading(true);
    try {
      if (fetchTree) {
        const data = await fetchTree(projectId, filters);
        setTree(data.nodes || []);
        // Auto-expand root nodes
        const rootIds = (data.nodes || []).map(n => n.id);
        setExpanded(new Set(rootIds));
      } else {
        // Demo data
        setTree(getDemoTree());
        setExpanded(new Set(['demo-1']));
      }

      // Load rollup metrics
      if (fetchRollupMetrics) {
        const metrics = await fetchRollupMetrics(projectId);
        setRollupMetrics(metrics);
      } else {
        setRollupMetrics(getDemoMetrics());
      }
    } catch (err) {
      console.error('Failed to load tree:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (nodeId) => {
    const next = new Set(expanded);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    setExpanded(next);
  };

  const handleSelect = (node) => {
    setSelectedNode(node);
    if (onNodeSelect) {
      onNodeSelect(node);
    }
  };

  const handleContextMenu = (e, node) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node
    });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filterTree = (nodes, query) => {
    if (!query) return nodes;
    return nodes.filter(node => {
      const matchesSearch = node.name.toLowerCase().includes(query.toLowerCase()) ||
        node.part_number?.toLowerCase().includes(query.toLowerCase());
      if (matchesSearch) return true;
      if (node.children) {
        const filteredChildren = filterTree(node.children, query);
        return filteredChildren.length > 0;
      }
      return false;
    }).map(node => ({
      ...node,
      children: node.children ? filterTree(node.children, query) : undefined
    }));
  };

  const displayTree = filterTree(tree, searchQuery);
  const totalNodes = countNodes(tree);
  const filteredCount = countNodes(displayTree);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{projectName}</h1>
              <p className="text-sm text-gray-400 mt-1">
                Engineering Design Cycle - 7-Phase Implementation
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadTree}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => onGenerateReport && onGenerateReport()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
              <button
                onClick={() => onCreateNode && onCreateNode()}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Node
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Tree View */}
          <div className="col-span-8">
            {/* Search and Filters */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters || Object.keys(filters).length > 0
                    ? 'bg-violet-500/20 text-violet-400'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mb-4">
                <TreeFilters
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  totalCount={totalNodes}
                  filteredCount={filteredCount}
                />
              </div>
            )}

            {/* Tree View */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">
                  Project Hierarchy
                </span>
                <span className="text-xs text-gray-500">
                  {filteredCount} of {totalNodes} nodes
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              ) : displayTree.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    {searchQuery ? 'No nodes match your search' : 'No nodes in this project'}
                  </p>
                  {!searchQuery && onCreateNode && (
                    <button
                      onClick={() => onCreateNode()}
                      className="mt-4 text-violet-400 hover:text-violet-300 text-sm"
                    >
                      Create your first node
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1 group">
                  {displayTree.map((node) => (
                    <TreeNode
                      key={node.id}
                      node={node}
                      expanded={expanded}
                      onToggle={handleToggle}
                      onSelect={handleSelect}
                      selectedId={selectedNode?.id}
                      onContextMenu={handleContextMenu}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Metrics and Info */}
          <div className="col-span-4 space-y-6">
            {/* Rollup Metrics */}
            {rollupMetrics && (
              <TreeRollupMetrics
                gateStatus={rollupMetrics.gateStatus}
                traceCoverage={rollupMetrics.traceCoverage}
                aiScore={rollupMetrics.aiScore}
                phaseStatus={rollupMetrics.phaseStatus}
              />
            )}

            {/* Selected Node Info */}
            {selectedNode && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <NodeTypeBadge type={selectedNode.node_type} size="md" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {selectedNode.name}
                </h3>
                {selectedNode.part_number && (
                  <p className="text-sm text-gray-400 font-mono mb-3">
                    {selectedNode.part_number}
                  </p>
                )}
                {selectedNode.description && (
                  <p className="text-sm text-gray-500 mb-4">
                    {selectedNode.description}
                  </p>
                )}
                <div className="space-y-2 text-sm">
                  {selectedNode.rigor_tier && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Rigor Tier:</span>
                      <RigorTierBadge tier={selectedNode.rigor_tier} size="sm" />
                    </div>
                  )}
                  {selectedNode.current_phase && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Current Phase:</span>
                      <span className="text-white">{selectedNode.current_phase}</span>
                    </div>
                  )}
                  {selectedNode.ai_score !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">AI Score:</span>
                      <span className={`font-medium ${
                        selectedNode.ai_score >= 80 ? 'text-green-400' :
                        selectedNode.ai_score >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {selectedNode.ai_score}%
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onNodeSelect && onNodeSelect(selectedNode, 'edit')}
                  className="w-full mt-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Open in Design Wizard
                </button>
              </div>
            )}

            {/* Node Type Legend */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Node Types</h3>
              <div className="space-y-2">
                {Object.entries(NODE_TYPES).map(([key, type]) => (
                  <div key={key} className="flex items-center gap-2">
                    <NodeTypeBadge type={key} size="sm" />
                    <span className="text-xs text-gray-500">{type.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              onNodeSelect && onNodeSelect(contextMenu.node, 'edit');
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
          >
            Edit Node
          </button>
          <button
            onClick={() => {
              onCreateNode && onCreateNode(contextMenu.node);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
          >
            Add Child Node
          </button>
          <button
            onClick={() => {
              onGenerateReport && onGenerateReport(contextMenu.node);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700"
          >
            Generate Report
          </button>
          <div className="border-t border-gray-700 my-1" />
          <button
            onClick={() => setContextMenu(null)}
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700"
          >
            Delete Node
          </button>
        </div>
      )}
    </div>
  );
}

// Helper function to count nodes
function countNodes(nodes) {
  return nodes.reduce((count, node) => {
    return count + 1 + (node.children ? countNodes(node.children) : 0);
  }, 0);
}

// Demo data
function getDemoTree() {
  return [
    {
      id: 'demo-1',
      name: 'Competition Vehicle',
      node_type: 'ASSY',
      part_number: 'ASSY-001',
      rigor_tier: 3,
      current_phase: '3b',
      phase_status: 'in_progress',
      ai_score: 78,
      description: 'Main competition vehicle assembly',
      children: [
        {
          id: 'demo-2',
          name: 'Propulsion System',
          node_type: 'SYS',
          part_number: 'SYS-100',
          rigor_tier: 3,
          current_phase: '4',
          phase_status: 'in_progress',
          ai_score: 82,
          children: [
            {
              id: 'demo-3',
              name: 'Motor Assembly',
              node_type: 'SUBASSY',
              part_number: 'SUBASSY-101',
              rigor_tier: 2,
              current_phase: '5',
              phase_status: 'completed',
              ai_score: 91
            },
            {
              id: 'demo-4',
              name: 'Motor Controller',
              node_type: 'PURCH',
              part_number: 'PURCH-102',
              rigor_tier: 1,
              current_phase: '7',
              phase_status: 'completed',
              ai_score: 95
            }
          ]
        },
        {
          id: 'demo-5',
          name: 'Structural Frame',
          node_type: 'SYS',
          part_number: 'SYS-200',
          rigor_tier: 3,
          current_phase: '3a',
          phase_status: 'blocked',
          ai_score: 65,
          children: [
            {
              id: 'demo-6',
              name: 'Frame Tubes',
              node_type: 'COMP',
              part_number: 'COMP-201',
              rigor_tier: 2,
              current_phase: '2',
              phase_status: 'in_progress',
              ai_score: 58
            }
          ]
        }
      ]
    }
  ];
}

function getDemoMetrics() {
  return {
    gateStatus: {
      status: 'pending',
      approved: 2,
      total: 4,
      blockers: [
        { name: 'Structural Frame', issue: 'Requirements not finalized' }
      ]
    },
    traceCoverage: {
      coverage: 0.78,
      required: 1.0,
      byNode: [
        { name: 'Competition Vehicle', coverage: 0.85 },
        { name: 'Propulsion System', coverage: 0.92 },
        { name: 'Structural Frame', coverage: 0.58 }
      ]
    },
    aiScore: {
      rollup: 78,
      offenders: [
        { name: 'Frame Tubes', score: 58, issue: 'Missing analysis artifacts' }
      ]
    },
    phaseStatus: {
      complete: 4,
      total: 9,
      blocked: [
        { phase: '3a', reason: 'Awaiting gate approval' }
      ]
    }
  };
}

export default DesignCycleHome;
