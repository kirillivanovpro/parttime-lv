# Part:time.lv — AI Development Config

## Обзор проекта
Платформа для поиска part-time работы в Латвии. Роли: соискатель, работодатель, admin.
Монетизация: оплата за публикацию вакансии (€10) + разблокировка контакта (€2) + PRO подписки (v2).

## Стек
- Next.js 16.2.3 (App Router, Server Actions, TypeScript) + React 19
- Supabase (PostgreSQL + Auth + Storage + Edge Functions) — @supabase/ssr ^0.10.2
- Tailwind CSS v4 (CSS-first config, НЕТ tailwind.config.js — стили через @import "tailwindcss" в globals.css)
- Stripe (установить: npm i stripe @stripe/stripe-js) — Checkout Sessions + Webhooks
- Resend (установить: npm i resend) — транзакционные письма
- Zod (установить: npm i zod) — валидация входных данных
- Vercel (deploy)

## Архитектура
src/app/(auth)/          — регистрация, вход, подтверждение email
src/app/(dashboard)/     — личный кабинет (соискатель и работодатель)
src/app/jobs/            — лента вакансий, страница вакансии
src/app/admin/           — админ-панель (role=admin)
src/app/api/             — API маршруты (auth, jobs, payments, admin)
src/lib/supabase/        — клиент, типы, хелперы
src/lib/stripe/          — создание сессий, webhook-обработчик
supabase/migrations/     — SQL миграции (нумерованные)
supabase/functions/      — Edge Functions (cron, emails)

## Правила разработки
- НИКОГДА не писать SQL миграции вручную в код — только через supabase/migrations/
- ВСЕГДА добавлять RLS политики к каждой новой таблице
- Server Actions только в файлах с 'use server' директивой
- Stripe: создавать только Checkout Sessions, не PaymentIntents напрямую
- После email-подтверждения → redirect на /dashboard (если профиль заполнен) или /onboarding
- ENV переменные: NEXT_PUBLIC_ только для клиентского кода
- Типы генерировать через: supabase gen types typescript --local

## PR Review — обязательные проверки перед мержем

Каждый раз когда открывается или обновляется PR в репозитории kirillivanovpro/parttime-lv:
1. Подпишись на активность PR через mcp__github__subscribe_pr_activity
2. Выполни все проверки из .claude/rules/pr-review.md
3. Оставь комментарий с результатами только если найдены проблемы

### Чеклист (выполнять в указанном порядке)

**1. Сборка**
- `npm run build` должен завершиться без ошибок и предупреждений TypeScript

**2. Страницы**
- Все маршруты в src/app/**/page.tsx должны рендериться без runtime ошибок
- Критичные: `/`, `/jobs`, `/jobs/[id]`, `/dashboard`, `/onboarding`, `/login`, `/register`
- Проверить: нет `return null` без условия загрузки, нет обращений к несуществующим таблицам

**3. База данных**
- Все `.from('table_name')` должны ссылаться на таблицы из supabase/migrations/
- Запрещённые таблицы (не существуют): `listings`, `reviews`, `wallet_transactions`, `chats`
- Каждая новая таблица должна иметь RLS политику в миграции

**4. Auth flow**
- Server Actions начинаются с `await supabase.auth.getUser()`
- Защищённые маршруты покрыты src/proxy.ts (middleware)
- Нет прямого использования `supabase.auth.getSession()` в Server Components

**5. API endpoints**
- Все route.ts проверяют HTTP метод явно
- Stripe webhook: verifyWebhookSignature вызывается до любой обработки
- Нет SUPABASE_SERVICE_ROLE_KEY в клиентском коде (`'use client'` файлах)

**6. Безопасность**
- Zod валидация перед каждой операцией с БД
- Ownership проверки в Server Actions (не только RLS)
- Нет `.env` файлов в diff

## Команды
supabase start
supabase db push
supabase gen types typescript --local > src/types/supabase.ts
stripe listen --forward-to localhost:3000/api/payments/webhook
npm run dev

## MCP серверы
- context7: актуальная документация (Next.js, Supabase, Stripe, Tailwind)
- supabase: прямой доступ к БД для миграций и запросов
