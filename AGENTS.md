# hyacinth.im-site

> L1 | 公开部署仓库，承载 Ring Hyacinth 3D 作品广场的静态发布产物与最小使用说明。

<directory>
./assets/ - 构建后的前端运行时与静态媒体（5类资源: `audio`、`models`、`posters`、`textures`、`videos-web`）
./docs/ - 面向仓库读者的说明、决策记录与配图素材（3类成员: `*.md`、`image`、`media`）
</directory>

<config>
index.html - 站点入口 HTML，声明元信息、加载构建脚本与样式、提供 `#root` 挂载点
README.md - 项目说明书，解释仓库定位、玩法、资源布局与技术栈来源
.nojekyll - 告知 GitHub Pages 按原样发布静态资源
</config>

## 结构树

```text
.
├─ AGENTS.md
├─ README.md
├─ index.html
├─ .nojekyll
├─ assets/
│  ├─ audio/
│  ├─ models/
│  ├─ posters/
│  ├─ textures/
│  └─ videos-web/
└─ docs/
   ├─ AGENTS.md
   ├─ 2026-05-22-项目讨论补充记录.md
   ├─ 2026-05-23-我的月球-demo-运行细节说明.md
   ├─ 2026-05-23-我的月球-demo-数值交互-spec.md
   ├─ 2026-05-23-我的月球-3d个人主页二创参赛项目-spec.md
   ├─ 260517-青年元创计划48h黑客松·AI-Native SE 最小闭环（ChatGPT对话）.md
   ├─ 结构补充.md
   ├─ chatlog.md
   ├─ image/
   └─ media/
```

## 架构决策

- 这是部署产物仓库，不保留 React/Vite 源码工作区；入口只负责稳定加载已构建资源，避免泄露私有生产素材。
- 所有资源走相对路径，任何本地或远程静态文件服务器都能直接承载，不引入额外运行时依赖。
- 文档只描述公开仓库能证实的事实，不伪造私有源码结构。

## 开发规范

- 修改入口资源引用或目录结构时，先更新对应文件头部契约，再同步此文件。
- 若新增模块级目录，必须在该目录创建对应 `AGENTS.md`，保持 L1/L2/L3 同构。
- 本地预览优先使用最简单的静态服务器，并用真实 HTTP 探测验证资源可达。

## 变更日志

- 2026-05-22: 初始化 L1 文档；为 `index.html` 补齐 L3 契约，便于后续维护入口与资源关系。
- 2026-05-23: 文档主题收敛到“我的月球”Demo；为 `docs/` 增加 L2 地图，并拆分对外摘要、需求决策与运行细节说明。
- 2026-05-23: 基于黑客松 AI-Native SE 源材料新增数值交互 spec，把能源下降、储能压力、生命支持与 AI 调度写成可传播规则。
- 2026-05-23: 新增 3D 个人主页二创参赛项目 spec，明确原项目交互壳如何映射为“我的月球”黑客松 Demo。
- 2026-05-23: 更新结构规则为居住舱榫结构、能源舱卯结构，并采用 frustrated magnetism 磁挫锁作为稳定对接机制。
