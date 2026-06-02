<template>
  <div class="workbench-team-view">
    <!-- 用户/团队信息头部 -->
    <div class="team-profile-header">
      <div class="profile-main">
        <div class="profile-left">
          <n-avatar
            round
            :size="48"
            :src="
              currentTeam?.avatarUrl || defaultTeamAvatar
            "
            class="profile-avatar"
          />
          <div class="profile-info">
            <h1 class="profile-name">
              {{ currentTeam?.name || userStore.userInfo?.username || '未登录用户' }}
            </h1>
            <div class="profile-desc">
              <n-icon :component="CreateOutline" class="edit-icon" />
              <span>{{ props.isPersonal ? '添加个人描述' : (currentTeam?.description || '添加团队描述') }}</span>
            </div>
          </div>
        </div>
        <div class="profile-actions">
          <n-button secondary class="invite-btn" @click="handleInviteMember">
            <template #icon><n-icon :component="PersonAddOutline" /></template>
            邀请成员
          </n-button>
        </div>
      </div>

      <!-- 选项卡导航 -->
      <div class="profile-tabs">
        <n-tabs v-model:value="currentTab" type="line" animated>
          <n-tab-pane name="projects" tab="项目">
            <!-- 项目列表内容 -->
            <div class="project-list-container custom-scrollbar">
              <!-- 所有项目 -->
              <div class="team-group">
                <div class="group-header">
                  <div class="header-left">
                    <span class="group-title">全部项目</span>
                    <n-badge :value="allProjects.length" type="info" class="group-count" />
                  </div>
                  <div class="header-right">
                    <n-button
type="primary"
color="#000"
size="small"
@click="openCreateModal">
                      <template #icon><n-icon :component="AddOutline" /></template>
                      创建项目
                    </n-button>
                  </div>
                </div>

                <!-- 加载状态 -->
                <div v-if="loadingProjects" class="loading-state">
                  <n-spin size="medium" />
                </div>

                <div v-else class="project-row-list">
                  <div
                    v-for="project in allProjects"
                    :key="project.id"
                    class="project-row-card simple-file-row"
                    style="cursor: pointer"
                    @click="handleOpenProject(project.id)"
                  >
                    <div class="file-icon">
                      <n-icon :component="DocumentText" color="#6b7280" size="24" />
                    </div>
                    <div class="card-info">
                      <div class="card-title-row">
                        <span class="card-title">{{ project.name }}</span>
                      </div>
                      <div class="card-meta-row">
                        <n-tag size="small" :bordered="false">{{ project.category }}</n-tag>
                      </div>
                    </div>
                    <div class="card-actions">
                      <n-button circle quaternary size="small">
                        <template #icon><n-icon :component="ShareSocialOutline" /></template>
                      </n-button>
                    </div>
                  </div>

                  <!-- 创建新项目卡片 -->
                  <!-- <div class="project-row-card create-new-card" @click="router.push('/ai/workshop/start')">
                       <div class="file-icon">
                          <n-icon :component="AddOutline" color="#9ca3af" size="32" />
                       </div>
                       <div class="card-info">
                         <span class="card-title text-gray">创建新项目</span>
                       </div>
                     </div> -->
                </div>
              </div>

              <!-- 空状态 -->
              <div v-if="allProjects.length === 0" class="empty-team-state">
                <n-empty description="团队暂无项目" />
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="members" tab="成员">
            <div class="members-container">
              <div class="members-toolbar">
                <n-tabs
                  v-model:value="membersSubTab"
                  type="segment"
                  size="small"
                  style="width: 240px"
                >
                  <n-tab-pane name="members" :tab="`成员 (${memberCount})`" />
                  <n-tab-pane name="visitors" :tab="`访客 (${visitorCount})`" />
                </n-tabs>
                <div class="members-tools">
                  <n-select
                    v-model:value="memberRoleFilter"
                    size="small"
                    :options="memberRoleOptions"
                    style="width: 140px"
                  />
                  <n-input
                    v-model:value="memberKeyword"
                    clearable
                    size="small"
                    placeholder="搜索成员"
                    style="width: 220px"
                  >
                    <template #prefix><n-icon :component="SearchOutline" /></template>
                  </n-input>
                </div>
              </div>

              <div class="members-table-header">
                <div class="col-name">名称</div>
                <div class="col-role">团队权限</div>
                <div class="col-actions">操作</div>
              </div>
              
              <!-- 加载状态 -->
              <div v-if="loadingMembers" class="members-loading">
                <n-spin size="medium" />
              </div>
              
              <div v-else-if="displayedMembers.length" class="members-list">
                <div v-for="m in displayedMembers" :key="m.id" class="member-row">
                  <div class="col-name">
                    <n-avatar round size="small" :src="m.userAvatar || getMemberFallbackAvatar(m)" />
                    <div class="member-meta">
                      <div class="member-name-row">
                        <span class="member-name">{{ m.userName }}</span>
                        <n-tag
                          v-if="m.isMe"
                          size="small"
                          type="info"
                          :bordered="false"
                          class="me-tag"
                          >
