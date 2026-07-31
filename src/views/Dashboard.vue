<script setup lang="ts">
import TopBar from '@/components/dashboard/TopBar.vue'
import LauncherGrid from '@/components/dashboard/LauncherGrid.vue'
import TaskSummary from '@/components/dashboard/TaskSummary.vue'
import NoteSummary from '@/components/dashboard/NoteSummary.vue'
import BookmarkSummary from '@/components/dashboard/BookmarkSummary.vue'
import SearchDialog from '@/components/common/SearchDialog.vue'
</script>

<template>
  <div class="dashboard-page">
    <TopBar />
    <div class="dashboard-content">
      <LauncherGrid />
      <div class="summary-grid">
        <div class="stagger-item" style="animation-delay: 0ms">
          <TaskSummary />
        </div>
        <div class="stagger-item" style="animation-delay: 50ms">
          <NoteSummary />
        </div>
        <div class="stagger-item" style="animation-delay: 100ms">
          <BookmarkSummary />
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
  align-items: stretch;
}

.summary-grid .stagger-item:first-child {
  grid-row: span 2;
}

@media (max-width: 900px) {
  .dashboard-content {
    width: min(100% - 32px, 720px);
    padding-top: 24px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-grid .stagger-item:first-child {
    grid-row: auto;
  }
}

@media (max-width: 560px) {
  .dashboard-content {
    width: calc(100% - 24px);
    padding: 20px 0 32px;
  }
}
</style>
