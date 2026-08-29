import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';

export default function AdminRoute({ children }) {
  const { currentUser, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="mt-3 text-xs font-semibold text-slate-500 tracking-wider uppercase">
          Verifying Administrative Credentials...
        </p>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not an authorized admin
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6 animate-[scaleIn_0.2s_ease-out]">
        <div className="w-16 h-16 mx-auto bg-rose-50 border border-rose-100 rounded-3xl flex items-center justify-center text-rose-600 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-display text-slate-800 tracking-tight">
            Administrator Access Required
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            You do not have administrative privileges to access the SBJain ItemTrace monitoring console.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Student Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
