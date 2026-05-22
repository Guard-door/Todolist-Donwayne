# Changelog

## v1.8.3

### 待办
- 修复手机端拖拽失效（再次）：touchAction='none' 延迟到定时器确认拖拽后设置
- setPointerCapture 也移至 activateDrag，避免 pointermove 事件丢失
- 拖拽结束后恢复 touchAction='pan-y'（而非清空），保持正常滚动

## v1.8.2

### 待办
- 修复手机端拖拽变滚动：pointerdown 时同步 touchAction='none' 抢在浏览器手势识别之前
- 触摸路径不再 setPointerCapture（依赖隐式捕获），避免干预浏览器的 touch-action 重估

## v1.8.1

### 待办
- 修复链式拖拽失效：桌面端 pointermove 丢失（mouse 无隐式捕获），onPointerDown 时立即 setPointerCapture
- pointermove 加 passive:false 确保 preventDefault 生效

## v1.8.0

### 待办
- Pointer Events 重写拖拽排序：统一鼠标/触摸，pointercancel 强制触发根除死元素
- 移除全部 DnD API + Touch Events，单套 Pointer Events 处理
- 桌面端 pointermove >3px 即刻激活拖拽（不需长按）
- 保留 vibrate、autoScroll、FLIP、clamp、pan-y

## v1.7.5

### 待办
- 移除异步 ev.preventDefault()（导致 android 触发 touchcancel 循环 → 闪烁+固定）
- 仅靠 el.style.touchAction='none'（200ms 设置）阻止浏览器长按菜单

## v1.7.4

### 待办
- 拖拽激活时 el.style.touchAction='none' 强制接管触摸，清理时恢复 ''（CSS pan-y 回归）

## v1.7.3

### 待办
- 修复死元素锁死：定时器内 ev.preventDefault() 打断浏览器，移除 body touchAction 切换

## v1.7.2

### 待办
- 拖拽激活时 body 设 touch-action:none 彻底锁死滚动，清理时恢复

## v1.7.1

### 待办
- 用 touch-action: pan-y (CSS) 取代动态 touchAction 切换，从第一毫秒阻止浏览器手势，杜绝死元素

## v1.7.0

### 待办
- 拖拽自动滚屏：拖到视口边缘 80px 触发 window.scrollBy
- contextmenu 从全局阻止改为拖拽激活后动态阻止（不拖拽时保留浏览器行为）
- 保留 v1.6.18：振动反馈、-webkit-touch-callout:none

## v1.6.18

### 待办
- 修复移动端长按死元素：CSS -webkit-touch-callout:none + contextmenu 阻止浏览器默认行为吞 touchend
- 振动反馈：长按激活拖拽时 navigator.vibrate(15)

## v1.6.17

### 待办
- 多 agent 审查：删除 style.css 重复 dd-toggle 块、消除 findSwapTarget 双重 getItems()、移除死函数 indexOf、补充 touchStartX/Y 重置

## v1.6.15

### 待办
- 修复未完成区域任务拖拽到分隔线附近被过早吸附的问题（钳位逻辑与已完成侧对齐）

## v1.6.14

### 待办
- 修复移动端拖拽排序阻止页面滚动的 bug：意图确认后才接管触摸

## v1.6.13

### 待办
- 清理 sortable.js 死代码（cleanup 函数）

## v1.6.0

### 待办
- 删除长按上下文菜单，点击 content 直接进入编辑

## v1.5.6

### 待办
- 桌面端拖拽也显示浮动克隆跟随鼠标

## v1.5.5

### 待办
- 修复 FLIP 动画方向：先交换 DOM 再计算补偿

## v1.5.4

### 待办
- 修复换向时 lastSwapped 阻止回头交换的问题

## v1.5.3

### 配置
- 宪法新增 PLAN.md 不 commit 不递增版本号规则

## v1.5.2

### 待办
- 拖拽改为空白位 + 链式单向滑动模式
- 双向中线判定（向上用顶部，向下用底部），仅相邻交换
- 目标元素 0.35s 滑入空白位，动画更慢可感知

## v1.5.1

### 待办
- 拖拽源保留可见加深阴影（不再消失）
- 移动端改为浮动顶部过中线判定，降低延迟至 200ms

## v1.5.0

### 待办
- 新增拖拽排序功能（Edge 交换模式，中线判定 + FLIP 动画）
- 独立模块 modules/todo/features/sortable.js，数据流单向

## v1.4.5

### 设置
- 面板宽度缩小为 280px，移除标题文字

### 配置
- 宪法新增 Brainstorming 强制规范

## v1.4.4

### 设置
- Myday 与设置面板互斥：打开一个时自动关闭另一个

## v1.4.3

### 设置
- 版本号显示加 "v" 前缀，缩小字号，移除分隔线

## v1.4.2

### 架构
- 新增 start.bat / start.sh 本地开发服务器脚本（Python / npx 备选）
- app.js 所有 DOM 引用增加空值检查，缺失时在控制台输出错误而非崩溃
- 保持模块化 HTML 外部加载（fetch），要求通过 http://localhost 访问

## v1.4.1

### 架构
- 修复 file:// CORS：Todo HTML 恢复内联，CSS/JS 保持模块化
- 移除动态 XHR 加载，恢复静态脚本顺序加载

## v1.4.0

### 设置
- 新增全局设置面板（右上角汉堡菜单，右侧滑入）
- 面板底部显示版本号 + "by Donwayne" 署名
- 中间区域预留功能列表

## v1.3.0

### 架构
- 恢复模块化 HTML：Todo HTML 片段抽取到 modules/todo/index.html
- Shell 通过 XHR 加载 HTML + 动态注入 JS，保持 file:// 兼容

## v1.2.3

### 配置
- 拆分推送指令："推送"仅 push，"发布"打标签 + 触发 Release

## v1.2.2

### 待办
- Myday 空状态提示改为 "No, be relax~"
- 空任务列表提示改为 "Add To Work"

## v1.2.1

### 待办
- 移除不必要的旧键兼容逻辑（无 v1.0.0 用户）

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
