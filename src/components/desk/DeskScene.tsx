"use client";

// The interactive 3D workbench (Phase 2). Procedurally modelled in Three.js —
// no downloaded assets. Screens show only Archit's real screenshots.
// Props are lifted to DeskStage so the DOM buttons and 3D clicks stay in sync.
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Html, OrbitControls, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

export type DeskElement = "laptop" | "phone" | "earbuds" | "printer";

export const SITES = [
  { title: "CivicEye", url: "civiceye.co.in", href: "https://civiceye.co.in", img: "/screens/civiceye-site.jpg" },
  { title: "ArchiSpace", url: "architspace.vercel.app", href: "https://architspace.vercel.app", img: "/screens/archispace-new.jpg" },
  { title: "MetrikAI", url: "metrik-steel.vercel.app", href: "https://metrik-steel.vercel.app", img: "/screens/metrik-site.jpg" },
];

type Props = {
  active: DeskElement | null;
  siteIdx: number;
  flipped: boolean;
  caseOpen: boolean;
  printing: boolean;
  onSelect: (el: DeskElement) => void;
  onHover: (el: DeskElement | null) => void;
};

const MAT = {
  chassis: new THREE.MeshStandardMaterial({ color: "#101312", roughness: 0.45, metalness: 0.55 }),
  dark: new THREE.MeshStandardMaterial({ color: "#0a0c0b", roughness: 0.6, metalness: 0.3 }),
  desk: new THREE.MeshStandardMaterial({ color: "#0d100e", roughness: 0.85, metalness: 0.1 }),
  white: new THREE.MeshStandardMaterial({ color: "#e8ece9", roughness: 0.35, metalness: 0.1 }),
  beam: new THREE.MeshStandardMaterial({ color: "#2c362f", roughness: 0.38, metalness: 0.7 }),
};

function Label({ pos, children }: { pos: [number, number, number]; children: React.ReactNode }) {
  return (
    <Html position={pos} center distanceFactor={9} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <span className="whitespace-nowrap rounded-full border border-white/10 bg-black/50 px-2.5 py-0.5 font-mono text-[8px] tracking-[0.18em] text-white/60 backdrop-blur-md">
        {children}
      </span>
    </Html>
  );
}

/* ---------------------------------- Laptop --------------------------------- */

function useScreenTexture(site: (typeof SITES)[number]) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext("2d")!;
    const t = new THREE.CanvasTexture(canvas);
    t.anisotropy = 4;
    const img = new Image();
    img.src = site.img;
    img.onload = () => {
      // browser chrome
      ctx.fillStyle = "#0b0f0d";
      ctx.fillRect(0, 0, 1024, 640);
      ctx.fillStyle = "#111714";
      ctx.fillRect(0, 0, 1024, 52);
      ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(26 + i * 24, 26, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#1c2420";
      ctx.beginPath();
      ctx.roundRect(96, 12, 300, 28, 8);
      ctx.fill();
      ctx.fillStyle = "#cfe6d8";
      ctx.font = "600 15px system-ui, sans-serif";
      ctx.fillText(site.title, 112, 31);
      ctx.fillStyle = "#161e1a";
      ctx.beginPath();
      ctx.roundRect(412, 12, 420, 28, 14);
      ctx.fill();
      ctx.fillStyle = "#8fa89b";
      ctx.font = "14px ui-monospace, monospace";
      ctx.fillText("https://" + site.url, 428, 31);
      // page (cover-crop like a browser viewport)
      const area = { x: 0, y: 52, w: 1024, h: 548 };
      const scale = Math.max(area.w / img.width, area.h / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, area.x + (area.w - w) / 2, area.y, w, h);
      // windows-style taskbar
      ctx.fillStyle = "rgba(8,10,9,0.92)";
      ctx.fillRect(0, 600, 1024, 40);
      ctx.fillStyle = "#63f2a6";
      const cx = 512;
      ctx.fillRect(cx - 16, 610, 13, 13);
      ctx.fillRect(cx + 3, 610, 13, 13);
      ctx.fillRect(cx - 16, 627, 13, 4);
      ctx.fillRect(cx + 3, 627, 13, 4);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      [0, 1, 2].forEach((i) => ctx.fillRect(452 + i * 8 - 60, 616, 5, 18));
      t.needsUpdate = true;
      setTex(t);
    };
    return () => {
      t.dispose();
    };
  }, [site]);
  return tex;
}

