'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES } from '@/data/universeData';
import { getRegisteredCelestialEntries, calculateFramingCameraPosition } from '@/lib/celestialRegistry';
import { getLightPoolStats } from '../rendering/LightPool';
import { validateFrames, worldPositionAt } from '@/lib/frames';
import { earthSeason, poleQuaternion } from '@/lib/ephemeris';
import { skyDateMs, skyDaysSinceJ2000, simClock as _sky } from '@/lib/simClock';
import { CONSTELLATIONS } from '@/data/constellationData';

// Dev-only diagnostics bridge: exposes `window.__universeDebug` so Playwright scripts in scratch/
// can measure what is mounted, what is visible, and how fast frames render.

const FRAME_SAMPLES = 180;
const MIN_PIXEL_RADIUS = 2; // bodies smaller than this on screen are not "expected" to be seen

const _frustum = new THREE.Frustum();
const _projScreen = new THREE.Matrix4();
const _sphere = new THREE.Sphere();
const _pos = new THREE.Vector3();
const _fwd = new THREE.Vector3();

// Product of the fade factors (rendering/useDistanceFade) above an object: 0 = fully faded out
function fadeAlpha(obj: THREE.Object3D): number {
  let a = 1;
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) {
    if (typeof o.userData.fade === 'number') a *= o.userData.fade;
  }
  return a;
}

function isEffectivelyVisible(obj: THREE.Object3D, scene: THREE.Scene): boolean {
  let o: THREE.Object3D | null = obj;
  while (o) {
    if (!o.visible) return false;
    if (o === scene) return true;
    o = o.parent;
  }
  return false; // detached from the scene graph
}

