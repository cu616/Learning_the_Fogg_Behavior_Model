# 福格行为实验室

本项目用于辅助学习 B.J. 福格的《福格行为模型》，并把书中的方法转化为可以反复实践的本地工具。软件能带领用户设计长期微习惯、推动一次性行为，以及减少或终止旧习惯；它是学习与实践的辅助工具，不能替代原书。

如果对软件中的概念、步骤或术语不清楚，建议继续阅读仓库随附的原书 PDF、Markdown 全文、分章资料和提炼笔记。软件刻意保持提示精炼，完整背景、案例和论证仍应以原书及相关学习资料为准。

## V0.2 概览

V0.2 是当前正式版本。相较 V0.1 的早期简化界面，本版完成了森林背景与深色半透明玻璃 UI 重构，并增加 Android 移动版。Windows 与 Android 共享同一套行为模型、SQLite 数据结构和核心业务代码，但数据分别保存在各自设备本地，不会自动同步。

三类正式工作流：

- 长期习惯：明确愿望 → 探索行为 → 匹配黄金行为 → 从微习惯开始 → 找到提示 → 庆祝成功 → 实践、排障与拓展。
- 一次性行为：明确当前唯一动作 → 按需进行 P / A / M 诊断 → 采取行动、安排稍后或继续调整。
- 终止旧习惯：改变准备 → 拆解具体旧行为 → 布置 P / A / M 对策 → 观察与调整 → 设计替代行为。

## 核心原则

- 本地优先：无账号，核心流程离线可用，个人行为数据默认只保存在设备上。
- 实验而非评判：中断、忘记和修改配方都是设计信息，不使用失败、惩罚或连续打卡清零机制。
- 渐进披露：先展示当前需要完成的决定，理论、参考库和详细记录按需展开。
- 可追溯：每个项目独立保存设计状态、配方版本、实践日志、诊断与观察记录。
- 纯规则核心：当前版本不依赖 AI、在线字体、远程图片或网络服务。

## 仓库结构

```text
Learning_the_Fogg_Behavior_Model/
├─ app/                         Windows 与 Android 共享应用工程
│  ├─ src/                     React 界面、三类工作流与移动入口
│  ├─ src-tauri/src/           Rust 后端与 SQLite 命令
│  ├─ src-tauri/migrations/    数据库迁移（schema v7）
│  ├─ src-tauri/gen/android/   Android Gradle 工程骨架
│  └─ releases/                本地发行物（按 windows/android 分组，不入 Git）
├─ docs/                        蓝图、ADR、实现记录、研究和理论提示笔记
├─ knowledge/                   可检索知识库与结构化参考库
├─ scripts/                     知识提取与 Android 构建辅助脚本
├─ source/                      原书 PDF（随仓库提供）
├─ AGENTS.md                    AI Agent 协作约束
├─ DESIGN.md                    当前界面设计语言
└─ CHANGELOG.md                 版本与里程碑记录
```

`app/` 不是两套互不相干的程序。桌面端和移动端共享领域代码，通过平台入口与响应式布局分别适配横屏窗口和手机竖屏。具体结构见 [app/README.md](app/README.md)。

## 软件能力

- 多项目管理、搜索、筛选、复制、归档与可恢复删除。
- 多黄金行为、多微习惯方案、可拖动行为云、−4～4 焦点地图和能力链。
- 内置与个人行为、锚点、庆祝、配方及“肯定成功方式”参考库。
- 字段级自动保存、配方版本、实践感受、诊断历史和旧习惯观察记录。
- 完整 SQLite 备份、JSON 导入导出、应用锁和本地自定义背景。
- Windows x64 离线安装包与便携 EXE；Android ARM64 侧载 APK。

## 开发与构建

### Windows 桌面端

```powershell
Set-Location app
./dev.bat
./build.bat test
./build-app.bat   # 便携 EXE
./release.bat     # x64 NSIS 离线安装包
```

发布 EXE 必须通过 Tauri 构建，不能用普通 `cargo build --release` 代替，否则可能保留开发地址。Windows 安装包嵌入 WebView2 离线安装程序，目标电脑安装和使用核心功能时不需要联网。当前安装包未使用商业代码签名证书，Windows 可能显示“未知发布者”。

### Android 移动端

Android 使用 Tauri 2 生成工程并构建 ARM64 APK。环境变量、构建、签名边界和 USB 安装步骤见 [Android 版构建与安装](docs/implementation/Android版构建与安装.md)。当前 GitHub Release APK 使用 Android 调试证书，适合自行侧载测试，不用于应用商店发布。

## 知识库

- `source/福格行为模型.pdf`：仓库随附的原始 PDF，可按物理页码回查。
- `knowledge/福格行为模型-全文.md`：带 PDF 物理页码锚点的完整检索文本。
- `knowledge/chapters/`：分章资料，适合按主题加载。
- `knowledge/page-index.jsonl`：逐页检索索引。
- `knowledge/references/`：庆祝方式、微习惯配方与 32 种肯定成功方式（JSON + Markdown）。
- `docs/福格行为模型-右侧提示笔记.md`：软件右侧知识抽屉使用的精炼理论笔记。

原始 PDF、整本 Markdown 全文、11 个分章文件和页级索引均随仓库提供，克隆后即可直接阅读与检索。它们与提取脚本共同版本化；更新来源或提取规则后运行：

```powershell
python scripts/extract_fogg_book.py
python scripts/extract_references.py
```

## 文档入口

- [文档索引](docs/README.md)
- [软件大纲蓝图](docs/blueprints/软件大纲蓝图.md)
- [界面设计语言](DESIGN.md)
- [版本记录](CHANGELOG.md)

V0.1 的标签与发布记录继续保留，用于回看最初的简化版本；V0.2 起同时维护 Windows 与 Android 发行物。
