'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { RealisticBlackHole } from '../blackhole/RealisticBlackHole';
import { RealisticPulsar } from '../pulsar/RealisticPulsar';
import { PooledPointLight } from '@/components/universe/rendering/LightPool';
import { getGlowPointTexture } from '@/lib/planetTextures';
import { softenPointSprites } from '@/components/universe/rendering/softPointSprites';
import { StarBody } from '@/components/universe/rendering/StarBody';
import {
  SupergiantStar,
  HotStar,
  GlowShell,
  GlowSprite,
  createGasStreamMaterial,
  createAccretionDiskMaterial,
  useAnimatedShader,
} from '@/components/universe/rendering/StellarExtras';
import { ExoplanetSurface, getExoplanetLook } from '@/components/universe/exoplanet/RealisticExoplanet';
import { systemOrbitAngle } from '@/lib/frames';
import { simClock } from '@/lib/simClock';

// Effective temperatures (K) of the catalogued stars drawn here (surface colour comes from these)
const STAR_KELVIN: Record<string, number> = {
  s_doradus: 20000, // LBV prototype, ~20,000 K in its hot phase
  ae_andromedae: 22000, // LBV
  af_andromedae: 28000, // LBV
  m33_var_b: 18000, // LBV
  m33_var_c: 12000, // LBV, swings between ~8,000 and ~20,000 K
  hd_5980: 35000, // very hot WR/LBV multiple system
  m31_rv: 3000, // after its 1988 red-nova outburst it looked like a cool M supergiant
  m31_2014_ds1: 4500, // the yellow supergiant before it faded behind its own dust
  woh_g64: 3400, // red supergiant in its egg-shaped dust cocoon (VLTI/GRAVITY 2024)
  vfts_352: 42000, // two touching O stars
};

