import * as THREE from 'three';

// Cache generated textures so we don't recreate them every frame
const textureCache: Record<string, THREE.CanvasTexture> = {};

/**
 * Creates a vibrant procedural card texture for an element on the periodic table
 */
export function createElementCardTexture(
  num: number,
  sym: string,
  nameEn: string,
  nameAr: string,
  mass: number,
  catColor: string,
  isHovered: boolean = false,
  isSelected: boolean = false
): THREE.CanvasTexture {
  const key = `card_${num}_${isHovered}_${isSelected}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  if (isSelected) {
    gradient.addColorStop(0, '#0f2b48');
    gradient.addColorStop(1, '#051329');
  } else if (isHovered) {
    gradient.addColorStop(0, '#162238');
    gradient.addColorStop(1, '#0b1324');
  } else {
    gradient.addColorStop(0, '#0c1527');
    gradient.addColorStop(1, '#050a14');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  // Border with category color
  ctx.strokeStyle = isSelected ? '#38bdf8' : isHovered ? '#facc15' : catColor;
  ctx.lineWidth = isSelected ? 18 : isHovered ? 14 : 8;
  ctx.strokeRect(10, 10, 492, 492);

  // Category glow accent bar at top
  ctx.fillStyle = catColor;
  ctx.fillRect(10, 10, 492, 16);

  // Atomic number (Top left)
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(num.toString(), 36, 75);

  // Atomic weight (Top right)
  ctx.fillStyle = '#64748b';
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(mass.toFixed(num > 100 ? 0 : 2), 476, 70);

  // Main Element Symbol (Center)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 150px sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = catColor;
  ctx.shadowBlur = isSelected ? 30 : 15;
  ctx.fillText(sym, 256, 265);
  ctx.shadowBlur = 0;

  // English Name
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(nameEn, 256, 350);

  // Arabic Name
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 42px "Cairo", sans-serif';
  ctx.fillText(nameAr, 256, 420);

  // Valence string info at bottom
  ctx.fillStyle = '#64748b';
  ctx.font = '28px monospace';
  ctx.fillText(`Z=${num} • A≈${Math.round(mass)}`, 256, 475);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  textureCache[key] = texture;
  return texture;
}

/**
 * Creates procedural texture for Proton (+)
 */
export function createProtonTexture(): THREE.CanvasTexture {
  const key = 'proton_texture';
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const rad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  rad.addColorStop(0, '#fecaca');
  rad.addColorStop(0.3, '#ef4444');
  rad.addColorStop(0.8, '#991b1b');
  rad.addColorStop(1, '#450a0a');

  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 130px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 12;
  ctx.fillText('+', 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache[key] = texture;
  return texture;
}

/**
 * Creates procedural texture for Neutron (0)
 */
export function createNeutronTexture(): THREE.CanvasTexture {
  const key = 'neutron_texture';
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const rad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  rad.addColorStop(0, '#e0f2fe');
  rad.addColorStop(0.3, '#38bdf8');
  rad.addColorStop(0.8, '#0369a1');
  rad.addColorStop(1, '#082f49');

  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 110px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 12;
  ctx.fillText('0', 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache[key] = texture;
  return texture;
}

/**
 * Creates procedural texture for Quark (u or d with fractional charge)
 */
export function createQuarkTexture(flavor: 'u' | 'd', color: string): THREE.CanvasTexture {
  const key = `quark_${flavor}_${color}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const rad = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  rad.addColorStop(0, '#ffffff');
  rad.addColorStop(0.4, color);
  rad.addColorStop(0.85, '#0f172a');
  rad.addColorStop(1, '#020617');

  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  // Flavor letter
  ctx.font = 'bold 88px sans-serif';
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fillText(flavor, 128, 115);

  // Fractional charge
  ctx.font = 'bold 42px monospace';
  ctx.shadowBlur = 8;
  const chargeText = flavor === 'u' ? '+2/3e' : '-1/3e';
  ctx.fillText(chargeText, 128, 185);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache[key] = texture;
  return texture;
}

/**
 * Creates radial glow texture for electron halo / photons
 */
export function createGlowTexture(color: string = '#facc15'): THREE.CanvasTexture {
  const key = `glow_${color}`;
  if (textureCache[key]) return textureCache[key];

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const rad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  rad.addColorStop(0, color);
  rad.addColorStop(0.3, color);
  rad.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  textureCache[key] = texture;
  return texture;
}
