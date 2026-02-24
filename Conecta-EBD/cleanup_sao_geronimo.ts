import { supabase } from './src/db.ts';

const MERGE_MAP = {
    27: 14,  // São Gerônimo duplicate with Cyrillic O -> Arabic numeral
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
}

main();
