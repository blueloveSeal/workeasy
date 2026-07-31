<script setup lang="ts">
import { onMounted } from 'vue'
import { useLauncherStore } from '@/stores/launcher'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'

const launcherStore = useLauncherStore()
const router = useRouter()

onMounted(() => {
  launcherStore.load()
})

function launchApp(item: { protocolUrl: string }) {
  const isWebUrl = /^https?:\/\//i.test(item.protocolUrl)
  if (isWebUrl) {
    window.open(item.protocolUrl, '_blank')
  } else {
    window.location.href = item.protocolUrl
  }
}
</script>

<template>
  <div class="launcher-section">
    <div class="launcher-header">
      <h3 class="section-title">快速启动</h3>
      <el-button text size="small" @click="router.push('/launcher')">
        管理
      </el-button>
    </div>

    <div v-if="launcherStore.items.length" class="launcher-grid">
      <div
        v-for="item in launcherStore.items"
        :key="item.id"
        class="launcher-icon"
        @click="launchApp(item)"
      >
        <div class="icon-wrapper">
          <img
            v-if="item.iconType === 'image' && item.icon"
            :src="item.icon"
            :alt="item.name"
            class="icon-image"
          />
          <span v-else class="icon-emoji">{{ item.icon || item.name[0] }}</span>
        </div>
        <span class="icon-name">{{ item.name }}</span>
      </div>

      <div class="launcher-icon add-icon" @click="router.push('/launcher')">
        <div class="icon-wrapper">
          <el-icon :size="24"><Plus /></el-icon>
        </div>
        <span class="icon-name">添加</span>
      </div>
    </div>

    <div v-else class="launcher-empty">
      <el-empty description="暂无应用" :image-size="80">
        <el-button type="primary" size="small" @click="router.push('/launcher')">
          添加应用
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
.launcher-section {
  margin-bottom: 30px;
}

.launcher-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.section-title {
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.08em;
  color: var(--text-primary);
  margin: 0;
}

.launcher-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 10px;
  padding: 8px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--bg-card) 44%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color) 62%, transparent);
}

.launcher-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 13px 8px 11px;
  border-radius: 13px;
  transition: transform 220ms ease, background-color 220ms ease;
}

.launcher-icon:hover {
  background: var(--bg-card);
  transform: translateY(-2px);
}

.launcher-icon:hover .icon-wrapper {
  box-shadow: 0 10px 22px color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 15px 15px 15px 6px;
  background: var(--bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-card);
  transition: box-shadow 220ms ease, transform 220ms ease;
}

.icon-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.icon-emoji {
  font-size: 24px;
}

.icon-name {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 72px;
}

.add-icon .icon-wrapper {
  border: 2px dashed var(--border-color);
  background: transparent;
  color: var(--text-muted);
}

.add-icon:hover .icon-wrapper {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.launcher-empty {
  padding: 20px;
}
</style>
