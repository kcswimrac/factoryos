/**
 * Enterprise Industrial Theme - Design Tokens
 *
 * A professional, neutral theme with clear hierarchy and minimal visual noise.
 * Uses a single accent color (blue) for primary actions and active states.
 */

// =============================================================================
// COLOR TOKENS
// =============================================================================

export const colors = {
  // Backgrounds
  bg: {
    primary: '#0F1114',      // Main page background
    secondary: '#15181C',    // Elevated surfaces (cards)
    tertiary: '#1C1F24',     // Nested elements, inputs
    hover: '#22262C',        // Hover states on surfaces
  },

  // Borders
  border: {
    primary: '#2A2F36',      // Default borders
    secondary: '#363C44',    // Hover/focus borders
    muted: '#1E2228',        // Subtle dividers
  },

  // Text
  text: {
    primary: '#F0F2F4',      // Primary text (headings, important)
    secondary: '#B4BAC4',    // Body text
    muted: '#6B7280',        // Labels, captions, placeholders
    disabled: '#4B5563',     // Disabled states
  },

  // Accent (Primary action color)
  accent: {
    primary: '#3B82F6',      // Primary buttons, active states
    hover: '#2563EB',        // Hover on primary
    muted: 'rgba(59, 130, 246, 0.15)', // Backgrounds with accent
    border: 'rgba(59, 130, 246, 0.4)', // Borders with accent
    text: '#60A5FA',         // Accent text color
  },

  // Status colors
  status: {
    success: '#10B981',      // Completed, approved, green states
    successMuted: 'rgba(16, 185, 129, 0.15)',
    successBorder: 'rgba(16, 185, 129, 0.4)',

    warning: '#F59E0B',      // In progress, pending
    warningMuted: 'rgba(245, 158, 11, 0.15)',
    warningBorder: 'rgba(245, 158, 11, 0.4)',

    error: '#EF4444',        // Blocked, failed, errors
    errorMuted: 'rgba(239, 68, 68, 0.15)',
    errorBorder: 'rgba(239, 68, 68, 0.4)',

    info: '#6366F1',         // Information, neutral highlights
    infoMuted: 'rgba(99, 102, 241, 0.15)',
    infoBorder: 'rgba(99, 102, 241, 0.4)',
  },

  // Neutral chip colors
  neutral: {
    bg: '#1C1F24',
    border: '#2A2F36',
    text: '#9CA3AF',
  },
};

// =============================================================================
// SPACING TOKENS (8px system)
// =============================================================================

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Font sizes
  size: {
    xs: '0.75rem',     // 12px - captions
    sm: '0.875rem',    // 14px - body small
    base: '1rem',      // 16px - body
    lg: '1.125rem',    // 18px - section headers
    xl: '1.25rem',     // 20px - card headers
    '2xl': '1.5rem',   // 24px - page titles
    '3xl': '1.875rem', // 30px - main headers
  },

  // Font weights
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line heights
  leading: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

// =============================================================================
// SHADOWS (minimal)
// =============================================================================

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 2px 4px rgba(0, 0, 0, 0.3)',
  lg: '0 4px 8px rgba(0, 0, 0, 0.3)',
};

// =============================================================================
// COMPONENT STYLE PRESETS
// =============================================================================

// Card styles
export const card = {
  base: `bg-[${colors.bg.secondary}] border border-[${colors.border.primary}] rounded-xl`,
  padding: {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  },
};

// Button styles
export const button = {
  primary: `bg-[${colors.accent.primary}] hover:bg-[${colors.accent.hover}] text-white font-medium rounded-lg transition-colors`,
  secondary: `bg-[${colors.bg.tertiary}] hover:bg-[${colors.bg.hover}] text-[${colors.text.secondary}] border border-[${colors.border.primary}] rounded-lg transition-colors`,
  ghost: `hover:bg-[${colors.bg.hover}] text-[${colors.text.muted}] rounded-lg transition-colors`,
};

// =============================================================================
// TAILWIND CLASS GENERATORS
// =============================================================================

// Generate consistent status chip classes
export const getStatusClasses = (status) => {
  switch (status) {
    case 'completed':
    case 'approved':
    case 'success':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';
    case 'in_progress':
    case 'active':
    case 'pending':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/40';
    case 'blocked':
    case 'failed':
    case 'error':
      return 'bg-red-500/15 text-red-400 border-red-500/40';
    case 'on_hold':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/40';
    default:
      return 'bg-slate-500/15 text-slate-400 border-slate-500/40';
  }
};

// Generate AI score color classes
export const getAIScoreClasses = (score) => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

// Generate phase progress bar segment class
export const getPhaseSegmentClass = (segmentIndex, currentPhaseIndex, status) => {
  if (status === 'blocked') {
    return segmentIndex === currentPhaseIndex ? 'bg-red-500' :
           segmentIndex < currentPhaseIndex ? 'bg-emerald-500' : 'bg-slate-700';
  }
  if (segmentIndex < currentPhaseIndex) return 'bg-emerald-500';
  if (segmentIndex === currentPhaseIndex) return 'bg-blue-500';
  return 'bg-slate-700';
};

// =============================================================================
// THEME CSS VARIABLES (for global CSS)
// =============================================================================

export const cssVariables = `
  :root {
    --bg-primary: ${colors.bg.primary};
    --bg-secondary: ${colors.bg.secondary};
    --bg-tertiary: ${colors.bg.tertiary};
    --bg-hover: ${colors.bg.hover};

    --border-primary: ${colors.border.primary};
    --border-secondary: ${colors.border.secondary};
    --border-muted: ${colors.border.muted};

    --text-primary: ${colors.text.primary};
    --text-secondary: ${colors.text.secondary};
    --text-muted: ${colors.text.muted};

    --accent-primary: ${colors.accent.primary};
    --accent-hover: ${colors.accent.hover};
    --accent-muted: ${colors.accent.muted};

    --status-success: ${colors.status.success};
    --status-warning: ${colors.status.warning};
    --status-error: ${colors.status.error};

    --radius-sm: ${radius.sm};
    --radius-md: ${radius.md};
    --radius-lg: ${radius.lg};
    --radius-xl: ${radius.xl};
  }
`;

export default {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  getStatusClasses,
  getAIScoreClasses,
  getPhaseSegmentClass,
};
