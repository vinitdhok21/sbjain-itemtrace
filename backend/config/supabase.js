import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;

// Retrieve key, resolving placeholders to use the public anon key for general requests
let supabaseKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (serviceKey && serviceKey !== 'placeholder-service-key' && serviceKey.trim() !== '') {
  supabaseKey = serviceKey;
}

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: Supabase credentials are not fully configured in environment variables.');
}

// Create Supabase client for backend operations
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder-key'
);

console.log('Supabase client initialized on backend.');
