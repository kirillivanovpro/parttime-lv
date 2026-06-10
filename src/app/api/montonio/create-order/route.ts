import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MONTONIO_API_URL = process.env.MONTONIO_SANDBOX === 'true'
  ? 'https://sandbox-stargate.montonio.com/api/orders'
  : 'https://stargate.montonio.com/api/orders'

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

    const paymentId = `montonio_${Date.now()}_${user.id.slice(0, 8)}`
    await supabaseAdmin.from('payments').insert({
      id: paymentId,
      user_id: user.id,
      amount,
      type: 'topup',
      status: 'pending',
      provider: 'montonio',
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const accessKey = process.env.MONTONIO_ACCESS_KEY!
    const secretKey = process.env.MONTONIO_SECRET_KEY!

    const payload = {
      access_key: accessKey,
      merchant_reference: paymentId,
      merchant_return_url: `${appUrl}/wallet?success=1`,
      merchant_notification_url: `${appUrl}/api/montonio/webhook`,
      grand_total: amount,
      currency: 'EUR',
      payment: {
        amount,
        currency: 'EUR',
        method_options: {
          payment_initiation: {
            preferred_country: 'LV',
          },
        },
      },
      line_items: [
        {
          product_code: 'wallet_topup',
          product_name: 'Part:time.lv — Maka papildināšana',
          quantity: 1,
          unit_amount: amount,
          total_amount: amount,
        },
      ],
    }

    const orderJwt = jwt.sign(payload, secretKey, { algorithm: 'HS256', expiresIn: '10m' })

    const response = await fetch(MONTONIO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: orderJwt }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Montonio API error:', errText)
      await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', paymentId)
      return NextResponse.json({ error: 'Payment provider error' }, { status: 502 })
    }

    const result = await response.json() as { paymentUrl?: string; errors?: unknown }
    if (!result.paymentUrl) {
      console.error('Montonio no paymentUrl:', result)
      await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', paymentId)
      return NextResponse.json({ error: 'No payment URL received' }, { status: 502 })
    }

    await supabaseAdmin.from('payments').update({ provider_ref: result.paymentUrl }).eq('id', paymentId)
    return NextResponse.json({ paymentUrl: result.paymentUrl })
  } catch (err) {
    console.error('Montonio create order error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
