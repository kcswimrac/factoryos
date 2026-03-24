import React, { useState } from 'react';
import {
  FlaskConical, CheckCircle, XCircle, Clock, AlertTriangle,
  Plus, ChevronDown, ChevronUp, Link2, FileText, Calendar,
  Target, BarChart3, Info
} from 'lucide-react';
import { TEST_LEVELS } from '../../config/designPhases';

const STATUS_CONFIG = {
  not_started: { icon: Clock, label: 'Not Started', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  in_progress: { icon: Clock, label: 'In Progress', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  passed: { icon: CheckCircle, label: 'Passed', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  failed: { icon: XCircle, label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20' },
  blocked: { icon: AlertTriangle, label: 'Blocked', color: 'text-orange-400', bg: 'bg-orange-500/20' }
};

const TEST_LEVEL_COLORS = {
  component: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  system: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  full_system: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' }
};

function NodeTestValidationPanel({
  testCases = [],
  requirements = [],
  nodeId,
  nodeName,
  nodeType,
  onAdd,
  onUpdate,
  onRemove,
  onViewDetails,
  readOnly = false
}) {
  const [expandedTest, setExpandedTest] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    test_level: 'component',
    linked_requirements: [],
    acceptance_criteria: '',
    scheduled_date: ''
  });

  // Calculate coverage
  const testRequirements = requirements.filter(r => r.verificationMethod === 'test' || r.verificationMethod === 'Test');
  const coveredRequirements = new Set(testCases.flatMap(t => t.linked_requirements || []));
  const coverage = testRequirements.length > 0
    ? (testRequirements.filter(r => coveredRequirements.has(r.id)).length / testRequirements.length) * 100
    : 0;

  // Count by status
  const statusCounts = testCases.reduce((acc, test) => {
    acc[test.status] = (acc[test.status] || 0) + 1;
    return acc;
  }, {});

  const handleAddTest = () => {
    if (!newTest.name.trim()) return;

    const test = {
      id: `TST-${nodeId}-${Date.now()}`,
      ...newTest,
      owning_node_id: nodeId,
      status: 'not_started',
      created_at: new Date().toISOString()
    };

    onAdd?.(test);
    setNewTest({
      name: '',
      test_level: 'component',
      linked_requirements: [],
      acceptance_criteria: '',
      scheduled_date: ''
    });
    setShowAddForm(false);
  };

  const toggleRequirement = (reqId) => {
    setNewTest(prev => ({
      ...prev,
      linked_requirements: prev.linked_requirements.includes(reqId)
        ? prev.linked_requirements.filter(r => r !== reqId)
        : [...prev.linked_requirements, reqId]
    }));
  };

  const uncoveredRequirements = testRequirements.filter(r => !coveredRequirements.has(r.id));

  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
      {/* Section Summary */}
      <div className="bg-cyan-500/5 border border-cyan-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[#B4BAC4] leading-relaxed">
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Purpose:</strong> This section manages component, subsystem, and system-level tests that validate design assumptions and verify requirements compliance.
            </p>
            <p className="mb-2">
              <strong className="text-[#F0F2F4]">Method:</strong> Test cases are linked directly to requirements and organized by test level. The system tracks pass/fail status, enforces requirement coverage metrics, and flags uncovered requirements.
            </p>
            <p>
              <strong className="text-[#F0F2F4]">Outcome:</strong> Validates that design assumptions hold under real conditions and verifies requirements are met. Connects physical test results back to analysis predictions and design intent, closing the engineering loop.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#F0F2F4]">Tests & Validation</h3>
            <p className="text-sm text-[#6B7280]">
              Test cases verifying requirements for this node
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!readOnly && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Test Case
            </button>
          )}
        </div>
      </div>

      {/* Coverage Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0F1114] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-[#6B7280]">Coverage</span>
          </div>
          <p className={`text-2xl font-bold ${
            coverage >= 100 ? 'text-emerald-400' :
            coverage >= 80 ? 'text-amber-400' :
            'text-red-400'
          }`}>
            {coverage.toFixed(0)}%
          </p>
          <p className="text-xs text-[#6B7280]">
            {testRequirements.length - uncoveredRequirements.length}/{testRequirements.length} requirements
          </p>
        </div>

        <div className="bg-[#0F1114] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[#6B7280]">Passed</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{statusCounts.passed || 0}</p>
        </div>

        <div className="bg-[#0F1114] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-[#6B7280]">Failed</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{statusCounts.failed || 0}</p>
        </div>

        <div className="bg-[#0F1114] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-[#6B7280]">Pending</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {(statusCounts.not_started || 0) + (statusCounts.in_progress || 0)}
          </p>
        </div>
      </div>

      {/* Uncovered Requirements Warning */}
      {uncoveredRequirements.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              {uncoveredRequirements.length} requirements without test cases
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {uncoveredRequirements.slice(0, 5).map(req => (
              <span
                key={req.id}
                className="px-2 py-0.5 text-xs bg-red-500/20 text-red-300 rounded"
              >
                {req.id}
              </span>
            ))}
            {uncoveredRequirements.length > 5 && (
              <span className="text-xs text-red-300">
                +{uncoveredRequirements.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && !readOnly && (
        <div className="bg-[#0F1114] rounded-lg p-4 mb-6 border border-[#2A2F36]">
          <h4 className="text-sm font-medium text-[#F0F2F4] mb-4">New Test Case</h4>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Test Name</label>
              <input
                type="text"
                value={newTest.name}
                onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Static Load Test"
                className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Test Level and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Test Level</label>
                <select
                  value={newTest.test_level}
                  onChange={(e) => setNewTest(prev => ({ ...prev, test_level: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm focus:outline-none focus:border-cyan-500"
                >
                  {Object.values(TEST_LEVELS).map(level => (
                    <option key={level.code} value={level.code}>{level.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1">Scheduled Date</label>
                <input
                  type="date"
                  value={newTest.scheduled_date}
                  onChange={(e) => setNewTest(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Acceptance Criteria */}
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Acceptance Criteria</label>
              <input
                type="text"
                value={newTest.acceptance_criteria}
                onChange={(e) => setNewTest(prev => ({ ...prev, acceptance_criteria: e.target.value }))}
                placeholder="e.g., No yield at 1.5x design load"
                className="w-full px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] text-sm placeholder-[#6B7280] focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Link Requirements */}
            {testRequirements.length > 0 && (
              <div>
                <label className="block text-xs text-[#6B7280] mb-2">Link to Requirements</label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {testRequirements.map(req => (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => toggleRequirement(req.id)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        newTest.linked_requirements.includes(req.id)
                          ? 'bg-cyan-500 text-white'
                          : 'bg-[#1C1F24] text-[#6B7280] hover:bg-[#22262C]'
                      }`}
                    >
                      {req.id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-[#1C1F24] text-[#B4BAC4] rounded-lg text-sm hover:bg-[#22262C] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTest}
                disabled={!newTest.name.trim()}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Test Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Cases List */}
      {testCases.length === 0 ? (
        <div className="text-center py-8">
          <FlaskConical className="w-12 h-12 text-[#2A2F36] mx-auto mb-3" />
          <p className="text-[#6B7280]">No test cases defined</p>
          <p className="text-xs text-[#6B7280] mt-1">
            Add test cases to validate requirements for this {nodeType || 'node'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {testCases.map(test => {
            const statusConfig = STATUS_CONFIG[test.status] || STATUS_CONFIG.not_started;
            const StatusIcon = statusConfig.icon;
            const levelColors = TEST_LEVEL_COLORS[test.test_level] || TEST_LEVEL_COLORS.component;
            const isExpanded = expandedTest === test.id;

            return (
              <div
                key={test.id}
                className={`bg-[#0F1114] rounded-lg overflow-hidden border ${levelColors.border}`}
              >
                {/* Test Header */}
                <button
                  type="button"
                  onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${levelColors.bg}`}>
                      <FlaskConical className={`w-4 h-4 ${levelColors.text}`} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${levelColors.bg} ${levelColors.text}`}>
                          {TEST_LEVELS[test.test_level]?.name.replace('-Level Test', '') || test.test_level}
                        </span>
                        <h4 className="text-[#F0F2F4] font-medium">{test.name}</h4>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-[#6B7280] font-mono">{test.id}</span>
                        {test.linked_requirements?.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                            <Link2 className="w-3 h-3" />
                            {test.linked_requirements.length} req
                          </span>
                        )}
                        {test.scheduled_date && (
                          <span className="flex items-center gap-1 text-xs text-[#6B7280]">
                            <Calendar className="w-3 h-3" />
                            {test.scheduled_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${statusConfig.bg} ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
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
                          <span className="text-xs text-[#6B7280]">Acceptance Criteria</span>
                          <p className="text-sm text-[#B4BAC4]">
                            {test.acceptance_criteria || 'Not specified'}
                          </p>
                        </div>
                        {test.result && (
                          <div>
                            <span className="text-xs text-[#6B7280]">Result</span>
                            <p className="text-sm text-[#B4BAC4]">{test.result}</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Link2 className="w-4 h-4 text-[#6B7280]" />
                          <span className="text-xs text-[#6B7280]">Linked Requirements</span>
                        </div>
                        {test.linked_requirements?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {test.linked_requirements.map(req => (
                              <span
                                key={req}
                                className="px-2 py-0.5 text-xs bg-[#1C1F24] text-[#B4BAC4] rounded"
                              >
                                {req}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#6B7280] italic">No linked requirements</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-[#2A2F36]">
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(test)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#1C1F24] text-[#B4BAC4] rounded hover:bg-[#22262C] transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          View Results
                        </button>
                      )}
                      {!readOnly && (
                        <>
                          <select
                            value={test.status}
                            onChange={(e) => onUpdate?.(test.id, { status: e.target.value })}
                            className="px-3 py-1.5 text-xs bg-[#1C1F24] border border-[#2A2F36] rounded text-[#B4BAC4] focus:outline-none"
                          >
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => onRemove?.(test.id)}
                            className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                          >
                            Remove
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
      <div className="mt-6 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
        <p className="text-xs text-cyan-300">
          <strong>Node-centric ownership:</strong> Test cases belong to the node being tested and are visible here regardless of phase.
          Phase 6 surfaces all test cases from descendant nodes to check requirement coverage.
        </p>
      </div>
    </div>
  );
}

export default NodeTestValidationPanel;
