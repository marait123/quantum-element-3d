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
  if (!material || material.userData.softSprites) return;
  material.userData.softSprites = true;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'varying float vSpriteFade;\nvoid main() {')
      .replace(
        '#include <logdepthbuf_vertex>',
        `vSpriteFade = clamp(gl_PointSize / ${MIN_POINT_PX.toFixed(1)}, 0.0, 1.0);
  vSpriteFade *= vSpriteFade; // light spread over a larger area
  gl_PointSize = max(gl_PointSize, ${MIN_POINT_PX.toFixed(1)});
  #include <logdepthbuf_vertex>`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'varying float vSpriteFade;\nvoid main() {')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.a *= vSpriteFade;');
  };
  material.customProgramCacheKey = () => 'soft-point-sprites';
  material.needsUpdate = true;
}
