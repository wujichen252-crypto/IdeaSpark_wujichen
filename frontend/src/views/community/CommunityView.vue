<template>
  <div class="community-view">
    <!-- 全局噪点纹理 -->
    <div class="grain-overlay"></div>

    <!-- 主布局 -->
    <div class="main-layout">
      <!-- 左侧边栏 -->
      <aside class="left-sidebar">
        <!-- 用户卡片 -->
        <div class="user-card glass-panel" :style="{ animationDelay: '0.1s' }">
          <div class="user-header">
            <div class="story-ring">
              <img
                  :src="userStore.userInfo?.avatar || defaultAvatar"
                  :alt="userStore.userInfo?.username"
                  class="user-avatar-lg"
                  @error="handleImageError"
                />
            </div>
            <div class="online-dot"></div>
          </div>
          <div class="user-info">
            <h3 class="user-name">{{ userStore.userInfo?.username || '创造者' }}</h3>
            <p class="user-role">{{ userStore.userInfo?.role || '产品设计师' }}</p>
          </div>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-value">{{ userStats.posts }}</span>
              <span class="stat-label">帖子</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ userStats.followers }}</span>
              <span class="stat-label">关注者</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ userStats.following }}</span>
              <span class="stat-label">关注</span>
            </div>
          </div>
          <button class="edit-btn" @click="$router.push('/profile')">
            编辑资料
          </button>
        </div>

        <!-- 热门话题 -->
        <div class="topics-card glass-panel" :style="{ animationDelay: '0.15s' }">
          <h4 class="card-title">
            <TrendingUp class="title-icon" />
            热门话题
          </h4>
          <div class="topics-list">
            <a
              v-for="topic in hotTopics"
              :key="topic.name"
              class="topic-item"
              @click="searchQuery = topic.name"
            >
              <span class="topic-name">#{{ topic.name }}</span>
              <span class="topic-count">{{ topic.count }} 帖子</span>
            </a>
          </div>
        </div>
      </aside>

      <!-- 中间内容区 -->
      <main class="feed-main">
        <!-- Feed 标签页 -->
        <div class="feed-tabs-section" :style="{ animationDelay: '0.05s' }">
          <div class="nav-tabs">
            <button
              v-for="tab in feedTabs"
              :key="tab.key"
              :class="['nav-tab', { active: activeFeed === tab.key }]"
              @click="activeFeed = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- 搜索框 -->
        <div class="search-section" :style="{ animationDelay: '0.1s' }">
          <div class="search-box">
            <Search class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="activeFeed === 'groups' ? '搜索圈子名称或关键字...' : '搜索社区帖子...'"
              class="search-input"
            />
          </div>
        </div>

        <!-- Stories -->
        <div class="stories-section" :style="{ animationDelay: '0.15s' }">
          <div class="stories-scroll">
            <!-- 添加 Story -->
            <button class="story-item add-story" @click="openCreateModal">
              <div class="story-avatar add-avatar">
                <Plus class="add-icon" />
              </div>
              <span class="story-name">发布</span>
            </button>
            <!-- Story 列表 -->
            <button
              v-for="story in stories"
              :key="story.id"
              class="story-item"
              @click="viewStory(story)"
            >
              <div :class="['story-ring-sm', { viewed: story.viewed }]">
                <img
                  :src="story.avatar"
                  :alt="story.name"
                  class="story-avatar"
                  @error="handleImageError"
                />
              </div>
              <span class="story-name">{{ story.name }}</span>
            </button>
          </div>
        </div>

        <!-- 发布框 -->
        <div class="create-post glass-panel" :style="{ animationDelay: '0.2s' }">
          <div class="create-inner">
            <img
              :src="userStore.userInfo?.avatar || defaultAvatar"
              :alt="userStore.userInfo?.username"
              class="create-avatar"
              @error="handleImageError"
            />
            <div class="create-content">
              <textarea
                v-model="postContent"
                placeholder="分享你的想法..."
                class="create-textarea"
                @input="autoResize"
              ></textarea>
              <div class="create-actions">
                <button
                  :class="['publish-btn', { active: postContent.trim() }]"
                  :disabled="!postContent.trim()"
                  @click="handlePublish"
                >
                  发布
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 帖子列表 -->
        <div v-if="activeFeed !== 'groups'" class="posts-list">
          <article
            v-for="(post, index) in filteredPosts"
            :key="post.id"
            class="post-card glass-panel"
            :style="{ animationDelay: `${0.3 + index * 0.1}s` }"
          >
            <!-- 帖子头部 -->
            <div class="post-header">
              <div class="author-info" @click="goToProfile(String(post.author?.id || ''))">
                <div class="story-ring-sm">
                  <img
                    :src="post.author?.avatar || defaultAvatar"
                    :alt="post.author?.username"
                    class="author-avatar"
                    @error="handleImageError"
                  />
                </div>
                <div class="author-meta">
                  <h4 class="author-name">{{ post.author?.username || '匿名用户' }}</h4>
                  <p class="post-time">{{ formatTime(post.createdAt) }} · {{ post.channel || '社区' }}</p>
                </div>
              </div>
              <button class="more-btn" @click.stop="showPostMenu(post)">
                <MoreHorizontal class="more-icon" />
              </button>
            </div>

            <!-- 帖子内容 -->
            <div class="post-body">
              <p class="post-text">{{ post.content }}</p>
              <!-- 图片网格 -->
              <div
                v-if="post.images && post.images.length"
                :class="['image-grid', `grid-${Math.min(post.images.length, 4)}`]"
              >
                <div
                  v-for="(img, idx) in post.images.slice(0, 4)"
                  :key="idx"
                  class="image-item"
                  @click="openImageModal(img)"
                >
                  <img
                    :src="img"
                    :alt="`图片${idx + 1}`"
                    class="post-image"
                    @error="handleImageError"
                  />
                  <div v-if="idx === 3 && post.images.length > 4" class="image-more">
                    +{{ post.images.length - 4 }}
                  </div>
                </div>
              </div>
              <!-- 标签 -->
              <div v-if="post.tags && post.tags.length" class="post-tags">
                <span
                  v-for="tag in post.tags"
                  :key="tag"
                  class="tag-link"
                  @click="searchQuery = tag"
                >
                  #{{ tag }}
                </span>
              </div>
            </div>

            <!-- 互动按钮 -->
            <div class="post-actions">
              <div class="actions-left">
                <button
                  :class="['action-btn like-btn', { active: post.isLiked }]"
                  @click="toggleLike(post)"
                >
                  <Heart class="action-icon" />
                  <span class="action-count">{{ formatCount(post.likesCount) }}</span>
                </button>
                <button class="action-btn" @click="openComments(post)">
                  <MessageCircle class="action-icon" />
                  <span class="action-count">{{ formatCount(post.commentsCount) }}</span>
                </button>
              </div>
            </div>

            <!-- 评论预览 -->
            <div class="comments-link">
              <button class="view-comments-btn" @click="openComments(post)">
                查看全部 {{ post.commentsCount }} 条评论
              </button>
            </div>
          </article>
        </div>

        <!-- 圈子列表 -->
        <div v-else class="groups-grid">
          <div
            v-for="(group, index) in filteredGroups"
            :key="group.id"
            class="group-card glass-panel"
            :style="{ animationDelay: `${0.3 + index * 0.1}s` }"
            @click="selectGroupById(group.id)"
          >
            <div class="group-cover-wrapper">
              <img
                :src="group.coverUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80'"
                class="group-cover"
                @error="handleImageError"
              />
              <div class="group-overlay"></div>
            </div>
            <div class="group-card-body">
              <img
                :src="group.iconUrl || defaultGroupIcon"
                :alt="group.name"
                class="group-card-icon"
                @error="handleImageError"
              />
              <div class="group-card-info">
                <h3 class="group-card-name">{{ group.name }}</h3>
                <p class="group-card-keyword">#{{ group.keyword || '通用圈子' }}</p>
              </div>
              <p class="group-card-desc">{{ group.description || '这个圈子还没有描述...' }}</p>
              <div class="group-card-footer">
                <span class="member-count">
                  <Users class="count-icon" />
                  {{ group.memberCount || 0 }} 成员
                </span>
                <button
                   v-if="!isJoined(group.id)"
                   class="join-btn-primary"
                   @click.stop="handleJoinGroup(group)"
                 >
                   加入圈子
                 </button>
                 <div v-else class="joined-actions">
                   <button
                     class="joined-btn"
                     @click.stop="selectGroupById(group.id)"
                   >
                     进入
                   </button>
                   <button
                     class="quit-btn"
                     title="退出圈子"
                     @click.stop="handleQuitGroup(group)"
                   >
                     <X class="quit-icon" />
                   </button>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="activeFeed !== 'groups'" class="load-more" :style="{ animationDelay: '0.7s' }">
          <button class="load-more-btn" @click="loadMorePosts">
            加载更多动态
          </button>
        </div>
      </main>

      <!-- 右侧边栏 -->
      <aside class="right-sidebar">
        <!-- 我的圈子 -->
        <div class="groups-card glass-panel" :style="{ animationDelay: '0.15s' }">
          <h4 class="card-title">
            <Users class="title-icon" />
            我的圈子
            <button class="explore-groups-btn" @click="activeFeed = 'groups'">
              <Compass class="explore-icon-sm" />
              <span>去逛逛</span>
            </button>
          </h4>
          <div class="groups-list">
            <div
              v-for="group in myGroups"
              :key="group.id"
              class="group-item"
            >
              <div class="group-item-content" @click="selectGroup(group)">
                <img
                  :src="group.group?.iconUrl || defaultGroupIcon"
                  :alt="group.group?.name"
                  class="group-icon"
                  @error="handleImageError"
                />
                <div class="group-info">
                  <span class="group-name">{{ group.group?.name }}</span>
                  <span class="group-count">{{ group.role === 'admin' ? '管理员' : '成员' }}</span>
                </div>
              </div>
              <button
                v-if="group.group?.id"
                class="enter-group-btn"
                @click.stop="selectGroup(group)"
              >
                进入
              </button>
            </div>
            <div v-if="myGroups.length === 0" class="empty-groups">
              <p>还没有加入圈子</p>
              <button class="explore-btn" @click="activeFeed = 'groups'">探索圈子</button>
            </div>
          </div>
        </div>

        <!-- 推荐关注 -->
        <div class="suggest-card glass-panel" :style="{ animationDelay: '0.2s' }">
          <h4 class="card-title">
            推荐关注
            <button class="view-all-btn">查看全部</button>
          </h4>
          <div class="suggest-list">
            <div
              v-for="user in suggestedUsers"
              :key="user.id"
              class="suggest-item"
            >
              <div class="suggest-user" @click="goToProfile(String(user.id))">
                <img
                  :src="user.avatar"
                  :alt="user.name"
                  class="suggest-avatar"
                  @error="handleImageError"
                />
                <div class="suggest-info">
                  <p class="suggest-name">{{ user.name }}</p>
                  <p class="suggest-desc">{{ user.desc }}</p>
                </div>
              </div>
              <button class="follow-btn" @click="toggleFollow(user)">
                <UserPlus class="follow-icon" />
              </button>
            </div>
          </div>
        </div>

        <!-- 底部链接 -->
        <div class="footer-links" :style="{ animationDelay: '0.25s' }">
          <div class="links-row">
            <a href="#" class="footer-link">关于</a>
            <a href="#" class="footer-link">隐私</a>
            <a href="#" class="footer-link">条款</a>
            <a href="#" class="footer-link">帮助</a>
            <a href="#" class="footer-link">广告</a>
          </div>
          <p class="copyright">© 2026 Community. All rights reserved.</p>
        </div>
      </aside>
    </div>

    <!-- 浮动发布按钮 (移动端) -->
    <button class="floating-btn" @click="openCreateModal">
      <Plus class="floating-icon" />
    </button>

    <!-- 图片预览模态框 -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <button class="modal-close" @click="closeImageModal">
        <X class="close-icon" />
      </button>
      <img :src="modalImage" alt="预览图片" class="modal-image" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useUserStore } from '@/store'
