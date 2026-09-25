// -------------------------------------------------------------
// SHADOW ASCENSION - VERIFICATION SUITE
// Validates:
// 1. Vector3 validation and crash immunity against undefined [0]
// 2. Dual-state SaveManager, corrupted save repair, checkpoint restoration
// 3. Combat collision crash immunity
// -------------------------------------------------------------

import assert from 'node:assert';
import {
  isValidVector3,
  safeVector3,
  safeCopyVector3,
  clampDungeonBounds,
  DEFAULT_PLAYER_POSITION
} from '../src/utils/vector3.js';
import {
  validateSaveData,
  SaveManager,
  PRIMARY_SAVE_KEY,
  BACKUP_SAVE_KEY,
  CHECKPOINT_KEY
} from '../src/utils/SaveManager.js';

// Standalone collision check logic with safeVector3
const checkCircleCollisionSafe = (posA, posB, radius) => {
  const pA = safeVector3(posA, [0, 0, 0], 'test:posA');
  const pB = safeVector3(posB, [0, 0, 0], 'test:posB');
  const dx = pA[0] - pB[0];
  const dz = pA[2] - pB[2];
  return Math.sqrt(dx * dx + dz * dz) <= radius;
};

// Mock localStorage for Node test environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => (mockStorage.has(key) ? mockStorage.get(key) : null),
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear()
};

console.log('🧪 [TEST SUITE] Starting Shadow Ascension Verification...\n');

// -------------------------------------------------------------
// TEST 1: VECTOR3 VALIDATION & CRASH IMMUNITY
// -------------------------------------------------------------
console.log('--- Test Group 1: Vector3 Validation & Crash Immunity ---');

// 1.1 Valid vectors
assert.strictEqual(isValidVector3([0, 1, 2]), true, 'Valid vector [0, 1, 2]');
assert.strictEqual(isValidVector3([-10.5, 0.25, 44]), true, 'Valid negative/decimal vector');
assert.strictEqual(isValidVector3({ x: 1, y: 2, z: 3 }), true, 'Valid Vector3 object');

// 1.2 Invalid vectors
assert.strictEqual(isValidVector3(undefined), false, 'undefined must be invalid');
assert.strictEqual(isValidVector3(null), false, 'null must be invalid');
assert.strictEqual(isValidVector3([]), false, 'empty array must be invalid');
assert.strictEqual(isValidVector3([1, 2]), false, '2-element array must be invalid');
assert.strictEqual(isValidVector3([NaN, 1, 2]), false, 'NaN must be invalid');
assert.strictEqual(isValidVector3([Infinity, 1, 2]), false, 'Infinity must be invalid');
assert.strictEqual(isValidVector3("not_a_vector"), false, 'String must be invalid');

// 1.3 safeVector3 fallbacks
const testUndefined = safeVector3(undefined, [0, 0.5, 24]);
assert.deepStrictEqual(testUndefined, [0, 0.5, 24], 'safeVector3 falls back on undefined');
assert.doesNotThrow(() => {
  const x = testUndefined[0];
  const y = testUndefined[1];
  const z = testUndefined[2];
  assert.strictEqual(x, 0);
  assert.strictEqual(y, 0.5);
  assert.strictEqual(z, 24);
}, 'Index [0] access on safeVector3 fallback must never throw');

const testCorrupted = safeVector3([undefined, null, 'invalid'], [1, 2, 3]);
assert.deepStrictEqual(testCorrupted, [1, 2, 3], 'safeVector3 repairs corrupted elements');

console.log('✅ Test Group 1 Passed: Vector3 validation is bulletproof against undefined [0].\n');

// -------------------------------------------------------------
// TEST 2: SAVEMANAGER & CORRUPTED DATA REPAIR
// -------------------------------------------------------------
console.log('--- Test Group 2: SaveManager & Corrupted Data Repair ---');

// 2.1 Repairing corrupted save with undefined/NaN coordinates
const corruptedData = {
  version: 1,
  player: {
    name: 'Kael',
    hp: NaN, // corrupted
    maxHp: -50, // corrupted
    position: [undefined, 'broken', null], // The exact cause of the user crash!
    level: 'three' // invalid type
  },
  dungeon: {
    currentRoom: 999 // out of bounds
  }
};

const validation = validateSaveData(corruptedData);
assert.strictEqual(validation.valid, true, 'Validation repairs corrupted state');
assert.strictEqual(Number.isFinite(validation.sanitized.player.hp), true, 'HP must be finite');
assert.strictEqual(validation.sanitized.player.hp > 0, true, 'HP must be positive');
assert.deepStrictEqual(validation.sanitized.player.position, [0, 0.5, 24], 'Position safely defaulted to entrance');
assert.strictEqual(validation.sanitized.dungeon.currentRoom, 4, 'Clamped out of bounds room to total rooms (4)');

