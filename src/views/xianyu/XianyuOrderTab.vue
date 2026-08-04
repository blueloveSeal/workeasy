<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Ship } from '@element-plus/icons-vue'
import { useXianyuOrderStore } from '@/stores/xianyu-order'
import { useXianyuAuthStore } from '@/stores/xianyu-auth'
import type { XianyuOrder } from '@/types/xianyu'

const orderStore = useXianyuOrderStore()
const authStore = useXianyuAuthStore()

const filterStatus = ref<string>('')
const refreshing = ref(false)

const statusOptions = [
  { label: '待发货', value: 'wait_ship' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'finished' },
  { label: '已关闭', value: 'closed' },
]

const filteredOrders = computed(() => {
  if (!filterStatus.value) return orderStore.orders
  return orderStore.orders.filter(o => o.status === filterStatus.value)
})

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    wait_ship: '待发货',
    shipped: '已发货',
    finished: '已完成',
    closed: '已关闭',
    unknown: '未知',
  }
  return map[status] || status
}

const statusType = (status: string): 'warning' | 'success' | 'info' | 'danger' => {
  const map: Record<string, 'warning' | 'success' | 'info' | 'danger'> = {
    wait_ship: 'warning',
    shipped: 'success',
    finished: 'info',
    closed: 'danger',
    unknown: 'info',
  }
  return map[status] || 'info'
}

async function handleRefresh() {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('请先登录闲鱼')
    return
  }
  refreshing.value = true
  try {
    await orderStore.refreshOrders()
    ElMessage.success('订单已刷新')
  } finally {
    refreshing.value = false
  }
}

async function handleDeliver(order: XianyuOrder) {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('请先登录闲鱼')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要确认发货吗？订单号：${order.orderId}`,
      '确认发货',
      { type: 'info' }
    )
    const success = await orderStore.deliverOrder(order.orderId)
    if (success) {
      ElMessage.success('已确认发货')
    }
  } catch {
    // cancelled
  }
}

function formatTime(time: string) {
  if (!time) return '--'
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="order-tab">
    <div class="tab-header">
      <el-select
        v-model="filterStatus"
        placeholder="按状态筛选"
        clearable
        style="width: 150px"
      >
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-button :loading="refreshing" @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
        刷新订单
      </el-button>
    </div>

    <el-table :data="filteredOrders" stripe style="width: 100%" v-loading="orderStore.loading">
      <el-table-column label="订单号" width="180">
        <template #default="{ row }">
          <span class="order-id">{{ row.orderId }}</span>
        </template>
      </el-table-column>

      <el-table-column label="商品" min-width="200">
        <template #default="{ row }">
          <div class="order-item-info">
            <el-image
              v-if="row.itemImage"
              :src="row.itemImage"
              fit="cover"
              style="width: 40px; height: 40px; border-radius: 6px; flex-shrink: 0"
            />
            <div class="order-item-text">
              <span class="order-item-title">{{ row.itemTitle }}</span>
              <span class="order-item-buyer">买家: {{ row.buyerNick }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="金额" width="100" align="center">
        <template #default="{ row }">
          <span class="order-fee">¥{{ row.totalFee }}</span>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType(row.status)">
            {{ statusLabel(row.status) || row.statusText }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="时间" width="120" align="center">
        <template #default="{ row }">
          <span class="order-time">{{ formatTime(row.createTime) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button
            v-if="(row as XianyuOrder).status === 'wait_ship'"
            link
            type="primary"
            @click="handleDeliver(row as XianyuOrder)"
          >
            <el-icon><Ship /></el-icon>
            发货
          </el-button>
          <span v-else class="text-muted">--</span>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="filteredOrders.length === 0 && !orderStore.loading" description="暂无订单" />
  </div>
</template>

<style scoped>
.order-tab {
  padding: 4px 0;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.order-id {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-secondary);
}

.order-item-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.order-item-title {
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-item-buyer {
  font-size: 12px;
  color: var(--text-muted);
}

.order-fee {
  font-weight: 600;
  color: var(--color-danger);
}

.order-time {
  font-size: 13px;
  color: var(--text-secondary);
}

.text-muted {
  color: var(--text-muted);
}
</style>
