<template>
  <div class="community-detail-container">
    <div class="detail-main">
      <div class="detail-header">
        <n-button text size="small" @click="goBack">
          返回社区
        </n-button>
      </div>

      <!-- 加载状态 -->
      <n-card v-if="loading" :bordered="false" class="detail-card">
        <div class="loading-wrapper">
          <n-spin size="medium" />
          <p class="loading-text">加载中...</p>
        </div>
      </n-card>

      <!-- 帖子详情 -->
      <template v-else-if="post">
        <n-card :bordered="false" class="detail-card">
          <div class="detail-header-main" @click="goToAuthor">
            <n-avatar
circle
size="large"
:src="post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`"
style="cursor: pointer;" />
            <div class="meta" style="cursor: pointer;">
              <div class="username">{{ post.author.name || post.author.username }}</div>
              <div class="time">{{ formatTime(post.createdAt) }}</div>
            </div>
          </div>

          <div class="detail-content">
            <h2 v-if="post.title" class="post-title">{{ post.title }}</h2>
            <p class="text">{{ post.content }}</p>
            <div
              v-if="post.images && post.images.length"
              class="image-grid"
              :class="`grid-${Math.min(post.images.length, 3)}`"
            >
              <div
                v-for="(img, idx) in post.images"
                :key="idx"
                class="image-item"
                :style="{ backgroundImage: `url(${img})` }"
              ></div>
            </div>
            <div v-if="post.tags && post.tags.length" class="tags">
              <n-tag
v-for="tag in post.tags"
:key="tag"
size="small"
round
:bordered="false">
                # {{ tag }}
              </n-tag>
            </div>
          </div>

          <div class="detail-footer">
            <div class="stat" :class="{ active: post.isLiked }" @click="togglePostLike">
              <n-icon :component="post.isLiked ? Heart : HeartOutline" />
              <span>{{ post.likesCount || 0 }} 赞</span>
            </div>
            <div class="stat">
              <n-icon :component="ChatbubbleOutline" />
              <span>{{ post.commentsCount || 0 }} 评论</span>
            </div>
            <div class="stat">
              <n-icon :component="EyeOutline" />
              <span>{{ post.viewsCount || 0 }} 浏览</span>
            </div>
          </div>
        </n-card>

        <!-- 评论区 -->
        <n-card :bordered="false" class="detail-card mt-4">
          <div class="comments-section">
            <h3 class="section-title">评论 ({{ comments.length }})</h3>
            
            <!-- 发送评论 -->
            <div class="comment-input-area">
              <n-avatar circle size="medium" :src="currentUserAvatar" />
              <div class="input-wrapper">
                <n-input
                  v-model:value="newCommentContent"
                  type="textarea"
                  placeholder="写下你的评论..."
                  :autosize="{ minRows: 2, maxRows: 4 }"
                />
                <div class="input-actions">
                  <n-button
type="primary"
size="small"
color="#000"
:disabled="!newCommentContent.trim()"
@click="submitComment">
                    发布
                  </n-button>
                </div>
              </div>
            </div>

            <!-- 评论列表 -->
            <div class="comment-list">
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <n-avatar circle size="medium" :src="comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`" />
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="username">{{ comment.username }}</span>
                    <span class="time">{{ formatTime(comment.createdAt) }}</span>
                  </div>
                  <p class="text">{{ comment.content }}</p>
                  <div class="comment-actions">
                    <n-button