我
</n-tag
                        >
                      </div>
                      <span class="member-sub">{{ formatJoinTime(m.joinedAt) }}</span>
                    </div>
                  </div>
                  <div class="col-role">
                    <span class="role-text">{{ m.roleCn || getRoleLabel(m.role) }}</span>
                  </div>
                  <div class="col-actions">
                    <n-popconfirm
                      v-if="m.canRemove && !m.isMe && !props.isPersonal"
                      @positive-click="handleRemoveMember(m.id, m.userName)"
                    >
                      <template #trigger>
                        <n-button text size="small" type="error">移除</n-button>
                      </template>
                      确定要将「{{ m.userName }}」从团队中移除吗？
                    </n-popconfirm>
                    <span v-else class="action-placeholder">—</span>
                  </div>
                </div>
              </div>
              <div v-else class="members-empty">
                <n-empty :description="membersEmptyText">
                  <template #extra>
                    <n-space>
                      <n-button secondary @click="handleInviteMember">邀请成员</n-button>
                      <n-button quaternary @click="resetMemberFilters">清除筛选</n-button>
                    </n-space>
                  </template>
                </n-empty>
              </div>
            </div>
          </n-tab-pane>

          <!-- 资源标签页 - 注意：后端暂无资源管理API，当前为前端演示功能 -->
          <n-tab-pane name="resources" tab="资源">
            <div class="resources-container">
              <div class="resources-toolbar">
                <n-radio-group v-model:value="resourceKind" size="medium">
                  <n-radio-button value="repo" label="资源库" />
                  <n-radio-button value="fonts" label="字体库" />
                </n-radio-group>
                <div class="resources-tools">
                  <n-button
                    type="primary"
                    color="#000"
                    size="small"
                    @click="openCreateResourceModal"
                  >
                    新建{{ resourceKindLabel }}
                  </n-button>
                  <n-input
                    v-model:value="resourceKeyword"
                    clearable
                    size="small"
                    :placeholder="`搜索${resourceKindLabel}名称`"
                    style="width: 240px"
                  >
                    <template #prefix><n-icon :component="SearchOutline" /></template>
                  </n-input>
                </div>
              </div>

              <div v-if="filteredResources.length" class="resources-list">
                <div v-for="r in filteredResources" :key="r.id" class="resource-row">
                  <div class="resource-main">
                    <div class="resource-icon">
                      <n-icon
                        :component="r.kind === 'repo' ? FolderOpenOutline : TextOutline"
                        size="22"
                        color="#3f3f46"
                      />
                    </div>
                    <div class="resource-info">
                      <div class="resource-title">{{ r.name }}</div>
                      <div class="resource-meta">
                        <span>{{ r.itemCount }} 项</span>
                        <span class="meta-dot">·</span>
                        <span>{{ formatUpdateTime(r.updatedAt) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="resource-actions">
                    <n-button text size="small" @click="handleOpenResource(r.id)">打开</n-button>
                  </div>
                </div>
              </div>
              <div v-else class="resources-empty">
                <n-empty :description="`暂无${resourceKindLabel}`">
                  <template #extra>
                    <n-space>
                      <n-button
type="primary"
color="#000"
@click="openCreateResourceModal"
                        >
新建{{ resourceKindLabel }}
</n-button
                      >
                      <n-button quaternary @click="resetResourceFilters">清除搜索</n-button>
                    </n-space>
                  </template>
                </n-empty>
              </div>
            </div>

            <n-modal v-model:show="showCreateResourceModal">
              <n-card
                style="width: 560px"
                title="新建资源"
                :bordered="false"
                size="huge"
                role="dialog"
                aria-modal="true"
              >
                <n-form
                  ref="resourceFormRef"
                  :model="createResourceForm"
                  :rules="createResourceRules"
                  label-placement="left"
                  label-width="auto"
                  require-mark-placement="right-hanging"
                >
                  <n-form-item label="类型" path="kind">
                    <n-radio-group v-model:value="createResourceForm.kind">
                      <n-radio-button value="repo" label="资源库" />
                      <n-radio-button value="fonts" label="字体库" />
                    </n-radio-group>
                  </n-form-item>
                  <n-form-item label="名称" path="name">
                    <n-input v-model:value="createResourceForm.name" placeholder="请输入名称" />
                  </n-form-item>
                </n-form>
                <template #footer>
                  <n-space justify="end">
                    <n-button @click="showCreateResourceModal = false">取消</n-button>
                    <n-button
type="primary"
color="#000"
@click="handleCreateResource"
                      >
确认创建
</n-button
                    >
                  </n-space>
                </template>
              </n-card>
            </n-modal>
          </n-tab-pane>

          <n-tab-pane name="settings" tab="设置">
            <div class="settings-container">
              <div class="setting-item">
                <div class="setting-label">团队人数</div>
                <div class="setting-content">{{ currentTeam?.teamSize || 0 }}</div>
              </div>
              <n-divider />
              <div class="setting-item">
                <div class="setting-label">团队头像</div>
                <div class="setting-content">
                  <div class="team-avatar-preview">
                    <n-avatar
                      round
                      :size="64"
                      :src="currentTeam?.avatarUrl || defaultTeamAvatar"
                      class="team-avatar-img"
                    />
                    <div class="avatar-upload-info">
                      <div class="setting-desc">支持 2M 以内的JPG、JPEG、PNG</div>
                      <label class="upload-btn" :class="{ 'is-loading': avatarUploading }">
                        <input
                          type="file"
                          accept="image/*"
                          class="file-input"
                          :disabled="avatarUploading"
                          @change="handleAvatarChange"
                        />
                        <span v-if="avatarUploading">上传中...</span>
                        <span v-else>更换头像</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <n-divider />
              <div class="setting-item">
                <div class="setting-label">团队 ID</div>
                <div class="setting-content">{{ currentTeam?.uuid || '-' }}</div>
                <div class="setting-action">
                  <n-button @click="copyTeamId">复制</n-button>
                </div>
              </div>
              <n-divider />
              <div class="setting-item">
                <div class="setting-label">解散团队</div>
                <div class="setting-content">
                  <div class="setting-desc">
                    删除团队后，团队所有成员将无法访问团队的任何项目、文件、资源库。
                  </div>
                </div>
                <div class="setting-action">
                  <n-button 
                    type="error" 
                    ghost 
                    :disabled="!canDissolveTeam"
                    @click="handleDissolveTeam"
                  >
                    解散团队
                  </n-button>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <!-- 回收站标签页 - 注意：后端暂无回收站API，当前为前端演示功能 -->
          <n-tab-pane name="trash" tab="回收站">
            <div class="trash-container">
              <n-empty description="回收站功能开发中">
                <template #extra>
                  <span style="color: #9ca3af; font-size: 14px;">该功能即将上线</span>
                </template>
              </n-empty>
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>
    </div>

    <!-- 创建项目弹窗 -->
    <n-modal v-model:show="showCreateModal">
      <n-card
        style="width: 600px"
        title="创建新项目"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-form
          ref="formRef"
          :model="createForm"
          :rules="createRules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="项目名称" path="name">
            <n-input v-model:value="createForm.name" placeholder="请输入项目名称" />
          </n-form-item>
          <n-form-item label="公开项目" path="isPublic">
            <n-switch v-model:value="createForm.isPublic" />
            <span style="margin-left: 12px; font-size: 12px; color: #666">
              {{ createForm.isPublic ? '所有人都可见' : '仅团队成员可见' }}
            </span>
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showCreateModal = false">取消</n-button>
            <n-button type="primary" color="#000" @click="handleCreateProject">确认创建</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>

    <!-- 邀请成员弹窗 -->
    <n-modal v-model:show="showInviteModal">
      <n-card
        style="width: 560px"
        title="邀请成员"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-form label-placement="left" label-width="auto">
          <n-form-item label="邀请角色">
            <n-radio-group v-model:value="inviteForm.role">
              <n-radio-button value="member" label="成员" />
              <n-radio-button 
                value="admin" 
                label="管理员"
                :disabled="!isTeamOwner"
              />
              <n-radio-button value="visitor" label="访客" />
            </n-radio-group>
          </n-form-item>
          <n-form-item label="邮箱地址">
            <n-input
              v-model:value="inviteForm.emails"
              type="textarea"
              :rows="4"
              placeholder="请输入邮箱地址，多个邮箱用逗号、分号或换行分隔"
            />
            <template #feedback>
              支持批量邀请，每行一个邮箱或使用逗号、分号分隔
            </template>
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showInviteModal = false">取消</n-button>
            <n-button 
              type="primary" 
              color="#000" 
              :loading="inviting"
              @click="handleSendInvite"
            >
              发送邀请
            </n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  SearchOutline,
  PersonAddOutline,
  AddOutline,
  CreateOutline,
  ChevronDownOutline,
  DocumentText,
  ShareSocialOutline,
  FolderOpenOutline,
  TextOutline
} from '@vicons/ionicons5'
import { useUserStore, useAiWorkshopStore } from '@/store'
import { getTeamProjects, getTeamDetail, updateTeam, dissolveTeam, getTeamMembers, removeMember, sendInvitation } from '@/api/team'
import { createProject } from '@/api/project'
import { uploadFile } from '@/api/file'
import { getTeamAvatar, getOtherUserAvatar } from '@/utils/avatar'
import type { TeamDetail } from '@/api/types'
import {
  NEmpty,
  NModal,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NSpace,
  NButton,
  NIcon,
  NTabs,
  NTabPane,
  NAvatar,
  NBadge,
  NTag,
  NDivider,
  NRadioGroup,
  NRadioButton,
  NPopconfirm,
  useMessage,
  useDialog
} from 'naive-ui'
import type { FormInst } from 'naive-ui'

const props = defineProps<{
  teamId?: string
  teamName?: string
  isPersonal?: boolean
}>()

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const aiStore = useAiWorkshopStore()
const message = useMessage()
const dialog = useDialog()
const currentTab = ref('projects')
const loadingProjects = ref(false)
const loadingTeam = ref(false)
const loadingMembers = ref(false)
const dissolvingTeam = ref(false)

// 团队信息
const currentTeam = ref<TeamDetail | null>(null)

// 团队项目列表
const teamProjects = ref<any[]>([])

// 头像上传状态
const avatarUploading = ref(false)

// 默认团队头像 - 使用统一的头像工具函数
const defaultTeamAvatar = computed(() => getTeamAvatar(currentTeam.value?.uuid, currentTeam.value?.name))

// 判断当前用户是否是团队所有者
const isTeamOwner = computed(() => {
  return currentTeam.value?.currentUserRole?.toLowerCase() === 'owner'
})

// 判断是否可以解散团队（只有所有者可以解散）
const canDissolveTeam = computed(() => {
  return isTeamOwner.value && !props.isPersonal
})

/**
 * 处理头像文件选择
 */
const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 验证文件大小 (2MB)
  if (file.size > 2 * 1024 * 1024) {
    message.error('图片大小不能超过 2MB')
    target.value = ''
    return
  }

  avatarUploading.value = true
  try {
    const res = await uploadFile(file)
    const { url } = res.data.data

    // 更新团队头像
    const teamUuid = route.params.uuid as string
    if (teamUuid) {
      await updateTeam(teamUuid, { avatarUrl: url })
      // 刷新团队详情
      await loadTeamDetail()
      message.success('团队头像更新成功')
    }
  } catch (error) {
    console.error('头像上传失败:', error)
    message.error('头像上传失败，请重试')
  } finally {
    avatarUploading.value = false
    target.value = ''
  }
}

