/**
 * 用户管理接口单元测试
 * @description 测试用户模块的所有 API 接口
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import service from '../request'
import { login, register, updateUser, getAllUsers, deleteUsers } from '../user'
import type { AxiosResponse } from 'axios'

vi.mock('../request', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

const mockService = vi.mocked(service)

describe('用户管理接口', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('应该正确调用登录接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '登录成功',
          data: {
            token: 'test-token',
            user: { id: 1, username: '张三', email: 'test@example.com' }
          }
        }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      const result = await login({ email: 'test@example.com', password: 'password123' })

      expect(mockService.post).toHaveBeenCalledWith('/api/user/login', {
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result.data.data.token).toBe('test-token')
    })
  })

  describe('register', () => {
    it('应该正确调用注册接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '注册成功',
          data: { id: 1, username: '张三', email: 'test@example.com' }
        }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      const result = await register({
        username: '张三',
        email: 'test@example.com',
        password: 'password123'
      })

      expect(mockService.post).toHaveBeenCalledWith('/api/user/register', {
        username: '张三',
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result.data.data.username).toBe('张三')
    })
  })

  describe('updateUser', () => {
    it('应该正确调用更新用户接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '更新成功',
          data: { id: 1, username: '李四', email: 'new@example.com' }
        }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      const result = await updateUser({ username: '李四', email: 'new@example.com' })

      expect(mockService.post).toHaveBeenCalledWith('/api/user/update', {
        username: '李四',
        email: 'new@example.com'
      })
      expect(result.data.data.username).toBe('李四')
    })
  })

  describe('getAllUsers', () => {
    it('应该正确调用获取用户列表接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '查询成功',
          data: {
            content: [{ id: 1, username: '张三', email: 'test@example.com' }],
            totalElements: 1,
            totalPages: 1,
            size: 10,
            number: 0
          }
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getAllUsers({ page: 1, size: 10 })

      expect(mockService.get).toHaveBeenCalledWith('/api/user/getAllUsers', { params: { page: 1, size: 10 } })
      expect(result.data.data.content).toHaveLength(1)
    })
  })

  describe('deleteUsers', () => {
    it('应该正确调用删除用户接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '删除成功', data: null }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      await deleteUsers({ userIds: [1, 2, 3] })

      expect(mockService.post).toHaveBeenCalledWith('/api/user/deleteUsers', { userIds: [1, 2, 3] })
    })
  })
})
