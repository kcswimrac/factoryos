import React, { useState } from 'react';
import {
  Lightbulb, LayoutGrid, Cog, Plug, Rocket,
  Plus, X, Check, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { INNOVATION_CATEGORIES } from '../../config/designPhases';

const CATEGORY_ICONS = {
  architecture: LayoutGrid,
  process: Cog,
  integration: Plug,
  operation: Rocket
};

const CATEGORY_COLORS = {
  architecture: { bg: 'bg-violet-500/20', border: 'border-violet-500/50', text: 'text-violet-400' },
  process: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  integration: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  operation: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' }
};

const VALIDATION_STATUS = {
  identified: { label: 'Identified', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  in_development: { label: 'In Development', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  validated: { label: 'Validated', color: 'text-emerald-400', bg: 'bg-emerald-500/20' }
};

function InnovationTracker({
  innovations = [],
  onAdd,
  onUpdate,
  onRemove,
  projectId,
  readOnly = false
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [newInnovation, setNewInnovation] = useState({
    title: '',
    category: 'architecture',
    description: '',
    validationStatus: 'identified',
    evidence: ''
  });

  const categories = Object.values(INNOVATION_CATEGORIES);

  const handleAddInnovation = () => {
    if (!newInnovation.title.trim()) return;

    const innovation = {
      id: `inn-${Date.now()}`,
      ...newInnovation,
      createdAt: new Date().toISOString()
    };

    onAdd?.(innovation);
    setNewInnovation({
      title: '',
      category: 'architecture',
      description: '',
      validationStatus: 'identified',
      evidence: ''
    });
    setShowAddForm(false);
  };

  const handleStatusChange = (innovationId, status) => {
    onUpdate?.(innovationId, { validationStatus: status });
  };

  const getInnovationsByCategory = () => {
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat.code] = innovations.filter(i => i.category === cat.code);
    });
    return grouped;
  };

  const groupedInnovations = getInnovationsByCategory();
  const totalCount = innovations.length;
  const validatedCount = innovations.filter(i => i.validationStatus === 'validated').length;

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Lightbulb className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0F2F4]">Innovation Tracker</h3>
            <p className="text-sm text-[#6B7280]">Document and track engineering innovations</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-2xl font-bold text-amber-400">{totalCount}</span>
            <p className="text-xs text-[#6B7280]">
              {validatedCount} validated
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Innovation
            </button>
          )}
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-[#0F1114] rounded-lg p-4 mb-6 border border-amber-500/30">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-[#F0F2F4]">New Innovation</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="p-1 hover:bg-[#1C1F24] rounded"
            >
              <X className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Title *</label>
              <input
                type="text"
                value={newInnovation.title}
                onChange={(e) => setNewInnovation({ ...newInnovation, title: e.target.value })}
                placeholder="Brief title for the innovation"
                className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-[#6B7280] mb-2">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map(cat => {
                  const Icon = CATEGORY_ICONS[cat.code] || Lightbulb;
                  const colors = CATEGORY_COLORS[cat.code] || CATEGORY_COLORS.architecture;
                  const isSelected = newInnovation.category === cat.code;

                  return (
                    <button
                      key={cat.code}
                      type="button"
                      onClick={() => setNewInnovation({ ...newInnovation, category: cat.code })}
                      className={`p-3 rounded-lg text-center transition-all ${
                        isSelected
                          ? `${colors.bg} ${colors.border} border-2`
                          : 'bg-[#1C1F24] border-2 border-transparent hover:border-[#3A3F46]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? colors.text : 'text-[#6B7280]'}`} />
                      <span className={`text-xs ${isSelected ? colors.text : 'text-[#6B7280]'}`}>
                        {cat.name.replace(' Innovation', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Description</label>
              <textarea
                value={newInnovation.description}
                onChange={(e) => setNewInnovation({ ...newInnovation, description: e.target.value })}
                placeholder="Describe the innovation and its benefits..."
                className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-amber-500 resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-[#1C1F24] hover:bg-[#22262C] text-[#B4BAC4] rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddInnovation}
                disabled={!newInnovation.title.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Add Innovation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Innovation Categories */}
      <div className="space-y-4">
        {categories.map(category => {
          const Icon = CATEGORY_ICONS[category.code] || Lightbulb;
          const colors = CATEGORY_COLORS[category.code] || CATEGORY_COLORS.architecture;
          const categoryInnovations = groupedInnovations[category.code] || [];

          return (
            <div key={category.code} className="bg-[#0F1114] rounded-lg overflow-hidden">
              {/* Category Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#2A2F36]">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  <div>
                    <h4 className="text-[#F0F2F4] font-medium">{category.name}</h4>
                    <p className="text-xs text-[#6B7280]">{category.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${colors.bg} ${colors.text}`}>
                  {categoryInnovations.length} {categoryInnovations.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Category Innovations */}
              {categoryInnovations.length > 0 ? (
                <div className="divide-y divide-[#2A2F36]">
                  {categoryInnovations.map(innovation => {
                    const isExpanded = expandedId === innovation.id;
                    const statusStyle = VALIDATION_STATUS[innovation.validationStatus] || VALIDATION_STATUS.identified;

                    return (
                      <div key={innovation.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-medium text-[#F0F2F4]">{innovation.title}</h5>
                              <span className={`px-2 py-0.5 text-xs rounded ${statusStyle.bg} ${statusStyle.color}`}>
                                {statusStyle.label}
                              </span>
                            </div>
                            {innovation.description && (
                              <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                                {innovation.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {!readOnly && (
                              <>
                                <select
                                  value={innovation.validationStatus}
                                  onChange={(e) => handleStatusChange(innovation.id, e.target.value)}
                                  className="px-2 py-1 bg-[#1C1F24] border border-[#2A2F36] rounded text-xs text-[#B4BAC4] focus:outline-none focus:border-amber-500"
                                >
                                  {Object.entries(VALIDATION_STATUS).map(([key, status]) => (
                                    <option key={key} value={key}>{status.label}</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => onRemove?.(innovation.id)}
                                  className="p-1 hover:bg-red-500/20 rounded text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : innovation.id)}
                              className="p-1 hover:bg-[#1C1F24] rounded text-[#6B7280]"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-[#2A2F36]">
                            <div className="space-y-3">
                              {innovation.description && (
                                <div>
                                  <label className="block text-xs text-[#6B7280] mb-1">Full Description</label>
                                  <p className="text-sm text-[#B4BAC4]">{innovation.description}</p>
                                </div>
                              )}
                              <div>
                                <label className="block text-xs text-[#6B7280] mb-1">Validation Evidence</label>
                                {!readOnly ? (
                                  <textarea
                                    value={innovation.evidence || ''}
                                    onChange={(e) => onUpdate?.(innovation.id, { evidence: e.target.value })}
                                    placeholder="Document validation evidence (analysis, test results, etc.)..."
                                    className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-amber-500 resize-none"
                                    rows={2}
                                  />
                                ) : (
                                  <p className="text-sm text-[#B4BAC4]">
                                    {innovation.evidence || 'No evidence documented'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-xs text-[#6B7280]">No {category.name.toLowerCase()} documented</p>
                  <div className="mt-2 flex flex-wrap gap-1 justify-center">
                    {category.examples.map((ex, idx) => (
                      <span key={idx} className="text-xs text-[#6B7280] italic">
                        {ex}{idx < category.examples.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {totalCount === 0 && !showAddForm && (
        <div className="text-center py-8">
          <Lightbulb className="w-12 h-12 text-[#6B7280] mx-auto mb-3 opacity-50" />
          <h4 className="text-[#F0F2F4] font-medium mb-2">No Innovations Tracked</h4>
          <p className="text-sm text-[#6B7280] mb-4">
            Innovation can exist in architecture, process, integration, or operation.
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Track First Innovation
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default InnovationTracker;
