# VideoMap Pro —— Windows 打包指南

> 适用：`videomap/` 工程（Electron 30 + Vite 5 + React 18 + TypeScript 5.4）
> 目标产物：Windows 10/11 x64 的 `.exe` 安装包 / 单文件便携版 / 目录分发包

---

## 0. 打包前提事实（已确认，无需补充）

| 项目 | 值 |
|---|---|
| 运行时 | Electron 30（内置 Node 20） |
| 主进程入口 | `dist-electron/main.js` ← 源码 `electron/main.ts`（`package.json` 的 `main` 字段） |
| 预加载脚本 | `dist-electron/preload.js` ← 源码 `electron/preload.ts` |
| 渲染进程入口 | `dist/index.html` ← 源码 `src/main.tsx` |
| 运行依赖 | `react` `react-dom` `zustand` `@heroicons/react` |
| 构建依赖 | `electron` `electron-builder` `vite` `typescript` `tailwindcss` `postcss` `autoprefixer` `@vitejs/plugin-react` `vite-plugin-electron(-renderer)` |
| 打包工具 | `electron-builder` 24 |
| 图标 | `build/icon.ico`（已含 16/32/48/64/128/256 多尺寸） |
| 附加数据 | `resources/config`、`resources/ffmpeg`、`resources/presets` |
| 原生模块 | 无（→ 可关闭 `npmRebuild`） |

---

## 1. 三种分发形态对比与选型

| 形态 | electron-builder target | 产物示例 | 体积量级 | 优点 | 缺点 | 适用场景 |
|---|---|---|---|---|---|---|
| **安装程序** | `nsis` | `VideoMap Pro-Setup-1.0.0.exe` | 90–140 MB | 有安装向导、桌面/开始菜单快捷方式、卸载入口、可写安装目录、支持多语言 | 需安装过程；未签名会有 SmartScreen 提示 | **正式交付客户 / 现场部署（推荐）** |
| **单文件便携版** | `portable` | `VideoMap Pro-1.0.0-portable.exe` | 150–250 MB | 双击即用、免安装、免管理员、可放 U 盘 | 首次启动要自解压（较慢）；无卸载入口；杀软误报率略高 | 演示 / 展会 / 临时机器 / 无管理员权限 |
| **目录分发** | `zip`（或 `dir`） | `VideoMap Pro-1.0.0-win-x64.zip` | 150–250 MB | 解压即用、便于内网分发与增量 diff、便于现场排查 | 无快捷方式、无卸载入口、用户需自行解压 | 内网批量分发 / 开发联调 / 灰度 |

### 选型建议

- **正式交付 → `nsis`**（默认首选，用户体验最完整）
- **同时产出 `portable`** 作为"免安装备选"，应对无管理员权限的机器
- **联调阶段用 `--dir`**（只生成 `win-unpacked/`，不做压缩打包，构建最快，便于排查文件缺失）
- 当前 `electron-builder.yml` 已同时配置 `nsis` + `portable` + `zip` 三个 target；不需要的在 YAML 里注释掉即可显著提速

---

## 2. 完整命令与配置

### 2.1 一键命令

```bash
# ① 安装依赖（有 lock 文件用 ci 更稳）
npm ci            # 或 npm install

# ② 类型检查 + 前端构建 + 打包（核心命令）
npm run build:win
# 等价于：tsc --noEmit && vite build && electron-builder --win --config electron-builder.yml --publish never

# ③ 校验产物
npm run verify

# —— 或者直接双击 ——
build.bat                       # 国内镜像加速：set USE_CN_MIRROR=1 && build.bat
```

### 2.2 分形态构建

```bash
# 只做目录产物（最快，用于排查文件是否齐全，不生成 exe）
npx electron-builder --dir --win --config electron-builder.yml

# 只要安装包：注释 electron-builder.yml 中 win.target 下的 portable / zip
npm run build:win

# 指定架构
npx electron-builder --win --x64 --config electron-builder.yml
```

### 2.3 配置文件：`electron-builder.yml`（已在仓库中，逐段说明）

