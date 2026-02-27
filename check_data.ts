import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function checkData() {
    const { data: classes } = await supabase.from('classes').select('*');
    const { data: teachers } = await supabase.from('teachers').select('*');
    const { data: students } = await supabase.from('students').select('*');

    console.log('Classes:', classes?.length);
    classes?.forEach(c => console.log(`- ${c.name} (Church ID: ${c.church_id})`));

    console.log('\nTeachers:', teachers?.length);
    teachers?.forEach(t => console.log(`- ${t.name} (Church ID: ${t.church_id})`));

    console.log('\nStudents:', students?.length);
}
checkData();
