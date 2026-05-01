<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  active: boolean
  playing: boolean
  color: string
  index: number
}>()

const emit = defineEmits<{ toggle: [] }>()

const isBeatStart = computed(() => props.index % 4 === 0)
</script>

<template>
  <button
    type="button"
    class="step-cell relative h-9 w-9 sm:h-10 sm:w-10 rounded-md border transition-all duration-[80ms] ease-out"
    :class="[
      active ? 'shadow-[0_0_18px_-2px] scale-100' : 'hover:bg-elevated/60',
      isBeatStart ? 'border-border/80' : 'border-border/40',
      playing ? 'ring-2 ring-white/80 scale-105' : '',
    ]"
    :style="{
      backgroundColor: active ? color : 'transparent',
      boxShadow: active ? `0 0 18px -2px ${color}80` : 'none',
    }"
    :aria-pressed="active"
    :aria-label="`Step ${index + 1}, ${active ? 'on' : 'off'}`"
    @click="emit('toggle')"
  />
</template>

<style scoped>
.step-cell {
  background-color: rgba(28, 28, 40, 0.6);
}
</style>
