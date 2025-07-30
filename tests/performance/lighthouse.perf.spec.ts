import { test, expect } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

interface LighthouseResults {
  categories: {
    performance: { score: number }
    accessibility: { score: number }
    'best-practices': { score: number }
    seo: { score: number }
  }
  audits: {
    'first-contentful-paint': { numericValue: number }
    'largest-contentful-paint': { numericValue: number }
    'first-input-delay': { numericValue: number }
    'cumulative-layout-shift': { numericValue: number }
    'total-blocking-time': { numericValue: number }
  }
}

test.describe('Performance Tests with Lighthouse', () => {
  const lighthouseOutputDir = 'lighthouse-reports'
  
  test.beforeAll(async () => {
    // Ensure output directory exists
    try {
      await fs.mkdir(lighthouseOutputDir, { recursive: true })
    } catch (error) {
      // Directory already exists
    }
  })

  test('Homepage should meet Core Web Vitals thresholds', async ({ page }) => {
    const url = 'http://localhost:3000'
    const outputPath = path.join(lighthouseOutputDir, 'homepage-lighthouse.json')
    
    // Run Lighthouse against the homepage
    const command = `npx lighthouse ${url} --output=json --output-path=${outputPath} --preset=desktop --chrome-flags="--headless --no-sandbox"`
    
    try {
      await execAsync(command)
      
      // Read and parse results
      const resultsJson = await fs.readFile(outputPath, 'utf-8')
      const results: LighthouseResults = JSON.parse(resultsJson)
      
      // Performance thresholds (Lighthouse scores are 0-1, multiply by 100 for percentage)
      expect(results.categories.performance.score * 100).toBeGreaterThanOrEqual(80)
      expect(results.categories.accessibility.score * 100).toBeGreaterThanOrEqual(90)
      expect(results.categories.seo.score * 100).toBeGreaterThanOrEqual(90)
      expect(results.categories['best-practices'].score * 100).toBeGreaterThanOrEqual(90)
      
      // Core Web Vitals thresholds
      expect(results.audits['largest-contentful-paint'].numericValue).toBeLessThanOrEqual(2500) // LCP < 2.5s
      expect(results.audits['first-input-delay'].numericValue).toBeLessThanOrEqual(100) // FID < 100ms
      expect(results.audits['cumulative-layout-shift'].numericValue).toBeLessThanOrEqual(0.1) // CLS < 0.1
      expect(results.audits['first-contentful-paint'].numericValue).toBeLessThanOrEqual(1800) // FCP < 1.8s
      expect(results.audits['total-blocking-time'].numericValue).toBeLessThanOrEqual(300) // TBT < 300ms
      
      console.log('Homepage Performance Metrics:', {
        performance: (results.categories.performance.score * 100).toFixed(1) + '%',
        accessibility: (results.categories.accessibility.score * 100).toFixed(1) + '%',
        seo: (results.categories.seo.score * 100).toFixed(1) + '%',
        lcp: results.audits['largest-contentful-paint'].numericValue + 'ms',
        fid: results.audits['first-input-delay'].numericValue + 'ms',
        cls: results.audits['cumulative-layout-shift'].numericValue,
        fcp: results.audits['first-contentful-paint'].numericValue + 'ms',
        tbt: results.audits['total-blocking-time'].numericValue + 'ms',
      })
      
    } catch (error) {
      console.error('Lighthouse test failed:', error)
      throw error
    }
  })

  test('Search page should meet performance thresholds', async ({ page }) => {
    const url = 'http://localhost:3000/search'
    const outputPath = path.join(lighthouseOutputDir, 'search-lighthouse.json')
    
    const command = `npx lighthouse ${url} --output=json --output-path=${outputPath} --preset=desktop --chrome-flags="--headless --no-sandbox"`
    
    try {
      await execAsync(command)
      
      const resultsJson = await fs.readFile(outputPath, 'utf-8')
      const results: LighthouseResults = JSON.parse(resultsJson)
      
      // Slightly more lenient for interactive pages
      expect(results.categories.performance.score * 100).toBeGreaterThanOrEqual(75)
      expect(results.categories.accessibility.score * 100).toBeGreaterThanOrEqual(90)
      expect(results.categories.seo.score * 100).toBeGreaterThanOrEqual(85)
      
      console.log('Search Page Performance Metrics:', {
        performance: (results.categories.performance.score * 100).toFixed(1) + '%',
        accessibility: (results.categories.accessibility.score * 100).toFixed(1) + '%',
        seo: (results.categories.seo.score * 100).toFixed(1) + '%',
      })
      
    } catch (error) {
      console.error('Search page Lighthouse test failed:', error)
      throw error
    }
  })

  test('Mobile performance should meet thresholds', async ({ page }) => {
    const url = 'http://localhost:3000'
    const outputPath = path.join(lighthouseOutputDir, 'mobile-lighthouse.json')
    
    // Mobile preset with throttling
    const command = `npx lighthouse ${url} --output=json --output-path=${outputPath} --preset=mobile --chrome-flags="--headless --no-sandbox"`
    
    try {
      await execAsync(command)
      
      const resultsJson = await fs.readFile(outputPath, 'utf-8')
      const results: LighthouseResults = JSON.parse(resultsJson)
      
      // More lenient thresholds for mobile due to throttling
      expect(results.categories.performance.score * 100).toBeGreaterThanOrEqual(70)
      expect(results.categories.accessibility.score * 100).toBeGreaterThanOrEqual(90)
      
      // Mobile Core Web Vitals (more lenient)
      expect(results.audits['largest-contentful-paint'].numericValue).toBeLessThanOrEqual(4000) // LCP < 4s on mobile
      expect(results.audits['cumulative-layout-shift'].numericValue).toBeLessThanOrEqual(0.1) // CLS < 0.1
      
      console.log('Mobile Performance Metrics:', {
        performance: (results.categories.performance.score * 100).toFixed(1) + '%',
        accessibility: (results.categories.accessibility.score * 100).toFixed(1) + '%',
        lcp: results.audits['largest-contentful-paint'].numericValue + 'ms',
        cls: results.audits['cumulative-layout-shift'].numericValue,
      })
      
    } catch (error) {
      console.error('Mobile Lighthouse test failed:', error)
      throw error
    }
  })

  test('Bundle size should be within limits', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Measure bundle sizes using Network API
    const responses = new Map()
    
    page.on('response', response => {
      if (response.url().includes('/_next/static/') && response.url().endsWith('.js')) {
        responses.set(response.url(), response)
      }
    })
    
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    let totalBundleSize = 0
    let mainBundleSize = 0
    
    for (const [url, response] of responses) {
      try {
        const buffer = await response.body()
        const size = buffer.length
        totalBundleSize += size
        
        if (url.includes('main') || url.includes('pages')) {
          mainBundleSize += size
        }
      } catch (error) {
        // Some responses might not be available
      }
    }
    
    // Bundle size thresholds (in bytes)
    expect(mainBundleSize).toBeLessThanOrEqual(500 * 1024) // Main bundle < 500KB
    expect(totalBundleSize).toBeLessThanOrEqual(2 * 1024 * 1024) // Total < 2MB
    
    console.log('Bundle Size Metrics:', {
      mainBundle: (mainBundleSize / 1024).toFixed(1) + 'KB',
      totalBundle: (totalBundleSize / 1024).toFixed(1) + 'KB',
    })
  })
})