/**
 * 复制团队ID到剪贴板
 */
function copyTeamId() {
  const teamId = currentTeam.value?.uuid
  if (!teamId) {
    message.warning('团队ID不存在')
    return
  }
  
  navigator.clipboard.writeText(teamId).then(() => {
    message.success('团队ID已复制到剪贴板')
  }).catch(() => {
    message.error('复制失败，请手动复制')
  })
}

/**
 * 解散团队
 */
function handleDissolveTeam() {
  if (!canDissolveTeam.value) {
    message.warning('只有团队所有者可以解散团队')
    return
  }
  
  const teamUuid = route.params.uuid as string
  if (!teamUuid) {
    message.error('团队信息异常')
    return
  }
  
  dialog.warning({
    title: '确认解散团队',
    content: `确定要解散团队「${currentTeam.value?.name}」吗？解散后所有成员将无法访问团队的项目和资源，此操作不可恢复。`,
    positiveText: '确认解散',
    negativeText: '取消',
    positiveButtonProps: {
      type: 'error'
    },
    onPositiveClick: async () => {
      dissolvingTeam.value = true
      try {
        const res = await dissolveTeam(teamUuid)
        if (res.data.status === 200) {
          message.success('团队解散成功')
          // 跳转到工作台首页
          router.push('/workbench')
        } else {
          message.error(res.data.message || '解散团队失败')
        }
      } catch (error: any) {
        console.error('解散团队失败:', error)
        message.error(error?.response?.data?.message || '解散团队失败')
      } finally {
        dissolvingTeam.value = false
      }
    }
  })
}

