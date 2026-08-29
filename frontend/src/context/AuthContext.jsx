import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

const ADMIN_EMAIL = 'dhokvinit@gmail.com';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user profile details from public.profiles with safe OAuth fallback
  const fetchProfile = async (userId, userObj = null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Fallback profile creation for OAuth (Google) or un-synced accounts
        if (userObj) {
          const newProfile = {
            id: userId,
            full_name: userObj.user_metadata?.full_name || userObj.user_metadata?.name || userObj.email?.split('@')[0] || 'Student User',
            username: userObj.user_metadata?.username || userObj.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
            email: userObj.email,
            profile_image: userObj.user_metadata?.avatar_url || userObj.user_metadata?.picture || null,
            role: userObj.email === ADMIN_EMAIL ? 'admin' : 'student'
          };
          const { data: insertedData, error: upsertError } = await supabase
            .from('profiles')
            .upsert(newProfile, { onConflict: 'id' })
            .select()
            .single();

          if (!upsertError && insertedData) {
            setProfile(insertedData);
            return;
          }
        }
        setProfile(null);
      } else if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Exception fetching profile:', err.message);
      setProfile(null);
    }
  };

  useEffect(() => {
    // 1. Get initial session details on mount
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setCurrentUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id, session.user);
        }
      } catch (err) {
        console.error('Error initializing authentication state:', err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen to active auth events (signIn, signOut, tokenRefresh, OAuth callback, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      const user = currentSession?.user ?? null;
      setCurrentUser(user);

      if (user) {
        await fetchProfile(user.id, user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Email and Password Sign Up
  const signUp = async (email, password, fullName, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  // Email and Password Login
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  // Google OAuth Sign In
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) throw error;
    return data;
  };

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear states locally
    setCurrentUser(null);
    setProfile(null);
    setSession(null);
  };

  // Derived Admin status
  const isAdmin = Boolean(
    currentUser && (currentUser.email === ADMIN_EMAIL || profile?.role === 'admin')
  );

  const value = {
    currentUser,
    profile,
    session,
    loading,
    isAdmin,
    adminEmail: ADMIN_EMAIL,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile: () => currentUser && fetchProfile(currentUser.id, currentUser)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
