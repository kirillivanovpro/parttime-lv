import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const paymentId = session.metadata?.payment_id
    const userId = session.metadata?.user_id
    const amount = parseFloat(session.metadata?.amount ?? '0')

    if (!paymentId || !userId || !amount) {
      console.error('Missing metadata in Stripe session:', session.id)
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('payments')
      .update({ status: 'completed', provider_ref: session.id })
      .eq('id', paymentId)

    if (updateError) {
      console.error('Failed to update payment:', updateError)
    }

    await supabaseAdmin.rpc('complete_balance_topup', {
      p_user_id: userId,
      p_amount: amount,
    })
  }

  return NextResponse.json({ received: true })
}
