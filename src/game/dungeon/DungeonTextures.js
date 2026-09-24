import * as THREE from 'three';

// Cache generated textures so they are created once and reused
const textureCache = new Map();

// Safe round rect helper that works on any browser without crashing
function safeRoundRect(ctx, x, y, w, h, r = 4) {
  const width = Math.max(1, w);
  const height = Math.max(1, h);
  if (typeof ctx.roundRect === 'function') {
    try {
      ctx.roundRect(x, y, width, height, r);
      return;
    } catch (e) {}
  }
  ctx.rect(x, y, width, height);
}

// Helper: Perlin/Value noise generator for canvas
function generateNoise(ctx, width, height, opacity = 0.15) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const noise = (Math.random() - 0.5) * 255 * opacity;
        data[idx] = Math.min(255, Math.max(0, data[idx] + noise));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + noise));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + noise));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // If getImageData fails in restricted environment, ignore noise
  }
}

// 1. ANCIENT DUNGEON FLAGSTONE FLOOR (Albedo, Bump, Roughness)
export function getFlagstoneMaterials() {
  if (textureCache.has('flagstone')) return textureCache.get('flagstone');

  try {
    const width = 1024;
    const height = 1024;

    // --- ALBEDO MAP ---
    const albedoCanvas = document.createElement('canvas');
    albedoCanvas.width = width;
    albedoCanvas.height = height;
    const ctxA = albedoCanvas.getContext('2d');

    // Base dark stone tone
    ctxA.fillStyle = '#1c1b22';
    ctxA.fillRect(0, 0, width, height);

    // Draw irregular flagstone blocks
    const rows = 8;
    const cols = 8;
    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
      const rowOffset = (r % 2) * (cellW * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * cellW + rowOffset + (Math.random() - 0.5) * 8;
        const y = r * cellH + (Math.random() - 0.5) * 8;
        const w = cellW - 6 + (Math.random() - 0.5) * 4;
        const h = cellH - 6 + (Math.random() - 0.5) * 4;

        // Stone block base color variations (slate, brownish-grey, charcoal)
        const tone = Math.floor(32 + Math.random() * 26);
        const rTone = tone + Math.floor(Math.random() * 8);
        const gTone = tone + Math.floor(Math.random() * 6);
        const bTone = tone + 4 + Math.floor(Math.random() * 12);
        ctxA.fillStyle = `rgb(${rTone}, ${gTone}, ${bTone})`;

        ctxA.beginPath();
        safeRoundRect(ctxA, x, y, w, h, 4);
        ctxA.fill();

        // Subtle surface cracks
        ctxA.strokeStyle = 'rgba(10, 8, 14, 0.45)';
        ctxA.lineWidth = 1.5;
        if (Math.random() < 0.6) {
          ctxA.beginPath();
          const startX = x + Math.random() * Math.max(1, w);
          const startY = y + Math.random() * Math.max(1, h);
          ctxA.moveTo(startX, startY);
          ctxA.lineTo(startX + (Math.random() - 0.5) * 35, startY + (Math.random() - 0.5) * 35);
          ctxA.stroke();
        }

        // Moss / dirt patches in corners
        if (Math.random() < 0.35) {
          ctxA.fillStyle = 'rgba(28, 42, 28, 0.3)';
          ctxA.beginPath();
          ctxA.arc(x + Math.random() * Math.max(1, w), y + Math.random() * Math.max(1, h), 14 + Math.random() * 20, 0, Math.PI * 2);
          ctxA.fill();
        }
      }
    }

    generateNoise(ctxA, width, height, 0.12);

    // --- BUMP / NORMAL MAP ---
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = width;
    bumpCanvas.height = height;
    const ctxB = bumpCanvas.getContext('2d');

    ctxB.fillStyle = '#101010';
    ctxB.fillRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      const rowOffset = (r % 2) * (cellW * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * cellW + rowOffset;
        const y = r * cellH;
        const w = cellW - 6;
        const h = cellH - 6;

        const grad = ctxB.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, Math.max(1, w * 0.6));
        grad.addColorStop(0, '#f0f0f0');
        grad.addColorStop(0.8, '#a0a0a0');
        grad.addColorStop(1, '#303030');

        ctxB.fillStyle = grad;
        ctxB.beginPath();
        safeRoundRect(ctxB, x, y, w, h, 6);
        ctxB.fill();
      }
    }
    generateNoise(ctxB, width, height, 0.25);

    // --- ROUGHNESS MAP ---
    const roughCanvas = document.createElement('canvas');
    roughCanvas.width = width;
    roughCanvas.height = height;
    const ctxR = roughCanvas.getContext('2d');
    ctxR.fillStyle = '#b0b0b0';
    ctxR.fillRect(0, 0, width, height);
    for (let i = 0; i < 6; i++) {
      const px = Math.random() * width;
      const py = Math.random() * height;
      const pGrad = ctxR.createRadialGradient(px, py, 10, px, py, 90);
      pGrad.addColorStop(0, '#252525');
      pGrad.addColorStop(0.6, '#555555');
      pGrad.addColorStop(1, '#b0b0b0');
      ctxR.fillStyle = pGrad;
      ctxR.beginPath();
      ctxR.arc(px, py, 90, 0, Math.PI * 2);
      ctxR.fill();
    }
    generateNoise(ctxR, width, height, 0.08);

    const albedoMap = new THREE.CanvasTexture(albedoCanvas);
    albedoMap.wrapS = THREE.RepeatWrapping;
    albedoMap.wrapT = THREE.RepeatWrapping;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;

    const roughnessMap = new THREE.CanvasTexture(roughCanvas);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;

    const textures = { albedoMap, bumpMap, roughnessMap };
    textureCache.set('flagstone', textures);
    return textures;
  } catch (err) {
    console.warn('Canvas texture fallback for flagstone:', err);
    return { albedoMap: null, bumpMap: null, roughnessMap: null };
  }
}

