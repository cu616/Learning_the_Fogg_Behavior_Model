# 福格行为实验室：共享应用工程

`app/` 同时承载 Windows 桌面端和 Android 移动端。两个平台共享 React、Rust、SQLite、三类行为工作流与导入导出格式；平台差异集中在入口布局、响应式样式和打包工程，避免维护两套不一致的业务代码。

## 技术与数据

- Tauri 2 + React 19 + TypeScript + Vite
- Rust + rusqlite（bundled SQLite）
- 33 张业务表，schema v7，导出格式 `fogg-lab-export-v4`
- 长期习惯、一次性行为、终止旧习惯三类完整工作流
- 完全本地运行，不声明 Android `INTERNET` 权限，不依赖在线资源

Windows 与 Android 不会自动同步数据：桌面数据位于 `%APPDATA%\com.fogg.lab\`，Android 数据位于应用私有目录。两端可以使用完整 JSON 导出与导入手动迁移行为数据。

## 目录职责

```text
app/
├─ src/
│  ├─ MobileApp.tsx       Android 移动首页与路由
│  ├─ themePreference.ts  双主题本地偏好与样式装载
│  ├─ kessokuTheme.css    孤独摇滚主题的隔离视觉层
│  ├─ components/         共用组件与主题角色提示
│  ├─ screens/            三类工作台、首页与数据管理
│  ├─ steps/              长期习惯七步组件
│  ├─ api/                Tauri invoke 封装
│  └─ references/         离线内置参考库
├─ src-tauri/
│  ├─ src/                共享 Rust 后端与命令
│  ├─ migrations/         SQLite 迁移 001～007
│  ├─ gen/android/        可复现 Android Gradle 工程骨架
│  └─ tauri.conf.json     产品信息与 Windows 打包配置
├─ releases/
│  ├─ windows/            本地 Windows 发行物（忽略）
│  └─ android/            本地 Android 发行物（忽略）
├─ build-app.bat          构建 Windows 便携 EXE
├─ release.bat            构建 Windows NSIS 安装包
└─ package.json
```

`src/App.css` 是默认专业主题和共享结构样式；`src/kessokuTheme.css` 仅在用户选择动漫主题时动态装载。两者不得复制业务页面或建立第二套数据模型。动漫主题所需的本地图片位于 `public/themes/kessoku/`，来源和许可边界见该目录的 `README.md`。

`gen/android/` 只提交 Gradle 骨架。`.gradle/`、`build/`、`.tauri/`、`local.properties`、原生 `.so`、密钥和签名配置均被忽略。

## Windows 开发与发行

```powershell
./dev.bat
./build.bat build
./build.bat test
./build-app.bat
./release.bat
```

- 便携 EXE：`src-tauri/target/release/app.exe`
- NSIS：`src-tauri/target/release/bundle/nsis/福格行为实验室_0.2.0_x64-setup.exe`
- 正式发布时复制到 `releases/windows/`，再作为 GitHub Release 附件上传。

不要用普通 `cargo build --release` 生成发布 EXE；它不会执行 Tauri 的前端嵌入流程，可能仍指向开发地址 `localhost:1420`。安装包使用 WebView2 离线安装器，Windows 10/11 x64 目标电脑不需要联网完成安装和核心使用。

## Android 开发与发行

构建前准备 JDK 17、Android SDK、NDK 27 和 Rust Android ARM64 目标，然后运行：

```powershell
npm run build
npm run tauri android build -- --apk --target aarch64
```

当前发行目标是 Android 7.0 及以上的 ARM64 设备。完整环境、Gradle 依赖桥、APK 校验和 USB 安装方法见 [Android 版构建与安装](../docs/implementation/Android版构建与安装.md)。

## 发布目录

发布二进制不进入 Git：

- `releases/windows/Fogg-Behavior-Lab-v0.2.0-windows-x64-portable.exe`
- `releases/windows/Fogg-Behavior-Lab-v0.2.0-windows-x64-setup.exe`
- `releases/android/Fogg-Behavior-Lab-v0.2.0-android-arm64.apk`

每次 GitHub Release 必须记录 SHA-256、平台、架构和签名边界。V0.2 Android APK 使用调试签名，适合侧载测试，不用于应用商店。
