'use client'

import { useTransition } from 'react'
import { pauseJobAction, resumeJobAction, closeJobAction } from '@/app/jobs/actions'
import { useRouter } from 'next/navigation'

interface Props {
  jobId: string
  status: string
  isPaid: boolean
  expiresAt: string | null
}

export default function JobActions({ jobId, status, isPaid, expiresAt }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const expired = expiresAt ? new Date(expiresAt) < new Date() : false

  function run(action: (id: string) => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action(jobId)
      if (result.error) {
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status === 'draft' && (
        <a
          href={`/payment/job/${jobId}`}
          className="text-xs bg-[#8BC34A] text-black font-medium px-3 py-1.5 rounded-lg hover:bg-[#9DD45B] transition-colors"
        >
          Оплатить
        </a>
      )}
      {status === 'active' && (
        <button
          onClick={() => run(pauseJobAction)}
          disabled={isPending}
          className="text-xs border border-[#2a2a2a] hover:border-yellow-600/50 text-gray-400 hover:text-yellow-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          Пауза
        </button>
      )}
      {status === 'paused' && isPaid && !expired && (
        <button
          onClick={() => run(resumeJobAction)}
          disabled={isPending}
          className="text-xs border border-[#2a2a2a] hover:border-[#8BC34A]/50 text-gray-400 hover:text-[#8BC34A] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          Возобновить
        </button>
      )}
      {(status === 'active' || status === 'paused' || status === 'draft') && (
        <button
          onClick={() => {
            if (confirm('Закрыть вакансию? Это действие необратимо.')) run(closeJobAction)
          }}
          disabled={isPending}
          className="text-xs border border-[#2a2a2a] hover:border-red-600/50 text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          Закрыть
        </button>
      )}
      <a
        href={`/jobs/${jobId}`}
        className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1.5"
      >
        Просмотр
      </a>
    </div>
  )
}
