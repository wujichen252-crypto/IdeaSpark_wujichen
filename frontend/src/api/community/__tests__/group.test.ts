/**
 * 社区圈子接口单元测试
 * @description 测试社区圈子模块的所有 API 接口
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import service from '../../request'
import {
  createGroup,
  getGroupList,
  getGroupDetail,
  updateGroup,
  deleteGroup,
  joinGroup,
  quitGroup,
  getGroupMembers,
  removeGroupMember,
  updateGroupMemberRole,
  getMyGroups,
  getGroupMemberCount,
  checkGroupMembership
} from '../group'
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

describe('社区圈子接口', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createGroup', () => {
    it('应该正确调用创建圈子接口', async () => {
      const mockResponse = {
        data: {
          status: 201,
          message: '创建成功',
          data: {
            id: 'group-123',
            name: '测试圈子',
            keyword: '测试',
            description: '测试描述',
            iconUrl: '',
            coverUrl: '',
            createdBy: { id: 1, username: '张三' },
            memberCount: 1,
            createdAt: '2024-01-01'
          }
        }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      const result = await createGroup({
        name: '测试圈子',
        keyword: '测试',
        description: '测试描述'
      })

      expect(mockService.post).toHaveBeenCalledWith('/api/community/groups', {
        name: '测试圈子',
        keyword: '测试',
        description: '测试描述'
      })
      expect(result.data.data.id).toBe('group-123')
    })
  })

  describe('getGroupList', () => {
    it('应该正确调用获取圈子列表接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [
            {
              id: 'group-123',
              name: '测试圈子',
              keyword: '测试',
              description: '',
              memberCount: 10,
              createdAt: '2024-01-01'
            }
          ]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getGroupList()

      expect(mockService.get).toHaveBeenCalledWith('/api/community/groups')
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('getGroupDetail', () => {
    it('应该正确调用获取圈子详情接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: {
            id: 'group-123',
            name: '测试圈子',
            keyword: '测试',
            description: '测试描述',
            iconUrl: '',
            coverUrl: '',
            createdBy: { id: 1, username: '张三' },
            memberCount: 10,
            createdAt: '2024-01-01'
          }
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getGroupDetail('group-123')

      expect(mockService.get).toHaveBeenCalledWith('/api/community/groups/group-123')
      expect(result.data.data.id).toBe('group-123')
    })
  })

  describe('updateGroup', () => {
    it('应该正确调用更新圈子接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '更新成功',
          data: {
            id: 'group-123',
            name: '更新后的圈子',
            keyword: '测试',
            description: '更新后的描述',
            memberCount: 10,
            createdAt: '2024-01-01'
          }
        }
      } as AxiosResponse
      mockService.put.mockResolvedValue(mockResponse)

      const result = await updateGroup('group-123', {
        name: '更新后的圈子',
        description: '更新后的描述'
      })

      expect(mockService.put).toHaveBeenCalledWith('/api/community/groups/group-123', {
        name: '更新后的圈子',
        description: '更新后的描述'
      })
      expect(result.data.data.name).toBe('更新后的圈子')
    })
  })

  describe('deleteGroup', () => {
    it('应该正确调用删除圈子接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '删除成功', data: null }
      } as AxiosResponse
      mockService.delete.mockResolvedValue(mockResponse)

      await deleteGroup('group-123')

      expect(mockService.delete).toHaveBeenCalledWith('/api/community/groups/group-123')
    })
  })

  describe('joinGroup', () => {
    it('应该正确调用加入圈子接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '加入成功', data: null }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      await joinGroup('group-123')

      expect(mockService.post).toHaveBeenCalledWith('/api/community/groups/group-123/join')
    })
  })

  describe('quitGroup', () => {
    it('应该正确调用退出圈子接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '退出成功', data: null }
      } as AxiosResponse
      mockService.delete.mockResolvedValue(mockResponse)

      await quitGroup('group-123')

      expect(mockService.delete).toHaveBeenCalledWith('/api/community/groups/group-123/join')
    })
  })

  describe('getMyGroups', () => {
    it('应该正确调用获取我加入的圈子列表接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [
            {
              id: 'member-123',
              groupId: 'group-123',
              groupName: '测试圈子',
              groupIcon: '',
              role: 'member',
              joinedAt: '2024-01-01'
            }
          ]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getMyGroups()

      expect(mockService.get).toHaveBeenCalledWith('/api/community/groups/my')
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('getGroupMemberCount', () => {
    it('应该正确调用获取圈子成员数接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: { count: 50 }
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getGroupMemberCount('group-123')

      expect(mockService.get).toHaveBeenCalledWith('/api/community/groups/group-123/members/count')
      expect(result.data.data.count).toBe(50)
    })
  })

  describe('checkGroupMembership', () => {
    it('应该正确调用检查圈子成员状态接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: { member: true }
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await checkGroupMembership('group-123')

      expect(mockService.get).toHaveBeenCalledWith('/api/community/groups/group-123/check')
      expect(result.data.data.member).toBe(true)
    })
  })

  describe('getGroupMembers', () => {
    it('应该正确调用获取圈子成员列表接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: [
            {
              id: 'member-123',
              userId: 1,
              username: '张三',
              avatar: '',
              role: 'admin',
              joinedAt: '2024-01-01'
            }
          ]
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getGroupMembers('group-123')

      expect(mockService.get).toHaveBeenCalledWith('/api/community/groups/group-123/members')
      expect(result.data.data).toHaveLength(1)
    })
  })

  describe('removeGroupMember', () => {
    it('应该正确调用移除圈子成员接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '移除成功', data: null }
      } as AxiosResponse
      mockService.delete.mockResolvedValue(mockResponse)

      await removeGroupMember('group-123', 'member-123')

      expect(mockService.delete).toHaveBeenCalledWith(
        '/api/community/groups/group-123/members/member-123'
      )
    })
  })

  describe('updateGroupMemberRole', () => {
    it('应该正确调用更新圈子成员角色接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '更新成功', data: { memberId: 'member-123', role: 'admin' } }
      } as AxiosResponse
      mockService.put.mockResolvedValue(mockResponse)

      await updateGroupMemberRole('group-123', 'member-123', { role: 'admin' })

      expect(mockService.put).toHaveBeenCalledWith(
        '/api/community/groups/group-123/members/member-123/role',
        { role: 'admin' }
      )
    })
  })
})