```yaml
appId: com.arkaos.videomappro      # 卸载注册表项 / 更新标识，必须唯一
productName: VideoMap Pro          # 安装目录名、快捷方式名、exe 名
copyright: Copyright © 2026 Arkaos

directories:
  output: release                  # 产物输出目录
  buildResources: build            # 构建资源目录（icon.ico、installer.nsh 放这里）

# ===== 入口与参与打包的文件（打进 app.asar，只读）=====
files:
  - dist/**/*                      # 渲染进程产物
  - dist-electron/**/*             # 主进程 + preload（= 入口）
  - package.json                   # 必须有，"main" 字段指向入口
  - build/icon.ico                 # 窗口标题栏 / 任务栏图标
  - "!src/**/*"                    # 排除源码
  - "!electron/**/*"               # 排除 TS 源（只保留编译产物）
  - "!release/**/*"
  - "!resources/**/*"              # 由 extraResources 单独处理
  - "!**/*.map" "!**/*.md" "!**/*.log"

# ===== asar 归档 =====
asar: true                         # 打成单个 app.asar，减少文件数、加快启动
asarUnpack:                        # 必须从 asar 解包（原生模块/二进制无法在 asar 内被系统加载）
  - "**/*.node"
  - "**/*.dll"

# ===== 附加数据文件（不进 asar，落在 <安装目录>/resources/<to>/）=====
extraResources:
  - from: resources/config
    to: config
    filter: ["**/*"]
  - from: resources/ffmpeg
    to: ffmpeg
    filter: ["**/*"]
  - from: resources/presets
    to: presets
    filter: ["**/*"]

# ===== Windows =====
win:
  icon: build/icon.ico             # 必须是 .ico，建议含 16/32/48/64/128/256
  target:
    - { target: nsis,     arch: [x64] }
    - { target: portable, arch: [x64] }
    - { target: zip,      arch: [x64] }
  # certificateFile: cert/code-sign.pfx
  # certificatePassword: "%CSC_KEY_PASSWORD%"     # 从环境变量读，禁止硬编码
  # signingHashAlgorithms: [sha256]
  # timestampingServerUrl: http://timestamp.digicert.com

# ===== NSIS 安装向导 =====
nsis:
  oneClick: false                  # false=显示向导；true=一键静默
  perMachine: false                # 当前用户安装，免管理员
  allowElevation: true
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: VideoMap Pro
  deleteAppDataOnUninstall: false   # 卸载时保留用户数据
  runAfterFinish: true
  language: "2052"                  # 2052 = 简体中文
  displayLanguageSelector: true
  installerLanguages: [zh_CN, en_US]
  requestedExecutionLevel: asInvoker  # 不弹 UAC
  artifactName: "${productName}-Setup-${version}.${ext}"
  include: build/installer.nsh        # 自定义 NSIS 宏（可选）

portable:
  artifactName: "${productName}-${version}-portable.${ext}"
zip:
  artifactName: "${productName}-${version}-${os}-${arch}.${ext}"

# ===== 优化 =====
compression: maximum                # maximum（最小）/ normal / store（最快）
npmRebuild: false                   # 无原生模块 → 关闭，显著加速
removePackageScripts: true          # 移除产物 package.json 的 scripts
```

### 2.4 入口文件如何确定（三处必须一致）

1. `package.json` → `"main": "dist-electron/main.js"`
2. `electron-builder.yml` → `files` 中必须包含 `dist-electron/**/*`
3. `electron/main.ts` 中加载渲染进程：

```ts
app.isPackaged
  ? win.loadFile(path.join(__dirname, '../dist/index.html'))   // 打包后：app.asar/dist/index.html
  : win.loadURL('http://localhost:5173')                        // 开发
```

> **已修复的关键坑**：`vite.config.ts` 必须设置 `base: './'`。
> Vite 默认 `base: '/'`，会产出 `/assets/xxx.js`，而打包后是 `file://` 协议，绝对路径会导致**白屏**。

### 2.5 依赖如何处理

| 规则 | 说明 |
|---|---|
| 运行时依赖 | 必须写在 `dependencies`，**不能**写在 `devDependencies`（否则打包时被剔除） |
| electron-builder 默认行为 | 只打包 `dependencies` 树，`devDependencies` 自动排除 |
| 构建前裁剪 | `npm prune --omit=dev`（`build.bat` 已内置） |
| 原生模块（`.node`） | 需要 `npmRebuild: true` + `asarUnpack: ["**/*.node"]`；本项目无原生模块，故 `npmRebuild: false` |
| 第三方二进制（ffmpeg） | 走 `extraResources`，不要放 `node_modules` |

### 2.6 图标

- 文件：`build/icon.ico`（必须 `.ico`，且含多尺寸，否则缩放模糊）
- 生成脚本已内置：`build/generate-icon.py`（Pillow 生成 PNG + 多尺寸 ICO）
- 两处生效：
  - **exe / 安装包图标**：`win.icon: build/icon.ico`（electron-builder 自动注入）
  - **窗口标题栏 / 任务栏图标**：`new BrowserWindow({ icon: path.join(__dirname, '../build/icon.ico') })`（**已在本项目实现**）

### 2.7 附加数据文件（配置 / 图片 / 模型 / ffmpeg）

统一走 `extraResources`，打包后位于 `<安装目录>/resources/<to>/`，**不在 asar 内，可读写**。

