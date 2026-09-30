import * as THREE from 'three';

// Real surface maps (public/textures/, Solar System Scope, CC BY 4.0 — credited in the HUD). Each texture is
// created once and returned synchronously, so a material can take it on its first render: the image streams in
// afterwards without recompiling the shader. Stars other than the Sun reuse the Sun's photosphere map, tinted by
// their temperature, so no extra downloads are needed.

export type RealTextureName =
  | 'sun'
  | 'mercury'
  | 'venus_surface'
  | 'venus_atmosphere'
  | 'earth_daymap'
  | 'earth_nightmap'
  | 'earth_clouds'
  | 'moon'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'saturn_ring_alpha'
  | 'uranus'
  | 'neptune';

const FILES: Record<RealTextureName, string> = {
  sun: '2k_sun.jpg',
  mercury: '2k_mercury.jpg',
  venus_surface: '2k_venus_surface.jpg',
  venus_atmosphere: '2k_venus_atmosphere.jpg',
  earth_daymap: '2k_earth_daymap.jpg',
  earth_nightmap: '2k_earth_nightmap.jpg',
  earth_clouds: '2k_earth_clouds.jpg',
  moon: '2k_moon.jpg',
  mars: '2k_mars.jpg',
  jupiter: '2k_jupiter.jpg',
  saturn: '2k_saturn.jpg',
  saturn_ring_alpha: '2k_saturn_ring_alpha.png',
  uranus: '2k_uranus.jpg',
  neptune: '2k_neptune.jpg',
};

// Data maps (clouds as alpha, ring transparency) stay linear; colour maps are sRGB
const LINEAR = new Set<RealTextureName>(['earth_clouds', 'saturn_ring_alpha']);

const cache = new Map<RealTextureName, THREE.Texture>();
let loader: THREE.TextureLoader | null = null;

export function getRealTexture(name: RealTextureName): THREE.Texture {
  const cached = cache.get(name);
  if (cached) return cached;
  loader ??= new THREE.TextureLoader();
  const tex = loader.load(`/textures/${FILES[name]}`);
  tex.colorSpace = LINEAR.has(name) ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (name === 'sun') {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.MirroredRepeatWrapping;
  }
  cache.set(name, tex);
  return tex;
}

export const TEXTURE_CREDIT = 'Planet maps: Solar System Scope (CC BY 4.0)';
