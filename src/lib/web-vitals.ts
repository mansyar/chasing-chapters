'use client'

import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals'

interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType?: string
}

interface PerformanceBudget {
  name: string
  budget: number
  actual: number
  status: 'pass' | 'warn' | 'fail'
  unit: string
}

/**
 * Web Vitals tracking and performance monitoring
 */
export class WebVitalsTracker {
  private static instance: WebVitalsTracker
  private metrics: WebVitalMetric[] = []
  private isInitialized = false

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): WebVitalsTracker {
    if (!WebVitalsTracker.instance) {
      WebVitalsTracker.instance = new WebVitalsTracker()
    }
    return WebVitalsTracker.instance
  }

  /**
   * Initialize Web Vitals tracking
   */
  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return
    }

    this.isInitialized = true

    // Track Core Web Vitals
    onCLS(this.handleMetric.bind(this))
    onFID(this.handleMetric.bind(this))
    onFCP(this.handleMetric.bind(this))
    onLCP(this.handleMetric.bind(this))
    onTTFB(this.handleMetric.bind(this))

    // Monitor performance budgets
    this.monitorPerformanceBudgets()

    console.log('🔍 Web Vitals tracking initialized')
  }

  /**
   * Handle individual metric data
   */
  private handleMetric(metric: WebVitalMetric): void {
    this.metrics.push(metric)

    // Log metric for debugging
    console.log(`📊 ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    })

    // Send to analytics
    this.sendToAnalytics(metric)

    // Check thresholds and warn if needed
    this.checkThresholds(metric)
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: WebVitalMetric): void {
    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        event_label: metric.id,
        non_interaction: true,
        custom_map: {
          metric_rating: metric.rating,
        }
      })
    }

    // Send to custom analytics endpoint (optional)
    if (process.env.NODE_ENV === 'production') {
      this.sendToCustomAnalytics(metric)
    }
  }

  /**
   * Send to custom analytics endpoint
   */
  private async sendToCustomAnalytics(metric: WebVitalMetric): Promise<void> {
    try {
      await fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      })
    } catch (error) {
      console.error('Failed to send Web Vitals to analytics:', error)
    }
  }

  /**
   * Check metric thresholds and warn
   */
  private checkThresholds(metric: WebVitalMetric): void {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    }

    const threshold = thresholds[metric.name as keyof typeof thresholds]
    if (!threshold) return

    if (metric.value > threshold.poor) {
      console.warn(`⚠️ Poor ${metric.name}: ${metric.value}ms (threshold: ${threshold.poor}ms)`)
      
      // Send alert in production
      if (process.env.NODE_ENV === 'production') {
        this.sendPerformanceAlert(metric, 'poor')
      }
    } else if (metric.value > threshold.good) {
      console.warn(`⚠️ Needs improvement ${metric.name}: ${metric.value}ms (threshold: ${threshold.good}ms)`)
    }
  }

  /**
   * Send performance alerts
   */
  private async sendPerformanceAlert(metric: WebVitalMetric, severity: 'poor' | 'warn'): Promise<void> {
    // Implementation would depend on your alerting system
    // This could send to Slack, email, monitoring service, etc.
    console.error(`🚨 Performance Alert: ${metric.name} is ${severity} (${metric.value})`)
  }

  /**
   * Monitor performance budgets
   */
  private monitorPerformanceBudgets(): void {
    if (typeof window === 'undefined') return

    // Check when page is fully loaded
    window.addEventListener('load', () => {
      setTimeout(() => {
        const budgets = this.checkPerformanceBudgets()
        this.reportBudgetStatus(budgets)
      }, 1000) // Wait a bit for metrics to stabilize
    })
  }

  /**
   * Check performance budgets
   */
  private checkPerformanceBudgets(): PerformanceBudget[] {
    const budgets: PerformanceBudget[] = []

    // Check bundle size (estimate from loaded resources)
    const jsSize = this.estimateJavaScriptSize()
    budgets.push({
      name: 'JavaScript Bundle Size',
      budget: 500 * 1024, // 500KB
      actual: jsSize,
      status: jsSize <= 500 * 1024 ? 'pass' : jsSize <= 750 * 1024 ? 'warn' : 'fail',
      unit: 'bytes'
    })

    // Check image optimization
    const imageMetrics = this.checkImageOptimization()
    budgets.push({
      name: 'Image Optimization',
      budget: 90, // 90% should be optimized
      actual: imageMetrics.optimizedPercentage,
      status: imageMetrics.optimizedPercentage >= 90 ? 'pass' : imageMetrics.optimizedPercentage >= 70 ? 'warn' : 'fail',
      unit: 'percentage'
    })

    // Check Core Web Vitals from collected metrics
    const lcp = this.metrics.find(m => m.name === 'LCP')
    if (lcp) {
      budgets.push({
        name: 'Largest Contentful Paint',
        budget: 2500,
        actual: lcp.value,
        status: lcp.value <= 2500 ? 'pass' : lcp.value <= 4000 ? 'warn' : 'fail',
        unit: 'ms'
      })
    }

    const fid = this.metrics.find(m => m.name === 'FID')
    if (fid) {
      budgets.push({
        name: 'First Input Delay',
        budget: 100,
        actual: fid.value,
        status: fid.value <= 100 ? 'pass' : fid.value <= 300 ? 'warn' : 'fail',
        unit: 'ms'
      })
    }

    const cls = this.metrics.find(m => m.name === 'CLS')
    if (cls) {
      budgets.push({
        name: 'Cumulative Layout Shift',
        budget: 0.1,
        actual: cls.value,
        status: cls.value <= 0.1 ? 'pass' : cls.value <= 0.25 ? 'warn' : 'fail',
        unit: 'score'
      })
    }

    return budgets
  }

  /**
   * Estimate JavaScript bundle size
   */
  private estimateJavaScriptSize(): number {
    if (typeof document === 'undefined') return 0

    let totalSize = 0
    const scripts = document.querySelectorAll('script[src]')
    
    // This is an approximation - in reality you'd want to use
    // Navigation Timing API or Resource Timing API
    scripts.forEach((script) => {
      const src = (script as HTMLScriptElement).src
      if (src && src.includes('_next')) {
        // Estimate based on typical Next.js bundle sizes
        totalSize += 200 * 1024 // ~200KB per chunk estimate
      }
    })

    return totalSize
  }

  /**
   * Check image optimization
   */
  private checkImageOptimization(): { optimizedPercentage: number; totalImages: number } {
    if (typeof document === 'undefined') return { optimizedPercentage: 100, totalImages: 0 }

    const images = document.querySelectorAll('img')
    let optimizedCount = 0
    const totalImages = images.length

    images.forEach((img) => {
      const src = img.src
      // Check if using Next.js Image optimization or modern formats
      if (src.includes('_next/image') || src.includes('.webp') || src.includes('.avif')) {
        optimizedCount++
      }
    })

    return {
      optimizedPercentage: totalImages > 0 ? (optimizedCount / totalImages) * 100 : 100,
      totalImages
    }
  }

  /**
   * Report budget status
   */
  private reportBudgetStatus(budgets: PerformanceBudget[]): void {
    const failures = budgets.filter(b => b.status === 'fail')
    const warnings = budgets.filter(b => b.status === 'warn')

    console.group('📊 Performance Budget Report')
    budgets.forEach(budget => {
      const icon = budget.status === 'pass' ? '✅' : budget.status === 'warn' ? '⚠️' : '❌'
      const actualFormatted = budget.unit === 'bytes' 
        ? `${(budget.actual / 1024).toFixed(1)}KB`
        : budget.unit === 'percentage'
        ? `${budget.actual.toFixed(1)}%`
        : `${budget.actual.toFixed(1)}${budget.unit}`
      
      const budgetFormatted = budget.unit === 'bytes'
        ? `${(budget.budget / 1024).toFixed(1)}KB`
        : budget.unit === 'percentage'
        ? `${budget.budget.toFixed(1)}%`
        : `${budget.budget.toFixed(1)}${budget.unit}`

      console.log(`${icon} ${budget.name}: ${actualFormatted} (budget: ${budgetFormatted})`)
    })
    console.groupEnd()

    if (failures.length > 0) {
      console.error(`🚨 ${failures.length} performance budget(s) failed`)
    }
    if (warnings.length > 0) {
      console.warn(`⚠️ ${warnings.length} performance budget(s) need attention`)
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): WebVitalMetric[] {
    return [...this.metrics]
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    coreWebVitals: { [key: string]: number | string }
    budgetStatus: { pass: number; warn: number; fail: number }
  } {
    const budgets = this.checkPerformanceBudgets()
    const budgetStatus = {
      pass: budgets.filter(b => b.status === 'pass').length,
      warn: budgets.filter(b => b.status === 'warn').length,
      fail: budgets.filter(b => b.status === 'fail').length,
    }

    const coreWebVitals: { [key: string]: number | string } = {}
    this.metrics.forEach(metric => {
      coreWebVitals[metric.name] = metric.value
      coreWebVitals[`${metric.name}_rating`] = metric.rating
    })

    return { coreWebVitals, budgetStatus }
  }
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals(): void {
  if (typeof window !== 'undefined') {
    const tracker = WebVitalsTracker.getInstance()
    tracker.init()
  }
}

/**
 * Hook for React components to access Web Vitals data
 */
export function useWebVitals() {
  const tracker = WebVitalsTracker.getInstance()
  
  return {
    getMetrics: () => tracker.getMetrics(),
    getPerformanceSummary: () => tracker.getPerformanceSummary(),
  }
}

/**
 * Simple Web Vitals tracking function (for backwards compatibility)
 */
export function trackWebVitals(): void {
  initWebVitals()
}