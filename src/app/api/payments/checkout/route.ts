import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createJobPostingCheckout } from '@/lib/stripe/checkout'
import { z } from 'zod'

const bodySchema = z.object({
  job_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { job_id } = parsed.data

  // Verify ownership and draft status
  const { data: job } = await supabase
    .from('job_postings')
    .select('id, title, status, is_paid, employer_id, employer_profiles!inner(user_id)')
    .eq('id', job_id)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const employerUserId = (job.employer_profiles as unknown as { user_id: string }).user_id
  if (employerUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (job.is_paid) {
    return NextResponse.json({ error: 'Already paid' }, { status: 409 })
  }

  // Idempotency key: user+job so duplicate clicks don't create duplicate sessions
  const idempotencyKey = `job_posting_${user.id}_${job_id}`

  const session = await createJobPostingCheckout({
    jobId: job_id,
    userId: user.id,
    jobTitle: job.title,
    idempotencyKey,
  })

  return NextResponse.json({ url: session.url })
}
