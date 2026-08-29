import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-[fadeIn_0.3s_ease-out]">
        <div className="w-20 h-20 mx-auto bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-xs">
          <Compass className="w-10 h-10 animate-[spin_10s_linear_infinite]" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl sm:text-5xl font-black font-display text-slate-900 tracking-tight block">
            404
          </span>
          <h1 className="text-xl font-bold font-display text-slate-800 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            The page you're looking for doesn't exist or may have been moved to another section.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
