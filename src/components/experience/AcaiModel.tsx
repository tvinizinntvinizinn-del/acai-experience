"use client";

/**
 * Renderizador 3D (React Three Fiber) — usado quando existe um modelo GLB
 * realista em /public/models e `experience.renderer = "model"`.
 *
 * Convenções do modelo (veja public/models/README.md):
 *  - origem na base do copo, eixo Y para cima, altura ~2.3 unidades;
 *  - nós cujo nome começa com "topping" são afastados do copo na "explosão"
 *    dos ingredientes (stage.bareMix) e voltam na montagem.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { experience } from "@/config/experience";
import type { StageState } from "@/lib/stage";

type Props = { stage: StageState; onReady?: () => void };

// Mesmo enquadramento usado nos frames renderizados.
const FAR = { position: new THREE.Vector3(0, 4.59, 9.27), target: new THREE.Vector3(0, 1.4, 0) };
const NEAR = { position: new THREE.Vector3(0, 4.45, 3.7), target: new THREE.Vector3(0, 2.28, 0.22) };

function Cup({ stage, onReady }: Props) {
  const { scene } = useGLTF(experience.model.url);
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  const toppings = useMemo(() => {
    const list: { obj: THREE.Object3D; base: THREE.Vector3; exploded: THREE.Vector3 }[] = [];
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
      if (obj.name.toLowerCase().startsWith("topping")) {
        const base = obj.position.clone();
        const dir = base.clone().setY(0);
        if (dir.lengthSq() < 1e-4) dir.set(Math.random() - 0.5, 0, Math.random() - 0.5);
        dir.normalize();
        list.push({ obj, base, exploded: base.clone().add(dir.multiplyScalar(1.4)).add(new THREE.Vector3(0, 0.9, 0)) });
      }
    });
    return list;
  }, [scene]);

  useEffect(() => {
    onReady?.();
  }, [onReady]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.rotation.y = THREE.MathUtils.degToRad(stage.frame * experience.spin.degreesPerFrame + experience.model.rotationY);
    for (const t of toppings) t.obj.position.lerpVectors(t.base, t.exploded, stage.bareMix);
    const k = stage.closeMix * (stage.closeFrame / Math.max(1, experience.closeup.count - 1));
    camera.position.lerpVectors(FAR.position, NEAR.position, k);
    lookTarget.lerpVectors(FAR.target, NEAR.target, k);
    camera.lookAt(lookTarget);
  });

  return (
    <group ref={group} scale={experience.model.scale}>
      <primitive object={scene} />
    </group>
  );
}

export default function AcaiModel({ stage, onReady }: Props) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      shadows
      camera={{ fov: 20, near: 0.1, far: 100, position: [FAR.position.x, FAR.position.y, FAR.position.z] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl, camera }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        camera.lookAt(FAR.target);
      }}
    >
      <Suspense fallback={null}>
        <Cup stage={stage} onReady={onReady} />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.6} color="#fff1e2" position={[-4, 2.5, 3]} scale={[3, 6, 1]} />
          <Lightformer form="rect" intensity={2.2} color="#ff9ccf" position={[4, 2, -4]} scale={[2, 6, 1]} />
          <Lightformer form="circle" intensity={1.2} color="#ffffff" position={[0, 6, 1]} scale={3} />
        </Environment>
        <ContactShadows position={[0, -0.01, 0]} opacity={0.32} scale={6} blur={2.8} far={3} />
      </Suspense>
      <directionalLight position={[-6, 4.5, 3.5]} intensity={2.4} color="#fff1e2" castShadow />
      <directionalLight position={[5, 3, -5]} intensity={1.8} color="#ff9ccf" />
      <hemisphereLight args={["#fff6ec", "#3a1c4f", 0.35]} />
    </Canvas>
  );
}
