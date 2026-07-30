<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <div v-if="themeStore.backgroundUrl" class="background-layer">
    <video
      v-if="themeStore.backgroundType === 'video'"
      :src="themeStore.backgroundUrl"
      autoplay
      loop
      muted
      playsinline
      class="background-media"
    />
    <img
      v-else
      :src="themeStore.backgroundUrl"
      class="background-media"
      alt=""
    />
    <div
      class="background-overlay"
      :style="{ opacity: themeStore.overlayOpacity / 100 }"
    />
  </div>
</template>

<style scoped>
.background-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.background-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.background-overlay {
  position: absolute;
  inset: 0;
  background: var(--bg-primary);
  pointer-events: none;
}
</style>
