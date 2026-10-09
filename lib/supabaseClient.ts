import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://rizkpklipidqhuotopdo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpemtwa2xpcGlkcWh1b3RvcGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MTYzNzYsImV4cCI6MjEwNjk5MjM3Nn0.y0FI5rpX83OUVkAXhRMLFWRCwJkEDl_IBWrAeJXUdVQ';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project')
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

