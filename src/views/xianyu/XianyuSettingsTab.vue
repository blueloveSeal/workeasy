<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshRight, SwitchButton } from '@element-plus/icons-vue'
import { useXianyuAuthStore } from '@/stores/xianyu-auth'
import { useXianyuOrderStore } from '@/stores/xianyu-order'

const authStore = useXianyuAuthStore()
const orderStore = useXianyuOrderStore()

const loginDialogVisible = ref(false)
const pollingTimer = ref<number | null>(null)
const pollStatus = ref('')
const pollInterval = ref(1)

const isLoggedIn = computed(() => authStore.isLoggedIn)
const cookieUpdateTime = computed(() => {
  if (!authStore.cookie?.updatedAt) return '--'
  return new Date(authStore.cookie.updatedAt).toLocaleString('zh-CN')
})

async function handleStartLogin() {
  loginDialogVisible.value = true
  pollStatus.value = '正在生成二维码...'
  await authStore.generateQrcode()
  if (authStore.qrcodeUrl) {
    pollStatus.value = '请使用闲鱼APP扫描二维码'
    startPolling()
  } else {
    pollStatus.value = '二维码生成失败，请重试'
  }
}

function startPolling() {
  stopPolling()
  pollingTimer.value = window.setInterval(async () => {
    const result = await authStore.queryLoginStatus()
    if (result.logged) {
      pollStatus.value = '登录成功！'
      stopPolling()
      loginDialogVisible.value = false
      ElMessage.success('闲鱼登录成功')
    } else if (result.success) {
      pollStatus.value = '等待扫码...'
    }
  }, 2000)
}

function stopPolling() {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value)
    pollingTimer.value = null
  }
}

async function handleLogout() {
  await authStore.logout()
  orderStore.stopAutoDeliver()
  ElMessage.success('已退出登录')
}

function handleToggleAutoDeliver() {
  if (orderStore.autoDeliverEnabled) {
    orderStore.stopAutoDeliver()
    ElMessage.success('自动发货已关闭')
  } else {
    if (!isLoggedIn.value) {
      ElMessage.warning('请先登录闲鱼')
      return
    }
    orderStore.startAutoDeliver(pollInterval.value)
    ElMessage.success(`自动发货已开启，每 ${pollInterval.value} 分钟检查一次`)
  }
}

onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <div class="settings-tab">
    <!-- 登录状态卡片 -->
    <div class="settings-card">
      <div class="card-header">
        <h3 class="card-title">账号状态</h3>
        <el-tag :type="isLoggedIn ? 'success' : 'info'" size="large" round>
          {{ isLoggedIn ? '已登录' : '未登录' }}
        </el-tag>
      </div>
      <div class="card-body">
        <div class="info-row">
          <span class="info-label">Cookie 更新时间</span>
          <span class="info-value">{{ cookieUpdateTime }}</span>
        </div>
        <div class="card-actions">
          <el-button v-if="!isLoggedIn" type="primary" @click="handleStartLogin">
            扫码登录
          </el-button>
          <el-button v-else type="danger" plain @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </div>
    </div>

    <!-- 自动发货设置卡片 -->
    <div class="settings-card">
      <div class="card-header">
        <h3 class="card-title">自动发货</h3>
        <el-switch
          :model-value="orderStore.autoDeliverEnabled"
          @change="handleToggleAutoDeliver"
          active-text="开启"
          inactive-text="关闭"
        />
      </div>
      <div class="card-body">
        <div class="info-row">
          <span class="info-label">轮询间隔（分钟）</span>
          <el-input-number
            v-model="pollInterval"
            :min="1"
            :max="60"
            :disabled="orderStore.autoDeliverEnabled"
            size="small"
            style="width: 120px"
          />
        </div>
        <p class="settings-hint">
          开启后，系统会定期检查待发货订单并自动发送卡密给买家。
          请确保页面保持打开状态。
        </p>
      </div>
    </div>

    <!-- 登录二维码弹窗 -->
    <el-dialog
      v-model="loginDialogVisible"
      title="闲鱼扫码登录"
      width="380px"
      :close-on-click-modal="false"
      @close="stopPolling"
    >
      <div class="qrcode-container">
        <div v-if="authStore.qrcodeUrl" class="qrcode-wrapper">
          <img :src="authStore.qrcodeUrl" alt="登录二维码" class="qrcode-image" />
        </div>
        <div v-else class="qrcode-loading">
          <el-icon class="is-loading" :size="32"><RefreshRight /></el-icon>
        </div>
        <p class="qrcode-status">{{ pollStatus }}</p>
        <p class="qrcode-hint">请使用闲鱼APP扫描上方二维码登录</p>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.settings-tab {
  padding: 4px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 600px;
}

.settings-card {
  background: var(--bg-secondary);
  border-radius: 16px 16px 16px 6px;
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.card-body {
  padding: 16px 20px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
}

.card-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.settings-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin: 12px 0 0;
  line-height: 1.5;
}

/* QR Code Dialog */
.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.qrcode-wrapper {
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.qrcode-image {
  width: 200px;
  height: 200px;
  display: block;
}

.qrcode-loading {
  width: 232px;
  height: 232px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.qrcode-status {
  margin-top: 16px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.qrcode-hint {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-muted);
}
</style>
