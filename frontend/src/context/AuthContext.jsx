import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// =============================================================================
// ORGANIZATION & TIER DEFINITIONS
// Matches SAAS_DEVELOPMENT_GUIDE.md pricing tiers
// =============================================================================

export const PLAN_TIERS = {
  FREE: 'free',
  PROFESSIONAL: 'professional',
  TEAM: 'team',
  ENTERPRISE: 'enterprise'
};

export const VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  TEAM_ONLY: 'team_only'
};

// Tier configuration with visibility rules
export const TIER_CONFIG = {
  [PLAN_TIERS.FREE]: {
    name: 'Free',
    price: '$0',
    visibility: VISIBILITY.PUBLIC,
    visibilityLabel: 'Public',
    maxUsers: 1,
    features: ['Public projects only', 'Basic DOE', 'Community support']
  },
  [PLAN_TIERS.PROFESSIONAL]: {
    name: 'Professional',
    price: '$29/user',
    visibility: VISIBILITY.PRIVATE,
    visibilityLabel: 'Private',
    maxUsers: 1,
    features: ['Private projects', 'Full DOE suite', 'Email support']
  },
  [PLAN_TIERS.TEAM]: {
    name: 'Team',
    price: '$99/5 users',
    visibility: VISIBILITY.TEAM_ONLY,
    visibilityLabel: 'Team Only',
    maxUsers: 5,
    features: ['Team collaboration', 'Full platform access', 'Priority support']
  },
  [PLAN_TIERS.ENTERPRISE]: {
    name: 'Enterprise',
    price: 'Custom',
    visibility: VISIBILITY.PRIVATE,
    visibilityLabel: 'Private',
    maxUsers: -1, // Unlimited
    features: ['SSO/SAML', 'Custom integrations', 'Dedicated support']
  }
};

// Demo organizations
export const DEMO_ORGANIZATIONS = [
  {
    id: 'org-public-demo',
    name: 'Public Demo Org',
    tier: PLAN_TIERS.FREE,
    visibility: VISIBILITY.PUBLIC,
    memberCount: 1,
    description: 'Free tier demo - all projects are publicly visible'
  },
  {
    id: 'org-acme-industrial',
    name: 'Acme Industrial',
    tier: PLAN_TIERS.TEAM,
    visibility: VISIBILITY.TEAM_ONLY,
    memberCount: 5,
    description: 'Team tier demo - projects visible only to team members'
  },
  {
    id: 'org-megacorp-enterprise',
    name: 'MegaCorp Engineering',
    tier: PLAN_TIERS.ENTERPRISE,
    visibility: VISIBILITY.PRIVATE,
    memberCount: 150,
    description: 'Enterprise tier demo - private org with full feature access'
  }
];

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentOrgId, setCurrentOrgId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = localStorage.getItem('factoryos_user');
    const storedOrgId = localStorage.getItem('factoryos_current_org');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setCurrentOrgId(storedOrgId || DEMO_ORGANIZATIONS[0].id);
      } catch (e) {
        localStorage.removeItem('factoryos_user');
        localStorage.removeItem('factoryos_current_org');
      }
    }
    setLoading(false);
  }, []);

  // Get current organization object
  const currentOrg = DEMO_ORGANIZATIONS.find(org => org.id === currentOrgId) || DEMO_ORGANIZATIONS[0];

  // Get tier configuration for current org
  const currentTierConfig = TIER_CONFIG[currentOrg?.tier] || TIER_CONFIG[PLAN_TIERS.FREE];

  // Switch organization
  const switchOrganization = (orgId) => {
    const org = DEMO_ORGANIZATIONS.find(o => o.id === orgId);
    if (org) {
      setCurrentOrgId(orgId);
      localStorage.setItem('factoryos_current_org', orgId);
    }
  };

  const login = async (email, password) => {
    try {
      // Demo mode: allow login without credentials
      if (!email && !password) {
        const demoUser = {
          email: 'demo@factory-os.com',
          name: 'Demo User',
          role: 'admin',
          token: 'demo-token',
          // Add org membership
          orgs: DEMO_ORGANIZATIONS.map(org => org.id)
        };
        setUser(demoUser);
        setCurrentOrgId(DEMO_ORGANIZATIONS[0].id);
        localStorage.setItem('factoryos_user', JSON.stringify(demoUser));
        localStorage.setItem('factoryos_current_org', DEMO_ORGANIZATIONS[0].id);
        return { success: true };
      }

      // If credentials provided, attempt API login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const userData = {
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        token: data.token,
      };

      setUser(userData);
      localStorage.setItem('factoryos_user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentOrgId(null);
    localStorage.removeItem('factoryos_user');
    localStorage.removeItem('factoryos_current_org');
  };

  const isAuthenticated = !!user;

  // Get visibility label for display
  const getVisibilityForTier = (tier) => {
    const config = TIER_CONFIG[tier];
    return config ? config.visibilityLabel : 'Public';
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      isAuthenticated,
      // Organization context
      currentOrg,
      currentOrgId,
      currentTierConfig,
      organizations: DEMO_ORGANIZATIONS,
      switchOrganization,
      getVisibilityForTier,
      // Constants
      PLAN_TIERS,
      VISIBILITY,
      TIER_CONFIG
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
