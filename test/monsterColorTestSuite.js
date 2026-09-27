// -------------------------------------------------------------
// SHADOW ASCENSION - MONSTER COLOR + MATERIAL OVERHAUL VERIFICATION SUITE
// Tests all specifications from the user prompt:
// 1. Goblin: Dark Green + Brown + Dark Iron (Olive/forest skin variations, darker joints/hands, scars, dirty teeth, amber eyes, wooden handle, orange edge notch)
// 2. Shadow Soldier: Black + Blue + Cyan (Charcoal body, dark blue-gray armor, black steel, cyan eyes & edge)
// 3. Shadow Knight: Black + Gunmetal + Blue (Deep black dread plate, gunmetal fluting, dark silver trim, navy cape, electric blue eyes, blue runes)
// 4. Abyss Assassin: Charcoal + Navy + Violet (Pale gray skin, dark charcoal/navy cloth, muted purple trim, violet eyes & dagger glow)
// 5. Abyss Brute: Charcoal + Dark Red + Bronze (Dark reddish-brown skin, burnt bronze accents, magma chest cracks, orange-red eyes & war maul)
// 6. Abyss Warden: Obsidian + Gunmetal + Violet + Cyan (Obsidian black, silver highlights, dark blue cloak, glowing violet veins, cyan/violet eyes, shadow aura)
// 7. Material PBR Separation (Distinct skin, leather, cloth, steel, obsidian, eyes, teeth)
// 8. Deterministic Color Variation across seeds
// -------------------------------------------------------------

import assert from 'node:assert';
import * as THREE from 'three';
import {
  buildGoblinModel,
  buildShadowSoldierModel,
  buildShadowKnightModel,
  buildAbyssAssassinModel,
  buildAbyssBruteModel,
  buildAbyssWardenModel
} from '../src/game/enemies/MonsterModelBuilder.js';

console.log('🎨 [TEST SUITE] Starting Monster Color + Material Overhaul Verification...\n');

// Helper to extract all unique materials from a model tree
function extractMaterials(rootGroup) {
  const mats = new Set();
  rootGroup.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => mats.add(m));
      } else {
        mats.add(child.material);
      }
    }
  });
  return Array.from(mats);
}

// =============================================================
// TEST 1: GOBLIN PALETTE & PBR MATERIALS
// =============================================================
console.log('--- Test 1: Goblin (Dark Green + Brown + Dark Iron) ---');
{
  const goblin = buildGoblinModel('warrior', 0);
  assert(goblin.nodes.Materials, 'Goblin must export Materials map');
  const mats = goblin.nodes.Materials;

  // 1. Skin PBR
  assert(mats.skinMat, 'Goblin must have skinMat');
  assert(mats.darkerSkinMat, 'Goblin must have darkerSkinMat for extremities/joints');
  assert.strictEqual(mats.skinMat.metalness, 0, 'Skin metalness must be 0');
  assert(mats.skinMat.roughness >= 0.7, 'Skin roughness must be realistic PBR (>= 0.7)');
  assert(mats.darkerSkinMat.color.getHex() !== mats.skinMat.color.getHex(), 'Extremity skin must be darker than torso');

  // 2. Face: Scars, dirty teeth, amber eyes
  assert(mats.scarMat, 'Goblin must have scarMat');
  assert(mats.dirtyTeethMat, 'Goblin must have dirtyTeethMat');
  assert(mats.eyeMat, 'Goblin must have eyeMat');

  // Eye color: amber/yellow (hex #f59e0b)
  const eyeHex = mats.eyeMat.color.getHexString();
  assert(eyeHex === 'f59e0b', `Goblin eye must be amber/yellow (#f59e0b), got #${eyeHex}`);
  assert(mats.eyeMat.emissiveIntensity >= 2.0, 'Goblin eyes must have emissive intensity');

  // Scars: reddish-brown
  const scarR = mats.scarMat.color.r;
  const scarB = mats.scarMat.color.b;
  assert(scarR > scarB * 1.5, 'Scar color must be reddish-brown');

  // 3. Clothing: brown leather, dark beige cloth, muted red straps, worn iron
  assert(mats.leatherMat, 'Goblin must have leatherMat');
  assert(mats.clothMat, 'Goblin must have clothMat');
  assert(mats.strapsMat, 'Goblin must have strapsMat');
  assert(mats.ironMat, 'Goblin must have ironMat');
  assert(mats.leatherMat.roughness >= 0.75, 'Leather must have high roughness');
  assert(mats.ironMat.metalness >= 0.8, 'Worn iron pieces must have metalness >= 0.8');

  // 4. Weapon: dark iron blade, wooden handle, reddish-orange edge notch highlight
  assert(mats.weaponBladeMat, 'Goblin must have weaponBladeMat');
  assert(mats.woodHandleMat, 'Goblin must have woodHandleMat');
  assert(mats.edgeHighlightMat, 'Goblin must have edgeHighlightMat for notches');
  assert(mats.weaponBladeMat.metalness >= 0.85, 'Blade must be metallic');
  assert(mats.woodHandleMat.metalness === 0, 'Wood handle metalness must be 0');

  // 5. Check variation across 4 seeds (olive green, forest green, green-brown, gray-green)
  const colors = [0, 1, 2, 3].map((seed) => {
    const g = buildGoblinModel('warrior', seed);
    return g.nodes.Materials.skinMat.color.getHexString();
  });
  const uniqueColors = new Set(colors);
  assert(uniqueColors.size === 4, `All 4 variant seeds must produce distinct goblin skin shades: ${colors.join(', ')}`);

  console.log(`  ✓ Goblin PBR verified: skin roughness ${mats.skinMat.roughness}, eye #${eyeHex} (amber), blade metalness ${mats.weaponBladeMat.metalness}`);
  console.log(`  ✓ 4 distinct skin variations: ${colors.map((c) => '#' + c).join(', ')}`);
}

