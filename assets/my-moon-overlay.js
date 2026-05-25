/*
  [INPUT]: 依赖 index.html 中的 moon-ai-* DOM 结构，依赖数值 spec 的能源/负载/风险公式
  [OUTPUT]: 对外提供“我的月球”AI 系统覆盖层的接入、遮挡、恢复与播报逻辑
  [POS]: assets 层的 AI 系统前端状态机，叠加在原 3D 作品广场之上运行
  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
*/
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const defaultLighting = {
  centerpiece: {
    brightness: 1,
    scale: 1,
    surfaceGlow: 0,
    activeGlow: 0,
    glowColor: "#d8e7ff",
    lightColor: "#d8e7ff",
    lightIntensity: 9.5,
    lightDistance: 30,
    lightPosition: [0, 3.2, 0.8],
  },
  small: {
    brightness: 1,
    scale: 1,
    surfaceGlow: 0,
    activeGlow: 0,
    glowColor: "#7d93c7",
    lightColor: "#8ea2ff",
    lightIntensity: 1.2,
    lightDistance: 6,
    lightPosition: [0, 0.72, 0.12],
  },
  shop: {
    brightness: 1,
    scale: 1,
    surfaceGlow: 0,
    activeGlow: 0,
    glowColor: "#7d93c7",
    lightColor: "#a8f0cf",
    lightIntensity: 3.4,
    lightDistance: 12,
    lightPosition: [0, 1.25, 0.35],
  },
  guide: {
    brightness: 1,
    scale: 1,
    surfaceGlow: 0,
    activeGlow: 0,
    glowColor: "#ffe0a8",
    lightColor: "#ffe0a8",
    lightIntensity: 2.2,
    lightDistance: 8,
    lightPosition: [0, 0.9, 0.12],
  },
  player: {
    brightness: 1,
    scale: 1,
    surfaceGlow: 0.02,
    glowColor: "#789087",
    lightColor: "#9aa7ff",
    lightIntensity: 1.45,
    lightDistance: 5.8,
    lightPosition: [0, 0.72, 0.18],
  },
};

function ensureLightingConfig() {
  let parsed = null;
  try {
    const stored = window.localStorage.getItem("myMoonLighting");
    parsed = stored ? JSON.parse(stored) : null;
  } catch {
    parsed = null;
  }
  const next = window.__MY_MOON_LIGHTING__ ?? parsed ?? structuredClone(defaultLighting);
  Object.keys(defaultLighting).forEach(key => {
    next[key] = { ...defaultLighting[key], ...next[key] };
  });
  window.__MY_MOON_LIGHTING__ = next;
  return next;
}

const loads = {
  oxygenLoop: { normal: 18, min: 16, cap: 18 },
  pressureControl: { normal: 14, min: 12, cap: 14 },
  thermalControl: { normal: 22, min: 14, cap: 22 },
  waterRecycler: { normal: 10, min: 6, cap: 10 },
  lighting: { normal: 8, min: 2, cap: 8 },
  comfortLoad: { normal: 12, min: 0, cap: 12 },
  publicDisplay: { normal: 6, min: 0, cap: 6 },
};

const initialState = () => ({
  tick: 0,
  mode: "normal",
  docked: false,
  doorsOpen: false,
  eventRunning: false,
  eventStartedAt: null,
  energy: {
    solarInput: 100,
    solarHealth: 100,
    generation: 80,
    batterySoc: 72,
    batteryStress: 8,
    outputLimit: 90,
    reserveFloor: 20,
    availablePower: 24,
  },
  habitat: {
    activeDemand: 90,
    allocatedDemand: 66,
    lifeSupportScore: 100,
    habitatRisk: 18,
  },
  ai: {
    text: "原广场继续负责空间探索；AI 系统在后台待命，等待能源接入。",
    loadCaps: {},
    scenario: "巡检待命",
  },
  log: [
    "系统待命：原 3D 广场保持主交互，AI 面板负责演示生命支持调度。",
  ],
});

const state = initialState();
const initialOverlayCollapsed = true;

