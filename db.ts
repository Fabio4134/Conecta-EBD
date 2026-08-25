import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://bvxryutafofmvziqeahu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eHJ5dXRhZm9mbXZ6aXFlYWh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzYwMzE5OSwiZXhwIjoyMTAzMTc5MTk5fQ.OU1I6EQ1T1RMYxYGhcz_4_KMSqn0QTRH7DvJMCZ6cjY';

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL ERROR: Missing Supabase environment variables (VITE_SUPABASE_URL or SUPABASE_URL)");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

export function initDb() {
  if (!supabaseUrl) console.error("Database connection failed due to missing env variables.");
  else console.log("Supabase client connected.");
}

export default supabase;