/**
 * 加载团队详情
 */
async function loadTeamDetail() {
  if (props.isPersonal) {
    currentTeam.value = null
    return
  }

  const teamUuid = route.params.uuid as string
  if (!teamUuid) {
    currentTeam.value = null
    return
  }

  loadingTeam.value = true
  try {
    const res = await getTeamDetail(teamUuid)
    if (res.data.status === 200) {
      currentTeam.value = res.data.data
    } else {
      message.error(res.data.message || '获取团队详情失败')
    }
  } catch (error: any) {
    console.error('加载团队详情失败:', error)
    message.error(error?.response?.data?.message || '加载团队详情失败')
  } finally {
    loadingTeam.value = false
  }
}

/**
 * 加载团队项目列表
 */
async function loadTeamProjects() {
  // 如果是个人空间，不加载团队项目
  if (props.isPersonal) {
    teamProjects.value = []
    return
  }

  // 从路由参数获取团队 UUID
  const teamUuid = route.params.uuid as string
  if (!teamUuid) {
    teamProjects.value = []
    return
  }

  loadingProjects.value = true
  try {
    const res = await getTeamProjects(teamUuid, { page: 1, size: 50 })
    if (res.data.status === 200) {
      teamProjects.value = res.data.data?.projects || []
    } else {
      teamProjects.value = []
      message.error(res.data.message || '获取团队项目失败')
    }
  } catch (error: any) {
    console.error('加载团队项目失败:', error)
    message.error(error?.response?.data?.message || '加载团队项目失败')
    teamProjects.value = []
  } finally {
    loadingProjects.value = false
  }
}

// 监听路由参数变化，重新加载项目和团队详情
watch(
  () => route.params.uuid,
  () => {
    loadTeamDetail()
    loadTeamProjects()
    loadTeamMembers()
  },
  { immediate: true }
)

// 创建项目相关
const showCreateModal = ref(false)
const formRef = ref<FormInst | null>(null)
const createForm = reactive({
  name: '',
  isPublic: false
})
const createRules = {
  name: {
    required: true,
    message: '请输入项目名称',
    trigger: ['blur', 'input']
  }
}

