import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import {
  ChevronLeft, Save, PenTool, Users, Calendar,
  FileText, Tag, Globe, Layers, ChevronDown, ChevronUp,
  Zap, AlertTriangle, CheckCircle2
} from 'lucide-react';
import {
  DomainLensSelector,
  SpecificationLevelSelector,
  RigorTierSelector
} from './components/design-cycle';
import { DOMAIN_LENSES, SPECIFICATION_LEVELS, RIGOR_TIERS } from './config/designPhases';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function DesignCycleNewProject() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    domainLens: true,
    specLevel: true,
    rigorTier: false,
    scrappyMode: false,
    additional: false
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain_lens: 'general',
    specification_level: 'component',
    rigor_tier: 2,
    target_date: '',
    team_members: '',
    tags: '',
    // Scrappy Startup Mode
    scrappy_mode_enabled: false,
    scrappy_mode_acknowledged: false,
    scrappy_bypasses: {
      phase_completeness: false,
      tier_trace_thresholds: false,
      full_correlation: false,
      selected_documentation: false,
      gantt_enforcement: false
    }
  });
  const [errors, setErrors] = useState({});

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleBypassToggle = (bypassKey) => {
    setFormData(prev => ({
      ...prev,
      scrappy_bypasses: {
        ...prev.scrappy_bypasses,
        [bypassKey]: !prev.scrappy_bypasses[bypassKey]
      }
    }));
  };

  const toggleScrappyMode = () => {
    setFormData(prev => ({
      ...prev,
      scrappy_mode_enabled: !prev.scrappy_mode_enabled,
      scrappy_mode_acknowledged: false,
      scrappy_bypasses: {
        phase_completeness: false,
        tier_trace_thresholds: false,
        full_correlation: false,
        selected_documentation: false,
        gantt_enforcement: false
      }
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/design`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (data.success) {
        navigate(`/design/project/${data.data.id}`);
      } else {
        console.error('Failed to create project:', data.error);
      }
    } catch (err) {
      console.error('Error creating project:', err);
    }

    setSaving(false);
  };

  const selectedDomainLens = DOMAIN_LENSES[formData.domain_lens];
  const selectedSpecLevel = SPECIFICATION_LEVELS[formData.specification_level.toUpperCase()];

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/design')}
            className="p-2 hover:bg-[#22262C] rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#6B7280]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F4] flex items-center gap-3">
              <PenTool className="w-7 h-7 text-blue-400" />
              Create New Design Project
            </h1>
            <p className="text-[#6B7280] mt-1">
              Start a new engineering design cycle project
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('basic')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-semibold text-[#F0F2F4]">Basic Information</span>
                <span className="text-red-400 text-sm">*</span>
              </div>
              {expandedSections.basic ? (
                <ChevronUp className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>

            {expandedSections.basic && (
              <div className="p-6 pt-2 space-y-6">
                {/* Project Name */}
                <div>
                  <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Brake Caliper Assembly Redesign"
                    className={`w-full px-4 py-3 bg-[#0F1114] border rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-[#2A2F36]'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the project objectives, scope, and key requirements..."
                    rows={4}
                    className={`w-full px-4 py-3 bg-[#0F1114] border rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500 resize-none ${
                      errors.description ? 'border-red-500' : 'border-[#2A2F36]'
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-400">{errors.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Domain Lens Section */}
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('domainLens')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-semibold text-[#F0F2F4]">Domain Lens</span>
                {selectedDomainLens && (
                  <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                    {selectedDomainLens.name}
                  </span>
                )}
              </div>
              {expandedSections.domainLens ? (
                <ChevronUp className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>

            {expandedSections.domainLens && (
              <div className="p-6 pt-2">
                <p className="text-sm text-[#6B7280] mb-4">
                  Select a domain lens to add context-specific terminology and prompts.
                  The 7-phase structure remains constant across all domains.
                </p>
                <DomainLensSelector
                  selectedLens={formData.domain_lens}
                  onSelect={(lens) => handleSelectChange('domain_lens', lens)}
                  showExamples={true}
                />
              </div>
            )}
          </div>

          {/* Specification Level Section */}
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('specLevel')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-400" />
                <span className="text-lg font-semibold text-[#F0F2F4]">Specification Level</span>
                {selectedSpecLevel && (
                  <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                    {selectedSpecLevel.name}
                  </span>
                )}
              </div>
              {expandedSections.specLevel ? (
                <ChevronUp className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>

            {expandedSections.specLevel && (
              <div className="p-6 pt-2">
                <p className="text-sm text-[#6B7280] mb-4">
                  Select the entry point level in the specification hierarchy.
                  Projects can start at any level depending on scope.
                </p>
                <SpecificationLevelSelector
                  selectedLevel={formData.specification_level}
                  onSelect={(level) => handleSelectChange('specification_level', level)}
                  showExamples={true}
                  domainLens={formData.domain_lens}
                />
              </div>
            )}
          </div>

          {/* Rigor Tier Section */}
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('rigorTier')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-[#F0F2F4]">Rigor Tier</span>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  formData.rigor_tier === 1 ? 'bg-slate-500/20 text-slate-400' :
                  formData.rigor_tier === 2 ? 'bg-blue-500/20 text-blue-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  Tier {formData.rigor_tier} - {RIGOR_TIERS[formData.rigor_tier]?.name}
                </span>
              </div>
              {expandedSections.rigorTier ? (
                <ChevronUp className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>

            {expandedSections.rigorTier && (
              <div className="p-6 pt-2">
                <p className="text-sm text-[#6B7280] mb-4">
                  Select the appropriate rigor tier based on consequence of failure,
                  complexity, and regulatory requirements.
                </p>
                <RigorTierSelector
                  selectedTier={formData.rigor_tier}
                  onSelect={(tier) => handleSelectChange('rigor_tier', tier)}
                  showExamples={true}
                />
              </div>
            )}
          </div>

          {/* Scrappy Startup Mode Section */}
          <div className={`bg-[#15181C] border rounded-xl overflow-hidden ${
            formData.scrappy_mode_enabled ? 'border-amber-500/50' : 'border-[#2A2F36]'
          }`}>
            <button
              type="button"
              onClick={() => toggleSection('scrappyMode')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Zap className={`w-5 h-5 ${formData.scrappy_mode_enabled ? 'text-amber-400' : 'text-[#6B7280]'}`} />
                <span className="text-lg font-semibold text-[#F0F2F4]">Scrappy Startup Mode</span>
                {formData.scrappy_mode_enabled ? (
                  <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded">
                    ENABLED
                  </span>
                ) : (
                  <span className="text-xs text-[#6B7280]">(optional)</span>
                )}
              </div>
              {expandedSections.scrappyMode ? (
                <ChevronUp className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>

            {expandedSections.scrappyMode && (
              <div className="p-6 pt-2 space-y-6">
                {/* Description */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-sm text-amber-200">
                    <strong>Scrappy Startup Mode</strong> allows temporary bypass of selected enforcement rules
                    for early-stage engineering where learning speed matters more than completeness.
                  </p>
                  <p className="text-xs text-amber-200/70 mt-2">
                    This mode does not lower engineering standards—it postpones them with accountability.
                    Every bypass creates a Technical Debt Item that must be resolved before release.
                  </p>
                </div>

                {/* Enable Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#0F1114] rounded-lg">
                  <div>
                    <p className="text-[#F0F2F4] font-medium">Enable Scrappy Startup Mode</p>
                    <p className="text-xs text-[#6B7280]">Allow temporary bypass of selected rules</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleScrappyMode}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      formData.scrappy_mode_enabled ? 'bg-amber-500' : 'bg-[#2A2F36]'
                    }`}
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.scrappy_mode_enabled ? 'translate-x-8' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {formData.scrappy_mode_enabled && (
                  <>
                    {/* Bypass Options */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-[#B4BAC4]">Select bypasses to enable:</p>

                      {[
                        { key: 'phase_completeness', label: 'Non-safety phase completeness', desc: 'Allow phase progression without full artifact completion' },
                        { key: 'tier_trace_thresholds', label: 'Tier trace thresholds', desc: 'Reduce traceability requirements for rigor tiers' },
                        { key: 'full_correlation', label: 'Full correlation', desc: 'Allow deferred Phase 7 correlation activities' },
                        { key: 'selected_documentation', label: 'Selected documentation', desc: 'Reduce documentation requirements' },
                        { key: 'gantt_enforcement', label: 'Gantt target enforcement', desc: 'Disable timeline deadline warnings' }
                      ].map(bypass => (
                        <label
                          key={bypass.key}
                          className="flex items-start gap-3 p-3 bg-[#0F1114] rounded-lg cursor-pointer hover:bg-[#1C1F24] transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.scrappy_bypasses[bypass.key]}
                            onChange={() => handleBypassToggle(bypass.key)}
                            className="mt-1 w-4 h-4 rounded border-[#2A2F36] bg-[#1C1F24] text-amber-500 focus:ring-amber-500"
                          />
                          <div>
                            <p className="text-[#F0F2F4] text-sm">{bypass.label}</p>
                            <p className="text-xs text-[#6B7280]">{bypass.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Cannot Bypass Section */}
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                        <p className="text-sm font-medium text-red-400">Cannot be bypassed (ever):</p>
                      </div>
                      <ul className="text-xs text-red-300/80 ml-6 space-y-1">
                        <li>• Safety gates</li>
                        <li>• Regulatory constraints</li>
                        <li>• Violated assumptions</li>
                        <li>• High-risk unvalidated assumptions</li>
                        <li>• Open critical 8D issues</li>
                        <li>• Baseline selection in modification mode</li>
                      </ul>
                    </div>

                    {/* Acknowledgment */}
                    <label className="flex items-start gap-3 p-4 bg-[#0F1114] border border-[#2A2F36] rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.scrappy_mode_acknowledged}
                        onChange={(e) => setFormData(prev => ({ ...prev, scrappy_mode_acknowledged: e.target.checked }))}
                        className="mt-1 w-4 h-4 rounded border-[#2A2F36] bg-[#1C1F24] text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <p className="text-[#F0F2F4] text-sm font-medium">
                          I acknowledge that Scrappy Startup Mode:
                        </p>
                        <ul className="text-xs text-[#6B7280] mt-1 space-y-0.5">
                          <li>• Creates Technical Debt Items for every bypass</li>
                          <li>• Requires debt resolution before release</li>
                          <li>• Does not remove safety or regulatory requirements</li>
                          <li>• Will watermark all reports as "ENGINEERING RIGOR DEFERRED"</li>
                        </ul>
                      </div>
                    </label>

                    {formData.scrappy_mode_acknowledged && (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Scrappy Startup Mode will be enabled for this project</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Additional Info Section */}
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('additional')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#1C1F24] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-[#F0F2F4]">Additional Details</span>
                <span className="text-xs text-[#6B7280]">(optional)</span>
              </div>
              {expandedSections.additional ? (
                <ChevronUp className="w-5 h-5 text-[#6B7280]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>

            {expandedSections.additional && (
              <div className="p-6 pt-2 space-y-6">
                {/* Target Date & Team */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Target Completion Date
                    </label>
                    <input
                      type="date"
                      name="target_date"
                      value={formData.target_date}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-[#0F1114] border border-[#2A2F36] rounded-lg text-[#F0F2F4] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Team Members
                    </label>
                    <input
                      type="text"
                      name="team_members"
                      value={formData.team_members}
                      onChange={handleChange}
                      placeholder="Enter email addresses, comma separated"
                      className="w-full px-4 py-3 bg-[#0F1114] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                    <Tag className="w-4 h-4 inline mr-2" />
                    Tags (optional)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g., thermal, brake, redesign (comma separated)"
                    className="w-full px-4 py-3 bg-[#0F1114] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/design')}
              className="px-6 py-3 bg-[#1C1F24] hover:bg-[#22262C] text-[#F0F2F4] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>

        {/* Info Panel */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-blue-400 font-semibold mb-3">About the 7-Phase Engineering Design Cycle</h3>
          <p className="text-[#B4BAC4] text-sm mb-4">
            Your project will be guided through a domain-agnostic 7-phase engineering process:
          </p>
          <div className="grid grid-cols-4 gap-2 text-xs mb-4">
            {[
              '1. Requirements',
              '2. R&D',
              '3a. Design/CAD',
              '3b. Serviceability',
              '3c. Manufacturability',
              '4. Data Collection',
              '5. Analysis',
              '6. Testing',
              '7. Correlation'
            ].map(phase => (
              <span key={phase} className="bg-blue-500/20 text-blue-300 px-2 py-1.5 rounded text-center">
                {phase}
              </span>
            ))}
          </div>
          <p className="text-xs text-[#6B7280]">
            The domain lens adds context-specific terminology and prompts without altering the fundamental structure.
          </p>
        </div>
      </main>
    </div>
  );
}

export default DesignCycleNewProject;
