import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Beaker, Shield, Check, AlertCircle, Loader2, User, Mail, ArrowRight,
  Eye, Edit2, Play, Clock, Calendar, BarChart3, CheckCircle, Activity
} from 'lucide-react';
import Header from '../Header';
import { experimentShareApi, experimentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Access level configurations
const ACCESS_LEVELS = {
  view: {
    label: 'View Only',
    description: 'You can view experiment details and results',
    icon: Eye,
    color: 'blue'
  },
  contribute: {
    label: 'Contribute',
    description: 'You can view and add measurements/notes',
    icon: Edit2,
    color: 'green'
  },
  execute: {
    label: 'Execute',
    description: 'You can view, contribute, and run analysis',
    icon: Play,
    color: 'violet'
  }
};

const SharedExperimentPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Form state for guest info (when not logged in)
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    fetchShareDetails();
  }, [token]);

  async function fetchShareDetails() {
    try {
      setLoading(true);
      setError(null);
      const data = await experimentShareApi.getShareByToken(token);
      setShare(data);

      // Pre-fill email if user is logged in
      if (user?.email) {
        setGuestEmail(user.email);
        setGuestName(user.name || '');
      }

      // Check if already accepted
      if (data.status === 'accepted') {
        setAccepted(true);
      }
    } catch (err) {
      console.error('Failed to fetch share:', err);
      setError(err.message || 'Failed to load share details');
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptShare() {
    // Validate email matches invited email
    if (guestEmail.toLowerCase() !== share.invited_email.toLowerCase()) {
      setError('This share was sent to a different email address. Please use the email: ' + share.invited_email);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      await experimentShareApi.acceptShare(token, {
        guestEmail: guestEmail.trim().toLowerCase(),
        guestName: guestName.trim()
      });

      setAccepted(true);

      // Redirect to experiment after a short delay
      setTimeout(() => {
        navigate(`/doe/experiment/${share.experiment_id}?shared=true`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to accept share');
    } finally {
      setAccepting(false);
    }
  }

  function handleViewExperiment() {
    navigate(`/doe/experiment/${share.experiment_id}?shared=true`);
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1114] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280]">Loading share details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !share) {
    return (
      <div className="min-h-screen bg-[#0F1114]">
        <Header />
        <div className="pt-24 px-6 flex items-center justify-center min-h-[80vh]">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-[#F0F2F4] mb-3">Share Not Found</h1>
            <p className="text-[#6B7280] mb-6">{error}</p>
            <button
              onClick={() => navigate('/doe')}
              className="px-6 py-3 bg-[#1C1F24] hover:bg-[#2A2F36] text-[#F0F2F4] rounded-xl font-medium transition"
            >
              Go to Experiments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const access = ACCESS_LEVELS[share.access_level];
  const AccessIcon = access.icon;

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <div className="pt-24 px-6 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Success state */}
          {accepted ? (
            <div className="bg-[#15181C] border border-green-500/30 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-[#F0F2F4] mb-3">Access Granted!</h1>
              <p className="text-[#6B7280] mb-6">
                You now have <span className="text-green-400 font-medium">{access.label}</span> access to this experiment.
              </p>
              <button
                onClick={handleViewExperiment}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center space-x-2 mx-auto"
              >
                <span>View Experiment</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              {/* Share invitation card */}
              <div className="bg-[#15181C] border border-[#2A2F36] rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-[#2A2F36] bg-gradient-to-r from-blue-500/10 to-violet-500/10">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Beaker className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-[#6B7280] mb-1">You've been invited to collaborate on</p>
                      <h1 className="text-2xl font-bold text-[#F0F2F4]">{share.experiment_name}</h1>
                    </div>
                  </div>
                </div>

                {/* Experiment info */}
                <div className="p-6 border-b border-[#2A2F36]">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#1C1F24] rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-[#6B7280]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#6B7280]">Shared by</p>
                        <p className="text-sm font-medium text-[#F0F2F4]">{share.owner_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#1C1F24] rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-[#6B7280]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#6B7280]">Design Type</p>
                        <p className="text-sm font-medium text-[#F0F2F4]">{share.design_type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#1C1F24] rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-[#6B7280]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#6B7280]">Status</p>
                        <p className="text-sm font-medium text-[#F0F2F4] capitalize">{share.experiment_status}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#1C1F24] rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-[#6B7280]" />
                      </div>
                      <div>
                        <p className="text-xs text-[#6B7280]">Progress</p>
                        <p className="text-sm font-medium text-[#F0F2F4]">{share.completed_runs}/{share.total_runs} runs</p>
                      </div>
                    </div>
                  </div>

                  {share.experiment_description && (
                    <div className="bg-[#1C1F24]/50 rounded-xl p-4">
                      <p className="text-sm text-[#B4BAC4]">{share.experiment_description}</p>
                    </div>
                  )}

                  {share.invite_message && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <p className="text-sm text-[#6B7280] mb-1">Message from {share.owner_name}:</p>
                      <p className="text-sm text-[#B4BAC4] italic">"{share.invite_message}"</p>
                    </div>
                  )}
                </div>

                {/* Access level info */}
                <div className="p-6 border-b border-[#2A2F36]">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-${access.color}-500/10 rounded-xl flex items-center justify-center`}>
                      <AccessIcon className={`w-6 h-6 text-${access.color}-400`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-[#6B7280]" />
                        <span className="text-sm text-[#6B7280]">Access Level</span>
                      </div>
                      <p className={`text-lg font-semibold text-${access.color}-400`}>{access.label}</p>
                      <p className="text-sm text-[#6B7280]">{access.description}</p>
                    </div>
                  </div>

                  {share.expires_at && (
                    <div className="mt-4 flex items-center space-x-2 text-sm text-[#6B7280]">
                      <Clock className="w-4 h-4" />
                      <span>This invitation expires on {new Date(share.expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Accept form */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[#F0F2F4] mb-4">Accept Invitation</h3>

                  {error && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                        Your Email <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder={share.invited_email}
                          className="w-full pl-10 pr-4 py-3 bg-[#1C1F24] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <p className="mt-1 text-xs text-[#6B7280]">
                        Please use the email address this invitation was sent to: <span className="text-blue-400">{share.invited_email}</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                        Your Name <span className="text-[#6B7280]">(optional)</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Your name"
                          className="w-full pl-10 pr-4 py-3 bg-[#1C1F24] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAcceptShare}
                    disabled={accepting || !guestEmail.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center justify-center space-x-2"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Accepting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        <span>Accept & View Experiment</span>
                      </>
                    )}
                  </button>

                  <p className="mt-4 text-xs text-[#6B7280] text-center">
                    By accepting, you agree to collaborate on this experiment according to the granted access level.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedExperimentPage;
