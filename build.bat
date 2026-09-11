@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ======================================
echo VideoMap Pro - Windows 打包脚本
echo ======================================
echo.

REM ---------- 0. 环境检查 ----------
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未检测到 Node.js，请安装 Node.js 20+ : https://nodejs.org/
    pause & exit /b 1
)
npm -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未检测到 npm。
    pause & exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo Node 版本: %NODE_VER%

REM ---------- 1. 可选：国内镜像加速 Electron 下载 ----------
if "%USE_CN_MIRROR%"=="1" (
    echo 使用国内镜像加速...
    set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
    set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
    npm config set registry https://registry.npmmirror.com
) else (
    npm config set registry https://registry.npmjs.org
)

REM ---------- 2. 清理旧产物 ----------
echo.
echo [1/5] 清理旧产物...
if exist "dist"          rmdir /s /q "dist"
if exist "dist-electron" rmdir /s /q "dist-electron"
if exist "release"       rmdir /s /q "release"

REM ---------- 3. 安装依赖 ----------
echo.
echo [2/5] 安装依赖...
if exist "package-lock.json" (
    npm ci
) else (
    npm install
)
if errorlevel 1 (
    echo [ERROR] 依赖安装失败。
    pause & exit /b 1
)

REM ---------- 4. 剔除 devDependencies，减小体积 ----------
echo.
echo [3/5] 裁剪开发依赖...
npm prune --omit=dev
if errorlevel 1 (
    echo [WARN] npm prune 未成功，继续构建。
)

REM ---------- 5. TypeScript 检查 + 前端构建 + 打包 ----------
echo.
echo [4/5] 类型检查 / 构建 / 打包...
call npm run build:win
if errorlevel 1 (
    echo [ERROR] 打包失败。
    pause & exit /b 1
)

REM ---------- 6. 校验产物 ----------
echo.
echo [5/5] 校验产物...
powershell -ExecutionPolicy Bypass -NoProfile -File "scripts\verify-build.ps1"
if errorlevel 1 (
    echo [WARN] 产物校验存在告警或失败项，请检查上方输出。
)

echo.
echo ======================================
echo 构建完成，产物位于 release\
echo ======================================
dir /b release
echo.
pause
endlocal
