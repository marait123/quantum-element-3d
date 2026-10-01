'use client';

import React, { useRef, useMemo, useEffect, useLayoutEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html, useLayerVisible } from '@/components/universe/rendering/LayerVisibility';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import {
  getSunTexture,
  getEarthTexture,
  getEarthCloudsTexture,
  getMoonTexture,
  getMarsTexture,
  getJupiterTexture,
  getSaturnRingTexture,
} from '@/lib/planetTextures';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { RealisticVoyagerProbe } from './models/RealisticVoyager1';
import { RealisticPioneerProbe, RealisticNewHorizonsProbe } from './models/RealisticOuterProbes';
import { RealisticJWST } from './models/RealisticJWST';
import { RealisticHubble } from './models/RealisticHubble';
import { RealisticComet } from './smallbodies/RealisticComet';
import { RealisticAsteroid } from './smallbodies/RealisticAsteroid';
import { MeteorShowerEffect } from './smallbodies/MeteorShowerEffect';
import { InterstellarTrajectories } from './trajectories/InterstellarTrajectories';
import { PooledPointLight } from '@/components/universe/rendering/LightPool';
import { worldPositionAt, localPositionAt, orbitPointAtAngle, orbitPathPoints, getBodyFrame } from '@/lib/frames';
import { poleQuaternion, hasRotation } from '@/lib/ephemeris';
import { updatePlanetSpin } from './rendering/planetSpin';
import { LaunchGate } from './rendering/LaunchGate';
import { getRealTexture, RealTextureName } from '@/lib/realTextures';
import { createNightLitMaterial, createAtmosphereMaterial } from '@/components/universe/rendering/celestialMaterials';
import { StarBody } from '@/components/universe/rendering/StarBody';
import { simClock } from '@/lib/simClock';
import { rockGeometry, RockOptions } from './smallbodies/rockGeometry';
import { scaledCount } from '@/lib/deviceQuality';
import { EARTH_YEAR_SECONDS } from '@/lib/simClock';


// Real surface maps for the planets drawn by StandardPlanet, axial tilts (degrees) and atmosphere rims
const PLANET_MAPS: Record<string, RealTextureName> = {
  mercury: 'mercury',
  venus: 'venus_atmosphere',
  uranus: 'uranus',
  neptune: 'neptune',
};
const AXIAL_TILT_DEG: Record<string, number> = { mercury: 0.03, venus: 2.64, uranus: 97.77, neptune: 28.32, ceres: 4 };
const ATMOSPHERES: Record<string, { color: string; strength: number; scale: number }> = {
  venus: { color: '#f4dfae', strength: 1.3, scale: 1.05 },
  uranus: { color: '#a8eef2', strength: 0.9, scale: 1.04 },
  neptune: { color: '#6fa8ff', strength: 1.0, scale: 1.04 },
};

// Ring geometry whose U coordinate runs from the inner to the outer edge, so a radial ring strip maps correctly
function radialRingGeometry(inner: number, outer: number, segments = 128) {
  const geo = new THREE.RingGeometry(inner, outer, segments, 1);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const r = Math.hypot(pos.getX(i), pos.getY(i));
    uv.setXY(i, (r - inner) / (outer - inner), 0.5);
  }
  uv.needsUpdate = true;
  return geo;
}

// Atmosphere rim shell shared by the planets
const AtmosphereShell: React.FC<{ radius: number; color: string; strength?: number }> = ({ radius, color, strength = 1 }) => {
  const material = useMemo(() => createAtmosphereMaterial(color, strength), [color, strength]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} raycast={() => null}>
      <sphereGeometry args={[radius, 48, 48]} />
    </mesh>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Moons: clickable like planets (card, label, selection ring), placed by the frame graph on the shared clock, and
// tidally locked (each keeps one face toward its planet, as all of these real moons do). Surfaces reuse the real
// maps, tinted; the small irregular Martian moons use the rock generator.
// ---------------------------------------------------------------------------------------------------------------
const MOON_LOOKS: Record<string, { map?: RealTextureName; tint?: string; rock?: Omit<RockOptions, 'radius'>; haze?: string }> = {
  moon: { map: 'moon', tint: '#ffffff' },
  phobos: {
    rock: { seed: 27, detail: 4, relief: 0.12, craters: 18, stretch: [1.25, 0.82, 1.0], color: '#6f655c', giantCrater: { dir: [1, 0.1, 0.2], size: 0.55, depth: 0.2 } },
  },
  deimos: { rock: { seed: 31, detail: 4, relief: 0.06, craters: 6, stretch: [1.2, 0.85, 0.95], color: '#857a6e' } },
  io: { map: 'venus_surface', tint: '#f6de6a' }, // sulfur plains and dark volcanic spots, no impact craters
  europa: { map: 'moon', tint: '#f1e3cf' },
  ganymede: { map: 'moon', tint: '#bcae99' },
  callisto: { map: 'moon', tint: '#7a6e62' },
  enceladus: { map: 'moon', tint: '#ffffff' },
  titan: { map: 'venus_atmosphere', tint: '#d99b45', haze: '#e9a349' }, // hidden under orange nitrogen–methane haze
  titania: { map: 'moon', tint: '#b8ada2' },
  triton: { map: 'mercury', tint: '#e8d3c8' },
  charon: { map: 'moon', tint: '#a39a92' },
};

const _moonParentWorld = new THREE.Vector3();

const SolarMoon: React.FC<{ id: string }> = ({ id }) => {
  const body = CELESTIAL_BODIES[id];
  const look = MOON_LOOKS[id] ?? { map: 'moon' as RealTextureName };
  const isSelected = useQuantumStore((st) => st.selectedCosmicBodyId === id);
  const language = useQuantumStore((st) => st.language);
  const [hovered, setHovered] = useState(false);
  const rootRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(id, rootRef.current);
    return () => unregisterCelestialObject(id, rootRef.current ?? undefined);
  }, [id]);

  const rock = useMemo(() => (look.rock ? rockGeometry({ radius: body.size, ...look.rock }) : null), [look.rock, body.size]);
  useEffect(() => () => rock?.dispose(), [rock]);

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;
    localPositionAt(id, simClock.time, root.position);
    // Tidal locking: turn the same face (the map's centre) toward the planet
    if (root.parent) root.lookAt(root.parent.getWorldPosition(_moonParentWorld));
  });

  return (
    <group
      ref={rootRef}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        useQuantumStore.getState().setSelectedCosmicBodyId(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {rock ? (
        <mesh geometry={rock}>
          <meshStandardMaterial vertexColors roughness={0.97} metalness={0} />
        </mesh>
      ) : (
        // The map's centre (+x) turned to +z, which lookAt points at the planet
        <mesh rotation={[0, -Math.PI / 2, 0]}>
          <sphereGeometry args={[body.size, 48, 48]} />
          <meshStandardMaterial map={getRealTexture(look.map ?? 'moon')} color={look.tint ?? '#ffffff'} roughness={0.95} metalness={0} />
        </mesh>
      )}
      {look.haze && <AtmosphereShell radius={body.size * 1.12} color={look.haze} strength={1.6} />}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[body.size * 1.5, body.size * 1.55, 96]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.45} />
        </mesh>
      )}
      {(hovered || isSelected) && (
        <Html position={[0, body.size * 1.8, 0]} center>
          <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-400/70 shadow-xl text-[11px] font-bold text-slate-100 whitespace-nowrap pointer-events-none">
            🌙 {language === 'ar' ? body.nameAr : body.nameEn}
          </div>
        </Html>
      )}
    </group>
  );
};