const el = {
  body: document.body,
  launcher: document.getElementById("moonAiLauncher"),
  dashboard: document.getElementById("moonAiDashboard"),
  modeText: document.getElementById("modeText"),
  solarText: document.getElementById("solarText"),
  batteryText: document.getElementById("batteryText"),
  lifeText: document.getElementById("lifeText"),
  generationText: document.getElementById("generationText"),
  stressText: document.getElementById("stressText"),
  demandText: document.getElementById("demandText"),
  riskText: document.getElementById("riskText"),
  dockText: document.getElementById("dockText"),
  scenarioText: document.getElementById("scenarioText"),
  aiCopy: document.getElementById("aiCopy"),
  lead: document.getElementById("moonAiLead"),
  dockButton: document.getElementById("dockButton"),
  eventButton: document.getElementById("eventButton"),
  doorButton: document.getElementById("doorButton"),
  resetButton: document.getElementById("resetButton"),
  modeBar: document.getElementById("modeBar"),
  solarBar: document.getElementById("solarBar"),
  batteryBar: document.getElementById("batteryBar"),
  lifeBar: document.getElementById("lifeBar"),
  log: document.getElementById("moonAiLog"),
  lightingSave: document.getElementById("moonLightingSave"),
  lightingSaveStatus: document.getElementById("moonLightingSaveStatus"),
  lighting: {
    centerpiece: {
      brightness: document.getElementById("moonLightingCenterpieceBrightness"),
      brightnessValue: document.getElementById("moonLightingCenterpieceBrightnessValue"),
      color: document.getElementById("moonLightingCenterpieceColor"),
      scale: document.getElementById("moonLightingCenterpieceScale"),
      scaleValue: document.getElementById("moonLightingCenterpieceScaleValue"),
    },
    small: {
      brightness: document.getElementById("moonLightingSmallBrightness"),
      brightnessValue: document.getElementById("moonLightingSmallBrightnessValue"),
      color: document.getElementById("moonLightingSmallColor"),
      scale: document.getElementById("moonLightingSmallScale"),
      scaleValue: document.getElementById("moonLightingSmallScaleValue"),
    },
    shop: {
      brightness: document.getElementById("moonLightingShopBrightness"),
      brightnessValue: document.getElementById("moonLightingShopBrightnessValue"),
      color: document.getElementById("moonLightingShopColor"),
      scale: document.getElementById("moonLightingShopScale"),
      scaleValue: document.getElementById("moonLightingShopScaleValue"),
    },
    guide: {
      brightness: document.getElementById("moonLightingGuideBrightness"),
      brightnessValue: document.getElementById("moonLightingGuideBrightnessValue"),
      color: document.getElementById("moonLightingGuideColor"),
      scale: document.getElementById("moonLightingGuideScale"),
      scaleValue: document.getElementById("moonLightingGuideScaleValue"),
    },
    player: {
      brightness: document.getElementById("moonLightingPlayerBrightness"),
      brightnessValue: document.getElementById("moonLightingPlayerBrightnessValue"),
      color: document.getElementById("moonLightingPlayerColor"),
      scale: document.getElementById("moonLightingPlayerScale"),
      scaleValue: document.getElementById("moonLightingPlayerScaleValue"),
    },
  },
};

function pushLog(text) {
  state.log.unshift(text);
  state.log = state.log.slice(0, 5);
}

function activeDemand() {
  return Object.entries(loads).reduce((sum, [id, load]) => {
    const cap = state.ai.loadCaps[id] ?? load.cap;
    return sum + Math.min(load.normal, cap);
  }, 0);
}

function allocatedFor(id) {
  const load = loads[id];
  const cap = state.ai.loadCaps[id] ?? load.cap;
  return Math.min(load.normal, cap);
}

function updateSolar() {
  if (!state.eventRunning || state.eventStartedAt === null) return;
  const elapsed = Math.max(0, state.tick - state.eventStartedAt);
  if (elapsed < 12) state.energy.solarInput = lerp(100, 62, elapsed / 12);
  else if (elapsed < 24) state.energy.solarInput = lerp(62, 42, (elapsed - 12) / 12);
  else if (elapsed < 38) state.energy.solarInput = lerp(42, 18, (elapsed - 24) / 14);
  else if (elapsed < 58) state.energy.solarInput = lerp(18, 78, (elapsed - 38) / 20);
  else state.energy.solarInput = lerp(state.energy.solarInput, 100, 0.05);
}

