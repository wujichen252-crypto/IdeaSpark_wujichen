<template>
  <div class="project-detail-view">
    <!-- 全局噪点纹理 -->
    <div class="grain-overlay"></div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="loadError" class="error-state">
      <div class="empty-icon">
        <FolderOpen />
      </div>
      <h3>项目不存在</h3>
      <p>{{ loadError }}</p>
      <button class="back-btn" @click="router.push('/market')">返回项目市场</button>
    </div>

    <!-- 主内容 -->
    <template v-else>
      <!-- 顶部返回栏 -->
      <header class="detail-header">
        <div class="header-inner">
          <button class="back-link" @click="router.push('/market')">
            <ArrowLeft class="back-icon" />
            <span>返回市场</span>
          </button>
        </div>
      </header>

      <!-- 项目 Hero 区域 -->
      <section class="project-hero">
        <div class="hero-inner">
          <!-- 分类标签 -->
          <span class="category-badge">{{ projectData.categoryLabel }}</span>

          <!-- 项目标题 -->
          <h1 class="project-title">{{ projectData.title }}</h1>

          <!-- 项目简介 -->
          <p class="project-summary">{{ projectData.summary }}</p>

          <!-- 作者和统计信息 -->
          <div class="hero-meta">
            <div class="author-info" @click="goToAuthor">
              <img
                :src="projectData.authorAvatar || getDefaultAvatar(projectData.author)"
                :alt="projectData.author"
                class="author-avatar"
              />
              <div class="author-details">
                <span class="author-name">{{ projectData.author }}</span>
                <span class="publish-date">发布于 {{ projectData.publishDate }}</span>
              </div>
            </div>

            <div class="project-stats">
              <span class="stat-item">
                <Heart class="stat-icon" :class="{ liked: isLiked }" @click.stop="toggleLike" />
                <span>{{ formatNumber(projectData.likes) }}</span>
              </span>
              <span class="stat-item">
                <MessageCircle class="stat-icon" />
                <span>{{ formatNumber(commentCount) }}</span>
              </span>
              <span v-if="userStore.isLoggedIn" class="stat-item">
                <BookmarkCheck v-if="isFavorited" class="stat-icon favorited" @click.stop="toggleFavorite" />
                <Bookmark v-else class="stat-icon" @click.stop="toggleFavorite" />
                <span>{{ isFavorited ? '已收藏' : '收藏' }}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 封面图区域 -->
      <section class="cover-section">
        <div class="cover-inner">
          <div class="cover-image-wrap">
            <img
              :src="projectData.cover || getDefaultCover(projectData.title)"
              :alt="projectData.title"
              class="cover-image"
            />
          </div>
        </div>
      </section>

      <!-- 主体内容区 -->
      <main class="main-content">
        <div class="content-inner">
          <!-- 左侧详情 -->
          <div class="left-column">
            <!-- 项目介绍 -->
            <div class="content-card">
              <h2 class="section-title">项目介绍</h2>
              <div class="description-content">{{ projectData.description || '暂无项目介绍' }}</div>
            </div>

            <!-- 技术栈 -->
            <div class="content-card">
              <h2 class="section-title">技术栈</h2>
              <div class="tech-tags">
                <span v-for="tag in projectData.techStack" :key="tag" class="tech-tag">
                  {{ tag }}
                </span>
                <span v-if="projectData.techStack.length === 0" class="empty-text">暂无标签</span>
              </div>
            </div>

            <!-- 评论区 -->
            <div class="content-card comments-section">
              <h2 class="section-title">
                评论
                <span class="comment-count">({{ commentCount }})</span>
              </h2>

              <!-- 发表评论 -->
              <div class="comment-input-area">
                <img
                  :src="currentUserAvatar || getDefaultAvatar('User')"
                  alt="当前用户"
                  class="current-user-avatar"
                />
                <div class="input-wrapper">
                  <textarea
                    v-model="newComment"
                    placeholder="写下你的评论..."
                    class="comment-textarea"
                    rows="3"
                  ></textarea>
                  <div class="input-actions">
                    <button
                      class="submit-btn"
                      :disabled="!newComment.trim() || submitting"
                      @click="submitComment"
                    >
                      {{ submitting ? '发布中...' : '发布评论' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 评论列表 -->
              <div class="comments-list">
                <div v-if="commentsLoading" class="comments-loading">
                  <div class="loading-spinner small"></div>
                  <span>加载评论...</span>
                </div>

                <div v-else-if="comments.length === 0" class="comments-empty">
                  <MessageSquare class="empty-icon" />
                  <p>暂无评论，来说两句吧~</p>
                </div>

                <template v-else>
                  <div
                    v-for="comment in comments"
                    :key="comment.id"
                    class="comment-item"
                  >
                    <img
                      :src="comment.avatar || getDefaultAvatar(comment.username)"
                      :alt="comment.username"
                      class="comment-avatar"
                      @click="router.push(`/user/${comment.userId}`)"
                    />
                    <div class="comment-content">
                      <div class="comment-header">
                        <span class="comment-author" @click="router.push(`/user/${comment.userId}`)">
                          {{ comment.username }}
                        </span>
                        <span class="comment-date">{{ formatCommentDate(comment.createdAt) }}</span>
                      </div>
                      <p class="comment-text">{{ comment.content }}</p>
                      <div class="comment-actions">
                        <button class="action-btn" @click="likeComment(comment)">
                          <Heart class="action-icon" :class="{ liked: comment.isLiked }" />
                          <span>{{ comment.likesCount || 0 }}</span>
                        </button>
                        <button class="action-btn" @click="replyTo(comment)">
                          <MessageCircle class="action-icon" />
                          <span>回复</span>
                        </button>
                        <button
                          v-if="canDeleteComment(comment)"
                          class="action-btn delete"
                          @click="deleteComment(comment.id)"
                        >
                          <Trash2 class="action-icon" />
                          <span>删除</span>
                        </button>
                      </div>

                      <!-- 回复输入框 -->
                      <div v-if="replyingTo === comment.id" class="reply-input-area">
                        <textarea
                          v-model="replyContent"
                          :placeholder="`回复 ${comment.username}...`"
                          class="reply-textarea"
                          rows="2"
                        ></textarea>
                        <div class="reply-actions">
                          <button class="cancel-btn" @click="cancelReply">取消</button>
                          <button
                            class="submit-btn small"
                            :disabled="!replyContent.trim() || submitting"
                            @click="submitReply(comment.id)"
                          >
                            {{ submitting ? '发布中...' : '回复' }}
                          </button>
                        </div>
                      </div>

                      <!-- 回复列表 -->
                      <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                        <div
                          v-for="reply in comment.replies"
                          :key="reply.id"
                          class="reply-item"
                        >
                          <img
                            :src="reply.avatar || getDefaultAvatar(reply.username)"
                            :alt="reply.username"
                            class="reply-avatar"
                            @click="router.push(`/user/${reply.userId}`)"
                          />
                          <div class="reply-content">
                            <div class="reply-header">
                              <span class="reply-author" @click="router.push(`/user/${reply.userId}`)">
                                {{ reply.username }}
                              </span>
                              <span class="reply-date">{{ formatCommentDate(reply.createdAt) }}</span>
                            </div>
                            <p class="reply-text">{{ reply.content }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- 右侧侧边栏 -->
          <div class="right-column">
            <!-- 项目信息卡片 -->
            <div class="sidebar-card">
              <h3 class="sidebar-title">项目信息</h3>
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">项目ID</span>
                  <span class="info-value">{{ projectData.id }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">分类</span>
                  <span class="info-value">{{ projectData.categoryLabel }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">发布日期</span>
                  <span class="info-value">{{ projectData.publishDate }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">最后更新</span>
                  <span class="info-value">{{ projectData.lastUpdate }}</span>
                </div>
              </div>
            </div>

            <!-- 作者卡片 -->
            <div class="sidebar-card author-card">
              <h3 class="sidebar-title">创作者</h3>
              <div class="author-profile" @click="goToAuthor">
                <img
                  :src="projectData.authorAvatar || getDefaultAvatar(projectData.author)"
                  :alt="projectData.author"
                  class="author-avatar-large"
                />
                <div class="author-info-detail">
                  <span class="author-name-large">{{ projectData.author }}</span>
                  <span class="author-role">项目作者</span>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button class="action-btn primary" @click="handleAction('demo')">
                <Play class="btn-icon" />
                <span>运行演示</span>
              </button>
              <button class="action-btn secondary" @click="handleAction('source')">
                <Code class="btn-icon" />
                <span>查看源码</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMarketProjectDetail } from '@/api/market'
import { checkFavorite, favoriteProject, unfavoriteProject, checkLiked, likeProject, unlikeProject } from '@/api/project'
import {
  createProjectComment,
  getProjectComments,
  getCommentReplies,
  deleteProjectComment,
  updateCommentLikes,
  getProjectCommentCount,
  type ProjectComment
} from '@/api/market/comment'
import { useUserStore } from '@/store'
import { useAppDialog } from '@/composables/useAppDialog'
import { getOtherUserAvatar } from '@/utils/avatar'
import {
  ArrowLeft,
  Heart,
  Play,
  Code,
  FolderOpen,
  MessageCircle,
  MessageSquare,
  Trash2,
  Bookmark,
  BookmarkCheck
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { confirm, showError, showWarning } = useAppDialog()
const projectId = route.params.projectId as string

// 状态
const loading = ref(false)
const loadError = ref('')
const isLiked = ref(false)
const isFavorited = ref(false)
const commentCount = ref(0)
const commentsLoading = ref(false)
const submitting = ref(false)
const newComment = ref('')
const comments = ref<ProjectComment[]>([])
const replyingTo = ref<string | null>(null)
const replyContent = ref('')

// 当前用户信息
const currentUserId = computed(() => userStore.userInfo?.id)
const currentUserAvatar = computed(() => userStore.userInfo?.avatar)

// 项目数据
const projectData = ref({
  id: '',
  title: '',
  summary: '',
  cover: '',
  category: '',
  categoryLabel: '',
  author: '',
  authorId: '',
  authorAvatar: '',
  publishDate: '',
  lastUpdate: '',
  likes: 0,
  techStack: [] as string[],
  description: ''
})

// 获取分类标签
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'ai': '人工智能',
    'frontend': '前端开发',
    'backend': '后端服务',
    'mobile': '移动开发',
    'design': '设计创意',
    'other': '其他'
  }
  return labels[category] || '其他'
}

// 格式化日期
function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 格式化评论日期（相对时间）
function formatCommentDate(dateStr: string): string {
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
  if (days < 30) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 格式化数字
function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0'
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

// 获取默认封面
function getDefaultCover(name: string | undefined): string {
  const colors = ['1a1a2e', '16213e', '0f3460', '533483', '1e3a5f']
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0
  const color = colors[colorIndex]
  return `https://placehold.co/1200x600/${color}/ffffff?text=${encodeURIComponent(name || 'Project')}`
}

// 获取默认头像
function getDefaultAvatar(username: string | undefined): string {
  return getOtherUserAvatar(undefined, undefined, username)
}

// 加载项目详情
async function loadProjectDetail() {
  if (!projectId) {
    loadError.value = '项目ID不能为空'
    return
  }

  loading.value = true
  loadError.value = ''

  try {
    console.log('[项目详情] 加载项目:', projectId)
    const res = await getMarketProjectDetail(projectId)
    console.log('[项目详情] API响应:', res)

    const responseData: any = res.data
    const data = responseData.data

    if (!data) {
      loadError.value = '项目数据为空'
      return
    }

    // 映射 API 数据到页面格式
    projectData.value = {
      id: data.id || projectId,
      title: data.name || '未命名项目',
      summary: data.description || '',
      cover: data.coverUrl || '',
      category: data.category || 'other',
      categoryLabel: getCategoryLabel(data.category),
      author: data.ownerName || '匿名用户',
      authorId: String(data.ownerId || ''),
      authorAvatar: data.ownerAvatar || '',
      publishDate: formatDate(data.createdAt),
      lastUpdate: formatDate(data.updatedAt),
      likes: data.likeCount || 0,
      techStack: data.tags || [],
      description: data.description || ''
    }

    console.log('[项目详情] 处理后的数据:', projectData.value)

    // 加载评论
    await loadComments()
    await loadCommentCount()

    // 检查是否已收藏
    if (userStore.isLoggedIn) {
      try {
        const favRes = await checkFavorite(projectId)
        if (favRes.data.status === 200) {
          isFavorited.value = favRes.data.data?.favorited || false
        }
      } catch (e) {
        console.error('[项目详情] 检查收藏状态失败:', e)
      }

      // 检查是否已点赞
      try {
        const likeRes = await checkLiked(projectId)
        if (likeRes.data.status === 200) {
          isLiked.value = likeRes.data.data?.liked || false
        }
      } catch (e) {
        console.error('[项目详情] 检查点赞状态失败:', e)
      }
    }
  } catch (err: any) {
    console.error('[项目详情] 加载失败:', err)
    loadError.value = err.message || '加载项目详情失败'
  } finally {
    loading.value = false
  }
}

// 加载评论列表
async function loadComments() {
  commentsLoading.value = true
  try {
    const res = await getProjectComments(projectId)
    const responseData: any = res.data
    const data = responseData.data || []

    // 为每条评论加载回复
    const enrichedData = []
    for (const comment of data) {
      const enriched = { ...comment, isLiked: false, replies: [] as any[] }
      try {
        const repliesRes = await getCommentReplies(comment.id)
        const repliesData: any = repliesRes.data
        enriched.replies = repliesData.data || []
      } catch (e) {
        enriched.replies = []
      }
      enrichedData.push(enriched)
    }

    comments.value = enrichedData
    console.log('[项目详情] 评论列表:', comments.value)
  } catch (err: any) {
    console.error('[项目详情] 加载评论失败:', err)
  } finally {
    commentsLoading.value = false
  }
}

// 加载评论数量
async function loadCommentCount() {
  try {
    const res = await getProjectCommentCount(projectId)
    const responseData: any = res.data
    commentCount.value = responseData.data?.count || 0
  } catch (err) {
    console.error('[项目详情] 加载评论数量失败:', err)
  }
}

// 提交评论
async function submitComment() {
  if (!newComment.value.trim()) return

  submitting.value = true
  try {
    await createProjectComment({
      projectId,
      content: newComment.value.trim()
    })
    newComment.value = ''
    await loadComments()
    await loadCommentCount()
  } catch (err: any) {
    console.error('[项目详情] 发布评论失败:', err)
    await showError(err.message || '发布评论失败')
  } finally {
    submitting.value = false
  }
}

// 回复评论
function replyTo(comment: ProjectComment) {
  replyingTo.value = comment.id
  replyContent.value = ''
}

// 取消回复
function cancelReply() {
  replyingTo.value = null
  replyContent.value = ''
}

// 提交回复
async function submitReply(parentId: string) {
  if (!replyContent.value.trim()) return

  submitting.value = true
  try {
    await createProjectComment({
      projectId,
      content: replyContent.value.trim(),
      parentId
    })
    cancelReply()
    await loadComments()
    await loadCommentCount()
  } catch (err: any) {
    console.error('[项目详情] 发布回复失败:', err)
    await showError(err.message || '发布回复失败')
  } finally {
    submitting.value = false
  }
}

// 点赞评论
async function likeComment(comment: ProjectComment) {
  try {
    const newLiked = !comment.isLiked
    const newCount = Math.max(0, (comment.likesCount || 0) + (newLiked ? 1 : -1))
    await updateCommentLikes(comment.id, newCount)
    const index = comments.value.findIndex(c => c.id === comment.id)
    if (index !== -1) {
      comments.value[index] = { ...comments.value[index], isLiked: newLiked, likesCount: newCount } as any
    }
  } catch (err) {
    console.error('[项目详情] 点赞失败:', err)
  }
}

// 删除评论
async function deleteComment(commentId: string) {
  if (!(await confirm('确定要删除这条评论吗？'))) return

  try {
    await deleteProjectComment(commentId)
    await loadComments()
    await loadCommentCount()
  } catch (err: any) {
    console.error('[项目详情] 删除评论失败:', err)
    await showError(err.message || '删除评论失败')
  }
}

// 判断是否可以删除评论
function canDeleteComment(comment: ProjectComment): boolean {
  return currentUserId.value !== undefined && Number(currentUserId.value) === comment.userId
}

// 跳转到作者主页
function goToAuthor() {
  if (projectData.value.authorId) {
    router.push(`/user/${projectData.value.authorId}`)
  }
}

// 切换点赞
async function toggleLike() {
  if (!projectData.value) return
  if (!userStore.isLoggedIn) {
    await showWarning('请先登录')
    return
  }
  try {
    const newLiked = !isLiked.value
    if (newLiked) {
      await likeProject(projectId)
    } else {
      await unlikeProject(projectId)
    }
    isLiked.value = newLiked
    const newLikes = Math.max(0, projectData.value.likes + (newLiked ? 1 : -1))
    projectData.value = { ...projectData.value, likes: newLikes }
  } catch (error: any) {
    console.error('[项目详情] 点赞操作失败:', error)
  }
}

async function toggleFavorite() {
  if (!userStore.isLoggedIn) {
    await showWarning('请先登录')
    return
  }
  try {
    if (isFavorited.value) {
      await unfavoriteProject(projectId)
      isFavorited.value = false
    } else {
      await favoriteProject(projectId)
      isFavorited.value = true
    }
  } catch (error: any) {
    console.error('[项目详情] 收藏操作失败:', error)
    await showError(error?.response?.data?.message || '操作失败，请重试')
  }
}

// 处理操作按钮
function handleAction(type: 'demo' | 'source') {
  console.log(`[项目详情] ${type === 'demo' ? '运行演示' : '查看源码'}`)
  // TODO: 实现具体功能
}

onMounted(() => {
  window.scrollTo(0, 0)
  loadProjectDetail()
})
</script>

<style scoped lang="scss">
// ==================== 设计令牌 ====================
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --radius-full: 9999px;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-3xl: 2rem;
}

// ==================== 全局样式 ====================
.project-detail-view {
  min-height: 100vh;
  background: #fafafa;
  position: relative;
  padding-bottom: 80px;
}

// 噪点纹理
.grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

// ==================== 加载状态 ====================
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 2px solid #e5e7eb;
    border-top-color: #000000;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    &.small {
      width: 20px;
      height: 20px;
      border-width: 2px;
    }
  }

  p {
    font-size: 14px;
    color: #9ca3af;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ==================== 错误状态 ====================
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 40px;

  .empty-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d1d5db;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #9ca3af;
    margin-bottom: 24px;
  }

  .back-btn {
    padding: 10px 24px;
    background: #000000;
    border: none;
    border-radius: var(--radius-full);
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #333333;
      transform: translateY(-2px);
    }
  }
}

