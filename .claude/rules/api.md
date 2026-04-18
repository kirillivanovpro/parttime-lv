---
globs: ["src/app/api/**", "src/app/**/actions.ts"]
---

# Правила API и Server Actions

1. Server Actions: файл начинается с 'use server', функция экспортируется с async
2. Всегда первой строкой проверка: const { data: { user } } = await supabase.auth.getUser()
3. Zod схема для валидации входных данных — до любой операции с БД
4. Возвращать { error: string } или { data: ... } — не бросать исключения наружу
5. API Routes: проверять метод запроса явно
6. Stripe webhook: ВСЕГДА verifyWebhookSignature перед обработкой
