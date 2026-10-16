// Archi Verse 3D layer (desktop-full mode). Lazy-loaded via dynamic import so
// mobile-lite / no-WebGL visitors never pay for it. Two scenes:
//  1) Reactor Graph in true 3D — seeded-random node cloud (Obsidian-style),
//     orbit by dragging, click a node to inspect it.
//  2) The Verse Model (Solais-style) — a stylised "builder system" whose parts
//     highlight step-by-step as the visitor scrolls the pinned section.
// Everything pauses when off-screen and is fully disposable on re-render.
import * as THREE from 'three';
import { CATS, projectCat } from './verse-home.js';

const GREEN = 0x2dff8f, CYAN = 0x38e1ff, WHITE = 0xeef7f0, GREY = 0x8fa89b;
const rand = (seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)(20261016);

function makeLabel(text, color = '#eef7f0', size = 44) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  let fs = size;
  g.font = `600 ${fs}px system-ui, sans-serif`;
  while (g.measureText(text).width > 470 && fs > 16) {
    fs -= 3;
    g.font = `600 ${fs}px system-ui, sans-serif`;
  }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 12;
  g.fillStyle = color;
  g.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  spr.scale.set(1.7, 0.42, 1);
  return spr;
}
function stars(count, spread) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (rand() - 0.5) * spread;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xbfffdc, size: 0.035, transparent: true, opacity: 0.8 }));
}
function rendererFor(canvas) {
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  return r;
}

export function initGraph3D({ box, display, onSelect }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'av-graph3d-canvas';
  canvas.setAttribute('aria-label', '3D project graph. Drag to orbit, click a node to inspect it.');
  box.append(canvas);
  let renderer;
  try {
    renderer = rendererFor(canvas);
  } catch {
    canvas.remove();
    return null;
  }
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04070a, 0.045);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
  camera.position.set(0, 0.6, 8.2);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const key = new THREE.PointLight(GREEN, 60, 30); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(CYAN, 40, 30); rim.position.set(-4, -2, 4); scene.add(rim);
  const group = new THREE.Group();
  scene.add(group, stars(420, 22));

  const nodes = new Map(); // id -> {mesh, base}
  const addNode = (id, pos, radius, color, label, labelColor) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 28, 20),
      new THREE.MeshStandardMaterial({ color: 0x0a140f, emissive: color, emissiveIntensity: 0.55, roughness: 0.35, metalness: 0.1 }),
    );
    mesh.position.copy(pos);
    mesh.userData.id = id;
    const spr = makeLabel(label, labelColor);
    spr.position.y = -(radius + 0.30);
    mesh.add(spr);
    group.add(mesh);
    nodes.set(id, { mesh, base: 0.55 });
    return mesh;
  };
  const catPos = {
    ai: new THREE.Vector3(0.3, 2.45, 0.2),
    software: new THREE.Vector3(2.7, -0.2, -0.5),
    mechanical: new THREE.Vector3(-0.5, -2.55, 0.5),
    electrical: new THREE.Vector3(-2.7, 0.5, -0.4),
  };
  addNode('core', new THREE.Vector3(0, 0, 0), 0.37, GREEN, display.profile.name?.split(' ')[0] + ' · AR' || 'AR', '#2dff8f');
  for (const c of CATS) addNode('cat:' + c.id, catPos[c.id], 0.23, c.exploring ? GREY : CYAN, c.label + (c.exploring ? ' · EXPLORING' : ''), c.exploring ? '#8fa89b' : '#dff6ff');
  const linePts = [];
  const link = (a, b) => linePts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  for (const c of CATS) link(new THREE.Vector3(), catPos[c.id]);
  for (const p of display.projects) {
    const hub = catPos[projectCat(p)];
    const pos = hub.clone().add(new THREE.Vector3((rand() - 0.5) * 2.1, (rand() - 0.5) * 2.1, (rand() - 0.5) * 2.1));
    addNode('project:' + (p.id || p.title), pos, p.flagship ? 0.21 : 0.16, GREEN, p.title, '#eef7f0');
    link(hub, pos);
  }
  const linesGeo = new THREE.BufferGeometry();
  linesGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePts), 3));
  group.add(new THREE.LineSegments(linesGeo, new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.30 })));

  const clock = new THREE.Clock();
  let raf = 0, running = true, visible = true, rotX = 0.15, rotY = 0, tRotX = 0.15, tRotY = 0, camZ = 8.2, tCamZ = 8.2, drag = null;
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const pick = (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects([...nodes.values()].map(n => n.mesh), false);
    return hits[0]?.object || null;
  };
  const onDown = (e) => { drag = { x: e.clientX, y: e.clientY, moved: false }; canvas.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
      tRotY += dx * 0.005; tRotX += dy * 0.003;
      tRotX = Math.max(-0.9, Math.min(0.9, tRotX));
      drag.x = e.clientX; drag.y = e.clientY;
    } else {
      canvas.style.cursor = pick(e) ? 'pointer' : 'grab';
    }
  };
  const onUp = (e) => {
    if (drag && !drag.moved) {
      const hit = pick(e);
      if (hit) onSelect(hit.userData.id);
    }
    drag = null;
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);

  const resize = () => {
    const w = box.clientWidth || 800, h = box.clientHeight || 540;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(box);
  const io = new IntersectionObserver(es => { visible = es.some(en => en.isIntersecting); }); io.observe(canvas);
  const loop = () => {
    if (running && visible && document.visibilityState === 'visible') {
      const t = clock.getElapsedTime();
      if (!drag) tRotY += 0.0016;
      rotX += (tRotX - rotX) * 0.06; rotY += (tRotY - rotY) * 0.06; camZ += (tCamZ - camZ) * 0.08;
      group.rotation.set(rotX, rotY, 0);
      camera.position.z = camZ;
      for (const { mesh, base } of nodes.values()) {
        const id = mesh.userData.id;
        const pulse = id === 'core' ? 1 + Math.sin(t * 2) * 0.05 : 1;
        mesh.scale.setScalar(pulse);
        mesh.material.emissiveIntensity = base + Math.sin(t * 1.4 + mesh.position.x) * 0.12;
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(loop);
  };
  loop();
  return {
    setZoom(z) { tCamZ = Math.max(4.5, Math.min(12, z)); },
    getZoom() { return tCamZ; },
    destroy() {
      running = false; cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      scene.traverse(o => { o.geometry?.dispose?.(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose?.(); m.dispose?.(); }); } });
      renderer.dispose(); canvas.remove();
    },
  };
}