// ==================== 顶部返回栏 ====================
.detail-header {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 16px 32px;
  background: rgba(250, 250, 250, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
  animation: fadeIn 0.6s ease forwards;

  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: transparent;
    border: 1px solid #e5e7eb;
    border-radius: var(--radius-full);
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s var(--ease-out-expo);

    &:hover {
      border-color: #111827;
      color: #111827;
    }

    .back-icon {
      width: 16px;
      height: 16px;
    }
  }
}

// ==================== Hero 区域 ====================
.project-hero {
  padding: 48px 32px 32px;
  position: relative;
  z-index: 2;
  animation: slideUp 0.8s var(--ease-out-expo) forwards;

  .hero-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .category-badge {
    display: inline-block;
    padding: 6px 14px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(229, 231, 235, 0.6);
    border-radius: var(--radius-full);
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .project-title {
    font-size: 42px;
    font-weight: 600;
    line-height: 1.1;
    color: #111827;
    margin-bottom: 16px;
    letter-spacing: -0.02em;
  }

  .project-summary {
    font-size: 16px;
    color: #6b7280;
    line-height: 1.6;
    max-width: 640px;
    margin-bottom: 32px;
  }

  .hero-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .author-info {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.8;
    }

    .author-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .author-details {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .author-name {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
      }

      .publish-date {
        font-size: 12px;
        color: #9ca3af;
      }
    }
  }

  .project-stats {
    display: flex;
    gap: 24px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: #6b7280;

      .stat-icon {
        width: 18px;
        height: 18px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          color: #111827;
        }

        &.liked {
          fill: #ef4444;
          color: #ef4444;
          animation: heartBurst 0.3s ease;
        }

        &.favorited {
          fill: #f59e0b;
          color: #f59e0b;
        }
      }
    }
  }
}

