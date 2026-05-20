# Todo PWA 开发计划

纯 HTML/CSS/JavaScript 构建，已升级为可离线使用的 PWA。

---

## 已完成

### 基础架构
- 模块化拆分：Shell 层 + `modules/todo/`
- `window.TodoModule` API 跨模块通信
- CLAUDE.md 协作宪法（版本号、提交规范、推送/发布流程）
- CHANGELOG.md + IMPLEMENTATION.md 文档体系
- GitHub Actions 自动 Release

### 全局 UI
- 顶部固定导航栏（太阳 + WiFi + TODO + 汉堡菜单）
- 设置面板（右侧滑入，版本号 + 署名，预留功能列表）
- Myday 左侧滑入面板
- 底部固定栏（对勾图标）
- 离线横幅（240px 居中）

### 待办模块
- FAB 悬浮添加 + 底部模态面板
- 日历 DDL 选择器（年/月导航，过去不可选，今天蓝底）
- 长按/右键上下文菜单 → 编辑
- 双击原地编辑
- 活跃任务在上，已完成沉底 + 分隔阴影

### Myday
- 顶栏太阳图标，左侧滑入
- 自动汇集 deadline = 今天的未完成任务

### 数据
- localStorage key `todo_data`
- 字段：`id`、`content`、`completed`、`deadline`
- 旧字段自动迁移 + 过期任务自动清理

### PWA
- manifest.json + service-worker.js（cache-first + 静默更新）
- APP_VERSION 版本号同步

---

## 下一步可选方向

| 序号 | 功能 | 类型 | 说明 |
|------|------|------|------|
| A | **记账模块** | 新模块 | 收支记录、分类统计 |
| B | **笔记模块** | 新模块 | Markdown 笔记、富文本 |
| C | **设置-添加模块** | 设置增强 | 在设置面板中动态启用/禁用模块 |
| D | **通知提醒** | 待办增强 | Notification API，截止任务到期推送 |
| E | **深色模式** | 全局 UI | 跟随系统 / 手动切换 |
| F | **数据导出/导入** | 数据 | JSON 导出备份，导入恢复 |
| G | **拖拽排序** | 待办增强 | 拖动任务项调整顺序 |