function useKeyboardTexture() {
  const tex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 224;
    const t = new THREE.CanvasTexture(canvas);
    t.userData.canvas = canvas;
    return t;
  }, []);
  useEffect(() => {
    const canvas = tex.userData.canvas as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    let hue = 140;
    const draw = () => {
      hue = (hue + 14) % 360;
      ctx.fillStyle = "#070908";
      ctx.fillRect(0, 0, 512, 224);
      const kw = 30;
      const kh = 30;
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 15; c++) {
          ctx.fillStyle = `hsl(${(hue + c * 16 + r * 8) % 360} 85% 58%)`;
          ctx.beginPath();
          ctx.roundRect(10 + c * (kw + 3), 10 + r * (kh + 5), kw, kh, 5);
          ctx.fill();
        }
      }
      // spacebar
      ctx.fillStyle = `hsl(${hue} 85% 60%)`;
      ctx.beginPath();
      ctx.roundRect(140, 196, 230, 18, 6);
      ctx.fill();
      tex.needsUpdate = true;
    };
    draw();
    const id = setInterval(draw, 220);
    return () => clearInterval(id);
  }, [tex]);
  return tex;
}

function Laptop({ active, siteIdx, onSelect, onHover }: { active: Props["active"]; siteIdx: number; onSelect: Props["onSelect"]; onHover: Props["onHover"] }) {
  const texA = useScreenTexture(SITES[0]);
  const texB = useScreenTexture(SITES[1]);
  const texC = useScreenTexture(SITES[2]);
  const textures = [texA, texB, texC];
  const keyboard = useKeyboardTexture();
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 5);
    mats.current.forEach((m, i) => {
      if (m) m.opacity += ((siteIdx === i ? 1 : 0) - m.opacity) * k;
    });
  });
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return; // was an orbit drag, not a click
    onSelect("laptop");
  };
  return (
    <group position={[-1.5, 0, 0.15]} rotation={[0, 0.3, 0]}>
      <group
        onClick={click}
        onPointerOver={(e) => { e.stopPropagation(); onHover("laptop"); }}
        onPointerOut={() => onHover(null)}
      >
        {/* base + RGB keyboard + trackpad */}
        <RoundedBox args={[3.3, 0.16, 2.2]} radius={0.05} material={MAT.chassis} position={[0, 0.08, 0]} castShadow receiveShadow />
        <mesh position={[0, 0.165, -0.42]}>
          <boxGeometry args={[2.95, 0.012, 1.05]} />
          <meshBasicMaterial map={keyboard} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.162, 0.62]}>
          <boxGeometry args={[1.15, 0.012, 0.62]} />
          <meshStandardMaterial color="#141816" roughness={0.35} metalness={0.4} />
        </mesh>
        {/* screen, open like an Omen */}
        <group position={[0, 0.14, -1.08]} rotation={[-0.24, 0, 0]}>
          <RoundedBox args={[3.3, 2.15, 0.09]} radius={0.04} material={MAT.dark} position={[0, 1.05, 0]} castShadow />
          {textures.map(
            (tex, i) =>
              tex && (
                <mesh key={SITES[i].title} position={[0, 1.05, 0.052 + i * 0.002]}>
                  <planeGeometry args={[3.08, 1.93]} />
                  <meshBasicMaterial
                    ref={(m) => {
                      mats.current[i] = m;
                    }}
                    map={tex}
                    transparent
                    toneMapped={false}
                  />
                </mesh>
              ),
          )}
          <pointLight position={[0, 1.05, 0.65]} intensity={2.2} distance={3.4} color="#bfffdc" />
        </group>
      </group>
      {active === "laptop" && <Label pos={[0, 2.7, 0]}>HP OMEN 16 · CLICK TO MAXIMIZE</Label>}
    </group>
  );
}

