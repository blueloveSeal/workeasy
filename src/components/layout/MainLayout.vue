<script setup lang="ts">
import { ref } from 'vue'
import {
  HomeFilled,
  Grid,
  List,
  Notebook,
  Calendar,
  Star,
  Setting,
  Expand,
  Fold,
} from '@element-plus/icons-vue'

const isCollapsed = ref(false)

const menuItems = [
  { index: '/', title: '首页', icon: HomeFilled },
  { index: '/launcher', title: '启动器', icon: Grid },
  { index: '/tasks', title: '任务', icon: List },
  { index: '/notes', title: '笔记', icon: Notebook },
  { index: '/calendar', title: '日历', icon: Calendar },
  { index: '/bookmarks', title: '书签', icon: Star },
  { index: '/settings', title: '设置', icon: Setting },
]
</script>

<template>
  <div class="main-layout">
    <el-aside :width="isCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="sidebar-header">
        <span v-show="!isCollapsed" class="logo-text">WorkEasy</span>
        <span v-show="isCollapsed" class="logo-icon">W</span>
      </div>
      <el-menu
        :default-active="$route.path"
        :collapse="isCollapsed"
        router
        class="sidebar-menu"
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
      <div class="sidebar-toggle" @click="isCollapsed = !isCollapsed">
        <el-icon :size="16">
          <component :is="isCollapsed ? Expand : Fold" />
        </el-icon>
      </div>
    </el-aside>

    <div class="main-container">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  position: relative;
  z-index: 1;
}

.sidebar {
  background: transparent;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color);
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-icon {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 8px;
}

.sidebar-menu .el-menu-item {
  border-radius: 8px;
  margin-bottom: 4px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.sidebar-menu .el-menu-item:hover {
  background: var(--bg-input);
  color: var(--color-primary);
}

.sidebar-menu .el-menu-item.is-active {
  background: var(--color-primary);
  color: #fff;
}

.sidebar-toggle {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  border-top: 1px solid var(--border-color);
  transition: color 0.2s ease;
}

.sidebar-toggle:hover {
  color: var(--color-primary);
}

.main-container {
  flex: 1;
  overflow: hidden;
  background: transparent;
}
</style>
