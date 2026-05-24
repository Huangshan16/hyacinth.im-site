/**
 * [INPUT]: 依赖 assets/SceneRoot-DLjunhxr.js 的压缩构建产物，以及当前人工确认的 R3F/Three 函数边界
 * [OUTPUT]: 对外提供 SceneRoot 场景的反整理骨架、函数语义映射与地表替换点说明
 * [POS]: docs/recovered 的恢复源码索引，不参与运行时构建，只服务后续维护和补丁定位
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

/*
 * 这不是原始源码。
 * 仓库没有 source map / sourcesContent / src 目录，只能从构建产物恢复组件意图。
 */

const aliasMap = {
  ze: "WorldStage",
  Ye: "OuterGroundTexture",
  Je: "CenterGroundTexture",
  Xe: "GroundTilePatches",
  ie: "BackdropGroundRing",
  Ae: "DisabledPlayerCartBase",
  Be: "CircusTentLandmark",
  Te: "PlayerModel",
  xe: "DisabledGrassField",
  ke: "PlayerController",
  lt: "SceneRoot",
};

function WorldStage({ activeTargetId, isContactDialogOpen, labelsVisible, onInteractTarget, playerPosition }) {
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[22.5, 0.09, 19.5]} position={[0, -0.09, 0]} />
        <CuboidCollider args={[32, 0.08, 28]} position={[0, -1.15, 0]} />
        <mesh receiveShadow position={[0, -0.08, 0]}>
          <cylinderGeometry args={[21, 22.2, 0.16, 8]} />
          <meshStandardMaterial color="#d8cab7" roughness={0.96} />
        </mesh>
        <OuterGroundTexture />
      </RigidBody>

      <GroundTilePatches />
      <FenceAndBorder />
      <Decorations />
      <CenterGroundTexture />
      <Landmarks activeTargetId={activeTargetId} onInteractTarget={onInteractTarget} />
    </group>
  );
}

function CenterGroundTexture() {
  const texture = useTexture("/assets/textures/plaza-ground.png");
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(4.4, 4.4);
  texture.anisotropy = 8;

  return (
    <mesh receiveShadow position={[0, 0.057, -1.35]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[8.4, 80]} />
      <meshStandardMaterial map={texture} roughness={0.9} />
    </mesh>
  );
}

function OuterGroundTexture() {
  const texture = useTexture("/assets/textures/plaza-ground.png");
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.anisotropy = 4;

  return (
    <mesh receiveShadow position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[20.6, 48]} />
      <meshStandardMaterial map={texture} roughness={0.92} />
    </mesh>
  );
}

function GroundTilePatches() {
  // 原构建产物这里生成 42 个五边形铺片；月面贴图接入后该层会破坏地貌连续性。
  return <group />;
}

function SceneRoot(props) {
  return (
    <Canvas camera={{ position: [0, 6.5, 14], fov: 45, near: 0.1, far: 95 }} shadows>
      <Suspense fallback={null}>
        <WeatherSystem onWeatherChange={props.onWeatherChange} />
        <Physics colliders={false} gravity={[0, -18, 0]} timeStep="vary">
          <PlayerController {...props} />
          <WorldStage {...props} />
          <WorksRing {...props} />
          <SocialNodes {...props} />
          <BackdropGroundRing />
          <DisabledGrassField playerPositionRef={props.playerPositionRef} />
        </Physics>
        <OrbitControls enabled={false} />
      </Suspense>
    </Canvas>
  );
}

function PlayerController({ mobileInputRef, onMove, playerPositionRef }) {
  return (
    <RigidBody canSleep={false} colliders={false} enabledRotations={[false, false, false]}>
      <CapsuleCollider args={[0.4, 0.3]} position={[0, 0.5, 0]} />
      <group position={[0, -0.3, 0]}>
        <PlayerModel movementDirectionRef={null} movementIntensityRef={null} rotation={[0, Math.PI / 2, 0]} scale={1.75} />
      </group>
    </RigidBody>
  );
}

function DisabledPlayerCartBase() {
  // 原 `Ae()` 是黄色小车底座；当前用户操控主体只保留 GLB 模型本体，不再挂载该底座。
  return null;
}

function CircusTentLandmark({ active, onInteract }) {
  return (
    <RigidBody type="fixed" colliders={false} position={[0, 0, -3.8]}>
      <CylinderCollider args={[1.75, 3.55]} position={[0, 1.75, 0]} />
      <TargetRing active={active} radius={4.2} />
      <group onPointerDown={onInteract}>
        <HighlightableModel
          path="/assets/models/landmarks/circus-tent.glb"
          rotation={[0, Math.PI + Math.PI / 2, 0]}
          scale={15}
        />
      </group>
      {/* 原构建产物在这里额外插入红色 cone 旗帜与 cylinder 旗杆；当前已移除。 */}
    </RigidBody>
  );
}

function DisabledGrassField() {
  // 原 `xe()` 会挂载程序化草叶、花和麦穗；月面场景下已整体禁用。
  return null;
}
