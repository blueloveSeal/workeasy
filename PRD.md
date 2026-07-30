# WorkEasy - 个人工作台 PRD

> 本文档是 WorkEasy 项目的完整需求规格说明，供 AI 开发者据此进行开发。
> 项目路径：`C:\workspace\learning\workeasy`

---

## 1. 项目概述

WorkEasy 是一个纯前端的个人工作台应用，面向桌面浏览器使用场景。采用年轻化卡片式设计风格，提供应用启动器、任务管理、笔记、日历、书签等核心模块，支持应用级换肤（含视频/GIF动态背景）和仪表盘+详情页的交互模式。所有数据存储在浏览器 IndexedDB 中，无需后端服务。

### 1.1 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | ^3.5 | 核心框架 |
| TypeScript | ^5.x | 类型系统 |
| Vite | ^6.x | 构建工具 |
| Element Plus | ^2.9 | UI 组件库 |
| Pinia | ^2.x | 状态管理 |
| Vue Router | ^4.x | 路由 |
| Dexie.js | ^4.x | IndexedDB 封装 |
| @vueuse/core | ^12.x | 组合式工具库 |
| dayjs | ^1.x | 日期处理 |
| vuedraggable | ^5 (vue.draggable.plus) | 拖拽排序 |
| md-editor-v3 | ^5.x | Markdown 编辑器 |
| unplugin-auto-import | latest | 自动导入 API |
| unplugin-vue-components | latest | 自动导入组件 |
| sass | ^1.x | 样式预处理 |

### 1.2 项目初始化命令

```bash
npm create vite@latest workeasy -- --template vue-ts
cd workeasy
npm install element-plus @element-plus/icons-vue pinia vue-router dexie @vueuse/core dayjs vuedraggable md-editor-v3
npm install -D sass unplugin-auto-import unplugin-vue-components
```

---

## 2. 目录结构

```
workeasy/
├── public/
│   └── themes/              # 预置主题资源
├── src/
│   ├── assets/
│   │   ├── styles/
│   │   │   ├── themes/      # 主题变量文件
│   │   │   │   ├── light.scss
│   │   │   │   └── dark.scss
│   │   │   ├── global.scss   # 全局样式
│   │   │   ├── variables.scss # SCSS 变量
│   │   │   └── transition.scss # 过渡动画
│   │   └── images/          # 静态图片资源
│   ├── components/
│   │   ├── common/          # 通用组件
│   │   │   ├── AppCard.vue       # 卡片容器
│   │   │   ├── SearchDialog.vue  # 全局搜索弹窗
│   │   │   └── ThemeSwitcher.vue # 主题切换器
│   │   ├── dashboard/       # 仪表盘组件
│   │   │   ├── TopBar.vue        # 顶部信息栏
│   │   │   ├── LauncherGrid.vue  # 应用启动器网格
│   │   │   ├── TaskSummary.vue   # 任务摘要卡片
│   │   │   ├── NoteSummary.vue   # 笔记摘要卡片
│   │   │   ├── CalendarSummary.vue # 日程摘要卡片
│   │   │   └── BookmarkSummary.vue # 书签摘要卡片
│   │   └── layout/
│   │       ├── MainLayout.vue    # 主布局（含导航）
│   │       └── BackgroundLayer.vue # 动态背景层
│   ├── composables/
│   │   ├── useTheme.ts      # 主题切换逻辑
│   │   ├── useSearch.ts     # 全局搜索逻辑
│   │   ├── useLauncher.ts   # 启动器逻辑
│   │   └── useGreeting.ts   # 问候语逻辑
│   ├── db/
│   │   ├── index.ts         # Dexie 数据库实例
│   │   └── schemas.ts       # 表结构定义
│   ├── router/
│   │   └── index.ts         # 路由配置
│   ├── stores/
│   │   ├── theme.ts         # 主题状态
│   │   ├── task.ts          # 任务状态
│   │   ├── note.ts          # 笔记状态
│   │   ├── calendar.ts      # 日程状态
│   │   ├── bookmark.ts      # 书签状态
│   │   ├── launcher.ts      # 启动器状态
│   │   └── search.ts        # 搜索状态
│   ├── types/
│   │   ├── task.ts
│   │   ├── note.ts
│   │   ├── calendar.ts
│   │   ├── bookmark.ts
│   │   ├── launcher.ts
│   │   └── theme.ts
│   ├── views/
│   │   ├── Dashboard.vue         # 首页仪表盘
│   │   ├── tasks/
│   │   │   └── TaskPage.vue      # 任务管理详情页
│   │   ├── notes/
│   │   │   └── NotePage.vue      # 笔记详情页
│   │   ├── calendar/
│   │   │   └── CalendarPage.vue  # 日历详情页
│   │   ├── bookmarks/
│   │   │   └── BookmarkPage.vue  # 书签详情页
│   │   ├── launcher/
│   │   │   └── LauncherPage.vue  # 启动器管理页（编辑图标）
│   │   └── settings/
│   │       └── SettingsPage.vue  # 设置页（主题管理等）
│   ├── App.vue
│   └── main.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. 功能模块详细设计

### 3.1 顶部信息栏 (TopBar)

**位置**：固定在页面最顶部，始终可见。

**内容**：
- 左侧：当前时间（HH:mm 格式，每秒更新）、日期（YYYY年MM月DD日 星期X）
- 中间：全局搜索入口（点击弹出搜索对话框，快捷键 Ctrl+K）
- 右侧：主题切换按钮（亮/暗切换）、设置入口

**问候语逻辑**：根据时间段显示不同问候语，显示在时间下方，字号较小：
- 06:00-11:59 → "早上好"
- 12:00-13:59 → "中午好"
- 14:00-17:59 → "下午好"
- 18:00-22:59 → "晚上好"
- 23:00-05:59 → "夜深了，注意休息"

### 3.2 全局搜索 (SearchDialog)

**触发方式**：点击 TopBar 搜索入口 或 Ctrl+K 快捷键。

**交互**：
- 弹出居中对话框（Element Plus Dialog），内含一个输入框
- 输入时实时搜索（debounce 300ms），搜索范围包括：任务标题/描述、笔记标题/内容、书签标题/URL
- 搜索结果按模块分组展示，每组最多显示5条
- 点击结果项：跳转到对应模块的详情页，若支持定位到具体条目
- 无结果时显示 "没有找到相关内容"

### 3.3 应用启动器 (App Launcher)

#### 3.3.1 仪表盘展示 (LauncherGrid)

- 以网格形式展示用户配置的应用图标（每行4-6个，响应式）
- 每个图标包含：图标图片 + 应用名称
- 点击图标 → 通过 `window.location.href = protocolUrl` 唤起本地应用
- 支持的协议示例：
  - VS Code: `vscode://`
  - Steam: `steam://open/steam`
  - 微信: `weixin://`
  - 自定义: 用户输入任意 protocol URL
