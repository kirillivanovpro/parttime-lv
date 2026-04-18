---
name: create-migration
description: Создание SQL миграции с RLS для новой таблицы
---

# Навык: создание миграции

## Шаблон файла: supabase/migrations/YYYYMMDDHHMMSS_create_TABLE.sql

CREATE TABLE IF NOT EXISTS TABLE_NAME (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE TABLE_NAME ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON TABLE_NAME
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_TABLE_user_id ON TABLE_NAME(user_id);

CREATE TRIGGER update_TABLE_updated_at
  BEFORE UPDATE ON TABLE_NAME
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
