import { supabase } from './src/db.ts';

async function listChurches() {
    const { data, error } = await supabase.from('churches').select('id, name');
    if (error) {
        console.error('Error:', error);
    } else {
        data.forEach(c => console.log(`${c.id}: ${c.name}`));
    }
}

listChurches();
