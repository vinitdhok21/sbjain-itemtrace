/**
 * Error Handling Utility for SBJain ItemTrace
 * Maps raw backend, Supabase, or network errors into clean, friendly user-facing messages.
 */

export function getFriendlyErrorMessage(error, fallback = 'An unexpected error occurred. Please try again.') {
  if (!error) return fallback;

  const msg = typeof error === 'string' ? error : error.message || '';

  // 1. Network & connectivity issues
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('net::ERR')) {
    return 'Unable to connect to the server. Please check your network connection and try again.';
  }

  // 2. Row Level Security & Permission errors
  if (msg.includes('violates row-level security') || msg.includes('JWT') || msg.includes('permission denied')) {
    return 'You do not have permission to perform this action.';
  }

  // 3. Duplicate key / Unique constraint violations
  if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('already exists')) {
    return 'A record with these details already exists.';
  }

  // 4. Authentication issues
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
    return 'Invalid email or password. Please verify your credentials.';
  }

  if (msg.includes('User already registered')) {
    return 'An account with this email is already registered. Please login instead.';
  }

  if (msg.includes('rate limit') || msg.includes('Too many requests')) {
    return 'Too many requests. Please wait a moment before trying again.';
  }

  // Fallback to error message if it is clean and not exposing internal SQL or code stack
  if (msg && !msg.includes('PGRST') && !msg.includes('at ') && !msg.includes('sql') && msg.length < 150) {
    return msg;
  }

  return fallback;
}