@keyframes heartBurst {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

// ==================== 封面区域 ====================
.cover-section {
  padding: 0 32px 48px;
  position: relative;
  z-index: 2;
  animation: slideUp 0.8s var(--ease-out-expo) forwards;
  animation-delay: 0.1s;

  .cover-inner {
    max-width: 1200px;
    margin: 0 auto;
  }

  .cover-image-wrap {
    position: relative;
    aspect-ratio: 21 / 9;
    border-radius: var(--radius-2xl);
    overflow: hidden;
    background: #f3f4f6;
    box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);

    .cover-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.8s var(--ease-out-expo);

      &:hover {
        transform: scale(1.02);
      }
    }
  }
}

// ==================== 主体内容 ====================
.main-content {
  padding: 0 32px;
  position: relative;
  z-index: 2;
  animation: slideUp 0.8s var(--ease-out-expo) forwards;
  animation-delay: 0.2s;

  .content-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 32px;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }
  }
}

// ==================== 左侧内容卡片 ====================
.left-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-2xl);
  padding: 32px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);

  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 20px;
    letter-spacing: -0.01em;
    display: flex;
    align-items: center;
    gap: 8px;

    .comment-count {
      font-size: 14px;
      color: #9ca3af;
      font-weight: 400;
    }
  }

  .description-content {
    font-size: 15px;
    line-height: 1.8;
    color: #374151;
  }

  .tech-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .tech-tag {
      padding: 8px 16px;
      background: #f3f4f6;
      border-radius: var(--radius-full);
      font-size: 13px;
      color: #6b7280;
      transition: all 0.3s ease;

      &:hover {
        background: #e5e7eb;
        color: #111827;
      }
    }

    .empty-text {
      font-size: 14px;
      color: #9ca3af;
      font-style: italic;
    }
  }
}