function planAiAction() {
  const e = state.energy;
  const h = state.habitat;
  const criticalDemand = 48;
  let nextMode = "normal";

  if (h.habitatRisk >= 55 || e.availablePower < criticalDemand) nextMode = "emergency";
  else if (h.habitatRisk >= 25 || e.batteryStress >= 35) nextMode = "warning";
  else if (state.mode === "emergency" && h.habitatRisk < 40) nextMode = "recovery";
  else if (state.mode === "recovery" && h.habitatRisk >= 25) nextMode = "recovery";

  const caps = {};
  let text = "原广场继续承担空间叙事，AI 系统维持生命支持冗余。";
  let scenario = "稳定巡检";

  if (!state.docked) {
    nextMode = "normal";
    scenario = "巡检待命";
    text = "能源尚未接入。当前只展示原场景的空间探索，AI 系统保持待命。";
  } else if (nextMode === "warning") {
    scenario = "预警调度";
    caps.lighting = 4;
    caps.comfortLoad = 6;
    caps.publicDisplay = 2;
    caps.thermalControl = 18;
    text = "太阳输入下降，AI 已压缩展示与舒适性负载，优先保留生命支持冗余。";
  } else if (nextMode === "emergency") {
    scenario = "应急保底";
    caps.oxygenLoop = 18;
    caps.pressureControl = 14;
    caps.thermalControl = 14;
    caps.waterRecycler = 6;
    caps.lighting = 2;
    caps.comfortLoad = 0;
    caps.publicDisplay = 0;
    text = "能源缺口触及阈值。AI 仅保留氧气循环、舱压维持与基础温控。";
  } else if (state.mode === "emergency" || nextMode === "recovery") {
    nextMode = "recovery";
    scenario = "恢复排序";
    caps.thermalControl = 18;
    caps.waterRecycler = 10;
    caps.lighting = 4;
    caps.comfortLoad = 6;
    caps.publicDisplay = 0;
    text = "发电回升。AI 按生命支持、环境控制、生活负载的顺序恢复。";
  }

  if (state.mode !== nextMode && state.docked) {
    pushLog(`模式切换：${state.mode} -> ${nextMode}`);
  }

  state.mode = nextMode;
  state.ai.loadCaps = caps;
  state.ai.text = text;
  state.ai.scenario = scenario;
}

function tickSystem() {
  state.tick += 1;
  updateSolar();

  const e = state.energy;
  e.generation = 80 * (e.solarInput / 100) * (e.solarHealth / 100);

  state.habitat.activeDemand = activeDemand();
  const rawDeficit = Math.max(0, state.habitat.activeDemand - e.generation);
  const batteryBoost = state.docked && e.batterySoc > e.reserveFloor ? Math.min(rawDeficit, 24) : 0;
  e.availablePower = state.docked ? Math.min(e.outputLimit, e.generation + batteryBoost) : 24;
  state.habitat.allocatedDemand = Math.min(state.habitat.activeDemand, e.availablePower);

  const netPower = e.generation - state.habitat.allocatedDemand;
  e.batterySoc = clamp(e.batterySoc + netPower / 120, 0, 100);

  const deficitRatio = Math.max(0, state.habitat.activeDemand - e.generation) / Math.max(state.habitat.activeDemand, 1);
  const reserveRisk = Math.max(0, e.reserveFloor - e.batterySoc) / e.reserveFloor;
  e.batteryStress = clamp(70 * deficitRatio + 30 * reserveRisk, 0, 100);

  const oxygenIndex = clamp(allocatedFor("oxygenLoop") / 18, 0, 1);
  const pressureIndex = clamp(allocatedFor("pressureControl") / 14, 0, 1);
  const thermalIndex = clamp(allocatedFor("thermalControl") / 22, 0, 1);
  state.habitat.lifeSupportScore = 100 * (0.42 * oxygenIndex + 0.36 * pressureIndex + 0.22 * thermalIndex);

  const criticalShortage = Math.max(0, 48 - e.availablePower) / 48;
  const lifeRisk = 100 - state.habitat.lifeSupportScore;
  state.habitat.habitatRisk = clamp(45 * criticalShortage + 35 * e.batteryStress / 100 + 20 * lifeRisk / 100, 0, 100);

  planAiAction();
  render();
}

function confirmDock() {
  if (state.docked) return;
  state.docked = true;
  state.ai.text = "能源舱已接入。原 3D 场景不变，AI 面板开始接管生命支持调度演示。";
  state.ai.scenario = "能源并网";
  pushLog("能源舱接入：系统从待命进入并网态。");
  render();
}

function startEvent() {
  if (!state.docked || state.eventRunning) return;
  state.eventRunning = true;
  state.eventStartedAt = state.tick;
  state.ai.scenario = "遮挡演练";
  state.ai.text = "遮挡事件开始。AI 正在追踪太阳输入下降对生命支持链路的传播。";
  pushLog("遮挡事件启动：太阳输入开始下降。");
  render();
}

function openDoors() {
  if (!state.docked) return;
  state.doorsOpen = !state.doorsOpen;
  pushLog(state.doorsOpen ? "双门开启：结构连接与人员通行已确认。" : "双门关闭：并网保持稳定。");
  render();
}

function reset() {
  const next = initialState();
  Object.keys(state).forEach(key => delete state[key]);
  Object.assign(state, next);
  const lighting = ensureLightingConfig();
  Object.entries(defaultLighting).forEach(([key, value]) => {
    lighting[key].brightness = value.brightness;
    lighting[key].scale = value.scale;
    lighting[key].lightColor = value.lightColor;
    lighting[key].glowColor = value.glowColor;
  });
  el.body.dataset.mode = "normal";
  syncLightingControls();
  render();
}