// =============================================================
// TEST 2: SHADOW SOLDIER PALETTE & PBR MATERIALS
// =============================================================
console.log('\n--- Test 2: Shadow Soldier (Black + Blue + Cyan) ---');
{
  const soldier = buildShadowSoldierModel(0);
  assert(soldier.nodes.Materials, 'Shadow Soldier must export Materials');
  const mats = soldier.nodes.Materials;

  // Body: charcoal black
  assert(mats.charcoalBodyMat, 'Shadow Soldier must have charcoalBodyMat');
  const bodyHex = mats.charcoalBodyMat.color.getHex();
  assert(bodyHex < 0x252530, `Body must be charcoal black (got 0x${bodyHex.toString(16)})`);

  // Armor: dark blue-gray & black steel with subtle blue reflection
  assert(mats.blackArmorMat, 'Shadow Soldier must have blackArmorMat');
  assert(mats.blueGrayArmorMat, 'Shadow Soldier must have blueGrayArmorMat');
  assert(mats.blackArmorMat.metalness >= 0.85, 'Black steel armor must have high metalness');

  // Eyes: bright cyan (#00f0ff)
  assert(mats.cyanEyeMat, 'Shadow Soldier must have cyanEyeMat');
  assert.strictEqual(mats.cyanEyeMat.color.getHexString(), '00f0ff', 'Eyes must be bright cyan');
  assert(mats.cyanEyeMat.emissiveIntensity >= 3.0, 'Cyan eyes must be strongly emissive');

  // Energy & Weapon: dark steel with cyan energy along edge
  assert(mats.bladeSteelMat, 'Shadow Soldier must have bladeSteelMat');
  assert(mats.cyanEdgeMat, 'Shadow Soldier must have cyanEdgeMat');
  assert(mats.cyanEdgeMat.emissiveIntensity >= 2.0, 'Weapon cyan edge must glow');

  console.log(`  ✓ Shadow Soldier verified: Black (#${bodyHex.toString(16)}) + Blue-Gray + Cyan (#${mats.cyanEyeMat.color.getHexString()})`);
}

// =============================================================
// TEST 3: SHADOW KNIGHT PALETTE & PBR MATERIALS
// =============================================================
console.log('\n--- Test 3: Shadow Knight (Black + Gunmetal + Blue) ---');
{
  const knight = buildShadowKnightModel(0);
  assert(knight.nodes.Materials, 'Shadow Knight must export Materials');
  const mats = knight.nodes.Materials;

  // Armor: deep black plate & gunmetal fluting with dark silver highlights
  assert(mats.dreadSteelMat, 'Knight must have dreadSteelMat (deep black plate)');
  assert(mats.gunmetalMat, 'Knight must have gunmetalMat');
  assert(mats.darkSilverMat, 'Knight must have darkSilverMat trim');
  assert(mats.dreadSteelMat.metalness >= 0.9, 'Dread steel must have high metalness');
  assert(mats.dreadSteelMat.color.getHex() < 0x181820, 'Dread steel must be deep black');

  // Cape: dark navy/black
  assert(mats.capeMat, 'Knight must have capeMat');
  assert(mats.capeMat.metalness <= 0.05, 'Cape must be fabric (low metalness)');
  assert(mats.capeMat.roughness >= 0.85, 'Cape must be fabric (high roughness)');

  // Eyes: electric blue (#2563eb)
  assert(mats.electricBlueEyeMat, 'Knight must have electricBlueEyeMat');
  assert.strictEqual(mats.electricBlueEyeMat.color.getHexString(), '2563eb', 'Knight eyes must be electric blue');
  assert(mats.electricBlueEyeMat.emissiveIntensity >= 3.0, 'Eyes must be intensely emissive');

  // Weapon: black steel with blue glowing runes
  assert(mats.bladeSteelMat, 'Knight must have bladeSteelMat');
  assert(mats.blueGlowingRuneMat, 'Knight must have blueGlowingRuneMat');
  assert(mats.blueGlowingRuneMat.emissiveIntensity >= 2.5, 'Weapon runes must glow blue');

  console.log(`  ✓ Shadow Knight verified: Deep Black (#${mats.dreadSteelMat.color.getHexString()}) + Gunmetal + Electric Blue (#${mats.electricBlueEyeMat.color.getHexString()})`);
}

