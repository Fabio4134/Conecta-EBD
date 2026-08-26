import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bvxryutafofmvziqeahu.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eHJ5dXRhZm9mbXZ6aXFlYWh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzYwMzE5OSwiZXhwIjoyMTAzMTc5MTk5fQ.OU1I6EQ1T1RMYxYGhcz_4_KMSqn0QTRH7DvJMCZ6cjY';
const projectRef = 'bvxryutafofmvziqeahu';

async function run() {
  const sql = `
    ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone TEXT;
  `;
  
  // Try Management API
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    console.log('Management API status:', res.status);
    const data = await res.text();
    console.log('Management API response:', data);
  } catch (e) {
    console.error('Management API error:', e);
  }

  // Also test insert with phone to see if column is accessible
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data, error } = await supabase.from('students').select('id, name, phone').limit(1);
  console.log('Supabase select phone result:', data, error);
}

run();
