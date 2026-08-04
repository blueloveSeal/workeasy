<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Upload, Picture } from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadRawFile } from 'element-plus'
import { useXianyuProductStore } from '@/stores/xianyu-product'
import { useXianyuAuthStore } from '@/stores/xianyu-auth'
import type { XianyuProduct } from '@/types/xianyu'

const productStore = useXianyuProductStore()
const authStore = useXianyuAuthStore()

const drawerVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const formRef = ref<FormInstance>()
const uploading = ref(false)

interface ProductFormData {
  title: string
  description: string
  price: number
  images: string[]
  imageIds: string[]
  deliveryType: 'manual' | 'auto'
  deliveryContent: string
  status: 'draft' | 'published' | 'offline'
}

const defaultForm = (): ProductFormData => ({
  title: '',
  description: '',
  price: 0,
  images: [],
  imageIds: [],
  deliveryType: 'auto',
  deliveryContent: '',
  status: 'draft',
})

const productForm = reactive<ProductFormData>(defaultForm())

const formRules: FormRules = {
  title: [{ required: true, message: '请输入商品标题', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    offline: '已下架',
  }
  return map[status] || status
}

const statusType = (status: string): 'info' | 'success' | 'warning' => {
  const map: Record<string, 'info' | 'success' | 'warning'> = {
    draft: 'info',
    published: 'success',
    offline: 'warning',
  }
  return map[status] || 'info'
}

function openDrawer(product?: XianyuProduct) {
  if (product) {
    isEditing.value = true
    editingId.value = product.id
    Object.assign(productForm, {
      title: product.title,
      description: product.description,
      price: product.price,
      images: [...product.images],
      imageIds: [...product.imageIds],
      deliveryType: product.deliveryType,
      deliveryContent: product.deliveryContent,
      status: product.status,
    })
  } else {
    isEditing.value = false
    editingId.value = null
    Object.assign(productForm, defaultForm())
  }
  drawerVisible.value = true
}

async function handleImageUpload(file: UploadRawFile) {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('请先登录闲鱼')
    return false
  }

  const validTypes = ['image/png', 'image/jpeg', 'image/webp']
  if (!validTypes.includes(file.type)) {
    ElMessage.error('仅支持 PNG、JPEG、WebP 格式')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }

  uploading.value = true
  try {
    const result = await productStore.uploadImage(file)
    if (result) {
      productForm.images.push(URL.createObjectURL(file))
      productForm.imageIds.push(result.id)
      ElMessage.success('图片上传成功')
    }
  } finally {
    uploading.value = false
  }
  return false
}

function handleImageRemove(index: number) {
  productForm.images.splice(index, 1)
  productForm.imageIds.splice(index, 1)
}

async function handleSave() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (isEditing.value && editingId.value) {
      await productStore.update(editingId.value, {
        title: productForm.title,
        description: productForm.description,
        price: productForm.price,
        images: [...productForm.images],
        imageIds: [...productForm.imageIds],
        deliveryType: productForm.deliveryType,
        deliveryContent: productForm.deliveryContent,
      })
      ElMessage.success('商品已更新')
    } else {
      await productStore.add({
        title: productForm.title,
        description: productForm.description,
        price: productForm.price,
        images: [...productForm.images],
        imageIds: [...productForm.imageIds],
        deliveryType: productForm.deliveryType,
        deliveryContent: productForm.deliveryContent,
        status: 'draft',
      })
      ElMessage.success('商品已创建')
    }
    drawerVisible.value = false
  })
}

async function handlePublish(product: XianyuProduct) {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('请先登录闲鱼')
    return
  }
  if (product.imageIds.length === 0) {
    ElMessage.warning('请先上传商品图片')
    return
  }

  try {
    await ElMessageBox.confirm('确定要发布该商品到闲鱼吗？', '发布确认', { type: 'info' })
    const itemId = await productStore.publishToXianyu(product)
    if (itemId) {
      ElMessage.success(`商品已发布，闲鱼ID: ${itemId}`)
    }
  } catch {
    // cancelled
  }
}

