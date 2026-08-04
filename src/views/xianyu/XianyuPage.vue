<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ShoppingCart } from '@element-plus/icons-vue'
import TopBar from '@/components/dashboard/TopBar.vue'
import SearchDialog from '@/components/common/SearchDialog.vue'
import XianyuProductTab from './XianyuProductTab.vue'
import XianyuOrderTab from './XianyuOrderTab.vue'
import XianyuSettingsTab from './XianyuSettingsTab.vue'
import { useXianyuAuthStore } from '@/stores/xianyu-auth'
import { useXianyuProductStore } from '@/stores/xianyu-product'
import { useXianyuOrderStore } from '@/stores/xianyu-order'

const authStore = useXianyuAuthStore()
const productStore = useXianyuProductStore()
const orderStore = useXianyuOrderStore()

const activeTab = ref('products')

onMounted(async () => {
  await authStore.load()
  await productStore.load()
  await orderStore.load()
})
</script>

<template>
  <div class="xianyu-page">
    <TopBar />

    <div class="xianyu-content">
      <div class="page-header">
        <div class="page-title-row">
          <el-icon class="page-title-icon"><ShoppingCart /></el-icon>
          <h2 class="page-title">闲鱼管理</h2>
        </div>
        <div class="login-status">
          <el-tag :type="authStore.isLoggedIn ? 'success' : 'info'" size="small" round>
            {{ authStore.isLoggedIn ? '已登录' : '未登录' }}
          </el-tag>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="xianyu-tabs">
        <el-tab-pane label="商品管理" name="products">
          <XianyuProductTab />
        </el-tab-pane>
        <el-tab-pane label="订单管理" name="orders">
          <XianyuOrderTab />
        </el-tab-pane>
        <el-tab-pane label="设置" name="settings">
          <XianyuSettingsTab />
        </el-tab-pane>
      </el-tabs>
    </div>

    <SearchDialog />
  </div>
</template>

<style scoped>
.xianyu-page {
  height: 100%;
  background: transparent;
  display: flex;
  flex-direction: column;
}

.xianyu-content {
  flex: 1;
  width: min(100% - 48px, 1320px);
  padding: 30px 32px 38px;
  background: color-mix(in srgb, var(--bg-card) 94%, transparent);
  margin: 24px auto 32px;
  border: 1px solid var(--border-color);
  border-radius: 24px 24px 24px 9px;
  box-shadow: var(--shadow-card);
  overflow: auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title-icon {
  font-size: 28px;
  color: var(--color-primary);
}

.page-title {
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1;
  font-weight: 750;
  letter-spacing: -0.055em;
  color: var(--text-primary);
  margin: 0;
}

.login-status {
  display: flex;
  align-items: center;
}

.xianyu-tabs {
  margin-top: 8px;
}

.xianyu-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.xianyu-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

@media (max-width: 760px) {
  .xianyu-content {
    width: calc(100% - 24px);
    margin: 16px auto 24px;
    padding: 22px 16px 28px;
    border-radius: 18px 18px 18px 7px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-title {
    font-size: 34px;
  }
}
</style>
