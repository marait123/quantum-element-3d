'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import { getGlowPointTexture } from '@/lib/planetTextures';
import { RealisticBlackHole } from './blackhole/RealisticBlackHole';
import { RealisticNebula } from './nebula/RealisticNebula';
import { RealisticSupernova } from './supernova/RealisticSupernova';
import { RealisticGalaxy, getGalaxyDiskRotation } from './galaxy/RealisticGalaxy';
import { RealisticPulsar } from './pulsar/RealisticPulsar';
import { GalaxyInterior } from './galaxy/GalaxyInterior';
import { GALAXY_INTERIORS, INTERIOR_START, interiorFade, getGalaxyMembers } from '@/lib/galaxyInteriors';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import {
  M31CoreBlackHoleSystem,
  HubbleV1Cepheid,
  MayallIIGlobularCluster,
  PA99N2ExoplanetSystem,
  M33X7BinarySystem,
  SDoradusHypergiant,
  SMCX1PulsarSystem,
  StarCloud,
  JetKnot,
  CatalogStar,
  RecurrentNovaSystem,
  GiantStellarStream,
} from './galaxy/ExtragalacticObjects';
import {
  registerCelestialObject,
  unregisterCelestialObject,
  calculateFramingDistance,
  getCelestialObject,
  getCelestialWorldPosition,
} from '@/lib/celestialRegistry';
import {
  GALAXIES_FADE_START,
  GALAXIES_FADE_FULL,
  MILKY_WAY_CROSSFADE_START,
  MILKY_WAY_CROSSFADE_END,
} from '@/lib/scaleVisibility';
import { DistanceFadeGroup } from './rendering/useDistanceFade';
import { ProximityLod } from './rendering/ProximityLod';
import { PooledPointLight } from '@/components/universe/rendering/LightPool';
import { StarBody } from '@/components/universe/rendering/StarBody';
import { getCoronaTexture } from '@/components/universe/rendering/celestialMaterials';
import { softenPointSprites } from '@/components/universe/rendering/softPointSprites';
import { scaledCount } from '@/lib/deviceQuality';

// Sub-systems per host galaxy, kept shown while any of them is selected (camera flies to / tracks it)
const ANDROMEDA_INTERNALS = [
  'andromeda_core_black_hole',
  'hubble_v1_star',
  'mayall_ii_cluster',
  'pa_99_n2_star',
  'pa_99_n2_planet',
  'ngc_206',
  's_andromedae',
  'm31n_2008_12a',
  'ae_andromedae',
  'messier_32',
  'messier_110',
  'af_andromedae',
  'm31_rv',
  'm31_2014_ds1',
  'ngc_147',
  'ngc_185',
];

// Objects inside a galaxy's disk are rendered in the galaxy's own (spinning, inclined) frame so they stay in the
// disk as it turns. Their data positions are world positions at spin 0; convert them to disk-local coordinates.
const toDiskFrame = (galaxyId: string, id: string): CelestialBody => {
  const body = CELESTIAL_BODIES[id];
  const galaxy = CELESTIAL_BODIES[galaxyId];
  const inverse = new THREE.Quaternion().setFromEuler(new THREE.Euler(...getGalaxyDiskRotation(galaxyId))).invert();
  const local = new THREE.Vector3(...body.position).sub(new THREE.Vector3(...galaxy.position)).applyQuaternion(inverse);
  return { ...body, position: [local.x, local.y, local.z] };
};
const ANDROMEDA_DISK_BODIES = {
  ngc_206: toDiskFrame('andromeda_galaxy', 'ngc_206'),
  s_andromedae: toDiskFrame('andromeda_galaxy', 's_andromedae'),
  m31n_2008_12a: toDiskFrame('andromeda_galaxy', 'm31n_2008_12a'),
  ae_andromedae: toDiskFrame('andromeda_galaxy', 'ae_andromedae'),
};
const DISK = {
  ngc_595: toDiskFrame('triangulum_galaxy', 'ngc_595'),
  m33_var_c: toDiskFrame('triangulum_galaxy', 'm33_var_c'),
  ic_133: toDiskFrame('triangulum_galaxy', 'ic_133'),
  ngc_1850: toDiskFrame('large_magellanic_cloud', 'ngc_1850'),
  lmc_n11: toDiskFrame('large_magellanic_cloud', 'lmc_n11'),
  lmc_n49: toDiskFrame('large_magellanic_cloud', 'lmc_n49'),
  lmc_n132d: toDiskFrame('large_magellanic_cloud', 'lmc_n132d'),
  lmc_x1: toDiskFrame('large_magellanic_cloud', 'lmc_x1'),
  psr_b0540_69: toDiskFrame('large_magellanic_cloud', 'psr_b0540_69'),
  ngc_602: toDiskFrame('small_magellanic_cloud', 'ngc_602'),
  snr_1e0102: toDiskFrame('small_magellanic_cloud', 'snr_1e0102'),
  sn_1986g: toDiskFrame('centaurus_a', 'sn_1986g'),
  sn_2014j: toDiskFrame('messier_82', 'sn_2014j'),
  m82_x1: toDiskFrame('messier_82', 'm82_x1'),
  m82_x2: toDiskFrame('messier_82', 'm82_x2'),
  af_andromedae: toDiskFrame('andromeda_galaxy', 'af_andromedae'),
  m31_rv: toDiskFrame('andromeda_galaxy', 'm31_rv'),
  m31_2014_ds1: toDiskFrame('andromeda_galaxy', 'm31_2014_ds1'),
  m33_var_b: toDiskFrame('triangulum_galaxy', 'm33_var_b'),
  ngc_588: toDiskFrame('triangulum_galaxy', 'ngc_588'),
  ngc_592: toDiskFrame('triangulum_galaxy', 'ngc_592'),
  woh_g64: toDiskFrame('large_magellanic_cloud', 'woh_g64'),
  lmc_n44: toDiskFrame('large_magellanic_cloud', 'lmc_n44'),
  lmc_x3: toDiskFrame('large_magellanic_cloud', 'lmc_x3'),
  ngc_330: toDiskFrame('small_magellanic_cloud', 'ngc_330'),
  sn_2016adj: toDiskFrame('centaurus_a', 'sn_2016adj'),
  m82_a1: toDiskFrame('messier_82', 'm82_a1'),
  // Members that used to be drawn fixed in space while the rest of their galaxy turned
  hubble_v1_star: toDiskFrame('andromeda_galaxy', 'hubble_v1_star'),
  pa_99_n2_star: toDiskFrame('andromeda_galaxy', 'pa_99_n2_star'),
  ngc_604_nebula: toDiskFrame('triangulum_galaxy', 'ngc_604_nebula'),
  m33_x7_star: toDiskFrame('triangulum_galaxy', 'm33_x7_star'),
  tarantula_nebula: toDiskFrame('large_magellanic_cloud', 'tarantula_nebula'),
  r136a1: toDiskFrame('large_magellanic_cloud', 'r136a1'),
  s_doradus: toDiskFrame('large_magellanic_cloud', 's_doradus'),
  sn_1987a: toDiskFrame('large_magellanic_cloud', 'sn_1987a'),
  r136_cluster: toDiskFrame('large_magellanic_cloud', 'r136_cluster'),
  hodge_301: toDiskFrame('large_magellanic_cloud', 'hodge_301'),
  vfts_352: toDiskFrame('large_magellanic_cloud', 'vfts_352'),
  ngc_346_nebula: toDiskFrame('small_magellanic_cloud', 'ngc_346_nebula'),
  smc_x1_star: toDiskFrame('small_magellanic_cloud', 'smc_x1_star'),
  hd_5980: toDiskFrame('small_magellanic_cloud', 'hd_5980'),
};