async function handleDelete(id: string) {
  await productStore.remove(id)
  ElMessage.success('商品已删除')
}
</script>

<template>
  <div class="product-tab">
    <div class="tab-header">
      <el-button type="primary" @click="openDrawer()">
        <el-icon><Plus /></el-icon>
        添加商品
      </el-button>
    </div>

    <el-table :data="productStore.products" stripe style="width: 100%">
      <el-table-column label="图片" width="80">
        <template #default="{ row }">
          <el-image
            v-if="row.images && row.images.length > 0"
            :src="row.images[0]"
            :preview-src-list="row.images"
            fit="cover"
            style="width: 50px; height: 50px; border-radius: 8px"
          />
          <el-icon v-else style="font-size: 24px; color: var(--text-muted)"><Picture /></el-icon>
        </template>
      </el-table-column>

      <el-table-column label="标题" min-width="200">
        <template #default="{ row }">
          <span class="product-title">{{ row.title }}</span>
        </template>
      </el-table-column>

      <el-table-column label="价格" width="100" align="center">
        <template #default="{ row }">
          <span class="product-price">¥{{ row.price }}</span>
        </template>
      </el-table-column>

      <el-table-column label="发货方式" width="100" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.deliveryType === 'auto' ? 'success' : 'info'">
            {{ row.deliveryType === 'auto' ? '自动' : '手动' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType(row.status)">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDrawer(row as XianyuProduct)">编辑</el-button>
          <el-button
            v-if="(row as XianyuProduct).status === 'draft'"
            link
            type="success"
            @click="handlePublish(row as XianyuProduct)"
          >
            发布
          </el-button>
          <el-popconfirm title="确定要删除吗？" @confirm="handleDelete((row as XianyuProduct).id)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="productStore.products.length === 0" description="暂无商品" />

    <!-- 商品编辑 Drawer -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEditing ? '编辑商品' : '添加商品'"
      direction="rtl"
      size="520px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="productForm"
        :rules="formRules"
        label-position="top"
        class="product-form"
      >
        <el-form-item label="商品标题" prop="title">
          <el-input v-model="productForm.title" placeholder="请输入商品标题" maxlength="30" show-word-limit />
        </el-form-item>

        <el-form-item label="商品描述" prop="description">
          <el-input
            v-model="productForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入商品描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="价格（元）" prop="price">
          <el-input-number
            v-model="productForm.price"
            :min="0"
            :precision="2"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="商品图片">
          <div class="image-upload-area">
            <div class="image-preview-list">
              <div
                v-for="(img, idx) in productForm.images"
                :key="idx"
                class="image-preview-item"
              >
                <el-image :src="img" fit="cover" style="width: 80px; height: 80px; border-radius: 8px" />
                <el-button
                  class="image-remove-btn"
                  type="danger"
                  size="small"
                  circle
                  @click="handleImageRemove(idx)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <el-upload
              v-if="productForm.images.length < 9"
              :show-file-list="false"
              :before-upload="handleImageUpload"
              accept="image/png,image/jpeg,image/webp"
            >
              <el-button :loading="uploading">
                <el-icon><Upload /></el-icon>
                {{ uploading ? '上传中...' : '上传图片' }}
              </el-button>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="发货方式">
          <el-radio-group v-model="productForm.deliveryType">
            <el-radio value="auto">自动发货</el-radio>
            <el-radio value="manual">手动发货</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="productForm.deliveryType === 'auto'"
          label="发货内容（卡密/网盘地址）"
          prop="deliveryContent"
        >
          <el-input
            v-model="productForm.deliveryContent"
            type="textarea"
            :rows="3"
            placeholder="买家付款后自动发送此内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">
          {{ isEditing ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.product-tab {
  padding: 4px 0;
}

.tab-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.product-title {
  font-weight: 500;
  color: var(--text-primary);
}

.product-price {
  font-weight: 600;
  color: var(--color-danger);
}

.product-form {
  padding: 0 4px;
}

.image-upload-area {
  width: 100%;
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.image-preview-item {
  position: relative;
}

.image-remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  font-size: 12px;
}
</style>
