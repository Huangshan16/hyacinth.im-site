# /assets/three

> L2 | 父级: /assets/AGENTS.md

成员清单
three.module.js: Three.js ESM 运行时，本地化替代远端 CDN，供 `my-moon-models.js` 渲染透明 3D 占位层，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
GLTFLoader.js: Three.js GLB/GLTF 加载器，使用相对路径依赖本地 `three.module.js` 与 `utils/BufferGeometryUtils.js`，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
utils/: Three.js 示例工具目录，含局部 L2 地图，当前只保留 `BufferGeometryUtils.js` 供 `GLTFLoader.js` 使用，[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md

法则: 本地依赖·静态部署·无外链

[PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
