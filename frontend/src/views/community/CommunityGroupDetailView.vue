<template>
  <div class="community-group-detail-view">
    <div class="grain-overlay"></div>
    <div class="group-detail-layout">
      <!-- 圈子头部信息 -->
      <div class="group-header glass-panel">
        <img
:src="groupDetail?.coverUrl || defaultCover"
alt="Group Cover"
class="group-cover"
@error="handleImageError" />
        <div class="header-content">
          <img
:src="groupDetail?.iconUrl || defaultGroupIcon"
:alt="groupDetail?.name"
class="group-icon"
@error="handleImageError" />
          <div class="group-info">
            <h1 class="group-name">{{ groupDetail?.name }}</h1>
            <p class="group-keyword">#{{ groupDetail?.keyword }}</p>
            <p class="group-description">{{ groupDetail?.description }}</p>
            <div class="group-stats">
              <span>{{ groupDetail?.memberCount || 0 }} 成员</span>
              <span>创建于 {{ formatTime(groupDetail?.createdAt) }}</span>
            </div>
          </div>
          <div class="group-actions">
            <button v-if="!isJoined" class="join-btn" @click="handleJoinGroup">加入圈子</button>
            <button v-else class="joined-btn" @click="handleQuitGroup">已加入 / 退出</button>
          </div>
        </div>
      </div>

      <!-- 圈子内容区 -->
      <div class="group-content">
        <div class="content-left">
          <!-- 帖子发布框（仅成员可见） -->
          <div v-if="isJoined" class="create-post glass-panel">
            <div class="create-inner">
              <img
                :src="getCurrentUserAvatar(userStore.userInfo?.avatar, userStore.userInfo?.id, userStore.userInfo?.username)"
                :alt="userStore.userInfo?.username"
                class="create-avatar"
                @error="handleAvatarErrorEvent($event, userStore.userInfo?.id, userStore.userInfo?.username)"
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

          <!-- 圈子帖子列表 -->
          <div class="posts-list">
            <article
              v-for="(post, index) in groupPosts"
              :key="post.id"
              class="post-card glass-panel"
              :style="{ animationDelay: `${0.1 + index * 0.05}s` }"
            >
              <!-- 帖子头部 -->
              <div class="post-header">
                <div class="author-info" @click="goToProfile(String(post.author?.id || ''))">
                <div class="story-ring-sm">
                  <img
:src="getOtherUserAvatar(post.author?.avatar, post.author?.id, post.author?.username)"
:alt="post.author?.username"
class="author-avatar"
@error="handleAvatarErrorEvent($event, post.author?.id, post.author?.username)" />
                </div>
                  <div class="author-meta">
                    <h4 class="author-name">{{ post.author?.username || '匿名用户' }}</h4>
                    <p class="post-time">{{ formatTime(post.createdAt) }} · {{ post.channel || '社区' }}</p>
                  </div>
                </div>
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
@error="handleImageError" />
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

            <!-- 无内容提示 -->
            <div v-if="groupPosts.length === 0" class="empty-posts glass-panel">
              <p>这个圈子还没有动态，快来发布第一条吧！</p>
            </div>
          </div>
        </div>

        <div class="content-right">
          <!-- 圈子成员 -->
          <div class="members-card glass-panel">
            <h3 class="card-title">圈子成员 ({{ groupMembers.length }})</h3>
            <div class="members-list">
              <div
v-for="member in groupMembers"
:key="member.id"
class="member-item"
@click="goToProfile(String(member.userId || member.id || ''))">
                <img
