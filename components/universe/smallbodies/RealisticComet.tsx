'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import * as THREE from 'three';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import { simClock } from '@/lib/simClock';
import { getCoronaTexture } from '@/components/universe/rendering/celestialMaterials';
import { rockGeometry } from './rockGeometry';

interface RealisticCometProps {
  body: CelestialBody;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
  icon: string;
}

// Halley: a real Keplerian ellipse (retrograde, i = 162°) solved on the shared clock. The real 75-year period is
// shown in 150 s so a perihelion passage can actually be watched ("motion speeded up"); eccentricity is reduced
// from 0.967 so perihelion stays outside the (enlarged) Sun.
const HALLEY = { a: 21, e: 0.74, periodSeconds: 150, inclination: (162 * Math.PI) / 180, node: (58.4 * Math.PI) / 180, argPeri: (111.3 * Math.PI) / 180 };
// ʻOumuamua: hyperbolic (e ≈ 1.2) escape, now far outbound; no coma or tail was ever observed
const OUMUAMUA = { a: 30, e: 1.2, h0: 1.7, rate: 0.0006, inclination: (122.7 * Math.PI) / 180, node: (24.6 * Math.PI) / 180 };

const TAIL_PARTICLES = 700;

function solveKepler(M: number, e: number) {
  let E = M;
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

export const RealisticComet: React.FC<RealisticCometProps> = ({ body, isSelected, isHighlighted, onSelect, language, icon }) => {
  const rootRef = useRef<THREE.Group>(null);
  const tailGroupRef = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const comaRef = useRef<THREE.Sprite>(null);
  const [hovered, setHovered] = useState(false);
  const isOumuamua = body.id === 'oumuamua';

  useEffect(() => {
    if (rootRef.current) registerCelestialObject(body.id, rootRef.current);
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

  const nucleus = useMemo(
    () =>
      isOumuamua
        ? // ~400 m × 40 m, reddish (space-weathered organics), tumbling
          rockGeometry({ radius: body.size * 0.5, seed: 77, detail: 3, relief: 0.05, craters: 2, stretch: [2.6, 0.32, 0.42], color: '#8a4b33', albedoJitter: 0.15 })
        : // Halley's nucleus: 15 × 8 km peanut, one of the darkest surfaces in the Solar System (~4% albedo)
          rockGeometry({ radius: body.size * 0.22, seed: 1986, detail: 4, relief: 0.12, craters: 8, shape: 'bilobed', stretch: [1.7, 0.95, 0.95], color: '#2b2825', albedoJitter: 0.35 }),
    [isOumuamua, body.size]
  );
  useEffect(() => () => nucleus.dispose(), [nucleus]);

  // Tails as soft particles in a local frame: +x points away from the Sun, −z is "behind" along the orbit
  const tails = useMemo(() => {
    if (isOumuamua) return null;
    const make = (kind: 'ion' | 'dust') => {
      const pos = new Float32Array(TAIL_PARTICLES * 3);
      const col = new Float32Array(TAIL_PARTICLES * 3);
      const c = new THREE.Color(kind === 'ion' ? '#6fb6ff' : '#f2dfb0');
      let seed = kind === 'ion' ? 3 : 9;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < TAIL_PARTICLES; i++) {
        const s = Math.pow(rnd(), kind === 'ion' ? 1.2 : 0.9); // 0 at the head, 1 at the tip
        const len = body.size * (kind === 'ion' ? 16 : 11);
        const spread = body.size * (kind === 'ion' ? 0.25 + s * 0.5 : 0.4 + s * 2.4);
        const x = s * len;
        // Dust curves back along the orbit (particles lag behind); ions stream straight out
        const curve = kind === 'dust' ? -Math.pow(s, 1.7) * len * 0.35 : 0;
        const y = (rnd() - 0.5) * spread * (kind === 'dust' ? 0.35 : 1);
        const z = curve + (rnd() - 0.5) * spread;
        pos.set([x, y, z], i * 3);
        const fade = Math.pow(1 - s, kind === 'ion' ? 1.4 : 1.1);
        col.set([c.r * fade, c.g * fade, c.b * fade], i * 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      return geo;
    };
    return { ion: make('ion'), dust: make('dust') };
  }, [isOumuamua, body.size]);
  useEffect(() => () => {
    tails?.ion.dispose();
    tails?.dust.dispose();
  }, [tails]);

  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _prev = useMemo(() => new THREE.Vector3(), []);
  const _x = useMemo(() => new THREE.Vector3(), []);
  const _y = useMemo(() => new THREE.Vector3(), []);
  const _z = useMemo(() => new THREE.Vector3(), []);
  const _m = useMemo(() => new THREE.Matrix4(), []);
  const _rot = useMemo(() => new THREE.Euler(), []);

  // Position in the orbit plane, then tilted by node/inclination (scene axes: ecliptic x → x, y → −z)
  const orbitPosition = (t: number, out: THREE.Vector3) => {
    if (isOumuamua) {
      const H = OUMUAMUA.h0 + t * OUMUAMUA.rate;
      const px = -OUMUAMUA.a * (Math.cosh(H) - OUMUAMUA.e);
      const py = OUMUAMUA.a * Math.sqrt(OUMUAMUA.e ** 2 - 1) * Math.sinh(H);
      out.set(px, 0, -py);
      _rot.set(OUMUAMUA.inclination, OUMUAMUA.node, 0);
    } else {
      const M = (2 * Math.PI * t) / HALLEY.periodSeconds + 2.4;
      const E = solveKepler(M % (2 * Math.PI), HALLEY.e);
      const px = HALLEY.a * (Math.cos(E) - HALLEY.e);
      const py = HALLEY.a * Math.sqrt(1 - HALLEY.e ** 2) * Math.sin(E);
      out.set(px, 0, -py).applyAxisAngle(_y.set(0, 1, 0), HALLEY.argPeri);
      _rot.set(HALLEY.inclination, HALLEY.node, 0);
    }
    return out.applyEuler(_rot);
  };

  useFrame((_, delta) => {
    const root = rootRef.current;
    if (!root) return;
    const t = simClock.time;
    orbitPosition(t, root.position);

    if (nucleusRef.current) {
      const spin = (body.rotationSpeed || 0.05) * delta * simClock.scale;
      nucleusRef.current.rotation.x += spin * (isOumuamua ? 0.6 : 1);
      nucleusRef.current.rotation.y += spin * 1.5;
    }
    if (isOumuamua || !tailGroupRef.current) return;

    // Tail frame: x away from the Sun, z along the direction of motion (so the dust tail lags behind)
    const r = root.position.length();
    _x.copy(root.position).normalize();
    orbitPosition(t - 0.5, _prev);
    _z.copy(root.position).sub(_prev).normalize(); // velocity
    _y.crossVectors(_z, _x).normalize();
    _z.crossVectors(_x, _y).normalize();
    _m.makeBasis(_x, _y, _z);
    tailGroupRef.current.quaternion.setFromRotationMatrix(_m);
    // Activity: sublimation ~ 1/r² — tails grow and brighten near perihelion
    const activity = THREE.MathUtils.clamp(Math.pow(12 / Math.max(r, 5), 2), 0.08, 1.6);
    tailGroupRef.current.scale.set(0.3 + activity * 0.7, 1, 1);
    tailGroupRef.current.visible = activity > 0.1;
    if (comaRef.current) {
      const s = body.size * (0.9 + activity * 1.4);
      comaRef.current.scale.set(s, s, 1);
      (comaRef.current.material as THREE.SpriteMaterial).opacity = 0.12 + activity * 0.25;
    }
  });

  const glow = getCoronaTexture();

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
      {/* Nucleus */}
      <mesh ref={nucleusRef} geometry={nucleus}>
        <meshStandardMaterial vertexColors roughness={0.97} metalness={0} />
      </mesh>

      {!isOumuamua && tails && (
        <>
          {/* Coma: the glowing gas cloud around the nucleus (camera-facing) */}
          <sprite ref={comaRef} raycast={() => null}>
            <spriteMaterial map={glow} color="#bfe8ff" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <group ref={tailGroupRef}>
            {/* Ion (plasma) tail: straight, blue, exactly anti-sunward */}
            <points geometry={tails.ion} raycast={() => null}>
              <pointsMaterial map={glow} size={body.size * 0.9} vertexColors transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
            </points>
            {/* Dust tail: broad, yellowish, curved back along the orbit */}
            <points geometry={tails.dust} raycast={() => null}>
              <pointsMaterial map={glow} size={body.size * 1.4} vertexColors transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
            </points>
          </group>
        </>
      )}

      {(isSelected || isHighlighted) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[body.size * 1.42, body.size * 1.46, 96]} />
          <meshBasicMaterial color={isHighlighted ? '#fbbf24' : '#38bdf8'} side={THREE.DoubleSide} transparent opacity={0.45} />
        </mesh>
      )}

      {(hovered || isSelected || isHighlighted) && (
        <Html position={[0, body.size * 1.6 + 1.5, 0]} center distanceFactor={body.size * 15}>
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-cyan-400 text-xs font-bold text-cyan-200 whitespace-nowrap shadow-xl flex items-center gap-1.5 pointer-events-none">
            {isHighlighted && <span className="text-amber-400">⚡</span>}
            <span>
              {icon} {language === 'ar' ? body.nameAr : body.nameEn}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
