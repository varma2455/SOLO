// -------------------------------------------------------------
// SHADOW ASCENSION - REALISTIC ENEMY AI & PERCEPTION SYSTEM
// Features:
// 1. Realistic Perception System (Vision Cone, Vision Range, Hearing Range, Behind Check)
// 2. Alert Notification (!) Billboard & Group Alert Propagation (Shouting)
// 3. Shared Attack Token Coordinator (Prevents simultaneous mob attacks)
// 4. Realistic Room Patrol Profiles (Roamer, Door Guard, Pillar Patrol, Treasure Guard, Resting)
// 5. 50-70% Independent Movement (monsters move even when player stands still)
// 6. Smooth Physics Locomotion (velocity, acceleration, rotation slerp, obstacle avoidance)
// 7. Dynamic Steering around Pillars, Sarcophagi, Walls, and Other Enemies
// -------------------------------------------------------------

import * as THREE from 'three';

// Reusable scratch vectors to eliminate runtime garbage collection
const _vToPlayer = new THREE.Vector3();
const _vForward = new THREE.Vector3();
const _vDesired = new THREE.Vector3();
const _vSteer = new THREE.Vector3();
const _vSep = new THREE.Vector3();

// Known physical room bounds
export const DUNGEON_ROOM_BOUNDS = {
  1: { xMin: -12.5, xMax: 12.5, zMin: -24.5, zMax: 4.5, floorY: 0, centerZ: -10 },
  2: { xMin: -11.5, xMax: 11.5, zMin: -69.0, zMax: -43.0, floorY: 0, centerZ: -56.5 },
  3: { xMin: -13.5, xMax: 13.5, zMin: -105.0, zMax: -75.0, floorY: 0, centerZ: -90.5 },
  4: { xMin: -22.0, xMax: 22.0, zMin: -160.0, zMax: -115.0, floorY: 0, centerZ: -136.0 }
};

// Known physical obstacles per room (Columns, Sarcophagi, Dais)
export const DUNGEON_OBSTACLES = {
  1: [
    // Grand Columns (x, z, radius)
    { type: 'cylinder', x: -7.5, z: -2, radius: 1.4 },
    { type: 'cylinder', x: 7.5, z: -2, radius: 1.4 },
    { type: 'cylinder', x: -7.5, z: -16, radius: 1.4 },
    { type: 'cylinder', x: 7.5, z: -16, radius: 1.4 },
    // Sarcophagi
    { type: 'box', x: -11, z: -5, hx: 1.2, hz: 1.6 },
    { type: 'box', x: -11, z: -13, hx: 1.2, hz: 1.6 },
    { type: 'box', x: 11, z: -5, hx: 1.2, hz: 1.6 },
    { type: 'box', x: 11, z: -13, hx: 1.2, hz: 1.6 }
  ],
  2: [
    { type: 'cylinder', x: -6.5, z: -48, radius: 1.4 },
    { type: 'cylinder', x: 6.5, z: -48, radius: 1.4 },
    { type: 'cylinder', x: -6.5, z: -65, radius: 1.4 },
    { type: 'cylinder', x: 6.5, z: -65, radius: 1.4 }
  ],
  3: [
    { type: 'cylinder', x: -5, z: -82, radius: 1.4 },
    { type: 'cylinder', x: 5, z: -82, radius: 1.4 },
    { type: 'cylinder', x: -5, z: -98, radius: 1.4 },
    { type: 'cylinder', x: 5, z: -98, radius: 1.4 }
  ],
  4: [
    { type: 'cylinder', x: 0, z: -159, radius: 4.0 } // Throne
  ]
};

// -------------------------------------------------------------
// 1. GROUP COMBAT COORDINATOR (ATTACK TOKENS & SHOUT PROPAGATION)
// -------------------------------------------------------------
class GroupCombatCoordinatorClass {
  constructor() {
    this.activeAttackTokens = new Map(); // roomIndex -> Set of enemyIds currently attacking
    this.alertListeners = new Set();
    this.enemyPositions = new Map(); // enemyId -> { pos, room, hp, tier, role }
  }

  registerPosition(enemyId, pos, room, hp, maxHp) {
    this.enemyPositions.set(enemyId, { pos, room, hp, maxHp });
  }

  unregister(enemyId) {
    this.enemyPositions.delete(enemyId);
    for (const tokenSet of this.activeAttackTokens.values()) {
      tokenSet.delete(enemyId);
    }
  }

  // Request token to attack player. Returns true if granted.
  requestAttackToken(roomIndex, enemyId) {
    if (!this.activeAttackTokens.has(roomIndex)) {
      this.activeAttackTokens.set(roomIndex, new Set());
    }
    const tokenSet = this.activeAttackTokens.get(roomIndex);

    // Max 1 concurrent attacker in 1-on-1/normal, 2 concurrent attackers in swarms
    const maxTokens = 2;
    if (tokenSet.size < maxTokens || tokenSet.has(enemyId)) {
      tokenSet.add(enemyId);
      return true;
    }
    return false;
  }

