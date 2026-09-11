import { test, expect } from '@playwright/test'

test.describe('theme toggle', () => {
  test('flips the theme instantly and persists it across reloads', async ({ page }) => {
    await page.goto('/')

    const toggle = page.getByRole('button', { name: /switch to (dark|light) mode/i })
    await expect(toggle).toBeVisible()

    const before = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    )

    await toggle.click()

    const after = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    )
    expect(['light', 'dark']).toContain(after)
    expect(after).not.toBe(before)

    await page.reload()

    const persisted = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme'),
    )
    expect(persisted).toBe(after)
  })
})