text
size="tiny"
:color="comment.isLiked ? '#e91e63' : undefined"
@click="toggleCommentLike(comment)">
                      <template #icon>
                        <n-icon :component="comment.isLiked ? Heart : HeartOutline" />
                      </template>
                      {{ comment.likesCount || 0 }}
                    </n-button>
                    <n-button text size="tiny" @click="startReply(comment)">回复</n-button>
                  </div>
                  
                  <!-- 回复输入框 -->
                  <div v-if="replyingTo === comment.id" class="reply-input-area mt-3">
                    <n-input
                      v-model:value="replyContent"
                      type="textarea"
                      :placeholder="`回复 ${comment.username}...`"
                      :autosize="{ minRows: 2, maxRows: 4 }"
                    />
                    <div class="reply-actions mt-2">
                      <n-button size="small" @click="cancelReply">取消</n-button>
                      <n-button
                        type="primary"
                        size="small"
                        color="#000"
                        :disabled="!replyContent.trim()"
                        :loading="submittingReply"
                        @click="submitReply(comment.id)"
                      >
                        发布回复
                      </n-button>
                    </div>
                  </div>
                  
                  <!-- 嵌套回复列表 -->
                  <div v-if="(comment as any).replies && (comment as any).replies.length > 0" class="replies-list mt-3">
                    <div v-for="reply in (comment as any).replies" :key="reply.id" class="reply-item">
                      <n-avatar circle size="small" :src="reply.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.userId}`" />
                      <div class="reply-content">
                        <div class="reply-header">
                          <span class="username">{{ reply.username }}</span>
                          <span class="time">{{ formatTime(reply.createdAt) }}</span>
                        </div>
                        <p class="text">{{ reply.content }}</p>
                        <div class="reply-actions">
                          <n-button
                            text
                            size="tiny"
                            :color="reply.isLiked ? '#e91e63' : undefined"
                            @click="toggleCommentLike(reply)">
                            <template #icon>
                              <n-icon :component="reply.isLiked ? Heart : HeartOutline" />
                            </template>
                            {{ reply.likesCount || 0 }}
                          </n-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </n-card>
      </template>

      <!-- 帖子不存在 -->
      <n-card v-else :bordered="false" class="detail-card">
        <p>这条动态不存在或已被删除。</p>
        <n-button
type="primary"
size="small"
color="#000"
@click="goBack">
          返回社区
        </n-button>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { HeartOutline, ChatbubbleOutline, Heart, EyeOutline } from '@vicons/ionicons5'
import { getPostDetail } from '@/api/community/post'
import { getAllPostComments, createComment } from '@/api/community/comment'
import { likePost, unlikePost, likeComment, unlikeComment } from '@/api/community/like'
import type { PostDetail, Comment, CommentDetail } from '@/api/types'
import { useUserStore } from '@/store/user'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const postId = computed(() => route.params.id as string)

const post = ref<PostDetail | null>(null)
const comments = ref<Comment[]>([])
const loading = ref(false)
const newCommentContent = ref('')

// 回复相关状态
const replyingTo = ref<string | null>(null)  // 当前正在回复的评论ID
const replyContent = ref('')                  // 回复内容
const submittingReply = ref(false)            // 是否正在提交回复

const currentUserAvatar = computed(() => {
  return userStore.userInfo?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'
})

/**
 * 格式化时间显示
 * @param time - 时间字符串
 */
function formatTime(time: string): string {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1小时显示"x分钟前"
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`
  }
  
  // 小于24小时显示"x小时前"
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}小时前`
  }
  
  // 小于7天显示"x天前"
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    return `${days}天前`
  }
  
  // 否则显示具体日期
  return date.toLocaleDateString('zh-CN')
}

/**
 * 获取帖子详情
 */
async function fetchPostDetail() {
  if (!postId.value) return
  
  loading.value = true
  try {
    const res = await getPostDetail(postId.value)
    
    // 处理后端返回数组的情况（如错误信息 ["这条动态不存在或已被删除。"]）
    if (Array.isArray(res.data)) {
      console.error('获取帖子详情失败:', res.data[0])
      post.value = null
      return
    }
    
      // 处理标准响应格式 { status, message, data }
      if (res.data.status === 200 && res.data.data) {
        post.value = res.data.data
        // 获取评论列表
        await fetchComments()
      } else {
        post.value = null
      }
  } catch (error) {
    console.error('获取帖子详情失败:', error)
    post.value = null
  } finally {
    loading.value = false
  }
}

/**
 * 获取评论列表（包括回复）
 */
