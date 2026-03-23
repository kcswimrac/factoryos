import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, X, ChevronDown, Radio,
  FlaskConical, PenTool, ClipboardList,
  BarChart3, Building2, Calendar, Package,
  AlertTriangle, Cog, Truck, ListChecks
} from 'lucide-react';

const MarketingHeader = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Live visitor count using Pusher presence channels
  const [visitorCount, setVisitorCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [dbStatus, setDbStatus] = useState({ status: 'checking', message: 'Checking...' });
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);

  useEffect(() => {
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

        channel.bind('pusher:subscription_error', () => {
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

  // Fetch database status
  const checkDbStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      if (data.database) {
        setDbStatus(data.database);
      }
    } catch {
      setDbStatus({ status: 'error', message: 'API unreachable' });
    }
  };

  useEffect(() => {
    checkDbStatus();
    const interval = setInterval(checkDbStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Available modules
  const availableModules = [
    { name: 'DOE Manager', path: '/doe', icon: FlaskConical, description: 'Design of Experiments' },
    { name: 'Engineering Design', path: '/design', icon: PenTool, description: 'Structured Design System' },
    { name: 'SOPs', path: '/sops', icon: ClipboardList, description: 'Standard Operating Procedures' }
  ];

  // Coming soon modules
  const comingSoonModules = [
    { name: 'Quality', path: '/quality', icon: AlertTriangle, description: '8D Problem Solving' },
    { name: 'Reporting', path: '/reporting', icon: BarChart3, description: 'Design Reports' },
    { name: 'Executive', path: '/executive', icon: Building2, description: 'Dashboard' },
    { name: 'Timeline', path: '/timeline', icon: Calendar, description: 'Project Timeline' },
    { name: 'Resources', path: '/resources', icon: Package, description: 'Inventory' },
    { name: 'Procurement', path: '#', icon: Truck, description: 'Coming Soon' },
    { name: 'Manufacturing', path: '#', icon: Cog, description: 'Coming Soon' },
    { name: 'Tasks', path: '#', icon: ListChecks, description: 'Coming Soon' }
  ];

  const toggleDropdown = (name, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <nav className="fixed top-0 w-full bg-[#0D1110]/95 backdrop-blur-xl border-b border-emerald-400/20 z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            {/* Live Visitors Indicator */}
            <div
              className={`relative hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isConnected
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-gray-500/10 border border-gray-500/30'
              }`}
              onMouseEnter={() => setShowStatusTooltip(true)}
              onMouseLeave={() => setShowStatusTooltip(false)}
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

              {/* Status Tooltip */}
              {showStatusTooltip && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#15181C] border border-[#2A2F36] rounded-lg shadow-xl p-3 z-50">
                  <div className="text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Realtime</span>
                      <span className={`font-medium ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">Database</span>
                      <span className={`font-medium ${
                        dbStatus.status === 'connected' ? 'text-emerald-400' :
                        dbStatus.status === 'checking' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {dbStatus.status === 'connected' ? 'Connected' :
                         dbStatus.status === 'checking' ? 'Checking...' :
                         dbStatus.status === 'not_configured' ? 'Not Configured' :
                         'Error'}
                      </span>
                    </div>
                    {dbStatus.status === 'error' && (
                      <div className="text-[10px] text-red-400/70 truncate">
                        {dbStatus.message}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logo */}
            <button
              onClick={() => navigate('/')}
              className="text-xl font-bold text-[#F0F2F4] hover:text-emerald-400 transition whitespace-nowrap"
            >
              Factory-OS
            </button>

            {/* Desktop Navigation - Simplified */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Product Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setActiveDropdown(activeDropdown === 'product' ? null : 'product')}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#C7CEC9] hover:text-[#F5F7F6] transition"
                >
                  Product
                  <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'product' ? 'rotate-180' : ''}`} />
                </button>

                {activeDropdown === 'product' && (
                  <div className="absolute left-0 mt-4 w-72 bg-[#15181C] border border-[#2A2F36] rounded-xl shadow-2xl py-2 z-50">
                    {/* Available Now */}
                    <div className="px-4 py-2 border-b border-[#2A2F36]">
                      <p className="text-xs text-emerald-400 uppercase tracking-wide font-medium">Available Now</p>
                    </div>
                    {availableModules.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setActiveDropdown(null);
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-[#22262C] transition"
                      >
                        <div className="mt-0.5">
                          <item.icon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[#F0F2F4] font-medium">{item.name}</p>
                          <p className="text-xs text-[#6B7280] mt-0.5">{item.description}</p>
                        </div>
                      </button>
                    ))}

                    {/* Coming Soon */}
                    <div className="px-4 py-2 border-b border-t border-[#2A2F36] mt-2">
                      <p className="text-xs text-[#4B5563] uppercase tracking-wide font-medium">Coming Soon</p>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {comingSoonModules.map((item) => (
                        <div
                          key={item.name}
                          className="w-full flex items-start gap-3 px-4 py-2 text-left opacity-50 cursor-not-allowed"
                        >
                          <div className="mt-0.5">
                            <item.icon className="w-4 h-4 text-[#4B5563]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-[#6B7280] font-medium">{item.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Early Access Link */}
              <button
                onClick={() => {
                  const hero = document.querySelector('section');
                  if (hero) {
                    hero.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-[#B4BAC4] hover:text-[#F0F2F4] transition text-sm font-medium"
              >
                Early Access
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-[#C7CEC9] hover:text-[#F5F7F6] transition"
            >
              Sign In
            </button>

            <button
              onClick={() => navigate('/login')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Join Early Access
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#C7CEC9] p-2"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#15181C] border-t border-[#2A2F36]">
          <div className="px-4 py-6 space-y-6">
            {/* Available Now Section */}
            <div>
              <p className="text-xs text-emerald-400 uppercase tracking-wide font-medium mb-3">Available Now</p>
              <div className="space-y-1">
                {availableModules.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg bg-[#1C1F24] text-[#B4BAC4] hover:text-[#F0F2F4] text-sm transition"
                  >
                    <item.icon className="w-4 h-4 text-emerald-400" />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coming Soon Section */}
            <div>
              <p className="text-xs text-[#4B5563] uppercase tracking-wide font-medium mb-3">Coming Soon</p>
              <div className="grid grid-cols-2 gap-2">
                {comingSoonModules.slice(0, 4).map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1C1F24] text-[#4B5563] text-sm opacity-50"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Auth Actions */}
            <div className="pt-4 border-t border-[#2A2F36] space-y-3">
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-center text-[#B4BAC4] hover:text-[#F0F2F4] py-2 text-sm font-medium transition"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-colors text-center"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MarketingHeader;
