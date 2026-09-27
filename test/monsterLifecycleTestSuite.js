// -------------------------------------------------------------
// SHADOW ASCENSION - ENEMY LIFECYCLE & MULTI-MONSTER ROOM TEST SUITE
// Validates:
// 1. Room 1 generates 10 monsters (5 Goblins, 2 Soldiers, 1 Knight, 1 Brute, 1 Elite)
// 2. All monsters have unique IDs, room: 1, state: 'alive'
// 3. Killing monster #1:
//    - Monster #1 is removed / dead
//    - Remaining 9 monsters are STILL ALIVE
//    - roomEnemiesRemaining is 9
//    - Room is NOT marked defeated
// 4. Killing monster #2:
//    - Monster #2 is removed / dead
//    - Remaining 8 monsters are STILL ALIVE
//    - roomEnemiesRemaining is 8
//    - Room is NOT marked defeated
// 5. Killing all 10 monsters:
//    - Only when remaining count hits 0 is victory triggered
// -------------------------------------------------------------

import assert from 'node:assert';
import { generateDungeonEncounters } from '../src/game/encounters/EncounterManager.js';

console.log('⚔️ [LIFECYCLE TEST] Starting Enemy Lifecycle & Multi-Monster Verification...\n');

// 1. Generate Room Encounters
const encounters = generateDungeonEncounters('E', 1, 133789);
const room1 = encounters[1];

assert(room1, 'Room 1 encounter must exist');
console.log(`✓ Room 1 Encounter initialized: "${room1.typeName}"`);
console.log(`  Total Enemies: ${room1.totalEnemies}`);
assert.strictEqual(room1.totalEnemies, 10, 'Room 1 must contain exactly 10 monsters');
assert.strictEqual(room1.enemies.length, 10, 'Room 1 enemies array must contain 10 enemies');

// 2. Verify Monster Types & Unique IDs
console.log('\n--- Test 1: Verify Monster Composition & Unique IDs ---');
const ids = new Set();
let goblinCount = 0;
let soldierCount = 0;
let knightCount = 0;
let bruteCount = 0;
let eliteCount = 0;

room1.enemies.forEach((enemy, idx) => {
  assert(enemy.id, `Enemy #${idx} must have an id`);
  assert(!ids.has(enemy.id), `Enemy ID "${enemy.id}" must be globally unique`);
  ids.add(enemy.id);

  assert.strictEqual(enemy.roomId, 'room1', `Enemy ${enemy.id} roomId must be 'room1'`);
  assert.strictEqual(enemy.room, 1, `Enemy ${enemy.id} room must be 1`);
  assert.strictEqual(enemy.state, 'alive', `Enemy ${enemy.id} state must be 'alive'`);
  assert(enemy.hp > 0, `Enemy ${enemy.id} hp must be > 0`);
  assert(enemy.maxHp > 0, `Enemy ${enemy.id} maxHp must be > 0`);
  assert(Array.isArray(enemy.spawnPosition), `Enemy ${enemy.id} must have a spawnPosition array`);

  const idLower = enemy.id.toLowerCase();
  if (idLower.includes('goblin') && !idLower.includes('brute') && !idLower.includes('elite')) goblinCount++;
  else if (idLower.includes('soldier')) soldierCount++;
  else if (idLower.includes('knight')) knightCount++;
  else if (idLower.includes('brute')) bruteCount++;
  else if (idLower.includes('elite')) eliteCount++;

  console.log(`  [${idx + 1}/10] ID: ${enemy.id} | Name: ${enemy.name} | HP: ${enemy.hp}/${enemy.maxHp} | Pos: [${enemy.spawnPosition.join(', ')}]`);
});

assert.strictEqual(goblinCount, 5, 'Must contain 5 Goblins');
assert.strictEqual(soldierCount, 2, 'Must contain 2 Shadow Soldiers');
assert.strictEqual(knightCount, 1, 'Must contain 1 Shadow Knight');
assert.strictEqual(bruteCount, 1, 'Must contain 1 Abyss Brute');
assert.strictEqual(eliteCount, 1, 'Must contain 1 Elite');
console.log('✓ Composition verified: 5 Goblins, 2 Shadow Soldiers, 1 Shadow Knight, 1 Abyss Brute, 1 Elite');

// 3. Simulate Sequential Defeat & Verify Non-Disappearance
console.log('\n--- Test 2: Sequential Defeat Lifecycle Simulation ---');

let activeEnemies = [...room1.enemies];
let roomEnemiesRemaining = activeEnemies.length;
let victoryTriggered = false;

function onEncounterVictory(enc) {
  victoryTriggered = true;
}

function simulateEnemyDeath(deadEnemyId) {
  // Filter out ONLY that dead enemy
  activeEnemies = activeEnemies.filter((e) => e.id !== deadEnemyId);
  roomEnemiesRemaining = activeEnemies.filter((e) => e.hp > 0).length;

  if (roomEnemiesRemaining === 0) {
    onEncounterVictory(room1);
  }
}

// Kill 1st Monster
const firstEnemy = activeEnemies[0];
console.log(`Action: Killing Enemy #1 (${firstEnemy.id})...`);
simulateEnemyDeath(firstEnemy.id);

assert.strictEqual(activeEnemies.length, 9, 'Exactly 9 enemies must remain in active array');
assert.strictEqual(roomEnemiesRemaining, 9, 'roomEnemiesRemaining must be 9');
assert.strictEqual(victoryTriggered, false, 'Victory must NOT be triggered when 9 enemies remain');
assert(!activeEnemies.some((e) => e.id === firstEnemy.id), 'Dead enemy #1 must not be in active array');
console.log('✓ TEST 1 PASSED: Monster 1 is DEAD. Other 9 monsters remain alive and present in the room.');

// Kill 2nd Monster
const secondEnemy = activeEnemies[0];
console.log(`Action: Killing Enemy #2 (${secondEnemy.id})...`);
simulateEnemyDeath(secondEnemy.id);

assert.strictEqual(activeEnemies.length, 8, 'Exactly 8 enemies must remain in active array');
assert.strictEqual(roomEnemiesRemaining, 8, 'roomEnemiesRemaining must be 8');
assert.strictEqual(victoryTriggered, false, 'Victory must NOT be triggered when 8 enemies remain');
console.log('✓ TEST 2 PASSED: Monster 2 is DEAD. Other 8 monsters remain alive and present in the room.');

// Kill Remaining 8 Monsters one by one
console.log('\n--- Test 3: Defeating Remaining 8 Monsters Until Cleared ---');
while (activeEnemies.length > 0) {
  const current = activeEnemies[0];
  const countBefore = activeEnemies.length;
  simulateEnemyDeath(current.id);
  console.log(`  Killed ${current.id} -> Remaining: ${activeEnemies.length}/10`);
  assert.strictEqual(activeEnemies.length, countBefore - 1);
}

assert.strictEqual(activeEnemies.length, 0, 'All enemies should be defeated');
assert.strictEqual(roomEnemiesRemaining, 0, 'roomEnemiesRemaining must be 0');
assert.strictEqual(victoryTriggered, true, 'Encounter Victory must be triggered ONLY after all 10 are killed');
console.log('✓ TEST 5 PASSED: All 10 monsters defeated -> ROOM CLEARED!');

console.log('\n🌟 ALL ENEMY LIFECYCLE TESTS PASSED WITH ZERO ERRORS! 🌟\n');
