import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error while loading this content. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = ''
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-14 px-4 bg-rose-50/50 border border-rose-100 rounded-3xl animate-[scaleIn_0.2s_ease-out] ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100/70 border border-rose-200 flex items-center justify-center text-rose-600 mb-3 shadow-3xs">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>

      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
        {title}
      </h3>

      {message && (
        <p className="mt-1 text-xs text-slate-600 max-w-sm leading-relaxed">
          {message}
        </p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-xl shadow-3xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
