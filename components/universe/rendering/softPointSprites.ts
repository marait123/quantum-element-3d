import * as THREE from 'three';

/**
 * Stops dense star fields from sparkling ("white noise"). Stars smaller than a pixel randomly hit or miss pixel
 * centres as they move, so they blink on and off. This keeps every sprite at least MIN_POINT_PX wide and dims it
 * by the area it lost, so the light is conserved but spread smoothly.
 *
 * Use as a ref on a <pointsMaterial>: <pointsMaterial ref={softenPointSprites} … />
 */
const MIN_POINT_PX = 2.0;

export function softenPointSprites(material: THREE.PointsMaterial | null) {
  applySoftSprites(material, 0);
}

/**
 * The same, for fields of individual stars seen from inside them (galaxy interiors). A star is a point source: coming
 * closer makes it brighter, not bigger. Without a cap, perspective sizing turns nearby stars into large fuzzy discs
 * that fill the view like noise. Sprites stop growing at MAX_STAR_PX and turn brighter instead (up to 2×).
 */
const MAX_STAR_PX = 6.0;

export function starPointSprites(material: THREE.PointsMaterial | null) {
  applySoftSprites(material, MAX_STAR_PX);
}

function applySoftSprites(material: THREE.PointsMaterial | null, maxPx: number) {
  if (!material || material.userData.softSprites) return;
  material.userData.softSprites = true;
  const cap =
    maxPx > 0
      ? `vSpriteFade *= clamp(sqrt(gl_PointSize / ${maxPx.toFixed(1)}), 1.0, 2.0);
  gl_PointSize = min(gl_PointSize, ${maxPx.toFixed(1)});`
      : '';
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', `varying float vSpriteFade;
void main() {`)
      .replace(
        '#include <logdepthbuf_vertex>',
        `vSpriteFade = clamp(gl_PointSize / ${MIN_POINT_PX.toFixed(1)}, 0.0, 1.0);
  vSpriteFade *= vSpriteFade; // light spread over a larger area
  ${cap}
  gl_PointSize = max(gl_PointSize, ${MIN_POINT_PX.toFixed(1)});
  #include <logdepthbuf_vertex>`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', `varying float vSpriteFade;
void main() {`)
      .replace('#include <color_fragment>', `#include <color_fragment>
  diffuseColor.rgb *= max(vSpriteFade, 1.0);
  diffuseColor.a *= min(vSpriteFade, 1.0);`);
  };
  material.customProgramCacheKey = () => (maxPx > 0 ? `star-point-sprites-${maxPx}` : 'soft-point-sprites');
  material.needsUpdate = true;
}
