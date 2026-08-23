# UI 重构工具与参考方案

- 日期：2026-08-22
- 目的：为福格行为实验室的信息密集工作台重构准备可复用的设计、检索、审查与文档工具。
- 当前问题：长期行为设计页的左侧摘要、中央任务与右侧理论笔记同时以相近视觉重量出现，缺少唯一注意力中心和稳定阅读路径。

## 1. 使用过的设计技能

技能安装位置会随 Codex 环境变化，本文只记录名称、用途与来源，不再保存某一台电脑的绝对路径。后续 Agent 应以当前会话的可用技能清单为准。

### `frontend-design`

- 来源：Anthropic 官方 `anthropics/skills`。
- 用途：在改造既有 UI 前明确页面的单一任务、视觉方向、字体/色彩/布局系统，并执行“规划—自我批评—实现—再次批评”。
- 适合本项目之处：防止只把卡片换颜色，而没有建立主次和产品自身的视觉语言。

### `design-philosophy`

- 来源：Microsoft VS Code 官方仓库。
- 用途：用“Calm、Focused、Consistent、Delightful → 原则 → 具体动作”的方法诊断信息密集工具。
- 本项目的关键规则：一个区域主导，其余区域支持；次要面板在静止状态应退后；不同层级使用不同文字角色、表面层级和图标尺寸。
- 注意：技能中的 VS Code 专属像素与 token 只能作为例子，不能直接照搬到本项目。

### `ui-ux-pro-max`

- 来源：`nextlevelbuilder/ui-ux-pro-max-skill` 的核心技能目录。
- 用途：离线检索 UI 风格、产品色板、字体、UX 规则、图标、React 实现提示和多种桌面栈规范。
- 已安装资源：本地 CSV/JSON 数据、`quick-reference.md`、`pro-rules.md`、只读检索/设计系统脚本及其测试。
- 安全边界：只安装 `.claude/skills/ui-ux-pro-max` 核心目录；没有安装 npm CLI、幻灯片生成器或仓库中的其他技能。旧版完整插件曾出现与幻灯片生成器有关的 CVE，因此本项目不调用那些无关组件。
- 已验证命令：

```powershell
python <ui-ux-pro-max-skill>/scripts/search.py "progressive disclosure form overwhelm" --domain ux --max-results 5
```

检索词必须短而具体；泛化长句的匹配质量不稳定，结果只能作为候选建议，不能替代设计判断。

### `create-design-md`

- 来源：`ibelick/ui-skills`。
- 用途：从当前代码和已确认方案中创建持久的 `DESIGN.md`，记录真正的视觉语言、层级、token 和组件规则，供后续 AI Agent 使用。
- 适合本项目之处：避免每次修改都产生新的局部样式，让后续实现遵守同一套视觉系统。

## 2. 未直接安装的候选

### Vercel `web-design-guidelines`

- 官方内容覆盖交互、无障碍、表单、动画、排版、性能和文案审查。
- 原技能会在每次运行时从 GitHub `main` 分支抓取可变指令；社区已有固定版本/供应链风险讨论。
- 决定：不直接安装动态抓取技能。后续审查时访问 Vercel 官方指南，记录检查日期；必要时再把经过人工审查的固定版本放入项目参考库。

### Figma 系列技能与插件

- OpenAI 官方目录提供 Figma 生成、实现和设计系统技能。
- 当前软件直接以 React/Tauri 代码迭代，尚无 Figma 文件或团队协作需求，因此暂不引入账户连接和额外设计源；若以后需要高保真原型再安装。

## 3. 适用于本项目的成熟方案

### 主工作区 + 支持面板，而不是三个同权栏

Material 3 的 Supporting Pane 把主内容区作为大约三分之二的主要显示区，把支持内容放入较小次级面板。对本项目而言：

- 中央当前小任务是唯一主角；
- 左侧摘要用于定位与回看，应更窄、更安静且可收起；
- 右侧理论笔记是按需学习内容，默认应折叠、抽屉化或覆盖式打开，不与当前输入永久争夺宽度；
- 一次只强调一个主要动作，下一阅读点由空间、字重和适度色彩自然引导。

### 渐进披露必须有清楚入口

Carbon 的 Accordion 适合在侧栏等有限空间中组织非关键长内容，但折叠会隐藏信息，所以标题和状态必须让用户知道里面有什么。折叠不是把所有内容藏起来，而是让当前任务先出现。

### 用空间建立层级，减少卡片套卡片

Fluent 2 建议用间距和邻近关系表达分组，不必为每组信息都画边框。更大的留白可以提高重要区域的注意力；浅色中性表面可以建立主次，但不能让所有栏都成为同等醒目的浅色卡片。

### 图标只替代近乎通用的动作

关闭、搜索、展开等高熟悉度动作可用图标并保留悬停说明与无障碍名称。含义不稳定的流程决策仍应用文字；否则减少文字会转化为猜测负担。

## 4. 下一轮推荐工作流

1. 使用 `design-philosophy` 对首页、长期工作台和一次性工作台分别做视觉注意力审计，明确每页第一、第二、第三注视目标。
2. 使用 `frontend-design` 形成一个主方案和一个克制备选方案；先给出布局线框、视觉层级和设计理由，不立即全面改代码。
3. 使用 `ui-ux-pro-max` 对“信息密集生产力工具、安静、聚焦、渐进披露、React 桌面”做小范围检索，补充 token、图标与可访问性检查，不机械采用搜索结果。
4. 用户确认方案后，使用 `create-design-md` 将决定写入项目 `DESIGN.md`，并按项目规则新增对应 ADR。
5. 分阶段实现：工作台骨架 → 中央任务卡 → 左摘要 → 右笔记 → 窄窗口；每阶段都在本地浏览器和 Tauri EXE 中检查。
6. 最后对照 Vercel Web Interface Guidelines、键盘路径、对比度和 700px 窄窗口做审查。

## 5. 参考来源

- Anthropic Frontend Design：https://github.com/anthropics/skills/tree/main/skills/frontend-design
- Microsoft VS Code Design Philosophy：https://github.com/microsoft/vscode/tree/main/.github/skills/design-philosophy
- UI/UX Pro Max：https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- UI Skills / Create DESIGN.md：https://github.com/ibelick/ui-skills/tree/main/skills/create-design-md
- Vercel Web Interface Guidelines：https://github.com/vercel-labs/web-interface-guidelines
- Material 3 Canonical Layouts：https://m3.material.io/foundations/layout/canonical-examples/overview
- Fluent 2 Layout：https://fluent2.microsoft.design/layout
- Carbon Accordion：https://carbondesignsystem.com/components/accordion/usage/
- NN/g List Entry Information Hierarchy：https://www.nngroup.com/articles/list-entries/
