import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import {
  AccretionDiskVertexShader,
  AccretionDiskFragmentShader,
  LensingHaloVertexShader,
  LensingHaloFragmentShader,
  RelativisticJetVertexShader,
  RelativisticJetFragmentShader,
} from './shaders/blackHoleShaders';

export interface RealisticBlackHoleProps {
  body: CelestialBody;
  shadowRadius?: number;
  innerDiskRadius?: number;
  outerDiskRadius?: number;
  colorCore?: string;
  colorMid?: string;
  colorOuter?: string;
  accretionTilt?: [number, number, number];
  spinSpeed?: number;
  dopplerStrength?: number;
  hasJet?: boolean;
  jetProps?: {
    length: number;
    radius: number;
    color: string;
    knotColor: string;
    speed: number;
    knotFrequency: number;
    bipolar?: boolean;
    tilt?: [number, number, number];
  };
  hasLensingHalo?: boolean;
  hasHotspots?: boolean; // For Sagittarius A* GRAVITY flares
  hasDonorStream?: boolean; // For Cygnus X-1 binary companion
  hasDustyTorus?: boolean; // For TON 618 quasar
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

export const RealisticBlackHole: React.FC<RealisticBlackHoleProps> = ({
  body,
  shadowRadius: propShadowRadius,
  innerDiskRadius: propInnerDiskRadius,
  outerDiskRadius: propOuterDiskRadius,
  colorCore = '#ffffff',
  colorMid = '#f97316',
  colorOuter = '#b91c1c',
  accretionTilt = [-Math.PI / 4, Math.PI / 6, 0],
  spinSpeed = 1.0,
  dopplerStrength = 1.0,
  hasJet = false,
  jetProps,
  hasLensingHalo = true,
  hasHotspots = false,
  hasDonorStream = false,
  hasDustyTorus = false,
  isSelected,
  isHighlighted = false,
  onSelect,
  language,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const diskRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const jetRef = useRef<THREE.Group>(null);
  const hotspotsRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Physical scale dimensions
  const baseSize = body.size;
  // Shadow radius (apparent event horizon shadow enlarged by lensing to ~2.6 Rs)
  const shadowRadius = propShadowRadius ?? baseSize * 0.85;
  // Inner accretion disk edge at ISCO (~ 3 Rs)
  const innerDiskRadius = propInnerDiskRadius ?? shadowRadius * 1.15;
  // Outer accretion disk edge
  const outerDiskRadius = propOuterDiskRadius ?? shadowRadius * 3.4;
  const rs = shadowRadius / 2.6;

  // Register in runtime celestial camera tracking
  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  // Create Shader Materials with useMemo
  const diskMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: AccretionDiskVertexShader,
      fragmentShader: AccretionDiskFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorCore: { value: new THREE.Color(colorCore) },
        uColorMid: { value: new THREE.Color(colorMid) },
        uColorOuter: { value: new THREE.Color(colorOuter) },
        uInnerRadius: { value: innerDiskRadius },
        uOuterRadius: { value: outerDiskRadius },
        uRs: { value: rs },
        uDopplerStrength: { value: dopplerStrength },
        uTurbulenceScale: { value: 1.0 },
        uOpacity: { value: 0.95 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });
  }, [colorCore, colorMid, colorOuter, innerDiskRadius, outerDiskRadius, rs, dopplerStrength]);

  const haloMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: LensingHaloVertexShader,
      fragmentShader: LensingHaloFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColorCore: { value: new THREE.Color(colorCore) },
        uColorMid: { value: new THREE.Color(colorMid) },
        uColorOuter: { value: new THREE.Color(colorOuter) },
        uShadowRadius: { value: shadowRadius * 0.98 },
        uHaloRadius: { value: outerDiskRadius * 0.92 },
        uDopplerStrength: { value: dopplerStrength * 0.9 },
        uOpacity: { value: 0.9 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });
  }, [colorCore, colorMid, colorOuter, shadowRadius, outerDiskRadius, dopplerStrength]);

  const jetMaterial = useMemo(() => {
    if (!hasJet || !jetProps) return null;
    return new THREE.ShaderMaterial({
      vertexShader: RelativisticJetVertexShader,
      fragmentShader: RelativisticJetFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uJetColor: { value: new THREE.Color(jetProps.color) },
        uKnotColor: { value: new THREE.Color(jetProps.knotColor) },
        uSpeed: { value: jetProps.speed || 1.2 },
        uKnotFrequency: { value: jetProps.knotFrequency || 3.0 },
        uOpacity: { value: 0.85 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [hasJet, jetProps]);

  // Hotspots for Sagittarius A* (GRAVITY flare nodes)
  const hotspotsData = useMemo(() => {
    if (!hasHotspots) return [];
    return [
      { r: innerDiskRadius * 1.35, speed: 1.8, angle: 0.2, color: '#fef08a', size: baseSize * 0.09 },
      { r: innerDiskRadius * 1.7, speed: 1.3, angle: 2.4, color: '#fed7aa', size: baseSize * 0.07 },
      { r: innerDiskRadius * 2.1, speed: 0.9, angle: 4.8, color: '#fbcfe8', size: baseSize * 0.06 },
    ];
  }, [hasHotspots, innerDiskRadius, baseSize]);

  // Cygnus X-1 Roche-lobe Mass Transfer Stream Curve
  const donorStreamCurve = useMemo(() => {
    if (!hasDonorStream) return null;
    const points: THREE.Vector3[] = [];
    const donorDistance = outerDiskRadius * 2.8;
    const startPoint = new THREE.Vector3(donorDistance, 0, 0);
    const endPoint = new THREE.Vector3(outerDiskRadius * 0.9, 0, outerDiskRadius * 0.3);
    const control1 = new THREE.Vector3(donorDistance * 0.6, outerDiskRadius * 0.3, -donorDistance * 0.2);
    const control2 = new THREE.Vector3(outerDiskRadius * 1.4, outerDiskRadius * 0.1, outerDiskRadius * 0.8);
    const curve = new THREE.CubicBezierCurve3(startPoint, control1, control2, endPoint);
    return curve;
  }, [hasDonorStream, outerDiskRadius]);

  // Animate shaders and rotation on every frame
  useFrame(({ clock }, delta) => {
    if (!rootRef.current || !rootRef.current.visible) return;
    const time = clock.getElapsedTime();

    if (diskMaterial.uniforms) {
      diskMaterial.uniforms.uTime.value = time * spinSpeed;
    }
    if (haloMaterial.uniforms) {
      haloMaterial.uniforms.uTime.value = time * spinSpeed;
    }
    if (jetMaterial && jetMaterial.uniforms) {
      jetMaterial.uniforms.uTime.value = time;
    }

    // Slowly rotate the entire accretion system in space
    if (diskRef.current) {
      diskRef.current.rotation.z += delta * 0.05 * spinSpeed;
    }

    // Orbit hotspots
    if (hotspotsRef.current) {
      hotspotsRef.current.children.forEach((child, i) => {
        const data = hotspotsData[i];
        if (data) {
          data.angle += delta * data.speed * spinSpeed;
          child.position.x = Math.cos(data.angle) * data.r;
          child.position.y = Math.sin(data.angle) * data.r;
        }
      });
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
      {/* Central Radiance Lighting */}
      <pointLight color={colorMid} intensity={isSelected ? 10.0 : 6.0} distance={outerDiskRadius * 8} />

      {/* 1. PRIMARY ACCRETION DISK (Equatorial Plane) */}
      <group rotation={accretionTilt}>
        <mesh ref={diskRef}>
          <ringGeometry args={[innerDiskRadius, outerDiskRadius, 96]} />
          <primitive object={diskMaterial} attach="material" />
        </mesh>

        {/* Orbiting Hotspot Flares (e.g. Sgr A* GRAVITY flares) */}
        {hasHotspots && (
          <group ref={hotspotsRef}>
            {hotspotsData.map((spot, idx) => (
              <mesh key={idx} position={[Math.cos(spot.angle) * spot.r, Math.sin(spot.angle) * spot.r, 0.05]}>
                <sphereGeometry args={[spot.size, 16, 16]} />
                <meshBasicMaterial color={spot.color} />
                <pointLight color={spot.color} intensity={2.0} distance={spot.size * 10} />
              </mesh>
            ))}
          </group>
        )}

        {/* Outer Clumpy Dusty Torus (for Quasars like TON 618) */}
        {hasDustyTorus && (
          <group>
            <mesh>
              <torusGeometry args={[outerDiskRadius * 1.15, outerDiskRadius * 0.22, 24, 64]} />
              <meshStandardMaterial
                color="#451a03"
                emissive="#78350f"
                emissiveIntensity={0.6}
                roughness={0.9}
                transparent
                opacity={0.65}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[outerDiskRadius * 0.95, outerDiskRadius * 1.45, 64]} />
              <meshBasicMaterial color="#7c2d12" side={THREE.DoubleSide} transparent opacity={0.35} />
            </mesh>
          </group>
        )}
      </group>

      {/* 2. GRAVITATIONAL LENSING HALO (Upper & Lower Interstellar / Kip Thorne Arcs) */}
      {hasLensingHalo && (
        <group rotation={[accretionTilt[0] + Math.PI / 2, accretionTilt[1], accretionTilt[2]]}>
          <mesh ref={haloRef}>
            <ringGeometry args={[shadowRadius * 0.98, outerDiskRadius * 0.92, 96]} />
            <primitive object={haloMaterial} attach="material" />
          </mesh>
        </group>
      )}

      {/* 3. EVENT HORIZON SHADOW (Absolute Light-Absorbing Black Sphere) */}
      {/* Placed at center: Obscures rear disk, leaving front disk and upper/lower lensed arches visible */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[shadowRadius, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* 4. RAZOR-SHARP PHOTON RING (Thin Hyper-Luminous Circular Filament at 1.5 Rs) */}
      <group rotation={accretionTilt}>
        <mesh>
          <ringGeometry args={[shadowRadius * 1.01, shadowRadius * 1.06, 96]} />
          <meshBasicMaterial
            color="#ffffff"
            side={THREE.DoubleSide}
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 5. RELATIVISTIC SYNCHROTRON PLASMA JETS (M87*, TON 618, Cygnus X-1) */}
      {hasJet && jetProps && jetMaterial && (
        <group ref={jetRef} rotation={jetProps.tilt || [accretionTilt[0] + Math.PI / 2, accretionTilt[1], 0]}>
          {/* North Collimated Jet */}
          <mesh position={[0, jetProps.length * 0.5, 0]}>
            <cylinderGeometry
              args={[jetProps.radius * 0.15, jetProps.radius, jetProps.length, 32, 1, true]}
            />
            <primitive object={jetMaterial} attach="material" />
          </mesh>
          {/* Jet Core Brightness Spine */}
          <mesh position={[0, jetProps.length * 0.5, 0]}>
            <cylinderGeometry
              args={[jetProps.radius * 0.04, jetProps.radius * 0.25, jetProps.length * 0.98, 16, 1, true]}
            />
            <meshBasicMaterial
              color="#ffffff"
              side={THREE.DoubleSide}
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* South Bipolar Jet (if enabled) */}
          {jetProps.bipolar && (
            <group rotation={[Math.PI, 0, 0]}>
              <mesh position={[0, jetProps.length * 0.5, 0]}>
                <cylinderGeometry
                  args={[jetProps.radius * 0.15, jetProps.radius, jetProps.length, 32, 1, true]}
                />
                <primitive object={jetMaterial} attach="material" />
              </mesh>
              <mesh position={[0, jetProps.length * 0.5, 0]}>
                <cylinderGeometry
                  args={[jetProps.radius * 0.04, jetProps.radius * 0.25, jetProps.length * 0.98, 16, 1, true]}
                />
                <meshBasicMaterial
                  color="#ffffff"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.8}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* 6. BINARY DONOR STAR & ACCRETION STREAM (for Cygnus X-1) */}
      {hasDonorStream && donorStreamCurve && (
        <group rotation={accretionTilt}>
          {/* Blue Supergiant Companion Star (HDE 226868) */}
          <group position={[outerDiskRadius * 2.8, 0, 0]}>
            <mesh>
              <sphereGeometry args={[shadowRadius * 1.3, 32, 32]} />
              <meshStandardMaterial
                color="#60a5fa"
                emissive="#3b82f6"
                emissiveIntensity={2.5}
                roughness={0.2}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[shadowRadius * 1.55, 20, 20]} />
              <meshBasicMaterial color="#93c5fd" transparent opacity={0.3} side={THREE.BackSide} />
            </mesh>
            <pointLight color="#60a5fa" intensity={4.0} distance={outerDiskRadius * 6} />
          </group>

          {/* Curved Mass-Transfer Gas Stream (Roche-Lobe Overflow) */}
          <mesh>
            <tubeGeometry args={[donorStreamCurve, 32, shadowRadius * 0.18, 12, false]} />
            <meshStandardMaterial
              color="#93c5fd"
              emissive="#38bdf8"
              emissiveIntensity={1.8}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>
      )}

      {/* Selection Ring (Aligned with Accretion Disk Orientation) */}
      {isSelected && (
        <group rotation={accretionTilt}>
          <mesh>
            <ringGeometry args={[outerDiskRadius * 1.04, outerDiskRadius * 1.08, 96]} />
            <meshBasicMaterial
              color="#38bdf8"
              side={THREE.DoubleSide}
              transparent
              opacity={0.65}
            />
          </mesh>
        </group>
      )}

      {/* Interactive Tag & Information Badge */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, outerDiskRadius * 0.95, 0]} center distanceFactor={outerDiskRadius * 4}>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border border-orange-500 shadow-2xl text-xs font-bold text-orange-200 whitespace-nowrap flex items-center gap-2">
            <span>🕳️</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            <span className="text-orange-400 font-mono text-[10px]">({body.mass})</span>
          </div>
        </Html>
      )}
    </group>
  );
};
