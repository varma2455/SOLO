// -------------------------------------------------------------
// SHADOW ASCENSION - NEXT-GEN PROCEDURAL MONSTER SKELETAL ANIMATION CONTROLLER
// Complete overhaul: true stepping locomotion (NO SLIDING), foot grounding,
// organic idle breathing & weight shifts, turn-in-place with pivot steps,
// multi-phase attack sequences (windup -> strike -> recovery),
// hit & stagger reactions (normal, heavy, critical stagger),
// coward fleeing, multi-phase death collapse, and distance LOD.
// Zero React re-renders, direct Three.js bone transform integration.
// -------------------------------------------------------------

import * as THREE from 'three';

export class MonsterAnimationController {
  constructor(nodeMap, type = 'humanoid') {
    this.nodes = nodeMap || {};
    this.type = (type || 'humanoid').toLowerCase();
    this.time = Math.random() * 20;

    // Locomotion
    this.walkCycle = Math.random() * Math.PI * 2;
    this.turnAngle = 0;
    this.targetTurnAngle = 0;
    this.stepWeight = 0;

    // Idle
    this.idleLookTimer = 1.0 + Math.random() * 2.5;
    this.idleLookTargetX = 0;
    this.idleLookTargetY = 0;
    this.idleWeightShiftTimer = 2.0 + Math.random() * 3.0;
    this.idleWeightSide = 1.0;

    // Combat & Attack
    this.isAttacking = false;
    this.attackPhase = 0;
    this.attackProfile = 'default';
    this.isHeavyAttacking = false;
    this.heavyAttackPhase = 0;

    // States & Reactions
    this.isRoaring = false;
    this.roarTimer = 0;
    this.hitTimer = 0;
    this.hitIntensity = 'normal'; // 'normal', 'heavy', 'stagger'
    this.isFleeing = false;
    this.fleeTimer = 0;
    this.deathTimer = 0;

    // Alert indicator (!)
    this.alertTimer = 0;

    // Defensive Guard / Block
    this.isBlocking = false;
    this.blockTimer = 0;
    this.blockDuration = 0.5;

    // Initial base transforms for safe restoration
    this.baseHipsY = this.nodes.Hips ? this.nodes.Hips.position.y : 0.65;
    this.baseSpineX = this.nodes.Spine ? this.nodes.Spine.rotation.x : 0.35;
  }

  setNodes(nodeMap) {
    this.nodes = nodeMap || {};
    if (this.nodes.Hips) this.baseHipsY = this.nodes.Hips.position.y;
    if (this.nodes.Spine) this.baseSpineX = this.nodes.Spine.rotation.x;
  }

  triggerAttack(profile = 'default') {
    this.isAttacking = true;
    this.attackPhase = 0;
    this.attackProfile = profile;
  }

  triggerHeavyAttack() {
    this.isHeavyAttacking = true;
    this.heavyAttackPhase = 0;
  }

  triggerRoar(duration = 2.4) {
    this.isRoaring = true;
    this.roarTimer = duration;
  }

  triggerHit(duration = 0.22, intensity = 'normal') {
    this.hitDuration = duration;
    this.hitTimer = duration;
    this.hitIntensity = intensity;
  }

  triggerCast(duration = 1.0) {
    this.isCasting = true;
    this.castTimer = duration;
    this.castDuration = duration;
  }

  triggerDeath() {
    this.isDead = true;
    this.deathTimer = 0;
  }

  triggerAlert(duration = 1.2) {
    this.alertTimer = duration;
  }

  triggerFlee(duration = 3.5) {
    this.isFleeing = true;
    this.fleeTimer = duration;
  }

  triggerBlock(duration = 0.5) {
    this.isBlocking = true;
    this.blockTimer = duration;
    this.blockDuration = duration;
  }

  triggerStagger(duration = 0.8) {
    this.triggerHit(duration, 'stagger');
  }

  triggerKnockback(duration = 0.6) {
    this.triggerHit(duration, 'heavy');
  }

  triggerAttackCombo(step = 1) {
    const profiles = ['slash', 'horizontal', 'overhead', 'thrust'];
    const selectedProfile = profiles[(step - 1) % profiles.length] || 'default';
    this.triggerAttack(selectedProfile);
  }

