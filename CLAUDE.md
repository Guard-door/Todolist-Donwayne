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

## 自动递增与本地提交

每次代码修改后，自动判断变更类型，按上表递增版本号，并**自动 commit 到本地**（message 为 `vX.Y.Z`）。

**用户描述优先**：用户说"新增模块"即 MINOR，说"修复"即 PATCH，不因代码量小降级。

递增后同步 `service-worker.js` 的 `APP_VERSION` 和 `CHANGELOG.md`。

## 推送与发布

| 指令 | 行为 | 标签 | Release |
|------|------|------|---------|
| **推送** | `git push origin master` | 不打标签 | 不触发 |
| **发布** | 先打 `vX.Y.Z` 标签，再 `git push --tags` | 打标签 | 触发 |

- **绝对禁止自动推送**
- PATCH 用"推送"，MINOR/MAJOR 用"发布"
- 用户说"合并到 main"时才执行 `git merge master → main`

## Service Worker 版本

`service-worker.js` 顶部维护 `const APP_VERSION = 'x.x.x'`，`CACHE_NAME` 纳入版本号。

`install` 事件调用 `self.skipWaiting()` 立即激活。`shell.js` 监听 `controllerchange` → `location.reload()` 静默更新。

## 更新日志

所有版本变更记录到 `CHANGELOG.md`，格式：`## vX.Y.Z` → `### 模块` → `- 功能概述`。

## 提交规范

Commit message 只写 `vX.Y.Z`。

## 工作流规范

**强制 Brainstorming**：任何新增功能、模块、组件、UI 交互或行为变更前，必须先执行 superpowersbrainstorming 探索意图和设计，再进行实现。Bug 修复、文案修改、样式微调可跳过。

---

本项目所有代码变更、版本管理、部署流程均须遵循此宪法。在后续对话中，Claude Code 应主动参考并依据此文件执行。
