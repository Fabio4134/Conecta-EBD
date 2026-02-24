import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL ERROR: Missing Supabase environment variables (VITE_SUPABASE_URL or SUPABASE_URL)");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder_key'
);

export function initDb() {
  if (!supabaseUrl) console.error("Database connection failed due to missing env variables.");
  else console.log("Supabase client connected.");
}

export default supabase;