/**
 * 打开创建项目弹窗并重置表单。
 */
const openCreateModal = () => {
  createForm.name = ''
  createForm.isPublic = false
  showCreateModal.value = true
}

/**
 * 校验并创建新项目，然后跳转到项目工作区。
 */
const handleCreateProject = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  // 获取当前团队UUID
  const teamUuid = route.params.uuid as string
  if (!teamUuid) {
    message.error('团队信息异常，请重新选择团队')
    return
  }

  try {
    const res = await createProject({
      name: createForm.name.trim(),
      visibility: createForm.isPublic ? 'public' : 'private',
      teamId: teamUuid,
      description: '',
      category: '其他',
      type: 'app'
    })

    if (res.data.status === 201 || res.data.status === 200) {
      message.success('项目创建成功')
      showCreateModal.value = false
      createForm.name = ''
      createForm.isPublic = false
      // 刷新项目列表
      await loadTeamProjects()
    } else {
      message.error(res.data.message || '创建失败')
    }
  } catch (error: any) {
    console.error('创建项目失败:', error)
    message.error(error?.response?.data?.message || '创建项目失败，请稍后重试')
  }
}

// 计算所有项目（优先使用团队项目列表，否则使用本地 store）
const allProjects = computed(() => {
  // 如果是团队空间（有团队UUID），使用团队项目列表
  const teamUuid = route.params.uuid as string
  if (!props.isPersonal && teamUuid) {
    return teamProjects.value
  }
  // 如果是个人空间，使用本地 store
  return aiStore.projectList
})

/**
 * 打开项目（按项目类型路由跳转）。
 */
const handleOpenProject = (id: string) => {
  console.log('Opening project:', id)
  
  // 先从团队项目列表中查找
  const teamProject = teamProjects.value.find(p => p.id === id)
  console.log('Team project data:', teamProject)
  
  if (teamProject) {
    // 将项目添加到 aiStore，以便工作区页面可以访问
    const existingProject = aiStore.getProjectById(id)
    if (!existingProject) {
      aiStore.addProject({
        id: teamProject.id,
        name: teamProject.name,
        description: teamProject.description || '',
        category: teamProject.category || '其他',
        type: teamProject.type || 'app',
        currentModule: 'home',
        updatedAt: Date.now(),
        status: 'active',
        visibility: teamProject.visibility || 'private'
      })
    }
    
    if (teamProject.type === 'document') {
      router.push(`/project/doc/${id}`)
    } else {
      router.push(`/project/workspace/${id}`)
    }
    return
  }
  
  // 如果不在团队项目中，尝试从 aiStore 获取（个人空间项目）
  const project = aiStore.getProjectById(id)
  console.log('Store project data:', project)

  if (!project) {
    message.error('项目不存在或已被删除')
    return
  }

  if (project.type === 'document') {
    router.push(`/project/doc/${id}`)
  } else {
    router.push(`/project/workspace/${id}`)
  }
}

type MemberRole = 'owner' | 'admin' | 'member' | 'visitor'

interface TeamMember {
  id: number
  userId: number
  userName: string
  userAvatar?: string
  role: MemberRole
  roleCn?: string
  joinedAt: string
  isMe?: boolean
  canRemove?: boolean
  canChangeRole?: boolean
}

type MembersSubTab = 'members' | 'visitors'

const membersSubTab = ref<MembersSubTab>('members')
const memberRoleFilter = ref<MemberRole | 'all'>('all')
const memberKeyword = ref('')

// 从API加载的成员列表
const members = ref<TeamMember[]>([])

const memberRoleOptions = computed(() => {
  const base = [
    { label: '全部权限', value: 'all' as const },
    { label: '所有者', value: 'owner' as const },
    { label: '管理员', value: 'admin' as const },
    { label: '成员', value: 'member' as const },
    { label: '访客', value: 'visitor' as const }
  ]
  if (membersSubTab.value === 'visitors') {
    return base.filter((i) => i.value === 'all' || i.value === 'visitor')
  }
  return base.filter((i) => i.value !== 'visitor')
})

const memberCount = computed(() => members.value.filter((m) => m.role !== 'visitor').length)
const visitorCount = computed(() => members.value.filter((m) => m.role === 'visitor').length)

const displayedMembers = computed(() => {
  const keyword = memberKeyword.value.trim().toLowerCase()
  const inSubTab = members.value.filter((m) =>
    membersSubTab.value === 'visitors' ? m.role === 'visitor' : m.role !== 'visitor'
  )
  const inRole = inSubTab.filter((m) =>
    memberRoleFilter.value === 'all' ? true : m.role === memberRoleFilter.value
  )
  if (!keyword) return inRole
  return inRole.filter((m) => m.userName.toLowerCase().includes(keyword))
})

const membersEmptyText = computed(() => {
  if (!members.value.length) return '暂无成员'
  if (membersSubTab.value === 'visitors') return '暂无访客'
  if (memberKeyword.value.trim()) return '未找到匹配的成员'
  if (memberRoleFilter.value !== 'all') return '该权限下暂无成员'
  return '暂无成员'
})

