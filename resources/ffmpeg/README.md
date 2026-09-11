# FFmpeg 放置目录

把 Windows 版 `ffmpeg.exe`（建议同时放 `ffprobe.exe`）复制**到本目录**（即 `resources/ffmpeg/`）。

打包后位置：`<安装目录>/resources/ffmpeg/ffmpeg.exe`
主进程解析逻辑见 `electron/main.ts` 的 `resolveFFmpeg()`：

```
打包后 -> process.resourcesPath/ffmpeg/ffmpeg.exe
开发时 -> 回落系统 PATH 中的 ffmpeg
```

若不放 ffmpeg，转码功能会依赖用户机器已安装 ffmpeg 并加入 PATH。

下载：https://www.gyan.dev/ffmpeg/builds/ （选 `ffmpeg-release-essentials.zip`）
