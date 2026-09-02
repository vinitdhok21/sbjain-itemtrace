import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, RefreshCw, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your college email address.');
      return;
    }

    setLoading(true);

    try {
      // Dispatch password recovery OTP to the user's email via Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail);

      if (resetError) throw resetError;

      // Navigate to OTP verification screen with the entered email
      navigate('/verify-otp', { state: { email: trimmedEmail } });
    } catch (err) {
      console.error('Password reset OTP dispatch error:', err.message);
      if (err.message && err.message.toLowerCase().includes('rate limit')) {
        setError('Too many requests. Please wait a minute before requesting another code.');
      } else if (err.message && err.message.toLowerCase().includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(err.message || 'Failed to dispatch verification code.');
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
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors duration-250">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white px-6 py-10 sm:px-10 border border-slate-100 rounded-2xl shadow-xl space-y-6">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <Logo size="md" showText={false} />
            <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">Forgot Password</h2>
            <p className="text-xs text-slate-400 font-medium">
              Enter your college email to receive a 6-digit verification code
            </p>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-4">
            
            {/* Error Message */}
            {error && (
              <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl leading-relaxed">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600" htmlFor="email">
                College Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  disabled={loading}
                  placeholder="student@sbjt.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 font-medium text-slate-800"
                />
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
                  Sending Code...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Send OTP
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

