import { ref, computed, reactive, onMounted, watch, inject, type InjectionKey, type Ref, type ComputedRef } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/store'
import { useAppDialog } from '@/composables/useAppDialog'
import { getCurrentUserAvatar } from '@/utils/avatar'
import * as communityApi from '@/api/community'
import {
  followUser,
  unfollowUser,
  getMyFollowingCount,
  getMyFollowersCount,
  getRecommendUsers
} from '@/api/follow'
import { getUserStats } from '@/api/user'
import type { Group, MyGroupItem, Post, RecommendUser } from '@/api/types'

export interface StoryItem {
  id: string
  name: string
  avatar: string
  viewed: boolean
}

export interface CommunityContext {
  // 状态
  userStore: ReturnType<typeof useUserStore>
  defaultAvatar: ComputedRef<string>
  defaultGroupIcon: string
  searchQuery: Ref<string>
  activeFeed: Ref<string>
  postContent: Ref<string>
  showImageModal: Ref<boolean>
  modalImage: Ref<string>
  myGroups: Ref<MyGroupItem[]>
  allGroups: Ref<Group[]>
  showCreateGroupModal: Ref<boolean>
  feedTabs: { key: string; label: string }[]
  userStats: { posts: number; followers: number; following: number }
  hotTopics: Ref<{ name: string; count: string }[]>
  stories: Ref<StoryItem[]>
  suggestedUsers: Ref<RecommendUser[]>
  posts: Ref<Post[]>
  loading: Ref<boolean>
  // 计算属性
  filteredGroups: ComputedRef<Group[]>
  filteredPosts: ComputedRef<Post[]>
  // 工具方法
  formatCount: (count: number) => string
  formatTime: (dateStr: string) => string
  autoResize: (e: Event) => void
  handleImageError: (e: Event) => void
  // 事件处理
  openCreateModal: () => void
  handlePublish: () => Promise<void>
  viewStory: (story: StoryItem) => void
  toggleLike: (post: Post) => Promise<void>
  openComments: (post: Post) => void
  showPostMenu: (post: Post) => void
  submitComment: (post: Post) => Promise<void>
  toggleFollow: (user: RecommendUser) => Promise<void>
  goToProfile: (userId: string) => void
  openImageModal: (src: string) => void
  closeImageModal: () => void
  loadMorePosts: () => void
  fetchMyGroups: () => Promise<void>
  fetchAllGroups: () => Promise<void>
  selectGroup: (group: MyGroupItem) => void
  selectGroupById: (groupId: string) => void
  isJoined: (groupId: string) => boolean
  handleJoinGroup: (group: Group) => Promise<void>
  handleQuitGroup: (group: Group) => Promise<void>
}

export const COMMUNITY_KEY: InjectionKey<CommunityContext> = Symbol('community')