import { useAppDialog } from '@/composables/useAppDialog'
import { getCurrentUserAvatar, getOtherUserAvatar } from '@/utils/avatar'
import {
  Search,
  Plus,
  Image,
  Link,
  Hash,
  Smile,
  Heart,
  MessageCircle,
  MoreHorizontal,
  TrendingUp,
  UserPlus,
  Users,
  X,
  Compass
} from 'lucide-vue-next'
import type { Ref } from 'vue'
import * as communityApi from '@/api/community'
import { followUser, unfollowUser, getMyFollowingCount, getMyFollowersCount, getRecommendUsers } from '@/api/follow'
import { getUserStats } from '@/api/user'
import type { Group, MyGroupItem, Post, RecommendUser } from '@/api/types'

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
const defaultGroupIcon: string = 'https://api.dicebear.com/7.x/shapes/svg?seed=Group&backgroundColor=ffdfbf'
/** 搜索关键词 */
const searchQuery: Ref<string> = ref('')
/** 当前 Feed */
const activeFeed: Ref<string> = ref('recommend')
/** 发布内容 */
const postContent: Ref<string> = ref('')
/** 图片模态框 */
const showImageModal: Ref<boolean> = ref(false)
const modalImage: Ref<string> = ref('')
/** 我的圈子列表 */
const myGroups: Ref<MyGroupItem[]> = ref([])
/** 所有圈子列表 */
const allGroups: Ref<Group[]> = ref([])
/** 显示创建圈子弹窗 */
const showCreateGroupModal: Ref<boolean> = ref(false)

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
const hotTopics: Ref<{ name: string; count: string }[]> = ref([])

