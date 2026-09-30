import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { PooledPointLight } from '@/components/universe/rendering/LightPool';
import { getCoronaTexture } from '@/components/universe/rendering/celestialMaterials';
import { RelativisticJetVertexShader, RelativisticJetFragmentShader } from '../blackhole/shaders/blackHoleShaders';
import { isLowQuality } from '@/lib/deviceQuality';

export interface RealisticPulsarProps {
  body: CelestialBody;
  spinFrequency?: number; // e.g. 30 Hz for Crab, 173 Hz for PSR J1719
  magneticTilt?: number; // radians between spin axis and magnetic dipole axis (~35°)
  beamLength?: number;
  beamRadius?: number;
  coreColor?: string;
  beamColor?: string;
  magneticFieldColor?: string;
  pwnTorusRadius?: number;
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

// Young, rotation-powered pulsars that blow a pulsar wind nebula (the Crab's X-ray torus + polar jets; its twin
// PSR B0540−69 in the LMC). Millisecond and accretion-powered X-ray pulsars have none.
const PWN_PULSARS = new Set(['crab_pulsar', 'psr_b0540_69']);

const noRaycast = () => null;

// ---------------------------------------------------------------------------------------------------------------
// Shaders (with three's log-depth chunks — the universe canvas uses a logarithmic depth buffer)
// ---------------------------------------------------------------------------------------------------------------
// Radio/gamma beam: a cone from the magnetic pole, soft across (no hard edge) and fading along its length
const BeamVertexShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
uniform float uLength;
uniform float uRadius;
varying float vAxial;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main() {
  float axial = position.y + 0.5;
  float radius = uRadius * (0.02 + 0.98 * axial);
  vec3 p = vec3(position.x * radius, axial * uLength, position.z * radius);
  vAxial = axial;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * vec3(position.x, 0.0, position.z));
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}
`;
const BeamFragmentShader = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying float vAxial;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main() {
  #include <logdepthbuf_fragment>
  float facing = abs(dot(normalize(vWorldNormal), normalize(cameraPosition - vWorldPos)));
  float across = pow(facing, 2.2);
  float core = pow(facing, 14.0);
  float along = exp(-vAxial * 2.6) * smoothstep(0.0, 0.04, vAxial) * (1.0 - smoothstep(0.7, 1.0, vAxial));
  // Coherent emission is patchy: faint striations running along the beam
  float striae = 0.8 + 0.2 * sin(vAxial * 40.0 - uTime * 6.0);
  vec3 col = mix(uColor, vec3(1.0), core * 0.7);
  float I = (across * 0.55 + core * 1.3) * along * striae * uIntensity;
  gl_FragColor = vec4(1.0 - exp(-col * I * 1.5), 1.0);
}
`;

