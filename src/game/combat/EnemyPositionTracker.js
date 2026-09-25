// -------------------------------------------------------------
// SHADOW ASCENSION - ENEMY POSITION TRACKER & SOFT AUTO-AIM
// Ultra-low overhead 60fps registry for enemy positions in 3D space.
// Powers soft auto-aim assistance, TAB target locking, and exact melee hit detection.
// -------------------------------------------------------------

import * as THREE from 'three';
import { safeVector3 } from '../../utils/vector3.js';

export const liveEnemyPositions = new Map();

/**
 * Register or update an enemy's live position in world coordinates.
 */
export function registerEnemyPosition(id, pos, hp, maxHp, extra = {}) {
  if (!id) return;
  const safePos = safeVector3(pos, [0, 0, 0]);
  liveEnemyPositions.set(id, {
    id,
    pos: safePos,
    hp: typeof hp === 'number' ? hp : 100,
    maxHp: typeof maxHp === 'number' ? maxHp : 100,
    ...extra
  });
}

/**
 * Remove an enemy when it dies or unmounts.
 */
export function unregisterEnemyPosition(id) {
  if (!id) return;
  liveEnemyPositions.delete(id);
}

/**
 * Retrieve the current live position array [x, y, z] of an enemy, or fallback.
 */
export function getEnemyPosition(id, fallback = [0, 0, 0]) {
  const entry = liveEnemyPositions.get(id);
  if (!entry || !entry.pos) return fallback;
  return entry.pos;
}

/**
 * Get all currently tracked living enemies as an array.
 */
export function getAllLivingEnemies() {
  const list = [];
  for (const entry of liveEnemyPositions.values()) {
    if (entry && entry.hp > 0) {
      list.push(entry);
    }
  }
  return list;
}

/**
 * Soft Auto-Aim: Finds the closest living monster in front of the player within a forward cone.
 * @param {Array<number>} playerPos - [x, y, z]
 * @param {number} playerFacingAngle - Yaw in radians
 * @param {number} maxDist - Maximum distance for melee auto-aim assistance (default 5.5m)
 * @param {number} coneAngleDeg - Half-angle of cone in degrees (e.g. 80 deg for a broad frontal arc)
 */
export function getNearestEnemyInCone(playerPos, playerFacingAngle, maxDist = 5.5, coneAngleDeg = 80) {
  const [px, , pz] = safeVector3(playerPos, [0, 0, 0]);
  let nearest = null;
  let minDist = maxDist;
  const coneAngleRad = (coneAngleDeg * Math.PI) / 180;

  for (const entry of liveEnemyPositions.values()) {
    if (!entry || entry.hp <= 0 || !entry.pos) continue;

    const [ex, , ez] = entry.pos;
    const dx = ex - px;
    const dz = ez - pz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > maxDist) continue;

    // Calculate angle in X-Z plane
    const angleToTarget = Math.atan2(dx, dz);
    let diff = Math.abs(angleToTarget - playerFacingAngle);
    while (diff > Math.PI) diff = Math.abs(diff - 2 * Math.PI);

    if (diff <= coneAngleRad && dist < minDist) {
      minDist = dist;
      nearest = {
        ...entry,
        dist,
        angleToTarget
      };
    }
  }

  return nearest;
}

/**
 * Target Lock Assistance: Finds the closest living enemy around the player within a 360 radius.
 */
export function getNearestEnemy(playerPos, maxDist = 30) {
  const [px, , pz] = safeVector3(playerPos, [0, 0, 0]);
  let nearest = null;
  let minDist = maxDist;

  for (const entry of liveEnemyPositions.values()) {
    if (!entry || entry.hp <= 0 || !entry.pos) continue;

    const [ex, , ez] = entry.pos;
    const dx = ex - px;
    const dz = ez - pz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < minDist) {
      minDist = dist;
      nearest = {
        ...entry,
        dist,
        angleToTarget: Math.atan2(dx, dz)
      };
    }
  }

  return nearest;
}