export function createCommunity(): CommunityContext {
  const router = useRouter()
  const message = useMessage()
  const userStore = useUserStore()
  const { confirm, showError, showSuccess, showWarning } = useAppDialog()

  // ==================== 状态管理 ====================

  /** 默认头像 - 使用统一的头像工具函数 */
  const defaultAvatar = computed(() => {
    return getCurrentUserAvatar(
      userStore.userInfo?.avatar,
      userStore.userInfo?.id,
      userStore.userInfo?.username
    )
  })
  /** 默认圈子图标 */
  const defaultGroupIcon: string =
    'https://api.dicebear.com/7.x/shapes/svg?seed=Group&backgroundColor=ffdfbf'
  /** 搜索关键词 */
  const searchQuery = ref('')
  /** 当前 Feed */
  const activeFeed = ref('recommend')
  /** 发布内容 */
  const postContent = ref('')
  /** 图片模态框 */
  const showImageModal = ref(false)
  const modalImage = ref('')
  /** 我的圈子列表 */
  const myGroups = ref<MyGroupItem[]>([])
  /** 所有圈子列表 */
  const allGroups = ref<Group[]>([])
  /** 显示创建圈子弹窗 */
  const showCreateGroupModal = ref(false)

  // ==================== 配置数据 ====================

  /** Feed 标签 */
  const feedTabs = [
    { key: 'recommend', label: '推荐' },
    { key: 'following', label: '关注' },
    { key: 'latest', label: '最新' },
    { key: 'groups', label: '圈子' }
  ]

  /** 用户统计 */
  const userStats = reactive({
    posts: 0,
    followers: 0,
    following: 0
  })

  /** 热门话题（基于帖子标签统计） */
  const hotTopics = ref<{ name: string; count: string }[]>([])

  /** Stories 数据（暂不实现，保留结构） */
  const stories = ref<StoryItem[]>([])

  /** 推荐用户 */
  const suggestedUsers = ref<RecommendUser[]>([])

  /** 帖子数据 */
  const posts = ref<Post[]>([])

  /** 加载状态 */
  const loading = ref(false)

  // ==================== 计算属性 ====================

  const filteredGroups = computed(() => {
    if (!searchQuery.value.trim()) return allGroups.value
    const query = searchQuery.value.toLowerCase()
    return allGroups.value.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        (group.keyword && group.keyword.toLowerCase().includes(query)) ||
        (group.description && group.description.toLowerCase().includes(query))
    )
  })

  const filteredPosts = computed(() => {
    if (!searchQuery.value.trim()) return posts.value
    const query = searchQuery.value.toLowerCase()
    return posts.value.filter(
      (post) =>
        post.content.toLowerCase().includes(query) ||
        post.author?.username?.toLowerCase().includes(query) ||
        (post.tags && post.tags.some((tag) => tag.toLowerCase().includes(query)))
    )
  })

  // ==================== 工具函数 ====================

  function formatCount(count: number): string {
    if (count >= 10000) return (count / 10000).toFixed(1) + 'w'
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k'
    return count.toString()
  }

  function formatTime(dateStr: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  function autoResize(e: Event): void {
    const target = e.target as HTMLTextAreaElement
    target.style.height = 'auto'
    target.style.height = target.scrollHeight + 'px'
  }

  /** 默认图片占位符 (Base64) */
  const PLACEHOLDER_IMG =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4='

  function handleImageError(e: Event): void {
    const target = e.target as HTMLImageElement
    if (target.src !== PLACEHOLDER_IMG) {
      target.src = PLACEHOLDER_IMG
    }
  }

  // ==================== 数据获取 ====================

  async function fetchPosts(): Promise<void> {
    loading.value = true
    try {
      let res
      switch (activeFeed.value) {
        case 'latest':
          res = await communityApi.getLatestPosts()
          break
        case 'recommend':
          res = await communityApi.getRecommendPosts()
          break
        case 'following':
          res = await communityApi.getFollowingPosts()
          break
        default:
          res = await communityApi.getPostList()
      }
      if (res.data.status === 200) {
        posts.value = res.data.data || []
        extractHotTopics()
      }
    } catch (error: any) {
      console.error('获取帖子列表失败:', error)
      if (activeFeed.value === 'following' && error?.response?.status === 401) {
        message.warning('请先登录后查看关注动态')
        posts.value = []
      }
    } finally {
      loading.value = false
    }
  }

  function extractHotTopics(): void {
    const tagCount: Record<string, number> = {}
    posts.value.forEach((post) => {
      if (post.tags) {
        post.tags.forEach((tag) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      }
    })
    hotTopics.value = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count: count.toString() }))
  }

  async function fetchUserStats(): Promise<void> {
    if (!userStore.isLoggedIn) return
    try {
      const [followingRes, followersRes, statsRes] = await Promise.all([
        getMyFollowingCount(),
        getMyFollowersCount(),
        getUserStats()
      ])
      userStats.following = followingRes.data.count || 0
      userStats.followers = followersRes.data.count || 0
      userStats.posts = statsRes.data.data.postCount || 0
    } catch (error) {
      console.error('获取用户统计失败:', error)
    }
  }

  async function fetchRecommendUsers(): Promise<void> {
    try {
      const res = await getRecommendUsers()
      if (res.data.status === 200) {
        suggestedUsers.value = res.data.data || []
      }
    } catch (error) {
      console.error('获取推荐用户失败:', error)
    }
  }

  // ==================== 事件处理 ====================

  function openCreateModal(): void {
    router.push('/community/create')
  }

  async function handlePublish(): Promise<void> {
    if (!postContent.value.trim()) return

    if (!userStore.isLoggedIn) {
      showWarning('请先登录后再发布动态')
      router.push('/login')
      return
    }

    try {
      const params = {
        title: '',
        content: postContent.value.trim(),
        channel: '动态',
        visibility: 'PUBLIC' as const
      }

      const res = await communityApi.createPost(params)

      if (res.data && (res.data.status === 201 || res.data.status === 200)) {
        postContent.value = ''
        await fetchPosts()
        await fetchUserStats()
        showSuccess('发布成功！')
      } else {
        showError(res.data?.message || '发布失败')
      }
    } catch (error: any) {
      console.error('发布动态失败:', error)
      if (error?.response?.status === 401) {
        showWarning('登录已过期，请重新登录')
        router.push('/login')
      } else {
        showError(error?.response?.data?.message || '发布失败，请稍后重试')
      }
    }
  }

  function viewStory(story: StoryItem): void {
    console.log('查看Story:', story.name)
    const index = stories.value.findIndex((s) => s.id === story.id)
    if (index !== -1) {
      stories.value[index] = { ...(stories.value[index] as any), viewed: true }
    }
  }

  async function toggleLike(post: Post): Promise<void> {
    try {
      const index = posts.value.findIndex((p) => p.id === post.id)
      if (index === -1) return
      if (post.isLiked) {
        await communityApi.unlikePost(post.id)
        posts.value[index] = {
          ...post,
          isLiked: false,
          likesCount: Math.max(0, post.likesCount - 1)
        }
      } else {
        await communityApi.likePost(post.id)
        posts.value[index] = {
          ...post,
          isLiked: true,
          likesCount: post.likesCount + 1
        }
      }
    } catch (error) {
      console.error('点赞操作失败:', error)
    }
  }

  function openComments(post: Post): void {
    router.push(`/community/post/${post.id}`)
  }

  function showPostMenu(post: Post): void {
    console.log('显示菜单:', post.id)
  }

  async function submitComment(post: Post): Promise<void> {
    router.push(`/community/post/${post.id}`)
  }

  async function toggleFollow(user: RecommendUser): Promise<void> {
    try {
      if (user.isFollowed) {
        await unfollowUser(Number(user.id))
        user.isFollowed = false
      } else {
        await followUser(Number(user.id))
        user.isFollowed = true
      }
    } catch (error) {
      console.error('关注操作失败:', error)
    }
  }

  function goToProfile(userId: string): void {
    console.log('[Community] 导航到用户主页:', userId)
    router.push(`/user/${userId}`)
  }

  function openImageModal(src: string): void {
    modalImage.value = src
    showImageModal.value = true
  }

  function closeImageModal(): void {
    showImageModal.value = false
  }

  function loadMorePosts(): void {
    console.log('加载更多帖子')
  }

  async function fetchMyGroups(): Promise<void> {
    try {
      const res = await communityApi.getMyGroups()
      if (res.data.status === 200) {
        myGroups.value = res.data.data || []
        console.log('[Community] 获取我的圈子成功:', myGroups.value.length)
      }
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error('获取我的圈子失败:', error)
      }
    }
  }

  async function fetchAllGroups(): Promise<void> {
    try {
      const res = await communityApi.getGroupList()
      if (res.data.status === 200) {
        allGroups.value = res.data.data || []
        console.log('[Community] 获取所有圈子成功:', allGroups.value.length)
      }
    } catch (error) {
      console.error('获取圈子列表失败:', error)
    }
  }

  function selectGroup(group: MyGroupItem): void {
    if (group.group?.id) {
      console.log('[Community] 从侧边栏选择圈子:', group.group.id)
      router.push(`/community/group/${group.group.id}`)
    } else {
      console.warn('[Community] 侧边栏圈子 ID 缺失:', group)
    }
  }

  function selectGroupById(groupId: string): void {
    console.log('[Community] 从列表选择圈子 ID:', groupId)
    router.push(`/community/group/${groupId}`)
  }

  function isJoined(groupId: string): boolean {
    return myGroups.value.some((mg) => mg.group?.id === groupId)
  }

  async function handleJoinGroup(group: Group): Promise<void> {
    if (!userStore.isLoggedIn) {
      router.push('/login')
      return
    }
    try {
      const res = await communityApi.joinGroup(group.id)
      if (res.data.status === 200) {
        await fetchMyGroups()
        console.log('加入成功')
      }
    } catch (error) {
      console.error('加入圈子失败:', error)
    }
  }

  async function handleQuitGroup(group: Group): Promise<void> {
    if (!(await confirm(`确定要退出圈子“${group.name}”吗？`))) return
    try {
      console.log('[Community] 正在退出圈子:', group.id)
      const res = await communityApi.quitGroup(group.id)
      if (res.data.status === 200) {
        await Promise.all([fetchMyGroups(), fetchAllGroups()])
        console.log('[Community] 退出圈子成功')
      }
    } catch (error: any) {
      console.error('[Community] 退出圈子失败:', error)
      const msg = error?.response?.data?.message || '退出操作遇到一点小麻烦，请稍后重试'
      showError(msg)
    }
  }

  onMounted(() => {
    fetchPosts()
    fetchAllGroups()
    fetchRecommendUsers()
    if (userStore.isLoggedIn) {
      fetchMyGroups()
      fetchUserStats()
    }
  })

  watch(activeFeed, (newFeed) => {
    if (newFeed !== 'groups') {
      fetchPosts()
    }
  })

  return {
    userStore,
    defaultAvatar,
    defaultGroupIcon,
    searchQuery,
    activeFeed,
    postContent,
    showImageModal,
    modalImage,
    myGroups,
    allGroups,
    showCreateGroupModal,
    feedTabs,
    userStats,
    hotTopics,
    stories,
    suggestedUsers,
    posts,
    loading,
    filteredGroups,
    filteredPosts,
    formatCount,
    formatTime,
    autoResize,
    handleImageError,
    openCreateModal,
    handlePublish,
    viewStory,
    toggleLike,
    openComments,
    showPostMenu,
    submitComment,
    toggleFollow,
    goToProfile,
    openImageModal,
    closeImageModal,
    loadMorePosts,
    fetchMyGroups,
    fetchAllGroups,
    selectGroup,
    selectGroupById,
    isJoined,
    handleJoinGroup,
    handleQuitGroup
  }
}

export function useCommunityContext(): CommunityContext {
  const ctx = inject(COMMUNITY_KEY)
  if (!ctx) {
    throw new Error('useCommunityContext 必须在 CommunityView 内使用')
  }
  return ctx
}
