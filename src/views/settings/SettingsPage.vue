<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Download, Delete, RefreshRight } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'
import { useLauncherStore } from '@/stores/launcher'
import { db } from '@/db'
import TopBar from '@/components/dashboard/TopBar.vue'
import SearchDialog from '@/components/common/SearchDialog.vue'
import type { UploadFile, UploadRawFile } from 'element-plus'

const themeStore = useThemeStore()
const launcherStore = useLauncherStore()

const backgroundPreview = ref<string | null>(null)
const isExporting = ref(false)
const isImporting = ref(false)

onMounted(() => {
  backgroundPreview.value = themeStore.backgroundUrl
})

async function handleThemeChange() {
  await themeStore.toggleTheme()
  ElMessage.success(`已切换到${themeStore.mode === 'light' ? '浅色' : '深色'}模式`)
}

async function handleBackgroundUpload(file: UploadRawFile) {
  const validTypes = ['video/mp4', 'image/gif', 'image/png', 'image/jpeg']
  if (!validTypes.includes(file.type)) {
    ElMessage.error('仅支持 MP4、GIF、PNG 和 JPEG 格式')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  try {
    await themeStore.setBackground(file)
    backgroundPreview.value = themeStore.backgroundUrl
    ElMessage.success('背景已更新')
  } catch (error) {
    ElMessage.error('背景设置失败')
  }
  return false
}

async function handleClearBackground() {
  try {
    await themeStore.clearBackground()
    backgroundPreview.value = null
    ElMessage.success('背景已清除')
  } catch (error) {
    ElMessage.error('背景清除失败')
  }
}

async function handleOverlayChange(val: number) {
  await themeStore.setOverlayOpacity(val)
}

async function handleAddPresets() {
  try {
    await launcherStore.addPresets()
    ElMessage.success('预设应用已添加')
  } catch (error) {
    ElMessage.error('添加预设失败')
  }
}

async function handleExport() {
  isExporting.value = true
  try {
    const data = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      tasks: await db.tasks.toArray(),
      notes: await db.notes.toArray(),
      bookmarks: await db.bookmarks.toArray(),
      launcherItems: await db.launcherItems.toArray(),
      themeSettings: await db.themeSettings.toArray(),
    }

    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workeasy-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败')
  } finally {
    isExporting.value = false
  }
}

async function handleImport(file: UploadRawFile) {
  isImporting.value = true
  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (!data.version) {
      throw new Error('无效的备份文件')
    }

    await ElMessageBox.confirm(
      '这将覆盖现有数据，确定要继续吗？',
      '确认导入',
      {
        confirmButtonText: '导入',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    if (data.tasks?.length) {
      await db.tasks.bulkPut(data.tasks)
    }
    if (data.notes?.length) {
      await db.notes.bulkPut(data.notes)
    }
    // v2.0.0+ backups do not include events (calendar module removed)
    if (data.bookmarks?.length) {
      await db.bookmarks.bulkPut(data.bookmarks)
    }
    if (data.launcherItems?.length) {
      await db.launcherItems.bulkPut(data.launcherItems)
    }
    if (data.themeSettings?.length) {
      await db.themeSettings.bulkPut(data.themeSettings)
    }

    ElMessage.success('数据导入成功，正在刷新...')
    setTimeout(() => window.location.reload(), 1000)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`导入失败：${error.message || '未知错误'}`)
    }
  } finally {
    isImporting.value = false
  }
  return false
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm(
      '这将永久删除所有数据，此操作不可撤销！',
      '清除所有数据',
      {
        confirmButtonText: '全部清除',
        cancelButtonText: '取消',
        type: 'error',
      }
    )
    await ElMessageBox.confirm(
      '你确定要这样做吗？输入 "DELETE" 以确认。',
      '最终确认',
      {
        confirmButtonText: 'DELETE',
        cancelButtonText: '取消',
        type: 'error',
      }
    )

    await db.tasks.clear()
    await db.notes.clear()
    await db.bookmarks.clear()
    await db.launcherItems.clear()
    await db.themeSettings.clear()
    await db.customBackgrounds.clear()

    ElMessage.success('所有数据已清除，正在刷新...')
    setTimeout(() => window.location.reload(), 1000)
  } catch (error) {
    // User cancelled
  }
}
</script>

