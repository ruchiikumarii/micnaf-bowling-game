"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BRAND, SCENE } from "@/lib/brand";
import { PINS } from "@/data/gameData";
import {
  DECK_END_Z,
  FRONT_ROW_Z,
  GUTTER_WIDTH,
  LANE_HALF_WIDTH,
  LANE_NEAR_Z,
  PIT_BACK_Z,
  pinPosition,
} from "@/lib/laneLayout";
import { createArenaWallTexture, createGlowTexture, createPinGeometry, createPinTexture, createSignTexture, createWoodTexture } from "./sceneAssets";

/** Width of the divider (ball-return capping) between neighbouring lanes. */
const DIVIDER_WIDTH = 0.6;
/** Centre-to-centre distance between lanes. */
export const LANE_PITCH = (LANE_HALF_WIDTH + GUTTER_WIDTH) * 2 + DIVIDER_WIDTH;
/** Where the dividers end and the kickback walls begin. */
const KICKBACK_Z = FRONT_ROW_Z + 0.5;
/** Near end of the neon (just below the bottom of the view). */
const NEAR_Z = LANE_NEAR_Z + 0.8;
const EDGE_X = LANE_HALF_WIDTH + GUTTER_WIDTH;
const WALL_Z = PIT_BACK_Z - 0.25;
const SIDE_LANES = [-2, -1, 1, 2];

interface NeonProps {
  glow: THREE.Texture;
  color: string;
  /** Runs along z from `z0` to `z1` at (x, y). */
  x: number;
  y: number;
  z0: number;
  z1: number;
  /** Width of the soft glow pool around the tube. */
  spread?: number;
  /** Brightness of the glow pool (0..1). */
  strength?: number;
}

/** A neon tube along the lane: a bright core and a soft pool of light around it. */
export function Neon({ glow, color, x, y, z0, z1, spread = 0.34, strength = 0.75 }: NeonProps) {
  const length = Math.abs(z1 - z0);
  const z = (z0 + z1) / 2;
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[0.022, 0.016, length]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[spread, length]} />
        <meshBasicMaterial
          map={glow}
          color={color}
          transparent
          opacity={strength}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** A neighbouring lane: dimmer boards, gutters, kickbacks and a full rack. */
function SideLane({ cx, wood, pin, pinSkin, glow }: { cx: number; wood: THREE.Material; pin: THREE.BufferGeometry; pinSkin: THREE.Material; glow: THREE.Texture }) {
  const length = LANE_NEAR_Z - DECK_END_Z;
  return (
    <group position={[cx, 0, 0]}>
      <mesh position={[0, -0.001, (LANE_NEAR_Z + DECK_END_Z) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={wood}>
        <planeGeometry args={[LANE_HALF_WIDTH * 2, length]} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (LANE_HALF_WIDTH + GUTTER_WIDTH / 2), -0.06, (LANE_NEAR_Z + DECK_END_Z) / 2]}>
            <boxGeometry args={[GUTTER_WIDTH, 0.02, length]} />
            <meshStandardMaterial color={SCENE.gutter} roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[side * (EDGE_X + 0.02), 0.28, (KICKBACK_Z + PIT_BACK_Z) / 2]}>
            <boxGeometry args={[0.04, 0.66, KICKBACK_Z - PIT_BACK_Z]} />
            <meshStandardMaterial color={SCENE.gutter} roughness={0.6} />
          </mesh>
          <Neon glow={glow} color={BRAND.gold} x={side * (EDGE_X + 0.02)} y={0.62} z0={KICKBACK_Z} z1={PIT_BACK_Z} spread={0.12} strength={0.5} />
        </group>
      ))}
      {PINS.map(({ number }) => {
        const { x, z } = pinPosition(number);
        return <mesh key={number} geometry={pin} material={pinSkin} position={[x, 0, z]} />;
      })}
    </group>
  );
}

/**
 * The arena around the lane: neighbouring lanes, neon-lit dividers, the
 * kickback trims, and the back wall with a lit sign over every pin deck.
 */
