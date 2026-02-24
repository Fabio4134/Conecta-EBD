import { supabase } from './db.ts';

async function listUsers() {
    const { data, error } = await supabase.from('users').select('name, email, role, churches(name)');
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('--- Logins (Usuários) ---');
        data?.forEach(user => {
            console.log(`Email: ${user.email} | Nome: ${user.name} | Perfil: ${user.role} | Igreja: ${user.churches?.name || 'N/A'}`);
        });
    }
}

listUsers();
