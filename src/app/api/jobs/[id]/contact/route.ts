import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: jobId } = await context.params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user role is 'seeker'
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.role !== 'seeker') {
    return NextResponse.json(
      { error: 'Only seekers can access employer contacts' },
      { status: 403 }
    )
  }

  // Get seeker profile for current user
  const { data: seekerProfile, error: seekerError } = await supabase
    .from('seeker_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (seekerError || !seekerProfile) {
    return NextResponse.json(
      { error: 'Seeker profile not found' },
      { status: 404 }
    )
  }

  // Check if contact is unlocked
  const { data: unlock } = await supabase
    .from('contact_unlocks')
    .select('id')
    .eq('seeker_id', seekerProfile.id)
    .eq('job_id', jobId)
    .maybeSingle()

  if (!unlock) {
    // Contact not unlocked - return locked status with price
    const price = Number(process.env.PRICE_CONTACT_UNLOCK ?? '30')
    return NextResponse.json({ locked: true, price })
  }

  // Contact is unlocked - fetch employer info
  const { data: job, error: jobError } = await supabase
    .from('job_postings')
    .select('employer_id, employer_profiles!inner(user_id)')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const employerUserId = (job.employer_profiles as unknown as { user_id: string })
    .user_id

  // Use service role to access auth.users for employer email
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceUrl || !serviceKey) {
    console.error('Missing Supabase service role credentials')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const serviceSupabase = createServiceClient(serviceUrl, serviceKey)

  const { data: employerUser, error: userError } =
    await serviceSupabase.auth.admin.getUserById(employerUserId)

  if (userError || !employerUser?.user) {
    console.error('Failed to fetch employer user:', userError)
    return NextResponse.json({ error: 'Failed to fetch contact info' }, { status: 500 })
  }

  return NextResponse.json({
    locked: false,
    phone: null,
    email: employerUser.user.email,
  })
}