// ==========================================
// REALISTIC EARTH WITH ROTATING CLOUD SHIFT
// ==========================================
const RealisticEarth: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const earthGroupRef = useRef<THREE.Group>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const surfaceRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const moonOrbitRef = useRef<THREE.Group>(null);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (earthGroupRef.current) {
      registerCelestialObject('earth', earthGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('earth');
    };
  }, []);


  const [textures, setTextures] = useState<{
    earth?: THREE.CanvasTexture;
    clouds?: THREE.CanvasTexture;
    moon?: THREE.CanvasTexture;
  }>({});

  useEffect(() => {
    setTextures({
      earth: getEarthTexture(),
      clouds: getEarthCloudsTexture(),
      moon: getMoonTexture(),
    });
  }, []);

  // Real Earth: NASA-derived day map, city lights on the night side only, real cloud cover, blue limb haze
  const earthMaterial = useMemo(
    () =>
      createNightLitMaterial({
        map: getRealTexture('earth_daymap'),
        emissiveMap: getRealTexture('earth_nightmap'),
        emissive: new THREE.Color('#ffd7a0'),
        emissiveIntensity: 1.4,
        roughness: 0.78,
        metalness: 0,
        oceanGlint: true,
      }),
    []
  );
  const cloudMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        alphaMap: getRealTexture('earth_clouds'),
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        roughness: 1,
      }),
    []
  );
  const _earthWorld = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    // 1. Earth orbits the Sun
    // Position from the frame graph (lib/frames.ts): real period ratio, starts where Earth is today
    if (earthGroupRef.current) worldPositionAt('earth', simClock.time, earthGroupRef.current.position);
    earthMaterial.userData.updateSun?.(state.camera);

    // 2. Earth turns to its real rotation angle for the date (the side under the Sun matches the time of day)
    if (surfaceRef.current) updatePlanetSpin('earth', surfaceRef.current, delta);

    // 3. Clouds ride with the surface, drifting slowly over it
    if (cloudsRef.current && surfaceRef.current) {
      cloudsRef.current.rotation.y = surfaceRef.current.rotation.y + simClock.time * 0.01;
    }

    // 4. Moon orbits Earth (its real mean longitude, so the phase seen from Earth is right)

  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;
  const moonBody = CELESTIAL_BODIES.moon;

  return (
    <group ref={earthGroupRef} position={body.position}>
      {/* Earth System Root */}
      <group
        // Real 23.4° tilt toward its real direction: the north pole leans toward the Sun in June, away in December
        quaternion={poleQuaternion('earth')}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={() => onPointerOut()}
      >
        {/* Photorealistic Continents & Oceans Surface */}
        <mesh ref={surfaceRef} material={earthMaterial}>
          <sphereGeometry args={[body.size, 64, 64]} />
        </mesh>

        {/* Real cloud cover, drifting slightly faster than the surface */}
        <mesh ref={cloudsRef} material={cloudMaterial}>
          <sphereGeometry args={[body.size * 1.012, 64, 64]} />
        </mesh>

        {/* Rayleigh-blue limb, brightest on the day side */}
        <AtmosphereShell radius={body.size * 1.045} color="#5aa9ff" strength={1.35} />

        {/* Spin axis (north half brighter), so the tilt behind the seasons is visible */}
        <mesh position={[0, body.size * 1.3, 0]} raycast={() => null}>
          <cylinderGeometry args={[body.size * 0.012, body.size * 0.012, body.size * 0.9, 6]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, -body.size * 1.3, 0]} raycast={() => null}>
          <cylinderGeometry args={[body.size * 0.012, body.size * 0.012, body.size * 0.9, 6]} />
          <meshBasicMaterial color="#64748b" transparent opacity={0.6} />
        </mesh>

        {/* Selection / Highlight Pulse Ring */}
        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.size * 1.42, body.size * 1.46, 128]} />
            <meshBasicMaterial
              color={isHighlighted ? '#fbbf24' : '#38bdf8'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}

        {/* Label */}
        {(isHovered || isSelected || isHighlighted) && (
          <Html position={[0, body.size + 1.2, 0]} center>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-sky-400 shadow-xl backdrop-blur-md text-[11px] font-bold text-sky-200 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              {isHighlighted && <span className="text-amber-400">⚡</span>}
              <span>🌍 {displayName}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Moon Orbiting Earth */}
      <SolarMoon id="moon" />
    </group>
  );
};

