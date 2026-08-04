import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/components/layout/MainLayout.vue'),
      children: [
        { path: '', name: 'Dashboard', component: () => import('@/views/Dashboard.vue') },
        { path: 'tasks', name: 'Tasks', component: () => import('@/views/tasks/TaskPage.vue') },
        { path: 'notes', name: 'Notes', component: () => import('@/views/notes/NotePage.vue') },
        { path: 'bookmarks', name: 'Bookmarks', component: () => import('@/views/bookmarks/BookmarkPage.vue') },
        { path: 'launcher', name: 'Launcher', component: () => import('@/views/launcher/LauncherPage.vue') },
        { path: 'settings', name: 'Settings', component: () => import('@/views/settings/SettingsPage.vue') },
        { path: 'xianyu', name: 'Xianyu', component: () => import('@/views/xianyu/XianyuPage.vue') },
      ],
    },
  ],
})

export default router
