# 《交响诗篇艾蕾卡7》私用视觉主题

本目录是 `codex/anime-journal-ui` 分支的可拆卸私用主题资产层。素材只在本地运行时读取，不会向素材站点发出网络请求。

## 使用范围

- 仅用于当前用户的本地浏览器预览和私人版本。
- 不把角色设为奖励、惩罚、打卡监督者或“失败”反馈。
- 不随公开仓库、网站、安装包或发行版本分发；准备发布前应移除此目录，或替换为自有/已获授权素材。
- “仅供个人使用”不等同于自动获得复制、修改或再分发许可。作品名称、角色、图像和标志的权利归其权利人所有。

## 官方来源与文件校验

取得日期：2026-08-23

作品官网：https://eurekaseven.jp/

| 本地文件 | 官方直接来源 | SHA-256 |
| --- | --- | --- |
| `eureka-tv-key-visual.webp` | https://eurekaseven.jp/DS23Rxci/wp-content/themes/20th/assets/img/archive/eureka.webp | `1B1033380FE813A5A30088CBCF7EE675E94A80A41D874229CC9952789C151082` |
| `eureka-20th-main-visual.webp` | https://eurekaseven.jp/DS23Rxci/wp-content/themes/20th/assets/img/top/visual.webp | `BDEBA71BAA33FCEFE0BBD7083E4D9A5BFD3AA6727C7B924F0EC66F21C91BCF5D` |
| `eureka-logo.svg` | https://eurekaseven.jp/DS23Rxci/wp-content/themes/20th/assets/img/common/eureka_logo.svg | `3D217AECDC8398A01531F7F53D851235C912C7C60BC936007291A3DEDF18A36B` |

官网页脚标示：`©2005 BONES／Project EUREKA`。本项目没有改画或生成角色形象；CSS 只负责裁切、定位、遮罩和可读性。

## 替换或移除

1. 把新素材放入独立主题目录并更新本说明中的来源、日期和哈希。
2. 修改 `app/src/animeTheme.css` 中的 `/themes/eureka-seven/` 素材路径；`App.css` 保留基础业务样式和早期实验记录。
3. 若要制作可公开分发的版本，移除该区域和本目录；基础界面仍有纯色/本地通用背景作为回退。
