import * as THREE from 'three';

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function canvasTexture(canvas, repeat) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  return tex;
}

function grassTexture() {
  const size = 2048;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#3d5a26';
  ctx.fillRect(0, 0, size, size);
  // variazioni tonali di fondo (zone più chiare/scure)
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 80 + Math.random() * 240;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const dark = Math.random() < 0.5;
    grad.addColorStop(0, dark ? 'rgba(30, 46, 18, 0.18)' : 'rgba(96, 128, 58, 0.14)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // chiazze di terra
  for (let i = 0; i < 160; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 40 + Math.random() * 120;
    ctx.fillStyle = `rgba(90, 68, 40, ${0.08 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  // fili d'erba: strato profondo in ombra, poi strato luminoso
  for (let layer = 0; layer < 2; layer++) {
    const n = layer === 0 ? 60000 : 90000;
    for (let i = 0; i < n; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const len = 12 + Math.random() * 26;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const g = layer === 0 ? 55 + Math.random() * 55 : 90 + Math.random() * 95;
      ctx.strokeStyle = `rgba(${20 + Math.random() * 45}, ${g}, ${22 + Math.random() * 32}, ${layer === 0 ? 0.55 : 0.8})`;
      ctx.lineWidth = 1.2 + Math.random() * 1.6;
      // filo leggermente curvo (quadratica) invece che segmento dritto
      const cx = x + Math.cos(angle) * len * 0.5 + (Math.random() - 0.5) * 6;
      const cy = y + Math.sin(angle) * len * 0.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(cx, cy, x + Math.cos(angle) * len + (Math.random() - 0.5) * 8, y + Math.sin(angle) * len);
      ctx.stroke();
    }
  }
  // qualche fiorellino sparso
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() < 0.5 ? 'rgba(235, 230, 200, 0.55)' : 'rgba(220, 200, 90, 0.5)';
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  return canvasTexture(canvas, 6);
}

function garageTexture() {
  const size = 1024;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6b6b6d';
  ctx.fillRect(0, 0, size, size);
  // grana del cemento
  for (let i = 0; i < 30000; i++) {
    const v = 90 + Math.random() * 40;
    ctx.fillStyle = `rgba(${v}, ${v}, ${v + Math.random() * 6}, 0.25)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
  }
  // macchie d'olio
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 20 + Math.random() * 60;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(25, 25, 30, 0.5)');
    grad.addColorStop(1, 'rgba(25, 25, 30, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // crepe
  ctx.strokeStyle = 'rgba(40, 40, 42, 0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < 8; j++) {
      x += (Math.random() - 0.5) * 80;
      y += (Math.random() - 0.5) * 80;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // riga gialla di parcheggio
  ctx.fillStyle = 'rgba(220, 180, 30, 0.85)';
  ctx.fillRect(0, size * 0.47, size, 14);
  return canvasTexture(canvas, 3);
}

function parquetTexture() {
  const size = 1024;
  const canvas = makeCanvas(size);
  const ctx = canvas.getContext('2d');
  const plankH = size / 8;
  const plankW = size / 2;
  for (let row = 0; row < 8; row++) {
    const offset = (row % 2) * plankW * 0.5;
    for (let col = -1; col < 3; col++) {
      const x = col * plankW + offset;
      const y = row * plankH;
      const hue = 28 + Math.random() * 8;
      const light = 32 + Math.random() * 14;
      ctx.fillStyle = `hsl(${hue}, 45%, ${light}%)`;
      ctx.fillRect(x, y, plankW, plankH);
      // venature
      for (let v = 0; v < 12; v++) {
        ctx.strokeStyle = `hsla(${hue - 5}, 40%, ${light - 8 - Math.random() * 8}%, 0.4)`;
        ctx.lineWidth = 1 + Math.random();
        ctx.beginPath();
        const vy = y + Math.random() * plankH;
        ctx.moveTo(x, vy);
        ctx.bezierCurveTo(
          x + plankW * 0.3, vy + (Math.random() - 0.5) * 10,
          x + plankW * 0.6, vy + (Math.random() - 0.5) * 10,
          x + plankW, vy + (Math.random() - 0.5) * 6
        );
        ctx.stroke();
      }
      // bordi doga
      ctx.strokeStyle = 'rgba(20, 12, 6, 0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, plankW, plankH);
    }
  }
  return canvasTexture(canvas, 4);
}

export const FLOOR_PRESETS = {
  'Terra erbosa': {
    texture: grassTexture,
    roughness: 1.0,
    metalness: 0.0,
    background: 0x1c2a1a,
  },
  'Garage': {
    texture: garageTexture,
    roughness: 0.55,
    metalness: 0.1,
    background: 0x1a1a1e,
  },
  'Parquet': {
    texture: parquetTexture,
    roughness: 0.35,
    metalness: 0.0,
    background: 0x241a12,
  },
};

export function createFloor(scene) {
  const geometry = new THREE.CircleGeometry(14, 64);
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const cache = {};

  function setFloor(name) {
    const preset = FLOOR_PRESETS[name];
    if (!cache[name]) cache[name] = preset.texture();
    material.map = cache[name];
    material.roughness = preset.roughness;
    material.metalness = preset.metalness;
    material.needsUpdate = true;
    scene.background = new THREE.Color(preset.background);
    scene.fog = new THREE.Fog(preset.background, 18, 40);
  }

  return { mesh, setFloor };
}
