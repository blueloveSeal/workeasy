<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useLauncherStore } from '@/stores/launcher'
import type { LauncherItem } from '@/types/launcher'
import TopBar from '@/components/dashboard/TopBar.vue'
import SearchDialog from '@/components/common/SearchDialog.vue'
import { VueDraggable as draggable } from 'vue-draggable-plus'

const launcherStore = useLauncherStore()

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const editMode = ref(false)

const form = ref({
  name: '',
  protocolUrl: '',
  icon: '',
  iconType: 'emoji' as 'emoji' | 'image' | 'letter',
  category: '',
})

const commonEmojis = ['🌐', '💻', '🎮', '💬', '📁', '🎵', '📷', '🎬', '📝', '🔧', '📊', '🎨', '🚀', '⭐', '🔥', '💡']

function getIconDisplay(item: LauncherItem): string {
  if (item.icon) return item.icon
  return item.name.charAt(0).toUpperCase()
}

function openAddDialog() {
  isEditing.value = false
  editingId.value = null
  form.value = { name: '', protocolUrl: '', icon: '', iconType: 'emoji', category: '' }
  dialogVisible.value = true
}

function openEditDialog(item: LauncherItem) {
  isEditing.value = true
  editingId.value = item.id
  form.value = {
    name: item.name,
    protocolUrl: item.protocolUrl,
    icon: item.icon || '',
    iconType: item.iconType || 'letter',
    category: item.category || '',
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    ElMessage.warning('请输入应用名称')
    return
  }
  if (!form.value.protocolUrl.trim()) {
    ElMessage.warning('请输入协议地址')
    return
  }

  const data = {
    name: form.value.name.trim(),
    protocolUrl: form.value.protocolUrl.trim(),
    icon: form.value.icon || form.value.name.charAt(0).toUpperCase(),
    iconType: form.value.icon ? form.value.iconType : 'letter' as const,
    category: form.value.category.trim() || undefined,
  }

  try {
    if (isEditing.value && editingId.value) {
      await launcherStore.update(editingId.value, data)
      ElMessage.success('应用已更新')
    } else {
      await launcherStore.add(data)
      ElMessage.success('应用已添加')
    }
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function handleDelete(item: LauncherItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除"${item.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await launcherStore.remove(item.id)
    ElMessage.success('应用已删除')
  } catch (error) {
    // User cancelled
  }
}

async function handleAddPresets() {
  try {
    await launcherStore.addPresets()
    ElMessage.success('预设应用已添加')
  } catch (error) {
    ElMessage.error('添加预设失败')
  }
}

function launchApp(item: LauncherItem) {
  const isWebUrl = /^https?:\/\//i.test(item.protocolUrl)
  if (isWebUrl) {
    window.open(item.protocolUrl, '_blank')
  } else {
    window.open(item.protocolUrl, '_self')
  }
}

async function onDragEnd() {
  const ids = launcherStore.items.map(i => i.id)
  await launcherStore.reorder(ids)
}

function handleContextMenu(item: LauncherItem, event: MouseEvent) {
  event.preventDefault()
  handleDelete(item)
}

onMounted(() => {
  launcherStore.load()
})
</script>

<template>
  <div class="launcher-page">
    <TopBar />
    <div class="launcher-content">
      <div class="launcher-header">
        <h1 class="page-title">应用启动器</h1>
        <div class="header-actions">
          <el-button @click="handleAddPresets">添加预设</el-button>
          <el-button :type="editMode ? 'warning' : 'default'" @click="editMode = !editMode">
            {{ editMode ? '完成' : '编辑模式' }}
          </el-button>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">
            添加应用
          </el-button>
        </div>
      </div>

      <div v-if="launcherStore.items.length" class="launcher-grid-wrapper">
        <draggable
          v-model="launcherStore.items"
          class="launcher-grid"
          ghost-class="ghost"
          @end="onDragEnd"
          :disabled="!editMode"
        >
          <div
            v-for="item in launcherStore.items"
            :key="item.id"
            class="launcher-item"
            :class="{ 'edit-mode': editMode }"
            @click="editMode ? null : launchApp(item)"
            @dblclick="editMode ? openEditDialog(item) : null"
            @contextmenu="handleContextMenu(item, $event)"
          >
            <div class="item-icon">
              <span v-if="item.iconType === 'emoji' || !item.iconType">{{ getIconDisplay(item) }}</span>
              <img v-else-if="item.iconType === 'image'" :src="item.icon" :alt="item.name" />
              <span v-else>{{ getIconDisplay(item) }}</span>
            </div>
            <div class="item-name">{{ item.name }}</div>
            <div class="item-url">{{ item.protocolUrl }}</div>
            <div v-if="editMode" class="item-edit-overlay">
              <el-button size="small" @click.stop="openEditDialog(item)">编辑</el-button>
              <el-button size="small" type="danger" @click.stop="handleDelete(item)">删除</el-button>
            </div>
          </div>
        </draggable>
      </div>

      <el-empty v-else description="启动器暂无应用">
        <div class="empty-actions">
          <el-button type="primary" @click="openAddDialog">添加第一个应用</el-button>
          <el-button @click="handleAddPresets">添加预设应用</el-button>
        </div>
      </el-empty>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑应用' : '添加应用'"
      width="500px"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="应用名称" />
        </el-form-item>
        <el-form-item label="协议地址" required>
          <el-input v-model="form.protocolUrl" placeholder="例如 vscode:// 或 steam://open/steam" />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-picker">
            <div class="emoji-grid">
              <span
                v-for="emoji in commonEmojis"
                :key="emoji"
                class="emoji-option"
                :class="{ selected: form.icon === emoji }"
                @click="form.icon = emoji; form.iconType = 'emoji'"
              >{{ emoji }}</span>
            </div>
            <el-input v-model="form.icon" placeholder="或输入自定义图标/表情" style="margin-top: 8px" />
          </div>
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
.launcher-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.launcher-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.launcher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.launcher-grid-wrapper {
  min-height: 200px;
}

.launcher-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.launcher-item {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.launcher-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.launcher-item.edit-mode {
  cursor: grab;
  border-style: dashed;
}

.launcher-item.edit-mode:active {
  cursor: grabbing;
}

.launcher-item.ghost {
  opacity: 0.5;
  background: var(--color-primary-light);
}

.item-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  border-radius: 12px;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  overflow: hidden;
}

.item-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-url {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-edit-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.launcher-item.edit-mode:hover .item-edit-overlay {
  opacity: 1;
}

.empty-actions {
  display: flex;
  gap: 12px;
}

.icon-picker {
  width: 100%;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emoji-option {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  background: var(--bg-input);
}

.emoji-option:hover {
  background: var(--bg-secondary);
}

.emoji-option.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}
</style>
