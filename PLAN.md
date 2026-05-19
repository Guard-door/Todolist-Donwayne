# Todo PWA 开发计划

使用纯 HTML/CSS/JavaScript 构建待办事项应用，已逐步升级为 PWA。

---

## 第一阶段：基础 Todo 应用 ✅

- 添加 / 完成 / 删除任务
- 任务统计、空状态、清空已完成

## 第二阶段：本地持久化 ✅

- localStorage 存取，刷新不丢失
- 任务模型：`id`、`content`、`completed`、`myDay`、`dueDate`、`createdAt`

## 第三阶段：PWA 升级 ✅

- manifest.json（standalone 模式、主题色 #4a90d9）
- service-worker.js（install 预缓存 + cache-first + activate 清理旧缓存）
- icon.svg（蓝紫渐变圆角矩形 + 白色对勾）
- 在线/离线浮动横幅 + 顶部栏 WiFi 状态图标

## 第四阶段：增强体验 ✅

- 搜索框（实时过滤，大小写不敏感）
- 过滤器：全部 / 未完成 / 已完成 / 我的一天
- 原地编辑：双击进入编辑，Enter 确认，blur / Escape 取消
- "我的一天"星标功能（☆/★）
- 创建时间戳 + 截止日期显示（过期红色高亮）

## 第五阶段：原生 App 化 UI ✅

- 顶部固定导航栏（WiFi 状态图标 + TODO 标题，safe-area 适配）
- 底部固定功能栏（"待办"标签页入口，预留扩展）
- FAB 悬浮添加按钮（右下角圆形 + 号，带阴影，不遮挡底部栏）
- 底部滑入模态面板添加任务（内容 + 可选截止日期）
- 数据模型迁移：`text→content`，`done→completed`，新增 `dueDate`

---

## 下一步可选方向

| 序号 | 功能 | 说明 |
|------|------|------|
| A | **拖拽排序** | 拖动任务项调整顺序，同步到 localStorage |
| B | **通知提醒** | Notification API，截止任务到期推送 |
| C | **深色模式** | 跟随系统 / 手动切换 |
| D | **数据导出/导入** | JSON 导出备份，导入恢复 |
| E | **键盘快捷键** | Ctrl+K 搜索、Ctrl+N 新建 |
| F | **热力图/统计** | 完成率日历热力图 |
