import { sound } from '../../audio/soundManager';
import { useGameStore } from '../../store/gameStore';
import { safeVector3 } from '../../utils/vector3';

export const calculatePlayerDamage = (skillMultiplier = 1.0, attackType = null) => {
  const store = useGameStore.getState();
  const player = store.player;

  // Exact damage values as specified:
  // LMB combo = 80 / 100 / 140 damage
  // Q Shadow Slash = 220 damage
  // E Phantom Dash = movement/evade, small damage (~50)
  // R Ultimate = 800 damage
  let baseDamage = 80;
  if (attackType === 'combo1' || attackType === 1) {
    baseDamage = 80;
  } else if (attackType === 'combo2' || attackType === 2) {
    baseDamage = 100;
  } else if (attackType === 'combo3' || attackType === 3) {
    baseDamage = 140;
  } else if (attackType === 'shadowSlash' || attackType === 'skill_q') {
    baseDamage = 220;
  } else if (attackType === 'phantomStep' || attackType === 'dash' || attackType === 'skill_e') {
    baseDamage = 50;
  } else if (attackType === 'eclipseDominion' || attackType === 'ultimate' || attackType === 'skill_r') {
    baseDamage = 800;
  } else if (typeof attackType === 'number') {
    baseDamage = attackType;
  } else {
    // If multiplier only is passed, map to exact values
    if (skillMultiplier === 1.0) baseDamage = 80;
    else if (skillMultiplier === 1.2) baseDamage = 100;
    else if (skillMultiplier === 1.8) baseDamage = 140;
    else if (skillMultiplier === 2.2) baseDamage = 220;
    else if (skillMultiplier === 8.0) baseDamage = 800;
    else baseDamage = Math.round(80 * skillMultiplier);
  }

  const critRoll = Math.random() * 100;
  const isCrit = critRoll <= (player?.critChance || 10);
  const critModifier = isCrit ? (player?.critDamage || 150) / 100 : 1.0;

  // Subtle variance for organic feel
  const variance = 0.98 + Math.random() * 0.04;
  const rawDamage = Math.round(baseDamage * critModifier * variance);

  return {
    damage: Math.max(1, rawDamage),
    baseDamage,
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
