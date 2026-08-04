<script setup lang="ts">
import {
  HomeFilled,
  Grid,
  List,
  Notebook,
  Star,
  Setting,
  ShoppingCart,
} from '@element-plus/icons-vue'
import WebmejiPet from '@/components/common/WebmejiPet.vue'

const menuItems = [
  { index: '/', title: '首页', icon: HomeFilled },
  { index: '/launcher', title: '启动器', icon: Grid },
  { index: '/tasks', title: '任务', icon: List },
  { index: '/notes', title: '笔记', icon: Notebook },
  { index: '/bookmarks', title: '书签', icon: Star },
  { index: '/xianyu', title: '闲鱼', icon: ShoppingCart },
  { index: '/settings', title: '设置', icon: Setting },
]
</script>

<template>
  <div class="main-layout">
    <header class="workspace-nav">
      <div class="nav-inner">
        <div class="brand">
          <span class="logo-icon">W</span>
          <div class="brand-copy">
            <span class="logo-text">WorkEasy</span>
            <span class="logo-caption"></span>
          </div>
        </div>
        <nav class="nav-scroll" aria-label="主要导航">
          <el-menu
            :default-active="$route.path"
            mode="horizontal"
            router
            class="workspace-menu"
          >
            <el-menu-item
              v-for="item in menuItems"
              :key="item.index"
              :index="item.index"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <template #title>{{ item.title }}</template>
            </el-menu-item>
          </el-menu>
        </nav>
      </div>
    </header>

    <main class="main-container">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <WebmejiPet />
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.workspace-nav {
  flex: 0 0 auto;
  background: var(--sidebar-bg);
  backdrop-filter: blur(20px) saturate(1.1);
  -webkit-backdrop-filter: blur(20px) saturate(1.1);
  border-bottom: 1px solid var(--border-color);
  z-index: 20;
}

.nav-inner {
  width: min(100% - 40px, 1380px);
  height: 72px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 34px;
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  flex: 0 0 auto;
}

.brand-copy {
  display: flex;
  flex-direction: column;
}

.logo-text {
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 750;
  letter-spacing: -0.04em;
}

.logo-icon {
  width: 34px;
  height: 34px;
  border-radius: 11px 11px 11px 4px;
  display: grid;
  place-items: center;
  color: #fff8f3;
  background: var(--color-primary);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--color-primary) 24%, transparent);
  font-size: 16px;
  font-weight: 800;
}

.logo-caption {
  color: var(--text-muted);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.nav-scroll {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.nav-scroll::-webkit-scrollbar {
  display: none;
}

.workspace-menu {
  width: max-content;
  min-width: 100%;
  height: 72px;
  border-bottom: 0;
  background: transparent;
  gap: 4px;
}

.workspace-menu .el-menu-item {
  height: 72px;
  border-bottom: 0 !important;
  padding: 0 16px;
  color: var(--text-secondary);
  transition: color 220ms ease, background-color 220ms ease;
}

.workspace-menu .el-menu-item::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--color-primary);
  transform: scaleX(0);
  transition: transform 220ms ease;
}

.workspace-menu .el-menu-item:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--color-primary) 6%, transparent);
}

.workspace-menu .el-menu-item.is-active {
  color: var(--color-primary);
  background: transparent;
  font-weight: 650;
}

.workspace-menu .el-menu-item.is-active::after {
  transform: scaleX(1);
}

.main-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: transparent;
}

@media (max-width: 760px) {
  .nav-inner {
    width: calc(100% - 24px);
    height: 64px;
    gap: 12px;
  }

  .brand-copy {
    display: none;
  }

  .workspace-menu {
    height: 64px;
    justify-content: flex-end;
  }

  .workspace-menu .el-menu-item {
    height: 64px;
    padding: 0 11px;
  }

  .workspace-menu .el-menu-item span {
    display: none;
  }
}
</style>
