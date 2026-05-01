<script setup lang="ts">
import { ref } from 'vue'
import { Plus, MoreVertical, X } from 'lucide-vue-next'
import { useSequencerStore } from '../stores/sequencer'
import { TRACK_DEFINITIONS } from '../audio/tracks'

const store = useSequencerStore()

defineProps<{
  isDrawerOpen: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const menuOpenFor = ref<string | null>(null)
const renamingId = ref<string | null>(null)
const renameValue = ref('')

function startRename(id: string, current: string) {
  renamingId.value = id
  renameValue.value = current
  menuOpenFor.value = null
}
function commitRename() {
  if (renamingId.value) store.renamePattern(renamingId.value, renameValue.value)
  renamingId.value = null
}

function activeTrackColor(patternId: string): string {
  const p = store.patterns.find((x) => x.id === patternId)
  if (!p) return '#5a5a70'
  const firstActive = p.tracks.find((t) => t.steps.some((s) => s))
  if (!firstActive) return '#5a5a70'
  return TRACK_DEFINITIONS.find((d) => d.id === firstActive.id)?.color ?? '#5a5a70'
}

function onConfirmDelete(id: string, name: string) {
  if (confirm(`Delete pattern "${name}"?`)) {
    store.deletePattern(id)
    menuOpenFor.value = null
  }
}
</script>

<template>
  <aside
    class="bg-panel border-r border-border flex flex-col w-64 shrink-0 transition-transform"
    :class="[
      'lg:translate-x-0 lg:static lg:flex',
      isDrawerOpen ? 'translate-x-0 fixed inset-y-0 left-0 z-30 shadow-2xl' : '-translate-x-full fixed inset-y-0 left-0 z-30 lg:translate-x-0',
    ]"
  >
    <div class="flex items-center justify-between p-3 border-b border-border">
      <h2 class="font-display font-bold text-sm uppercase tracking-wider text-secondary">Patterns</h2>
      <button class="lg:hidden p-1 rounded hover:bg-elevated" @click="emit('close')">
        <X :size="16" />
      </button>
    </div>
    <button
      class="m-3 flex items-center gap-2 justify-center px-3 py-2 rounded bg-elevated hover:bg-border transition font-medium"
      @click="store.newPattern()"
    >
      <Plus :size="16" />
      New Pattern
    </button>
    <div class="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
      <div
        v-for="p in store.patterns"
        :key="p.id"
        class="group relative rounded-md transition cursor-pointer"
        :class="p.id === store.currentPatternId ? 'bg-elevated ring-1 ring-accent/50' : 'hover:bg-elevated/60'"
        @click="store.loadPattern(p.id)"
      >
        <div class="flex items-center gap-2 p-2.5 pr-8">
          <span class="h-2.5 w-2.5 rounded-full shrink-0" :style="{ backgroundColor: activeTrackColor(p.id) }" />
          <div class="flex-1 min-w-0">
            <input
              v-if="renamingId === p.id"
              v-model="renameValue"
              type="text"
              class="w-full bg-base px-1 py-0.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              autofocus
              @click.stop
              @blur="commitRename"
              @keyup.enter="commitRename"
              @keyup.esc="renamingId = null"
            />
            <div v-else class="text-sm font-medium truncate">{{ p.name }}</div>
            <div class="text-[10px] text-dim">{{ p.bpm }} BPM</div>
          </div>
        </div>
        <button
          class="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-border transition-opacity"
          aria-label="Pattern options"
          @click.stop="menuOpenFor = menuOpenFor === p.id ? null : p.id"
        >
          <MoreVertical :size="14" />
        </button>
        <div
          v-if="menuOpenFor === p.id"
          class="absolute top-8 right-1 z-20 bg-base border border-border rounded shadow-xl py-1 w-32"
          @click.stop
        >
          <button class="block w-full text-left px-3 py-1.5 hover:bg-elevated text-sm" @click="startRename(p.id, p.name)">Rename</button>
          <button class="block w-full text-left px-3 py-1.5 hover:bg-elevated text-sm" @click="store.duplicatePattern(p.id); menuOpenFor = null">Duplicate</button>
          <button class="block w-full text-left px-3 py-1.5 hover:bg-elevated text-sm text-accent" @click="onConfirmDelete(p.id, p.name)">Delete</button>
        </div>
      </div>
    </div>
  </aside>
</template>
