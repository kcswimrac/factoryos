import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Beaker, ArrowLeft, TrendingUp, AlertCircle, Info, Sparkles,
  CheckCircle, Target, LineChart, BarChart3, Activity
} from 'lucide-react';
import Header from './Header';

const ProcessControlPage = () => {
  const navigate = useNavigate();
  const [chartType, setChartType] = useState('');

  // Optimal settings from previous experiment
  const optimalSettings = {
    temperature: 200,
    pressure: 70,
    speed: 30,
    targetStrength: 315,
    toleranceRange: 10
  };

  const chartOptions = [
    {
      id: 'xbar-r',
      name: 'X-bar and R Charts',
      icon: '📊',
      description: 'Monitor process mean and variability using subgroup data',
      features: [
        'Most common control chart type',
        'Tracks both average and range',
        'Requires subgroups of 2-10 samples',
        'Detects shifts in process mean'
      ],
      bestFor: 'Continuous production with rational subgroups',
      sampleSize: '3-5 per subgroup',
      frequency: 'Every 1-2 hours'
    },
    {
      id: 'individuals',
      name: 'Individual-X and Moving Range',
      icon: '📈',
      description: 'Monitor individual measurements when subgrouping is impractical',
      features: [
        'One measurement at a time',
        'No subgrouping required',
        'Simpler data collection',
        'Good for automated systems'
      ],
      bestFor: 'Slow processes or automated measurements',
      sampleSize: '1 per time point',
      frequency: 'As available'
    },
    {
      id: 'ewma',
      name: 'EWMA (Exponentially Weighted Moving Average)',
      icon: '🎯',
      description: 'Detect small process shifts more quickly',
      features: [
        'More sensitive to small shifts',
        'Weighted historical data',
        'Faster detection',
        'Smoother control limits'
      ],
      bestFor: 'Detecting small sustained shifts (< 1.5σ)',
      sampleSize: '1 per time point',
      frequency: 'Continuous'
    },
    {
      id: 'cusum',
      name: 'CUSUM (Cumulative Sum)',
      icon: '📉',
      description: 'Cumulative tracking for early shift detection',
      features: [
        'Excellent for small shifts',
        'Cumulative decision making',
        'V-mask or tabular method',
        'Shows trend direction'
      ],
      bestFor: 'High-volume production with small target shifts',
      sampleSize: '1 per time point',
      frequency: 'Continuous'
    }
  ];

  const controlLimitCalculations = [
    {
      parameter: 'Upper Control Limit (UCL)',
      formula: 'X̄ + 3σ',
      value: `${optimalSettings.targetStrength + 15} MPa`
    },
    {
      parameter: 'Center Line (CL)',
      formula: 'X̄',
      value: `${optimalSettings.targetStrength} MPa`
    },
    {
      parameter: 'Lower Control Limit (LCL)',
      formula: 'X̄ - 3σ',
      value: `${optimalSettings.targetStrength - 15} MPa`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-50">
      {/* Navigation Header */}
      <Header />

      {/* Page Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/doe/analysis/1')}
                className="text-gray-400 hover:text-gray-200 transition p-2 hover:bg-slate-800/50 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Process Control Implementation
                </h1>
                <p className="text-sm text-gray-400">Monitor production quality with control charts</p>
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
            <h3 className="font-semibold text-blue-200 mb-1">What are Control Charts?</h3>
            <p className="text-sm text-blue-200/80 leading-relaxed">
              Control charts are statistical tools that help you monitor process stability over time. They detect when your process
              drifts from the optimal settings identified in your DOE, allowing you to take corrective action before defects occur.
            </p>
          </div>
        </div>

        {/* Target Settings */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Target className="w-6 h-6 text-violet-400" />
            <span>Target Process Settings</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Temperature</div>
              <div className="text-2xl font-bold text-white">{optimalSettings.temperature}°C</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Pressure</div>
              <div className="text-2xl font-bold text-white">{optimalSettings.pressure} MPa</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Speed</div>
              <div className="text-2xl font-bold text-white">{optimalSettings.speed} mm/s</div>
            </div>
            <div className="bg-violet-500/10 border border-violet-400/30 rounded-lg p-4">
              <div className="text-sm text-violet-300 mb-1">Target Strength</div>
              <div className="text-2xl font-bold text-violet-400">{optimalSettings.targetStrength} MPa</div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-4">
            <p className="text-sm text-amber-200">
              <strong>Recommended Tolerance:</strong> ±{optimalSettings.toleranceRange} MPa around target strength
            </p>
          </div>
        </div>

        {/* Control Limit Calculations */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Control Limit Calculations</h2>

          <div className="space-y-3">
            {controlLimitCalculations.map((calc, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{calc.parameter}</div>
                  <div className="text-sm text-gray-400 font-mono">{calc.formula}</div>
                </div>
                <div className="text-2xl font-bold text-violet-400">{calc.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-blue-500/10 border border-blue-400/30 rounded-lg p-3">
            <p className="text-sm text-blue-200">
              <strong>Note:</strong> These are preliminary limits based on process capability.
              Refine after collecting 20-25 subgroups of production data.
            </p>
          </div>
        </div>

        {/* Chart Type Selection */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span>Choose Control Chart Type</span>
          </h2>

          <div className="space-y-4">
            {chartOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => setChartType(option.id)}
                className={`border rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                  chartType === option.id
                    ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-violet-500/50 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="text-4xl">{option.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{option.name}</h3>
                      <p className="text-gray-400 text-sm">{option.description}</p>
                    </div>
                  </div>
                  {chartType === option.id && (
                    <CheckCircle className="w-6 h-6 text-violet-400 flex-shrink-0" />
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Sample Size</div>
                    <div className="text-lg font-bold text-violet-400">{option.sampleSize}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Sampling Frequency</div>
                    <div className="text-lg font-bold text-white">{option.frequency}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {option.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-700/50">
                  <div className="text-xs text-gray-400 mb-1">Best for:</div>
                  <div className="text-sm text-violet-300">{option.bestFor}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Implementation Steps */}
        {chartType && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Implementation Steps</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-400 font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Establish Data Collection Process</h3>
                  <p className="text-sm text-gray-400">
                    Set up a systematic method to collect measurements at the specified frequency.
                    Train operators on proper measurement techniques.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-400 font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Collect Baseline Data</h3>
                  <p className="text-sm text-gray-400">
                    Gather 20-25 subgroups of data while the process is in control.
                    Calculate initial control limits from this baseline data.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-400 font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Plot Control Charts</h3>
                  <p className="text-sm text-gray-400">
                    Create control charts with UCL, CL, and LCL. Plot new measurements in real-time or at regular intervals.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-400 font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Monitor for Out-of-Control Signals</h3>
                  <p className="text-sm text-gray-400">
                    Watch for points beyond control limits, runs of 7+ points on one side, or trends.
                    Investigate and correct special causes immediately.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-400 font-bold">5</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Update Limits Periodically</h3>
                  <p className="text-sm text-gray-400">
                    Recalculate control limits after process improvements or when the process fundamentally changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {chartType && (
          <div className="flex items-center space-x-4">
            <button
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center justify-center space-x-2"
            >
              <LineChart className="w-5 h-5" />
              <span>Generate Control Chart Template</span>
            </button>
            <button className="bg-slate-800/60 text-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition border border-slate-700/50 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Export Setup Guide</span>
            </button>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-green-500/30 rounded-xl p-6">
          <h3 className="font-semibold text-green-200 mb-3 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Benefits of Process Control</span>
          </h3>
          <ul className="space-y-2 text-sm text-green-200/80">
            <li className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">•</span>
              <span>Detect process shifts before defects are produced</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">•</span>
              <span>Reduce variation and improve consistency</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">•</span>
              <span>Distinguish between common cause and special cause variation</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">•</span>
              <span>Provide objective evidence of process stability</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-400 font-bold">•</span>
              <span>Support continuous improvement initiatives</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProcessControlPage;