- 图标样式：圆角方形，hover 时轻微放大 + 发光效果

#### 3.3.2 管理页面 (LauncherPage)

- 可拖拽排序（vuedraggable）
- 添加应用：弹窗表单，字段包括：
  - 应用名称（必填）
  - Protocol URL（必填，如 `vscode://`）
  - 图标（可选，支持上传本地图片或输入 emoji/文字首字母作为默认图标）
  - 分类标签（可选）
- 编辑应用：点击图标进入编辑
- 删除应用：右键菜单或编辑模式下的删除按钮
- 预置常用应用模板：VS Code、Steam、微信、QQ、Chrome、Finder 等（用户可一键添加）

### 3.4 任务管理 (Task Manager)

#### 3.4.1 数据模型

```typescript
interface Task {
  id: string              // nanoid 生成
  title: string           // 任务标题
  description?: string    // 任务描述（支持 Markdown）
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string        // ISO 日期字符串
  tags: string[]          // 标签
  createdAt: string       // ISO 时间戳
  updatedAt: string       // ISO 时间戳
  completedAt?: string    // 完成时间
}
```

#### 3.4.2 仪表盘摘要卡片 (TaskSummary)

- 显示：今日待办数量、已逾期数量
- 列出今日到期的前3条任务（标题+优先级色块）
- 底部 "查看全部" 链接 → 跳转任务详情页

#### 3.4.3 任务详情页 (TaskPage)

- **视图切换**：列表视图 / 看板视图（按 status 分列）
- **列表视图**：
  - 顶部筛选栏：状态筛选、优先级筛选、标签筛选、搜索
  - 任务列表：每行显示 标题、优先级标签、截止日期、状态
  - 支持行内快速切换状态（点击 checkbox 标记完成）
  - 排序：按截止日期 / 优先级 / 创建时间
- **看板视图**：
  - 三列：待办 / 进行中 / 已完成
  - 卡片可拖拽跨列移动（自动更新 status）
- **新建/编辑任务**：右侧抽屉（Element Plus Drawer），表单包含所有字段
- **批量操作**：多选 → 批量删除 / 批量修改状态 / 批量修改优先级

