# To Do
ai辅助完成
纯 HTML/CSS/JavaScript 构建的待办事项 PWA 应用。无需框架，无需构建，打开即用。

## 特性

- **离线可用** — Service Worker 缓存优先策略，断网也能正常使用
- **PWA** — 支持添加到手机主屏幕，独立窗口运行
- **日历 DDL** — 年/月导航日历面板，快速设置截止日期
- **My Day** — 点击太阳图标，自动汇集今日到期任务
- **长按编辑** — 移动端长按/桌面端右键唤出上下文菜单
- **自动归档** — 已完成任务自动沉底，过期任务自动清理
- **本地存储** — 所有数据保存在浏览器 localStorage，无需后端

## 技术栈

| 层 | 技术 |
|----|------|
| 结构 | HTML5 语义标签 |
| 样式 | 纯 CSS（现代重置、scroll-snap、CSS 动画） |
| 逻辑 | 原生 JavaScript ES6（无任何依赖） |
| 存储 | localStorage |
| PWA | Manifest + Service Worker |

## 文件结构

```
/
├── index.html                    # Shell：顶栏 + 底栏 + 模块容器
├── css/style.css                 # Shell 样式
├── js/shell.js                   # Shell 逻辑（WiFi、横幅、Myday 面板）
├── modules/todo/
│   ├── style.css                 # Todo 模块样式
│   └── app.js                    # Todo 模块逻辑
├── service-worker.js             # 离线缓存
├── manifest.json                 # PWA 清单
├── icon.svg                      # 应用图标
├── CHANGELOG.md                  # 更新日志
└── README.md
```

## 使用方式

### 本地打开

直接双击 `index.html`，或在项目目录启动任意静态服务器：

```bash
npx serve .
```

### 部署到 Netlify

1. 将项目推送到 GitHub
2. 在 [netlify.com](https://netlify.com) 选择该仓库
3. 无需构建命令，发布目录留空
4. 部署完成后即可通过 `xxx.netlify.app` 访问

## 数据模型

```js
{
  id: 1716200000000,          // 时间戳
  content: "完成项目报告",     // 任务内容
  completed: false,            // 是否完成
  deadline: "2026-05-25"      // 截止日期（可选）
}
```

## License

MIT
