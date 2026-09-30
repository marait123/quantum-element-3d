'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import {
  CircumstellarRingVertexShader,
  CircumstellarRingFragmentShader,
  SupernovaEjectaVertexShader,
  SupernovaEjectaFragmentShader,
} from './shaders/supernovaShaders';
import { RelativisticJetVertexShader, RelativisticJetFragmentShader } from '../blackhole/shaders/blackHoleShaders';
import { makeSliceGeometry, createSliceMaterial, orientSlices, seededRandom, SliceVolumeLook } from '../nebula/sliceVolume';
import { PooledPointLight } from '@/components/universe/rendering/LightPool';
import { getCoronaTexture } from '@/components/universe/rendering/celestialMaterials';
import { softenPointSprites } from '@/components/universe/rendering/softPointSprites';
import { isLowQuality } from '@/lib/deviceQuality';

interface RealisticSupernovaProps {
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon: string;
}

// Resolved supernova remnants, rendered as a volume (young-remnant morphology in the nebula slice shader):
// colA outer ejecta, colC inner ejecta / knots, colD forward shock, colB faint interior
const REMNANT_LOOKS: Record<string, SliceVolumeLook & { compact?: string; compactOffset?: [number, number, number] }> = {
  // Cas A (Chandra): green-yellow Si/S knots, red Fe-rich outer ejecta, thin blue forward shock, central neutron star
  cas_a_supernova: { morph: 5, colA: '#ff4a2a', colB: '#3b82f6', colC: '#b6f04a', colD: '#4f8dff', dust: 0.5, gain: 1.0, compact: '#e0f2fe' },
  // N49: bright filamentary shell with the magnetar SGR 0525−66 near its edge
  lmc_n49: { morph: 5, colA: '#ff6b4a', colB: '#60a5fa', colC: '#ffc07a', colD: '#93c5fd', dust: 0.4, gain: 1.0, compact: '#c4b5fd', compactOffset: [0.55, 0.2, 0.1] },
  // N132D: oxygen-rich — fast blue-green oxygen knots inside a pink shell
  lmc_n132d: { morph: 5, colA: '#f472b6', colB: '#818cf8', colC: '#5eead4', colD: '#a5b4fc', dust: 0.3, gain: 1.0 },
  // 1E 0102.2-7219: ring of oxygen and neon (blue/violet), the X-ray calibration source
  snr_1e0102: { morph: 5, colA: '#c084fc', colB: '#6366f1', colC: '#67e8f9', colD: '#818cf8', dust: 0.3, gain: 1.0 },
  // S Andromedae (SN 1885A): a compact iron-rich remnant, seen in absorption against the bulge
  s_andromedae: { morph: 5, colA: '#9a3412', colB: '#451a03', colC: '#c2410c', colD: '#fdba74', dust: 1.6, gain: 0.55 },
};

// Unresolved extragalactic supernovae: an expanding photosphere (Type Ia yellow-white; Type II bluer), reddened
// when seen through a dust lane (SN 1986G and SN 2016adj in Centaurus A)
const TRANSIENT_LOOKS: Record<string, { core: string; shock: string; glow: string }> = {
  sn_2014j: { core: '#fff7e0', shock: '#fbbf24', glow: '#ffe7b0' },
  sn_1986g: { core: '#ffe2b8', shock: '#f97316', glow: '#ffb86b' },
  sn_2016adj: { core: '#ffd9b0', shock: '#ea580c', glow: '#ff9f5a' },
};

const noRaycast = () => null;

