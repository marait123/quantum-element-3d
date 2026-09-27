import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';

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
  const magneticAxisRef = useRef<THREE.Group>(null);
  const pwnRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const coreRadius = body.size;
  const beamLength = propBeamLength ?? coreRadius * 6.5;
  const beamRadius = propBeamRadius ?? coreRadius * 0.9;
  const pwnTorusRadius = propPwnTorusRadius ?? coreRadius * 2.8;

  // Register in runtime celestial tracking
  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  // Generate Dipolar Magnetic Field Lines: r = R0 * sin^2(theta)
  const magneticFieldCurves = useMemo(() => {
    const curves: THREE.LineCurve3[] = [];
    const numLoops = 8;
    const r0 = coreRadius * 2.6;

    for (let i = 0; i < numLoops; i++) {
      const phi = (i / numLoops) * Math.PI * 2;
      const points: THREE.Vector3[] = [];
      const steps = 32;

      for (let j = 0; j <= steps; j++) {
        // Theta runs from epsilon to PI - epsilon
        const theta = 0.15 + (j / steps) * (Math.PI - 0.3);
        const r = r0 * Math.pow(Math.sin(theta), 2.0);
        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.cos(theta); // Along magnetic dipole axis
        const z = r * Math.sin(theta) * Math.sin(phi);
        points.push(new THREE.Vector3(x, y, z));
      }

      // Convert points to a curve
      const catmull = new THREE.CatmullRomCurve3(points);
      // We can create tube or line geometries
      curves.push(catmull as unknown as THREE.LineCurve3);
    }
    return curves;
  }, [coreRadius]);

  // Frame animation
  useFrame((_, delta) => {
    if (!rootRef.current || !rootRef.current.visible) return;
    // Spin around rotation axis
    if (spinAxisRef.current) {
      spinAxisRef.current.rotation.y += delta * spinFrequency;
    }
    // Pulsar Wind Nebula torus pulsation
    if (pwnRef.current) {
      pwnRef.current.rotation.z += delta * 0.4;
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
      <pointLight color={coreColor} intensity={isSelected ? 8.0 : 4.5} distance={beamLength * 3} />

      {/* Rotation Axis Root (Tilted slightly in space) */}
      <group ref={spinAxisRef} rotation={[0.2, 0, 0]}>
        {/* 1. Ultra-Dense Relativistic Neutron Star Core */}
        <mesh>
          <sphereGeometry args={[coreRadius, 32, 32]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={coreColor}
            emissiveIntensity={3.5}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>

        {/* Core Thermal Atmosphere Halo */}
        <mesh>
          <sphereGeometry args={[coreRadius * 1.25, 24, 24]} />
          <meshBasicMaterial
            color={coreColor}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 2. Magnetic Dipole System (Tilted at angle alpha to spin axis) */}
        <group ref={magneticAxisRef} rotation={[0, 0, magneticTilt]}>
          {/* Dipolar Magnetic Field Line Loops */}
          {magneticFieldCurves.map((curve, idx) => (
            <mesh key={idx}>
              <tubeGeometry args={[curve as unknown as THREE.Curve<THREE.Vector3>, 32, coreRadius * 0.035, 6, false]} />
              <meshBasicMaterial
                color={magneticFieldColor}
                transparent
                opacity={0.4}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}

          {/* North Synchrotron Lighthouse Beam */}
          <group position={[0, beamLength * 0.5, 0]}>
            {/* Outer Translucent Synchrotron Cone */}
            <mesh>
              <coneGeometry args={[beamRadius, beamLength, 32, 1, true]} />
              <meshBasicMaterial
                color={beamColor}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* Inner Intense Collimated Core Needle */}
            <mesh>
              <coneGeometry args={[beamRadius * 0.25, beamLength * 0.98, 16, 1, true]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>

          {/* South Synchrotron Lighthouse Beam */}
          <group position={[0, -beamLength * 0.5, 0]} rotation={[Math.PI, 0, 0]}>
            <mesh>
              <coneGeometry args={[beamRadius, beamLength, 32, 1, true]} />
              <meshBasicMaterial
                color={beamColor}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <mesh>
              <coneGeometry args={[beamRadius * 0.25, beamLength * 0.98, 16, 1, true]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        </group>

        {/* 3. Equatorial Pulsar Wind Nebula (PWN) Shock Torus */}
        <mesh ref={pwnRef} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[pwnTorusRadius, coreRadius * 0.25, 16, 48]} />
          <meshBasicMaterial
            color={coreColor}
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[pwnTorusRadius * 0.7, pwnTorusRadius * 1.4, 48]} />
          <meshBasicMaterial
            color={beamColor}
            side={THREE.DoubleSide}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
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
