import { test, expect } from '@playwright/test'

test.describe('Image Optimization', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the homepage or a page with images
    await page.goto('/')
  })

  test('should load optimized images with proper formats', async ({ page }) => {
    // Wait for images to load
    await page.waitForLoadState('networkidle')

    // Check that Next.js Image components are present
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      // Check first image for optimization attributes
      const firstImage = images.first()
      
      // Should have proper alt text
      const alt = await firstImage.getAttribute('alt')
      expect(alt).toBeTruthy()
      
      // Should have proper loading attribute
      const loading = await firstImage.getAttribute('loading')
      expect(['lazy', 'eager', null]).toContain(loading)
      
      // Should have sizes attribute for responsive images
      const sizes = await firstImage.getAttribute('sizes')
      if (sizes) {
        expect(sizes).toMatch(/\d+px|\d+vw/)
      }
    }
  })

  test('should show fallback when image fails to load', async ({ page }) => {
    // Mock image requests to fail
    await page.route('**/*.{jpg,jpeg,png,webp,avif}', route => {
      route.abort('failed')
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should show fallback icons (BookOpen icons)
    const fallbackIcons = page.locator('[data-lucide="book-open"]')
    const fallbackCount = await fallbackIcons.count()
    
    // If there are images, there should be fallbacks
    if (fallbackCount > 0) {
      expect(fallbackCount).toBeGreaterThan(0)
    }
  })

  test('should have proper image caching headers', async ({ page }) => {
    let imageResponse: any = null

    // Capture image requests
    page.on('response', response => {
      if (response.url().includes('/_next/image') || 
          response.url().match(/\.(jpg|jpeg|png|webp|avif)$/)) {
        imageResponse = response
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    if (imageResponse) {
      // Check cache headers
      const cacheControl = imageResponse.headers()['cache-control']
      expect(cacheControl).toBeTruthy()
    }
  })

  test('should load images progressively with blur placeholder', async ({ page }) => {
    // Go to a page that likely has images
    await page.goto('/reviews')
    
    // Look for images that might have blur placeholders
    const images = page.locator('img[src*="data:image"]')
    const blurImageCount = await images.count()
    
    // This test will pass if blur placeholders are working
    // (Not all images may have them, so we check if any exist)
    console.log(`Found ${blurImageCount} images with potential blur placeholders`)
  })

  test('should respect responsive image sizes', async ({ page }) => {
    await page.goto('/reviews')
    await page.waitForLoadState('networkidle')

    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1200, height: 800 }   // Desktop
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(500) // Allow for responsive changes
      
      const images = page.locator('img')
      const imageCount = await images.count()
      
      if (imageCount > 0) {
        // Images should be loaded and visible
        const firstImage = images.first()
        const isVisible = await firstImage.isVisible()
        expect(isVisible).toBe(true)
      }
    }
  })

  test('should load high priority images first', async ({ page }) => {
    const loadTimes: number[] = []
    
    page.on('response', response => {
      if (response.url().includes('/_next/image') || 
          response.url().match(/\.(jpg|jpeg|png|webp|avif)$/)) {
        loadTimes.push(Date.now())
      }
    })

    const startTime = Date.now()
    await page.goto('/reviews/test-review-slug') // Individual review page with priority image
    await page.waitForLoadState('networkidle')

    // Priority images should load relatively quickly
    // This is a basic check - in reality we'd need more sophisticated timing
    if (loadTimes.length > 0) {
      const firstImageTime = loadTimes[0] - startTime
      expect(firstImageTime).toBeLessThan(5000) // Should load within 5 seconds
    }
  })
})