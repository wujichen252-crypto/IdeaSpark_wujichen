<template>
  <!-- 我的圈子 -->
  <div class="groups-card glass-panel" :style="{ animationDelay: '0.15s' }">
    <h4 class="card-title">
      <Users class="title-icon" />
      我的圈子
      <button class="explore-groups-btn" @click="ctx.activeFeed.value = 'groups'">
        <Compass class="explore-icon-sm" />
        <span>去逛逛</span>
      </button>
    </h4>
    <div class="groups-list">
      <div
        v-for="group in ctx.myGroups.value"
        :key="group.id"
        class="group-item"
      >
        <div class="group-item-content" @click="ctx.selectGroup(group)">
          <img
            :src="group.group?.iconUrl || ctx.defaultGroupIcon"
            :alt="group.group?.name"
            class="group-icon"
            @error="ctx.handleImageError"
          />
          <div class="group-info">
            <span
              class="group-name"
              :title="group.group?.name"
            >
              {{ group.group?.name }}
            </span>
            <span class="group-count">{{ group.role === 'admin' ? '管理员' : '成员' }}</span>
          </div>
        </div>
        <button
          v-if="group.group?.id"
          class="enter-group-btn"
          @click.stop="ctx.selectGroup(group)"
        >
          进入
        </button>
      </div>
      <div v-if="ctx.myGroups.value.length === 0" class="empty-groups">
        <p>还没有加入圈子</p>
        <button class="explore-btn" @click="ctx.activeFeed.value = 'groups'">探索圈子</button>
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
        v-for="user in ctx.suggestedUsers.value"
        :key="user.id"
        class="suggest-item"
      >
        <div class="suggest-user" @click="ctx.goToProfile(String(user.id))">
          <img
            :src="user.avatar"
            :alt="user.name"
            class="suggest-avatar"
            @error="ctx.handleImageError"
          />
          <div class="suggest-info">
            <p class="suggest-name">{{ user.name }}</p>
            <p class="suggest-desc">{{ user.desc }}</p>
          </div>
        </div>
        <button class="follow-btn" @click="ctx.toggleFollow(user)">
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
</template>

<script setup lang="ts">
import { Users, Compass, UserPlus } from 'lucide-vue-next'
import { useCommunityContext } from '@/composables/useCommunity'

const ctx = useCommunityContext()
</script>
