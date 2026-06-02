/**
 * 社区评论接口单元测试
 * @description 测试社区评论模块的所有 API 接口
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import service from '../../request'
import {
  createComment,
  getPostComments,
  getAllPostComments,
  getCommentReplies,
  updateComment,
  deleteComment,
  updateCommentLikes
} from '../comment'
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

describe('社区评论接口', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createComment', () => {
    it('应该正确调用创建评论接口', async () => {
      const mockResponse = {
        data: {
          status: 201,
          message: '创建成功',
          data: {
            id: 'comment-123',
            content: '测试评论',
            postId: 'post-123',
            author: { id: 1, username: '张三' },
            likesCount: 0,
            createdAt: '2024-01-01'
          }
        }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      const result = await createComment({ postId: 'post-123', content: '测试评论' })

      expect(mockService.post).toHaveBeenCalledWith('/api/community/comments', {
        postId: 'post-123',
        content: '测试评论'
      })
      expect(result.data.data.id).toBe('comment-123')
    })

    it('应该正确调用创建回复接口', async () => {
      const mockResponse = {
        data: {
          status: 201,
          message: '创建成功',
          data: {
            id: 'comment-456',
            content: '回复内容',
            postId: 'post-123',
            parentId: 'comment-123',
            author: { id: 1, username: '张三' },
            likesCount: 0,
            createdAt: '2024-01-01'
          }
        }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      const result = await createComment({
        postId: 'post-123',
        content: '回复内容',
        parentId: 'comment-123'
      })

      expect(mockService.post).toHaveBeenCalledWith('/api/community/comments', {
        postId: 'post-123',
        content: '回复内容',
        parentId: 'comment-123'
      })
      expect(result.data.data.id).toBe('comment-456')
    })
  })

  describe('getPostComments', () => {
    it('应该正确调用获取帖子一级评论接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [
            {
              id: 'comment-123',
              content: '测试评论',
              postId: 'post-123',
              author: { id: 1, username: '张三' },
              likesCount: 0,
              createdAt: '2024-01-01'
            }
          ]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getPostComments('post-123')

      expect(mockService.get).toHaveBeenCalledWith('/api/community/comments/post/post-123')
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('getAllPostComments', () => {
    it('应该正确调用获取帖子所有评论接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [
            {
              id: 'comment-123',
              content: '测试评论',
              postId: 'post-123',
              author: { id: 1, username: '张三' },
              likesCount: 0,
              createdAt: '2024-01-01',
              replies: [
                {
                  id: 'comment-456',
                  content: '回复内容',
                  postId: 'post-123',
                  parentId: 'comment-123',
                  author: { id: 2, username: '李四' },
                  likesCount: 0,
                  createdAt: '2024-01-01'
                }
              ]
            }
          ]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getAllPostComments('post-123')

      expect(mockService.get).toHaveBeenCalledWith('/api/community/comments/post/post-123/all')
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('getCommentReplies', () => {
    it('应该正确调用获取评论回复接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [
            {
              id: 'comment-456',
              content: '回复内容',
              postId: 'post-123',
              parentId: 'comment-123',
              author: { id: 2, username: '李四' },
              likesCount: 0,
              createdAt: '2024-01-01'
            }
          ]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getCommentReplies('comment-123')

      expect(mockService.get).toHaveBeenCalledWith('/api/community/comments/replies/comment-123')
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('updateComment', () => {
    it('应该正确调用更新评论接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '更新成功',
          data: {
            id: 'comment-123',
            content: '更新后的评论',
            postId: 'post-123',
            author: { id: 1, username: '张三' },
            likesCount: 0,
            createdAt: '2024-01-01'
          }
        }
      } as AxiosResponse
      mockService.put.mockResolvedValue(mockResponse)

      const result = await updateComment('comment-123', { content: '更新后的评论' })

      expect(mockService.put).toHaveBeenCalledWith('/api/community/comments/comment-123', {
        content: '更新后的评论'
      })
      expect(result.data.data.content).toBe('更新后的评论')
    })
  })

  describe('deleteComment', () => {
    it('应该正确调用删除评论接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '删除成功', data: null }
      } as AxiosResponse
      mockService.delete.mockResolvedValue(mockResponse)

      await deleteComment('comment-123')

      expect(mockService.delete).toHaveBeenCalledWith('/api/community/comments/comment-123')
    })
  })

  describe('updateCommentLikes', () => {
    it('应该正确调用更新评论点赞数接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '更新成功',
          data: { id: 'comment-123', likesCount: 10 }
        }
      } as AxiosResponse
      mockService.put.mockResolvedValue(mockResponse)

      const result = await updateCommentLikes('comment-123', 10)

      expect(mockService.put).toHaveBeenCalledWith(
        '/api/community/comments/comment-123/likes',
        null,
        { params: { count: 10 } }
      )
      expect(result.data.data.likesCount).toBe(10)
    })
  })
})