/** Stories 数据（暂不实现，保留结构） */
const stories: Ref<{ id: string; name: string; avatar: string; viewed: boolean }[]> = ref([])

/** 推荐用户 */
const suggestedUsers: Ref<RecommendUser[]> = ref([])

/** 帖子数据 */
const posts: Ref<Post[]> = ref([])

/** 加载状态 */
const loading = ref(false)

// ==================== 计算属性 ====================

/**
 * 过滤后的圈子列表
 */
const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) return allGroups.value
  const query = searchQuery.value.toLowerCase()
  return allGroups.value.filter(group =>
    group.name.toLowerCase().includes(query) ||
    (group.keyword && group.keyword.toLowerCase().includes(query)) ||
    (group.description && group.description.toLowerCase().includes(query))
  )
})

/**
 * 过滤后的帖子列表
 */
const filteredPosts = computed(() => {
  if (!searchQuery.value.trim()) return posts.value
  const query = searchQuery.value.toLowerCase()
  return posts.value.filter(post =>
    post.content.toLowerCase().includes(query) ||
    post.author?.username?.toLowerCase().includes(query) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
  )
})

// ==================== 工具函数 ====================

/**
 * 格式化计数
 * @param count - 数量
 * @returns 格式化后的字符串
 */
function formatCount(count: number): string {
  if (count >= 10000) return (count / 10000).toFixed(1) + 'w'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'k'
  return count.toString()
}

