import * as THREE from 'three';

// Cache generated textures in memory so they are generated only once
const textureCache: Record<string, THREE.CanvasTexture> = {};

function getFallbackTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as HTMLCanvasElement);
  }
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  return new THREE.CanvasTexture(canvas);
}

/**
 * Procedural Circular Soft Glow Point Texture
 * Eliminates square point quads and gives stars and nodes smooth Gaussian radial glow.
 */
export function getGlowPointTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return getFallbackTexture();
  if (textureCache['glow_point']) return textureCache['glow_point'];

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache['glow_point'] = texture;
  return texture;
}

/**
 * Procedural Earth Texture Generator
 * Draws realistic continents (Africa, Europe, Asia, Americas, Antarctica),
 * deep oceans, vegetation greens, desert ochres, and polar ice caps.
 */
export function getEarthTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return getFallbackTexture();
  if (textureCache['earth']) return textureCache['earth'];

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep Ocean Base
  const oceanGradient = ctx.createLinearGradient(0, 0, 0, height);
  oceanGradient.addColorStop(0, '#0c2d48');
  oceanGradient.addColorStop(0.5, '#0f4c81');
  oceanGradient.addColorStop(1, '#0c2d48');
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Continents Layer (Procedural vector shapes)
  ctx.fillStyle = '#2e7d32'; // Forest green

  // Africa & Eurasia
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.55, width * 0.12, height * 0.22, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(width * 0.58, height * 0.32, width * 0.22, height * 0.18, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Sahara & Middle East Desert Ochre
  ctx.fillStyle = '#c29b38';
  ctx.beginPath();
  ctx.ellipse(width * 0.53, height * 0.42, width * 0.09, height * 0.1, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Americas
  ctx.fillStyle = '#2e7d32';
  // North America
  ctx.beginPath();
  ctx.ellipse(width * 0.22, height * 0.32, width * 0.14, height * 0.18, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // South America
  ctx.beginPath();
  ctx.ellipse(width * 0.28, height * 0.68, width * 0.08, height * 0.2, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.ellipse(width * 0.82, height * 0.72, width * 0.06, height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // Antarctica & North Polar Ice Caps
  ctx.fillStyle = '#f8fafc';
  // North Pole
  ctx.fillRect(0, 0, width, height * 0.08);
  // Antarctica
  ctx.fillRect(0, height * 0.92, width, height * 0.08);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache['earth'] = texture;
  return texture;
}

/**
 * Procedural Earth Cloud Texture Generator
 * Swirling cumulus cloud bands and cyclone spirals with alpha transparency.
 */
export function getEarthCloudsTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return getFallbackTexture();
  if (textureCache['earth_clouds']) return textureCache['earth_clouds'];

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Soft atmospheric cloud bands
  for (let y = 0; y < height; y += 4) {
    const lat = (y / height) * Math.PI;
    const bandIntensity = Math.sin(lat * 3) * 0.3 + Math.cos(lat * 6) * 0.2 + 0.35;
    if (bandIntensity > 0.3) {
      ctx.fillStyle = `rgba(255, 255, 255, ${bandIntensity * 0.55})`;
      for (let x = 0; x < width; x += 12) {
        const noise = Math.sin(x * 0.02 + y * 0.03) * Math.cos(x * 0.01 - y * 0.02);
        if (noise > 0) {
          ctx.beginPath();
          ctx.arc(x, y, 6 + noise * 14, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // Tropical Cyclones
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const cycloneX = [width * 0.25, width * 0.7, width * 0.45];
  const cycloneY = [height * 0.35, height * 0.4, height * 0.65];

  for (let c = 0; c < cycloneX.length; c++) {
    for (let r = 0; r < 35; r += 3) {
      const angle = r * 0.4;
      const dist = r * 0.9;
      ctx.beginPath();
      ctx.arc(cycloneX[c] + Math.cos(angle) * dist, cycloneY[c] + Math.sin(angle) * dist, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache['earth_clouds'] = texture;
  return texture;
}

/**
 * Procedural Sun Photosphere Texture Generator
 * Cellular granulated plasma noise, bright coronal flare loops.
 */
export function getSunTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return getFallbackTexture();
  if (textureCache['sun']) return textureCache['sun'];

  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Base Golden Yellow
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, width, height);

  // Granulation Cells
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = 2 + Math.random() * 5;
    const brightness = Math.random();
    ctx.fillStyle = brightness > 0.5 ? '#fef08a' : '#d97706';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sunspot Groups
  ctx.fillStyle = '#451a03';
  for (let s = 0; s < 8; s++) {
    const sx = Math.random() * width;
    const sy = height * 0.3 + Math.random() * height * 0.4;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 6 + Math.random() * 8, 3 + Math.random() * 5, Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  textureCache['sun'] = texture;
  return texture;
}

/**
 * Procedural Moon Surface Texture
 * Lunar basalt maria, impact craters, and ejecta rays.
 */
export function getMoonTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return getFallbackTexture();
  if (textureCache['moon']) return textureCache['moon'];

  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Anorthosite grey bedrock
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, width, height);

  // Basaltic Dark Maria (Sea of Tranquility, etc.)
  ctx.fillStyle = '#64748b';
  for (let m = 0; m < 12; m++) {
    const x = Math.random() * width;
    const y = height * 0.2 + Math.random() * height * 0.6;
    ctx.beginPath();
    ctx.ellipse(x, y, 25 + Math.random() * 40, 18 + Math.random() * 30, Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }

  // Impact Craters with bright rims
  for (let c = 0; c < 200; c++) {
    const cx = Math.random() * width;
    const cy = Math.random() * height;
    const cr = 2 + Math.random() * 8;
    // Crater shadow
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
    // Bright sunlit rim
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, cr + 1, -Math.PI / 4, (Math.PI * 3) / 4);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  textureCache['moon'] = texture;
  return texture;
}

/**
 * Procedural Mars Surface Texture
 * Rust iron oxide, dark basaltic albedo features, white polar caps, and Valles Marineris canyon.
 */
export function getMarsTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return getFallbackTexture();
  if (textureCache['mars']) return textureCache['mars'];

  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Red Iron Oxide Ochre
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, width, height);

  // Dark Basaltic Rock Markings (Syrtis Major)
  ctx.fillStyle = '#7f1d1d';
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * width;
    const y = height * 0.3 + Math.random() * height * 0.45;
    ctx.beginPath();
    ctx.ellipse(x, y, 20 + Math.random() * 45, 12 + Math.random() * 25, Math.random() * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Valles Marineris Canyon Scar
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width * 0.35, height * 0.55);
  ctx.bezierCurveTo(width * 0.45, height * 0.53, width * 0.55, height * 0.58, width * 0.65, height * 0.54);
  ctx.stroke();

  // White CO2 & Water Ice Polar Caps
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height * 0.07);
  ctx.fillRect(0, height * 0.93, width, height * 0.07);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  textureCache['mars'] = texture;
  return texture;
}

/**
 * Procedural Jupiter Atmosphere Texture
 * Distinct atmospheric zones & belts with shear turbulence and the Great Red Spot.
 */
export function getJupiterTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return getFallbackTexture();
  if (textureCache['jupiter']) return textureCache['jupiter'];

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Alternating Ammonia Ice Belts and Zones
  const bandColors = [
    '#92400e', // North Polar Region
    '#fde68a', // North Temperate Zone
    '#b45309', // North Equatorial Belt
    '#fef3c7', // Equatorial Zone
    '#b45309', // South Equatorial Belt
    '#fed7aa', // South Temperate Zone
    '#78350f', // South Polar Region
  ];

  const bandHeight = height / bandColors.length;
  for (let i = 0; i < bandColors.length; i++) {
    ctx.fillStyle = bandColors[i];
    ctx.fillRect(0, i * bandHeight, width, bandHeight);
  }

  // Atmospheric shear vortices along boundaries
  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 16) {
      const swirl = Math.sin(x * 0.04 + y * 0.02) * Math.cos(x * 0.02 - y * 0.03);
      if (swirl > 0.2) {
        ctx.fillStyle = 'rgba(180, 83, 9, 0.35)';
        ctx.fillRect(x, y, 12, 6);
      }
    }
  }

  // The Great Red Spot Anticyclone
  const spotX = width * 0.62;
  const spotY = height * 0.64;
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.ellipse(spotX, spotY, 48, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // White storm core in Great Red Spot
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.ellipse(spotX, spotY, 24, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  textureCache['jupiter'] = texture;
  return texture;
}

/**
 * Procedural Saturn Ring Texture
 * Concentric A, B, and C rings with the Cassini Division gap and alpha transparency.
 */
export function getSaturnRingTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') return getFallbackTexture();
  if (textureCache['saturn_ring']) return textureCache['saturn_ring'];

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.48;
  const innerR = size * 0.22;

  ctx.clearRect(0, 0, size, size);

  for (let r = innerR; r < outerR; r += 0.5) {
    const norm = (r - innerR) / (outerR - innerR);
    let alpha = 0.85;

    // Cassini Division gap around 65% radius
    if (norm > 0.62 && norm < 0.69) {
      alpha = 0.05; // Gap
    } else if (norm < 0.15) {
      alpha = 0.4; // Faint C ring
    } else {
      alpha = 0.75 + Math.sin(norm * 45) * 0.15;
    }

    ctx.strokeStyle = `rgba(254, 215, 170, ${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache['saturn_ring'] = texture;
  return texture;
}
