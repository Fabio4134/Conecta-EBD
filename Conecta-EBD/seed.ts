import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const churchesData = [
    { name: "ADMTN - ARENOSO 1", type: "Filial", pastor: "PR. Nicodemos Glória", members: 179 },
    { name: "ADMTN - ARENOSO 2", type: "Filial", pastor: "PB. NATANAEL SANTANA", members: 33 },
    { name: "ADMTN - ARENOSO 3", type: "Filial", pastor: "BP. Marcelo da Paixão", members: 32 },
    { name: "ADMTN - CABULA 7", type: "Filial", pastor: "Pb. Jeferson Guedes", members: 73 },
    { name: "ADMTN - CONJUNTO ACM", type: "Filial", pastor: "PB. ISAC SOUZA", members: 37 },
    { name: "ADMTN - EDGARD SANTOS", type: "Filial", pastor: "Pb. Marcos Almeida", members: 54 },
    { name: "ADMTN - FINAL DE LINHA", type: "Filial", pastor: "Pb. Ezequeil Mendes", members: 2 },
    { name: "ADMTN - NOVA VILA", type: "Filial", pastor: "Pb. Francisco Marinho", members: 18 },
    { name: "ADMTN - RÓTULA 1", type: "Filial", pastor: "Pr. Joval Barreto", members: 126 },
    { name: "ADMTN - RÓTULA 2", type: "Filial", pastor: "Pb. Robison Adorno", members: 20 },
    { name: "ADMTN - RÓTULA 3", type: "Filial", pastor: "PB. SANDIVAL PASSOS", members: 70 },
    { name: "ADMTN - RUA SÃO GERÔNIMО", type: "Filial", pastor: "Pr. Samuel Miranda", members: 96 },
    { name: "ADMTN - TANCREDO NEVES 3", type: "Filial", pastor: "PB. Claudio", members: 7 },
    { name: "ADMTN - VILA DOIS IRMÃOS", type: "Filial", pastor: "PB. JONATAS FERREIRA", members: 76 },
    { name: "ADMTN - VILA MOISÉS", type: "Filial", pastor: "Pb. Augusto Spinóla", members: 61 },
    { name: "ADMTN - TANCREDO NEVES 2", type: "Filial", pastor: "Pr. Domingos Prado", members: 82 },
    { name: "ADMTN - TEMPLO CENTRAL", type: "Sede", pastor: "Pr. Felipe Carvalho das Virgens", members: 399 }
];

async function seed() {
    console.log("Starting seed process...");

    for (const church of churchesData) {
        // Check if church already exists
        let { data: existingChurch } = await supabase
            .from('churches')
            .select('id')
            .eq('name', church.name)
            .single();

        let churchId;

        if (!existingChurch) {
            console.log(`Inserting church: ${church.name}`);
            const { data: newChurch, error: insertError } = await supabase
                .from('churches')
                .insert(church)
                .select()
                .single();

            if (insertError) {
                console.error(`Error inserting church ${church.name}:`, insertError);
                continue;
            }
            churchId = newChurch.id;
        } else {
            console.log(`Church already exists: ${church.name}`);
            churchId = existingChurch.id;
        }

        // Now check if standard user already exists for this church
        const emailStr = church.name.toLowerCase().replace(/[^a-z0-9]/g, '') + "@ebd.com";

        let { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', emailStr)
            .single();

        if (!existingUser) {
            console.log(`Inserting user: ${emailStr} for Church ID: ${churchId}`);
            const hashedPassword = bcrypt.hashSync("123456", 10);

            const { error: userError } = await supabase
                .from('users')
                .insert({
                    name: `Admin - ${church.name}`,
                    email: emailStr,
                    password: hashedPassword,
                    role: "standard",
                    church_id: churchId,
                    authorized: 1
                });

            if (userError) {
                console.error(`Error inserting user ${emailStr}:`, userError);
            }
        } else {
            console.log(`User already exists: ${emailStr}`);
        }
    }

    console.log("Seed complete!");
}

seed();
