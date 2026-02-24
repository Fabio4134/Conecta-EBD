import { supabase } from './db.ts';

async function updateChurch() {
    const { data, error } = await supabase
        .from('churches')
        .update({ name: 'Templo Central' })
        .eq('id', 19) // id of ADMTN - TEMPLO CENTRAL
        .select();

    if (error) {
        console.error('Error updating church:', error);
    } else {
        console.log('Updated churches:', data);
    }
}

updateChurch();
