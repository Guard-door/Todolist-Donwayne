# PLAN — scrollFn 接管滚屏 + 直接调交换

**类型**: PATCH
**目标**: 滚屏后立即触发交换判定，不卡不递归

## 实现步骤

1. sortable.js 加 `scrollFn`：手动 `scrollBy`，然后调 `instance._onDragOver` 传当前坐标
2. `scroll: false` 禁用 SortableJS 自带滚屏

## 影响文件
- sortable.js

## 验证
拖到顶部→滚屏→列表项交换正常
