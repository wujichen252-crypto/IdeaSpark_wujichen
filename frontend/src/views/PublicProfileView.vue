<template>
  <div class="profile-container">
    <!-- 顶部背景图 -->
    <div class="profile-cover" :style="{ backgroundImage: `url(${userCover})` }"></div>

    <div class="profile-content">
      <div class="profile-header">
        <div class="user-avatar-wrapper">
          <n-avatar
            round
            :size="120"
            :src="userData.avatar || defaultAvatar"
            class="user-avatar"
          />
        </div>
        
        <div class="user-details">
          <div class="name-row">
            <h1 class="username">{{ userData.username }}</h1>
            <n-tag
type="info"
size="small"
round
bordered>
              {{ userData.role || '用户' }}
            </n-tag>
          </div>
          <p class="bio">{{ userData.bio || '这个人很懒，还没有写简介。' }}</p>
          
          <div class="stats-row">
            <div class="stat-item">
              <span class="count">{{ formatCount(userData.likesCount || 0) }}</span>
              <span class="label">获赞</span>
            </div>
            <div class="stat-item clickable" @click="showFollowModal('followers')">
              <span class="count">{{ formatCount(userData.followersCount || 0) }}</span>
              <span class="label">粉丝</span>
            </div>
            <div class="stat-item clickable" @click="showFollowModal('following')">
              <span class="count">{{ formatCount(userData.followingCount || 0) }}</span>
              <span class="label">关注</span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <template v-if="isCurrentUser">
            <n-button type="primary" round @click="router.push('/profile/edit')">
              <template #icon><n-icon :component="CreateOutline" /></template>
              编辑资料
            </n-button>
          </template>
          <template v-else>
            <n-button
              :type="isFollowing ? 'default' : 'primary'"
              round
              :loading="followLoading"
              @click="handleFollow"
            >
              <template #icon><n-icon :component="isFollowing ? CheckmarkOutline : AddOutline" /></template>
              {{ isFollowing ? '已关注' : '关注' }}
            </n-button>
            <n-button round secondary @click="message.info('私信功能开发中')">
              <template #icon><n-icon :component="ChatbubbleOutline" /></template>
              私信
            </n-button>
          </template>
        </div>
      </div>

      <n-divider />

      <div class="profile-tabs">
        <n-tabs