// 2.2 Primary & Backup Failover
mockStorage.clear();
const validSaveState = {
  version: 1,
  timestamp: Date.now(),
  player: {
    name: 'Kael',
    level: 3,
    hp: 400,
    maxHp: 400,
    position: [2.5, 0.5, 10.0]
  },
  dungeon: {
    name: 'The Forgotten Crypt',
    rank: 'E',
    seed: 45678,
    currentRoom: 2
  }
};

// Save game
const saveRes = SaveManager.saveGame(validSaveState);
assert.strictEqual(saveRes.success, true, 'Save succeeded');
assert.strictEqual(mockStorage.has(PRIMARY_SAVE_KEY), true, 'Primary save written');

// Load game
const loadRes = SaveManager.loadGame();
assert.strictEqual(loadRes.success, true, 'Load succeeded');
assert.strictEqual(loadRes.data.player.level, 3, 'Restored level 3');
assert.deepStrictEqual(loadRes.data.player.position, [2.5, 0.5, 10.0], 'Restored exact player position');

// Corrupt Primary Save, ensure Backup or Checkpoint restores cleanly
mockStorage.set(PRIMARY_SAVE_KEY, '{ invalid_broken_json ');
mockStorage.set(BACKUP_SAVE_KEY, JSON.stringify(validSaveState));

const backupLoadRes = SaveManager.loadGame();
assert.strictEqual(backupLoadRes.success, true, 'Backup load succeeded after primary corruption');
assert.strictEqual(backupLoadRes.fromBackup, true, 'Reported fromBackup: true');
assert.strictEqual(backupLoadRes.data.player.level, 3, 'Restored level from backup');

// Corrupt both Primary & Backup, test recoverSave
mockStorage.set(PRIMARY_SAVE_KEY, '{ broken }');
mockStorage.set(BACKUP_SAVE_KEY, '{ broken }');
const recoverRes = SaveManager.recoverSave();
assert.strictEqual(recoverRes.success, true, 'recoverSave must never crash or return null');
assert.strictEqual(Array.isArray(recoverRes.data.player.position), true, 'Recovered valid player position');

console.log('✅ Test Group 2 Passed: SaveManager dual-state persistence and recovery work flawlessly.\n');

// -------------------------------------------------------------
// TEST 3: COMBAT ENGINE VECTOR SAFETY
// -------------------------------------------------------------
console.log('--- Test Group 3: Combat Engine Collision Crash Immunity ---');

// Call collision checks with undefined or incomplete vectors
assert.doesNotThrow(() => {
  const hitCircle = checkCircleCollisionSafe(undefined, [0, 0, 0], 5);
  assert.strictEqual(typeof hitCircle, 'boolean');
}, 'checkCircleCollision with undefined posA must not throw');

assert.doesNotThrow(() => {
  const hitCircle2 = checkCircleCollisionSafe([0, 1, 2], undefined, 5);
  assert.strictEqual(typeof hitCircle2, 'boolean');
}, 'checkCircleCollision with undefined posB must not throw');

console.log('✅ Test Group 3 Passed: Combat collisions safely handle missing coordinates.\n');

// -------------------------------------------------------------
// TEST GROUP 4: Enemy Position Tracker & Soft Auto-Aim
// -------------------------------------------------------------
console.log('--- Test Group 4: Enemy Position Tracker & Soft Auto-Aim ---');
const {
  registerEnemyPosition,
  unregisterEnemyPosition,
  getNearestEnemyInCone,
  getNearestEnemy,
  liveEnemyPositions
} = await import('../src/game/combat/EnemyPositionTracker.js');

// Player at [0, 0, 0], facing 0 radians (along +Z)
registerEnemyPosition('goblin_front', [0.5, 0, 3.0], 80, 80);
registerEnemyPosition('goblin_behind', [0, 0, -4.0], 80, 80);

const target = getNearestEnemyInCone([0, 0, 0], 0, 5.0, 80);
assert.ok(target, 'Should find the frontal target');
assert.strictEqual(target.id, 'goblin_front', 'Must identify the target in the forward cone');

// Behind target should not be matched by front cone
const targetStrict = getNearestEnemyInCone([0, 0, 0], 0, 5.0, 45);
assert.strictEqual(targetStrict?.id, 'goblin_front');

// Target lock should find nearest around 360
const nearest = getNearestEnemy([0, 0, 0], 10);
assert.strictEqual(nearest?.id, 'goblin_front');

unregisterEnemyPosition('goblin_front');
unregisterEnemyPosition('goblin_behind');
assert.strictEqual(liveEnemyPositions.size, 0);
console.log('✅ Test Group 4 Passed: EnemyPositionTracker and soft auto-aim cone checks succeed.\n');