// ----------------------------------------------------
// 1. M31* Core Black Hole with P1 & P2 Double Nucleus
// ----------------------------------------------------
export const M31CoreBlackHoleSystem: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const p1DiskRef = useRef<THREE.Group>(null);
  // The black hole sits at this group's origin (it places itself at body.position, which would double the offset
  // and put M31* ~98,000 units away from Andromeda)
  const localBody = React.useMemo<CelestialBody>(() => ({ ...body, position: [0, 0, 0] }), [body]);

  useFrame(({ clock }) => {
    if (p1DiskRef.current) {
      p1DiskRef.current.rotation.z = clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <group position={body.position}>
      {/* Primary M31* Realistic Supermassive Black Hole */}
      <RealisticBlackHole
        body={localBody}
        shadowRadius={body.size * 0.42}
        innerDiskRadius={body.size * 0.48}
        outerDiskRadius={body.size * 1.45}
        colorCore="#ffedd5"
        colorMid="#f59e0b"
        colorOuter="#451a03"
        accretionTilt={[-Math.PI / 4, Math.PI / 5, 0]}
        spinSpeed={1.1}
        dopplerStrength={1.25}
        hasLensingHalo={true}
        hasJet={false}
        isSelected={isSelected}
        onSelect={onSelect}
        language={language}
      />

      {/* Hubble P1 Stellar Cluster: Eccentric Keplarian disk of old stars orbiting 5 ly away */}
      <group ref={p1DiskRef} position={[body.size * 0.55, body.size * 0.15, 0]}>
        <GlowSprite size={body.size * 0.7} color="#ffd9a0" opacity={0.75} />
        <points>
          <sphereGeometry args={[body.size * 0.35, 12, 12]} />
          <pointsMaterial
            ref={softenPointSprites}
            size={body.size * 0.02}
            map={getGlowPointTexture()}
            color="#fef08a"
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </points>
      </group>
    </group>
  );
};

// ----------------------------------------------------
// 2. Hubble's Variable V1 (M31-V1 Pulsating Cepheid Supergiant)
// ----------------------------------------------------
export const HubbleV1Cepheid: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  // Cepheid period-luminosity pulsation simulation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Simulate asymmetric 31.4-day Cepheid light curve (rapid rise, slow decline)
    const phase = (t * 0.8) % (Math.PI * 2);
    const pulsation = Math.sin(phase) + 0.3 * Math.sin(phase * 2.0);
    const scaleFactor = 1.0 + pulsation * 0.08;

    if (coreRef.current) {
      coreRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);
      coreRef.current.rotation.y = t * 0.04;
    }
    if (coronaRef.current) {
      const coronaScale = 1.25 + pulsation * 0.12;
      coronaRef.current.scale.set(coronaScale, coronaScale, coronaScale);
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
      <PooledPointLight color="#fef08a" intensity={4.5} distance={body.size * 5} />

      {/* Pulsating yellow supergiant (F8-G0 Ib, ~6,000 K) */}
      <group ref={coreRef}>
        <StarBody radius={body.size} kelvin={6000} spots={0.4} brightness={1.4} glowScale={2.2} glowOpacity={0.5} segments={64} />
      </group>

      {/* Glow that breathes with the pulsation */}
      <GlowShell ref={coronaRef} radius={body.size * 1.3} color="#ffe2a6" strength={0.45} power={2.4} />

      {/* Interactive Selection Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.4, body.size * 1.435, 128]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 1.3, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-yellow-400 text-xs font-black text-yellow-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
            <span>✨</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">
              31.4d Cepheid
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

// ----------------------------------------------------
// 3. Mayall II (G1 - Massive Globular Cluster & IMBH)
// ----------------------------------------------------
export const MayallIIGlobularCluster: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const rootRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  // Generate 3,500 densely packed ancient stars according to King's profile
  const [positions, colors] = React.useMemo(() => {
    const count = 3500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // High central concentration King's profile
      const r = Math.pow(Math.random(), 3.2) * body.size;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      const c = new THREE.Color();
      if (Math.random() < 0.7) {
        c.set('#fef08a'); // Warm old Population II stars
      } else if (Math.random() < 0.9) {
        c.set('#f97316'); // Red giants
      } else {
        c.set('#60a5fa'); // Blue stragglers
      }

      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return [pos, col];
  }, [body.size]);

  useFrame((_, delta) => {
    if (rootRef.current) {
      rootRef.current.rotation.y += delta * 0.004;
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
      <PooledPointLight color="#fef08a" intensity={3.5} distance={body.size * 3} />

      {/* Dense unresolved core (where the suspected intermediate-mass black hole sits) */}
      <GlowSprite size={body.size * 0.55} color="#ffe8b8" opacity={0.85} />

      {/* 300,000 Ancient Stars Point Cloud */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={softenPointSprites}
          size={body.size * 0.025}
          map={getGlowPointTexture()}
          vertexColors
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.1, body.size * 1.135, 128]} />
          <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} />
        </mesh>
      )}

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 1.2, 0]} center distanceFactor={body.size * 4.5}>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-amber-400 text-xs font-black text-amber-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
            <span>⭐</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              300k Stars (1.5M M☉)
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