async function fetchComments() {
  if (!postId.value) return
  
  try {
    const res = await getAllPostComments(postId.value)
    // 评论接口返回标准格式 { status, message, data }
    const allComments = res.data.data || []
    
    // 分离一级评论和回复
    const topLevelComments = allComments.filter((c: CommentDetail) => !c.parentId)
    const replies = allComments.filter((c: CommentDetail) => c.parentId)
    
    // 将回复挂载到对应的一级评论下
    comments.value = topLevelComments.map((comment: CommentDetail) => ({
      ...comment,
      replies: replies.filter((r: CommentDetail) => r.parentId === comment.id)
    })) as (Comment & { replies?: Comment[] })[]
  } catch (error) {
    console.error('获取评论列表失败:', error)
    comments.value = []
  }
}

/**
 * 点赞/取消点赞帖子
 */
async function togglePostLike() {
  if (!post.value) return
  
  try {
    if (post.value.isLiked) {
      await unlikePost(post.value.id)
      post.value = { ...post.value, isLiked: false, likesCount: Math.max(0, post.value.likesCount - 1) }
    } else {
      await likePost(post.value.id)
      post.value = { ...post.value, isLiked: true, likesCount: post.value.likesCount + 1 }
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
    message.error('操作失败，请重试')
  }
}

/**
 * 点赞/取消点赞评论
 */
/**
 * 点赞/取消点赞评论
 */
function updateCommentInList(comment: Comment & { isLiked?: boolean; likesCount?: number }) {
  const list = comments.value as any[]
  for (let i = 0; i < list.length; i++) {
    const c = list[i]
    if (!c) continue
    if (c.id === comment.id) {
      list[i] = { ...c, isLiked: comment.isLiked, likesCount: comment.likesCount }
      return
    }
    if (c.replies) {
      const rIndex = c.replies.findIndex((r: any) => r.id === comment.id)
      if (rIndex !== -1) {
        const newReplies = [...c.replies]
        newReplies[rIndex] = { ...newReplies[rIndex], isLiked: comment.isLiked, likesCount: comment.likesCount }
        list[i] = { ...c, replies: newReplies }
        return
      }
    }
  }
}

async function toggleCommentLike(comment: Comment & { isLiked?: boolean }) {
  try {
    const newLiked = !comment.isLiked
    const newCount = Math.max(0, (comment.likesCount || 0) + (newLiked ? 1 : -1))
    if (newLiked) {
      await likeComment(comment.id)
    } else {
      await unlikeComment(comment.id)
    }
    comment.isLiked = newLiked
    comment.likesCount = newCount
    updateCommentInList(comment)
  } catch (error) {
    console.error('评论点赞操作失败:', error)
    message.error('操作失败，请重试')
  }
}

/**
 * 开始回复评论
 * @param comment - 要回复的评论
 */
function startReply(comment: Comment) {
  replyingTo.value = comment.id
  replyContent.value = ''
}

/**
 * 取消回复
 */
function cancelReply() {
  replyingTo.value = null
  replyContent.value = ''
}

/**
 * 提交回复
 * @param parentId - 父评论ID
 */
async function submitReply(parentId: string) {
  if (!replyContent.value.trim() || !post.value) return
  
  submittingReply.value = true
  try {
    const res = await createComment({
      postId: post.value.id,
      content: replyContent.value.trim(),
      parentId: parentId
    })
    
    // 后端创建成功返回 201，兼容 200
    if (res.data.status === 200 || res.data.status === 201) {
      message.success('回复发布成功')
      replyContent.value = ''
      replyingTo.value = null
      
      // 将新回复添加到对应评论下
      const newReply = res.data.data
      if (newReply && newReply.parentId) {
        const parentIndex = comments.value.findIndex(c => c.id === newReply.parentId)
        if (parentIndex !== -1) {
          const parent = comments.value[parentIndex] as any
          ;(comments.value as any)[parentIndex] = { 
            ...parent, 
            replies: [newReply, ...(parent.replies || [])] 
          }
        }
      }
      
      // 更新评论数
      if (post.value) {
        post.value = { ...post.value, commentsCount: post.value.commentsCount + 1 }
      }
      
      // 可选：刷新评论列表以显示嵌套回复
      // await fetchComments()
    }
  } catch (error) {
    console.error('发布回复失败:', error)
    message.error('发布失败，请重试')
  } finally {
    submittingReply.value = false
  }
}

/**
 * 发布评论
 */
async function submitComment() {
  if (!newCommentContent.value.trim() || !post.value) return
  
  try {
    const res = await createComment({
      postId: post.value.id,
      content: newCommentContent.value.trim()
    })
    
    // 后端创建成功返回 201，兼容 200
    if (res.data.status === 200 || res.data.status === 201) {
      message.success('评论发布成功')
      newCommentContent.value = ''
      
      // 将新评论添加到列表（立即显示，无需等待刷新）
      const newComment = res.data.data
      if (newComment) {
        comments.value = [newComment, ...comments.value]
      }
      
      // 更新评论数
      if (post.value) {
        post.value = { ...post.value, commentsCount: post.value.commentsCount + 1 }
      }
    }
  } catch (error) {
    console.error('发布评论失败:', error)
    message.error('发布失败，请重试')
  }
}

/**
 * 返回社区列表页
 */
function goBack() {
  router.push('/community')
}

/**
 * 跳转到作者主页
 */
function goToAuthor() {
  if (post.value?.author?.id) {
    router.push(`/user/${post.value.author.id}`)
  }
}

onMounted(() => {
  void fetchPostDetail()
})
</script>

<style scoped lang="scss">
.community-detail-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-top: 76px;
  padding-bottom: 40px;
}

