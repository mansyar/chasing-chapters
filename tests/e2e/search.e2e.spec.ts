import { test, expect } from '@playwright/test'

test.describe('Search Functionality E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open global search from header', async ({ page }) => {
    // Click the search button in header
    await page.click('[title="Search reviews"]')
    
    // Should open search modal
    await expect(page.locator('input[placeholder*="Search reviews, authors, topics"]')).toBeVisible()
  })

  test('should perform search from global search', async ({ page }) => {
    // Open global search
    await page.click('[title="Search reviews"]')
    
    // Type search query
    await page.fill('input[placeholder*="Search reviews, authors, topics"]', 'fiction')
    
    // Press Enter to search
    await page.press('input[placeholder*="Search reviews, authors, topics"]', 'Enter')
    
    // Should navigate to search results page
    await expect(page).toHaveURL(/\/search\?q=fiction/)
    
    // Should show search results
    await expect(page.locator('h1')).toContainText('Search Reviews')
    await expect(page.locator('h2')).toContainText('Search Results')
  })

  test('should navigate to search page directly', async ({ page }) => {
    await page.goto('/search')
    
    // Should show search page
    await expect(page.locator('h1')).toContainText('Search Reviews')
    
    // Should have search form
    await expect(page.locator('input[placeholder*="Search by book title, author, or content"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Search')
  })

  test('should perform search on search page', async ({ page }) => {
    await page.goto('/search')
    
    // Fill search form
    await page.fill('input[placeholder*="Search by book title, author, or content"]', 'book')
    
    // Submit search
    await page.click('button[type="submit"]')
    
    // Should update URL with search query
    await expect(page).toHaveURL(/\/search\?q=book/)
    
    // Should show results or no results message
    const resultsSection = page.locator('text="Search Results"')
    await expect(resultsSection).toBeVisible()
  })

  test('should show and hide filters', async ({ page }) => {
    await page.goto('/search')
    
    // Filters should be hidden initially
    await expect(page.locator('text="Reading Status"')).not.toBeVisible()
    
    // Click filters button
    await page.click('button:has-text("Filters")')
    
    // Filters should be visible
    await expect(page.locator('text="Reading Status"')).toBeVisible()
    // Use more specific selector for the Tags filter section
    await expect(page.locator('h3:has-text("Tags")')).toBeVisible()
  })

  test('should filter by reading status', async ({ page }) => {
    await page.goto('/search')
    
    // Open filters
    await page.click('button:has-text("Filters")')
    
    // Click a reading status filter
    await page.click('button:has-text("Finished")')
    
    // Should update URL with status filter
    await expect(page).toHaveURL(/status=finished/)
  })

  test('should clear all filters', async ({ page }) => {
    await page.goto('/search?status=finished&tags=fiction')
    
    // Open filters
    await page.click('button:has-text("Filters")')
    
    // Should show active filters
    await expect(page.locator('button:has-text("Filters")')).toContainText('2')
    
    // Click clear all
    await page.click('button:has-text("Clear all")')
    
    // Should remove filters from URL (but may still have limit parameter)
    await expect(page).toHaveURL(/\/search(\?limit=\d+)?$/)
  })

  test('should handle pagination', async ({ page }) => {
    // Go to search page with results
    await page.goto('/search?q=book')
    
    // Wait for search results to load
    await page.waitForSelector('text="Search Results"')
    
    // Check if pagination exists (only if there are multiple pages)
    const nextButton = page.locator('button:has-text("Next")')
    const isNextVisible = await nextButton.isVisible()
    
    if (isNextVisible && await nextButton.isEnabled()) {
      // Click next page
      await nextButton.click()
      
      // Should update URL with page parameter
      await expect(page).toHaveURL(/page=2/)
    }
  })

  test('should show no results message when appropriate', async ({ page }) => {
    await page.goto('/search')
    
    // Search for something that definitely won't exist
    await page.fill('input[placeholder*="Search by book title, author, or content"]', 'nonexistentbookxyz123')
    await page.click('button[type="submit"]')
    
    // Wait for search to complete
    await page.waitForSelector('text="Search Results"')
    
    // Should show no results message
    await expect(page.locator('text="No Results Found"')).toBeVisible()
    await expect(page.locator('text="Try adjusting your search terms or filters."')).toBeVisible()
  })

  test('should provide links to browse all reviews and tags from no results', async ({ page }) => {
    await page.goto('/search?q=nonexistentbookxyz123')
    
    // Wait for no results state
    await page.waitForSelector('text="No Results Found"')
    
    // Should have navigation links
    await expect(page.locator('a:has-text("Browse All Reviews")')).toBeVisible()
    await expect(page.locator('a:has-text("Explore Tags")')).toBeVisible()
    
    // Test navigation
    await page.click('a:has-text("Browse All Reviews")')
    await expect(page).toHaveURL('/reviews')
  })

  test('should display search results with proper information', async ({ page }) => {
    await page.goto('/search?q=book')
    
    // Wait for results
    await page.waitForSelector('text="Search Results"')
    
    // Check if there are results to test
    const resultsGrid = page.locator('[class*="grid"]')
    const hasResults = await resultsGrid.locator('article').count() > 0
    
    if (hasResults) {
      // Should show review cards with proper information
      const firstCard = resultsGrid.locator('article').first()
      await expect(firstCard).toBeVisible()
      
      // Should have book title link (use first() to handle multiple links)
      await expect(firstCard.locator('a[href*="/reviews/"]').first()).toBeVisible()
      
      // Should have author information (look for paragraph with User icon)
      await expect(firstCard.locator('p.text-neutral-600')).toBeVisible()
    }
  })

  test('should handle keyboard navigation in global search', async ({ page }) => {
    // Open global search
    await page.click('[title="Search reviews"]')
    
    // Type to get suggestions
    await page.fill('input[placeholder*="Search reviews, authors, topics"]', 'book')
    
    // Wait a bit for suggestions to load
    await page.waitForTimeout(500)
    
    // Press Escape to close
    await page.press('input[placeholder*="Search reviews, authors, topics"]', 'Escape')
    
    // Search modal should be closed
    await expect(page.locator('input[placeholder*="Search reviews, authors, topics"]')).not.toBeVisible()
  })

  test('should maintain search state when navigating back', async ({ page }) => {
    // Perform a search
    await page.goto('/search?q=test&status=finished')
    
    // Navigate to a review (if any exist)
    const reviewLink = page.locator('a[href*="/reviews/"]').first()
    const hasReviews = await reviewLink.count() > 0
    
    if (hasReviews) {
      await reviewLink.click()
      
      // Go back
      await page.goBack()
      
      // Should maintain search parameters
      await expect(page).toHaveURL(/q=test/)
      await expect(page).toHaveURL(/status=finished/)
    }
  })

  test('should link to advanced search from global search', async ({ page }) => {
    // Open global search
    await page.click('[title="Search reviews"]')
    
    // Click advanced search link
    await page.click('button:has-text("Advanced Search")')
    
    // Should navigate to search page
    await expect(page).toHaveURL('/search')
  })
})