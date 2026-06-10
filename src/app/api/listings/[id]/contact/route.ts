import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
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

    const { data: unlock } = await supabaseAdmin
      .from('contact_unlocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
      .maybeSingle()

    if (!unlock) {
      return NextResponse.json({ error: 'Not unlocked' }, { status: 403 })
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
