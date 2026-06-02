/**
 * 社区帖子接口单元测试
 * @description 测试社区帖子模块的所有 API 接口
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import service from '../../request'
import { createPost, getPostList, getPostDetail, updatePost, deletePost, updatePostLikes, updatePostComments } from '../post'
import type { AxiosResponse } from 'axios'

vi.mock('../../request', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

const mockService = vi.mocked(service)

describe('社区帖子接口', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createPost', () => {
    it('应该正确调用创建帖子接口', async () => {
      const mockResponse = {
        data: {
          status: 201,
          message: '创建成功',
          data: {
            id: 'post-123',
            title: '测试帖子',
            content: '帖子内容',
            author: { id: 1, username: '张三' },
            createdAt: '2024-01-01'
          }
        }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      const result = await createPost({ title: '测试帖子', content: '帖子内容' })

      expect(mockService.post).toHaveBeenCalledWith('/api/community/posts', { title: '测试帖子', content: '帖子内容' })
      expect(result.data.data.id).toBe('post-123')
    })
  })

  describe('getPostList', () => {
    it('应该正确调用获取帖子列表接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [{ id: 'post-123', title: '测试帖子', content: '内容', author: { id: 1, username: '张三' }, viewsCount: 10, likesCount: 5, commentsCount: 2, createdAt: '2024-01-01' }]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getPostList()

      expect(mockService.get).toHaveBeenCalledWith('/api/community/posts', { params: undefined })
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('getPostDetail', () => {
    it('应该正确调用获取帖子详情接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: {
            id: 'post-123',
            title: '测试帖子',
            content: '内容',
            images: '',
            tags: '',
            channel: '',
            visibility: 'PUBLIC',
            author: { id: 1, username: '张三' },
            viewsCount: 10,
            likesCount: 5,
            commentsCount: 2,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01'
          }
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getPostDetail('post-123')

      expect(mockService.get).toHaveBeenCalledWith('/api/community/posts/post-123')
      expect(result.data.data.id).toBe('post-123')
    })
  })

  describe('updatePost', () => {
    it('应该正确调用更新帖子接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '更新成功',
          data: { id: 'post-123', title: '更新后的标题', content: '更新后的内容' }
        }
      } as AxiosResponse
      mockService.put.mockResolvedValue(mockResponse)

      const result = await updatePost('post-123', { title: '更新后的标题' })

      expect(mockService.put).toHaveBeenCalledWith('/api/community/posts/post-123', { title: '更新后的标题' })
      expect(result.data.data.title).toBe('更新后的标题')
    })
  })

  describe('deletePost', () => {
    it('应该正确调用删除帖子接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '删除成功', data: null }
      } as AxiosResponse
      mockService.delete.mockResolvedValue(mockResponse)

      await deletePost('post-123')

      expect(mockService.delete).toHaveBeenCalledWith('/api/community/posts/post-123')
    })
  })

  describe('updatePostLikes', () => {
    it('应该正确调用更新点赞数接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '更新成功', data: { id: 'post-123', likesCount: 10 } }
      } as AxiosResponse
      mockService.put.mockResolvedValue(mockResponse)

      await updatePostLikes('post-123', 10)

      expect(mockService.put).toHaveBeenCalledWith('/api/community/posts/post-123/likes', null, { params: { count: 10 } })
    })
  })

  describe('updatePostComments', () => {
    it('应该正确调用更新评论数接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '更新成功', data: { id: 'post-123', commentsCount: 5 } }
      } as AxiosResponse
      mockService.put.mockResolvedValue(mockResponse)

      await updatePostComments('post-123', 5)

      expect(mockService.put).toHaveBeenCalledWith('/api/community/posts/post-123/comments', null, { params: { count: 5 } })
    })
  })
})