// ----------------------------------------------------
// 4. PA-99-N2 Extragalactic Exoplanet System in Andromeda
// ----------------------------------------------------
export const PA99N2ExoplanetSystem: React.FC<{
  star: CelestialBody;
  planet: CelestialBody;
  selectedId: string | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, planet, selectedId, onSelect, language }) => {
  const systemRef = useRef<THREE.Group>(null);
  const planetOrbitRef = useRef<THREE.Group>(null);
  const planetMeshRef = useRef<THREE.Group>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (systemRef.current) registerCelestialObject(star.id, systemRef.current);
    if (planetMeshRef.current) registerCelestialObject(planet.id, planetMeshRef.current);
    return () => {
      unregisterCelestialObject(star.id);
      unregisterCelestialObject(planet.id);
    };
  }, [star.id, planet.id]);

  useFrame((_, delta) => {
    if (planetOrbitRef.current) {
      // Period unknown (found by microlensing): an illustrative rate on the shared clock
      planetOrbitRef.current.rotation.y = systemOrbitAngle(planet.id, simClock.time, planet.orbitalSpeed || 0.04);
    }
    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y += delta * (planet.rotationSpeed || 0.02);
    }
  });

  const isPlanetSelected = selectedId === planet.id;
  const isStarSelected = selectedId === star.id;

  return (
    <group ref={systemRef} position={star.position}>
      {/* Red Giant Host Star */}
      <group
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onSelect(star.id);
        }}
        onPointerOver={() => setHoveredId(star.id)}
        onPointerOut={() => setHoveredId(null)}
      >
        <PooledPointLight color="#f87171" intensity={3.5} distance={star.size * 6} />
        {/* K/M red giant, ~3,900 K */}
        <StarBody radius={star.size} kelvin={3900} spots={1} brightness={1.5} glowScale={2.4} glowOpacity={0.5} segments={64} />
        {(hoveredId === star.id || isStarSelected) && (
          <Html position={[0, star.size * 1.3, 0]} center distanceFactor={star.size * 5}>
            <div className="px-3 py-1 rounded-full bg-slate-950/95 border border-red-400 text-xs font-bold text-red-200 whitespace-nowrap shadow-xl">
              ☀️ {language === 'ar' ? star.nameAr : star.nameEn}
            </div>
          </Html>
        )}
      </group>

      {/* Orbital Ring Line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[planet.orbitalRadius! - 0.5, planet.orbitalRadius! + 0.5, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Orbiting Planet Container */}
      <group ref={planetOrbitRef}>
        <group position={[planet.orbitalRadius!, 0, 0]}>
          <group
            ref={planetMeshRef}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              if (e.delta && e.delta > 5) return;
              e.stopPropagation();
              onSelect(planet.id);
            }}
            onPointerOver={() => setHoveredId(planet.id)}
            onPointerOut={() => setHoveredId(null)}
          >
            {/* 6.34 Jupiter masses: a Jupiter-like giant lit by its red giant */}
            <ExoplanetSurface radius={planet.size} look={getExoplanetLook(planet.id)} host={systemRef} hostKelvin={3900} />
          </group>

          {/* Gravitational Microlensing Light Ring Indicator */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[planet.size * 1.3, planet.size * 1.45, 32]} />
            <meshBasicMaterial color="#facc15" side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>

          {(hoveredId === planet.id || isPlanetSelected) && (
            <Html position={[0, planet.size * 1.5, 0]} center distanceFactor={planet.size * 6}>
              <div className="px-3.5 py-1.5 rounded-full bg-blue-950/95 border-2 border-cyan-400 text-xs font-black text-cyan-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
                <span>🪐</span>
                <span>{language === 'ar' ? planet.nameAr : planet.nameEn}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  6.34 M_Jup
                </span>
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
};

// ----------------------------------------------------
// 5. M33 X-7 Black Hole & O-Supergiant Binary System
// ----------------------------------------------------
export const M33X7BinarySystem: React.FC<{
  star: CelestialBody;
  blackHole: CelestialBody;
  selectedId: string | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, blackHole, selectedId, onSelect, language }) => {
  const binaryRef = useRef<THREE.Group>(null);
  const starRef = useRef<THREE.Group>(null);
  const blackHoleRef = useRef<THREE.Group>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const streamMaterial = React.useMemo(() => createGasStreamMaterial('#93c5fd', '#e0f2fe', 1.3), []);
  useAnimatedShader(streamMaterial);
  const diskMaterial = React.useMemo(
    () => createAccretionDiskMaterial(blackHole.size * 0.45, blackHole.size * 1.25, '#f0f9ff', '#1d4ed8', 1.6),
    [blackHole.size]
  );
  useAnimatedShader(diskMaterial);

  // Each body on its own group: selecting one frames (and follows) that body, not the system centre
  useEffect(() => {
    if (starRef.current) registerCelestialObject(star.id, starRef.current);
    if (blackHoleRef.current) registerCelestialObject(blackHole.id, blackHoleRef.current);
    return () => {
      unregisterCelestialObject(star.id);
      unregisterCelestialObject(blackHole.id);
    };
  }, [star.id, blackHole.id]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (binaryRef.current) {
      binaryRef.current.rotation.y = systemOrbitAngle('m33_x7_black_hole', simClock.time, 0.15); // 3.45-day orbit
    }
    if (streamRef.current) {
      const pulse = 1.0 + Math.sin(t * 3.0) * 0.1;
      streamRef.current.scale.set(pulse, 1.0, pulse);
    }
  });

  return (
    <group position={star.position}>
      <group ref={binaryRef}>
        {/* Roche-Lobe Distorted 70 M_Sun Blue O-Supergiant */}
        <group
          ref={starRef}
          position={[-blackHole.orbitalRadius! * 0.35, 0, 0]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta && e.delta > 5) return;
            e.stopPropagation();
            onSelect(star.id);
          }}
          onPointerOver={() => setHoveredId(star.id)}
          onPointerOut={() => setHoveredId(null)}
        >
          <PooledPointLight color="#60a5fa" intensity={6.0} distance={star.size * 5} />
          {/* O7-8 III, ~35,000 K, pulled into a teardrop by the black hole's tides */}
          <group scale={[1.35, 1.0, 1.0]}>
            <HotStar radius={star.size} kelvin={35000} brightness={1.9} glowScale={2.3} glowOpacity={0.55} segments={64} />
          </group>
          {(hoveredId === star.id || selectedId === star.id) && (
            <Html position={[0, star.size * 1.3, 0]} center distanceFactor={star.size * 5}>
              <div className="px-3 py-1 rounded-full bg-blue-950/95 border border-blue-400 text-xs font-bold text-blue-200 whitespace-nowrap shadow-xl">
                ⭐ {language === 'ar' ? star.nameAr : star.nameEn} (70 M☉)
              </div>
            </Html>
          )}
        </group>

        {/* Mass-Transfer Accretion Stream */}
        <mesh ref={streamRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={streamMaterial} raycast={() => null}>
          <cylinderGeometry args={[star.size * 0.12, star.size * 0.25, blackHole.orbitalRadius!, 24, 1, true]} />
        </mesh>

        {/* 15.65 M_Sun Black Hole with Energetic Accretion Disk */}
        <group
          ref={blackHoleRef}
          position={[blackHole.orbitalRadius! * 0.65, 0, 0]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta && e.delta > 5) return;
            e.stopPropagation();
            onSelect(blackHole.id);
          }}
          onPointerOver={() => setHoveredId(blackHole.id)}
          onPointerOut={() => setHoveredId(null)}
        >
          {/* Singularity Shadow */}
          <mesh>
            <sphereGeometry args={[blackHole.size * 0.35, 24, 24]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {/* Accretion Disk */}
          <mesh rotation={[-Math.PI / 3, 0, 0]} material={diskMaterial}>
            <ringGeometry args={[blackHole.size * 0.45, blackHole.size * 1.25, 96, 4]} />
          </mesh>
          {(hoveredId === blackHole.id || selectedId === blackHole.id) && (
            <Html position={[0, blackHole.size * 1.2, 0]} center distanceFactor={blackHole.size * 5}>
              <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-cyan-400 text-xs font-black text-cyan-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
                <span>🕳️</span>
                <span>{language === 'ar' ? blackHole.nameAr : blackHole.nameEn}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  15.65 M☉
                </span>
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
};

// ----------------------------------------------------
// 6. S Doradus (Prototype LBV Hypergiant with Eruption Shells)
// ----------------------------------------------------
export const SDoradusHypergiant: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  badge?: string;
}> = ({ body, isSelected, onSelect, language, badge = '1M L☉ LBV' }) => {
  const rootRef = useRef<THREE.Group>(null);
  const shellRef1 = useRef<THREE.Mesh>(null);
  const shellRef2 = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (shellRef1.current) {
      shellRef1.current.rotation.y = t * 0.05;
      const s1 = 1.35 + Math.sin(t * 1.5) * 0.05;
      shellRef1.current.scale.set(s1, s1, s1);
    }
    if (shellRef2.current) {
      shellRef2.current.rotation.z = -t * 0.03;
      const s2 = 1.8 + Math.cos(t * 1.2) * 0.08;
      shellRef2.current.scale.set(s2, s2, s2);
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
      <PooledPointLight color="#93c5fd" intensity={5.0} distance={body.size * 6} />

      {/* Hot, unstable hypergiant photosphere (luminous blue variable) */}
      <HotStar radius={body.size} kelvin={STAR_KELVIN[body.id] ?? 20000} brightness={1.9} glowScale={2.6} glowOpacity={0.55} segments={64} />

      {/* Wind-blown eruption shell: a clumpy, limb-brightened bubble */}
      <GlowShell ref={shellRef1} radius={body.size * 1.35} mode="rim" color="#8ec5ff" strength={0.55} power={2.6} noise={0.6} noiseScale={3} />

      {/* Older ejected nebula of nitrogen-rich gas and dust, glowing in H-alpha */}
      <GlowShell ref={shellRef2} radius={body.size * 1.8} color="#fb7185" strength={0.22} power={1.8} noise={0.75} noiseScale={2} />

      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.4, body.size * 1.435, 128]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}

      {(hovered || isSelected) && (
        <Html position={[0, body.size * 1.4, 0]} center distanceFactor={body.size * 5}>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-blue-400 text-xs font-black text-blue-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
            <span>🌟</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
              {badge}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};

// ----------------------------------------------------
// 7. SMC X-1 High-Mass X-Ray Pulsar Binary
// ----------------------------------------------------
export const SMCX1PulsarSystem: React.FC<{
  star: CelestialBody;
  pulsar: CelestialBody;
  selectedId: string | null;
  onSelect: (id: string) => void;
  language: 'en' | 'ar';
}> = ({ star, pulsar, selectedId, onSelect, language }) => {
  const binaryRef = useRef<THREE.Group>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const streamMaterial = React.useMemo(() => createGasStreamMaterial('#93c5fd', '#a5f3fc', 1.2), []);
  useAnimatedShader(streamMaterial);

  const starRef = useRef<THREE.Group>(null);
  // RealisticPulsar places itself at body.position: it sits inside this system's group, so it gets a local origin
  const localPulsar = React.useMemo<CelestialBody>(() => ({ ...pulsar, position: [0, 0, 0] }), [pulsar]);

  // The donor star on its own group (RealisticPulsar registers the pulsar itself), so selecting either one
  // frames that body rather than the system centre
  useEffect(() => {
    if (starRef.current) registerCelestialObject(star.id, starRef.current);
    return () => unregisterCelestialObject(star.id);
  }, [star.id]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (binaryRef.current) {
      binaryRef.current.rotation.y = systemOrbitAngle('smc_x1_pulsar', simClock.time, 0.18); // 3.89-day orbit
    }
  });

  return (
    <group position={star.position}>
      <group ref={binaryRef}>
        {/* Sk 160 B0 Ib Supergiant Donor */}
        <group
          ref={starRef}
          position={[-pulsar.orbitalRadius! * 0.4, 0, 0]}
          onClick={(e: ThreeEvent<MouseEvent>) => {
            if (e.delta && e.delta > 5) return;
            e.stopPropagation();
            onSelect(star.id);
          }}
          onPointerOver={() => setHoveredId(star.id)}
          onPointerOut={() => setHoveredId(null)}
        >
          <PooledPointLight color="#93c5fd" intensity={5.0} distance={star.size * 5} />
          {/* Sk 160: B0 Ib supergiant, ~25,000 K */}
          <HotStar radius={star.size} kelvin={25000} brightness={1.9} glowScale={2.4} glowOpacity={0.55} segments={64} />
          {(hoveredId === star.id || selectedId === star.id) && (
            <Html position={[0, star.size * 1.3, 0]} center distanceFactor={star.size * 5}>
              <div className="px-3 py-1 rounded-full bg-blue-950/95 border border-blue-400 text-xs font-bold text-blue-200 whitespace-nowrap shadow-xl">
                ⭐ {language === 'ar' ? star.nameAr : star.nameEn}
              </div>
            </Html>
          )}
        </group>

        {/* Mass transfer stream */}
        <mesh ref={streamRef} position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={streamMaterial} raycast={() => null}>
          <cylinderGeometry args={[star.size * 0.08, star.size * 0.2, pulsar.orbitalRadius!, 24, 1, true]} />
        </mesh>

        {/* 0.71-second Pulsar */}
        <group position={[pulsar.orbitalRadius! * 0.6, 0, 0]}>
          <RealisticPulsar
            body={localPulsar}
            beamColor="#22d3ee"
            beamLength={pulsar.size * 4.5}
            beamRadius={pulsar.size * 0.35}
            spinFrequency={3.5}
            magneticTilt={0.45}
            isSelected={selectedId === pulsar.id}
            onSelect={() => onSelect(pulsar.id)}
            language={language}
          />
        </group>
      </group>
    </group>
  );
};

// Shared click/hover/registry wiring for the Andromeda companions below
const useSelectableBody = (bodyId: string, onSelect: () => void) => {
  const rootRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(bodyId, rootRef.current);
    return () => unregisterCelestialObject(bodyId);
  }, [bodyId]);

  const handlers = {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (e.delta && e.delta > 5) return;
      e.stopPropagation();
      onSelect();
    },
    onPointerOver: () => setHovered(true),
    onPointerOut: () => setHovered(false),
  };
  return { rootRef, hovered, handlers };
};

