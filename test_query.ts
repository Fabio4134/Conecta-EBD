import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testQuery() {
    const { data, error } = await supabase.from('lessons').select('*, magazines(title)');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success, rows:', data.length);
    }
}
testQuery();
