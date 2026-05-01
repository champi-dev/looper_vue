import { onBeforeUnmount, onMounted } from 'vue'
import { useSequencerStore } from '../stores/sequencer'
import { TRACK_DEFINITIONS } from '../audio/tracks'
import { playToggle } from '../audio/useAudio'

interface Handlers {
  onSave: () => void
  onHelp: () => void
}

export function useKeyboardShortcuts(handlers: Handlers) {
  const store = useSequencerStore()

  function handler(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null
    const tag = target?.tagName ?? ''
    if (target?.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      return
    }

    // Ctrl/Cmd combos
    if (e.ctrlKey || e.metaKey) {
      const k = e.key.toLowerCase()
      if (k === 's') {
        e.preventDefault()
        handlers.onSave()
        return
      }
      if (k === 'n') {
        e.preventDefault()
        store.newPattern()
        return
      }
      return
    }

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault()
      playToggle()
      return
    }

    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault()
      handlers.onHelp()
      return
    }

    if (!e.shiftKey && e.key.toLowerCase() === 'c') {
      if (confirm('Clear all steps in this pattern?')) store.clearPattern()
      return
    }

    // 1-8 / Shift+1-8 — mute / solo
    const digit = parseInt(e.key, 10)
    if (!Number.isNaN(digit) && digit >= 1 && digit <= 8) {
      const trackId = TRACK_DEFINITIONS[digit - 1]!.id
      if (e.shiftKey) store.toggleSolo(trackId)
      else store.toggleMute(trackId)
      e.preventDefault()
    }
  }

  onMounted(() => window.addEventListener('keydown', handler))
  onBeforeUnmount(() => window.removeEventListener('keydown', handler))
}
