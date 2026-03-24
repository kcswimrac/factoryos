import React from 'react';
import { Info } from 'lucide-react';

/**
 * PageSummary - A mandatory summary block displayed at the top of every primary tab/page.
 *
 * These summaries exist to clearly state what the section is for, how it is meant to be used,
 * and what engineering outcome it supports. They are not marketing copy or onboarding tips.
 *
 * Props:
 * - icon: Lucide icon component to display
 * - iconColor: Tailwind color class for the icon (default: 'text-blue-400')
 * - borderColor: Tailwind border color class (default: 'border-blue-500/30')
 * - bgColor: Tailwind background color class (default: 'bg-blue-500/5')
 * - children: The summary content (JSX)
 */
function PageSummary({
  icon: Icon = Info,
  iconColor = 'text-blue-400',
  borderColor = 'border-blue-500/30',
  bgColor = 'bg-blue-500/5',
  children
}) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="text-sm text-[#B4BAC4] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export default PageSummary;
