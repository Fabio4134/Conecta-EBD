import { supabase } from './src/db.js'; // I'll use db.ts but tsx handles it

const magazine = {
    title: 'Lições Bíblicas JOVENS - Professor',
    quarter: '1º Trimestre',
    year: 2026
};

const lessons = [
    {
        number: 1,
        title: 'O Sentido Bíblico da Salvação',
        date: '2026-01-04',
        golden_text: '"E porei inimizade entre ti e a mulher e entre a tua semente e a sua semente; esta te ferirá a cabeça, e tu lhe ferirás o calcanhar." (Gn 3.15)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 2,
        title: 'O Problema do Pecado',
        date: '2026-01-11',
        golden_text: '"Porque todos pecaram e destituídos estão da glória de Deus." (Rm 3.23)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 3,
        title: 'A Natureza do Deus que Salva',
        date: '2026-01-18',
        golden_text: '"Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." (Jo 3.16)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 4,
        title: 'O Deus que Justifica',
        date: '2026-01-25',
        golden_text: '"Sendo, pois, justificados pela fé, temos paz com Deus por nosso Senhor Jesus Cristo." (Rm 5.1)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 5,
        title: 'O Filho que Redime',
        date: '2026-02-01',
        golden_text: '"Em quem temos a redenção pelo seu sangue, a remissão das ofensas, segundo as riquezas da sua graça." (Ef 1.7)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 6,
        title: 'O Espírito Santo que Regenera e Santifica',
        date: '2026-02-08',
        golden_text: '"Não pelas obras de justiça que houvéssemos feito, mas, segundo a sua misericórdia, nos salvou pela lavagem da regeneração e da renovação do Espírito Santo." (Tt 3.5)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 7,
        title: 'A Graça de Deus',
        date: '2026-02-15',
        golden_text: '"Porque a graça de Deus se há manifestado, trazendo salvação a todos os homens." (Tt 2.11)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 8,
        title: 'A Eleição na Salvação',
        date: '2026-02-22',
        golden_text: '"Como também nos elegeu nele antes da fundação do mundo, para que fôssemos santos e irrepreensíveis diante dele em amor." (Ef 1.4)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 9,
        title: 'O Livre-Arbítrio na Salvação',
        date: '2026-03-01',
        golden_text: '"E, se alguém ouvir as minhas palavras e não crer, eu não o julgo, porque eu vim não para julgar o mundo, mas para salvar o mundo." (Jo 12.47)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 10,
        title: 'Arrependimento e Fé como Respostas Humanas',
        date: '2026-03-08',
        golden_text: '"E dizendo: O tempo está cumprido, e o Reino de Deus está próximo. Arrependei-vos e crede no evangelho." (Mc 1.15)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 11,
        title: 'A Adoção - Entrando na Família de Deus',
        date: '2026-03-15',
        golden_text: '"Mas, a todos quantos o receberam, deu-lhes o poder de serem feitos filhos de Deus: aos que creem no seu nome." (Jo 1.12)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 12,
        title: 'Perseverando na Salvação',
        date: '2026-03-22',
        golden_text: '"Mas o que perseverar até ao fim será salvo." (Mt 24.13)',
        suggested_hymns: 'Harpa Cristã'
    },
    {
        number: 13,
        title: 'A Consumação da Salvação',
        date: '2026-03-29',
        golden_text: '"E, assim como trouxemos a imagem do terreno, assim traremos também a imagem do celestial." (1 Co 15.49)',
        suggested_hymns: 'Harpa Cristã'
    }
];

async function seedMagazine() {
    console.log('Verifying if magazine already exists...');
    const { data: existingMgz, error: fetchErr } = await supabase
        .from('magazines')
        .select('id')
        .ilike('title', '%Lições Bíblicas JOVENS - Professor%');

    if (fetchErr) {
        console.error('Error checking for existing magazine:', fetchErr);
        return;
    }

    let magazineId;

    if (existingMgz && existingMgz.length > 0) {
        console.log('Magazine already exists, id:', existingMgz[0].id);
        magazineId = existingMgz[0].id;
        await supabase.from('lessons').delete().eq('magazine_id', magazineId);
    } else {
        console.log('Inserting new magazine...');
        const { data: insertedMgz, error: insertErr } = await supabase
            .from('magazines')
            .insert(magazine)
            .select('id')
            .single();

        if (insertErr) {
            console.error('Error inserting magazine:', insertErr);
            return;
        }
        magazineId = insertedMgz.id;
        console.log('Magazine inserted with id:', magazineId);
    }

    console.log('Inserting lessons...');
    const lessonsToInsert = lessons.map(l => ({ ...l, magazine_id: magazineId }));

    const { error: lessonsErr } = await supabase
        .from('lessons')
        .insert(lessonsToInsert);

    if (lessonsErr) {
        console.error('Error inserting lessons:', lessonsErr);
    } else {
        console.log('Successfully inserted 13 lessons for JOVENS.');
    }
}

seedMagazine();
