import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { ListingCategory } from '@/lib/types'

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

    const body = await request.json() as {
      title: string
      description: string | null
      category: ListingCategory
      price: number | null
      location: string | null
      contact_phone: string | null
      contact_email: string | null
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const LISTING_COST = 0.5

    const { data: deductResult } = await supabaseAdmin.rpc('deduct_balance', {
      p_user_id: user.id,
      p_amount: LISTING_COST,
      p_type: 'listing',
    })

    const deductData = deductResult as { ok?: boolean; error?: string } | null
    if (deductData?.error) {
      return NextResponse.json({ error: deductData.error }, { status: 400 })
    }

    const { data: listing, error: insertError } = await supabaseAdmin
      .from('listings')
      .insert({
        user_id: user.id,
        title: body.title.trim(),
        description: body.description,
        category: body.category,
        price: body.price,
        location: body.location,
        contact_phone: body.contact_phone,
        contact_email: body.contact_email,
        is_paid: true,
        is_active: true,
      })
      .select('id')
      .single()

    if (insertError) {
      await supabaseAdmin.rpc('complete_balance_topup', { p_user_id: user.id, p_amount: LISTING_COST })
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
    }

    return NextResponse.json({ id: listing.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