运行时读取方式（本项目 `electron/main.ts` 已实现）：

```ts
// 资源根目录：打包后 = <安装目录>/resources；开发时 = 项目根/resources
function getResourcesDir(): string {
  return app.isPackaged ? process.resourcesPath : path.join(app.getAppPath(), 'resources')
}

// 例：解析随包的 ffmpeg
function resolveFFmpeg(): string {
  const bundled = path.join(getResourcesDir(), 'ffmpeg',
                            process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
  return fs.existsSync(bundled) ? bundled : 'ffmpeg'   // 回落到系统 PATH
}

// 例：读取随包配置
const cfg = JSON.parse(fs.readFileSync(path.join(getResourcesDir(), 'config', 'app-config.json'), 'utf-8'))
```

| 数据类别 | 建议放法 |
|---|---|
| 小配置 JSON、预置预设 | `extraResources` |
| 图片/图标素材（被前端引用） | 放 `src/assets` 由 Vite 打包进 `dist`；或 `extraResources` + `file://` 读取 |
| ffmpeg 等第三方 exe | `extraResources`（不要塞进 asar） |
| **大模型（>200 MB）** | **不建议打进安装包**；改为首次启动时下载到 `app.getPath('userData')`，避免安装包过大与更新困难 |

---

## 3. 在纯净 Windows 环境验证产物

### 3.1 准备干净环境（任选其一）

| 方案 | 适用 |
|---|---|
| **Windows 沙盒**（Win10/11 专业版+，内置） | 最快，每次都是全新系统，关闭即销毁 |
| Hyper-V / VirtualBox 全新 Win10/11 虚拟机 | 可保存快照，适合反复回归 |
| 局域网内一台未装 Node/VS 的机器 | 最接近真实客户环境 |

> 要点：环境里**不能有 Node.js、不能有项目源码**，只拷贝安装包过去。

### 3.2 验证清单

| # | 检查项 | 通过标准 |
|---|---|---|
| 1 | 双击安装包 | 无"缺少 xxx.dll"弹窗；向导中文显示正常 |
| 2 | 安装向导流程 | 可选择安装目录；桌面 + 开始菜单生成快捷方式 |
| 3 | 启动主程序 | 主窗口正常渲染，**无白屏**、无控制台黑窗闪现 |
| 4 | 任务管理器 | 进程名为 `VideoMap Pro.exe`，且**无伴生的 conhost/控制台进程** |
| 5 | 图标 | 桌面快捷方式、任务栏、标题栏均显示正确图标 |
| 6 | 功能-图层 | 选择本地视频 → 预览播放、时长显示正确 |
| 7 | 功能-输出 | Mapping 能识别扩展显示器，打开输出窗口 |
| 8 | 功能-转码 | Encoder 能调用随包 ffmpeg 完成转码 |
| 9 | 功能-同步 | Transfer 启动服务端 + 发送到另一台机器 |
| 10 | 数据写入 | `resources/config/app-config.json` 可读；用户数据写入 `%APPDATA%` |
| 11 | 卸载 | 控制面板可卸载；按配置保留/删除用户数据 |
| 12 | 便携版（若产出） | 拷贝到任意目录/U 盘双击可运行 |

### 3.3 自动化校验

```bash
npm run verify
# 或：powershell -ExecutionPolicy Bypass -File scripts/verify-build.ps1
```

脚本会校验：产物文件是否齐全、`win-unpacked` 目录结构、`app.asar` 是否存在、`extraResources` 是否被正确拷贝、体积是否异常，并打印后续人工验证提示。

### 3.4 缺失 DLL 定位工具

