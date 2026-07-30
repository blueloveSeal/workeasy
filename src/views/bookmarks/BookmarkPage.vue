<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { useBookmarkStore } from '@/stores/bookmark'
import type { Bookmark } from '@/types/bookmark'
import TopBar from '@/components/dashboard/TopBar.vue'
import SearchDialog from '@/components/common/SearchDialog.vue'
import dayjs from 'dayjs'

const bookmarkStore = useBookmarkStore()

const searchQuery = ref('')
const activeCategory = ref('all')
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  title: '',
  url: '',
  category: '',
  tags: [] as string[],
})

const categories = computed(() => {
  const cats = new Set<string>()
  bookmarkStore.bookmarks.forEach(b => {
    if (b.category) cats.add(b.category)
  })
  return ['all', ...Array.from(cats)]
})

const filteredBookmarks = computed(() => {
  let result = bookmarkStore.bookmarks

  if (activeCategory.value !== 'all') {
    result = result.filter(b => b.category === activeCategory.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(b =>
      b.title.toLowerCase().includes(query) ||
      b.url.toLowerCase().includes(query) ||
      b.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return result
})

function getFavicon(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function openBookmark(bookmark: Bookmark) {
  window.open(bookmark.url, '_blank')
}

function openAddDialog() {
  isEditing.value = false
  editingId.value = null
  form.value = { title: '', url: '', category: '', tags: [] }
  dialogVisible.value = true
}

function openEditDialog(bookmark: Bookmark, event: Event) {
  event.stopPropagation()
  isEditing.value = true
  editingId.value = bookmark.id
  form.value = {
    title: bookmark.title,
    url: bookmark.url,
    category: bookmark.category || '',
    tags: [...bookmark.tags],
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!form.value.url.trim()) {
    ElMessage.warning('请输入网址')
    return
  }

  const data = JSON.parse(JSON.stringify({
    title: form.value.title.trim(),
    url: form.value.url.trim(),
    category: form.value.category.trim() || undefined,
    favicon: getFavicon(form.value.url),
    tags: form.value.tags,
  }))

  try {
    if (isEditing.value && editingId.value) {
      await bookmarkStore.update(editingId.value, data)
      ElMessage.success('书签已更新')
    } else {
      await bookmarkStore.add(data)
      ElMessage.success('书签已添加')
    }
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function handleDelete(bookmark: Bookmark, event: Event) {
  event.stopPropagation()
  try {
    await ElMessageBox.confirm(
      `确定要删除"${bookmark.title}"吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await bookmarkStore.remove(bookmark.id)
    ElMessage.success('书签已删除')
  } catch (error) {
    // User cancelled
  }
}

function formatDate(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD')
}

onMounted(() => {
  bookmarkStore.load()
})
</script>

<template>
  <div class="bookmark-page">
    <TopBar />
    <div class="bookmark-content">
      <div class="bookmark-header">
        <div class="header-left">
          <h1 class="page-title">书签</h1>
          <el-tabs v-model="activeCategory" class="category-tabs">
            <el-tab-pane
              v-for="cat in categories"
              :key="cat"
              :label="cat === 'all' ? '全部' : cat"
              :name="cat"
            />
          </el-tabs>
        </div>
        <div class="header-right">
          <el-input
            v-model="searchQuery"
            placeholder="搜索书签..."
            clearable
            style="width: 240px"
          />
          <el-button type="primary" :icon="Plus" @click="openAddDialog">
            添加书签
          </el-button>
        </div>
      </div>

      <div v-if="filteredBookmarks.length" class="bookmark-grid">
        <div
          v-for="bookmark in filteredBookmarks"
          :key="bookmark.id"
          class="bookmark-card"
          @click="openBookmark(bookmark)"
        >
          <div class="card-content">
            <div class="bookmark-icon">
              <img
                :src="bookmark.favicon || getFavicon(bookmark.url)"
                :alt="bookmark.title"
                @error="(e) => ((e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23999%22%3E%3Cpath d=%22M12 2L2 7v10l10 5 10-5V7L12 2z%22/%3E%3C/svg%3E')"
              />
            </div>
            <div class="bookmark-info">
              <div class="bookmark-title">{{ bookmark.title }}</div>
              <div class="bookmark-domain">{{ getDomain(bookmark.url) }}</div>
              <div class="bookmark-meta">
                <span v-if="bookmark.category" class="bookmark-category">
                  {{ bookmark.category }}
                </span>
                <span class="bookmark-date">{{ formatDate(bookmark.createdAt) }}</span>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <el-button
              size="small"
              :icon="Edit"
              circle
              @click="openEditDialog(bookmark, $event)"
            />
            <el-button
              size="small"
              type="danger"
              :icon="Delete"
              circle
              @click="handleDelete(bookmark, $event)"
            />
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无书签">
        <el-button type="primary" @click="openAddDialog">添加第一个书签</el-button>
      </el-empty>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑书签' : '添加书签'"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入书签标题" />
        </el-form-item>
        <el-form-item label="网址" required>
          <el-input v-model="form.url" placeholder="https://example.com" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="可选分类" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">
          {{ isEditing ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <SearchDialog />
  </div>
</template>

<style scoped>
.bookmark-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bookmark-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.bookmark-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
}

.category-tabs {
  margin-top: 8px;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.bookmark-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.bookmark-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bookmark-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.bookmark-card:hover .card-actions {
  opacity: 1;
}

.card-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.bookmark-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bookmark-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bookmark-info {
  flex: 1;
  min-width: 0;
}

.bookmark-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-domain {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}

.bookmark-category {
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.bookmark-date {
  color: var(--text-muted);
}

.card-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.el-tabs__nav) {
  margin-bottom: 0;
}

:deep(.el-tabs__header) {
  margin-bottom: 0;
}
</style>
