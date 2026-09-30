import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { LayerHtml as Html } from '@/components/universe/rendering/LayerVisibility';
import { CelestialBody } from '@/data/universeData';
import { registerCelestialObject, unregisterCelestialObject } from '@/lib/celestialRegistry';
import {
  AccretionDiskVertexShader,
  AccretionDiskFragmentShader,
  LensedImageVertexShader,
  LensedImageFragmentShader,
  RelativisticJetVertexShader,
  RelativisticJetFragmentShader,
  StreamVertexShader,
  StreamFragmentShader,
  DustyTorusVertexShader,
  DustyTorusFragmentShader,
} from './shaders/blackHoleShaders';
import { PooledPointLight } from '@/components/universe/rendering/LightPool';
import { StarBody } from '@/components/universe/rendering/StarBody';
import { getCoronaTexture } from '@/components/universe/rendering/celestialMaterials';
import { isLowQuality } from '@/lib/deviceQuality';

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
  /** Event Horizon Telescope look when seen face-on (defaults on for M87* and Sgr A*) */
  ehtLook?: boolean;
  isSelected: boolean;
  isHighlighted?: boolean;
  onSelect: () => void;
  language: 'en' | 'ar';
}

const EHT_TARGETS = new Set(['m87_black_hole', 'sagittarius_a']);
const noRaycast = () => null;

const _q = new THREE.Quaternion();
const _qParent = new THREE.Quaternion();
const _n = new THREE.Vector3();
const _c = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();
const _tmp = new THREE.Vector3();

