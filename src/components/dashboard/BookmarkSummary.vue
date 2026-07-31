<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBookmarkStore } from '@/stores/bookmark'
import { useRouter } from 'vue-router'
import AppCard from '@/components/common/AppCard.vue'

const bookmarkStore = useBookmarkStore()
const router = useRouter()
onMounted(() => { bookmarkStore.load() })

const recentBookmarks = computed(() => bookmarkStore.bookmarks.slice(0, 3))
function getDomain(url: string) { try { return new URL(url).hostname } catch { return url } }
function openBookmark(bm: { url: string }) { window.open(bm.url, '_blank') }
</script>

<template>
  <AppCard title="书签" :subtitle="bookmarkStore.bookmarks.length + ' 个书签'">
    <template #actions>
      <el-button text size="small" @click="router.push('/bookmarks')">查看全部</el-button>
    </template>
    <div v-if="recentBookmarks.length" class="bookmark-list">
      <div
        v-for="bm in recentBookmarks"
        :key="bm.id"
        class="bookmark-item"
        @click="openBookmark(bm)"
      >
        <span class="bookmark-title">{{ bm.title }}</span>
        <span class="bookmark-domain">{{ getDomain(bm.url) }}</span>
      </div>
    </div>
    <div v-else class="empty-hint">暂无书签</div>
  </AppCard>
</template>

<style scoped>
.bookmark-list { display: flex; flex-direction: column; gap: 10px; }
.bookmark-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; cursor: pointer; padding: 4px 6px; border-radius: 6px; transition: background 0.15s ease; }
.bookmark-item:hover { background: var(--bg-input); }
.bookmark-title { color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.bookmark-item:hover .bookmark-title { color: var(--el-color-primary); }
.bookmark-domain { color: var(--text-muted); font-size: 12px; flex-shrink: 0; margin-left: 8px; }
.empty-hint { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
</style>