// ==================== 评论区 ====================
.comments-section {
  .comment-input-area {
    display: flex;
    gap: 16px;
    margin-bottom: 32px;

    .current-user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .input-wrapper {
      flex: 1;

      .comment-textarea {
        width: 100%;
        padding: 12px 16px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: var(--radius-xl);
        font-size: 14px;
        color: #111827;
        resize: vertical;
        min-height: 80px;
        font-family: inherit;

        &:focus {
          outline: none;
          border-color: #000000;
        }

        &::placeholder {
          color: #9ca3af;
        }
      }

      .input-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 12px;

        .submit-btn {
          padding: 10px 24px;
          background: #000000;
          border: none;
          border-radius: var(--radius-full);
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover:not(:disabled) {
            background: #333333;
            transform: translateY(-2px);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          &.small {
            padding: 8px 16px;
            font-size: 13px;
          }
        }
      }
    }
  }

  .comments-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px;
    color: #9ca3af;
    font-size: 14px;
  }

  .comments-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    color: #9ca3af;

    .empty-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
    }

    p {
      font-size: 14px;
    }
  }

  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 24px;

    .comment-item {
      display: flex;
      gap: 16px;

      .comment-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        cursor: pointer;
        flex-shrink: 0;
        transition: opacity 0.3s ease;

        &:hover {
          opacity: 0.8;
        }
      }

      .comment-content {
        flex: 1;

        .comment-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;

          .comment-author {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
            cursor: pointer;

            &:hover {
              text-decoration: underline;
            }
          }

          .comment-date {
            font-size: 12px;
            color: #9ca3af;
          }
        }

        .comment-text {
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
          margin-bottom: 8px;
        }

        .comment-actions {
          display: flex;
          gap: 16px;

          .action-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            background: transparent;
            border: none;
            font-size: 13px;
            color: #9ca3af;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 4px;

            &:hover {
              color: #111827;
              background: #f3f4f6;
            }

            &.delete:hover {
              color: #ef4444;
            }

            .action-icon {
              width: 14px;
              height: 14px;

              &.liked {
                fill: #ef4444;
                color: #ef4444;
              }
            }
          }
        }

        // 回复输入框
        .reply-input-area {
          margin-top: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: var(--radius-xl);

          .reply-textarea {
            width: 100%;
            padding: 10px 12px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: var(--radius-xl);
            font-size: 13px;
            color: #111827;
            resize: vertical;
            min-height: 60px;
            font-family: inherit;

            &:focus {
              outline: none;
              border-color: #000000;
            }
          }

          .reply-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 8px;

            .cancel-btn {
              padding: 6px 14px;
              background: transparent;
              border: 1px solid #e5e7eb;
              border-radius: var(--radius-full);
              font-size: 13px;
              color: #6b7280;
              cursor: pointer;
              transition: all 0.3s ease;

              &:hover {
                border-color: #111827;
                color: #111827;
              }
            }
          }
        }

        // 回复列表
        .replies-list {
          margin-top: 16px;
          padding-left: 16px;
          border-left: 2px solid #e5e7eb;

          .reply-item {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;

            &:last-child {
              margin-bottom: 0;
            }

            .reply-avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              object-fit: cover;
              cursor: pointer;

              &:hover {
                opacity: 0.8;
              }
            }

            .reply-content {
              flex: 1;

              .reply-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 4px;

                .reply-author {
                  font-size: 13px;
                  font-weight: 600;
                  color: #111827;
                  cursor: pointer;

                  &:hover {
                    text-decoration: underline;
                  }
                }

                .reply-date {
                  font-size: 11px;
                  color: #9ca3af;
                }
              }

              .reply-text {
                font-size: 13px;
                line-height: 1.5;
                color: #374151;
              }
            }
          }
        }
      }
    }
  }
}