.detail-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (max-width: 768px) {
  .detail-main {
    padding: 0 16px;
  }
}

.detail-header {
  margin-bottom: 16px;
}

.detail-card {
  border-radius: 12px;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-text {
  margin-top: 16px;
  color: #6b7280;
  font-size: 14px;
}

.detail-header-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-header-main .meta {
  display: flex;
  flex-direction: column;
}

.detail-header-main .username {
  font-weight: 600;
  font-size: 16px;
  color: #111827;
}

.detail-header-main .time {
  font-size: 12px;
  color: #9ca3af;
}

.detail-content .post-title {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
  line-height: 1.4;
}

.detail-content .text {
  font-size: 15px;
  line-height: 1.8;
  color: #374151;
  margin-bottom: 16px;
  white-space: pre-wrap;
}

.image-grid {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.image-grid.grid-1 {
  grid-template-columns: 1fr;
}

.image-grid.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.image-grid.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.image-item {
  aspect-ratio: 16 / 9;
  background-size: cover;
  background-position: center;
  background-color: #f3f4f6;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-footer {
  margin-top: 16px;
  display: flex;
  gap: 24px;
  color: #6b7280;
  font-size: 14px;
}

.detail-footer .stat {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: color 0.2s;
}

.detail-footer .stat:hover {
  color: #374151;
}

.detail-footer .stat.active {
  color: #e91e63;
}

.comments-section {
  padding: 8px 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #111827;
}

.comment-input-area {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.input-wrapper {
  flex: 1;
}

.input-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.comment-item {
  display: flex;
  gap: 16px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-header .username {
  font-weight: 600;
  font-size: 14px;
  color: #374151;
}

.comment-header .time {
  font-size: 12px;
  color: #9ca3af;
}

.comment-content .text {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 8px;
  line-height: 1.6;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

/* 回复输入框样式 */
.reply-input-area {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 嵌套回复列表 */
.replies-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 12px;
  border-left: 2px solid #e5e7eb;
}

.reply-item {
  display: flex;
  gap: 12px;
}

.reply-content {
  flex: 1;
}

.reply-header {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-header .username {
  font-weight: 600;
  font-size: 13px;
  color: #374151;
}

.reply-header .time {
  font-size: 11px;
  color: #9ca3af;
}

.reply-content .text {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 4px;
  line-height: 1.5;
}

.reply-actions {
  display: flex;
  gap: 12px;
}
</style>
