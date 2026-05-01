import type { PersistedState } from '../types'
import { STORAGE_KEY } from '../types'

export function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed.version !== 1) {
      console.warn('[steplab] persisted state version mismatch — resetting')
      return null
    }
    return parsed
  } catch (err) {
    console.warn('[steplab] failed to read persisted state — resetting', err)
    return null
  }
}

export function savePersisted(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.warn('[steplab] failed to persist state', err)
  }
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let handle: ReturnType<typeof setTimeout> | null = null
  return ((...args: Parameters<T>) => {
    if (handle !== null) clearTimeout(handle)
    handle = setTimeout(() => fn(...args), ms)
  }) as T
}