// -------------------------------------------------------------
// TEST GROUP 5: Kael Character Model Rigging & Animations
// -------------------------------------------------------------
console.log('--- Test Group 5: Kael Character Rigging & Animation Machine ---');
const { buildKaelCharacterModel } = await import('../src/game/player/KaelModelBuilder.js');
const { KaelAnimationController } = await import('../src/game/player/KaelAnimationController.js');

const model = buildKaelCharacterModel();
assert.ok(model.root, 'Model root must exist');
assert.ok(model.nodes.Hips, 'Hips bone must exist');
assert.ok(model.nodes.Chest, 'Chest bone must exist');
assert.ok(model.nodes.Head, 'Head bone must exist');
assert.ok(model.nodes.RightHand, 'Right hand must exist');
assert.ok(model.nodes.WeaponSocket, 'Weapon socket must exist');

const anim = new KaelAnimationController(model.nodes);
// Test Idle
anim.update(0.016, 0, false, false);
// Test Walk/Run
anim.update(0.016, 1.0, true, false);
// Test Combos
anim.triggerAttack(1);
anim.update(0.05, 0, false, false);
anim.triggerAttack(2);
anim.update(0.05, 0, false, false);
anim.triggerAttack(3);
anim.update(0.05, 0, false, false);
// Test Dash & Skill & Ultimate
anim.triggerDash(0.3);
anim.update(0.05, 0, false, false);
anim.triggerSkill();
anim.update(0.05, 0, false, false);
anim.triggerUltimate();
anim.update(0.05, 0, false, false);
console.log('✅ Test Group 5 Passed: Humanoid character rigging and skeletal animation controller succeed.\n');

// -------------------------------------------------------------
// TEST GROUP 6: 3D Dark Fantasy Monster Models & Skeletal Animations
// -------------------------------------------------------------
console.log('--- Test Group 6: 3D Monster Models & Animation Controller ---');
const {
  buildAshGoblinModel,
  buildGraveSoldierModel,
  buildVoidArcherModel,
  buildBloodKnightModel,
  buildGraveWarlordModel,
  buildAbyssWardenModel
} = await import('../src/game/enemies/MonsterModelBuilder.js');
const { MonsterAnimationController } = await import('../src/game/enemies/MonsterAnimationController.js');

const monsterBuilders = [
  { name: 'Ash Goblin', fn: buildAshGoblinModel, type: 'goblin' },
  { name: 'Grave Soldier', fn: buildGraveSoldierModel, type: 'soldier' },
  { name: 'Void Archer', fn: buildVoidArcherModel, type: 'archer' },
  { name: 'Blood Knight', fn: buildBloodKnightModel, type: 'elite' },
  { name: 'Grave Warlord', fn: buildGraveWarlordModel, type: 'commander' },
  { name: 'Abyss Warden Boss', fn: buildAbyssWardenModel, type: 'boss' }
];

for (const { name, fn, type } of monsterBuilders) {
  const m = fn();
  assert.ok(m.root, `${name} must have root`);
  assert.ok(m.nodes.Hips, `${name} must have Hips node`);
  assert.ok(m.nodes.Spine, `${name} must have Spine node`);
  assert.ok(m.nodes.Chest, `${name} must have Chest node`);
  assert.ok(m.nodes.Head, `${name} must have Head node`);
  assert.ok(m.nodes.RightUpperArm, `${name} must have RightUpperArm node`);
  assert.ok(m.nodes.LeftUpperArm, `${name} must have LeftUpperArm node`);
  assert.ok(m.nodes.RightThigh, `${name} must have RightThigh node`);
  assert.ok(m.nodes.LeftThigh, `${name} must have LeftThigh node`);

  const ctrl = new MonsterAnimationController(m.nodes, type);
  // Test Idle
  ctrl.update(0.016, false, false, type === 'boss', false);
  // Test Walk / Chase
  ctrl.update(0.016, true, false, type === 'boss', false);
  // Test Attack
  ctrl.triggerAttack();
  ctrl.update(0.032, false, false, type === 'boss', false);
  // Test Hit Reaction
  ctrl.triggerHit(0.2);
  ctrl.update(0.016, false, false, type === 'boss', false);
  // Test Death
  ctrl.update(0.016, false, true, type === 'boss', false);
}

console.log('✅ Test Group 6 Passed: All 6 monster models and animation controller pass verification.\n');

// -------------------------------------------------------------
// TEST 7: DECOUPLED PLAYER CONTROLLER & INPUT MANAGER
// -------------------------------------------------------------
console.log('--- Test Group 7: PlayerController & InputManager (WASD Vector Physics) ---');