  releaseAttackToken(roomIndex, enemyId) {
    const tokenSet = this.activeAttackTokens.get(roomIndex);
    if (tokenSet) {
      tokenSet.delete(enemyId);
    }
  }

  // Broadcast alert shout to all nearby allies within radius
  shoutAlert(originEnemyId, roomIndex, originPos, shoutRadius = 14.0) {
    this.alertListeners.forEach((listener) => {
      try {
        listener(originEnemyId, roomIndex, originPos, shoutRadius);
      } catch (err) {
        console.error('[GroupCombatCoordinator] Shout listener error:', err);
      }
    });
  }

  subscribeShout(fn) {
    this.alertListeners.add(fn);
    return () => this.alertListeners.delete(fn);
  }
}

export const GroupCombatCoordinator = new GroupCombatCoordinatorClass();

// -------------------------------------------------------------
// 2. REALISTIC PERCEPTION SYSTEM
// -------------------------------------------------------------
/**
 * Checks whether an enemy perceives the player via Vision Cone or Hearing Range.
 * @returns { detected: boolean, isVision: boolean, isHearing: boolean, dist: number, angleToPlayer: number }
 */
export function checkPerception(
  enemyPos,
  enemyFacingYaw,
  playerPos,
  isPlayerAudible = false,
  config = {}
) {
  const visionRange = config.visionRange || 12.0;
  const visionAngleRad = (config.visionAngleDeg || 110.0) * (Math.PI / 180.0);
  const baseHearingRange = config.hearingRange || 5.5;
  // If player is dashing or swinging, footsteps/weapon sound carries twice as far!
  const effectiveHearing = isPlayerAudible ? baseHearingRange * 2.0 : baseHearingRange;

  const dx = playerPos.x - enemyPos.x;
  const dz = playerPos.z - enemyPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist > Math.max(visionRange, effectiveHearing)) {
    return { detected: false, isVision: false, isHearing: false, dist, angleToPlayer: 0 };
  }

  // Calculate angle between enemy forward facing vector and vector to player
  // Forward facing vector in Three.js standard (yaw 0 is [0, 0, 1] or [0, 0, -1] depending on model)
  const dirX = dx / (dist || 1.0);
  const dirZ = dz / (dist || 1.0);

  const forwardX = Math.sin(enemyFacingYaw);
  const forwardZ = Math.cos(enemyFacingYaw);

  // Dot product: cos(angle)
  const dot = forwardX * dirX + forwardZ * dirZ;
  const angleDiff = Math.acos(Math.max(-1.0, Math.min(1.0, dot)));

  const inVision = dist <= visionRange && angleDiff <= (visionAngleRad / 2.0);
  const inHearing = dist <= effectiveHearing;

  return {
    detected: inVision || inHearing,
    isVision: inVision,
    isHearing: inHearing,
    dist,
    angleToPlayer: Math.atan2(dx, dz)
  };
}

// -------------------------------------------------------------
// 3. REALISTIC PATROL WAYPOINT GENERATOR
// -------------------------------------------------------------
/**
 * Creates an assigned patrol routine for a monster based on its role and room.
 */
export function createPatrolRoutine(roomIndex, enemyIndex, spawnPosition, totalEnemies = 6) {
  const bounds = DUNGEON_ROOM_BOUNDS[roomIndex] || DUNGEON_ROOM_BOUNDS[1];
  const roleMod = enemyIndex % 5;

  let role = 'ROAMER';
  if (roleMod === 0) role = 'ROAMER';
  else if (roleMod === 1) role = 'DOOR_GUARD';
  else if (roleMod === 2) role = 'PILLAR_PATROL';
  else if (roleMod === 3) role = 'TREASURE_GUARD';
  else role = 'RESTING';

  const sx = spawnPosition[0];
  const sz = spawnPosition[2];

  let waypoints = [];
  if (role === 'DOOR_GUARD') {
    // Guards doorway, pacing short 2.5m patrol line
    waypoints = [
      new THREE.Vector3(sx - 2.0, bounds.floorY, sz),
      new THREE.Vector3(sx + 2.0, bounds.floorY, sz)
    ];
  } else if (role === 'PILLAR_PATROL') {
    // Walks rectangle loop around room pillars
    waypoints = [
      new THREE.Vector3(-5.5, bounds.floorY, sz - 3),
      new THREE.Vector3(-5.5, bounds.floorY, sz + 3),
      new THREE.Vector3(5.5, bounds.floorY, sz + 3),
      new THREE.Vector3(5.5, bounds.floorY, sz - 3)
    ];
  } else if (role === 'TREASURE_GUARD') {
    // Guards near sarcophagus or treasure
    waypoints = [
      new THREE.Vector3(sx, bounds.floorY, sz),
      new THREE.Vector3(sx + 1.2, bounds.floorY, sz + 1.2)
    ];
  } else if (role === 'RESTING') {
    // Sits / rests until disturbed, occasional look around
    waypoints = [new THREE.Vector3(sx, bounds.floorY, sz)];
  } else {
    // ROAMER: Walks across room between points
    waypoints = [
      new THREE.Vector3(sx - 4.0, bounds.floorY, sz - 2.5),
      new THREE.Vector3(sx + 3.5, bounds.floorY, sz - 1.0),
      new THREE.Vector3(sx, bounds.floorY, sz + 4.0)
    ];
  }

  return {
    role,
    waypoints,
    currentWaypointIndex: 0,
    pauseTimer: role === 'RESTING' ? 999 : 1.5 + Math.random() * 2.5,
    isPaused: role === 'RESTING'
  };
}

