import React from 'react';
import { Info, Globe, Lock, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * VisibilityBanner - Shows the current org's visibility status
 * Use this on module home pages to explain data visibility to users
 */
const VisibilityBanner = ({ className = '' }) => {
  const { currentOrg, currentTierConfig, isAuthenticated } = useAuth();

  // Don't show if not authenticated or no org context
  if (!isAuthenticated || !currentOrg) {
    return null;
  }

  const isPublic = currentOrg.visibility === 'public';
  const visibilityIcon = isPublic ? Globe : (currentOrg.visibility === 'team_only' ? Users : Lock);
  const VisIcon = visibilityIcon;

  return (
    <div className={`rounded-lg p-3 flex items-start gap-3 ${
      isPublic
        ? 'bg-emerald-500/10 border border-emerald-500/30'
        : 'bg-blue-500/10 border border-blue-500/30'
    } ${className}`}>
      <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
        isPublic ? 'text-emerald-400' : 'text-blue-400'
      }`} />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <VisIcon className={`w-4 h-4 ${isPublic ? 'text-emerald-400' : 'text-blue-400'}`} />
          <span className={`text-sm font-medium ${
            isPublic ? 'text-emerald-300' : 'text-blue-300'
          }`}>
            {isPublic ? 'Public Organization' : 'Private Organization'}
          </span>
          <span className={`px-1.5 py-0.5 text-[10px] rounded border ${
            isPublic
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
          }`}>
            {currentTierConfig?.name} Tier
          </span>
        </div>
        <p className={`text-xs ${
          isPublic ? 'text-emerald-200/70' : 'text-blue-200/70'
        }`}>
          {isPublic
            ? 'You are viewing the Free-tier org. All data in this org is publicly visible. Upgrade to a paid plan for private data.'
            : `You are in "${currentOrg.name}". Data here is visible only to ${currentOrg.visibility === 'team_only' ? 'team members' : 'organization members'}.`
          }
        </p>
      </div>
    </div>
  );
};

export default VisibilityBanner;
