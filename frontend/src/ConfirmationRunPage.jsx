import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Beaker, ArrowLeft, CheckCircle, Target, TrendingUp, AlertCircle,
  Play, Save, Download, Info, Sparkles
} from 'lucide-react';
import Header from './Header';

const ConfirmationRunPage = () => {
  const navigate = useNavigate();
  const [confirmationData, setConfirmationData] = useState({
    targetValue: '',
    actualValue: '',
    notes: ''
  });

  // Optimal settings from previous experiment
  const optimalSettings = {
    temperature: 200,
    pressure: 70,
    speed: 30,
    predictedStrength: 315
  };

  const handleSubmit = () => {
    // Handle confirmation run submission
    console.log('Confirmation run data:', confirmationData);
  };

  const difference = confirmationData.actualValue ?
    ((parseFloat(confirmationData.actualValue) - optimalSettings.predictedStrength) / optimalSettings.predictedStrength * 100).toFixed(1) : null;

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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/30">
                <Target className="w-6 h-6 text-[#F0F2F4]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#F0F2F4]">
                  Confirmation Run
                </h1>
                <p className="text-sm text-[#6B7280]">Verify your optimal settings</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button className="bg-slate-800/60 text-[#B4BAC4] px-4 py-2 rounded-lg hover:bg-[#22262C] transition border border-[#2A2F36] flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
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
            <h3 className="font-semibold text-blue-200 mb-1">What is a Confirmation Run?</h3>
            <p className="text-sm text-blue-200/80 leading-relaxed">
              A confirmation run validates your DOE results by testing the optimal settings identified in your analysis.
              This ensures the predicted performance matches real-world results before full implementation.
            </p>
          </div>
        </div>

        {/* Optimal Settings */}
        <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
          <h2 className="text-xl font-bold text-[#F0F2F4] mb-4 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            <span>Optimal Settings to Test</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
              <div className="text-sm text-[#6B7280] mb-1">Temperature</div>
              <div className="text-2xl font-bold text-[#F0F2F4]">{optimalSettings.temperature}°C</div>
            </div>
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
              <div className="text-sm text-[#6B7280] mb-1">Pressure</div>
              <div className="text-2xl font-bold text-[#F0F2F4]">{optimalSettings.pressure} MPa</div>
            </div>
            <div className="bg-[#1C1F24] border border-[#2A2F36] rounded-lg p-4">
              <div className="text-sm text-[#6B7280] mb-1">Speed</div>
              <div className="text-2xl font-bold text-[#F0F2F4]">{optimalSettings.speed} mm/s</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
              <div className="text-sm text-blue-300 mb-1">Predicted Strength</div>
              <div className="text-2xl font-bold text-blue-400">{optimalSettings.predictedStrength} MPa</div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-400/30 rounded-lg p-4">
            <p className="text-sm text-amber-200">
              <strong>Recommendation:</strong> Run at least 3 confirmation runs at these settings to ensure reproducibility.
            </p>
          </div>
        </div>

        {/* Data Entry */}
        <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-6">
          <h2 className="text-xl font-bold text-[#F0F2F4] mb-4">Record Results</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                Target Value (from prediction)
              </label>
              <input
                type="number"
                value={optimalSettings.predictedStrength}
                disabled
                className="w-full bg-[#1C1F24] border border-[#2A2F36] rounded-lg px-4 py-2 text-[#F0F2F4]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                Actual Value (measured)
              </label>
              <input
                type="number"
                value={confirmationData.actualValue}
                onChange={(e) => setConfirmationData({ ...confirmationData, actualValue: e.target.value })}
                placeholder="Enter measured strength (MPa)"
                className="w-full bg-[#1C1F24] border border-[#2A2F36] rounded-lg px-4 py-2 text-[#F0F2F4] placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {difference !== null && (
              <div className={`rounded-lg p-4 ${
                Math.abs(parseFloat(difference)) <= 5
                  ? 'bg-green-500/10 border border-green-400/30'
                  : 'bg-amber-500/10 border border-amber-400/30'
              }`}>
                <div className="flex items-center space-x-2">
                  {Math.abs(parseFloat(difference)) <= 5 ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <div className={`font-semibold ${
                      Math.abs(parseFloat(difference)) <= 5 ? 'text-green-200' : 'text-amber-200'
                    }`}>
                      Difference: {difference}%
                    </div>
                    <div className={`text-sm ${
                      Math.abs(parseFloat(difference)) <= 5 ? 'text-green-200/80' : 'text-amber-200/80'
                    }`}>
                      {Math.abs(parseFloat(difference)) <= 5
                        ? 'Excellent match! Your model predictions are accurate.'
                        : 'Larger than expected difference. Consider additional confirmation runs.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                Notes
              </label>
              <textarea
                value={confirmationData.notes}
                onChange={(e) => setConfirmationData({ ...confirmationData, notes: e.target.value })}
                placeholder="Record any observations, environmental conditions, or anomalies..."
                rows={4}
                className="w-full bg-[#1C1F24] border border-[#2A2F36] rounded-lg px-4 py-2 text-[#F0F2F4] placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-[#F0F2F4] px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition flex items-center justify-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Record Confirmation Run</span>
          </button>
          <button className="bg-slate-800/60 text-[#B4BAC4] px-6 py-3 rounded-xl font-semibold hover:bg-[#22262C] transition border border-[#2A2F36] flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationRunPage;