// -------------------------------------------------------------
// 4. SMOOTH STEERING, OBSTACLE AVOIDANCE & PHYSICAL LOCOMOTION
// -------------------------------------------------------------
/**
 * Updates an enemy's position with acceleration, smooth velocity,
 * directional facing slerp, and obstacle collision repulsion.
 */
export function updatePhysicalSteering(
  currentPos,
  targetPos,
  currentVel,
  currentYaw,
  maxSpeed,
  dt,
  roomIndex,
  otherEnemyPositions = []
) {
  const bounds = DUNGEON_ROOM_BOUNDS[roomIndex] || DUNGEON_ROOM_BOUNDS[1];
  const obstacles = DUNGEON_OBSTACLES[roomIndex] || [];

  // Desired direction towards target
  _vDesired.subVectors(targetPos, currentPos);
  _vDesired.y = 0;
  const distToTarget = _vDesired.length();

  if (distToTarget > 0.05) {
    _vDesired.normalize().multiplyScalar(maxSpeed);
  } else {
    _vDesired.set(0, 0, 0);
  }

  // 1. Obstacle Avoidance (Cylinders & Boxes)
  _vSteer.set(0, 0, 0);
  for (const obs of obstacles) {
    if (obs.type === 'cylinder') {
      const dx = currentPos.x - obs.x;
      const dz = currentPos.z - obs.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      const minClearance = obs.radius + 0.6; // Monster capsule radius 0.6m
      if (d < minClearance) {
        const pushMag = (minClearance - d) * 12.0;
        // If directly head-on (dx === 0), add tangential bias so monster smoothly skirts around
        const nx = Math.abs(dx) < 0.05 ? 0.7 : dx / (d || 1.0);
        const nz = dz / (d || 1.0);
        _vSteer.x += nx * pushMag;
        _vSteer.z += nz * pushMag;
      }
    } else if (obs.type === 'box') {
      const dx = currentPos.x - obs.x;
      const dz = currentPos.z - obs.z;
      const minX = obs.hx + 0.6;
      const minZ = obs.hz + 0.6;
      if (Math.abs(dx) < minX && Math.abs(dz) < minZ) {
        const overlapX = minX - Math.abs(dx);
        const overlapZ = minZ - Math.abs(dz);
        if (overlapX < overlapZ) {
          _vSteer.x += (dx > 0 ? 1 : -1) * overlapX * 12.0;
        } else {
          _vSteer.z += (dz > 0 ? 1 : -1) * overlapZ * 12.0;
        }
      }
    }
  }

  // 2. Soft Repulsion between Other Living Enemies
  for (const other of otherEnemyPositions) {
    if (!other || other === currentPos) continue;
    const ox = other.x ?? other[0];
    const oz = other.z ?? other[2];
    const dx = currentPos.x - ox;
    const dz = currentPos.z - oz;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d > 0.01 && d < 1.4) {
      const push = (1.4 - d) * 6.0;
      _vSteer.x += (dx / d) * push;
      _vSteer.z += (dz / d) * push;
    }
  }

  // Combine desired velocity with steering repulsion
  const finalVel = new THREE.Vector3().copy(_vDesired).add(_vSteer);

  // Smooth acceleration toward final velocity (no instantaneous jumps)
  currentVel.lerp(finalVel, Math.min(1.0, dt * 7.5));

  // Integrate position
  currentPos.x += currentVel.x * dt;
  currentPos.z += currentVel.z * dt;

  // Clamp within room walls
  currentPos.x = Math.max(bounds.xMin, Math.min(bounds.xMax, currentPos.x));
  currentPos.z = Math.max(bounds.zMin, Math.min(bounds.zMax, currentPos.z));

  // Smoothly slerp rotation towards moving velocity if moving
  let targetYaw = currentYaw;
  const speedSq = currentVel.x * currentVel.x + currentVel.z * currentVel.z;
  if (speedSq > 0.04) {
    targetYaw = Math.atan2(currentVel.x, currentVel.z);
  }

  // Angle difference with shortest path wrapping
  let angleDiff = targetYaw - currentYaw;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  const newYaw = currentYaw + angleDiff * Math.min(1.0, dt * 8.5);

  return {
    pos: currentPos,
    vel: currentVel,
    yaw: newYaw,
    speed: Math.sqrt(speedSq)
  };
}