// ==================== 右侧侧边栏 ====================
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--radius-2xl);
  padding: 24px;
  box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.04);

  .sidebar-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;
  }

  .info-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;

      .info-label {
        color: #9ca3af;
      }

      .info-value {
        color: #111827;
        font-weight: 500;
        max-width: 60%;
        text-align: right;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  // 作者卡片特殊样式
  &.author-card {
    .author-profile {
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      transition: opacity 0.3s ease;

      &:hover {
        opacity: 0.8;
      }

      .author-avatar-large {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        object-fit: cover;
      }

      .author-info-detail {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .author-name-large {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .author-role {
          font-size: 13px;
          color: #9ca3af;
        }
      }
    }
  }
}

// ==================== 操作按钮 ====================
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px 24px;
    border-radius: var(--radius-full);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s var(--ease-out-expo);
    border: none;

    .btn-icon {
      width: 18px;
      height: 18px;
    }

    &.primary {
      background: #000000;
      color: #ffffff;

      &:hover {
        background: #333333;
        transform: translateY(-2px);
        box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.2);
      }
    }

    &.secondary {
      background: transparent;
      border: 1px solid #e5e7eb;
      color: #6b7280;

      &:hover {
        border-color: #111827;
        color: #111827;
        background: rgba(0, 0, 0, 0.02);
      }
    }
  }
}

// ==================== 动画 ====================
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// ==================== 响应式 ====================
@media (max-width: 768px) {
  .project-hero {
    padding: 32px 20px 24px;

    .project-title {
      font-size: 28px;
    }

    .project-summary {
      font-size: 14px;
    }

    .hero-meta {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .cover-section,
  .main-content,
  .detail-header {
    padding-left: 20px;
    padding-right: 20px;
  }

  .content-card,
  .sidebar-card {
    padding: 20px;
  }

  .comments-section {
    .comment-input-area {
      flex-direction: column;

      .current-user-avatar {
        display: none;
      }
    }

    .comments-list {
      .comment-item {
        .comment-content {
          .replies-list {
            padding-left: 12px;
          }
        }
      }
    }
  }
}
</style>
