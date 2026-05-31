# CLAUDE.md — Todo PWA 协作宪法

If You Are an AI Agent
Stop. Read this section before doing anything.

## AI 行为准则

1. **不要猜** — 歧义时列可能理解，请求澄清
2. **方案先行** — 先说怎么做，确认后写代码
3. **改动最小化** — 只改需求相关的代码
4. **一次一件事** — 完成后才开始下一个
5. **不确定就问** — 不假装理解、不跳过矛盾

## 工作流（强制执行）

### 第一步：分类
- 🟢 小修补（文案/颜色/间距/错字）→ 跳到第四步
- 🔴 其他（新功能/交互/行为变更/架构）→ 继续第二步

### 第二步：Brainstorming
调用 `brainstorming` skill：复述需求 → ≥2 方案 + 优缺点 → 推荐 →
⛔ **立即停止**，等用户确认。

### 第三步：PLAN.md
写大方向功能 + 实现步骤 + 影响文件。**不写代码片段、函数名、CSS 选择器等技术细节**。
PLAN.md 不单独触发版本号变更。写完停止，等用户说"实施"。

### 第四步：实施
按 PLAN 执行。

### 第五步：提交
自动判断版本类型 → 所有变更文件一律commit → 同步版本号到 `service-worker.js` 和 `CHANGELOG.md`。

### 违规
- 跳过 Brainstorming → 撤回 commit 重走
- 未经指令 push → 最高优先级事故

## 版本号

```
MAJOR.MINOR.PATCH  例 v1.1.0
```

| 位 | 递增时机 | 副作用 |
|----|----------|--------|
| MAJOR | 不兼容大重构（极少） | MINOR、PATCH 归零 |
| MINOR | 新模块 / 模块内重要功能 | PATCH 归零 |
| PATCH | Bug 修复、样式微调、文案 | — |

**用户描述优先**：用户说"新增"即 MINOR，说"修复"即 PATCH。

## 提交与推送

| 指令 | 行为 | 标签 | Release |
|------|------|------|---------|
| **推送** | `git push origin master` | 不打 | 不触发 |
| **发布** | 打标签 → `git push --tags` | 打 | 触发 |

- **绝对禁止自动推送**
- PATCH → 推送，MINOR/MAJOR → 发布
- 用户说"合并到 main"才执行 merge
- Commit message 只写 `vX.Y.Z`

## Service Worker

`service-worker.js` 顶部 `const APP_VERSION`，`CACHE_NAME` 含版本号。
install 调 `skipWaiting()`，shell.js 监听 `controllerchange` → reload。

## 更新日志

`CHANGELOG.md`：`## vX.Y.Z` → `### 模块` → `- 概述`。

---

所有代码变更、版本管理、部署须遵循此宪法。
