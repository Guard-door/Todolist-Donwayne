# Changelog

## v1.1.0 (2026-05-21)

### 架构

- 模块化拆分：`modules/todo/` 独立管理 Todo 模块的 HTML、CSS、JS
- Shell 层：`index.html` + `css/style.css` + `js/shell.js` 负责顶栏/底栏/Myday 面板/离线横幅/模块加载
- `window.TodoModule` API 暴露给 Shell 调用

### 数据模型

- 字段统一：`content`、`completed`、`deadline`、`id`
- localStorage key 改为 `todo_data`
- 自动迁移旧字段（`text→content`、`done→completed`、`dueDate→deadline`）
- 移除 `createdAt`、`myDay` 字段
- 自动清理：加载时删除 `completed=true && deadline < 今天` 的过期任务

### 待办模块

- FAB 悬浮添加按钮（右下角圆形 + 号，双层阴影）
- 底部弹出模态面板：内容输入 + 日历选择 DDL + 添加/取消
- 日历面板：年/月双导航（« ‹ › »），过去日期灰色不可选，今天蓝底白字
- DDL 行右侧 × 清除按钮（样式与任务删除按钮一致）
- 日期格式 `年/月/日`（如 `2026/5/21`），列表中小字灰色显示
- 长按/右键弹出上下文菜单 → "编辑" → 打开预填模态框
- 双击任务文字原地编辑
- 活跃任务始终在上方，已完成自动沉底
- 已完成区域顶部 4px 内凹分隔阴影
- 活跃任务白色卡片悬浮阴影，已完成任务淡灰底色
- 整体底色 `#f5f6f9`

### Myday

- 顶栏太阳图标 ☀️ 替代原星星图标
- 左侧滑入面板，自动显示 `deadline = 今天` 的未完成任务
- 空状态："No, have a relax~"
- 关闭自动清理时重新渲染

### 顶栏/底栏/离线横幅

- 顶部固定导航栏：太阳图标 + WiFi 状态 + TODO 标题
- WiFi 图标单一 SVG 动态切换（在线绿色/离线红色斜杠）
- 底部固定导航栏：对勾图标居中（无文字）
- 离线横幅：240px 居中、圆角、向下滑入

### 移除项

- 搜索框及实时过滤
- All / Active / Done 过滤按钮
- "清空已完成"按钮及统计栏
- 手动星标 MyDay 功能（改为自动判定）
- 任务列表中的 📅 emoji 图标

### PWA

- manifest.json + icon.svg
- service-worker.js（v2 缓存列表，仅 http/https 注册）
- 在线/离线状态监听
