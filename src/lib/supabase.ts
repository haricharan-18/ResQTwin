import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/*
 * ResQTwin is designed to work offline.
 * Supabase is optional, so the application must not crash
 * when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are absent.
 */

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;