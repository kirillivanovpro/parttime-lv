import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const listingId = params.id

    const { data: existingUnlock } = await supabaseAdmin
      .from('contact_unlocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .maybeSingle()

    if (existingUnlock) {
      const { data: listing } = await supabaseAdmin
        .from('listings')
        .select('contact_phone, contact_email')
        .eq('id', listingId)
        .single()
      return NextResponse.json({ phone: listing?.contact_phone ?? null, email: listing?.contact_email ?? null })
    }

    const UNLOCK_COST = 0.5
    const { data: deductResult } = await supabaseAdmin.rpc('deduct_balance', {
      p_user_id: user.id,
      p_amount: UNLOCK_COST,
      p_type: 'unlock',
    })

    const deductData = deductResult as { ok?: boolean; error?: string } | null
    if (deductData?.error) {
      return NextResponse.json({ error: deductData.error }, { status: 400 })
    }

    const { error: unlockError } = await supabaseAdmin.from('contact_unlocks').insert({
      user_id: user.id,
      listing_id: listingId,
    })

    if (unlockError) {
      await supabaseAdmin.rpc('complete_balance_topup', { p_user_id: user.id, p_amount: UNLOCK_COST })
      return NextResponse.json({ error: 'Failed to unlock' }, { status: 500 })
    }

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('contact_phone, contact_email')
      .eq('id', listingId)
      .single()

    return NextResponse.json({ phone: listing?.contact_phone ?? null, email: listing?.contact_email ?? null })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
