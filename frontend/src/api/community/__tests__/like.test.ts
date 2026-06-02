/**
 * 社区点赞接口单元测试
 * @description 测试社区点赞模块的所有 API 接口
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import service from '../../request'
import {
  likePost,
  unlikePost,
  getPostLikeCount,
  checkPostLiked,
  likeComment,
  unlikeComment,
  getCommentLikeCount,
  checkCommentLiked
} from '../like'
import type { AxiosResponse } from 'axios'

vi.mock('../../request', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  }
}))

const mockService = vi.mocked(service)

describe('社区点赞接口', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('帖子点赞', () => {
    describe('likePost', () => {
      it('应该正确调用点赞帖子接口', async () => {
        const mockResponse = {
          data: { status: 200, message: '点赞成功', data: null }
        } as AxiosResponse
        mockService.post.mockResolvedValue(mockResponse)

        await likePost('post-123')

        expect(mockService.post).toHaveBeenCalledWith('/api/community/likes/post/post-123')
      })
    })

    describe('unlikePost', () => {
      it('应该正确调用取消点赞帖子接口', async () => {
        const mockResponse = {
          data: { status: 200, message: '取消点赞成功', data: null }
        } as AxiosResponse
        mockService.delete.mockResolvedValue(mockResponse)

        await unlikePost('post-123')

        expect(mockService.delete).toHaveBeenCalledWith('/api/community/likes/post/post-123')
      })
    })

    describe('getPostLikeCount', () => {
      it('应该正确调用获取帖子点赞数接口', async () => {
        const mockResponse = {
          data: { status: 200, message: '获取成功', data: { count: 20 } }
        } as AxiosResponse
        mockService.get.mockResolvedValue(mockResponse)

        const result = await getPostLikeCount('post-123')

        expect(mockService.get).toHaveBeenCalledWith('/api/community/likes/post/post-123/count')
        expect(result.data.data.count).toBe(20)
      })
    })

    describe('checkPostLiked', () => {
      it('应该正确调用检查帖子点赞状态接口', async () => {
        const mockResponse = {
          data: { status: 200, message: '获取成功', data: { liked: true } }
        } as AxiosResponse
        mockService.get.mockResolvedValue(mockResponse)

        const result = await checkPostLiked('post-123')

        expect(mockService.get).toHaveBeenCalledWith('/api/community/likes/post/post-123/check')
        expect(result.data.data.liked).toBe(true)
      })
    })
  })

  describe('评论点赞', () => {
    describe('likeComment', () => {
      it('应该正确调用点赞评论接口', async () => {
        const mockResponse = {
          data: { status: 200, message: '点赞成功', data: null }
        } as AxiosResponse
        mockService.post.mockResolvedValue(mockResponse)

        await likeComment('comment-123')

        expect(mockService.post).toHaveBeenCalledWith('/api/community/likes/comment/comment-123')
      })
    })

    describe('unlikeComment', () => {
      it('应该正确调用取消点赞评论接口', async () => {
        const mockResponse = {
          data: { status: 200, message: '取消点赞成功', data: null }
        } as AxiosResponse
        mockService.delete.mockResolvedValue(mockResponse)

        await unlikeComment('comment-123')

        expect(mockService.delete).toHaveBeenCalledWith('/api/community/likes/comment/comment-123')
      })
    })

    describe('getCommentLikeCount', () => {
      it('应该正确调用获取评论点赞数接口', async () => {
        const mockResponse = {
          data: { status: 200, message: '获取成功', data: { count: 5 } }
        } as AxiosResponse
        mockService.get.mockResolvedValue(mockResponse)

        const result = await getCommentLikeCount('comment-123')

        expect(mockService.get).toHaveBeenCalledWith('/api/community/likes/comment/comment-123/count')
        expect(result.data.data.count).toBe(5)
      })
    })

    describe('checkCommentLiked', () => {
      it('应该正确调用检查评论点赞状态接口', async () => {
        const mockResponse = {
          data: { status: 200, message: '获取成功', data: { liked: false } }
        } as AxiosResponse
        mockService.get.mockResolvedValue(mockResponse)

        const result = await checkCommentLiked('comment-123')

        expect(mockService.get).toHaveBeenCalledWith('/api/community/likes/comment/comment-123/check')
        expect(result.data.data.liked).toBe(false)
      })
    })
  })
})