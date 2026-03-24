import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Beaker, ArrowLeft, Layers, TrendingUp, Info, Sparkles, Plus, Play,
  CheckCircle, Target
} from 'lucide-react';
import Header from './Header';

const ResponseSurfacePage = () => {
  const navigate = useNavigate();
  const [designType, setDesignType] = useState('');

  // Current experiment info
  const currentExperiment = {
    name: 'Injection Molding Parameter Study',
    completedRuns: 8,
    factors: 3
  };

  const designOptions = [
    {
      id: 'central-composite',
      name: 'Central Composite Design (CCD)',
      icon: '📊',
      additionalRuns: 14,
      totalRuns: 22,
      description: 'Add center points and axial points to model curvature',
      features: [
        'Models quadratic relationships',
        'Identifies optimal response region',
        'Efficient use of additional runs',
        'Industry standard for RSM'
      ],
      bestFor: 'Finding optimal settings when curvature is suspected'
    },
    {
      id: 'box-behnken',
      name: 'Box-Behnken Design',
      icon: '🎯',
      additionalRuns: 12,
      totalRuns: 20,
      description: 'Efficient 3-level design for response surfaces',
      features: [
        'Requires fewer runs than CCD',
        'No extreme factor combinations',
        'Good for 3-4 factors',
        'Safer for unstable regions'
      ],
      bestFor: 'When extreme settings may be unsafe or impractical'
    },
    {
      id: 'custom-augment',
      name: 'Custom Augmentation',
      icon: '⚙️',
      additionalRuns: 'Variable',
      totalRuns: '8+',
      description: 'Add specific runs based on your analysis needs',
      features: [
        'Maximum flexibility',
        'Target specific regions',
        'Build on existing knowledge',
        'Control budget and timeline'
      ],
      bestFor: 'When you have specific hypotheses or constraints'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0F1114] text-gray-50">
      {/* Navigation Header */}
      <Header />

      {/* Page Header */}
      <header className="border-b border-[#2A2F36] bg-slate-950/90 backdrop-blur-xl mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/doe/analysis/1')}
                className="text-[#6B7280] hover:text-gray-200 transition p-2 hover:bg-[#1C1F24] rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Layers className="w-6 h-6 text-[#F0F2F4]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#F0F2F4]">
                  Response Surface Methodology
                </h1>
                <p className="text-sm text-[#6B7280]">Build a detailed response surface model</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-200 mb-1">What is Response Surface Methodology (RSM)?</h3>
            <p className="text-sm text-blue-200/80 leading-relaxed">
              RSM extends your factorial experiment by adding runs that map out curved relationships between factors and responses.
              This helps you find the true optimal settings, not just which direction to move.
            </p>
          </div>
        </div>

        {/* Current Experiment Status */}
        <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
          <h2 className="text-xl font-bold text-[#F0F2F4] mb-4">Current Experiment</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
              <div className="text-sm text-[#6B7280] mb-1">Experiment</div>
              <div className="text-lg font-bold text-[#F0F2F4]">{currentExperiment.name}</div>
            </div>
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
              <div className="text-sm text-[#6B7280] mb-1">Completed Runs</div>
              <div className="text-2xl font-bold text-blue-400">{currentExperiment.completedRuns}</div>
            </div>
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
              <div className="text-sm text-[#6B7280] mb-1">Factors</div>
              <div className="text-2xl font-bold text-[#F0F2F4]">{currentExperiment.factors}</div>
            </div>
          </div>
        </div>

        {/* Design Selection */}
        <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
          <h2 className="text-xl font-bold text-[#F0F2F4] mb-4 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <span>Choose Augmentation Design</span>
          </h2>

          <div className="space-y-4">
            {designOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => setDesignType(option.id)}
                className={`border rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                  designType === option.id
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                    : 'border-[#2A2F36] bg-[#1C1F24] hover:border-blue-500/50 hover:bg-[#1C1F24]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="text-4xl">{option.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-[#F0F2F4] mb-1">{option.name}</h3>
                      <p className="text-[#6B7280] text-sm">{option.description}</p>
                    </div>
                  </div>
                  {designType === option.id && (
                    <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#15181C] rounded-lg p-3">
                    <div className="text-xs text-[#6B7280] mb-1">Additional Runs</div>
                    <div className="text-xl font-bold text-blue-400">{option.additionalRuns}</div>
                  </div>
                  <div className="bg-[#15181C] rounded-lg p-3">
                    <div className="text-xs text-[#6B7280] mb-1">Total Runs</div>
                    <div className="text-xl font-bold text-[#F0F2F4]">{option.totalRuns}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {option.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-[#B4BAC4]">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-[#2A2F36]">
                  <div className="text-xs text-[#6B7280] mb-1">Best for:</div>
                  <div className="text-sm text-blue-300">{option.bestFor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {designType && (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/doe/new')}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Generate Augmented Design</span>
            </button>
            <button className="bg-slate-800/60 text-[#B4BAC4] px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition border border-[#2A2F36] flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Preview Design</span>
            </button>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-green-500/30 rounded-xl p-6">
          <h3 className="font-semibold text-green-200 mb-3 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Why Add Response Surface Analysis?</span>
          </h3>
          <ul className="space-y-2 text-sm text-green-200/80">
            <li className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">•</span>
              <span>Find the true optimum, not just "higher is better"</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">•</span>
              <span>Understand how factors interact at different levels</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">•</span>
              <span>Predict performance for any factor combination</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">•</span>
              <span>Identify operating windows for robust processes</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResponseSurfacePage;
