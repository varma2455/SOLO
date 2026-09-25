// -------------------------------------------------------------
// SHADOW ASCENSION - KAEL SKELETAL ANIMATION CONTROLLER
// High-performance procedural skeletal state machine.
// Supports: Idle, Walk, Run, 3-Hit Combos, Dash, Skill, Ultimate, Hit, Death.
// Smooth spherical/exponential blending, zero React re-render overhead.
// -------------------------------------------------------------

import * as THREE from 'three';

export class KaelAnimationController {
  constructor(nodeMap) {
    this.nodes = nodeMap || {};
    this.time = 0;
    this.state = 'IDLE';
    this.targetState = 'IDLE';
    this.transitionWeight = 1.0;

    // Movement animation phase
    this.walkCyclePhase = 0;

    // Attack state
    this.attackPhase = 0;
    this.attackCombo = 1;
    this.activeAction = null; // 'ATTACK_1', 'ATTACK_2', 'ATTACK_3', 'SKILL', 'ULTIMATE'

    // Transient timers
    this.hitTimer = 0;
    this.dashTimer = 0;
    this.deathTimer = 0;

    // Scratch Euler for allocations-free transforms
    this._euler = new THREE.Euler();
  }

  setNodes(nodeMap) {
    this.nodes = nodeMap || {};
  }

  triggerAttack(comboIndex = 1) {
    this.attackCombo = Math.max(1, Math.min(3, comboIndex));
    this.activeAction = `ATTACK_${this.attackCombo}`;
    this.attackPhase = 0;
  }

  triggerSkill() {
    this.activeAction = 'SKILL';
    this.attackPhase = 0;
  }

  triggerUltimate() {
    this.activeAction = 'ULTIMATE';
    this.attackPhase = 0;
  }

  triggerDash(duration = 0.28) {
    this.dashTimer = duration;
  }

  triggerHit(duration = 0.18) {
    this.hitTimer = duration;
  }

