#Requires -Version 5.1
<#
.SYNOPSIS
    校验 VideoMap Pro 的 Windows 构建产物是否完整。

.DESCRIPTION
    检查项：
      1. release 目录下是否生成了安装包 / 便携版 / zip
      2. win-unpacked 目录结构是否完整（exe、app.asar、resources）
      3. extraResources（config / ffmpeg / presets）是否被正确拷贝
      4. 产物体积是否异常

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts/verify-build.ps1
    npm run verify
#>
param(
    [string]$ReleaseDir = "release",
    [string]$AppName    = "VideoMap Pro"
)

$ErrorActionPreference = 'Continue'
$fail = 0

function Write-Check([bool]$ok, [string]$msg) {
    if ($ok) { Write-Host "  [ OK ] $msg" -ForegroundColor Green }
    else     { Write-Host "  [FAIL] $msg" -ForegroundColor Red; $script:fail++ }
}

Write-Host ""
Write-Host "=== VideoMap Pro 构建产物校验 ===" -ForegroundColor Cyan
Write-Host "目录: $(Resolve-Path $ReleaseDir -ErrorAction SilentlyContinue)"
Write-Host ""

# ---------------------------------------------------------------
# 1. 产物文件
# ---------------------------------------------------------------
Write-Host "[1/4] 产物文件" -ForegroundColor Yellow
if (-not (Test-Path $ReleaseDir)) {
    Write-Check $false "未找到目录 $ReleaseDir，请先执行 npm run build:win"
    exit 1
}

$artifacts = Get-ChildItem -Path $ReleaseDir -File |
             Where-Object { $_.Extension -in '.exe', '.zip' }

if ($artifacts.Count -eq 0) {
    Write-Check $false "release 目录下没有 .exe / .zip 产物"
    exit 1
}

foreach ($a in $artifacts) {
    $mb = [math]::Round($a.Length / 1MB, 2)
    Write-Host ("         {0,-48} {1,8} MB" -f $a.Name, $mb)
}

$setup    = $artifacts | Where-Object { $_.Name -like "*Setup*" }
$portable = $artifacts | Where-Object { $_.Name -like "*portable*" }
$zipFile  = $artifacts | Where-Object { $_.Extension -eq '.zip' }

Write-Check ($null -ne $setup)    "存在 NSIS 安装包"
Write-Check ($null -ne $portable) "存在便携版单文件 exe"
Write-Check ($null -ne $zipFile)  "存在 zip 目录分发包"

# 体积合理性（Electron 应用通常 120~350MB）
foreach ($a in $artifacts) {
    $mb = $a.Length / 1MB
    if ($mb -lt 5)   { Write-Check $false "$($a.Name) 体积过小($([math]::Round($mb,1))MB)，可能打包不完整" }
    if ($mb -gt 600) { Write-Host "  [WARN] $($a.Name) 体积偏大($([math]::Round($mb,1))MB)，建议排查冗余依赖" -ForegroundColor Yellow }
}

# ---------------------------------------------------------------
# 2. win-unpacked 目录结构
# ---------------------------------------------------------------
Write-Host ""
Write-Host "[2/4] win-unpacked 目录结构" -ForegroundColor Yellow
$unpacked = Join-Path $ReleaseDir "win-unpacked"

if (Test-Path $unpacked) {
    $mainExe = Join-Path $unpacked "$AppName.exe"
    Write-Check (Test-Path $mainExe) "主程序 $AppName.exe"

    $asar = Join-Path $unpacked "resources\app.asar"
    Write-Check (Test-Path $asar) "resources\app.asar（应用主体已归档）"

    # 校验 asar 内是否包含入口
    $unpackedRes = Join-Path $unpacked "resources\app"
    if (Test-Path $unpackedRes) {
        $asarEntry = Join-Path $unpackedRes "dist-electron\main.js"
        Write-Check (Test-Path $asarEntry) "入口 dist-electron\main.js（asarUnpack 解包）"
    }
} else {
    Write-Host "  [INFO] 未找到 win-unpacked（nsis 构建后通常会生成），跳过" -ForegroundColor DarkGray
}

# ---------------------------------------------------------------
# 3. extraResources 附加数据文件
# ---------------------------------------------------------------
Write-Host ""
Write-Host "[3/4] extraResources 附加数据文件" -ForegroundColor Yellow
if (Test-Path $unpacked) {
    $resRoot = Join-Path $unpacked "resources"
    Write-Check (Test-Path (Join-Path $resRoot "config\app-config.json")) "config\app-config.json"
    Write-Check (Test-Path (Join-Path $resRoot "presets\default-preset.json")) "presets\default-preset.json"

    $ffmpegDir = Join-Path $resRoot "ffmpeg"
    if (Test-Path $ffmpegDir) {
        $ff = Get-ChildItem -Path $ffmpegDir -Filter "ffmpeg.exe" -Recurse -ErrorAction SilentlyContinue
        if ($ff) { Write-Check $true  "ffmpeg\ffmpeg.exe（随包分发）" }
        else     { Write-Host "  [WARN] ffmpeg\ffmpeg.exe 未随包，转码将依赖系统 PATH" -ForegroundColor Yellow }
    } else {
        Write-Host "  [WARN] 未找到 resources\ffmpeg 目录" -ForegroundColor Yellow
    }
}

# ---------------------------------------------------------------
# 4. 后续动作提示
# ---------------------------------------------------------------
Write-Host ""
Write-Host "[4/4] 后续动作" -ForegroundColor Yellow
Write-Host "  1) 把安装包拷贝到纯净 Windows 10/11（或 Windows 沙盒 / 虚拟机）"
Write-Host "  2) 双击安装，确认无 SmartScreen / 杀软拦截"
Write-Host "  3) 启动后依次验证：图层预览播放、Mapping 多屏输出、Transfer、Encoder"
Write-Host "  4) 检查 任务管理器 -> 详细信息 中进程名为 '$AppName.exe' 且无伴生控制台窗口"
Write-Host ""

if ($fail -gt 0) {
    Write-Host "结果：存在 $fail 项失败，请修复后重新构建。" -ForegroundColor Red
    exit 1
} else {
    Write-Host "结果：全部校验通过。" -ForegroundColor Green
    exit 0
}