// 2. WEATHERED DUNGEON WALL MASONRY
export function getWallMaterials() {
  if (textureCache.has('wall')) return textureCache.get('wall');

  try {
    const width = 1024;
    const height = 1024;

    const albedoCanvas = document.createElement('canvas');
    albedoCanvas.width = width;
    albedoCanvas.height = height;
    const ctxA = albedoCanvas.getContext('2d');

    ctxA.fillStyle = '#18171f';
    ctxA.fillRect(0, 0, width, height);

    const rows = 12;
    const cols = 6;
    const cellW = width / cols;
    const cellH = height / rows;

    for (let r = 0; r < rows; r++) {
      const rowOffset = (r % 2) * (cellW * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * cellW + rowOffset;
        const y = r * cellH;
        const w = cellW - 4;
        const h = cellH - 4;

        const baseVal = Math.floor(28 + Math.random() * 24);
        ctxA.fillStyle = `rgb(${baseVal}, ${baseVal - 2}, ${baseVal + 4})`;
        ctxA.beginPath();
        safeRoundRect(ctxA, x, y, w, h, 3);
        ctxA.fill();

        if (Math.random() < 0.4) {
          ctxA.fillStyle = 'rgba(8, 7, 12, 0.4)';
          ctxA.fillRect(x + Math.random() * w * 0.7, y, 6 + Math.random() * 8, h);
        }
      }
    }
    generateNoise(ctxA, width, height, 0.14);

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = width;
    bumpCanvas.height = height;
    const ctxB = bumpCanvas.getContext('2d');
    ctxB.fillStyle = '#151515';
    ctxB.fillRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      const rowOffset = (r % 2) * (cellW * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * cellW + rowOffset;
        const y = r * cellH;
        const w = cellW - 4;
        const h = cellH - 4;
        ctxB.fillStyle = '#c5c5c5';
        ctxB.beginPath();
        safeRoundRect(ctxB, x, y, w, h, 2);
        ctxB.fill();
      }
    }
    generateNoise(ctxB, width, height, 0.28);

    const albedoMap = new THREE.CanvasTexture(albedoCanvas);
    albedoMap.wrapS = THREE.RepeatWrapping;
    albedoMap.wrapT = THREE.RepeatWrapping;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;

    const textures = { albedoMap, bumpMap };
    textureCache.set('wall', textures);
    return textures;
  } catch (err) {
    console.warn('Canvas texture fallback for wall:', err);
    return { albedoMap: null, bumpMap: null };
  }
}

// 3. DARK AGED WOOD
export function getWoodMaterials() {
  if (textureCache.has('wood')) return textureCache.get('wood');

  try {
    const width = 512;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#2d1b11';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(20, 10, 5, 0.35)';
    ctx.lineWidth = 2;
    for (let x = 0; x < width; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x + (Math.random() - 0.5) * 4, 0);
      ctx.bezierCurveTo(
        x + (Math.random() - 0.5) * 8, height * 0.33,
        x + (Math.random() - 0.5) * 8, height * 0.66,
        x + (Math.random() - 0.5) * 4, height
      );
      ctx.stroke();
    }

    for (let i = 0; i < 3; i++) {
      const kx = Math.random() * width;
      const ky = Math.random() * height;
      ctx.fillStyle = '#160c07';
      ctx.beginPath();
      ctx.ellipse(kx, ky, 8, 14, Math.random() * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    generateNoise(ctx, width, height, 0.08);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    textureCache.set('wood', texture);
    return texture;
  } catch (err) {
    console.warn('Canvas texture fallback for wood:', err);
    return null;
  }
}

// 4. FORGED RUSTED IRON
export function getIronMaterials() {
  if (textureCache.has('iron')) return textureCache.get('iron');

  try {
    const width = 512;
    const height = 512;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#222329';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 18; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      ctx.fillStyle = 'rgba(78, 38, 20, 0.35)';
      ctx.beginPath();
      ctx.arc(rx, ry, 12 + Math.random() * 24, 0, Math.PI * 2);
      ctx.fill();
    }
    generateNoise(ctx, width, height, 0.18);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    textureCache.set('iron', texture);
    return texture;
  } catch (err) {
    console.warn('Canvas texture fallback for iron:', err);
    return null;
  }
}
