import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, RefreshCw, AlertCircle, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // 1. Check URL parameters for explicit errors (e.g. expired link, invalid OTP)
    const parseUrlErrors = () => {
      const hash = window.location.hash ? window.location.hash.substring(1) : '';
      const hashParams = new URLSearchParams(hash);
      const queryParams = new URLSearchParams(window.location.search);

      const errorDescription =
        hashParams.get('error_description') ||
        queryParams.get('error_description') ||
        hashParams.get('error') ||
        queryParams.get('error');

      const errorCode = hashParams.get('error_code') || queryParams.get('error_code');

      if (errorDescription || errorCode) {
        let msg = 'The password reset session is invalid or has expired. Please request a new verification code.';
        if (errorDescription) {
          msg = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
        }
        setLinkError(msg);
        setCheckingSession(false);
        return true;
      }
      return false;
    };

    const hasError = parseUrlErrors();
    if (hasError) return;

    // 2. Check for active recovery session or listen for auth events
    const verifyRecoverySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasValidSession(true);
        } else if (!hasError) {
          // If no session exists and user didn't arrive with verification state
          setHasValidSession(false);
        }
      } catch (err) {
        console.error('Error verifying session:', err.message);
      } finally {
        setCheckingSession(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasValidSession(true);
        setLinkError('');
        setCheckingSession(false);
      }
    });

    verifyRecoverySession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validations
    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Successfully updated
      setSuccess(true);

      // Sign out recovery session cleanly so user logs in afresh with new credentials
      try {
        await supabase.auth.signOut();
      } catch {
        // Non-blocking
      }
    } catch (err) {
      console.error('Password update error:', err.message);
      if (err.message && err.message.toLowerCase().includes('same_password')) {
        setError('New password must be different from your old password.');
      } else if (err.message && (err.message.toLowerCase().includes('auth session missing') || err.message.toLowerCase().includes('session'))) {
        setError('Your verification session has expired. Please verify your OTP code again.');
      } else {
        setError(err.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="w-full max-w-md space-y-8">
        
        {/* Back Link */}
        <div className="flex justify-start">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors duration-250"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white px-6 py-10 sm:px-10 border border-slate-100 rounded-2xl shadow-xl space-y-6">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <Logo size="md" showText={false} />
            <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Create New Password
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Enter and confirm your new secure password
            </p>
          </div>

          {/* Expired / Invalid Link or Missing Session State */}
          {linkError || (!checkingSession && !hasValidSession) ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-[scaleIn_0.3s_ease-out]">
              <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
                <AlertCircle className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Verification Required</h3>
              <p className="text-xs text-slate-500 leading-relaxed px-2">
                {linkError || 'No active verification session found. Please enter your email and verify your 6-digit OTP first.'}
              </p>
              <div className="pt-2 w-full space-y-2">
                <Link
                  to="/forgot-password"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  Send Verification OTP
                </Link>
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : success ? (
            /* Success State */
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-[scaleIn_0.3s_ease-out]">
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Password Updated Successfully!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your password has been changed. You can now log in to SBJain ItemTrace using your new credentials.
              </p>
              <div className="pt-4 w-full">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-all cursor-pointer"
                >
                  Proceed to Login
                </button>
              </div>
            </div>
          ) : (
            /* Password Reset Form */
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              
              {/* Error Message */}
              {error && (
                <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl leading-relaxed">
                  {error}
                </div>
              )}

              {/* Notice if session is still verifying */}
              {checkingSession && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-500" />
                  Verifying reset link credentials...
                </div>
              )}

              {/* New Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    disabled={loading}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50 active:scale-[0.98] mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Update Password
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
