import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Link2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  FlaskConical,
  Calculator,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const VERIFICATION_METHODS = [
  { key: 'analysis', name: 'Analysis', icon: Calculator, color: 'text-blue-400' },
  { key: 'test', name: 'Test', icon: FlaskConical, color: 'text-green-400' },
  { key: 'inspection', name: 'Inspection', icon: Eye, color: 'text-yellow-400' }
];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500', textColor: 'text-gray-400' },
  active: { label: 'Active', color: 'bg-blue-500', textColor: 'text-blue-400' },
  verified: { label: 'Verified', color: 'bg-green-500', textColor: 'text-green-400' },
  failed: { label: 'Failed', color: 'bg-red-500', textColor: 'text-red-400' }
};

function RequirementRow({ requirement, onEdit, onDelete, onViewTraces, expanded, onToggle }) {
  const status = STATUS_CONFIG[requirement.status] || STATUS_CONFIG.draft;
  const VerificationIcon = VERIFICATION_METHODS.find(m => m.key === requirement.verificationMethod)?.icon || FileText;
  const verificationColor = VERIFICATION_METHODS.find(m => m.key === requirement.verificationMethod)?.color || 'text-gray-400';

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 bg-gray-800/50 cursor-pointer hover:bg-gray-800"
        onClick={onToggle}
      >
        <button className="text-gray-500">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <code className="text-xs font-mono text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded">
          {requirement.id}
        </code>

        <span className="flex-1 text-sm text-gray-200 truncate">{requirement.title}</span>

        <div className="flex items-center gap-2">
          <VerificationIcon className={`w-4 h-4 ${verificationColor}`} />
          <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}/20 ${status.textColor}`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onViewTraces(); }}
            className="p-1.5 text-gray-500 hover:text-violet-400 transition-colors"
            title="View traces"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 text-gray-500 hover:text-blue-400 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-gray-900/50 border-t border-gray-700 space-y-3">
          <div>
            <span className="text-xs text-gray-500">Description</span>
            <p className="text-sm text-gray-300 mt-1">{requirement.description || 'No description'}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-gray-500">Acceptance Criteria</span>
              <p className="text-sm text-gray-300 mt-1">{requirement.acceptanceCriteria || '—'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Verification Method</span>
              <p className="text-sm text-gray-300 mt-1 capitalize">{requirement.verificationMethod}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Priority</span>
              <p className="text-sm text-gray-300 mt-1">{requirement.priority || 'Normal'}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Source</span>
              <p className="text-sm text-gray-300 mt-1">{requirement.source || '—'}</p>
            </div>
          </div>

          {requirement.traces && requirement.traces.length > 0 && (
            <div>
              <span className="text-xs text-gray-500">Trace Links</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {requirement.traces.map((trace, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Link2 className="w-3 h-3" />
                    {trace.type}: {trace.id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RequirementsManager({
  requirements = [],
  nodeId,
  onAdd,
  onEdit,
  onDelete,
  onViewTraces,
  traceCoverage = 0,
  requiredCoverage = 0.8
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = !searchQuery ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesMethod = filterMethod === 'all' || req.verificationMethod === filterMethod;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const coveragePercentage = traceCoverage * 100;
  const requiredPercentage = requiredCoverage * 100;
  const coverageMet = traceCoverage >= requiredCoverage;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-400" />
          Requirements
        </h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Requirement
        </button>
      </div>

      {/* Trace Coverage Indicator */}
      <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Trace Coverage</span>
          <span className={`text-sm font-medium ${coverageMet ? 'text-green-400' : 'text-yellow-400'}`}>
            {coveragePercentage.toFixed(0)}% / {requiredPercentage}% required
          </span>
        </div>
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
            style={{ left: `${requiredPercentage}%` }}
          />
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              coverageMet ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(coveragePercentage, 100)}%` }}
          />
        </div>
        {!coverageMet && (
          <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Coverage below tier threshold
          </p>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requirements..."
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
        >
          <option value="all">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>

        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
        >
          <option value="all">All Methods</option>
          {VERIFICATION_METHODS.map(method => (
            <option key={method.key} value={method.key}>{method.name}</option>
          ))}
        </select>
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        {filteredRequirements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{requirements.length === 0 ? 'No requirements defined yet' : 'No matching requirements'}</p>
          </div>
        ) : (
          filteredRequirements.map(req => (
            <RequirementRow
              key={req.id}
              requirement={req}
              expanded={expandedId === req.id}
              onToggle={() => setExpandedId(expandedId === req.id ? null : req.id)}
              onEdit={() => onEdit(req)}
              onDelete={() => onDelete(req.id)}
              onViewTraces={() => onViewTraces(req.id)}
            />
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{requirements.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            {requirements.filter(r => r.status === 'verified').length}
          </p>
          <p className="text-xs text-gray-500">Verified</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">
            {requirements.filter(r => r.status === 'active').length}
          </p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-400">
            {requirements.filter(r => r.status === 'failed').length}
          </p>
          <p className="text-xs text-gray-500">Failed</p>
        </div>
      </div>
    </div>
  );
}

export default RequirementsManager;
