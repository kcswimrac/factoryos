import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';
import {
  Plus, FolderOpen, Clock, CheckCircle2, AlertCircle,
  ChevronRight, Filter, Search, LayoutGrid, List,
  PenTool, FileText, Users, Calendar, TrendingUp,
  Shield, ShieldCheck, ShieldAlert, GitBranch, Wrench, Tag,
  Globe, Building2, Users2, Lock, ClipboardList, Info, Target
} from 'lucide-react';
import PageSummary from './components/ui/PageSummary';
import DesignPhaseTimelineExplainer from './components/design-cycle/DesignPhaseTimelineExplainer';
import { PHASE_STATUS } from './config/designPhasesExplainerConfig';
import { useAuth } from './context/AuthContext';

import { DESIGN_PHASES, RIGOR_TIERS } from './config/designPhases';
import { getStatusClasses, getAIScoreClasses, getPhaseSegmentClass } from './config/theme';
import { RigorTierBadge, PhaseNavigator, ProjectTreeView } from './components/design-cycle';
import {
  DEMO_PROJECTS,
  PROJECT_MODES,
  PROJECT_STATUS,
  calculateProjectStats,
  countNodes,
  getProjectById,
  getVisibleProjects
} from './data/demoProjects';
import {
  DEMO_SOPS,
  SOP_STATUS,
  SOP_TYPES,
  VISIBILITY_SCOPE,
  getSOPsByStatus,
  getDraftSOPs,
  getApprovedSOPs
} from './data/demoSOPs';

// 7-Phase display names
const PHASE_DISPLAY = [
  { number: 1, subPhase: null, name: 'Requirements', short: 'Req' },
  { number: 2, subPhase: null, name: 'R&D', short: 'R&D' },
  { number: 3, subPhase: 'a', name: 'Design/CAD', short: 'CAD' },
  { number: 3, subPhase: 'b', name: 'Serviceability', short: 'Svc' },
  { number: 3, subPhase: 'c', name: 'Manufacturability', short: 'DFM' },
  { number: 4, subPhase: null, name: 'Data Collection', short: 'Data' },
  { number: 5, subPhase: null, name: 'Analysis', short: 'Calc' },
  { number: 6, subPhase: null, name: 'Testing', short: 'Test' },
  { number: 7, subPhase: null, name: 'Correlation', short: 'Corr' }
];

const API_URL = import.meta.env.VITE_API_URL || '';

// Helper to get phase index from number and subphase
const getPhaseIndex = (number, subPhase) => {
  return PHASE_DISPLAY.findIndex(p => p.number === number && p.subPhase === subPhase);
};

// Helper to get phase display name
const getPhaseName = (number, subPhase) => {
  const phase = PHASE_DISPLAY.find(p => p.number === number && p.subPhase === subPhase);
  return phase ? phase.name : 'Unknown';
};

const getPhaseShort = (number, subPhase) => {
  const phase = PHASE_DISPLAY.find(p => p.number === number && p.subPhase === subPhase);
  return phase ? phase.short : '?';
};

