<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBookmarkStore } from '@/stores/bookmark'
import { useRouter } from 'vue-router'
import AppCard from '@/components/common/AppCard.vue'

const bookmarkStore = useBookmarkStore()
const router = useRouter()
onMounted(() => { bookmarkStore.load() })

const recentBookmarks = computed(() => bookmarkStore.bookmarks.slice(0, 5))
const newUrl = ref('')
const adding = ref(false)

function getDomain(url: string) { try { return new URL(url).hostname } catch { return url } }
function getTitleFromUrl(url: string) {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch { return url }
}
function openBookmark(bm: { url: string }) { window.open(bm.url, '_blank') }

async function addQuickBookmark() {
  let url = newUrl.value.trim()
  if (!url || adding.value) return
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  adding.value = true
  try {
    await bookmarkStore.add({
      title: getTitleFromUrl(url),
      url,
      tags: [],
    })
    newUrl.value = ''
  } finally {
    adding.value = false
  }
}

async function deleteBookmark(id: string) {
  await bookmarkStore.remove(id)
}
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
        <el-button
          class="bookmark-action-btn"
          size="small"
          text
          type="danger"
          @click.stop="deleteBookmark(bm.id)"
        >
          <el-icon :size="14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></el-icon>
        </el-button>
      </div>
    </div>
    <div v-else class="empty-hint">暂无书签</div>

    <div class="quick-add">
      <el-input
        v-model="newUrl"
        placeholder="输入网址快速添加书签..."
        size="small"
        @keyup.enter="addQuickBookmark"
        :disabled="adding"
      >
        <template #append>
          <el-button :disabled="!newUrl.trim() || adding" @click="addQuickBookmark">
            <el-icon :size="14"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>
  </AppCard>
</template>

<style scoped>
.bookmark-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.bookmark-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; cursor: pointer; padding: 4px 6px; border-radius: 6px; transition: background 0.15s ease; }
.bookmark-item:hover { background: var(--bg-input); }
.bookmark-title { color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.bookmark-item:hover .bookmark-title { color: var(--el-color-primary); }
.bookmark-domain { color: var(--text-muted); font-size: 12px; flex-shrink: 0; margin-left: 8px; }
.bookmark-action-btn { opacity: 0; transition: opacity 0.15s ease; flex-shrink: 0; padding: 2px !important; margin-left: 4px; }
.bookmark-item:hover .bookmark-action-btn { opacity: 1; }
.quick-add { margin-top: 8px; }
.empty-hint { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
</style>
