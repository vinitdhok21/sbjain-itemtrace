import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ButtonLoader({ text = 'Please wait...', className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
      {text && <span>{text}</span>}
      <span className="sr-only">{text || 'Processing request, please wait...'}</span>
    </span>
  );
}
