import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bvxryutafofmvziqeahu.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eHJ5dXRhZm9mbXZ6aXFlYWh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzYwMzE5OSwiZXhwIjoyMTAzMTc5MTk5fQ.OU1I6EQ1T1RMYxYGhcz_4_KMSqn0QTRH7DvJMCZ6cjY';

async function reloadSchema() {
  const res = await fetch(`https://api.supabase.com/v1/projects/bvxryutafofmvziqeahu/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: "NOTIFY pgrst, 'reload schema';" })
  });
  console.log('Schema reload status:', res.status);
}

reloadSchema();
