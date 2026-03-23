import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beaker, ArrowRight, ArrowLeft, CheckCircle, HelpCircle, Plus, X, Trash2, Upload, Download, Save, Play, Sparkles, AlertCircle, Info } from 'lucide-react';
import Header from './Header';
import { experimentApi } from './services/api';

// Tooltip Component for Term Explanations
const TermTooltip = ({ term, explanation, example }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        className="border-b-2 border-dotted border-blue-400/50 cursor-help hover:border-blue-400 transition"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {term}
      </span>
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 bg-slate-900 border border-blue-500/30 rounded-xl shadow-2xl shadow-violet-500/20 -top-2 left-0 transform -translate-y-full ml-0 backdrop-blur-xl">
          <div className="flex items-start space-x-2 mb-2">
            <HelpCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-[#F0F2F4] text-sm mb-1">{term}</div>
              <div className="text-[#B4BAC4] text-xs leading-relaxed mb-2">{explanation}</div>
              {example && (
                <div className="text-xs text-blue-300 italic bg-blue-500/10 p-2 rounded border border-blue-500/20">
                  Example: {example}
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-slate-900 border-r border-b border-blue-500/30"></div>
        </div>
      )}
    </span>
  );
};

// Info Callout Component
const InfoCallout = ({ children }) => {
  return (
    <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 flex items-start space-x-3">
      <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-200 leading-relaxed">{children}</p>
    </div>
  );
};

const ExperimentWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [experimentData, setExperimentData] = useState({
    name: '',
    experimenter: '',
    description: '',
    tags: [],
    designType: '',
    factors: [],
    responses: []
  });
  const [availableFactors, setAvailableFactors] = useState([]);
  const [availableResponses, setAvailableResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load available factors and responses from API
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [factors, responses] = await Promise.all([
          experimentApi.getFactors(),
          experimentApi.getResponses()
        ]);
        setAvailableFactors(factors);
        setAvailableResponses(responses);
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    }
    loadMetadata();
  }, []);

  const steps = [
    { number: 1, title: 'Basic Info', description: 'Name and describe your experiment' },
    { number: 2, title: 'Design Type', description: 'Choose experimental design' },
    { number: 3, title: 'Factors', description: 'Define independent variables' },
    { number: 4, title: 'Responses', description: 'Define what you\'ll measure' },
    { number: 5, title: 'Review', description: 'Confirm and generate design' }
  ];

  const designTypes = [
    {
      id: 'full-factorial',
      name: 'Full Factorial',
      icon: '🎯',
      description: 'Test all possible combinations',
      runsFormula: '2^k',
      bestFor: '2-5 factors',
      pros: ['Complete information', 'All interactions visible', 'Simple interpretation'],
      cons: ['More runs required', 'Not efficient for >5 factors'],
      tooltip: {
        explanation: 'Tests every possible combination of factor levels. Provides complete information about main effects and all interactions.',
        example: '3 factors × 2 levels = 8 runs total (2³)'
      }
    },
    {
      id: 'fractional-factorial',
      name: 'Fractional Factorial',
      icon: '⚡',
      description: 'Efficient factor screening',
      runsFormula: '2^(k-p)',
      bestFor: '5-15 factors',
      pros: ['Fewer runs needed', 'Identifies key factors', 'Cost effective'],
      cons: ['Some interactions confounded', 'May need follow-up'],
      tooltip: {
        explanation: 'Tests a carefully chosen fraction of all combinations. Efficiently identifies important factors with fewer experimental runs.',
        example: '7 factors: 64 runs (fractional) vs 128 runs (full factorial)'
      }
    },
    {
      id: 'plackett-burman',
      name: 'Plackett-Burman',
      icon: '🚀',
      description: 'Screen many factors quickly',
      runsFormula: 'N+1',
      bestFor: '7-30+ factors',
      pros: ['Maximum efficiency', 'Screen many factors', 'Minimal runs'],
      cons: ['Main effects only', 'Assumes interactions negligible'],
      tooltip: {
        explanation: 'Ultra-efficient screening design. Tests N factors with only N+1 runs, assuming interactions are minimal.',
        example: '11 factors tested with just 12 runs'
      }
    }
  ];

  // Sample factors and responses for demo
  const [factors, setFactors] = useState([
    { id: 1, name: 'Temperature', units: '°C', lowLevel: '150', highLevel: '200', type: 'continuous', includeMidpoint: false, midpointValue: '' },
    { id: 2, name: 'Pressure', units: 'psi', lowLevel: '50', highLevel: '100', type: 'continuous', includeMidpoint: false, midpointValue: '' }
  ]);

  const [responses, setResponses] = useState([
    { id: 1, name: 'Strength', units: 'MPa', goal: 'maximize', targetValue: '' }
  ]);

  const addFactor = () => {
    setFactors([...factors, { 
      id: factors.length + 1, 
      name: '', 
      units: '', 
      lowLevel: '', 
      highLevel: '', 
      type: 'continuous',
      includeMidpoint: false,
      midpointValue: ''
    }]);
  };

  const removeFactor = (id) => {
    setFactors(factors.filter(f => f.id !== id));
  };

  const addResponse = () => {
    setResponses([...responses, { 
      id: responses.length + 1, 
      name: '', 
      units: '', 
      goal: 'target',
      targetValue: '' 
    }]);
  };

  const removeResponse = (id) => {
    setResponses(responses.filter(r => r.id !== id));
  };

  const updateFactor = (id, field, value) => {
    setFactors(factors.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const updateResponse = (id, field, value) => {
    setResponses(responses.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const calculateRuns = (designType) => {
    const k = factors.length;
    if (designType === 'full-factorial') return Math.pow(2, k);
    if (designType === 'fractional-factorial') return Math.pow(2, Math.max(3, k - 2));
    if (designType === 'plackett-burman') return k + 1;
    return 0;
  };

  const generateExperiment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Map design type to database format
      const designTypeMap = {
        'full-factorial': 'full_factorial',
        'fractional-factorial': 'fractional_factorial',
        'plackett-burman': 'plackett_burman',
        'response-surface': 'central_composite',
        'box-behnken': 'box_behnken'
      };

      const hasCenterPoints = factors.some(f => f.includeMidpoint);
      const finalDesignType = hasCenterPoints ? 'full_factorial_with_center' : designTypeMap[experimentData.designType];

      // Calculate total runs
      const baseRuns = calculateRuns(experimentData.designType);
      const centerPointRuns = hasCenterPoints ? 4 : 0;
      const totalRuns = baseRuns + centerPointRuns;

      // Create experiment
      const result = await experimentApi.create({
        userId: 1, // Demo user
        name: experimentData.name,
        description: experimentData.description,
        designType: finalDesignType,
        totalRuns,
        factors: factors.map((factor, idx) => ({
          factorId: factor.id || (idx + 1),
          lowLevel: parseFloat(factor.lowLevel),
          highLevel: parseFloat(factor.highLevel),
          centerPoint: factor.includeMidpoint ? parseFloat(factor.midpointValue) : null
        })),
        responses: responses.map((response, idx) => ({
          responseId: response.id || (idx + 1)
        })),
        isPublic: true
      });

      // Navigate to the newly created experiment
      navigate(`/doe/experiment/${result.id}`);
    } catch (err) {
      console.error('Failed to create experiment:', err);
      setError(err.message || 'Failed to create experiment');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1114] text-gray-50">
      {/* Navigation Header */}
      <Header />

      {/* Page Header */}
      <header className="border-b border-[#2A2F36] bg-[#0F1114]/95 backdrop-blur-xl sticky top-16 z-40 mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Beaker className="w-6 h-6 text-[#F0F2F4]" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                  DOE Platform
                </h1>
                <p className="text-xs text-[#6B7280]">Create New Experiment</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="text-[#6B7280] hover:text-gray-200 transition px-4 py-2 rounded-lg hover:bg-[#1C1F24]">
                Cancel
              </button>
              <button className="bg-slate-800/60 text-[#B4BAC4] px-4 py-2 rounded-lg hover:bg-slate-800 transition border border-[#2A2F36] flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-[#2A2F36] bg-[#15181C]/30 backdrop-blur-sm sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex items-center space-x-3 flex-1">
                  <div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                      currentStep > step.number 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-[#F0F2F4] shadow-lg shadow-green-500/30'
                        : currentStep === step.number
                        ? 'bg-blue-600 text-[#F0F2F4] shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/30'
                        : 'bg-[#1C1F24] text-[#6B7280] border border-[#2A2F36]'
                    }`}
                  >
                    {currentStep > step.number ? <CheckCircle className="w-6 h-6" /> : step.number}
                  </div>
                  <div className="hidden md:block">
                    <div className={`font-semibold text-sm transition-colors ${
                      currentStep >= step.number ? 'text-[#F0F2F4]' : 'text-[#6B7280]'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-[#6B7280]">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden md:block h-0.5 flex-1 mx-4 transition-colors ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-slate-700/50'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-violet-100 bg-clip-text text-transparent">
                Let's start with the basics
              </h2>
              <p className="text-[#6B7280] text-lg">Tell us about your experiment so you can find it later</p>
            </div>

            <div className="space-y-6">
              {/* Experiment Name */}
              <div>
                <label className="block text-sm font-semibold text-[#B4BAC4] mb-2">
                  Experiment Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Injection Molding Parameter Study"
                  className="w-full px-4 py-3 bg-[#15181C] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                  value={experimentData.name}
                  onChange={(e) => setExperimentData({...experimentData, name: e.target.value})}
                />
              </div>

              {/* Experimenter Name */}
              <div>
                <label className="block text-sm font-semibold text-[#B4BAC4] mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Jane Smith"
                  className="w-full px-4 py-3 bg-[#15181C] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                  value={experimentData.experimenter}
                  onChange={(e) => setExperimentData({...experimentData, experimenter: e.target.value})}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[#B4BAC4] mb-2">
                  Description (Optional)
                </label>
                <textarea
                  rows="4"
                  placeholder="Describe the purpose of this experiment, what you're trying to optimize, or any important context..."
                  className="w-full px-4 py-3 bg-[#15181C] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                  value={experimentData.description}
                  onChange={(e) => setExperimentData({...experimentData, description: e.target.value})}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-[#B4BAC4] mb-2">
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Add tags separated by commas: manufacturing, quality, process-optimization"
                  className="w-full px-4 py-3 bg-[#15181C] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                />
                <p className="text-xs text-[#6B7280] mt-2">Tags help you organize and find experiments later</p>
              </div>
            </div>

            <InfoCallout>
              <strong>Phase 1 MVP:</strong> All experiments are currently public. Private experiments and team collaboration will be added in Phase 3.
            </InfoCallout>
          </div>
        )}

        {/* Step 2: Design Type Selection */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-violet-100 bg-clip-text text-transparent">
                Choose your experimental design
              </h2>
              <p className="text-[#6B7280] text-lg">
                Select the design type that best fits your <TermTooltip 
                  term="number of factors"
                  explanation="Factors are the independent variables you'll change in your experiment."
                  example="Temperature, pressure, and mixing time are 3 factors"
                /> and research goals
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {designTypes.map((design) => (
                <div
                  key={design.id}
                  onClick={() => setExperimentData({...experimentData, designType: design.id})}
                  className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 ${
                    experimentData.designType === design.id
                      ? 'border-blue-500 bg-gradient-to-br from-violet-500/10 to-purple-500/5 shadow-xl shadow-violet-500/20 scale-105'
                      : 'border-[#2A2F36] bg-[#15181C] hover:border-blue-500/30 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="text-5xl mb-4">{design.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">
                    <TermTooltip 
                      term={design.name}
                      explanation={design.tooltip.explanation}
                      example={design.tooltip.example}
                    />
                  </h3>
                  <p className="text-[#6B7280] mb-4 text-sm">{design.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">Runs:</span>
                      <code className="text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded">{design.runsFormula}</code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6B7280]">Best for:</span>
                      <span className="text-[#B4BAC4] font-medium">{design.bestFor}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#2A2F36] pt-4 space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-green-400 mb-1.5">Pros:</div>
                      <ul className="space-y-1">
                        {design.pros.map((pro, i) => (
                          <li key={i} className="text-xs text-[#6B7280] flex items-start space-x-2">
                            <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-amber-400 mb-1.5">Cons:</div>
                      <ul className="space-y-1">
                        {design.cons.map((con, i) => (
                          <li key={i} className="text-xs text-[#6B7280] flex items-start space-x-2">
                            <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {experimentData.designType === design.id && (
                    <div className="mt-4 pt-4 border-t border-blue-500/30">
                      <div className="flex items-center justify-center space-x-2 text-blue-400 text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        <span>Selected</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {experimentData.designType && (
              <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-blue-500/30 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-[#F0F2F4] mb-2">Good choice!</h4>
                    <p className="text-[#B4BAC4] text-sm leading-relaxed">
                      {experimentData.designType === 'full-factorial' && 'Full factorial designs give you complete information about all factors and their interactions. Perfect for thorough analysis when you have 2-5 factors.'}
                      {experimentData.designType === 'fractional-factorial' && 'Fractional factorial designs are ideal when you have many factors to screen. You\'ll identify the important ones efficiently without running every possible combination.'}
                      {experimentData.designType === 'plackett-burman' && 'Plackett-Burman designs are the most efficient screening method available. Great when you need to test many factors quickly to find the vital few.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Factor Definition */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-violet-100 bg-clip-text text-transparent">
                Define your factors
              </h2>
              <p className="text-[#6B7280] text-lg">
                <TermTooltip 
                  term="Factors"
                  explanation="Independent variables that you will deliberately change during your experiment to see their effect."
                  example="Temperature (150-200°C), Pressure (50-100 psi), Mix Time (5-10 min)"
                /> are the variables you'll control in your experiment
              </p>
            </div>

            <InfoCallout>
              For each factor, specify the <strong>low level</strong> and <strong>high level</strong> you want to test. Optionally add <TermTooltip 
                term="center points"
                explanation="Center points are experimental runs at the midpoint of all factors. They help detect curvature (non-linear effects) and estimate pure error."
                example="If testing 150-200°C, a center point would be at 175°C"
              /> to detect curvature in your response.
            </InfoCallout>

            <div className="space-y-4">
              {factors.map((factor, index) => (
                <div key={factor.id} className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 hover:border-blue-500/30 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-[#F0F2F4] font-bold shadow-lg shadow-blue-500/30">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#F0F2F4]">Factor {index + 1}</h4>
                        <p className="text-xs text-[#6B7280]">Independent variable</p>
                      </div>
                    </div>
                    {factors.length > 1 && (
                      <button
                        onClick={() => removeFactor(factor.id)}
                        className="text-[#6B7280] hover:text-red-400 transition p-2 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#6B7280] mb-2">Factor Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., Temperature, Pressure, Mix Speed"
                        value={factor.name}
                        onChange={(e) => updateFactor(factor.id, 'name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6B7280] mb-2">Low Level *</label>
                      <input
                        type="text"
                        placeholder="150"
                        value={factor.lowLevel}
                        onChange={(e) => {
                          updateFactor(factor.id, 'lowLevel', e.target.value);
                          // Auto-calculate midpoint if both levels are numbers
                          if (factor.includeMidpoint && factor.highLevel && !isNaN(e.target.value) && !isNaN(factor.highLevel)) {
                            const mid = (parseFloat(e.target.value) + parseFloat(factor.highLevel)) / 2;
                            updateFactor(factor.id, 'midpointValue', mid.toString());
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6B7280] mb-2">High Level *</label>
                      <input
                        type="text"
                        placeholder="200"
                        value={factor.highLevel}
                        onChange={(e) => {
                          updateFactor(factor.id, 'highLevel', e.target.value);
                          // Auto-calculate midpoint if both levels are numbers
                          if (factor.includeMidpoint && factor.lowLevel && !isNaN(e.target.value) && !isNaN(factor.lowLevel)) {
                            const mid = (parseFloat(factor.lowLevel) + parseFloat(e.target.value)) / 2;
                            updateFactor(factor.id, 'midpointValue', mid.toString());
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#6B7280] mb-2">Units (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., °C, psi, rpm, minutes"
                        value={factor.units}
                        onChange={(e) => updateFactor(factor.id, 'units', e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                      />
                    </div>

                    {/* Center Point Toggle */}
                    <div className="md:col-span-2 border-t border-[#2A2F36] pt-4 mt-2">
                      <label className="flex items-start space-x-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={factor.includeMidpoint}
                            onChange={(e) => {
                              updateFactor(factor.id, 'includeMidpoint', e.target.checked);
                              // Auto-calculate midpoint when enabled
                              if (e.target.checked && factor.lowLevel && factor.highLevel && !isNaN(factor.lowLevel) && !isNaN(factor.highLevel)) {
                                const mid = (parseFloat(factor.lowLevel) + parseFloat(factor.highLevel)) / 2;
                                updateFactor(factor.id, 'midpointValue', mid.toString());
                              }
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-violet-500 peer-checked:to-purple-600 transition-all duration-300"></div>
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 peer-checked:translate-x-5"></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-[#F0F2F4] group-hover:text-blue-300 transition">
                              <TermTooltip 
                                term="Include Center Point"
                                explanation="Center points are runs at the midpoint of all factor levels. They help detect curvature (quadratic effects) and provide an estimate of pure experimental error."
                                example="With temp 150-200°C and pressure 50-100 psi, center point would be 175°C and 75 psi"
                              />
                            </span>
                            <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-400/30">
                              Recommended
                            </span>
                          </div>
                          <p className="text-xs text-[#6B7280] mt-1">
                            Detect non-linear effects and estimate experimental error
                          </p>
                        </div>
                      </label>

                      {factor.includeMidpoint && (
                        <div className="mt-4 bg-violet-500/5 border border-blue-500/20 rounded-lg p-4">
                          <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                            Center Point Value
                            {factor.lowLevel && factor.highLevel && !isNaN(factor.lowLevel) && !isNaN(factor.highLevel) && (
                              <span className="ml-2 text-xs text-blue-400">(Auto-calculated)</span>
                            )}
                          </label>
                          <input
                            type="text"
                            placeholder="Midpoint value"
                            value={factor.midpointValue}
                            onChange={(e) => updateFactor(factor.id, 'midpointValue', e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#1C1F24] border border-blue-500/30 rounded-lg text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                          />
                          <div className="mt-2 flex items-center space-x-2 text-xs text-[#6B7280]">
                            <Info className="w-3 h-3 text-blue-400" />
                            <span>
                              {factor.lowLevel && factor.highLevel && !isNaN(factor.lowLevel) && !isNaN(factor.highLevel) 
                                ? `Calculated as (${factor.lowLevel} + ${factor.highLevel}) / 2 = ${factor.midpointValue}`
                                : 'Enter numeric low/high levels for auto-calculation'
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addFactor}
              className="w-full py-4 bg-[#1C1F24] border-2 border-dashed border-[#2A2F36] rounded-xl text-[#6B7280] hover:text-blue-400 hover:border-blue-500/50 hover:bg-slate-800 transition flex items-center justify-center space-x-2 group"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add Another Factor</span>
            </button>

            {factors.length > 0 && experimentData.designType && (
              <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/70 border border-[#2A2F36] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-[#6B7280] mb-1">Estimated Factorial Runs</div>
                    <div className="text-4xl font-bold text-blue-400">
                      {calculateRuns(experimentData.designType)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#6B7280] mb-1">Design Type</div>
                    <div className="text-lg font-semibold text-[#F0F2F4] capitalize">
                      {experimentData.designType.replace('-', ' ')}
                    </div>
                  </div>
                </div>
                
                {factors.some(f => f.includeMidpoint) && (
                  <div className="border-t border-[#2A2F36] pt-4 mt-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-semibold text-[#F0F2F4] mb-1">Center Points Added</div>
                          <p className="text-sm text-[#B4BAC4] mb-2">
                            {factors.filter(f => f.includeMidpoint).length} factor(s) will include center points. 
                            Typically, 3-5 center point runs are added to the design.
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#6B7280]">Estimated total runs:</span>
                            <span className="text-xl font-bold text-blue-400">
                              {calculateRuns(experimentData.designType) + 4}
                            </span>
                          </div>
                          <div className="text-xs text-[#6B7280] mt-1">
                            ({calculateRuns(experimentData.designType)} factorial + ~4 center points)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Response Variables */}
        {currentStep === 4 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-violet-100 bg-clip-text text-transparent">
                Define your responses
              </h2>
              <p className="text-[#6B7280] text-lg">
                <TermTooltip 
                  term="Responses"
                  explanation="Dependent variables that you will measure in your experiment. These are the outcomes you want to optimize."
                  example="Product strength (MPa), Cycle time (seconds), Defect rate (%)"
                /> are what you'll measure in each experimental run
              </p>
            </div>

            <InfoCallout>
              Specify what you're trying to achieve with each response: <strong>maximize</strong> (higher is better), <strong>minimize</strong> (lower is better), or hit a <strong>target value</strong>.
            </InfoCallout>

            <div className="space-y-4">
              {responses.map((response, index) => (
                <div key={response.id} className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 hover:border-blue-500/30 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-[#F0F2F4] font-bold shadow-lg shadow-blue-500/30">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#F0F2F4]">Response {index + 1}</h4>
                        <p className="text-xs text-[#6B7280]">Measured output</p>
                      </div>
                    </div>
                    {responses.length > 1 && (
                      <button
                        onClick={() => removeResponse(response.id)}
                        className="text-[#6B7280] hover:text-red-400 transition p-2 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#6B7280] mb-2">Response Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., Tensile Strength, Cycle Time, Yield"
                        value={response.name}
                        onChange={(e) => updateResponse(response.id, 'name', e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6B7280] mb-2">Units (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., MPa, seconds, %"
                        value={response.units}
                        onChange={(e) => updateResponse(response.id, 'units', e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#6B7280] mb-2">Optimization Goal *</label>
                      <select
                        value={response.goal}
                        onChange={(e) => updateResponse(response.id, 'goal', e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                      >
                        <option value="maximize">Maximize (higher is better)</option>
                        <option value="minimize">Minimize (lower is better)</option>
                        <option value="target">Target value</option>
                      </select>
                    </div>

                    {response.goal === 'target' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#6B7280] mb-2">Target Value</label>
                        <input
                          type="text"
                          placeholder="Enter target value"
                          value={response.targetValue}
                          onChange={(e) => updateResponse(response.id, 'targetValue', e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addResponse}
              className="w-full py-4 bg-[#1C1F24] border-2 border-dashed border-[#2A2F36] rounded-xl text-[#6B7280] hover:text-blue-400 hover:border-blue-500/50 hover:bg-slate-800 transition flex items-center justify-center space-x-2 group"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Add Another Response</span>
            </button>
          </div>
        )}

        {/* Step 5: Review & Generate */}
        {currentStep === 5 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-violet-100 bg-clip-text text-transparent">
                Review and generate
              </h2>
              <p className="text-[#6B7280] text-lg">Check everything looks good before generating your experimental design</p>
            </div>

            {/* Experiment Summary */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-[#2A2F36] rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-[#F0F2F4] mb-6">Experiment Summary</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Experiment Name</div>
                  <div className="text-lg font-semibold text-[#F0F2F4]">{experimentData.name || 'Not specified'}</div>
                </div>

                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Experimenter</div>
                  <div className="text-lg font-semibold text-[#F0F2F4]">{experimentData.experimenter || 'Not specified'}</div>
                </div>

                {experimentData.description && (
                  <div>
                    <div className="text-sm text-[#6B7280] mb-1">Description</div>
                    <div className="text-[#B4BAC4]">{experimentData.description}</div>
                  </div>
                )}

                <div className="border-t border-[#2A2F36] pt-6">
                  <div className="text-sm text-[#6B7280] mb-3">Design Type</div>
                  <div className="inline-flex items-center space-x-3 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2">
                    <span className="text-2xl">
                      {designTypes.find(d => d.id === experimentData.designType)?.icon}
                    </span>
                    <span className="text-lg font-semibold text-[#F0F2F4] capitalize">
                      {experimentData.designType?.replace('-', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-[#2A2F36]">
                  <div>
                    <div className="text-sm text-[#6B7280] mb-3">Factors ({factors.length})</div>
                    <div className="space-y-2">
                      {factors.map((factor) => (
                        <div key={factor.id} className="bg-[#1C1F24] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium text-[#F0F2F4]">{factor.name || 'Unnamed Factor'}</div>
                            {factor.includeMidpoint && (
                              <span className="text-xs bg-violet-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-violet-400/30">
                                + Center
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-[#6B7280]">
                            Low: {factor.lowLevel} {factor.units} → High: {factor.highLevel} {factor.units}
                          </div>
                          {factor.includeMidpoint && factor.midpointValue && (
                            <div className="text-xs text-blue-400 mt-1">
                              Center: {factor.midpointValue} {factor.units}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-[#6B7280] mb-3">Responses ({responses.length})</div>
                    <div className="space-y-2">
                      {responses.map((response) => (
                        <div key={response.id} className="bg-[#1C1F24] rounded-lg p-3">
                          <div className="font-medium text-[#F0F2F4]">{response.name || 'Unnamed Response'}</div>
                          <div className="text-sm text-[#6B7280] mt-1 capitalize">
                            Goal: {response.goal.replace('-', ' ')} {response.units && `(${response.units})`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[#6B7280] mb-1">Total Experimental Runs</div>
                      <div className="text-4xl font-bold text-blue-400">
                        {calculateRuns(experimentData.designType) + (factors.some(f => f.includeMidpoint) ? 4 : 0)}
                      </div>
                      <div className="text-sm text-[#6B7280] mt-1">
                        {factors.some(f => f.includeMidpoint) 
                          ? `${calculateRuns(experimentData.designType)} factorial + 4 center points`
                          : 'runs will be generated'
                        }
                      </div>
                    </div>
                    <Sparkles className="w-16 h-16 text-blue-400 opacity-50" />
                  </div>
                  
                  {factors.some(f => f.includeMidpoint) && (
                    <div className="mt-4 pt-4 border-t border-blue-500/30 flex items-center space-x-2 text-sm text-blue-300">
                      <Info className="w-4 h-4" />
                      <span>Center points will help detect curvature and estimate error</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-[#F0F2F4] mb-2">Ready to generate your design?</h4>
                  <p className="text-[#B4BAC4] text-sm leading-relaxed mb-4">
                    We'll create a complete experimental design matrix with randomized run order. You'll be able to start entering data immediately.
                  </p>
                  <button
                    onClick={generateExperiment}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-[#F0F2F4] px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-green-500/50 transition-all duration-300 flex items-center justify-center space-x-3 hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    <span>{loading ? 'Creating Experiment...' : 'Generate Experimental Design'}</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                  {error && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-red-200">{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0F1114]/95 border-t border-[#2A2F36] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2.5 rounded-lg font-semibold transition flex items-center space-x-2 ${
                currentStep === 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-[#B4BAC4] hover:text-[#F0F2F4] hover:bg-[#1C1F24]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-sm text-[#6B7280]">
              Step {currentStep} of {steps.length}
            </div>

            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={generateExperiment}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-[#F0F2F4] px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center space-x-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                <span>{loading ? 'Creating...' : 'Generate Design'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ExperimentWizard;
