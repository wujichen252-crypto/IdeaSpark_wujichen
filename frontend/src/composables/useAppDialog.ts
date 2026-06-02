import type { DialogOptions } from 'naive-ui'

export function useAppDialog() {
  const dialog = useDialog()
  const message = useMessage()

  const confirm = (content: string, title = '提示') => {
    return new Promise<boolean>((resolve) => {
      dialog.warning({
        title,
        content,
        positiveText: '确定',
        negativeText: '取消',
        maskClosable: false,
        closable: false,
        class: 'app-confirm-dialog',
        style: 'border-radius: 16px;',
        onPositiveClick: () => resolve(true),
        onNegativeClick: () => resolve(false),
        onClose: () => resolve(false),
      } as DialogOptions)
    })
  }

  return {
    confirm,
    showSuccess: (content: string) => message.success(content),
    showError: (content: string) => message.error(content),
    showWarning: (content: string) => message.warning(content),
    showInfo: (content: string) => message.info(content),
  }
}
