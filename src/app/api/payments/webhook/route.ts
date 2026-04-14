import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/stripe/webhook'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

// Service role client to bypass RLS for webhook writes
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = verifyWebhookSignature(payload, signature)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(supabase, event)
    } else if (event.type === 'checkout.session.expired') {
      await handleCheckoutExpired(supabase, event)
    }
  } catch (err) {
    // Log error but return 200 to Stripe to prevent retries on permanent failures
    console.error(`Webhook handler error for event ${event.id}:`, err)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  event: Stripe.Event
) {
  const session = event.data.object as Stripe.Checkout.Session
  const metadata = session.metadata ?? {}

  const type = metadata.type as 'job_posting' | 'contact_unlock' | undefined
  const userId = metadata.user_id
  const jobId = metadata.job_id
  const paymentDbId = metadata.payment_db_id
  const seekerId = metadata.seeker_id

  if (!type || !userId || !paymentDbId) {
    console.error('Missing required metadata in checkout session:', metadata)
    return
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id

  // Update payment record to completed
  // Atomic idempotency: only update if still pending (prevents race condition)
  const { data: updated, error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      stripe_payment_id: paymentIntentId,
    })
    .eq('id', paymentDbId)
    .eq('status', 'pending')  // only if not already processed
    .select('id')

  if (updateError) {
    console.error('Payment update error:', updateError)
    throw updateError
  }

  // If no rows updated, this event was already processed — skip
  if (!updated || updated.length === 0) {
    console.log('Payment already processed, skipping:', paymentDbId)
    return
  }

  if (type === 'job_posting' && jobId) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error: jobError } = await supabase
      .from('job_postings')
      .update({
        status: 'active',
        is_paid: true,
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', jobId)
      .eq('status', 'draft')
      .eq('is_paid', false)

    if (jobError) {
      console.error('Job activation error:', jobError)
    }
  } else if (type === 'contact_unlock' && seekerId && jobId) {
    // Insert contact unlock record
    // ON CONFLICT DO NOTHING via unique constraint ensures idempotency
    const { error: unlockError } = await supabase
      .from('contact_unlocks')
      .insert({
        seeker_id: seekerId,
        job_id: jobId,
        payment_id: paymentDbId,
      })

    if (unlockError) {
      // Duplicate key means already unlocked - that's fine
      if (!unlockError.message?.includes('duplicate') && unlockError.code !== '23505') {
        console.error('Contact unlock insert error:', unlockError)
      }
    }
  }
}

async function handleCheckoutExpired(
  supabase: ReturnType<typeof createServiceClient>,
  event: Stripe.Event
) {
  const session = event.data.object as Stripe.Checkout.Session

  // Mark payment as failed using session ID
  const { error } = await supabase
    .from('payments')
    .update({ status: 'failed' })
    .eq('stripe_session_id', session.id)
    .eq('status', 'pending')

  if (error) {
    console.error('Payment status update error on expiry:', error)
  }
}