// ==========================================
// REALISTIC MARS WITH CRATERS & ICE CAPS
// ==========================================
const RealisticMars: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const marsGroupRef = useRef<THREE.Group>(null);
  const marsMeshRef = useRef<THREE.Mesh>(null);
  const phobosOrbitRef = useRef<THREE.Group>(null);
  const phobosRef = useRef<THREE.Group>(null);

  const [marsTexture, setMarsTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setMarsTexture(getMarsTexture());
  }, []);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (marsGroupRef.current) {
      registerCelestialObject('mars', marsGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('mars');
    };
  }, []);

  useFrame((_, delta) => {
    if (marsGroupRef.current && body.orbitalRadius && body.orbitalSpeed) {
      worldPositionAt('mars', simClock.time, marsGroupRef.current.position);
    }
    if (marsMeshRef.current) updatePlanetSpin('mars', marsMeshRef.current, delta);

  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;

  return (
    <group ref={marsGroupRef} position={body.position}>
      <group
        quaternion={poleQuaternion('mars')} // real 25.2° tilt and pole direction (Mars has seasons too)
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={() => onPointerOut()}
      >
        <mesh ref={marsMeshRef}>
          <sphereGeometry args={[body.size, 64, 64]} />
          <meshStandardMaterial map={getRealTexture('mars')} roughness={0.92} metalness={0} />
        </mesh>

        {/* Thin, dusty CO2 atmosphere */}
        <AtmosphereShell radius={body.size * 1.03} color="#e8a878" strength={0.55} />

        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.size * 1.42, body.size * 1.46, 128]} />
            <meshBasicMaterial
              color={isHighlighted ? '#fbbf24' : '#ef4444'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}

        {(isHovered || isSelected || isHighlighted) && (
          <Html position={[0, body.size + 1.0, 0]} center>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-red-500 shadow-xl backdrop-blur-md text-[11px] font-bold text-red-200 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              {isHighlighted && <span className="text-amber-400">⚡</span>}
              <span>🔴 {displayName}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Orbiting Moon Phobos (registered, so it can be selected and followed) */}
      <SolarMoon id="phobos" />
      <SolarMoon id="deimos" />
    </group>
  );
};

// ==========================================
// REALISTIC JUPITER WITH GREAT RED SPOT
// ==========================================
const RealisticJupiter: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const jupiterGroupRef = useRef<THREE.Group>(null);
  const jupiterMeshRef = useRef<THREE.Mesh>(null);
  const europaOrbitRef = useRef<THREE.Group>(null);
  const europaGroupRef = useRef<THREE.Group>(null);

  const [jupTexture, setJupTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setJupTexture(getJupiterTexture());
  }, []);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (jupiterGroupRef.current) {
      registerCelestialObject('jupiter', jupiterGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('jupiter');
    };
  }, []);


  useFrame((_, delta) => {
    if (jupiterGroupRef.current && body.orbitalRadius && body.orbitalSpeed) {
      worldPositionAt('jupiter', simClock.time, jupiterGroupRef.current.position);
    }
    if (jupiterMeshRef.current) updatePlanetSpin('jupiter', jupiterMeshRef.current, delta);

  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;
  const europaBody = CELESTIAL_BODIES.europa;

  return (
    <group ref={jupiterGroupRef} position={body.position}>
      <group
        quaternion={poleQuaternion('jupiter')} // real 3° tilt
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={() => onPointerOut()}
      >
        <mesh ref={jupiterMeshRef} scale={[1, 0.935, 1]}>
          <sphereGeometry args={[body.size, 72, 72]} />
          <meshStandardMaterial map={getRealTexture('jupiter')} roughness={0.85} metalness={0} />
        </mesh>
        <AtmosphereShell radius={body.size * 1.03} color="#f3d7b0" strength={0.45} />

        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.size * 1.42, body.size * 1.46, 128]} />
            <meshBasicMaterial
              color={isHighlighted ? '#fbbf24' : '#f59e0b'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}

        {(isHovered || isSelected || isHighlighted) && (
          <Html position={[0, body.size + 1.4, 0]} center>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-amber-500 shadow-xl backdrop-blur-md text-[11px] font-bold text-amber-200 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              {isHighlighted && <span className="text-amber-400">⚡</span>}
              <span>🪐 {displayName}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Orbiting Moon Europa */}
      <SolarMoon id="io" />
      <SolarMoon id="europa" />
      <SolarMoon id="ganymede" />
      <SolarMoon id="callisto" />
    </group>
  );
};

