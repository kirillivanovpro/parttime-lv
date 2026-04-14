import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createJobPostingCheckout,
  createContactUnlockCheckout,
} from '@/lib/stripe/checkout'
import { z } from 'zod'

const bodySchema = z.object({
  type: z.enum(['job_posting', 'contact_unlock']),
  job_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { type, job_id } = parsed.data

  if (type === 'job_posting') {
    return handleJobPostingPayment(supabase, user.id, job_id)
  } else {
    return handleContactUnlockPayment(supabase, user.id, job_id)
  }
}

async function handleJobPostingPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  jobId: string
) {
  // Verify job belongs to current user's employer profile
  const { data: job, error: jobError } = await supabase
    .from('job_postings')
    .select('id, title, status, is_paid, employer_id, employer_profiles!inner(user_id)')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const employerUserId = (job.employer_profiles as unknown as { user_id: string })
    .user_id

  if (employerUserId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (job.is_paid || job.status !== 'draft') {
    return NextResponse.json({ error: 'Job is not eligible for payment' }, { status: 400 })
  }

  const amount = Number(process.env.PRICE_JOB_POSTING ?? '30')

  // Insert pending payment record
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      type: 'job_posting',
      amount,
      currency: 'eur',
      stripe_session_id: null,
      status: 'pending',
      metadata: { job_id: jobId },
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    console.error('Payment insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const idempotencyKey = `job_posting_${userId}_${jobId}`

  try {
    const session = await createJobPostingCheckout({
      jobId,
      userId,
      jobTitle: job.title,
      paymentDbId: payment.id,
      idempotencyKey,
    })

    // Update payment record with Stripe session ID
    await supabase
      .from('payments')
      .update({ stripe_session_id: session.id })
      .eq('id', payment.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe session creation error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

async function handleContactUnlockPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  jobId: string
) {
  // Verify user role is 'seeker'
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (profile.role !== 'seeker') {
    return NextResponse.json(
      { error: 'Only seekers can unlock contacts' },
      { status: 403 }
    )
  }

  // Get seeker profile for current user
  const { data: seekerProfile, error: seekerError } = await supabase
    .from('seeker_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (seekerError || !seekerProfile) {
    return NextResponse.json(
      { error: 'Seeker profile not found. Please complete your profile first.' },
      { status: 404 }
    )
  }

  // Check if already unlocked
  const { data: existingUnlock } = await supabase
    .from('contact_unlocks')
    .select('id')
    .eq('seeker_id', seekerProfile.id)
    .eq('job_id', jobId)
    .maybeSingle()

  if (existingUnlock) {
    return NextResponse.json({ already_unlocked: true }, { status: 200 })
  }

  // Verify job is active and paid
  const { data: job, error: jobError } = await supabase
    .from('job_postings')
    .select('id, title, status, is_paid, employer_id')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status !== 'active' || !job.is_paid) {
    return NextResponse.json({ error: 'Job is not available' }, { status: 400 })
  }

  const amount = Number(process.env.PRICE_CONTACT_UNLOCK ?? '30')

  // Insert pending payment record
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      type: 'contact_unlock',
      amount,
      currency: 'eur',
      stripe_session_id: null,
      status: 'pending',
      metadata: { job_id: jobId, seeker_id: seekerProfile.id },
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    console.error('Payment insert error:', insertError)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const idempotencyKey = `contact_unlock_${userId}_${jobId}`

  try {
    const session = await createContactUnlockCheckout({
      jobId,
      userId,
      jobTitle: job.title,
      seekerId: seekerProfile.id,
      paymentDbId: payment.id,
      idempotencyKey,
    })

    // Update payment record with Stripe session ID
    await supabase
      .from('payments')
      .update({ stripe_session_id: session.id })
      .eq('id', payment.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe session creation error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
