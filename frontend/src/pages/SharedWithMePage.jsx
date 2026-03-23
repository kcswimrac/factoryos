import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Beaker, Share2, User, Calendar, Clock, Eye, Edit2, Play,
  AlertCircle, Loader2, Search, RefreshCw, Activity, CheckCircle,
  BarChart3, ExternalLink
} from 'lucide-react';
import Header from '../Header';
import { experimentShareApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Access level configurations
const ACCESS_LEVELS = {
  view: {
    label: 'View Only',
    description: 'Can view details and results',
    icon: Eye,
    color: 'blue'
  },
  contribute: {
    label: 'Contribute',
    description: 'Can add measurements/notes',
    icon: Edit2,
    color: 'green'
  },
  execute: {
    label: 'Execute',
    description: 'Can run analysis',
    icon: Play,
    color: 'violet'
  }
};

// Status configurations
const STATUS_CONFIG = {
  draft: { color: 'gray', icon: Edit2, label: 'Draft' },
  running: { color: 'blue', icon: Activity, label: 'Running' },
  analyzing: { color: 'violet', icon: Activity, label: 'Analyzing' },
  completed: { color: 'green', icon: CheckCircle, label: 'Completed' }
};

const SharedWithMePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.email) {
      fetchSharedExperiments();
    }
  }, [user?.email]);

  async function fetchSharedExperiments() {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError(null);
      const data = await experimentShareApi.getSharedWithMe(user.email);
      setShares(data);
    } catch (err) {
      console.error('Failed to fetch shared experiments:', err);
      setError(err.message || 'Failed to load shared experiments');
    } finally {
      setLoading(false);
    }
  }

  // Filter shares by search query
  const filteredShares = shares.filter(share => {
    const query = searchQuery.toLowerCase();
    return (
      share.experiment_name?.toLowerCase().includes(query) ||
      share.owner_name?.toLowerCase().includes(query) ||
      share.experiment_description?.toLowerCase().includes(query)
    );
  });

  // Separate pending and accepted shares
  const pendingShares = filteredShares.filter(s => s.status === 'pending');
  const acceptedShares = filteredShares.filter(s => s.status === 'accepted');

  function handleOpenExperiment(share) {
    if (share.status === 'pending') {
      // Navigate to acceptance page
      navigate(`/share/experiment/${share.share_token}`);
    } else {
      // Navigate directly to experiment
      navigate(`/doe/experiment/${share.experiment_id}?shared=true`);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      {/* Page Header */}
      <header className="border-b border-[#2A2F36] bg-[#0F1114]/95 backdrop-blur-xl sticky top-16 z-40 mt-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 ring-2 ring-green-400/20">
                <Share2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text text-transparent">
                  Shared With Me
                </h1>
                <p className="text-sm text-[#6B7280]">Experiments shared with you by others</p>
              </div>
            </div>

            <button
              onClick={fetchSharedExperiments}
              className="p-3 hover:bg-[#1C1F24] rounded-xl transition text-[#6B7280] hover:text-[#F0F2F4] border border-[#2A2F36]"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search experiments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#15181C] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          </div>
        ) : shares.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-[#1C1F24] rounded-full flex items-center justify-center mx-auto mb-6">
              <Share2 className="w-10 h-10 text-[#6B7280]" />
            </div>
            <h3 className="text-2xl font-bold text-[#F0F2F4] mb-2">No shared experiments</h3>
            <p className="text-[#6B7280] mb-6">
              When someone shares an experiment with you, it will appear here.
            </p>
            <button
              onClick={() => navigate('/doe/dashboard')}
              className="px-6 py-3 bg-[#1C1F24] hover:bg-[#2A2F36] text-[#F0F2F4] rounded-xl font-medium transition border border-[#2A2F36]"
            >
              Go to My Experiments
            </button>
          </div>
        ) : (
          <>
            {/* Pending invitations */}
            {pendingShares.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-[#F0F2F4] mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span>Pending Invitations ({pendingShares.length})</span>
                </h2>
                <div className="grid gap-4">
                  {pendingShares.map((share) => (
                    <SharedExperimentCard
                      key={share.id}
                      share={share}
                      onOpen={() => handleOpenExperiment(share)}
                      isPending
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Accepted shares */}
            {acceptedShares.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-[#F0F2F4] mb-4 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Active Access ({acceptedShares.length})</span>
                </h2>
                <div className="grid gap-4">
                  {acceptedShares.map((share) => (
                    <SharedExperimentCard
                      key={share.id}
                      share={share}
                      onOpen={() => handleOpenExperiment(share)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Shared experiment card component
const SharedExperimentCard = ({ share, onOpen, isPending }) => {
  const access = ACCESS_LEVELS[share.access_level];
  const AccessIcon = access?.icon || Eye;
  const status = STATUS_CONFIG[share.experiment_status] || STATUS_CONFIG.draft;
  const StatusIcon = status.icon;

  return (
    <div
      className={`bg-[#15181C] border rounded-xl p-6 transition cursor-pointer hover:border-blue-500/30 ${
        isPending ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-[#2A2F36]'
      }`}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Beaker className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="text-lg font-bold text-[#F0F2F4] truncate">
                {share.experiment_name}
              </h3>
              {isPending && (
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full border border-yellow-500/30">
                  Pending
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm text-[#6B7280] mb-3">
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span>Shared by {share.owner_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(share.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {share.experiment_description && (
              <p className="text-sm text-[#6B7280] mb-3 line-clamp-2">
                {share.experiment_description}
              </p>
            )}

            <div className="flex items-center space-x-4">
              {/* Status badge */}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-500/10 text-${status.color}-400 border border-${status.color}-500/30`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </span>

              {/* Design type */}
              <span className="text-xs text-[#6B7280] px-2 py-1 bg-[#1C1F24] rounded-full">
                {share.design_type}
              </span>

              {/* Progress */}
              <span className="text-xs text-[#6B7280]">
                {share.completed_runs}/{share.total_runs} runs
              </span>
            </div>
          </div>
        </div>

        {/* Access level and action */}
        <div className="flex flex-col items-end space-y-3 ml-4">
          <div className={`flex items-center space-x-2 px-3 py-1 bg-${access?.color || 'blue'}-500/10 rounded-full border border-${access?.color || 'blue'}-500/30`}>
            <AccessIcon className={`w-4 h-4 text-${access?.color || 'blue'}-400`} />
            <span className={`text-sm font-medium text-${access?.color || 'blue'}-400`}>
              {access?.label || share.access_level}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center space-x-2"
          >
            {isPending ? (
              <>
                <span>Accept</span>
                <ExternalLink className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Open</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expiration warning */}
      {share.expires_at && (
        <div className="mt-4 pt-3 border-t border-[#2A2F36] flex items-center space-x-2 text-xs text-[#6B7280]">
          <Clock className="w-4 h-4" />
          <span>
            {new Date(share.expires_at) < new Date()
              ? 'Expired'
              : `Expires ${new Date(share.expires_at).toLocaleDateString()}`
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default SharedWithMePage;