// The Giant Stellar Stream: from the disk edge out into the halo, bending behind the disk
// (world coordinates; its data position is this curve's midpoint)
const GIANT_STREAM_CURVE: [[number, number, number], [number, number, number], [number, number, number]] = [
  [75577, 20353, -60616],
  [76362, 27244, -66535],
  [88946, 26084, -74871],
];

const GalaxyDiskFrame: React.FC<{ galaxyId: string; children: React.ReactNode }> = ({ galaxyId, children }) => {
  const spinRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const galaxy = getCelestialObject(galaxyId);
    if (galaxy && spinRef.current) spinRef.current.rotation.y = galaxy.userData.spin ?? 0;
  });
  // Same nesting as RealisticGalaxy: position -> disk inclination -> spin within the disk plane
  return (
    <group position={CELESTIAL_BODIES[galaxyId].position}>
      <group rotation={getGalaxyDiskRotation(galaxyId)}>
        <group ref={spinRef}>{children}</group>
      </group>
    </group>
  );
};

// Map pins inside another galaxy: a small clickable name tag on every catalogued object (following it as the
// galaxy turns), shown while nothing is selected so you can see where things are and fly to them
const _pinVec = new THREE.Vector3();
const shortName = (name: string) => name.split(' (')[0];

const GalaxyPins: React.FC = () => {
  const insideGalaxyId = useQuantumStore((s) => s.insideGalaxyId);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const language = useQuantumStore((s) => s.language);
  const pinRefs = useRef<Record<string, THREE.Group | null>>({});

  const ids = useMemo(
    () =>
      insideGalaxyId && insideGalaxyId !== 'milky_way_galaxy'
        ? getGalaxyMembers(insideGalaxyId).filter((id) => CELESTIAL_BODIES[id].type !== 'planet')
        : [],
    [insideGalaxyId]
  );

  useFrame(() => {
    for (const id of ids) {
      const pin = pinRefs.current[id];
      if (pin && getCelestialWorldPosition(id, _pinVec)) pin.position.copy(_pinVec);
    }
  });

  if (ids.length === 0 || selectedCosmicBodyId) return null;
  return (
    <>
      {ids.map((id) => {
        const body = CELESTIAL_BODIES[id];
        return (
          <group
            key={id}
            ref={(el) => {
              pinRefs.current[id] = el;
            }}
            position={body.position}
          >
            <Html center>
              <button
                type="button"
                onClick={() => setSelectedCosmicBodyId(id)}
                className="flex items-center gap-1 px-1.5 py-0.5 coarse:px-2.5 coarse:py-1.5 coarse:text-[11px] rounded-full bg-slate-950/70 border border-indigo-400/40 text-[10px] font-semibold text-indigo-100 whitespace-nowrap hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer pointer-events-auto"
                style={{ transform: 'translateY(-14px)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                {shortName(language === 'ar' ? body.nameAr : body.nameEn)}
              </button>
            </Html>
          </group>
        );
      })}
    </>
  );
};

// Detailed star field inside an enterable galaxy: mounted on first approach, faded in as the camera comes inside
// (while RealisticGalaxy fades its far-away look out), co-rotating with the galaxy's disk
const GalaxyInteriorLayer: React.FC<{ galaxyId: string }> = ({ galaxyId }) => {
  const body = CELESTIAL_BODIES[galaxyId];
  const centre = useMemo(() => new THREE.Vector3(...body.position), [body]);
  const fade = useCallback(
    (camera: THREE.Camera) => interiorFade(camera.position.distanceTo(centre), body.size),
    [centre, body.size]
  );
  return (
    <ProximityLod center={body.position} radius={body.size * INTERIOR_START * 1.05}>
      <DistanceFadeGroup fade={fade}>
        <GalaxyDiskFrame galaxyId={galaxyId}>
          <GalaxyInterior body={body} style={GALAXY_INTERIORS[galaxyId]} />
        </GalaxyDiskFrame>
      </DistanceFadeGroup>
    </ProximityLod>
  );
};
const TRIANGULUM_INTERNALS = ['ngc_604_nebula', 'm33_x7_star', 'm33_x7_black_hole', 'ngc_595', 'm33_var_c', 'ic_133', 'm33_var_b', 'ngc_588', 'ngc_592', 'm33_nucleus'];
const LMC_INTERNALS = [
  'tarantula_nebula',
  'r136a1',
  's_doradus',
  'sn_1987a',
  'ngc_1850',
  'lmc_n11',
  'lmc_n49',
  'lmc_n132d',
  'lmc_x1',
  'psr_b0540_69',
  'woh_g64',
  'r136_cluster',
  'hodge_301',
  'lmc_n44',
  'lmc_x3',
  'vfts_352',
];
const SMC_INTERNALS = ['ngc_346_nebula', 'smc_x1_star', 'smc_x1_pulsar', 'ngc_602', 'snr_1e0102', 'hd_5980', 'ngc_330'];
const CEN_A_INTERNALS = ['cen_a_black_hole', 'sn_1986g', 'sn_2016adj'];
const M82_INTERNALS = ['sn_2014j', 'm82_x1', 'm82_x2', 'm82_a1'];
const M87_INTERNALS = ['m87_hst1'];

const _fadeVec = new THREE.Vector3();

// Galaxies fade in while leaving the Milky Way (instead of popping at the scale boundary) but stay solid while
// the camera is right next to them (the LMC and SMC sit close to that boundary)
const galaxyFade = (id: string) => {
  const body = CELESTIAL_BODIES[id];
  const framing = calculateFramingDistance(id);
  return (camera: THREE.Camera) => {
    const fromHome = THREE.MathUtils.smoothstep(camera.position.length(), GALAXIES_FADE_START, GALAXIES_FADE_FULL);
    if (fromHome >= 1 || !body) return fromHome;
    const d = camera.position.distanceTo(_fadeVec.set(...body.position));
    return Math.max(fromHome, 1 - THREE.MathUtils.smoothstep(d, framing * 1.25, framing * 2));
  };
};

const FADE_MILKY_WAY_STAND_IN = (camera: THREE.Camera) =>
  THREE.MathUtils.smoothstep(camera.position.length(), MILKY_WAY_CROSSFADE_START, MILKY_WAY_CROSSFADE_END);
const FADE_ANDROMEDA = galaxyFade('andromeda_galaxy');
const FADE_TRIANGULUM = galaxyFade('triangulum_galaxy');
const FADE_LMC = galaxyFade('large_magellanic_cloud');
const FADE_SMC = galaxyFade('small_magellanic_cloud');
const FADE_CENTAURUS_A = galaxyFade('centaurus_a');
const FADE_M82 = galaxyFade('messier_82');
const FADE_M87 = galaxyFade('m87_black_hole');

// M87* Supermassive Black Hole with 5,000-ly Relativistic Plasma Jet (Size 5,000)
const M87SupermassiveBlackHole: React.FC<{
  body: CelestialBody;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}> = ({ body, isSelected, onSelect, language }) => {
  return (
    <RealisticBlackHole
      body={body}
      shadowRadius={body.size * 0.45}
      innerDiskRadius={body.size * 0.52}
      outerDiskRadius={body.size * 1.55}
      colorCore="#ffedd5"
      colorMid="#ea580c"
      colorOuter="#431407"
      accretionTilt={[-Math.PI / 4, Math.PI / 6, 0]}
      spinSpeed={1.0}
      dopplerStrength={1.35}
      hasLensingHalo={true}
      hasJet={true}
      jetProps={{
        length: body.size * 5.2,
        radius: body.size * 0.38,
        color: '#38bdf8',
        knotColor: '#ffffff',
        speed: 1.5,
        knotFrequency: 3.5,
        tilt: M87_JET_TILT,
      }}
      isSelected={isSelected}
      onSelect={onSelect}
      language={language}
    />
  );
};

const noRaycast = () => null;

function seededRandom(seed: number) {
  let h = seed >>> 0;
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    h = (h + 0x6d2b79f5) >>> 0;
    return h / 4294967296;
  };
}

// Messier 87 itself: a giant, nearly round (E0–E1) elliptical galaxy of old yellow stars whose light falls off with
// radius as a de Vaucouleurs (r^1/4) profile, wrapped in ~12,000 globular clusters. Its one-sided jet (the
// counter-jet is Doppler-dimmed out of view) shows a chain of bright knots — HST-1, D, E, F, I, A, B, C.
const M87_JET_TILT: [number, number, number] = [Math.PI / 4, Math.PI / 4, 0];
const M87_JET_KNOTS: [number, number][] = [
  [0.46, 0.55], // D
  [0.53, 0.4], // E
  [0.6, 0.5], // F
  [0.7, 0.45], // I
  [0.8, 1.0], // A (brightest)
  [0.86, 0.75], // B
  [0.94, 0.5], // C
];

const M87GiantElliptical: React.FC<{ body: CelestialBody; glowTexture?: THREE.CanvasTexture }> = ({ body, glowTexture }) => {
  const R = body.size * 5;
  const jetLength = body.size * 5.2;
  const stars = useMemo(() => {
    const rand = seededRandom(87);
    const n = scaledCount(9000, 0.45);
    const gcs = scaledCount(1400, 0.5);
    const pos = new Float32Array((n + gcs) * 3);
    const col = new Float32Array((n + gcs) * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n + gcs; i++) {
      const gc = i >= n;
      // Stars: steep, r^1/4-like concentration; globular clusters: a much more extended halo
      const r = gc ? R * (0.15 + 1.1 * Math.pow(rand(), 0.8)) : R * Math.pow(rand(), 3.2) * 1.3;
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const sn = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(a) * sn * r;
      pos[i * 3 + 1] = u * r * 0.88;
      pos[i * 3 + 2] = Math.sin(a) * sn * r;
      c.set(gc ? '#fde68a' : rand() < 0.6 ? '#ffe7b3' : '#ffd29a');
      if (gc) c.multiplyScalar(0.8);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { pos, col };
  }, [R]);

  return (
    <group position={body.position}>
      {/* Diffuse starlight: a bright compact core and a wide faint envelope */}
      <sprite scale={[R * 1.1, R * 1.0, 1]} raycast={noRaycast}>
        <spriteMaterial map={getCoronaTexture()} color="#ffdca0" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[R * 2.6, R * 2.4, 1]} raycast={noRaycast}>
        <spriteMaterial map={getCoronaTexture()} color="#b88a50" transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <points raycast={noRaycast}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[stars.col, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={softenPointSprites}
          size={body.size * 0.09}
          map={glowTexture ?? getCoronaTexture()}
          vertexColors
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      {/* Knots along the jet */}
      <group rotation={M87_JET_TILT}>
        {M87_JET_KNOTS.map(([f, b], i) => (
          <sprite key={i} position={[0, f * jetLength, 0]} scale={[body.size * (0.5 + 0.5 * b), body.size * (0.5 + 0.5 * b), 1]} raycast={noRaycast}>
            <spriteMaterial map={getCoronaTexture()} color="#bfdbfe" transparent opacity={0.45 + 0.4 * b} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
      </group>
    </group>
  );
};

export const ExtragalacticScene: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const highlightedCosmicElementNum = useQuantumStore((s) => s.highlightedCosmicElementNum);

  // Available from the first frame (a points material compiled without its map draws squares)
  const [glowTexture, setGlowTexture] = useState<THREE.CanvasTexture | undefined>(() => getGlowPointTexture());
  const groupRef = useRef<THREE.Group>(null);
  const r136a1ObjRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    setGlowTexture(getGlowPointTexture());
  }, []);

  // R136a1 is inlined inside the LMC LoD group (mounted lazily), so it registers via a callback ref
  const registerR136a1 = useCallback((obj: THREE.Group | null) => {
    if (obj) registerCelestialObject('r136a1', obj);
    else if (r136a1ObjRef.current) unregisterCelestialObject('r136a1', r136a1ObjRef.current);
    r136a1ObjRef.current = obj;
  }, []);

  const isHighlighted = (body?: CelestialBody) =>
    body !== undefined &&
    highlightedCosmicElementNum !== null &&
    body.primaryElements.some((e) => e.atomicNumber === highlightedCosmicElementNum);

  const isSelectedIn = (ids: string[]) => !!selectedCosmicBodyId && ids.includes(selectedCosmicBodyId);

  return (
    <group ref={groupRef}>
      <GalaxyPins />

      {/* ==================================================== */}
      {/* 0. MILKY WAY GALAXY (Our Home Galaxy, centred on Sgr A*) */}
      {/* ==================================================== */}
      {CELESTIAL_BODIES.milky_way_galaxy && (
        // Stand-in for the detailed scale-3 Milky Way, cross-faded with it by distance
        <DistanceFadeGroup fade={FADE_MILKY_WAY_STAND_IN}>
          <RealisticGalaxy
            body={CELESTIAL_BODIES.milky_way_galaxy}
            morphology="spiral"
            isSelected={selectedCosmicBodyId === 'milky_way_galaxy'}
            onSelect={() => setSelectedCosmicBodyId('milky_way_galaxy')}
            language={language}
            icon="🌌"
            badgeLabel={language === 'ar' ? 'مجرتنا الأم' : 'Our Home Galaxy'}
            glowTexture={glowTexture}
          />
        </DistanceFadeGroup>
      )}

      {/* ==================================================== */}
      {/* 1. ANDROMEDA GALAXY (M31) & INTERNAL SYSTEMS */}
      {/* ==================================================== */}
      <DistanceFadeGroup fade={FADE_ANDROMEDA}>
        <GalaxyInteriorLayer galaxyId="andromeda_galaxy" />
        {CELESTIAL_BODIES.andromeda_galaxy && (
          <RealisticGalaxy
            body={CELESTIAL_BODIES.andromeda_galaxy}
            morphology="spiral"
            isSelected={selectedCosmicBodyId === 'andromeda_galaxy'}
            onSelect={() => setSelectedCosmicBodyId('andromeda_galaxy')}
            language={language}
            icon="🌀"
            badgeLabel="1 Trillion Stars"
            glowTexture={glowTexture}
          />
        )}

        {/* Andromeda Internal Sub-Systems (distance LoD: shown within 45,000 units of the galaxy or while one of them is selected) */}
        <ProximityLod center={CELESTIAL_BODIES.andromeda_galaxy.position} radius={45000} forceActive={isSelectedIn(ANDROMEDA_INTERNALS)}>
          {/* M31* Core Supermassive Black Hole & Double Nucleus */}
          {CELESTIAL_BODIES.andromeda_core_black_hole && (
            <M31CoreBlackHoleSystem
              body={CELESTIAL_BODIES.andromeda_core_black_hole}
              isSelected={selectedCosmicBodyId === 'andromeda_core_black_hole'}
              onSelect={() => setSelectedCosmicBodyId('andromeda_core_black_hole')}
              language={language}
            />
          )}

          {/* Hubble's Variable V1 (Historic Cepheid), a disk star: turns with M31 */}
          {CELESTIAL_BODIES.hubble_v1_star && (
            <GalaxyDiskFrame galaxyId="andromeda_galaxy">
            <HubbleV1Cepheid
              body={DISK.hubble_v1_star}
              isSelected={selectedCosmicBodyId === 'hubble_v1_star'}
              onSelect={() => setSelectedCosmicBodyId('hubble_v1_star')}
              language={language}
            />
            </GalaxyDiskFrame>
          )}

          {/* Mayall II (G1 - Titan Globular Cluster) */}
          {CELESTIAL_BODIES.mayall_ii_cluster && (
            <MayallIIGlobularCluster
              body={CELESTIAL_BODIES.mayall_ii_cluster}
              isSelected={selectedCosmicBodyId === 'mayall_ii_cluster'}
              onSelect={() => setSelectedCosmicBodyId('mayall_ii_cluster')}
              language={language}
            />
          )}

          {/* PA-99-N2 Extragalactic Exoplanet & Red Giant Star */}
          {CELESTIAL_BODIES.pa_99_n2_star && CELESTIAL_BODIES.pa_99_n2_planet && (
            <GalaxyDiskFrame galaxyId="andromeda_galaxy">
            <PA99N2ExoplanetSystem
              star={DISK.pa_99_n2_star}
              planet={CELESTIAL_BODIES.pa_99_n2_planet}
              selectedId={selectedCosmicBodyId}
              onSelect={(id) => setSelectedCosmicBodyId(id)}
              language={language}
            />
            </GalaxyDiskFrame>
          )}

          {/* Objects inside M31's disk turn with the (spinning) galaxy */}
          <GalaxyDiskFrame galaxyId="andromeda_galaxy">
            {/* NGC 206 — the great star cloud of the southwestern disk */}
            <StarCloud
              body={ANDROMEDA_DISK_BODIES.ngc_206}
              isSelected={selectedCosmicBodyId === 'ngc_206'}
              onSelect={() => setSelectedCosmicBodyId('ngc_206')}
              language={language}
              badge="~4,000 ly star cloud"
            />

            {/* S Andromedae (SN 1885A) — remnant next to the nucleus */}
            <RealisticSupernova
              body={ANDROMEDA_DISK_BODIES.s_andromedae}
              isSelected={selectedCosmicBodyId === 's_andromedae'}
              isHighlighted={isHighlighted(ANDROMEDA_DISK_BODIES.s_andromedae)}
              onSelect={() => setSelectedCosmicBodyId('s_andromedae')}
              language={language}
              icon="💥"
            />

            {/* M31N 2008-12a — the annual recurrent nova */}
            <RecurrentNovaSystem
              body={ANDROMEDA_DISK_BODIES.m31n_2008_12a}
              isSelected={selectedCosmicBodyId === 'm31n_2008_12a'}
              onSelect={() => setSelectedCosmicBodyId('m31n_2008_12a')}
              language={language}
            />

            {/* AE Andromedae — luminous blue variable (Hubble–Sandage variable) */}
            <SDoradusHypergiant
              body={ANDROMEDA_DISK_BODIES.ae_andromedae}
              isSelected={selectedCosmicBodyId === 'ae_andromedae'}
              onSelect={() => setSelectedCosmicBodyId('ae_andromedae')}
              language={language}
              badge="LBV · Hubble–Sandage 1953"
            />
            <SDoradusHypergiant
              body={DISK.af_andromedae}
              isSelected={selectedCosmicBodyId === 'af_andromedae'}
              onSelect={() => setSelectedCosmicBodyId('af_andromedae')}
              language={language}
              badge="LBV · Hubble–Sandage 1953"
            />
            <CatalogStar
              body={DISK.m31_rv}
              isSelected={selectedCosmicBodyId === 'm31_rv'}
              onSelect={() => setSelectedCosmicBodyId('m31_rv')}
              language={language}
              badge="Red nova · 1988"
            />
            <CatalogStar
              body={DISK.m31_2014_ds1}
              isSelected={selectedCosmicBodyId === 'm31_2014_ds1'}
              onSelect={() => setSelectedCosmicBodyId('m31_2014_ds1')}
              language={language}
              badge="Vanished · failed supernova?"
              dustShell
            />
          </GalaxyDiskFrame>

          {/* NGC 147 & NGC 185 — dwarf satellites well outside the disk */}
          <RealisticGalaxy
            body={CELESTIAL_BODIES.ngc_147}
            morphology="dwarf_elliptical"
            isSelected={selectedCosmicBodyId === 'ngc_147'}
            onSelect={() => setSelectedCosmicBodyId('ngc_147')}
            language={language}
            icon="🟤"
            badgeLabel="Dwarf satellite · 1829"
            glowTexture={glowTexture}
          />
          <RealisticGalaxy
            body={CELESTIAL_BODIES.ngc_185}
            morphology="dwarf_elliptical"
            isSelected={selectedCosmicBodyId === 'ngc_185'}
            onSelect={() => setSelectedCosmicBodyId('ngc_185')}
            language={language}
            icon="🟤"
            badgeLabel="Dwarf satellite · 1787"
            glowTexture={glowTexture}
          />

          {/* M32 — compact elliptical satellite, in front of the disk */}
          <RealisticGalaxy
            body={CELESTIAL_BODIES.messier_32}
            morphology="dwarf_elliptical"
            isSelected={selectedCosmicBodyId === 'messier_32'}
            onSelect={() => setSelectedCosmicBodyId('messier_32')}
            language={language}
            icon="🟡"
            badgeLabel="Compact elliptical satellite"
            glowTexture={glowTexture}
          />

          {/* M110 — dwarf elliptical satellite, behind the disk */}
          <RealisticGalaxy
            body={CELESTIAL_BODIES.messier_110}
            morphology="dwarf_elliptical"
            isSelected={selectedCosmicBodyId === 'messier_110'}
            onSelect={() => setSelectedCosmicBodyId('messier_110')}
            language={language}
            icon="🟠"
            badgeLabel="Dwarf elliptical satellite"
            glowTexture={glowTexture}
          />

        </ProximityLod>

        {/* Giant Stellar Stream — tidal debris arcing out through the halo. It spans ~20,000 units, so it is
            shown with the galaxy itself rather than with the close-up sub-systems */}
        <GiantStellarStream
          body={CELESTIAL_BODIES.andromeda_giant_stream}
          curve={GIANT_STREAM_CURVE}
          isSelected={selectedCosmicBodyId === 'andromeda_giant_stream'}
          onSelect={() => setSelectedCosmicBodyId('andromeda_giant_stream')}
          language={language}
        />
      </DistanceFadeGroup>

      {/* ==================================================== */}
      {/* 2. TRIANGULUM GALAXY (M33) & INTERNAL SYSTEMS */}
      {/* ==================================================== */}
      <DistanceFadeGroup fade={FADE_TRIANGULUM}>
        <GalaxyInteriorLayer galaxyId="triangulum_galaxy" />
        {CELESTIAL_BODIES.triangulum_galaxy && (
          <RealisticGalaxy
            body={CELESTIAL_BODIES.triangulum_galaxy}
            morphology="flocculent"
            isSelected={selectedCosmicBodyId === 'triangulum_galaxy'}
            onSelect={() => setSelectedCosmicBodyId('triangulum_galaxy')}
            language={language}
            icon="🌀"
            badgeLabel="40 Billion Stars"
            glowTexture={glowTexture}
          />
        )}

        {/* Triangulum Internal Sub-Systems (distance LoD: within 30,000 units or selected) */}
        <ProximityLod center={CELESTIAL_BODIES.triangulum_galaxy.position} radius={30000} forceActive={isSelectedIn(TRIANGULUM_INTERNALS)}>
          {/* NGC 604 Giant Starburst Nursery and M33 X-7: in the disk, turning with it */}
          <GalaxyDiskFrame galaxyId="triangulum_galaxy">
          {CELESTIAL_BODIES.ngc_604_nebula && (
            <RealisticNebula
              body={DISK.ngc_604_nebula}
              isSelected={selectedCosmicBodyId === 'ngc_604_nebula'}
              isHighlighted={isHighlighted(CELESTIAL_BODIES.ngc_604_nebula)}
              onSelect={() => setSelectedCosmicBodyId('ngc_604_nebula')}
              language={language}
              icon="✨"
            />
          )}

          {/* M33 X-7 Black Hole & Blue Supergiant Binary */}
          {CELESTIAL_BODIES.m33_x7_star && CELESTIAL_BODIES.m33_x7_black_hole && (
            <M33X7BinarySystem
              star={DISK.m33_x7_star}
              blackHole={CELESTIAL_BODIES.m33_x7_black_hole}
              selectedId={selectedCosmicBodyId}
              onSelect={(id) => setSelectedCosmicBodyId(id)}
              language={language}
            />
          )}
          </GalaxyDiskFrame>

          {/* Documented objects in M33's disk (co-rotating with the galaxy) */}
          <GalaxyDiskFrame galaxyId="triangulum_galaxy">
            <RealisticNebula
              body={DISK.ngc_595}
              isSelected={selectedCosmicBodyId === 'ngc_595'}
              isHighlighted={isHighlighted(DISK.ngc_595)}
              onSelect={() => setSelectedCosmicBodyId('ngc_595')}
              language={language}
              icon="🌸"
            />
            <SDoradusHypergiant
              body={DISK.m33_var_c}
              isSelected={selectedCosmicBodyId === 'm33_var_c'}
              onSelect={() => setSelectedCosmicBodyId('m33_var_c')}
              language={language}
              badge="LBV · Hubble–Sandage 1953"
            />
            <RealisticNebula
              body={DISK.ic_133}
              isSelected={selectedCosmicBodyId === 'ic_133'}
              isHighlighted={isHighlighted(DISK.ic_133)}
              onSelect={() => setSelectedCosmicBodyId('ic_133')}
              language={language}
              icon="💧"
            />
            <SDoradusHypergiant
              body={DISK.m33_var_b}
              isSelected={selectedCosmicBodyId === 'm33_var_b'}
              onSelect={() => setSelectedCosmicBodyId('m33_var_b')}
              language={language}
              badge="LBV · Hubble–Sandage 1953"
            />
            <RealisticNebula
              body={DISK.ngc_588}
              isSelected={selectedCosmicBodyId === 'ngc_588'}
              isHighlighted={isHighlighted(DISK.ngc_588)}
              onSelect={() => setSelectedCosmicBodyId('ngc_588')}
              language={language}
              icon="🌸"
            />
            <RealisticNebula
              body={DISK.ngc_592}
              isSelected={selectedCosmicBodyId === 'ngc_592'}
              isHighlighted={isHighlighted(DISK.ngc_592)}
              onSelect={() => setSelectedCosmicBodyId('ngc_592')}
              language={language}
              icon="🌸"
            />
          </GalaxyDiskFrame>

          {/* M33's nucleus: a dense star cluster with no supermassive black hole */}
          <StarCloud
            body={CELESTIAL_BODIES.m33_nucleus}
            isSelected={selectedCosmicBodyId === 'm33_nucleus'}
            onSelect={() => setSelectedCosmicBodyId('m33_nucleus')}
            language={language}
            badge="No giant black hole"
            palette={['#fef3c7', '#fde68a']}
          />
        </ProximityLod>
      </DistanceFadeGroup>

      {/* ==================================================== */}
      {/* 3. LARGE MAGELLANIC CLOUD (LMC) & INTERNAL SYSTEMS */}
      {/* ==================================================== */}
      <DistanceFadeGroup fade={FADE_LMC}>
        <GalaxyInteriorLayer galaxyId="large_magellanic_cloud" />
        {CELESTIAL_BODIES.large_magellanic_cloud && (
          <RealisticGalaxy
            body={CELESTIAL_BODIES.large_magellanic_cloud}
            morphology="dwarf_irregular"
            isSelected={selectedCosmicBodyId === 'large_magellanic_cloud'}
            onSelect={() => setSelectedCosmicBodyId('large_magellanic_cloud')}
            language={language}
            icon="✨"
            badgeLabel="Satellite Dwarf"
            glowTexture={glowTexture}
          />
        )}

        {/* LMC Internal Sub-Systems (distance LoD: within 26,000 units or selected) */}
        <ProximityLod center={CELESTIAL_BODIES.large_magellanic_cloud.position} radius={26000} forceActive={isSelectedIn(LMC_INTERNALS)}>
          {/* The Tarantula region, in the LMC's disk and turning with it */}
          <GalaxyDiskFrame galaxyId="large_magellanic_cloud">
          {/* Tarantula Nebula (30 Doradus) */}
          {CELESTIAL_BODIES.tarantula_nebula && (
            <RealisticNebula
              body={DISK.tarantula_nebula}
              isSelected={selectedCosmicBodyId === 'tarantula_nebula'}
              isHighlighted={isHighlighted(CELESTIAL_BODIES.tarantula_nebula)}
              onSelect={() => setSelectedCosmicBodyId('tarantula_nebula')}
              language={language}
              icon="🕷️"
            />
          )}

          {/* R136a1 Hypermassive Monster Star (Inside Tarantula Nebula) */}
          {CELESTIAL_BODIES.r136a1 && (
            <group
              ref={registerR136a1}
              position={DISK.r136a1.position}
              onClick={(e) => {
                if (e.delta && e.delta > 5) return;
                e.stopPropagation();
                setSelectedCosmicBodyId('r136a1');
              }}
            >
              <PooledPointLight color="#60a5fa" intensity={8.0} distance={CELESTIAL_BODIES.r136a1.size * 8} />
              {/* The most massive star known: a ~46,000 K Wolf–Rayet-like giant, blue-white and blinding */}
              <StarBody radius={CELESTIAL_BODIES.r136a1.size} kelvin={46000} brightness={2.2} spots={0} glowScale={3.0} glowOpacity={0.7} />
              {/* Its fierce stellar wind and the crowded glow of the R136 cluster around it */}
              <sprite scale={[CELESTIAL_BODIES.r136a1.size * 9, CELESTIAL_BODIES.r136a1.size * 9, 1]} raycast={noRaycast}>
                <spriteMaterial map={getCoronaTexture()} color="#a5c8ff" transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
              </sprite>
              {selectedCosmicBodyId === 'r136a1' && (
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry
                    args={[CELESTIAL_BODIES.r136a1.size * 1.4, CELESTIAL_BODIES.r136a1.size * 1.435, 128]}
                  />
                  <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
                </mesh>
              )}
            </group>
          )}

          {/* S Doradus Prototype LBV Hypergiant */}
          {CELESTIAL_BODIES.s_doradus && (
            <SDoradusHypergiant
              body={DISK.s_doradus}
              isSelected={selectedCosmicBodyId === 's_doradus'}
              onSelect={() => setSelectedCosmicBodyId('s_doradus')}
              language={language}
            />
          )}

          {/* Supernova 1987A (Circumstellar Pearl Collision Ring in LMC) */}
          {CELESTIAL_BODIES.sn_1987a && (
            <RealisticSupernova
              body={DISK.sn_1987a}
              isSelected={selectedCosmicBodyId === 'sn_1987a'}
              isHighlighted={isHighlighted(CELESTIAL_BODIES.sn_1987a)}
              onSelect={() => setSelectedCosmicBodyId('sn_1987a')}
              language={language}
              icon="💥"
            />
          )}
          </GalaxyDiskFrame>

          {/* Documented objects in the LMC (co-rotating with the galaxy) */}
          <GalaxyDiskFrame galaxyId="large_magellanic_cloud">
            <StarCloud
              body={DISK.ngc_1850}
              isSelected={selectedCosmicBodyId === 'ngc_1850'}
              onSelect={() => setSelectedCosmicBodyId('ngc_1850')}
              language={language}
              badge="Young double cluster"
              palette={['#fef3c7', '#bfdbfe']}
            />
            <RealisticNebula
              body={DISK.lmc_n11}
              isSelected={selectedCosmicBodyId === 'lmc_n11'}
              isHighlighted={isHighlighted(DISK.lmc_n11)}
              onSelect={() => setSelectedCosmicBodyId('lmc_n11')}
              language={language}
              icon="🌺"
            />
            <RealisticSupernova
              body={DISK.lmc_n49}
              isSelected={selectedCosmicBodyId === 'lmc_n49'}
              isHighlighted={isHighlighted(DISK.lmc_n49)}
              onSelect={() => setSelectedCosmicBodyId('lmc_n49')}
              language={language}
              icon="🧲"
            />
            <RealisticSupernova
              body={DISK.lmc_n132d}
              isSelected={selectedCosmicBodyId === 'lmc_n132d'}
              isHighlighted={isHighlighted(DISK.lmc_n132d)}
              onSelect={() => setSelectedCosmicBodyId('lmc_n132d')}
              language={language}
              icon="💥"
            />
            <RealisticBlackHole
              body={DISK.lmc_x1}
              shadowRadius={DISK.lmc_x1.size * 0.3}
              innerDiskRadius={DISK.lmc_x1.size * 0.4}
              outerDiskRadius={DISK.lmc_x1.size * 1.3}
              colorCore="#e0e7ff"
              colorMid="#818cf8"
              colorOuter="#312e81"
              hasDonorStream
              isSelected={selectedCosmicBodyId === 'lmc_x1'}
              isHighlighted={isHighlighted(DISK.lmc_x1)}
              onSelect={() => setSelectedCosmicBodyId('lmc_x1')}
              language={language}
            />
            <RealisticPulsar
              body={DISK.psr_b0540_69}
              spinFrequency={4}
              beamLength={DISK.psr_b0540_69.size * 5}
              beamRadius={DISK.psr_b0540_69.size * 0.35}
              isSelected={selectedCosmicBodyId === 'psr_b0540_69'}
              isHighlighted={isHighlighted(DISK.psr_b0540_69)}
              onSelect={() => setSelectedCosmicBodyId('psr_b0540_69')}
              language={language}
            />
            <CatalogStar
              body={DISK.woh_g64}
              isSelected={selectedCosmicBodyId === 'woh_g64'}
              onSelect={() => setSelectedCosmicBodyId('woh_g64')}
              language={language}
              badge="First close-up of an extragalactic star"
              dustShell
            />
            <RealisticNebula
              body={DISK.lmc_n44}
              isSelected={selectedCosmicBodyId === 'lmc_n44'}
              isHighlighted={isHighlighted(DISK.lmc_n44)}
              onSelect={() => setSelectedCosmicBodyId('lmc_n44')}
              language={language}
              icon="🫧"
            />
            <RealisticBlackHole
              body={DISK.lmc_x3}
              shadowRadius={DISK.lmc_x3.size * 0.3}
              innerDiskRadius={DISK.lmc_x3.size * 0.4}
              outerDiskRadius={DISK.lmc_x3.size * 1.3}
              colorCore="#e0e7ff"
              colorMid="#818cf8"
              colorOuter="#312e81"
              hasDonorStream
              isSelected={selectedCosmicBodyId === 'lmc_x3'}
              isHighlighted={isHighlighted(DISK.lmc_x3)}
              onSelect={() => setSelectedCosmicBodyId('lmc_x3')}
              language={language}
            />
          </GalaxyDiskFrame>

          {/* Tarantula region: R136, Hodge 301 and VFTS 352 around the nebula */}
          <GalaxyDiskFrame galaxyId="large_magellanic_cloud">
          <StarCloud
            body={DISK.r136_cluster}
            isSelected={selectedCosmicBodyId === 'r136_cluster'}
            onSelect={() => setSelectedCosmicBodyId('r136_cluster')}
            language={language}
            badge="Most massive stars known"
            palette={['#dbeafe', '#ffffff']}
          />
          <StarCloud
            body={DISK.hodge_301}
            isSelected={selectedCosmicBodyId === 'hodge_301'}
            onSelect={() => setSelectedCosmicBodyId('hodge_301')}
            language={language}
            badge="~20–25 million years old"
            palette={['#fde68a', '#fca5a5']}
          />
          <CatalogStar
            body={DISK.vfts_352}
            isSelected={selectedCosmicBodyId === 'vfts_352'}
            onSelect={() => setSelectedCosmicBodyId('vfts_352')}
            language={language}
            badge="Touching twin stars"
            contactBinary
          />
          </GalaxyDiskFrame>
        </ProximityLod>
      </DistanceFadeGroup>

      {/* ==================================================== */}
      {/* 4. SMALL MAGELLANIC CLOUD (SMC) & INTERNAL SYSTEMS */}
      {/* ==================================================== */}
      <DistanceFadeGroup fade={FADE_SMC}>
        <GalaxyInteriorLayer galaxyId="small_magellanic_cloud" />
        {CELESTIAL_BODIES.small_magellanic_cloud && (
          <RealisticGalaxy
            body={CELESTIAL_BODIES.small_magellanic_cloud}
            morphology="dwarf_irregular"
            isSelected={selectedCosmicBodyId === 'small_magellanic_cloud'}
            onSelect={() => setSelectedCosmicBodyId('small_magellanic_cloud')}
            language={language}
            icon="✨"
            badgeLabel="SMC Dwarf"
            glowTexture={glowTexture}
          />
        )}

        {/* SMC Internal Sub-Systems (distance LoD: within 22,000 units or selected) */}
        <ProximityLod center={CELESTIAL_BODIES.small_magellanic_cloud.position} radius={22000} forceActive={isSelectedIn(SMC_INTERNALS)}>
          {/* NGC 346 Starburst Nursery and SMC X-1, in the SMC's body and turning with it */}
          <GalaxyDiskFrame galaxyId="small_magellanic_cloud">
          {CELESTIAL_BODIES.ngc_346_nebula && (
            <RealisticNebula
              body={DISK.ngc_346_nebula}
              isSelected={selectedCosmicBodyId === 'ngc_346_nebula'}
              isHighlighted={isHighlighted(CELESTIAL_BODIES.ngc_346_nebula)}
              onSelect={() => setSelectedCosmicBodyId('ngc_346_nebula')}
              language={language}
              icon="🌟"
            />
          )}

          {/* SMC X-1 High-Mass X-Ray Pulsar Binary */}
          {CELESTIAL_BODIES.smc_x1_star && CELESTIAL_BODIES.smc_x1_pulsar && (
            <SMCX1PulsarSystem
              star={DISK.smc_x1_star}
              pulsar={CELESTIAL_BODIES.smc_x1_pulsar}
              selectedId={selectedCosmicBodyId}
              onSelect={(id) => setSelectedCosmicBodyId(id)}
              language={language}
            />
          )}
          </GalaxyDiskFrame>

          {/* Documented objects in the SMC (co-rotating with the galaxy) */}
          <GalaxyDiskFrame galaxyId="small_magellanic_cloud">
            <StarCloud
              body={DISK.ngc_602}
              isSelected={selectedCosmicBodyId === 'ngc_602'}
              onSelect={() => setSelectedCosmicBodyId('ngc_602')}
              language={language}
              badge="A few million years young"
            />
            <RealisticSupernova
              body={DISK.snr_1e0102}
              isSelected={selectedCosmicBodyId === 'snr_1e0102'}
              isHighlighted={isHighlighted(DISK.snr_1e0102)}
              onSelect={() => setSelectedCosmicBodyId('snr_1e0102')}
              language={language}
              icon="💥"
            />
            <StarCloud
              body={DISK.ngc_330}
              isSelected={selectedCosmicBodyId === 'ngc_330'}
              onSelect={() => setSelectedCosmicBodyId('ngc_330')}
              language={language}
              badge="Young massive cluster"
              palette={['#dbeafe', '#fca5a5']}
            />
          </GalaxyDiskFrame>

          {/* HD 5980, next to NGC 346 */}
          <GalaxyDiskFrame galaxyId="small_magellanic_cloud">
          <CatalogStar
            body={DISK.hd_5980}
            isSelected={selectedCosmicBodyId === 'hd_5980'}
            onSelect={() => setSelectedCosmicBodyId('hd_5980')}
            language={language}
            badge="Erupted 1993–94"
          />
          </GalaxyDiskFrame>
        </ProximityLod>
      </DistanceFadeGroup>

      {/* ==================================================== */}
      {/* 5. NEAR ACTIVE & STARBURST GALAXIES */}
      {/* ==================================================== */}
      {/* Centaurus A (NGC 5128 Active Galaxy with 1M-ly Jets) */}
      <DistanceFadeGroup fade={FADE_CENTAURUS_A}>
        <GalaxyInteriorLayer galaxyId="centaurus_a" />
        {CELESTIAL_BODIES.centaurus_a && (
          <RealisticGalaxy
            body={CELESTIAL_BODIES.centaurus_a}
            morphology="active_elliptical"
            isSelected={selectedCosmicBodyId === 'centaurus_a'}
            onSelect={() => setSelectedCosmicBodyId('centaurus_a')}
            language={language}
            icon="⚡"
            badgeLabel="1M-ly Jets"
            glowTexture={glowTexture}
          />
        )}
        {/* Documented objects in Centaurus A (distance LoD, like the Local Group galaxies) */}
        <ProximityLod center={CELESTIAL_BODIES.centaurus_a.position} radius={40000} forceActive={isSelectedIn(CEN_A_INTERNALS)}>
          <RealisticBlackHole
            body={CELESTIAL_BODIES.cen_a_black_hole}
            shadowRadius={CELESTIAL_BODIES.cen_a_black_hole.size * 0.4}
            innerDiskRadius={CELESTIAL_BODIES.cen_a_black_hole.size * 0.5}
            outerDiskRadius={CELESTIAL_BODIES.cen_a_black_hole.size * 1.6}
            colorCore="#fff7ed"
            colorMid="#f59e0b"
            colorOuter="#451a03"
            isSelected={selectedCosmicBodyId === 'cen_a_black_hole'}
            isHighlighted={isHighlighted(CELESTIAL_BODIES.cen_a_black_hole)}
            onSelect={() => setSelectedCosmicBodyId('cen_a_black_hole')}
            language={language}
          />
          <GalaxyDiskFrame galaxyId="centaurus_a">
            <RealisticSupernova
              body={DISK.sn_1986g}
              isSelected={selectedCosmicBodyId === 'sn_1986g'}
              isHighlighted={isHighlighted(DISK.sn_1986g)}
              onSelect={() => setSelectedCosmicBodyId('sn_1986g')}
              language={language}
              icon="💥"
            />
            <RealisticSupernova
              body={DISK.sn_2016adj}
              isSelected={selectedCosmicBodyId === 'sn_2016adj'}
              isHighlighted={isHighlighted(DISK.sn_2016adj)}
              onSelect={() => setSelectedCosmicBodyId('sn_2016adj')}
              language={language}
              icon="💥"
            />
          </GalaxyDiskFrame>
        </ProximityLod>
      </DistanceFadeGroup>

      {/* Messier 82 (Cigar Galaxy - Superwind Starburst Chimneys) */}
      <DistanceFadeGroup fade={FADE_M82}>
        <GalaxyInteriorLayer galaxyId="messier_82" />
        {CELESTIAL_BODIES.messier_82 && (
          <RealisticGalaxy
            body={CELESTIAL_BODIES.messier_82}
            morphology="starburst"
            isSelected={selectedCosmicBodyId === 'messier_82'}
            onSelect={() => setSelectedCosmicBodyId('messier_82')}
            language={language}
            icon="🔥"
            badgeLabel="Starburst Superwinds"
            glowTexture={glowTexture}
          />
        )}
        {/* Documented objects in M82 (distance LoD, co-rotating with the galaxy) */}
        <ProximityLod center={CELESTIAL_BODIES.messier_82.position} radius={35000} forceActive={isSelectedIn(M82_INTERNALS)}>
          <GalaxyDiskFrame galaxyId="messier_82">
            <RealisticSupernova
              body={DISK.sn_2014j}
              isSelected={selectedCosmicBodyId === 'sn_2014j'}
              isHighlighted={isHighlighted(DISK.sn_2014j)}
              onSelect={() => setSelectedCosmicBodyId('sn_2014j')}
              language={language}
              icon="💥"
            />
            <RealisticBlackHole
              body={DISK.m82_x1}
              shadowRadius={DISK.m82_x1.size * 0.3}
              innerDiskRadius={DISK.m82_x1.size * 0.4}
              outerDiskRadius={DISK.m82_x1.size * 1.4}
              colorCore="#f5f3ff"
              colorMid="#a78bfa"
              colorOuter="#3b0764"
              isSelected={selectedCosmicBodyId === 'm82_x1'}
              isHighlighted={isHighlighted(DISK.m82_x1)}
              onSelect={() => setSelectedCosmicBodyId('m82_x1')}
              language={language}
            />
            <RealisticPulsar
              body={DISK.m82_x2}
              spinFrequency={1.2}
              beamLength={DISK.m82_x2.size * 5}
              beamRadius={DISK.m82_x2.size * 0.35}
              coreColor="#e9d5ff"
              isSelected={selectedCosmicBodyId === 'm82_x2'}
              isHighlighted={isHighlighted(DISK.m82_x2)}
              onSelect={() => setSelectedCosmicBodyId('m82_x2')}
              language={language}
            />
            <StarCloud
              body={DISK.m82_a1}
              isSelected={selectedCosmicBodyId === 'm82_a1'}
              onSelect={() => setSelectedCosmicBodyId('m82_a1')}
              language={language}
              badge="~1 million solar masses"
              palette={['#e0f2fe', '#ffffff']}
            />
          </GalaxyDiskFrame>
        </ProximityLod>
      </DistanceFadeGroup>

      {/* M87* Supermassive Black Hole & 5,000-ly Jet */}
      <DistanceFadeGroup fade={FADE_M87}>
        {CELESTIAL_BODIES.m87_black_hole && <M87GiantElliptical body={CELESTIAL_BODIES.m87_black_hole} glowTexture={glowTexture} />}
        {CELESTIAL_BODIES.m87_black_hole && (
          <M87SupermassiveBlackHole
            body={CELESTIAL_BODIES.m87_black_hole}
            isSelected={selectedCosmicBodyId === 'm87_black_hole'}
            onSelect={() => setSelectedCosmicBodyId('m87_black_hole')}
            language={language}
          />
        )}
        {/* HST-1, on M87's jet axis (distance LoD) */}
        <ProximityLod center={CELESTIAL_BODIES.m87_black_hole.position} radius={30000} forceActive={isSelectedIn(M87_INTERNALS)}>
          <JetKnot
            body={CELESTIAL_BODIES.m87_hst1}
            isSelected={selectedCosmicBodyId === 'm87_hst1'}
            onSelect={() => setSelectedCosmicBodyId('m87_hst1')}
            language={language}
            badge="Apparent speed > light"
          />
        </ProximityLod>
      </DistanceFadeGroup>
    </group>
  );
};
