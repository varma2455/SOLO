import { sound } from '../../audio/soundManager';
import { useGameStore } from '../../store/gameStore';
import { safeVector3 } from '../../utils/vector3';

export const calculatePlayerDamage = (skillMultiplier = 1.0) => {
  const store = useGameStore.getState();
  const player = store.player;

  const baseAtk = player?.attack || 25;
  const critRoll = Math.random() * 100;
  const isCrit = critRoll <= (player?.critChance || 10);
  const critModifier = isCrit ? (player?.critDamage || 150) / 100 : 1.0;

  // Add small random variation (+- 10%)
  const variance = 0.9 + Math.random() * 0.2;
  const rawDamage = Math.round(baseAtk * skillMultiplier * critModifier * variance);

  return {
    damage: Math.max(1, rawDamage),
    isCrit
  };
};

export const checkCircleCollision = (posA, posB, radius) => {
  const pA = safeVector3(posA, [0, 0, 0], 'checkCircleCollision:posA');
  const pB = safeVector3(posB, [0, 0, 0], 'checkCircleCollision:posB');
  const dx = pA[0] - pB[0];
  const dz = pA[2] - pB[2];
  return Math.sqrt(dx * dx + dz * dz) <= radius;
};

export const checkConeCollision = (attackerPos, attackerFacingAngle = 0, targetPos, maxDistance, maxAngleDegrees) => {
  const pA = safeVector3(attackerPos, [0, 0, 0], 'checkConeCollision:attackerPos');
  const pB = safeVector3(targetPos, [0, 0, 0], 'checkConeCollision:targetPos');
  const dx = pB[0] - pA[0];
  const dz = pB[2] - pA[2];
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > maxDistance) return false;

  // Angle from attacker to target in X-Z plane
  const angleToTarget = Math.atan2(dx, dz);
  let angleDiff = Math.abs(angleToTarget - (attackerFacingAngle || 0));

  // Normalize angle diff to [0, PI]
  while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

  const maxAngleRad = (maxAngleDegrees * Math.PI) / 180;
  return angleDiff <= maxAngleRad;
};
