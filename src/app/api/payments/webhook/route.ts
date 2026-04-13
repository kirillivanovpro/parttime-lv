import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/stripe/webhook'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role to bypass RLS for webhook writes
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = verifyWebhookSignature(payload, signature)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency: skip already-processed events
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ received: true })

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const metadata = session.metadata ?? {}
    const type = metadata.type
    const userId = metadata.user_id
    const jobId = metadata.job_id ?? null

    if (type !== 'job_posting' || !userId) {
      return NextResponse.json({ received: true })
    }

    const amountTotal = session.amount_total ?? 0

    // Log payment with idempotency ON CONFLICT
    const { error: insertErr } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        stripe_payment_id: session.id,
        stripe_event_id: event.id,
        type: 'job_posting',
        status: 'paid',
        amount_eur: amountTotal,
        job_id: jobId,
        metadata,
      })
      // ON CONFLICT handled by unique constraint — ignore duplicate
      .select()

    if (insertErr && !insertErr.message.includes('duplicate')) {
      console.error('Payment insert error:', insertErr)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // Activate the job posting for 30 days
    if (jobId) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const { error: updateErr } = await supabase
        .from('job_postings')
        .update({
          status: 'active',
          is_paid: true,
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', jobId)
        .eq('status', 'draft') // only activate drafts

      if (updateErr) {
        console.error('Job activation error:', updateErr)
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const metadata = session.metadata ?? {}
    const userId = metadata.user_id

    if (userId) {
      await supabase
        .from('payments')
        .insert({
          user_id: userId,
          stripe_payment_id: session.id,
          stripe_event_id: event.id,
          type: metadata.type ?? 'job_posting',
          status: 'failed',
          amount_eur: 0,
          job_id: metadata.job_id ?? null,
          metadata,
        })
        .select()
    }
  }

  return NextResponse.json({ received: true })
}

// Disable body parsing — Stripe needs the raw body for signature verification
export const config = {
  api: { bodyParser: false },
}
