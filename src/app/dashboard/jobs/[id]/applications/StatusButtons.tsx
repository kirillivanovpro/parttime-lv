'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateApplicationStatusAction } from '@/app/dashboard/applications/actions'
import { useState } from 'react'

interface Props {
  applicationId: string
  currentStatus: string
}

export default function StatusButtons({ applicationId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleStatusUpdate = (newStatus: 'viewed' | 'invited' | 'rejected') => {
    setError(null)
    startTransition(async () => {
      const result = await updateApplicationStatusAction(applicationId, newStatus)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {currentStatus === 'new' && (
          <button
            onClick={() => handleStatusUpdate('viewed')}
            disabled={isPending}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Просмотрен
          </button>
        )}
        {currentStatus !== 'invited' && currentStatus !== 'rejected' && (
          <button
            onClick={() => handleStatusUpdate('invited')}
            disabled={isPending}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#8BC34A]/40 text-[#8BC34A] hover:bg-[#8BC34A]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Пригласить
          </button>
        )}
        {currentStatus !== 'rejected' && (
          <button
            onClick={() => handleStatusUpdate('rejected')}
            disabled={isPending}
            className="text-xs px-3 py-1.5 rounded-lg border border-red-600/40 text-red-400 hover:bg-red-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отклонить
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