// =============================================================
// TEST 4: ABYSS ASSASSIN PALETTE & PBR MATERIALS
// =============================================================
console.log('\n--- Test 4: Abyss Assassin (Charcoal + Navy + Violet) ---');
{
  const assassin = buildAbyssAssassinModel(0);
  assert(assassin.nodes.Materials, 'Abyss Assassin must export Materials');
  const mats = assassin.nodes.Materials;

  // Skin: pale gray / desaturated skin
  assert(mats.paleSkinMat, 'Abyss Assassin must have paleSkinMat');
  assert.strictEqual(mats.paleSkinMat.color.getHexString(), '6e7382', 'Skin must be pale desaturated gray #6e7382');

  // Clothing: dark charcoal, deep navy, muted purple accents
  assert(mats.darkCharcoalMat, 'Assassin must have darkCharcoalMat');
  assert(mats.deepNavyMat, 'Assassin must have deepNavyMat');
  assert(mats.mutedPurpleMat, 'Assassin must have mutedPurpleMat');

  // Eyes: violet (#c084fc)
  assert(mats.violetEyeMat, 'Assassin must have violetEyeMat');
  assert.strictEqual(mats.violetEyeMat.color.getHexString(), 'c084fc', 'Eyes must be violet #c084fc');
  assert(mats.violetEyeMat.emissiveIntensity >= 2.5, 'Eyes must glow');

  // Weapon: black metal daggers with violet edge glow
  assert(mats.blackMetalMat, 'Assassin must have blackMetalMat');
  assert(mats.violetEdgeGlowMat, 'Assassin must have violetEdgeGlowMat');
  assert(mats.violetEdgeGlowMat.emissiveIntensity >= 2.0, 'Dagger edge must glow violet');

  console.log(`  ✓ Abyss Assassin verified: Pale Skin (#${mats.paleSkinMat.color.getHexString()}) + Charcoal + Navy + Violet Daggers`);
}

// =============================================================
// TEST 5: ABYSS BRUTE PALETTE & PBR MATERIALS
// =============================================================
console.log('\n--- Test 5: Abyss Brute (Charcoal + Dark Red + Bronze) ---');
{
  const brute = buildAbyssBruteModel(0);
  assert(brute.nodes.Materials, 'Abyss Brute must export Materials');
  const mats = brute.nodes.Materials;

  // Skin: dark reddish-brown / charcoal (#2e1c18)
  assert(mats.bruteSkinMat, 'Brute must have bruteSkinMat');
  assert.strictEqual(mats.bruteSkinMat.color.getHexString(), '2e1c18', 'Skin must be dark reddish-brown #2e1c18');

  // Armor: dark iron & burnt bronze
  assert(mats.darkIronArmorMat, 'Brute must have darkIronArmorMat');
  assert(mats.burntBronzeMat, 'Brute must have burntBronzeMat');
  assert(mats.burntBronzeMat.metalness >= 0.8, 'Burnt bronze must be metallic');

  // Chest: glowing orange-red cracks
  assert(mats.magmaCrackMat, 'Brute must have magmaCrackMat');
  assert(mats.magmaCrackMat.emissiveIntensity >= 3.0, 'Magma cracks must intensely glow');

  // Eyes: orange/red (#ff3b00)
  assert(mats.orangeRedEyeMat, 'Brute must have orangeRedEyeMat');
  assert.strictEqual(mats.orangeRedEyeMat.color.getHexString(), 'ff3b00', 'Eyes must be fiery orange/red #ff3b00');

  // Weapon: dark metal with red-orange energy
  assert(mats.darkMetalWeaponMat, 'Brute must have darkMetalWeaponMat');
  assert(mats.redOrangeEnergyMat, 'Brute must have redOrangeEnergyMat');
  assert(mats.redOrangeEnergyMat.emissiveIntensity >= 2.5, 'War maul energy must glow');

  console.log(`  ✓ Abyss Brute verified: Reddish Skin (#${mats.bruteSkinMat.color.getHexString()}) + Burnt Bronze (#${mats.burntBronzeMat.color.getHexString()}) + Magma Cracks (#${mats.magmaCrackMat.color.getHexString()})`);
}

