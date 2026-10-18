import { ref, computed, watch, type Ref } from 'vue'

/**
 * 幻灯片（纯文本分块）编辑器逻辑：把全文按分隔符拆成多页并支持增删。
 * 与文件编辑器共享 `content` 引用。
 */
export function useSlidesEditor(content: Ref<string>, scheduleAutoSave: () => void) {
  const activeSlideIndex = ref(0)

  const slideBlocks = computed(() => parseSlideBlocks(content.value))

  const activeSlideContent = computed({
    get() {
      return slideBlocks.value[activeSlideIndex.value] ?? ''
    },
    set(val: string) {
      content.value = updateSlideBlock(content.value, activeSlideIndex.value, val)
    }
  })

  watch(
    () => slideBlocks.value.length,
    (len) => {
      if (len <= 0) {
        activeSlideIndex.value = 0
        return
      }
      if (activeSlideIndex.value > len - 1) activeSlideIndex.value = Math.max(0, len - 1)
    },
    { immediate: true }
  )

  function addSlide() {
    const blocks = parseSlideBlocks(content.value)
    blocks.push('')
    content.value = blocks.join('\n\n---\n\n') + '\n'
    activeSlideIndex.value = blocks.length - 1
    scheduleAutoSave()
  }

  function removeSlide() {
    const blocks = parseSlideBlocks(content.value)
    if (blocks.length <= 1) return
    const safeIndex = Math.min(Math.max(activeSlideIndex.value, 0), blocks.length - 1)
    blocks.splice(safeIndex, 1)
    content.value = blocks.join('\n\n---\n\n') + '\n'
    activeSlideIndex.value = Math.min(safeIndex, blocks.length - 1)
    scheduleAutoSave()
  }

  function handleSlideInput() {
    scheduleAutoSave()
  }

  function parseSlideBlocks(text: string) {
    const normalized = (text || '').replace(/\r\n/g, '\n').trim()
    if (!normalized) return ['']
    const byDelimiter = normalized.split(/\n\s*---+\s*\n/g).map((b) => b.trim()).filter(Boolean)
    if (byDelimiter.length > 1) return byDelimiter

    const byBlankLines = normalized.split(/\n\s*\n+/g).map((b) => b.trim()).filter(Boolean)
    if (byBlankLines.length > 1) return byBlankLines

    const lines = normalized.split('\n').map((l) => l.trimEnd())
    const firstNonEmptyIndex = lines.findIndex((l) => l.trim().length > 0)
    if (firstNonEmptyIndex === -1) return ['']

    const titleLine = lines[firstNonEmptyIndex] || ''
    const restLines = lines.slice(firstNonEmptyIndex + 1)
    const items: string[] = []
    for (const ln of restLines) {
      const m = ln.match(/^\s*\d+\s*[.)、]\s*(.+?)\s*$/)
      if (!m) continue
      items.push((m[1] || '').trim())
    }

    if (items.length > 0) {
      const title = titleLine.trim() ? [titleLine.trim()] : []
      return [...(title.length ? [title.join('\n')] : []), ...items]
    }

    return [normalized]
  }

  function updateSlideBlock(fullText: string, index: number, nextBlock: string) {
    const blocks = parseSlideBlocks(fullText)
    const safeIndex = Math.min(Math.max(index, 0), blocks.length - 1)
    blocks[safeIndex] = (nextBlock || '').trim()
    return blocks.join('\n\n---\n\n') + '\n'
  }

  function slideSummary(block: string) {
    const firstLine = (block || '').split('\n')[0] || ''
    return firstLine.slice(0, 24)
  }

  return {
    activeSlideIndex,
    slideBlocks,
    activeSlideContent,
    addSlide,
    removeSlide,
    handleSlideInput,
    parseSlideBlocks,
    updateSlideBlock,
    slideSummary
  }
}
