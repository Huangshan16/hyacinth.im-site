/*
  [INPUT]: 依赖 index.html 中的 #sceneCanvas，依赖 assets/models/landmarks/*.glb 现有素材作为控制台、回放舱与节点占位
  [OUTPUT]: 对外提供透明 3D 占位层，在当前静态 Demo 上叠加现有 GLB 资产的可视化存在
  [POS]: assets 层的轻量 3D 素材适配器，不接管主交互，只负责把仓库现有模型拉进“我的月球”场景
  [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
*/
const canvas = document.getElementById("sceneCanvas");
const modelStatusTarget = document.getElementById("aiCopy");

async function bootModelLayer() {
  if (!canvas) return;

  let THREE;
  let GLTFLoader;

  try {
    const threeModule = await import("https://unpkg.com/three@0.165.0/build/three.module.js");
    const loaderModule = await import("https://unpkg.com/three@0.165.0/examples/jsm/loaders/GLTFLoader.js");
    THREE = threeModule;
    GLTFLoader = loaderModule.GLTFLoader;
  } catch (_error) {
    // 网络依赖不可用时静默降级，保留 DOM 灰盒与数值闭环。
    document.body.dataset.modelLayer = "import-error";
    if (modelStatusTarget) {
      modelStatusTarget.textContent = "3D 素材层加载失败，当前退回 DOM 灰盒场景。";
    }
    return;
  }

  document.body.dataset.modelLayer = "booting";

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 12, 24);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xf0f4e8, 1.9);
  const sun = new THREE.DirectionalLight(0xe8f5ff, 2.6);
  sun.position.set(8, 14, 10);
  scene.add(ambient, sun);

  const fill = new THREE.PointLight(0x77e3df, 28, 80, 2);
  fill.position.set(-12, 6, 10);
  scene.add(fill);

  const modelLayer = new THREE.Group();
  modelLayer.rotation.x = -0.14;
  modelLayer.position.y = -1.5;
  scene.add(modelLayer);

  // 明亮调试体用于确认 3D 画布已真正出图。
  const debugCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.72, 0),
    new THREE.MeshStandardMaterial({
      color: 0x77e3df,
      emissive: 0x16393d,
      roughness: 0.35,
      metalness: 0.08,
    })
  );
  debugCore.position.set(0, 1.8, 0.6);
  scene.add(debugCore);

  const loader = new GLTFLoader();
  const spinNodes = [];
  let loadedCount = 0;
  let failedCount = 0;

  const placements = [
    {
      url: "./assets/models/landmarks/contact-booth.glb",
      position: [0, -0.6, 4.3],
      rotationY: Math.PI,
      targetSize: 4.2,
      role: "console",
    },
    {
      url: "./assets/models/landmarks/circus-tent.glb",
      position: [8.4, -0.5, -5.1],
      rotationY: -0.72,
      targetSize: 4.6,
      role: "replay",
    },
    {
      url: "./assets/models/landmarks/fountain.glb",
      position: [-8.2, -0.9, -2.8],
      rotationY: 0.52,
      targetSize: 4.8,
      role: "energy-anchor",
    },
    {
      url: "./assets/models/landmarks/statue-Twitter.glb",
      position: [-10.8, -0.7, 6.8],
      rotationY: 0.24,
      targetSize: 2.8,
      role: "node",
    },
    {
      url: "./assets/models/landmarks/statue-微博.glb",
      position: [-6.8, -0.7, 8.5],
      rotationY: -0.4,
      targetSize: 2.8,
      role: "node",
    },
    {
      url: "./assets/models/landmarks/statue-即刻.glb",
      position: [-3.6, -0.7, 6.9],
      rotationY: 0.14,
      targetSize: 2.8,
      role: "node",
    },
    {
      url: "./assets/models/landmarks/statue-小红书.glb",
      position: [-6.4, -0.7, 4.2],
      rotationY: 0.82,
      targetSize: 2.8,
      role: "node",
    },
  ];

  function tuneModel(root, role) {
    root.traverse(obj => {
      if (!obj.isMesh) return;
      obj.castShadow = false;
      obj.receiveShadow = false;
      const material = obj.material;
      if (material && "roughness" in material) {
        material.roughness = Math.min(1, (material.roughness ?? 0.7) + 0.1);
      }
      if (material && "metalness" in material) {
        material.metalness = Math.max(0, (material.metalness ?? 0.1) - 0.06);
      }
      if (material && "emissive" in material && role === "node") {
        material.emissive = new THREE.Color(0x0e1314);
      }
    });
  }

  function normalizeModel(root, targetSize) {
    const bounds = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    const scale = targetSize / longest;
    root.scale.setScalar(scale);
    root.position.sub(center.multiplyScalar(scale));
  }

  function updateModelStatus() {
    if (!modelStatusTarget) return;
    if (loadedCount > 0 && failedCount === 0) {
      modelStatusTarget.textContent = `3D 素材层已接入，当前已加载 ${loadedCount} 个现有 GLB 占位模型。`;
      return;
    }
    if (loadedCount > 0 && failedCount > 0) {
      modelStatusTarget.textContent = `3D 素材层部分成功，已加载 ${loadedCount} 个 GLB，占位模型仍有 ${failedCount} 个失败。`;
      return;
    }
    if (failedCount > 0) {
      modelStatusTarget.textContent = "3D 素材层加载失败，当前退回 DOM 灰盒场景。";
    }
  }

  placements.forEach(item => {
    loader.load(
      item.url,
      gltf => {
        const root = gltf.scene;
        normalizeModel(root, item.targetSize);
        root.position.set(...item.position);
        root.rotation.y = item.rotationY;
        tuneModel(root, item.role);
        modelLayer.add(root);
        loadedCount += 1;
        document.body.dataset.modelLayer = "ready";
        updateModelStatus();
        if (item.role === "node") spinNodes.push(root);
      },
      undefined,
      () => {
        failedCount += 1;
        if (loadedCount === 0) {
          document.body.dataset.modelLayer = "load-error";
        }
        updateModelStatus();
      }
    );
  });

  function syncLighting() {
    const mode = document.body.dataset.mode || "normal";
    if (mode === "warning") {
      ambient.color.set(0xfff1d1);
      fill.color.set(0xffbe55);
      fill.intensity = 34;
      return;
    }
    if (mode === "emergency") {
      ambient.color.set(0xffe0d9);
      fill.color.set(0xff695d);
      fill.intensity = 40;
      return;
    }
    if (mode === "recovery") {
      ambient.color.set(0xe8fff8);
      fill.color.set(0x77e3df);
      fill.intensity = 32;
      return;
    }
    ambient.color.set(0xf0f4e8);
    fill.color.set(0x77e3df);
    fill.intensity = 28;
  }

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    syncLighting();
    const t = now * 0.001;
    debugCore.rotation.y += 0.012;
    debugCore.rotation.x = 0.38 + Math.sin(t * 1.4) * 0.12;
    debugCore.position.y = 1.8 + Math.sin(t * 1.8) * 0.22;
    spinNodes.forEach((node, index) => {
      node.rotation.y += 0.004 + index * 0.0008;
      node.position.y = -0.7 + Math.sin(t * 1.2 + index) * 0.12;
    });
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);
  window.addEventListener("resize", resize);
}

bootModelLayer();
