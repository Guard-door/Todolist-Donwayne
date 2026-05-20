# CLAUDE.md — Todo PWA 协作宪法

## 版本号规范

```
MAJOR.MINOR.PATCH  例 v1.1.0
```

| 位 | 递增时机 | 副作用 |
|----|----------|--------|
| MAJOR | 不兼容的大重构（极少） | MINOR、PATCH 归零 |
| MINOR | 新增独立模块或模块内重要功能 | PATCH 归零 |
| PATCH | Bug 修复、样式微调、文案修改 | — |

## 自动递增规则

每次代码修改后，自动判断变更类型并按上表递增版本号。

**用户描述优先**：以用户的表述为准。用户说"新增模块"即 MINOR，说"修复"即 PATCH，即使代码改动量小也不降级。

递增后同步 `service-worker.js` 的 `APP_VERSION` 和 `CHANGELOG.md`。

## 推送流程

- 默认推送到 `master` 分支
- 用户明确同意后才合并到 `main`
- 用户未要求推送则不推送，仅本地 commit

## Service Worker 版本

`service-worker.js` 顶部维护 `const APP_VERSION = 'x.x.x'`，`CACHE_NAME` 纳入版本号。

`install` 事件调用 `self.skipWaiting()` 立即激活。`shell.js` 监听 `controllerchange` → `location.reload()` 静默更新。

## 更新日志

所有版本变更记录到 `CHANGELOG.md`，格式：`## vX.Y.Z` → `### 模块` → `- 功能概述`。

## 提交规范

Commit message 只写 `vX.Y.Z`。

---

本项目所有代码变更、版本管理、部署流程均须遵循此宪法。在后续对话中，Claude Code 应主动参考并依据此文件执行。