export const RealisticSupernova: React.FC<RealisticSupernovaProps> = ({
  body,
  isSelected,
  isHighlighted,
  onSelect,
  language,
  icon,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const sliceRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const low = useMemo(() => isLowQuality(), []);
  const size = body.size;

  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  const isSN1987A = body.id === 'sn_1987a';
  const isKilonova = body.id === 'kilonova_factory';
  const remnant = REMNANT_LOOKS[body.id] ?? (!isSN1987A && !isKilonova && body.type === 'supernova_remnant' ? REMNANT_LOOKS.cas_a_supernova : undefined);
  const transient = !isSN1987A && !isKilonova && !remnant ? TRANSIENT_LOOKS[body.id] ?? TRANSIENT_LOOKS.sn_2014j : undefined;

  // --- SN 1987A: triple-ring system ---------------------------------------------------------------------------
  const ringMaterials = useMemo(() => {
    if (!isSN1987A) return null;
    const make = (base: string, hot: string, pearls: number, intensity: number) =>
      new THREE.ShaderMaterial({
        vertexShader: CircumstellarRingVertexShader,
        fragmentShader: CircumstellarRingFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uBaseColor: { value: new THREE.Color(base) },
          uHotspotColor: { value: new THREE.Color(hot) },
          uPearlCount: { value: pearls },
          uIntensity: { value: intensity },
        },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
    return {
      inner: make('#f59e0b', '#fff7ed', 30, 0.9),
      outer: make('#ef4444', '#fecaca', 0, 0.35),
    };
  }, [isSN1987A]);

  // ~30 "pearls": hotspots where the blast wave slams into dense clumps of the inner ring
  const pearls = useMemo(() => {
    if (!isSN1987A) return null;
    const rand = seededRandom('sn1987a-pearls');
    const n = 30;
    const R = size * 0.36;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (rand() - 0.5) * 0.12;
      const rr = R * (0.97 + rand() * 0.06);
      pos[i * 3] = Math.cos(a) * rr;
      pos[i * 3 + 1] = Math.sin(a) * rr;
      pos[i * 3 + 2] = (rand() - 0.5) * size * 0.01;
      c.setHSL(0.1 + rand() * 0.05, 0.5, 0.75 + rand() * 0.2).multiplyScalar(0.6 + rand() * 0.5);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { pos, col };
  }, [isSN1987A, size]);

  // --- Expanding ejecta (1987A's "keyhole", kilonova fireball, unresolved supernovae) ---------------------------
  const ejectaMaterial = useMemo(() => {
    if (remnant) return null;
    const rand = seededRandom(body.id);
    const look = transient;
    return new THREE.ShaderMaterial({
      vertexShader: SupernovaEjectaVertexShader,
      fragmentShader: SupernovaEjectaFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        // Kilonova: red, lanthanide-rich equatorial ejecta + blue, lanthanide-poor polar ejecta (AT2017gfo)
        uCoreColor: { value: new THREE.Color(isKilonova ? '#ffb070' : isSN1987A ? '#fde68a' : look!.core) },
        uShockColor: { value: new THREE.Color(isKilonova ? '#dc2626' : isSN1987A ? '#f97316' : look!.shock) },
        uPolarColor: { value: new THREE.Color('#7dd3fc') },
        uPolarMix: { value: isKilonova ? 0.85 : 0 },
        uFingerScale: { value: isSN1987A ? 0.7 : 1.0 },
        uIntensity: { value: isKilonova ? 1.1 : isSN1987A ? 1.3 : 1.2 },
        uSeed: { value: new THREE.Vector3(rand() * 20, rand() * 20, rand() * 20) },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
    });
  }, [remnant, transient, isKilonova, isSN1987A, body.id]);

  // --- Kilonova: soft, collimated relativistic jet (GRB 170817A) --------------------------------------------------
  const jet = useMemo(() => {
    if (!isKilonova) return null;
    const length = size * 1.3;
    const radius = size * 0.09;
    const g = new THREE.CylinderGeometry(1, 1, 1, low ? 16 : 28, low ? 16 : 32, true);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, length * 0.5, 0), length * 0.5 + radius);
    const m = new THREE.ShaderMaterial({
      vertexShader: RelativisticJetVertexShader,
      fragmentShader: RelativisticJetFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uJetColor: { value: new THREE.Color('#60a5fa') },
        uKnotColor: { value: new THREE.Color('#e0f2fe') },
        uSpeed: { value: 1.6 },
        uKnotFrequency: { value: 2.5 },
        uOpacity: { value: 0.75 },
        uLength: { value: length },
        uRadius: { value: radius },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    return { g, m };
  }, [isKilonova, size, low]);

  // Freshly forged r-process nuclei (gold, platinum…) glinting in the ejecta
  const rprocess = useMemo(() => {
    if (!isKilonova) return null;
    const rand = seededRandom('kilonova-rprocess');
    const n = low ? 120 : 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const r = size * (0.25 + 0.4 * Math.cbrt(rand()));
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = Math.cos(a) * s * r;
      pos[i * 3 + 1] = u * r * 1.2;
      pos[i * 3 + 2] = Math.sin(a) * s * r;
    }
    return pos;
  }, [isKilonova, size, low]);

  // --- Resolved remnants: volumetric shell -----------------------------------------------------------------------
  const sliceCount = low ? 9 : 16;
  const volume = useMemo(() => {
    if (!remnant) return null;
    const radius = size * 0.9;
    return {
      radius,
      geometry: makeSliceGeometry(radius, sliceCount),
      material: createSliceMaterial(remnant, { id: body.id, radius, sliceCount, low }),
    };
  }, [remnant, size, sliceCount, body.id, low]);

  useEffect(
    () => () => {
      volume?.geometry.dispose();
      volume?.material.dispose();
      jet?.g.dispose();
      jet?.m.dispose();
      ejectaMaterial?.dispose();
      ringMaterials?.inner.dispose();
      ringMaterials?.outer.dispose();
    },
    [volume, jet, ejectaMaterial, ringMaterials]
  );

  useFrame(({ clock, camera }) => {
    const root = rootRef.current;
    if (!root || !root.visible) return;
    const t = clock.getElapsedTime();
    if (ringMaterials) {
      ringMaterials.inner.uniforms.uTime.value = t;
      ringMaterials.outer.uniforms.uTime.value = t;
    }
    if (ejectaMaterial) ejectaMaterial.uniforms.uTime.value = t;
    if (jet) jet.m.uniforms.uTime.value = t;
    if (volume) {
      volume.material.uniforms.uTime.value = t;
      if (sliceRef.current) orientSlices(sliceRef.current, root, camera, volume.material);
    } else {
      root.rotation.y = t * 0.015;
    }
  });

  const glowColor = isKilonova ? '#fcd34d' : isSN1987A ? '#fde68a' : transient ? transient.glow : body.emissiveColor || '#fbbf24';

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
      {/* Light of the explosion / shocked gas */}
      <PooledPointLight color={body.emissiveColor || glowColor} intensity={6.0} distance={size * 8} />

      {/* Picking volume (draws nothing) */}
      <mesh>
        <sphereGeometry args={[size * 0.7, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
      </mesh>

      {/* Resolved remnant: shocked ejecta knots, Rayleigh–Taylor fingers and the forward shock, as a volume */}
      {volume && (
        <>
          <mesh ref={sliceRef} geometry={volume.geometry} material={volume.material} raycast={noRaycast} />
          {remnant?.compact && (
            // Central compact object (Cas A's neutron star, N49's magnetar)
            <sprite
              position={(remnant.compactOffset ?? [0, 0, 0]).map((v) => v * volume.radius) as [number, number, number]}
              scale={[size * 0.08, size * 0.08, 1]}
              raycast={noRaycast}
            >
              <spriteMaterial map={getCoronaTexture()} color={remnant.compact} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
          )}
        </>
      )}

      {/* Expanding ejecta / photosphere */}
      {ejectaMaterial && (
        <group scale={isSN1987A ? [0.8, 1.35, 0.8] : isKilonova ? [1, 1.25, 1] : [1, 1, 1]}>
          <mesh material={ejectaMaterial} raycast={noRaycast}>
            <sphereGeometry args={[size * (isSN1987A ? 0.1 : isKilonova ? 0.5 : 0.22), 48, 32]} />
          </mesh>
        </group>
      )}

      {/* Bright core glow (unresolved explosion light / hot merger remnant) */}
      {!remnant && (
        <sprite scale={[size * (isSN1987A ? 0.35 : transient ? 1.6 : 1.1), size * (isSN1987A ? 0.35 : transient ? 1.6 : 1.1), 1]} raycast={noRaycast}>
          <spriteMaterial
            map={getCoronaTexture()}
            color={glowColor}
            transparent
            opacity={transient ? 0.95 : 0.7}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      )}

      {/* SN 1987A: inner equatorial ring with its "string of pearls" and two faint outer rings (hourglass) */}
      {isSN1987A && ringMaterials && pearls && (
        <group rotation={[0.75, 0, 0.2]}>
          <mesh material={ringMaterials.inner} raycast={noRaycast}>
            <torusGeometry args={[size * 0.36, size * 0.016, 12, 160]} />
          </mesh>
          <points raycast={noRaycast}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[pearls.pos, 3]} />
              <bufferAttribute attach="attributes-color" args={[pearls.col, 3]} />
            </bufferGeometry>
            <pointsMaterial
              ref={softenPointSprites}
              size={size * 0.12}
              map={getCoronaTexture()}
              vertexColors
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
          {/* Outer rings: ~2.5x larger, displaced above and below the equatorial plane */}
          <mesh material={ringMaterials.outer} position={[size * 0.05, size * 0.02, size * 0.42]} raycast={noRaycast}>
            <torusGeometry args={[size * 0.8, size * 0.008, 8, 160]} />
          </mesh>
          <mesh material={ringMaterials.outer} position={[-size * 0.05, -size * 0.02, -size * 0.42]} raycast={noRaycast}>
            <torusGeometry args={[size * 0.8, size * 0.008, 8, 160]} />
          </mesh>
        </group>
      )}

      {/* Kilonova (GW170817): soft relativistic jets and glints of freshly forged heavy elements */}
      {isKilonova && jet && rprocess && (
        <group>
          <mesh geometry={jet.g} material={jet.m} raycast={noRaycast} />
          <mesh geometry={jet.g} material={jet.m} rotation={[Math.PI, 0, 0]} raycast={noRaycast} />
          <points raycast={noRaycast}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[rprocess, 3]} />
            </bufferGeometry>
            <pointsMaterial
              ref={softenPointSprites}
              size={size * 0.03}
              map={getCoronaTexture()}
              color="#fcd34d"
              transparent
              opacity={0.85}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </points>
        </group>
      )}

      {/* Selection Ring */}
      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.15, size * 1.185, 128]} />
          <meshBasicMaterial
            color={isHighlighted ? '#fbbf24' : '#38bdf8'}
            side={THREE.DoubleSide}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Tag */}
      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, size * 1.15 + 30, 0]} center distanceFactor={size * 3.5}>
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400 text-xs font-bold text-amber-200 whitespace-nowrap shadow-xl flex items-center gap-1.5 pointer-events-none">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>{icon} {language === 'ar' ? body.nameAr : body.nameEn}</span>
          </div>
        </Html>
      )}
    </group>
  );
};
