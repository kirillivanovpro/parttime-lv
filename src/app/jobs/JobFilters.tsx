'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { JOB_CATEGORIES, JOB_SCHEDULES } from '@/lib/jobs'

const selectClass =
  'bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8BC34A] transition-colors'

export default function JobFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // reset pagination on filter change
      router.push(`/jobs?${params.toString()}`)
    },
    [router, searchParams]
  )

  const clearAll = () => router.push('/jobs')

  const hasFilters =
    searchParams.has('city') ||
    searchParams.has('category') ||
    searchParams.has('schedule') ||
    searchParams.has('salary_min')

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 mb-6">
      <div className="flex flex-wrap gap-3 items-end">
        {/* City */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Город</label>
          <input
            type="text"
            placeholder="Рига"
            defaultValue={searchParams.get('city') ?? ''}
            onBlur={(e) => update('city', e.target.value.trim())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') update('city', (e.target as HTMLInputElement).value.trim())
            }}
            className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors w-32"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Категория</label>
          <select
            value={searchParams.get('category') ?? ''}
            onChange={(e) => update('category', e.target.value)}
            className={selectClass}
          >
            <option value="">Все</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Schedule */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">График</label>
          <select
            value={searchParams.get('schedule') ?? ''}
            onChange={(e) => update('schedule', e.target.value)}
            className={selectClass}
          >
            <option value="">Любой</option>
            {JOB_SCHEDULES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Min salary */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Зарплата от (€)</label>
          <input
            type="number"
            min={1}
            placeholder="500"
            defaultValue={searchParams.get('salary_min') ?? ''}
            onBlur={(e) => update('salary_min', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') update('salary_min', (e.target as HTMLInputElement).value)
            }}
            className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors w-28"
          />
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-gray-400 hover:text-white border border-[#2a2a2a] hover:border-[#8BC34A]/40 px-3 py-2 rounded-lg transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>
    </div>
  )
}
