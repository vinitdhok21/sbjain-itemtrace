import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, ArrowLeft, RefreshCw, CheckCircle2, ShieldAlert, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('A 6-digit verification code was sent to your email.');
  const [timer, setTimer] = useState(60);

  const inputRefs = useRef([]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Focus the first empty input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index, value) => {
    setError('');
    // Allow only digits
    const sanitized = value.replace(/\D/g, '');

    if (!sanitized) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const digit = sanitized.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setError('');
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      if (i < pastedData.length) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);

    // Focus last filled or next empty box
    const focusIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    const targetEmail = email.trim();
    if (!targetEmail) {
      setError('Please provide a valid email address.');
      return;
    }

    const otpCode = otp.join('').trim();
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      // Securely verify recovery OTP with Supabase Auth
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: otpCode,
        type: 'recovery',
      });

      if (verifyError) throw verifyError;

      // Upon successful verification, Supabase creates a recovery session
      navigate('/reset-password', {
        state: {
          email: targetEmail,
          verified: true,
        },
      });
    } catch (err) {
      console.error('OTP verification error:', err.message);
      if (err.message && err.message.toLowerCase().includes('expired')) {
        setError('Verification code has expired. Please click "Resend Code" below.');
      } else if (err.message && err.message.toLowerCase().includes('invalid')) {
        setError('Invalid verification code. Please check your email and try again.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0 || resending) return;
    setError('');
    setSuccessNotice('');

    const targetEmail = email.trim();
    if (!targetEmail) {
      setError('Please provide a valid email address.');
      return;
    }

    setResending(true);

    try {
      const { error: resendError } = await supabase.auth.resetPasswordForEmail(targetEmail);

      if (resendError) throw resendError;

      setSuccessNotice('A fresh verification code has been sent to your email.');
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      console.error('Resend OTP error:', err.message);
      if (err.message && err.message.toLowerCase().includes('rate limit')) {
        setError('Too many requests. Please wait a minute before requesting another code.');
      } else {
        setError(err.message || 'Failed to resend verification code.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50/50">
      <div className="w-full max-w-md space-y-8">
        
        {/* Back Link */}
        <div className="flex justify-start">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors duration-250"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Change Email
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-white px-6 py-10 sm:px-10 border border-slate-100 rounded-2xl shadow-xl space-y-6">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <Logo size="md" showText={false} />
            <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
              Enter Verification Code
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-slate-800">{email || 'your email'}</span>
            </p>
          </div>

          {/* Success / Status Notice */}
          {successNotice && (
            <div className="p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 leading-relaxed animate-[fadeIn_0.2s_ease-out]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 leading-relaxed animate-[shake_0.3s_ease-in-out]">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            
            {/* If email wasn't provided in route state, show email field */}
            {!emailFromState && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600" htmlFor="verify-email">
                  College Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="verify-email"
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
            )}

            {/* 6-Digit OTP Boxes */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 block text-center">
                6-Digit Security Code
              </label>
              
              <div className="flex justify-between items-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={loading}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 sm:w-13 sm:h-14 text-center text-xl font-bold font-mono bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-2 border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-xl outline-none transition-all duration-200 text-slate-800 shadow-xs"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Code...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Verify & Continue
                </>
              )}
            </button>
          </form>

          {/* Resend Section */}
          <div className="pt-2 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Didn't receive the code?
            </p>
            
            {timer > 0 ? (
              <p className="text-xs font-semibold text-slate-400">
                Resend available in <span className="text-primary-600 font-mono font-bold">{timer}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                {resending ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Sending new code...
                  </>
                ) : (
                  'Resend Code'
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
