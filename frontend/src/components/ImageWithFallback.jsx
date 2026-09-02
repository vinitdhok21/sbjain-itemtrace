import React, { useState } from 'react';
import { Package, ImageOff } from 'lucide-react';
import { getPrimaryImageUrl } from '../utils/imageUtils';

export default function ImageWithFallback({
  src,
  alt = 'Item Image',
  className = '',
  fallbackText = 'No image provided',
  fallbackIcon: FallbackIcon = Package,
  loading = 'lazy'
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const resolvedSrc = getPrimaryImageUrl(src);
  const hasValidSrc = Boolean(resolvedSrc);

  if (!hasValidSrc || error) {
    return (
      <div
        className={`flex flex-col items-center justify-center text-slate-300 bg-slate-50 border border-slate-100 ${className}`}
        role="img"
        aria-label={alt}
      >
        <FallbackIcon className="w-8 h-8 text-slate-300 mb-1" aria-hidden="true" />
        {fallbackText && (
          <span className="text-[10px] font-semibold text-slate-400 select-none">
            {fallbackText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-50 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
          <Package className="w-6 h-6 text-slate-300" aria-hidden="true" />
        </div>
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
