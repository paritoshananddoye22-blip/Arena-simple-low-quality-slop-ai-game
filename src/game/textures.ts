import * as THREE from 'three';

/**
 * Procedural texture generator using HTML5 Canvas.
 * Adheres strictly to Zero External File / 404 dependencies.
 */

export function createConcreteFloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base concrete dark grey
  ctx.fillStyle = '#22262c';
  ctx.fillRect(0, 0, size, size);

  // Concrete noise and speckles
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 24;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Large floor grid slabs
  ctx.strokeStyle = '#14171c';
  ctx.lineWidth = 4;
  const gridSize = size / 4;
  for (let x = 0; x <= size; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Subtle corner bolt dots on slabs
  ctx.fillStyle = '#0f1115';
  for (let x = 0; x <= size; x += gridSize) {
    for (let y = 0; y <= size; y += gridSize) {
      ctx.beginPath();
      ctx.arc(x + 10, y + 10, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWallTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark bunker wall tone
  ctx.fillStyle = '#1c2027';
  ctx.fillRect(0, 0, size, size);

  // Subtle noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + 2));
  }
  ctx.putImageData(imgData, 0, 0);

  // Horizontal panel seams
  ctx.strokeStyle = '#0e1014';
  ctx.lineWidth = 5;
  for (let y = 0; y <= size; y += size / 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Industrial hazard / zone markings in bottom strip
  ctx.fillStyle = '#a82c2c';
  ctx.fillRect(0, size - 32, size, 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCrateTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Army olive / dark tactical wood base
  ctx.fillStyle = '#3a3e35';
  ctx.fillRect(0, 0, size, size);

  // Planks
  ctx.strokeStyle = '#272a24';
  ctx.lineWidth = 3;
  for (let y = 0; y <= size; y += size / 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Metal corner brackets and diagonal cross braces
  ctx.strokeStyle = '#1d1f1c';
  ctx.lineWidth = 14;
  ctx.strokeRect(0, 0, size, size);

  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, size);
  ctx.moveTo(size, 0);
  ctx.lineTo(0, size);
  ctx.stroke();

  // Stencil mark
  ctx.fillStyle = '#c5a059';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TACTICAL', size / 2, size / 2 - 12);
  ctx.font = '14px monospace';
  ctx.fillText('CRATE-09', size / 2, size / 2 + 16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createHazardTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d4af37'; // Dull hazard yellow
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#181a1d'; // Industrial black
  const stripeW = 32;
  for (let x = -size; x < size * 2; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW, 0);
    ctx.lineTo(x + stripeW + size, size);
    ctx.lineTo(x + size, size);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createBarrelTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Weathered red/orange industrial barrel
  ctx.fillStyle = '#8b2b2b';
  ctx.fillRect(0, 0, size, size);

  // Metal ribs
  ctx.fillStyle = '#1c1e22';
  ctx.fillRect(0, 20, size, 14);
  ctx.fillRect(0, size / 2 - 7, size, 14);
  ctx.fillRect(0, size - 34, size, 14);

  // Warning bio/flammable emblem in center
  ctx.fillStyle = '#dfa528';
  ctx.beginPath();
  ctx.moveTo(size / 2, size / 2 - 25);
  ctx.lineTo(size / 2 + 25, size / 2 + 20);
  ctx.lineTo(size / 2 - 25, size / 2 + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('!', size / 2, size / 2 + 15);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Particle radial texture for muzzle flashes & spark glows
export function createGlowTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255, 240, 200, 1)');
  grad.addColorStop(0.3, 'rgba(255, 140, 40, 0.8)');
  grad.addColorStop(0.7, 'rgba(255, 60, 20, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