/**
 * 格式化时间
 * @param dateStr - 时间字符串
 * @returns 格式化后的时间
 */
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

/**
 * 自动调整文本框高度
 * @param e - 事件对象
 */
function autoResize(e: Event): void {
  const target = e.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = target.scrollHeight + 'px'
}

/** 默认图片占位符 (Base64) */
const PLACEHOLDER_IMG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMSAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4='

/**
 * 处理图片加载错误
 * @param e - 错误事件
 */
function handleImageError(e: Event): void {
  const target = e.target as HTMLImageElement
  if (target.src !== PLACEHOLDER_IMG) {
    target.src = PLACEHOLDER_IMG
  }
}

// ==================== 数据获取 ====================

/**
 * 获取帖子列表（根据当前 Feed 类型）
 */
async function fetchPosts(): Promise<void> {
  loading.value = true
  try {
    let res
    // 根据当前选中的标签页调用不同的 API
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
      // 从帖子中提取热门标签
      extractHotTopics()
    }
  } catch (error: any) {
    console.error('获取帖子列表失败:', error)
    // 如果是关注页面且未登录，显示提示
    if (activeFeed.value === 'following' && error?.response?.status === 401) {
      message.warning('请先登录后查看关注动态')
      posts.value = []
    }
  } finally {
    loading.value = false
  }
}

/**
 * 从帖子中提取热门标签
 */
function extractHotTopics(): void {
  const tagCount: Record<string, number> = {}
  posts.value.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    }
  })
  hotTopics.value = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count: count.toString() }))
}

/**
 * 获取用户统计数据
 */
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

/**
 * 获取推荐关注用户
 */
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

/**
 * 打开发布模态框
 */
function openCreateModal(): void {
  router.push('/community/create')
}

/**
 * 发布帖子
 * 调用真实的创建帖子接口
 */
