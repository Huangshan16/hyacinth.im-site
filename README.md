<!--
  [INPUT]: 依赖 index.html 的原 3D 前端主体与 AI 覆盖层、docs/2026-05-23-我的月球-3d个人主页二创参赛项目-spec.md 的二创定位与数值交互文档
  [OUTPUT]: 对外提供“我的月球”黑客松 Demo 的项目说明、本地预览方式、交互方式与文档导航
  [POS]: 仓库根目录的对外说明入口，与 index.html 保持同构，说明当前仓库已采用“原 3D 前端主体 + AI 系统覆盖层”的参赛形态
  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
-->

# 我的月球 | My Moon

开发注释：

```bash

moonSmallModuleScale=1.35

```

一个从 3D 个人主页二创而来的黑客松参赛 Demo。

当前版本直接沿用原项目的 3D 可交互广场作为主体前端，再叠加一层“我的月球”AI 系统界面。用户仍可在原场景中移动、靠近和触发内容；同时页面上新增 AI 系统面板，用于演示能源接入、遮挡事件和生命支持调度。

## 当前可玩闭环

- 原 3D 场景继续支持 `WASD` / 方向键 / 移动端摇杆探索
- AI 覆盖层支持 `接入能源舱`、`启动遮挡事件`、`打开双门`、`恢复稳定`
- 模型控制台支持按 `中间大模型`、`其他小模型`、`用户操作主体` 分组调节亮度、颜色和缩放
- 页面同步展示太阳输入、发电功率、电池压力、生命支持与居住舱风险
- AI 会在 `warning` / `emergency` / `recovery` 模式下裁剪或恢复负载

## 核心设计

- `原 3D 前端主体`：继续承担空间漫游、靠近互动和沉浸式视觉
- `AI 覆盖层`：承担系统状态、数值传播、控制按钮与播报日志
- `居住舱 / 能源舱 / 磁挫锁`：作为当前叙事中的系统对象存在于 AI 系统层与后续素材替换计划中
- `AI 协同层`：负责风险判断、负载裁剪、恢复顺序和解释文案
- `数值系统`：太阳输入下降会传播到发电、储能、生命支持与风险

## 本地预览

```bash
cd /Volumes/SSD/code/hyacinth.im-site

npx http-server . -p 4173 -c-1

python3 -m http.server 4173 --bind 127.0.0.1
```

打开：

```text
http://127.0.0.1:4173/
```

如果需要在网页控制台里点击 `保存参数` 并写回代码文件，使用本地写回服务器：

```bash
cd /Volumes/SSD/code/hyacinth.im-site
node tools/my-moon-config-server.mjs
```

写回目标是：

```text
assets/my-moon-runtime-config.js
```

## 文档导航

- [二创参赛项目 Spec](docs/2026-05-23-我的月球-3d个人主页二创参赛项目-spec.md)
- [数值交互 Spec](docs/2026-05-23-我的月球-demo-数值交互-spec.md)
- [运行细节说明](docs/2026-05-23-我的月球-demo-运行细节说明.md)
- [结构补充](docs/结构补充.md)

## 仓库定位

这是静态部署仓库。当前主入口是 `index.html`，它会同时加载原 3D 前端 bundle 和 AI 覆盖层：

```text
assets/index-Coy5B0kA.css
assets/index-BezMjCv7.js
assets/textures/plaza-ground.png
assets/my-moon-runtime-config.js
assets/my-moon-overlay.css
assets/my-moon-overlay.js
```

`assets/textures/plaza-ground.png` 已被原 3D 场景 chunk 的可见地表层直接加载为底部主地表纹理；对应恢复说明见 `docs/recovered/SceneRoot.recovered.jsx`。灰盒月面方案仍保留在 `assets/my-moon-demo.*` 与 `assets/my-moon-models.js`，作为历史实现和后续对照来源。
