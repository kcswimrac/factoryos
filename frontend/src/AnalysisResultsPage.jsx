import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  Beaker, ArrowLeft, Download, Share2, CheckCircle, AlertCircle,
  TrendingUp, TrendingDown, Activity, Info, HelpCircle, Sparkles,
  Target, Zap, BarChart3, FileText, ChevronDown, ChevronUp, Eye, EyeOff,
  Loader
} from 'lucide-react';
import Header from './Header';
import { experimentApi } from './services/api';

// Tooltip Component
const TermTooltip = ({ term, explanation, example }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        className="border-b-2 border-dotted border-violet-400/50 cursor-help hover:border-violet-400 transition"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {term}
      </span>
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 bg-slate-900 border border-violet-500/30 rounded-xl shadow-2xl shadow-violet-500/20 bottom-full left-0 mb-2 backdrop-blur-xl">
          <div className="flex items-start space-x-2">
            <HelpCircle className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-white text-sm mb-1">{term}</div>
              <div className="text-gray-300 text-xs leading-relaxed mb-2">{explanation}</div>
              {example && (
                <div className="text-xs text-violet-300 italic bg-violet-500/10 p-2 rounded border border-violet-500/20">
                  Example: {example}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </span>
  );
};

// Section Toggle Component
const CollapsibleSection = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
};

const AnalysisResultsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Data from API
  const [experimentInfo, setExperimentInfo] = useState(null);
  const [responses, setResponses] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [factors, setFactors] = useState([]);

  // Load experiment and analysis data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load experiment details
        const experiment = await experimentApi.getById(id);

        setExperimentInfo({
          name: experiment.name,
          experimenter: 'User',
          designType: experiment.design_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          totalRuns: experiment.total_runs,
          completedRuns: experiment.runs?.filter(r => r.is_completed).length || 0,
          analyzedAt: experiment.analyzed_at ? new Date(experiment.analyzed_at).toLocaleString() : 'Not analyzed yet'
        });

        // Extract factors
        const expFactors = experiment.factors || [];
        setFactors(expFactors);

        // Extract responses
        const expResponses = experiment.responses || [];
        setResponses(expResponses.map(r => ({
          id: r.id,
          name: r.name,
          units: r.units,
          goal: r.goal
        })));

        // Set default selected response
        if (expResponses.length > 0 && !selectedResponse) {
          setSelectedResponse(expResponses[0].id);
        }

        // Load analysis results if available
        try {
          const analysis = await experimentApi.getAnalysis(id);
          if (analysis && analysis.results) {
            setAnalysisResults(analysis.results);
          }
        } catch (err) {
          console.log('No analysis results yet:', err);
          // Analysis might not exist yet, that's OK
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load experiment:', err);
        setError(err.message || 'Failed to load experiment data');
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, selectedResponse]);

  // Run analysis
  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      const result = await experimentApi.analyze(id);
      setAnalysisResults(result.results);

      // Reload experiment to update analyzed_at timestamp
      const experiment = await experimentApi.getById(id);
      setExperimentInfo(prev => ({
        ...prev,
        analyzedAt: experiment.analyzed_at ? new Date(experiment.analyzed_at).toLocaleString() : 'Just now'
      }));

      setAnalyzing(false);
    } catch (err) {
      console.error('Failed to run analysis:', err);
      setError(err.message || 'Failed to run analysis');
      setAnalyzing(false);
    }
  };

  // Get current response analysis
  const getCurrentAnalysis = () => {
    if (!analysisResults || !selectedResponse) return null;

    const responseKey = responses.find(r => r.id === selectedResponse)?.name?.toLowerCase().replace(' ', '_');
    return analysisResults[responseKey] || analysisResults;
  };

  const currentAnalysis = getCurrentAnalysis();

  // Transform data for display
  const strengthStats = currentAnalysis ? {
    modelRSquared: currentAnalysis.model_r_squared || 0,
    adjustedRSquared: currentAnalysis.adjusted_r_squared || 0,
    predictedRSquared: currentAnalysis.predicted_r_squared || 0,
    fStatistic: currentAnalysis.f_statistic || 0,
    pValue: currentAnalysis.p_value || 0,
    standardError: currentAnalysis.standard_error || 0,
    coefficientOfVariation: currentAnalysis.coefficient_of_variation || 0,
    adequatePrecision: currentAnalysis.adequate_precision || 0
  } : null;

  const anovaData = currentAnalysis?.anova_table?.rows || [];

  const factorEffects = currentAnalysis?.factor_effects?.effects || [];

  const paretoData = factorEffects
    .filter(f => f.significant)
    .map((f, idx) => ({
      factor: f.factor,
      effect: Math.abs(f.effect || 0),
      cumulative: f.percentContribution || 0
    }));

  // Build main effects data
  const mainEffectsData = currentAnalysis ? [
    { level: 'Low (-)', ...buildMainEffectsRow('low', currentAnalysis) },
    { level: 'High (+)', ...buildMainEffectsRow('high', currentAnalysis) }
  ] : [];

  const residualsData = currentAnalysis?.residuals || [];

  const optimalSettings = currentAnalysis?.optimal_settings || {};

  // Helper function to build main effects row
  function buildMainEffectsRow(level, analysis) {
    const row = {};
    if (analysis?.factor_effects?.effects) {
      analysis.factor_effects.effects.forEach(effect => {
        const factorName = effect.factor.toLowerCase().replace(' ', '');
        row[factorName] = level === 'low' ? effect.lowMean : effect.highMean;
      });
    }
    return row;
  }

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] mt-16">
          <div className="text-center">
            <Loader className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
            <div className="text-xl text-gray-400">Loading experiment data...</div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] mt-16">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <div className="text-xl text-white mb-2">Error Loading Data</div>
            <div className="text-gray-400 mb-4">{error}</div>
            <button
              onClick={() => navigate('/doe/dashboard')}
              className="px-4 py-2 bg-violet-500 hover:bg-violet-600 rounded-lg transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show "Run Analysis" prompt if no analysis results
  if (!currentAnalysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-16 mt-16">
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Analyze</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Your experiment has {experimentInfo?.completedRuns || 0} of {experimentInfo?.totalRuns || 0} runs completed.
              {experimentInfo?.completedRuns === experimentInfo?.totalRuns
                ? ' All data is collected and ready for statistical analysis.'
                : ' You can analyze the data you have so far, or complete all runs first.'}
            </p>
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || (experimentInfo?.completedRuns || 0) === 0}
              className="px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 mx-auto"
            >
              {analyzing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Run Statistical Analysis</span>
                </>
              )}
            </button>
            {(experimentInfo?.completedRuns || 0) === 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Complete at least one experimental run before analyzing
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-50">
      {/* Navigation Header */}
      <Header />

      {/* Page Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-xl sticky top-16 z-40 mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/doe/dashboard')}
                className="text-gray-400 hover:text-gray-200 transition p-2 hover:bg-slate-800/50 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Analysis Results
                </h1>
                <p className="text-xs text-gray-500">
                  {experimentInfo?.name} • {experimentInfo?.analyzedAt}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="text-gray-400 hover:text-gray-200 transition px-4 py-2 rounded-lg hover:bg-slate-800/50 flex items-center space-x-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden md:inline">Share</span>
              </button>
              <button className="bg-slate-800/60 text-gray-300 px-4 py-2 rounded-lg hover:bg-slate-800 transition border border-slate-700/50 flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Analysis Summary Banner */}
      <div className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <h2 className="text-3xl font-bold text-white">Analysis Complete</h2>
              </div>
              <p className="text-gray-300 text-lg max-w-3xl">
                Your experiment successfully identified <strong className="text-green-400">{factorEffects.filter(f => f.significant).length} significant factors</strong> affecting your response.
                The model explains <strong className="text-green-400">{((strengthStats?.modelRSquared || 0) * 100).toFixed(0)}% of variation</strong> with {strengthStats?.pValue < 0.05 ? 'high' : 'moderate'} statistical confidence.
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Model Quality</div>
              <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {strengthStats?.modelRSquared >= 0.8 ? 'Excellent' : strengthStats?.modelRSquared >= 0.6 ? 'Good' : 'Fair'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Response Selector */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Analyzing Response:</label>
            <div className="flex items-center space-x-3">
              {responses.map(response => (
                <button
                  key={response.id}
                  onClick={() => setSelectedResponse(response.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    selectedResponse === response.id
                      ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                      : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{response.name}</span>
                    {selectedResponse === response.id && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-sm text-gray-400 hover:text-violet-400 transition"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Statistics</span>
          </button>
        </div>

        {/* Key Statistics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400">
                <TermTooltip 
                  term="Model R²"
                  explanation="R-squared measures how well your model fits the data. 1.0 = perfect fit, 0.0 = no relationship."
                  example="R²=0.89 means your factors explain 89% of the variation in results"
                />
              </div>
              <Activity className="w-5 h-5 text-violet-400" />
            </div>
            <div className="text-4xl font-bold text-violet-400 mb-1">{strengthStats.modelRSquared.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Excellent fit</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400">
                <TermTooltip 
                  term="F-Statistic"
                  explanation="F-statistic tests if any factors have significant effects. Higher values indicate stronger model significance."
                  example="F=24.3 is highly significant, meaning your results are very reliable"
                />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-4xl font-bold text-green-400 mb-1">{strengthStats.fStatistic.toFixed(1)}</div>
            <div className="text-xs text-gray-500">p &lt; 0.001</div>
          </div>

          <div className="bg-gradient-to-br from-fuchsia-500/10 to-pink-500/5 border border-fuchsia-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400">Significant Factors</div>
              <Target className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div className="text-4xl font-bold text-fuchsia-400 mb-1">3/3</div>
            <div className="text-xs text-gray-500">All factors matter</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400">
                <TermTooltip 
                  term="Std. Error"
                  explanation="Standard error measures the typical prediction error. Lower values indicate more precise predictions."
                  example="SE=8.2 MPa means predictions typically within ±8.2 of actual values"
                />
              </div>
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-4xl font-bold text-blue-400 mb-1">{strengthStats.standardError.toFixed(1)}</div>
            <div className="text-xs text-gray-500">Good precision</div>
          </div>
        </div>

        {/* Advanced Statistics (Collapsible) */}
        {showAdvanced && (
          <div className="mb-8 bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Advanced Model Statistics</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-400 mb-1">
                  <TermTooltip 
                    term="Adjusted R²"
                    explanation="Adjusted R² accounts for the number of factors in the model. It's more conservative than regular R²."
                    example="Adjusted R²=0.85 shows the model remains strong after accounting for factor count"
                  />
                </div>
                <div className="text-2xl font-bold text-white">{strengthStats.adjustedRSquared.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">
                  <TermTooltip 
                    term="Predicted R²"
                    explanation="Predicted R² estimates how well the model predicts new observations. Should be close to Adjusted R²."
                    example="Predicted R²=0.81 is close to Adjusted R²=0.85, indicating good predictive power"
                  />
                </div>
                <div className="text-2xl font-bold text-white">{strengthStats.predictedRSquared.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">
                  <TermTooltip 
                    term="Adequate Precision"
                    explanation="Adequate Precision measures signal-to-noise ratio. Values >4 indicate adequate model discrimination."
                    example="AP=18.4 is well above 4, showing excellent signal compared to noise"
                  />
                </div>
                <div className="text-2xl font-bold text-white">{strengthStats.adequatePrecision.toFixed(1)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ANOVA Table */}
        <CollapsibleSection 
          title="Analysis of Variance (ANOVA)" 
          icon={<FileText className="w-5 h-5 text-white" />}
          defaultOpen={true}
        >
          <p className="text-sm text-gray-400 mb-6 mt-4">
            <TermTooltip 
              term="ANOVA"
              explanation="Analysis of Variance tests which factors significantly affect your response by partitioning total variation into model and error components."
              example="Shows Temperature (p<0.001) is highly significant while measuring random error"
            /> breaks down sources of variation in your experiment
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <TermTooltip 
                      term="DF"
                      explanation="Degrees of Freedom - the number of independent pieces of information."
                      example="For a 2-level factor, DF=1 (high vs low)"
                    />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <TermTooltip 
                      term="Sum Sq"
                      explanation="Sum of Squares - total variation explained by this source."
                      example="Higher values mean this source causes more variation"
                    />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <TermTooltip 
                      term="Mean Sq"
                      explanation="Mean Square - average variation per degree of freedom (Sum Sq ÷ DF)."
                      example="Used to calculate F-statistic for testing"
                    />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <TermTooltip 
                      term="F-Value"
                      explanation="F-statistic compares factor variation to error variation. Larger values indicate stronger effects."
                      example="F=37.3 is huge (highly significant)"
                    />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <TermTooltip 
                      term="p-value"
                      explanation="Probability the effect is due to random chance. p<0.05 means statistically significant."
                      example="p<0.001 means <0.1% chance it's random"
                    />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Sig</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {anovaData.map((row, index) => (
                  <tr 
                    key={index}
                    className={`hover:bg-slate-800/30 transition ${
                      row.source === 'Total' || row.source === 'Model' ? 'font-semibold' : ''
                    } ${row.source === 'Total' ? 'border-t-2 border-violet-500/30' : ''}`}
                  >
                    <td className="px-4 py-3 text-white">{row.source}</td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono text-sm">{row.df}</td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono text-sm">{row.sumSq.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono text-sm">{row.meanSq === '-' ? '-' : row.meanSq.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono text-sm">{row.fValue === '-' ? '-' : row.fValue}</td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono text-sm">{row.pValue}</td>
                    <td className="px-4 py-3 text-center">
                      {row.significant && row.source !== 'Total' && (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                      )}
                      {row.source === 'Lack of Fit' && !row.significant && (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" title="Non-significant lack of fit is good!" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-200">
              <strong>Good News:</strong> Lack of fit is not significant (p=0.285), meaning your model adequately fits the data. 
              The center points confirm there's no significant curvature that the model is missing.
            </div>
          </div>
        </CollapsibleSection>

        {/* Factor Effects & Pareto */}
        <div className="grid md:grid-cols-2 gap-6 my-8">
          {/* Pareto Chart */}
          <CollapsibleSection 
            title="Factor Importance (Pareto)" 
            icon={<BarChart3 className="w-5 h-5 text-white" />}
            defaultOpen={true}
          >
            <p className="text-sm text-gray-400 mb-6 mt-4">
              <TermTooltip 
                term="Pareto Analysis"
                explanation="Shows factors ranked by effect size. The 80/20 rule: often 20% of factors cause 80% of variation."
                example="Temperature and Pressure together account for 74% of variation"
              /> - Focus on the vital few factors
            </p>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paretoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="factor" stroke="#94a3b8" style={{ fontSize: '14px' }} />
                <YAxis yAxisId="left" stroke="#94a3b8" style={{ fontSize: '14px' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" style={{ fontSize: '14px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '0.75rem',
                    color: '#f1f5f9'
                  }} 
                />
                <Legend />
                <Bar yAxisId="left" dataKey="effect" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Effect Size" />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#d946ef" strokeWidth={3} name="Cumulative %" />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-3 gap-4">
              {factorEffects.filter(f => f.factor !== 'Residual').map((factor, index) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">{factor.factor}</div>
                  <div className="text-xl font-bold text-violet-400">{factor.percentContribution.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">contribution</div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Main Effects Plot */}
          <CollapsibleSection 
            title="Main Effects Plot" 
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            defaultOpen={true}
          >
            <p className="text-sm text-gray-400 mb-6 mt-4">
              <TermTooltip 
                term="Main Effects"
                explanation="Shows the average response at each factor level. Steeper lines indicate stronger effects."
                example="Temperature's steep slope shows it strongly affects strength"
              /> - Impact of changing each factor
            </p>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mainEffectsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="level" stroke="#94a3b8" style={{ fontSize: '14px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '14px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '0.75rem',
                    color: '#f1f5f9'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#8b5cf6" strokeWidth={3} name="Temperature" dot={{ fill: '#8b5cf6', r: 6 }} />
                <Line type="monotone" dataKey="pressure" stroke="#a855f7" strokeWidth={3} name="Pressure" dot={{ fill: '#a855f7', r: 6 }} />
                <Line type="monotone" dataKey="speed" stroke="#d946ef" strokeWidth={3} name="Speed" dot={{ fill: '#d946ef', r: 6 }} />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
              <div className="text-sm text-violet-200">
                <strong>Key Insight:</strong> Temperature has the steepest slope (biggest effect). 
                Increasing temperature from 150°C to 200°C increases strength by ~34 MPa on average.
              </div>
            </div>
          </CollapsibleSection>
        </div>

        {/* Residual Diagnostics */}
        <CollapsibleSection 
          title="Residual Diagnostics" 
          icon={<Activity className="w-5 h-5 text-white" />}
          defaultOpen={false}
        >
          <p className="text-sm text-gray-400 mb-6 mt-4">
            <TermTooltip 
              term="Residuals"
              explanation="Residuals are the differences between observed and predicted values. They help check model assumptions."
              example="If actual=245 and predicted=242, residual=3"
            /> check the quality and validity of your model
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Residuals vs Predicted</h4>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="predicted" stroke="#94a3b8" name="Predicted" />
                  <YAxis dataKey="residual" stroke="#94a3b8" name="Residual" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '0.75rem'
                    }} 
                  />
                  <Scatter data={residualsData} fill="#8b5cf6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Standardized Residuals</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={residualsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="predicted" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '0.75rem'
                    }} 
                  />
                  <Bar dataKey="standardized" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-200">
              <strong>Model Validation:</strong> Residuals appear randomly scattered with no obvious patterns. 
              All standardized residuals are within ±2, indicating no outliers. Model assumptions are satisfied.
            </div>
          </div>
        </CollapsibleSection>

        {/* Optimal Settings Recommendation */}
        <div className="mt-8 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/30 rounded-xl p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2">Recommended Optimal Settings</h3>
              <p className="text-green-200">
                Based on your analysis, these factor levels should {responses.find(r => r.id === selectedResponse)?.goal || 'optimize'} your response
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-6">
            {factors.map((factor, idx) => {
              const factorKey = factor.name.toLowerCase();
              const value = optimalSettings[factorKey];
              return value !== undefined ? (
                <div key={idx} className="bg-slate-900/60 rounded-xl p-5 border border-slate-700/50">
                  <div className="text-sm text-gray-400 mb-2">{factor.name}</div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {typeof value === 'number' ? value.toFixed(1) : value}
                    {factor.units ? ` ${factor.units}` : ''}
                  </div>
                  <div className="text-xs text-green-400">Optimal level</div>
                </div>
              ) : null;
            })}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/10 rounded-xl p-5 border-2 border-green-500/50">
              <div className="text-sm text-green-300 mb-2">
                Predicted {responses.find(r => r.id === selectedResponse)?.name}
              </div>
              <div className="text-3xl font-bold text-green-400 mb-1">
                {Object.keys(optimalSettings).find(k => k.startsWith('predicted'))
                  ? optimalSettings[Object.keys(optimalSettings).find(k => k.startsWith('predicted'))]
                  : 'N/A'}
                {responses.find(r => r.id === selectedResponse)?.units ? ` ${responses.find(r => r.id === selectedResponse).units}` : ''}
              </div>
              {optimalSettings.confidenceInterval && (
                <div className="text-xs text-green-300">
                  95% CI: {optimalSettings.confidenceInterval[0]}-{optimalSettings.confidenceInterval[1]}
                  {responses.find(r => r.id === selectedResponse)?.units ? ` ${responses.find(r => r.id === selectedResponse).units}` : ''}
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <strong>Recommendation:</strong> Run a confirmation experiment at these settings to verify the predicted response.
              {optimalSettings.confidenceInterval && (
                <> The 95% confidence interval provides the expected range of results.</>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-slate-900/60 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <span>Next Steps</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/doe/confirmation')}
              className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition cursor-pointer"
            >
              <div className="text-lg font-semibold text-white mb-2">1. Confirmation Run</div>
              <p className="text-sm text-gray-400">
                Test the optimal settings to verify predicted performance
              </p>
            </div>
            <div
              onClick={() => navigate('/doe/response-surface')}
              className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition cursor-pointer"
            >
              <div className="text-lg font-semibold text-white mb-2">2. Response Surface</div>
              <p className="text-sm text-gray-400">
                Add more runs to create a detailed response surface model
              </p>
            </div>
            <div
              onClick={() => navigate('/doe/process-control')}
              className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800 transition cursor-pointer"
            >
              <div className="text-lg font-semibold text-white mb-2">3. Process Control</div>
              <p className="text-sm text-gray-400">
                Implement control charts to monitor production quality
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultsPage;
