import { test, expect } from '@playwright/test'

test.describe('认证流程', () => {
  test('登录页面应正常加载', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    // 假设登录页有一个包含 "登录" 或 "Sign In" 的按钮/标题
    const loginButton = page.locator('button:has-text("登录"), button:has-text("Sign In")')
    await expect(loginButton).toBeVisible()
  })

  test('未登录访问受保护页面应重定向到登录页', async ({ page }) => {
    await page.goto('/workbench')
    // 由于 localStorage 为空，路由守卫应重定向到 /login
    await expect(page).toHaveURL(/\/login/)
  })

  test('404 页面应正常显示', async ({ page }) => {
    await page.goto('/non-existent-page')
    await expect(page.locator('text=404')).toBeVisible()
  })
})