/* ---------------------------------- Phone ---------------------------------- */

function useGlyphTexture() {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    // faint transparent-back panel tint
    ctx.fillStyle = "rgba(205,225,212,0.13)";
    ctx.beginPath();
    ctx.roundRect(6, 6, 500, 1012, 46);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    // C-ring around the dual cameras (top centre) — Nothing's signature
    ctx.beginPath();
    ctx.arc(256, 235, 128, Math.PI * 0.72, Math.PI * 2.28);
    ctx.stroke();
    // right vertical glyph strip
    ctx.beginPath();
    ctx.moveTo(438, 190);
    ctx.lineTo(438, 800);
    ctx.stroke();
    // left short strip
    ctx.beginPath();
    ctx.moveTo(74, 420);
    ctx.lineTo(74, 640);
    ctx.stroke();
    // exclamation strip (bottom centre)
    ctx.beginPath();
    ctx.moveTo(256, 620);
    ctx.lineTo(256, 790);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(256, 852, 13, 0, Math.PI * 2);
    ctx.fill();
    // diagonal accent, bottom-left
    ctx.beginPath();
    ctx.moveTo(96, 900);
    ctx.lineTo(196, 806);
    ctx.stroke();
    // corner screws
    ctx.fillStyle = "rgba(160,175,165,0.8)";
    [[36, 36], [476, 36], [36, 988], [476, 988]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI * 2);
      ctx.fill();
    });
    const t = new THREE.CanvasTexture(canvas);
    t.anisotropy = 4;
    setTex(t);
    return () => t.dispose();
  }, []);
  return tex;
}

function Phone({ active, flipped, onSelect, onHover }: { active: Props["active"]; flipped: boolean; onSelect: Props["onSelect"]; onHover: Props["onHover"] }) {
  const screen = useTexture("/screens/agripulse-portrait.jpg");
  const glyphTex = useGlyphTexture();
  const flipGroup = useRef<THREE.Group>(null);
  const glyphMat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((state, dt) => {
    if (flipGroup.current) {
      const target = flipped ? Math.PI : 0;
      flipGroup.current.rotation.y = THREE.MathUtils.damp(flipGroup.current.rotation.y, target, 5, dt);
    }
    if (glyphMat.current) {
      glyphMat.current.emissiveIntensity = 1.15 + Math.sin(state.clock.elapsedTime * 2.4) * 0.45;
    }
  });
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    onSelect("phone");
  };
  return (
    <group position={[1.55, 0, 0.72]} rotation={[0, -0.42, 0]}>
      <group
        onClick={click}
        onPointerOver={(e) => { e.stopPropagation(); onHover("phone"); }}
        onPointerOut={() => onHover(null)}
      >
        <group ref={flipGroup} position={[0, 1.04, 0]}>
          <RoundedBox args={[0.98, 2.08, 0.11]} radius={0.09} material={MAT.chassis} castShadow />
          {/* front: AgriPulse */}
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[0.88, 1.94]} />
            <meshBasicMaterial map={screen} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.9, 0.062]}>
            <circleGeometry args={[0.035, 20]} />
            <meshBasicMaterial color="#050505" />
          </mesh>
          {/* back: transparent Glyph face */}
          <group position={[0, 0, -0.058]} rotation={[0, Math.PI, 0]}>
            {glyphTex && (
              <mesh>
                <planeGeometry args={[0.92, 1.98]} />
                <meshStandardMaterial
                  ref={glyphMat}
                  map={glyphTex}
                  transparent
                  color="#39423c"
                  emissive="#ffffff"
                  emissiveMap={glyphTex}
                  emissiveIntensity={1.6}
                  roughness={0.25}
                  metalness={0.1}
                  depthWrite={false}
                />
              </mesh>
            )}
            {/* dual cameras, centre column like a real Nothing Phone */}
            {[0.74, 0.5].map((y) => (
              <group key={y} position={[0, y, -0.014]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.105, 0.105, 0.035, 28]} />
                  <meshStandardMaterial color="#141816" roughness={0.2} metalness={0.7} />
                </mesh>
                <mesh position={[0, 0, -0.02]}>
                  <circleGeometry args={[0.055, 24]} />
                  <meshStandardMaterial color="#0a1420" roughness={0.1} metalness={0.4} emissive="#1d3a55" emissiveIntensity={0.7} />
                </mesh>
              </group>
            ))}
            {/* red recording dot */}
            <mesh position={[0.3, 0.88, -0.012]}>
              <circleGeometry args={[0.026, 16]} />
              <meshBasicMaterial color="#ff2d2d" />
            </mesh>
          </group>
        </group>
      </group>
      {active === "phone" && <Label pos={[0, 2.42, 0]}>NOTHING PHONE · AGRIPULSE · CLICK TO MAXIMIZE</Label>}
    </group>
  );
}