export function initModel3D({ canvas, section, display }) {
  let renderer;
  try {
    renderer = rendererFor(canvas);
  } catch {
    return null;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0.4, 7);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const g1 = new THREE.PointLight(GREEN, 70, 30); g1.position.set(4, 3, 5); scene.add(g1);
  const g2 = new THREE.PointLight(CYAN, 50, 30); g2.position.set(-4, -2, 5); scene.add(g2);
  scene.add(stars(300, 20));
  const model = new THREE.Group();
  scene.add(model);

  const mat = (color, emissive, ei = 0.5) => new THREE.MeshStandardMaterial({ color: 0x0b1510, emissive, emissiveIntensity: ei, roughness: 0.4, metalness: 0.25 });
  const parts = {};
  // Core — the builder (Electrical heart)
  parts.core = new THREE.Mesh(new THREE.SphereGeometry(0.52, 36, 26), mat(GREEN, GREEN, 0.9));
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.045, 12, 64), mat(0x9fb8aa, CYAN, 0.25));
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.035, 12, 64), mat(0x9fb8aa, GREEN, 0.25));
  ring1.rotation.x = 1.1; ring2.rotation.y = 1.2;
  parts.core.add(ring1, ring2);
  model.add(parts.core);
  // AI — icosahedron mind
  parts.ai = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 0), mat(CYAN, CYAN, 0.7));
  parts.ai.position.set(1.45, 1.05, 0);
  parts.ai.add(makeLabel('AI', '#38e1ff', 52));
  model.add(parts.ai);
  // Software — terminal slab
  parts.software = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.1), mat(CYAN, CYAN, 0.35));
  parts.software.position.set(-1.5, 0.85, -0.2);
  parts.software.add(makeLabel('</>', '#38e1ff', 52));
  model.add(parts.software);
  // Mechanical — gear
  const gear = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 24), mat(0xa9c4b2, GREEN, 0.3));
  disc.rotation.x = Math.PI / 2;
  gear.add(disc);
  for (let i = 0; i < 8; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.2, 0.2), disc.material);
    const a = (i / 8) * Math.PI * 2;
    tooth.position.set(Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0);
    tooth.rotation.z = a;
    gear.add(tooth);
  }
  gear.position.set(-1.35, -0.95, 0.25);
  gear.add(makeLabel('MECH', '#eef7f0', 40));
  parts.mechanical = gear;
  model.add(gear);
  // Space / startup — rocket
  const rocket = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.62, 20), mat(0xffffff, WHITE, 0.15));
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.34, 20), mat(GREEN, GREEN, 0.5));
  nose.position.y = 0.48;
  rocket.add(body, nose);
  rocket.position.set(1.45, -0.95, 0.35);
  rocket.rotation.z = -0.5;
  rocket.add(makeLabel('SPACE', '#eef7f0', 40));
  parts.space = rocket;
  model.add(rocket);
  // Project satellites
  parts.projects = new THREE.Group();
  display.projects.forEach((p, i) => {
    const a = (i / Math.max(1, display.projects.length)) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 14), mat(GREEN, GREEN, 0.8));
    s.position.set(Math.cos(a) * 2.15, Math.sin(a) * 1.15, Math.sin(a * 2) * 0.4);
    parts.projects.add(s);
  });
  parts.projects.add(makeLabel('PROJECTS', '#2dff8f', 40));
  model.add(parts.projects);

  const stepParts = [
    ['core'],
    ['ai'],
    ['software'],
    ['mechanical', 'core'],
    ['space', 'projects'],
  ];
  const camSteps = [
    [0, 0.4, 7], [1.2, 0.9, 5.6], [-1.3, 0.8, 5.6], [-0.9, -0.7, 5.8], [1.1, -0.4, 6.2],
  ];
  const clock = new THREE.Clock();
  let raf = 0, running = true, visible = true;
  const resize = () => {
    const w = canvas.clientWidth || 800, h = canvas.clientHeight || 520;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const io = new IntersectionObserver(es => { visible = es.some(en => en.isIntersecting); }); io.observe(canvas);
  const loop = () => {
    if (running && visible && document.visibilityState === 'visible') {
      const t = clock.getElapsedTime();
      const step = Math.min(stepParts.length - 1, Math.max(0, Number(section.dataset.step || 0)));
      const active = new Set(stepParts[step]);
      model.rotation.y = t * 0.12;
      ring1.rotation.z = t * 0.4; ring2.rotation.z = -t * 0.3;
      gear.rotation.z = t * 0.5;
      parts.projects.rotation.y = -t * 0.25;
      parts.ai.rotation.y = t * 0.8; parts.ai.rotation.x = t * 0.3;
      for (const [name, obj] of Object.entries(parts)) {
        const on = active.has(name);
        const target = on ? 1.22 : 0.92;
        obj.scale.setScalar(obj.scale.x + (target - obj.scale.x) * 0.06);
        obj.traverse(o => {
          if (o.isMesh && o.material?.emissiveIntensity !== undefined) {
            const base = on ? 1.15 : 0.28;
            o.material.emissiveIntensity += (base - o.material.emissiveIntensity) * 0.06;
          }
        });
      }
      const [cx, cy, cz] = camSteps[step];
      camera.position.x += (cx - camera.position.x) * 0.045;
      camera.position.y += (cy - camera.position.y) * 0.045;
      camera.position.z += (cz - camera.position.z) * 0.045;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(loop);
  };
  loop();
  return {
    destroy() {
      running = false; cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      scene.traverse(o => { o.geometry?.dispose?.(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose?.(); m.dispose?.(); }); } });
      renderer.dispose();
    },
  };
}
