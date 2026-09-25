// -------------------------------------------------------------
// SHADOW ASCENSION - SAFE VECTOR & POSITION VALIDATION UTILITIES
// Prevents any undefined, NaN, or Infinity transforms from crashing Three.js
// -------------------------------------------------------------

import * as THREE from 'three';

export const DEFAULT_PLAYER_POSITION = [0, 1, 8];
export const DEFAULT_CAMERA_OFFSET = [0, 2.8, 6.5];
export const DEFAULT_SPAWN_POSITION = [0, 1, 8];

/**
 * Checks if a value is a valid finite 3-element vector array or Vector3-like object.
 * @param {any} value
 * @returns {boolean}
 */
export function isValidVector3(value) {
  if (!value) return false;

  // Array format [x, y, z]
  if (Array.isArray(value)) {
    return (
      value.length >= 3 &&
      Number.isFinite(value[0]) &&
      Number.isFinite(value[1]) &&
      Number.isFinite(value[2])
    );
  }

  // Object format { x, y, z }
  if (typeof value === 'object') {
    return (
      Number.isFinite(value.x) &&
      Number.isFinite(value.y) &&
      Number.isFinite(value.z)
    );
  }

  return false;
}

/**
 * Returns a guaranteed valid 3-number array [x, y, z].
 * If invalid, falls back to the specified fallback (or [0, 0, 0]) and logs in dev.
 * @param {any} value
 * @param {[number, number, number]} fallback
 * @param {string} sourceName
 * @returns {[number, number, number]}
 */
export function safeVector3(value, fallback = [0, 0, 0], sourceName = 'Unknown') {
  if (Array.isArray(value) && value.length >= 3) {
    const x = Number(value[0]);
    const y = Number(value[1]);
    const z = Number(value[2]);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return [x, y, z];
    }
  }

  if (value && typeof value === 'object') {
    const x = Number(value.x);
    const y = Number(value.y);
    const z = Number(value.z);
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      return [x, y, z];
    }
  }

  if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
    console.warn(`[SafeVector3] Invalid vector encountered in "${sourceName}":`, value, '-> Defaulting to fallback:', fallback);
  }

  return Array.isArray(fallback) && fallback.length >= 3
    ? [Number(fallback[0]) || 0, Number(fallback[1]) || 0, Number(fallback[2]) || 0]
    : [0, 0, 0];
}

/**
 * Safely copies coordinates into a THREE.Vector3 target.
 * @param {THREE.Vector3} target
 * @param {any} source
 * @param {[number, number, number]} fallback
 * @returns {THREE.Vector3}
 */
export function safeCopyVector3(target, source, fallback = [0, 0, 0]) {
  if (!target || typeof target.set !== 'function') {
    target = new THREE.Vector3();
  }
  const [x, y, z] = safeVector3(source, fallback);
  target.set(x, y, z);
  return target;
}

/**
 * Clamps coordinates within dungeon boundary limits.
 * @param {[number, number, number]} pos
 * @returns {[number, number, number]}
 */
export function clampDungeonBounds(pos) {
  const [x, y, z] = safeVector3(pos, DEFAULT_PLAYER_POSITION);
  return [
    Math.max(-24, Math.min(24, x)),
    Math.max(0, Math.min(12, y)),
    Math.max(-165, Math.min(28, z))
  ];
}