### 3.5 笔记 (Notes)

#### 3.5.1 数据模型

```typescript
interface Note {
  id: string
  title: string
  content: string         // Markdown 内容
  category?: string       // 分类
  tags: string[]
  isPinned: boolean       // 是否置顶
  createdAt: string
  updatedAt: string
}
```

#### 3.5.2 仪表盘摘要卡片 (NoteSummary)

- 显示：笔记总数、最近编辑的笔记
- 列出最近更新的3条笔记（标题+更新时间）
- 底部 "查看全部" → 跳转笔记详情页

#### 3.5.3 笔记详情页 (NotePage)

- **左侧**：笔记列表（支持搜索、按分类筛选、置顶笔记排在前面）
- **右侧**：Markdown 编辑器（md-editor-v3）
  - 实时预览
  - 工具栏：加粗、斜体、标题、列表、代码块、链接等
- **新建笔记**：点击 "+" 按钮，自动聚焦到编辑器
- **编辑自动保存**：debounce 2秒自动保存到 IndexedDB
- **导出**：支持导出为 Markdown 文件（.md）

### 3.6 日历/日程 (Calendar)

#### 3.6.1 数据模型

```typescript
interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string       // ISO 日期时间
  endTime: string         // ISO 日期时间
  color: string           // 事件颜色（hex）
  isAllDay: boolean       // 是否全天事件
  reminder?: number       // 提前提醒分钟数，null=不提醒
  createdAt: string
}
```

#### 3.6.2 仪表盘摘要卡片 (CalendarSummary)

- 显示：今日日程数量
- 列出今日的事件（时间 + 标题），按时间排序
- 底部 "查看全部" → 跳转日历详情页

#### 3.6.3 日历详情页 (CalendarPage)

- **月视图**（默认）：
  - 标准月历网格
  - 每个日期格子内显示当日事件（彩色小圆点 + 事件标题缩略）
  - 点击日期 → 右侧面板显示该日详情
  - 点击空白日期 → 弹出新建事件对话框（自动填充日期）
- **周视图**：
  - 7列时间轴，显示每日的时间段事件块
- **日视图**：
  - 单日时间轴（06:00-24:00），事件按时间块展示
- **事件管理**：
  - 新建/编辑事件弹窗：标题、描述、开始时间、结束时间、颜色选择、全天事件开关、提醒设置
  - 删除事件：确认弹窗
- **提醒**：使用浏览器 Notification API，每分钟检查一次是否有即将开始的事件

### 3.7 书签 (Bookmarks)

#### 3.7.1 数据模型

```typescript
interface Bookmark {
  id: string
  title: string
  url: string
  favicon?: string        // 网站图标 URL
  category?: string       // 分类
  tags: string[]
  createdAt: string
}
```

#### 3.7.2 仪表盘摘要卡片 (BookmarkSummary)

- 显示：书签总数
- 列出最近添加的3条书签（标题+域名）
- 底部 "查看全部" → 跳转书签详情页

#### 3.7.3 书签详情页 (BookmarkPage)

- **卡片网格展示**：每个书签一张卡片（favicon + 标题 + 域名）
- 点击卡片 → 新标签页打开 URL
- **分类筛选**：顶部分类 Tab
- **搜索**：按标题/URL 搜索
- **新建书签**：
  - 手动输入：标题 + URL + 分类
  - 粘贴 URL 自动尝试获取标题（通过 fetch 目标页面提取 `<title>`，若 CORS 失败则用域名作为标题）
- **编辑/删除**：卡片右键菜单或 hover 显示操作按钮

---

## 4. 主题与换肤系统

### 4.1 内置主题

提供两套基础主题，灵感来自 VS Code：

**Light 主题（默认）**：
- 背景：#F7F8FA（浅灰白）
- 卡片背景：#FFFFFF
- 主色调：#6366F1（年轻紫色）
- 强调色：#EC4899（粉色）、#10B981（绿色）
- 文字：#1E293B（深灰）
- 卡片阴影：柔和投影

**Dark 主题**：
- 背景：#1E1E2E（深蓝黑，类 VS Code Dark+）
- 卡片背景：#2D2D3F
- 主色调：#818CF8（亮紫）
- 强调色：#F472B6（亮粉）、#34D399（亮绿）
- 文字：#E2E8F0（浅灰白）
- 卡片阴影：微弱发光边框

### 4.2 自定义动态背景

**功能入口**：设置页 → 背景设置

