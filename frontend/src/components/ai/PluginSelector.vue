<template>
  <div class="plugin-selector">
    <div class="selector-header">
      <h4>插件选择</h4>
      <div class="controls">
        <n-space>
          <n-select 
            v-model:value="activeCategoryInternal" 
            :options="categoryOptions" 
            size="small" 
            style="width: 140px" 
          />
          <n-dropdown :options="comboOptions" @select="handleApplyCombo">
            <n-button size="small" secondary>推荐组合</n-button>
          </n-dropdown>
          <n-button size="small" tertiary @click="clearSelectionInternal">清空选择</n-button>
        </n-space>
      </div>
    </div>

    <div v-if="selectedInternal.length" class="selected-area">
      <div class="selected-title">已选插件</div>
      <div class="selected-list">
        <div v-for="id in selectedInternal" :key="id" class="chip">
          <span class="chip-name">{{ nameById(id) }}</span>
          <div class="chip-actions">
            <n-button text size="tiny" @click="moveUpInternal(id)">上移</n-button>
            <n-button text size="tiny" @click="moveDownInternal(id)">下移</n-button>
            <n-button
text
size="tiny"
type="error"
@click="toggleInternal(id)">
移除
</n-button>
          </div>
        </div>
      </div>
    </div>

    <div class="plugin-grid">
      <n-card 
        v-for="p in filteredPlugins" 
        :key="p.id" 
        class="plugin-card" 
        :class="{ active: selectedInternal.includes(p.id) }"
        :title="p.name"
        hoverable
        @click="toggleInternal(p.id)"
      >
        <div class="plugin-meta">
          <n-tag size="small" type="info" round>{{ p.category }}</n-tag>
        </div>
        <p class="desc">{{ p.description }}</p>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { usePluginCatalog } from '@/composables/usePluginCatalog'

const props = defineProps<{
  modelValue: string[]
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const {
  categories,
  activeCategory,
  filteredPlugins,
  selected,
  recommendedCombos,
  togglePlugin,
  applyCombo,
  moveUp,
  moveDown,
  clearSelection,
  allPlugins
} = usePluginCatalog()

// 与父组件双向绑定
const selectedInternal = ref<string[]>(props.modelValue || [])
watch(() => props.modelValue, (val) => {
  selectedInternal.value = val || []
})
watch(selectedInternal, (val) => emit('update:modelValue', val))

// 同步 catalog 内部状态
watch(selectedInternal, (val) => {
  selected.value = [...val]
}, { immediate: true })

const activeCategoryInternal = ref(activeCategory.value)
watch(activeCategoryInternal, (val) => activeCategory.value = val)

const categoryOptions = computed(() => categories.value.map(c => ({ label: c, value: c })))
const comboOptions = computed(() => recommendedCombos.value.map(c => ({ label: c.name, key: c.id })))

/**
 * 应用推荐组合
 * @param key 组合ID
 */
function handleApplyCombo(key: string) {
  applyCombo(key)
  selectedInternal.value = [...selected.value]
}

/**
 * 切换选择状态
 * @param id 插件ID
 */
function toggleInternal(id: string) {
  togglePlugin(id)
  selectedInternal.value = [...selected.value]
}

/**
 * 上移选择顺序
 * @param id 插件ID
 */
function moveUpInternal(id: string) {
  moveUp(id)
  selectedInternal.value = [...selected.value]
}

/**
 * 下移选择顺序
 * @param id 插件ID
 */
function moveDownInternal(id: string) {
  moveDown(id)
  selectedInternal.value = [...selected.value]
}

/**
 * 清空选择
 */
function clearSelectionInternal() {
  clearSelection()
  selectedInternal.value = []
}

/**
 * 根据ID获取插件名称
 * @param id 插件ID
 */
function nameById(id: string) {
  return allPlugins.value.find(p => p.id === id)?.name || id
}
</script>

<style scoped lang="scss">
.plugin-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  h4 { margin: 0; }
}

.selected-area {
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
  
  .selected-title {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 8px;
  }
  
  .selected-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    
    .chip-name {
      font-size: 12px;
      color: #374151;
    }
    
    .chip-actions {
      display: flex;
      gap: 4px;
    }
  }
}

.plugin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.plugin-card {
  cursor: pointer;
  transition: all .2s ease;
  
  &.active {
    border-color: #18a058;
    box-shadow: 0 0 0 2px rgba(24,160,88,.15);
  }
  
  .plugin-meta {
    margin-bottom: 8px;
  }
  
  .desc {
    color: #6b7280;
    font-size: 13px;
    margin: 0;
    min-height: 40px;
  }
}
</style>
