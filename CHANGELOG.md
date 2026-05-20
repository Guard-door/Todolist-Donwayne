# Changelog

## v1.2.0

### 配置
- 新增 GitHub Actions 自动 Release（推送 tag 时自动从 CHANGELOG 提取内容创建 Release）

## v1.1.3

### 待办
- 任务列表 × 和 DDL × 改为红色常驻

## v1.1.2

### 配置
- 修正提交与推送规则（每次改动本地 commit，禁止自动推送）

## v1.1.1

### 配置
- 新增 CLAUDE.md 协作宪法（版本号规范、SW 版本管理、提交规范）
- service-worker.js 新增 APP_VERSION 常量，CACHE_NAME 纳入版本号
- shell.js 新增 controllerchange 监听，SW 更新后自动静默刷新

### 文档
- 新增 README.md 项目说明
- 新增 IMPLEMENTATION.md 实现文档

## v1.1.0

### 架构
- 模块化拆分：modules/todo/ 独立管理 CSS/JS，Shell 层负责顶栏/底栏/Myday
- window.TodoModule API 暴露给 Shell 调用

### 待办
- 新增 FAB 悬浮添加按钮 + 底部弹出模态面板
- 新增日历 DDL 选择器（年/月导航，过去日期不可选，今天蓝底）
- 新增 DDL 行右侧 × 清除按钮
- 新增长按/右键上下文菜单 → 编辑
- 活跃任务在上，已完成沉底 + 内凹分隔阴影
- 任务卡片悬浮阴影，已完成淡灰底色
- 日期格式改为年/月/日，任务列表小字无图标
- 自动清理过期已完成任务

### 数据
- 字段统一 content/completed/deadline，localStorage key → todo_data
- 旧字段自动迁移（text→content, done→completed, dueDate→deadline）
- 移除 createdAt、myDay 字段

### Myday
- 顶栏太阳图标替换星星，左侧滑入面板
- 自动显示 deadline = 今天的未完成任务，移除手动星标

### UI
- 顶部固定导航栏（太阳 + WiFi + TODO 标题）
- WiFi 单一 SVG 动态切换（在线绿色/离线红色斜杠）
- 底部固定栏仅保留对勾图标
- 离线横幅 240px 居中、圆角

### 移除
- 搜索框、过滤按钮（All/Active/Done）、统计栏、"清空已完成"按钮
- 手动星标 MyDay、任务列表 📅 图标

## v1.0.0

### 基础
- 纯 HTML/CSS/JS 待办应用，语义化标签
- 添加/完成/删除任务，原地编辑（双击）
- localStorage 持久化，搜索框、过滤器、星标

### PWA
- manifest.json（standalone、主题色）
- service-worker.js（cache-first 策略）
- icon.svg + 在线/离线横幅
