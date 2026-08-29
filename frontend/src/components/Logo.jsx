import React from 'react';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const dimensions = {
    sm: { svg: 'w-6 h-6', text: 'text-lg', subtext: 'text-[9px]' },
    md: { svg: 'w-10 h-10', text: 'text-2xl', subtext: 'text-xs' },
    lg: { svg: 'w-16 h-16', text: 'text-4xl', subtext: 'text-base' }
  };

  const dim = dimensions[size] || dimensions.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Wrapper */}
      <div className={`relative ${dim.svg} flex items-center justify-center`}>
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-lg animate-pulse" />
        
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10 drop-shadow-md hover:scale-105 transition-transform duration-300"
        >
          {/* Connection Trace Line */}
          <path
            d="M8 48 C 16 52, 28 44, 32 32 C 36 20, 48 12, 56 22"
            stroke="url(#trace-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="4 4"
            className="animate-[dash_4s_linear_infinite]"
          />
          
          {/* Location Pin Outer Shape */}
          <path
            d="M32 6 C 20.95 6, 12 14.95, 12 26 C 12 39.5, 32 58, 32 58 C 32 58, 52 39.5, 52 26 C 52 14.95, 43.05 6, 32 6 Z"
            fill="url(#pin-grad)"
            className="transition-all duration-300"
          />

          {/* Inner Search Glass Ring (Magnifying Glass center) */}
          <circle
            cx="32"
            cy="24"
            r="10"
            fill="#ffffff"
            stroke="#4f46e5"
            strokeWidth="4"
          />

          {/* Magnifying Glass Handle (extending out and down) */}
          <line
            x1="39"
            y1="31"
            x2="48"
            y2="40"
            stroke="#4f46e5"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Lost/Found Item (Red/Orange dot being focused in magnifying glass center) */}
          <circle
            cx="32"
            cy="24"
            r="4.5"
            fill="url(#item-grad)"
          />

          {/* Gradients definitions */}
          <defs>
            <linearGradient id="pin-grad" x1="12" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="item-grad" x1="28" y1="20" x2="36" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <linearGradient id="trace-grad" x1="8" y1="48" x2="56" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline">
            <span className="font-display font-light text-slate-500 tracking-tight">SBJain</span>
            <span className="font-display font-extrabold text-primary-500 tracking-tight ml-0.5">ItemTrace</span>
          </div>
          <span className={`font-sans font-medium text-slate-400 mt-1 select-none hidden sm:inline-block ${dim.subtext}`}>
            College Lost & Found
          </span>
        </div>
      )}
    </div>
  );
}