  update(dt, options = {}) {
    const isMoving = typeof options === 'boolean' ? options : Boolean(options.isMoving);
    const isDead = typeof options === 'object' && options.isDead !== undefined ? options.isDead : false;
    const isBoss = typeof options === 'object' && options.isBoss !== undefined ? options.isBoss : this.type.includes('boss');
    const isRage = typeof options === 'object' && options.isRage !== undefined ? options.isRage : false;
    const moveSpeed = (typeof options === 'object' && options.speed) || (isMoving ? 3.4 : 0);
    const turnDelta = (typeof options === 'object' && options.turnDelta) || 0;
    const distanceLOD = (typeof options === 'object' && options.dist) || 5;

    this.time += dt;
    const n = this.nodes;
    if (!n.Hips) return;

    // -----------------------------------------------------------
    // 0. ALERT INDICATOR (!) ANIMATION
    // -----------------------------------------------------------
    if (n.AlertIcon) {
      if (this.alertTimer > 0) {
        this.alertTimer -= dt;
        // Pop up and pulse with elastic bounce
        const alertScale = Math.min(1.0, (1.2 - this.alertTimer) * 4.0);
        const pulse = 1.0 + Math.sin(this.time * 16) * 0.15;
        n.AlertIcon.visible = true;
        n.AlertIcon.scale.set(alertScale * pulse, alertScale * pulse, alertScale * pulse);
      } else {
        if (n.AlertIcon.visible) {
          n.AlertIcon.visible = false;
          n.AlertIcon.scale.set(0.001, 0.001, 0.001);
        }
      }
    }

    // -----------------------------------------------------------
    // 1. DEATH COLLAPSE & SINKING ANIMATION
    // -----------------------------------------------------------
    if (isDead) {
      this.deathTimer = Math.min(3.0, this.deathTimer + dt);
      const prog = Math.min(1.0, this.deathTimer / 1.8);

      // Knees buckle and hips drop to ground
      n.Hips.position.y = this.baseHipsY * Math.max(0.18, 1.0 - prog * 0.82);
      n.Hips.position.z = -prog * 0.25;

      // Torso falls forward/side onto ground
      if (n.Spine) {
        n.Spine.rotation.x = this.baseSpineX + prog * 0.85;
        n.Spine.rotation.z = prog * 0.45;
      }
      if (n.Head) {
        n.Head.rotation.x = -prog * 0.5;
        n.Head.rotation.y = prog * 0.35;
      }

      // Arms slump and weapon drops
      if (n.RightUpperArm) {
        n.RightUpperArm.rotation.x = -0.3 + prog * 0.8;
        n.RightUpperArm.rotation.z = 0.4 * (1.0 - prog);
      }
      if (n.LeftUpperArm) {
        n.LeftUpperArm.rotation.x = -0.3 + prog * 0.8;
        n.LeftUpperArm.rotation.z = -0.4 * (1.0 - prog);
      }
      if (n.WeaponSocket) {
        n.WeaponSocket.position.y = -0.05 - prog * 0.25;
        n.WeaponSocket.rotation.x = 1.2 * prog;
        n.WeaponSocket.rotation.z = -0.8 * prog;
      }

      // Legs splay out as body collapses
      if (n.LeftThigh) {
        n.LeftThigh.rotation.x = -0.6 * prog;
        n.LeftThigh.rotation.z = -0.4 * prog;
      }
      if (n.RightThigh) {
        n.RightThigh.rotation.x = 0.3 * prog;
        n.RightThigh.rotation.z = 0.5 * prog;
      }
      if (n.LeftCalf) n.LeftCalf.rotation.x = 1.2 * prog;
      if (n.RightCalf) n.RightCalf.rotation.x = 0.8 * prog;

      return;
    }

    // -----------------------------------------------------------
    // 2. HIT & STAGGER REACTIONS (NORMAL, HEAVY, CRITICAL STAGGER)
    // -----------------------------------------------------------
    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      const isHeavy = this.hitIntensity === 'heavy';
      const isStagger = this.hitIntensity === 'stagger';

      const totalDur = this.hitDuration || (isStagger ? 0.6 : isHeavy ? 0.45 : 0.22);
      const prog = Math.min(1.0, Math.max(0, 1.0 - this.hitTimer / totalDur));
      const flinchMag = isStagger ? 0.55 : isHeavy ? 0.38 : 0.22;
      // Clean half-sine recoil pulse: always positive, peaks in middle, returns to 0
      const flinch = Math.sin(prog * Math.PI) * flinchMag;

      // Backward body recoil
      n.Hips.position.z = -flinch * (isBoss ? 0.12 : 0.32);
      n.Hips.position.y = this.baseHipsY - flinch * 0.08;

      if (n.Spine) {
        n.Spine.rotation.x = this.baseSpineX - flinch * 1.2;
        n.Spine.rotation.z = Math.sin(this.time * 24) * (flinchMag * 0.3);
      }
      if (n.Head) {
        n.Head.rotation.x = -flinch * 1.5;
        n.Head.rotation.y = (isHeavy || isStagger) ? Math.sin(this.time * 20) * 0.25 : 0;
      }
      if (n.Jaw) {
        n.Jaw.rotation.x = flinch * 0.7;
      }

      // Arms flinch back
      if (n.RightUpperArm) n.RightUpperArm.rotation.x = -flinch * 1.2;
      if (n.LeftUpperArm) n.LeftUpperArm.rotation.x = -flinch * 1.2;

      // Stumble legs on heavy / stagger
      if (isHeavy || isStagger) {
        if (n.LeftThigh) n.LeftThigh.rotation.x = flinch * 0.8;
        if (n.RightThigh) n.RightThigh.rotation.x = -flinch * 0.8;
      }

      return;
    }