async function handlePublish(): Promise<void> {
  if (!postContent.value.trim()) return

  // 检查用户是否登录
  if (!userStore.isLoggedIn) {
    showWarning('请先登录后再发布动态')
    router.push('/login')
    return
  }

  try {
    // 准备请求参数
    const params = {
      title: '', // 标题可选，这里传空字符串
      content: postContent.value.trim(),
      channel: '动态', // 默认频道
      visibility: 'PUBLIC' as const // 默认公开
    }

    // 调用创建帖子接口
    const res = await communityApi.createPost(params)

    if (res.data && (res.data.status === 201 || res.data.status === 200)) {
      // 发布成功
      postContent.value = ''
      // 刷新帖子列表
      await fetchPosts()
      // 更新用户统计
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

/**
 * 查看Story
 * @param story - Story数据
 */
function viewStory(story: typeof stories.value[0]): void {
  console.log('查看Story:', story.name)
  const index = stories.value.findIndex(s => s.id === story.id)
  if (index !== -1) {
    stories.value[index] = { ...(stories.value[index] as any), viewed: true }
  }
}

/**
 * 切换点赞
 * @param post - 帖子数据
 */
async function toggleLike(post: Post): Promise<void> {
  try {
    const index = posts.value.findIndex(p => p.id === post.id)
    if (index === -1) return
    if (post.isLiked) {
      await communityApi.unlikePost(post.id)
      posts.value[index] = { ...post, isLiked: false, likesCount: Math.max(0, post.likesCount - 1) }
    } else {
      await communityApi.likePost(post.id)
      posts.value[index] = { ...post, isLiked: true, likesCount: post.likesCount + 1 }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
  }
}

/**
 * 打开评论
 * @param post - 帖子数据
 */
function openComments(post: Post): void {
  router.push(`/community/post/${post.id}`)
}

/**
 * 显示帖子菜单
 * @param post - 帖子数据
 */
function showPostMenu(post: Post): void {
  console.log('显示菜单:', post.id)
}

/**
 * 提交评论
 * @param post - 帖子数据
 */
async function submitComment(post: Post): Promise<void> {
  // 评论功能在帖子详情页实现
  router.push(`/community/post/${post.id}`)
}

/**
 * 切换关注
 * @param user - 用户数据
 */
async function toggleFollow(user: typeof suggestedUsers.value[0]): Promise<void> {
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

/**
 * 跳转到用户主页
 * @param userId - 用户ID
 */
function goToProfile(userId: string): void {
  console.log('[Community] 导航到用户主页:', userId)
  router.push(`/user/${userId}`)
}

/**
 * 打开图片模态框
 * @param src - 图片地址
 */
function openImageModal(src: string): void {
  modalImage.value = src
  showImageModal.value = true
}

/**
 * 关闭图片模态框
 */
function closeImageModal(): void {
  showImageModal.value = false
}

/**
 * 加载更多帖子
 */
function loadMorePosts(): void {
  console.log('加载更多帖子')
}

/**
 * 获取我的圈子列表
 */
async function fetchMyGroups(): Promise<void> {
  try {
    const res = await communityApi.getMyGroups()
    if (res.data.status === 200) {
      myGroups.value = res.data.data || []
      console.log('[Community] 获取我的圈子成功:', myGroups.value.length)
    }
  } catch (error: any) {
    // 静默处理 401 错误（用户未登录或 token 过期）
    if (error?.response?.status !== 401) {
      console.error('获取我的圈子失败:', error)
    }
  }
}

/**
 * 获取所有圈子列表
 */
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

/**
 * 选择圈子
 * @param group - 圈子数据
 */
function selectGroup(group: MyGroupItem): void {
  if (group.group?.id) {
    console.log('[Community] 从侧边栏选择圈子:', group.group.id)
    router.push(`/community/group/${group.group.id}`)
  } else {
    console.warn('[Community] 侧边栏圈子 ID 缺失:', group)
  }
}

/**
 * 根据 ID 选择圈子
 * @param groupId - 圈子 ID
 */
function selectGroupById(groupId: string): void {
  console.log('[Community] 从列表选择圈子 ID:', groupId)
  router.push(`/community/group/${groupId}`)
}

/**
 * 检查是否已加入圈子
 * @param groupId - 圈子 ID
 */
function isJoined(groupId: string): boolean {
  return myGroups.value.some(mg => mg.group?.id === groupId)
}

/**
 * 加入圈子处理
 * @param group - 圈子数据
 */
async function handleJoinGroup(group: Group): Promise<void> {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res = await communityApi.joinGroup(group.id)
    if (res.data.status === 200) {
      // 刷新我的圈子列表
      await fetchMyGroups()
      console.log('加入成功')
    }
  } catch (error) {
     console.error('加入圈子失败:', error)
   }
 }
 
 /**
 * 处理退出圈子
 * @param group - 圈子数据
 */
async function handleQuitGroup(group: Group): Promise<void> {
  if (!(await confirm(`确定要退出圈子“${group.name}”吗？`))) return
  try {
    console.log('[Community] 正在退出圈子:', group.id)
    const res = await communityApi.quitGroup(group.id)
    if (res.data.status === 200) {
      // 刷新我的圈子列表和所有圈子列表
      await Promise.all([fetchMyGroups(), fetchAllGroups()])
      console.log('[Community] 退出圈子成功')
    }
  } catch (error: any) {
    console.error('[Community] 退出圈子失败:', error)
    const message = error?.response?.data?.message || '退出操作遇到一点小麻烦，请稍后重试'
    showError(message)
  }
}
 
  onMounted(() => {
  // 初始化数据
  fetchPosts()
  fetchAllGroups()
  fetchRecommendUsers()
  // 只有登录用户才获取个人数据
  if (userStore.isLoggedIn) {
    fetchMyGroups()
    fetchUserStats()
  }
})

// 监听标签页变化，切换时重新获取帖子
watch(activeFeed, (newFeed) => {
  if (newFeed !== 'groups') {
    fetchPosts()
  }
})
</script>

<style scoped lang="scss">
// ==================== 设计令牌 ====================
$color-bg: #fafafa;
$color-white: #ffffff;
$color-black: #000000;
$color-gray-900: #111827;
$color-gray-800: #1f2937;
$color-gray-700: #374151;
$color-gray-600: #6b7280;
$color-gray-500: #6b7280;
$color-gray-400: #9ca3af;
$color-gray-300: #d1d5db;
$color-gray-200: #e5e7eb;
$color-gray-100: #f3f4f6;
$color-gray-50: #f9fafb;
$color-success: #10b981;
$color-warning: #f59e0b;
$color-danger: #ef4444;
$color-blue: #3b82f6;
$color-purple: #a855f7;

$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

// ==================== 全局样式 ====================
.community-view {
  min-height: 100vh;
  background: $color-bg;
  position: relative;
}

.grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

// ==================== 主布局 ====================
.main-layout {
  max-width: 1400px;
  margin: 0 auto;
  padding: 80px 32px 48px;
  display: grid;
  grid-template-columns: 220px 1fr 220px;
  gap: 32px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    padding: 72px 16px 32px;
  }
}

// ==================== 玻璃面板 ====================
.glass-panel {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.7s $ease-out-expo forwards;
  opacity: 0;
}

// ==================== 左侧边栏 ====================
.left-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 80px;
  height: fit-content;
  max-height: calc(100vh - 96px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 1024px) {
    display: none;
  }
}

// Feed 标签区域（中间内容区顶部）
.feed-tabs-section {
  animation: slideUp 0.7s $ease-out-expo forwards;
  opacity: 0;
  background: $color-white;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .nav-tabs {
    display: flex;
    flex-direction: row;
    gap: 8px;
  }

  .nav-tab {
    padding: 10px 24px;
    background: transparent;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: $color-gray-600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    flex: 1;

    &:hover {
      color: $color-gray-900;
      background: $color-gray-100;
    }

    &.active {
      background: $color-black;
      color: $color-white;
    }
  }
}

// 圈子卡片
.groups-card {
  padding: 20px;
}

// 圈子网格视图
.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.group-card {
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.08);
  }

  .group-cover-wrapper {
    height: 120px;
    position: relative;
    overflow: hidden;

    .group-cover {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .group-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.2));
    }
  }

  .group-card-body {
    padding: 0 20px 20px;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .group-card-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      border: 4px solid $color-white;
      object-fit: cover;
      margin-top: -32px;
      position: relative;
      z-index: 2;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .group-card-info {
      .group-card-name {
        font-size: 18px;
        font-weight: 600;
        color: $color-gray-900;
        margin-bottom: 2px;
      }

      .group-card-keyword {
        font-size: 13px;
        color: $color-success;
        font-weight: 500;
      }
    }

    .group-card-desc {
      font-size: 14px;
      color: $color-gray-600;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 42px;
    }

    .group-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      padding-top: 16px;
      border-top: 1px solid $color-gray-100;

      .member-count {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: $color-gray-500;

        .count-icon {
          width: 16px;
          height: 16px;
        }
      }

      .join-btn-primary {
        padding: 8px 16px;
        background: $color-black;
        color: $color-white;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: #333;
          transform: scale(1.05);
        }
      }

      .joined-btn {
        padding: 8px 20px;
        background: $color-black;
        color: $color-white;
        border: none;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

        &:hover {
          background: #333;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        &:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
        }
      }

      .joined-actions {
        display: flex;
        gap: 8px;
        flex: 1;
        justify-content: flex-end;
      }

      .quit-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: $color-white;
        border: 1.5px solid $color-gray-400;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: $color-danger;
          border-color: $color-danger;
          transform: scale(1.05);
        }

        .quit-icon {
          width: 18px;
          height: 18px;
          color: $color-gray-600;
          stroke-width: 2.5px;
          flex-shrink: 0;
        }

        &:hover .quit-icon {
          color: $color-white;
        }
      }
    }
  }
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: $color-gray-100;
  }

  .group-item-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-grow: 1;
    cursor: pointer;
  }

  .group-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    object-fit: cover;
  }

  .group-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .group-name {
      font-size: 14px;
      font-weight: 500;
      color: $color-gray-900;
    }

    .group-count {
      font-size: 12px;
      color: $color-gray-500;
    }
  }

  .enter-group-btn {
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 600;
    color: $color-white;
    background: $color-black;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    &:hover {
      background: #333;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }
  }
}

