import { reactive, watch, toRefs } from 'vue'
import type { ToRefs } from 'vue'
import { storeToRefs } from 'pinia'
import { useAiWorkshopStore, type ProjectModule } from '@/store/modules/aiWorkshop'

export function useAiModuleData<T extends Record<string, unknown>>(
  moduleKey: ProjectModule,
  defaultData: T
): ToRefs<T> {
  const store = useAiWorkshopStore()
  const { modules } = storeToRefs(store)
  
  // Initialize data: merge defaults with saved data
  const savedData = modules.value[moduleKey].data || {}
  
  // Create reactive object with defaults + saved data
  const formData = reactive({ ...defaultData, ...(savedData as Partial<T>) }) as T

  // Watch for changes and update store
  // Since it's in-memory sync, we don't strictly need debounce, 
  // but if we add API calls later, we should add it here.
  watch(formData, (newValue) => {
    store.updateModuleData(moduleKey, { ...(newValue as Record<string, unknown>) })
  }, { deep: true })

  return toRefs(formData)
}
