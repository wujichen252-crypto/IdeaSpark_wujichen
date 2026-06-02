/**
 * 用户关注接口单元测试
 * @description 测试用户关注模块的所有 API 接口
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import service from '../request'
import {
  followUser,
  unfollowUser,
  getMyFollowing,
  getMyFollowers,
  getMyFollowingCount,
  getMyFollowersCount,
  checkFollowing,
  getUserFollowing,
  getUserFollowers,
  getUserFollowingCount,
  getUserFollowersCount
} from '../follow'
import type { AxiosResponse } from 'axios'

vi.mock('../request', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  }
}))

const mockService = vi.mocked(service)

describe('用户关注接口', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('followUser', () => {
    it('应该正确调用关注用户接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '关注成功', data: null }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      await followUser(2)

      expect(mockService.post).toHaveBeenCalledWith('/api/follows/2')
    })
  })

  describe('unfollowUser', () => {
    it('应该正确调用取消关注接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '取消关注成功', data: null }
      } as AxiosResponse
      mockService.delete.mockResolvedValue(mockResponse)

      await unfollowUser(2)

      expect(mockService.delete).toHaveBeenCalledWith('/api/follows/2')
    })
  })

  describe('getMyFollowing', () => {
    it('应该正确调用获取我的关注列表接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [
            {
              id: 'follow-123',
              follower: { id: 1, username: '张三' },
              following: { id: 2, username: '李四' },
              createdAt: '2024-01-01'
            }
          ]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getMyFollowing()

      expect(mockService.get).toHaveBeenCalledWith('/api/follows/my/following')
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('getMyFollowers', () => {
    it('应该正确调用获取我的粉丝列表接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [
            {
              id: 'follow-456',
              follower: { id: 2, username: '李四' },
              following: { id: 1, username: '张三' },
              createdAt: '2024-01-01'
            }
          ]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getMyFollowers()

      expect(mockService.get).toHaveBeenCalledWith('/api/follows/my/followers')
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('getMyFollowingCount', () => {
    it('应该正确调用获取我的关注数接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '获取成功', data: { count: 10 } }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getMyFollowingCount()

      expect(mockService.get).toHaveBeenCalledWith('/api/follows/my/following/count')
      expect(result.data.data.count).toBe(10)
    })
  })

  describe('getMyFollowersCount', () => {
    it('应该正确调用获取我的粉丝数接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '获取成功', data: { count: 20 } }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getMyFollowersCount()

      expect(mockService.get).toHaveBeenCalledWith('/api/follows/my/followers/count')
      expect(result.data.data.count).toBe(20)
    })
  })

  describe('checkFollowing', () => {
    it('应该正确调用检查关注状态接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '获取成功', data: { following: true } }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await checkFollowing(2)

      expect(mockService.get).toHaveBeenCalledWith('/api/follows/check/2')
      expect(result.data.data.following).toBe(true)
    })
  })

  describe('getUserFollowing', () => {
    it('应该正确调用获取用户关注列表接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [
            {
              id: 'follow-123',
              follower: { id: 1, username: '张三' },
              following: { id: 2, username: '李四' },
              createdAt: '2024-01-01'
            }
          ]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getUserFollowing(1)

      expect(mockService.get).toHaveBeenCalledWith('/api/follows/user/1/following')
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('getUserFollowers', () => {
    it('应该正确调用获取用户粉丝列表接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [
            {
              id: 'follow-456',
              follower: { id: 2, username: '李四' },
              following: { id: 1, username: '张三' },
              createdAt: '2024-01-01'
            }
          ]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getUserFollowers(1)

      expect(mockService.get).toHaveBeenCalledWith('/api/follows/user/1/followers')
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('getUserFollowingCount', () => {
    it('应该正确调用获取用户关注数接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '获取成功', data: { count: 10 } }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getUserFollowingCount(1)

      expect(mockService.get).toHaveBeenCalledWith('/api/follows/user/1/following/count')
      expect(result.data.data.count).toBe(10)
    })
  })

  describe('getUserFollowersCount', () => {
    it('应该正确调用获取用户粉丝数接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '获取成功', data: { count: 20 } }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getUserFollowersCount(1)

      expect(mockService.get).toHaveBeenCalledWith('/api/follows/user/1/followers/count')
      expect(result.data.data.count).toBe(20)
    })
  })
})
