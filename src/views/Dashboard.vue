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
  padding: 24px;
  overflow-y: auto;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
</style>
