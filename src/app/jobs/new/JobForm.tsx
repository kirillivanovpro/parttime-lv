'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createJobAction, type JobFormState } from '../actions'
import { JOB_CATEGORIES, JOB_SCHEDULES } from '@/lib/jobs'

const inputClass =
  'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#8BC34A] transition-colors'

const FieldError = ({ errors }: { errors?: string[] }) =>
  errors?.[0] ? <p className="text-red-400 text-xs mt-1">{errors[0]}</p> : null

export default function JobForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<JobFormState, FormData>(
    createJobAction,
    null
  )

  // If action completed without error and without redirect (unexpected), go home
  useEffect(() => {
    if (state !== null && !state?.error) {
      router.push('/')
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-5">
      {state?.error?._form && (
        <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {state.error._form}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Название вакансии <span className="text-red-400">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          placeholder="Кассир в супермаркет"
          className={inputClass}
        />
        <FieldError errors={state?.error?.title} />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">
          Описание <span className="text-red-400">*</span>
        </label>
        <textarea
          name="description"
          rows={6}
          required
          maxLength={5000}
          placeholder="Обязанности, требования, условия работы..."
          className={`${inputClass} resize-none`}
        />
        <FieldError errors={state?.error?.description} />
      </div>

      {/* Category + City */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Категория</label>
          <select name="category" className={inputClass}>
            <option value="">Выберите...</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <FieldError errors={state?.error?.category} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            Город <span className="text-red-400">*</span>
          </label>
          <input
            name="city"
            type="text"
            required
            placeholder="Рига"
            className={inputClass}
          />
          <FieldError errors={state?.error?.city} />
        </div>
      </div>

      {/* Schedule + Hours */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">График</label>
          <select name="schedule" className={inputClass}>
            <option value="">Выберите...</option>
            {JOB_SCHEDULES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <FieldError errors={state?.error?.schedule} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Часов в неделю</label>
          <input
            name="hours_per_week"
            type="number"
            min={1}
            max={40}
            placeholder="20"
            className={inputClass}
          />
          <FieldError errors={state?.error?.hours_per_week} />
        </div>
      </div>

      {/* Salary */}
      <div>
        <label className="block text-sm text-gray-400 mb-1">Зарплата (€/месяц)</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input
              name="salary_min"
              type="number"
              min={1}
              placeholder="от 500"
              className={inputClass}
            />
            <FieldError errors={state?.error?.salary_min} />
          </div>
          <div>
            <input
              name="salary_max"
              type="number"
              min={1}
              placeholder="до 800"
              className={inputClass}
            />
            <FieldError errors={state?.error?.salary_max} />
          </div>
        </div>
      </div>

      {/* Payment notice */}
      <div className="bg-[#8BC34A]/5 border border-[#8BC34A]/20 rounded-xl p-4">
        <p className="text-sm text-gray-300">
          После создания вакансии потребуется оплата <strong className="text-[#8BC34A]">€10</strong> для её активации.
          Вакансия будет активна <strong className="text-white">30 дней</strong>.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#8BC34A] text-black font-bold py-3 rounded-xl hover:bg-[#9DD45B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Создание...' : 'Создать вакансию →'}
      </button>
    </form>
  )
}
