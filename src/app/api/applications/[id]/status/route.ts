import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['viewed', 'invited', 'rejected']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { id: applicationId } = await params

  // Validate applicationId is UUID
  const uuidSchema = z.string().uuid()
  const parsedId = uuidSchema.safeParse(applicationId)
  if (!parsedId.success) {
    return NextResponse.json(
      { error: 'Invalid application ID' },
      { status: 400 }
    )
  }

  // Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid status', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Verify employer owns the job for this application
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select(`
      id,
      job_postings!inner (
        id,
        employer_profiles!inner (
          id,
          user_id
        )
      )
    `)
    .eq('id', applicationId)
    .single()

  if (fetchError || !application) {
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    )
  }

  // Check ownership
  const jobPosting = application.job_postings as unknown as {
    id: string
    employer_profiles: { id: string; user_id: string }
  }

  if (jobPosting.employer_profiles.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  // Update status
  const { error: updateError } = await supabase
    .from('applications')
    .update({ status: parsed.data.status })
    .eq('id', applicationId)

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