const BodyLabel: React.FC<{
  body: CelestialBody;
  language: 'en' | 'ar';
  icon: string;
  badge: string;
  height: number;
  accent: string;
}> = ({ body, language, icon, badge, height, accent }) => (
  <Html position={[0, height, 0]} center distanceFactor={body.size * 5}>
    <div
      className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 text-xs font-black text-slate-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md"
      style={{ borderColor: accent }}
    >
      <span>{icon}</span>
      <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-bold" style={{ color: accent }}>
        {badge}
      </span>
    </div>
  </Html>
);

// ----------------------------------------------------
// NGC 206 — Andromeda's great star cloud (young stellar association in the disk)
// ----------------------------------------------------
// Loose young star cloud / cluster (NGC 206, NGC 1850, NGC 602…)
export const StarCloud: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  badge: string;
  // star colours: [main, secondary]; hot young clusters are blue-white
  palette?: [string, string];
}> = ({ body, isSelected, onSelect, language, badge, palette = ['#bfdbfe', '#e0f2fe'] }) => {
  const { rootRef, hovered, handlers } = useSelectableBody(body.id, onSelect);

  // A loose, flattened cloud of hot blue-white stars (an association, not a bound cluster)
  const [positions, colors] = React.useMemo(() => {
    const count = 1800;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * body.size;
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(theta) * r * 1.3;
      pos[i * 3 + 1] = (Math.random() - 0.5) * body.size * 0.25;
      pos[i * 3 + 2] = Math.sin(theta) * r * 0.8;
      c.set(Math.random() < 0.8 ? palette[0] : palette[1]);
      col.set([c.r, c.g, c.b], i * 3);
    }
    return [pos, col];
  }, [body.size, palette]);

  return (
    <group ref={rootRef} position={body.position} {...handlers}>
      <PooledPointLight color={body.color} intensity={3.0} distance={body.size * 4} />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={softenPointSprites}
          size={body.size * 0.035}
          map={getGlowPointTexture()}
          vertexColors
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {/* Invisible pick volume so the sparse cloud is easy to hover and click */}
      <mesh>
        <sphereGeometry args={[body.size, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.4, body.size * 1.435, 128]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}
      {(hovered || isSelected) && (
        <BodyLabel body={body} language={language} icon="✨" badge={badge} height={body.size * 1.2} accent="#60a5fa" />
      )}
    </group>
  );
};

