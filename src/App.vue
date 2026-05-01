<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSequencerStore } from './stores/sequencer'
import { TRACK_DEFINITIONS } from './audio/tracks'
import { installAudioBridge } from './audio/useAudio'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import TopBar from './components/TopBar.vue'
import TrackRow from './components/TrackRow.vue'
import PatternSidebar from './components/PatternSidebar.vue'
import Visualizer from './components/Visualizer.vue'
import HelpModal from './components/HelpModal.vue'

const store = useSequencerStore()
const helpOpen = ref(false)
const sidebarOpen = ref(false)
const topBarRef = ref<InstanceType<typeof TopBar> | null>(null)

onMounted(() => {
  store.init()
  installAudioBridge()
})

useKeyboardShortcuts({
  onSave: () => topBarRef.value?.openSave(),
  onHelp: () => (helpOpen.value = true),
})

const tracksWithDefs = computed(() =>
  TRACK_DEFINITIONS.map((def) => ({
    def,
    track: store.currentPattern.tracks.find((t) => t.id === def.id)!,
  })),
)
</script>

<template>
  <div class="flex h-full">
    <PatternSidebar :is-drawer-open="sidebarOpen" @close="sidebarOpen = false" />
    <!-- Sidebar backdrop on mobile -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-20 bg-black/60 lg:hidden"
      @click="sidebarOpen = false"
    />

    <div class="flex-1 flex flex-col min-w-0">
      <TopBar
        ref="topBarRef"
        @open-help="helpOpen = true"
        @open-sidebar="sidebarOpen = true"
      />

      <div class="flex-1 overflow-y-auto">
        <div class="px-4 pt-4 pb-2 text-[11px] font-mono text-dim flex">
          <div style="width: 232px" />
          <div class="flex gap-1">
            <template v-for="i in 16" :key="i">
              <div class="w-9 sm:w-10 text-center">
                {{ (i - 1) % 4 === 0 ? Math.floor((i - 1) / 4) + 1 : '' }}
              </div>
              <div v-if="i % 4 === 0 && i < 16" class="w-1" />
            </template>
          </div>
        </div>

        <section class="bg-panel/30 mx-4 rounded-lg border border-border overflow-hidden">
          <TrackRow
            v-for="row in tracksWithDefs"
            :key="row.def.id"
            :def="row.def"
            :track="row.track"
            :playhead-step="store.playheadStep"
            :is-playing="store.isPlaying"
            @toggle-step="(i: number) => store.toggleStep(row.def.id, i)"
            @toggle-mute="store.toggleMute(row.def.id)"
            @toggle-solo="store.toggleSolo(row.def.id)"
            @set-volume="(v: number) => store.setTrackVolume(row.def.id, v)"
            @set-pitch="(v: number) => store.setTrackPitch(row.def.id, v)"
            @reset-pitch="store.setTrackPitch(row.def.id, 0)"
            @clear="store.clearTrack(row.def.id)"
          />
        </section>

        <div class="m-4">
          <Visualizer />
        </div>
      </div>
    </div>

    <HelpModal :open="helpOpen" @close="helpOpen = false" />
  </div>
</template>
