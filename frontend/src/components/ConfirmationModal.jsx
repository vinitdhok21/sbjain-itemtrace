import React, { useEffect } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  theme = 'primary', // 'primary', 'rose', 'emerald', 'warning'
  loading = false
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const colorThemes = {
    primary: {
      bg: 'bg-primary-50 text-primary-600',
      btn: 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-500'
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      btn: 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500'
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      btn: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500'
    },
    warning: {
      bg: 'bg-amber-50 text-amber-600',
      btn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500'
    }
  };

  const activeTheme = colorThemes[theme] || colorThemes.primary;

  const handleBackdropClick = () => {
    if (!loading) {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-[fadeIn_0.2s_ease-out]" 
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-slate-100/50 z-10 space-y-5 transform transition-all scale-100 animate-[scaleIn_0.2s_ease-out]">
        
        {/* Close Button */}
        <button 
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Modal Header Icon & Content */}
        <div className="flex gap-4 items-start">
          <div className={`p-3 rounded-2xl shrink-0 ${activeTheme.bg}`}>
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5 min-w-0 pr-6">
            <h3 id="modal-title" className="text-base font-bold text-slate-800 leading-snug">
              {title}
            </h3>
            <p id="modal-description" className="text-xs font-semibold text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Modal Buttons Toolbar */}
        <div className="flex gap-3 pt-3 border-t border-slate-50">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors text-center cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-98 text-center cursor-pointer disabled:opacity-50 ${activeTheme.btn}`}
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
