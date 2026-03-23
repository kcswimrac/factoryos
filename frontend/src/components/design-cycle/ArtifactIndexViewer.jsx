import React, { useState } from 'react';
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Code,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen
} from 'lucide-react';

const ARTIFACT_ICONS = {
  document: FileText,
  image: Image,
  spreadsheet: FileSpreadsheet,
  code: Code,
  default: File
};

const ARTIFACT_CATEGORIES = {
  requirements: { label: 'Requirements', color: 'text-blue-400' },
  analysis: { label: 'Analysis', color: 'text-cyan-400' },
  design: { label: 'Design', color: 'text-violet-400' },
  simulation: { label: 'Simulation', color: 'text-green-400' },
  test: { label: 'Test', color: 'text-amber-400' },
  documentation: { label: 'Documentation', color: 'text-gray-400' },
  other: { label: 'Other', color: 'text-gray-500' }
};

const STATUS_CONFIG = {
  validated: {
    icon: CheckCircle,
    label: 'Validated',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20'
  },
  missing: {
    icon: AlertCircle,
    label: 'Missing',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20'
  }
};

function ArtifactItem({ artifact, onView, onDownload }) {
  const Icon = ARTIFACT_ICONS[artifact.type] || ARTIFACT_ICONS.default;
  const statusConfig = STATUS_CONFIG[artifact.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const category = ARTIFACT_CATEGORIES[artifact.category] || ARTIFACT_CATEGORIES.other;

  return (
    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="p-2 bg-gray-800 rounded-lg flex-shrink-0">
          <Icon className="w-4 h-4 text-gray-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-white truncate">
              {artifact.name}
            </h4>
            <span className={`text-xs ${category.color}`}>
              {category.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {artifact.path}
          </p>
          {artifact.linked_to && (
            <p className="text-xs text-gray-600 mt-0.5">
              Linked to: {artifact.linked_to}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <span className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </span>

        <div className="flex items-center gap-1">
          {onView && artifact.status !== 'missing' && (
            <button
              onClick={() => onView(artifact)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="View artifact"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          {onDownload && artifact.status !== 'missing' && (
            <button
              onClick={() => onDownload(artifact)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Download artifact"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryGroup({ category, artifacts, expanded, onToggle, onView, onDownload }) {
  const categoryConfig = ARTIFACT_CATEGORIES[category] || ARTIFACT_CATEGORIES.other;
  const validatedCount = artifacts.filter(a => a.status === 'validated').length;
  const missingCount = artifacts.filter(a => a.status === 'missing').length;

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <FolderOpen className={`w-4 h-4 ${categoryConfig.color}`} />
          ) : (
            <Folder className={`w-4 h-4 ${categoryConfig.color}`} />
          )}
          <span className="text-sm font-medium text-white">{categoryConfig.label}</span>
          <span className="text-xs text-gray-500">({artifacts.length})</span>
        </div>
        <div className="flex items-center gap-3">
          {validatedCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle className="w-3 h-3" />
              {validatedCount}
            </span>
          )}
          {missingCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />
              {missingCount}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="p-3 space-y-2 bg-gray-900/30">
          {artifacts.map((artifact, idx) => (
            <ArtifactItem
              key={artifact.id || idx}
              artifact={artifact}
              onView={onView}
              onDownload={onDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArtifactIndexViewer({
  artifacts = [],
  reportId,
  onView,
  onDownload,
  loading = false,
  showSearch = true,
  showFilters = true
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState(new Set(['requirements', 'design', 'test']));

  // Filter artifacts
  const filteredArtifacts = artifacts.filter(artifact => {
    const matchesSearch = !searchQuery ||
      artifact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.path?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || artifact.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by category
  const groupedArtifacts = filteredArtifacts.reduce((acc, artifact) => {
    const category = artifact.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(artifact);
    return acc;
  }, {});

  // Calculate stats
  const stats = {
    total: artifacts.length,
    validated: artifacts.filter(a => a.status === 'validated').length,
    pending: artifacts.filter(a => a.status === 'pending').length,
    missing: artifacts.filter(a => a.status === 'missing').length
  };

  const toggleCategory = (category) => {
    const next = new Set(expandedCategories);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    setExpandedCategories(next);
  };

  const expandAll = () => {
    setExpandedCategories(new Set(Object.keys(ARTIFACT_CATEGORIES)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Artifact Index</h3>
          {reportId && (
            <span className="text-xs text-gray-500 font-mono">
              Report #{reportId.substring(0, 8)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Expand All
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={collapseAll}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 mb-4 p-3 bg-gray-900/50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Total:</span>
          <span className="text-sm font-medium text-white">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">{stats.validated}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400">{stats.pending}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">{stats.missing}</span>
        </div>
      </div>

      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="flex items-center gap-3 mb-4">
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search artifacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          )}
          {showFilters && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
              >
                <option value="all">All Status</option>
                <option value="validated">Validated</option>
                <option value="pending">Pending</option>
                <option value="missing">Missing</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Artifact List */}
      {artifacts.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No artifacts in this report</p>
        </div>
      ) : filteredArtifacts.length === 0 ? (
        <div className="text-center py-8">
          <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No artifacts match your filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="mt-2 text-sm text-violet-400 hover:text-violet-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(ARTIFACT_CATEGORIES).map(([category]) => {
            const categoryArtifacts = groupedArtifacts[category];
            if (!categoryArtifacts || categoryArtifacts.length === 0) return null;
            return (
              <CategoryGroup
                key={category}
                category={category}
                artifacts={categoryArtifacts}
                expanded={expandedCategories.has(category)}
                onToggle={() => toggleCategory(category)}
                onView={onView}
                onDownload={onDownload}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ArtifactIndexViewer;