// ==========================================
// REALISTIC SATURN WITH CASSINI DIVISION RINGS
// ==========================================
const RealisticSaturn: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const saturnGroupRef = useRef<THREE.Group>(null);
  const saturnMeshRef = useRef<THREE.Mesh>(null);
  const titanOrbitRef = useRef<THREE.Group>(null);
  const titanGroupRef = useRef<THREE.Group>(null);

  const [ringTexture, setRingTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setRingTexture(getSaturnRingTexture());
  }, []);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (saturnGroupRef.current) {
      registerCelestialObject('saturn', saturnGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('saturn');
    };
  }, []);


  const saturnRingGeometry = useMemo(() => radialRingGeometry(body.size * 1.24, body.size * 2.27, 160), [body.size]);
  useEffect(() => () => saturnRingGeometry.dispose(), [saturnRingGeometry]);

  useFrame((_, delta) => {
    if (saturnGroupRef.current && body.orbitalRadius && body.orbitalSpeed) {
      worldPositionAt('saturn', simClock.time, saturnGroupRef.current.position);
    }
    if (saturnMeshRef.current) updatePlanetSpin('saturn', saturnMeshRef.current, delta);

  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;
  const titanBody = CELESTIAL_BODIES.titan;

  return (
    <group ref={saturnGroupRef} position={body.position}>
      <group
        quaternion={poleQuaternion('saturn')} // real 26.7° tilt: the rings open and close as seen from Earth
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={() => onPointerOut()}
      >
        {/* Saturn Body */}
        <mesh ref={saturnMeshRef} scale={[1, 0.902, 1]}>
          <sphereGeometry args={[body.size, 72, 72]} />
          <meshStandardMaterial map={getRealTexture('saturn')} roughness={0.85} metalness={0} />
        </mesh>
        <AtmosphereShell radius={body.size * 1.025} color="#f5e3b5" strength={0.4} />

        {/* Real ring system, C ring (1.24 Saturn radii) to the outer A ring (2.27), with the Cassini Division */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={saturnRingGeometry}>
          <meshStandardMaterial
            map={getRealTexture('saturn_ring_alpha')}
            side={THREE.DoubleSide}
            transparent
            alphaTest={0.02}
            depthWrite={false}
            roughness={0.9}
            metalness={0}
          />
        </mesh>

        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.size * 2.42, body.size * 2.46, 160]} />
            <meshBasicMaterial
              color={isHighlighted ? '#fbbf24' : '#eab308'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}

        {(isHovered || isSelected || isHighlighted) && (
          <Html position={[0, body.size + 1.4, 0]} center>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-yellow-500 shadow-xl backdrop-blur-md text-[11px] font-bold text-yellow-200 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              {isHighlighted && <span className="text-amber-400">⚡</span>}
              <span>🪐 {displayName}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Orbiting Moon Titan */}
      <SolarMoon id="enceladus" />
      <SolarMoon id="titan" />
    </group>
  );
};

// ==========================================
// REALISTIC PLUTO WITH NITROGEN HEART & CHARON
// ==========================================
const RealisticPluto: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language }) => {
  const plutoGroupRef = useRef<THREE.Group>(null);
  const plutoMeshRef = useRef<THREE.Mesh>(null);
  const charonOrbitRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (plutoGroupRef.current) {
      registerCelestialObject('pluto', plutoGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('pluto');
    };
  }, []);

  useFrame((_, delta) => {
    // Real 17° inclination and 248-year period come from the frame graph
    if (plutoGroupRef.current) worldPositionAt('pluto', simClock.time, plutoGroupRef.current.position);
    if (plutoMeshRef.current) updatePlanetSpin('pluto', plutoMeshRef.current, delta);

  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;

  return (
    <group ref={plutoGroupRef} position={body.position}>
      <group
        quaternion={poleQuaternion('pluto')} // real 119.5° tilt (it rotates on its side, backwards)
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onPointerOver();
        }}
        onPointerOut={() => onPointerOut()}
      >
        {/* Pluto Body with Tan/Terracotta Crust */}
        <mesh ref={plutoMeshRef}>
          <sphereGeometry args={[body.size, 36, 36]} />
          <meshStandardMaterial
            color="#d4a373"
            roughness={0.85}
            metalness={0.05}
            emissive={isSelected ? '#a16207' : '#000000'}
            emissiveIntensity={isSelected ? 0.35 : 0}
          />
        </mesh>

        {/* Sputnik Planitia "Heart of Pluto" Nitrogen Ice Feature */}
        <mesh position={[body.size * 0.55, -body.size * 0.1, body.size * 0.75]} rotation={[0.2, 0.4, 0]}>
          <circleGeometry args={[body.size * 0.42, 24]} />
          <meshStandardMaterial
            color="#fef3c7"
            roughness={0.4}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Thin Atmospheric Blue Haze Rim */}
        <mesh>
          <sphereGeometry args={[body.size * 1.05, 24, 24]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.15} side={THREE.BackSide} />
        </mesh>

        {(isSelected || isHighlighted) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[body.size * 1.42, body.size * 1.46, 128]} />
            <meshBasicMaterial
              color={isHighlighted ? '#fbbf24' : '#f59e0b'}
              side={THREE.DoubleSide}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}

        {(isHovered || isSelected || isHighlighted) && (
          <Html position={[0, body.size + 0.9, 0]} center>
            <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-amber-500 shadow-xl backdrop-blur-md text-[11px] font-bold text-amber-200 whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              {isHighlighted && <span className="text-amber-400">⚡</span>}
              <span>🤎 {displayName}</span>
            </div>
          </Html>
        )}
      </group>

      {/* Orbiting Moon Charon */}
      <SolarMoon id="charon" />
    </group>
  );
};

