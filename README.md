# 桌面应用模板 v2

这是一个基于 Vue.js 3 和 Electron 的现代化桌面应用程序模板，提供了简洁的基础结构和自定义窗口控制功能。

## 主要特性

- 🎨 **自定义标题栏**：美观的渐变标题栏，包含窗口控制按钮
- 🪟 **窗口控制**：支持最小化、最大化/恢复、关闭窗口
- 📱 **响应式设计**：适配不同屏幕尺寸
- ⚡ **快速开发**：基于 Vue CLI 的热重载开发环境
- 🔧 **易于扩展**：简洁的项目结构，便于二次开发

## 项目结构

```
src/
├── components/          # Vue 组件
│   ├── TitleBar.vue   # 自定义标题栏组件
│   ├── HomePage.vue   # 主页组件
│   └── common/        # 通用组件
├── App.vue            # 根组件
├── background.js      # Electron 主进程
├── preload.js         # 预加载脚本
└── main.js           # Vue 应用入口
```

## 开发环境准备

### 安装依赖
```bash
npm install
```

### 开发模式运行
```bash
# 启动开发服务器（带热重载）
npm run electron:serve

# 或仅启动 Web 版本
npm run serve
```

### 生产构建
```bash
# 构建生产版本
npm run build

# 构建 Electron 应用
npm run electron:build
```

### 代码检查
```bash
npm run lint
```

## 窗口配置

应用使用无边框窗口设计，通过自定义标题栏实现窗口控制。相关配置在 `background.js` 中：

- `frame: false` - 移除默认窗口边框
- `titleBarStyle: 'hidden'` - 隐藏原生标题栏

## 自定义开发

### 添加新组件
在 `src/components/` 目录下创建新的 Vue 组件，然后在需要的地方引入使用。

### 修改窗口行为
窗口控制逻辑位于：
- `src/components/TitleBar.vue` - 前端界面和交互
- `src/background.js` - 后端窗口控制

### 样式定制
应用使用基础 CSS 样式，可根据需要修改：
- 主题色在 `TitleBar.vue` 的渐变背景中定义
- 全局样式可在 `App.vue` 中调整

## 注意事项

1. **开发环境**：需要 Node.js 16+ 和 npm
2. **构建要求**：Windows 系统需要 Visual Studio Build Tools
3. **权限问题**：在某些系统上可能需要管理员权限安装依赖
4. **镜像配置**：如遇网络问题，可配置国内 npm 镜像源

## 扩展建议

- 添加更多页面路由（可集成 Vue Router）
- 集成状态管理（Vuex 或 Pinia）
- 添加系统托盘功能
- 实现应用自动更新

## 技术支持

基于以下技术栈构建：
- Vue.js 3
- Electron
- Vue CLI
- Node.js

如需更多配置选项，请参考 [Vue CLI 配置文档](https://cli.vuejs.org/config/)。
