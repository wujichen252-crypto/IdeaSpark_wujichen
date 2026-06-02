/**
 * API 统一类型定义
 * @description 根据 IdeaSpark 前后端对接文档定义的所有接口类型
 */

// ==================== 通用类型 ====================

/**
 * 统一响应格式
 */
export interface ApiResponse<T = unknown> {
  status: number
  message: string
  data: T
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page?: number
  size?: number
}

/**
 * 分页响应数据
 */
export interface PageData<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

/**
 * 列表分页响应数据
 */
export interface ListPageData<T> {
  items: T[]
  total: number
  page: number
  size: number
}

// ==================== 用户模块类型 ====================

/**
 * 用户登录参数
 */
export interface LoginParams {
  email: string
  password: string
}

/**
 * 用户注册参数
 */
export interface RegisterParams {
  username: string
  email: string
  password: string
}

/**
 * 更新用户信息参数
 */
export interface UpdateUserParams {
  username?: string
  email?: string
  password?: string
  avatar?: string | null
  cover?: string | null
  role?: string
  bio?: string | null
  position?: string | null
  address?: string | null
  perWebsite?: string | null
  phone?: string | null
  isHide?: boolean
  isNotifSys?: boolean
  isNotifTrends?: boolean
  isNotifPost?: boolean
}

/**
 * 用户信息
 */
export interface User {
  id: number
  username: string
  email: string
  avatar?: string | null
  cover?: string | null
  role?: string
  createdAt?: string
  updatedAt?: string
  bio?: string | null
  position?: string | null
  address?: string | null
  perWebsite?: string | null
  phone?: string | null
}

/**
 * 登录响应数据
 */
export interface LoginResult {
  token: string
  refreshToken: string
  user: User
  userInfo?: User
}

/**
 * 查询用户列表参数
 */
export interface GetUsersParams extends PaginationParams {
  username?: string
  email?: string
}

/**
 * 删除用户参数
 */
export interface DeleteUsersParams {
  userIds: number[]
}

// ==================== 团队模块类型 ====================

/**
 * 团队角色枚举
 */
export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER'

/**
 * 团队列表项（匹配后端 TeamListItemResponse）
 */
export interface Team {
  uuid: string
  name: string
  avatarUrl: string
}

/**
 * 团队详情（匹配后端 TeamDetailResponse）
 */
export interface TeamDetail {
  uuid: string
  name: string
  avatarUrl: string
  description: string
  isPersonal: boolean
  teamType: string
  ownerId: number
  ownerName: string
  createdAt: string
  updatedAt: string
  currentUserRole: string
  teamSize: number
  projectId: string
}

/**
 * 团队成员（匹配后端 TeamMemberListItemResponse）
 */
export interface TeamMember {
  id: number
  userId: number
  userName: string
  userAvatar: string
  role: string
  roleCn: string
  joinedAt: string
  canRemove: boolean
  canChangeRole: boolean
}

/**
 * 团队列表响应
 */
export interface TeamListResult {
  teams: TeamDetail[]
  total: number
  page: number
  size: number
}

/**
 * 团队成员列表响应
 */
export interface TeamMembersResult {
  members: TeamMember[]
  total: number
  page: number
  size: number
}

/**
 * 创建团队参数
 */
export interface CreateTeamParams {
  name: string
  description?: string
}

/**
 * 更新团队参数
 */
export interface UpdateTeamParams {
  name?: string
  description?: string
  avatarUrl?: string
}

/**
 * 邀请成员参数
 * @description 后端需要 emails 和 role 字段
 */
export interface InviteParams {
  emails: string[]
  role: 'ADMIN' | 'MEMBER'
  type?: string
}

/**
 * 更新成员角色参数
 */
export interface UpdateMemberRoleParams {
  role: TeamRole
}

/**
 * 转让所有权参数
 */
export interface TransferOwnershipParams {
  newOwnerId: number
}

// ==================== 项目模块类型 ====================

/**
 * 项目状态枚举
 */
export type ProjectStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

/**
 * 项目列表项（匹配后端 ProjectMyListItemResponse）
 */
export interface Project {
  id: string
  name: string
  description: string
  category: string
  coverUrl: string
  status: string
  progress: number
  visibility: string
  allowFork: boolean
  tags?: string[]
  techStack?: string[]
  content?: string
  plugins?: string[]
  files?: any[]
  members?: ProjectMember[]
  ownerId: number
  ownerName: string
  teamId: string
  teamName: string
  myRole: string
  createdAt: string
  updatedAt: string
}

/**
 * 项目成员
 */
export interface ProjectMember {
  id: number
  username: string
  nickname: string
  avatar: string
  role: string
  roleCn: string
  joinedAt: string
}

/**
 * 项目列表响应
 */
export interface ProjectListResult {
  projects: Project[]
  total: number
  page: number
  size: number
}

/**
 * 获取我的项目参数
 */