// ----------------------------------------------------
// M31N 2008-12a — white dwarf + companion erupting about once a year inside its nova super-remnant
// ----------------------------------------------------
export const RecurrentNovaSystem: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  const { rootRef, hovered, handlers } = useSelectableBody(body.id, onSelect);
  const flashRef = useRef<THREE.Mesh>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const diskMaterial = React.useMemo(
    () => createAccretionDiskMaterial(body.size * 0.16, body.size * 0.42, '#f0f9ff', '#0e7490', 1.3),
    [body.size]
  );
  useAnimatedShader(diskMaterial);

  useFrame(({ clock }, delta) => {
    // Time is compressed: one "year" between eruptions takes ~12 s on screen
    const cycle = (clock.getElapsedTime() % 12) / 12;
    const flash = cycle < 0.08 ? Math.sin((cycle / 0.08) * Math.PI) : 0;
    if (flashRef.current) {
      const s = 0.6 + flash * 2.2;
      flashRef.current.scale.set(s, s, s);
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + flash * 0.75;
    }
    if (orbitRef.current) orbitRef.current.rotation.y += delta * 0.6;
  });

  return (
    <group ref={rootRef} position={body.position} {...handlers}>
      <PooledPointLight color="#bae6fd" intensity={3.0} distance={body.size * 6} />
      <group ref={orbitRef}>
        {/* Massive white dwarf (hot, ~30,000 K) with its accretion disk */}
        <group position={[body.size * 0.35, 0, 0]}>
          <HotStar radius={body.size * 0.14} kelvin={30000} brightness={2.5} glowScale={3} glowOpacity={0.8} spin={0.3} />
        </group>
        <mesh position={[body.size * 0.35, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={diskMaterial}>
          <ringGeometry args={[body.size * 0.16, body.size * 0.42, 96, 4]} />
        </mesh>
        {/* Evolved companion star (a red giant / red clump star, ~4,500 K) feeding it hydrogen */}
        <group position={[-body.size * 0.45, 0, 0]}>
          <StarBody radius={body.size * 0.3} kelvin={4500} spots={1} brightness={1.5} glowScale={2} glowOpacity={0.45} />
        </group>
      </group>
      {/* Thermonuclear eruption flash */}
      <mesh ref={flashRef} position={[body.size * 0.35, 0, 0]}>
        <sphereGeometry args={[body.size * 0.5, 20, 20]} />
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Nova super-remnant inflated by past eruptions: a limb-brightened bubble, imaged in H-alpha */}
      <GlowShell radius={body.size * 2.2} mode="rim" color="#fb7185" strength={0.4} power={3} noise={0.5} noiseScale={3} />
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 2.3, body.size * 2.335, 128]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}
      {(hovered || isSelected) && (
        <BodyLabel body={body} language={language} icon="💫" badge="Erupts ~every year" height={body.size * 2.4} accent="#38bdf8" />
      )}
    </group>
  );
};