**支持格式**：
- MP4 视频文件
- GIF 动图
- 静态图片（PNG/JPG）
- 纯色

**实现方式**：
- 上传文件后，通过 `URL.createObjectURL()` 生成本地 URL
- 视频/GIF：使用 `<video>` 或 `<img>` 标签全屏铺满作为背景层（`BackgroundLayer` 组件）
- 视频设置：`autoplay loop muted playsinline`，`object-fit: cover`
- 在所有内容之下（z-index 最低），加一层半透明遮罩（opacity 可调 0-80%）确保前景内容可读性

**持久化**：
- 将 File 对象转为 Blob 存入 IndexedDB（而非 localStorage，因为有大小限制）
- 主题设置（类型、遮罩透明度等）存入 Pinia + IndexedDB

### 4.3 主题切换实现

```typescript
// 主题切换核心逻辑
// 1. 在 <html> 上切换 data-theme="light|dark" 属性
// 2. CSS 变量根据 data-theme 切换值
// 3. 动态背景层独立于主题变量，始终在最底层

// CSS 变量示例
:root[data-theme="light"] {
  --bg-primary: #F7F8FA;
  --bg-card: #FFFFFF;
  --color-primary: #6366F1;
  --color-accent: #EC4899;
  --text-primary: #1E293B;
  --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.06);
}

:root[data-theme="dark"] {
  --bg-primary: #1E1E2E;
  --bg-card: #2D2D3F;
  --color-primary: #818CF8;
  --color-accent: #F472B6;
  --text-primary: #E2E8F0;
  --shadow-card: 0 0 20px rgba(129, 140, 248, 0.1);
}
```

---

## 5. 路由设计

```typescript
const routes = [
  {
    path: '/',
    component: () => import('@/components/layout/MainLayout.vue'),
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/views/Dashboard.vue') },
      { path: 'tasks', name: 'Tasks', component: () => import('@/views/tasks/TaskPage.vue') },
      { path: 'notes', name: 'Notes', component: () => import('@/views/notes/NotePage.vue') },
      { path: 'calendar', name: 'Calendar', component: () => import('@/views/calendar/CalendarPage.vue') },
      { path: 'bookmarks', name: 'Bookmarks', component: () => import('@/views/bookmarks/BookmarkPage.vue') },
      { path: 'launcher', name: 'Launcher', component: () => import('@/views/launcher/LauncherPage.vue') },
      { path: 'settings', name: 'Settings', component: () => import('@/views/settings/SettingsPage.vue') },
    ]
  }
]
```

---

## 6. 数据库设计 (Dexie.js)

```typescript
import Dexie, { type Table } from 'dexie'

export class WorkEasyDB extends Dexie {
  tasks!: Table<Task, string>
  notes!: Table<Note, string>
  events!: Table<CalendarEvent, string>
  bookmarks!: Table<Bookmark, string>
  launcherItems!: Table<LauncherItem, string>
  themeSettings!: Table<ThemeSetting, string>
  customBackgrounds!: Table<CustomBackground, string>

  constructor() {
    super('WorkEasyDB')
    this.version(1).stores({
      tasks: 'id, status, priority, dueDate, *tags, createdAt',
      notes: 'id, category, isPinned, *tags, updatedAt',
      events: 'id, startTime, endTime, createdAt',
      bookmarks: 'id, category, *tags, createdAt',
      launcherItems: 'id, order',
      themeSettings: 'id',
      customBackgrounds: 'id, type'
    })
  }
}

export const db = new WorkEasyDB()
```

---

## 7. 页面布局规范

### 7.1 仪表盘 (Dashboard)

```
┌──────────────────────────────────────────────────┐
│  TopBar: 时间/日期 | 搜索(Ctrl+K) | 主题 | 设置   │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │         应用启动器 (LauncherGrid)           │  │
│  │   [VS Code]  [Steam]  [微信]  [Chrome] ... │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  任务摘要     │  │  日程摘要     │             │
│  │  待办: 5     │  │  今日: 3     │             │
│  │  逾期: 2     │  │  10:00 会议  │             │
│  │  [查看全部]   │  │  [查看全部]   │             │
│  └──────────────┘  └──────────────┘             │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐             │
│  │  笔记摘要     │  │  书签摘要     │             │
│  │  共 12 篇    │  │  共 28 条    │             │
│  │  最近编辑...  │  │  最近添加...  │             │
│  │  [查看全部]   │  │  [查看全部]   │             │
│  └──────────────┘  └──────────────┘             │
│                                                  │
└──────────────────────────────────────────────────┘
```

