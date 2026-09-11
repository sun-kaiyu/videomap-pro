# VideoMap Pro

一款面向 Windows PC 的桌面端视频映射播放软件，参考专业媒体服务器界面设计，支持图层预览、素材库、扩展显示器输出映射、局域网素材同步、内置 FFmpeg 转码等功能。

## 功能特性

- **播放控制栏**：左侧提供 Visual、Text & Controls、Playback、Pre Fx Pose 参数面板，支持强度、速度、缩放、位置、旋转等实时调节。
- **图层监视区**：上方显示多个图层实时预览，每个图层显示当前时长/总时长，支持播放、暂停、停止、循环。
- **素材与预设区**：下方 Bank/Preset 网格，支持保存和调用图层快照。
- **窗口管理 / 映射**：Mapping 面板自动识别 Windows 检测到的多台扩展显示器，支持将任意图层映射到指定显示器全屏或自定义窗口输出。
- **素材同步**：Transfer 面板支持局域网内多台服务器之间发现与传输素材文件。
- **内置转码**：SAGA Encoder 面板基于 FFmpeg，支持 H.264/H.265/VP9/ProRes 等主流视频格式转换。

## 技术栈

- Electron + Vite + React + TypeScript
- Tailwind CSS（暗色主题）
- Zustand 状态管理
- FFmpeg（转码与视频信息读取）
- Node.js net 模块（局域网文件传输）

## 开发运行

```bash
npm install
npm run dev
```

## 打包 Windows 安装程序

在 Windows 10/11 上，安装 Node.js 20+ 并保证 `npm` 可用后，双击或在命令行中运行：

```bash
build.bat
```

该脚本会自动清理旧构建、安装依赖并调用 `npm run build:win`。打包产物位于 `release/` 目录：

- `VideoMap Pro Setup 1.0.0.exe`：可执行的安装程序
- `VideoMap Pro-1.0.0-win-x64.exe`：便携版（如配置）

若在中国大陆，可先在 `build.bat` 中将 npm registry 改为 `https://registry.npmmirror.com/` 以加速 Electron 等二进制文件下载。

## 目录结构

```
videomap/
├── build/              # 图标、构建资源
├── dist/               # Vite 渲染进程产物
├── dist-electron/      # Electron 主进程产物
├── electron/           # 主进程与预加载脚本
│   ├── main.ts
│   └── preload.ts
├── release/            # 最终安装包
├── src/                # React 前端源码
│   ├── components/     # UI 组件
│   ├── store/          # Zustand store
│   ├── lib/            # 工具函数
│   └── types/          # TypeScript 类型
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 依赖准备

- 安装 [Node.js](https://nodejs.org/) LTS 版本（推荐 20.x+）
- 可选：把 `ffmpeg.exe` 放入 `resources/ffmpeg/` 随包分发（不放则转码回落到系统 PATH）

## 打包为 Windows 安装程序

完整说明见 **[PACKAGING.md](./PACKAGING.md)**：三种分发形态对比与选型、配置逐段讲解、纯净 Windows 环境验证清单、常见问题排障（路径失效 / 依赖缺失 / 体积过大 / 杀毒误报 / 控制台隐藏）。

快速开始：

```bash
npm ci
npm run build:win     # nsis 安装包 + 便携版 + zip
npm run verify        # 校验产物
```

或直接双击 `build.bat`（国内镜像加速：`set USE_CN_MIRROR=1 && build.bat`）。

产物位于 `release/`：

- `VideoMap Pro-Setup-1.0.0.exe` —— 带安装向导的安装包
- `VideoMap Pro-1.0.0-portable.exe` —— 单文件便携版
- `VideoMap Pro-1.0.0-win-x64.zip` —— 目录分发包

## 构建环境说明

由于当前自动化构建环境对 npm/Electron Builder 二进制下载及大体积依赖安装存在网络与沙箱限制，本仓库以**完整源码**形式交付。源码已通过 TypeScript 类型检查，UI 与业务逻辑完整。请在标准 Windows 开发环境（能正常访问 npm registry）中运行 `build.bat` 即可生成可执行的 `.exe` 安装程序。

## 注意事项

- 输出窗口映射功能依赖 Windows 扩展显示器，请确保在操作系统中已正确识别多个显示器。
- 局域网传输为点对点 TCP 传输，目标主机需在本软件中启动 "Start Server"。
- 本地开发时，点击图层预览中的视频需要选择本地视频文件；输出窗口将同步主界面播放状态。
- 转码功能优先使用 `resources/ffmpeg/ffmpeg.exe`（随包分发），未放置时回落到系统 PATH 中的 ffmpeg。
