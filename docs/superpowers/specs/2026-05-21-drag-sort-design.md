# 拖拽排序 — Edge 交换模式设计文档

## 目标

为待办列表实现原生 Edge 浏览器风格的拖拽排序，支持桌面端（HTML5 Drag and Drop）和移动端（Touch Events）。

## 交互规则

### 核心：单元素交换 + 中线判定

1. **拖起**：被拖元素内容透明化（`opacity: 0`，保留背景色空位），浮动克隆跟随指针
2. **判定**：被拖元素的垂直中心越过目标元素的中线 → 触发交换
3. **交换**：目标元素通过 CSS transition 单向滑入 gap 位置，自身位置变为新 gap
4. **连续**：被拖元素逻辑位置更新，可继续与其他元素交换
5. **松手**：save() + render() 统一刷新

### 示例

```
A B C  → 拖 B 向上越过 A 中线
B A C     (A 下滑填补 B 的位置)

A B C  → 拖 A 向下越过 B 中线
B A C     (B 上滑填补 A 的位置)
→ 继续越过 C 中线
B C A     (C 上滑填补 B 的原位置)
```

### 限制

- 仅同组内拖动（活跃 ↔ 活跃，已完成 ↔ 已完成）
- 不跨组

## 技术方案

### 架构

```
modules/todo/features/sortable.js   # 独立的拖拽模块
modules/todo/app.js                 # 主模块：初始化 + onSortEnd 回调
```

### sortable.js 接口

```js
enableSortable(listEl, {
  onSortEnd(newOrder) { ... },      // 排序完成，传回 id 数组
  isSameGroup(id1, id2) { ... },    // 同组判定（可选）
  touchDelay: 300,                  // 长按触发时间
})
// 返回 destroy() 函数
```

### 动画策略：混合模式

拖拽过程中只动画被交换的目标元素，不全量渲染：

1. 两个元素获取 `getBoundingClientRect()`
2. 交换 DOM 位置（`insertBefore`）
3. 目标元素设 `transform: translateY(delta)` 补偿位移
4. `requestAnimationFrame` → 清除 transform，`transition: 0.25s` 滑入

松手时调用 `onSortEnd(newOrder)` → 主模块 save + render → 确保最终一致性。

### 桌面端：HTML5 DnD

- `dragstart`：记录 id，设 `effectAllowed: 'move'`，延迟隐藏源元素内容
- `dragover`：`e.preventDefault()`，计算指针位置，中线判定，触发交换
- `drop`：调用 `onSortEnd`
- `dragend`：清理浮动元素

### 移动端：Touch Events

- `touchstart`：启动 300ms 计时器
- `touchmove`：计时器到期 → 创建浮动克隆，开始拖拽；后续移动执行中线判定
- `touchend`：清理，调用 `onSortEnd`
- 拖动中 `e.preventDefault()` 禁止页面滚动

### 中线判定

```js
function crossedMidline(pointerY, targetEl) {
  const r = targetEl.getBoundingClientRect();
  const mid = r.top + r.height / 2;
  return pointerY < mid;  // true = 在上方
}
```

### 空值防护

所有 DOM 操作前检查元素存在性：
- `el?.parentNode?.insertBefore(...)`
- `el?.getBoundingClientRect()`
- 浮动克隆：`floating?.parentNode?.removeChild(floating)`

## 文件变更范围

| 文件 | 变更 |
|------|------|
| `modules/todo/features/sortable.js` | **新建**，拖拽模块 |
| `modules/todo/app.js` | 新增 `initSortable()` 调用，移除旧 DnD 代码 |
| `modules/todo/style.css` | 新增浮动克隆、占位、drag-hidden 样式 |
| `index.html` | 新增 sortable.js 脚本引用 |

## 成功标准

- 桌面端可拖拽排序，动画流畅
- 移动端长按 300ms 后拖拽，不误触滚动
- 连续拖动多次交换不崩溃
- 同组内拖动，不跨组
- 排序后 localStorage 保存
- 无 NotFoundError 等 DOM 异常
