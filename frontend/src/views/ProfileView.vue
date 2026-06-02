<template>
  <div class="profile-page">
    <!-- 噪点纹理层 -->
    <div class="grain-overlay"></div>

    <!-- 顶部背景图 -->
    <div class="profile-cover" :style="{ backgroundImage: `url(${userCover})` }">
      <div class="cover-overlay"></div>
      <div class="cover-upload-wrapper" v-if="isOwnProfile">
        <label class="cover-upload-btn" :class="{ 'is-loading': coverUploading }">
          <input
            type="file"
            accept="image/*"
            class="file-input"
            :disabled="coverUploading"
            @change="handleCoverChange"
          />
          <Camera class="upload-icon" />
          <span v-if="coverUploading">上传中...</span>
          <span v-else>更换封面</span>
        </label>
      </div>
    </div>

    <div class="profile-content">
      <!-- 用户信息卡片 -->
      <div class="profile-header glass-panel">
        <div class="user-avatar-wrapper">
          <img
            :src="userStore.userInfo?.avatar || defaultAvatar"
            :alt="userStore.userInfo?.username"
            class="user-avatar"
          />
        </div>

        <div class="user-details">
          <div class="name-row">
            <h1 class="username">{{ userStore.userInfo?.username || '我的用户名' }}</h1>
            <span class="role-tag">{{ userStore.userInfo?.role || '开发者' }}</span>
          </div>
          <p class="bio">{{ userStore.userInfo?.bio || '暂无简介' }}</p>

          <div class="stats-row">
            <div class="stat-item">
              <span class="count">{{ userStats.likes }}</span>
              <span class="label">获赞</span>
            </div>
            <div class="stat-item clickable" @click="showFollowModal('followers')">
              <span class="count">{{ userStats.followers }}</span>
              <span class="label">粉丝</span>
            </div>
            <div class="stat-item clickable" @click="showFollowModal('following')">
              <span class="count">{{ userStats.following }}</span>
              <span class="label">关注</span>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-primary" @click="router.push('/profile/edit')">
            <Edit3 class="btn-icon" />
            编辑资料
          </button>
          <button class="btn btn-icon-only" @click="router.push('/profile/settings')">
            <Settings class="btn-icon" />
          </button>
        </div>
      </div>

      <!-- 标签页内容 -->
      <div class="profile-tabs glass-panel">
        <div class="tabs-header">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-btn', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="tabs-content">
          <!-- 我的项目 -->
          <div v-if="activeTab === 'projects'" class="tab-pane">
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
                    <span class="meta-item">
                      <Eye class="meta-icon" />
                      {{ item.progress || 0 }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <FolderOpen class="empty-icon" />
              <p class="empty-text">暂无项目</p>
            </div>
          </div>

          <!-- 我的动态 -->
          <div v-if="activeTab === 'posts'" class="tab-pane">
            <div v-if="posts.length > 0" class="posts-list">
              <div
                v-for="post in posts"
                :key="post.id"
                class="post-card"
                @click="goToPost(post.id)"
              >
                <div class="post-header-mini">
                  <img
                    :src="userStore.userInfo?.avatar || defaultAvatar"
                    class="post-author-avatar"
                    alt="avatar"
                  />
                  <div class="post-meta">
                    <span class="post-author-name">{{ userStore.userInfo?.username }}</span>
                    <span class="post-time">{{ formatTime(post.createdAt) }}</span>
                  </div>
                </div>
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
                  <span class="post-stat"><Heart class="post-stat-icon" /> {{ post.likesCount || 0 }}</span>
                  <span class="post-stat"><MessageCircle class="post-stat-icon" /> {{ post.commentsCount || 0 }}</span>
                  <span class="post-stat"><Eye class="post-stat-icon" /> {{ post.viewsCount || 0 }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <FileText class="empty-icon" />
              <p class="empty-text">还没有发布过动态</p>
              <button class="btn btn-primary" @click="router.push('/community/create')">
                <Plus class="btn-icon" />
                发布动态
              </button>
            </div>
          </div>

          <!-- 收藏夹 -->
          <div v-if="activeTab === 'stars'" class="tab-pane">
            <div v-if="favoriteProjects.length > 0" class="projects-grid">
              <div
                v-for="item in favoriteProjects"
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
                    <span class="meta-item">
                      <Eye class="meta-icon" />
                      {{ item.progress || 0 }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <Bookmark class="empty-icon" />
              <p class="empty-text">还没有收藏任何内容</p>
            </div>
          </div>

          <!-- 关于我 -->
          <div v-if="activeTab === 'about'" class="tab-pane">
            <div class="about-content">
              <div class="info-group">
                <h3 class="info-title">个人介绍</h3>
                <p class="info-text">{{ userStore.userInfo?.bio || '暂无详细介绍' }}</p>
              </div>
              <div v-if="userStore.userInfo?.position" class="info-group">
                <h3 class="info-title">职位</h3>
                <p class="info-text">{{ userStore.userInfo.position }}</p>
              </div>
              <div v-if="userStore.userInfo?.address" class="info-group">
                <h3 class="info-title">所在地</h3>
                <p class="info-text">{{ userStore.userInfo.address }}</p>
              </div>
              <div class="info-group">
                <h3 class="info-title">加入时间</h3>
                <p class="info-text">{{ formatJoinDate(userStore.userInfo?.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
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
          :show-follow-button="false"
          :target-user-id="Number(userStore.userInfo?.id || 0)"
        />
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Settings,
  Edit3,
  Eye,
  Heart,
  Plus,
  FolderOpen,
  Bookmark,
  FileText,
  MessageCircle,
  Camera
} from 'lucide-vue-next'
import { useUserStore } from '@/store'
import { getMyProjects, getMyFavorites } from '@/api/project'
import { getUserPosts } from '@/api/community/post'
import { getUserStats, updateUser } from '@/api/user'
import { getMyFollowingCount, getMyFollowersCount, getMyFollowing, getMyFollowers } from '@/api/follow'
import { uploadFile } from '@/api/file'
import { getCurrentUserAvatar } from '@/utils/avatar'
import { useAppDialog } from '@/composables/useAppDialog'
import UserListPanel from '@/components/UserListPanel.vue'
import type { Project, Post, MyFollowingItem, MyFollowerItem } from '@/api/types'

const router = useRouter()
const userStore = useUserStore()
const { showError, showSuccess, showWarning } = useAppDialog()

// 使用统一的默认头像函数
const defaultAvatar = computed(() => {
  return getCurrentUserAvatar(
    userStore.userInfo?.avatar,
    userStore.userInfo?.id,
    userStore.userInfo?.username
  )
})

/** 默认项目封面（本地 SVG） */
const defaultProjectCover = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI0OCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjOWJhM2FkIj5Qcm9qZWN0PC90ZXh0Pjwvc3ZnPg=='

/** 默认用户封面（本地 SVG） */
const defaultUserCover = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDEyMDAgNDAwIj48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9IiNlNWU3ZWIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSI2NCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmaWxsPSIjOWJhM2FkIj5Db3ZlcjwvdGV4dD48L3N2Zz4='

const tabs = [
  { key: 'projects', label: '我的项目' },
  { key: 'posts', label: '我的动态' },
  { key: 'stars', label: '收藏夹' },
  { key: 'about', label: '关于我' }
]

const activeTab = ref('projects')
const projects = ref<Project[]>([])
const posts = ref<Post[]>([])
const favoriteProjects = ref<Project[]>([])
const loading = ref(false)
const coverUploading = ref(false)

const userCover = ref(userStore.userInfo?.cover || defaultUserCover)

const isOwnProfile = computed(() => {
  return true
})

const userStats = reactive({
  likes: 0,
  followers: 0,
  following: 0
})

// 粉丝/关注弹窗相关
const showFollowModalFlag = ref(false)
const followModalType = ref<'followers' | 'following'>('followers')
const followListLoading = ref(false)
const followList = ref<MyFollowingItem[] | MyFollowerItem[]>([])

const showFollowModal = (type: 'followers' | 'following') => {
  console.log('showFollowModal called, type:', type)
  followModalType.value = type
  showFollowModalFlag.value = true
  fetchFollowList()
}

async function fetchFollowList() {
  console.log('fetchFollowList called, type:', followModalType.value)
  followListLoading.value = true
  try {
    if (followModalType.value === 'followers') {
      console.log('Fetching my followers')
      const res = await getMyFollowers()
      console.log('Followers response:', res)
      followList.value = res.data.data || []
    } else {
      console.log('Fetching my following')
      const res = await getMyFollowing()
      console.log('Following response:', res)
      followList.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取粉丝/关注列表失败:', error)
  } finally {
    followListLoading.value = false
  }
}

/**
 * 处理背景图文件选择
 */
const handleCoverChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 验证文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    await showWarning('图片大小不能超过 5MB')
    target.value = ''
    return
  }

  coverUploading.value = true
  try {
    const res = await uploadFile(file)
    const { url } = res.data.data

    // 更新用户背景图
    await updateUser({ cover: url })

    // 更新本地显示
    userCover.value = url

    // 更新 store
    userStore.updateProfile({ cover: url })

    await showSuccess('封面更新成功')
  } catch (error) {
    console.error('封面上传失败:', error)
    await showError('封面上传失败，请重试')
  } finally {
    coverUploading.value = false
    target.value = ''
  }
}

const goToProject = (id: string) => {
  router.push(`/project/${id}`)
}

const goToPost = (id: string) => {
  router.push(`/community/post/${id}`)
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

async function fetchData() {
  if (!userStore.isLoggedIn || !userStore.userInfo?.id) return
  loading.value = true
  const userId = Number(userStore.userInfo.id)
  try {
    const [projectsRes, postsRes, favoritesRes, statsRes, followingRes, followersRes] = await Promise.all([
      getMyProjects(),
      getUserPosts(userId),
      getMyFavorites(),
      getUserStats(),
      getMyFollowingCount(),
      getMyFollowersCount()
    ])
    if (projectsRes.data.status === 200) {
      projects.value = projectsRes.data.data?.projects || []
    }
    if (postsRes.data.status === 200) {
      posts.value = postsRes.data.data || []
    }
    if (favoritesRes.data.status === 200) {
      favoriteProjects.value = favoritesRes.data.data?.projects || []
    }
    if (statsRes.data.status === 200) {
      const s = statsRes.data.data
      // likes 使用用户实体里的 likesCount，stats 接口没有返回获赞数
      userStats.likes = userStore.userInfo?.stats?.likes || 0
      userStats.following = s?.followingCount || followingRes.data.count || 0
      userStats.followers = s?.followerCount || followersRes.data.count || 0
    }
  } catch (error) {
    console.error('获取个人中心数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

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

.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
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

.profile-cover {
  height: 320px;
  background-size: cover;
  background-position: center;
  position: relative;

  .cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.3) 100%);
  }

  .cover-upload-wrapper {
    position: absolute;
    bottom: 16px;
    right: 16px;
    z-index: 10;
  }

  .cover-upload-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);

    &:hover:not(.is-loading) {
      background: rgba(0, 0, 0, 0.7);
    }

    &.is-loading {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .upload-icon {
      width: 16px;
      height: 16px;
    }

    .file-input {
      display: none;
    }
  }
}

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

.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 60px;
  position: relative;
  z-index: 1;
  margin-top: -80px;
}

.profile-header {
  display: flex;
  align-items: flex-end;
  gap: 32px;
  padding: 32px;
  margin-bottom: 24px;

  .user-avatar-wrapper {
    background: #fff;
    padding: 4px;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;

    .user-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
    }
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
      }

      .role-tag {
        padding: 4px 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 12px;
        font-weight: 500;
        border-radius: 20px;
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
              color: #667eea;
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

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s $ease-out-expo;

  .btn-icon {
    width: 16px;
    height: 16px;
  }

  &.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
  }

  &.btn-icon-only {
    width: 40px;
    height: 40px;
    padding: 0;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: #4b5563;

    &:hover {
      background: rgba(255, 255, 255, 0.8);
      color: #1f2937;
    }
  }
}

.profile-tabs {
  padding: 32px;
  min-height: 400px;
  animation-delay: 0.1s;

  .tabs-header {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    padding-bottom: 16px;

    .tab-btn {
      padding: 10px 20px;
      background: transparent;
      border: none;
      font-size: 15px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      border-radius: 12px;
      transition: all 0.3s $ease-out-expo;
      position: relative;

      &:hover {
        color: #1f2937;
        background: rgba(0, 0, 0, 0.03);
      }

      &.active {
        color: #667eea;
        background: rgba(102, 126, 234, 0.1);

        &::after {
          content: '';
          position: absolute;
          bottom: -17px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 3px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
        }
      }
    }
  }
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.project-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s $ease-out-expo;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.8);
  }

  .card-thumb {
    height: 160px;
    background-size: cover;
    background-position: center;
    position: relative;

    .card-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.3) 0%, transparent 50%);
    }
  }

  .card-content {
    padding: 20px;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #1f2937;
    }

    .card-desc {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 16px;
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

        .meta-icon {
          width: 14px;
          height: 14px;
        }
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

.add-project-card {
  background: rgba(255, 255, 255, 0.3);
  border: 2px dashed rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  cursor: pointer;
  transition: all 0.3s $ease-out-expo;
  gap: 12px;

  &:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);

    .add-icon {
      color: #667eea;
    }

    .add-text {
      color: #667eea;
    }
  }

  .add-icon {
    width: 48px;
    height: 48px;
    color: #9ca3af;
    transition: color 0.3s ease;
  }

  .add-text {
    font-size: 14px;
    font-weight: 600;
    color: #6b7280;
    transition: color 0.3s ease;
  }
}

.empty-state {
  padding: 80px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .empty-icon {
    width: 64px;
    height: 64px;
    color: #d1d5db;
  }

  .empty-text {
    font-size: 16px;
    color: #9ca3af;
  }
}

.about-content {
  max-width: 800px;

  .info-group {
    margin-bottom: 32px;

    .info-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .info-text {
      color: #4b5563;
      line-height: 1.6;
    }
  }
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s $ease-out-expo;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.9);
  }
}

.post-header-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.post-meta {
  display: flex;
  flex-direction: column;
}

.post-author-name {
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
}

.post-time {
  font-size: 12px;
  color: #9ca3af;
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
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.img-more {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.post-footer-mini {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #9ca3af;
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

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;

    .user-details {
      .name-row {
        justify-content: center;
      }

      .stats-row {
        justify-content: center;
      }
    }

    .action-buttons {
      width: 100%;
      justify-content: center;
    }
  }

  .projects-grid {
    grid-template-columns: 1fr;
  }
}
</style>
