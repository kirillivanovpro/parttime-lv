import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface MontonioPaymentPayload {
  merchant_reference: string
  status: string
  grand_total: number
  currency: string
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { data?: string }
    const { data: token } = body

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const secretKey = process.env.MONTONIO_SECRET_KEY!
    let payload: MontonioPaymentPayload
    try {
      payload = jwt.verify(token, secretKey, { algorithms: ['HS256'] }) as MontonioPaymentPayload
    } catch {
      console.error('Montonio webhook JWT verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const { merchant_reference: paymentId, status, grand_total: amount } = payload

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing merchant_reference' }, { status: 400 })
    }

    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('user_id, status, amount')
      .eq('id', paymentId)
      .single()

    if (!payment) {
      console.error('Montonio webhook: payment not found:', paymentId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status === 'completed') {
      return NextResponse.json({ ok: true })
    }

    const finalAmount = amount ?? payment.amount
    const isPaid = status === 'finalized' || status === 'paid'

    await supabaseAdmin.from('payments').update({
      status: isPaid ? 'completed' : 'failed',
      provider_ref: token.slice(0, 100),
    }).eq('id', paymentId)

    if (isPaid) {
      await supabaseAdmin.rpc('complete_balance_topup', {
        p_user_id: payment.user_id,
        p_amount: finalAmount,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Montonio webhook error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
