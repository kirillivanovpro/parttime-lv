'use client'

import { useEffect } from 'react'
import { incrementViewAction } from '../actions'

interface Props {
  jobId: string
}

export default function ViewTracker({ jobId }: Props) {
  useEffect(() => {
    const key = `viewed_job_${jobId}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    incrementViewAction(jobId)
  }, [jobId])

  return null
}