.empty-groups {
  text-align: center;
  padding: 20px 0;

  p {
    font-size: 13px;
    color: $color-gray-500;
    margin-bottom: 12px;
  }

  .explore-btn {
    padding: 8px 16px;
    background: $color-black;
    border: none;
    border-radius: 8px;
    color: $color-white;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.3s ease;

    &:hover {
      background: #1f1f1f;
    }
  }
}

.add-icon-sm {
  width: 16px;
  height: 16px;
}

.user-card {
  padding: 24px;
  text-align: center;
}

.user-header {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.story-ring {
  background: linear-gradient(135deg, #fbbf24 0%, #ef4444 50%, #ec4899 100%);
  padding: 3px;
  border-radius: 50%;
}

.user-avatar-lg {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid $color-white;
}

.online-dot {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: $color-success;
  border-radius: 50%;
  border: 3px solid $color-white;
}

.user-info {
  margin-bottom: 20px;

  .user-name {
    font-size: 18px;
    font-weight: 600;
    color: $color-gray-900;
    margin-bottom: 4px;
  }

  .user-role {
    font-size: 14px;
    color: $color-gray-500;
  }
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  .stat-item {
    display: flex;
    flex-direction: column;

    .stat-value {
      font-size: 20px;
      font-weight: 600;
      color: $color-gray-900;
    }

    .stat-label {
      font-size: 12px;
      color: $color-gray-500;
    }
  }
}

.edit-btn {
  width: 100%;
  padding: 10px;
  background: $color-black;
  border: none;
  border-radius: 12px;
  color: $color-white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #1f1f1f;
  }
}

.topics-card {
  padding: 24px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: $color-gray-900;
  margin-bottom: 16px;

  .title-icon {
    width: 18px;
    height: 18px;
  }

  .view-all-btn {
    margin-left: auto;
    font-size: 12px;
    font-weight: 400;
    color: $color-gray-500;
    background: none;
    border: none;
    cursor: pointer;

    &:hover {
      color: $color-black;
    }
  }

  // 去逛逛按钮样式
  .explore-groups-btn {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: $color-gray-600;
    background: $color-gray-100;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;

    .explore-icon-sm {
      width: 14px;
      height: 14px;
    }

    &:hover {
      color: $color-white;
      background: $color-black;
    }
  }
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topic-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 0.7;
  }

  .topic-name {
    font-size: 14px;
    font-weight: 500;
    color: $color-gray-900;
  }

  .topic-count {
    font-size: 12px;
    color: $color-gray-400;
  }
}

