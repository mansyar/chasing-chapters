import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('Homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Review page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/')
    
    // Click on the first review link if available
    const reviewLink = page.locator('[data-testid="review-card-link"]').first()
    if (await reviewLink.count() > 0) {
      await reviewLink.click()
      await page.waitForLoadState('networkidle')
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()
      
      expect(accessibilityScanResults.violations).toEqual([])
    }
  })

  test('Search page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/search')
    await page.waitForLoadState('networkidle')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('About page should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/')
    
    // Tab through navigation elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Check if focus is visible
    const focusedElement = await page.evaluate(() => {
      const activeElement = document.activeElement
      return activeElement ? activeElement.tagName : null
    })
    
    expect(focusedElement).toBeTruthy()
  })

  test('Search functionality should be keyboard accessible', async ({ page }) => {
    await page.goto('/')
    
    // Test global search
    await page.keyboard.press('Tab') // Navigate to search button
    const searchButton = page.locator('[data-testid="global-search-button"]')
    
    if (await searchButton.count() > 0) {
      await page.keyboard.press('Enter') // Open search modal
      await page.waitForSelector('[data-testid="global-search-input"]', { state: 'visible' })
      
      // Type in search input
      await page.keyboard.type('test book')
      
      // Should be able to navigate results with arrow keys
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowUp')
      
      // Close with Escape
      await page.keyboard.press('Escape')
      
      const searchModal = page.locator('[data-testid="global-search-modal"]')
      await expect(searchModal).not.toBeVisible()
    }
  })

  test('Color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Test color contrast specifically
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Images should have proper alt text', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('Form elements should have proper labels', async ({ page }) => {
    await page.goto('/search')
    await page.waitForLoadState('networkidle')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['label'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
})