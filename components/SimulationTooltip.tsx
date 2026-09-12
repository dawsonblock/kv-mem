'use client';

import React from 'react';

export interface SimulationTooltipProps {
  children: React.ReactNode;
  title: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'blue' | 'purple' | 'slate';
  description: string;
  footer?: string;
  align?: 'left' | 'center' | 'right';
  side?: 'top' | 'bottom';
  icon?: React.ReactNode;
}

export const SimulationTooltip: React.FC<SimulationTooltipProps> = ({
  children,
  title,
  badge,
  badgeColor = 'blue',
  description,
  footer,
  align = 'center',
  side = 'top',
  icon,
}) => {
  // Alignment classes for positioning the floating tooltip box
  const alignClasses = {
    left: 'left-0 origin-bottom-left',
    center: 'left-1/2 -translate-x-1/2 origin-bottom',
    right: 'right-0 origin-bottom-right',
  }[align];

  // Side classes
  const sideClasses = side === 'top'
    ? 'bottom-full mb-2.5'
    : 'top-full mt-2.5';

  // Badge background/border styles
  const badgeStyles = {
    emerald: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80',
    amber: 'bg-amber-950/90 text-amber-300 border-amber-700/80',
    blue: 'bg-blue-950/90 text-blue-300 border-blue-700/80',
    purple: 'bg-purple-950/90 text-purple-300 border-purple-700/80',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  }[badgeColor];

  // Arrow alignment
  const arrowAlign = {
    left: 'left-6',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-6',
  }[align];

  return (
    <div className="relative group inline-flex items-center">
      {children}

      {/* Floating Tooltip Container */}
      <div
        role="tooltip"
        className={`absolute ${sideClasses} ${alignClasses} z-50 w-64 sm:w-72 p-3 rounded-xl bg-slate-950/95 border border-slate-700/90 shadow-2xl backdrop-blur-md text-left pointer-events-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 transition-all duration-200 ease-out`}
      >
        {/* Header: Title + Badge */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
            <span className="text-xs font-bold text-white tracking-tight truncate">
              {title}
            </span>
          </div>

          {badge && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border shrink-0 ${badgeStyles}`}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Function Description */}
        <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
          {description}
        </p>

        {/* Footer / Contextual detail */}
        {footer && (
          <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>{footer}</span>
          </div>
        )}

        {/* Pointer Arrow Beak */}
        {side === 'top' ? (
          <div
            className={`absolute top-full ${arrowAlign} w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700/90`}
          />
        ) : (
          <div
            className={`absolute bottom-full ${arrowAlign} w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-slate-700/90`}
          />
        )}
      </div>
    </div>
  );
};