/* --------------------------------- Earbuds --------------------------------- */

function Earbuds({ active, caseOpen, onSelect, onHover }: { active: Props["active"]; caseOpen: boolean; onSelect: Props["onSelect"]; onHover: Props["onHover"] }) {
  const lid = useRef<THREE.Group>(null);
  const buds = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((_, dt) => {
    if (lid.current) lid.current.rotation.x = THREE.MathUtils.damp(lid.current.rotation.x, caseOpen ? -1.95 : 0, 6, dt);
    if (buds.current) buds.current.position.y = THREE.MathUtils.damp(buds.current.position.y, caseOpen ? 0.52 : 0.4, 6, dt);
    if (led.current) led.current.color.set(caseOpen ? "#63f2a6" : "#ffb03c");
  });
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    onSelect("earbuds");
  };
  const bud = (x: number, flip: number) => (
    <group key={x} position={[x, 0, 0.03]} rotation={[0.15, 0, flip * 0.22]}>
      {/* head */}
      <mesh material={MAT.white} castShadow scale={[1, 0.88, 1]}>
        <sphereGeometry args={[0.098, 22, 18]} />
      </mesh>
      {/* ear tip */}
      <mesh position={[flip * -0.07, 0.045, -0.05]} rotation={[0, 0, flip * 0.9]}>
        <coneGeometry args={[0.045, 0.09, 14]} />
        <meshStandardMaterial color="#c9cfc9" roughness={0.7} />
      </mesh>
      {/* stem + silver ring */}
      <mesh material={MAT.white} position={[flip * 0.035, -0.13, 0]}>
        <cylinderGeometry args={[0.03, 0.036, 0.22, 12]} />
      </mesh>
      <mesh position={[flip * 0.035, -0.045, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.037, 0.008, 8, 20]} />
        <meshStandardMaterial color="#9aa79e" roughness={0.25} metalness={0.9} />
      </mesh>
    </group>
  );
  return (
    <group position={[-3.45, 0, 1.1]} rotation={[0, 0.6, 0]}>
      <group
        onClick={click}
        onPointerOver={(e) => { e.stopPropagation(); onHover("earbuds"); }}
        onPointerOut={() => onHover(null)}
      >
        {/* case body + inner tray */}
        <RoundedBox args={[0.74, 0.4, 0.74]} radius={0.1} material={MAT.white} position={[0, 0.2, 0]} castShadow receiveShadow />
        <mesh position={[0, 0.41, 0]}>
          <boxGeometry args={[0.6, 0.03, 0.6]} />
          <meshStandardMaterial color="#222822" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.415, 0]}>
          <boxGeometry args={[0.58, 0.012, 0.58]} />
          <meshStandardMaterial color="#232a25" roughness={0.55} />
        </mesh>
        {/* buds rise out when open */}
        <group ref={buds} position={[0, 0.4, 0]}>
          {bud(-0.17, 1)}
          {bud(0.17, -1)}
        </group>
        {/* hinged lid */}
        <group ref={lid} position={[0, 0.42, -0.35]}>
          <RoundedBox args={[0.74, 0.36, 0.06]} radius={0.05} material={MAT.white} position={[0, 0.18, 0.02]} castShadow />
        </group>
        {/* status LED + USB-C slot */}
        <mesh position={[0, 0.2, 0.372]}>
          <circleGeometry args={[0.022, 14]} />
          <meshBasicMaterial ref={led} color="#ffb03c" />
        </mesh>
        <mesh position={[0, 0.05, 0.371]}>
          <boxGeometry args={[0.14, 0.03, 0.005]} />
          <meshStandardMaterial color="#151813" roughness={0.5} />
        </mesh>
        <pointLight position={[0, 0.55, 0.1]} intensity={caseOpen ? 0.8 : 0.12} distance={1.2} color="#9ff5c8" />
      </group>
      {active === "earbuds" && <Label pos={[0, 1.05, 0]}>EARBUDS · CLICK THE CASE</Label>}
    </group>
  );
}

