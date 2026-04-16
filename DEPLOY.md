# Деплой Part:time.lv на Vercel

## Предварительные требования

- Проект на [Supabase](https://supabase.com) (Production)
- Аккаунт [Stripe](https://stripe.com) с включёнными реальными платежами
- Аккаунт [Vercel](https://vercel.com)

---

## 1. Суpabase — запуск миграций

Миграции применяются через Supabase CLI или Dashboard → SQL Editor **строго по порядку**:

```
supabase/migrations/001_initial_schema.sql    — UUID extension, таблица profiles
supabase/migrations/002_auth_roles.sql        — колонки role и plan в profiles
supabase/migrations/003_profile_tables.sql    — seeker_profiles, employer_profiles (+ RLS)
supabase/migrations/004_job_postings.sql      — job_postings, RLS, RPC increment_job_views
supabase/migrations/005_payments.sql          — первичная схема payments (нужна для 006)
supabase/migrations/006_payments_v2.sql       — пересоздаёт payments + таблица contact_unlocks
supabase/migrations/007_applications.sql      — таблица applications (отклики соискателей)
```

### Через CLI (рекомендуется)

```bash
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

### Вручную через Dashboard

Открыть Supabase Dashboard → SQL Editor → выполнить каждый файл по очереди (001 → 007).

> **Важно:** не пропускать 005 перед 006 — миграция 006 делает DROP TABLE и пересоздаёт её.

---

## 2. ENV переменные для Vercel

В Vercel Dashboard → Project → Settings → Environment Variables добавить:

### Supabase

| Переменная | Описание | Пример |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public ключ | `sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role ключ (секрет) | `sb_secret_...` |

Найти в: Supabase Dashboard → Project Settings → API.

### Stripe

| Переменная | Описание | Пример |
|---|---|---|
| `STRIPE_SECRET_KEY` | Secret key (production) | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |

Найти в: Stripe Dashboard → Developers → API keys / Webhooks.

### URL сайта

| Переменная | Описание | Пример |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | URL продакшн-сайта (для Stripe redirect) | `https://parttime.lv` |
| `NEXT_PUBLIC_URL` | URL продакшн-сайта (для email-ссылок) | `https://parttime.lv` |

> Обе переменные должны содержать **одинаковый** URL без завершающего слеша.

### Цены (в евро-центах)

| Переменная | Описание | Продакшн-значение |
|---|---|---|
| `PRICE_JOB_POSTING` | Цена публикации вакансии в центах | `1000` (= €10) |
| `PRICE_CONTACT_UNLOCK` | Цена разблокировки контакта в центах | `200` (= €2) |

---

## 3. Настройка Stripe Webhook

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**
2. URL: `https://<your-domain>/api/payments/webhook`
3. Events to listen: `checkout.session.completed`
4. После создания скопировать **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 4. Деплой на Vercel

```bash
# Установить Vercel CLI (если не установлен)
npm i -g vercel

# Деплой
vercel --prod
```

Или через GitHub: Vercel Dashboard → Import Repository → выбрать репозиторий.

### Настройки проекта в Vercel

- **Framework Preset:** Next.js
- **Root Directory:** `.` (корень репозитория)
- **Build Command:** `npm run build` (по умолчанию)
- **Output Directory:** `.next` (по умолчанию)

---

## 5. Пост-деплой проверка

- [ ] Регистрация и вход работают, email-подтверждение приходит
- [ ] Redirect после подтверждения ведёт на `/onboarding`
- [ ] Создание вакансии → Stripe Checkout открывается
- [ ] После успешной оплаты вакансия переходит в статус `active`
- [ ] Соискатель может откликнуться на вакансию
- [ ] Разблокировка контакта работает через Stripe

---

## Переменные для .env.local (разработка)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000
PRICE_JOB_POSTING=30
PRICE_CONTACT_UNLOCK=30
```

> Файл `.env.local` добавлен в `.gitignore` и **никогда не коммитится**.