<template>
  <div class="settings-page">
    <TopBar />
    <div class="settings-content">
      <h1 class="page-title">设置</h1>

      <div class="settings-sections">
        <!-- Theme Section -->
        <div class="settings-section">
          <h2 class="section-title">主题</h2>
          <div class="section-content">
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">外观</div>
                <div class="setting-desc">选择浅色或深色模式</div>
              </div>
              <el-radio-group :model-value="themeStore.mode" @change="handleThemeChange">
                <el-radio-button value="light">浅色</el-radio-button>
                <el-radio-button value="dark">深色</el-radio-button>
              </el-radio-group>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">当前主题</div>
              </div>
              <div class="theme-preview" :class="themeStore.mode">
                <div class="preview-bar"></div>
                <div class="preview-content">
                  <div class="preview-card"></div>
                  <div class="preview-card"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Background Section -->
        <div class="settings-section">
          <h2 class="section-title">背景</h2>
          <div class="section-content">
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">自定义背景</div>
                <div class="setting-desc">上传图片（PNG、JPEG）、GIF 或 MP4 视频</div>
              </div>
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                accept="video/mp4,image/gif,image/png,image/jpeg"
                :before-upload="handleBackgroundUpload"
                @change="(file: UploadFile) => file.raw && handleBackgroundUpload(file.raw)"
                drag
              >
                <div class="upload-area">
                  <el-icon :size="32"><Upload /></el-icon>
                  <div class="upload-text">拖拽文件到此处或点击上传</div>
                </div>
              </el-upload>
            </div>

            <div v-if="backgroundPreview" class="setting-row">
              <div class="setting-info">
                <div class="setting-label">当前背景</div>
              </div>
              <div class="background-preview">
                <img v-if="themeStore.backgroundType === 'image' || themeStore.backgroundType === 'gif'" :src="backgroundPreview" alt="Background" />
                <video v-else-if="themeStore.backgroundType === 'video'" :src="backgroundPreview" muted loop autoplay />
              </div>
            </div>

            <div v-if="themeStore.backgroundUrl" class="setting-row">
              <div class="setting-info">
                <div class="setting-label">遮罩透明度</div>
                <div class="setting-desc">调整遮罩深度（0-80%）</div>
              </div>
              <el-slider
                :model-value="themeStore.overlayOpacity"
                :min="0"
                :max="80"
                :step="1"
                style="width: 200px"
                @change="handleOverlayChange"
              />
            </div>

            <div v-if="themeStore.backgroundUrl" class="setting-row">
              <div class="setting-info">
                <div class="setting-label">清除背景</div>
                <div class="setting-desc">移除自定义背景</div>
              </div>
              <el-button type="danger" :icon="Delete" @click="handleClearBackground">
                清除背景
              </el-button>
            </div>
          </div>
        </div>

        <!-- Launcher Presets Section -->
        <div class="settings-section">
          <h2 class="section-title">启动器预设</h2>
          <div class="section-content">
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">添加预设应用</div>
                <div class="setting-desc">添加常用应用，如 VS Code、Steam、微信等</div>
              </div>
              <el-button type="primary" :icon="RefreshRight" @click="handleAddPresets">
                添加预设应用
              </el-button>
            </div>
          </div>
        </div>

        <!-- Data Management Section -->
        <div class="settings-section">
          <h2 class="section-title">数据管理</h2>
          <div class="section-content">
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">导出数据</div>
                <div class="setting-desc">将所有数据下载为 JSON 备份文件</div>
              </div>
              <el-button :icon="Download" :loading="isExporting" @click="handleExport">
                导出数据
              </el-button>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">导入数据</div>
                <div class="setting-desc">从之前导出的 JSON 文件中恢复数据</div>
              </div>
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                accept=".json"
                :before-upload="handleImport"
                @change="(file: UploadFile) => file.raw && handleImport(file.raw)"
              >
                <el-button :icon="Upload" :loading="isImporting">
                  导入数据
                </el-button>
              </el-upload>
            </div>

            <div class="setting-row danger-zone">
              <div class="setting-info">
                <div class="setting-label">清除所有数据</div>
                <div class="setting-desc">永久删除所有任务、笔记、书签和设置</div>
              </div>
              <el-button type="danger" :icon="Delete" @click="handleClearAll">
                清除所有数据
              </el-button>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div class="settings-section">
          <h2 class="section-title">关于</h2>
          <div class="section-content">
            <div class="about-info">
              <div class="about-row">
                <span class="about-label">版本</span>
                <span class="about-value">1.0.0</span>
              </div>
              <div class="about-row">
                <span class="about-label">项目</span>
                <span class="about-value">WorkEasy</span>
              </div>
              <div class="about-row">
                <span class="about-label">框架</span>
                <span class="about-value">Vue 3 + TypeScript + Element Plus</span>
              </div>
              <div class="about-row">
                <span class="about-label">存储</span>
                <span class="about-value">IndexedDB (Dexie.js)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SearchDialog />
  </div>
</template>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.settings-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 32px 0;
}

.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.section-content {
  padding: 8px 0;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  gap: 16px;
}

.setting-row + .setting-row {
  border-top: 1px solid var(--border-color);
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.theme-preview {
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.theme-preview.light {
  background: #f5f5f5;
}

.theme-preview.dark {
  background: #1a1a1a;
}

.preview-bar {
  height: 16px;
  background: var(--color-primary);
  opacity: 0.8;
}

.preview-content {
  padding: 6px;
  display: flex;
  gap: 4px;
}

.preview-card {
  flex: 1;
  height: 24px;
  border-radius: 3px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
}

.upload-area {
  padding: 20px;
  text-align: center;
  color: var(--text-muted);
}

.upload-text {
  margin-top: 8px;
  font-size: 13px;
}

.background-preview {
  width: 160px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.background-preview img,
.background-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.danger-zone {
  background: rgba(245, 108, 108, 0.05);
}

.about-info {
  padding: 8px 20px 16px;
}

.about-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.about-row + .about-row {
  border-top: 1px solid var(--border-color);
}

.about-label {
  color: var(--text-secondary);
}

.about-value {
  color: var(--text-primary);
  font-weight: 500;
}

:deep(.el-upload-dragger) {
  padding: 0;
  border: none;
  background: transparent;
}

:deep(.el-upload-dragger:hover) {
  border-color: var(--color-primary);
}
</style>
