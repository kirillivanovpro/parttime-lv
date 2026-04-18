---
globs: ["supabase/migrations/**", "src/lib/supabase/**"]
---

# Правила работы с БД

1. Все миграции — в supabase/migrations/ с именем YYYYMMDDHHMMSS_description.sql
2. НИКОГДА не изменять существующие миграции — только новые файлы
3. RLS обязателен: ALTER TABLE x ENABLE ROW LEVEL SECURITY после каждого CREATE TABLE
4. Типы regenerate после каждой миграции: supabase gen types typescript --local > src/types/supabase.ts
5. Используй context7 для проверки актуального синтаксиса Supabase RLS