function DesignCycleHome() {
  const navigate = useNavigate();
  const { currentOrg, currentTierConfig } = useAuth();
  const [projects, setProjects] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // Default to list for split view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [filterScope, setFilterScope] = useState('all'); // Scope: all, user, organization, org_group, public
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProjectData, setSelectedProjectData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        // Build query params including scope filter
        const params = new URLSearchParams();
        if (filterScope !== 'all') params.append('scope', filterScope);
        const query = params.toString() ? `?${params.toString()}` : '';

        const response = await fetch(`${API_URL}/api/design${query}`);
        const data = await response.json();

        if (data.success) {
          // Transform projects to include rigor tier and AI score
          const transformedProjects = data.data.map(p => ({
            ...p,
            rigor_tier: p.rigor_tier || 2,
            ai_score: p.ai_score || 0,
            current_phase_number: p.current_phase_number || p.current_phase || 1,
            current_sub_phase: p.current_sub_phase || null,
            visibility: p.visibility || 'private'
          }));
          setProjects(transformedProjects);
        } else {
          // Demo data for development
          setProjects(getDemoProjects());
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        // Demo data for development
        setProjects(getDemoProjects());
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [filterScope, currentOrg?.id]);

  // Transform demo projects from data file to display format
  // Filter by current organization - each org only sees their own projects
  const getDemoProjects = () => {
    const orgId = currentOrg?.id || 'org-public-demo';
    // Get projects belonging to this org only
    const visibleProjects = getVisibleProjects(orgId);
    return visibleProjects.map(project => {
    const stats = calculateProjectStats(project);
    const progress = project.status === 'completed' ? 100 :
      Math.round((project.current_phase / 7) * 100);

    // Extract sub-phase from phase number if in phase 3
    let current_sub_phase = null;
    let display_phase = project.current_phase;
    if (project.current_phase === 3) {
      current_sub_phase = 'a'; // Default to 3a if in phase 3
    }

    return {
      id: project.id,
      project_number: project.id.toUpperCase().replace('PROJ-', 'PRJ-'),
      name: project.name,
      description: project.description,
      status: project.status,
      rigor_tier: project.rigor_tier,
      current_phase_number: display_phase,
      current_sub_phase: current_sub_phase,
      overall_progress: progress,
      ai_score: stats.avgAiScore,
      team_size: Math.floor(Math.random() * 5) + 3,
      target_date: project.target_completion ?
        new Date(project.target_completion).toISOString().split('T')[0] :
        project.completed_at ?
          new Date(project.completed_at).toISOString().split('T')[0] :
          '2025-12-31',
      iteration_count: 0,
      // New fields for enhanced display
      mode: project.mode,
      tags: project.tags || [],
      team: project.team,
      manufacturing_assets_count: project.manufacturing_assets?.length || 0,
      total_nodes: stats.totalNodes,
      baseline_reference: project.baseline_reference,
      change_package: project.change_package,
      visibility: project.visibility || 'private',
      org_id: project.org_id,
      org_group_name: project.org_group_name || null
    };
  });
  };

  // Helper function to get visibility icon component
  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'public': return Globe;
      case 'organization': return Building2;
      case 'org_group': return Users2;
      case 'private':
      default: return Lock;
    }
  };

  // Helper function to get visibility color
  const getVisibilityColor = (visibility) => {
    switch (visibility) {
      case 'public': return 'text-emerald-400';
      case 'organization': return 'text-blue-400';
      case 'org_group': return 'text-purple-400';
      case 'private':
      default: return 'text-slate-400';
    }
  };

  // Helper function to get visibility label
  const getVisibilityLabel = (visibility) => {
    switch (visibility) {
      case 'public': return 'Public';
      case 'organization': return 'Organization';
      case 'org_group': return 'Org Group';
      case 'private':
      default: return 'Private';
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.project_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    const matchesTier = filterTier === 'all' || project.rigor_tier === parseInt(filterTier);
    const matchesMode = filterMode === 'all' ||
      (filterMode === 'new_design' && project.mode === PROJECT_MODES.NEW_DESIGN) ||
      (filterMode === 'platform_mod' && project.mode === PROJECT_MODES.PLATFORM_MOD);
    return matchesSearch && matchesStatus && matchesTier && matchesMode;
  });

  // Stats
  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    platformMods: projects.filter(p => p.mode === PROJECT_MODES.PLATFORM_MOD).length,
    avgAIScore: projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.ai_score || 0), 0) / projects.length)
      : 0
  };

  // SOP Stats
  const sopStats = {
    total: DEMO_SOPS.length,
    draft: DEMO_SOPS.filter(s => s.status === SOP_STATUS.DRAFT).length,
    approved: DEMO_SOPS.filter(s => s.status === SOP_STATUS.APPROVED).length,
    inReview: DEMO_SOPS.filter(s => s.status === SOP_STATUS.IN_REVIEW).length
  };

  // Use theme status classes
  const getStatusColor = (status) => getStatusClasses(status);

  // Phase segment colors: completed = green, current = blue accent, future = neutral
  const getPhaseColor = (phaseIdx, currentPhaseIdx) => {
    if (phaseIdx < currentPhaseIdx) return 'bg-emerald-500';
    if (phaseIdx === currentPhaseIdx) return 'bg-blue-500';
    return 'bg-slate-700';
  };

  // Use theme AI score classes
  const getAIScoreColor = (score) => getAIScoreClasses(score);

  const getTierIcon = (tier) => {
    switch (tier) {
      case 1: return Shield;
      case 2: return ShieldCheck;
      case 3: return ShieldAlert;
      default: return Shield;
    }
  };

  // Handle project selection - toggle accordion expand
  const handleSelectProject = (projectId) => {
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
      setSelectedProjectData(null);
    } else {
      setSelectedProjectId(projectId);
      const fullData = getProjectById(projectId);
      setSelectedProjectData(fullData);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1114]">
      <Header />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F0F2F4] flex items-center gap-3">
              <PenTool className="w-7 h-7 text-blue-400" />
              Engineering Design Cycle
            </h1>
            <p className="text-[#6B7280] mt-1">
              Manage projects with the 7-phase methodology, rigor tiers, and AI-powered scoring
            </p>
          </div>
          <button
            onClick={() => navigate('/design/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {/* Section Summary */}
        <PageSummary icon={Target} iconColor="text-blue-400" borderColor="border-blue-500/30" bgColor="bg-blue-500/5">
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Purpose:</strong> This section implements the 7-Phase Engineering Design Cycle, guiding users through defining requirements, research and development, design, data collection, analysis, testing, and correlation.
          </p>
          <p className="mb-2">
            <strong className="text-[#F0F2F4]">Method:</strong> The system enforces phase gates and rigor tiers to prevent skipped steps, ensures all design decisions link back to requirements, and tracks AI-scored completion metrics across each phase.
          </p>
          <p>
            <strong className="text-[#F0F2F4]">Outcome:</strong> Produces defensible engineering decisions with full traceability from requirements through validation. Prevents undocumented design rationale and ensures every release candidate meets its declared rigor tier.
          </p>
        </PageSummary>

        {/* 7-Phase Timeline Explainer */}
        <div className="mb-6">
          <DesignPhaseTimelineExplainer
            phaseStatus={{
              1: PHASE_STATUS.COMPLETE,
              2: PHASE_STATUS.COMPLETE,
              3: PHASE_STATUS.IN_PROGRESS,
              4: PHASE_STATUS.NOT_STARTED,
              5: PHASE_STATUS.NOT_STARTED,
              6: PHASE_STATUS.NOT_STARTED,
              7: PHASE_STATUS.NOT_STARTED
            }}
            showStatus={true}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B7280] text-sm">Total Projects</p>
                <p className="text-2xl font-semibold text-[#F0F2F4]">{stats.total}</p>
              </div>
              <FolderOpen className="w-9 h-9 text-[#6B7280] opacity-50" />
            </div>
          </div>
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B7280] text-sm">Active</p>
                <p className="text-2xl font-semibold text-emerald-400">{stats.active}</p>
              </div>
              <Clock className="w-9 h-9 text-emerald-400 opacity-40" />
            </div>
          </div>
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B7280] text-sm">Completed</p>
                <p className="text-2xl font-semibold text-blue-400">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-9 h-9 text-blue-400 opacity-40" />
            </div>
          </div>
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B7280] text-sm">Platform Mods</p>
                <p className="text-2xl font-semibold text-amber-400">{stats.platformMods}</p>
              </div>
              <GitBranch className="w-9 h-9 text-amber-400 opacity-40" />
            </div>
          </div>
          <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B7280] text-sm">Avg AI Score</p>
                <p className={`text-2xl font-semibold ${getAIScoreColor(stats.avgAIScore)}`}>
                  {stats.avgAIScore}%
                </p>
              </div>
              <TrendingUp className="w-9 h-9 text-blue-400 opacity-40" />
            </div>
          </div>
          {/* SOP Stats Card (ALPHA) */}
          <Link
            to="/sops"
            className="bg-[#15181C] border border-purple-500/30 rounded-xl p-4 hover:border-purple-500/50 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B7280] text-sm flex items-center gap-1">
                  SOPs
                  <span className="text-[9px] px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded">ALPHA</span>
                </p>
                <p className="text-2xl font-semibold text-purple-400">{sopStats.total}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {sopStats.draft} draft · {sopStats.approved} approved
                </p>
              </div>
              <ClipboardList className="w-9 h-9 text-purple-400 opacity-40 group-hover:opacity-60 transition-opacity" />
            </div>
          </Link>
        </div>

        {/* Design Reviews Quick Link */}
        <Link
          to="/design/reviews"
          className="mb-6 block bg-[#15181C] border border-red-500/30 rounded-xl p-4 hover:border-red-500/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F0F2F4] group-hover:text-red-400 transition-colors">
                  Design Reviews
                </h3>
                <p className="text-sm text-[#6B7280]">
                  Schedule and manage SRR, SDR, PDR, and CDR milestone reviews
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-red-400 transition-colors" />
          </div>
        </Link>

        {/* Visibility Explainer Banner */}
        {currentOrg && (
          <div className={`mb-6 rounded-lg p-3 flex items-start gap-3 ${
            currentOrg.visibility === 'public'
              ? 'bg-emerald-500/10 border border-emerald-500/30'
              : 'bg-blue-500/10 border border-blue-500/30'
          }`}>
            <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              currentOrg.visibility === 'public' ? 'text-emerald-400' : 'text-blue-400'
            }`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className={`w-4 h-4 ${
                  currentOrg.visibility === 'public' ? 'text-emerald-400' : 'text-blue-400'
                }`} />
                <span className={`text-sm font-medium ${
                  currentOrg.visibility === 'public' ? 'text-emerald-300' : 'text-blue-300'
                }`}>
                  {currentOrg.name}
                </span>
                <span className={`px-1.5 py-0.5 text-[10px] rounded border ${
                  currentOrg.visibility === 'public'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                }`}>
                  {currentTierConfig?.name} · {currentTierConfig?.visibilityLabel}
                </span>
              </div>
              <p className={`text-xs ${
                currentOrg.visibility === 'public' ? 'text-emerald-200/70' : 'text-blue-200/70'
              }`}>
                {currentOrg.visibility === 'public'
                  ? 'Showing public projects. These are visible to everyone on the internet. Switch orgs to see team-only or private projects.'
                  : `Showing ${currentOrg.name}'s ${currentOrg.visibility === 'team_only' ? 'team-only' : 'private'} projects. These are not visible to other organizations.`
                }
              </p>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#F0F2F4] placeholder-[#6B7280] focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#B4BAC4] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#B4BAC4] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Tiers</option>
              <option value="1">Tier 1: Simple</option>
              <option value="2">Tier 2: Standard</option>
              <option value="3">Tier 3: Critical</option>
            </select>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#B4BAC4] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Modes</option>
              <option value="new_design">New Design</option>
              <option value="platform_mod">Platform Mod</option>
            </select>
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="px-3 py-2 bg-[#1C1F24] border border-[#2A2F36] rounded-lg text-[#B4BAC4] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">All Scopes</option>
              <option value="user">My Projects</option>
              <option value="organization">Organization</option>
              <option value="org_group">Org Group</option>
              <option value="public">Public</option>
            </select>
            <div className="flex border border-[#2A2F36] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-[#1C1F24] text-[#6B7280] hover:text-[#B4BAC4]'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-[#1C1F24] text-[#6B7280] hover:text-[#B4BAC4]'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#2A2F36] border-t-blue-500 mx-auto mb-4"></div>
            <p className="text-[#6B7280]">Loading projects...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Main Content - Project List */}
        {!loading && !error && (
          <div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProjects.map(project => {
                    const currentPhaseIdx = getPhaseIndex(project.current_phase_number, project.current_sub_phase);
                    const isSelected = selectedProjectId === project.id;
                    const projectData = isSelected ? selectedProjectData : null;

                    return (
                      <div
                        key={project.id}
                        className={`bg-[#15181C] border rounded-xl transition-all ${
                          isSelected ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-[#2A2F36] hover:border-[#363C44]'
                        }`}
                      >
                        {/* Card Header - Clickable */}
                        <div
                          onClick={() => handleSelectProject(project.id)}
                          className="p-4 cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-[#6B7280] font-mono">{project.project_number}</span>
                                <RigorTierBadge tier={project.rigor_tier} size="sm" showLabel={false} />
                                {project.mode === PROJECT_MODES.PLATFORM_MOD && (
                                  <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-amber-500/15 text-amber-400 rounded border border-amber-500/40">
                                    <GitBranch className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-medium text-[#F0F2F4] group-hover:text-blue-400 transition-colors">
                                {project.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                              <ChevronRight className={`w-4 h-4 text-[#6B7280] transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
                            <span>Phase {project.current_phase_number}{project.current_sub_phase || ''}</span>
                            <span className={`font-medium ${getAIScoreColor(project.ai_score)}`}>{project.ai_score}%</span>
                          </div>

                          <div className="flex gap-0.5">
                            {PHASE_DISPLAY.map((phase, idx) => (
                              <div
                                key={`${phase.number}${phase.subPhase || ''}`}
                                className={`h-1 flex-1 rounded-full ${getPhaseColor(idx, currentPhaseIdx)}`}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Accordion Expanded Section */}
                        {isSelected && (
                          <div className="border-t border-[#2A2F36] p-4 bg-[#0F1114]/50">
                            {/* Description */}
                            {projectData?.description && (
                              <p className="text-sm text-[#9CA3AF] mb-4">{projectData.description}</p>
                            )}

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                              <div className="bg-[#1C1F24] rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-[#F0F2F4]">{project.total_nodes}</div>
                                <div className="text-xs text-[#6B7280]">Nodes</div>
                              </div>
                              <div className="bg-[#1C1F24] rounded-lg p-3 text-center">
                                <div className={`text-lg font-bold ${getAIScoreColor(project.ai_score)}`}>{project.ai_score}%</div>
                                <div className="text-xs text-[#6B7280]">AI Score</div>
                              </div>
                              <div className="bg-[#1C1F24] rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-blue-400">
                                  {project.current_phase_number}{project.current_sub_phase || ''}/7
                                </div>
                                <div className="text-xs text-[#6B7280]">Phase</div>
                              </div>
                            </div>

                            {/* Tags */}
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {project.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Visibility & Target Date */}
                            <div className="flex items-center justify-between text-xs text-[#6B7280] mb-4">
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const VisIcon = getVisibilityIcon(project.visibility);
                                  return (
                                    <span className={`flex items-center gap-1 ${getVisibilityColor(project.visibility)}`}>
                                      <VisIcon className="w-3 h-3" />
                                      {getVisibilityLabel(project.visibility)}
                                    </span>
                                  );
                                })()}
                              </div>
                              {project.target_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Target: {project.target_date}
                                </span>
                              )}
                            </div>

                            {/* Open Project Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/design/project/${project.id}`);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                            >
                              Open Project
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="bg-[#15181C] border border-[#2A2F36] rounded-xl overflow-hidden divide-y divide-[#2A2F36]">
                  {filteredProjects.map(project => {
                    const isSelected = selectedProjectId === project.id;
                    const projectData = isSelected ? selectedProjectData : null;
                    const currentPhaseIdx = getPhaseIndex(project.current_phase_number, project.current_sub_phase);

                    return (
                      <div key={project.id}>
                        {/* Row Header - Clickable */}
                        <div
                          onClick={() => handleSelectProject(project.id)}
                          className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-500/10' : 'hover:bg-[#22262C]'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {project.mode === PROJECT_MODES.PLATFORM_MOD && (
                                <GitBranch className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                              )}
                              <p className="text-[#F0F2F4] font-medium text-sm truncate">{project.name}</p>
                              <span className="text-xs text-[#6B7280] font-mono flex-shrink-0">{project.project_number}</span>
                            </div>
                          </div>
                          <span className="text-blue-400 text-sm w-16 text-center">
                            {project.current_phase_number}{project.current_sub_phase || ''}/7
                          </span>
                          <span className={`text-sm font-medium w-12 text-center ${getAIScoreColor(project.ai_score)}`}>
                            {project.ai_score}%
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-[#6B7280] transition-transform flex-shrink-0 ${isSelected ? 'rotate-90' : ''}`} />
                        </div>

                        {/* Accordion Expanded Section */}
                        {isSelected && (
                          <div className="px-4 py-4 bg-[#0F1114]/50 border-t border-[#2A2F36]">
                            {/* Description */}
                            {projectData?.description && (
                              <p className="text-sm text-[#9CA3AF] mb-4">{projectData.description}</p>
                            )}

                            {/* Phase Progress Bar */}
                            <div className="mb-4">
                              <div className="flex gap-0.5">
                                {PHASE_DISPLAY.map((phase, idx) => (
                                  <div
                                    key={`${phase.number}${phase.subPhase || ''}`}
                                    className={`h-2 flex-1 rounded-full ${getPhaseColor(idx, currentPhaseIdx)}`}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Info Row */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] mb-4">
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {project.total_nodes} nodes
                              </span>
                              {(() => {
                                const VisIcon = getVisibilityIcon(project.visibility);
                                return (
                                  <span className={`flex items-center gap-1 ${getVisibilityColor(project.visibility)}`}>
                                    <VisIcon className="w-3 h-3" />
                                    {getVisibilityLabel(project.visibility)}
                                  </span>
                                );
                              })()}
                              {project.target_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Target: {project.target_date}
                                </span>
                              )}
                              <RigorTierBadge tier={project.rigor_tier} size="sm" />
                            </div>

                            {/* Tags */}
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-4">
                                {project.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Open Project Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/design/project/${project.id}`);
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                            >
                              Open Project
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {!loading && !error && filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-[#4B5563] mx-auto mb-4" />
            <p className="text-[#6B7280]">No projects found</p>
            <button
              onClick={() => navigate('/design/new')}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default DesignCycleHome;