    // -----------------------------------------------------------
    // 2.5 DEFENSIVE GUARD / BLOCK POSE
    // -----------------------------------------------------------
    if (this.isBlocking && this.blockTimer > 0) {
      this.blockTimer -= dt;
      if (this.blockTimer <= 0) {
        this.isBlocking = false;
      } else {
        const bp = Math.sin((1.0 - this.blockTimer / (this.blockDuration || 0.5)) * Math.PI);
        if (n.LeftUpperArm) {
          n.LeftUpperArm.rotation.x = -1.2 * bp;
          n.LeftUpperArm.rotation.y = -0.4 * bp;
          n.LeftUpperArm.rotation.z = -0.3 * bp;
        }
        if (n.RightUpperArm) {
          n.RightUpperArm.rotation.x = -1.1 * bp;
          n.RightUpperArm.rotation.y = 0.4 * bp;
          n.RightUpperArm.rotation.z = 0.3 * bp;
        }
        if (n.Spine) n.Spine.rotation.x = this.baseSpineX + 0.12 * bp;
        if (n.Head) n.Head.rotation.x = 0.1 * bp;
        return;
      }
    }

    // -----------------------------------------------------------
    // 3. AWAKENING ROAR / ENRAGE BATTLE CRY
    // -----------------------------------------------------------
    if (this.isRoaring) {
      this.roarTimer -= dt;
      if (this.roarTimer <= 0) {
        this.isRoaring = false;
      } else {
        const shake = Math.sin(this.time * 35) * 0.035;
        if (n.Spine) n.Spine.rotation.x = this.baseSpineX - 0.45 + shake;
        if (n.Head) {
          n.Head.rotation.x = 0.5 + shake;
          n.Head.rotation.y = Math.sin(this.time * 8) * 0.06;
        }
        if (n.Jaw) n.Jaw.rotation.x = 0.35 + shake * 2;
        if (n.RightUpperArm) {
          n.RightUpperArm.rotation.x = -1.4 + shake;
          n.RightUpperArm.rotation.z = -0.7;
        }
        if (n.LeftUpperArm) {
          n.LeftUpperArm.rotation.x = -1.4 + shake;
          n.LeftUpperArm.rotation.z = 0.7;
        }
        return;
      }
    }

    // -----------------------------------------------------------
    // 3.5 CASTING / SHADOW ORB GATHERING POSE
    // -----------------------------------------------------------
    if (this.isCasting && this.castTimer > 0) {
      this.castTimer -= dt;
      if (this.castTimer <= 0) {
        this.isCasting = false;
      } else {
        const cp = 1.0 - (this.castTimer / (this.castDuration || 1.0));
        const lift = Math.sin(cp * Math.PI);
        if (n.LeftUpperArm) {
          n.LeftUpperArm.rotation.x = -1.6 * lift;
          n.LeftUpperArm.rotation.y = 0.3 * lift;
          n.LeftUpperArm.rotation.z = -0.2 * lift;
        }
        if (n.RightUpperArm) {
          n.RightUpperArm.rotation.x = -0.8 - lift * 0.4;
          n.RightUpperArm.rotation.z = 0.5 * lift;
        }
        if (n.Spine) n.Spine.rotation.x = this.baseSpineX - lift * 0.25;
        if (n.Head) n.Head.rotation.x = -lift * 0.2;
        return;
      }
    }

