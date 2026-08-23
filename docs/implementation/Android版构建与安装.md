# Android 版：构建、校验与安装

## V0.2 发行边界

- 本地发行文件：`app/releases/android/Fogg-Behavior-Lab-v0.2.0-android-arm64.apk`
- 包名：`com.fogg.lab`
- 版本：`0.2.0`
- CPU：ARM64（`arm64-v8a`）
- 最低系统：Android 7.0 / API 24
- 目标系统：Android API 36
- 签名：Android 调试证书，适合自行侧载测试，不用于应用商店
- 网络：不声明 `INTERNET` 权限；行为数据保存在应用私有 SQLite 数据库
- V0.2 SHA-256：`3F236E07570E9795E1184FE34217C141DD1C45538652C682BF488AD5592B57DF`

移动版包含长期习惯七步设计、一次性行为 P / A / M 诊断、终止旧习惯、数据管理、个人参考库、应用锁和本地自定义背景。Android 与 Windows 数据不会自动同步，可以使用完整 JSON 导入导出手动迁移。

## 工具链布局

构建需要 JDK 17、Android SDK、NDK 27、Gradle 缓存和 Rust Android ARM64 目标。工具可以安装到任意容量充足的磁盘，不必放在系统盘；SDK/NDK 是编译工具，AVD 是虚拟设备，两者定位不同，可以分别放在不同磁盘。

本项目开发机曾使用以下布局，其他电脑应按实际路径替换：

```text
<ANDROID_TOOLS>/Jdk/
<ANDROID_TOOLS>/Sdk/
<ANDROID_TOOLS>/Sdk/ndk/27.2.12479018/
<ANDROID_TOOLS>/Gradle/
<ANDROID_TOOLS>/GradleBridgeCache/
```

## 标准构建

Windows 建议开启“开发人员模式”，使 Tauri 能为原生库创建符号链接。在 PowerShell 中设置本机路径：

```powershell
$env:JAVA_HOME = '<ANDROID_TOOLS>\Jdk\jdk-17'
$env:ANDROID_HOME = '<ANDROID_TOOLS>\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:NDK_HOME = '<ANDROID_TOOLS>\Sdk\ndk\27.2.12479018'
$env:GRADLE_USER_HOME = '<ANDROID_TOOLS>\Gradle'

Set-Location app
npm run build
npm run tauri android build -- --apk --target aarch64
```

Tauri 会从 `app/package.json`、`Cargo.toml` 与 `tauri.conf.json` 读取版本。发布前必须确认三个文件版本一致。

### Gradle TLS 兼容桥

若 Java 访问 Google 或 Maven 时出现 `SSLHandshakeException`，可先在仓库根目录运行：

```powershell
node scripts/gradle_https_bridge.mjs
```

再让 Gradle 加载 `scripts/gradle-local-repositories.init.gradle`。该桥只监听 `127.0.0.1`，只在构建期缓存官方依赖，不进入 APK，也不会让运行中的应用依赖网络。

### 无符号链接权限时的 ARM64 组装

若 Tauri 已编译 Rust ARM64 库，但 Windows 因符号链接权限停止，可复制原生库并仅组装 ARM64 变体：

```powershell
Copy-Item `
  app\src-tauri\target\aarch64-linux-android\release\libapp_lib.so `
  app\src-tauri\gen\android\app\src\main\jniLibs\arm64-v8a\libapp_lib.so `
  -Force

Set-Location app\src-tauri\gen\android
.\gradlew.bat assembleArm64Debug `
  -x ':app:rustBuildArm64Debug' `
  --init-script '..\..\..\..\scripts\gradle-local-repositories.init.gradle'
```

不要运行不带架构限定的 `assembleDebug`，否则 Gradle 还会尝试构建未准备原生库的 ARMv7、x86 等变体。

## 整理发行文件

构建完成后，将最新 ARM64 APK复制并统一命名：

```powershell
New-Item -ItemType Directory -Force app\releases\android | Out-Null
Copy-Item `
  app\src-tauri\gen\android\app\build\outputs\apk\arm64\debug\app-arm64-debug.apk `
  app\releases\android\Fogg-Behavior-Lab-v0.2.0-android-arm64.apk `
  -Force
```

`app/releases/` 下的二进制由 Git 忽略；正式文件作为 GitHub Release 附件上传。

## 安装到手机

手机开启开发者选项与 USB 调试后：

```powershell
<ANDROID_TOOLS>\Sdk\platform-tools\adb.exe devices
<ANDROID_TOOLS>\Sdk\platform-tools\adb.exe install -r `
  app\releases\android\Fogg-Behavior-Lab-v0.2.0-android-arm64.apk
```

也可以把 APK 复制到 ARM64 手机后直接点击安装。调试签名包会触发“未知来源应用”提示；安装或卸载普通 APK 不需要刷机，不会改变手机系统，退出应用后手机可正常使用。卸载应用会删除其私有本地数据，操作前应导出备份。

## 发布前校验

- TypeScript 类型检查和 Vite 生产构建通过；
- Rust 测试通过，Android ARM64 原生库编译通过；
- APK v2 签名校验通过；
- APK 只包含预期的 `arm64-v8a` 原生库；
- Manifest 不含 `android.permission.INTERNET`；
- 三类工作流、数据管理、浮动错误、状态抽屉和理论抽屉可进入；
- 竖屏触控拖动、系统返回键、输入法遮挡和真机安装应在发布前人工验证；
- 记录 APK 的 SHA-256 到 GitHub Release 说明。

## 官方参考

- [Tauri Android 前置环境](https://v2.tauri.app/start/prerequisites/)
- [Tauri Android 开发](https://v2.tauri.app/develop/)
- [Tauri Google Play 打包](https://v2.tauri.app/distribute/google-play/)
- [Android 自适应布局](https://developer.android.com/develop/adaptive-apps)
