import type { JobCategory, JobSchedule } from '@/types'

export const JOB_CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: 'retail', label: 'Торговля' },
  { value: 'hospitality', label: 'Гостиничный бизнес / HoReCa' },
  { value: 'warehouse', label: 'Склад / Логистика' },
  { value: 'office', label: 'Офис' },
  { value: 'other', label: 'Другое' },
]

export const JOB_SCHEDULES: { value: JobSchedule; label: string }[] = [
  { value: 'mornings', label: 'Утро (до 12:00)' },
  { value: 'evenings', label: 'Вечер (после 18:00)' },
  { value: 'weekends', label: 'Выходные' },
  { value: 'flexible', label: 'Гибкий график' },
  { value: 'shifts', label: 'Сменный график' },
]

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = Object.fromEntries(
  JOB_CATEGORIES.map(({ value, label }) => [value, label])
) as Record<JobCategory, string>

export const JOB_SCHEDULE_LABELS: Record<JobSchedule, string> = Object.fromEntries(
  JOB_SCHEDULES.map(({ value, label }) => [value, label])
) as Record<JobSchedule, string>
