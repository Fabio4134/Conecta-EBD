-- Adiciona coluna de telefone nas tabelas students e teachers
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS phone TEXT;

-- Atualiza cache de esquema
NOTIFY pgrst, 'reload schema';