// ----------------------------------------------------
// Giant Stellar Stream — tidal debris arcing out through Andromeda's halo
// ----------------------------------------------------
const STREAM_STAR_SIZE = 28;
export const GiantStellarStream: React.FC<{
  body: CelestialBody;
  // Curve through the halo in world coordinates; body.position is its midpoint
  curve: [[number, number, number], [number, number, number], [number, number, number]];
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, curve, isSelected, onSelect, language }) => {
  const { rootRef, hovered, handlers } = useSelectableBody(body.id, onSelect);
  const glowTexture = React.useMemo(() => getGlowPointTexture(), []);

  const [positions, colors] = React.useMemo(() => {
    const origin = new THREE.Vector3(...body.position);
    const path = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...curve[0]).sub(origin),
      new THREE.Vector3(...curve[1]).sub(origin),
      new THREE.Vector3(...curve[2]).sub(origin)
    );
    const count = 4000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const p = new THREE.Vector3();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      path.getPoint(t, p);
      // Narrow where it leaves the galaxy, fanning out and thinning towards the far end
      const width = body.size * (0.05 + 0.12 * t);
      p.x += (Math.random() - 0.5) * width;
      p.y += (Math.random() - 0.5) * width;
      p.z += (Math.random() - 0.5) * width;
      pos.set([p.x, p.y, p.z], i * 3);
      c.set(Math.random() < 0.75 ? '#ddd6fe' : '#fde68a');
      const dim = 1 - 0.6 * t;
      col.set([c.r * dim, c.g * dim, c.b * dim], i * 3);
    }
    return [pos, col];
  }, [body.position, body.size, curve]);

  return (
    <group ref={rootRef} position={body.position} {...handlers}>
      {/* Diffuse and spread over a huge area: clicks on compact objects seen through it go to them first */}
      <points userData={{ pickLast: true }}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        {/* Small round sprites: big untextured squares would fill the screen near Andromeda's centre */}
        <pointsMaterial
          ref={softenPointSprites}
          size={STREAM_STAR_SIZE}
          map={glowTexture}
          alphaTest={0.01}
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {(hovered || isSelected) && (
        <BodyLabel body={body} language={language} icon="🌠" badge="Tidal debris · found 2001" height={body.size * 0.2} accent="#a78bfa" />
      )}
    </group>
  );
};

