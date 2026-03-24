import React, { useState } from 'react';
import {
  Wrench, Package, Ruler, Eye, Truck, FlaskConical,
  Plus, ChevronDown, ChevronUp, Check, Clock, AlertTriangle,
  Link2, ExternalLink, Settings, Info
} from 'lucide-react';

const FIXTURE_TYPES = {
  weld_fixture: {
    code: 'weld_fixture',
    name: 'Weld Fixture',
    description: 'Holds parts in position for welding',
    icon: Wrench,
    color: 'orange'
  },
  assembly_fixture: {
    code: 'assembly_fixture',
    name: 'Assembly Fixture',
    description: 'Supports assembly operations',
    icon: Package,
    color: 'blue'
  },
  drill_fixture: {
    code: 'drill_fixture',
    name: 'Drill Fixture',
    description: 'Guides drilling/machining operations',
    icon: Settings,
    color: 'cyan'
  },
  inspection_fixture: {
    code: 'inspection_fixture',
    name: 'Inspection Fixture',
    description: 'Checks part geometry/quality',
    icon: Ruler,
    color: 'green'
  },
  handling_fixture: {
    code: 'handling_fixture',
    name: 'Handling Fixture',
    description: 'Assists material handling',
    icon: Truck,
    color: 'slate'
  },
  test_fixture: {
    code: 'test_fixture',
    name: 'Test Fixture',
    description: 'Equipment used during testing',
    icon: FlaskConical,
    color: 'violet'
  }
};

const LINK_TYPES = {
  fabrication: { name: 'Fabrication', description: 'Used to make the part' },
  assembly: { name: 'Assembly', description: 'Used to assemble components' },
  inspection: { name: 'Inspection', description: 'Used to check the part' },
  handling: { name: 'Handling', description: 'Used to move/position the part' },
  test: { name: 'Test', description: 'Used to test the part' }
};

