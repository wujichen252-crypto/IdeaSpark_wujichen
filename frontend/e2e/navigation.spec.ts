import { test, expect } from '@playwright/test'

/**
 * 导航相关 E2E 测试
 * @description 测试页面导航、路由等功能
 */

test.describe('页面导航', () => {
  test('首页应该正确加载', async ({ page }) => {
    await page.goto('/')

    // 验证页面标题
    await expect(page).toHaveTitle(/IdeaSpark/)

    // 验证主要元素存在
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('导航菜单应该可以正常点击', async ({ page }) => {
    await page.goto('/')

    // 点击导航到市场页面
    await page.getByRole('link', { name: /探索/i }).click()

    // 验证 URL 变化
    await expect(page).toHaveURL('/market')

    // 验证页面内容
    await expect(page.getByText(/项目市场/i)).toBeVisible()
  })

  test('404 页面应该正确显示', async ({ page }) => {
    // 访问不存在的页面
    await page.goto('/non-existent-page')

    // 验证 404 页面内容
    await expect(page.getByText(/404/i)).toBeVisible()
    await expect(page.getByText(/页面不存在/i)).toBeVisible()

    // 验证返回首页按钮
    await expect(page.getByRole('button', { name: /返回首页/i })).toBeVisible()
  })

  test('从 404 页面返回首页应该正常工作', async ({ page }) => {
    await page.goto('/non-existent-page')

    // 点击返回首页按钮
    await page.getByRole('button', { name: /返回首页/i }).click()

    // 验证回到首页
    await expect(page).toHaveURL('/')
  })

  test('工作台页面导航应该正确', async ({ page }) => {
    // 先登录
    await page.goto('/login')
    // ... 登录逻辑

    await page.goto('/workbench')

    // 验证工作台页面
    await expect(page.getByText(/工作台/i)).toBeVisible()

    // 测试子导航
    await page.getByRole('link', { name: /我的项目/i }).click()
    await expect(page).toHaveURL('/workbench/projects')
  })
})
