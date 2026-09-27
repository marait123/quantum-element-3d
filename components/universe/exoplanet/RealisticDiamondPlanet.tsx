import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';

export interface RealisticDiamondPlanetProps {
  body: CelestialBody;
  isMagmaWorld?: boolean; // For 55 Cancri e (molten dayside lava fissures + diamond crust)
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

/**
 * GLSL Diamond Prismatic Dispersion & Caustic Shader
 * Simulates diamond's high refractive index (n = 2.42) and chromatic dispersion (fire).
 */
const DiamondVertexShader = `
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vViewDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPosition.xyz;
  vViewDir = normalize(cameraPosition - vWorldPos);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const DiamondFragmentShader = `
uniform float uTime;
uniform vec3 uBaseColor;
uniform float uDispersion;
uniform float uMagmaFactor; // 0 for pure diamond (PSR J1719), >0 for 55 Cancri e

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vViewDir;

void main() {
  // Compute faceted crystal normals via screen-space derivatives
  vec3 facetNormal = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  vec3 norm = length(facetNormal) > 0.0 ? facetNormal : vNormal;

  // Fresnel reflection factor for high-index diamond (n = 2.42)
  float cosTheta = clamp(dot(norm, vViewDir), 0.0, 1.0);
  float f0 = 0.17; // Diamond Fresnel at normal incidence
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 4.0);

  // Prismatic Chromatic Dispersion: Wavelength-dependent refraction angles
  // Red refracts less, blue refracts more
  vec3 refrR = refract(-vViewDir, norm, 1.0 / 2.407);
  vec3 refrG = refract(-vViewDir, norm, 1.0 / 2.417);
  vec3 refrB = refract(-vViewDir, norm, 1.0 / 2.435);

  // Internal caustic glints based on refraction vectors
  float glintR = pow(max(dot(refrR, vec3(0.577, 0.577, 0.577)), 0.0), 16.0);
  float glintG = pow(max(dot(refrG, vec3(0.577, 0.577, 0.577)), 0.0), 16.0);
  float glintB = pow(max(dot(refrB, vec3(0.577, 0.577, 0.577)), 0.0), 16.0);

  // Rainbow spectral fire
  vec3 dispersionColor = vec3(glintR, glintG, glintB) * uDispersion * 2.5;

  // Specular facet flash on facet normal
  vec3 halfVec = normalize(vViewDir + vec3(0.5, 0.8, 0.3));
  float spec = pow(max(dot(norm, halfVec), 0.0), 32.0) * 1.8;

  // Facet shading variation: crisp crystal reflections
  float facetLighting = max(dot(norm, vec3(0.6, 0.7, 0.4)), 0.0) * 0.5 + 0.5;

  vec3 crystalColor = uBaseColor * facetLighting * (0.5 + 0.5 * cosTheta) + dispersionColor;
  vec3 finalColor = mix(crystalColor, vec3(1.0, 1.0, 1.0), fresnel * 0.45) + vec3(spec);

  // If this is 55 Cancri e: Add molten lava ocean & fissure veins on dayside (x > 0)
  if (uMagmaFactor > 0.01) {
    float daySide = clamp(vWorldPos.x * 0.6 + 0.4, 0.0, 1.0);
    // Magma vein pattern
    float vein = sin(vWorldPos.y * 6.0 + sin(vWorldPos.z * 8.0 + uTime * 0.5)) * 0.5 + 0.5;
    vein = pow(vein, 4.0);
    vec3 lavaColor = vec3(1.0, 0.4, 0.05) * 2.2;
    vec3 basaltCrust = vec3(0.12, 0.1, 0.08);
    vec3 magmaSurface = mix(basaltCrust, lavaColor, vein);
    finalColor = mix(finalColor, magmaSurface, daySide * uMagmaFactor * 0.75);
  }

  gl_FragColor = vec4(finalColor, 0.98);
}
`;

export const RealisticDiamondPlanet: React.FC<RealisticDiamondPlanetProps> = ({
  body,
  isMagmaWorld = false,
  isSelected,
  isHighlighted = false,
  onSelect,
  language,
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

  // Diamond Shader Material
  const diamondMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: DiamondVertexShader,
      fragmentShader: DiamondFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(isMagmaWorld ? '#38bdf8' : '#7dd3fc') },
        uDispersion: { value: 1.0 },
        uMagmaFactor: { value: isMagmaWorld ? 0.95 : 0.0 },
      },
      transparent: true,
    });
  }, [isMagmaWorld]);

  // Frame animation
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    if (diamondMaterial.uniforms) {
      diamondMaterial.uniforms.uTime.value = time;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.25;
      meshRef.current.rotation.x += delta * 0.08;
    }
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
      {/* Faceted Crystallized Pure Diamond Sphere */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[body.size, 3]} />
        <primitive object={diamondMaterial} attach="material" />
      </mesh>

      {/* Subtle Refraction Glow Shell */}
      <mesh>
        <sphereGeometry args={[body.size * 1.08, 24, 24]} />
        <meshBasicMaterial
          color={isMagmaWorld ? '#38bdf8' : '#e0f2fe'}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Selection Glow Ring */}
      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.35, body.size * 1.48, 48]} />
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
