import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function PageLoader({ text = 'Loading data...', className = '' }) {
  return (
    <div
      className={`min-h-[50vh] flex items-center justify-center py-16 px-4 ${className}`}
      role="region"
      aria-label="Loading page content"
    >
      <LoadingSpinner size="medium" text={text} />
    </div>
  );
}
