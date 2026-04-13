import stripe from './client'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

// Price in euro cents — read from env with fallback
const PRICE_JOB_POSTING = Number(process.env.PRICE_JOB_POSTING ?? '1000') // €10 default

export async function createJobPostingCheckout({
  jobId,
  userId,
  jobTitle,
  idempotencyKey,
}: {
  jobId: string
  userId: string
  jobTitle: string
  idempotencyKey: string
}) {
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: PRICE_JOB_POSTING,
            product_data: {
              name: 'Публикация вакансии на 30 дней',
              description: jobTitle,
            },
          },
        },
      ],
      metadata: {
        type: 'job_posting',
        user_id: userId,
        job_id: jobId,
      },
      success_url: `${BASE_URL}/payment/job/${jobId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/payment/job/${jobId}`,
    },
    { idempotencyKey }
  )

  return session
}
