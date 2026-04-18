---
globs: ["src/app/api/payments/**", "src/lib/stripe/**"]
---

# Правила платёжного флоу

1. Создавать только Checkout Sessions — не PaymentIntents напрямую
2. Статус вакансии меняется ТОЛЬКО в webhook-обработчике, не в success_url
3. Idempotency: INSERT payments с ON CONFLICT (stripe_payment_id) DO NOTHING
4. Метаданные Stripe: всегда передавать { user_id, type, job_id } в metadata
5. Цены берутся из ENV переменных: PRICE_JOB_POSTING, PRICE_CONTACT_UNLOCK
6. Логировать все webhook события в таблицу payments со статусом