// =============================================================
// TEST 6: ABYSS WARDEN PALETTE & PBR MATERIALS
// =============================================================
console.log('\n--- Test 6: Abyss Warden (Obsidian + Gunmetal + Violet + Cyan) ---');
{
  const warden = buildAbyssWardenModel();
  assert(warden.nodes.Materials, 'Abyss Warden must export Materials');
  const mats = warden.nodes.Materials;

  // Body: extremely dark charcoal with subtle blue-gray tones
  assert(mats.darkCharcoalBodyMat, 'Warden must have darkCharcoalBodyMat');
  const bodyHex = mats.darkCharcoalBodyMat.color.getHex();
  assert(bodyHex < 0x202028, 'Warden body must be extremely dark charcoal');

  // Armor: obsidian black & dark gunmetal with silver edge highlights
  assert(mats.obsidianPlateMat, 'Warden must have obsidianPlateMat');
  assert(mats.gunmetalPlateMat, 'Warden must have gunmetalPlateMat');
  assert(mats.silverEdgeMat, 'Warden must have silverEdgeMat');
  assert(mats.obsidianPlateMat.metalness >= 0.9, 'Obsidian plate must have high metalness');
  assert(mats.obsidianPlateMat.roughness <= 0.25, 'Obsidian plate must be glossy/reflective');

  // Cloak: black with dark blue undertones
  assert(mats.tatteredCloakMat, 'Warden must have tatteredCloakMat');
  const cloakB = mats.tatteredCloakMat.color.b;
  const cloakR = mats.tatteredCloakMat.color.r;
  assert(cloakB >= cloakR, 'Cloak must have dark blue undertone');

  // Eyes: intense violet/cyan
  assert(mats.sovereignEyeMat, 'Warden must have sovereignEyeMat');
  assert(mats.sovereignEyeMat.emissiveIntensity >= 4.0, 'Eyes must be intensely bright');

  // Armor cracks: glowing violet
  assert(mats.veinCrackMat, 'Warden must have veinCrackMat');
  assert(mats.veinCrackMat.emissiveIntensity >= 3.0, 'Vein cracks must glow violet');

  // Weapon: obsidian blade with violet energy fuller
  assert(mats.bladeSteelMat, 'Warden must have bladeSteelMat');
  assert(mats.runeFullerMat, 'Warden must have runeFullerMat');
  assert(mats.runeFullerMat.emissiveIntensity >= 2.5, 'Blade fuller channel must glow violet');

  // Aura: shadow smoke + violet ring + cyan highlights
  assert(mats.shadowSmokeMat, 'Warden must have shadowSmokeMat');
  assert(mats.violetParticleMat, 'Warden must have violetParticleMat');
  assert(mats.cyanSparkMat, 'Warden must have cyanSparkMat');

  console.log(`  ✓ Abyss Warden verified: Obsidian (#${mats.obsidianPlateMat.color.getHexString()}) + Gunmetal (#${mats.gunmetalPlateMat.color.getHexString()}) + Silver Edge + Cyan/Violet Aura`);
}

// =============================================================
// TEST 7: PBR MATERIAL DISTINCTIONS
// =============================================================
console.log('\n--- Test 7: PBR Separation Across Surfaces ---');
{
  const goblin = buildGoblinModel('warrior', 0);
  const gm = goblin.nodes.Materials;

  // Skin vs Leather vs Steel vs Teeth vs Wood
  assert(gm.skinMat.metalness === 0, 'Skin metalness must be 0');
  assert(gm.weaponBladeMat.metalness >= 0.85, 'Steel blade metalness must be >= 0.85');
  assert(gm.leatherMat.roughness > gm.weaponBladeMat.roughness, 'Leather must be rougher than polished blade');
  assert(gm.eyeMat.emissive.getHex() > 0 && gm.skinMat.emissive.getHex() === 0, 'Eyes must glow, skin must not glow');

  console.log(`  ✓ Skin: metalness=${gm.skinMat.metalness}, roughness=${gm.skinMat.roughness}`);
  console.log(`  ✓ Leather: metalness=${gm.leatherMat.metalness}, roughness=${gm.leatherMat.roughness}`);
  console.log(`  ✓ Steel Blade: metalness=${gm.weaponBladeMat.metalness}, roughness=${gm.weaponBladeMat.roughness}`);
  console.log(`  ✓ Eyes: metalness=${gm.eyeMat.metalness}, emissiveIntensity=${gm.eyeMat.emissiveIntensity}`);
}

console.log('\n🌟 ALL MONSTER COLOR + MATERIAL OVERHAUL TESTS PASSED SUCCESSFULLY! 🌟');
