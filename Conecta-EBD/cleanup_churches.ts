import { supabase } from './src/db.ts';

const MERGE_MAP = {
    3: 20,   // Arenoso I -> Arenoso 1
    4: 21,   // Arenoso II -> Arenoso 2
    5: 22,   // Arenoso III -> Arenoso 3
    6: 23,   // Cabula VII -> Cabula 7
    11: 24,  // Rótula I -> Rótula 1
    12: 25,  // Rótula II -> Rótula 2
    13: 26,  // Rótula III -> Rótula 3
    15: 28,  // Tancredo Neves III -> Tancredo Neves 3
    18: 29   // Tancredo Neves II -> Tancredo Neves 2
};

const TABLES_TO_UPDATE = [
    'attendance',
    'teacher_schedule',
    'materials',
    'students',
    'teachers',
    'classes',
    'users'
];

async function main() {
    for (const [oldId, newId] of Object.entries(MERGE_MAP)) {
        console.log(`Merging ${oldId} into ${newId}...`);

        // Update foreign keys
        for (const table of TABLES_TO_UPDATE) {
            const { error } = await supabase.from(table).update({ church_id: newId }).eq('church_id', oldId);
            if (error) {
                console.error(`Error updating ${table} for church ${oldId}:`, error);
            }
        }

        // Delete old church
        const { error: deleteError } = await supabase.from('churches').delete().eq('id', oldId);
        if (deleteError) {
            console.error(`Error deleting church ${oldId}:`, deleteError);
        } else {
            console.log(`Successfully merged and deleted church ${oldId}.`);
        }
    }

    // Also remove duplicate Rua São Gerônimo if needed? We will just keep 14 and delete 27?
    // Let's check if 27 has users.

    console.log("Merge complete.");
}

main();
