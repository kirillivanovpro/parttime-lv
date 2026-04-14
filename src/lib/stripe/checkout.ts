import stripe from './client'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

// Prices in euro cents — read from env with fallback
const PRICE_JOB_POSTING = Number(process.env.PRICE_JOB_POSTING ?? '30')
const PRICE_CONTACT_UNLOCK = Number(process.env.PRICE_CONTACT_UNLOCK ?? '30')

export async function createJobPostingCheckout({
  jobId,
  userId,
  jobTitle,
  paymentDbId,
  idempotencyKey,
}: {
  jobId: string
  userId: string
  jobTitle: string
  paymentDbId: string
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
              name: 'Publikacija vakances uz 30 dienam',
              description: jobTitle,
            },
          },
        },
      ],
      metadata: {
        type: 'job_posting',
        user_id: userId,
        job_id: jobId,
        payment_db_id: paymentDbId,
      },
      success_url: `${BASE_URL}/payment/success?type=job_posting&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/payment/cancel`,
    },
    { idempotencyKey }
  )

  return session
}

export async function createContactUnlockCheckout({
  jobId,
  userId,
  jobTitle,
  seekerId,
  paymentDbId,
  idempotencyKey,
}: {
  jobId: string
  userId: string
  jobTitle: string
  seekerId: string
  paymentDbId: string
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
            unit_amount: PRICE_CONTACT_UNLOCK,
            product_data: {
              name: 'Atbloket kontaktinformaciju',
              description: `Vakance: ${jobTitle}`,
            },
          },
        },
      ],
      metadata: {
        type: 'contact_unlock',
        user_id: userId,
        job_id: jobId,
        seeker_id: seekerId,
        payment_db_id: paymentDbId,
      },
      success_url: `${BASE_URL}/payment/success?type=contact_unlock&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/payment/cancel`,
    },
    { idempotencyKey }
  )

  return session
}
