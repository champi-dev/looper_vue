<script setup lang="ts">
import type { TrackDefinition, TrackState } from '../types'
import StepCell from './StepCell.vue'
import TrackControls from './TrackControls.vue'

defineProps<{
  def: TrackDefinition
  track: TrackState
  playheadStep: number
  isPlaying: boolean
}>()

const emit = defineEmits<{
  toggleStep: [stepIndex: number]
  toggleMute: []
  toggleSolo: []
  setVolume: [dB: number]
  setPitch: [semis: number]
  resetPitch: []
  clear: []
}>()
</script>

<template>
  <div
    class="grid items-center gap-2 px-3 py-2 border-b border-border/60 hover:bg-panel/40 transition-colors"
    style="grid-template-columns: minmax(220px, 240px) 1fr"
  >
    <TrackControls
      :def="def"
      :track="track"
      @toggle-mute="emit('toggleMute')"
      @toggle-solo="emit('toggleSolo')"
      @set-volume="(v: number) => emit('setVolume', v)"
      @set-pitch="(v: number) => emit('setPitch', v)"
      @reset-pitch="emit('resetPitch')"
      @clear="emit('clear')"
    />

    <div class="flex gap-1 overflow-x-auto pb-1">
      <template v-for="(on, i) in track.steps" :key="i">
        <StepCell
          :active="on"
          :playing="isPlaying && i === playheadStep"
          :color="def.color"
          :index="i"
          @toggle="emit('toggleStep', i)"
        />
        <div v-if="(i + 1) % 4 === 0 && i < 15" class="w-1 shrink-0" />
      </template>
    </div>
  </div>
</template>