### 7.2 导航

- 使用 Element Plus 的 `el-menu` 作为侧边栏导航
- 侧边栏可折叠（展开宽度 220px，折叠宽度 64px）
- 导航项：首页、应用启动器、任务、笔记、日历、书签、设置
- 每个导航项配一个 Element Plus 图标

### 7.3 卡片样式规范

- 圆角：12px
- 内边距：20px
- 间距：卡片之间 16px
- 阴影：light 模式用柔和投影，dark 模式用微弱发光边框
- Hover 效果：轻微上浮（translateY(-2px)）+ 阴影加深
- 过渡动画：all 0.3s ease

---

## 8. UI 设计风格指南

### 8.1 色彩

- **主色**：紫色系 (#6366F1) — 年轻、有活力
- **强调色**：粉色 (#EC4899) 用于高亮、提醒
- **成功色**：翠绿 (#10B981)
- **警告色**：琥珀 (#F59E0B)
- **危险色**：玫红 (#EF4444)
- **渐变色**：卡片背景可选用微妙的紫→粉渐变（仅 dark 模式下）

### 8.2 字体

- 系统字体栈：`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`
- 标题字号：20px / 16px / 14px 三级
- 正文字号：14px
- 辅助文字：12px，opacity 0.7

### 8.3 动画

- 页面切换：fade + slide（300ms）
- 卡片出现：stagger 动画（每个卡片依次出现，间隔 50ms）
- 按钮点击：scale(0.95) 回弹
- 主题切换：全局颜色 0.4s 平滑过渡

### 8.4 空状态

- 每个模块在无数据时显示插画风格的空状态提示（使用 Element Plus 的 `el-empty` 组件，配自定义文案）
- 示例：任务模块 → "还没有任务，享受清闲吧"；笔记模块 → "空白页是最好的起点"

---

## 9. 设置页面

### 9.1 功能清单

- **主题设置**：
  - 亮色/暗色切换（带预览效果）
  - 自定义背景上传（支持拖拽上传）
  - 背景遮罩透明度滑块（0-80%）
  - 清除自定义背景
- **启动器预置**：一键添加常用应用模板
- **数据管理**：
  - 导出全部数据为 JSON 文件
  - 导入 JSON 数据文件
  - 清除所有数据（二次确认）
- **关于**：版本号、项目信息

---

## 10. 开发优先级

按以下顺序开发，每完成一个阶段应确保项目可运行：

1. **P0 - 基础骨架**：项目初始化、路由配置、布局组件、主题系统（亮/暗切换）、CSS 变量体系
2. **P1 - 仪表盘 + 启动器**：TopBar、仪表盘页面布局、应用启动器（展示+管理）、全局搜索框架
3. **P2 - 任务管理**：数据模型、CRUD、列表视图、看板视图、仪表盘摘要卡片
4. **P3 - 笔记**：数据模型、Markdown 编辑器、列表+编辑双栏、自动保存、仪表盘摘要卡片
5. **P4 - 日历**：数据模型、月/周/日视图、事件管理、浏览器通知提醒、仪表盘摘要卡片
6. **P5 - 书签**：数据模型、卡片网格、分类管理、仪表盘摘要卡片
7. **P6 - 完善**：自定义动态背景、数据导入导出、全局搜索完善、动画打磨、空状态

---

## 11. 非功能性要求

- **性能**：首屏加载 < 2s（生产构建），路由懒加载，组件按需导入
- **兼容性**：仅要求最新 Chrome/Edge，无需兼容 IE 或旧版浏览器
- **响应式**：仅桌面端，最小宽度 1024px
- **无障碍**：所有交互支持键盘操作（Tab 导航、Enter 触发）
- **代码规范**：ESLint + Prettier，组件使用 `<script setup lang="ts">` 语法

---

## 12. 验收标准与验收流程

> 每个开发阶段完成后，必须逐项通过以下验收标准，才能进入下一阶段。
> 验收方式：在 Chrome 浏览器中运行 `npm run dev`，按验收步骤手动操作验证。

### 12.1 P0 - 基础骨架 验收

| # | 验收条件 | 验收步骤 | 预期结果 |
|---|---------|---------|---------|
| 1 | 项目可正常启动 | 执行 `npm run dev` | 浏览器打开 localhost 端口，页面正常渲染，无控制台报错 |
| 2 | TypeScript 无编译错误 | 执行 `npx vue-tsc --noEmit` | 命令退出码为 0，无类型错误输出 |
| 3 | 生产构建成功 | 执行 `npm run build` | `dist/` 目录生成，无构建报错 |
| 4 | 路由可访问 | 依次访问 `/`、`/tasks`、`/notes`、`/calendar`、`/bookmarks`、`/launcher`、`/settings` | 每个路由显示对应页面占位内容，无白屏 |
| 5 | 侧边栏导航 | 点击侧边栏各导航项 | 页面切换到对应路由，导航项高亮状态正确 |
| 6 | 侧边栏折叠 | 点击折叠按钮 | 侧边栏宽度从 220px 收缩到 64px，图标仍可见 |
| 7 | Light 主题（默认） | 首次打开页面 | 背景色 #F7F8FA，卡片白色，主色紫色，文字深灰 |
| 8 | Dark 主题切换 | 点击主题切换按钮 | 背景变为 #1E1E2E，卡片 #2D2D3F，文字浅白，切换过程有平滑过渡 |
| 9 | 主题持久化 | 切换到 Dark → 刷新页面 | 刷新后仍为 Dark 主题 |
| 10 | CSS 变量体系 | DevTools 检查 `:root` | `data-theme` 属性存在，所有 CSS 变量（--bg-primary, --bg-card, --color-primary 等）可查到对应值 |

### 12.2 P1 - 仪表盘 + 启动器 验收

| # | 验收条件 | 验收步骤 | 预期结果 |
|---|---------|---------|---------|
| 1 | 时间实时显示 | 观察 TopBar 左侧时间 | 显示 HH:mm 格式，每秒/每分钟更新，日期格式为 YYYY年MM月DD日 星期X |
| 2 | 问候语正确 | 查看时间下方问候语 | 根据当前时段显示对应问候（如 10 点显示"早上好"） |
| 3 | Ctrl+K 全局搜索 | 按下 Ctrl+K | 弹出搜索对话框，输入框自动聚焦 |
| 4 | 搜索对话框关闭 | 按 Esc 或点击遮罩 | 对话框关闭 |
| 5 | 启动器网格展示 | 首页查看启动器区域 | 已配置的应用以图标网格展示，每行 4-6 个 |
| 6 | 添加启动器应用 | 进入启动器管理页 → 点击添加 → 填写名称"VS Code"、URL `vscode://` → 保存 | 应用出现在启动器网格中 |
| 7 | 编辑启动器应用 | 点击已添加的应用图标 → 修改名称 → 保存 | 名称更新成功 |
| 8 | 删除启动器应用 | 右键应用图标 → 点击删除 → 确认 | 应用从网格消失 |
| 9 | 拖拽排序 | 在管理页拖拽一个图标到另一个位置 | 图标位置互换，刷新后顺序保持 |
| 10 | Protocol 唤起 | 点击一个已配置的 VS Code 图标 | 浏览器尝试唤起 VS Code（可能弹出协议确认对话框） |
| 11 | 预置模板 | 设置页 → 点击一键添加预置应用 | VS Code、Steam、微信等常用应用批量添加到启动器 |
| 12 | 空状态 | 启动器无应用时查看首页 | 显示空状态提示，引导用户去添加应用 |

### 12.3 P2 - 任务管理 验收

| # | 验收条件 | 验收步骤 | 预期结果 |
|---|---------|---------|---------|
| 1 | 新建任务 | 任务页 → 点击新建 → 填写标题"测试任务"、优先级 high、截止日期今天 → 保存 | 任务出现在列表中，优先级标签为红色 |
| 2 | 编辑任务 | 点击任务行 → 修改标题 → 保存 | 标题更新，updatedAt 刷新 |
| 3 | 删除任务 | 选中任务 → 点击删除 → 确认 | 任务从列表消失 |
| 4 | 状态流转 | 点击任务前的 checkbox | 状态从 todo → done 切换，completedAt 被填充 |
| 5 | 看板视图 | 切换到看板视图 | 显示三列（待办/进行中/已完成），任务按状态分列 |
| 6 | 看板拖拽 | 将一张卡片从"待办"拖到"进行中" | 卡片移动到"进行中"列，status 更新为 in_progress |
| 7 | 状态筛选 | 列表视图 → 筛选状态为"待办" | 仅显示 status=todo 的任务 |
| 8 | 优先级筛选 | 筛选优先级为"high" | 仅显示 priority=high 的任务 |
| 9 | 搜索 | 搜索框输入关键词 | 匹配标题或描述的任务被过滤出来 |
| 10 | 排序 | 按截止日期排序 | 任务按 dueDate 升序排列，无日期的排在最后 |
| 11 | 批量操作 | 多选 3 个任务 → 批量修改状态为"已完成" | 3 个任务状态全部变为 done |
| 12 | 逾期标记 | 创建一个截止日期为昨天的任务 | 任务显示逾期标记（红色高亮或标签） |
| 13 | 仪表盘摘要 | 返回首页查看任务摘要卡片 | 显示今日待办数量和逾期数量，列出前 3 条今日到期任务 |
| 14 | 摘要跳转 | 点击"查看全部" | 跳转到任务详情页 |
| 15 | 数据持久化 | 创建任务 → 刷新页面 | 任务数据仍在 |
| 16 | 空状态 | 无任务时查看任务页 | 显示"还没有任务，享受清闲吧" |

### 12.4 P3 - 笔记 验收

| # | 验收条件 | 验收步骤 | 预期结果 |
|---|---------|---------|---------|
| 1 | 新建笔记 | 笔记页 → 点击"+" → 输入标题和内容 | 新笔记出现在左侧列表 |
| 2 | Markdown 编辑 | 在编辑器中输入 `**加粗**` 和 `# 标题` | 右侧实时预览渲染出加粗和标题样式 |
| 3 | 自动保存 | 编辑内容后停止输入 2 秒 | 控制台或 UI 提示已保存，刷新页面内容不丢失 |
| 4 | 笔记列表排序 | 创建多条笔记，修改其中一条 | 被修改的笔记 updatedAt 更新，列表按 updatedAt 降序 |
| 5 | 置顶 | 点击某条笔记的置顶按钮 | 该笔记排到列表最前面，显示置顶图标 |
| 6 | 分类筛选 | 创建不同分类的笔记 → 选择某分类筛选 | 仅显示该分类下的笔记 |
| 7 | 搜索 | 搜索框输入关键词 | 匹配标题或内容的笔记被过滤出来 |
| 8 | 导出 Markdown | 选中一条笔记 → 点击导出 | 下载 .md 文件，内容与笔记一致 |
| 9 | 删除笔记 | 选中笔记 → 点击删除 → 确认 | 笔记从列表消失 |
| 10 | 仪表盘摘要 | 返回首页 | 笔记摘要卡片显示总数和最近 3 条编辑的笔记 |
| 11 | 空状态 | 无笔记时查看 | 显示"空白页是最好的起点" |

### 12.5 P4 - 日历 验收

| # | 验收条件 | 验收步骤 | 预期结果 |
|---|---------|---------|---------|
| 1 | 月视图展示 | 进入日历页 | 显示当月日历网格，今日高亮 |
| 2 | 切换月份 | 点击左右箭头 | 日历切换到上/下月 |
| 3 | 新建事件 | 点击某日期 → 填写标题、时间 → 保存 | 事件出现在该日期格中 |
| 4 | 全天事件 | 新建事件 → 勾选"全天事件" | 事件显示在日期格顶部，不占时间段 |
| 5 | 事件颜色 | 新建事件时选择颜色 | 事件块/圆点显示对应颜色 |
| 6 | 编辑事件 | 点击已有事件 → 修改标题 → 保存 | 事件标题更新 |
| 7 | 删除事件 | 点击事件 → 点击删除 → 确认 | 事件消失 |
| 8 | 周视图 | 切换到周视图 | 显示 7 列时间轴，事件按时间段定位 |
| 9 | 日视图 | 切换到日视图 | 显示单日时间轴（06:00-24:00），事件块正确定位 |
| 10 | 点击日期查看详情 | 月视图点击某日期 | 右侧面板显示该日所有事件 |
| 11 | 浏览器通知 | 创建一个 1 分钟后开始的事件，设置提醒 1 分钟 | 1 分钟后收到浏览器通知（需先授权通知权限） |
| 12 | 仪表盘摘要 | 返回首页 | 日程卡片显示今日日程数量和事件列表 |
| 13 | 数据持久化 | 创建事件 → 刷新页面 | 事件数据仍在 |

### 12.6 P5 - 书签 验收

| # | 验收条件 | 验收步骤 | 预期结果 |
|---|---------|---------|---------|
| 1 | 新建书签 | 书签页 → 点击新建 → 输入标题"GitHub"、URL `https://github.com` → 保存 | 书签卡片出现在网格中 |
| 2 | 打开书签 | 点击书签卡片 | 新标签页打开对应 URL |
| 3 | 分类管理 | 创建不同分类的书签 → 点击分类 Tab 切换 | 仅显示该分类下的书签 |
| 4 | 搜索书签 | 搜索框输入关键词 | 匹配标题或 URL 的书签被过滤出来 |
| 5 | 编辑书签 | hover 书签卡片 → 点击编辑 → 修改标题 → 保存 | 标题更新 |
| 6 | 删除书签 | hover 书签卡片 → 点击删除 → 确认 | 书签消失 |
| 7 | 域名显示 | 查看书签卡片 | 卡片上显示域名（如 github.com） |
| 8 | 仪表盘摘要 | 返回首页 | 书签卡片显示总数和最近 3 条书签 |
| 9 | 数据持久化 | 创建书签 → 刷新页面 | 书签数据仍在 |
| 10 | 空状态 | 无书签时查看 | 显示空状态提示 |

### 12.7 P6 - 完善 验收

| # | 验收条件 | 验收步骤 | 预期结果 |
|---|---------|---------|---------|
| 1 | 上传视频背景 | 设置页 → 上传一个 MP4 文件 | 视频在页面最底层全屏循环播放 |
| 2 | 上传 GIF 背景 | 上传一个 GIF 文件 | GIF 在底层全屏展示 |
| 3 | 上传静态图片背景 | 上传一张 PNG/JPG | 图片铺满底层背景 |
| 4 | 遮罩透明度 | 拖动遮罩透明度滑块 0%→80% | 背景从清晰到模糊，前景内容始终可读 |
| 5 | 背景持久化 | 设置背景 → 刷新页面 | 背景仍然存在 |
| 6 | 清除背景 | 点击"清除自定义背景" | 背景恢复为纯色主题背景 |
| 7 | 导出数据 | 设置页 → 点击导出 → 下载 JSON | JSON 文件包含所有模块数据（任务、笔记、事件、书签、启动器） |
| 8 | 导入数据 | 清除数据 → 导入刚才的 JSON | 所有数据恢复，各模块正常显示 |
| 9 | 清除数据 | 点击"清除所有数据" → 二次确认弹窗 → 确认 | 所有模块数据清空，回到空状态 |
| 10 | 全局搜索完整性 | Ctrl+K → 搜索一个任务关键词 | 搜索结果中出现任务模块的结果，点击跳转到对应任务 |
| 11 | 全局搜索跨模块 | 搜索一个笔记关键词 | 搜索结果中出现笔记模块的结果，点击跳转到对应笔记 |
| 12 | 全局搜索无结果 | 搜索一个不存在的关键词 | 显示"没有找到相关内容" |
| 13 | 页面切换动画 | 在不同路由间切换 | 页面有 fade+slide 过渡效果 |
| 14 | 卡片 stagger 动画 | 进入仪表盘页面 | 卡片依次出现，间隔约 50ms |
| 15 | 主题切换过渡 | 切换亮/暗主题 | 所有颜色平滑过渡（0.4s），无闪烁 |
| 16 | `vue-tsc` 零错误 | 执行 `npx vue-tsc --noEmit` | 退出码 0，无类型错误 |
| 17 | 生产构建体积 | 执行 `npm run build` | 构建成功，首屏 JS < 500KB（gzip 后） |

### 12.8 整体验收流程

```
阶段验收流程（每个 P0-P6 阶段重复执行）：

1. 代码检查
   ├── npx vue-tsc --noEmit        → 必须 0 错误
   ├── npm run build                → 必须构建成功
   └── 检查控制台                   → 无 runtime error / warning

2. 功能验证
   ├── 按当前阶段的验收表格逐项操作
   ├── 每条验收条件必须 PASS
   └── 有 FAIL 项 → 修复后重新验证该条

3. 回归检查
   ├── 之前阶段已通过的功能仍然正常
   └── 重点检查数据持久化（刷新页面后数据不丢）

4. UI 检查
   ├── Light / Dark 主题下所有页面视觉正常
   ├── 无布局错位、文字溢出、元素重叠
   └── 空状态正确显示

5. 阶段签收
   └── 所有验收条件 PASS → 标记阶段完成 → 进入下一阶段
```

### 12.9 验收环境

| 项目 | 要求 |
|------|------|
| 浏览器 | Chrome 最新版 或 Edge 最新版 |
| 分辨率 | 1920x1080 或更高 |
| 运行方式 | `npm run dev`（开发）或 `npm run build` + `npm run preview`（生产） |
| 后端依赖 | 无，纯前端 |
| 测试数据 | 验收前清空 IndexedDB（DevTools → Application → Storage → Clear site data），从零开始验证 |