/**
 * 获取成员角色文案。
 */
function getRoleLabel(role: MemberRole): string {
  const map: Record<MemberRole, string> = {
    owner: '所有者',
    admin: '管理员',
    member: '成员',
    visitor: '访客'
  }
  return map[role]
}

/**
 * 加载团队成员列表
 */
async function loadTeamMembers() {
  if (props.isPersonal) {
    members.value = []
    return
  }

  const teamUuid = route.params.uuid as string
  if (!teamUuid) {
    members.value = []
    return
  }

  loadingMembers.value = true
  try {
    const res = await getTeamMembers(teamUuid, { page: 1, size: 100 })
    if (res.data.status === 200) {
      // 标记当前用户
      const currentUserId = userStore.userInfo?.id
      members.value = (res.data.data?.members || []).map((m: any) => ({
        ...m,
        isMe: m.userId === currentUserId
      }))
    } else {
      members.value = []
      message.error(res.data.message || '获取团队成员失败')
    }
  } catch (error: any) {
    console.error('加载团队成员失败:', error)
    message.error(error?.response?.data?.message || '加载团队成员失败')
    members.value = []
  } finally {
    loadingMembers.value = false
  }
}

/**
 * 生成成员头像兜底地址（基于名称 seed）。
 * 使用统一的头像工具函数
 */
function getMemberFallbackAvatar(member: TeamMember): string {
  return getOtherUserAvatar(undefined, undefined, member.userName)
}

/**
 * 格式化加入时间，用于成员行的副信息展示。
 */
function formatJoinTime(joinedAt: number | string): string {
  const time = typeof joinedAt === 'string' ? parseInt(joinedAt, 10) : joinedAt
  const diff = Date.now() - time
  const day = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  if (day === 0) return '今天加入'
  if (day === 1) return '昨天加入'
  if (day < 30) return `${day} 天前加入`
  const month = Math.floor(day / 30)
  return `${month} 个月前加入`
}

/**
 * 清空成员筛选与搜索条件。
 */
function resetMemberFilters(): void {
  memberRoleFilter.value = 'all'
  memberKeyword.value = ''
}

/**
 * 邀请成员弹窗控制
 */
const showInviteModal = ref(false)
const inviteForm = reactive({
  emails: '',
  role: 'member' as 'admin' | 'member' | 'visitor'
})
const inviting = ref(false)

/**
 * 打开邀请成员弹窗
 */
function handleInviteMember(): void {
  if (props.isPersonal) {
    message.warning('个人空间不能邀请成员')
    return
  }
  // 检查权限（只有 owner 和 admin 可以邀请）
  const currentRole = currentTeam.value?.currentUserRole?.toLowerCase()
  if (currentRole !== 'owner' && currentRole !== 'admin') {
    message.warning('只有团队所有者或管理员可以邀请成员')
    return
  }
  inviteForm.emails = ''
  inviteForm.role = 'member'
  showInviteModal.value = true
}

/**
 * 发送邀请
 */
async function handleSendInvite() {
  const teamUuid = route.params.uuid as string
  if (!teamUuid) {
    message.error('团队信息异常')
    return
  }

  const emails = inviteForm.emails.split(/[\n,;]/).map(e => e.trim()).filter(e => e && e.includes('@'))
  if (emails.length === 0) {
    message.error('请输入有效的邮箱地址')
    return
  }

  // 检查邀请管理员权限
  if (inviteForm.role === 'admin' && currentTeam.value?.currentUserRole?.toLowerCase() !== 'owner') {
    message.warning('只有团队所有者可以邀请管理员')
    return
  }

  inviting.value = true
  try {
    const res = await sendInvitation(teamUuid, {
      type: 'email',
      emails,
      role: inviteForm.role.toUpperCase() as 'ADMIN' | 'MEMBER'
    })
    if (res.data.status === 201 || res.data.status === 200) {
      message.success(`成功发送 ${res.data.data?.successCount || emails.length} 个邀请`)
      showInviteModal.value = false
    } else {
      message.error(res.data.message || '发送邀请失败')
    }
  } catch (error: any) {
    console.error('发送邀请失败:', error)
    message.error(error?.response?.data?.message || '发送邀请失败')
  } finally {
    inviting.value = false
  }
}

/**
 * 从团队移除成员
 */
async function handleRemoveMember(memberId: number, memberName: string) {
  const teamUuid = route.params.uuid as string
  if (!teamUuid) {
    message.error('团队信息异常')
    return
  }

  try {
    const res = await removeMember(teamUuid, String(memberId))
    if (res.data.status === 200) {
      message.success(`已将「${memberName}」从团队中移除`)
      // 刷新成员列表
      await loadTeamMembers()
    } else {
      message.error(res.data.message || '移除成员失败')
    }
  } catch (error: any) {
    console.error('移除成员失败:', error)
    message.error(error?.response?.data?.message || '移除成员失败')
  }
}

type ResourceKind = 'repo' | 'fonts'

interface ResourceLibrary {
  id: string
  name: string
  kind: ResourceKind
  itemCount: number
  updatedAt: number
}

