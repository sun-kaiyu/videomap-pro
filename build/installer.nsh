; ============================================================
; VideoMap Pro —— 自定义 NSIS 宏
; 由 electron-builder.yml 中的 nsis.include 引用。
; 若不需要自定义行为，删除 yml 里的 `include: build/installer.nsh` 即可。
;
; 可用宏（定义了就生效，未定义则回落到默认行为）：
;   customHeader     安装包头部区域
;   preInit          初始化前（可在此检测残留进程）
;   customInit       初始化
;   customInstall    文件复制完成后
;   customUnInstall  卸载时
;   customUnInit     卸载初始化
; ============================================================

; ------------------------------------------------------------
; 安装完成后：在 resources 目录写入版本标记，便于现场排障确认版本来源
; ------------------------------------------------------------
!macro customInstall
  FileOpen $0 "$INSTDIR\resources\INSTALL_SOURCE.txt" w
  FileWrite $0 "VideoMap Pro - installed via NSIS$\r$\n"
  FileWrite $0 "InstallDir=$INSTDIR$\r$\n"
  FileClose $0
!macroend

; ------------------------------------------------------------
; 示例：卸载时清理用户缓存（默认 deleteAppDataOnUninstall=false，即保留）
; 如需卸载即清空用户数据，取消下面注释，并把 yml 中 deleteAppDataOnUninstall 设为 true
; ------------------------------------------------------------
; !macro customUnInstall
;   RMDir /r "$APPDATA\VideoMap Pro"
; !macroend

; ------------------------------------------------------------
; 示例：安装前检测程序是否正在运行（需要 FindProcDLL 插件，默认不内置）
; ------------------------------------------------------------
; !macro preInit
;   FindProcDLL::FindProc "VideoMap Pro.exe"
;   IntCmp $R0 1 0 no_run
;     MessageBox MB_OK|MB_ICONEXCLAMATION "检测到 VideoMap Pro 正在运行，请先关闭后重试。" /SD IDOK
;     Abort
;   no_run:
; !macroend