// ==================== 中间内容区 ====================
.feed-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// 搜索区域
.search-section {
  animation: slideUp 0.7s $ease-out-expo forwards;
  opacity: 0;
}

.search-box {
  position: relative;
  width: 100%;

  .search-icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: $color-gray-400;
  }

  .search-input {
    width: 100%;
    padding: 12px 16px 12px 48px;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: 16px;
    font-size: 14px;
    color: $color-gray-900;
    transition: all 0.3s ease;

    &::placeholder {
      color: $color-gray-400;
    }

    &:focus {
      outline: none;
      border-color: $color-black;
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
    }
  }
}

// Stories
.stories-section {
  animation: slideUp 0.7s $ease-out-expo forwards;
  opacity: 0;
}

.stories-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;

  &::-webkit-scrollbar {
    display: none;
  }
}

.story-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
}

.story-ring-sm {
  background: linear-gradient(135deg, #fbbf24 0%, #ef4444 50%, #ec4899 100%);
  padding: 2px;
  border-radius: 50%;

  &.viewed {
    background: $color-gray-200;
  }
}

.story-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid $color-white;
}

.add-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: $color-white;
  border: 2px dashed $color-gray-300;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s ease;

  .add-icon {
    width: 24px;
    height: 24px;
    color: $color-gray-400;
  }

  &:hover {
    border-color: $color-black;

    .add-icon {
      color: $color-black;
    }
  }
}

.story-name {
  font-size: 12px;
  color: $color-gray-600;
}

// 发布框
.create-post {
  padding: 24px;
}

.create-inner {
  display: flex;
  gap: 16px;
}

.create-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.create-content {
  flex: 1;
}

.create-textarea {
  width: 100%;
  background: transparent;
  border: none;
  resize: none;
  font-size: 15px;
  color: $color-gray-900;
  line-height: 1.6;
  min-height: 60px;
  margin-bottom: 16px;

  &::placeholder {
    color: $color-gray-400;
  }

  &:focus {
    outline: none;
  }
}

.create-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid $color-gray-100;
}

.publish-btn {
  padding: 8px 24px;
  background: $color-gray-200;
  border: none;
  border-radius: 9999px;
  color: $color-gray-400;
  font-size: 14px;
  font-weight: 500;
  cursor: not-allowed;
  transition: all 0.3s ease;

  &.active {
    background: $color-black;
    color: $color-white;
    cursor: pointer;

    &:hover {
      background: #1f1f1f;
    }
  }
}

// 帖子卡片
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.post-card {
  padding: 24px;
  transition: transform 0.4s $ease-out-expo;

  &:hover {
    transform: translateY(-2px);
  }
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid $color-white;
}

.author-meta {
  .author-name {
    font-size: 14px;
    font-weight: 600;
    color: $color-gray-900;
    margin-bottom: 2px;
  }

  .post-time {
    font-size: 12px;
    color: $color-gray-500;
  }
}

.more-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: $color-gray-100;
  }

  .more-icon {
    width: 20px;
    height: 20px;
    color: $color-gray-400;
  }
}

.post-body {
  margin-bottom: 16px;
}

.post-text {
  font-size: 15px;
  color: $color-gray-800;
  line-height: 1.7;
  margin-bottom: 16px;
}

// 图片网格
.image-grid {
  display: grid;
  gap: 8px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;

  &.grid-1 {
    grid-template-columns: 1fr;
  }

  &.grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  &.grid-3 {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);

    .image-item:first-child {
      grid-column: 1 / -1;
    }
  }

  &.grid-4 {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
}

