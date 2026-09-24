import { sound } from '../../audio/soundManager';
import { useGameStore } from '../../store/gameStore';

export const calculatePlayerDamage = (skillMultiplier = 1.0) => {
  const store = useGameStore.getState();
  const player = store.player;

  const baseAtk = player.attack;
  const critRoll = Math.random() * 100;
  const isCrit = critRoll <= player.critChance;
  const critModifier = isCrit ? player.critDamage / 100 : 1.0;

  // Add small random variation (+- 10%)
  const variance = 0.9 + Math.random() * 0.2;
  const rawDamage = Math.round(baseAtk * skillMultiplier * critModifier * variance);

  return {
    damage: Math.max(1, rawDamage),
    isCrit
  };
};

export const checkCircleCollision = (posA, posB, radius) => {
  const dx = posA[0] - posB[0];
  const dz = posA[2] - posB[2];
  return Math.sqrt(dx * dx + dz * dz) <= radius;
};

export const checkConeCollision = (attackerPos, attackerFacingAngle, targetPos, maxDistance, maxAngleDegrees) => {
  const dx = targetPos[0] - attackerPos[0];
  const dz = targetPos[2] - attackerPos[2];
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > maxDistance) return false;

  // Angle from attacker to target in X-Z plane
  const angleToTarget = Math.atan2(dx, dz);
  let angleDiff = Math.abs(angleToTarget - attackerFacingAngle);

  // Normalize angle diff to [0, PI]
  while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

  const maxAngleRad = (maxAngleDegrees * Math.PI) / 180;
  return angleDiff <= maxAngleRad;
};
