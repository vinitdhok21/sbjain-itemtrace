import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

// Official multi-colored Google Icon
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
  </svg>
);

export default function LoginPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if user is already logged in
  const from = location.state?.from?.pathname || '/dashboard';
  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        throw authError;
      }
    } catch (err) {
      console.error('Google OAuth error:', err.message);
      setError(
        err.message ||
          'Failed to connect to Google Sign-In. Please verify network connectivity and try again.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="w-full max-w-md space-y-6">
        
        {/* Back to Home Link */}
        <div className="flex justify-start">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors duration-250"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white px-6 py-10 sm:px-10 border border-slate-100 rounded-3xl shadow-xl space-y-6 text-center">
          
          {/* Header */}
          <div className="flex flex-col items-center space-y-3">
            <Logo size="md" showText={false} />
            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
                Welcome to ItemTrace
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                Sign in with your institutional Google account to report, track, and recover items.
              </p>
            </div>
          </div>

          {/* Security / Access Notice */}
          <div className="p-3.5 bg-primary-50/60 border border-primary-100/80 rounded-2xl flex items-start gap-3 text-left">
            <ShieldCheck className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-primary-900">
                Authorized College Sign-In
              </p>
              <p className="text-[10px] text-primary-700 leading-relaxed font-medium">
                Single sign-on via Google ensures verified college access for all students and staff.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-left leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Main Action: Continue with Google Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm rounded-2xl shadow-xs hover:shadow-md active:scale-[0.99] transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 text-primary-500 animate-spin mr-2" />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              S. B. Jain Institute of Technology, Management & Research
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
