import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Beaker, Plus, Search, Filter, Grid, List, Clock, CheckCircle,
  AlertCircle, Play, TrendingUp, BarChart3, Calendar, Tag, User,
  MoreVertical, Edit2, Copy, Trash2, Download, Share2, Archive,
  Settings, ChevronDown, X, FileText, Sparkles, Target, Zap,
  Activity, Box, Layers, Eye, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from './Header';
import ShareExperimentModal from './components/ShareExperimentModal';
import { experimentApi } from './services/api';

// Tooltip Component
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
        <div className="absolute z-50 w-80 p-4 bg-[#15181C] border border-blue-500/30 rounded-xl shadow-2xl shadow-violet-500/20 bottom-full left-0 mb-2 backdrop-blur-xl">
          <div className="flex items-start space-x-2">
            <div className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0">?</div>
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

// Experiment Card Component
const ExperimentCard = ({ experiment, onView, onEdit, onDelete, onShare, viewMode }) => {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = {
    draft: { color: 'gray', icon: Edit2, label: 'Draft' },
    'in-progress': { color: 'blue', icon: Clock, label: 'In Progress' },
    running: { color: 'blue', icon: Clock, label: 'Running' },
    analyzing: { color: 'violet', icon: Activity, label: 'Analyzing' },
    completed: { color: 'green', icon: CheckCircle, label: 'Completed' },
    archived: { color: 'slate', icon: Archive, label: 'Archived' }
  };

  const status = statusConfig[experiment.status] || { color: 'gray', icon: Clock, label: experiment.status || 'Unknown' };
  const StatusIcon = status.icon;
  const progress = experiment.totalRuns > 0 ? (experiment.completedRuns / experiment.totalRuns) * 100 : 0;

  if (viewMode === 'list') {
    return (
      <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl hover:border-blue-500/30 transition-all duration-300 overflow-hidden group">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                  <Beaker className="w-6 h-6 text-[#F0F2F4]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[#F0F2F4] truncate group-hover:text-blue-300 transition">
                    {experiment.name}
                  </h3>
                  <div className="flex items-center space-x-3 text-sm text-[#6B7280] mt-1">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{experiment.experimenter}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{experiment.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${status.color}-500/10 text-${status.color}-400 border border-${status.color}-500/30`}>
                  <StatusIcon className="w-3 h-3 mr-1.5" />
                  {status.label}
                </span>
                <span className="text-xs text-[#6B7280] px-3 py-1 bg-[#1C1F24] rounded-full">
                  {experiment.designType}
                </span>
                {experiment.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs text-blue-400 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                    {tag}
                  </span>
                ))}
              </div>

              {experiment.status === 'in-progress' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
                    <span>Progress: {experiment.completedRuns}/{experiment.totalRuns} runs</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-[#1C1F24] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 hover:bg-blue-500 transition-all duration-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {experiment.status === 'completed' && experiment.results && (
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-[#1C1F24] rounded-lg p-3">
                    <div className="text-xs text-[#6B7280] mb-1">R²</div>
                    <div className="text-lg font-bold text-blue-400">{experiment.results.rSquared}</div>
                  </div>
                  <div className="bg-[#1C1F24] rounded-lg p-3">
                    <div className="text-xs text-[#6B7280] mb-1">F-stat</div>
                    <div className="text-lg font-bold text-green-400">{experiment.results.fStatistic}</div>
                  </div>
                  <div className="bg-[#1C1F24] rounded-lg p-3">
                    <div className="text-xs text-[#6B7280] mb-1">Factors</div>
                    <div className="text-lg font-bold text-[#F0F2F4]">{experiment.results.significantFactors}/{experiment.results.totalFactors}</div>
                  </div>
                  <div className="bg-[#1C1F24] rounded-lg p-3">
                    <div className="text-xs text-[#6B7280] mb-1">Quality</div>
                    <div className="text-sm font-bold text-green-400">{experiment.results.quality}</div>
                  </div>
                </div>
              )}

              {experiment.description && (
                <p className="text-sm text-[#6B7280] line-clamp-2 mb-4">
                  {experiment.description}
                </p>
              )}
            </div>

            <div className="relative ml-4">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-[#1C1F24] rounded-lg transition text-[#6B7280] hover:text-[#F0F2F4]"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-10 w-48 bg-[#15181C] border border-[#2A2F36] rounded-xl shadow-2xl z-50 py-2">
                    <button
                      onClick={() => { onView(experiment); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-[#B4BAC4] hover:bg-[#1C1F24] hover:text-[#F0F2F4] transition flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                    <button
                      onClick={() => { onEdit(experiment); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-[#B4BAC4] hover:bg-[#1C1F24] hover:text-[#F0F2F4] transition flex items-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-[#B4BAC4] hover:bg-[#1C1F24] hover:text-[#F0F2F4] transition flex items-center space-x-2">
                      <Copy className="w-4 h-4" />
                      <span>Duplicate</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-[#B4BAC4] hover:bg-[#1C1F24] hover:text-[#F0F2F4] transition flex items-center space-x-2">
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                    <button
                      onClick={() => { onShare(experiment); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-[#B4BAC4] hover:bg-[#1C1F24] hover:text-[#F0F2F4] transition flex items-center space-x-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                    <div className="border-t border-[#2A2F36] my-2" />
                    <button
                      onClick={() => { onDelete(experiment); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-[#2A2F36]">
            {experiment.status === 'draft' && (
              <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center justify-center space-x-2">
                <Edit2 className="w-4 h-4" />
                <span>Continue Setup</span>
              </button>
            )}
            {experiment.status === 'in-progress' && (
              <>
                <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center justify-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>Enter Data</span>
                </button>
                {progress >= 50 && (
                  <button className="flex-1 bg-[#1C1F24]/60 text-[#B4BAC4] px-4 py-2 rounded-lg font-semibold hover:bg-[#1C1F24] transition border border-[#2A2F36] flex items-center justify-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Analyze</span>
                  </button>
                )}
              </>
            )}
            {experiment.status === 'completed' && (
              <>
                <button 
                  onClick={() => onView(experiment)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center justify-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>View Analysis</span>
                </button>
                <button className="bg-[#1C1F24]/60 text-[#B4BAC4] px-4 py-2 rounded-lg font-semibold hover:bg-[#1C1F24] transition border border-[#2A2F36]">
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view (compact)
  return (
    <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl hover:border-blue-500/30 transition-all duration-300 overflow-hidden group cursor-pointer">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Beaker className="w-6 h-6 text-[#F0F2F4]" />
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-500/10 text-${status.color}-400 border border-${status.color}-500/30`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </span>
        </div>

        <h3 className="text-lg font-bold text-[#F0F2F4] mb-2 group-hover:text-blue-300 transition truncate">
          {experiment.name}
        </h3>
        
        <p className="text-sm text-[#6B7280] mb-4 line-clamp-2 min-h-[40px]">
          {experiment.description || 'No description'}
        </p>

        <div className="space-y-2 text-xs text-[#6B7280] mb-4">
          <div className="flex items-center justify-between">
            <span>Design:</span>
            <span className="text-[#B4BAC4]">{experiment.designType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Runs:</span>
            <span className="text-[#B4BAC4]">{experiment.completedRuns}/{experiment.totalRuns}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Created:</span>
            <span className="text-[#B4BAC4]">{experiment.createdAt}</span>
          </div>
        </div>

        {experiment.status === 'in-progress' && (
          <div className="mb-4">
            <div className="h-1.5 bg-[#1C1F24] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 hover:bg-blue-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button 
          onClick={() => onView(experiment)}
          className="w-full bg-[#1C1F24]/60 text-[#B4BAC4] px-4 py-2 rounded-lg font-medium hover:bg-[#1C1F24] transition border border-[#2A2F36] text-sm"
        >
          Open
        </button>
      </div>
    </div>
  );
};

// Experiment Detail Modal Component
const ExperimentDetailModal = ({ experiment, onClose, onShare }) => {
  if (!experiment) return null;

  // Sample data for the selected experiment
  const sampleData = [
    { run: 1, temp: 180, pressure: 50, speed: 30, strength: 285 },
    { run: 2, temp: 200, pressure: 50, speed: 30, strength: 295 },
    { run: 3, temp: 180, pressure: 70, speed: 30, strength: 292 },
    { run: 4, temp: 200, pressure: 70, speed: 30, strength: 310 },
    { run: 5, temp: 180, pressure: 50, speed: 50, strength: 278 },
    { run: 6, temp: 200, pressure: 50, speed: 50, strength: 288 },
    { run: 7, temp: 180, pressure: 70, speed: 50, strength: 298 },
    { run: 8, temp: 200, pressure: 70, speed: 50, strength: 315 }
  ];

  // Main effects data
  const mainEffectsData = [
    { factor: 'Temperature', lowAvg: 288, highAvg: 302 },
    { factor: 'Pressure', lowAvg: 286, highAvg: 304 },
    { factor: 'Speed', lowAvg: 295, highAvg: 295 }
  ];

  // ANOVA results
  const anovaData = [
    { factor: 'Temperature', fValue: 18.4, pValue: 0.003, significant: true },
    { factor: 'Pressure', fValue: 24.8, pValue: 0.001, significant: true },
    { factor: 'Speed', fValue: 0.02, pValue: 0.892, significant: false },
    { factor: 'Temp × Pressure', fValue: 3.2, pValue: 0.112, significant: false }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#15181C] border border-[#2A2F36] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#15181C] border-b border-[#2A2F36] p-6 flex items-start justify-between z-10">
          <div className="flex items-start space-x-4 flex-1">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Beaker className="w-7 h-7 text-[#F0F2F4]" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#F0F2F4] mb-2">{experiment.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-[#6B7280]">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{experiment.experimenter}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{experiment.createdAt}</span>
                </div>
                <span className="px-3 py-1 bg-[#1C1F24] rounded-full text-xs">{experiment.designType}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1C1F24] rounded-lg transition text-[#6B7280] hover:text-[#F0F2F4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {experiment.description && (
            <div className="bg-[#1C1F24]/30 border border-[#2A2F36] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[#6B7280] mb-2">Description</h3>
              <p className="text-[#B4BAC4]">{experiment.description}</p>
            </div>
          )}

          {/* Results Summary */}
          {experiment.results && (
            <div>
              <h3 className="text-lg font-bold text-[#F0F2F4] mb-4">Results Summary</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl p-4">
                  <div className="text-sm text-[#6B7280] mb-2">R² Value</div>
                  <div className="text-3xl font-bold text-blue-400">{experiment.results.rSquared}</div>
                  <div className="text-xs text-[#6B7280] mt-1">Model Fit</div>
                </div>
                <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl p-4">
                  <div className="text-sm text-[#6B7280] mb-2">F-Statistic</div>
                  <div className="text-3xl font-bold text-green-400">{experiment.results.fStatistic}</div>
                  <div className="text-xs text-[#6B7280] mt-1">Overall Significance</div>
                </div>
                <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl p-4">
                  <div className="text-sm text-[#6B7280] mb-2">Significant Factors</div>
                  <div className="text-3xl font-bold text-[#F0F2F4]">{experiment.results.significantFactors}/{experiment.results.totalFactors}</div>
                  <div className="text-xs text-[#6B7280] mt-1">Key Variables</div>
                </div>
                <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-xl p-4">
                  <div className="text-sm text-[#6B7280] mb-2">Quality</div>
                  <div className="text-2xl font-bold text-green-400">{experiment.results.quality}</div>
                  <div className="text-xs text-[#6B7280] mt-1">Overall Rating</div>
                </div>
              </div>
            </div>
          )}

          {/* Main Effects Chart */}
          <div>
            <h3 className="text-lg font-bold text-[#F0F2F4] mb-4">Main Effects Plot</h3>
            <div className="bg-[#1C1F24]/30 border border-[#2A2F36] rounded-xl p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mainEffectsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="factor" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend />
                  <Bar dataKey="lowAvg" name="Low Level" fill="#8b5cf6" />
                  <Bar dataKey="highAvg" name="High Level" fill="#a78bfa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ANOVA Table */}
          <div>
            <h3 className="text-lg font-bold text-[#F0F2F4] mb-4">ANOVA Results</h3>
            <div className="bg-[#1C1F24]/30 border border-[#2A2F36] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#1C1F24]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-[#B4BAC4]">Factor</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#B4BAC4]">F-Value</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-[#B4BAC4]">P-Value</th>
                    <th className="text-center px-4 py-3 text-sm font-semibold text-[#B4BAC4]">Significant</th>
                  </tr>
                </thead>
                <tbody>
                  {anovaData.map((row, idx) => (
                    <tr key={idx} className="border-t border-[#2A2F36]">
                      <td className="px-4 py-3 text-[#F0F2F4] font-medium">{row.factor}</td>
                      <td className="px-4 py-3 text-right text-[#B4BAC4]">{row.fValue}</td>
                      <td className="px-4 py-3 text-right text-[#B4BAC4]">{row.pValue}</td>
                      <td className="px-4 py-3 text-center">
                        {row.significant ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-[#6B7280] border border-gray-500/30">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample Data Table */}
          <div>
            <h3 className="text-lg font-bold text-[#F0F2F4] mb-4">Experiment Data</h3>
            <div className="bg-[#1C1F24]/30 border border-[#2A2F36] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1C1F24]">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-[#B4BAC4]">Run</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-[#B4BAC4]">Temperature (°C)</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-[#B4BAC4]">Pressure (MPa)</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-[#B4BAC4]">Speed (mm/s)</th>
                      <th className="text-right px-4 py-3 text-sm font-semibold text-[#B4BAC4]">Strength (MPa)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleData.map((row, idx) => (
                      <tr key={idx} className="border-t border-[#2A2F36] hover:bg-[#1C1F24]/30 transition">
                        <td className="px-4 py-3 text-[#F0F2F4] font-medium">{row.run}</td>
                        <td className="px-4 py-3 text-right text-[#B4BAC4]">{row.temp}</td>
                        <td className="px-4 py-3 text-right text-[#B4BAC4]">{row.pressure}</td>
                        <td className="px-4 py-3 text-right text-[#B4BAC4]">{row.speed}</td>
                        <td className="px-4 py-3 text-right text-blue-400 font-semibold">{row.strength}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4 border-t border-[#2A2F36]">
            <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center justify-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Export Report</span>
            </button>
            <button
              onClick={() => onShare && onShare(experiment)}
              className="flex-1 bg-[#1C1F24]/60 text-[#B4BAC4] px-6 py-3 rounded-xl font-semibold hover:bg-[#1C1F24] transition border border-[#2A2F36] flex items-center justify-center space-x-2"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
            <button
              onClick={() => navigate(`/doe/experiment/${experiment.id}`)}
              className="flex-1 bg-[#1C1F24]/60 text-[#B4BAC4] px-6 py-3 rounded-xl font-semibold hover:bg-[#1C1F24] transition border border-[#2A2F36] flex items-center justify-center space-x-2"
            >
              <Eye className="w-5 h-5" />
              <span>Full Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExperimentDashboard = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDesign, setFilterDesign] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'name', 'progress'
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [shareExperiment, setShareExperiment] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch experiments from API
  useEffect(() => {
    fetchExperiments();
  }, []);

  async function fetchExperiments() {
    try {
      setLoading(true);
      setError(null);
      const data = await experimentApi.getAll();

      // Transform database data to match component format
      const transformedExperiments = data.map(exp => ({
        id: exp.id,
        name: exp.name,
        experimenter: exp.experimenter || 'Unknown',
        description: exp.description || '',
        designType: formatDesignType(exp.design_type),
        status: exp.status || 'draft',
        totalRuns: exp.total_runs || 0,
        completedRuns: exp.completed_runs || 0,
        createdAt: formatDate(exp.created_at),
        tags: [], // Can be added later if needed
        results: exp.analyzed_at ? {
          quality: 'Excellent' // Placeholder - can fetch from analysis_results if needed
        } : null
      }));

      setExperiments(transformedExperiments);
    } catch (err) {
      console.error('Failed to fetch experiments:', err);
      setError(err.message || 'Failed to load experiments');
    } finally {
      setLoading(false);
    }
  }

  // Helper function to format design type from database
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

  // Helper function to format dates
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }


  // Calculate dashboard stats
  const stats = {
    total: experiments.length,
    active: experiments.filter(e => e.status === 'in-progress').length,
    completed: experiments.filter(e => e.status === 'completed').length,
    avgProgress: Math.round(
      experiments
        .filter(e => e.status === 'in-progress')
        .reduce((acc, e) => acc + (e.completedRuns / e.totalRuns) * 100, 0) /
      experiments.filter(e => e.status === 'in-progress').length || 0
    )
  };

  // Filter and sort experiments
  const filteredExperiments = experiments
    .filter(exp => {
      const matchesSearch = exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           exp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || exp.status === filterStatus;
      const matchesDesign = filterDesign === 'all' || exp.designType === filterDesign;
      return matchesSearch && matchesStatus && matchesDesign;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'progress') return (b.completedRuns / b.totalRuns) - (a.completedRuns / a.totalRuns);
      return b.id - a.id; // 'recent' - newest first
    });

  return (
    <div className="min-h-screen bg-[#0F1114] text-gray-50">
      {/* Navigation Header */}
      <Header />

      {/* Page Header */}
      <header className="border-b border-[#2A2F36] bg-[#0F1114]/95 backdrop-blur-xl sticky top-16 z-40 mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-violet-400/20">
                <Beaker className="w-7 h-7 text-[#F0F2F4]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
                  DOE Platform
                </h1>
                <p className="text-sm text-[#6B7280]">Experiment Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="text-[#6B7280] hover:text-gray-200 transition p-2 hover:bg-[#1C1F24] rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/doe/new')}
                className="group bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] px-6 py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>New Experiment</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Dashboard */}
      <div className="border-b border-[#2A2F36] bg-[#15181C]/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-[#2A2F36] rounded-2xl p-6 hover:border-blue-500/30 transition backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-[#6B7280]">Total Experiments</div>
                <Box className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-4xl font-bold text-[#F0F2F4] mb-1">{stats.total}</div>
              <div className="text-xs text-[#6B7280]">All time</div>
            </div>

            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-[#2A2F36] rounded-2xl p-6 hover:border-blue-500/30 transition backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-[#6B7280]">Active Experiments</div>
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-4xl font-bold text-blue-400 mb-1">{stats.active}</div>
              <div className="text-xs text-[#6B7280]">In progress</div>
            </div>

            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-[#2A2F36] rounded-2xl p-6 hover:border-green-500/30 transition backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-[#6B7280]">Completed</div>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-4xl font-bold text-green-400 mb-1">{stats.completed}</div>
              <div className="text-xs text-[#6B7280]">With analysis</div>
            </div>

            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-[#2A2F36] rounded-2xl p-6 hover:border-fuchsia-500/30 transition backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-[#6B7280]">Avg Progress</div>
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-4xl font-bold text-blue-400 mb-1">{stats.avgProgress}%</div>
              <div className="text-xs text-[#6B7280]">Active experiments</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Search and Filters Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search experiments by name, tags, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#15181C] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#6B7280] hover:text-[#B4BAC4] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                showFilters
                  ? 'bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] shadow-lg shadow-blue-500/30'
                  : 'bg-[#1C1F24]/60 text-[#B4BAC4] hover:bg-[#1C1F24] border border-[#2A2F36]'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(filterStatus !== 'all' || filterDesign !== 'all') && (
                <span className="w-5 h-5 bg-fuchsia-500 rounded-full text-xs flex items-center justify-center">
                  {(filterStatus !== 'all' ? 1 : 0) + (filterDesign !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#1C1F24]/60 rounded-xl border border-[#2A2F36] p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-blue-500 text-[#F0F2F4]'
                    : 'text-[#6B7280] hover:text-[#F0F2F4]'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-500 text-[#F0F2F4]'
                    : 'text-[#6B7280] hover:text-[#F0F2F4]'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 bg-[#1C1F24]/60 border border-[#2A2F36] rounded-xl text-[#B4BAC4] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name (A-Z)</option>
              <option value="progress">Progress</option>
            </select>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6 space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'draft', 'in-progress', 'analyzing', 'completed', 'archived'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          filterStatus === status
                            ? 'bg-blue-500 text-[#F0F2F4]'
                            : 'bg-[#1C1F24] text-[#6B7280] hover:bg-[#1C1F24] border border-[#2A2F36]'
                        }`}
                      >
                        {status === 'all' ? 'All Status' : status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B7280] mb-2">Design Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'Full Factorial', 'Fractional Factorial', 'Plackett-Burman'].map((design) => (
                      <button
                        key={design}
                        onClick={() => setFilterDesign(design)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          filterDesign === design
                            ? 'bg-blue-500 text-[#F0F2F4]'
                            : 'bg-[#1C1F24] text-[#6B7280] hover:bg-[#1C1F24] border border-[#2A2F36]'
                        }`}
                      >
                        {design === 'all' ? 'All Designs' : design}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {(filterStatus !== 'all' || filterDesign !== 'all') && (
                <div className="pt-4 border-t border-[#2A2F36]">
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setFilterDesign('all');
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 transition"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-[#6B7280]">
            Showing <span className="text-[#F0F2F4] font-semibold">{filteredExperiments.length}</span> of{' '}
            <span className="text-[#F0F2F4] font-semibold">{experiments.length}</span> experiments
          </div>

          {filteredExperiments.length === 0 && searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-blue-400 hover:text-blue-300 transition"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Experiments List/Grid */}
        {filteredExperiments.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-[#1C1F24] rounded-full flex items-center justify-center mx-auto mb-6">
              <Beaker className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-[#F0F2F4] mb-2">No experiments found</h3>
            <p className="text-[#6B7280] mb-8">
              {searchQuery || filterStatus !== 'all' || filterDesign !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first experiment'}
            </p>
            {!searchQuery && filterStatus === 'all' && filterDesign === 'all' && (
              <button className="bg-blue-600 hover:bg-blue-500 text-[#F0F2F4] px-8 py-3 rounded-xl font-bold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 inline-flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create Your First Experiment</span>
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredExperiments.map(experiment => (
              <ExperimentCard
                key={experiment.id}
                experiment={experiment}
                onView={(exp) => setSelectedExperiment(exp)}
                onEdit={(exp) => console.log('Edit:', exp)}
                onDelete={(exp) => console.log('Delete:', exp)}
                onShare={(exp) => setShareExperiment(exp)}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Experiment Detail Modal */}
      {selectedExperiment && (
        <ExperimentDetailModal
          experiment={selectedExperiment}
          onClose={() => setSelectedExperiment(null)}
          onShare={(exp) => {
            setSelectedExperiment(null);
            setShareExperiment(exp);
          }}
        />
      )}

      {/* Share Experiment Modal */}
      {shareExperiment && (
        <ShareExperimentModal
          experiment={shareExperiment}
          onClose={() => setShareExperiment(null)}
        />
      )}
    </div>
  );
};

export default ExperimentDashboard;