const STATUS_CONFIG = {
  design: { label: 'Design', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  fabrication: { label: 'Fabrication', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  validated: { label: 'Validated', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  in_use: { label: 'In Use', color: 'text-green-400', bg: 'bg-green-500/20' },
  needs_update: { label: 'Needs Update', color: 'text-red-400', bg: 'bg-red-500/20' }
};

function NodeManufacturingAssetsPanel({
  fixtures = [],
  nodeId,
  nodeName,
  nodeType,
  onAdd,
  onUpdate,
  onRemove,
  onViewDetails,
  readOnly = false
}) {
  const [expandedFixture, setExpandedFixture] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFixture, setNewFixture] = useState({
    name: '',
    fixture_type: 'assembly_fixture',
    link_type: 'assembly',
    change_coupled: true
  });

  const handleAddFixture = () => {
    if (!newFixture.name.trim()) return;

    const fixture = {
      id: `FIX-${nodeId}-${Date.now()}`,
      ...newFixture,
      owning_node_id: nodeId,
      status: 'design',
      created_at: new Date().toISOString()
    };

    onAdd?.(fixture);
    setNewFixture({
      name: '',
      fixture_type: 'assembly_fixture',
      link_type: 'assembly',
      change_coupled: true
    });
    setShowAddForm(false);
  };

  const getFixtureColor = (fixtureType) => {
    const type = FIXTURE_TYPES[fixtureType];
    const colorMap = {
      orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
      green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
      slate: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' },
      violet: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' }
    };
    return colorMap[type?.color] || colorMap.orange;
  };

  const needsUpdateCount = fixtures.filter(f => f.status === 'needs_update').length;

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
      {/* Section Summary */}
      <div className="bg-orange-500/5 border border-orange-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#B4BAC4] leading-relaxed">
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Purpose:</strong> This section captures manufacturing assets including weld fixtures, assembly fixtures, inspection tooling, and process documentation required to produce the design.
            </p>
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Method:</strong> Fixtures are linked to specific product nodes with change-coupling flags. When a product node changes, linked fixtures are automatically flagged for review to prevent mismatched tooling.
            </p>
            <p>
              <strong className="text-[#F0F2F4]">Outcome:</strong> Makes production repeatable by tying fixtures to exact parts and revisions they support. Eliminates tribal knowledge loss by documenting which tooling is required for each assembly operation.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Wrench className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0F2F4]">Manufacturing Assets</h3>
            <p className="text-sm text-[#6B7280]">
              Fixtures, jigs, and tooling linked to this node
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {needsUpdateCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
              <AlertTriangle className="w-3 h-3" />
              {needsUpdateCount} needs update
            </span>
          )}
          <span className="text-sm text-[#6B7280]">
            {fixtures.length} {fixtures.length === 1 ? 'fixture' : 'fixtures'}
          </span>
          {!readOnly && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Fixture
            </button>
          )}
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && !readOnly && (
        <div className="bg-[#0F1114] rounded-lg p-4 mb-6 border border-[#2A2F36]">
          <h4 className="text-sm font-medium text-[#F0F2F4] mb-4">Link Manufacturing Asset</h4>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Fixture Name</label>
              <input
                type="text"
                value={newFixture.name}
                onChange={(e) => setNewFixture(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Frame Welding Jig"
                className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Type and Link Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Fixture Type</label>
                <select
                  value={newFixture.fixture_type}
                  onChange={(e) => setNewFixture(prev => ({ ...prev, fixture_type: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm focus:outline-none focus:border-orange-500"
                >
                  {Object.values(FIXTURE_TYPES).map(type => (
                    <option key={type.code} value={type.code}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Link Type</label>
                <select
                  value={newFixture.link_type}
                  onChange={(e) => setNewFixture(prev => ({ ...prev, link_type: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm focus:outline-none focus:border-orange-500"
                >
                  {Object.entries(LINK_TYPES).map(([key, type]) => (
                    <option key={key} value={key}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Change Coupled */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="change_coupled"
                checked={newFixture.change_coupled}
                onChange={(e) => setNewFixture(prev => ({ ...prev, change_coupled: e.target.checked }))}
                className="w-4 h-4 rounded border-[#2A2F36] bg-[#1C1F24] text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="change_coupled" className="text-sm text-[#B4BAC4]">
                Change-coupled (auto-flag for review when product node changes)
              </label>
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
                onClick={handleAddFixture}
                disabled={!newFixture.name.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Link Fixture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixtures List */}
      {fixtures.length === 0 ? (
        <div className="text-center py-8">
          <Wrench className="w-12 h-12 text-[#2A2F36] mx-auto mb-3" />
          <p className="text-[#6B7280]">No manufacturing assets linked</p>
          <p className="text-xs text-[#6B7280] mt-1">
            Link fixtures, jigs, and tooling used for this {nodeType || 'node'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {fixtures.map(fixture => {
            const fixtureType = FIXTURE_TYPES[fixture.fixture_type] || FIXTURE_TYPES.assembly_fixture;
            const Icon = fixtureType.icon;
            const colors = getFixtureColor(fixture.fixture_type);
            const statusConfig = STATUS_CONFIG[fixture.status] || STATUS_CONFIG.design;
            const isExpanded = expandedFixture === fixture.id;

            return (
              <div
                key={fixture.id}
                className={`bg-[#0F1114] rounded-lg overflow-hidden border ${colors.border}`}
              >
                {/* Fixture Header */}
                <button
                  type="button"
                  onClick={() => setExpandedFixture(isExpanded ? null : fixture.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {fixtureType.name}
                        </span>
                        <h4 className="text-[#F0F2F4] font-medium">{fixture.name}</h4>
                        {fixture.change_coupled && (
                          <Link2 className="w-3 h-3 text-[#6B7280]" title="Change-coupled" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[#6B7280]">
                          {LINK_TYPES[fixture.link_type]?.name || fixture.link_type}
                        </span>
                        <span className="text-xs text-[#6B7280] font-mono">
                          {fixture.id}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded ${statusConfig.bg} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
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
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-[#6B7280]">Description</span>
                          <p className="text-sm text-[#B4BAC4]">{fixtureType.description}</p>
                        </div>
                        <div>
                          <span className="text-xs text-[#6B7280]">Link Purpose</span>
                          <p className="text-sm text-[#B4BAC4]">
                            {LINK_TYPES[fixture.link_type]?.description || 'Not specified'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-[#6B7280]">Owning Node</span>
                          <p className="text-sm text-[#B4BAC4]">{nodeName || nodeId}</p>
                        </div>
                        {fixture.change_coupled && (
                          <div className="flex items-center gap-2 text-xs text-amber-400">
                            <AlertTriangle className="w-3 h-3" />
                            Auto-flagged when product changes
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#2A2F36]">
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(fixture)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1C1F24] text-[#B4BAC4] rounded hover:bg-[#22262C] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Details
                        </button>
                      )}
                      {!readOnly && (
                        <>
                          <select
                            value={fixture.status}
                            onChange={(e) => onUpdate?.(fixture.id, { status: e.target.value })}
                            className="px-3 py-1.5 text-xs bg-[#1C1F24] border border-[#2A2F36] rounded text-[#B4BAC4] focus:outline-none"
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => onRemove?.(fixture.id)}
                            className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                          >
                            Unlink
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <p className="text-xs text-orange-300">
          <strong>Node-centric ownership:</strong> Fixtures are linked to the lowest physical node they constrain.
          Change-coupled fixtures are automatically flagged for review when the product node changes.
        </p>
      </div>
    </div>
  );
}

export default NodeManufacturingAssetsPanel;
