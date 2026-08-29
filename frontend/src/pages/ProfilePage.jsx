import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Shield, Save, CheckCircle2, UserCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { currentUser, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Sync state values with active profile context on mount or change
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!fullName || !username) {
      setError('Please fill in all fields.');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setLoading(true);

    try {
      // Direct update on the profiles table matching the user's UUID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (updateError) {
        if (updateError.message.includes('unique_username') || updateError.message.includes('duplicate key')) {
          throw new Error('This username is already taken. Please choose another one.');
        }
        throw updateError;
      }

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating user profile:', err.message);
      setError(err.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-[fadeIn_0.3s_ease-out]">
      
      {/* Back Link */}
      <div className="flex justify-start">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors duration-250">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight">Account Settings</h1>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3">
        
        {/* Avatar Sidebar / Header */}
        <div className="bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-100 space-y-4">
          <div className="relative w-24 h-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden select-none">
            {profile?.profile_image ? (
              <img src={profile.profile_image} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 font-display text-lg leading-tight">
              {profile?.full_name || 'Student'}
            </h3>
            <span className="text-xs font-medium text-slate-400">@{profile?.username || 'username'}</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 border border-primary-100 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" />
            {profile?.role || 'Student'}
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6 sm:p-8 md:col-span-2 space-y-6">
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            
            {/* Success Notification */}
            {success && (
              <div className="flex items-center gap-2 p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl animate-[scaleIn_0.2s_ease-out]">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl">
                {error}
              </div>
            )}

            {/* Email Field (Disabled) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">College Email (Linked to Account)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  disabled
                  value={profile?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">To change your email address, contact campus portal administration.</p>
            </div>

            {/* Full Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600" htmlFor="fullName">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="h-4 w-4" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600" htmlFor="username">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="text-sm font-bold select-none">@</span>
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 rounded-xl outline-none transition-all duration-200 font-medium text-slate-800"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Lowercase letters, numbers, hyphens, and underscores only.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50 active:scale-[0.98] mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>

          </form>

        </div>
      </div>
      
    </div>
  );
}
