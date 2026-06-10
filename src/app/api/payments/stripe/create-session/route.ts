import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.slice(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { amount: number }
    const amount = parseFloat(String(body.amount))
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Minimum amount is €1.00' }, { status: 400 })
    }

    const paymentId = `stripe_${Date.now()}_${user.id.slice(0, 8)}`
    await supabaseAdmin.from('payments').insert({
      id: paymentId,
      user_id: user.id,
      amount,
      type: 'topup',
      status: 'pending',
      provider: 'stripe',
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Part:time.lv — Maka papildināšana' },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        payment_id: paymentId,
        user_id: user.id,
        amount: amount.toFixed(2),
      },
      success_url: `${appUrl}/wallet?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/wallet`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe session error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
