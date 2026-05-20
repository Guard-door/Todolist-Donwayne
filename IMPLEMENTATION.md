# 实现细节

## 模块加载

```
index.html
  ├── <link> modules/todo/style.css    静态引入
  ├── <script> modules/todo/app.js     先于 shell 执行
  └── <script> js/shell.js             WiFi、横幅、Myday、PWA
```

Todo 模块通过 `window.TodoModule = { renderMydayList, refresh }` 暴露给 Shell。

## 数据流

```
localStorage (todo_data)
  → load() / migrate() 旧字段兼容
  → todos[] 内存数组
  → render() DOM 渲染
  → CRUD → save() 回写
```

## 数据模型

```js
{ id, content, completed, deadline }
```

- `deadline` 为 `"YYYY-MM-DD"` 或 `null`
- 加载时自动清理 `completed=true && deadline < 今天` 的过期任务
- 以 `loadDateStr` 锁定加载时刻日期，不受设备时间变化影响

## 旧数据迁移

```js
function migrate(todo) {
  return {
    id: todo.id,
    content: todo.content || todo.text || '',
    completed: todo.completed !== undefined ? todo.completed : todo.done || false,
    deadline: todo.deadline || todo.dueDate || null,
  };
}
```

检测到旧字段后执行 `save()` 覆盖 localStorage。

## 任务排序与分隔

- `[...todos].sort((a, b) => a.completed - b.completed)` 活跃在上，已完成在下
- 第一个已完成任务前插入 `.todo-separator`
- 分隔样式：`inset 0 4px 8px -5px rgba(0,0,0,0.28)`，margin 4px，height 0
- 活跃任务白色卡片 `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`，已完成 `rgba(0,0,0,0.015)`

## FAB 与模态框

- FAB `position: fixed` 右下角，`bottom: calc(72px + env(safe-area-inset-bottom))`
- `box-shadow: 0 6px 20px rgba(74,144,217,0.35), 0 2px 4px rgba(0,0,0,0.1)`
- 模态框从底部滑入（`border-radius: 16px 16px 0 0`），半透明遮罩
- 添加/编辑双模式：`editingId` 控制标题和按钮文字

## DDL 日历选择器

- `position: absolute; bottom: 100%` 向上弹出，不推动其他元素
- 年导航 `« »`（直接改 `calYear`），月导航 `‹ ›`（带跨年逻辑）
- `isPast()` 判断过去日期，加 `.past` 类 `pointer-events: none`
- 今天日期 `.today` 蓝色背景白色文字
- 选中日期 `.selected` 浅蓝背景
- DDL 行右侧 × 清除按钮（28px，hover 红底，与任务删除按钮一致）
- 日期格式 `年/月/日`（如 `2026/5/21`），任务列表中 12px 灰色小字

## 长按上下文菜单

- 移动端 `touchstart` 启动 500ms 计时器，`touchend/touchmove` 取消
- 桌面端 `contextmenu` 事件阻止默认
- 菜单绝对定位到触摸/鼠标位置（`Math.min` 防溢出）
- 点击外部自动关闭

## Myday 侧边面板

- 顶栏太阳 SVG（圆心 + 八条放射线），hover 金色
- 点击 → `openMyday()`，Shell 调用 `window.TodoModule.renderMydayList(container)`
- `transform: translateX(-100%)` ↔ `translateX(0)`，遮罩层 `#mydayOverlay`
- 自动筛选 `!completed && deadline === loadDateStr`

## WiFi 图标

- 单一 `#topWifiIcon` 容器，`innerHTML` 动态替换完整 SVG
- 在线 `WIFI_ONLINE`（绿色），离线 `WIFI_OFFLINE`（红色 + 斜杠线）

## 离线横幅

- `position: fixed`，`width: 240px`，居中 `left: 50%; transform: translateX(-50%)`
- `padding: 14px 16px`，`border-radius: 0 0 16px 16px`
- 断网红色常驻，恢复绿色闪现 2.5s 后 `translateY(-100%)` 滑出

## Service Worker

- `APP_VERSION` 常量驱动 `CACHE_NAME`
- install 预缓存所有静态资源 + `self.skipWaiting()` 立即激活
- activate 清理旧版本缓存 + `self.clients.claim()`
- fetch 使用 cache-first 策略
- shell.js 监听 `controllerchange` → `location.reload()` 静默更新
- 仅在 `http/https` 协议下注册
