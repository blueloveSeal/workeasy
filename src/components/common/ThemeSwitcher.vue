<script setup lang="ts">
import { Sunny, Moon } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <el-button
    circle
    :icon="themeStore.mode === 'light' ? Moon : Sunny"
    :aria-label="themeStore.mode === 'light' ? '切换到深色模式' : '切换到浅色模式'"
    @click="themeStore.toggleTheme()"
    class="theme-btn"
  />
</template>

<style scoped>
.theme-btn {
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  transition: color 220ms ease, border-color 220ms ease, background-color 220ms ease;
}

.theme-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 7%, transparent);
}
</style>