    // -----------------------------------------------------------
    // 4. HEAVY OVERHEAD GROUND SLAM (Boss / Brute)
    // -----------------------------------------------------------
    if (this.isHeavyAttacking) {
      this.heavyAttackPhase += dt * (isRage ? 2.5 : 1.8);
      if (this.heavyAttackPhase >= 1.0) {
        this.isHeavyAttacking = false;
        this.heavyAttackPhase = 0;
      } else {
        const p = this.heavyAttackPhase;
        if (p < 0.52) {
          // Windup: Arms raise high overhead, torso arches backward
          const w = p / 0.52;
          if (n.RightUpperArm) {
            n.RightUpperArm.rotation.x = -0.6 - w * 2.3;
            n.RightUpperArm.rotation.z = -0.3;
          }
          if (n.LeftUpperArm) {
            n.LeftUpperArm.rotation.x = -0.6 - w * 2.1;
            n.LeftUpperArm.rotation.z = 0.3;
          }
          if (n.Spine) n.Spine.rotation.x = this.baseSpineX - w * 0.42;
          if (n.Head) n.Head.rotation.x = w * 0.3;
          if (n.Jaw) n.Jaw.rotation.x = w * 0.25;
        } else {
          // Violent Downward Smash
          const smash = (p - 0.52) / 0.48;
          const power = Math.sin(smash * Math.PI * 0.5);
          if (n.RightUpperArm) {
            n.RightUpperArm.rotation.x = -2.9 + power * 2.7;
            n.RightUpperArm.rotation.z = 0;
          }
          if (n.LeftUpperArm) {
            n.LeftUpperArm.rotation.x = -2.7 + power * 2.5;
            n.LeftUpperArm.rotation.z = 0;
          }
          if (n.Spine) n.Spine.rotation.x = this.baseSpineX + 0.35 + power * 0.45;
          if (n.Hips) n.Hips.position.y = this.baseHipsY - Math.sin(smash * Math.PI) * 0.22;
        }
        return;
      }
    }

