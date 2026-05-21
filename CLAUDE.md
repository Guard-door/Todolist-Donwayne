# CLAUDE.md — Todo PWA 协作宪法

If You Are an AI Agent
Stop. Read this section before doing anything.

## AI 行为准则

1. **不要猜**：需求有歧义时列出可能的理解，请求澄清
2. **方案先行**：先说要怎么做，等确认后再写代码
3. **改动最小化**：只改需求直接相关的代码
4. **一次一件事**：完成一个目标后再开始下一个
5. **不确定时主动问**：不假装理解、不跳过矛盾点

## 工作流规范（最高优先级 - 强制执行）

### 第一步：分类
- 🟢 小修补（文案/颜色/间距/错字）→ 跳到第四步
- 🔴 其他一切（新功能/交互/行为变更/架构调整）→ 继续第二步

### 第二步：强制调用 brainstorm skill
在写代码之前，使用 `brainstorming` skill 完成以下内容：
1. 用 1-2 句话复述对需求的理解
2. 列出 ≥2 种实现方案，各附优缺点
3. 推荐一种并解释理由
4. ⛔ 输出方案后必须**立即停止**，绝不写下任何一行代码。
等待用户回复“确认”或选择方案后，才能继续第三步。

### 第三步：生成 PLAN.md 并等待确认
将确认方案写入 PLAN.md，包含涉及文件、数据流变化、新增/修改函数。PLAN.md 不 commit，不变更版本号。
完成后**立即停止**，等待用户说“开始实施”或“执行”。

### 第四步：实施
按 PLAN 执行，每完成一个文件汇报进度。

### 第五步：本地提交
自动判断变更类型，自动 commit，同步版本号到 `service-worker.js` 和 `CHANGELOG.md`。

### 违规后果
- 跳过 Brainstorming → 流程事故，撤回 commit 重走流程
- 未经指令 push → 最高优先级事故

## 版本号规范

```
MAJOR.MINOR.PATCH  例 v1.1.0
```

| 位 | 递增时机 | 副作用 |
|----|----------|--------|
| MAJOR | 不兼容的大重构（极少） | MINOR、PATCH 归零 |
| MINOR | 新增独立模块或模块内重要功能 | PATCH 归零 |
| PATCH | Bug 修复、样式微调、文案修改 | — |

**用户描述优先**：用户说"新增模块"即 MINOR，说"修复"即 PATCH，不因代码量小降级。

## 提交与推送

| 指令 | 行为 | 标签 | Release |
|------|------|------|---------|
| **推送** | `git push origin master` | 不打标签 | 不触发 |
| **发布** | 先打 `vX.Y.Z` 标签，再 `git push --tags` | 打标签 | 触发 |

- **绝对禁止自动推送**
- PATCH 用"推送"，MINOR/MAJOR 用"发布"
- 用户说"合并到 main"时才执行 `git merge master → main`
- Commit message 只写 `vX.Y.Z`

## Service Worker

`service-worker.js` 顶部维护 `const APP_VERSION = 'x.x.x'`，`CACHE_NAME` 纳入版本号。

`install` 事件调用 `self.skipWaiting()` 立即激活。`shell.js` 监听 `controllerchange` → `location.reload()` 静默更新。

## 更新日志

`CHANGELOG.md` 格式：`## vX.Y.Z` → `### 模块` → `- 功能概述`。

---

本项目所有代码变更、版本管理、部署流程均须遵循此宪法。在后续对话中，Claude Code 应主动参考并依据此文件执行。