- [Dependencies](https://github.com/lucasg/Dependencies)：打开 exe 看缺失的 DLL
- Process Monitor：过滤 `NAME NOT FOUND` 定位找不到的文件
- 事件查看器 → Windows 日志 → 应用程序：查看崩溃记录

---

## 4. 常见问题处理

### 4.1 路径失效（白屏 / "Cannot find module" / 找不到文件）

| 症状 | 原因 | 解决 |
|---|---|---|
| 启动白屏 | Vite `base:'/'` 产出绝对路径，在 `file://` 下失效 | `vite.config.ts` 设 `base: './'`（**本项目已修复**） |
| `Cannot find module 'dist-electron/main.js'` | `files` 未包含 `dist-electron/**/*` | 检查 yml 的 `files` |
| 资源路径时好时坏 | 用了 `process.cwd()` | 改用 `__dirname`（asar 内）或 `process.resourcesPath`（extraResources）；快捷方式启动会改变 cwd |
| 写文件失败 | asar 是只读归档 | 用户数据写 `app.getPath('userData')` |
| 原生模块加载失败 | 模块被关进 asar | `asarUnpack: ["**/*.node"]` + `npmRebuild: true` |

### 4.2 依赖缺失

- **运行时依赖被误放到 `devDependencies`** → 移到 `dependencies` 后重新 `npm install`
- **`node_modules` 未被打包** → 不要手动排除 `node_modules`，electron-builder 会自动只取生产依赖树
- **ffmpeg 找不到** → 确认 `resources/ffmpeg/ffmpeg.exe` 存在；不存在时回落到系统 PATH，需用户自行安装 ffmpeg
- **快速复现** → `npx electron-builder --dir --win --config electron-builder.yml`，直接看 `win-unpacked/` 里少了什么

### 4.3 体积过大

Electron 应用正常区间 **120–250 MB**，超过 350 MB 需要排查：

1. `compression: maximum`（已配置）
2. 构建前 `npm prune --omit=dev`（`build.bat` 已内置）
3. 关闭 sourcemap、开启压缩（`vite.config.ts` 已设为 `sourcemap: false, minify: 'esbuild'`）
4. 排除源码 / `.map` / 文档（yml 的 `!` 规则）
5. 检查是否误把大模型、测试视频打进了 `files` 或 `extraResources`
6. 大资源改为首次启动下载到 `userData`
7. `asar: true` 本身能显著减少文件数（对 NTFS 体积影响有限，但能加快安装与启动）

### 4.4 杀毒误报 / SmartScreen 拦截

| 措施 | 效果 |
|---|---|
| **代码签名（OV 证书）** | 根本解决"未知发布者"；大幅降低误报 |
| **EV 证书** | 可立即建立 SmartScreen 信誉，无需积累 |
| 时间戳服务 | 证书过期后签名依然有效 |
| 不加壳、不混淆 | 加壳反而显著提高误报率 |
| 向杀软厂商提交白名单 | 针对特定误报的临时手段 |
| 提交微软分析门户 | 解除 SmartScreen 拦截 |

签名配置（**密码走环境变量，禁止硬编码进仓库**）：

```yaml
win:
  certificateFile: cert/code-sign.pfx
  certificatePassword: "%CSC_KEY_PASSWORD%"
  signingHashAlgorithms: [sha256]
  timestampingServerUrl: http://timestamp.digicert.com
```

构建时注入：

```bat
set CSC_KEY_PASSWORD=你的证书密码
npm run build:win
```

未签名时用户侧的临时绕过：**"更多信息" → "仍要运行"**。

### 4.5 控制台窗口隐藏

- **主进程**：Electron 打包后是 GUI 子系统应用，**默认不显示控制台**。
- **子进程（本项目核心坑）**：`spawn('ffmpeg.exe', ...)` 在 Windows 上会**闪现黑色控制台窗口**。
  **已在 `electron/main.ts` 修复**：

  ```ts
  spawn(useFFmpeg, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,   // ← 关键：隐藏子进程控制台窗口
    shell: false         // ← 不经 shell，避免额外窗口
  })
  ```

- **开发期日志**：`console.log` 输出到终端；发布版如需留日志，写文件到 `app.getPath('userData')`，或启动时加 `--enable-logging`。

### 4.6 其它高频问题

| 问题 | 处理 |
|---|---|
| 卸载后重装失败 | 检查 `deleteAppDataOnUninstall`、`customUnInstall` 是否残留目录 |
| 多开实例 | 用 `app.requestSingleInstanceLock()` 做单实例 |
| 安装时文件被占用 | 在 `installer.nsh` 的 `preInit` 检测并提示关闭（需 FindProcDLL 插件，模板已给出注释） |
| 更新 | 接入 `electron-updater` + `publish` 配置 |

---

## 5. 交付清单

- [x] `electron-builder.yml` —— 完整打包配置（入口 / 依赖 / 图标 / 附加数据 / 三形态 target）
- [x] `package.json` —— `main` 入口正确，脚本 `build:win` / `verify`
- [x] `vite.config.ts` —— `base: './'`（修复白屏）、生产压缩、关闭 sourcemap
- [x] `electron/main.ts` —— 资源路径解析、`windowsHide: true`、随包配置读取、窗口图标
- [x] `build/icon.ico` + `build/installer.nsh`
- [x] `resources/` —— config / ffmpeg / presets 示例附加数据
- [x] `scripts/verify-build.ps1` —— 产物自动校验
- [x] `build.bat` —— 一键构建（支持 `USE_CN_MIRROR=1` 镜像加速）

**运行方式**：`build.bat`（或 `npm ci && npm run build:win && npm run verify`）
**已知限制**：未配置代码签名证书时，首次运行会触发 SmartScreen 提示；`resources/ffmpeg/ffmpeg.exe` 需自行放入，否则转码回落到系统 PATH。
