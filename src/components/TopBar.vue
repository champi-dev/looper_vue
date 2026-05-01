<script setup lang="ts">
import { ref } from 'vue'
import { Play, Square, Save, HelpCircle, Menu } from 'lucide-vue-next'
import { useSequencerStore } from '../stores/sequencer'
import { playToggle } from '../audio/useAudio'

const store = useSequencerStore()

const emit = defineEmits<{
  openHelp: []
  openSidebar: []
}>()

const showSaveDialog = ref(false)
const saveName = ref('')

function openSave() {
  saveName.value = store.currentPattern.name
  showSaveDialog.value = true
}
function confirmSave() {
  store.savePatternAs(saveName.value)
  showSaveDialog.value = false
}
function cancelSave() {
  showSaveDialog.value = false
}

function bumpBpm(delta: number) {
  store.setBpm(store.currentPattern.bpm + delta)
}

defineExpose({ openSave })
</script>

<template>
  <header class="flex items-center gap-3 sm:gap-4 px-4 py-3 border-b border-border bg-panel/80 backdrop-blur sticky top-0 z-20">
    <button
      class="lg:hidden p-2 rounded hover:bg-elevated"
      aria-label="Open patterns"
      @click="emit('openSidebar')"
    >
      <Menu :size="18" />
    </button>

    <div class="font-display font-bold text-2xl tracking-tight select-none">
      <span class="text-primary">Step</span><span class="text-accent">Lab</span>
    </div>

    <div class="flex-1" />

    <div class="flex items-center gap-1.5 bg-elevated rounded px-2 py-1">
      <span class="text-[10px] uppercase text-dim font-semibold tracking-wide">BPM</span>
      <button class="text-secondary hover:text-primary px-1" aria-label="Decrease BPM" @click="bumpBpm(-1)">−</button>
      <input
        type="number"
        min="60"
        max="200"
        :value="store.currentPattern.bpm"
        class="w-14 bg-transparent text-center font-display font-bold text-lg tabular-nums focus:outline-none"
        @input="(e) => store.setBpm(+(e.target as HTMLInputElement).value)"
      />
      <button class="text-secondary hover:text-primary px-1" aria-label="Increase BPM" @click="bumpBpm(1)">+</button>
    </div>

    <label class="hidden sm:flex items-center gap-2 bg-elevated rounded px-3 py-1.5">
      <span class="text-[10px] uppercase text-dim font-semibold tracking-wide">Swing</span>
      <input
        type="range"
        min="0"
        max="0.5"
        step="0.01"
        :value="store.currentPattern.swing"
        class="w-20"
        @input="(e) => store.setSwing(+(e.target as HTMLInputElement).value)"
      />
      <span class="text-xs text-secondary tabular-nums w-8">{{ Math.round(store.currentPattern.swing * 100) }}%</span>
    </label>

    <button
      type="button"
      class="flex items-center gap-2 px-4 py-2 rounded-md font-bold transition-all"
      :class="store.isPlaying ? 'bg-accent text-base shadow-[0_0_24px_-4px_#ff5b3a]' : 'bg-elevated hover:bg-border text-primary'"
      :aria-label="store.isPlaying ? 'Stop' : 'Play'"
      @click="playToggle"
    >
      <component :is="store.isPlaying ? Square : Play" :size="16" :fill="'currentColor'" />
      <span class="hidden sm:inline">{{ store.isPlaying ? 'Stop' : 'Play' }}</span>
    </button>

    <button
      type="button"
      class="flex items-center gap-2 px-3 py-2 rounded-md bg-elevated hover:bg-border transition"
      title="Save pattern"
      aria-label="Save pattern"
      @click="openSave"
    >
      <Save :size="16" />
      <span class="hidden sm:inline text-sm">Save</span>
    </button>

    <button
      type="button"
      class="p-2 rounded-md hover:bg-elevated transition"
      title="Keyboard shortcuts (?)"
      aria-label="Help"
      @click="emit('openHelp')"
    >
      <HelpCircle :size="18" />
    </button>

    <!-- Save dialog -->
    <div
      v-if="showSaveDialog"
      class="fixed inset-0 z-30 bg-black/60 flex items-center justify-center p-4"
      @click.self="cancelSave"
    >
      <div class="bg-panel border border-border rounded-lg p-6 w-full max-w-sm shadow-xl">
        <h2 class="font-display text-xl font-bold mb-4">Save pattern</h2>
        <input
          v-model="saveName"
          type="text"
          class="w-full bg-elevated rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Pattern name"
          @keyup.enter="confirmSave"
        />
        <div class="flex gap-2 justify-end">
          <button class="px-3 py-1.5 rounded text-secondary hover:text-primary" @click="cancelSave">Cancel</button>
          <button class="px-4 py-1.5 rounded bg-accent text-base font-semibold" @click="confirmSave">Save</button>
        </div>
      </div>
    </div>
  </header>
</template>