export function BowlingArena({ title }: { title: string }) {
  const glow = useMemo(() => createGlowTexture(), []);
  const wall = useMemo(() => {
    const t = createArenaWallTexture();
    t.repeat.set(3, 1);
    return t;
  }, []);
  const signs = useMemo(
    () => ({
      main: createSignTexture(title, BRAND.gold),
      // Side lanes: plain lit panels (no text behind the side panels of the UI).
      side: SIDE_LANES.map((i) => createSignTexture("", i % 2 ? "#ffffff" : BRAND.gold)),
    }),
    [title],
  );
  const sideWood = useMemo(() => {
    const map = createWoodTexture();
    map.repeat.set(1, (LANE_NEAR_Z - DECK_END_Z) / 2.6);
    return new THREE.MeshStandardMaterial({ map, color: "#9aa0c0", roughness: 0.3, metalness: 0.05 });
  }, []);
  const pin = useMemo(() => createPinGeometry(), []);
  const pinSkin = useMemo(() => new THREE.MeshStandardMaterial({ map: createPinTexture(), roughness: 0.3 }), []);

  useEffect(
    () => () => {
      glow.dispose();
      wall.dispose();
      signs.main.dispose();
      signs.side.forEach((s) => s.dispose());
      sideWood.map?.dispose();
      sideWood.dispose();
      pin.dispose();
      pinSkin.map?.dispose();
      pinSkin.dispose();
    },
    [glow, wall, signs, sideWood, pin, pinSkin],
  );

  // Dividers sit between every pair of lanes, from the far left lane to the far right.
  const dividers = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((k) => k * LANE_PITCH);

  return (
    <group>
      {SIDE_LANES.map((i) => (
        <SideLane key={i} cx={i * LANE_PITCH} wood={sideWood} pin={pin} pinSkin={pinSkin} glow={glow} />
      ))}

      {dividers.map((x) => (
        <group key={x}>
          <mesh position={[x, 0, (NEAR_Z + KICKBACK_Z) / 2]}>
            <boxGeometry args={[DIVIDER_WIDTH, 0.06, NEAR_Z - KICKBACK_Z]} />
            <meshStandardMaterial color="#0a0f33" roughness={0.35} metalness={0.6} />
          </mesh>
          {/* Gold tubes on both edges, a red one down the middle. */}
          <Neon glow={glow} color={BRAND.gold} x={x - DIVIDER_WIDTH / 2 + 0.02} y={0.031} z0={NEAR_Z} z1={KICKBACK_Z} />
          <Neon glow={glow} color={BRAND.gold} x={x + DIVIDER_WIDTH / 2 - 0.02} y={0.031} z0={NEAR_Z} z1={KICKBACK_Z} />
          <Neon glow={glow} color="#ff3b47" x={x} y={0.031} z0={NEAR_Z} z1={KICKBACK_Z} spread={0.2} strength={0.55} />
        </group>
      ))}

      {/* Main lane: gold trims along the tops of its kickbacks. */}
      {[-1, 1].map((side) => (
        <Neon key={side} glow={glow} color={BRAND.gold} x={side * (EDGE_X + 0.02)} y={0.62} z0={KICKBACK_Z} z1={PIT_BACK_Z} spread={0.14} strength={0.6} />
      ))}

      {/* Back wall, its neon band, and a lit sign over each pin deck. */}
      <mesh position={[0, 1.4, WALL_Z]}>
        <planeGeometry args={[LANE_PITCH * 6, 4.4]} />
        <meshBasicMaterial map={wall} />
      </mesh>
      <mesh position={[0, 1.86, WALL_Z + 0.02]}>
        <boxGeometry args={[LANE_PITCH * 6, 0.03, 0.01]} />
        <meshBasicMaterial color="#ff3b47" toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.12, WALL_Z + 0.02]}>
        <boxGeometry args={[LANE_PITCH * 6, 0.02, 0.01]} />
        <meshBasicMaterial color={BRAND.gold} toneMapped={false} />
      </mesh>
      {[0, ...SIDE_LANES].map((i) => (
        <mesh key={i} position={[i * LANE_PITCH, 1.49, WALL_Z + 0.05]}>
          <planeGeometry args={[1.8, 0.45]} />
          <meshBasicMaterial map={i === 0 ? signs.main : signs.side[SIDE_LANES.indexOf(i)]} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
