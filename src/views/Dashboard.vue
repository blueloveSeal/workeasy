<script setup lang="ts">
import TopBar from '@/components/dashboard/TopBar.vue'
import LauncherGrid from '@/components/dashboard/LauncherGrid.vue'
import TaskSummary from '@/components/dashboard/TaskSummary.vue'
import NoteSummary from '@/components/dashboard/NoteSummary.vue'
import BookmarkSummary from '@/components/dashboard/BookmarkSummary.vue'
import SearchDialog from '@/components/common/SearchDialog.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <div
    class="dashboard-page"
    :class="{ 'has-custom-background': themeStore.backgroundUrl }"
  >
    <TopBar />
    <div class="dashboard-content">
      <LauncherGrid />
      <div class="summary-grid">
        <div class="stagger-item" style="animation-delay: 0ms">
          <TaskSummary />
        </div>
        <div class="summary-stack">
          <div class="stagger-item" style="animation-delay: 50ms">
            <NoteSummary />
          </div>
          <div class="stagger-item" style="animation-delay: 100ms">
            <BookmarkSummary />
          </div>
        </div>
      </div>
    </div>
    <SearchDialog />
  </div>
</template>

<style scoped>
.dashboard-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dashboard-content {
  flex: 1;
  width: min(100% - 48px, 1320px);
  padding: 30px 0 48px;
  margin: 0 auto;
  overflow-y: auto;
}

.summary-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 18px;
  align-items: start;
}

.summary-stack {
  display: grid;
  gap: 18px;
}

.has-custom-background :deep(.app-card) {
  background: color-mix(in srgb, var(--bg-card) 68%, transparent);
  border-color: color-mix(in srgb, var(--text-primary) 14%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #ffffff 10%, transparent),
    0 18px 44px color-mix(in srgb, var(--bg-primary) 28%, transparent);
  backdrop-filter: blur(12px) saturate(1.18);
  -webkit-backdrop-filter: blur(12px) saturate(1.18);
}

.has-custom-background :deep(.app-card:hover) {
  background: color-mix(in srgb, var(--bg-card) 76%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 34%, transparent);
}

.has-custom-background :deep(.launcher-grid) {
  grid-template-columns: repeat(auto-fit, minmax(76px, 92px));
  justify-content: start;
  padding: 0;
  background: transparent;
  border-color: transparent;
}

.has-custom-background :deep(.launcher-icon:hover) {
  background: color-mix(in srgb, var(--bg-card) 46%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.has-custom-background :deep(.icon-wrapper) {
  background: color-mix(in srgb, var(--bg-card) 64%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-primary) 12%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, #ffffff 10%, transparent),
    0 10px 24px color-mix(in srgb, var(--bg-primary) 24%, transparent);
  backdrop-filter: blur(10px) saturate(1.15);
  -webkit-backdrop-filter: blur(10px) saturate(1.15);
}

@media (max-width: 900px) {
  .dashboard-content {
    width: min(100% - 32px, 720px);
    padding-top: 24px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-stack {
    gap: 18px;
  }
}

@media (max-width: 560px) {
  .dashboard-content {
    width: calc(100% - 24px);
    padding: 20px 0 32px;
  }
}
</style>
