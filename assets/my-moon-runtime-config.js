/*
  [INPUT]: 由本地调参控制台或 tools/my-moon-config-server.mjs 写入模型光照与缩放参数
  [OUTPUT]: 对外提供 window.__MY_MOON_LIGHTING__ 作为 SceneRoot 运行时配置
  [POS]: assets 层的可持久化运行时配置，必须在主体 bundle 与 overlay 之前加载
  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
*/
window.__MY_MOON_LIGHTING__ = {
  "centerpiece": {
    "brightness": 1,
    "scale": 1,
    "surfaceGlow": 0,
    "activeGlow": 0,
    "glowColor": "#d8e7ff",
    "lightColor": "#d8e7ff",
    "lightIntensity": 9.5,
    "lightDistance": 30,
    "lightPosition": [
      0,
      3.2,
      0.8
    ]
  },
  "small": {
    "brightness": 1,
    "scale": 1,
    "surfaceGlow": 0,
    "activeGlow": 0,
    "glowColor": "#7d93c7",
    "lightColor": "#8ea2ff",
    "lightIntensity": 1.2,
    "lightDistance": 6,
    "lightPosition": [
      0,
      0.72,
      0.12
    ]
  },
  "shop": {
    "brightness": 1,
    "scale": 1,
    "surfaceGlow": 0,
    "activeGlow": 0,
    "glowColor": "#7d93c7",
    "lightColor": "#a8f0cf",
    "lightIntensity": 3.4,
    "lightDistance": 12,
    "lightPosition": [
      0,
      1.25,
      0.35
    ]
  },
  "guide": {
    "brightness": 1,
    "scale": 1,
    "surfaceGlow": 0,
    "activeGlow": 0,
    "glowColor": "#ffe0a8",
    "lightColor": "#ffe0a8",
    "lightIntensity": 2.2,
    "lightDistance": 8,
    "lightPosition": [
      0,
      0.9,
      0.12
    ]
  },
  "player": {
    "brightness": 1,
    "scale": 1,
    "surfaceGlow": 0.02,
    "activeGlow": 0.08,
    "glowColor": "#789087",
    "lightColor": "#9aa7ff",
    "lightIntensity": 1.45,
    "lightDistance": 5.8,
    "lightPosition": [
      0,
      0.72,
      0.18
    ]
  }
};
