import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CheckoutButton from './CheckoutButton'

interface Props {
  params: Promise<{ id: string }>
}

const PRICE_DISPLAY = ((Number(process.env.PRICE_JOB_POSTING ?? '30')) / 100).toFixed(2)

export default async function PaymentJobPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('job_postings')
    .select('id, title, status, is_paid, employer_profiles!inner(user_id)')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const employerUserId = (job.employer_profiles as unknown as { user_id: string }).user_id
  if (employerUserId !== user.id) notFound()

  if (job.is_paid) redirect(`/jobs/${id}`)

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Оплата публикации</h1>
          <p className="text-gray-400 text-sm mt-1">Активируйте вакансию на 30 дней</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 space-y-5">
          <div className="bg-[#111] rounded-xl p-4 border border-[#2a2a2a]">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Вакансия</p>
            <p className="text-white font-medium">{job.title}</p>
          </div>

          <div className="flex justify-between items-center py-3 border-t border-b border-[#2a2a2a]">
            <div>
              <p className="text-white font-medium">Публикация вакансии</p>
              <p className="text-gray-500 text-sm">Активна 30 дней · Stripe Checkout</p>
            </div>
            <p className="text-[#8BC34A] text-2xl font-bold">€{PRICE_DISPLAY}</p>
          </div>

          <CheckoutButton jobId={id} type="job_posting" label={`💳 Оплатить €${PRICE_DISPLAY} картой`} />

          <p className="text-center text-xs text-gray-600">
            🔒 Безопасная оплата через Stripe. Мы не храним данные карты.
          </p>

          <div className="border-t border-[#2a2a2a] pt-4">
            <Link
              href={`/jobs/${id}`}
              className="block text-center text-sm text-gray-500 hover:text-white transition-colors"
            >
              ← Вернуться к вакансии
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