/* --------------------------------- Printer --------------------------------- */

function Printer({ active, printing, onSelect, onHover }: { active: Props["active"]; printing: boolean; onSelect: Props["onSelect"]; onHover: Props["onHover"] }) {
  const nozzle = useRef<THREE.Group>(null);
  const gearSpin = useRef<THREE.Group>(null);
  const gearGrow = useRef<THREE.Group>(null);
  const screw = useRef<THREE.Mesh>(null);
  const progress = useRef(0.25);
  const bedTex = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#111613";
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(99,242,166,0.28)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
    }
    const t = new THREE.CanvasTexture(canvas);
    return t;
  }, []);
  const tube = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.02, 1.78, -0.5),
      new THREE.Vector3(0.85, 2.02, -0.25),
      new THREE.Vector3(0.45, 1.98, 0),
      new THREE.Vector3(0.12, 1.86, 0),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.02, 8);
  }, []);
  useFrame((state, dt) => {
    if (printing) progress.current = (progress.current + dt / 46) % 1;
    const p = progress.current;
    if (nozzle.current) {
      nozzle.current.position.x = Math.sin(state.clock.elapsedTime * (printing ? 2.2 : 0.3)) * 0.55;
      nozzle.current.position.y = 1.66 - p * 0.92;
    }
    if (gearGrow.current) {
      const h = 0.05 + p * 0.4;
      gearGrow.current.scale.y = h;
      gearGrow.current.position.y = 0.15;
    }
    if (gearSpin.current) gearSpin.current.rotation.y += dt * (printing ? 0.25 : 0.03);
    if (screw.current) screw.current.rotation.y += dt * (printing ? 2.4 : 0.2);
  });
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return;
    onSelect("printer");
  };
  const beam = (pos: [number, number, number], args: [number, number, number], key?: string) => (
    <mesh key={key || pos.join()} position={pos} material={MAT.beam} castShadow>
      <boxGeometry args={args} />
    </mesh>
  );
  const teeth = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
  return (
    <group position={[2.95, 0, -0.7]} rotation={[0, -0.32, 0]} scale={1.22}>
      <group
        onClick={click}
        onPointerOver={(e) => { e.stopPropagation(); onHover("printer"); }}
        onPointerOut={() => onHover(null)}
      >
        {/* frame */}
        {beam([-0.8, 1.0, -0.65], [0.09, 2.0, 0.09])}
        {beam([0.8, 1.0, -0.65], [0.09, 2.0, 0.09])}
        {beam([-0.8, 1.0, 0.65], [0.09, 2.0, 0.09])}
        {beam([0.8, 1.0, 0.65], [0.09, 2.0, 0.09])}
        {beam([0, 2.02, -0.65], [1.7, 0.09, 0.09])}
        {beam([0, 2.02, 0.65], [1.7, 0.09, 0.09])}
        {beam([0, 2.02, 0], [1.7, 0.09, 1.4], "topX")}
        {beam([0, 0.1, -0.65], [1.7, 0.09, 0.09], "botB")}
        {/* Z lead screw */}
        <mesh ref={screw} position={[0, 1.05, -0.65]}>
          <cylinderGeometry args={[0.028, 0.028, 1.85, 10]} />
          <meshStandardMaterial color="#8b9a8f" roughness={0.3} metalness={0.9} />
        </mesh>
        {/* bed with grid + printed gear (generic part; mechanical = EXPLORING) */}
        <mesh position={[0, 0.07, 0]} material={MAT.dark} receiveShadow>
          <boxGeometry args={[1.7, 0.14, 1.45]} />
        </mesh>
        <mesh position={[0, 0.145, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 1.35]} />
          <meshBasicMaterial map={bedTex} toneMapped={false} />
        </mesh>
        <group ref={gearSpin} position={[0, 0, 0]}>
          <group ref={gearGrow} position={[0, 0.15, 0]}>
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 1, 22]} />
              <meshStandardMaterial color="#5f7a66" roughness={0.45} metalness={0.35} emissive="#63f2a6" emissiveIntensity={0.14} />
            </mesh>
            {teeth.map((a) => (
              <mesh key={a} position={[Math.cos(a) * 0.33, 0.5, Math.sin(a) * 0.33]} rotation={[0, -a, 0]}>
                <boxGeometry args={[0.1, 1, 0.13]} />
                <meshStandardMaterial color="#5f7a66" roughness={0.45} metalness={0.35} emissive="#63f2a6" emissiveIntensity={0.14} />
              </mesh>
            ))}
          </group>
        </group>
        {/* gantry + extruder */}
        <group ref={nozzle} position={[0, 1.62, 0]}>
          <mesh material={MAT.beam} castShadow>
            <boxGeometry args={[1.7, 0.09, 0.09]} />
          </mesh>
          <mesh position={[0, -0.13, 0]}>
            <boxGeometry args={[0.24, 0.2, 0.24]} />
            <meshStandardMaterial color="#39423c" roughness={0.35} metalness={0.6} />
          </mesh>
          <mesh position={[0.17, -0.13, 0]}>
            <boxGeometry args={[0.08, 0.16, 0.2]} />
            <meshStandardMaterial color="#20261f" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.3, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.05, 0.12, 14]} />
            <meshStandardMaterial color="#c8b18a" roughness={0.3} metalness={0.8} emissive="#ff9d3c" emissiveIntensity={printing ? 1.4 : 0.2} />
          </mesh>
          <pointLight position={[0, -0.35, 0.25]} intensity={printing ? 1.4 : 0.3} distance={2.4} color="#ffb066" />
        </group>
        {/* filament: spool + Bowden tube */}
        <group position={[1.02, 1.62, -0.5]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.23, 0.085, 10, 28]} />
            <meshStandardMaterial color="#2e9d6b" roughness={0.5} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 10]} />
            <meshStandardMaterial color="#39423c" metalness={0.7} roughness={0.35} />
          </mesh>
        </group>
        <mesh geometry={tube}>
          <meshStandardMaterial color="#cfd8d2" roughness={0.4} transparent opacity={0.65} />
        </mesh>
        {/* controller screen + knob */}
        <group position={[0.8, 0.52, 0.72]} rotation={[-0.15, 0, 0]}>
          <mesh material={MAT.beam}>
            <boxGeometry args={[0.4, 0.34, 0.07]} />
          </mesh>
          <mesh position={[0, 0.03, 0.04]}>
            <planeGeometry args={[0.3, 0.19]} />
            <meshBasicMaterial color={printing ? "#57e6ff" : "#274b55"} toneMapped={false} />
          </mesh>
          <mesh position={[0.1, -0.12, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.04, 16]} />
            <meshStandardMaterial color="#121613" roughness={0.4} />
          </mesh>
        </group>
      </group>
      {active === "printer" && <Label pos={[0, 2.55, 0]}>3D PRINTER · CLICK TO PAUSE</Label>}
    </group>
  );
}

