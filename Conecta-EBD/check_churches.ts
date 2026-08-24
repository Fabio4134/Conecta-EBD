import { supabase } from './src/db.ts';

async function main() {
    const { data: churches, error } = await supabase.from('churches').select('*');
    if (error) {
        console.error("Error fetching churches:", error);
    } else {
        console.log(JSON.stringify(churches, null, 2));
    }
}

main();
