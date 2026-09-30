'use client';

import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import {
  GalacticDiskShader,
  RelativisticAGNJetShader,
  M82SuperwindShader,
} from './shaders/galaxyShaders';
import { PooledPointLight } from '@/components/universe/rendering/LightPool';
import { getGlowPointTexture } from '@/lib/planetTextures';
import { softenPointSprites } from '@/components/universe/rendering/softPointSprites';
import { getGalaxyDiskRotation, GALAXY_INTERIORS, interiorFade, InteriorStyle } from '@/lib/galaxyInteriors';
import { DistanceFadeGroup } from '@/components/universe/rendering/useDistanceFade';
import { getCoronaTexture } from '@/components/universe/rendering/celestialMaterials';
import { scaledCount } from '@/lib/deviceQuality';
import { simClock } from '@/lib/simClock';

export type GalaxyMorphology =
  | 'spiral'
  | 'flocculent'
  | 'dwarf_irregular'
  | 'active_elliptical'
  | 'starburst'
  | 'dwarf_elliptical';

export { getGalaxyDiskRotation } from '@/lib/galaxyInteriors';

interface RealisticGalaxyProps {
  body: CelestialBody;
  morphology: GalaxyMorphology;
  isSelected: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon?: string;
  badgeLabel?: string;
  glowTexture?: THREE.CanvasTexture;
}

const _bulgeCenter = new THREE.Vector3();
const _fadeCenter = new THREE.Vector3();
const _spinQuat = new THREE.Quaternion();
const noRaycast = () => null;

// Barred galaxies: bar half-length (disk radii) and position angle. The Milky Way's bar is ~5 kpc long and the
// LMC is dominated by its (off-centre) stellar bar.
const GALAXY_BARS: Record<string, [number, number]> = {
  milky_way_galaxy: [0.3, 0.45],
  large_magellanic_cloud: [0.38, -0.3],
};

