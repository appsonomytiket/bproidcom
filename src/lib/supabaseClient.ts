import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Supabase Anon Key environment variables. Please check your .env file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set correctly and that you have restarted your development server if you made recent changes.');
}

// Test if supabaseUrl is a valid URL before creating the client
try {
  new URL(supabaseUrl);
} catch (e) {
  throw new Error(`Invalid Supabase URL: "${supabaseUrl}". Please check your NEXT_PUBLIC_SUPABASE_URL in the .env file. It should be a complete URL (e.g., https://your-project-ref.supabase.co).`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
