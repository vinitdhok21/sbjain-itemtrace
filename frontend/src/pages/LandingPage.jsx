import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlusCircle, ArrowRight, MessageSquare, ShieldCheck, HelpCircle, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState(null);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const testSupabase = async () => {
      try {
        // Test query against profiles table
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        
        if (error) {
          console.error('[Supabase Developer Test Failed]');
          console.error('Error Code:', error.code);
          console.error('Error Message:', error.message);
          console.error('Error Details:', error.details);
          console.error('Error Hint:', error.hint);
          
          if (error.code === '42P01') {
            console.error('Troubleshooting: The "profiles" table does not exist in your database. Please run the SQL schema script in your Supabase SQL Editor.');
          } else if (error.message && error.message.includes('apiKey')) {
            console.error('Troubleshooting: Your VITE_SUPABASE_ANON_KEY appears to be invalid or empty.');
          } else {
            console.error('Troubleshooting: Please check your Supabase project settings and make sure frontend/.env contains the correct keys.');
          }
          setSupabaseConnected(false);
        } else {
          // Success (table exists and connection is valid)
          setSupabaseConnected(true);
        }
      } catch (err) {
        console.error('[Supabase Connection Exception]:', err.message);
        console.error('Troubleshooting: Network request failed. Make sure VITE_SUPABASE_URL is correct and you have internet access.');
        setSupabaseConnected(false);
      }
    };

    testSupabase();
  }, []);

  const triggerToast = (featureName) => {
    setToastMessage(`"${featureName}" feature will be available in Stage 2!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const steps = [
    {
      id: 1,
      title: 'Report Lost',
      desc: 'Lost an item? Fill out a quick form describing it, where you last saw it, and optionally upload a photo.',
      color: 'bg-rose-50 border-rose-200 text-rose-600',
      icon: <PlusCircle className="w-6 h-6" />,
      tag: 'Lost'
    },
    {
      id: 2,
      title: 'Smart Match',
      desc: 'Our system analyzes reported found items and shows potential matches to help you track it down faster.',
      color: 'bg-amber-50 border-amber-200 text-amber-600',
      icon: <Search className="w-6 h-6" />,
      tag: 'Match'
    },
    {
      id: 3,
      title: 'Private Chat',
      desc: 'Chat securely with the finder. Clarify item details, verify ownership, and agree on a handover spot on campus.',
      color: 'bg-teal-50 border-teal-200 text-teal-600',
      icon: <MessageSquare className="w-6 h-6" />,
      tag: 'Chat'
    },
    {
      id: 4,
      title: 'Safe Return',
      desc: 'Meet safely, confirm ownership, and mark the item as returned. The trace is complete!',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      icon: <ShieldCheck className="w-6 h-6" />,
      tag: 'Return'
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex flex-col justify-start">
      
      {/* Toast Notification for coming soon features */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-xl animate-[slideIn_0.3s_ease-out]">
          <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/40 via-white to-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Temporary Supabase connection display */}
          {supabaseConnected && (
            <div className="inline-flex flex-col items-center gap-1 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center shadow-xs mx-auto animate-[scaleIn_0.3s_ease-out]">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 leading-none">Supabase Connection</div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Connected
              </div>
            </div>
          )}

          {/* Tagline Badge */}
          <div className="block mt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-600 animate-bounce">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              SB Jain lost & found network
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-black text-slate-900 tracking-tight leading-tight">
            Lost something on campus?<br className="hidden sm:inline" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-600">
              Let's trace it.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Report lost items, submit found items, and connect with the right person securely — all in one place for SB Jain College.
          </p>

          {/* Action Callouts */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => triggerToast('Report Lost Item')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
            >
              Report Lost Item
            </button>
            
            <button
              onClick={() => triggerToast('Report Found Item')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
            >
              Report Found Item
            </button>

            <button
              onClick={() => triggerToast('Browse Items')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Items
            </button>
          </div>
        </div>
      </section>

      {/* Visual Workflow Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
            How does it work?
          </h2>
          <p className="text-slate-500 text-sm sm:text-base max-w-lg mx-auto">
            From the moment you lose an item to returning it back, trace steps seamlessly.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative mt-16">
          
          {/* Arrow guides for desktop */}
          <div className="hidden md:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-slate-100 z-0">
            <div className="w-full h-full bg-gradient-to-r from-primary-400 via-teal-400 to-emerald-400 opacity-60 rounded-full" />
          </div>

          {steps.map((step, idx) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center text-center group">
              {/* Step Icon Bubble */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm ${step.color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                {step.icon}
              </div>
              
              {/* Step number badge */}
              <span className="absolute -top-3 -right-3 sm:-right-1 bg-white border border-slate-200 text-slate-500 font-bold text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-xs">
                {step.id}
              </span>

              {/* Title & Badge */}
              <div className="mt-6 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{step.tag}</span>
                <h3 className="text-lg font-bold text-slate-800 font-display">{step.title}</h3>
              </div>

              {/* Description */}
              <p className="mt-2 text-sm text-slate-500 px-4 leading-relaxed">
                {step.desc}
              </p>

              {/* Mobile Separator (downward arrow) */}
              {idx < steps.length - 1 && (
                <div className="md:hidden my-6 text-slate-300">
                  <ArrowRight className="w-6 h-6 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* College Statistics Mock section to enhance visual credibility */}
      <section className="bg-slate-50 border-y border-slate-100 px-4 py-12 sm:px-6 lg:px-8 text-center mt-auto">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-primary-500 font-display">100%</div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">College Verified</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-rose-500 font-display">Active</div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Campus Tracking</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-teal-500 font-display">Fast</div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Matching Engine</div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold text-emerald-500 font-display">Secure</div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Student Chat</div>
          </div>
        </div>
      </section>
      
    </div>
  );
}