// Deterministic randomness so a galaxy looks the same every visit
function seededRandom(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
const gauss = (rand: () => number) => {
  const u = Math.max(rand(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
};

const INSIDE_DISK_GLOW: Record<InteriorStyle, number> = {
  grand_spiral: 0.35,
  flocculent_spiral: 0.35,
  barred_magellanic: 0.3,
  irregular_dwarf: 0.3,
  starburst_disk: 0,
  elliptical_with_lane: 0,
};

const _spinCentre = new THREE.Vector3();

export const RealisticGalaxy: React.FC<RealisticGalaxyProps> = ({
  body,
  morphology,
  isSelected,
  onSelect,
  language,
  icon = '🌀',
  badgeLabel,
  glowTexture,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const diskMeshRef = useRef<THREE.Mesh>(null);
  const bulgeRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);

  // Enterable galaxies hand over to their detailed interior (GalaxyInterior) as the camera comes inside:
  // the coarse halo sprites fade out and the painted disk dims to a soft glow behind the real star field.
  const enterable = body.id in GALAXY_INTERIORS;
  const outsideHaloFade = useCallback(
    (camera: THREE.Camera) => {
      if (!enterable || !rootRef.current) return 1;
      return 1 - interiorFade(camera.position.distanceTo(rootRef.current.getWorldPosition(_fadeCenter)), body.size);
    },
    [enterable, body.size]
  );
  // Painted spiral pattern stays as a soft glow inside spirals; for M82 and Centaurus A it would draw arms or rings
  // they don't have, so there it fades out completely and the star field alone remains
  const insideDiskGlow = enterable ? INSIDE_DISK_GLOW[GALAXY_INTERIORS[body.id]] : 1;
  const outsideDiskFade = useCallback(
    (camera: THREE.Camera) => insideDiskGlow + (1 - insideDiskGlow) * outsideHaloFade(camera),
    [outsideHaloFade, insideDiskGlow]
  );
  // Round star sprites from the first frame. The prop arrives a render later, and three.js does not recompile a
  // material whose map appears afterwards, so relying on it alone left the halo drawn as squares.
  const haloTexture = useMemo(() => glowTexture ?? getGlowPointTexture(), [glowTexture]);
  const jetMeshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.userData.galaxyId = body.id;
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  // Procedural uniform parameters based on morphology
  const diskUniforms = useMemo(() => {
    let arms = 2.0;
    let pitch = 0.22; // ~13 degrees (Sb spiral)
    let armWidth = 0.24;
    let bulgeRadius = 0.18;
    let dustStrength = 0.85;
    let h2Abundance = 0.9;
    let coreColor = new THREE.Color('#fef08a');
    let armColor = new THREE.Color('#60a5fa');
    let h2Color = new THREE.Color('#f43f5e');
    let dustColor = new THREE.Color('#0f172a');

    if (morphology === 'flocculent') {
      arms = 3.0;
      pitch = 0.38; // ~22 degrees (loose Sc spiral)
      armWidth = 0.32;
      bulgeRadius = 0.08;
      dustStrength = 0.55;
      h2Abundance = 1.35;
      coreColor = new THREE.Color('#e9d5ff');
      armColor = new THREE.Color('#a78bfa');
      h2Color = new THREE.Color('#2dd4bf'); // NGC 604 turquoise
    } else if (morphology === 'dwarf_irregular') {
      arms = 1.0;
      pitch = 0.45;
      armWidth = 0.55;
      bulgeRadius = 0.12;
      dustStrength = 0.4;
      h2Abundance = 1.6;
      coreColor = new THREE.Color('#fed7aa');
      armColor = new THREE.Color('#38bdf8');
      h2Color = new THREE.Color('#fb7185');
    } else if (morphology === 'active_elliptical') {
      arms = 1.0;
      pitch = 0.01;
      armWidth = 0.8;
      bulgeRadius = 0.65;
      dustStrength = 1.2; // Warped dust belt
      h2Abundance = 0.2;
      coreColor = new THREE.Color('#ffedd5');
      armColor = new THREE.Color('#fcd34d');
      dustColor = new THREE.Color('#020617');
    } else if (morphology === 'dwarf_elliptical') {
      // Smooth, dust-free ellipsoid of old stars: no spiral structure, bulge-dominated light
      arms = 1.0;
      pitch = 0.01;
      armWidth = 1.0;
      bulgeRadius = 0.9;
      dustStrength = body.id === 'messier_110' ? 0.35 : 0.0; // M110 has patches of dust, M32 has none
      h2Abundance = 0.05;
      coreColor = new THREE.Color('#fff7d6');
      armColor = new THREE.Color('#fde68a');
      h2Color = new THREE.Color('#fbbf24');
    } else if (morphology === 'starburst') {
      arms = 2.0;
      pitch = 0.15;
      armWidth = 0.35;
      bulgeRadius = 0.25;
      dustStrength = 0.95;
      h2Abundance = 2.0;
      coreColor = new THREE.Color('#fee2e2');
      armColor = new THREE.Color('#fbbf24');
      h2Color = new THREE.Color('#ef4444');
    }

    return {
      uTime: { value: 0 },
      uCoreColor: { value: coreColor },
      uArmColor: { value: armColor },
      uH2Color: { value: h2Color },
      uDustColor: { value: dustColor },
      uArms: { value: arms },
      uPitchAngle: { value: pitch },
      uArmWidth: { value: armWidth },
      uBulgeRadius: { value: bulgeRadius },
      uDiskRadius: { value: body.size },
      uDustStrength: { value: dustStrength },
      uH2Abundance: { value: h2Abundance },
      uBar: { value: GALAXY_BARS[body.id]?.[0] ?? 0 },
      uBarAngle: { value: GALAXY_BARS[body.id]?.[1] ?? 0 },
      uCenter: { value: new THREE.Vector3() },
      uDiskNormal: { value: new THREE.Vector3(0, 1, 0) },
    };
  }, [morphology, body.size, body.id]);

  // Disk stars with a vertical (gaussian) scale height, so the disk has thickness when seen edge-on. They follow
  // the same logarithmic arms as the painted disk (young blue stars in the arms, older yellow ones in between).
  const diskStars = useMemo(() => {
    if (morphology === 'active_elliptical' || morphology === 'dwarf_elliptical') return null;
    const rand = seededRandom(body.id + ':disk');
    const count = scaledCount(morphology === 'dwarf_irregular' ? 2600 : 6000, 0.45);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const arms = diskUniforms.uArms.value;
    const b = Math.tan(diskUniforms.uPitchAngle.value);
    const width = diskUniforms.uArmWidth.value;
    const bar = GALAXY_BARS[body.id];
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const inArm = morphology !== 'dwarf_irregular' && rand() < 0.62;
      // Exponential disk (scale length ~0.3 R)
      let rN = Math.min(0.97, -0.3 * Math.log(Math.max(rand(), 1e-4)));
      let phi: number;
      if (bar && rN < bar[0] && rand() < 0.6) {
        // Stars of the bar
        const along = (rand() * 2 - 1) * bar[0];
        const across = gauss(rand) * bar[0] * 0.12;
        const x = Math.cos(bar[1]) * along - Math.sin(bar[1]) * across;
        const y = Math.sin(bar[1]) * along + Math.cos(bar[1]) * across;
        rN = Math.hypot(x, y);
        phi = Math.atan2(y, x);
      } else if (inArm) {
        const k = Math.floor(rand() * arms);
        phi = (k * 2 * Math.PI) / arms + (1 / b) * Math.log(rN + 0.05) + gauss(rand) * width * (0.6 + 0.6 * rN) * 0.6;
      } else {
        phi = rand() * Math.PI * 2;
      }
      const r = rN * body.size;
      // Thin disk for young stars, thicker for old ones; flaring outward
      const h = body.size * (inArm ? 0.012 : 0.028) * (0.7 + 0.8 * rN);
      pos[i * 3] = Math.cos(phi) * r;
      pos[i * 3 + 1] = gauss(rand) * h;
      pos[i * 3 + 2] = -Math.sin(phi) * r; // same handedness as the disk plane (rotated -90 degrees about X)
      if (inArm && rN > 0.15) c.set(rand() < 0.12 ? '#fda4af' : rand() < 0.5 ? '#bfdbfe' : '#e0ecff');
      else c.set(rand() < 0.6 ? '#fde68a' : '#fef3c7');
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { pos, col };
  }, [morphology, body.id, body.size, diskUniforms]);

  // Soft bulge of old stars (de Vaucouleurs-like: steep core, extended envelope), flattened like a real bulge
  const bulgeStars = useMemo(() => {
    const rand = seededRandom(body.id + ':bulge');
    const isEll = morphology === 'active_elliptical' || morphology === 'dwarf_elliptical';
    const count = scaledCount(isEll ? 2600 : 1600, 0.5);
    const R = body.size * (isEll ? 0.55 : 0.2);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = R * Math.pow(rand(), 2.4) * 1.6;
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const sn = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(a) * sn * r;
      pos[i * 3 + 1] = u * r * (isEll ? 0.75 : 0.62);
      pos[i * 3 + 2] = Math.sin(a) * sn * r;
      c.set(rand() < 0.65 ? '#ffe8b8' : '#ffd08a');
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { pos, col, R };
  }, [morphology, body.id, body.size]);

  // Relativistic Jet Uniforms (for Centaurus A)
  const jetUniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uJetColor: { value: new THREE.Color('#38bdf8') },
      uKnotColor: { value: new THREE.Color('#ffffff') },
      uJetSpeed: { value: 1.8 },
    };
  }, []);

  // Superwind Uniforms (for M82)
  const superwindUniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uPlumeColor: { value: new THREE.Color('#ef4444') },
      uTurbulence: { value: 1.4 },
    };
  }, []);

  // Dense foreground/background stellar halo particles
  const [haloPositions, haloColors] = useMemo(() => {
    const isEllipticalShape = morphology === 'active_elliptical' || morphology === 'dwarf_elliptical';
    const count = morphology === 'dwarf_irregular' || morphology === 'dwarf_elliptical' ? 2500 : 5000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.5) * body.size * 0.95;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * (isEllipticalShape ? 0.8 : 0.25);

      pos[i3] = Math.cos(theta) * Math.cos(phi) * r;
      pos[i3 + 1] = Math.sin(phi) * r * (isEllipticalShape ? 0.7 : 0.12);
      pos[i3 + 2] = Math.sin(theta) * Math.cos(phi) * r;

      const c = new THREE.Color();
      if (morphology === 'dwarf_elliptical') {
        // Old yellow/orange stars; M110 also hosts a few young blue stars from recent star formation
        c.set(body.id === 'messier_110' && Math.random() < 0.04 ? '#93c5fd' : Math.random() < 0.7 ? '#fde68a' : '#fdba74');
      } else if (r < body.size * 0.25) {
        c.set('#fef08a');
      } else if (Math.random() < 0.2) {
        c.set('#f43f5e'); // H II knot
      } else {
        c.set('#93c5fd'); // OB star
      }

      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
    }
    return [pos, col];
  }, [body.size, morphology]);

  useFrame(({ camera }, delta) => {
    if (rootRef.current) {
      if (spinRef.current) {
        // Real galactic rotation takes hundreds of millions of years: keep a slow, artistic spin for the distant
        // view only, easing to a stop as the camera comes inside (1.8–3 radii) so its stars don't slide past you.
        // The shared clock's scale applies, so pausing time stops it too.
        _spinCentre.setFromMatrixPosition(rootRef.current.matrixWorld);
        const outside = THREE.MathUtils.smoothstep(camera.position.distanceTo(_spinCentre), body.size * 1.8, body.size * 3.0);
        spinRef.current.rotation.y += delta * simClock.scale * (body.rotationSpeed || 0.003) * outside;
        // Objects placed in this disk (GalaxyDiskFrame) follow the same spin
        rootRef.current.userData.spin = spinRef.current.rotation.y;
      }
    }
    // Bulge sphere: full size from afar, shrinking to nothing as the camera approaches the nucleus, so central
    // objects (M31*, Centaurus A*) are not hidden inside it
    if (bulgeRef.current && rootRef.current) {
      const bulgeRadius = body.size * 0.15;
      const d = camera.position.distanceTo(rootRef.current.getWorldPosition(_bulgeCenter));
      let k = THREE.MathUtils.smoothstep(d, bulgeRadius * 3, bulgeRadius * 8);
      // Inside an enterable galaxy its interior star field has its own bulge: the solid sphere steps aside
      if (enterable) k = Math.min(k, 1 - interiorFade(d, body.size));
      bulgeRef.current.scale.setScalar(Math.max(k, 0.0001));
      bulgeRef.current.visible = k > 0.01;
    }
    diskUniforms.uTime.value += delta;
    // Near-side dust needs to know where the centre is and which way the disk faces
    if (rootRef.current && spinRef.current) {
      rootRef.current.getWorldPosition(diskUniforms.uCenter.value);
      diskUniforms.uDiskNormal.value.set(0, 1, 0).applyQuaternion(spinRef.current.getWorldQuaternion(_spinQuat));
    }
    jetUniforms.uTime.value += delta;
    superwindUniforms.uTime.value += delta;
  });

  // Galaxy inclination angles
  const diskRotation = useMemo(() => getGalaxyDiskRotation(body.id), [body.id]);

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
      {/* Central Ambient Core Light */}
      <PooledPointLight color={body.color} intensity={4.5} distance={body.size * 3.5} />

      {/* Galactic Orientation Container */}
      <group rotation={diskRotation}>
        {/* Rotation happens about the disk's own axis (a galaxy turns within its plane; spinning the tilted disk
            about the world's vertical axis made it tumble) */}
        <group ref={spinRef}>
        {/* 1. Procedural Logarithmic Density Wave Spiral Disk (dims to a soft glow once you are inside) */}
        <DistanceFadeGroup fade={outsideDiskFade}>
        <mesh ref={diskMeshRef} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[body.size * 2, body.size * 2, 64, 64]} />
          <shaderMaterial
            vertexShader={GalacticDiskShader.vertexShader}
            fragmentShader={GalacticDiskShader.fragmentShader}
            uniforms={diskUniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.NormalBlending}
          />
        </mesh>
        </DistanceFadeGroup>

        {/* 2. Bulge: soft glow of old stars (no hard edge), drawn before the disk so near-side dust lanes are
            silhouetted against it. Shrinks away up close so objects at the centre stay visible. */}
        <group ref={bulgeRef}>
          <sprite
            renderOrder={-1}
            scale={[bulgeStars.R * 3.2, bulgeStars.R * 3.2 * (morphology === 'dwarf_elliptical' || morphology === 'active_elliptical' ? 0.8 : 0.72), 1]}
            raycast={noRaycast}
          >
            <spriteMaterial
              map={getCoronaTexture()}
              color={morphology === 'active_elliptical' ? '#ffe4c4' : '#ffe9a8'}
              transparent
              opacity={0.75}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
          <points renderOrder={-1} raycast={noRaycast}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[bulgeStars.pos, 3]} />
              <bufferAttribute attach="attributes-color" args={[bulgeStars.col, 3]} />
            </bufferGeometry>
            <pointsMaterial
              ref={softenPointSprites}
              size={body.size * 0.012}
              map={haloTexture}
              vertexColors
              transparent
              opacity={0.55}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>
          {/* Picking target for the core (draws nothing) */}
          <mesh>
            <sphereGeometry args={[body.size * 0.15, 12, 8]} />
            <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
          </mesh>
        </group>

        {/* 3. Star Cluster Particle Cloud (coarse far-away sprites, replaced by GalaxyInterior once inside) */}
        <DistanceFadeGroup fade={outsideHaloFade}>
        {diskStars && (
          <points raycast={noRaycast}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[diskStars.pos, 3]} />
              <bufferAttribute attach="attributes-color" args={[diskStars.col, 3]} />
            </bufferGeometry>
            <pointsMaterial
              ref={softenPointSprites}
              size={body.size * 0.01}
              map={haloTexture}
              vertexColors
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </points>
        )}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[haloPositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[haloColors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            ref={softenPointSprites}
            size={body.size * 0.014}
            map={haloTexture}
            vertexColors
            transparent
            opacity={0.82}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
        </DistanceFadeGroup>

        {/* 4. Active Galactic Nucleus Relativistic Jets (Centaurus A) */}
        {morphology === 'active_elliptical' && (
          <group>
            {/* Crossed planes so the jets have volume from any side */}
            <mesh position={[0, body.size * 1.6, 0]} rotation={[0, Math.PI / 2, 0]} raycast={noRaycast}>
              <planeGeometry args={[body.size * 0.6, body.size * 3.2]} />
              <shaderMaterial
                vertexShader={RelativisticAGNJetShader.vertexShader}
                fragmentShader={RelativisticAGNJetShader.fragmentShader}
                uniforms={jetUniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            <mesh position={[0, -body.size * 1.6, 0]} rotation={[Math.PI, Math.PI / 2, 0]} raycast={noRaycast}>
              <planeGeometry args={[body.size * 0.6, body.size * 3.2]} />
              <shaderMaterial
                vertexShader={RelativisticAGNJetShader.vertexShader}
                fragmentShader={RelativisticAGNJetShader.fragmentShader}
                uniforms={jetUniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* North Relativistic Jet */}
            <mesh position={[0, body.size * 1.6, 0]} rotation={[0, 0, 0]}>
              <planeGeometry args={[body.size * 0.6, body.size * 3.2]} />
              <shaderMaterial
                vertexShader={RelativisticAGNJetShader.vertexShader}
                fragmentShader={RelativisticAGNJetShader.fragmentShader}
                uniforms={jetUniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* South Relativistic Jet */}
            <mesh position={[0, -body.size * 1.6, 0]} rotation={[Math.PI, 0, 0]}>
              <planeGeometry args={[body.size * 0.6, body.size * 3.2]} />
              <shaderMaterial
                vertexShader={RelativisticAGNJetShader.vertexShader}
                fragmentShader={RelativisticAGNJetShader.fragmentShader}
                uniforms={jetUniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        )}

        {/* 5. Explosive Bipolar Superwind Chimneys (Messier 82) */}
        {morphology === 'starburst' && (
          <group>
            {/* Upper Venting Superwind */}
            <mesh position={[0, body.size * 0.75, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[body.size * 0.65, body.size * 1.5, 32, 1, true]} />
              <shaderMaterial
                vertexShader={M82SuperwindShader.vertexShader}
                fragmentShader={M82SuperwindShader.fragmentShader}
                uniforms={superwindUniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* Lower Venting Superwind */}
            <mesh position={[0, -body.size * 0.75, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[body.size * 0.65, body.size * 1.5, 32, 1, true]} />
              <shaderMaterial
                vertexShader={M82SuperwindShader.vertexShader}
                fragmentShader={M82SuperwindShader.fragmentShader}
                uniforms={superwindUniforms}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        )}

        </group>
      </group>

      {/* Interactive Selection Ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[body.size * 1.15, body.size * 1.185, 128]} />
          <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Interactive HUD Hover Tag */}
      {(hovered || isSelected) && (
        <Html position={[0, body.size * 0.55, 0]} center distanceFactor={body.size * 4.5}>
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/95 border-2 border-blue-400 text-xs font-black text-blue-100 whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
            <span>{icon}</span>
            <span>{language === 'ar' ? body.nameAr : body.nameEn}</span>
            {badgeLabel && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                {badgeLabel}
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
