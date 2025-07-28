#!/usr/bin/env node

/**
 * Image Performance Measurement Script
 * 
 * This script measures image loading performance before and after optimization.
 * Run with: node scripts/measure-image-performance.js
 */

const { chromium } = require('playwright')

async function measureImagePerformance() {
  console.log('🚀 Starting image performance measurement...\n')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  // Enable performance monitoring
  await page.coverage.startJSCoverage()
  
  const metrics = {
    totalImages: 0,
    imagesLoaded: 0,
    imagesFailed: 0,
    averageLoadTime: 0,
    totalBytes: 0,
    webpSupport: 0,
    avifSupport: 0,
    cacheHits: 0
  }

  const loadTimes = []
  const startTime = Date.now()

  // Track image requests
  page.on('response', async response => {
    const url = response.url()
    const isImage = url.match(/\.(jpg|jpeg|png|webp|avif)$/) || url.includes('/_next/image')
    
    if (isImage) {
      metrics.totalImages++
      
      try {
        const contentLength = response.headers()['content-length']
        if (contentLength) {
          metrics.totalBytes += parseInt(contentLength)
        }

        if (response.status() >= 200 && response.status() < 300) {
          metrics.imagesLoaded++
          loadTimes.push(Date.now() - startTime)
        } else {
          metrics.imagesFailed++
        }

        // Check format optimization
        const contentType = response.headers()['content-type']
        if (contentType?.includes('webp')) {
          metrics.webpSupport++
        }
        if (contentType?.includes('avif')) {
          metrics.avifSupport++
        }

        // Check cache hits
        const cacheControl = response.headers()['cache-control']
        if (cacheControl && cacheControl.includes('max-age')) {
          metrics.cacheHits++
        }

      } catch (error) {
        console.warn(`Error processing image response: ${error.message}`)
      }
    }
  })

  try {
    // Test different pages
    const testPages = ['/', '/reviews', '/about']
    
    for (const testPage of testPages) {
      console.log(`📊 Testing page: ${testPage}`)
      
      const pageStartTime = Date.now()
      await page.goto(`http://localhost:3000${testPage}`)
      await page.waitForLoadState('networkidle')
      
      const pageLoadTime = Date.now() - pageStartTime
      console.log(`   Page load time: ${pageLoadTime}ms`)
      
      // Wait a bit for lazy-loaded images
      await page.waitForTimeout(2000)
    }

    // Calculate metrics
    if (loadTimes.length > 0) {
      metrics.averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
    }

    // Generate report
    console.log('\n📈 Image Performance Report')
    console.log('=' .repeat(50))
    console.log(`Total images detected: ${metrics.totalImages}`)
    console.log(`Images loaded successfully: ${metrics.imagesLoaded}`)
    console.log(`Images failed to load: ${metrics.imagesFailed}`)
    console.log(`Average load time: ${Math.round(metrics.averageLoadTime)}ms`)
    console.log(`Total image bytes: ${(metrics.totalBytes / 1024).toFixed(2)} KB`)
    console.log(`WebP optimized images: ${metrics.webpSupport}`)
    console.log(`AVIF optimized images: ${metrics.avifSupport}`)
    console.log(`Images with cache headers: ${metrics.cacheHits}`)
    
    // Calculate optimization score
    const successRate = metrics.totalImages > 0 ? (metrics.imagesLoaded / metrics.totalImages) * 100 : 100
    const formatOptimization = metrics.totalImages > 0 ? ((metrics.webpSupport + metrics.avifSupport) / metrics.totalImages) * 100 : 0
    const cacheOptimization = metrics.totalImages > 0 ? (metrics.cacheHits / metrics.totalImages) * 100 : 0
    
    console.log('\n🎯 Optimization Scores')
    console.log('=' .repeat(30))
    console.log(`Success rate: ${successRate.toFixed(1)}%`)
    console.log(`Format optimization: ${formatOptimization.toFixed(1)}%`)
    console.log(`Cache optimization: ${cacheOptimization.toFixed(1)}%`)
    
    const overallScore = (successRate + formatOptimization + cacheOptimization) / 3
    console.log(`Overall score: ${overallScore.toFixed(1)}%`)

    // Recommendations
    console.log('\n💡 Recommendations')
    console.log('=' .repeat(20))
    
    if (successRate < 95) {
      console.log('- Fix failed image loads')
    }
    if (formatOptimization < 80) {
      console.log('- Enable more modern image formats (WebP/AVIF)')
    }
    if (cacheOptimization < 90) {
      console.log('- Improve image caching headers')
    }
    if (metrics.averageLoadTime > 2000) {
      console.log('- Optimize image loading performance')
    }
    if (metrics.totalBytes / metrics.totalImages > 50000) {
      console.log('- Reduce average image file size')
    }

    if (overallScore >= 90) {
      console.log('✅ Excellent image optimization!')
    } else if (overallScore >= 75) {
      console.log('✅ Good image optimization')
    } else {
      console.log('⚠️  Image optimization needs improvement')
    }

  } catch (error) {
    console.error(`❌ Error during performance measurement: ${error.message}`)
  } finally {
    await browser.close()
  }
}

// Run the measurement
measureImagePerformance()
  .then(() => {
    console.log('\n✅ Performance measurement completed!')
  })
  .catch(error => {
    console.error(`❌ Failed to measure performance: ${error.message}`)
    process.exit(1)
  })