    // -----------------------------------------------------------
    // 5. MULTI-PHASE ATTACK SEQUENCES (WINDUP -> STRIKE -> RECOVERY)
    // -----------------------------------------------------------
    if (this.isAttacking) {
      const speedMult = this.type.includes('assassin')
        ? 4.6
        : this.type.includes('scout')
        ? 4.8
        : isBoss
        ? (isRage ? 3.4 : 2.6)
        : this.type.includes('brute')
        ? 2.4
        : 3.4;

      this.attackPhase += dt * speedMult;

      if (this.attackPhase >= 1.0) {
        this.isAttacking = false;
        this.attackPhase = 0;
      } else {
        const p = this.attackPhase;
        const isWindup = p < 0.38;
        const isStrike = p >= 0.38 && p < 0.72;

        if (this.type.includes('archer')) {
          // Recurve Bow Draw & Release
          if (isWindup) {
            const w = p / 0.38;
            if (n.LeftUpperArm) {
              n.LeftUpperArm.rotation.x = -1.2 * w; // Bow arm extends straight forward
              n.LeftUpperArm.rotation.y = 0.4 * w;
            }
            if (n.RightUpperArm) {
              n.RightUpperArm.rotation.x = -0.8 * w; // Drawing hand pulls back to cheek
              n.RightUpperArm.rotation.y = -0.5 * w;
            }
            if (n.RightForearm) n.RightForearm.rotation.x = -1.4 * w;
            if (n.Spine) n.Spine.rotation.y = -0.3 * w;
          } else {
            // Release snap
            const r = (p - 0.38) / 0.62;
            if (n.RightUpperArm) n.RightUpperArm.rotation.x = -0.8 * (1.0 - r);
            if (n.RightForearm) n.RightForearm.rotation.x = -1.4 * (1.0 - r);
            if (n.LeftUpperArm) n.LeftUpperArm.rotation.x = -1.2 * (1.0 - r * 0.5);
          }
        } else if (this.type.includes('brute')) {
          // Heavy Two-Handed Cleaver Axe Chop
          const swing = Math.sin(p * Math.PI);
          if (n.RightUpperArm) {
            n.RightUpperArm.rotation.x = -0.6 - swing * 2.3;
            n.RightUpperArm.rotation.z = -swing * 0.35;
          }
          if (n.LeftUpperArm) {
            n.LeftUpperArm.rotation.x = -0.6 - swing * 2.1;
            n.LeftUpperArm.rotation.z = swing * 0.35;
          }
          if (n.Spine) {
            n.Spine.rotation.x = this.baseSpineX - 0.2 + swing * 0.65;
            n.Spine.rotation.y = Math.sin(p * Math.PI) * 0.25;
          }
          if (n.Hips) n.Hips.position.y = this.baseHipsY - Math.sin(p * Math.PI) * 0.14;
        } else if (this.type.includes('scout') || this.type.includes('assassin')) {
          // Fast Dual Dagger Flurry (Left cross-stab -> Right gut-hook)
          const swing1 = Math.sin(p * Math.PI * 2);
          const swing2 = Math.cos(p * Math.PI * 2);
          if (n.RightUpperArm) {
            n.RightUpperArm.rotation.x = -0.4 - Math.max(0, swing1) * 1.8;
            n.RightUpperArm.rotation.y = swing1 * 0.6;
          }
          if (n.LeftUpperArm) {
            n.LeftUpperArm.rotation.x = -0.4 - Math.max(0, -swing1) * 1.8;
            n.LeftUpperArm.rotation.y = -swing1 * 0.6;
          }
          if (n.Spine) {
            n.Spine.rotation.x = this.baseSpineX + 0.15;
            n.Spine.rotation.y = swing2 * 0.4;
          }
        } else {
          // Warrior / Goblin / Knight Disciplined Cleave Attack
          if (isWindup) {
            const w = p / 0.38;
            // Coils body back, raises weapon high
            if (n.RightUpperArm) {
              n.RightUpperArm.rotation.x = -0.3 - w * 1.8;
              n.RightUpperArm.rotation.y = w * 0.6;
              n.RightUpperArm.rotation.z = -w * 0.4;
            }
            if (n.RightForearm) n.RightForearm.rotation.x = -w * 0.8;
            if (n.LeftUpperArm) {
              n.LeftUpperArm.rotation.x = -w * 0.6; // Buckler raised to guard
              n.LeftUpperArm.rotation.z = w * 0.35;
            }
            if (n.Spine) {
              n.Spine.rotation.y = -w * 0.38;
              n.Spine.rotation.x = this.baseSpineX - w * 0.12;
            }
            if (n.Head) n.Head.rotation.y = w * 0.2;
            if (n.Jaw) n.Jaw.rotation.x = w * 0.25;
          } else {
            // Strike execution & followthrough
            const s = (p - 0.38) / 0.62;
            const strikePower = Math.sin(s * Math.PI);
            if (n.RightUpperArm) {
              n.RightUpperArm.rotation.x = -2.1 + strikePower * 2.2;
              n.RightUpperArm.rotation.y = 0.6 - strikePower * 1.4;
            }
            if (n.RightForearm) n.RightForearm.rotation.x = -0.8 + strikePower * 0.6;
            if (n.Spine) {
              n.Spine.rotation.y = -0.38 + strikePower * 0.85;
              n.Spine.rotation.x = this.baseSpineX + strikePower * 0.3;
            }
            if (n.Head) n.Head.rotation.y = -strikePower * 0.25;
            if (n.Jaw) n.Jaw.rotation.x = strikePower * 0.45;
            if (n.Hips) n.Hips.position.y = this.baseHipsY - strikePower * 0.08;
          }
        }
        return;
      }
    }

    // -----------------------------------------------------------
    // 6. FLEEING BEHAVIOR (PANICKED COWARD SPRINT)
    // -----------------------------------------------------------
    if (this.isFleeing) {
      this.fleeTimer -= dt;
      if (this.fleeTimer <= 0) this.isFleeing = false;

      this.walkCycle += dt * 14.5; // Frantic rapid strides
      const cycle = this.walkCycle;

      const legAngle = Math.sin(cycle) * 0.72;
      if (n.LeftThigh) n.LeftThigh.rotation.x = legAngle;
      if (n.RightThigh) n.RightThigh.rotation.x = -legAngle;
      if (n.LeftCalf) n.LeftCalf.rotation.x = Math.max(0, -legAngle * 1.1);
      if (n.RightCalf) n.RightCalf.rotation.x = Math.max(0, legAngle * 1.1);

      // Frantic arms
      if (n.LeftUpperArm) n.LeftUpperArm.rotation.x = -Math.cos(cycle) * 0.9 - 0.4;
      if (n.RightUpperArm) n.RightUpperArm.rotation.x = Math.cos(cycle) * 0.9 - 0.4;

      if (n.Spine) {
        n.Spine.rotation.x = this.baseSpineX + 0.35; // Hunched very low
        n.Spine.rotation.y = Math.sin(cycle) * 0.18;
      }
      if (n.Head) {
        // Looks back over shoulder terrified
        n.Head.rotation.y = Math.sin(this.time * 3.5) * 0.65;
        n.Head.rotation.x = 0.1;
      }
      return;
    }

