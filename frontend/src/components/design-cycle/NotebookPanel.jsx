import React, { useState } from 'react';
import {
  BookOpen, Plus, FileText, Pencil, Calculator, CheckSquare,
  Users, FlaskConical, ExternalLink, ChevronDown, ChevronUp,
  Clock, User, Hash, Lock, Info, AlertTriangle
} from 'lucide-react';
import {
  NOTEBOOK_ENTRY_TYPES,
  ENTRY_TYPE_CONFIG,
  getEntryTypeConfig,
  getEntryTypeColorClasses,
  DEMO_NOTEBOOK_ENTRIES
} from '../../config/designNotebooksConfig';

const ICON_MAP = {
  FileText,
  Pencil,
  Calculator,
  CheckSquare,
  Users,
  FlaskConical,
  ExternalLink
};

/**
 * NotebookPanel - Displays design notebook entries for a node
 *
 * A design notebook is a diary of the design. It does not need to be neat.
 * It must capture sketches, notes, decisions, and calculations.
 *
 * RULE: Notebook entries are append-only. Corrections must be new entries
 * that reference prior entries.
 */
function NotebookPanel({
  nodeId,
  nodeName,
  projectId,
  entries = [],
  onAddEntry,
  onViewEntry,
  readOnly = false
}) {
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    entry_type: NOTEBOOK_ENTRY_TYPES.NOTE,
    summary: '',
    body_markdown: ''
  });

  // Use demo data if no entries provided
  const displayEntries = entries.length > 0 ? entries : DEMO_NOTEBOOK_ENTRIES.slice(0, 3);

  const handleAddEntry = () => {
    if (!newEntry.summary.trim()) return;

    const entry = {
      id: `entry-${Date.now()}`,
      notebook_id: `notebook-${nodeId}`,
      page_number: displayEntries.length + 1,
      entry_date: new Date().toISOString(),
      signed_by: 'current-user',
      signed_at: new Date().toISOString(),
      ...newEntry,
      linked_artifact_ids: [],
      referenced_storage_links: []
    };

    onAddEntry?.(entry);
    setNewEntry({
      entry_type: NOTEBOOK_ENTRY_TYPES.NOTE,
      summary: '',
      body_markdown: ''
    });
    setShowAddForm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
      {/* Section Summary */}
      <div className="bg-indigo-500/5 border border-indigo-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#B4BAC4] leading-relaxed">
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Purpose:</strong> A design notebook is a diary of the design. It captures sketches, notes, decisions, and calculations as engineering work progresses.
            </p>
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Method:</strong> Each entry is page-numbered, dated, and digitally signed. Entries are append-only and immutable. Corrections must be new entries that reference prior entries.
            </p>
            <p>
              <strong className="text-[#F0F2F4]">Outcome:</strong> Creates an auditable engineering record with tamper evidence. Provides traceability from design decisions to artifacts and requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <BookOpen className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0F2F4]">Design Notebook</h3>
            <p className="text-sm text-[#6B7280]">
              Engineering diary for {nodeName || 'this node'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6B7280]">
            {displayEntries.length} {displayEntries.length === 1 ? 'entry' : 'entries'}
          </span>
          {!readOnly && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Add Entry Form */}
      {showAddForm && !readOnly && (
        <div className="bg-[#0F1114] rounded-lg p-4 mb-6 border border-[#2A2F36]">
          <h4 className="text-sm font-medium text-[#F0F2F4] mb-4">New Notebook Entry</h4>

          <div className="space-y-4">
            {/* Entry Type */}
            <div>
              <label className="block text-xs text-[#6B7280] mb-2">Entry Type</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(ENTRY_TYPE_CONFIG).map(config => {
                  const IconComponent = ICON_MAP[config.icon] || FileText;
                  const colors = getEntryTypeColorClasses(config.code);
                  const isSelected = newEntry.entry_type === config.code;

                  return (
                    <button
                      key={config.code}
                      type="button"
                      onClick={() => setNewEntry(prev => ({ ...prev, entry_type: config.code }))}
                      className={`p-2 rounded-lg border text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                        isSelected
                          ? `${colors.bg} ${colors.border} ${colors.text}`
                          : 'bg-[#1C1F24] border-[#2A2F36] text-[#6B7280] hover:border-[#3A3F46]'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{config.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Summary</label>
              <input
                type="text"
                value={newEntry.summary}
                onChange={(e) => setNewEntry(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Brief description of this entry"
                className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Content (Markdown supported)</label>
              <textarea
                value={newEntry.body_markdown}
                onChange={(e) => setNewEntry(prev => ({ ...prev, body_markdown: e.target.value }))}
                placeholder="Enter detailed content..."
                rows={6}
                className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Immutability Warning */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-300">
                <strong>Immutable Entry:</strong> Once submitted, this entry cannot be edited or deleted.
                Corrections must be made as new entries referencing this one.
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-[#1C1F24] text-[#B4BAC4] rounded-lg text-sm hover:bg-[#22262C] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                disabled={!newEntry.summary.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign & Submit Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      {displayEntries.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-[#2A2F36] mx-auto mb-3" />
          <p className="text-[#6B7280]">No notebook entries yet</p>
          <p className="text-xs text-[#6B7280] mt-1">
            Add entries to document your design decisions and calculations
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayEntries.map(entry => {
            const config = getEntryTypeConfig(entry.entry_type);
            const colors = getEntryTypeColorClasses(entry.entry_type);
            const IconComponent = ICON_MAP[config.icon] || FileText;
            const isExpanded = expandedEntry === entry.id;

            return (
              <div
                key={entry.id}
                className={`bg-[#0F1114] rounded-lg overflow-hidden border ${colors.border}`}
              >
                {/* Entry Header */}
                <button
                  type="button"
                  onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <IconComponent className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {config.name}
                        </span>
                        <h4 className="text-[#F0F2F4] font-medium">{entry.summary}</h4>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7280]">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          Page {entry.page_number}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(entry.entry_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.signed_by}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-[#6B7280]" title="Immutable entry" />
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-[#2A2F36]">
                    <div className="mt-4 prose prose-invert prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-[#B4BAC4] bg-[#1C1F24] p-3 rounded-lg">
                        {entry.body_markdown}
                      </pre>
                    </div>

                    {/* Linked Artifacts */}
                    {entry.linked_artifact_ids && entry.linked_artifact_ids.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-xs text-[#6B7280] mb-2">Linked Artifacts</h5>
                        <div className="flex flex-wrap gap-2">
                          {entry.linked_artifact_ids.map(artifactId => (
                            <span
                              key={artifactId}
                              className="px-2 py-1 text-xs bg-[#1C1F24] text-[#B4BAC4] rounded border border-[#2A2F36]"
                            >
                              {artifactId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hash Verification */}
                    <div className="mt-4 pt-3 border-t border-[#2A2F36]">
                      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                        <Lock className="w-3 h-3" />
                        <span>Immutable Hash: {entry.immutable_hash?.substring(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
        <p className="text-xs text-indigo-300">
          <strong>Tamper Evidence:</strong> All entries are hashed at creation. The system verifies
          integrity on retrieval. Any modification would invalidate the hash and be detected.
        </p>
      </div>
    </div>
  );
}

export default NotebookPanel;
