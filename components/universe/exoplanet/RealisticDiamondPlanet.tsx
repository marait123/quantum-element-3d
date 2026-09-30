import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { ExoplanetSurface, EXOPLANET_LOOKS } from './RealisticExoplanet';

export interface RealisticDiamondPlanetProps {
  body: CelestialBody;
  isMagmaWorld?: boolean; // For 55 Cancri e (molten lava-ocean day side over a carbon-rich interior)
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  /** System root whose origin is the host star (lights the planet and keeps a lava world tidally locked) */
  hostRef?: React.RefObject<THREE.Object3D>;
}

/**
 * Crystallised carbon world (PSR J1719-1438 b): the stripped core of a white dwarf, so dense that its carbon is
 * probably crystalline. A smooth sphere (gravity rounds it) with diamond's high refractive index (n = 2.42):
 * strong Fresnel sheen, fine crystalline glints and prismatic "fire", lit by the host pulsar.
 */
const DiamondVertexShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vNormalW;
varying vec3 vWorldPos;
varying vec3 vLocal;

void main() {
  vLocal = position;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
  #include <logdepthbuf_vertex>
}
`;

const DiamondFragmentShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uLightPos;
uniform float uRadius;

varying vec3 vNormalW;
varying vec3 vWorldPos;
varying vec3 vLocal;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

void main() {
  #include <logdepthbuf_fragment>
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uLightPos - vWorldPos);
  // Crystalline grains: each cell of the surface tilts its normal slightly, catching the light at its own angle
  vec3 cell = floor(vLocal / uRadius * 90.0);
  vec3 jitter = vec3(hash13(cell), hash13(cell + 17.3), hash13(cell + 41.9)) - 0.5;
  vec3 N = normalize(normalize(vNormalW) + jitter * 0.22);

  float ndl = max(dot(normalize(vNormalW), L), 0.0);
  float cosTheta = clamp(dot(N, V), 0.0, 1.0);
  float fresnel = 0.17 + 0.83 * pow(1.0 - cosTheta, 5.0); // diamond: F0 ~ 0.17

  // Chromatic dispersion ("fire"): R, G and B refract by slightly different amounts, so glints split into colour
  vec3 H = normalize(L + V);
  float sR = pow(max(dot(N, normalize(H + vec3(0.02, 0.0, 0.0))), 0.0), 180.0);
  float sG = pow(max(dot(N, H), 0.0), 180.0);
  float sB = pow(max(dot(N, normalize(H - vec3(0.02, 0.0, 0.0))), 0.0), 180.0);
  float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + hash13(cell) * 40.0);
  vec3 fire = vec3(sR, sG, sB) * 3.0 * twinkle;

  // Dark, glassy body: a transparent crystal shows mostly reflections, and there is little light to reflect
  vec3 body = uBaseColor * (0.05 + 0.55 * ndl);
  vec3 col = body + vec3(0.75, 0.85, 1.0) * fresnel * (0.12 + 0.6 * ndl) + fire * ndl;
  gl_FragColor = vec4(col, 1.0);
}
`;

const _host = new THREE.Vector3();

// 55 Cancri e's surface: dark rock with lava seas (see EXOPLANET_LOOKS)
const MAGMA_LOOK = EXOPLANET_LOOKS.cancri_55_e;

export const RealisticDiamondPlanet: React.FC<RealisticDiamondPlanetProps> = ({
  body,
  isMagmaWorld = false,
  isSelected,
  isHighlighted = false,
  onSelect,
  language,
  hostRef,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  const diamondMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DiamondVertexShader,
        fragmentShader: DiamondFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uBaseColor: { value: new THREE.Color('#9fb8cc') },
          uLightPos: { value: new THREE.Vector3() },
          uRadius: { value: body.size },
        },
      }),
    [body.size]
  );
  useEffect(() => () => diamondMaterial.dispose(), [diamondMaterial]);

  useFrame(({ clock }, delta) => {
    if (isMagmaWorld) return;
    diamondMaterial.uniforms.uTime.value = clock.getElapsedTime();
    if (hostRef?.current) diamondMaterial.uniforms.uLightPos.value.copy(hostRef.current.getWorldPosition(_host));
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.25;
  });

  return (
    <group
      ref={rootRef}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {isMagmaWorld ? (
        <ExoplanetSurface radius={body.size} look={MAGMA_LOOK} host={hostRef} hostKelvin={5196} />
      ) : (
        <mesh ref={meshRef} material={diamondMaterial}>
          <sphereGeometry args={[body.size, 64, 64]} />
        </mesh>
      )}

      {/* Selection Glow Ring */}
      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.35, body.size * 1.385, 128]} />
          <meshBasicMaterial
            color={isHighlighted ? '#fbbf24' : '#38bdf8'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.65}
          />
        </mesh>
      )}

      {/* Interactive Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 4.5, 0]} center distanceFactor={28}>
          <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-sky-300 text-xs font-bold text-white whitespace-nowrap shadow-2xl flex items-center gap-1.5">
            <span>💎</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            {isMagmaWorld && <span className="text-amber-400 text-[10px]">(Lava & Diamond)</span>}
          </div>
        </Html>
      )}
    </group>
  );
};
