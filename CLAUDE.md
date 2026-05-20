# CLAUDE.md — Todo PWA 协作宪法

## 版本号规范

```
MAJOR.MINOR.PATCH  例 v1.1.0
```

| 位 | 递增时机 | 副作用 |
|----|----------|--------|
| MAJOR | 不兼容的大重构（极少） | MINOR、PATCH 归零 |
| MINOR | 新增独立模块（记账、笔记等）或模块内重要功能（待办加日历） | PATCH 归零 |
| PATCH | Bug 修复、样式微调、文案修改 | — |

## Service Worker 版本

`service-worker.js` 顶部维护：

```js
const APP_VERSION = '1.1.0';
```

每次部署前手动递增对应位。`CACHE_NAME` 纳入版本号。使用 `skipWaiting()` 立即激活，页面监听 `controllerchange` 自动刷新实现静默更新。

```js
self.addEventListener('install', () => self.skipWaiting());
```

```js
// shell.js
navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
```

## 更新日志

所有版本变更记录到 `CHANGELOG.md`，格式参照现有文件。

## 提交规范

Commit message 只写 `vX.Y.Z`，具体变更已在 CHANGELOG.md 中记录。

---

本项目所有代码变更、版本管理、部署流程均须遵循此宪法。在后续对话中，Claude Code 应主动参考并依据此文件执行。