export interface GetMyProjectsParams extends PaginationParams {
  keyword?: string
  status?: ProjectStatus
}

/**
 * 创建项目参数
 */
export interface CreateProjectParams {
  name: string
  visibility?: 'private' | 'public'
  teamId?: string
  description?: string
  category?: string
  coverUrl?: string
  type?: 'app' | 'document'
  allowFork?: boolean
  tags?: string[]
  techStack?: string[]
  content?: string
  plugins?: string[]
}

/**
 * 创建项目响应
 */
export interface CreateProjectResult {
  id: string
  name: string
  description: string
  ownerId: number
  teamId: string
  category: string
  coverUrl: string
  status: string
  progress: number
  visibility: string
  allowFork: boolean
  label: string
  createdAt: string
  currentUserRole: string
}

/**
 * 团队项目
 */
export interface TeamProject {
  id: string
  name: string
  description?: string
  category?: string
  coverUrl?: string
  status?: string
  visibility?: string
  progress?: number
  ownerId?: number
  ownerName?: string
  ownerAvatar?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 团队项目列表响应
 */
export interface TeamProjectsResult {
  projects: TeamProject[]
  total: number
  page: number
  size: number
}

/**
 * 创建团队响应（匹配后端 TeamCreateCollaborationResponse）
 */
export interface CreateTeamResult {
  team: TeamDetail
}

// ==================== 项目市场模块类型 ====================

/**
 * 市场项目列表项（匹配后端 ProjectMarketListItemResponse）
 */
export interface MarketProject {
  projectId: string
  projectImage: string
  projectName: string
  ownerId?: number
  ownerName: string
  ownerAvatar: string
  likeCount: number
  tags: string[]
}

/**
 * 市场项目详情（匹配后端 ProjectMarketDetailResponse）
 */
export interface MarketProjectDetail {
  id: string
  name: string
  description: string
  category: string
  coverUrl: string
  type: string
  status: string
  progress: number
  visibility: string
  allowFork: boolean
  createdAt: string
  updatedAt: string
  parentId: string
  ownerId: number
  ownerName: string
  ownerAvatar: string
  teamId: string
  teamName: string
  teamAvatar: string
  teamIsPersonal: boolean
  teamSize: number
  likeCount: number
  tags: string[]
}

/**
 * 市场项目列表响应
 */
export interface MarketProjectListResult {
  projects: MarketProject[]
  total: number
  page: number
  size: number
}

/**
 * 获取市场项目列表参数
 */
export interface GetMarketProjectsParams extends PaginationParams {
  keyword?: string
  category?: string
}

// ==================== 社区帖子模块类型 ====================

/**
 * 帖子可见性枚举
 */
export type PostVisibility = 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS'

/**
 * 帖子作者信息
 */
export interface PostAuthor {
  id: number
  username: string
  name?: string
  avatar?: string
}

/**
 * 帖子关联项目信息
 */
export interface PostProject {
  id: string
  name: string
}

/**
 * 帖子基本信息
 */
export interface Post {
  id: string
  title: string
  content: string
  images?: string[]
  tags?: string[]
  channel?: string
  visibility?: PostVisibility
  likesCount: number
  commentsCount: number
  viewsCount: number
  createdAt: string
  updatedAt?: string
  author: PostAuthor
  project?: PostProject
  isLiked?: boolean
}

/**
 * 帖子详情（包含完整信息）
 */
export interface PostDetail extends Post {
  channel: string
  visibility: PostVisibility
  updatedAt: string
}

/**
 * 创建帖子参数
 */
export interface CreatePostParams {
  title: string
  content: string
  images?: string
  tags?: string
  channel?: string
  visibility?: PostVisibility
  projectId?: string
}

/**
 * 更新帖子参数
 */
export interface UpdatePostParams {
  title?: string
  content?: string
  images?: string
  tags?: string
  visibility?: PostVisibility
}

// ==================== 社区评论模块类型 ====================

/**
 * 评论基本信息（包含前端状态）
 */
export interface Comment {
  id: string
  content: string
  userId: number
  username: string
  avatar?: string
  likesCount: number
  createdAt: string
  isLiked?: boolean
}

/**
 * 评论详情（包含父评论ID）
 */
export interface CommentDetail extends Comment {
  parentId: string | null
}

/**
 * 创建评论参数
 */
export interface CreateCommentParams {
  postId: string
  content: string
  parentId?: string
}

/**
 * 更新评论参数
 */
export interface UpdateCommentParams {
  content: string
}

// ==================== 社区圈子模块类型 ====================

/**
 * 圈子成员角色
 */
export type GroupMemberRole = 'admin' | 'member'

/**
 * 圈子创建者信息
 */
export interface GroupCreator {
  id: number
  username: string
}

/**
 * 圈子基本信息
 */
export interface Group {
  id: string
  name: string
  keyword: string
  description: string
  memberCount: number
  createdAt: string
  iconUrl?: string
  coverUrl?: string
  activeCount?: number
  postCount?: number
}

/**
 * 圈子详情
 */
export interface GroupDetail extends Group {
  iconUrl: string
  coverUrl: string
  createdBy: GroupCreator
}

/**
 * 创建圈子参数
 */
export interface CreateGroupParams {
  name: string
  keyword?: string
  description?: string
  iconUrl?: string
  coverUrl?: string
}

/**
 * 更新圈子参数
 */
export interface UpdateGroupParams {
  name?: string
  keyword?: string
  description?: string
  iconUrl?: string
  coverUrl?: string
}

/**
 * 圈子成员信息
 */
export interface GroupMember {
  id: string
  userId: number
  username: string
  avatar?: string
  role: GroupMemberRole
  joinedAt: string
}

/**
 * 更新圈子成员角色参数
 */
export interface UpdateGroupMemberRoleParams {
  role: GroupMemberRole
}

/**
 * 我加入的圈子列表项（匹配后端 /api/community/groups/my 返回格式）
 */
export interface MyGroupItem {
  id: string
  role: GroupMemberRole
  joinedAt: string
  user?: {
    id: number
    username: string
    avatar?: string
  }
  group?: {
    id: string
    name: string
    iconUrl?: string
    keyword?: string
    description?: string
  }
}

/**
 * 圈子成员数响应
 */
export interface GroupMemberCountResult {
  count: number
}

/**
 * 圈子成员状态响应
 */
export interface GroupMembershipResult {
  member: boolean
}

// ==================== 社区点赞模块类型 ====================

/**
 * 点赞数响应
 */
export interface LikeCountResult {
  count: number
}

/**
 * 点赞状态响应
 */
export interface LikeCheckResult {
  liked: boolean
}

// ==================== 用户关注模块类型 ====================

/**
 * 关注关系用户信息
 */
export interface FollowUser {
  id: number
  username: string
}

/**
 * 我的关注列表项（简化格式）
 */
export interface MyFollowingItem {
  id: string
  followingId: number
  followingName: string
  followingAvatar: string
  createdAt: string
}

/**
 * 我的粉丝列表项（简化格式）
 */
export interface MyFollowerItem {
  id: string
  followerId: number
  followerName: string
  followerAvatar: string
  createdAt: string
}

/**
 * 关注关系信息（旧格式，保留兼容）
 */
export interface FollowRelation {
  id: string
  followerId: number
  followingId: number
  createdAt: string
}

/**
 * 关注数响应
 */
export interface FollowCountResult {
  count: number
}

/**
 * 关注状态响应
 */
export interface FollowCheckResult {
  following: boolean
}

/**
 * 推荐关注用户
 */
export interface RecommendUser {
  id: number
  name: string
  avatar: string
  desc: string
  isFollowed: boolean
}

// ==================== 文件上传模块类型 ====================

/**
 * 文件上传结果
 */
export interface UploadResult {
  url: string
  filename: string
  size: number
}

// ==================== 邀请管理模块类型 ====================

/**
 * 邀请验证结果
 */
export interface InvitationValidateResult {
  valid: boolean
  teamId?: string
  teamName?: string
  inviterName?: string
}

// ==================== 系统接口类型 ====================

/**
 * 系统主页响应
 */
export interface SystemHomeResult {
  version: string
  docs: string
}

/**
 * 健康检查响应
 */
export interface HealthCheckResult {
  status: number
  message: string
  data: string
}

// ==================== 团队邀请模块类型 ====================

/**
 * 团队邀请项
 */
export interface InvitationItem {
  inviteeId: number
  inviteeEmail: string
  role: string
  status: string
  token: string
  expiresAt: string
}

/**
 * 团队邀请发送响应
 */
export interface TeamInvitationSendResult {
  totalInvited: number
  successCount: number
  invitations: InvitationItem[]
}

/**
 * 发送团队邀请参数
 */
export interface TeamInvitationSendParams {
  uuid: string
  emails: string[]
  role: 'ADMIN' | 'MEMBER'
}

/**
 * 更新团队成员角色参数
 */
export interface TeamMemberRoleUpdateParams {
  uuid: string
  memberId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}

/**
 * 转让团队所有权参数
 */
export interface TeamTransferOwnershipParams {
  uuid: string
  newOwnerId: number
}

// ==================== 报名审核统计模块类型 ====================

/**
 * 报名审核统计摘要
 */
export interface SignApplicationStatsSummary {
  total: number
  rejected: number
  pending: number
  approved: number
}

/**
 * 报名审核统计响应
 */
export interface SignApplicationStatsResponse {
  overall: SignApplicationStatsSummary
  groups: {
    primary?: SignApplicationStatsSummary
    middle?: SignApplicationStatsSummary
  }
}

/**
 * 获取报名审核统计参数
 */
export interface GetSignApplicationStatsParams {
  start_date?: string
  end_date?: string
  groups?: ('primary' | 'middle')[]
  include_overall?: boolean
}
