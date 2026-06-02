/**
 * 团队管理接口单元测试
 * @description 测试团队模块的所有 API 接口
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import service from '../request'
import {
  getMyTeams,
  getTeamDetail,
  updateTeam,
  createCollaborationTeam,
  dissolveTeam,
  getTeamMembers,
  updateMemberRole,
  removeMember,
  leaveTeam,
  transferOwnership,
  sendInvitation
} from '../team'
import type { AxiosResponse } from 'axios'

vi.mock('../request', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

const mockService = vi.mocked(service)

describe('团队管理接口', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getMyTeams', () => {
    it('应该正确调用获取我的团队列表接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: {
            teams: [{ uuid: 'team-123', name: '开发团队', description: '', memberCount: 5, role: 'OWNER' }],
            total: 1,
            page: 1,
            size: 10
          }
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getMyTeams({ page: 1, size: 10 })

      expect(mockService.get).toHaveBeenCalledWith('/api/teams/my', { params: { page: 1, size: 10 } })
      expect(result.data.data.teams).toHaveLength(1)
    })
  })

  describe('getTeamDetail', () => {
    it('应该正确调用获取团队详情接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: {
            uuid: 'team-123',
            name: '开发团队',
            description: '',
            memberCount: 5,
            role: 'OWNER',
            owner: { id: 1, username: '张三', avatar: '' },
            projectCount: 2,
            createdAt: '2024-01-01'
          }
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getTeamDetail('team-123')

      expect(mockService.get).toHaveBeenCalledWith('/api/teams/team-123')
      expect(result.data.data.uuid).toBe('team-123')
    })
  })

  describe('updateTeam', () => {
    it('应该正确调用更新团队接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '更新成功',
          data: { uuid: 'team-123', name: '新团队名', description: '新描述', memberCount: 5, role: 'OWNER' }
        }
      } as AxiosResponse
      mockService.put.mockResolvedValue(mockResponse)

      const result = await updateTeam('team-123', { name: '新团队名', description: '新描述' })

      expect(mockService.put).toHaveBeenCalledWith('/api/teams/team-123', { name: '新团队名', description: '新描述' })
      expect(result.data.data.name).toBe('新团队名')
    })
  })

  describe('createCollaborationTeam', () => {
    it('应该正确调用创建团队接口', async () => {
      const mockResponse = {
        data: {
          status: 201,
          message: '创建成功',
          data: {
            uuid: 'team-456',
            name: '新团队',
            description: '',
            memberCount: 1,
            role: 'OWNER',
            owner: { id: 1, username: '张三', avatar: '' },
            projectCount: 0,
            createdAt: '2024-01-01'
          }
        }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      const result = await createCollaborationTeam({ name: '新团队', description: '' })

      expect(mockService.post).toHaveBeenCalledWith('/api/teams/collaboration', { name: '新团队', description: '' })
      expect(result.data.data.uuid).toBe('team-456')
    })
  })

  describe('dissolveTeam', () => {
    it('应该正确调用解散团队接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '解散成功', data: { uuid: 'team-123' } }
      } as AxiosResponse
      mockService.delete.mockResolvedValue(mockResponse)

      await dissolveTeam('team-123')

      expect(mockService.delete).toHaveBeenCalledWith('/api/teams/team-123')
    })
  })

  describe('getTeamMembers', () => {
    it('应该正确调用获取团队成员接口', async () => {
      const mockResponse = {
        data: {
          status: 200,
          message: '获取成功',
          data: {
            members: [{ id: 'member-1', userId: 1, username: '张三', avatar: '', role: 'OWNER', joinedAt: '2024-01-01' }],
            total: 1,
            page: 1,
            size: 10
          }
        }
      } as AxiosResponse
      mockService.get.mockResolvedValue(mockResponse)

      const result = await getTeamMembers('team-123', { page: 1, size: 10 })

      expect(mockService.get).toHaveBeenCalledWith('/api/teams/team-123/members', { params: { page: 1, size: 10 } })
      expect(result.data.data.members).toHaveLength(1)
    })
  })

  describe('updateMemberRole', () => {
    it('应该正确调用更新成员角色接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '更新成功', data: { memberId: '1', role: 'ADMIN' } }
      } as AxiosResponse
      mockService.put.mockResolvedValue(mockResponse)

      await updateMemberRole('team-123', '1', { role: 'ADMIN' })

      expect(mockService.put).toHaveBeenCalledWith('/api/teams/team-123/members/1/role', { role: 'ADMIN' })
    })
  })

  describe('removeMember', () => {
    it('应该正确调用移除成员接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '移除成功', data: { memberId: '2' } }
      } as AxiosResponse
      mockService.delete.mockResolvedValue(mockResponse)

      await removeMember('team-123', '2')

      expect(mockService.delete).toHaveBeenCalledWith('/api/teams/team-123/members/2')
    })
  })

  describe('leaveTeam', () => {
    it('应该正确调用退出团队接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '退出成功', data: { uuid: 'team-123' } }
      } as AxiosResponse
      mockService.delete.mockResolvedValue(mockResponse)

      await leaveTeam('team-123')

      expect(mockService.delete).toHaveBeenCalledWith('/api/teams/team-123/members/self')
    })
  })

  describe('transferOwnership', () => {
    it('应该正确调用转让所有权接口', async () => {
      const mockResponse = {
        data: { status: 200, message: '转让成功', data: { uuid: 'team-123', newOwnerId: 2 } }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      await transferOwnership('team-123', { newOwnerId: 2 })

      expect(mockService.post).toHaveBeenCalledWith('/api/teams/team-123/transfer-ownership', { newOwnerId: 2 })
    })
  })

  describe('sendInvitation', () => {
    it('应该正确调用发送邀请接口', async () => {
      const mockResponse = {
        data: {
          status: 201,
          message: '邀请成功',
          data: {
            invitations: [
              { id: 'inv-1', inviteeId: 2, status: 'pending', token: 'token-xxx', createdAt: '2024-01-01' }
            ]
          }
        }
      } as AxiosResponse
      mockService.post.mockResolvedValue(mockResponse)

      await sendInvitation('team-123', { inviteeIds: [2, 3], message: '欢迎加入' })

      expect(mockService.post).toHaveBeenCalledWith('/api/teams/team-123/invitations', {
        inviteeIds: [2, 3],
        message: '欢迎加入'
      })
    })
  })
})
