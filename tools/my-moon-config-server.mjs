/*
  [INPUT]: 依赖 Node.js http/fs/path/url，读取仓库静态文件并接收模型控制台配置
  [OUTPUT]: 对外提供 4173 静态预览与模型参数 POST 写回能力
  [POS]: tools 层的本地开发辅助服务，只用于调参与落盘，不参与公开静态部署
  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
*/
import { createServer } from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 4173);
const configPath = path.join(root, "assets", "my-moon-runtime-config.js");

const mime = {
  ".css": "text/css; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".m4a": "audio/mp4",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".webp": "image/webp",
};

const defaults = {
  centerpiece: { brightness: 1, scale: 1, surfaceGlow: 0, activeGlow: 0, glowColor: "#d8e7ff", lightColor: "#d8e7ff", lightIntensity: 9.5, lightDistance: 30, lightPosition: [0, 3.2, 0.8] },
  small: { brightness: 1, scale: 1, surfaceGlow: 0, activeGlow: 0, glowColor: "#7d93c7", lightColor: "#8ea2ff", lightIntensity: 1.2, lightDistance: 6, lightPosition: [0, 0.72, 0.12] },
  medical: { brightness: 1, scale: 1, surfaceGlow: 0, activeGlow: 0, glowColor: "#7d93c7", lightColor: "#8ea2ff", lightIntensity: 1.2, lightDistance: 6, lightPosition: [0, 0.72, 0.12] },
  communication: { brightness: 1, scale: 1, surfaceGlow: 0, activeGlow: 0, glowColor: "#7d93c7", lightColor: "#8ea2ff", lightIntensity: 1.2, lightDistance: 6, lightPosition: [0, 0.72, 0.12] },
  research: { brightness: 1, scale: 1, surfaceGlow: 0, activeGlow: 0, glowColor: "#7d93c7", lightColor: "#8ea2ff", lightIntensity: 1.2, lightDistance: 6, lightPosition: [0, 0.72, 0.12] },
  energy: { brightness: 1, scale: 1, surfaceGlow: 0, activeGlow: 0, glowColor: "#7d93c7", lightColor: "#8ea2ff", lightIntensity: 1.2, lightDistance: 6, lightPosition: [0, 0.72, 0.12] },
  shop: { brightness: 1, scale: 1, surfaceGlow: 0, activeGlow: 0, glowColor: "#7d93c7", lightColor: "#a8f0cf", lightIntensity: 3.4, lightDistance: 12, lightPosition: [0, 1.25, 0.35] },
  guide: { brightness: 1, scale: 1, surfaceGlow: 0, activeGlow: 0, glowColor: "#ffe0a8", lightColor: "#ffe0a8", lightIntensity: 2.2, lightDistance: 8, lightPosition: [0, 0.9, 0.12] },
  player: { brightness: 1, scale: 1, surfaceGlow: 0.02, glowColor: "#789087", lightColor: "#9aa7ff", lightIntensity: 1.45, lightDistance: 5.8, lightPosition: [0, 0.72, 0.18] },
};

function clampNumber(value, fallback, min, max) {
  const next = Number(value);
  return Number.isFinite(next) ? Math.min(max, Math.max(min, next)) : fallback;
}

function normalizeColor(value, fallback) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function normalizePosition(value, fallback) {
  return Array.isArray(value) && value.length === 3
    ? value.map((item, index) => clampNumber(item, fallback[index], -32, 32))
    : fallback;
}

function normalizeGroup(input, fallback) {
  return {
    brightness: clampNumber(input?.brightness, fallback.brightness, 0, 8),
    scale: clampNumber(input?.scale, fallback.scale, 0.2, 3),
    surfaceGlow: clampNumber(input?.surfaceGlow, fallback.surfaceGlow, 0, 2),
    activeGlow: clampNumber(input?.activeGlow, fallback.activeGlow ?? fallback.surfaceGlow, 0, 2),
    glowColor: normalizeColor(input?.glowColor, fallback.glowColor),
    lightColor: normalizeColor(input?.lightColor, fallback.lightColor),
    lightIntensity: clampNumber(input?.lightIntensity, fallback.lightIntensity, 0, 20),
    lightDistance: clampNumber(input?.lightDistance, fallback.lightDistance, 0, 64),
    lightPosition: normalizePosition(input?.lightPosition, fallback.lightPosition),
  };
}

function normalizeConfig(input) {
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [key, normalizeGroup(input?.[key], fallback)])
  );
}

function configSource(config) {
  return `/*\n  [INPUT]: 由本地调参控制台或 tools/my-moon-config-server.mjs 写入模型光照与缩放参数\n  [OUTPUT]: 对外提供 window.__MY_MOON_LIGHTING__ 作为 SceneRoot 运行时配置\n  [POS]: assets 层的可持久化运行时配置，必须在主体 bundle 与 overlay 之前加载\n  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md\n*/\nwindow.__MY_MOON_LIGHTING__ = ${JSON.stringify(config, null, 2)};\n`;
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function saveConfig(request, response) {
  try {
    const body = await readBody(request);
    const config = normalizeConfig(JSON.parse(body));
    await writeFile(configPath, configSource(config), "utf8");
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true }));
  } catch (error) {
    response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: false, error: error.message }));
  }
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "127.0.0.1"}`);
  const pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const target = path.resolve(root, `.${pathname}`);
  if (!target.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const info = await stat(target);
    const file = info.isDirectory() ? path.join(target, "index.html") : target;
    const buffer = await readFile(file);
    response.writeHead(200, {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    response.end(buffer);
  } catch {
    response.writeHead(404);
    response.end("Not Found");
  }
}

createServer((request, response) => {
  if (request.method === "POST" && ["/__my-moon/save-config", "/my-moon/save-config"].includes(request.url)) {
    saveConfig(request, response);
    return;
  }
  serveStatic(request, response);
}).listen(port, "127.0.0.1", () => {
  console.log(`my-moon config server: http://127.0.0.1:${port}`);
});
