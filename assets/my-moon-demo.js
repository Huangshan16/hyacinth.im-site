/*
  [INPUT]: 依赖 index.html 的交互 DOM，依赖 CSS 自定义属性驱动视觉状态，依赖数值 spec 的能源/负载/风险公式
  [OUTPUT]: 对外提供居住舱移动、磁挫锁并网、遮挡事件、AI 调度、HUD 更新与移动端按钮控制
  [POS]: assets 层的 Demo 状态机，被 index.html 直接引用，是“我的月球”最小可玩闭环的运行核心
  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
*/
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

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
  habitatPos: { x: -210, y: 118 },
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
    text: "移动居住舱靠近能源舱凹入接口。进入磁挫锁范围后，确认并网才会接入能源。",
    loadCaps: {},
  },
});

let state = initialState();
const keys = new Set();
let lastFrame = performance.now();

const el = {
  body: document.body,
  scene: document.querySelector(".scene"),
  habitat: document.getElementById("habitatCabin"),
  beam: document.getElementById("beam"),
  magLock: document.getElementById("magLock"),
  modeText: document.getElementById("modeText"),
  solarText: document.getElementById("solarText"),
  batteryText: document.getElementById("batteryText"),
  lifeText: document.getElementById("lifeText"),
  generationText: document.getElementById("generationText"),
  stressText: document.getElementById("stressText"),
  demandText: document.getElementById("demandText"),
  riskText: document.getElementById("riskText"),
  dockText: document.getElementById("dockText"),
  aiCopy: document.getElementById("aiCopy"),
  dockButton: document.getElementById("dockButton"),
  eventButton: document.getElementById("eventButton"),
  resetButton: document.getElementById("resetButton"),
  doorButton: document.getElementById("doorButton"),
  audioButton: document.getElementById("audioButton"),
  modeBar: document.getElementById("modeBar"),
  solarBar: document.getElementById("solarBar"),
  batteryBar: document.getElementById("batteryBar"),
  lifeBar: document.getElementById("lifeBar"),
};

var ambientAudio = null;
var audioState = "idle";
const energyPos = { x: 180, y: -58 };

function distanceToEnergy() {
  return Math.hypot(state.habitatPos.x - energyPos.x, state.habitatPos.y - energyPos.y);
}

