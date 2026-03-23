import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Beaker, ArrowLeft, Save, Download, Upload, Play, CheckCircle, Clock,
  AlertCircle, TrendingUp, BarChart3, RefreshCw, Info, HelpCircle,
  FileSpreadsheet, Sparkles, Edit2, Check, X, ChevronDown, ChevronUp
} from 'lucide-react';
import Header from './Header';
import { experimentApi } from './services/api';

// Tooltip Component
const TermTooltip = ({ term, explanation, example }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-block">
      <span
        className="border-b-2 border-dotted border-blue-400/50 cursor-help hover:border-violet-400 transition"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {term}
      </span>
      {isVisible && (
        <div className="absolute z-50 w-80 p-4 bg-slate-900 border border-blue-500/30 rounded-xl shadow-2xl shadow-violet-500/20 bottom-full left-0 mb-2 backdrop-blur-xl">
          <div className="flex items-start space-x-2">
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
        </div>
      )}
    </span>
  );
};

const DesignMatrixPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [experimentInfo, setExperimentInfo] = useState(null);
  const [factors, setFactors] = useState([]);
  const [responses, setResponses] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [editingCell, setEditingCell] = useState(null);
  const [sortBy, setSortBy] = useState('runOrder'); // 'runOrder' or 'stdOrder'
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  // Load experiment data from API
  useEffect(() => {
    if (id) {
      loadExperiment();
    }
  }, [id]);

  async function loadExperiment() {
    try {
      setLoading(true);
      const data = await experimentApi.getById(id);

      setExperimentInfo({
        name: data.name,
        experimenter: data.experimenter,
        designType: formatDesignType(data.design_type),
        createdAt: formatDate(data.created_at),
        status: data.status
      });

      setFactors(data.factors || []);
      setResponses(data.responses || []);

      // Transform runs data for table display
      const transformedRuns = (data.runs || []).map(run => {
        const runData = {
          id: run.id,
          runOrder: run.run_number,
          stdOrder: run.run_number,
          type: run.run_type === 'center_point' ? 'center' : 'factorial',
          completed: run.is_completed
        };

        // Add factor level values
        (run.factor_levels || []).forEach(fl => {
          runData[fl.factor_name.toLowerCase()] = fl.level_value;
        });

        // Add measurement values
        (run.measurements || []).forEach(m => {
          runData[m.response_name.toLowerCase().replace(' ', '')] = m.measured_value;
          runData[`${m.response_name.toLowerCase().replace(' ', '')}_measurement_id`] = m.id;
          runData[`${m.response_name.toLowerCase().replace(' ', '')}_response_id`] = m.response_id;
        });

        return runData;
      });

      setRuns(transformedRuns);
      setError(null);
    } catch (err) {
      console.error('Failed to load experiment:', err);
      setError(err.message || 'Failed to load experiment');
    } finally {
      setLoading(false);
    }
  }

  function formatDesignType(dbType) {
    const typeMap = {
      'full_factorial': 'Full Factorial',
      'full_factorial_with_center': 'Full Factorial with Center Points',
      'fractional_factorial': 'Fractional Factorial',
      'central_composite': 'Central Composite',
      'box_behnken': 'Box-Behnken',
      'plackett_burman': 'Plackett-Burman'
    };
    return typeMap[dbType] || dbType;
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  const completedRuns = runs.filter(r => r.completed).length;
  const totalRuns = runs.length;
  const progress = (completedRuns / totalRuns) * 100;

  const updateRunData = async (runId, field, value) => {
    // Find the response this field belongs to
    const response = responses.find(r => {
      const fieldName = r.name.toLowerCase().replace(' ', '');
      return field === fieldName;
    });

    if (!response) {
      // Not a response field, just update locally
      setRuns(runs.map(run => run.id === runId ? { ...run, [field]: value } : run));
      return;
    }

    // Save measurement to database
    try {
      setSaving(true);
      const run = runs.find(r => r.id === runId);
      const responseIdKey = `${field}_response_id`;

      await experimentApi.updateMeasurement(
        runId,
        run[responseIdKey] || response.id,
        parseFloat(value) || null
      );

      // Update local state
      setRuns(runs.map(run => {
        if (run.id === runId) {
          const updatedRun = { ...run, [field]: parseFloat(value) || null };

          // Check if all response fields are filled
          const allFieldsFilled = responses.every(r => {
            const fieldName = r.name.toLowerCase().replace(' ', '');
            return updatedRun[fieldName] !== null && updatedRun[fieldName] !== '';
          });

          updatedRun.completed = allFieldsFilled;
          return updatedRun;
        }
        return run;
      }));

      setEditingCell(null);
    } catch (err) {
      console.error('Failed to save measurement:', err);
    } finally {
      setSaving(false);
    }
  };

  const sortedRuns = [...runs].sort((a, b) => {
    if (sortBy === 'runOrder') return a.runOrder - b.runOrder;
    return a.stdOrder - b.stdOrder;
  });

  const canAnalyze = completedRuns >= Math.ceil(totalRuns * 0.5); // At least 50% complete

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1114] text-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-[#6B7280]">Loading experiment data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0F1114] text-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-red-200 mb-2">Failed to Load Experiment</h3>
              <p className="text-red-200/80 mb-4">{error}</p>
              <button
                onClick={() => navigate('/doe/dashboard')}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-lg transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  if (!experimentInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F1114] text-gray-50">
      {/* Navigation Header */}
      <Header />

      {/* Page Header */}
      <header className="border-b border-slate-800/50 bg-[#0F1114]/95 backdrop-blur-xl sticky top-16 z-40 mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/doe/dashboard')}
                className="text-[#6B7280] hover:text-gray-200 transition p-2 hover:bg-[#1C1F24] rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Beaker className="w-6 h-6 text-[#F0F2F4]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#F0F2F4]">
                  {experimentInfo.name}
                </h1>
                <p className="text-xs text-[#6B7280]">
                  Created {experimentInfo.createdAt} • {experimentInfo.designType}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="text-[#6B7280] hover:text-gray-200 transition px-4 py-2 rounded-lg hover:bg-[#1C1F24] flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Export CSV</span>
              </button>
              <button className="bg-[#1C1F24]/60 text-[#B4BAC4] px-4 py-2 rounded-lg hover:bg-[#1C1F24] transition border border-[#2A2F36] flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={() => canAnalyze && navigate('/doe/analysis/1')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
                  canAnalyze
                    ? 'bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] hover:shadow-lg hover:shadow-violet-500/50 hover:scale-105'
                    : 'bg-[#2A2F36] text-[#6B7280] cursor-not-allowed'
                }`}
                disabled={!canAnalyze}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Analyze</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Banner */}
      <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-[#F0F2F4] mb-1">Experimental Progress</h2>
              <p className="text-[#6B7280]">
                <TermTooltip 
                  term="Run order"
                  explanation="The randomized sequence in which experiments should be performed. Randomization prevents systematic bias and time-based effects."
                  example="Run experiments in random order (5, 2, 7, 1...) not sequential order (1, 2, 3, 4...)"
                /> has been randomized to reduce bias
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                {completedRuns}/{totalRuns}
              </div>
              <div className="text-sm text-[#6B7280]">Runs Completed</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className="h-3 bg-[#1C1F24] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 hover:bg-blue-500 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="absolute -top-1 right-0 text-xs text-blue-400 font-semibold">
              {progress.toFixed(0)}%
            </div>
          </div>

          {/* Status Messages */}
          {completedRuns === 0 && (
            <div className="mt-4 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-blue-200 mb-1">Ready to Start</div>
                <p className="text-sm text-blue-200/80">
                  Perform experiments in <strong>run order</strong> (not standard order) to ensure proper randomization. 
                  Enter results as you complete each run.
                </p>
              </div>
            </div>
          )}

          {completedRuns > 0 && !canAnalyze && (
            <div className="mt-4 bg-amber-500/10 border border-amber-400/30 rounded-xl p-4 flex items-start space-x-3">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-amber-200 mb-1">In Progress</div>
                <p className="text-sm text-amber-200/80">
                  Complete at least <strong>{Math.ceil(totalRuns * 0.5) - completedRuns} more runs</strong> before running analysis 
                  ({Math.ceil(totalRuns * 0.5)} total minimum).
                </p>
              </div>
            </div>
          )}

          {canAnalyze && completedRuns < totalRuns && (
            <div className="mt-4 bg-green-500/10 border border-green-400/30 rounded-xl p-4 flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-green-200 mb-1">Ready for Preliminary Analysis</div>
                <p className="text-sm text-green-200/80">
                  You can run analysis now, but completing all runs will give more accurate results.
                </p>
              </div>
            </div>
          )}

          {completedRuns === totalRuns && (
            <div className="mt-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-xl p-4 flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-green-200 mb-1">All Runs Complete!</div>
                <p className="text-sm text-green-200/80">
                  All experimental runs have been completed. Click <strong>Analyze</strong> to view your results.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Quick Actions Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSortBy(sortBy === 'runOrder' ? 'stdOrder' : 'runOrder')}
              className="bg-[#1C1F24]/60 text-[#B4BAC4] px-4 py-2 rounded-lg hover:bg-[#1C1F24] transition border border-[#2A2F36] flex items-center space-x-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sort by: {sortBy === 'runOrder' ? 'Run Order' : 'Standard Order'}</span>
            </button>
            
            <button
              onClick={() => setShowCsvUpload(!showCsvUpload)}
              className="bg-[#1C1F24]/60 text-[#B4BAC4] px-4 py-2 rounded-lg hover:bg-[#1C1F24] transition border border-[#2A2F36] flex items-center space-x-2 text-sm"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Import CSV</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-sm text-[#6B7280]">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#1C1F24] rounded-lg border border-[#2A2F36]">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Factorial Runs</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#1C1F24] rounded-lg border border-[#2A2F36]">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span>Center Points</span>
            </div>
          </div>
        </div>

        {/* CSV Upload Panel */}
        {showCsvUpload && (
          <div className="mb-6 bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
            <div className="flex items-start space-x-4">
              <FileSpreadsheet className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-[#F0F2F4] mb-2">Bulk Import from CSV</h3>
                <p className="text-sm text-[#6B7280] mb-4">
                  Upload a CSV file with your experimental results. The file should include columns for each response variable.
                </p>
                <div className="flex items-center space-x-3">
                  <label className="flex-1 cursor-pointer">
                    <div className="border-2 border-dashed border-[#2A2F36] rounded-lg p-6 text-center hover:border-blue-500/50 hover:bg-[#1C1F24]/30 transition">
                      <Upload className="w-8 h-8 text-[#6B7280] mx-auto mb-2" />
                      <div className="text-sm text-[#6B7280]">
                        Click to upload or drag and drop
                      </div>
                      <div className="text-xs text-[#6B7280] mt-1">CSV files only</div>
                    </div>
                    <input type="file" accept=".csv" className="hidden" />
                  </label>
                </div>
              </div>
              <button
                onClick={() => setShowCsvUpload(false)}
                className="text-[#6B7280] hover:text-[#B4BAC4] transition p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Design Matrix Table */}
        <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden">
          <div className="p-6 border-b border-[#2A2F36]">
            <h3 className="text-xl font-bold text-[#F0F2F4] mb-2">
              <TermTooltip 
                term="Design Matrix"
                explanation="A table showing all experimental runs with their factor settings. Each row is one experiment to perform."
                example="Row 1: Temperature=150°C, Pressure=50psi, Speed=100rpm"
              />
            </h3>
            <p className="text-sm text-[#6B7280]">
              Enter your experimental results in the response columns below
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1C1F24] border-b border-[#2A2F36]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    <TermTooltip 
                      term="Run Order"
                      explanation="The randomized sequence in which you should perform experiments."
                      example="Do Run #5 first, then Run #2, then Run #7..."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    <TermTooltip 
                      term="Std Order"
                      explanation="Standard order - the systematic sequence of factor combinations. Used for reference only."
                      example="Standard order 1-8 for a 2³ factorial design"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                    Type
                  </th>
                  {factors.map(factor => (
                    <th key={factor.id} className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                      <div className="flex flex-col">
                        <span>{factor.name}</span>
                        <span className="text-[#6B7280] font-normal text-xs mt-0.5">({factor.units})</span>
                      </div>
                    </th>
                  ))}
                  {responses.map(response => (
                    <th key={response.id} className="px-4 py-3 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider bg-blue-500/5">
                      <div className="flex flex-col">
                        <span>{response.name}</span>
                        <span className="text-blue-400 font-normal text-xs mt-0.5">({response.units})</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedRuns.map((run, index) => (
                  <tr 
                    key={run.id} 
                    className={`hover:bg-[#1C1F24]/30 transition ${
                      run.completed ? 'bg-green-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      {run.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-[#6B7280]" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                        run.type === 'factorial'
                          ? 'bg-blue-600 text-[#F0F2F4] shadow-lg shadow-blue-500/30'
                          : 'bg-blue-500 text-[#F0F2F4] shadow-lg shadow-blue-500/30'
                      }`}>
                        {run.runOrder}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] text-sm">
                      {run.stdOrder}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        run.type === 'factorial'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        {run.type === 'factorial' ? 'Factorial' : 'Center Pt'}
                      </span>
                    </td>
                    {factors.map(factor => {
                      const value = run[factor.name.toLowerCase()];
                      return (
                        <td key={factor.id} className="px-4 py-3 text-[#F0F2F4] font-mono text-sm">
                          {value}
                        </td>
                      );
                    })}
                    {responses.map(response => {
                      const fieldName = response.name.toLowerCase().replace(' ', '');
                      const value = run[fieldName];
                      const isEditing = editingCell === `${run.id}-${fieldName}`;
                      
                      return (
                        <td key={response.id} className="px-4 py-3 bg-blue-500/5">
                          {isEditing ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                step="0.01"
                                autoFocus
                                defaultValue={value || ''}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateRunData(run.id, fieldName, parseFloat(e.target.value));
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingCell(null);
                                  }
                                }}
                                className="w-24 px-2 py-1 bg-[#1C1F24] border border-blue-500 rounded text-[#F0F2F4] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                              <button
                                onClick={(e) => {
                                  const input = e.target.closest('td').querySelector('input');
                                  updateRunData(run.id, fieldName, parseFloat(input.value));
                                }}
                                className="text-green-400 hover:text-green-300 transition"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                className="text-[#6B7280] hover:text-[#B4BAC4] transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingCell(`${run.id}-${fieldName}`)}
                              className="group flex items-center space-x-2 hover:bg-blue-500/10 px-2 py-1 rounded transition w-full"
                            >
                              {value !== null ? (
                                <>
                                  <span className="text-[#F0F2F4] font-mono text-sm">{value}</span>
                                  <Edit2 className="w-3 h-3 text-[#6B7280] group-hover:text-blue-400 transition" />
                                </>
                              ) : (
                                <span className="text-[#6B7280] text-sm flex items-center space-x-2">
                                  <span>Enter value</span>
                                  <Edit2 className="w-3 h-3 group-hover:text-blue-400 transition" />
                                </span>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Factor & Response Summary Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Factors Card */}
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#F0F2F4] mb-4 flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#F0F2F4]" />
              </div>
              <span>Factors ({factors.length})</span>
            </h3>
            <div className="space-y-3">
              {factors.map(factor => (
                <div key={factor.id} className="bg-[#1C1F24] rounded-lg p-4">
                  <div className="font-medium text-[#F0F2F4] mb-2">{factor.name}</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-[#6B7280] text-xs mb-1">Low</div>
                      <div className="text-blue-400 font-mono">{factor.lowLevel} {factor.units}</div>
                    </div>
                    <div>
                      <div className="text-[#6B7280] text-xs mb-1">Center</div>
                      <div className="text-blue-400 font-mono">{factor.centerPoint} {factor.units}</div>
                    </div>
                    <div>
                      <div className="text-[#6B7280] text-xs mb-1">High</div>
                      <div className="text-blue-400 font-mono">{factor.highLevel} {factor.units}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Responses Card */}
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#F0F2F4] mb-4 flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#F0F2F4]" />
              </div>
              <span>Responses ({responses.length})</span>
            </h3>
            <div className="space-y-3">
              {responses.map(response => {
                const fieldName = response.name.toLowerCase().replace(' ', '');
                const completedValues = runs.filter(r => r[fieldName] !== null).map(r => r[fieldName]);
                const hasData = completedValues.length > 0;
                const min = hasData ? Math.min(...completedValues) : null;
                const max = hasData ? Math.max(...completedValues) : null;
                const avg = hasData ? (completedValues.reduce((a, b) => a + b, 0) / completedValues.length) : null;

                return (
                  <div key={response.id} className="bg-[#1C1F24] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-[#F0F2F4]">{response.name}</div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        response.goal === 'maximize' 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        {response.goal}
                      </span>
                    </div>
                    {hasData ? (
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-[#6B7280] text-xs mb-1">Min</div>
                          <div className="text-[#F0F2F4] font-mono">{min.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-[#6B7280] text-xs mb-1">Avg</div>
                          <div className="text-[#F0F2F4] font-mono">{avg.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-[#6B7280] text-xs mb-1">Max</div>
                          <div className="text-[#F0F2F4] font-mono">{max.toFixed(1)}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#6B7280] text-sm italic">No data yet</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tips & Help Section */}
        <div className="mt-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-400/30 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-200 mb-3">Data Entry Tips</h4>
              <ul className="space-y-2 text-sm text-blue-200/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Follow run order:</strong> Perform experiments in the randomized run order shown, not standard order</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Click to edit:</strong> Click any response cell to enter or update values</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Bulk import:</strong> Have all your data? Use the CSV upload to import everything at once</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Save frequently:</strong> Your data is automatically saved, but you can manually save anytime</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Partial analysis:</strong> Once you've completed 50% of runs, you can run a preliminary analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignMatrixPage;
