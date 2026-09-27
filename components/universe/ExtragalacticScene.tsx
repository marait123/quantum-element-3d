'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuantumStore } from '@/stores/useQuantumStore';
import { CELESTIAL_BODIES, CelestialBody } from '@/data/universeData';
import { getGlowPointTexture } from '@/lib/planetTextures';
import { RealisticBlackHole } from './blackhole/RealisticBlackHole';
import { RealisticNebula } from './nebula/RealisticNebula';
import { RealisticSupernova } from './supernova/RealisticSupernova';
import { RealisticGalaxy } from './galaxy/RealisticGalaxy';
import {
  M31CoreBlackHoleSystem,
  HubbleV1Cepheid,
  MayallIIGlobularCluster,
  PA99N2ExoplanetSystem,
  M33X7BinarySystem,
  SDoradusHypergiant,
  SMCX1PulsarSystem,
} from './galaxy/ExtragalacticObjects';

const _scratchVecA = new THREE.Vector3();

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
        tilt: [Math.PI / 4, Math.PI / 4, 0],
      }}
      isSelected={isSelected}
      onSelect={onSelect}
      language={language}
    />
  );
};

export const ExtragalacticScene: React.FC = () => {
  const language = useQuantumStore((s) => s.language);
  const selectedCosmicBodyId = useQuantumStore((s) => s.selectedCosmicBodyId);
  const setSelectedCosmicBodyId = useQuantumStore((s) => s.setSelectedCosmicBodyId);
  const highlightedCosmicElementNum = useQuantumStore((s) => s.highlightedCosmicElementNum);

  const [glowTexture, setGlowTexture] = useState<THREE.CanvasTexture | undefined>(undefined);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Hierarchical LoD: Internal galaxy subsystems are culled when viewing macro Extragalactic scale
  const andromedaInternalsRef = useRef<THREE.Group>(null);
  const triangulumInternalsRef = useRef<THREE.Group>(null);
  const lmcInternalsRef = useRef<THREE.Group>(null);
  const smcInternalsRef = useRef<THREE.Group>(null);

  useEffect(() => {
    setGlowTexture(getGlowPointTexture());
  }, []);

  const isHighlighted = (body?: CelestialBody) =>
    body !== undefined &&
    highlightedCosmicElementNum !== null &&
    body.primaryElements.some((e) => e.atomicNumber === highlightedCosmicElementNum);

  useFrame(() => {
    if (andromedaInternalsRef.current) {
      const isSelected = !!selectedCosmicBodyId && [
        'andromeda_core_black_hole',
        'hubble_v1_star',
        'mayall_ii_cluster',
        'pa_99_n2_star',
        'pa_99_n2_planet',
      ].includes(selectedCosmicBodyId);
      _scratchVecA.set(75000, 18000, -60000);
      andromedaInternalsRef.current.visible = isSelected || camera.position.distanceTo(_scratchVecA) < 45000;
    }

    if (triangulumInternalsRef.current) {
      const isSelected = !!selectedCosmicBodyId && [
        'ngc_604_nebula',
        'm33_x7_star',
        'm33_x7_black_hole',
      ].includes(selectedCosmicBodyId);
      _scratchVecA.set(-45000, 12000, 42000);
      triangulumInternalsRef.current.visible = isSelected || camera.position.distanceTo(_scratchVecA) < 30000;
    }

    if (lmcInternalsRef.current) {
      const isSelected = !!selectedCosmicBodyId && [
        'tarantula_nebula',
        'r136a1',
        's_doradus',
        'sn_1987a',
      ].includes(selectedCosmicBodyId);
      _scratchVecA.set(-24000, -22000, 18000);
      lmcInternalsRef.current.visible = isSelected || camera.position.distanceTo(_scratchVecA) < 26000;
    }

    if (smcInternalsRef.current) {
      const isSelected = !!selectedCosmicBodyId && [
        'ngc_346_nebula',
        'smc_x1_star',
        'smc_x1_pulsar',
      ].includes(selectedCosmicBodyId);
      _scratchVecA.set(-30000, -32000, 28000);
      smcInternalsRef.current.visible = isSelected || camera.position.distanceTo(_scratchVecA) < 22000;
    }
  });

  return (
    <group ref={groupRef}>
      {/* ==================================================== */}
      {/* 1. ANDROMEDA GALAXY (M31) & INTERNAL SYSTEMS */}
      {/* ==================================================== */}
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

      {/* Andromeda Internal Sub-Systems (LoD Culling: only visible when proximity < 45000 or entity selected) */}
      <group ref={andromedaInternalsRef} visible={false}>
        {/* M31* Core Supermassive Black Hole & Double Nucleus */}
        {CELESTIAL_BODIES.andromeda_core_black_hole && (
          <M31CoreBlackHoleSystem
            body={CELESTIAL_BODIES.andromeda_core_black_hole}
            isSelected={selectedCosmicBodyId === 'andromeda_core_black_hole'}
            onSelect={() => setSelectedCosmicBodyId('andromeda_core_black_hole')}
            language={language}
          />
        )}

        {/* Hubble's Variable V1 (Historic Cepheid) */}
        {CELESTIAL_BODIES.hubble_v1_star && (
          <HubbleV1Cepheid
            body={CELESTIAL_BODIES.hubble_v1_star}
            isSelected={selectedCosmicBodyId === 'hubble_v1_star'}
            onSelect={() => setSelectedCosmicBodyId('hubble_v1_star')}
            language={language}
          />
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
          <PA99N2ExoplanetSystem
            star={CELESTIAL_BODIES.pa_99_n2_star}
            planet={CELESTIAL_BODIES.pa_99_n2_planet}
            selectedId={selectedCosmicBodyId}
            onSelect={(id) => setSelectedCosmicBodyId(id)}
            language={language}
          />
        )}
      </group>

      {/* ==================================================== */}
      {/* 2. TRIANGULUM GALAXY (M33) & INTERNAL SYSTEMS */}
      {/* ==================================================== */}
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

      {/* Triangulum Internal Sub-Systems (LoD Culling: proximity < 30000 or selected) */}
      <group ref={triangulumInternalsRef} visible={false}>
        {/* NGC 604 Giant Starburst Nursery */}
        {CELESTIAL_BODIES.ngc_604_nebula && (
          <RealisticNebula
            body={CELESTIAL_BODIES.ngc_604_nebula}
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
            star={CELESTIAL_BODIES.m33_x7_star}
            blackHole={CELESTIAL_BODIES.m33_x7_black_hole}
            selectedId={selectedCosmicBodyId}
            onSelect={(id) => setSelectedCosmicBodyId(id)}
            language={language}
          />
        )}
      </group>

      {/* ==================================================== */}
      {/* 3. LARGE MAGELLANIC CLOUD (LMC) & INTERNAL SYSTEMS */}
      {/* ==================================================== */}
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

      {/* LMC Internal Sub-Systems (LoD Culling: proximity < 26000 or selected) */}
      <group ref={lmcInternalsRef} visible={false}>
        {/* Tarantula Nebula (30 Doradus) */}
        {CELESTIAL_BODIES.tarantula_nebula && (
          <RealisticNebula
            body={CELESTIAL_BODIES.tarantula_nebula}
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
            position={CELESTIAL_BODIES.r136a1.position}
            onClick={(e) => {
              if (e.delta && e.delta > 5) return;
              e.stopPropagation();
              setSelectedCosmicBodyId('r136a1');
            }}
          >
            <pointLight color="#60a5fa" intensity={8.0} distance={CELESTIAL_BODIES.r136a1.size * 8} />
            <mesh>
              <sphereGeometry args={[CELESTIAL_BODIES.r136a1.size, 32, 32]} />
              <meshStandardMaterial
                color="#93c5fd"
                emissive="#3b82f6"
                emissiveIntensity={1.5}
                roughness={0.2}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[CELESTIAL_BODIES.r136a1.size * 1.35, 24, 24]} />
              <meshBasicMaterial color="#60a5fa" transparent opacity={0.3} side={THREE.BackSide} wireframe />
            </mesh>
            {selectedCosmicBodyId === 'r136a1' && (
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry
                  args={[CELESTIAL_BODIES.r136a1.size * 1.4, CELESTIAL_BODIES.r136a1.size * 1.55, 36]}
                />
                <meshBasicMaterial color="#38bdf8" side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        )}

        {/* S Doradus Prototype LBV Hypergiant */}
        {CELESTIAL_BODIES.s_doradus && (
          <SDoradusHypergiant
            body={CELESTIAL_BODIES.s_doradus}
            isSelected={selectedCosmicBodyId === 's_doradus'}
            onSelect={() => setSelectedCosmicBodyId('s_doradus')}
            language={language}
          />
        )}

        {/* Supernova 1987A (Circumstellar Pearl Collision Ring in LMC) */}
        {CELESTIAL_BODIES.sn_1987a && (
          <RealisticSupernova
            body={CELESTIAL_BODIES.sn_1987a}
            isSelected={selectedCosmicBodyId === 'sn_1987a'}
            isHighlighted={isHighlighted(CELESTIAL_BODIES.sn_1987a)}
            onSelect={() => setSelectedCosmicBodyId('sn_1987a')}
            language={language}
            icon="💥"
          />
        )}
      </group>

      {/* ==================================================== */}
      {/* 4. SMALL MAGELLANIC CLOUD (SMC) & INTERNAL SYSTEMS */}
      {/* ==================================================== */}
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

      {/* SMC Internal Sub-Systems (LoD Culling: proximity < 22000 or selected) */}
      <group ref={smcInternalsRef} visible={false}>
        {/* NGC 346 Starburst Nursery */}
        {CELESTIAL_BODIES.ngc_346_nebula && (
          <RealisticNebula
            body={CELESTIAL_BODIES.ngc_346_nebula}
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
            star={CELESTIAL_BODIES.smc_x1_star}
            pulsar={CELESTIAL_BODIES.smc_x1_pulsar}
            selectedId={selectedCosmicBodyId}
            onSelect={(id) => setSelectedCosmicBodyId(id)}
            language={language}
          />
        )}
      </group>

      {/* ==================================================== */}
      {/* 5. NEAR ACTIVE & STARBURST GALAXIES */}
      {/* ==================================================== */}
      {/* Centaurus A (NGC 5128 Active Galaxy with 1M-ly Jets) */}
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

      {/* Messier 82 (Cigar Galaxy - Superwind Starburst Chimneys) */}
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

      {/* M87* Supermassive Black Hole & 5,000-ly Jet */}
      {CELESTIAL_BODIES.m87_black_hole && (
        <M87SupermassiveBlackHole
          body={CELESTIAL_BODIES.m87_black_hole}
          isSelected={selectedCosmicBodyId === 'm87_black_hole'}
          onSelect={() => setSelectedCosmicBodyId('m87_black_hole')}
          language={language}
        />
      )}
    </group>
  );
};
