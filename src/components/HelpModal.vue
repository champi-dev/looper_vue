<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const shortcuts: Array<{ keys: string; action: string }> = [
  { keys: 'Space', action: 'Play / Stop' },
  { keys: '1 – 8', action: 'Toggle mute on track 1–8' },
  { keys: 'Shift + 1 – 8', action: 'Toggle solo on track 1–8' },
  { keys: 'C', action: 'Clear current pattern' },
  { keys: 'Ctrl/⌘ + S', action: 'Save pattern' },
  { keys: 'Ctrl/⌘ + N', action: 'New pattern' },
  { keys: '?', action: 'Open this help' },
]
</script>

<template>
  <transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
      @click.self="emit('close')"
    >
      <div class="bg-panel border border-border rounded-lg p-6 w-full max-w-md shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display text-xl font-bold">Keyboard shortcuts</h2>
          <button class="p-1 rounded hover:bg-elevated" aria-label="Close" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>
        <table class="w-full text-sm">
          <tbody>
            <tr v-for="s in shortcuts" :key="s.keys" class="border-b border-border/50 last:border-0">
              <td class="py-2 pr-4">
                <kbd class="bg-elevated border border-border rounded px-2 py-0.5 text-xs font-mono">{{ s.keys }}</kbd>
              </td>
              <td class="py-2 text-secondary">{{ s.action }}</td>
            </tr>
          </tbody>
        </table>
        <div class="mt-6 text-xs text-dim">
          StepLab — a browser step sequencer built with Vue 3, Tone.js, and Tailwind. MIT-licensed; samples generated programmatically.
        </div>
      </div>
    </div>
  </transition>
</template>