// Pulsar wind nebula torus: a glowing, wispy ring of shocked wind (volume-like: bright through its middle)
const TorusVertexShader = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vLocal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
  #include <logdepthbuf_vertex>
}
`;
const TorusFragmentShader = /* glsl */ `
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;
uniform float uTime;
uniform float uIntensity;
varying vec3 vLocal;
varying vec3 vWorldPos;
varying vec3 vWorldNormal;
float h1(float n) { return fract(sin(n) * 43758.5453); }
float wisps(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f));
}
void main() {
  #include <logdepthbuf_fragment>
  float facing = abs(dot(normalize(vWorldNormal), normalize(cameraPosition - vWorldPos)));
  float a = atan(vLocal.y, vLocal.x);
  // Wisps moving outward/around the ring (as seen in Chandra/HST movies of the Crab)
  float w = wisps(a * 6.0 + uTime * 0.4) * 0.6 + wisps(a * 17.0 - uTime * 0.7) * 0.4;
  float I = pow(facing, 1.6) * (0.35 + 0.9 * w) * uIntensity;
  gl_FragColor = vec4(1.0 - exp(-uColor * I * 1.4), 1.0);
}
`;

export const RealisticPulsar: React.FC<RealisticPulsarProps> = ({
  body,
  spinFrequency = 8.0, // Scaled for visible 3D rendering
  magneticTilt = Math.PI / 5, // ~36° oblique rotator
  beamLength: propBeamLength,
  beamRadius: propBeamRadius,
  coreColor = '#38bdf8',
  beamColor = '#0ea5e9',
  magneticFieldColor = '#7dd3fc',
  pwnTorusRadius: propPwnTorusRadius,
  isSelected,
  isHighlighted = false,
  onSelect,
  language,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const spinAxisRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const low = useMemo(() => isLowQuality(), []);

  const coreRadius = body.size;
  const beamLength = propBeamLength ?? coreRadius * 6.5;
  const beamRadius = propBeamRadius ?? coreRadius * 0.9;
  const pwnTorusRadius = propPwnTorusRadius ?? coreRadius * 2.8;
  const hasPwn = PWN_PULSARS.has(body.id);
  // The neutron star itself is tiny; its glow is what we see
  const starRadius = coreRadius * 0.14;

  // Register in runtime celestial tracking
  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  // Dipolar magnetic field lines r = R0 sin²θ (closed loops) plus a few open field lines from the polar caps
  const fieldLines = useMemo(() => {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({
      color: magneticFieldColor,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const shells = low ? [2.2, 3.4] : [1.8, 2.8, 4.0];
    const perShell = low ? 5 : 6;
    shells.forEach((k, si) => {
      const r0 = coreRadius * k;
      for (let i = 0; i < perShell; i++) {
        const phi = (i / perShell) * Math.PI * 2 + si * 0.35;
        const pts: THREE.Vector3[] = [];
        const steps = 48;
        const th0 = Math.asin(Math.min(1, Math.sqrt(starRadius / r0)));
        for (let j = 0; j <= steps; j++) {
          const theta = th0 + (j / steps) * (Math.PI - 2 * th0);
          const r = r0 * Math.pow(Math.sin(theta), 2.0);
          pts.push(new THREE.Vector3(r * Math.sin(theta) * Math.cos(phi), r * Math.cos(theta), r * Math.sin(theta) * Math.sin(phi)));
        }
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
        line.raycast = noRaycast;
        group.add(line);
      }
    });
    // Open field lines flaring out of the polar caps (where the beams originate)
    for (let pole = -1; pole <= 1; pole += 2) {
      for (let i = 0; i < 4; i++) {
        const phi = (i / 4) * Math.PI * 2;
        const pts: THREE.Vector3[] = [];
        for (let j = 0; j <= 24; j++) {
          const s = j / 24;
          const y = pole * (starRadius + s * coreRadius * 4.5);
          const rr = starRadius * 0.4 + s * s * coreRadius * 1.6;
          pts.push(new THREE.Vector3(Math.cos(phi) * rr, y, Math.sin(phi) * rr));
        }
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
        line.raycast = noRaycast;
        group.add(line);
      }
    }
    return group;
  }, [coreRadius, starRadius, magneticFieldColor, low]);

  const beam = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, low ? 20 : 36, low ? 12 : 24, true);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, beamLength * 0.5, 0), beamLength * 0.5 + beamRadius);
    const m = new THREE.ShaderMaterial({
      vertexShader: BeamVertexShader,
      fragmentShader: BeamFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(beamColor) },
        uIntensity: { value: 1.0 },
        uTime: { value: 0 },
        uLength: { value: beamLength },
        uRadius: { value: beamRadius },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    return { g, m };
  }, [beamLength, beamRadius, beamColor, low]);

  const pwn = useMemo(() => {
    if (!hasPwn) return null;
    const torus = new THREE.ShaderMaterial({
      vertexShader: TorusVertexShader,
      fragmentShader: TorusFragmentShader,
      uniforms: { uColor: { value: new THREE.Color('#bfdbfe') }, uTime: { value: 0 }, uIntensity: { value: 0.28 } },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    // Polar jets of the wind nebula, along the spin axis
    const jetLength = pwnTorusRadius * 1.6;
    const jetRadius = pwnTorusRadius * 0.18;
    const jetGeometry = new THREE.CylinderGeometry(1, 1, 1, low ? 14 : 24, low ? 12 : 24, true);
    jetGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, jetLength * 0.5, 0), jetLength * 0.5 + jetRadius);
    const jet = new THREE.ShaderMaterial({
      vertexShader: RelativisticJetVertexShader,
      fragmentShader: RelativisticJetFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uJetColor: { value: new THREE.Color('#93c5fd') },
        uKnotColor: { value: new THREE.Color('#e0f2fe') },
        uSpeed: { value: 1.2 },
        uKnotFrequency: { value: 2.0 },
        uOpacity: { value: 0.4 },
        uLength: { value: jetLength },
        uRadius: { value: jetRadius },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    return { torus, jet, jetGeometry };
  }, [hasPwn, pwnTorusRadius, low]);

  useEffect(
    () => () => {
      beam.g.dispose();
      beam.m.dispose();
      pwn?.torus.dispose();
      pwn?.jet.dispose();
      pwn?.jetGeometry.dispose();
    },
    [beam, pwn]
  );
  useEffect(
    () => () => {
      fieldLines.traverse((o) => (o as THREE.Line).geometry?.dispose());
      ((fieldLines.children[0] as THREE.Line | undefined)?.material as THREE.Material | undefined)?.dispose();
    },
    [fieldLines]
  );

  // Frame animation
  useFrame(({ clock }, delta) => {
    if (!rootRef.current || !rootRef.current.visible) return;
    const t = clock.getElapsedTime();
    if (spinAxisRef.current) spinAxisRef.current.rotation.y += delta * spinFrequency;
    beam.m.uniforms.uTime.value = t;
    if (pwn) {
      pwn.torus.uniforms.uTime.value = t;
      pwn.jet.uniforms.uTime.value = t;
    }
  });

  return (
    <group
      ref={rootRef}
      position={body.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Intense Pulsar High-Energy Radiation Light */}
      <PooledPointLight color={coreColor} intensity={isSelected ? 8.0 : 4.5} distance={beamLength * 3} />

      {/* Picking volume (draws nothing): the star itself is tiny */}
      <mesh>
        <sphereGeometry args={[coreRadius, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
      </mesh>

      {/* Rotation axis (tilted slightly in space) */}
      <group rotation={[0.2, 0, 0]}>
        {/* Pulsar wind nebula (Crab-like): equatorial torus + inner ring, and polar jets along the spin axis */}
        {pwn && (
          <group>
            <mesh material={pwn.torus} rotation={[Math.PI / 2, 0, 0]} raycast={noRaycast}>
              <torusGeometry args={[pwnTorusRadius, pwnTorusRadius * 0.16, 16, 96]} />
            </mesh>
            <mesh material={pwn.torus} rotation={[Math.PI / 2, 0, 0]} raycast={noRaycast}>
              <torusGeometry args={[pwnTorusRadius * 0.45, pwnTorusRadius * 0.05, 8, 64]} />
            </mesh>
            <mesh geometry={pwn.jetGeometry} material={pwn.jet} raycast={noRaycast} />
            <mesh geometry={pwn.jetGeometry} material={pwn.jet} rotation={[Math.PI, 0, 0]} scale={[1, 0.6, 1]} raycast={noRaycast} />
          </group>
        )}

        <group ref={spinAxisRef}>
          {/* 1. Neutron star: a tiny, blinding-hot sphere (~10^6 K surface) with a soft glow */}
          <mesh raycast={noRaycast}>
            <sphereGeometry args={[starRadius, 24, 24]} />
            <meshBasicMaterial color="#f8fbff" />
          </mesh>
          <sprite scale={[coreRadius * 1.5, coreRadius * 1.5, 1]} raycast={noRaycast}>
            <spriteMaterial
              map={getCoronaTexture()}
              color={coreColor}
              transparent
              opacity={0.9}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>

          {/* 2. Magnetic dipole (tilted from the spin axis): field lines and the two lighthouse beams */}
          <group rotation={[0, 0, magneticTilt]}>
            <primitive object={fieldLines} />
            <mesh geometry={beam.g} material={beam.m} raycast={noRaycast} />
            <mesh geometry={beam.g} material={beam.m} rotation={[Math.PI, 0, 0]} raycast={noRaycast} />
          </group>
        </group>
      </group>

      {/* Interactive Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, coreRadius * 1.8 + 12, 0]} center distanceFactor={coreRadius * 4}>
          <div className="px-3.5 py-1.5 rounded-full bg-cyan-950/95 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl flex items-center gap-1.5">
            <span className="text-amber-400">⚡</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            <span className="text-cyan-400 font-mono text-[10px]">({body.temperature})</span>
          </div>
        </Html>
      )}
    </group>
  );
};