// ==========================================
// GENERIC ORBITING PLANET
// ==========================================
const StandardPlanet: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  language: 'en' | 'ar';
  moons?: string[];
}> = ({ body, isSelected, isHovered, isHighlighted, onClick, onPointerOver, onPointerOut, language, moons }) => {
  const meshRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Mesh>(null);

  // Register with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (meshRef.current) {
      registerCelestialObject(body.id, meshRef.current);
    }
    return () => {
      unregisterCelestialObject(body.id);
    };
  }, [body.id]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Spin the planet itself (not its label or selection ring); negative speeds are retrograde (Venus, Uranus)
    if (spinRef.current && hasRotation(body.id)) updatePlanetSpin(body.id, spinRef.current, delta);
    else if (body.rotationSpeed && spinRef.current) {
      spinRef.current.rotation.y += body.rotationSpeed * delta * 60 * simClock.scale;
    }
    worldPositionAt(body.id, simClock.time, meshRef.current.position);
  });

  const displayName = language === 'ar' ? body.nameAr : body.nameEn;

  return (
    <group
      ref={meshRef}
      position={body.position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta && e.delta > 5) return;
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver();
      }}
      onPointerOut={() => onPointerOut()}
    >
      {/* Real pole direction (IAU) where known, otherwise the catalogue tilt */}
      <group
        {...(hasRotation(body.id)
          ? { quaternion: poleQuaternion(body.id) }
          : { rotation: [((AXIAL_TILT_DEG[body.id] ?? 0) * Math.PI) / 180, 0, 0] as [number, number, number] })}
      >
        <mesh ref={spinRef}>
          <sphereGeometry args={[body.size, 64, 64]} />
          {PLANET_MAPS[body.id] ? (
            <meshStandardMaterial map={getRealTexture(PLANET_MAPS[body.id])} roughness={0.9} metalness={0} />
          ) : (
            <meshStandardMaterial color={body.color} roughness={0.8} metalness={0} />
          )}
        </mesh>
        {/* Uranus: faint, dark narrow rings (epsilon ring outermost), tipped over with the planet */}
        {body.id === 'uranus' && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[body.size * 1.64, body.size * 2.0, 96]} />
            <meshBasicMaterial color="#8d9aa6" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}
      </group>
      {ATMOSPHERES[body.id] && (
        <AtmosphereShell
          radius={body.size * ATMOSPHERES[body.id].scale}
          color={ATMOSPHERES[body.id].color}
          strength={ATMOSPHERES[body.id].strength}
        />
      )}
      {moons?.map((m) => <SolarMoon key={m} id={m} />)}

      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.42, body.size * 1.46, 128]} />
          <meshBasicMaterial
            color={isHighlighted ? '#fbbf24' : '#38bdf8'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {(isHovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size + 1.0, 0]} center>
          <div className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-sky-500/60 shadow-lg backdrop-blur-md text-[11px] font-semibold text-sky-200 whitespace-nowrap pointer-events-none select-none flex items-center gap-1.5 animate-fadeIn">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>{displayName}</span>
          </div>
        </Html>
      )}
    </group>
  );
};

// Orbital Path Visualizer
const OrbitLine: React.FC<{ radius: number; color?: string; bodyId?: string }> = ({ radius, color = '#334155', bodyId }) => {
  const points = useMemo(() => {
    const pts = [];
    const segments = 160;
    const frame = bodyId ? getBodyFrame(bodyId) : undefined;
    // The real orbit (eccentric, tilted, perihelion in its true direction) from the same elements as the planet
    if (bodyId && frame && frame.kind === 'orbit') return orbitPathPoints(bodyId, segments);
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      // Follow the body's real, inclined orbit from the frame graph when it has one
      if (frame && frame.kind === 'orbit') pts.push(orbitPointAtAngle(frame, theta, new THREE.Vector3()));
      else pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return pts;
  }, [radius, bodyId]);

  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  // Memoized: building the Line inline created (and leaked) a new line + material on every parent re-render,
  // e.g. on each hover change in the Solar System scene
  const line = useMemo(
    () => new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 })),
    [lineGeo, color]
  );
  useEffect(
    () => () => {
      (line.material as THREE.Material).dispose();
    },
    [line]
  );
  useEffect(() => () => lineGeo.dispose(), [lineGeo]);

  return <primitive object={line} />;
};

