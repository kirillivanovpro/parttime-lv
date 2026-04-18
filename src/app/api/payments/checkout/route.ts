import { NextResponse } from 'next/server'

// This endpoint is deprecated — use /api/payments/create-session instead
export async function POST() {
  return NextResponse.json(
    { error: 'Deprecated. Use /api/payments/create-session' },
    { status: 410 }
  )
}