const resourceKind = ref<ResourceKind>('repo')
const resourceKeyword = ref('')
const resources = ref<ResourceLibrary[]>([])

const filteredResources = computed(() => {
  const keyword = resourceKeyword.value.trim().toLowerCase()
  const list = resources.value.filter((r) => r.kind === resourceKind.value)
  if (!keyword) return list
  return list.filter((r) => r.name.toLowerCase().includes(keyword))
})

const resourceKindLabel = computed(() => (resourceKind.value === 'repo' ? '资源库' : '字体库'))

const showCreateResourceModal = ref(false)
const resourceFormRef = ref<FormInst | null>(null)
const createResourceForm = reactive<{ kind: ResourceKind; name: string }>({
  kind: 'repo',
  name: ''
})

const createResourceRules = {
  kind: {
    required: true,
    message: '请选择类型',
    trigger: ['change']
  },
  name: {
    required: true,
    message: '请输入名称',
    trigger: ['blur', 'input']
  }
}

/**
 * 打开新建资源弹窗并同步当前子类型。
 */
function openCreateResourceModal(): void {
  createResourceForm.kind = resourceKind.value
  createResourceForm.name = ''
  showCreateResourceModal.value = true
}

/**
 * 校验并创建资源条目（仅前端演示）。
 */
function handleCreateResource(): void {
  resourceFormRef.value?.validate((errors) => {
    if (errors) return
    const id = `res-${Date.now()}`
    resources.value = [
      {
        id,
        name: createResourceForm.name.trim(),
        kind: createResourceForm.kind,
        itemCount: 0,
        updatedAt: Date.now()
      },
      ...resources.value
    ]
    showCreateResourceModal.value = false
    message.success('创建成功')
  })
}

/**
 * 清空资源搜索条件。
 */
function resetResourceFilters(): void {
  resourceKeyword.value = ''
}

/**
 * 打开资源入口（当前为占位交互）。
 */
function handleOpenResource(resourceId: string): void {
  const target = resources.value.find((r) => r.id === resourceId)
  if (!target) return
  message.info(`打开：${target.name}`)
}

/**
 * 格式化资源更新时间展示。
 */
function formatUpdateTime(updatedAt: number): string {
  const diff = Date.now() - updatedAt
  const hour = Math.max(0, Math.floor(diff / (1000 * 60 * 60)))
  if (hour < 1) return '刚刚更新'
  if (hour < 24) return `${hour} 小时前更新`
  const day = Math.floor(hour / 24)
  return `${day} 天前更新`
}
</script>

<style scoped lang="scss">
.workbench-team-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  padding: 32px 48px;
  padding-top: calc(56px + 32px);
  width: 100%;
  box-sizing: border-box;
}

.team-profile-header {
  margin-bottom: 32px; /* 增加底部间距 */

  .create-btn {
    background-color: #000;
    border-color: #000;
    padding: 0 20px;
    font-weight: 500;

    &:hover {
      background-color: #111827;
      border-color: #111827;
    }
  }

  .profile-main {
    display: flex;
    justify-content: space-between;
    align-items: center; /* 垂直居中对齐 */
    margin-bottom: 32px;
  }

  .profile-left {
    display: flex;
    gap: 20px; /* 增加间距 */
    align-items: center;
  }

  .profile-info {
    .profile-name {
      font-size: 24px; /* 加大名字字体 */
      font-weight: 700;
      margin: 0 0 6px 0;
      color: #111827;
      letter-spacing: -0.025em;
    }

    .profile-desc {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #6b7280;
      font-size: 14px;
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: #111827;
      }

      .edit-icon {
        font-size: 14px;
      }
    }
  }

  .profile-actions {
    display: flex;
    gap: 16px;
  }
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 0 4px;

  .sort-trigger {
    color: #6b7280;
    font-weight: 500;
    &:hover {
      color: #111827;
    }
  }
}

.project-list-container {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 32px;
  padding-right: 8px;
}

/* 列表视图样式 - Modified for Grid Layout with Gray Container */
.team-group {
  background-color: #f9fafb; /* 灰色背景框 */
  border: 1px solid #f3f4f6; /* 灰色边框 */
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.project-row-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 24px;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
}

.project-row-card {
  /* Common card styles */
  display: flex;
  flex-direction: column; /* Vertical layout */
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  height: 200px; /* Fixed height for uniformity */

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-color: #d1d5db;
  }
}

.recent-project-card {
  border-left: 4px solid #000; /* Highlight recent */
}

.create-new-card {
  border: 2px dashed #e5e7eb;
  background: transparent;

  &:hover {
    border-color: #000;
    background: #f9fafb;
  }

  .text-gray {
    color: #9ca3af;
  }
}

.file-icon {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  width: 60px;
  background: #f3f4f6;
  border-radius: 12px;
}