// Jet geometry: a unit open cylinder that the vertex shader bends into a collimated paraboloid of the jet's length.
// Its bounds are set to the real jet so frustum culling does not drop a jet whose base is off screen.
function makeJetGeometry(length: number, radius: number, low: boolean) {
  const g = new THREE.CylinderGeometry(1, 1, 1, low ? 20 : 40, low ? 24 : 56, true);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, length * 0.5, 0), length * 0.5 + radius);
  g.boundingBox = new THREE.Box3(new THREE.Vector3(-radius, 0, -radius), new THREE.Vector3(radius, length, radius));
  return g;
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
  ehtLook,
  isSelected,
  isHighlighted = false,
  onSelect,
  language,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const diskRef = useRef<THREE.Mesh>(null);
  const lensRef = useRef<THREE.Mesh>(null);
  const jetRef = useRef<THREE.Group>(null);
  const hotspotsRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const low = useMemo(() => isLowQuality(), []);
  const eht = ehtLook ?? EHT_TARGETS.has(body.id);

  // Physical scale dimensions
  const baseSize = body.size;
  // Apparent shadow: the photon-capture radius sqrt(27)/2 Rs ≈ 2.6 Rs (lensing enlarges the horizon's silhouette)
  const shadowRadius = propShadowRadius ?? baseSize * 0.85;
  // Inner accretion disk edge at the ISCO (3 Rs for a non-spinning hole)
  const innerDiskRadius = propInnerDiskRadius ?? shadowRadius * 1.15;
  const outerDiskRadius = propOuterDiskRadius ?? shadowRadius * 3.4;
  const rs = shadowRadius / 2.6;
  const lensHalf = shadowRadius * 3.6;

  // Register in runtime celestial camera tracking
  useEffect(() => {
    if (rootRef.current) {
      registerCelestialObject(body.id, rootRef.current);
    }
    return () => unregisterCelestialObject(body.id);
  }, [body.id]);

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
        uOpacity: { value: 1.0 },
        uBrightness: { value: 1.0 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [colorCore, colorMid, colorOuter, innerDiskRadius, outerDiskRadius, rs, dopplerStrength]);

  const lensMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: LensedImageVertexShader,
      fragmentShader: LensedImageFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uHalfSize: { value: lensHalf },
        uColorCore: { value: new THREE.Color(colorCore) },
        uColorMid: { value: new THREE.Color(colorMid) },
        uColorOuter: { value: new THREE.Color(colorOuter) },
        uShadowRadius: { value: shadowRadius },
        uDiskWidth: { value: (outerDiskRadius - innerDiskRadius) / shadowRadius },
        uUp: { value: new THREE.Vector2(0, 1) },
        uApp: { value: new THREE.Vector2(1, 0) },
        uCosInc: { value: 0.5 },
        uAsym: { value: 1 },
        uDoppler: { value: dopplerStrength },
        uLensing: { value: hasLensingHalo ? 1 : 0 },
        uEht: { value: eht ? 1 : 0 },
        uEhtKnots: { value: body.id === 'sagittarius_a' ? 1 : 0 },
        uBrightness: { value: 1 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [colorCore, colorMid, colorOuter, shadowRadius, innerDiskRadius, outerDiskRadius, dopplerStrength, hasLensingHalo, eht, body.id, lensHalf]);

  // Callers pass jetProps inline: key the jet on its values so re-renders don't rebuild it
  const jetKey = hasJet && jetProps ? JSON.stringify(jetProps) : '';
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
        uOpacity: { value: 0.9 },
        uLength: { value: jetProps.length },
        uRadius: { value: jetProps.radius * 0.45 },
      },
      side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jetKey]);

  const jetGeometry = useMemo(
    () => (hasJet && jetProps ? makeJetGeometry(jetProps.length, jetProps.radius, low) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jetKey, low]
  );
  useEffect(() => () => jetGeometry?.dispose(), [jetGeometry]);
  useEffect(() => () => jetMaterial?.dispose(), [jetMaterial]);

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
  const donorDistance = outerDiskRadius * 2.8;
  const donorRadius = shadowRadius * 1.3;
  const donorStreamCurve = useMemo(() => {
    if (!hasDonorStream) return null;
    // Leaves the donor through the inner Lagrange point and swings round (Coriolis) to hit the disk rim
    const startPoint = new THREE.Vector3(donorDistance - donorRadius * 1.05, 0, 0);
    const endPoint = new THREE.Vector3(outerDiskRadius * 0.9, 0, outerDiskRadius * 0.3);
    const control1 = new THREE.Vector3(donorDistance * 0.6, outerDiskRadius * 0.08, -donorDistance * 0.12);
    const control2 = new THREE.Vector3(outerDiskRadius * 1.4, outerDiskRadius * 0.04, outerDiskRadius * 0.8);
    return new THREE.CubicBezierCurve3(startPoint, control1, control2, endPoint);
  }, [hasDonorStream, outerDiskRadius, donorDistance, donorRadius]);

  const streamMaterial = useMemo(
    () =>
      hasDonorStream
        ? new THREE.ShaderMaterial({
            vertexShader: StreamVertexShader,
            fragmentShader: StreamFragmentShader,
            uniforms: {
              uTime: { value: 0 },
              uColorStart: { value: new THREE.Color('#bfdbfe') },
              uColorEnd: { value: new THREE.Color(colorCore) },
            },
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
          })
        : null,
    [hasDonorStream, colorCore]
  );

  const torusMaterial = useMemo(
    () =>
      hasDustyTorus
        ? new THREE.ShaderMaterial({
            vertexShader: DustyTorusVertexShader,
            fragmentShader: DustyTorusFragmentShader,
            uniforms: {
              uTime: { value: 0 },
              uRadius: { value: outerDiskRadius * 0.3 },
              uDustColor: { value: new THREE.Color('#1c0a02') },
              uLitColor: { value: new THREE.Color('#c2410c') },
            },
            transparent: true,
            depthWrite: false,
            side: THREE.FrontSide,
          })
        : null,
    [hasDustyTorus, outerDiskRadius]
  );

  // Animate shaders, keep the lensed image facing the camera and aim its asymmetries
  useFrame(({ clock, camera }, delta) => {
    const root = rootRef.current;
    if (!root || !root.visible) return;
    const time = clock.getElapsedTime();

    diskMaterial.uniforms.uTime.value = time * spinSpeed;
    lensMaterial.uniforms.uTime.value = time * spinSpeed;
    if (jetMaterial) jetMaterial.uniforms.uTime.value = time;
    if (streamMaterial) streamMaterial.uniforms.uTime.value = time;
    if (torusMaterial) torusMaterial.uniforms.uTime.value = time;

    // Slowly rotate the disk about its own axis (its normal is unchanged)
    const disk = diskRef.current;
    if (disk) disk.rotation.z += delta * 0.05 * spinSpeed;

    const lens = lensRef.current;
    if (lens && disk && lens.parent) {
      // Face the camera: local rotation = parent^-1 * camera
      lens.parent.getWorldQuaternion(_qParent).invert();
      lens.quaternion.copy(_qParent.multiply(camera.quaternion));

      disk.getWorldQuaternion(_q);
      _n.set(0, 0, 1).applyQuaternion(_q);
      root.getWorldPosition(_pos);
      _c.copy(camera.position).sub(_pos).normalize();
      _right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      _up.set(0, 1, 0).applyQuaternion(camera.quaternion);

      const sgn = _n.dot(_c);
      const cosInc = Math.abs(sgn);
      const u = lensMaterial.uniforms;
      u.uCosInc.value = cosInc;
      u.uAsym.value = THREE.MathUtils.smoothstep(cosInc, 0.02, 0.2);
      // The far side of the disk is lifted towards the projected normal on the camera's side of the disk
      _tmp.copy(_n).multiplyScalar(sgn >= 0 ? 1 : -1);
      const ux = _tmp.dot(_right);
      const uy = _tmp.dot(_up);
      if (ux * ux + uy * uy > 1e-6) u.uUp.value.set(ux, uy).normalize();
      // Approaching side: orbital velocity n × r points at the camera where r ∥ c × n
      _tmp.crossVectors(_c, _n);
      const ax = _tmp.dot(_right);
      const ay = _tmp.dot(_up);
      if (ax * ax + ay * ay > 1e-4) u.uApp.value.set(ax, ay).normalize();

      // EHT targets seen face-on: the ring dominates, the disk itself recedes
      const faceOn = eht ? THREE.MathUtils.smoothstep(cosInc, 0.55, 0.95) : 0;
      // Quasars (TON 618) outshine everything: hotter, brighter disk
      diskMaterial.uniforms.uBrightness.value = (hasDustyTorus ? 1.7 : 1) * (1 - 0.55 * faceOn);
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
      <PooledPointLight color={colorMid} intensity={isSelected ? 10.0 : 6.0} distance={outerDiskRadius * 8} />

      {/* 1. EVENT HORIZON SHADOW — drawn first (also when faded) so it hides the far half of the disk behind it
          without blotting out the near half in front */}
      <mesh renderOrder={-1}>
        <sphereGeometry args={[shadowRadius, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* 2. PRIMARY ACCRETION DISK (equatorial plane) */}
      <group rotation={accretionTilt}>
        <mesh ref={diskRef} material={diskMaterial}>
          <ringGeometry args={[innerDiskRadius, outerDiskRadius, low ? 96 : 160, low ? 8 : 16]} />
        </mesh>

        {/* Orbiting hotspot flares (Sgr A* GRAVITY flares): soft glowing blobs of plasma */}
        {hasHotspots && (
          <group ref={hotspotsRef}>
            {hotspotsData.map((spot, idx) => (
              <group key={idx} position={[Math.cos(spot.angle) * spot.r, Math.sin(spot.angle) * spot.r, 0]}>
                <sprite scale={[spot.size * 7, spot.size * 7, 1]} raycast={noRaycast}>
                  <spriteMaterial
                    map={getCoronaTexture()}
                    color={spot.color}
                    transparent
                    opacity={0.9}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </sprite>
                <PooledPointLight color={spot.color} intensity={2.0} distance={spot.size * 10} />
              </group>
            ))}
          </group>
        )}

        {/* Clumpy obscuring dusty torus (quasars like TON 618) */}
        {hasDustyTorus && torusMaterial && (
          <mesh material={torusMaterial}>
            <torusGeometry args={[outerDiskRadius * 1.3, outerDiskRadius * 0.3, low ? 16 : 28, low ? 48 : 96]} />
          </mesh>
        )}
      </group>

      {/* 3. LENSED IMAGE — camera-facing: photon ring, far side of the disk bent over the shadow, EHT ring */}
      <mesh ref={lensRef} material={lensMaterial} raycast={noRaycast}>
        <planeGeometry args={[lensHalf * 2, lensHalf * 2]} />
      </mesh>

      {/* Quasar: the central engine outshines its host (broad-line region glow) */}
      {hasDustyTorus && (
        <sprite scale={[outerDiskRadius * 4.5, outerDiskRadius * 4.5, 1]} raycast={noRaycast}>
          <spriteMaterial
            map={getCoronaTexture()}
            color="#e9d5ff"
            transparent
            opacity={0.55}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      )}

      {/* 4. RELATIVISTIC SYNCHROTRON JETS (M87*, TON 618, Cygnus X-1): collimated, knotty, fading */}
      {hasJet && jetProps && jetMaterial && jetGeometry && (
        <group ref={jetRef} rotation={jetProps.tilt || [accretionTilt[0] + Math.PI / 2, accretionTilt[1], 0]}>
          <mesh geometry={jetGeometry} material={jetMaterial} raycast={noRaycast} />
          {jetProps.bipolar && (
            <mesh geometry={jetGeometry} material={jetMaterial} rotation={[Math.PI, 0, 0]} raycast={noRaycast} />
          )}
        </group>
      )}

      {/* 5. BINARY DONOR STAR & ACCRETION STREAM (Cygnus X-1: the O9.7 supergiant HDE 226868) */}
      {hasDonorStream && donorStreamCurve && streamMaterial && (
        <group rotation={accretionTilt}>
          {/* Nearly fills its Roche lobe: slightly drawn out towards the black hole */}
          <group position={[donorDistance, 0, 0]} scale={[1.1, 0.96, 0.96]}>
            <StarBody radius={donorRadius} kelvin={31000} spots={0} glowScale={2.4} glowOpacity={0.5} />
            <PooledPointLight color="#93c5fd" intensity={4.0} distance={outerDiskRadius * 6} />
          </group>

          {/* Roche-lobe overflow stream feeding the disk's rim (hot spot where it lands) */}
          <mesh material={streamMaterial} raycast={noRaycast}>
            <tubeGeometry args={[donorStreamCurve, 48, shadowRadius * 0.16, 10, false]} />
          </mesh>
          <sprite
            position={[outerDiskRadius * 0.9, 0, outerDiskRadius * 0.3]}
            scale={[shadowRadius * 1.1, shadowRadius * 1.1, 1]}
            raycast={noRaycast}
          >
            <spriteMaterial
              map={getCoronaTexture()}
              color="#e0f2fe"
              transparent
              opacity={0.7}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
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
