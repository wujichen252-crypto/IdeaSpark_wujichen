<template>
  <div
    ref="editableRef"
    class="editable-text"
    :class="{ 'is-empty': isEmpty }"
    contenteditable="true"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
  ></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'

/**
 * 可编辑文本组件
 * 解决 contenteditable 与 v-model 的兼容性问题
 * 使用 innerText 直接处理纯文本，避免 HTML 解析问题
 */

interface Props {
  modelValue: string
  placeholder?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

const editableRef = ref<HTMLElement | null>(null)
let isUpdating = false

const isEmpty = computed(() => !props.modelValue || props.modelValue.trim() === '')

/**
 * 将纯文本内容设置到 contenteditable 元素中
 * 直接设置 innerText，让浏览器自动处理换行
 * @param content - 纯文本内容
 */
function setContent(content: string) {
  if (!editableRef.value || isUpdating) return
  const newText = content || ''
  // 只有当内容真正改变时才更新，避免光标跳动
  if (editableRef.value.innerText !== newText) {
    editableRef.value.innerText = newText
  }
}

/**
 * 获取 contenteditable 元素中的纯文本内容
 * 使用 innerText 直接获取，保留换行符
 * @returns 纯文本内容
 */
function getContent(): string {
  if (!editableRef.value) return ''
  return editableRef.value.innerText
}

/**
 * 处理输入事件
 */
function onInput() {
  if (isUpdating) return
  isUpdating = true
  const content = getContent()
  emit('update:modelValue', content)
  // 使用 setTimeout 重置标志，避免阻塞正常输入
  setTimeout(() => {
    isUpdating = false
  }, 0)
}

/**
 * 处理焦点事件
 */
function onFocus() {
  emit('focus')
}

/**
 * 处理失焦事件
 */
function onBlur() {
  emit('blur')
}

// 监听 modelValue 变化，更新DOM
watch(() => props.modelValue, (newValue) => {
  setContent(newValue || '')
})

// 组件挂载时设置初始内容
onMounted(() => {
  setContent(props.modelValue || '')
})
</script>

<style scoped>
.editable-text {
  width: 100%;
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
}

.editable-text.is-empty::before {
  content: attr(data-placeholder);
  color: var(--nexus-text-tertiary, #999);
  pointer-events: none;
}
</style>