.image-item {
  position: relative;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  cursor: zoom-in;

  .post-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s $ease-out-expo;

    &:hover {
      transform: scale(1.05);
    }
  }

  .image-more {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-white;
    font-size: 18px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, 0.4);
    }
  }
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-link {
  color: $color-blue;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

// 互动按钮
.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid $color-gray-100;
}

.actions-left,
.actions-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 9999px;
  color: $color-gray-500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  .action-icon {
    width: 20px;
    height: 20px;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &.like-btn.active {
    color: $color-danger;
    background: rgba(239, 68, 68, 0.1);
  }

  &.active {
    color: $color-gray-900;
  }
}

// 评论预览
.comments-preview {
  margin-top: 16px;
  padding: 16px;
  background: $color-gray-50;
  border-radius: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;

  &:last-of-type {
    margin-bottom: 16px;
  }
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-bubble {
  background: $color-white;
  border-radius: 16px;
  border-top-left-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 4px;

  .comment-author {
    font-size: 13px;
    font-weight: 500;
    color: $color-gray-900;
    margin-right: 8px;
  }

  .comment-text {
    font-size: 13px;
    color: $color-gray-600;
  }
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: 8px;

  .meta-btn {
    font-size: 12px;
    color: $color-gray-500;
    background: none;
    border: none;
    cursor: pointer;

    &:hover {
      color: $color-gray-900;
    }
  }

  .meta-time {
    font-size: 12px;
    color: $color-gray-400;
  }

  .like-meta-btn {
    display: flex;
    align-items: center;
    gap: 4px;

    .meta-icon {
      width: 12px;
      height: 12px;
    }
  }
}

.comment-input-wrap {
  display: flex;
  gap: 12px;
  align-items: center;
}

.comment-input-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: $color-white;
  border: 1px solid $color-gray-200;
  border-radius: 9999px;
  padding: 8px 16px;
}

.comment-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 14px;
  color: $color-gray-900;

  &::placeholder {
    color: $color-gray-400;
  }

  &:focus {
    outline: none;
  }
}

.send-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;

  .send-icon {
    width: 16px;
    height: 16px;
    color: $color-gray-400;
    transition: color 0.3s ease;
  }

  &:hover .send-icon {
    color: $color-black;
  }
}

// 加载更多
.load-more {
  text-align: center;
  padding: 32px 0;
  animation: slideUp 0.7s $ease-out-expo forwards;
  opacity: 0;
}

.load-more-btn {
  padding: 12px 32px;
  background: transparent;
  border: 1px solid $color-gray-200;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 500;
  color: $color-gray-600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: $color-black;
    background: $color-black;
    color: $color-white;
  }
}

// ==================== 右侧边栏 ====================
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: sticky;
  top: 80px;
  height: fit-content;
  max-height: calc(100vh - 96px);
  overflow-y: auto;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 1024px) {
    display: none;
  }
}

.suggest-card {
  padding: 24px;
}

.suggest-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.suggest-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.suggest-user {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.suggest-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.suggest-info {
  .suggest-name {
    font-size: 14px;
    font-weight: 500;
    color: $color-gray-900;
    margin-bottom: 2px;
  }

  .suggest-desc {
    font-size: 12px;
    color: $color-gray-500;
  }
}

.follow-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: $color-gray-100;
  }

  .follow-icon {
    width: 18px;
    height: 18px;
    color: $color-gray-400;
  }
}

.footer-links {
  padding: 0 8px;
  animation: slideUp 0.7s $ease-out-expo forwards;
  opacity: 0;
}

.links-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;
}

.footer-link {
  font-size: 12px;
  color: $color-gray-400;
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: $color-gray-600;
  }
}

.copyright {
  font-size: 12px;
  color: $color-gray-300;
}

// ==================== 浮动按钮 ====================
.floating-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: $color-black;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s $ease-out-expo;
  z-index: 50;

  &:hover {
    transform: scale(1.05) rotate(90deg);
    box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.3);
  }

  .floating-icon {
    width: 24px;
    height: 24px;
    color: $color-white;
  }

  @media (min-width: 1024px) {
    display: none;
  }
}

// ==================== 图片模态框 ====================
.image-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.modal-close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.3s ease;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .close-icon {
    width: 24px;
    height: 24px;
    color: $color-white;
  }
}

.modal-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
}

// ==================== 动画 ====================
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .main-layout {
    padding: 80px 16px 32px;
  }

  .create-post {
    padding: 16px;
  }

  .post-card {
    padding: 16px;
  }

  .image-grid {
    &.grid-2,
    &.grid-3,
    &.grid-4 {
      grid-template-columns: 1fr;
    }
  }
}
</style>
