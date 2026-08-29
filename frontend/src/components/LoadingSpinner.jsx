import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  size = 'medium',
  text = 'Loading...',
  fullScreen = false,
  className = ''
}) {
  const sizeClasses = {
    small: 'w-4 h-4 text-primary-500',
    medium: 'w-8 h-8 text-primary-500',
    large: 'w-12 h-12 text-primary-500'
  };

  const spinner = (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <Loader2
        className={`${sizeClasses[size] || sizeClasses.medium} animate-spin`}
        aria-hidden="true"
      />
      {text && (
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          {text}
        </span>
      )}
      <span className="sr-only">{text || 'Loading content, please wait...'}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs">
        {spinner}
      </div>
    );
  }

  return spinner;
}
