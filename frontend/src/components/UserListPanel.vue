<template>
  <div class="user-list-container">
    <div v-if="loading" class="loading-state">
      <n-spin size="large" />
    </div>
    <div v-else-if="userList.length === 0" class="empty-state">
      <n-empty :description="emptyText" />
    </div>
    <div v-else class="user-list">
      <div 
        v-for="user in userList" 
        :key="user.id" 
        class="user-card"
        @click="goToUserProfile(user.id)"
      >
        <n-avatar
          round
          :size="56"
          :src="getAvatarUrl(user)"
          class="user-avatar"
        />
        <div class="user-info">
          <div class="user-name">{{ user.name }}</div>
          <div class="user-bio">{{ user.bio || '这个人很懒，还没有写简介。' }}</div>
        </div>
        <div class="user-action" @click.stop>
          <n-button
            v-if="showFollowButton && !isCurrentUser(user.id)"
            :type="user.isFollowed ? 'default' : 'primary'"
            size="small"
            round
            :loading="followLoadingIds.has(user.id)"
            @click="handleFollowUser(user)"
          >
            {{ user.isFollowed ? '已关注' : '关注' }}
          </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户列表组件
 * @description 用于展示粉丝列表或关注列表，支持关注/取消关注操作
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { followUser, unfollowUser, checkFollowing } from '@/api/follow'
import { useUserStore } from '@/store'
import { getOtherUserAvatar } from '@/utils/avatar'
import type { MyFollowingItem, MyFollowerItem } from '@/api/types'

interface UserInfo {
  id: number
  name: string
  avatar: string
  bio?: string
  isFollowed: boolean
}

const props = defineProps<{
  /** 用户列表数据 */
  list: MyFollowingItem[] | MyFollowerItem[]
  /** 列表类型：followers-粉丝列表，following-关注列表 */
  type: 'followers' | 'following'
  /** 是否显示关注按钮 */
  showFollowButton?: boolean
  /** 目标用户ID（用于检查关注状态） */
  targetUserId: number
}>()

const emit = defineEmits<{
  /** 关注状态变更时触发 */
  (e: 'followChange', userId: number, isFollowed: boolean): void
}>()

const router = useRouter()
const message = useMessage()
const userStore = useUserStore()

const loading = ref(false)
const followLoadingIds = ref<Set<number>>(new Set())
const userList = ref<UserInfo[]>([])

/** 空状态提示文本 */
const emptyText = computed(() => {
  return props.type === 'followers' ? '暂无粉丝' : '暂无关注'
})

/**
 * 初始化用户列表
 */
function initUserList() {
  userList.value = props.list.map(item => {
    if (props.type === 'followers') {
      const followerItem = item as MyFollowerItem
      return {
        id: followerItem.followerId,
        name: followerItem.followerName,
        avatar: followerItem.followerAvatar,
        isFollowed: false
      }
    } else {
      const followingItem = item as MyFollowingItem
      return {
        id: followingItem.followingId,
        name: followingItem.followingName,
        avatar: followingItem.followingAvatar,
        isFollowed: false
      }
    }
  })
}

/**
 * 获取用户头像URL
 * @param user - 用户信息
 */
function getAvatarUrl(user: UserInfo): string {
  return getOtherUserAvatar(user.avatar, String(user.id), user.name)
}

/**
 * 检查是否为当前登录用户
 * @param userId - 用户ID
 */
function isCurrentUser(userId: number): boolean {
  return userStore.isLoggedIn && userStore.userInfo?.id === String(userId)
}

/**
 * 跳转到用户主页
 * @param userId - 用户ID
 */
function goToUserProfile(userId: number): void {
  router.push(`/user/${userId}`)
}

/**
 * 处理关注/取消关注操作
 * @param user - 用户信息
 */
async function handleFollowUser(user: UserInfo): Promise<void> {
  if (!userStore.isLoggedIn) {
    message.info('请先登录后再关注')
    router.push('/login')
    return
  }

  followLoadingIds.value.add(user.id)
  try {
    if (user.isFollowed) {
      await unfollowUser(user.id)
      user.isFollowed = false
      message.success('已取消关注')
    } else {
      await followUser(user.id)
      user.isFollowed = true
      message.success('关注成功')
    }
    emit('followChange', user.id, user.isFollowed)
  } catch (error) {
    console.error('关注操作失败:', error)
    message.error('操作失败，请稍后重试')
  } finally {
    followLoadingIds.value.delete(user.id)
  }
}

/**
 * 初始化关注状态
 * @description 获取当前用户对列表中用户的关注状态
 */
async function initFollowStatus(): Promise<void> {
  if (!userStore.isLoggedIn || !props.showFollowButton) return
  
  loading.value = true
  try {
    const checkPromises = userList.value.map(async (user) => {
      if (isCurrentUser(user.id)) return
      const res = await checkFollowing(user.id)
      const targetUser = userList.value.find(u => u.id === user.id)
      if (targetUser) {
        targetUser.isFollowed = res.data.data?.following || false
      }
    })
    await Promise.all(checkPromises)
  } catch (error) {
    console.error('获取关注状态失败:', error)
  } finally {
    loading.value = false
  }
}

// 监听列表变化，重新初始化
watch(() => props.list, () => {
  initUserList()
  initFollowStatus()
}, { immediate: true })
</script>

<style scoped lang="scss">
.user-list-container {
  padding: 16px 0;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.empty-state {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .user-avatar {
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    min-width: 0;

    .user-name {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }

    .user-bio {
      font-size: 13px;
      color: #6b7280;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .user-action {
    flex-shrink: 0;
  }
}
</style>
