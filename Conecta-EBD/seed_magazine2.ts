import { supabase } from './src/db.ts';

const magazine = {
    title: 'Lições Bíblicas Adolescentes - Aluno 1 (A História da Salvação)',
    quarter: '1º Trimestre',
    year: 2026
};

const lessons = [
    {
        number: 1,
        title: 'Criados à Imagem de Deus',
        date: '2026-01-04', // First Sunday approx, since date usually stores YYYY-MM-DD
        golden_text: 'Assim Deus criou os seres humanos; ele os criou parecidos com Deus. Ele os criou homem e mulher. (Gênesis 1.27)',
        suggested_hymns: '107'
    },
    {
        number: 2,
        title: 'Errando o Alvo',
        date: '2026-01-11',
        golden_text: 'A mulher viu que a árvore era bonita e que as suas frutas eram boas de se comer. E ela pensou como seria bom ter entendimento. Aí apanhou uma fruta e comeu; e deu ao seu marido, e ele também comeu. (Gênesis 3.6)',
        suggested_hymns: ''
    },
    {
        number: 3,
        title: 'Pecado: A Maior Pandemia da História',
        date: '2026-01-18',
        golden_text: 'Todos pecaram e estão afastados da presença gloriosa de Deus. (Romanos 3.23)',
        suggested_hymns: ''
    },
    {
        number: 4,
        title: 'Uma Promessa, Uma Esperança',
        date: '2026-01-25',
        golden_text: 'Todos os profetas falaram a respeito de Jesus, dizendo que os que creem nele recebem, por meio dele, o perdão dos pecados. (Atos 10.43)',
        suggested_hymns: ''
    },
    {
        number: 5,
        title: 'A Missão de Israel no Plano de Deus',
        date: '2026-02-01',
        golden_text: 'Cristo fez isso para que a bênção que Deus prometeu a Abraão seja dada, por meio de Cristo Jesus, aos não judeus e para que todos nós recebamos por meio da fé o Espírito que Deus prometeu. (Gálatas 3.14)',
        suggested_hymns: ''
    },
    {
        number: 6,
        title: 'O Nascimento que Mudou a História',
        date: '2026-02-08',
        golden_text: 'Mas, quando chegou o tempo certo, Deus enviou o seu próprio Filho, que veio como filho de mãe humana e viveu debaixo da lei. (Gálatas 4.4)',
        suggested_hymns: ''
    },
    {
        number: 7,
        title: 'O Que Jesus Fez na Cruz',
        date: '2026-02-15',
        golden_text: 'Ele nos libertou do poder da escuridão e nos trouxe em segurança para o Reino do seu Filho amado. É ele quem nos liberta, e é por meio dele que os nossos pecados são perdoados. (Colossenses 1.13-14)',
        suggested_hymns: ''
    },
    {
        number: 8,
        title: 'O Novo Nascimento e a Justificação',
        date: '2026-02-22',
        golden_text: 'Ele nos salvou porque teve compaixão de nós, e não porque nós tivéssemos feito alguma coisa boa. Ele nos salvou por meio do Espírito Santo, que nos lavou, fazendo com que nascéssemos de novo e dando-nos uma nova vida. (Tito 3.5)',
        suggested_hymns: ''
    },
    {
        number: 9,
        title: 'A Santificação',
        date: '2026-03-01',
        golden_text: 'Procurem ter paz com todos e se esforcem para viver uma vida completamente dedicada ao Senhor, pois sem isso ninguém o verá. (Hebreus 12.14)',
        suggested_hymns: ''
    },
    {
        number: 10,
        title: 'A Certeza da Salvação',
        date: '2026-03-08',
        golden_text: 'O Espírito de Deus se une com o nosso espírito para afirmar que somos filhos de Deus. (Romanos 8.16)',
        suggested_hymns: ''
    },
    {
        number: 11,
        title: 'A Importância da Fé',
        date: '2026-03-15',
        golden_text: 'Sem fé ninguém pode agradar a Deus, porque quem vai a ele precisa crer que ele existe e que recompensa os que procuram conhecê-lo melhor. (Hebreus 11.6)',
        suggested_hymns: ''
    },
    {
        number: 12,
        title: 'Salvos para Mudar o Mundo',
        date: '2026-03-22',
        golden_text: 'Os discípulos foram anunciar o evangelho por toda parte. E o Senhor os ajudava e, por meio de milagres, provava que a mensagem deles era verdadeira. (Marcos 16.20)',
        suggested_hymns: ''
    },
    {
        number: 13,
        title: 'As Promessas Bíblicas para os Salvos',
        date: '2026-03-29',
        golden_text: 'Não fiquem aflitos. Creiam em Deus e creiam também em mim. Na casa do meu Pai há muitos quartos, e eu vou preparar um lugar para vocês. (João 14.1-2a)',
        suggested_hymns: '107'
    }
];

async function seedMagazine() {
    console.log('Verifying if magazine already exists...');
    const { data: existingMgz, error: fetchErr } = await supabase
        .from('magazines')
        .select('id')
        .ilike('title', '%Adolescentes - Aluno 1%');

    if (fetchErr) {
        console.error('Error checking for existing magazine:', fetchErr);
        return;
    }

    let magazineId;

    if (existingMgz && existingMgz.length > 0) {
        console.log('Magazine already exists, id:', existingMgz[0].id);
        magazineId = existingMgz[0].id;
        // Let's delete existing lessons for it to re-insert freshly just in case
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
        console.log('Successfully inserted 13 lessons for adolescents.');
    }
}

seedMagazine();