    // -----------------------------------------------------------
    // 7. LOCOMOTION (NO SLIDING — TRUE STEPPING & FOOT GROUNDING)
    // -----------------------------------------------------------
    if (isMoving) {
      // Stride frequency scales with movement speed
      const freqMult = this.type.includes('scout')
        ? 11.5
        : this.type.includes('brute')
        ? 6.8
        : isBoss
        ? (isRage ? 7.2 : 5.6)
        : 8.8;

      this.walkCycle += dt * freqMult;
      const cycle = this.walkCycle;

      // Leg swing angle
      const legAmplitude = isBoss ? 0.65 : 0.58;
      const leftThighAngle = Math.sin(cycle) * legAmplitude;
      const rightThighAngle = -leftThighAngle;

      // Leg & Knee Kinematics:
      // When leg swings forward (thighAngle > 0), knee bends backwards so foot lifts
      // When leg pushes backward (thighAngle < 0), leg straightens for stance push
      if (n.LeftThigh) n.LeftThigh.rotation.x = leftThighAngle;
      if (n.RightThigh) n.RightThigh.rotation.x = rightThighAngle;

      if (n.LeftCalf) {
        n.LeftCalf.rotation.x = Math.max(0, -leftThighAngle * 1.1);
      }
      if (n.RightCalf) {
        n.RightCalf.rotation.x = Math.max(0, -rightThighAngle * 1.1);
      }

      // Foot Grounding / Ankle Kinematics:
      // Foot lifts off floor in parabolic arc during forward swing, lands flat on ground
      if (n.LeftFoot) {
        const leftSwing = Math.max(0, -leftThighAngle);
        n.LeftFoot.position.y = -0.32 + leftSwing * 0.12; // Lifts during swing
        n.LeftFoot.rotation.x = -0.25 - leftThighAngle * 0.35; // Ankle flexion
      }
      if (n.RightFoot) {
        const rightSwing = Math.max(0, -rightThighAngle);
        n.RightFoot.position.y = -0.32 + rightSwing * 0.12;
        n.RightFoot.rotation.x = -0.25 - rightThighAngle * 0.35;
      }

      // Arms Counter-Swing:
      // Left leg forward -> Right arm forward; Right leg forward -> Left arm forward
      const armSwing = Math.cos(cycle) * (isBoss ? 0.38 : 0.52);
      if (n.LeftUpperArm) {
        n.LeftUpperArm.rotation.x = -armSwing - 0.1;
        n.LeftUpperArm.rotation.z = 0.08;
      }
      if (n.RightUpperArm) {
        // Carrying weapon: arm counter-swings with guarded elbow
        n.RightUpperArm.rotation.x = armSwing * 0.65 - 0.25;
        n.RightUpperArm.rotation.z = -0.08;
      }
      if (n.RightForearm) {
        n.RightForearm.rotation.x = -0.35 + Math.abs(armSwing) * 0.15;
      }

      // Pelvis / Hips Dynamics:
      // Vertical bobbing: 2 bobs per full stride cycle
      const hipBob = Math.abs(Math.sin(cycle)) * (isBoss ? 0.08 : 0.05);
      n.Hips.position.y = this.baseHipsY - hipBob;

      // Lateral weight shift: hips shift over the stance leg
      n.Hips.position.x = Math.cos(cycle) * (isBoss ? 0.05 : 0.03);

      // Pelvis yaw twist follows leg strides
      n.Hips.rotation.y = -Math.sin(cycle) * 0.12;

      // Torso / Spine:
      // Leans forward into walking momentum + counter-twists to stabilize shoulders
      if (n.Spine) {
        const forwardLean = (moveSpeed / 6.0) * 0.18;
        n.Spine.rotation.x = this.baseSpineX + forwardLean + Math.abs(Math.sin(cycle * 2)) * 0.04;
        n.Spine.rotation.y = Math.sin(cycle) * 0.08;
      }

      // Head:
      // Bobs subtly out of phase with hips and focuses on heading
      if (n.Head) {
        n.Head.rotation.x = -0.04 - Math.sin(cycle * 2) * 0.035;
        n.Head.rotation.y = Math.sin(cycle) * 0.04;
      }

      // Ears twitch with motion for goblins
      if (distanceLOD < 18) {
        if (n.LeftEar) n.LeftEar.rotation.z = 1.05 + Math.sin(cycle * 2) * 0.06;
        if (n.RightEar) n.RightEar.rotation.z = -1.05 - Math.sin(cycle * 2) * 0.06;
      }

    } else {
      // -----------------------------------------------------------
      // 8. ORGANIC IDLE (BREATHING, WEIGHT SHIFTS, LOOKING AROUND)
      // -----------------------------------------------------------
      const t = this.time;
      const breathFreq = isRage ? 3.4 : 1.8;
      const breath = Math.sin(t * breathFreq);

      // Reset leg swings to stable grounded standing stance
      if (n.LeftThigh) n.LeftThigh.rotation.x = -0.15;
      if (n.RightThigh) n.RightThigh.rotation.x = -0.15;
      if (n.LeftCalf) n.LeftCalf.rotation.x = 0.38;
      if (n.RightCalf) n.RightCalf.rotation.x = 0.38;
      if (n.LeftFoot) {
        n.LeftFoot.position.y = -0.32;
        n.LeftFoot.rotation.x = -0.22;
      }
      if (n.RightFoot) {
        n.RightFoot.position.y = -0.32;
        n.RightFoot.rotation.x = -0.22;
      }

      // Breathing expansion in Chest & Spine
      if (n.Chest && distanceLOD < 18) {
        const chestExpand = 1.0 + breath * 0.025;
        n.Chest.scale.set(chestExpand, 1.0, chestExpand);
      }
      if (n.Spine) {
        n.Spine.rotation.x = this.baseSpineX + breath * 0.035;
      }

      // Shoulders subtly rise and fall with breathing
      if (n.RightUpperArm) {
        n.RightUpperArm.rotation.x = -0.18 + breath * 0.04;
        n.RightUpperArm.rotation.z = -0.06;
      }
      if (n.LeftUpperArm) {
        n.LeftUpperArm.rotation.x = -0.12 + breath * 0.04;
        n.LeftUpperArm.rotation.z = 0.06;
      }

      // Periodic Weight Shift between Left and Right leg
      this.idleWeightShiftTimer -= dt;
      if (this.idleWeightShiftTimer <= 0) {
        this.idleWeightShiftTimer = 3.5 + Math.random() * 4.0;
        this.idleWeightSide = -this.idleWeightSide;
      }
      n.Hips.position.x = this.idleWeightSide * Math.sin(t * 0.8) * 0.025;
      n.Hips.position.y = this.baseHipsY;

      // Inquisitive Looking Around at Environment
      this.idleLookTimer -= dt;
      if (this.idleLookTimer <= 0) {
        this.idleLookTimer = 2.2 + Math.random() * 3.5;
        // Goblin looks left, right, or tilts head
        this.idleLookTargetY = (Math.random() - 0.5) * 0.85; // Look up to ~45 degrees left/right
        this.idleLookTargetX = (Math.random() - 0.5) * 0.35;
      }

      if (n.Head) {
        // Smoothly slerp head toward glance target
        n.Head.rotation.y += (this.idleLookTargetY - n.Head.rotation.y) * dt * 2.5;
        n.Head.rotation.x += (this.idleLookTargetX - breath * 0.04 - n.Head.rotation.x) * dt * 2.5;
        // Subtle inquisitive head tilt
        n.Head.rotation.z = Math.sin(t * 0.6) * 0.06;
      }

      // Jaw snarl twitch & ear flick for goblins (LOD close only)
      if (distanceLOD < 18) {
        if (n.Jaw) {
          n.Jaw.rotation.x = Math.max(0, Math.sin(t * 1.4) * 0.08);
        }
        if (n.LeftEar) {
          n.LeftEar.rotation.z = 1.05 + (Math.sin(t * 6) > 0.9 ? 0.12 : 0);
        }
        if (n.RightEar) {
          n.RightEar.rotation.z = -1.05 - (Math.sin(t * 5) > 0.9 ? 0.12 : 0);
        }
      }
    }
  }
}
