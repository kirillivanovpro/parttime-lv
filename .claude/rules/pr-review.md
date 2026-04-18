# PR Review — Автоматические проверки перед мержем

## Триггер

При каждом событии в PR (открытие, push, review comment) Claude должен:
1. Вызвать `mcp__github__subscribe_pr_activity` для подписки на PR
2. Выполнить все проверки ниже
3. Если найдены блокирующие проблемы — оставить комментарий через `mcp__github__add_issue_comment`
4. Если всё чисто — не спамить, только отвечать на явные вопросы

---

## Проверка 1 — Сборка (блокирует мерж)

```bash
npm run build
```

Критерии прохождения:
- Exit code 0
- Нет TypeScript ошибок (`Type error:` в выводе)
- Все страницы скомпилированы (счётчик маршрутов не уменьшился)

---

## Проверка 2 — Страницы (блокирует мерж)

Проверить каждый изменённый `page.tsx` в diff:

| Страница | Что проверять |
|---|---|
| `/` | Server Component, запросы только к `job_postings` |
| `/jobs` | Пагинация, фильтры по category/city/schedule |
| `/jobs/[id]` | `notFound()` если нет данных, проверка `job.status` |
| `/jobs/[id]/apply` | Редирект если не seeker или уже откликнулся |
| `/dashboard` | Проверка `profile.role`, разные UI для seeker/employer |
| `/onboarding` | Редирект на `/dashboard` если профиль уже заполнен |
| `/payment/job/[id]` | Редирект если `job.is_paid === true` |

Запрещённые паттерны в page.tsx:
```typescript
// ПЛОХО — пустая страница если auth не загрузился
if (!user) return null

// ПЛОХО — несуществующая таблица
supabase.from('listings')
supabase.from('reviews')
supabase.from('wallet_transactions')

// ПЛОХО — getSession в Server Component (небезопасно)
supabase.auth.getSession()
```

---

## Проверка 3 — База данных (блокирует мерж)

### Существующие таблицы (разрешены)
```
profiles
seeker_profiles
employer_profiles
job_postings
payments
contact_unlocks
applications
```

### Grep для поиска запросов к несуществующим таблицам
```bash
grep -r "\.from('" src/ --include="*.ts" --include="*.tsx" | \
  grep -v "job_postings\|profiles\|seeker_profiles\|employer_profiles\|payments\|contact_unlocks\|applications"
```

### Новые миграции в PR
- Файл должен быть в `supabase/migrations/` с именем `YYYYMMDDHHMMSS_description.sql`
- Должен содержать `ENABLE ROW LEVEL SECURITY` и хотя бы одну политику
- Не должен изменять существующие миграции (только новые файлы)

---

## Проверка 4 — Auth flow (блокирует мерж)

### Server Actions (`'use server'` файлы)
Каждый экспортируемый `async function` должен начинаться с:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: '...' } // или redirect('/login')
```

Grep для поиска нарушений:
```bash
grep -n "export async function" src/app/**/actions.ts | head -20
# Затем проверить что каждая функция вызывает getUser()
```

### Middleware (src/proxy.ts)
Защищённые маршруты: `/onboarding`, `/dashboard`, `/jobs/new`, `/payment`

Если добавлены новые protected маршруты — они должны быть в `proxy.ts`.

---

## Проверка 5 — API endpoints

### Каждый `route.ts` должен:
1. Проверять метод: `if (request.method !== 'POST') return NextResponse.json({}, { status: 405 })`
2. Вызывать `supabase.auth.getUser()` первым делом
3. Для Stripe webhook — `verifyWebhookSignature` до любой логики

### Проверка service role key
```bash
# Не должно быть в 'use client' файлах
grep -r "SUPABASE_SERVICE_ROLE_KEY\|SERVICE_ROLE" src/ --include="*.tsx" --include="*.ts" | \
  grep "'use client'"
```

---

## Проверка 6 — Безопасность

### Zod валидация
Каждый Server Action и API route должен иметь `z.object({...}).safeParse(...)` перед INSERT/UPDATE.

### Ownership в Server Actions
Операции UPDATE/DELETE должны включать фильтр по owner, а не только RLS:
```typescript
// ХОРОШО — явная проверка ownership
.eq('employer_id', employer.id)

// ПЛОХО — только надежда на RLS
.eq('id', jobId)
```

### Конфиденциальные данные в diff
```bash
git diff --name-only | grep -i "\.env\|secret\|key\|token"
```
Если найдено — немедленно блокировать мерж.

---

## Шаблон комментария при найденных проблемах

```markdown
## Pre-merge Check Results

❌ **Blocking issues found:**

### Build
- [ ] `npm run build` fails: [error message]

### Pages  
- [ ] `/jobs/[id]` — missing `notFound()` when data is null (line 42)

### Database
- [ ] Query to non-existent table `listings` in `src/app/chat/page.tsx:29`

### Auth
- [ ] `createJobAction` missing `getUser()` check

### Security
- [ ] `SUPABASE_SERVICE_ROLE_KEY` referenced in client component

---
Please fix the issues above before merging.
```

## Шаблон когда всё ОК

Не оставлять комментарий. Молчание = одобрение.
Исключение: если reviewer явно просит подтверждение — ответить кратко "✓ All checks passed".
