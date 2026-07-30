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
  ElMessage.success(`Switched to ${themeStore.mode} mode`)
}

async function handleBackgroundUpload(file: UploadRawFile) {
  const validTypes = ['video/mp4', 'image/gif', 'image/png', 'image/jpeg']
  if (!validTypes.includes(file.type)) {
    ElMessage.error('Only MP4, GIF, PNG, and JPEG files are supported')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('File size must be less than 10MB')
    return false
  }
  try {
    await themeStore.setBackground(file)
    backgroundPreview.value = themeStore.backgroundUrl
    ElMessage.success('Background updated')
  } catch (error) {
    ElMessage.error('Failed to set background')
  }
  return false
}

async function handleClearBackground() {
  try {
    await themeStore.clearBackground()
    backgroundPreview.value = null
    ElMessage.success('Background cleared')
  } catch (error) {
    ElMessage.error('Failed to clear background')
  }
}

async function handleOverlayChange(val: number) {
  await themeStore.setOverlayOpacity(val)
}

async function handleAddPresets() {
  try {
    await launcherStore.addPresets()
    ElMessage.success('Preset apps added')
  } catch (error) {
    ElMessage.error('Failed to add presets')
  }
}

async function handleExport() {
  isExporting.value = true
  try {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      tasks: await db.tasks.toArray(),
      notes: await db.notes.toArray(),
      events: await db.events.toArray(),
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
    ElMessage.success('Data exported successfully')
  } catch (error) {
    ElMessage.error('Failed to export data')
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
      throw new Error('Invalid backup file')
    }

    await ElMessageBox.confirm(
      'This will overwrite existing data. Are you sure?',
      'Confirm Import',
      {
        confirmButtonText: 'Import',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    )

    if (data.tasks?.length) {
      await db.tasks.bulkPut(data.tasks)
    }
    if (data.notes?.length) {
      await db.notes.bulkPut(data.notes)
    }
    if (data.events?.length) {
      await db.events.bulkPut(data.events)
    }
    if (data.bookmarks?.length) {
      await db.bookmarks.bulkPut(data.bookmarks)
    }
    if (data.launcherItems?.length) {
      await db.launcherItems.bulkPut(data.launcherItems)
    }
    if (data.themeSettings?.length) {
      await db.themeSettings.bulkPut(data.themeSettings)
    }

    ElMessage.success('Data imported successfully. Reloading...')
    setTimeout(() => window.location.reload(), 1000)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(`Import failed: ${error.message || 'Unknown error'}`)
    }
  } finally {
    isImporting.value = false
  }
  return false
}

async function handleClearAll() {
  try {
    await ElMessageBox.confirm(
      'This will permanently delete ALL your data. This action cannot be undone!',
      'Clear All Data',
      {
        confirmButtonText: 'Clear Everything',
        cancelButtonText: 'Cancel',
        type: 'error',
      }
    )
    await ElMessageBox.confirm(
      'Are you ABSOLUTELY sure? Type "DELETE" to confirm.',
      'Final Confirmation',
      {
        confirmButtonText: 'DELETE',
        cancelButtonText: 'Cancel',
        type: 'error',
      }
    )

    await db.tasks.clear()
    await db.notes.clear()
    await db.events.clear()
    await db.bookmarks.clear()
    await db.launcherItems.clear()
    await db.themeSettings.clear()
    await db.customBackgrounds.clear()

    ElMessage.success('All data cleared. Reloading...')
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
      <h1 class="page-title">Settings</h1>

      <div class="settings-sections">
        <!-- Theme Section -->
        <div class="settings-section">
          <h2 class="section-title">Theme</h2>
          <div class="section-content">
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Appearance</div>
                <div class="setting-desc">Choose between light and dark mode</div>
              </div>
              <el-radio-group :model-value="themeStore.mode" @change="handleThemeChange">
                <el-radio-button value="light">Light</el-radio-button>
                <el-radio-button value="dark">Dark</el-radio-button>
              </el-radio-group>
            </div>
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Current Theme</div>
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
          <h2 class="section-title">Background</h2>
          <div class="section-content">
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Custom Background</div>
                <div class="setting-desc">Upload an image (PNG, JPEG), GIF, or MP4 video</div>
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
                  <div class="upload-text">Drop file here or click to upload</div>
                </div>
              </el-upload>
            </div>

            <div v-if="backgroundPreview" class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Current Background</div>
              </div>
              <div class="background-preview">
                <img v-if="themeStore.backgroundType === 'image' || themeStore.backgroundType === 'gif'" :src="backgroundPreview" alt="Background" />
                <video v-else-if="themeStore.backgroundType === 'video'" :src="backgroundPreview" muted loop autoplay />
              </div>
            </div>

            <div v-if="themeStore.backgroundUrl" class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Overlay Opacity</div>
                <div class="setting-desc">Adjust the overlay darkness (0-80%)</div>
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
                <div class="setting-label">Clear Background</div>
                <div class="setting-desc">Remove custom background</div>
              </div>
              <el-button type="danger" :icon="Delete" @click="handleClearBackground">
                Clear Background
              </el-button>
            </div>
          </div>
        </div>

        <!-- Launcher Presets Section -->
        <div class="settings-section">
          <h2 class="section-title">Launcher Presets</h2>
          <div class="section-content">
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Add Preset Apps</div>
                <div class="setting-desc">Add common apps like VS Code, Steam, WeChat, etc.</div>
              </div>
              <el-button type="primary" :icon="RefreshRight" @click="handleAddPresets">
                Add Preset Apps
              </el-button>
            </div>
          </div>
        </div>

        <!-- Data Management Section -->
        <div class="settings-section">
          <h2 class="section-title">Data Management</h2>
          <div class="section-content">
            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Export Data</div>
                <div class="setting-desc">Download all your data as a JSON backup file</div>
              </div>
              <el-button :icon="Download" :loading="isExporting" @click="handleExport">
                Export Data
              </el-button>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <div class="setting-label">Import Data</div>
                <div class="setting-desc">Restore data from a previously exported JSON file</div>
              </div>
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                accept=".json"
                :before-upload="handleImport"
                @change="(file: UploadFile) => file.raw && handleImport(file.raw)"
              >
                <el-button :icon="Upload" :loading="isImporting">
                  Import Data
                </el-button>
              </el-upload>
            </div>

            <div class="setting-row danger-zone">
              <div class="setting-info">
                <div class="setting-label">Clear All Data</div>
                <div class="setting-desc">Permanently delete all tasks, notes, bookmarks, and settings</div>
              </div>
              <el-button type="danger" :icon="Delete" @click="handleClearAll">
                Clear All Data
              </el-button>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div class="settings-section">
          <h2 class="section-title">About</h2>
          <div class="section-content">
            <div class="about-info">
              <div class="about-row">
                <span class="about-label">Version</span>
                <span class="about-value">1.0.0</span>
              </div>
              <div class="about-row">
                <span class="about-label">Project</span>
                <span class="about-value">WorkEasy</span>
              </div>
              <div class="about-row">
                <span class="about-label">Framework</span>
                <span class="about-value">Vue 3 + TypeScript + Element Plus</span>
              </div>
              <div class="about-row">
                <span class="about-label">Storage</span>
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
