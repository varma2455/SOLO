// -------------------------------------------------------------
// SHADOW ASCENSION - PROCEDURAL MONSTER SKELETAL ANIMATION CONTROLLER
// High-performance animation state machine for fantasy monsters:
// Supports: Idle, Walk/Chase, Attack, Hit/Stagger, Death, and Boss Rage.
// Zero React re-renders, direct bone rotation slerp.
// -------------------------------------------------------------

import * as THREE from 'three';

export class MonsterAnimationController {
  constructor(nodeMap, type = 'humanoid') {
    this.nodes = nodeMap || {};
    this.type = type;
    this.time = Math.random() * 10;
    this.attackPhase = 0;
    this.isAttacking = false;
    this.hitTimer = 0;
    this.deathTimer = 0;
    this.walkCycle = 0;
  }

  setNodes(nodeMap) {
    this.nodes = nodeMap || {};
  }

  triggerAttack() {
    this.isAttacking = true;
    this.attackPhase = 0;
  }

  triggerHit(duration = 0.2) {
    this.hitTimer = duration;
  }

  update(dt, isMoving = false, isDead = false, isBoss = false, isRage = false) {
    this.time += dt;
    const n = this.nodes;
    if (!n.Hips) return;

    // 1. Death Animation
    if (isDead) {
      this.deathTimer = Math.min(2.0, this.deathTimer + dt);
      const prog = Math.min(1.0, this.deathTimer / 1.4);
      n.Hips.position.y = (n.Hips.position.y || 1.0) * (1.0 - prog * 0.7);
      n.Hips.rotation.x = -prog * 1.3;
      n.Hips.rotation.z = prog * 0.3;
      if (n.RightUpperArm) n.RightUpperArm.rotation.x = -prog * 0.8;
      if (n.LeftUpperArm) n.LeftUpperArm.rotation.x = -prog * 0.8;
      return;
    }

    // 2. Hit / Stagger Reaction
    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      const flinch = Math.sin(this.hitTimer * 25) * 0.25;
      n.Hips.position.z = -flinch * 0.15;
      if (n.Spine) n.Spine.rotation.x = -flinch;
      if (n.Head) n.Head.rotation.x = -flinch * 1.5;
      return;
    }

    // 3. Attack Animation
    if (this.isAttacking) {
      this.attackPhase += dt * (isBoss ? 2.8 : 3.5);
      if (this.attackPhase >= 1.0) {
        this.isAttacking = false;
        this.attackPhase = 0;
      } else {
        const p = this.attackPhase;
        const swing = Math.sin(p * Math.PI);

        if (n.RightUpperArm) {
          // Overhead / slash windup and strike
          n.RightUpperArm.rotation.x = -0.5 - swing * 1.8;
          n.RightUpperArm.rotation.z = -swing * 0.6;
        }
        if (n.RightForearm) {
          n.RightForearm.rotation.x = -swing * 0.9;
        }
        if (n.Spine) {
          n.Spine.rotation.y = swing * 0.4;
          n.Spine.rotation.x = (isBoss ? 0.3 : 0.15) * swing;
        }
        return;
      }
    }

    // 4. Locomotion (Walk / Chase) vs Idle
    if (isMoving) {
      this.walkCycle += dt * (isBoss ? 6.0 : 8.5);
      const cycle = this.walkCycle;
      const legAngle = Math.sin(cycle) * 0.55;
      const armAngle = Math.cos(cycle) * 0.45;

      // Leg swings
      if (n.LeftThigh) n.LeftThigh.rotation.x = legAngle;
      if (n.RightThigh) n.RightThigh.rotation.x = -legAngle;
      if (n.LeftCalf) n.LeftCalf.rotation.x = Math.max(0, -legAngle * 0.7);
      if (n.RightCalf) n.RightCalf.rotation.x = Math.max(0, legAngle * 0.7);

      // Arm counter-swings
      if (n.LeftUpperArm) n.LeftUpperArm.rotation.x = -armAngle;
      if (n.RightUpperArm) n.RightUpperArm.rotation.x = armAngle * 0.6 - 0.2;

      // Torso bobbing & lean
      if (n.Spine) {
        n.Spine.rotation.x = (this.type === 'goblin' ? 0.32 : 0.12) + Math.abs(Math.sin(cycle * 2)) * 0.05;
        n.Spine.rotation.y = Math.sin(cycle) * 0.08;
      }
      if (n.Head) {
        n.Head.rotation.x = -0.05 + Math.sin(cycle * 2) * 0.04;
      }
    } else {
      // Organic Idle Breathing & Sway
      const t = this.time;
      const breath = Math.sin(t * 2.2) * 0.04;

      if (n.Spine) {
        n.Spine.rotation.x = (this.type === 'goblin' ? 0.26 : 0.04) + breath;
        n.Spine.rotation.y = Math.sin(t * 1.2) * 0.05;
      }
      if (n.Head) {
        n.Head.rotation.x = -breath * 0.8;
        n.Head.rotation.y = Math.sin(t * 0.8) * 0.08;
      }
      if (n.RightUpperArm) {
        n.RightUpperArm.rotation.x = -0.15 + breath * 0.5;
        n.RightUpperArm.rotation.z = -0.08;
      }
      if (n.LeftUpperArm) {
        n.LeftUpperArm.rotation.x = breath * 0.4;
        n.LeftUpperArm.rotation.z = 0.08;
      }
      if (n.LeftThigh) n.LeftThigh.rotation.x = 0;
      if (n.RightThigh) n.RightThigh.rotation.x = 0;
      if (n.LeftCalf) n.LeftCalf.rotation.x = 0;
      if (n.RightCalf) n.RightCalf.rotation.x = 0;
    }
  }
}