/* ------------------------------- Workbench --------------------------------- */

function Workbench() {
  const strip = useRef<THREE.MeshStandardMaterial>(null);
  const backStrip = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const hue = (t * 0.03) % 1;
    if (strip.current) strip.current.emissive.setHSL(hue, 0.85, 0.55);
    if (backStrip.current) backStrip.current.emissive.setHSL((hue + 0.5) % 1, 0.7, 0.4);
    if (glow.current) {
      glow.current.color.setHSL(hue, 0.85, 0.6);
      glow.current.intensity = 5 + Math.sin(t * 1.4) * 1.2;
    }
  });
  return (
    <group>
      {/* desk slab + legs */}
      <mesh position={[0, -0.1, 0]} material={MAT.desk} receiveShadow>
        <boxGeometry args={[8.4, 0.2, 3.6]} />
      </mesh>
      <mesh position={[-3.9, -0.85, 0]} material={MAT.dark}>
        <boxGeometry args={[0.18, 1.3, 3.2]} />
      </mesh>
      <mesh position={[3.9, -0.85, 0]} material={MAT.dark}>
        <boxGeometry args={[0.18, 1.3, 3.2]} />
      </mesh>
      {/* desk mat */}
      <mesh position={[-0.4, 0.006, 0.25]} receiveShadow>
        <boxGeometry args={[6.4, 0.012, 2.5]} />
        <meshStandardMaterial color="#0a0d0b" roughness={0.95} />
      </mesh>
      {/* RGB strip, front edge — the sick part */}
      <mesh position={[0, -0.06, 1.83]}>
        <boxGeometry args={[8.4, 0.045, 0.045]} />
        <meshStandardMaterial ref={strip} color="#000000" emissive="#63f2a6" emissiveIntensity={2.4} />
      </mesh>
      <pointLight ref={glow} position={[0, -0.5, 2.1]} intensity={5} distance={7} color="#63f2a6" />
      {/* back wall + LED line */}
      <mesh position={[0, 2.2, -2.4]}>
        <planeGeometry args={[14, 7]} />
        <meshStandardMaterial color="#070807" roughness={1} />
      </mesh>
      <mesh position={[0, 3.1, -2.38]}>
        <boxGeometry args={[9, 0.04, 0.04]} />
        <meshStandardMaterial ref={backStrip} color="#000" emissive="#56ccf2" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

/* ---------------------------------- Scene ---------------------------------- */

function Scene(props: Props) {
  const rig = useRef<THREE.Group>(null);
  useFrame((state, dt) => {
    if (!rig.current) return;
    const { x, y } = state.pointer;
    rig.current.rotation.y = THREE.MathUtils.damp(rig.current.rotation.y, x * 0.05, 2.5, dt);
    rig.current.rotation.x = THREE.MathUtils.damp(rig.current.rotation.x, -y * 0.02, 2.5, dt);
  });
  return (
    <>
      <ambientLight intensity={0.85} />
      <hemisphereLight args={["#cfeee0", "#0a0c0b", 0.5]} />
      <directionalLight position={[4, 7, 5]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-4, 2.5, 3]} intensity={6} distance={10} color="#63f2a6" />
      <pointLight position={[4.5, 2, 2.5]} intensity={5} distance={10} color="#56ccf2" />
      <group ref={rig}>
        <Workbench />
        <Laptop active={props.active} siteIdx={props.siteIdx} onSelect={props.onSelect} onHover={props.onHover} />
        <Phone active={props.active} flipped={props.flipped} onSelect={props.onSelect} onHover={props.onHover} />
        <Earbuds active={props.active} caseOpen={props.caseOpen} onSelect={props.onSelect} onHover={props.onHover} />
        <Printer active={props.active} printing={props.printing} onSelect={props.onSelect} onHover={props.onHover} />
      </group>
      <ContactShadows position={[0, -1.48, 0]} opacity={0.55} scale={16} blur={2.6} far={4} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0.95}
        maxPolarAngle={1.48}
        minAzimuthAngle={-0.75}
        maxAzimuthAngle={0.75}
        target={[0, 0.7, 0]}
      />
    </>
  );
}

export default function DeskScene(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 2.1, 6.9], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <Suspense fallback={null}>
        <Scene {...props} />
      </Suspense>
    </Canvas>
  );
}