v-model:value="activeTab"
type="line"
animated
size="large">
          <n-tab-pane name="projects" :tab="`公开项目 (${projects.length})`">
            <div v-if="projects.length > 0" class="projects-grid">
              <div 
                v-for="item in projects" 
                :key="item.id" 
                class="project-card"
                @click="goToProject(item.id)"
              >
                <div class="card-thumb" :style="{ backgroundImage: `url(${item.coverUrl || defaultProjectCover})` }">
                  <div class="card-overlay"></div>
                </div>
                <div class="card-content">
                  <h3 class="card-title">{{ item.name }}</h3>
                  <p class="card-desc">{{ item.description || '暂无描述' }}</p>
                  <div class="card-meta">
                    <span class="meta-item">
                      <span class="meta-badge" :class="item.status">{{ item.status }}</span>
                    </span>
                    <span class="meta-item"><n-icon :component="EyeOutline" /> {{ item.progress || 0 }}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <n-empty description="该用户暂无公开项目" />
            </div>
          </n-tab-pane>

          <n-tab-pane name="posts" :tab="`动态 (${posts.length})`">
            <div v-if="posts.length > 0" class="posts-list">
              <div
                v-for="post in posts"
                :key="post.id"
                class="post-card"
                @click="goToPost(post.id)"
              >
                <div class="post-body-mini">
                  <p class="post-text">{{ post.content }}</p>
                  <div v-if="post.images && post.images.length" class="post-images-mini">
                    <img
                      v-for="(img, idx) in post.images.slice(0, 3)"
                      :key="idx"
                      :src="img"
                      class="post-img-mini"
                      alt="post image"
                    />
                    <div v-if="post.images.length > 3" class="img-more">+{{ post.images.length - 3 }}</div>
                  </div>
                </div>
                <div class="post-footer-mini">
                  <span class="post-stat"><HeartOutline class="post-stat-icon" /> {{ post.likesCount || 0 }}</span>
                  <span class="post-stat"><ChatbubbleOutline class="post-stat-icon" /> {{ post.commentsCount || 0 }}</span>
                  <span class="post-stat"><EyeOutline class="post-stat-icon" /> {{ post.viewsCount || 0 }}</span>
                  <span class="post-time">{{ formatTime(post.createdAt) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <n-empty description="该用户暂无动态" />
            </div>
          </n-tab-pane>

          <n-tab-pane name="about" tab="详细资料">
            <div class="about-content">
              <div class="info-group">
                <h3>关于我</h3>
                <p>{{ userData.bio || '这个人很懒，还没有写简介。' }}</p>
              </div>
              <div v-if="userData.position" class="info-group">
                <h3>职位</h3>
                <p>{{ userData.position }}</p>
              </div>
              <div v-if="userData.address" class="info-group">
                <h3>所在地</h3>
                <p>{{ userData.address }}</p>
              </div>
              <div v-if="userData.perWebsite" class="info-group">
                <h3>个人网站</h3>
                <a :href="userData.perWebsite" target="_blank" rel="noopener">{{ userData.perWebsite }}</a>
              </div>
              <div class="info-group">
                <h3>加入时间</h3>
                <p>{{ formatJoinDate(userData.createdAt) }}</p>
              </div>
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>
    </div>

    <!-- 粉丝/关注弹窗 -->
    <n-modal
      v-model:show="showFollowModalFlag"
      preset="card"
      :title="followModalType === 'followers' ? '粉丝' : '关注'"
      style="width: 600px; max-width: 90vw;"
    >
      <div class="follow-modal-content">
        <div v-if="followListLoading" style="text-align: center; padding: 40px;">
          加载中...
        </div>
        <div v-else-if="followList.length === 0" style="text-align: center; padding: 40px; color: #999;">
          暂无{{ followModalType === 'followers' ? '粉丝' : '关注' }}
        </div>
        <UserListPanel
          v-else
          :list="followList"
          :type="followModalType"
          :show-follow-button="!isCurrentUser"
          :target-user-id="userId"
          @follow-change="handleFollowChange"
        />
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import { 
  AddOutline, 
  ChatbubbleOutline, 
  CheckmarkOutline,
  EyeOutline,
  HeartOutline,
  CreateOutline,
  ChatbubbleOutline as ChatbubbleOutlineIcon
} from '@vicons/ionicons5'
import { getUserById } from '@/api/user'
import { getUserProjects } from '@/api/project'
import { getUserPosts } from '@/api/community/post'
import { getUserFollowersCount, getUserFollowingCount, checkFollowing, followUser, unfollowUser, getUserFollowers, getUserFollowing } from '@/api/follow'
import { useUserStore } from '@/store'
import { getOtherUserAvatar } from '@/utils/avatar'
import UserListPanel from '@/components/UserListPanel.vue'
import type { Project, Post, User, MyFollowingItem, MyFollowerItem } from '@/api/types'

const showFollowModalFlag = ref(false)
const followModalType = ref<'followers' | 'following'>('followers')
const followListLoading = ref(false)
const followList = ref<MyFollowingItem[] | MyFollowerItem[]>([])

const router = useRouter()
const route = useRoute()
const message = useMessage()
const userStore = useUserStore()

const userId = computed(() => Number(route.params.id))
const isCurrentUser = computed(() => userStore.isLoggedIn && userStore.userInfo?.id === String(userId.value))

const showFollowModal = (type: 'followers' | 'following') => {
  followModalType.value = type
  showFollowModalFlag.value = true
  fetchFollowList()
}

async function fetchFollowList() {
  followListLoading.value = true
  try {
    if (followModalType.value === 'followers') {
      const res = await getUserFollowers(userId.value)
      followList.value = res.data.data || []
    } else {
      const res = await getUserFollowing(userId.value)
      followList.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取粉丝/关注列表失败:', error)
    message.error('获取列表失败')
  } finally {
    followListLoading.value = false
  }
}

const handleFollowChange = (followUserId: number, isFollowed: boolean) => {
  if (followUserId === userId.value) {
    userData.value = {
      ...userData.value,
      followersCount: isFollowed
        ? (userData.value.followersCount || 0) + 1
        : Math.max(0, (userData.value.followersCount || 0) - 1)
    }
  }
}

// 使用统一的默认头像函数
const defaultAvatar = computed(() => {
  return getOtherUserAvatar(
    userData.value.avatar,
    userData.value.id,
    userData.value.username
  )
})
const defaultProjectCover = 'https://picsum.photos/seed/project/400/300'
const userCover = 'https://picsum.photos/seed/user_cover/1200/400'

const activeTab = ref('projects')
const loading = ref(false)
const followLoading = ref(false)
const isFollowing = ref(false)

const userData = ref<Partial<User> & { likesCount?: number; followersCount?: number; followingCount?: number }>({})
const projects = ref<Project[]>([])
const posts = ref<Post[]>([])

const goToProject = (id: string) => {
  router.push(`/project/${id}`)
}

const goToPost = (id: string) => {
  router.push(`/community/post/${id}`)
}

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

function formatJoinDate(dateStr?: string): string {
  if (!dateStr) return '未知'
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

async function fetchUserData() {
  if (!userId.value) return
  loading.value = true
  try {
    const [userRes, projectsRes, postsRes, followersRes, followingRes] = await Promise.all([
      getUserById(userId.value),
      getUserProjects(userId.value),
      getUserPosts(userId.value),
      getUserFollowersCount(userId.value),
      getUserFollowingCount(userId.value)
    ])

    if (userRes.data.status === 200) {
      userData.value = userRes.data.data || {}
    }
    if (projectsRes.data.status === 200) {
      projects.value = projectsRes.data.data?.projects || []
    }
    if (postsRes.data.status === 200) {
      posts.value = postsRes.data.data || []
    }
    // 后端直接返回 {count: number}
    userData.value = { 
      ...userData.value, 
      followersCount: followersRes.data.count || 0, 
      followingCount: followingRes.data.count || 0 
    }

    // 检查是否已关注
    if (userStore.isLoggedIn && !isCurrentUser.value) {
      const checkRes = await checkFollowing(userId.value)
      isFollowing.value = checkRes.data.data?.following || false
    }
  } catch (error) {
    console.error('获取用户主页数据失败:', error)
    message.error('获取用户主页数据失败')
  } finally {
    loading.value = false
  }
}

async function handleFollow() {
  if (!userStore.isLoggedIn) {
    message.info('请先登录后再关注')
    router.push('/login')
    return
  }
  followLoading.value = true
  try {
    if (isFollowing.value) {
      await unfollowUser(userId.value)
      isFollowing.value = false
      userData.value = { 
        ...userData.value, 
        followersCount: Math.max(0, (userData.value.followersCount || 0) - 1) 
      }
      message.success('已取消关注')
    } else {
      await followUser(userId.value)
      isFollowing.value = true
      userData.value = { 
        ...userData.value, 
        followersCount: (userData.value.followersCount || 0) + 1 
      }
      message.success('关注成功')
    }
  } catch (error) {
    console.error('关注操作失败:', error)
  } finally {
    followLoading.value = false
  }
}

onMounted(() => {
  fetchUserData()
  window.scrollTo(0, 0)
})

watch(() => route.params.id, () => {
  fetchUserData()
})
</script>

<style scoped lang="scss">
.profile-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 60px;
}

.profile-cover {
  height: 280px;
  background-size: cover;
  background-position: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.1) 100%);
  }
}

