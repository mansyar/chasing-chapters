'use client'

import { useEffect } from 'react'
import { initWebVitals } from '@/lib/web-vitals'

/**
 * Client-side component to initialize Web Vitals tracking
 */
export default function WebVitalsTracker() {
  useEffect(() => {
    initWebVitals()
  }, [])

  return null
}