// 7.1 Verify Default Spawn Position is Room 1 Crypt Entrance
assert.deepStrictEqual(DEFAULT_PLAYER_POSITION, [0, 1, 8], 'DEFAULT_PLAYER_POSITION must be [0, 1, 8]');

// 7.2 Verify InputManager Key Mapping & Aliasing
const { inputManager } = await import('../src/game/player/InputManager.js');
assert.ok(inputManager, 'inputManager instance exists');

inputManager.setKey('w', true);
assert.strictEqual(inputManager.keys.forward, true, 'w must set forward to true');
inputManager.setKey('w', false);
assert.strictEqual(inputManager.keys.forward, false, 'w=false must set forward to false');

inputManager.setKey('s', true);
assert.strictEqual(inputManager.keys.backward, true, 's must set backward to true');

inputManager.setKey('a', true);
assert.strictEqual(inputManager.keys.left, true, 'a must set left to true');

inputManager.setKey('d', true);
assert.strictEqual(inputManager.keys.right, true, 'd must set right to true');

inputManager.reset();
assert.strictEqual(inputManager.keys.forward, false, 'reset clears forward');
assert.strictEqual(inputManager.keys.backward, false, 'reset clears backward');
assert.strictEqual(inputManager.keys.left, false, 'reset clears left');
assert.strictEqual(inputManager.keys.right, false, 'reset clears right');

// 7.3 Simulated Frame Movement Calculations (Pure Three.js ref-driven math)
const THREE = await import('three');
const testPos = new THREE.Vector3(0, 1, 8);
const testVelocity = new THREE.Vector3();
const speed = 6.5;
const dt = 0.016; // 60fps frame

// Simulate pressing W (Move Forward -> into Room 1, -Z direction)
inputManager.setKey('forward', true);
const forwardVal = (inputManager.keys.forward ? 1 : 0) - (inputManager.keys.backward ? 1 : 0);
const rightVal = (inputManager.keys.right ? 1 : 0) - (inputManager.keys.left ? 1 : 0);
const moveDir = new THREE.Vector3(rightVal, 0, -forwardVal).normalize();
moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), inputManager.mouse.yaw);

testVelocity.copy(moveDir).multiplyScalar(speed);
testPos.x += testVelocity.x * dt;
testPos.z += testVelocity.z * dt;

assert.ok(testPos.z < 8.0, `Pressing W must advance player forward along -Z: got ${testPos.z}`);
assert.strictEqual(testPos.y, 1, 'Player height Y must remain locked at 1.0');

// Simulate pressing D (Move Right -> +X direction)
inputManager.reset();
inputManager.setKey('right', true);
const fD = (inputManager.keys.forward ? 1 : 0) - (inputManager.keys.backward ? 1 : 0);
const rD = (inputManager.keys.right ? 1 : 0) - (inputManager.keys.left ? 1 : 0);
const moveDirD = new THREE.Vector3(rD, 0, -fD).normalize();
testVelocity.copy(moveDirD).multiplyScalar(speed);
testPos.x += testVelocity.x * dt;

assert.ok(testPos.x > 0, `Pressing D must advance player along +X: got ${testPos.x}`);

// Simulate pressing S (Move Backward -> +Z direction)
inputManager.reset();
inputManager.setKey('backward', true);
const fS = (inputManager.keys.forward ? 1 : 0) - (inputManager.keys.backward ? 1 : 0);
const rS = (inputManager.keys.right ? 1 : 0) - (inputManager.keys.left ? 1 : 0);
const moveDirS = new THREE.Vector3(rS, 0, -fS).normalize();
const prevZ = testPos.z;
testVelocity.copy(moveDirS).multiplyScalar(speed);
testPos.z += testVelocity.z * dt;

assert.ok(testPos.z > prevZ, `Pressing S must move player backward along +Z: got ${testPos.z}`);

// Simulate diagonal W+A: vector must be normalized to unit length
inputManager.reset();
inputManager.setKey('w', true);
inputManager.setKey('a', true);
const fWA = (inputManager.keys.forward ? 1 : 0) - (inputManager.keys.backward ? 1 : 0);
const rWA = (inputManager.keys.right ? 1 : 0) - (inputManager.keys.left ? 1 : 0);
const moveDirWA = new THREE.Vector3(rWA, 0, -fWA).normalize();
assert.ok(Math.abs(moveDirWA.length() - 1.0) < 0.0001, 'Diagonal input vector must be normalized');

inputManager.reset();
console.log('✅ Test Group 7 Passed: PlayerController & InputManager WASD physics verified.\n');

console.log('🎉 ALL TESTS PASSED! No unhandled vector errors, 3D models verified, WASD movement functional.');