// ----------------------------------------------------
// Bright knot of plasma in a relativistic jet (M87's HST-1)
// ----------------------------------------------------
export const JetKnot: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  badge: string;
}> = ({ body, isSelected, onSelect, language, badge }) => {
  const { rootRef, hovered, handlers } = useSelectableBody(body.id, onSelect);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    // Slow flicker of the synchrotron glow
    const s = 1 + Math.sin(clock.getElapsedTime() * 1.7) * 0.08;
    glowRef.current?.scale.set(s, s, s);
  });

  return (
    <group ref={rootRef} position={body.position} {...handlers}>
      <PooledPointLight color={body.emissiveColor ?? body.color} intensity={3.0} distance={body.size * 5} />
      <mesh>
        <sphereGeometry args={[body.size * 0.35, 24, 24]} />
        <meshBasicMaterial color="#f0f9ff" />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[body.size, 24, 24]} />
        <meshBasicMaterial color={body.emissiveColor ?? body.color} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.3, body.size * 1.335, 128]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}
      {(hovered || isSelected) && (
        <BodyLabel body={body} language={language} icon="⚡" badge={badge} height={body.size * 1.4} accent="#38bdf8" />
      )}
    </group>
  );
};

// ----------------------------------------------------
// Generic catalogued star (colours from the data), optionally inside a dust cocoon or as a touching pair
// ----------------------------------------------------
export const CatalogStar: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  badge: string;
  dustShell?: boolean; // shed dust around a dying giant (WOH G64, M31-2014-DS1)
  contactBinary?: boolean; // two stars touching (VFTS 352)
}> = ({ body, isSelected, onSelect, language, badge, dustShell = false, contactBinary = false }) => {
  const { rootRef, hovered, handlers } = useSelectableBody(body.id, onSelect);
  const spinRef = useRef<THREE.Group>(null);
  const emissive = body.emissiveColor ?? body.color;

  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.y += delta * (contactBinary ? 0.9 : 0.05);
  });

  const starRadius = contactBinary ? body.size * 0.55 : body.size;
  const kelvin = STAR_KELVIN[body.id];
  // Stars hidden in their own dust look dimmer and redder
  const brightness = dustShell && body.id === 'm31_2014_ds1' ? 0.8 : kelvin && kelvin < 4000 ? 1.45 : 1.8;
  return (
    <group ref={rootRef} position={body.position} {...handlers}>
      <PooledPointLight color={emissive} intensity={3.0} distance={body.size * 5} />
      <group ref={spinRef}>
        {(contactBinary ? [-0.5, 0.5] : [0]).map((x) => (
          <group key={x} position={[x * body.size * 0.95, 0, 0]}>
            {kelvin && kelvin < 4000 ? (
              <SupergiantStar radius={starRadius} kelvin={kelvin} brightness={brightness} cellScale={1.5} glowScale={2.2} glowOpacity={0.45} />
            ) : kelvin && kelvin >= 9000 ? (
              <HotStar radius={starRadius} kelvin={kelvin} brightness={brightness} glowScale={2.4} glowOpacity={0.5} segments={64} />
            ) : kelvin ? (
              <StarBody radius={starRadius} kelvin={kelvin} spots={0.6} brightness={brightness} glowScale={2.4} glowOpacity={0.5} segments={64} />
            ) : (
              <StarBody radius={starRadius} color={body.color} brightness={brightness} glowScale={2.4} glowOpacity={0.5} />
            )}
          </group>
        ))}
        {contactBinary && (
          // Shared envelope of hot gas bridging the two stars
          <GlowShell radius={starRadius * 1.05} scale={[1.9, 1, 1]} color="#bfe3ff" strength={0.7} power={1.6} />
        )}
      </group>
      {dustShell && (
        // Clumpy, egg-shaped cocoon of dust the star has shed
        <GlowShell radius={body.size * 2.2} scale={[1.35, 1, 1]} color="#b4461c" strength={1.1} power={1.5} noise={0.8} noiseScale={2.2} />
      )}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * (dustShell ? 3.1 : 1.6), body.size * (dustShell ? 3.25 : 1.75), 48]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
        </mesh>
      )}
      {(hovered || isSelected) && (
        <BodyLabel body={body} language={language} icon="⭐" badge={badge} height={body.size * (dustShell ? 2.6 : 1.6)} accent="#fbbf24" />
      )}
    </group>
  );
};
