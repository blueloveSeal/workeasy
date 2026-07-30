<script setup lang="ts">
import { Sunny, Moon } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <el-button
    circle
    :icon="themeStore.mode === 'light' ? Moon : Sunny"
    @click="themeStore.toggleTheme()"
    class="theme-btn"
  />
</template>

<style scoped>
.theme-btn {
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.theme-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
</style>
