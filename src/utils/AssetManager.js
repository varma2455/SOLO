// -------------------------------------------------------------
// SHADOW ASCENSION - ASSET MANAGER & 3D PROCEDURAL FALLBACK SYSTEM
// Ensures the game NEVER renders a black screen or crashes if an asset fails to load.
// -------------------------------------------------------------

import * as THREE from 'three';

class AssetManagerClass {
  constructor() {
    this.failedAssets = new Set();
    this.loadedAssets = new Map();
    this.listeners = new Set();
  }

  markFailed(assetId, error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[AssetManager] Asset "${assetId}" failed to load. Falling back to procedural geometry:`, error);
    }
    this.failedAssets.add(assetId);
    this.notify();
  }

  isFailed(assetId) {
    return this.failedAssets.has(assetId);
  }

  markLoaded(assetId, data) {
    this.loadedAssets.set(assetId, data);
    this.notify();
  }

  isLoaded(assetId) {
    return this.loadedAssets.has(assetId);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.error('[AssetManager] Listener error:', err);
      }
    });
  }

  clear() {
    this.failedAssets.clear();
    this.loadedAssets.clear();
  }
}

export const AssetManager = new AssetManagerClass();

// -------------------------------------------------------------
// PROCEDURAL FALLBACK GEOMETRY GENERATORS
// Used immediately whenever high-res assets or GLTFs fail to load
// -------------------------------------------------------------

/**
 * Procedural Humanoid Fallback Mesh
 * Proper proportions (head, chest, arms, legs, runic sword)
 */
export const createFallbackHumanoidGeometry = () => {
  const group = new THREE.Group();

  // Torso / Chest
  const chestGeo = new THREE.BoxGeometry(0.5, 0.65, 0.3);
  const chestMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7, metalness: 0.3 });
  const chest = new THREE.Mesh(chestGeo, chestMat);
  chest.position.y = 1.1;
  chest.castShadow = true;
  group.add(chest);

  // Head
  const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.6 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.62;
  head.castShadow = true;
  group.add(head);

  // Glowing Hunter Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.02), eyeMat);
  leftEye.position.set(-0.06, 1.62, 0.17);
  const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.02), eyeMat);
  rightEye.position.set(0.06, 1.62, 0.17);
  group.add(leftEye, rightEye);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.6, 8);
  const armMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.position.set(-0.34, 1.1, 0);
  leftArm.castShadow = true;
  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.position.set(0.34, 1.1, 0);
  rightArm.castShadow = true;
  group.add(leftArm, rightArm);

  // Legs
  const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.8, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.position.set(-0.16, 0.45, 0);
  leftLeg.castShadow = true;
  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.position.set(0.16, 0.45, 0);
  rightLeg.castShadow = true;
  group.add(leftLeg, rightLeg);

  // Runic Sword
  const bladeGeo = new THREE.BoxGeometry(0.06, 0.9, 0.02);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
  const sword = new THREE.Mesh(bladeGeo, bladeMat);
  sword.position.set(0.38, 0.95, 0.25);
  sword.rotation.x = 0.4;
  sword.castShadow = true;
  group.add(sword);

  return group;
};

/**
 * Procedural Monster Fallback Mesh
 */
export const createFallbackMonsterGeometry = (color = 0x991b1b) => {
  const group = new THREE.Group();

  // Hunched Body
  const bodyGeo = new THREE.DodecahedronGeometry(0.65);
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.85;
  body.castShadow = true;
  group.add(body);

  // Glowing Red Monster Eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
  leftEye.position.set(-0.2, 1.05, 0.5);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), eyeMat);
  rightEye.position.set(0.2, 1.05, 0.5);
  group.add(leftEye, rightEye);

  return group;
};
