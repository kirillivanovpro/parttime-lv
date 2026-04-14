import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Payment {
  id: string
  type: 'job_posting' | 'contact_unlock'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  metadata: { job_id?: string } | null
}

const typeLabel: Record<string, string> = {
  job_posting: 'Публикация вакансии',
  contact_unlock: 'Разблокировка контакта',
}

const statusStyle: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  completed: 'text-[#8BC34A] bg-[#8BC34A]/10 border-[#8BC34A]/20',
  failed: 'text-red-400 bg-red-400/10 border-red-400/20',
}

const statusLabel: Record<string, string> = {
  pending: 'Ожидание',
  completed: 'Оплачен',
  failed: 'Отменён',
}

export default async function DashboardPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('payments')
    .select('id, type, amount, currency, status, created_at, metadata')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const payments = (data ?? []) as Payment[]

  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">История платежей</h1>
            <p className="text-gray-400 text-sm mt-1">Все ваши транзакции</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Кабинет
          </Link>
        </div>

        {payments.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-white font-medium mb-1">Платежей пока нет</p>
            <p className="text-gray-500 text-sm">История транзакций появится после первой оплаты</p>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-[#2a2a2a] text-xs text-gray-500 uppercase tracking-wide">
              <span>Тип</span>
              <span className="text-right">Сумма</span>
              <span className="text-right">Статус</span>
              <span className="text-right">Дата</span>
            </div>

            {/* Rows */}
            {payments.map((p, i) => (
              <div
                key={p.id}
                className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-4 items-center ${
                  i < payments.length - 1 ? 'border-b border-[#2a2a2a]' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {typeLabel[p.type] ?? p.type}
                  </p>
                  {p.metadata?.job_id && (
                    <Link
                      href={`/jobs/${p.metadata.job_id}`}
                      className="text-gray-500 text-xs hover:text-[#8BC34A] transition-colors"
                    >
                      К вакансии →
                    </Link>
                  )}
                </div>
                <p className="text-white text-sm font-medium whitespace-nowrap">
                  €{(p.amount / 100).toFixed(2)}
                </p>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                    statusStyle[p.status] ?? 'text-gray-400 bg-gray-400/10 border-gray-400/20'
                  }`}
                >
                  {statusLabel[p.status] ?? p.status}
                </span>
                <p className="text-gray-500 text-xs whitespace-nowrap text-right">
                  {new Date(p.created_at).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
