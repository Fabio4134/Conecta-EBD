// migrate.mjs - Cria todas as tabelas do projeto Conecta EBD no Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bvxryutafofmvziqeahu.supabase.co';
const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eHJ5dXRhZm9mbXZ6aXFlYWh1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzYwMzE5OSwiZXhwIjoyMTAzMTc5MTk5fQ.OU1I6EQ1T1RMYxYGhcz_4_KMSqn0QTRH7DvJMCZ6cjY';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

// Usamos fetch direto para executar SQL via Supabase SQL Editor API
async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE}`,
      'apikey': SERVICE_ROLE,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  return res;
}

// Usamos a Management API do Supabase para executar migrations
async function runMigration(sql) {
  const projectRef = 'bvxryutafofmvziqeahu';
  // Supabase Management API - executa SQL no banco
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const data = await res.json();
  return { status: res.status, data };
}

const migrations = [
  // 1. churches
  `CREATE TABLE IF NOT EXISTS churches (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Filial',
    pastor TEXT,
    members INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 2. users
  `CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'standard' CHECK (role IN ('master', 'standard')),
    church_id BIGINT REFERENCES churches(id),
    authorized INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 3. magazines
  `CREATE TABLE IF NOT EXISTS magazines (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    quarter TEXT NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 4. lessons
  `CREATE TABLE IF NOT EXISTS lessons (
    id BIGSERIAL PRIMARY KEY,
    magazine_id BIGINT NOT NULL REFERENCES magazines(id),
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    date DATE,
    golden_text TEXT,
    suggested_hymns TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 5. classes
  `CREATE TABLE IF NOT EXISTS classes (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    church_id BIGINT NOT NULL REFERENCES churches(id),
    magazine_id BIGINT REFERENCES magazines(id),
    active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 6. teachers
  `CREATE TABLE IF NOT EXISTS teachers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    church_id BIGINT NOT NULL REFERENCES churches(id),
    class_id BIGINT REFERENCES classes(id),
    active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 7. students
  `CREATE TABLE IF NOT EXISTS students (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    birth_date DATE,
    church_id BIGINT NOT NULL REFERENCES churches(id),
    class_id BIGINT REFERENCES classes(id),
    active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 8. attendance
  `CREATE TABLE IF NOT EXISTS attendance (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id),
    lesson_id BIGINT NOT NULL REFERENCES lessons(id),
    church_id BIGINT NOT NULL REFERENCES churches(id),
    present BOOLEAN DEFAULT FALSE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 9. materials
  `CREATE TABLE IF NOT EXISTS materials (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    church_id BIGINT NOT NULL REFERENCES churches(id),
    cover_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 10. teacher_schedule
  `CREATE TABLE IF NOT EXISTS teacher_schedule (
    id BIGSERIAL PRIMARY KEY,
    teacher_id BIGINT NOT NULL REFERENCES teachers(id),
    class_id BIGINT NOT NULL REFERENCES classes(id),
    lesson_id BIGINT NOT NULL REFERENCES lessons(id),
    church_id BIGINT NOT NULL REFERENCES churches(id),
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,

  // 11. suggestions
  `CREATE TABLE IF NOT EXISTS suggestions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    church_id BIGINT NOT NULL REFERENCES churches(id),
    text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
    answer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );`,
];

async function main() {
  console.log('🚀 Iniciando criação das tabelas no Supabase...\n');

  const tableNames = [
    'churches', 'users', 'magazines', 'lessons', 'classes',
    'teachers', 'students', 'attendance', 'materials', 'teacher_schedule', 'suggestions'
  ];

  for (let i = 0; i < migrations.length; i++) {
    const tableName = tableNames[i];
    console.log(`📋 Criando tabela: ${tableName}...`);
    
    const { status, data } = await runMigration(migrations[i]);
    
    if (status === 200 || status === 201) {
      console.log(`  ✅ ${tableName} criada com sucesso!`);
    } else {
      console.log(`  ⚠️  ${tableName} - Status: ${status}`);
      console.log(`  Resposta:`, JSON.stringify(data, null, 2));
    }
  }

  console.log('\n✅ Processo de migração concluído!');
  console.log('\nVerificando tabelas via REST API...');
  
  // Verificar cada tabela
  for (const table of tableNames) {
    const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: OK (0 registros)`);
    }
  }
}

main().catch(console.error);
