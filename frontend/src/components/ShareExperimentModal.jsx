import React, { useState, useEffect } from 'react';
import {
  X, Share2, Mail, User, Shield, Clock, Copy, Check, Trash2,
  Eye, Edit2, Play, AlertCircle, Loader2, UserPlus, Link2,
  ChevronDown, RefreshCw
} from 'lucide-react';
import { experimentShareApi } from '../services/api';

// Access level configurations
const ACCESS_LEVELS = {
  view: {
    label: 'View Only',
    description: 'Can view experiment details and results',
    icon: Eye,
    color: 'blue'
  },
  contribute: {
    label: 'Contribute',
    description: 'Can view and add measurements/notes',
    icon: Edit2,
    color: 'green'
  },
  execute: {
    label: 'Execute',
    description: 'Can view, contribute, and run analysis',
    icon: Play,
    color: 'violet'
  }
};

// Share status configurations
const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'yellow', description: 'Awaiting acceptance' },
  accepted: { label: 'Active', color: 'green', description: 'Share is active' },
  revoked: { label: 'Revoked', color: 'red', description: 'Access revoked' },
  expired: { label: 'Expired', color: 'gray', description: 'Link has expired' }
};

const ShareExperimentModal = ({ experiment, onClose, userId = 1 }) => {
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' or 'manage'
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sharesLoading, setSharesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  // Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [accessLevel, setAccessLevel] = useState('contribute');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);

  // Fetch existing shares on mount
  useEffect(() => {
    fetchShares();
  }, [experiment.id]);

  async function fetchShares() {
    try {
      setSharesLoading(true);
      const data = await experimentShareApi.getExperimentShares(experiment.id, userId);
      setShares(data);
    } catch (err) {
      console.error('Failed to fetch shares:', err);
    } finally {
      setSharesLoading(false);
    }
  }

  async function handleCreateShare(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!inviteEmail.trim()) {
      setError('Email address is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const result = await experimentShareApi.createShare(experiment.id, {
        userId,
        invitedEmail: inviteEmail.trim().toLowerCase(),
        invitedName: inviteName.trim() || null,
        accessLevel,
        expiresInDays: expiresInDays ? parseInt(expiresInDays) : null,
        inviteMessage: inviteMessage.trim() || null
      });

      setSuccess(`Share link created! The guest can access the experiment at: ${window.location.origin}${result.shareLink}`);

      // Reset form
      setInviteEmail('');
      setInviteName('');
      setAccessLevel('contribute');
      setExpiresInDays('');
      setInviteMessage('');

      // Refresh shares list
      fetchShares();

      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}${result.shareLink}`);
        setCopiedLink(result.shareToken);
        setTimeout(() => setCopiedLink(null), 3000);
      } catch (clipErr) {
        // Clipboard access denied, just show the link
      }
    } catch (err) {
      setError(err.message || 'Failed to create share');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeShare(shareId) {
    if (!confirm('Are you sure you want to revoke this share? The guest will lose access immediately.')) {
      return;
    }

    try {
      await experimentShareApi.revokeShare(shareId, userId);
      fetchShares();
      setSuccess('Share revoked successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to revoke share');
    }
  }

  async function handleUpdateAccess(shareId, newAccessLevel) {
    try {
      await experimentShareApi.updateShareAccess(shareId, newAccessLevel, userId);
      fetchShares();
    } catch (err) {
      setError(err.message || 'Failed to update access level');
    }
  }

  async function copyShareLink(shareToken) {
    const link = `${window.location.origin}/share/experiment/${shareToken}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(shareToken);
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (err) {
      setError('Failed to copy link to clipboard');
    }
  }

  const activeShares = shares.filter(s => s.status === 'accepted' || s.status === 'pending');
  const inactiveShares = shares.filter(s => s.status === 'revoked' || s.status === 'expired');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#15181C] border border-[#2A2F36] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2F36]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F0F2F4]">Share Experiment</h2>
              <p className="text-sm text-[#6B7280]">{experiment.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1C1F24] rounded-lg transition text-[#6B7280] hover:text-[#F0F2F4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2A2F36]">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition flex items-center justify-center space-x-2 ${
              activeTab === 'invite'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-[#6B7280] hover:text-[#B4BAC4] hover:bg-[#1C1F24]/50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Guest</span>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition flex items-center justify-center space-x-2 ${
              activeTab === 'manage'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5'
                : 'text-[#6B7280] hover:text-[#B4BAC4] hover:bg-[#1C1F24]/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Manage Access</span>
            {activeShares.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                {activeShares.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-400">{error}</div>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-400 flex-1">{success}</div>
              <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Invite Tab */}
          {activeTab === 'invite' && (
            <form onSubmit={handleCreateShare} className="space-y-6">
              {/* Info box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#B4BAC4]">
                    <p className="font-medium text-blue-300 mb-1">Guest Access Sharing</p>
                    <p>Share this experiment with someone outside your organization. They will need to log in to access the experiment and can contribute based on the access level you grant.</p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                  Guest Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#1C1F24] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              {/* Name (optional) */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                  Guest Name <span className="text-[#6B7280]">(optional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-[#1C1F24] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Access Level */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                  Access Level
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAccessDropdown(!showAccessDropdown)}
                    className="w-full px-4 py-3 bg-[#1C1F24] border border-[#2A2F36] rounded-xl text-left text-[#F0F2F4] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      {React.createElement(ACCESS_LEVELS[accessLevel].icon, {
                        className: `w-5 h-5 text-${ACCESS_LEVELS[accessLevel].color}-400`
                      })}
                      <div>
                        <div className="font-medium">{ACCESS_LEVELS[accessLevel].label}</div>
                        <div className="text-xs text-[#6B7280]">{ACCESS_LEVELS[accessLevel].description}</div>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-[#6B7280] transition ${showAccessDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showAccessDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowAccessDropdown(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#15181C] border border-[#2A2F36] rounded-xl shadow-2xl z-20 overflow-hidden">
                        {Object.entries(ACCESS_LEVELS).map(([key, config]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setAccessLevel(key);
                              setShowAccessDropdown(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-[#1C1F24] transition flex items-center space-x-3 ${
                              accessLevel === key ? 'bg-blue-500/10' : ''
                            }`}
                          >
                            {React.createElement(config.icon, {
                              className: `w-5 h-5 text-${config.color}-400`
                            })}
                            <div className="flex-1">
                              <div className="font-medium text-[#F0F2F4]">{config.label}</div>
                              <div className="text-xs text-[#6B7280]">{config.description}</div>
                            </div>
                            {accessLevel === key && (
                              <Check className="w-4 h-4 text-blue-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                  Link Expiration <span className="text-[#6B7280]">(optional)</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#1C1F24] border border-[#2A2F36] rounded-xl text-[#F0F2F4] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Never expires</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-[#B4BAC4] mb-2">
                  Personal Message <span className="text-[#6B7280]">(optional)</span>
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a message for the guest..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1C1F24] border border-[#2A2F36] rounded-xl text-[#F0F2F4] placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Share...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    <span>Create Share Link</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Manage Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-6">
              {/* Refresh button */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#6B7280]">
                  Active Shares ({activeShares.length})
                </h3>
                <button
                  onClick={fetchShares}
                  className="p-2 hover:bg-[#1C1F24] rounded-lg transition text-[#6B7280] hover:text-[#F0F2F4]"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${sharesLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {sharesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : shares.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#1C1F24] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Share2 className="w-8 h-8 text-[#6B7280]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#F0F2F4] mb-2">No shares yet</h3>
                  <p className="text-sm text-[#6B7280]">
                    Create a share link to invite guests to this experiment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Active Shares */}
                  {activeShares.map((share) => (
                    <ShareListItem
                      key={share.id}
                      share={share}
                      onRevoke={handleRevokeShare}
                      onUpdateAccess={handleUpdateAccess}
                      onCopyLink={copyShareLink}
                      copiedLink={copiedLink}
                    />
                  ))}

                  {/* Inactive Shares */}
                  {inactiveShares.length > 0 && (
                    <>
                      <div className="pt-4 mt-4 border-t border-[#2A2F36]">
                        <h3 className="text-sm font-medium text-[#6B7280] mb-3">
                          Inactive ({inactiveShares.length})
                        </h3>
                        <div className="space-y-3 opacity-60">
                          {inactiveShares.map((share) => (
                            <ShareListItem
                              key={share.id}
                              share={share}
                              inactive
                            />
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Share list item component
const ShareListItem = ({ share, onRevoke, onUpdateAccess, onCopyLink, copiedLink, inactive }) => {
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const status = STATUS_CONFIG[share.status];
  const access = ACCESS_LEVELS[share.access_level];
  const AccessIcon = access.icon;

  return (
    <div className={`p-4 bg-[#1C1F24]/50 border border-[#2A2F36] rounded-xl ${inactive ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className={`w-10 h-10 bg-${access.color}-500/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
            <AccessIcon className={`w-5 h-5 text-${access.color}-400`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-[#F0F2F4] truncate">
                {share.invited_name || share.invited_email}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded-full bg-${status.color}-500/10 text-${status.color}-400 border border-${status.color}-500/30`}>
                {status.label}
              </span>
            </div>
            {share.invited_name && (
              <div className="text-sm text-[#6B7280] truncate mb-1">{share.invited_email}</div>
            )}
            <div className="flex items-center space-x-3 text-xs text-[#6B7280]">
              <span>{access.label}</span>
              {share.expires_at && (
                <>
                  <span>•</span>
                  <span>Expires {new Date(share.expires_at).toLocaleDateString()}</span>
                </>
              )}
              {share.accepted_at && (
                <>
                  <span>•</span>
                  <span>Accepted {new Date(share.accepted_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {!inactive && (
          <div className="flex items-center space-x-2 ml-4">
            {/* Copy link button */}
            <button
              onClick={() => onCopyLink(share.share_token)}
              className="p-2 hover:bg-[#2A2F36] rounded-lg transition text-[#6B7280] hover:text-[#F0F2F4]"
              title="Copy share link"
            >
              {copiedLink === share.share_token ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Access level dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAccessMenu(!showAccessMenu)}
                className="p-2 hover:bg-[#2A2F36] rounded-lg transition text-[#6B7280] hover:text-[#F0F2F4]"
                title="Change access level"
              >
                <Shield className="w-4 h-4" />
              </button>

              {showAccessMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowAccessMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[#15181C] border border-[#2A2F36] rounded-xl shadow-2xl z-20 overflow-hidden">
                    {Object.entries(ACCESS_LEVELS).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => {
                          onUpdateAccess(share.id, key);
                          setShowAccessMenu(false);
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-[#1C1F24] transition flex items-center space-x-2 ${
                          share.access_level === key ? 'bg-blue-500/10' : ''
                        }`}
                      >
                        {React.createElement(config.icon, {
                          className: `w-4 h-4 text-${config.color}-400`
                        })}
                        <span className="text-sm text-[#F0F2F4]">{config.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Revoke button */}
            <button
              onClick={() => onRevoke(share.id)}
              className="p-2 hover:bg-red-500/10 rounded-lg transition text-[#6B7280] hover:text-red-400"
              title="Revoke access"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Invite message if present */}
      {share.invite_message && (
        <div className="mt-3 pt-3 border-t border-[#2A2F36]">
          <p className="text-xs text-[#6B7280] italic">"{share.invite_message}"</p>
        </div>
      )}
    </div>
  );
};

export default ShareExperimentModal;