:src="getOtherUserAvatar(member.avatar, member.userId, member.username)"
:alt="member.username"
class="member-avatar"
@error="handleImageError" />
                <div class="member-info">
                  <p class="member-name">{{ member.username }}</p>
                  <span class="member-role">{{ member.role === 'admin' ? '管理员' : '成员' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store'
import { useAppDialog } from '@/composables/useAppDialog'
import * as communityApi from '@/api/community'
import type { GroupDetail, GroupMember, Post } from '@/api/types'
import { getOtherUserAvatar, getCurrentUserAvatar } from '@/utils/avatar'
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  X
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { confirm, showError } = useAppDialog()

const groupId = ref<string>('')
const groupDetail = ref<GroupDetail | null>(null)
const groupMembers = ref<GroupMember[]>([])
const groupPosts = ref<Post[]>([])
const isJoined = ref<boolean>(false)
const postContent = ref<string>('')
const showImageModal = ref<boolean>(false)
const modalImage = ref<string>('')
const searchQuery = ref<string>('')

import { getTeamAvatar, handleAvatarError } from '@/utils/avatar'

/** 默认头像（使用本地 SVG） */
const defaultAvatar: string = getTeamAvatar(undefined, 'User', true, 2)
const defaultGroupIcon: string = getTeamAvatar(undefined, 'Group', true, 2)
const defaultCover: string = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDEyMDAgMzAwIj48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlNWU3ZWIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI0OCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjOWJhM2FkIj5Db3ZlciBJbWFnZTwvdGV4dD48L3N2Zz4='

/**
 * 处理图片加载错误（通用）
 * @param e - 错误事件
 */
function handleImageError(e: Event): void {
  const target = e.target as HTMLImageElement
  if (!target.dataset.errorHandled) {
    target.dataset.errorHandled = 'true'
    target.src = defaultCover
  }
}

/**
 * 处理头像加载错误
 * @param e - 错误事件
 * @param userId - 用户 ID
 * @param username - 用户名
 */
function handleAvatarErrorEvent(e: Event, userId?: number | string, username?: string): void {
  const target = e.target as HTMLImageElement
  if (!target.dataset.errorHandled) {
    target.dataset.errorHandled = 'true'
    target.src = handleAvatarError(2, userId, username)
  }
}

// ==================== 数据获取 ====================

/**
 * 获取圈子详情
 */
async function fetchGroupDetail(): Promise<void> {
  try {
    const res = await communityApi.getGroupDetail(groupId.value)
    if (res.data.status === 200) {
      groupDetail.value = res.data.data
    }
  } catch (error) {
    console.error('获取圈子详情失败:', error)
  }
}

/**
 * 后端返回的成员数据结构
 */
interface BackendGroupMember {
  id: string
  role: 'admin' | 'member'
  joinedAt: string
  user?: {
    id: number
    username: string
    avatar?: string | null
  }
}

/**
 * 将后端成员数据转换为前端格式
 * @param backendMember - 后端返回的成员数据
 * @returns 转换后的 GroupMember 格式
 */
function convertBackendMemberToFrontend(backendMember: BackendGroupMember): GroupMember {
  return {
    id: backendMember.id,
    userId: backendMember.user?.id || 0,
    username: backendMember.user?.username || '未知用户',
    avatar: backendMember.user?.avatar || undefined,
    role: backendMember.role,
    joinedAt: backendMember.joinedAt
  }
}

/**
 * 获取圈子成员
 */
async function fetchGroupMembers(): Promise<void> {
  try {
    const res = await communityApi.getGroupMembers(groupId.value)
    if (res.data.status === 200) {
      // 转换后端数据格式为前端格式
      const backendMembers = res.data.data as BackendGroupMember[]
      groupMembers.value = backendMembers.map(convertBackendMemberToFrontend)
    }
  } catch (error) {
    console.error('获取圈子成员失败:', error)
  }
}

/**
 * 获取圈子帖子
 */
async function fetchGroupPosts(): Promise<void> {
  try {
    const keyword = groupDetail.value?.keyword
    const res = await communityApi.getPostList(keyword)
    if (res.data.status === 200) {
      groupPosts.value = res.data.data || []
      console.log(`[GroupDetail] 获取到 ${groupPosts.value.length} 条帖子`)
    }
  } catch (error) {
    console.error('获取圈子帖子失败:', error)
  }
}

/**
 * 检查用户是否已加入圈子
 */
async function checkUserMembership(): Promise<void> {
  if (!userStore.isLoggedIn) {
    isJoined.value = false
    return
  }
  try {
    const res = await communityApi.checkGroupMembership(groupId.value)
    if (res.data.status === 200) {
      isJoined.value = res.data.data?.member || false
    }
  } catch (error) {
    console.error('检查圈子成员状态失败:', error)
    isJoined.value = false
  }
}

// ==================== 工具函数 ====================

/**
 * 格式化时间
 * @param dateStr - 时间字符串
 * @returns 格式化后的时间
 */
function formatTime(dateStr: string | undefined): string {
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
 * 自动调整文本框高度
 * @param e - 事件对象
 */
function autoResize(e: Event): void {
  const target = e.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = target.scrollHeight + 'px'
}

// ==================== 事件处理 ====================

/**
 * 处理加入圈子
 */
async function handleJoinGroup(): Promise<void> {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res = await communityApi.joinGroup(groupId.value)
    if (res.data.status === 200) {
      isJoined.value = true
      fetchGroupDetail() // 刷新成员数量
      console.log('加入圈子成功')
    }
  } catch (error) {
    console.error('加入圈子失败:', error)
  }
}

/**
 * 处理退出圈子
 */
async function handleQuitGroup(): Promise<void> {
  if (!(await confirm(`确定要退出圈子“${groupDetail.value?.name}”吗？`))) return
  try {
    console.log('[GroupDetail] 正在退出圈子:', groupId.value)
    const res = await communityApi.quitGroup(groupId.value)
    if (res.data.status === 200) {
      isJoined.value = false
      await fetchGroupDetail() // 刷新成员数量
      console.log('[GroupDetail] 退出圈子成功')
    }
  } catch (error: any) {
    console.error('[GroupDetail] 退出圈子失败:', error)
    const message = error?.response?.data?.message || '退出操作遇到一点小麻烦，请稍后重试'
    showError(message)
  }
}

/**
 * 发布帖子
 */
async function handlePublish(): Promise<void> {
  if (!postContent.value.trim()) return
  try {
    const res = await communityApi.createPost({
      title: '',
      content: postContent.value.trim(),
      channel: groupDetail.value?.keyword || '',
      visibility: 'PUBLIC'
    })
    if (res.data.status === 200 || res.data.status === 201) {
      postContent.value = ''
      await fetchGroupPosts()
    }
  } catch (error) {
    console.error('发布帖子失败:', error)
  }
}

/**
 * 切换点赞
 * @param post - 帖子数据
 */
async function toggleLike(post: Post): Promise<void> {
  try {
    const index = groupPosts.value.findIndex(p => p.id === post.id)
    if (index === -1) return
    if (post.isLiked) {
      await communityApi.unlikePost(post.id)
      groupPosts.value[index] = { ...post, isLiked: false, likesCount: Math.max(0, post.likesCount - 1) }
    } else {
      await communityApi.likePost(post.id)
      groupPosts.value[index] = { ...post, isLiked: true, likesCount: post.likesCount + 1 }
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
 * 跳转到用户主页
 * @param userId - 用户 ID
 */
function goToProfile(userId: string): void {
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

// ==================== 生命周期钩子 ====================

onMounted(async () => {
  groupId.value = route.params.id as string
  if (groupId.value) {
    await fetchGroupDetail()
    await fetchGroupMembers()
    await fetchGroupPosts()
    await checkUserMembership()
  }
})

// 监听路由参数变化，重新加载数据
watch(
  () => route.params.id,
  async (newId) => {
    if (newId && newId !== groupId.value) {
      groupId.value = newId as string
      await fetchGroupDetail()
      await fetchGroupMembers()
      await fetchGroupPosts()
      await checkUserMembership()
    }
  }
)
</script>

<style scoped lang="scss">
@use '@/styles/mixins.scss';

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

.community-group-detail-view {
  min-height: 100vh;
  background: $color-bg;
  position: relative;
  padding-top: 56px; // 避让顶部 Header
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

.group-detail-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.group-header {
  margin-bottom: 30px;
  overflow: hidden;
  position: relative;
  border-radius: 24px;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
}

.group-cover {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.header-content {
  padding: 20px 40px 30px;
  display: flex;
  align-items: flex-end;
  gap: 20px;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  margin-top: -80px;
  border-radius: 0 0 24px 24px;
}

.group-icon {
  width: 100px;
  height: 100px;
  border-radius: 20px;
  border: 5px solid $color-white;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.group-info {
  flex-grow: 1;

  .group-name {
    font-size: 32px;
    font-weight: 700;
    color: $color-gray-900;
    margin-bottom: 5px;
  }

  .group-keyword {
    font-size: 16px;
    color: $color-success;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .group-description {
    font-size: 15px;
    color: $color-gray-700;
    line-height: 1.6;
    margin-bottom: 15px;
  }

  .group-stats {
    font-size: 14px;
    color: $color-gray-600;

    span {
      margin-right: 15px;
    }
  }
}

.group-actions {
  flex-shrink: 0;

  .join-btn, .joined-btn {
    padding: 12px 28px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .join-btn {
    background: $color-black;
    color: $color-white;
    border: none;

    &:hover {
      background: #333;
      transform: translateY(-2px);
    }
  }

  .joined-btn {
    background: $color-gray-100;
    color: $color-gray-700;
    border: 1px solid $color-gray-300;

    &:hover {
      background: $color-gray-200;
      transform: translateY(-2px);
    }
  }
}

.group-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.content-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-right {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.members-card {
  padding: 25px;
  border-radius: 24px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);

  .card-title {
    font-size: 20px;
    font-weight: 600;
    color: $color-gray-900;
    margin-bottom: 20px;
  }

  .members-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .member-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 10px 0;
    border-bottom: 1px solid $color-gray-100;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    .member-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .member-info {
      flex-grow: 1;

      .member-name {
        font-size: 16px;
        font-weight: 500;
        color: $color-gray-900;
        margin-bottom: 2px;
      }

      .member-role {
        font-size: 13px;
        color: $color-gray-500;
      }
    }
  }
}

// 帖子发布框样式 (复用 CommunityView 的样式)
.create-post {
  padding: 20px;
  border-radius: 24px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);

  .create-inner {
    display: flex;
    gap: 15px;
  }

  .create-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .create-content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .create-textarea {
    width: 100%;
    min-height: 60px;
    border: none;
    resize: none;
    font-size: 15px;
    padding: 10px;
    border-radius: 12px;
    background: $color-gray-50;
    color: $color-gray-900;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      background: $color-white;
      box-shadow: 0 0 0 2px $color-success;
    }

    &::placeholder {
      color: $color-gray-500;
    }
  }

  .create-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .publish-btn {
    padding: 10px 20px;
    background: $color-gray-300;
    color: $color-gray-600;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: not-allowed;
    transition: all 0.3s ease;

    &.active {
      background: $color-black;
      color: $color-white;
      cursor: pointer;

      &:hover {
        background: #333;
      }
    }
  }
}

// 帖子列表样式 (复用 CommunityView 的样式)
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-posts {
  padding: 40px;
  text-align: center;
  color: $color-gray-500;
  font-size: 16px;
  border-radius: 24px;
}

.post-card {
  padding: 20px;
  border-radius: 24px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
  }
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.story-ring-sm {
  background: linear-gradient(135deg, #fbbf24 0%, #ef4444 50%, #ec4899 100%);
  padding: 2px;
  border-radius: 50%;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-meta {
  .author-name {
    font-size: 16px;
    font-weight: 600;
    color: $color-gray-900;
    margin-bottom: 2px;
  }

  .post-time {
    font-size: 13px;
    color: $color-gray-500;
  }
}

.post-body {
  margin-bottom: 15px;
}

.post-text {
  font-size: 15px;
  color: $color-gray-800;
  line-height: 1.6;
  margin-bottom: 15px;
}

.image-grid {
  display: grid;
  gap: 8px;
  margin-bottom: 15px;

  &.grid-1 {
    grid-template-columns: 1fr;
  }
  &.grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  &.grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }
  &.grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

.image-item {
  position: relative;
  padding-top: 100%; // 1:1 aspect ratio
  overflow: hidden;
  border-radius: 12px;
  cursor: zoom-in;

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-more {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    color: $color-white;
    font-size: 24px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
  }
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-link {
  background: $color-gray-100;
  color: $color-gray-700;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: $color-gray-200;
  }
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid $color-gray-100;
}

.actions-left, .actions-right {
  display: flex;
  gap: 15px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: $color-gray-600;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: $color-gray-900;
  }

  &.like-btn.active {
    color: $color-danger;
  }

  .action-icon {
    width: 20px;
    height: 20px;
  }
}

.comments-link {
  margin-top: 15px;
  text-align: right;

  .view-comments-btn {
    background: none;
    border: none;
    color: $color-blue;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: $color-white;
  font-size: 30px;
  cursor: pointer;
}

.modal-image {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}
</style>