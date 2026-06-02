import { test, expect } from '@playwright/test'

/**
 * 社区模块 E2E 测试
 * @description 测试社区帖子列表、详情等功能
 */

test.describe('社区功能', () => {
  test('社区首页应该显示帖子列表', async ({ page }) => {
    // Mock API 响应
    await page.route('**/api/community/posts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: '获取成功',
          data: {
            content: [
              {
                id: '1',
                title: '测试帖子标题',
                content: '测试帖子内容',
                author: { id: '1', username: '测试用户', avatar: '' },
                createdAt: new Date().toISOString(),
                likeCount: 10,
                commentCount: 5
              }
            ],
            totalElements: 1
          }
        })
      })
    })

    await page.goto('/community')

    // 验证帖子列表显示
    await expect(page.getByText('测试帖子标题')).toBeVisible()
    await expect(page.getByText('测试用户')).toBeVisible()
  })

  test('帖子详情页应该正确显示', async ({ page }) => {
    // Mock API 响应
    await page.route('**/api/community/posts/1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          message: '获取成功',
          data: {
            id: '1',
            title: '测试帖子详情',
            content: '这是帖子详细内容',
            author: { id: '1', username: '作者', avatar: '' },
            createdAt: new Date().toISOString(),
            likeCount: 20,
            commentCount: 10
          }
        })
      })
    })

    await page.goto('/community/post/1')

    // 验证帖子详情
    await expect(page.getByText('测试帖子详情')).toBeVisible()
    await expect(page.getByText('这是帖子详细内容')).toBeVisible()
    await expect(page.getByText('作者')).toBeVisible()
  })

  test('创建帖子页面需要登录', async ({ page }) => {
    await page.goto('/community/create')

    // 未登录应该重定向到登录页
    await expect(page).toHaveURL(/\/login/)
  })
})
