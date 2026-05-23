# /assets

> L2 | 父级: /AGENTS.md

成员清单
my-moon-demo.css: 静态 Demo 样式入口，定义月面场景、舱体、磁挫锁、HUD、控制台与移动端布局，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
my-moon-demo.js: 静态 Demo 状态机，驱动居住舱移动、磁挫锁并网、遮挡事件、AI 调度与数值 HUD，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
my-moon-models.js: 轻量 Three.js 适配层，复用现有 `landmarks/*.glb` 在透明画布上补出控制台、回放舱与节点占位，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
index-BezMjCv7.js: 原 3D 作品集构建入口，当前保留为历史产物，不再由 index.html 引用，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
index-Coy5B0kA.css: 原 3D 作品集构建样式，当前保留为历史产物，不再由 index.html 引用，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
SceneRoot-DLjunhxr.js: 原 3D 作品集场景 chunk，当前保留为历史产物，不再由 index.html 引用，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
rolldown-runtime-BYbx6iT9.js: 原构建运行时 chunk，当前保留为历史产物，不再由 index.html 引用，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
vendor-Bs52F_9B.js: 原第三方依赖 chunk，当前保留为历史产物，不再由 index.html 引用，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
vendor-motion-BToyP3Bx.js: 原动画依赖 chunk，当前保留为历史产物，不再由 index.html 引用，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
vendor-physics-BFHFn32j.js: 原物理依赖 chunk，当前保留为历史产物，不再由 index.html 引用，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
vendor-react-BTLn-WVn.js: 原 React 依赖 chunk，当前保留为历史产物，不再由 index.html 引用，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
vendor-three-CGyGFSxX.js: 原 Three.js 依赖 chunk，当前保留为历史产物，不再由 index.html 引用，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
audio/: 原作品集音频素材目录，当前已被 `my-moon-demo.js` 用作环境音占位池，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
models/: 原作品集模型素材目录，当前已被 `my-moon-models.js` 复用为控制台、回放舱与节点的 GLB 占位池，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
three/: Three.js 本地运行时目录，提供 `three.module.js` 与 `GLTFLoader.js`，消除 3D 素材层对远端 CDN 的依赖，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
posters/: 原作品集海报素材目录，当前未接入页面，但已在 spec 中标记为说明图卡/遥测扩展的参考池，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
textures/: 原作品集纹理素材目录，当前已被 `my-moon-demo.css` 复用为月面地表纹理池，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
videos-web/: 原作品集视频素材目录，当前未接入页面，但已在 spec 中标记为后续路演视频或回放内容参考池，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md

法则: 成员完整·一行一文件·父级链接·技术词前置

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
