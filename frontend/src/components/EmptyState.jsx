import React from 'react';
import { Link } from 'react-router-dom';
import { Box } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Box,
  title = 'No items found',
  description = 'There is nothing to display here yet.',
  actionLabel,
  onAction,
  actionLink,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-3xl animate-[fadeIn_0.2s_ease-out] ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-3xs">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>

      <h3 className="text-base font-bold font-display text-slate-800 tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {actionLink && actionLabel && (
        <Link
          to={actionLink}
          className="mt-5 inline-flex items-center justify-center px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {actionLabel}
        </Link>
      )}

      {onAction && actionLabel && !actionLink && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
