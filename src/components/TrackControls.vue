<script setup lang="ts">
import { computed } from 'vue'
import type { TrackDefinition, TrackState } from '../types'

const props = defineProps<{
  def: TrackDefinition
  track: TrackState
}>()

const emit = defineEmits<{
  toggleMute: []
  toggleSolo: []
  setVolume: [number]
  setPitch: [number]
  resetPitch: []
  clear: []
}>()

const pitchRotation = computed(() => (props.track.pitch / 12) * 135)
</script>

<template>
  <div class="flex items-center gap-2 w-full">
    <div class="flex flex-col flex-1 min-w-0">
      <div class="flex items-center gap-1.5">
        <span
          class="h-2 w-2 rounded-full shrink-0"
          :style="{ backgroundColor: def.color }"
        />
        <span class="font-semibold text-sm truncate">{{ def.name }}</span>
      </div>
      <div class="text-[10px] text-dim uppercase tracking-wide">
        {{ def.kind }}
      </div>
    </div>

    <button
      type="button"
      class="w-6 h-6 rounded text-[10px] font-bold transition"
      :class="track.muted ? 'bg-accent text-base' : 'bg-elevated text-secondary hover:text-primary'"
      :aria-pressed="track.muted"
      title="Mute"
      @click="emit('toggleMute')"
    >M</button>
    <button
      type="button"
      class="w-6 h-6 rounded text-[10px] font-bold transition"
      :class="track.solo ? 'bg-yellow-400 text-base' : 'bg-elevated text-secondary hover:text-primary'"
      :aria-pressed="track.solo"
      title="Solo"
      @click="emit('toggleSolo')"
    >S</button>

    <div class="flex flex-col items-center gap-0.5">
      <input
        type="range"
        min="-40"
        max="0"
        step="1"
        :value="track.volume"
        class="w-14 h-1 accent-current"
        :title="`Volume ${track.volume} dB`"
        :aria-label="`${def.name} volume`"
        @input="(e) => emit('setVolume', +(e.target as HTMLInputElement).value)"
      />
      <span class="text-[9px] text-dim tabular-nums">{{ track.volume }}dB</span>
    </div>

    <div class="flex flex-col items-center gap-0.5">
      <button
        type="button"
        class="pitch-knob w-7 h-7 rounded-full border-2 border-border bg-elevated relative"
        :title="`Pitch ${track.pitch > 0 ? '+' : ''}${track.pitch} st (dbl-click to reset)`"
        :aria-label="`${def.name} pitch ${track.pitch} semitones`"
        @dblclick="emit('resetPitch')"
        @wheel.prevent="(e: WheelEvent) => emit('setPitch', track.pitch + (e.deltaY < 0 ? 1 : -1))"
        @click="(e: MouseEvent) => emit('setPitch', track.pitch + (e.shiftKey ? -1 : 1))"
      >
        <span
          class="absolute left-1/2 top-1 w-0.5 h-2.5 -translate-x-1/2 origin-bottom rounded"
          :style="{
            backgroundColor: def.color,
            transform: `translateX(-50%) rotate(${pitchRotation}deg)`,
            transformOrigin: '50% 100%',
            transition: 'transform 80ms ease-out',
          }"
        />
      </button>
      <span class="text-[9px] text-dim tabular-nums">{{ track.pitch > 0 ? '+' : '' }}{{ track.pitch }}st</span>
    </div>
  </div>
</template>
