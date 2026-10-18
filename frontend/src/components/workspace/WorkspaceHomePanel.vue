<template>
  <div class="panel home-panel">
    <div
      class="home-hero"
      :style="{ backgroundImage: project.cover ? `url(${project.cover})` : '' }"
    >
      <div class="home-hero-overlay"></div>
      <div class="home-hero-content">
        <div class="home-hero-title">{{ project.name || '未命名项目' }}</div>
        <div class="home-hero-subtitle">{{ project.description || '暂无一句话介绍...' }}</div>
        <div class="home-hero-meta">
          <div class="meta-item">
            <n-icon><TimeOutline /></n-icon>
            <span>更新于 {{ ws.formatDateTime(project.updatedAt) }}</span>
          </div>
          <div class="meta-item">
            <n-icon><PeopleOutline /></n-icon>
            <span>成员 {{ ws.projectMembers.value.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <n-grid
:cols="24"
:x-gap="16"
:y-gap="16"
class="home-grid">
      <n-grid-item :span="24" :md-span="16">
        <n-card size="small" class="section-card" title="项目信息">
          <n-form
v-if="ws.isHomeEditing.value"
:model="ws.homeForm"
label-placement="left"
label-width="90">
            <n-form-item label="项目名称" path="name">
              <n-input v-model:value="ws.homeForm.name" placeholder="请输入项目名称" />
            </n-form-item>
            <n-form-item label="项目简介" path="description">
              <n-input
                v-model:value="ws.homeForm.description"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 6 }"
                placeholder="请输入项目简介"
              />
            </n-form-item>
            <n-form-item label="项目分类" path="category">
              <n-input v-model:value="ws.homeForm.category" placeholder="例如：SaaS 产品 / APP / 文档" />
            </n-form-item>
            <n-form-item label="封面地址" path="cover">
              <n-upload
                accept="image/*"
                :show-file-list="false"
                :custom-request="ws.handleUploadCover"
              >
                <div class="cover-upload-trigger" :class="{ 'has-cover': ws.homeForm.cover }">
                  <template v-if="ws.homeForm.cover">
                    <img :src="ws.homeForm.cover" alt="封面预览" />
                    <div class="cover-upload-overlay">
                      <n-button size="small" type="primary">更换图片</n-button>
                      <n-button
size="small"
type="error"
ghost
@click.stop="ws.homeForm.cover = ''">移除</n-button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="cover-upload-placeholder">
                      <n-icon size="28"><ImageOutline /></n-icon>
                      <span>点击上传封面图片</span>
                    </div>
                  </template>
                </div>
              </n-upload>
            </n-form-item>
            <n-form-item label="标签" path="tagsText">
              <n-input v-model:value="ws.homeForm.tagsText" placeholder="用逗号分隔，例如：AI,教育,SaaS" />
            </n-form-item>
            <n-form-item label="关键要素" path="techStackText">
              <n-input v-model:value="ws.homeForm.techStackText" placeholder="用逗号分隔，例如：需求分析,用户旅程" />
            </n-form-item>
            <n-form-item label="可见性" path="visibility">
              <n-select v-model:value="ws.homeForm.visibility" :options="ws.visibilityOptions" />
            </n-form-item>
            <n-form-item label="允许 Fork" path="allowFork">
              <n-switch v-model:value="ws.homeForm.allowFork" />
            </n-form-item>
          </n-form>

          <div v-else class="info-readonly">
            <div class="info-row">
              <div class="label">项目名称</div>
              <div class="value">{{ project.name || '-' }}</div>
            </div>
            <div class="info-row">
              <div class="label">项目简介</div>
              <div class="value">{{ project.description || '-' }}</div>
            </div>
            <div class="info-row">
              <div class="label">项目分类</div>
              <div class="value">{{ project.category || '-' }}</div>
            </div>
            <div class="info-row">
              <div class="label">标签</div>
              <div class="value">
                <n-space v-if="(project.tags || []).length" size="small">
                  <n-tag
v-for="t in project.tags"
:key="t"
size="small"
round
:bordered="false">
                    {{ t }}
                  </n-tag>
                </n-space>
                <span v-else>-</span>
              </div>
            </div>
            <div class="info-row">
              <div class="label">关键要素</div>
              <div class="value">
                <n-space v-if="(project.techStack || []).length" size="small">
                  <n-tag
v-for="t in project.techStack"
:key="t"
size="small"
round
:bordered="false"
type="success">
                    {{ t }}
                  </n-tag>
                </n-space>
                <span v-else>-</span>
              </div>
            </div>
          </div>
        </n-card>

        <n-card size="small" class="section-card mt-16" title="文件概览">
          <div class="stats-row">
            <n-card size="small" class="stat-card" :bordered="false">
              <div class="stat-value">{{ ws.fileStats.value.total }}</div>
              <div class="stat-label">文件总数</div>
            </n-card>
            <n-card size="small" class="stat-card" :bordered="false">
              <div class="stat-value">{{ ws.fileStats.value.document }}</div>
              <div class="stat-label">文档</div>
            </n-card>
            <n-card size="small" class="stat-card" :bordered="false">
              <div class="stat-value">{{ ws.fileStats.value.sheet }}</div>
              <div class="stat-label">表格</div>
            </n-card>
            <n-card size="small" class="stat-card" :bordered="false">
              <div class="stat-value">{{ ws.fileStats.value.slide }}</div>
              <div class="stat-label">演示</div>
            </n-card>
          </div>

          <div class="file-header">
            <div class="file-title">最近文件</div>
            <n-button text type="primary" @click="ws.activeMenuKey.value = 'files'">查看全部</n-button>
          </div>

          <n-empty v-if="ws.recentFiles.value.length === 0" description="暂无文件记录" size="small" />
          <n-list v-else hoverable clickable>
            <n-list-item
v-for="f in ws.recentFiles.value"
:key="f.id"
class="file-row"
@click="ws.openFile(f)">
              <template #prefix>
                <div class="file-badge" :class="`file-${f.type}`"></div>
              </template>
              <div class="file-item">
                <div class="file-name">{{ f.name }}</div>
                <div class="file-meta">{{ ws.formatDateTime(f.updatedAt) }}</div>
              </div>
              <template #suffix>
                <div class="file-suffix" @click.stop>
                  <n-tag
                    size="small"
                    round
                    :bordered="false"
                    :type="ws.fileTypeTagType(f.type)"
                  >
                    {{ ws.fileTypeLabel(f.type) }}
                  </n-tag>
                  <n-button
                    class="file-delete-btn"
                    size="tiny"
                    text
                    type="default"
                    @click.stop="ws.handleDeleteFile(f)"
                  >
                    <template #icon>
                      <n-icon size="16"><TrashOutline /></n-icon>
                    </template>
                  </n-button>
                </div>
              </template>
            </n-list-item>
          </n-list>
        </n-card>
      </n-grid-item>

      <n-grid-item :span="24" :md-span="8">
        <n-card size="small" class="section-card" title="快捷入口">
          <n-space vertical size="small">
            <n-button secondary @click="ws.activeMenuKey.value = 'plugins'">打开项目插件</n-button>
            <n-button secondary @click="ws.activeMenuKey.value = 'settings'">打开项目设置</n-button>
            <n-button secondary @click="ws.activeMenuKey.value = 'members'">查看成员管理</n-button>
          </n-space>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import {
  NGrid,
  NGridItem,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NUpload,
  NButton,
  NSpace,
  NTag,
  NList,
  NListItem,
  NEmpty,
  NIcon,
  NSwitch,
  NSelect
} from 'naive-ui'
import {
  TimeOutline,
  PeopleOutline,
  ImageOutline,
  TrashOutline
} from '@vicons/ionicons5'
import { computed } from 'vue'
import { useProjectWorkspaceContext } from '@/composables/useProjectWorkspace'

const ws = useProjectWorkspaceContext()
// 本面板仅在父级确认 project 存在时才挂载，故此处断言非空
const project = computed(() => ws.project.value!)
</script>
