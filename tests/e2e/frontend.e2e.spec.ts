import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Welcome to Chasing Chapters/)

    const headging = page.locator('h1').first()

    await expect(headging).toHaveText("Welcome to Chasing Chapters")
  })
})