  update(dt, speedRatio, isMoving, isDead) {
    this.time += dt;

    const n = this.nodes;
    if (!n.Hips) return;

    if (isDead) {
      this.deathTimer = Math.min(2.0, this.deathTimer + dt);
      this.applyDeath(this.deathTimer);
      return;
    }

    // 1. Determine active primary animation state
    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      this.applyHitReaction(this.hitTimer);
      return;
    }

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.applyDash(this.dashTimer);
      return;
    }

    if (this.activeAction) {
      this.attackPhase += dt * 3.8;
      if (this.attackPhase >= 1.0) {
        this.activeAction = null;
        this.attackPhase = 0;
      } else {
        if (this.activeAction === 'ATTACK_1') this.applyAttack1(this.attackPhase);
        else if (this.activeAction === 'ATTACK_2') this.applyAttack2(this.attackPhase);
        else if (this.activeAction === 'ATTACK_3') this.applyAttack3(this.attackPhase);
        else if (this.activeAction === 'SKILL') this.applySkill(this.attackPhase);
        else if (this.activeAction === 'ULTIMATE') this.applyUltimate(this.attackPhase);
        return;
      }
    }

    // Locomotion
    if (isMoving && speedRatio > 0.05) {
      const isRunning = speedRatio > 0.55;
      const cadence = isRunning ? 9.5 : 6.0;
      this.walkCyclePhase += dt * cadence * Math.max(0.5, speedRatio);
      if (isRunning) {
        this.applyRun(this.walkCyclePhase, speedRatio);
      } else {
        this.applyWalk(this.walkCyclePhase, speedRatio);
      }
    } else {
      this.applyIdle(this.time);
    }
  }

  // -------------------------------------------------------------
  // ANIMATION STATES
  // -------------------------------------------------------------

  applyIdle(t) {
    const n = this.nodes;
    const breathe = Math.sin(t * 2.2);
    const sway = Math.cos(t * 1.1) * 0.02;

    // Hips
    if (n.Hips) {
      n.Hips.position.y = 0.98 + breathe * 0.012;
      n.Hips.rotation.set(0, sway, 0);
    }

    // Spine & Chest
    if (n.Spine) n.Spine.rotation.set(0.02 + breathe * 0.015, 0, 0);
    if (n.Chest) n.Chest.rotation.set(-0.01 + breathe * 0.02, 0, 0);

    // Head
    if (n.Head) n.Head.rotation.set(breathe * 0.01, -sway * 0.5, 0);

    // Right Arm: Alert two-hand weapon ready grip
    if (n.RightUpperArm) n.RightUpperArm.rotation.set(-0.4 + breathe * 0.03, -0.3, 0.2);
    if (n.RightForearm) n.RightForearm.rotation.set(-0.7, 0.4, 0);
    if (n.RightHand) n.RightHand.rotation.set(0.1, -0.2, 0.1);

    // Left Arm: Relaxed ready balance
    if (n.LeftUpperArm) n.LeftUpperArm.rotation.set(-0.15 + breathe * 0.02, 0.2, -0.2);
    if (n.LeftForearm) n.LeftForearm.rotation.set(-0.45, -0.2, 0);
    if (n.LeftHand) n.LeftHand.rotation.set(0, 0, 0);

    // Legs: Grounded combat stance
    if (n.LeftThigh) n.LeftThigh.rotation.set(-0.06, 0.08, -0.05);
    if (n.LeftCalf) n.LeftCalf.rotation.set(0.1, 0, 0);
    if (n.RightThigh) n.RightThigh.rotation.set(0.06, -0.08, 0.05);
    if (n.RightCalf) n.RightCalf.rotation.set(0.08, 0, 0);

    // Coat tails: Gentle ambient drape
    if (n.CoatTailLeft) n.CoatTailLeft.rotation.set(0.05 + breathe * 0.03, 0.05, 0);
    if (n.CoatTailRight) n.CoatTailRight.rotation.set(0.05 + breathe * 0.03, -0.05, 0);
  }

  applyWalk(phase, speed) {
    const n = this.nodes;
    const sin = Math.sin(phase);
    const cos = Math.cos(phase);

    // Hips vertical bobbing (2 bobs per full stride)
    if (n.Hips) {
      n.Hips.position.y = 0.98 + Math.abs(cos) * 0.035;
      n.Hips.rotation.y = sin * 0.08;
      n.Hips.rotation.z = cos * 0.03;
    }

    if (n.Spine) n.Spine.rotation.set(0.06, -sin * 0.07, 0);
    if (n.Chest) n.Chest.rotation.set(0.03, -sin * 0.06, 0);
    if (n.Head) n.Head.rotation.set(-0.04, 0, 0);

    // Legs stride (Opposite phase)
    const legAmp = 0.45 * Math.min(1.0, speed);
    if (n.LeftThigh) n.LeftThigh.rotation.set(sin * legAmp, 0, 0);
    if (n.LeftCalf) n.LeftCalf.rotation.set(sin > 0 ? sin * 0.6 : 0.08, 0, 0);

    if (n.RightThigh) n.RightThigh.rotation.set(-sin * legAmp, 0, 0);
    if (n.RightCalf) n.RightCalf.rotation.set(-sin > 0 ? -sin * 0.6 : 0.08, 0, 0);

    // Arms counter-swing
    if (n.LeftUpperArm) n.LeftUpperArm.rotation.set(-sin * 0.35, 0.1, -0.15);
    if (n.LeftForearm) n.LeftForearm.rotation.set(-0.4, 0, 0);

    if (n.RightUpperArm) n.RightUpperArm.rotation.set(sin * 0.25 - 0.3, -0.2, 0.15);
    if (n.RightForearm) n.RightForearm.rotation.set(-0.6, 0.3, 0);

    // Coat tails flowing backward
    const tailFlap = 0.18 + Math.abs(sin) * 0.12;
    if (n.CoatTailLeft) n.CoatTailLeft.rotation.set(tailFlap, 0.05, 0);
    if (n.CoatTailRight) n.CoatTailRight.rotation.set(tailFlap, -0.05, 0);
  }

  applyRun(phase, speed) {
    const n = this.nodes;
    const sin = Math.sin(phase);
    const cos = Math.cos(phase);

    // Pronounced forward torso lean
    if (n.Hips) {
      n.Hips.position.y = 0.94 + Math.abs(cos) * 0.06;
      n.Hips.rotation.y = sin * 0.12;
      n.Hips.rotation.z = cos * 0.05;
    }

    if (n.Spine) n.Spine.rotation.set(0.24, -sin * 0.1, 0);
    if (n.Chest) n.Chest.rotation.set(0.12, -sin * 0.08, 0);
    if (n.Head) n.Head.rotation.set(-0.16, 0, 0);

    // Dynamic running leg stride
    const legAmp = 0.85;
    if (n.LeftThigh) n.LeftThigh.rotation.set(sin * legAmp, 0, 0);
    if (n.LeftCalf) n.LeftCalf.rotation.set(sin > 0 ? sin * 1.1 : 0.12, 0, 0);

    if (n.RightThigh) n.RightThigh.rotation.set(-sin * legAmp, 0, 0);
    if (n.RightCalf) n.RightCalf.rotation.set(-sin > 0 ? -sin * 1.1 : 0.12, 0, 0);

    // Running arm swing
    if (n.LeftUpperArm) n.LeftUpperArm.rotation.set(-sin * 0.65, 0.15, -0.2);
    if (n.LeftForearm) n.LeftForearm.rotation.set(-0.8, 0, 0);

    // Weapon arm pumps with controlled angle
    if (n.RightUpperArm) n.RightUpperArm.rotation.set(sin * 0.45 - 0.4, -0.3, 0.25);
    if (n.RightForearm) n.RightForearm.rotation.set(-0.75, 0.4, 0);

    // Coat tails streaming dynamically behind in sprint wind
    const tailStream = 0.45 + Math.abs(sin) * 0.2;
    if (n.CoatTailLeft) n.CoatTailLeft.rotation.set(tailStream, 0.08, 0);
    if (n.CoatTailRight) n.CoatTailRight.rotation.set(tailStream, -0.08, 0);
  }

  applyDash(timer) {
    const n = this.nodes;
    // Aerodynamic forward glide posture
    if (n.Hips) {
      n.Hips.position.y = 0.88;
      n.Hips.rotation.set(0.2, 0, 0);
    }
    if (n.Spine) n.Spine.rotation.set(0.35, 0, 0);
    if (n.Chest) n.Chest.rotation.set(0.15, 0, 0);
    if (n.Head) n.Head.rotation.set(-0.25, 0, 0);

    // Legs tucked in glide
    if (n.LeftThigh) n.LeftThigh.rotation.set(0.4, 0, -0.1);
    if (n.LeftCalf) n.LeftCalf.rotation.set(0.8, 0, 0);
    if (n.RightThigh) n.RightThigh.rotation.set(-0.3, 0, 0.1);
    if (n.RightCalf) n.RightCalf.rotation.set(0.4, 0, 0);

    // Sword trailing behind
    if (n.RightUpperArm) n.RightUpperArm.rotation.set(0.6, -0.4, 0.3);
    if (n.RightForearm) n.RightForearm.rotation.set(-0.3, 0.5, 0);
    if (n.LeftUpperArm) n.LeftUpperArm.rotation.set(0.5, 0.3, -0.3);

    // Coat tails blown almost horizontal
    if (n.CoatTailLeft) n.CoatTailLeft.rotation.set(0.75, 0.1, 0);
    if (n.CoatTailRight) n.CoatTailRight.rotation.set(0.75, -0.1, 0);
  }

  // -------------------------------------------------------------
  // 3-HIT COMBO ATTACKS
  // -------------------------------------------------------------

  applyAttack1(p) {
    const n = this.nodes;
    // Attack 1: Horizontal Right-to-Left Cleave
    // Windup 0.0 - 0.25, Slash 0.25 - 0.65, Follow-through 0.65 - 1.0
    let swingProgress;
    if (p < 0.25) {
      swingProgress = p / 0.25; // Windup back
      if (n.Spine) n.Spine.rotation.y = swingProgress * 0.45;
      if (n.RightUpperArm) n.RightUpperArm.rotation.set(-0.3, -0.8 * swingProgress, 0.4);
      if (n.RightForearm) n.RightForearm.rotation.set(-0.9, 0.4, 0);
    } else if (p < 0.65) {
      swingProgress = (p - 0.25) / 0.4; // Rapid cut forward
      const t = Math.sin(swingProgress * Math.PI * 0.5);
      if (n.Spine) n.Spine.rotation.y = 0.45 - t * 0.95;
      if (n.Chest) n.Chest.rotation.set(0.1, -t * 0.4, 0);
      if (n.RightUpperArm) n.RightUpperArm.rotation.set(-0.4 + t * 0.2, -0.8 + t * 1.6, 0.2);
      if (n.RightForearm) n.RightForearm.rotation.set(-0.9 + t * 0.6, 0.2, 0);
      if (n.RightHand) n.RightHand.rotation.set(0, t * 0.6, -t * 0.4);
    } else {
      swingProgress = (p - 0.65) / 0.35; // Settle recovery
      if (n.Spine) n.Spine.rotation.y = -0.5 * (1 - swingProgress);
      if (n.RightUpperArm) n.RightUpperArm.rotation.set(-0.3, 0.4 * (1 - swingProgress), 0.2);
    }

    // Supporting leg stance
    if (n.LeftThigh) n.LeftThigh.rotation.set(0.3, 0, -0.15);
    if (n.RightThigh) n.RightThigh.rotation.set(-0.25, 0, 0.15);
  }

  applyAttack2(p) {
    const n = this.nodes;
    // Attack 2: Upward Diagonal Slice
    if (p < 0.3) {
      const w = p / 0.3;
      if (n.Spine) n.Spine.rotation.set(0.15 * w, -0.3 * w, 0);
      if (n.RightUpperArm) n.RightUpperArm.rotation.set(0.3 * w, 0.2 * w, 0.2);
      if (n.RightForearm) n.RightForearm.rotation.set(-0.4, 0.2, 0);
    } else if (p < 0.7) {
      const s = (p - 0.3) / 0.4;
      const t = Math.sin(s * Math.PI * 0.5);
      if (n.Spine) n.Spine.rotation.set(0.15 - t * 0.2, -0.3 + t * 0.7, 0);
      if (n.RightUpperArm) n.RightUpperArm.rotation.set(0.3 - t * 1.4, 0.2 + t * 0.4, 0.3);
      if (n.RightForearm) n.RightForearm.rotation.set(-0.4 - t * 0.5, 0.5, 0);
    } else {
      const r = (p - 0.7) / 0.3;
      if (n.Spine) n.Spine.rotation.set(0, 0.4 * (1 - r), 0);
    }
  }

  applyAttack3(p) {
    const n = this.nodes;
    // Attack 3: Heavy Overhead Vertical Finisher Slam!
    if (p < 0.35) {
      // High windup overhead
      const w = p / 0.35;
      if (n.Hips) n.Hips.position.y = 0.98 + w * 0.12; // Slight rise
      if (n.Spine) n.Spine.rotation.set(-0.2 * w, 0, 0);
      if (n.RightUpperArm) n.RightUpperArm.rotation.set(-1.8 * w, -0.3, 0.2);
      if (n.RightForearm) n.RightForearm.rotation.set(-0.8 * w, 0, 0);
      if (n.LeftUpperArm) n.LeftUpperArm.rotation.set(-1.6 * w, 0.3, -0.2);
    } else if (p < 0.75) {
      // Devastating downward ground cleave
      const s = (p - 0.35) / 0.4;
      const t = Math.sin(s * Math.PI * 0.5);
      if (n.Hips) n.Hips.position.y = 1.1 - t * 0.25; // Crouch plunge
      if (n.Spine) n.Spine.rotation.set(-0.2 + t * 0.65, 0, 0);
      if (n.RightUpperArm) n.RightUpperArm.rotation.set(-1.8 + t * 2.2, 0, 0.1);
      if (n.RightForearm) n.RightForearm.rotation.set(-0.8 + t * 0.6, 0, 0);
      if (n.LeftUpperArm) n.LeftUpperArm.rotation.set(-1.6 + t * 1.9, 0, -0.1);
    } else {
      const r = (p - 0.75) / 0.25;
      if (n.Hips) n.Hips.position.y = 0.85 + r * 0.13;
      if (n.Spine) n.Spine.rotation.set(0.45 * (1 - r), 0, 0);
    }
  }

  applySkill(p) {
    const n = this.nodes;
    // Q — Shadow Slash: Forward lunging phantom thrust
    const sin = Math.sin(p * Math.PI);
    if (n.Hips) n.Hips.position.y = 0.92;
    if (n.Spine) n.Spine.rotation.set(0.3 * sin, 0.2 * sin, 0);
    if (n.RightUpperArm) n.RightUpperArm.rotation.set(-1.4 * sin, -0.2, 0.1);
    if (n.RightForearm) n.RightForearm.rotation.set(-0.2 * sin, 0.4, 0);
    if (n.LeftUpperArm) n.LeftUpperArm.rotation.set(0.6 * sin, 0.3, -0.3);
  }

  applyUltimate(p) {
    const n = this.nodes;
    // R — Eclipse Strike: Skyward jump & ground explosion
    if (p < 0.4) {
      const j = p / 0.4;
      if (n.Hips) n.Hips.position.y = 0.98 + j * 0.8; // High leap!
      if (n.Spine) n.Spine.rotation.set(-0.3 * j, 0, 0);
      if (n.RightUpperArm) n.RightUpperArm.rotation.set(-2.0 * j, 0, 0.3);
      if (n.LeftUpperArm) n.LeftUpperArm.rotation.set(-1.8 * j, 0, -0.3);
    } else if (p < 0.75) {
      const s = (p - 0.4) / 0.35;
      if (n.Hips) n.Hips.position.y = 1.78 - s * 0.95; // Earth-shattering slam!
      if (n.Spine) n.Spine.rotation.set(0.5 * s, 0, 0);
      if (n.RightUpperArm) n.RightUpperArm.rotation.set(-2.0 + s * 2.4, 0, 0);
    } else {
      const r = (p - 0.75) / 0.25;
      if (n.Hips) n.Hips.position.y = 0.83 + r * 0.15;
      if (n.Spine) n.Spine.rotation.set(0.5 * (1 - r), 0, 0);
    }
  }

  applyHitReaction(timer) {
    const n = this.nodes;
    const flinch = (timer / 0.18);
    if (n.Spine) n.Spine.rotation.set(-0.35 * flinch, 0.2 * flinch, 0);
    if (n.Head) n.Head.rotation.set(-0.2 * flinch, -0.1 * flinch, 0);
    if (n.RightUpperArm) n.RightUpperArm.rotation.set(-0.2 * flinch, -0.4 * flinch, 0.4 * flinch);
  }

  applyDeath(timer) {
    const n = this.nodes;
    const progress = Math.min(1.0, timer / 1.2);
    // Collapse to knees then ground
    if (n.Hips) {
      n.Hips.position.y = Math.max(0.2, 0.98 - progress * 0.78);
      n.Hips.rotation.set(progress * 0.8, 0, progress * 0.3);
    }
    if (n.LeftThigh) n.LeftThigh.rotation.set(progress * 1.4, 0, 0);
    if (n.RightThigh) n.RightThigh.rotation.set(progress * 1.5, 0, 0);
    if (n.LeftCalf) n.LeftCalf.rotation.set(progress * 1.2, 0, 0);
    if (n.RightCalf) n.RightCalf.rotation.set(progress * 1.2, 0, 0);
    if (n.Spine) n.Spine.rotation.set(progress * 0.6, 0, 0);
    if (n.RightUpperArm) n.RightUpperArm.rotation.set(0.4, 0.3, 0.5 * progress);
  }
}