function renderBars() {
  el.solarBar.style.setProperty("--value", `${state.energy.solarInput}%`);
  el.batteryBar.style.setProperty("--value", `${state.energy.batterySoc}%`);
  el.lifeBar.style.setProperty("--value", `${state.habitat.lifeSupportScore}%`);
  const modeValue = state.mode === "normal" ? 25 : state.mode === "warning" ? 55 : state.mode === "emergency" ? 88 : 70;
  el.modeBar.style.setProperty("--value", `${modeValue}%`);
}

function renderLog() {
  el.log.innerHTML = state.log.map(item => `<li>${item}</li>`).join("");
}

function setDashboardCollapsed(collapsed) {
  el.dashboard.classList.toggle("is-collapsed", collapsed);
  el.launcher.setAttribute("aria-expanded", String(!collapsed));
}

function setLightingField(group, key, value) {
  const lighting = ensureLightingConfig();
  if (key === "brightness" || key === "scale") {
    lighting[group][key] = Number(value);
  } else {
    lighting[group].lightColor = value;
    lighting[group].glowColor = value;
  }
  window.localStorage.setItem("myMoonLighting", JSON.stringify(lighting));
  syncLightingControls();
}

function syncLightingControls() {
  const lighting = ensureLightingConfig();
  Object.entries(el.lighting).forEach(([group, controls]) => {
    const config = lighting[group];
    controls.brightness.value = String(config.brightness);
    controls.brightnessValue.textContent = `${config.brightness.toFixed(2)}x`;
    controls.color.value = config.lightColor;
    controls.scale.value = String(config.scale);
    controls.scaleValue.textContent = `${config.scale.toFixed(2)}x`;
  });
}

async function saveLightingConfig() {
  const lighting = ensureLightingConfig();
  window.localStorage.setItem("myMoonLighting", JSON.stringify(lighting));
  try {
    const response = await fetch("/__my-moon/save-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lighting),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    el.lightingSaveStatus.textContent = "已写回 assets/my-moon-runtime-config.js";
    pushLog("模型参数已保存到运行时配置文件。");
  } catch {
    el.lightingSaveStatus.textContent = "已保存到浏览器；当前服务器未启用写回接口";
    pushLog("模型参数已保存到浏览器本地缓存。");
  }
  renderLog();
}

function render() {
  const e = state.energy;
  const h = state.habitat;
  el.body.dataset.mode = state.mode;

  el.modeText.textContent = state.mode;
  el.solarText.textContent = `${Math.round(e.solarInput)}%`;
  el.batteryText.textContent = `${Math.round(e.batterySoc)}%`;
  el.lifeText.textContent = `${Math.round(h.lifeSupportScore)}%`;
  el.generationText.textContent = `${e.generation.toFixed(1)} EU/s`;
  el.stressText.textContent = `${Math.round(e.batteryStress)}%`;
  el.demandText.textContent = `${Math.round(h.activeDemand)} EU/s`;
  el.riskText.textContent = `${Math.round(h.habitatRisk)}%`;
  el.dockText.textContent = state.docked ? (state.doorsOpen ? "已并网 · 双门开启" : "已并网") : "未并网";
  el.scenarioText.textContent = state.ai.scenario;
  el.aiCopy.textContent = state.ai.text;
  el.lead.textContent = state.docked

  el.dockButton.disabled = state.docked;
  el.eventButton.disabled = !state.docked || state.eventRunning;
  el.doorButton.disabled = !state.docked;
  el.doorButton.textContent = state.doorsOpen ? "关闭双门" : "打开双门";

  renderBars();
  renderLog();
}

el.launcher.addEventListener("click", () => {
  setDashboardCollapsed(!el.dashboard.classList.contains("is-collapsed"));
});
el.dockButton.addEventListener("click", confirmDock);
el.eventButton.addEventListener("click", startEvent);
el.doorButton.addEventListener("click", openDoors);
el.resetButton.addEventListener("click", reset);
Object.entries(el.lighting).forEach(([group, controls]) => {
  controls.brightness.addEventListener("input", event => setLightingField(group, "brightness", event.target.value));
  controls.color.addEventListener("input", event => setLightingField(group, "color", event.target.value));
  controls.scale.addEventListener("input", event => setLightingField(group, "scale", event.target.value));
});
el.lightingSave.addEventListener("click", saveLightingConfig);

setDashboardCollapsed(initialOverlayCollapsed);
syncLightingControls();
render();
window.setInterval(tickSystem, 1000);
