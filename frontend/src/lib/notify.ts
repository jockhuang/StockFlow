import { reactive } from 'vue'

type ToastLevel = 'error' | 'success' | 'info'

export type ToastItem = {
  id: number
  message: string
  level: ToastLevel
}

const state = reactive<{
  items: ToastItem[]
  nextId: number
}>({
  items: [],
  nextId: 1,
})

function push(message: string, level: ToastLevel) {
  const id = state.nextId++
  state.items.push({ id, message, level })
  window.setTimeout(() => remove(id), 4000)
}

export function notifyError(message: string) {
  push(message, 'error')
}

export function notifySuccess(message: string) {
  push(message, 'success')
}

export function notifyInfo(message: string) {
  push(message, 'info')
}

export function remove(id: number) {
  const index = state.items.findIndex((item) => item.id === id)
  if (index >= 0) {
    state.items.splice(index, 1)
  }
}

export const notificationState = state