.profile-content {
  max-width: 1000px;
  margin: 0 auto;
  margin-top: 24px;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.profile-header {
  display: flex;
  align-items: flex-end;
  gap: 32px;
  margin-bottom: 24px;
  
  .user-avatar-wrapper {
    background: #fff;
    padding: 4px;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    flex-shrink: 0;
  }

  .user-details {
    flex: 1;
    padding-bottom: 8px;
    
    .name-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
      
      .username {
        margin: 0;
        font-size: 2.2rem;
        font-weight: 800;
        color: #1f2937;
        text-shadow: 0 2px 4px rgba(255,255,255,0.8);
      }
    }
    
    .bio {
      color: #4b5563;
      margin-bottom: 16px;
      font-size: 16px;
      max-width: 600px;
    }
    
    .stats-row {
      display: flex;
      gap: 32px;
      
      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        
        .count {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1f2937;
        }
        .label {
          font-size: 13px;
          color: #6b7280;
        }
        
        &.clickable {
          cursor: pointer;
          &:hover {
            .count, .label {
              color: #3b82f6;
            }
          }
        }
      }
    }
  }
  
  .action-buttons {
    padding-bottom: 16px;
    display: flex;
    gap: 12px;
  }
}

.profile-tabs {
  background: #fff;
  padding: 32px;
  border-radius: 16px;
  min-height: 400px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding-top: 12px;
}

.project-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
  
  .card-thumb {
    height: 160px;
    background-size: cover;
    background-position: center;
    position: relative;
  }
  
  .card-content {
    padding: 16px;
    
    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #1f2937;
    }
    
    .card-desc {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 12px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .card-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #9ca3af;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.meta-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  text-transform: uppercase;
  background: #f3f4f6;
  color: #6b7280;

  &.active {
    background: #dcfce7;
    color: #166534;
  }
  &.inactive {
    background: #fef3c7;
    color: #92400e;
  }
  &.archived {
    background: #e5e7eb;
    color: #374151;
  }
}

.about-content {
  max-width: 800px;
  
  .info-group {
    margin-bottom: 32px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f3f4f6;
    }
    
    p {
      color: #4b5563;
      line-height: 1.6;
    }

    a {
      color: #3b82f6;
      text-decoration: none;
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.empty-state {
  padding: 60px 0;
  display: flex;
  justify-content: center;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 12px;
}

.post-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
}

.post-body-mini {
  margin-bottom: 12px;
}

.post-text {
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-images-mini {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.post-img-mini {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

.img-more {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.post-footer-mini {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #9ca3af;
  align-items: center;
}

.post-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-stat-icon {
  width: 14px;
  height: 14px;
}

.post-time {
  margin-left: auto;
  font-size: 12px;
}

.follow-modal-content {
  max-height: 500px;
  overflow-y: auto;
}
</style>