.card-info {
  text-align: center;
  width: 100%;

  .card-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 16px;
    margin-bottom: 4px;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-desc-row {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 8px;
    height: 36px; /* 2 lines */
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .card-meta {
    font-size: 12px;
    color: #9ca3af;
  }
}

.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.project-row-card:hover .card-actions {
  opacity: 1;
}

.project-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  height: 100%;
  box-sizing: border-box;
  position: relative;

  &:hover {
    background-color: #fff;
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  .card-preview {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    overflow: hidden;
    margin-right: 0;
    margin-bottom: 16px;
    background-color: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;

    .preview-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      &.preview-1 {
        background-color: #ecfdf5;
        .mindmap-node {
          display: none;
        }
      }
    }
  }

  .card-info {
    width: 100%;
    flex: initial;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-right: 0;

    .card-title-row {
      justify-content: center;
      margin-bottom: 4px;
      gap: 0;

      .card-title {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        text-align: center;
        line-height: 1.4;
      }
    }
  }

  .card-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    padding: 2px;
  }

  &:hover .card-actions {
    opacity: 1;
  }

  &.simple-file-row {
    padding: 24px 16px;
    height: auto;

    .file-icon {
      margin-right: 0;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      background-color: #f3f4f6; /* Light gray background for icon area */
      border-radius: 12px;

      .n-icon {
        font-size: 32px !important; /* Larger icon */
      }
    }

    .card-info {
      padding-right: 0;
      .card-title-row {
        margin-bottom: 0;
      }
    }
  }
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background: #d1d5db;
}

.team-group {
  margin-bottom: 32px;

  .group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .group-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
  }
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
}

.project-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border-color: #d1d5db;

    .card-preview .card-overlay {
      opacity: 1;
    }
  }

  .card-preview {
    position: relative;
    width: 100%;
    aspect-ratio: 16/9;
    background-color: #f3f4f6;
    overflow: hidden;
    border-bottom: 1px solid #f3f4f6;

    .card-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      padding: 8px;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s;

      .overlay-btn {
        background: #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        color: #4b5563;

        &:hover {
          color: #111827;
        }
      }
    }
  }

  .preview-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    &.preview-1 {
      flex-direction: column;
      gap: 8px;
      background-color: #f9fafb;

      .mindmap-node {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 4px 12px;
        font-size: 12px;
        color: #6b7280;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
      .root {
        border-color: #000;
        color: #000;
        font-weight: 600;
        font-size: 13px;
      }
    }

    &.preview-2 {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    }
  }

  .card-info {
    padding: 12px 16px 8px;
    flex: 1;

    .card-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .card-title {
        font-weight: 600;
        font-size: 15px;
        color: #1f2937;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .card-meta {
      font-size: 12px;
      color: #9ca3af;
      margin-left: 24px; /* Align with title text (icon width approx) */
    }
  }

  .card-footer {
    padding: 8px 16px 12px;
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid transparent;

    .card-actions {
      display: flex;
      gap: 4px;

      .n-button {
        color: #9ca3af;
        &:hover {
          color: #4b5563;
        }
      }
    }
  }
}

.members-container {
  padding: 4px 0;
}

.members-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.members-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.members-table-header {
  display: grid;
  grid-template-columns: 1fr 140px 80px;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.members-list {
  margin-top: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.member-row {
  display: grid;
  grid-template-columns: 1fr 140px 80px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.member-row:last-child {
  border-bottom: none;
}

.members-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 0;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.member-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.member-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.member-name {
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.col-role {
  display: flex;
  align-items: center;
  color: #374151;
}

.col-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.action-placeholder {
  color: #d1d5db;
}

.members-empty {
  margin-top: 16px;
  padding: 32px 0;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
}

.resources-container {
  padding: 4px 0;
}

.resources-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.resources-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.resources-list {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.resource-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.resource-row:last-child {
  border-bottom: none;
}

.resource-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.resource-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f3f4f6;
  flex: 0 0 auto;
}

.resource-info {
  min-width: 0;
}

.resource-title {
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-meta {
  margin-top: 2px;
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-dot {
  color: #d1d5db;
}

.resources-empty {
  padding: 32px 0;
  border: 1px dashed #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
}

// 团队头像上传相关样式
.team-avatar-preview {
  display: flex;
  align-items: center;
  gap: 20px;

  .team-avatar-img {
    border: 2px solid #e5e7eb;
  }

  .avatar-upload-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .upload-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    background: transparent;
    color: #374151;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    width: fit-content;

    &:hover:not(.is-loading) {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #111827;
    }

    &.is-loading {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .file-input {
      display: none;
    }
  }
}

@media (max-width: 768px) {
  .workbench-team-view {
    padding: 16px 16px;
  }

  .members-table-header {
    grid-template-columns: 1fr 110px;
  }

  .member-row {
    grid-template-columns: 1fr 110px;
  }

  .col-actions {
    display: none;
  }
}

/* 覆盖 Tabs 样式以匹配设计 */
:deep(.n-tabs-nav-scroll-content) {
  border-bottom: 1px solid #e5e7eb;
}
:deep(.n-tabs-tab-wrapper .n-tabs-tab.n-tabs-tab--active) {
  color: #000;
  font-weight: 600;
}
:deep(.n-tabs-bar) {
  background-color: #000;
}
:deep(.n-tabs-tab) {
  padding-bottom: 12px;
}
</style>