function isInMagneticRange() {
  return distanceToEnergy() < 154;
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
  let text = "系统稳定。居住舱通过磁挫锁接入能源舱，生命支持保持完整冗余。";

  if (!state.docked) {
    nextMode = "normal";
    text = isInMagneticRange()
      ? "已进入磁挫锁捕获范围。确认并网后，能源舱将向居住舱开放供能。"
      : "移动居住舱靠近能源舱凹入接口。进入磁挫锁范围后，确认并网才会接入能源。";
  } else if (nextMode === "warning") {
    caps.lighting = 4;
    caps.comfortLoad = 6;
    caps.publicDisplay = 2;
    caps.thermalControl = 18;
    text = "太阳输入下降，能源舱进入高压区。已降低舒适性负载，保留生命支持冗余。";
  } else if (nextMode === "emergency") {
    caps.oxygenLoop = 18;
    caps.pressureControl = 14;
    caps.thermalControl = 14;
    caps.waterRecycler = 6;
    caps.lighting = 2;
    caps.comfortLoad = 0;
    caps.publicDisplay = 0;
    text = "能源缺口触及生命支持阈值。氧气循环、舱压维持与基础温控进入最高优先级。";
  } else if (state.mode === "emergency" || nextMode === "recovery") {
    nextMode = "recovery";
    caps.thermalControl = 18;
    caps.waterRecycler = 10;
    caps.lighting = 4;
    caps.comfortLoad = 6;
    caps.publicDisplay = 0;
    text = "发电恢复稳定。系统按生命支持、环境控制、生活负载的顺序逐步恢复。";
  }

  state.mode = nextMode;
  state.ai.loadCaps = caps;
  state.ai.text = text;
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

function moveHabitat(dx, dy) {
  if (state.docked) return;
  state.habitatPos.x = clamp(state.habitatPos.x + dx, -360, 330);
  state.habitatPos.y = clamp(state.habitatPos.y + dy, -230, 230);
  render();
}

function confirmDock() {
  if (!isInMagneticRange()) return;
  state.docked = true;
  state.habitatPos.x = 68;
  state.habitatPos.y = 6;
  state.ai.text = "磁挫锁稳定。能源接入已确认，居住舱进入能源舱供给网络。";
  render();
}

function startEvent() {
  if (!state.docked) return;
  state.eventRunning = true;
  state.eventStartedAt = state.tick;
  state.ai.text = "太阳遮挡事件开始。AI 正在监测能源下降对生命支持的影响传播。";
  render();
}

function openDoors() {
  if (!state.docked) return;
  state.doorsOpen = !state.doorsOpen;
  state.ai.text = state.doorsOpen
    ? "双门已内滑开启。结构连接与人员通行已分离确认。"
    : "双门已关闭。磁挫锁保持稳定，能源连接不受影响。";
  render();
}

function reset() {
  state = initialState();
  Object.values(loads).forEach(load => { load.cap = load.normal; });
  render();
}

function ensureAudio() {
  if (!ambientAudio) {
    ambientAudio = new Audio("./assets/audio/time-savings-jar.m4a");
    ambientAudio.loop = true;
    ambientAudio.volume = 0.38;
  }
  return ambientAudio;
}

async function toggleAudio() {
  const audio = ensureAudio();
  if (audioState === "playing") {
    audio.pause();
    audioState = "paused";
    render();
    return;
  }
  try {
    await audio.play();
    audioState = "playing";
  } catch {
    audioState = "blocked";
  }
  render();
}

function renderBars() {
  el.solarBar.style.setProperty("--value", `${state.energy.solarInput}%`);
  el.batteryBar.style.setProperty("--value", `${state.energy.batterySoc}%`);
  el.lifeBar.style.setProperty("--value", `${state.habitat.lifeSupportScore}%`);
  const modeValue = state.mode === "normal" ? 25 : state.mode === "warning" ? 55 : state.mode === "emergency" ? 88 : 70;
  el.modeBar.style.setProperty("--value", `${modeValue}%`);
  const stressColor = state.mode === "emergency" ? "var(--red)" : state.mode === "warning" ? "var(--amber)" : "var(--green)";
  [el.modeBar, el.solarBar, el.batteryBar, el.lifeBar].forEach(item => {
    item.style.setProperty("--bar-color", stressColor);
  });
}

function renderBeam() {
  const x1 = state.habitatPos.x + 63;
  const y1 = state.habitatPos.y + 62;
  const x2 = energyPos.x + 63;
  const y2 = energyPos.y + 62;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const width = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const beamOpacity = state.docked ? (state.eventRunning ? 0.52 : 0.9) : 0;
  el.beam.style.setProperty("--beam-x", `${x1}px`);
  el.beam.style.setProperty("--beam-y", `${y1}px`);
  el.beam.style.setProperty("--beam-width", `${width}px`);
  el.beam.style.setProperty("--beam-angle", `${angle}deg`);
  el.beam.style.setProperty("--beam-opacity", beamOpacity);
  el.beam.style.setProperty("--beam-glow", state.docked ? 0.55 : 0);
}

function render() {
  const near = isInMagneticRange();
  const e = state.energy;
  const h = state.habitat;
  el.body.dataset.mode = state.mode;
  el.scene.style.setProperty("--solar-dim", `${(100 - e.solarInput) / 100}`);
  el.habitat.style.setProperty("--x", `${state.habitatPos.x}px`);
  el.habitat.style.setProperty("--y", `${state.habitatPos.y}px`);
  el.habitat.style.setProperty("--rot", state.docked ? "22deg" : "-12deg");
  el.magLock.style.setProperty("--lock-scale", near || state.docked ? 1 : 0);
  el.magLock.style.setProperty("--lock-opacity", state.docked ? 0.82 : near ? 0.42 : 0);

  el.modeText.textContent = state.mode;
  el.solarText.textContent = `${Math.round(e.solarInput)}%`;
  el.batteryText.textContent = `${Math.round(e.batterySoc)}%`;
  el.lifeText.textContent = `${Math.round(h.lifeSupportScore)}%`;
  el.generationText.textContent = `${e.generation.toFixed(1)} EU/s`;
  el.stressText.textContent = `${Math.round(e.batteryStress)}%`;
  el.demandText.textContent = `${Math.round(h.activeDemand)} EU/s`;
  el.riskText.textContent = `${Math.round(h.habitatRisk)}%`;
  el.dockText.textContent = state.docked ? (state.doorsOpen ? "已并网 · 双门开启" : "已并网") : near ? "磁挫锁捕获" : "未并网";
  el.aiCopy.textContent = state.ai.text;

  el.dockButton.disabled = state.docked || !near;
  el.eventButton.disabled = !state.docked || state.eventRunning;
  el.doorButton.disabled = !state.docked;
  el.doorButton.textContent = state.doorsOpen ? "关闭双门" : "打开双门";
  el.audioButton.textContent =
    audioState === "playing"
      ? "关闭环境音"
      : audioState === "blocked"
        ? "环境音受限"
        : "播放环境音";

  renderBars();
  renderBeam();
}

function handleKey(event) {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
    keys.add(key);
  }
  if (key === "e") confirmDock();
}

window.addEventListener("keydown", handleKey);
window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()));

el.dockButton.addEventListener("click", confirmDock);
el.eventButton.addEventListener("click", startEvent);
el.resetButton.addEventListener("click", reset);
el.doorButton.addEventListener("click", openDoors);
el.audioButton.addEventListener("click", toggleAudio);

document.querySelectorAll("[data-pad]").forEach(button => {
  button.addEventListener("click", () => {
    const dir = button.dataset.pad;
    if (dir === "up") moveHabitat(0, -26);
    if (dir === "down") moveHabitat(0, 26);
    if (dir === "left") moveHabitat(-26, 0);
    if (dir === "right") moveHabitat(26, 0);
  });
});

function frame(now) {
  const dt = Math.min(48, now - lastFrame);
  lastFrame = now;
  const speed = 0.18 * dt;
  if (keys.has("w") || keys.has("arrowup")) moveHabitat(0, -speed);
  if (keys.has("s") || keys.has("arrowdown")) moveHabitat(0, speed);
  if (keys.has("a") || keys.has("arrowleft")) moveHabitat(-speed, 0);
  if (keys.has("d") || keys.has("arrowright")) moveHabitat(speed, 0);
  requestAnimationFrame(frame);
}

render();
requestAnimationFrame(frame);
window.setInterval(tickSystem, 1000);
