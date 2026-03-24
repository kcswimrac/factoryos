import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, LogOut, User, ChevronDown, Plus, FolderOpen, FlaskConical,
  Cog, ClipboardList, FileText, AlertTriangle, Calendar, BarChart3,
  Settings, Users, CreditCard, Shield, Building2, Eye, Lock, Globe,
  Layers, Package, GitBranch, Check, Radio, TreePine, Compass, ExternalLink
} from 'lucide-react';
import { useAuth, PLAN_TIERS, VISIBILITY, TIER_CONFIG } from './context/AuthContext';
import { DEMO_PROJECTS } from './data/demoProjects';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    logout,
    currentOrg,
    currentTierConfig,
    organizations,
    switchOrganization
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);

  // Live visitor count using Pusher presence channels
  const [visitorCount, setVisitorCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Dynamically import Pusher to avoid SSR issues
    let pusherInstance = null;
    let channel = null;

    const initPusher = async () => {
      try {
        const Pusher = (await import('pusher-js')).default;

        const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
        const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'us2';

        if (!PUSHER_KEY) {
          console.warn('Pusher key not configured - visitor count disabled');
          return;
        }

        pusherInstance = new Pusher(PUSHER_KEY, {
          cluster: PUSHER_CLUSTER,
          authEndpoint: '/api/pusher/auth',
        });

        // Subscribe to presence channel for visitor tracking
        channel = pusherInstance.subscribe('presence-visitors');

        channel.bind('pusher:subscription_succeeded', (members) => {
          setIsConnected(true);
          setVisitorCount(members.count);
        });

        channel.bind('pusher:member_added', () => {
          setVisitorCount(prev => prev + 1);
        });

        channel.bind('pusher:member_removed', () => {
          setVisitorCount(prev => Math.max(0, prev - 1));
        });

        channel.bind('pusher:subscription_error', (error) => {
          console.error('Pusher subscription error:', error);
          setIsConnected(false);
        });

        pusherInstance.connection.bind('connected', () => {
          setIsConnected(true);
        });

        pusherInstance.connection.bind('disconnected', () => {
          setIsConnected(false);
        });

      } catch (error) {
        console.error('Failed to initialize Pusher:', error);
      }
    };

    initPusher();

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (pusherInstance) {
        pusherInstance.disconnect();
      }
    };
  }, []);

  // Get current project from URL if on a design project page
  const currentProjectId = location.pathname.match(/\/design\/([^\/]+)/)?.[1];
  const currentProject = currentProjectId
    ? DEMO_PROJECTS.find(p => p.id === currentProjectId)
    : null;

  // Module navigation - aligned with 7-module model from guide
  const moduleLinks = [
    { name: 'DOE', path: '/doe', icon: FlaskConical, description: 'Design of Experiments' },
    { name: 'Design', path: '/design', icon: Layers, description: '7-Phase Engineering Cycle' },
    { name: 'Quality', path: '/quality', icon: AlertTriangle, description: '8D Problem Solving' },
    { name: 'Resources', path: '/resources', icon: Package, description: 'Tool & Asset Inventory' },
    { name: 'SOPs', path: '/sops', icon: ClipboardList, badge: 'ALPHA', description: 'Standard Operating Procedures' },
    { name: 'Timeline', path: '/timeline', icon: Calendar, description: 'Visual Project Progress' },
    { name: 'Reporting', path: '/reporting', icon: BarChart3, description: 'Design Reports & Audits' },
    // Executive Dashboard visible to all, but access gated to Corporate/Enterprise inside the component
    { name: 'Executive', path: '/executive', icon: Building2, badge: 'CORP', description: 'Executive Dashboard' }
  ];

  // factoryos-only features — served as vanilla HTML pages
  const factoryosLinks = [
    { name: 'Node Tree', href: '/app', icon: TreePine, description: 'Component hierarchy editor' },
    { name: 'Discovery', href: '/discovery', icon: Compass, description: 'Early-stage design workspace' },
    { name: 'Projects', href: '/projects', icon: FolderOpen, description: 'Project dashboard' }
  ];

  // Platform-wide "New" menu items
  const newMenuItems = [
    { name: 'New Project', path: '/design/new', icon: FolderOpen, description: 'Create a new design project' },
    { name: 'New Node', path: currentProject ? `/design/${currentProject.id}?action=new-node` : '/design', icon: Package, description: 'Add node to current project', requiresProject: true },
    { name: 'New Experiment', path: '/doe/new', icon: FlaskConical, description: 'Create a DOE study' },
    { name: 'New 8D Case', path: '/quality/new', icon: AlertTriangle, description: 'Start corrective action' },
    { name: 'New SOP', path: '/sops/new', icon: ClipboardList, description: 'Create operating procedure' },
    { name: 'New Report', path: '/reporting/new', icon: FileText, description: 'Generate design report' }
  ];

  // Workspace menu items
  const workspaceMenuItems = [
    { name: 'Team Members', path: '/settings/team', icon: Users, description: 'Manage team access' },
    { name: 'Billing', path: '/settings/billing', icon: CreditCard, description: 'Subscription & payments' },
    { name: 'Permissions', path: '/settings/permissions', icon: Shield, description: 'Role-based access control' },
    { name: 'Organization', path: '/settings/organization', icon: Building2, description: 'Org settings' }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setNewMenuOpen(false);
        setProjectMenuOpen(false);
        setWorkspaceMenuOpen(false);
        setUserMenuOpen(false);
        setOrgMenuOpen(false);
        setProductMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Visibility badge component - maps to VISIBILITY constants from auth
  const VisibilityBadge = ({ visibility = 'private', size = 'sm' }) => {
    const config = {
      public: { icon: Globe, label: 'Public', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
      team_only: { icon: Users, label: 'Team Only', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
      team: { icon: Users, label: 'Team', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
      private: { icon: Lock, label: 'Private', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
    };
    const { icon: Icon, label, color } = config[visibility] || config.private;
    const sizeClasses = size === 'lg'
      ? 'px-2 py-1 text-xs gap-1.5'
      : 'px-1.5 py-0.5 text-[10px] gap-1';
    return (
      <span className={`inline-flex items-center rounded border ${color} ${sizeClasses}`}>
        <Icon className={size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
        {label}
      </span>
    );
  };

  // Tier badge component
  const TierBadge = ({ tier }) => {
    const config = {
      free: { label: 'Free', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30' },
      professional: { label: 'Pro', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
      team: { label: 'Team', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
      enterprise: { label: 'Enterprise', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
    };
    const { label, color } = config[tier] || config.free;
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] rounded border font-medium ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <nav className="fixed top-0 w-full bg-[#0F1114]/95 backdrop-blur-xl border-b border-[#2A2F36] z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Side: Live indicator + Logo + Nav */}
          <div className="flex items-center gap-8">
            {/* Live Visitors Indicator - Minimal */}
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                isConnected
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-gray-500/10 border border-gray-500/30'
              }`}
              title={isConnected ? 'Live visitor count' : 'Connecting...'}
            >
              <div className="relative">
                <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-gray-400'}`} />
                {isConnected && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                )}
              </div>
              <span className={`text-xs font-medium ${isConnected ? 'text-emerald-400' : 'text-gray-400'}`}>
                {visitorCount > 0 ? visitorCount : '—'} <span className={`hidden md:inline ${isConnected ? 'text-emerald-400/70' : 'text-gray-400/70'}`}>live</span>
              </span>
            </div>

            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="text-xl font-bold text-[#F0F2F4] hover:text-blue-400 transition whitespace-nowrap"
            >
              Factory-OS
            </button>

          </div>

          {/* Desktop Navigation - Minimal Style */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Product Dropdown - Contains all modules */}
            <div className="relative dropdown-container">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProductMenuOpen(!productMenuOpen);
                }}
                className="flex items-center gap-1.5 text-[#B4BAC4] hover:text-[#F0F2F4] transition text-sm font-medium"
              >
                Product
                <ChevronDown className={`w-4 h-4 transition-transform ${productMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {productMenuOpen && (
                <div className="absolute left-0 mt-4 w-72 bg-[#15181C] border border-[#2A2F36] rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#2A2F36]">
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide font-medium">Modules</p>
                  </div>
                  {moduleLinks.map((link) => (
                    <button
                      key={link.path}
                      onClick={() => {
                        navigate(link.path);
                        setProductMenuOpen(false);
                      }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#22262C] transition ${
                        isActive(link.path) ? 'bg-blue-500/10' : ''
                      }`}
                    >
                      <div className="mt-0.5">
                        <link.icon className={`w-4 h-4 ${isActive(link.path) ? 'text-blue-400' : 'text-[#6B7280]'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isActive(link.path) ? 'text-blue-400' : 'text-[#F0F2F4]'}`}>
                            {link.name}
                          </p>
                          {link.badge && (
                            <span className="px-1 py-0.5 text-[9px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded">
                              {link.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5">{link.description}</p>
                      </div>
                    </button>
                  ))}

                  {/* factoryos-only features (vanilla HTML) */}
                  <div className="px-4 py-2 border-t border-[#2A2F36]">
                    <p className="text-xs text-[#6B7280] uppercase tracking-wide font-medium">Engineering Tools</p>
                  </div>
                  {factoryosLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#22262C] transition"
                    >
                      <div className="mt-0.5">
                        <link.icon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#F0F2F4]">{link.name}</p>
                          <ExternalLink className="w-3 h-3 text-[#6B7280]" />
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5">{link.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <button
              onClick={() => navigate('/timeline')}
              className={`text-sm font-medium transition ${
                isActive('/timeline') ? 'text-blue-400' : 'text-[#B4BAC4] hover:text-[#F0F2F4]'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => navigate('/reporting')}
              className={`text-sm font-medium transition ${
                isActive('/reporting') ? 'text-blue-400' : 'text-[#B4BAC4] hover:text-[#F0F2F4]'
              }`}
            >
              Reports
            </button>
          </div>

          {/* Right Side Actions - Minimal */}
          <div className="hidden lg:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {/* Settings - Plain text link */}
                <button
                  onClick={() => navigate('/settings/team')}
                  className="text-[#B4BAC4] hover:text-[#F0F2F4] transition text-sm font-medium"
                >
                  Settings
                </button>

                {/* User Menu - Simplified */}
                <div className="relative dropdown-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="flex items-center gap-2 text-[#B4BAC4] hover:text-[#F0F2F4] transition text-sm font-medium"
                  >
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <User size={12} className="text-white" />
                    </div>
                    <span className="max-w-[80px] truncate">{user?.name || user?.email?.split('@')[0]}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-4 w-56 bg-[#15181C] border border-[#2A2F36] rounded-xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-[#2A2F36]">
                        <p className="text-xs text-[#6B7280]">Signed in as</p>
                        <p className="text-sm text-[#F0F2F4] truncate font-medium">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigate('/settings/profile');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#B4BAC4] hover:text-[#F0F2F4] hover:bg-[#22262C] transition"
                      >
                        <User size={16} />
                        Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[#B4BAC4] hover:text-[#F0F2F4] hover:bg-[#22262C] transition"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>

                {/* New - Primary CTA */}
                <button
                  onClick={() => navigate('/design/new')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  New Project
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#B4BAC4] hover:text-[#F0F2F4] transition text-sm font-medium"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#B4BAC4] p-2"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#15181C] border-t border-[#2A2F36]">
          <div className="px-4 py-6 space-y-6">
            {/* Product Section */}
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide font-medium mb-3">Product</p>
              <div className="grid grid-cols-2 gap-2">
                {moduleLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => {
                      navigate(link.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                      isActive(link.path)
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-[#1C1F24] text-[#B4BAC4] hover:text-[#F0F2F4]'
                    }`}
                  >
                    <link.icon className="w-4 h-4 text-[#6B7280]" />
                    {link.name}
                  </button>
                ))}
              </div>
            </div>

            {/* factoryos Engineering Tools (mobile) */}
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide font-medium mb-3">Engineering Tools</p>
              <div className="grid grid-cols-2 gap-2">
                {factoryosLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#1C1F24] text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <link.icon className="w-4 h-4" />
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-xs text-[#6B7280] uppercase tracking-wide font-medium mb-3">Quick Links</p>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate('/timeline');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-[#B4BAC4] hover:text-[#F0F2F4] hover:bg-[#1C1F24] text-sm transition"
                >
                  Timeline
                </button>
                <button
                  onClick={() => {
                    navigate('/reporting');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-[#B4BAC4] hover:text-[#F0F2F4] hover:bg-[#1C1F24] text-sm transition"
                >
                  Reports
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      navigate('/settings/team');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg text-[#B4BAC4] hover:text-[#F0F2F4] hover:bg-[#1C1F24] text-sm transition"
                  >
                    Settings
                  </button>
                )}
              </div>
            </div>

            {/* Auth Actions */}
            <div className="pt-4 border-t border-[#2A2F36] space-y-3">
              {isAuthenticated ? (
                <>
                  <div className="text-xs text-[#6B7280] mb-2">
                    Signed in as {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      navigate('/design/new');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors text-center"
                  >
                    New Project
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-center text-[#B4BAC4] hover:text-[#F0F2F4] py-2 text-sm font-medium transition"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-center text-[#B4BAC4] hover:text-[#F0F2F4] py-2 text-sm font-medium transition"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors text-center"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
