/**
 * 嵌入编辑器公共工具
 * @description 比较两个资产负载是否为相同 JSON。
 * 用于阻断"编辑器 emit → 壳组件 markDirty 写回 payload → 再次 setData"的回环：
 * 当回写值与编辑器当前数据一致时跳过 setData，避免无谓重渲染与事件风暴。
 */
export function isSamePayload(
  a: unknown,
  b: unknown
): boolean {
  if (a === b) return true
  if (a == null || b == null) return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}
