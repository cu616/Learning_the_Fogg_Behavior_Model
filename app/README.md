# 福格行为实验室（app）

本地优先的福格行为设计桌面软件。长期重复行为使用完整七步设计；明确的一次性行为使用轻量的 P→A→M 循环。数据只存本机，离线可用、无评判语气、不接 AI。

## 技术栈

- Tauri 2 + React + TypeScript + Vite
- SQLite（rusqlite，bundled），33 张业务表，schema v7，INTEGER 主键 + uuid 稳定身份

## 目录

```
app/
├─ src/              前端（React）
│  ├─ screens/       首页 / 七步工作台 / 一次性行为工作台 / 数据管理
│  ├─ steps/         七步组件（Step1~Step7）
│  ├─ api/           invoke() 封装
│  ├─ references/    内置参考库 JSON
│  └─ types.ts       TS 类型
└─ src-tauri/        后端（Rust）
   ├─ migrations/    数据库迁移（001 ~ 007）
   └─ src/
      ├─ db.rs       连接 + 迁移器
      ├─ models.rs   长期习惯、分支、个人库与一次性行为模型
      └─ commands/   projects / design / one_time / practice / backups / applock
```

## 运行与构建

已经打包后可以直接双击 `src-tauri/target/release/app.exe`，不必安装；也可以运行 NSIS `福格行为实验室_0.1.0_x64-setup.exe` 安装并获得系统入口。两种方式读取同一份 `%APPDATA%\com.fogg.lab\fogg-lab.db` 本地数据。

```bash
./dev.bat          # 开发运行（封装 node + cargo + MSVC 环境）
./build.bat build  # 编译
./build.bat test   # 测试
./build-app.bat    # 只更新可直接运行的 release/app.exe，不生成安装包
./release.bat      # 打包成 Windows 安装包（NSIS）
```

不要把普通 `cargo build --release` 生成的程序作为发布 EXE：它不会执行 Tauri 的正式前端嵌入流程，可能仍访问开发地址 `localhost:1420`。只更新便携 EXE 时使用现有的 `build-app.bat`。

> 本机直接 `cargo build` 会因找不到 MSVC 链接器失败，必须用上述封装脚本。

## 数据存储

- 数据目录：`%APPDATA%\com.fogg.lab\`（`fogg-lab.db` + `backups/` + `exports/`）
- 内置参考库只读；用户显式收藏或新建的个人参考条目写入本地 SQLite，并进入完整备份。

更多信息见项目根目录的 `README.md` 与 `docs/`。
