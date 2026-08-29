/**
 * Development Environment Diagnostics for SBJain ItemTrace
 */

export function runEnvironmentDiagnostics() {
  if (import.meta.env.DEV) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn(
        '⚠️ [ItemTrace Diagnostics] Supabase client configuration is missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in frontend/.env.'
      );
    } else {
      console.log('✅ [ItemTrace Diagnostics] Frontend Supabase client environment validated.');
    }
  }
}

export default runEnvironmentDiagnostics;