// Asteroid Belt Particles
const BELT_VARIANTS = 4;
const AsteroidBelt: React.FC = () => {
  const count = scaledCount(480, 0.5);
  const perVariant = Math.ceil(count / BELT_VARIANTS);
  const meshRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Varied rock shapes (not one repeated block), each instanced
  const geometries = useMemo(
    () =>
      Array.from({ length: BELT_VARIANTS }, (_, i) =>
        rockGeometry({ radius: 1, seed: 101 + i * 17, detail: 2, relief: 0.22, craters: 6, color: '#ffffff', albedoJitter: 0.25, stretch: [1 + i * 0.25, 0.8 + (i % 2) * 0.2, 0.9] })
      ),
    []
  );
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);

  // Real belt: 2.2–3.3 AU, so orbital periods of ~3.3–6 years (Kepler), on the shared simulation clock
  const asteroidData = useMemo(() => {
    const rand = (() => {
      let x = 12345;
      return () => ((x = (x * 16807) % 2147483647) / 2147483647);
    })();
    return Array.from({ length: count }, () => {
      const t = rand();
      const radius = 24.5 + t * 4.0;
      const au = 2.2 + t * 1.1;
      const periodSeconds = Math.pow(au, 1.5) * EARTH_YEAR_SECONDS;
      const carbonaceous = rand() < 0.75; // most belt asteroids are dark C-types; the rest stony S-types
      const shade = carbonaceous ? 0.28 + rand() * 0.12 : 0.55 + rand() * 0.2;
      return {
        radius,
        angle0: rand() * Math.PI * 2,
        omega: (2 * Math.PI) / periodSeconds,
        y: (rand() - 0.5) * 1.8,
        scale: 0.06 + Math.pow(rand(), 2.5) * 0.24,
        spin: new THREE.Euler(rand() * 6, rand() * 6, rand() * 6),
        spinRate: 0.2 + rand() * 0.8,
        color: carbonaceous ? new THREE.Color(shade, shade * 0.97, shade * 0.93) : new THREE.Color(shade, shade * 0.88, shade * 0.72),
      };
    });
  }, [count]);

  const layerVisible = useLayerVisible();

  // A point on the belt to select and fly to (the belt itself is thousands of instances)
  const anchorRef = useRef<THREE.Group>(null);
  useEffect(() => {
    if (anchorRef.current) registerCelestialObject('asteroid_belt', anchorRef.current);
    return () => unregisterCelestialObject('asteroid_belt');
  }, []);

  const place = (i: number, t: number) => {
    const a = asteroidData[i];
    const ang = a.angle0 + a.omega * t;
    dummy.position.set(Math.cos(ang) * a.radius, a.y, -Math.sin(ang) * a.radius);
    dummy.rotation.set(a.spin.x + t * a.spinRate, a.spin.y + t * a.spinRate * 0.7, a.spin.z);
    dummy.scale.setScalar(a.scale);
    dummy.updateMatrix();
  };

  // Place every instance before the first render and size the bounding sphere to the whole belt. Otherwise
  // three.js may compute it while all instances still sit at the origin (e.g. when this layer is prewarmed
  // from far away) and then frustum-cull the entire belt whenever the Sun is off-screen.
  useLayoutEffect(() => {
    for (let v = 0; v < BELT_VARIANTS; v++) {
      const mesh = meshRefs.current[v];
      if (!mesh) continue;
      for (let k = 0; k < perVariant; k++) {
        const i = v * perVariant + k;
        if (i >= count) break;
        place(i, simClock.time);
        mesh.setMatrixAt(k, dummy.matrix);
        mesh.setColorAt(k, asteroidData[i].color);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asteroidData, dummy]);

  useFrame((state) => {
    // Performance LOD: freeze asteroid updates when the layer is hidden or in deep space
    if (!layerVisible || state.camera.position.length() > 2500) return;
    const t = simClock.time;
    for (let v = 0; v < BELT_VARIANTS; v++) {
      const mesh = meshRefs.current[v];
      if (!mesh) continue;
      for (let k = 0; k < perVariant; k++) {
        const i = v * perVariant + k;
        if (i >= count) break;
        place(i, t);
        mesh.setMatrixAt(k, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <group ref={anchorRef} position={CELESTIAL_BODIES.asteroid_belt.position} />
      {geometries.map((geo, v) => (
        <instancedMesh
          key={v}
          ref={(el) => {
            meshRefs.current[v] = el;
          }}
          args={[geo, undefined, Math.min(perVariant, count - v * perVariant)]}
        >
          <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
        </instancedMesh>
      ))}
    </>
  );
};

// ==========================================
// MAIN SOLAR SYSTEM SCENE
// ==========================================
export const SolarSystemScene: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const highlightedCosmicElementNum = useQuantumStore((s) => s.highlightedCosmicElementNum);

  const [hoveredBodyId, setHoveredBodyId] = React.useState<string | null>(null);

  const sunRef = useRef<THREE.Mesh>(null);
  const sunCoronaRef = useRef<THREE.Mesh>(null);
  const sunGroupRef = useRef<THREE.Group>(null);
  const [sunTexture, setSunTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    setSunTexture(getSunTexture());
  }, []);

  // Register Sun with global runtime celestial registry for live camera follow
  useEffect(() => {
    if (sunGroupRef.current) {
      registerCelestialObject('sun', sunGroupRef.current);
    }
    return () => {
      unregisterCelestialObject('sun');
    };
  }, []);

  useFrame((_, delta) => {
    if (sunRef.current) sunRef.current.rotation.y += delta * 0.04;
    if (sunCoronaRef.current) {
      sunCoronaRef.current.rotation.z -= delta * 0.07;
      const s = 1.0 + Math.sin(Date.now() * 0.003) * 0.05;
      sunCoronaRef.current.scale.set(s, s, s);
    }
  });

  const sunBody = CELESTIAL_BODIES.sun;

  const isHighlighted = (body: CelestialBody) =>
    highlightedCosmicElementNum !== null &&
    body.primaryElements.some((e) => e.atomicNumber === highlightedCosmicElementNum);

  return (
    <group>
      {/* Central Solar Illuminator */}
      <PooledPointLight position={[0, 0, 0]} intensity={3.2} distance={220} decay={0} color="#fff6e5" />

      {/* Sun Photosphere & Animated Corona */}
      <group
        ref={sunGroupRef}
        position={[0, 0, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.delta && e.delta > 5) return;
          e.stopPropagation();
          setSelectedCosmicBodyId('sun');
        }}
        onPointerOver={() => setHoveredBodyId('sun')}
        onPointerOut={() => setHoveredBodyId(null)}
      >
        {/* Real photosphere (Solar System Scope map): boiling granulation, sunspots, limb darkening, corona */}
        <StarBody radius={sunBody.size} kelvin={5772} brightness={2.1} spots={1} glowScale={3.2} glowOpacity={0.75} segments={96} />

        {(hoveredBodyId === 'sun' || selectedCosmicBodyId === 'sun') && (
          <Html position={[0, sunBody.size + 1.4, 0]} center>
            <div className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400 shadow-xl text-xs font-bold text-amber-200 whitespace-nowrap">
              ☀️ {language === 'ar' ? sunBody.nameAr : sunBody.nameEn}
            </div>
          </Html>
        )}
      </group>

      {/* Planetary Orbit Guide Rings */}
      <OrbitLine radius={7.5} bodyId="mercury" />
      <OrbitLine radius={11.0} bodyId="venus" />
      <OrbitLine radius={15.5} bodyId="earth" color="#0284c7" />
      <OrbitLine radius={21.0} bodyId="mars" color="#b91c1c" />
      <OrbitLine radius={26.5} bodyId="ceres" color="#78716c" />
      <OrbitLine radius={33.0} bodyId="jupiter" color="#b45309" />
      <OrbitLine radius={42.0} bodyId="saturn" color="#ca8a04" />
      <OrbitLine radius={51.0} bodyId="uranus" color="#0891b2" />
      <OrbitLine radius={58.0} bodyId="neptune" color="#2563eb" />
      <OrbitLine radius={64.0} bodyId="pluto" color="#a16207" />

      {/* Main Asteroid Belt & Meteor Showers */}
      <AsteroidBelt />
      <MeteorShowerEffect active={true} />

      {/* Realistic Asteroids with Authentic Topologies */}
      {CELESTIAL_BODIES.ceres && (
        <RealisticAsteroid
          body={CELESTIAL_BODIES.ceres}
          isSelected={selectedCosmicBodyId === 'ceres'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.ceres)}
          onSelect={() => setSelectedCosmicBodyId('ceres')}
          language={language}
          icon="☄️"
        />
      )}
      {CELESTIAL_BODIES.bennu_asteroid && (
        <RealisticAsteroid
          body={CELESTIAL_BODIES.bennu_asteroid}
          isSelected={selectedCosmicBodyId === 'bennu_asteroid'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.bennu_asteroid)}
          onSelect={() => setSelectedCosmicBodyId('bennu_asteroid')}
          language={language}
          icon="🪨"
        />
      )}
      {CELESTIAL_BODIES.psyche_asteroid && (
        <RealisticAsteroid
          body={CELESTIAL_BODIES.psyche_asteroid}
          isSelected={selectedCosmicBodyId === 'psyche_asteroid'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.psyche_asteroid)}
          onSelect={() => setSelectedCosmicBodyId('psyche_asteroid')}
          language={language}
          icon="🪙"
        />
      )}
      {CELESTIAL_BODIES.apophis_asteroid && (
        <RealisticAsteroid
          body={CELESTIAL_BODIES.apophis_asteroid}
          isSelected={selectedCosmicBodyId === 'apophis_asteroid'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.apophis_asteroid)}
          onSelect={() => setSelectedCosmicBodyId('apophis_asteroid')}
          language={language}
          icon="⚠️"
        />
      )}

      {/* Realistic Comets with Sublimating Coma & Dual Tails */}
      {CELESTIAL_BODIES.halley_comet && (
        <RealisticComet
          body={CELESTIAL_BODIES.halley_comet}
          isSelected={selectedCosmicBodyId === 'halley_comet'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.halley_comet)}
          onSelect={() => setSelectedCosmicBodyId('halley_comet')}
          language={language}
          icon="☄️"
        />
      )}
      {CELESTIAL_BODIES.oumuamua && (
        <RealisticComet
          body={CELESTIAL_BODIES.oumuamua}
          isSelected={selectedCosmicBodyId === 'oumuamua'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.oumuamua)}
          onSelect={() => setSelectedCosmicBodyId('oumuamua')}
          language={language}
          icon="🛸"
        />
      )}


      {/* Mercury & Venus */}
      <StandardPlanet
        body={CELESTIAL_BODIES.mercury}
        isSelected={selectedCosmicBodyId === 'mercury'}
        isHovered={hoveredBodyId === 'mercury'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.mercury)}
        onClick={() => setSelectedCosmicBodyId('mercury')}
        onPointerOver={() => setHoveredBodyId('mercury')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />
      <StandardPlanet
        body={CELESTIAL_BODIES.venus}
        isSelected={selectedCosmicBodyId === 'venus'}
        isHovered={hoveredBodyId === 'venus'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.venus)}
        onClick={() => setSelectedCosmicBodyId('venus')}
        onPointerOver={() => setHoveredBodyId('venus')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Photorealistic Earth with Rotating Clouds & Moon */}
      <RealisticEarth
        body={CELESTIAL_BODIES.earth}
        isSelected={selectedCosmicBodyId === 'earth'}
        isHovered={hoveredBodyId === 'earth'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.earth)}
        onClick={() => setSelectedCosmicBodyId('earth')}
        onPointerOver={() => setHoveredBodyId('earth')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Mars with Syrtis Major & Phobos */}
      <RealisticMars
        body={CELESTIAL_BODIES.mars}
        isSelected={selectedCosmicBodyId === 'mars'}
        isHovered={hoveredBodyId === 'mars'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.mars)}
        onClick={() => setSelectedCosmicBodyId('mars')}
        onPointerOver={() => setHoveredBodyId('mars')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Jupiter with Great Red Spot & Europa */}
      <RealisticJupiter
        body={CELESTIAL_BODIES.jupiter}
        isSelected={selectedCosmicBodyId === 'jupiter'}
        isHovered={hoveredBodyId === 'jupiter'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.jupiter)}
        onClick={() => setSelectedCosmicBodyId('jupiter')}
        onPointerOver={() => setHoveredBodyId('jupiter')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Saturn with Cassini Division Rings & Titan */}
      <RealisticSaturn
        body={CELESTIAL_BODIES.saturn}
        isSelected={selectedCosmicBodyId === 'saturn'}
        isHovered={hoveredBodyId === 'saturn'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.saturn)}
        onClick={() => setSelectedCosmicBodyId('saturn')}
        onPointerOver={() => setHoveredBodyId('saturn')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Uranus & Neptune Ice Giants */}
      <StandardPlanet
        body={CELESTIAL_BODIES.uranus}
        moons={['titania']}
        isSelected={selectedCosmicBodyId === 'uranus'}
        isHovered={hoveredBodyId === 'uranus'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.uranus)}
        onClick={() => setSelectedCosmicBodyId('uranus')}
        onPointerOver={() => setHoveredBodyId('uranus')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />
      <StandardPlanet
        body={CELESTIAL_BODIES.neptune}
        moons={['triton']}
        isSelected={selectedCosmicBodyId === 'neptune'}
        isHovered={hoveredBodyId === 'neptune'}
        isHighlighted={isHighlighted(CELESTIAL_BODIES.neptune)}
        onClick={() => setSelectedCosmicBodyId('neptune')}
        onPointerOver={() => setHoveredBodyId('neptune')}
        onPointerOut={() => setHoveredBodyId(null)}
        language={language}
      />

      {/* Pluto Dwarf Planet & Charon */}
      {CELESTIAL_BODIES.pluto && (
        <RealisticPluto
          body={CELESTIAL_BODIES.pluto}
          isSelected={selectedCosmicBodyId === 'pluto'}
          isHovered={hoveredBodyId === 'pluto'}
          isHighlighted={isHighlighted(CELESTIAL_BODIES.pluto)}
          onClick={() => setSelectedCosmicBodyId('pluto')}
          onPointerOver={() => setHoveredBodyId('pluto')}
          onPointerOut={() => setHoveredBodyId(null)}
          language={language}
        />
      )}

      {/* Interstellar Trajectories, Gliese 445 / Ross 248 Encounter Beacons & Proxima Pointer */}
      <InterstellarTrajectories
        language={language}
        onSelectBody={setSelectedCosmicBodyId}
      />

      {/* Ultra-Realistic Deep Space Probes & Satellites */}
      {CELESTIAL_BODIES.voyager_1 && (
        <LaunchGate id="voyager_1">
        <RealisticVoyagerProbe
          body={CELESTIAL_BODIES.voyager_1}
          language={language}
          isSelected={selectedCosmicBodyId === 'voyager_1'}
          onSelect={() => setSelectedCosmicBodyId('voyager_1')}
        />
        </LaunchGate>
      )}

      {CELESTIAL_BODIES.voyager_2 && (
        <LaunchGate id="voyager_2">
        <RealisticVoyagerProbe
          body={CELESTIAL_BODIES.voyager_2}
          language={language}
          isSelected={selectedCosmicBodyId === 'voyager_2'}
          onSelect={() => setSelectedCosmicBodyId('voyager_2')}
        />
        </LaunchGate>
      )}

      {(['pioneer_10', 'pioneer_11'] as const).map(
        (id) =>
          CELESTIAL_BODIES[id] && (
            <LaunchGate key={id} id={id}>
            <RealisticPioneerProbe
              body={CELESTIAL_BODIES[id]}
              language={language}
              isSelected={selectedCosmicBodyId === id}
              onSelect={() => setSelectedCosmicBodyId(id)}
            />
            </LaunchGate>
          )
      )}

      {CELESTIAL_BODIES.new_horizons && (
        <LaunchGate id="new_horizons">
        <RealisticNewHorizonsProbe
          body={CELESTIAL_BODIES.new_horizons}
          language={language}
          isSelected={selectedCosmicBodyId === 'new_horizons'}
          onSelect={() => setSelectedCosmicBodyId('new_horizons')}
        />
        </LaunchGate>
      )}

      <LaunchGate id="jwst">
        <RealisticJWST
          body={CELESTIAL_BODIES.jwst}
          language={language}
          isSelected={selectedCosmicBodyId === 'jwst'}
          onSelect={() => setSelectedCosmicBodyId('jwst')}
        />
      </LaunchGate>

      {CELESTIAL_BODIES.hubble && (
        <LaunchGate id="hubble">
          <RealisticHubble
            body={CELESTIAL_BODIES.hubble}
            language={language}
            isSelected={selectedCosmicBodyId === 'hubble'}
            onSelect={() => setSelectedCosmicBodyId('hubble')}
          />
        </LaunchGate>
      )}
    </group>
  );
};