export const UniverseDebugProbe: React.FC = () => {
  const { camera, scene, gl, size, raycaster } = useThree();
  const frameMs = useRef<number[]>([]);
  const lastT = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (lastT.current) {
      frameMs.current.push(now - lastT.current);
      if (frameMs.current.length > FRAME_SAMPLES) frameMs.current.shift();
    }
    lastT.current = now;
  });

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;

    const snapshot = () => {
      cam.updateMatrixWorld();
      _projScreen.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
      _frustum.setFromProjectionMatrix(_projScreen);
      cam.getWorldDirection(_fwd);
      const tanHalfFov = Math.tan(((cam.fov ?? 48) * Math.PI) / 360);
      const pxRadius = (radius: number, dist: number) =>
        dist <= 0 ? Infinity : (radius / (dist * tanHalfFov)) * (size.height / 2);

      const st = useQuantumStore.getState();
      const layers = scene.children.filter((c) => c.name.startsWith('universe-scale-'));
      const levelOf = (c: THREE.Object3D) => Number(c.name.replace('universe-scale-', ''));
      const mountedScales = layers.map(levelOf).sort();
      const visibleScales = layers.filter((c) => c.visible).map(levelOf).sort();

      const registered = new Map(getRegisteredCelestialEntries());
      const bodies: Record<string, unknown>[] = [];
      const hiddenInView: string[] = []; // in view, its scale layer is shown, but the object is hidden
      const unmountedInView: string[] = []; // in view, its scale layer is shown, but no object registered
      const otherScaleInView: string[] = []; // in view but its scale layer is hidden (by design)
      const visibleIds: string[] = [];
      let visibleRegistered = 0;

      for (const [id, body] of Object.entries(CELESTIAL_BODIES)) {
        const obj = registered.get(id);
        if (obj) obj.getWorldPosition(_pos);
        else _pos.set(...body.position);
        const dist = cam.position.distanceTo(_pos);
        _sphere.center.copy(_pos);
        _sphere.radius = Math.max(body.size, 0.01);
        const inFrustum = _frustum.intersectsSphere(_sphere);
        const px = pxRadius(body.size, dist);
        const visible = obj ? isEffectivelyVisible(obj, scene) : false;
        if (visible) {
          visibleRegistered++;
          visibleIds.push(id);
        }
        const expected = inFrustum && px >= MIN_PIXEL_RADIUS;
        const layerShown = visibleScales.includes(body.scaleLevel);
        if (expected && !layerShown && !visible) otherScaleInView.push(id);
        else if (expected && obj && !visible) hiddenInView.push(id);
        else if (expected && !obj) unmountedInView.push(id);
        const alpha = obj && visible ? Math.round(fadeAlpha(obj) * 100) / 100 : 0;
        bodies.push({ id, scale: body.scaleLevel, registered: !!obj, visible, alpha, inFrustum, px: Math.round(px * 10) / 10, dist: Math.round(dist) });
      }

      // Light census: three.js recompiles every lit material whenever the number of rendered lights changes
      let pointLightsTotal = 0;
      let pointLightsRendered = 0;
      let pointLightsActive = 0;
      let litMaterials = 0;
      scene.traverse((o) => {
        const light = o as THREE.PointLight;
        if (light.isPointLight) {
          pointLightsTotal++;
          if (isEffectivelyVisible(o, scene)) {
            pointLightsRendered++;
            if (light.intensity > 0) pointLightsActive++;
          }
        }
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && isEffectivelyVisible(o, scene)) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          litMaterials += mats.filter((m) => m && (m as THREE.MeshStandardMaterial).isMeshStandardMaterial).length;
        }
      });

      const ft = [...frameMs.current].sort((a, b) => a - b);
      const avg = ft.length ? ft.reduce((a, b) => a + b, 0) / ft.length : 0;

      return {
        camera: {
          pos: cam.position.toArray().map((v) => Math.round(v)),
          forward: _fwd.toArray().map((v) => Math.round(v * 1000) / 1000),
          distFromOrigin: Math.round(cam.position.length()),
        },
        store: {
          cosmicScaleLevel: st.cosmicScaleLevel,
          adjacentCosmicScaleLevel: st.adjacentCosmicScaleLevel,
          selectedCosmicBodyId: st.selectedCosmicBodyId,
          scaleNavigationRequest: st.scaleNavigationRequest?.level ?? null,
        },
        mountedScales,
        visibleScales,
        visibleScaleMask: st.visibleScaleMask,
        registeredCount: registered.size,
        visibleRegistered,
        visibleIds,
        hiddenInView,
        unmountedInView,
        otherScaleInView,
        bodies,
        render: {
          calls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          points: gl.info.render.points,
          programs: gl.info.programs?.length ?? 0,
          geometries: gl.info.memory.geometries,
          textures: gl.info.memory.textures,
          pointLightsTotal,
          pointLightsRendered,
          pointLightsActive,
          litMeshes: litMaterials,
          lightPool: getLightPoolStats(),
        },
        frames: {
          samples: ft.length,
          fps: avg ? Math.round(1000 / avg) : 0,
          p95Ms: ft.length ? Math.round(ft[Math.floor(ft.length * 0.95)] * 10) / 10 : 0,
          maxMs: ft.length ? Math.round(ft[ft.length - 1] * 10) / 10 : 0,
        },
      };
    };

    const lookAt = (pos: [number, number, number], target: [number, number, number]) => {
      cam.position.set(...pos);
      cam.lookAt(...target);
      cam.updateMatrixWorld();
    };

    // Canonical framing pose for a body (same math the selection tween uses), without selecting it
    const framingFor = (id: string) => {
      const body = CELESTIAL_BODIES[id];
      if (!body) return null;
      const target = new THREE.Vector3(...body.position);
      const out = new THREE.Vector3();
      calculateFramingCameraPosition(id, target, out);
      return { pos: out.toArray(), target: target.toArray() };
    };

    // Screen position (CSS px) of a registered body, for driving real mouse hover/click in tests
    const projectBody = (id: string) => {
      const obj = getRegisteredCelestialEntries().find(([bodyId]) => bodyId === id)?.[1];
      if (!obj) return null;
      cam.updateMatrixWorld();
      const p = obj.getWorldPosition(new THREE.Vector3()).project(cam);
      const rect = gl.domElement.getBoundingClientRect();
      return { x: rect.left + ((p.x + 1) / 2) * rect.width, y: rect.top + ((1 - p.y) / 2) * rect.height, onScreen: Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && p.z < 1 };
    };

    // Registered objects whose live world position is far from their catalogued position (relative to their host
    // galaxy's size, or 2000 units): catches objects rendered in the wrong frame, which send the camera astray
    const positionAudit = () => {
      const out: { id: string; offset: number; live: number[]; data: number[] }[] = [];
      for (const [id, obj] of getRegisteredCelestialEntries()) {
        const body = CELESTIAL_BODIES[id];
        if (!body) continue;
        const live = obj.getWorldPosition(new THREE.Vector3());
        const offset = live.distanceTo(new THREE.Vector3(...body.position));
        const host = body.parentBodyId ? CELESTIAL_BODIES[body.parentBodyId] : undefined;
        const tolerance = Math.max(2000, host && host.type === 'galaxy' ? host.size * 0.9 : 0);
        if (offset > tolerance && body.scaleLevel >= 3) {
          out.push({ id, offset: Math.round(offset), live: live.toArray().map(Math.round), data: body.position });
        }
      }
      return out;
    };

    // What a click at (x, y) CSS px would hit, nearest first: the object, the registered body it belongs to, and
    // whether the object is drawn. Uses the canvas' own raycaster, so thresholds match real pointer events.
    const pick = (x: number, y: number, limit = 12) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
      cam.updateMatrixWorld();
      raycaster.setFromCamera(ndc, cam);
      const owners = new Map<THREE.Object3D, string>();
      for (const [id, obj] of getRegisteredCelestialEntries()) owners.set(obj, id);
      return raycaster
        .intersectObjects(scene.children, true)
        .slice(0, limit)
        .map((hit) => {
          let body: string | null = null;
          let drawn = true;
          for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) {
            if (!o.visible) drawn = false;
            if (!body && owners.has(o)) body = owners.get(o)!;
          }
          return { type: hit.object.type, geometry: (hit.object as THREE.Mesh).geometry?.type, name: hit.object.name, body, drawn, distance: Math.round(hit.distance) };
        });
    };

    const w = window as unknown as Record<string, unknown>;
    w.__universeDebug = {
      validateFrames,
      // Sky check for a date: Earth's pole vs the Sun (positive = northern summer), Saturn's ring opening seen from Earth
      sky: () => {
        const t = _sky.time;
        const earth = worldPositionAt('earth', t, new THREE.Vector3());
        const saturn = worldPositionAt('saturn', t, new THREE.Vector3());
        const pole = (id: string) => new THREE.Vector3(0, 1, 0).applyQuaternion(poleQuaternion(id));
        const toSun = earth.clone().negate().normalize();
        const earthToSaturn = saturn.clone().sub(earth).normalize();
        return {
          date: new Date(skyDateMs()).toISOString(),
          season: earthSeason(skyDaysSinceJ2000()),
          earthPoleTowardSunDeg: +(90 - (Math.acos(pole('earth').dot(toSun)) * 180) / Math.PI).toFixed(2),
          saturnRingOpeningDeg: +(90 - (Math.acos(Math.abs(pole('saturn').dot(earthToSaturn))) * 180) / Math.PI).toFixed(2),
        };
      },
      constellations: CONSTELLATIONS,
      pick,
      positionAudit,
      snapshot,
      lookAt,
      framingFor,
      projectBody,
      camera: cam,
      scene,
      store: useQuantumStore,
      resetFrames: () => {
        frameMs.current = [];
        lastT.current = 0;
      },
    };
    return () => {
      delete w.__universeDebug;
    };
  }, [camera, scene, gl, size, raycaster]);

  return null;
};
