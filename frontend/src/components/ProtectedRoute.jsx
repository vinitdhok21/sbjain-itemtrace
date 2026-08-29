import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Spinner rings */}
          <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wider uppercase animate-pulse">
          Verifying Session...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    // Redirect unauthenticated users to login, keeping track of intended location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
