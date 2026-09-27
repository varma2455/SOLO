// -------------------------------------------------------------
// SHADOW ASCENSION - REALISTIC 3D MONSTER MODEL BUILDER
// Builds rich, anatomical, original 3D dark fantasy monster models:
// 1. Shadow Grunt (agile, hunched predatory silhouette, claw blades)
// 2. Shadow Knight (tall, heavy fluted dread steel plate, horned helm, greatsword)
// 3. Abyss Assassin (slim, hooded, dual serrated daggers, leg shadow mist)
// 4. Abyss Brute (massive muscular torso, spiked boulder pauldrons, war maul)
// 5. Abyss Warden (4.8m colossal boss titan, 4-tier pauldrons, Eclipse Greatsword)
// 6. Grave Soldier (undead skeleton warrior, dread breastplate, broadsword & shield)
// 7. Void Archer (hooded wraith archer, recurve war bow, spectral arrows)
// -------------------------------------------------------------

import * as THREE from 'three';

// Helper to create smoothed anatomical limbs (using CapsuleGeometry for smooth organic shapes)
function createLimbMesh(radiusTop, radiusBottom, height, material, radialSegments = 16) {
  let geo;
  if (Math.abs(radiusTop - radiusBottom) < 0.005) {
    const r = radiusTop;
    const len = Math.max(0.01, height - r * 2);
    geo = new THREE.CapsuleGeometry(r, len, 8, radialSegments);
  } else {
    geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, 4);
  }
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// 1. SHADOW SOLDIER (Medium-sized humanoid soldier, black armor, hooded helm, glowing eyes, sword & shield)
// Color Palette: BLACK + BLUE + CYAN
// - Body: Charcoal black body & dark blue-gray under-armor
// - Armor: Black steel with subtle blue reflections
// - Eyes: Bright cyan
// - Energy: Cyan/blue
// - Weapon: Dark steel with cyan energy along edge
// -------------------------------------------------------------
// 1. SHADOW SOLDIER
// Allied: BLACK + BLUE + CYAN (#00f0ff aura)
// Enemy Hostile: OBSIDIAN BLACK + VIOLET + CRIMSON (#ef4444 / #a855f7 hostile aura & eyes)
// -------------------------------------------------------------
export function buildShadowSoldierModel(variantSeed = 0, isHostile = false) {
  const root = new THREE.Group();
  root.name = isHostile ? 'HostileShadowSoldier_Root' : 'ShadowSoldier_Root';
  const nodes = {};

  const seed = typeof variantSeed === 'number' ? Math.abs(variantSeed) : 0;
  const eyeIntensity = 3.6 + (seed % 3) * 0.4;
  const runeIntensity = 2.6 + (seed % 2) * 0.5;

  // 1. Body: Charcoal black body & dark cloth (metalness = 0.15, roughness = 0.72)
  const charcoalBodyMat = new THREE.MeshStandardMaterial({
    color: isHostile ? 0x0a0b10 : 0x121318,
    roughness: 0.74,
    metalness: 0.15
  });
  const darkClothMat = new THREE.MeshStandardMaterial({
    color: isHostile ? 0x120814 : 0x161824,
    roughness: 0.88,
    metalness: 0.10
  });

  // 2. Armor: Obsidian / Black steel with subtle reflections
  const blackArmorMat = new THREE.MeshStandardMaterial({
    color: isHostile ? 0x090a12 : 0x11131c,
    roughness: 0.26,
    metalness: 0.94
  });
  const blueGrayArmorMat = new THREE.MeshStandardMaterial({
    color: isHostile ? 0x18101e : 0x1d2232,
    roughness: 0.35,
    metalness: 0.86
  });
  const ironTrimMat = new THREE.MeshStandardMaterial({
    color: isHostile ? 0x3d2035 : 0x384154,
    metalness: 0.90,
    roughness: 0.26
  });

  // 3. Weapon: Dark steel blade
  const bladeSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c24,
    metalness: 0.95,
    roughness: 0.18
  });

  // 4. Energy:
  // ALLIED: Cyan edge energy (#00f0ff) & Blue runic glow (#38bdf8)
  // ENEMY: Hostile Crimson edge (#ef4444) & Corrupted Violet runic glow (#a855f7)
  const cyanEdgeMat = new THREE.MeshStandardMaterial({
    color: isHostile ? 0xef4444 : 0x00f0ff,
    emissive: isHostile ? 0xdc2626 : 0x00f0ff,
    emissiveIntensity: runeIntensity + 0.8,
    roughness: 0.15,
    metalness: 0.2
  });
  const blueRuneMat = new THREE.MeshStandardMaterial({
    color: isHostile ? 0xa855f7 : 0x38bdf8,
    emissive: isHostile ? 0x7c3aed : 0x0284c7,
    emissiveIntensity: runeIntensity,
    roughness: 0.2,
    metalness: 0.2
  });

  // 5. Eyes:
  // ALLIED: Bright cyan (#00f0ff)
  // ENEMY: Piercing hostile red/crimson (#ef4444)
  const cyanEyeMat = new THREE.MeshStandardMaterial({
    color: isHostile ? 0xef4444 : 0x00f0ff,
    emissive: isHostile ? 0xdc2626 : 0x00f0ff,
    emissiveIntensity: eyeIntensity,
    roughness: 0.1,
    metalness: 0.0
  });

  nodes.Materials = {
    charcoalBodyMat,
    blackArmorMat,
    blueGrayArmorMat,
    ironTrimMat,
    bladeSteelMat,
    cyanEdgeMat,
    blueRuneMat,
    cyanEyeMat,
    eyeMat: cyanEyeMat
  };

  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.set(0, 0.92, 0);
  root.add(hips);
  nodes.Hips = hips;

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.22, 10), blackArmorMat);
  pelvis.castShadow = true;
  hips.add(pelvis);

  // Soldier Belt & Tassets
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 10), darkClothMat);
  belt.position.set(0, 0.06, 0);
  hips.add(belt);

  [-0.14, 0.14].forEach((tx) => {
    const tasset = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.03), blueGrayArmorMat);
    tasset.position.set(tx, -0.08, 0.16);
    tasset.rotation.x = 0.15;
    hips.add(tasset);
  });

  // Hostile Red/Violet Aura & Ground Smoke (for enemy shadow creatures)
  if (isHostile) {
    const hostileSmokeDisc = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.75, 16),
      new THREE.MeshBasicMaterial({ color: 0x220512, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    hostileSmokeDisc.rotation.x = -Math.PI / 2;
    hostileSmokeDisc.position.set(0, -0.9, 0);
    hips.add(hostileSmokeDisc);

    const hostileAuraRing = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.72, 12),
      new THREE.MeshBasicMaterial({ color: 0xdc2626, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    hostileAuraRing.rotation.x = -Math.PI / 2;
    hostileAuraRing.position.set(0, -0.88, 0);
    hips.add(hostileAuraRing);
  }

  // Spine & Torso (Upright Soldier Stance)
  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.set(0, 0.14, 0);
  hips.add(spine);
  nodes.Spine = spine;

  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.set(0, 0.24, 0);
  spine.add(chest);
  nodes.Chest = chest;

  // Inner Gambeson
  const gambeson = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.36, 10), charcoalBodyMat);
  gambeson.castShadow = true;
  chest.add(gambeson);

  // Black Steel Breastplate
  const breastplate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 0.32, 10, 1, false, -Math.PI * 0.45, Math.PI * 0.9),
    blackArmorMat
  );
  breastplate.position.set(0, 0.02, 0.02);
  breastplate.castShadow = true;
  chest.add(breastplate);

  // Center Armor Ridge & Blue Sigil
  const chestRidge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.04), ironTrimMat);
  chestRidge.position.set(0, 0.02, 0.24);
  chest.add(chestRidge);

  const runeSigil = new THREE.Mesh(new THREE.OctahedronGeometry(0.04), blueRuneMat);
  runeSigil.position.set(0, 0.08, 0.25);
  chest.add(runeSigil);

  // Layered Pauldrons
  [-0.32, 0.32].forEach((px, pi) => {
    const pauldron = new THREE.Group();
    pauldron.position.set(px, 0.18, 0);

    const pPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.16, 8), blueGrayArmorMat);
    pPlate.rotation.z = pi === 0 ? 0.35 : -0.35;
    pauldron.add(pPlate);

    const pTrim = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.16), ironTrimMat);
    pTrim.position.set(pi === 0 ? -0.08 : 0.08, 0, 0);
    pauldron.add(pTrim);

    chest.add(pauldron);
  });

  // Neck & Hooded Soldier Helmet
  const neck = new THREE.Group();
  neck.position.set(0, 0.24, 0);
  chest.add(neck);

  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(0, 0.12, 0);
  neck.add(head);
  nodes.Head = head;

  // Hood Outer Shell
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), darkClothMat);
  hood.scale.set(0.95, 1.05, 1.0);
  hood.position.set(0, 0.04, -0.02);
  hood.castShadow = true;
  head.add(hood);

  // Inner Helmet Faceplate / Visor
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.12), blackArmorMat);
  visor.position.set(0, 0, 0.08);
  head.add(visor);

  // Glowing Cyan Soldier Eyes
  [-0.06, 0.06].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.016, 0.03), cyanEyeMat);
    eye.position.set(ex, 0.02, 0.15);
    head.add(eye);
  });

  // Right Arm (Soldier Broadsword)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'RightUpperArm';
  rightUpperArm.position.set(0.34, 0.16, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArm = createLimbMesh(0.07, 0.06, 0.34, charcoalBodyMat);
  rArm.position.set(0, -0.17, 0);
  rightUpperArm.add(rArm);

  const rightForearm = new THREE.Group();
  rightForearm.name = 'RightForearm';
  rightForearm.position.set(0, -0.34, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearm = createLimbMesh(0.065, 0.055, 0.32, blackArmorMat);
  rForearm.position.set(0, -0.16, 0);
  rightForearm.add(rForearm);

  const rightHand = new THREE.Group();
  rightHand.name = 'RightHand';
  rightHand.position.set(0, -0.32, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Right Gauntlet Palm
  const rPalm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.08), ironTrimMat);
  rPalm.position.set(0, -0.04, 0);
  rightHand.add(rPalm);

  // Weapon: Shadow Soldier Broadsword
  const weaponSocket = new THREE.Group();
  weaponSocket.name = 'WeaponSocket';
  weaponSocket.position.set(0, -0.05, 0.08);
  weaponSocket.rotation.x = 0.15;
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // Hilt & Pommel
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), ironTrimMat);
  pommel.position.set(0, -0.22, 0);
  weaponSocket.add(pommel);

  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 6), darkClothMat);
  hilt.position.set(0, -0.1, 0);
  weaponSocket.add(hilt);

  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.06), ironTrimMat);
  guard.position.set(0, 0.04, 0);
  weaponSocket.add(guard);

  const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.02), bladeSteelMat);
  swordBlade.position.set(0, 0.48, 0);
  swordBlade.castShadow = true;
  weaponSocket.add(swordBlade);

  const bladeTip = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 4), bladeSteelMat);
  bladeTip.position.set(0, 0.98, 0);
  bladeTip.rotation.y = Math.PI / 4;
  weaponSocket.add(bladeTip);

  // Cyan energy along the edge
  const swordRunes = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.65, 0.025), cyanEdgeMat);
  swordRunes.position.set(0, 0.44, 0);
  weaponSocket.add(swordRunes);

  // Left Arm (Buckler Shield)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'LeftUpperArm';
  leftUpperArm.position.set(-0.34, 0.16, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArm = createLimbMesh(0.07, 0.06, 0.34, charcoalBodyMat);
  lArm.position.set(0, -0.17, 0);
  leftUpperArm.add(lArm);

  const leftForearm = new THREE.Group();
  leftForearm.name = 'LeftForearm';
  leftForearm.position.set(0, -0.34, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearm = createLimbMesh(0.065, 0.055, 0.32, blackArmorMat);
  lForearm.position.set(0, -0.16, 0);
  leftForearm.add(lForearm);

  const leftHand = new THREE.Group();
  leftHand.name = 'LeftHand';
  leftHand.position.set(0, -0.32, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  // Round Iron Buckler Shield attached to left forearm
  const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16), blueGrayArmorMat);
  shield.position.set(-0.08, -0.12, 0.05);
  shield.rotation.z = Math.PI / 2;
  shield.rotation.y = 0.2;
  leftForearm.add(shield);

  const shieldBoss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), blueRuneMat);
  shieldBoss.position.set(-0.1, -0.12, 0.05);
  leftForearm.add(shieldBoss);

  // Legs & Greaves
  [-0.14, 0.14].forEach((lx, li) => {
    const isLeft = li === 0;
    const thigh = new THREE.Group();
    thigh.name = isLeft ? 'LeftThigh' : 'RightThigh';
    thigh.position.set(lx, -0.08, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.085, 0.07, 0.44, charcoalBodyMat);
    thighMesh.position.set(0, -0.22, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.name = isLeft ? 'LeftCalf' : 'RightCalf';
    calf.position.set(0, -0.44, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const calfMesh = createLimbMesh(0.075, 0.06, 0.44, blackArmorMat);
    calfMesh.position.set(0, -0.22, 0);
    calf.add(calfMesh);

    // Knee Poleyn
    const knee = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 5), ironTrimMat);
    knee.position.set(0, 0, 0.09);
    knee.rotation.x = 1.4;
    calf.add(knee);

    // Boot
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.24), blackArmorMat);
    foot.position.set(0, -0.44, 0.06);
    calf.add(foot);
  });

  root.scale.setScalar(1.08); // Medium humanoid soldier
  return { root, nodes };
}

// -------------------------------------------------------------
// PROCEDURAL PBR TEXTURE GENERATOR FOR GOBLINS
// Creates high-resolution organic skin, leather, and iron maps with zero external assets
// -------------------------------------------------------------
// -------------------------------------------------------------
// PROCEDURAL PBR TEXTURE GENERATOR FOR GOBLINS
// Creates high-resolution organic skin, leather, and iron maps with zero external assets
// -------------------------------------------------------------
let _cachedGoblinTextures = null;
function getGoblinTextures() {
  if (_cachedGoblinTextures) return _cachedGoblinTextures;
  if (typeof document === 'undefined') {
    return { skinMap: null, skinBump: null, leatherMap: null, ironMap: null };
  }
  try {
    // 1. Goblin Skin Albedo Map (Neutral organic mottling with speckling, tinted by material color)
    const cSkin = document.createElement('canvas');
    cSkin.width = 256;
    cSkin.height = 256;
    const ctx = cSkin.getContext('2d');
    ctx.fillStyle = '#b0b5a8';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 2 + Math.random() * 10;
      const val = Math.floor(135 + Math.random() * 55);
      ctx.fillStyle = `rgba(${val}, ${val}, ${val}, 0.22)`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wrinkles and scar lines
    ctx.strokeStyle = 'rgba(70, 75, 65, 0.35)';
    ctx.lineWidth = 1.2;
    for (let w = 0; w < 16; w++) {
      ctx.beginPath();
      let wx = Math.random() * 256;
      let wy = Math.random() * 256;
      ctx.moveTo(wx, wy);
      for (let s = 0; s < 3; s++) {
        wx += (Math.random() - 0.5) * 22;
        wy += (Math.random() - 0.5) * 16;
        ctx.lineTo(wx, wy);
      }
      ctx.stroke();
    }
    const skinMap = new THREE.CanvasTexture(cSkin);
    skinMap.wrapS = THREE.RepeatWrapping;
    skinMap.wrapT = THREE.RepeatWrapping;

    // 2. Skin Bump Map (Pores & wrinkle depth)
    const cBump = document.createElement('canvas');
    cBump.width = 128;
    cBump.height = 128;
    const bCtx = cBump.getContext('2d');
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 128, 128);
    for (let p = 0; p < 600; p++) {
      const bx = Math.random() * 128;
      const by = Math.random() * 128;
      const val = Math.floor(105 + Math.random() * 50);
      bCtx.fillStyle = `rgb(${val}, ${val}, ${val})`;
      bCtx.fillRect(bx, by, 1.5, 1.5);
    }
    const skinBump = new THREE.CanvasTexture(cBump);
    skinBump.wrapS = THREE.RepeatWrapping;
    skinBump.wrapT = THREE.RepeatWrapping;

    // 3. Worn Leather Map (Rich brown organic grain)
    const cLeather = document.createElement('canvas');
    cLeather.width = 128;
    cLeather.height = 128;
    const lCtx = cLeather.getContext('2d');
    lCtx.fillStyle = '#5c4331';
    lCtx.fillRect(0, 0, 128, 128);
    lCtx.fillStyle = '#3a271a';
    for (let l = 0; l < 180; l++) {
      lCtx.fillRect(Math.random() * 128, Math.random() * 128, 2, 3);
    }
    const leatherMap = new THREE.CanvasTexture(cLeather);

    // 4. Tarnished Scrap Iron Map
    const cIron = document.createElement('canvas');
    cIron.width = 128;
    cIron.height = 128;
    const iCtx = cIron.getContext('2d');
    iCtx.fillStyle = '#222328';
    iCtx.fillRect(0, 0, 128, 128);
    iCtx.fillStyle = '#383a40';
    for (let ir = 0; ir < 120; ir++) {
      iCtx.fillRect(Math.random() * 128, Math.random() * 128, Math.random() * 10, 1);
    }
    const ironMap = new THREE.CanvasTexture(cIron);

    _cachedGoblinTextures = { skinMap, skinBump, leatherMap, ironMap };
    return _cachedGoblinTextures;
  } catch (_) {
    return { skinMap: null, skinBump: null, leatherMap: null, ironMap: null };
  }
}

// -------------------------------------------------------------
// 1. ORIGINAL DETAILED GOBLIN CREATURE BUILDER
// Color Palette: DARK GREEN + BROWN + DARK IRON
// - Skin: Dark olive green (desaturated), darker around hands/neck/joints
// - Face: Dark green skin, reddish-brown scars, dirty teeth, amber/yellow eyes
// - Clothing: Brown leather, dark beige cloth, muted red straps, worn scrap iron
// - Weapon: Dark iron blade, brown wooden handle, reddish-orange edge notch highlights
// -------------------------------------------------------------
export function buildGoblinModel(personalityInput = 'warrior', variantSeed = 0) {
  const personality = typeof personalityInput === 'string'
    ? personalityInput.toLowerCase()
    : (personalityInput?.personality || 'warrior').toLowerCase();

  const isScout = personality.includes('scout');
  const isBrute = personality.includes('brute');
  const isArcher = personality.includes('archer') || personality.includes('ranged');
  const isElite = personality.includes('elite');
  const isWarrior = !isScout && !isBrute && !isArcher && !isElite;

  const root = new THREE.Group();
  root.name = `Goblin_${personality}_Root`;
  const nodes = {};

  const tex = getGoblinTextures();

  // Deterministic color variation from seed
  const seed = typeof variantSeed === 'number' ? Math.abs(variantSeed) : 0;
  const skinVariantIndex = seed % 4;

  // 4 Recognized Goblin Skin Variations:
  // Goblin 1 = olive green skin (0x3e4a36)
  // Goblin 2 = darker forest green (0x2e3c2a)
  // Goblin 3 = green-brown skin (0x484232)
  // Goblin 4 = gray-green skin (0x39423b)
  const goblinSkinVariations = [
    { main: 0x3e4a36, dark: 0x232b1e, belly: 0x4e5d46, name: 'olive-green' },
    { main: 0x2e3c2a, dark: 0x1c2519, belly: 0x3d4e37, name: 'forest-green' },
    { main: 0x484232, dark: 0x29251c, belly: 0x57503d, name: 'green-brown' },
    { main: 0x39423b, dark: 0x212723, belly: 0x48524a, name: 'gray-green' }
  ];

  const chosenVar = isBrute
    ? { main: 0x344230, dark: 0x1f281b, belly: 0x45563f }
    : isScout
    ? { main: 0x3b4c37, dark: 0x243021, belly: 0x4d5f47 }
    : isElite
    ? { main: 0x2c3827, dark: 0x1a2316, belly: 0x3d4c38 }
    : goblinSkinVariations[skinVariantIndex];

  // -----------------------------------------------------------
  // Materials Palette: DARK GREEN + BROWN + DARK IRON
  // Separate PBR materials for skin, face, scars, teeth, leather, cloth, straps, metal, weapon
  // -----------------------------------------------------------
  // 1. Skin: metalness = 0, roughness = 0.72 (dark olive green / desaturated)
  const goblinSkinMat = new THREE.MeshStandardMaterial({
    color: chosenVar.main,
    roughness: 0.72,
    metalness: 0.0,
    map: tex.skinMap,
    bumpMap: tex.skinBump,
    bumpScale: 0.035
  });

  // Darker around hands, neck, joints & ear tips
  const darkerSkinMat = new THREE.MeshStandardMaterial({
    color: chosenVar.dark,
    roughness: 0.78,
    metalness: 0.0
  });

  // Subtle lighter belly / throat variation
  const bellySkinMat = new THREE.MeshStandardMaterial({
    color: chosenVar.belly,
    roughness: 0.75,
    metalness: 0.0
  });

  // Face: Reddish-brown scars (metalness = 0, roughness = 0.74)
  const scarMat = new THREE.MeshStandardMaterial({
    color: 0x682e24,
    roughness: 0.74,
    metalness: 0.0
  });

  // Face: Dirty ivory teeth & protruding fangs (metalness = 0.05, roughness = 0.55)
  const dirtyTeethMat = new THREE.MeshStandardMaterial({
    color: 0xd8ceb0,
    roughness: 0.55,
    metalness: 0.05
  });

  // Face: Slightly yellow/amber predatory eyes (amber/yellow)
  const eyeIntensity = 2.6 + (seed % 3) * 0.35;
  const goblinEyeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: eyeIntensity,
    roughness: 0.15,
    metalness: 0.0
  });

  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const clawMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.3,
    metalness: 0.15
  });

  // Clothing: Brown leather (metalness = 0.05, roughness = 0.82)
  const brownLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x342419,
    roughness: 0.82,
    metalness: 0.05,
    map: tex.leatherMap
  });

  // Clothing: Dark beige cloth (metalness = 0.02, roughness = 0.92)
  const darkBeigeClothMat = new THREE.MeshStandardMaterial({
    color: 0x484035,
    roughness: 0.92,
    metalness: 0.02
  });
  const dirtyClothMat = darkBeigeClothMat;

  // Clothing: Muted red straps (metalness = 0.05, roughness = 0.82)
  const mutedRedStrapsMat = new THREE.MeshStandardMaterial({
    color: 0x662924,
    roughness: 0.82,
    metalness: 0.05
  });

  // Clothing: Worn scrap metal pieces (metalness = 0.88, roughness = 0.38)
  const scrapIronMat = new THREE.MeshStandardMaterial({
    color: 0x33363d,
    roughness: 0.38,
    metalness: 0.88,
    map: tex.ironMap
  });

  // Weapon: Dark iron blade (metalness = 0.90, roughness = 0.30)
  const darkIronBladeMat = new THREE.MeshStandardMaterial({
    color: 0x3f444f,
    roughness: 0.30,
    metalness: 0.90
  });

  // Weapon: Brown wooden handle (metalness = 0.0, roughness = 0.78)
  const woodHandleMat = new THREE.MeshStandardMaterial({
    color: 0x3a281c,
    roughness: 0.78,
    metalness: 0.0
  });

  // Weapon: Small reddish-orange edge highlights / notch chips
  const edgeHighlightMat = new THREE.MeshStandardMaterial({
    color: 0x7c2d12,
    emissive: 0xc2410c,
    emissiveIntensity: 1.2 + (seed % 2) * 0.4,
    roughness: 0.40,
    metalness: 0.85
  });

  nodes.Materials = {
    skinMat: goblinSkinMat,
    darkerSkinMat,
    bellySkinMat,
    scarMat,
    dirtyTeethMat,
    eyeMat: goblinEyeMat,
    pupilMat,
    clawMat,
    leatherMat: brownLeatherMat,
    clothMat: darkBeigeClothMat,
    strapsMat: mutedRedStrapsMat,
    ironMat: scrapIronMat,
    weaponBladeMat: darkIronBladeMat,
    woodHandleMat,
    edgeHighlightMat
  };


  // -----------------------------------------------------------
  // 1. HIPS & PELVIS
  // -----------------------------------------------------------
  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.set(0, 0.65, 0);
  root.add(hips);
  nodes.Hips = hips;

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.18, 16), brownLeatherMat);
  pelvis.castShadow = true;
  pelvis.receiveShadow = true;
  hips.add(pelvis);
  nodes.Pelvis = pelvis;

  // Crude Belt with Bone Trophy & Leather Pouch
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 16), brownLeatherMat);
  belt.position.set(0, 0.05, 0);
  hips.add(belt);

  const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.04), scrapIronMat);
  beltBuckle.position.set(0, 0.05, 0.18);
  hips.add(beltBuckle);

  const boneCharm = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.12, 6), dirtyTeethMat);
  boneCharm.position.set(0.12, -0.05, 0.16);
  boneCharm.rotation.z = 0.3;
  hips.add(boneCharm);

  const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.07), darkBeigeClothMat);
  pouch.position.set(-0.14, 0.02, 0.14);
  pouch.rotation.y = 0.4;
  hips.add(pouch);

  // Tattered Front & Rear Cloth Loincloth Flaps (Dark beige cloth)
  const loinclothFront = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.28), darkBeigeClothMat);
  loinclothFront.position.set(0, -0.12, 0.16);
  loinclothFront.rotation.x = 0.12;
  hips.add(loinclothFront);

  const loinclothBack = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.26), darkBeigeClothMat);
  loinclothBack.position.set(0, -0.11, -0.15);
  loinclothBack.rotation.x = -0.15;
  hips.add(loinclothBack);

  // -----------------------------------------------------------
  // 2. SPINE & MUSCULAR HUNCHED TORSO
  // -----------------------------------------------------------
  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.set(0, 0.12, 0);
  spine.rotation.x = 0.35; // Characteristic predatory goblin hunch
  hips.add(spine);
  nodes.Spine = spine;

  // Spine Vertebrae Ridges along the hunched back
  for (let sv = 0; sv < 5; sv++) {
    const vert = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 6), darkerSkinMat);
    vert.position.set(0, 0.04 + sv * 0.08, -0.16);
    vert.rotation.x = -1.2;
    spine.add(vert);
  }

  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.set(0, 0.18, 0);
  spine.add(chest);
  nodes.Chest = chest;

  // Main Muscular Torso Block (Anatomical contours)
  const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.36, 16, 3), goblinSkinMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  chest.add(torsoMesh);

  // Lighter Belly / Abdomen Pad
  const bellyPad = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.06), bellySkinMat);
  bellyPad.position.set(0, -0.04, 0.15);
  chest.add(bellyPad);

  // Defined Pectoral Muscle Pads
  [-0.08, 0.08].forEach((px) => {
    const pec = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, 0.06), goblinSkinMat);
    pec.position.set(px, 0.08, 0.16);
    pec.rotation.x = -0.15;
    chest.add(pec);
  });

  // Crossed Studded Leather Harness with Metal Studs
  // Strap 1: Brown leather strap across chest
  const harness1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.02), brownLeatherMat);
  harness1.position.set(0, 0.02, 0.17);
  harness1.rotation.z = 0.55;
  chest.add(harness1);

  // Strap 2: Muted red strap across chest
  const harness2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.02), mutedRedStrapsMat);
  harness2.position.set(0, 0.02, 0.17);
  harness2.rotation.z = -0.55;
  chest.add(harness2);

  // Metal Studs along harness
  [-0.08, 0, 0.08].forEach((sy) => {
    const stud = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), scrapIronMat);
    stud.position.set(sy * 0.8, sy, 0.19);
    chest.add(stud);
  });

  // Optional chest battle scar based on variation seed
  if (seed % 2 === 1) {
    const chestScar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.02), scarMat);
    chestScar.position.set(0.06, 0.04, 0.18);
    chestScar.rotation.z = 0.65;
    chest.add(chestScar);
  }

  // Asymmetrical Scrap Iron Shoulder Pauldron on Right Shoulder
  const pauldron = new THREE.Group();
  pauldron.position.set(0.28, 0.16, 0);
  const pPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.14, 6), scrapIronMat);
  pPlate.rotation.z = -0.4;
  pPlate.castShadow = true;
  pauldron.add(pPlate);
  if (isBrute || isElite) {
    const pSpike = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 5), scrapIronMat);
    pSpike.position.set(0.08, 0.12, 0);
    pSpike.rotation.z = -0.6;
    pauldron.add(pSpike);
  }
  chest.add(pauldron);

  // -----------------------------------------------------------
  // 3. NECK & OVERSIZED EXPRESSIVE GOBLIN HEAD
  // -----------------------------------------------------------
  const neck = new THREE.Group();
  neck.position.set(0, 0.22, 0.08);
  neck.rotation.x = 0.25; // Angled forward
  chest.add(neck);

  // Darker skin around neck and throat
  const neckMesh = createLimbMesh(0.11, 0.13, 0.16, darkerSkinMat);
  neck.add(neckMesh);

  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(0, 0.12, 0.04);
  neck.add(head);
  nodes.Head = head;

  // Oversized Cranium / Skull (Bulbous back, wide temples, high-segment contour)
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 20), goblinSkinMat);
  skull.scale.set(1.06, 0.95, 1.16);
  skull.position.set(0, 0.04, -0.04);
  skull.castShadow = true;
  head.add(skull);

  // Heavy Protruding Bony Brow Ridge
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.12), darkerSkinMat);
  brow.position.set(0, 0.09, 0.14);
  brow.rotation.x = 0.2;
  head.add(brow);

  // Brow Wrinkle Ridges
  [-0.04, 0.04].forEach((wx) => {
    const frownCrease = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.03), darkerSkinMat);
    frownCrease.position.set(wx, 0.13, 0.15);
    head.add(frownCrease);
  });

  // Large Predatory Eyes & Slit Pupils
  [-0.085, 0.085].forEach((ex) => {
    // Sclera / Glowing Iris
    const eyeBall = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 14), goblinEyeMat);
    eyeBall.position.set(ex, 0.05, 0.16);
    head.add(eyeBall);

    // Black Vertical Slit Pupil
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.052, 0.015), pupilMat);
    pupil.position.set(ex, 0.05, 0.218);
    head.add(pupil);
  });

  // Hooked Broad Goblin Nose with Nostrils
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.14, 6), darkerSkinMat);
  nose.position.set(0, -0.02, 0.22);
  nose.rotation.x = -1.2;
  head.add(nose);

  [-0.03, 0.03].forEach((nx) => {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), pupilMat);
    nostril.position.set(nx, -0.045, 0.22);
    head.add(nostril);
  });

  // Cheek Scar on Left Side (Reddish-brown scars)
  const scar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.16, 0.02), scarMat);
  scar.position.set(-0.14, 0.02, 0.14);
  scar.rotation.z = -0.55;
  head.add(scar);

  // Articulated Lower Jaw with Protruding Fangs/Tusks
  const jaw = new THREE.Group();
  jaw.name = 'Jaw';
  jaw.position.set(0, -0.08, 0.06);
  head.add(jaw);
  nodes.Jaw = jaw;

  const jawMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.12, 16), goblinSkinMat);
  jawMesh.position.set(0, -0.04, 0.08);
  jawMesh.rotation.x = 0.3;
  jaw.add(jawMesh);

  // Prominent Lower Tusks (Poking upward past upper lip - Dirty teeth)
  [-0.065, 0.065].forEach((tx) => {
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.09, 6), dirtyTeethMat);
    tusk.position.set(tx, 0.02, 0.16);
    tusk.rotation.x = 0.35;
    tusk.rotation.z = tx < 0 ? -0.15 : 0.15;
    jaw.add(tusk);
  });

  // Visible Sharp Serrated Teeth Row (Lower - Dirty teeth)
  for (let tooth = -3; tooth <= 3; tooth++) {
    if (tooth === -2 || tooth === 2) continue; // Skip tusk spot
    const smallTooth = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 5), dirtyTeethMat);
    smallTooth.position.set(tooth * 0.025, 0.01, 0.16 - Math.abs(tooth) * 0.015);
    smallTooth.rotation.x = 0.25;
    jaw.add(smallTooth);
  }

  // Upper Teeth Row on Head (Dirty teeth)
  for (let ut = -2; ut <= 2; ut++) {
    const upperTooth = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.045, 5), dirtyTeethMat);
    upperTooth.position.set(ut * 0.03, -0.06, 0.19 - Math.abs(ut) * 0.01);
    upperTooth.rotation.x = Math.PI - 0.25;
    head.add(upperTooth);
  }

  // Long Pointed Goblin Ears (With notches and earring)
  [-0.2, 0.2].forEach((ex, ei) => {
    const isLeft = ei === 0;
    const earGroup = new THREE.Group();
    earGroup.name = isLeft ? 'LeftEar' : 'RightEar';
    earGroup.position.set(ex, 0.04, -0.02);
    head.add(earGroup);
    if (isLeft) nodes.LeftEar = earGroup; else nodes.RightEar = earGroup;

    // Ear cartilage cone angled back and outward
    const earMesh = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.34, 10), darkerSkinMat);
    earMesh.position.set(isLeft ? -0.14 : 0.14, 0.06, -0.08);
    earMesh.rotation.z = isLeft ? 1.05 : -1.05;
    earMesh.rotation.x = -0.45;
    earMesh.scale.set(0.45, 1.0, 0.85);
    earMesh.castShadow = true;
    earGroup.add(earMesh);

    // Crude Iron Earring Hoop on Left Ear
    if (isLeft) {
      const earring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), scrapIronMat);
      earring.position.set(-0.25, 0.08, -0.12);
      earring.rotation.y = 0.5;
      earGroup.add(earring);
    }
  });

  // Scout Hood / Helmet / Hat by Personality
  if (isScout) {
    const scoutCowl = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.45, 8), dirtyClothMat);
    scoutCowl.position.set(0, 0.16, -0.06);
    scoutCowl.rotation.x = -0.3;
    head.add(scoutCowl);
  } else if (isElite) {
    const skullCap = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.24, 0.16, 8), scrapIronMat);
    skullCap.position.set(0, 0.14, -0.02);
    head.add(skullCap);
    [-0.18, 0.18].forEach((hx, hi) => {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 5), scrapIronMat);
      horn.position.set(hx, 0.24, 0.02);
      horn.rotation.z = hi === 0 ? 0.7 : -0.7;
      head.add(horn);
    });
  }

  // -----------------------------------------------------------
  // 3D ALERT EXCLAMATION MARK (!) BILLBOARD
  // Appears above goblin's head when detecting the player
  // -----------------------------------------------------------
  const alertIcon = new THREE.Group();
  alertIcon.name = 'AlertIcon';
  alertIcon.position.set(0, 0.65, 0);
  alertIcon.visible = false;
  alertIcon.scale.set(0.001, 0.001, 0.001);
  head.add(alertIcon);
  nodes.AlertIcon = alertIcon;

  const alertBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.32, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b })
  );
  alertBar.position.set(0, 0.18, 0);
  alertIcon.add(alertBar);

  const alertDot = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.06),
    new THREE.MeshBasicMaterial({ color: 0xf59e0b })
  );
  alertDot.position.set(0, -0.06, 0);
  alertIcon.add(alertDot);

  // -----------------------------------------------------------
  // 4. LONG ARMS, ELBOWS, WRISTS, HANDS WITH FINGERS & CLAWS
  // -----------------------------------------------------------
  // Helper to create an articulated hand with 4 fingers + thumb + sharp claws
  const createArticulatedHand = (isLeft) => {
    const handGroup = new THREE.Group();

    // Palm Block
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.05), darkerSkinMat);
    palm.position.set(0, -0.035, 0);
    palm.castShadow = true;
    handGroup.add(palm);

    // 4 Articulated Fingers
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Group();
      const fx = (f - 1.5) * 0.018;
      finger.position.set(fx, -0.07, 0);

      const phalanx = createLimbMesh(0.008, 0.007, 0.045, darkerSkinMat, 6);
      phalanx.position.set(0, -0.02, 0);
      finger.add(phalanx);

      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.03, 4), clawMat);
      claw.position.set(0, -0.048, 0.006);
      claw.rotation.x = 0.5;
      finger.add(claw);

      handGroup.add(finger);
    }

    // Opposable Thumb
    const thumb = new THREE.Group();
    thumb.position.set(isLeft ? 0.038 : -0.038, -0.03, 0.02);
    thumb.rotation.z = isLeft ? 0.75 : -0.75;
    thumb.rotation.x = 0.35;

    const tPhalanx = createLimbMesh(0.009, 0.008, 0.038, darkerSkinMat, 6);
    tPhalanx.position.set(0, -0.018, 0);
    thumb.add(tPhalanx);

    const tClaw = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.028, 4), clawMat);
    tClaw.position.set(0, -0.042, 0.006);
    tClaw.rotation.x = 0.5;
    thumb.add(tClaw);

    handGroup.add(thumb);
    return handGroup;
  };

  // Right Arm (Weapon Wielder)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'RightUpperArm';
  rightUpperArm.position.set(0.28, 0.12, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArmMesh = createLimbMesh(0.065, 0.052, 0.34, goblinSkinMat);
  rArmMesh.position.set(0, -0.17, 0);
  rightUpperArm.add(rArmMesh);

  const rightForearm = new THREE.Group();
  rightForearm.name = 'RightForearm';
  rightForearm.position.set(0, -0.34, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearmMesh = createLimbMesh(0.055, 0.046, 0.32, darkerSkinMat);
  rForearmMesh.position.set(0, -0.16, 0);
  rightForearm.add(rForearmMesh);

  // Leather Wrist Wraps & Iron Bracer
  const rBracer = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.052, 0.12, 8), brownLeatherMat);
  rBracer.position.set(0, -0.18, 0);
  rightForearm.add(rBracer);

  const rightHand = new THREE.Group();
  rightHand.name = 'RightHand';
  rightHand.position.set(0, -0.32, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;
  rightHand.add(createArticulatedHand(false));

  // Weapon Socket attached to Right Hand
  const weaponSocket = new THREE.Group();
  weaponSocket.name = 'WeaponSocket';
  weaponSocket.position.set(0, -0.05, 0.06);
  weaponSocket.rotation.x = 0.2;
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // -----------------------------------------------------------
  // 5. WEAPONS BY PERSONALITY (Dark iron blade, wooden handle, orange edge highlights)
  // -----------------------------------------------------------
  if (isScout) {
    // Scout: Serrated Bone Skinning Dirk with Wooden Handle
    const daggerHilt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 6), woodHandleMat);
    daggerHilt.position.set(0, -0.06, 0);
    weaponSocket.add(daggerHilt);

    const dBlade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.42, 0.015), darkIronBladeMat);
    dBlade.position.set(0, 0.22, 0);
    dBlade.castShadow = true;
    weaponSocket.add(dBlade);

    // Gut hook / serrations with reddish-orange edge highlights
    for (let sb = 0; sb < 3; sb++) {
      const serration = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.04, 4), edgeHighlightMat);
      serration.position.set(0.03, 0.12 + sb * 0.08, 0);
      serration.rotation.z = -1.2;
      weaponSocket.add(serration);
    }
  } else if (isBrute) {
    // Brute: Heavy Chipped Iron War Cleaver Axe with Wooden Haft
    const axeHaft = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.025, 0.95, 8), woodHandleMat);
    axeHaft.position.set(0, 0.15, 0);
    weaponSocket.add(axeHaft);

    const axeHead = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.06), scrapIronMat);
    axeHead.position.set(0.12, 0.52, 0);
    axeHead.castShadow = true;
    weaponSocket.add(axeHead);

    const axeEdge = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.14, 4), darkIronBladeMat);
    axeEdge.position.set(0.24, 0.52, 0);
    axeEdge.rotation.z = -Math.PI / 2;
    weaponSocket.add(axeEdge);
  } else if (isArcher) {
    // Archer: Nocked Arrow in right hand, Bow in left hand
    const arrowShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.75, 6), woodHandleMat);
    arrowShaft.position.set(0, 0.25, 0);
    weaponSocket.add(arrowShaft);

    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), scrapIronMat);
    arrowHead.position.set(0, 0.64, 0);
    weaponSocket.add(arrowHead);
  } else if (isElite) {
    // Elite: Serrated Dread Scimitar with Wooden Handle & Reddish Edge Highlights
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 6), woodHandleMat);
    hilt.position.set(0, -0.08, 0);
    weaponSocket.add(hilt);

    const scimitarBlade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.85, 0.02), darkIronBladeMat);
    scimitarBlade.position.set(0.04, 0.42, 0);
    scimitarBlade.rotation.z = -0.08;
    scimitarBlade.castShadow = true;
    weaponSocket.add(scimitarBlade);

    const runicEdge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.72, 0.024), edgeHighlightMat);
    runicEdge.position.set(0.07, 0.42, 0);
    runicEdge.rotation.z = -0.08;
    weaponSocket.add(runicEdge);
  } else {
    // Warrior (Default): Notched Chipped Dark Iron Short Sword
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), scrapIronMat);
    pommel.position.set(0, -0.18, 0);
    weaponSocket.add(pommel);

    // Brown wooden handle
    const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 6), woodHandleMat);
    hilt.position.set(0, -0.08, 0);
    weaponSocket.add(hilt);

    const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.05), scrapIronMat);
    crossguard.position.set(0, 0.02, 0);
    weaponSocket.add(crossguard);

    // Dark iron blade with central blood fuller groove
    const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.72, 0.018), darkIronBladeMat);
    swordBlade.position.set(0, 0.4, 0);
    swordBlade.castShadow = true;
    weaponSocket.add(swordBlade);

    // Fuller channel (dark iron recess groove)
    const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.52, 0.02), scrapIronMat);
    fuller.position.set(0, 0.38, 0);
    weaponSocket.add(fuller);

    const swordTip = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.14, 4), darkIronBladeMat);
    swordTip.position.set(0, 0.82, 0);
    swordTip.rotation.y = Math.PI / 4;
    weaponSocket.add(swordTip);

    // Chipped notches on blade edge with small reddish-orange edge highlights
    [-0.04, 0.04].forEach((chipX, ci) => {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.022), edgeHighlightMat);
      chip.position.set(chipX, 0.35 + ci * 0.18, 0);
      weaponSocket.add(chip);
    });
  }

  // Left Arm (Buckler / Offhand / Bow)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'LeftUpperArm';
  leftUpperArm.position.set(-0.28, 0.12, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArmMesh = createLimbMesh(0.065, 0.052, 0.34, goblinSkinMat);
  lArmMesh.position.set(0, -0.17, 0);
  leftUpperArm.add(lArmMesh);

  const leftForearm = new THREE.Group();
  leftForearm.name = 'LeftForearm';
  leftForearm.position.set(0, -0.34, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearmMesh = createLimbMesh(0.055, 0.046, 0.32, darkerSkinMat);
  lForearmMesh.position.set(0, -0.16, 0);
  leftForearm.add(lForearmMesh);

  const leftHand = new THREE.Group();
  leftHand.name = 'LeftHand';
  leftHand.position.set(0, -0.32, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;
  leftHand.add(createArticulatedHand(true));

  // Left Off-hand Equipment
  if (isArcher) {
    // Recurve Shortbow in Left Hand
    const bow = new THREE.Group();
    bow.position.set(0, 0, 0.06);

    const bowCurve = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.016, 6, 16, Math.PI), brownLeatherMat);
    bowCurve.rotation.y = Math.PI / 2;
    bow.add(bowCurve);

    // Sinew bowstring
    const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.76, 4), darkBeigeClothMat);
    bowString.position.set(0, 0, 0.38);
    bow.add(bowString);

    leftHand.add(bow);

    // Quiver on goblin's back
    const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.55, 8), brownLeatherMat);
    quiver.position.set(0, 0.08, -0.22);
    quiver.rotation.x = -0.35;
    quiver.rotation.z = 0.3;
    chest.add(quiver);

    for (let ar = 0; ar < 4; ar++) {
      const qArrow = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.65, 4), darkBeigeClothMat);
      qArrow.position.set((ar - 1.5) * 0.025, 0.28, -0.22);
      qArrow.rotation.x = -0.35;
      chest.add(qArrow);
    }
  } else if (isWarrior || isElite) {
    // Round Wood & Iron-Banded Buckler Shield strapped to Left Forearm
    const shield = new THREE.Group();
    shield.position.set(-0.08, -0.14, 0.04);
    shield.rotation.z = Math.PI / 2;
    shield.rotation.y = 0.2;

    const shieldWood = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.035, 12), brownLeatherMat);
    shield.add(shieldWood);

    const shieldRim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 6, 16), scrapIronMat);
    shield.add(shieldRim);

    const shieldBoss = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), scrapIronMat);
    shieldBoss.position.set(0, 0.03, 0);
    shield.add(shieldBoss);

    leftForearm.add(shield);
  } else if (isScout) {
    // Off-hand Parrying Dirk
    const offDagger = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.32, 0.014), darkIronBladeMat);
    offDagger.position.set(0, 0.12, 0.05);
    offDagger.rotation.x = -0.3;
    leftHand.add(offDagger);
  }

  // -----------------------------------------------------------
  // 6. BENT LEGS, KNEES, CALVES, CLAWED TOES (PROPERLY GROUNDED)
  // -----------------------------------------------------------
  [-0.14, 0.14].forEach((lx, li) => {
    const isLeft = li === 0;
    const thigh = new THREE.Group();
    thigh.name = isLeft ? 'LeftThigh' : 'RightThigh';
    thigh.position.set(lx, -0.06, 0);
    thigh.rotation.x = -0.2; // Predatory beastly bent stance
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.08, 0.062, 0.34, goblinSkinMat);
    thighMesh.position.set(0, -0.17, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.name = isLeft ? 'LeftCalf' : 'RightCalf';
    calf.position.set(0, -0.34, 0);
    calf.rotation.x = 0.45; // Knee bends backward to keep torso balanced
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const calfMesh = createLimbMesh(0.068, 0.052, 0.32, darkerSkinMat);
    calfMesh.position.set(0, -0.16, 0);
    calf.add(calfMesh);

    // Bone / Scrap Iron Knee Guard Poleyn
    const kneeCap = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.09, 5), scrapIronMat);
    kneeCap.position.set(0, 0.02, 0.08);
    kneeCap.rotation.x = 1.35;
    calf.add(kneeCap);

    // Dark Beige Cloth Wrap around Shins
    const shinWrap = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.056, 0.16, 8), darkBeigeClothMat);
    shinWrap.position.set(0, -0.16, 0);
    calf.add(shinWrap);

    // Ankle & Grounded Clawed Foot
    const foot = new THREE.Group();
    foot.name = isLeft ? 'LeftFoot' : 'RightFoot';
    foot.position.set(0, -0.32, 0.05);
    foot.rotation.x = -0.25; // Levels foot parallel with floor
    calf.add(foot);
    if (isLeft) nodes.LeftFoot = foot; else nodes.RightFoot = foot;

    const footSole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.22), darkerSkinMat);
    footSole.position.set(0, 0.02, 0.02);
    footSole.castShadow = true;
    footSole.receiveShadow = true;
    foot.add(footSole);

    // 3 Distinct Clawed Toes with Nails
    for (let toe = 0; toe < 3; toe++) {
      const toeX = (toe - 1) * 0.04;
      const toeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.07), darkerSkinMat);
      toeMesh.position.set(toeX, 0.015, 0.14);
      foot.add(toeMesh);

      const toeClaw = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 4), clawMat);
      toeClaw.position.set(toeX, 0.01, 0.18);
      toeClaw.rotation.x = 1.2;
      foot.add(toeClaw);
    }
  });

  // Scale according to personality
  const baseScale = isBrute ? 1.35 : isElite ? 1.22 : isScout ? 0.85 : isArcher ? 0.90 : 0.95;
  root.scale.setScalar(baseScale);

  return { root, nodes };
}

// Backwards compatibility & personality aliases
export const buildAshGoblinModel = (p, s) => buildGoblinModel(p, s);
export const buildGoblinWarriorModel = (s) => buildGoblinModel('warrior', s);
export const buildGoblinScoutModel = (s) => buildGoblinModel('scout', s);
export const buildGoblinBruteModel = (s) => buildGoblinModel('brute', s);
export const buildGoblinArcherModel = (s) => buildGoblinModel('archer', s);
export const buildGoblinEliteModel = (s) => buildGoblinModel('elite', s);
export const buildShadowGruntModel = (s) => buildShadowSoldierModel(s);
export const buildHostileShadowSoldierModel = (s) => buildShadowSoldierModel(s, true);

// -------------------------------------------------------------
// 2. SHADOW KNIGHT (Tall, heavy fluted dread steel plate, horned helm, greatsword)
// Color Palette: BLACK + GUNMETAL + BLUE
// - Armor: Deep black plate, gunmetal fluting, dark silver edge highlights
// - Cape: Dark navy / black
// - Eyes: Electric blue
// - Energy: Blue-violet
// - Weapon: Black steel with blue glowing runes
// -------------------------------------------------------------
export function buildShadowKnightModel(variantSeed = 0) {
  const root = new THREE.Group();
  root.name = 'ShadowKnight_Root';
  const nodes = {};

  const seed = typeof variantSeed === 'number' ? Math.abs(variantSeed) : 0;
  const eyeIntensity = 3.8 + (seed % 3) * 0.4;
  const runeIntensity = 2.8 + (seed % 2) * 0.5;

  // 1. Armor: Deep black plate (metalness = 0.94, roughness = 0.22)
  const dreadSteelMat = new THREE.MeshStandardMaterial({
    color: 0x0c0e14,
    metalness: 0.94,
    roughness: 0.22
  });

  // 2. Armor: Gunmetal fluting & plates (metalness = 0.92, roughness = 0.28)
  const gunmetalMat = new THREE.MeshStandardMaterial({
    color: 0x202430,
    metalness: 0.92,
    roughness: 0.28
  });

  // 3. Armor: Dark silver edge highlights (metalness = 0.90, roughness = 0.25)
  const darkSilverMat = new THREE.MeshStandardMaterial({
    color: 0x4a5166,
    metalness: 0.90,
    roughness: 0.25
  });

  // 4. Cape: Dark navy / black (metalness = 0.0, roughness = 0.88)
  const capeMat = new THREE.MeshStandardMaterial({
    color: 0x0a0d17,
    roughness: 0.88,
    metalness: 0.0,
    side: THREE.DoubleSide
  });

  // 5. Eyes: Electric blue
  const electricBlueEyeMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    emissive: 0x3b82f6,
    emissiveIntensity: eyeIntensity,
    roughness: 0.12,
    metalness: 0.0
  });

  // 6. Energy: Blue-violet
  const blueVioletEnergyMat = new THREE.MeshStandardMaterial({
    color: 0x6366f1,
    emissive: 0x4f46e5,
    emissiveIntensity: runeIntensity,
    roughness: 0.20,
    metalness: 0.2
  });

  // 7. Weapon: Black steel blade (metalness = 0.95, roughness = 0.18)
  const bladeSteelMat = new THREE.MeshStandardMaterial({
    color: 0x161822,
    metalness: 0.95,
    roughness: 0.18
  });

  // 8. Weapon: Blue glowing runes
  const blueGlowingRuneMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x2563eb,
    emissiveIntensity: runeIntensity + 0.6,
    roughness: 0.20,
    metalness: 0.2
  });

  nodes.Materials = {
    dreadSteelMat,
    gunmetalMat,
    darkSilverMat,
    capeMat,
    electricBlueEyeMat,
    eyeMat: electricBlueEyeMat,
    blueVioletEnergyMat,
    bladeSteelMat,
    blueGlowingRuneMat
  };


  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 1.1, 0);
  root.add(hips);
  nodes.Hips = hips;

  const faulds = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.34, 10), dreadSteelMat);
  faulds.castShadow = true;
  hips.add(faulds);

  // Spine & Heavy Torso
  const spine = new THREE.Group();
  spine.position.set(0, 0.16, 0);
  hips.add(spine);
  nodes.Spine = spine;

  const chest = new THREE.Group();
  chest.position.set(0, 0.32, 0);
  spine.add(chest);
  nodes.Chest = chest;

  // Segmented Fluted Cuirass
  const cuirass = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.54, 10), dreadSteelMat);
  cuirass.castShadow = true;
  chest.add(cuirass);

  // Central Gothic Breastplate Ridge (Dark silver edge highlight)
  const breastRidge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.44, 0.46), darkSilverMat);
  breastRidge.position.set(0, 0.02, 0.06);
  chest.add(breastRidge);

  // Glowing Blue-Violet Core Rune Heart
  const runeHeart = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), blueVioletEnergyMat);
  runeHeart.position.set(0, 0.08, 0.27);
  chest.add(runeHeart);

  // Three-Tiered Gothic Pauldrons
  [-0.44, 0.44].forEach((x, i) => {
    const isLeft = i === 0;
    const pauldronGroup = new THREE.Group();
    pauldronGroup.position.set(x, 0.22, 0);

    // Tier 1 - Main flared deep black plate
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.22, 8, 1, false, isLeft ? -0.4 : -Math.PI + 0.4, Math.PI * 0.9), dreadSteelMat);
    p1.rotation.z = isLeft ? 0.35 : -0.35;
    pauldronGroup.add(p1);

    // Tier 2 - Fluted gunmetal rim plate
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.1, 8), gunmetalMat);
    p2.position.set(0, -0.1, 0);
    p2.rotation.z = isLeft ? 0.35 : -0.35;
    pauldronGroup.add(p2);

    // Upward gothic spike crest (dark silver trim)
    const pSpike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.26, 5), darkSilverMat);
    pSpike.position.set(0, 0.2, 0);
    pSpike.rotation.z = isLeft ? 0.4 : -0.4;
    pauldronGroup.add(pSpike);

    chest.add(pauldronGroup);
  });

  // Tattered Battle Cape hanging from shoulders (Dark navy / black)
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 1.4, 4, 4), capeMat);
  cape.position.set(0, -0.4, -0.22);
  cape.rotation.x = -0.1;
  chest.add(cape);

  // Horned Dread Greathelm
  const head = new THREE.Group();
  head.position.set(0, 0.44, 0);
  chest.add(head);
  nodes.Head = head;

  const helm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.34, 10), dreadSteelMat);
  helm.castShadow = true;
  head.add(helm);

  // Helm Crest Ridge (Gunmetal)
  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.36), gunmetalMat);
  crest.position.set(0, 0.22, -0.02);
  head.add(crest);

  // Sweeping Twin Horns (Gunmetal)
  [-0.2, 0.2].forEach((hx, hi) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.42, 6), gunmetalMat);
    horn.position.set(hx, 0.2, 0.02);
    horn.rotation.z = hi === 0 ? 0.85 : -0.85;
    horn.rotation.x = -0.3;
    head.add(horn);
  });

  // Glowing Electric Blue Visor Slit
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.06), electricBlueEyeMat);
  visor.position.set(0, 0.04, 0.18);
  head.add(visor);

  // Right Arm (Greatsword Wielder)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.44, 0.18, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArm = createLimbMesh(0.085, 0.075, 0.42, dreadSteelMat);
  rArm.position.set(0, -0.21, 0);
  rightUpperArm.add(rArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.42, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearm = createLimbMesh(0.08, 0.07, 0.38, dreadSteelMat);
  rForearm.position.set(0, -0.19, 0);
  rightForearm.add(rForearm);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.38, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // 1.9m Dread Greatsword
  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.15);
  weaponSocket.rotation.x = 0.25;
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // Hilt & Crossguard (Gunmetal & Silver Trim)
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), gunmetalMat);
  grip.position.set(0, -0.2, 0);
  weaponSocket.add(grip);

  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.12), darkSilverMat);
  crossguard.position.set(0, 0.04, 0);
  weaponSocket.add(crossguard);

  // Double-edged Black Steel Blade
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.8, 0.04), bladeSteelMat);
  blade.position.set(0, 0.95, 0);
  blade.castShadow = true;
  weaponSocket.add(blade);

  // Blue Glowing Runes along fuller channel
  const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.45, 0.048), blueGlowingRuneMat);
  fuller.position.set(0, 0.9, 0);
  weaponSocket.add(fuller);

  // Left Arm (Plate Gauntlet)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.44, 0.18, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArm = createLimbMesh(0.085, 0.075, 0.42, dreadSteelMat);
  lArm.position.set(0, -0.21, 0);
  leftUpperArm.add(lArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.42, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearm = createLimbMesh(0.08, 0.07, 0.38, dreadSteelMat);
  lForearm.position.set(0, -0.19, 0);
  leftForearm.add(lForearm);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.38, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  // Plate Gauntlet Couters
  const lGlove = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), darkSilverMat);
  lGlove.position.set(0, -0.06, 0);
  leftHand.add(lGlove);

  // Legs with Articulated Sabatons
  [-0.18, 0.18].forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.1, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.11, 0.09, 0.52, dreadSteelMat);
    thighMesh.position.set(0, -0.26, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.position.set(0, -0.52, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const calfMesh = createLimbMesh(0.09, 0.08, 0.5, dreadSteelMat);
    calfMesh.position.set(0, -0.25, 0);
    calf.add(calfMesh);

    // Heavy Steel Sabaton (Foot)
    const sabaton = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.32), darkSilverMat);
    sabaton.position.set(0, -0.52, 0.08);
    calf.add(sabaton);
  });

  root.scale.setScalar(1.22);
  return { root, nodes };
}

// Backwards compatibility alias for Blood Knight
export const buildBloodKnightModel = buildShadowKnightModel;

// -------------------------------------------------------------
// 3. ABYSS ASSASSIN (Slim, hooded, dual blades, smoke around legs)
// Color Palette: CHARCOAL + NAVY + VIOLET
// - Skin: Pale gray / desaturated skin
// - Clothing: Dark charcoal cloth & deep navy leather with muted purple accents
// - Eyes: Violet
// - Weapons: Black metal daggers with violet edge glow
// - Shadow effect: Dark smoke and subtle violet particles
// -------------------------------------------------------------
export function buildAbyssAssassinModel(variantSeed = 0) {
  const root = new THREE.Group();
  root.name = 'AbyssAssassin_Root';
  const nodes = {};

  const seed = typeof variantSeed === 'number' ? Math.abs(variantSeed) : 0;
  const eyeIntensity = 3.6 + (seed % 3) * 0.4;
  const glowIntensity = 2.8 + (seed % 2) * 0.5;

  // 1. Skin: Pale gray / desaturated skin (metalness = 0, roughness = 0.72)
  const paleSkinMat = new THREE.MeshStandardMaterial({
    color: 0x6e7382,
    roughness: 0.72,
    metalness: 0.05
  });

  // 2. Clothing: Dark charcoal cloth & silk (metalness = 0.08, roughness = 0.85)
  const darkCharcoalMat = new THREE.MeshStandardMaterial({
    color: 0x121319,
    roughness: 0.85,
    metalness: 0.08,
    side: THREE.DoubleSide
  });

  // 3. Clothing: Deep navy stealth leather (metalness = 0.12, roughness = 0.78)
  const deepNavyMat = new THREE.MeshStandardMaterial({
    color: 0x111625,
    roughness: 0.78,
    metalness: 0.12
  });

  // 4. Clothing: Muted purple accents (sash, cowl trim, belt accents)
  const mutedPurpleMat = new THREE.MeshStandardMaterial({
    color: 0x3d2150,
    roughness: 0.76,
    metalness: 0.14
  });

  // 5. Eyes: Piercing violet
  const violetEyeMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0xa855f7,
    emissiveIntensity: eyeIntensity,
    roughness: 0.10,
    metalness: 0.0
  });

  // 6. Weapons: Black metal
  const blackMetalMat = new THREE.MeshStandardMaterial({
    color: 0x171922,
    metalness: 0.94,
    roughness: 0.20
  });

  // 7. Weapons: Violet edge glow
  const violetEdgeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xd946ef,
    emissive: 0xc084fc,
    emissiveIntensity: glowIntensity,
    roughness: 0.15,
    metalness: 0.2
  });

  // 8. Shadow effect: Dark smoke + subtle violet particles
  const darkSmokeMat = new THREE.MeshBasicMaterial({
    color: 0x110d1c,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide
  });

  const violetParticleMat = new THREE.MeshBasicMaterial({
    color: 0x7c3aed,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  });

  nodes.Materials = {
    paleSkinMat,
    darkCharcoalMat,
    deepNavyMat,
    mutedPurpleMat,
    violetEyeMat,
    eyeMat: violetEyeMat,
    blackMetalMat,
    violetEdgeGlowMat,
    darkSmokeMat,
    violetParticleMat
  };


  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 0.95, 0);
  root.add(hips);
  nodes.Hips = hips;

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.24, 8), deepNavyMat);
  hips.add(pelvis);

  // Muted Purple Waist Sash
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 8), mutedPurpleMat);
  sash.position.set(0, 0.04, 0);
  hips.add(sash);

  // Split Tattered Dark Charcoal Cloak Tails hanging around legs
  [-0.14, 0.14].forEach((tx) => {
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.65), darkCharcoalMat);
    tail.position.set(tx, -0.3, -0.1);
    tail.rotation.x = -0.15;
    hips.add(tail);
  });

  // Swirling Shadow Mist Disc around feet (Dark smoke + subtle violet mist)
  const smokeDisc = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.85, 16), darkSmokeMat);
  smokeDisc.rotation.x = -Math.PI / 2;
  smokeDisc.position.set(0, -0.92, 0);
  hips.add(smokeDisc);

  const violetMist = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.75, 12), violetParticleMat);
  violetMist.rotation.x = -Math.PI / 2;
  violetMist.position.set(0, -0.90, 0);
  hips.add(violetMist);

  // Agile Spine
  const spine = new THREE.Group();
  spine.position.set(0, 0.14, 0);
  spine.rotation.x = 0.18; // Sleek predatory stalking lean
  hips.add(spine);
  nodes.Spine = spine;

  // Chest / Torso (Deep Navy Leather Vest)
  const chest = new THREE.Group();
  chest.position.set(0, 0.24, 0.04);
  spine.add(chest);
  nodes.Chest = chest;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.44, 8), deepNavyMat);
  torso.castShadow = true;
  chest.add(torso);

  // Muted Purple Leather Harness Straps
  [-0.08, 0.08].forEach((hx) => {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.02), mutedPurpleMat);
    strap.position.set(hx, 0.02, 0.2);
    strap.rotation.z = hx < 0 ? -0.15 : 0.15;
    chest.add(strap);
  });

  // Shoulder Cowl / Mantle (Dark Charcoal with Purple Trim)
  const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.18, 10), darkCharcoalMat);
  mantle.position.set(0, 0.18, 0);
  chest.add(mantle);

  const mantleTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.365, 0.365, 0.03, 10), mutedPurpleMat);
  mantleTrim.position.set(0, 0.1, 0);
  chest.add(mantleTrim);

  // Deep Assassin Hood & Shadowed Head
  const head = new THREE.Group();
  head.position.set(0, 0.36, 0);
  chest.add(head);
  nodes.Head = head;

  // Pointed Cowl / Hood
  const cowl = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 8), darkCharcoalMat);
  cowl.position.set(0, 0.12, -0.04);
  cowl.rotation.x = -0.25;
  head.add(cowl);

  // Pale Gray Skin Throat & Chin under the hood
  const paleChin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.14, 4), paleSkinMat);
  paleChin.position.set(0, -0.04, 0.1);
  paleChin.rotation.x = 0.3;
  head.add(paleChin);

  // Deep Shadow Void inside hood
  const voidFace = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0x05040a }));
  voidFace.position.set(0, 0.04, 0.05);
  head.add(voidFace);

  // Piercing Radiant Violet Slit Eyes
  [-0.05, 0.05].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.05), violetEyeMat);
    eye.position.set(x, 0.05, 0.16);
    head.add(eye);
  });

  // Helper to build a serrated curved shadow dagger (Black metal + violet edge glow)
  const buildCurvedDagger = () => {
    const dGroup = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.2, 6), deepNavyMat);
    handle.position.set(0, -0.08, 0);
    dGroup.add(handle);

    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.06), mutedPurpleMat);
    guard.position.set(0, 0.02, 0);
    dGroup.add(guard);

    // Curved serrated black metal blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.65, 0.025), blackMetalMat);
    blade.position.set(0.03, 0.34, 0);
    blade.rotation.z = -0.12;
    blade.castShadow = true;
    dGroup.add(blade);

    // Violet Glowing Runic Edge
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.62, 0.03), violetEdgeGlowMat);
    edge.position.set(0.05, 0.34, 0);
    edge.rotation.z = -0.12;
    dGroup.add(edge);

    return dGroup;
  };

  // Right Arm (Primary Dagger)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.32, 0.16, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArm = createLimbMesh(0.065, 0.055, 0.36, darkCharcoalMat);
  rArm.position.set(0, -0.18, 0);
  rightUpperArm.add(rArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.36, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearm = createLimbMesh(0.06, 0.05, 0.34, deepNavyMat);
  rForearm.position.set(0, -0.17, 0);
  rightForearm.add(rForearm);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.34, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Pale gray skin hand
  const rHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.07), paleSkinMat);
  rHandMesh.position.set(0, -0.04, 0);
  rightHand.add(rHandMesh);

  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.08);
  weaponSocket.rotation.x = 0.3;
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;
  weaponSocket.add(buildCurvedDagger());

  // Left Arm (Offhand Dagger)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.32, 0.16, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArm = createLimbMesh(0.065, 0.055, 0.36, darkCharcoalMat);
  lArm.position.set(0, -0.18, 0);
  leftUpperArm.add(lArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.36, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearm = createLimbMesh(0.06, 0.05, 0.34, deepNavyMat);
  lForearm.position.set(0, -0.17, 0);
  leftForearm.add(lForearm);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.34, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  // Pale gray skin offhand
  const lHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.07), paleSkinMat);
  lHandMesh.position.set(0, -0.04, 0);
  leftHand.add(lHandMesh);

  const offhandSocket = new THREE.Group();
  offhandSocket.position.set(0, 0, 0.08);
  offhandSocket.rotation.x = -0.4; // Reverse grip look
  leftHand.add(offhandSocket);
  offhandSocket.add(buildCurvedDagger());

  // Slim Agile Legs
  [-0.14, 0.14].forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.08, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.08, 0.065, 0.48, deepNavyMat);
    thighMesh.position.set(0, -0.24, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.position.set(0, -0.48, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const calfMesh = createLimbMesh(0.065, 0.055, 0.46, deepNavyMat);
    calfMesh.position.set(0, -0.23, 0);
    calf.add(calfMesh);

    // Stealth Soft Boots (Dark Charcoal)
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.26), darkCharcoalMat);
    boot.position.set(0, -0.46, 0.06);
    calf.add(boot);
  });

  root.scale.setScalar(1.05);
  return { root, nodes };
}

// -------------------------------------------------------------
// 4. ABYSS BRUTE (Massive muscular torso, spiked boulder pauldrons, heavy war maul)
// Color Palette: CHARCOAL + DARK RED + BRONZE
// - Skin: Dark reddish-brown / charcoal
// - Armor: Dark iron and burnt bronze
// - Chest: Glowing orange-red cracks
// - Eyes: Orange/red
// - Weapon: Dark metal with red-orange energy
// Visually communicates POWER.
// -------------------------------------------------------------
export function buildAbyssBruteModel(variantSeed = 0) {
  const root = new THREE.Group();
  root.name = 'AbyssBrute_Root';
  const nodes = {};

  const seed = typeof variantSeed === 'number' ? Math.abs(variantSeed) : 0;
  const eyeIntensity = 4.0 + (seed % 3) * 0.4;
  const crackIntensity = 3.4 + (seed % 2) * 0.5;

  // 1. Skin: Dark reddish-brown / charcoal (metalness = 0, roughness = 0.74)
  const bruteSkinMat = new THREE.MeshStandardMaterial({
    color: 0x2e1c18,
    roughness: 0.74,
    metalness: 0.06
  });

  // 2. Armor: Dark iron (metalness = 0.90, roughness = 0.32)
  const darkIronArmorMat = new THREE.MeshStandardMaterial({
    color: 0x20222a,
    metalness: 0.90,
    roughness: 0.32
  });

  // 3. Armor: Burnt bronze (metalness = 0.85, roughness = 0.30)
  const burntBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x754528,
    metalness: 0.85,
    roughness: 0.30
  });

  // 4. Chest: Glowing orange-red cracks
  const magmaCrackMat = new THREE.MeshStandardMaterial({
    color: 0xff4500,
    emissive: 0xea580c,
    emissiveIntensity: crackIntensity,
    roughness: 0.20,
    metalness: 0.1
  });

  // 5. Eyes: Burning orange/red
  const orangeRedEyeMat = new THREE.MeshStandardMaterial({
    color: 0xff3b00,
    emissive: 0xea580c,
    emissiveIntensity: eyeIntensity,
    roughness: 0.10,
    metalness: 0.0
  });

  // 6. Weapon: Dark metal
  const darkMetalWeaponMat = new THREE.MeshStandardMaterial({
    color: 0x22242c,
    metalness: 0.95,
    roughness: 0.24
  });

  // 7. Weapon: Red-orange energy
  const redOrangeEnergyMat = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: crackIntensity + 0.4,
    roughness: 0.20,
    metalness: 0.2
  });

  nodes.Materials = {
    bruteSkinMat,
    darkIronArmorMat,
    burntBronzeMat,
    magmaCrackMat,
    orangeRedEyeMat,
    eyeMat: orangeRedEyeMat,
    darkMetalWeaponMat,
    redOrangeEnergyMat
  };


  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 1.3, 0);
  root.add(hips);
  nodes.Hips = hips;

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.44, 0.42, 10), darkIronArmorMat);
  hips.add(pelvis);

  // Heavy Armored War Belt with Burnt Bronze Buckle
  const warBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.16, 10), darkIronArmorMat);
  warBelt.position.set(0, 0.12, 0);
  hips.add(warBelt);

  const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.06), burntBronzeMat);
  beltBuckle.position.set(0, 0.12, 0.53);
  hips.add(beltBuckle);

  // Massive Muscular Torso & Spine
  const spine = new THREE.Group();
  spine.position.set(0, 0.22, 0);
  spine.rotation.x = 0.12; // Forward dominant posture
  hips.add(spine);
  nodes.Spine = spine;

  const chest = new THREE.Group();
  chest.position.set(0, 0.45, 0.04);
  spine.add(chest);
  nodes.Chest = chest;

  // Hyper-broad Muscular Torso (Dark reddish-brown / charcoal)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.48, 0.72, 10), bruteSkinMat);
  torso.castShadow = true;
  chest.add(torso);

  // Glowing Orange-Red Fissures across Pectorals
  [-0.22, 0.22].forEach((px) => {
    const fissure = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.05), magmaCrackMat);
    fissure.position.set(px, 0.15, 0.33);
    fissure.rotation.z = px < 0 ? 0.35 : -0.35;
    chest.add(fissure);
  });

  // Additional Abdominal Fissure
  const abFissure = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.05), magmaCrackMat);
  abFissure.position.set(0, -0.1, 0.32);
  chest.add(abFissure);

  // Spiked Boulder Pauldrons (Dark Iron with Burnt Bronze Trim)
  [-0.78, 0.78].forEach((x, i) => {
    const isLeft = i === 0;
    const bPauldron = new THREE.Group();
    bPauldron.position.set(x, 0.35, 0);

    // Boulder base (Dark Iron)
    const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38), darkIronArmorMat);
    bPauldron.add(boulder);

    // Burnt bronze rim collar
    const bronzeRim = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.12, 8), burntBronzeMat);
    bronzeRim.position.set(0, -0.12, 0);
    bPauldron.add(bronzeRim);

    // Three staggered iron spikes protruding outward
    [-0.15, 0, 0.15].forEach((spX, spi) => {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35 + (spi === 1 ? 0.1 : 0), 5), darkIronArmorMat);
      spike.position.set(spX, 0.3, 0);
      spike.rotation.z = isLeft ? 0.4 - spi * 0.15 : -0.4 + spi * 0.15;
      bPauldron.add(spike);
    });

    chest.add(bPauldron);
  });

  // Head (Sunken Horned Beast Head)
  const head = new THREE.Group();
  head.position.set(0, 0.48, 0.08);
  chest.add(head);
  nodes.Head = head;

  const skull = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.38, 8), bruteSkinMat);
  skull.castShadow = true;
  head.add(skull);

  // Heavy Brow Ridge (Dark Iron) & Burning Orange/Red Eyes
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.2), darkIronArmorMat);
  brow.position.set(0, 0.12, 0.16);
  head.add(brow);

  [-0.09, 0.09].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), orangeRedEyeMat);
    eye.position.set(x, 0.06, 0.22);
    head.add(eye);
  });

  // Right Arm (Giant Heavy Maul Arm)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.72, 0.25, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArm = createLimbMesh(0.18, 0.15, 0.58, bruteSkinMat);
  rArm.position.set(0, -0.29, 0);
  rightUpperArm.add(rArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.58, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearm = createLimbMesh(0.16, 0.14, 0.52, darkIronArmorMat);
  rForearm.position.set(0, -0.26, 0);
  rightForearm.add(rForearm);

  // Burnt Bronze Gauntlet Couter on Forearm
  const rCouter = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.16, 8), burntBronzeMat);
  rCouter.position.set(0, -0.26, 0);
  rightForearm.add(rCouter);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.52, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // 2.2m Heavy War Maul (Dark metal with red-orange energy)
  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.18);
  weaponSocket.rotation.x = 0.2;
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // Handle (Dark Iron with Burnt Bronze Collar)
  const maulShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 1.8, 8), darkIronArmorMat);
  maulShaft.position.set(0, 0.3, 0);
  weaponSocket.add(maulShaft);

  const bronzeCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.14, 8), burntBronzeMat);
  bronzeCollar.position.set(0, 0.88, 0);
  weaponSocket.add(bronzeCollar);

  // Massive Dark Metal Hammerhead
  const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.6), darkMetalWeaponMat);
  hammerHead.position.set(0, 1.15, 0);
  hammerHead.castShadow = true;
  weaponSocket.add(hammerHead);

  // Front & Back Crushing Spikes (Dark Metal)
  [-0.34, 0.34].forEach((sz) => {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 6), darkMetalWeaponMat);
    spike.position.set(0, 1.15, sz);
    spike.rotation.x = sz > 0 ? Math.PI / 2 : -Math.PI / 2;
    weaponSocket.add(spike);
  });

  // Top Piercing Point (Glowing Red-Orange Energy)
  const topSpike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 6), redOrangeEnergyMat);
  topSpike.position.set(0, 1.48, 0);
  weaponSocket.add(topSpike);

  // Left Arm (Massive Spiked Fist)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.72, 0.25, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArm = createLimbMesh(0.18, 0.15, 0.58, bruteSkinMat);
  lArm.position.set(0, -0.29, 0);
  leftUpperArm.add(lArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.58, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearm = createLimbMesh(0.16, 0.14, 0.52, darkIronArmorMat);
  lForearm.position.set(0, -0.26, 0);
  leftForearm.add(lForearm);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.52, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  // Spiked Knuckles with Burnt Bronze Band
  const lFist = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), darkIronArmorMat);
  lFist.position.set(0, -0.1, 0);
  leftHand.add(lFist);

  const bronzeKnuckleBand = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.26), burntBronzeMat);
  bronzeKnuckleBand.position.set(0, -0.1, 0);
  leftHand.add(bronzeKnuckleBand);

  // Colossal Sturdy Legs
  [-0.28, 0.28].forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.12, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.2, 0.17, 0.65, bruteSkinMat);
    thighMesh.position.set(0, -0.32, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.position.set(0, -0.65, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const calfMesh = createLimbMesh(0.18, 0.16, 0.62, darkIronArmorMat);
    calfMesh.position.set(0, -0.31, 0);
    calf.add(calfMesh);

    // Burnt Bronze Knee Poleyn
    const kneePoleyn = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.18, 5), burntBronzeMat);
    kneePoleyn.position.set(0, 0, 0.14);
    kneePoleyn.rotation.x = 1.35;
    calf.add(kneePoleyn);

    // Crushing Dark Metal Sabaton
    const sabaton = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.44), darkMetalWeaponMat);
    sabaton.position.set(0, -0.65, 0.1);
    calf.add(sabaton);
  });

  root.scale.setScalar(1.45);
  return { root, nodes };
}

// Backwards compatibility alias for Grave Warlord
export const buildGraveWarlordModel = (s) => buildAbyssBruteModel(s);

// -------------------------------------------------------------
// 5. ABYSS WARDEN — COLOSSAL DARK FANTASY SOVEREIGN TITAN (~5.4m, 3x Player)
// Color Palette: OBSIDIAN + GUNMETAL + VIOLET + CYAN
// - Body: Extremely dark charcoal with subtle blue-gray shadow tones
// - Armor: Obsidian black, dark gunmetal, silver edge highlights
// - Cloak: Black with dark blue undertones
// - Eyes: Intense violet/cyan
// - Armor cracks: Glowing violet
// - Weapon: Obsidian metal with violet energy along blade
// - Shadow aura: Black smoke, violet particles, small cyan highlights
// -------------------------------------------------------------
export function buildAbyssWardenModel() {
  const root = new THREE.Group();
  root.name = 'AbyssWarden_Boss_Root';
  const nodes = {};

  // -----------------------------------------------------------
  // PBR MATERIALS: OBSIDIAN + GUNMETAL + VIOLET + CYAN (NOT entirely purple!)
  // -----------------------------------------------------------
  // 1. Armor: Obsidian black (metalness = 0.94, roughness = 0.20)
  const obsidianPlateMat = new THREE.MeshStandardMaterial({
    color: 0x090a10,
    metalness: 0.94,
    roughness: 0.20
  });

  // 2. Armor: Dark gunmetal (metalness = 0.90, roughness = 0.28)
  const gunmetalPlateMat = new THREE.MeshStandardMaterial({
    color: 0x1d222f,
    metalness: 0.90,
    roughness: 0.28
  });
  const wroughtSteelMat = gunmetalPlateMat;

  // 3. Armor: Dark silver edge highlights (metalness = 0.92, roughness = 0.22)
  const silverEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x64708a,
    metalness: 0.92,
    roughness: 0.22
  });
  const antiqueGoldMat = silverEdgeMat;

  // 4. Body: Extremely dark charcoal with subtle blue-gray tones (metalness = 0.12, roughness = 0.72)
  const darkCharcoalBodyMat = new THREE.MeshStandardMaterial({
    color: 0x101218,
    roughness: 0.72,
    metalness: 0.12
  });
  const darkLeatherMat = darkCharcoalBodyMat;

  // 5. Cloak: Black with dark blue undertones (roughness = 0.90, metalness = 0.08)
  const tatteredCloakMat = new THREE.MeshStandardMaterial({
    color: 0x060812,
    roughness: 0.90,
    metalness: 0.08,
    side: THREE.DoubleSide
  });

  // 6. Eyes: Intense violet/cyan (glowing cyan inner core + radiant violet halo)
  const sovereignEyeMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 4.5,
    roughness: 0.10,
    metalness: 0.0
  });

  const abyssCoreGlow = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 3.2,
    roughness: 0.20,
    metalness: 0.2
  });

  // 7. Armor cracks: Glowing violet
  const veinCrackMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 3.2,
    roughness: 0.25,
    metalness: 0.2
  });

  // 8. Weapon: Black/obsidian metal with violet energy along blade
  const bladeSteelMat = new THREE.MeshStandardMaterial({
    color: 0x10121a,
    metalness: 0.96,
    roughness: 0.14
  });

  const runeFullerMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0x9333ea,
    emissiveIntensity: 3.2,
    roughness: 0.20,
    metalness: 0.3
  });

  // 9. Shadow aura materials (black smoke disc + violet particle ring + cyan sparks)
  const smokeDiscMat = new THREE.MeshBasicMaterial({
    color: 0x05060a,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide
  });
  const violetRingMat = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide
  });
  const cyanSparkMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  nodes.Materials = {
    obsidianPlateMat,
    gunmetalPlateMat,
    silverEdgeMat,
    darkCharcoalBodyMat,
    tatteredCloakMat,
    abyssCoreGlow,
    sovereignEyeMat,
    eyeMat: sovereignEyeMat,
    runeFullerMat,
    bladeSteelMat,
    veinCrackMat,
    shadowSmokeMat: smokeDiscMat,
    smokeDiscMat,
    violetParticleMat: violetRingMat,
    violetRingMat,
    cyanSparkMat
  };


  // -----------------------------------------------------------
  // 1. HIPS & PELVIS (~1.85m level)
  // -----------------------------------------------------------
  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.set(0, 1.88, 0);
  root.add(hips);
  nodes.Hips = hips;

  // Armored Dread Pelvis & Faulds
  const pelvisCore = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.46, 0.44, 10), obsidianPlateMat);
  pelvisCore.castShadow = true;
  hips.add(pelvisCore);

  // Heavy Armored War Belt with Gold Rim
  const warBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.53, 0.16, 12), wroughtSteelMat);
  warBelt.position.set(0, 0.14, 0);
  warBelt.castShadow = true;
  hips.add(warBelt);

  const beltTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.04, 12), antiqueGoldMat);
  beltTrim.position.set(0, 0.14, 0);
  hips.add(beltTrim);

  // Demon Sovereign Crest Buckle
  const demonBuckle = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), antiqueGoldMat);
  demonBuckle.position.set(0, 0.14, 0.54);
  hips.add(demonBuckle);

  const buckleGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), abyssCoreGlow);
  buckleGem.position.set(0, 0.14, 0.58);
  hips.add(buckleGem);

  // Segmented Faulds / Tassets hanging over hips and thighs
  const tassetGeo = new THREE.BoxGeometry(0.32, 0.52, 0.05);
  // Left Front Tasset
  const tassetLF = new THREE.Mesh(tassetGeo, obsidianPlateMat);
  tassetLF.position.set(-0.28, -0.16, 0.46);
  tassetLF.rotation.set(0.18, 0, 0.15);
  // Right Front Tasset
  const tassetRF = new THREE.Mesh(tassetGeo, obsidianPlateMat);
  tassetRF.position.set(0.28, -0.16, 0.46);
  tassetRF.rotation.set(0.18, 0, -0.15);
  // Left Flank Tasset
  const tassetLS = new THREE.Mesh(tassetGeo, obsidianPlateMat);
  tassetLS.position.set(-0.52, -0.16, 0);
  tassetLS.rotation.set(0, 0, 0.22);
  // Right Flank Tasset
  const tassetRS = new THREE.Mesh(tassetGeo, obsidianPlateMat);
  tassetRS.position.set(0.52, -0.16, 0);
  tassetRS.rotation.set(0, 0, -0.22);
  hips.add(tassetLF, tassetRF, tassetLS, tassetRS);

  // -----------------------------------------------------------
  // 2. LONG TATTERED CLOAK (4 Animated Cloth Panels)
  // -----------------------------------------------------------
  const cloakPanels = [];
  const cloakConfigs = [
    { x: -0.42, w: 0.38, l: 2.2, rotZ: 0.08 },
    { x: -0.14, w: 0.34, l: 2.35, rotZ: 0.02 },
    { x: 0.14, w: 0.34, l: 2.35, rotZ: -0.02 },
    { x: 0.42, w: 0.38, l: 2.2, rotZ: -0.08 }
  ];

  cloakConfigs.forEach((cfg, idx) => {
    const panelGroup = new THREE.Group();
    panelGroup.position.set(cfg.x, 0.1, -0.44);

    // Ragged jagged tapered cloth mesh
    const pMesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w, cfg.l, 3, 5), tatteredCloakMat);
    pMesh.position.set(0, -cfg.l / 2, 0);
    pMesh.rotation.set(-0.12, 0, cfg.rotZ);
    pMesh.castShadow = true;
    panelGroup.add(pMesh);

    hips.add(panelGroup);
    cloakPanels.push(panelGroup);
  });
  nodes.CloakPanels = cloakPanels;

  // -----------------------------------------------------------
  // 3. SPINE & HEAVILY LAYERED GOTHIC TORSO
  // -----------------------------------------------------------
  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.set(0, 0.32, 0);
  hips.add(spine);
  nodes.Spine = spine;

  // Segmented Abdominal Articulation Plates
  for (let i = 0; i < 3; i++) {
    const abPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5 + i * 0.04, 0.46 + i * 0.04, 0.14, 10, 1, false, -Math.PI * 0.45, Math.PI * 0.9),
      obsidianPlateMat
    );
    abPlate.position.set(0, i * 0.12, 0.02);
    spine.add(abPlate);

    // Central abdominal vein crack
    const abVein = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.03), veinCrackMat);
    abVein.position.set(0, i * 0.12, 0.48 + i * 0.03);
    spine.add(abVein);
  }

  // Chest Group (Upper Torso & Shoulders)
  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.set(0, 0.46, 0.04);
  spine.add(chest);
  nodes.Chest = chest;

  // Muscular Torso Base Carapace
  const torsoBase = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.58, 0.82, 12), darkLeatherMat);
  torsoBase.castShadow = true;
  chest.add(torsoBase);

  // Heavy Layered Gothic Cuirass / Breastplate
  const breastplate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 0.62, 0.74, 12, 1, false, -Math.PI * 0.46, Math.PI * 0.92),
    obsidianPlateMat
  );
  breastplate.position.set(0, 0.06, 0.03);
  breastplate.castShadow = true;
  chest.add(breastplate);

  // Left & Right Pectoral Armor Flanges (Layered Depth)
  [-0.32, 0.32].forEach((px, pi) => {
    const pecPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.14), wroughtSteelMat);
    pecPlate.position.set(px, 0.18, 0.46);
    pecPlate.rotation.set(-0.15, pi === 0 ? 0.2 : -0.2, pi === 0 ? 0.1 : -0.1);
    pecPlate.castShadow = true;
    chest.add(pecPlate);
  });

  // High Stand-up Gorget Neck Collar Guard
  const gorgetCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.52, 0.28, 10, 1, false, -Math.PI * 0.45, Math.PI * 0.9),
    wroughtSteelMat
  );
  gorgetCollar.position.set(0, 0.44, 0.04);
  chest.add(gorgetCollar);

  // Central Abyssal Heart Core Fissure
  const heartFissure = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), abyssCoreGlow);
  heartFissure.position.set(0, 0.16, 0.56);
  heartFissure.rotation.z = Math.PI / 4;
  chest.add(heartFissure);
  nodes.HeartCore = heartFissure;

  // Outer Fissure Framing Bezel (Antique Gold)
  const coreBezel = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.3, 8), antiqueGoldMat);
  coreBezel.position.set(0, 0.16, 0.57);
  chest.add(coreBezel);

  // Branching Emissive Vein Cracks across chest
  const veinCracks = [];
  const veinData = [
    { pos: [-0.34, 0.32, 0.48], rot: [0, 0, 0.48], size: [0.38, 0.035, 0.04] },
    { pos: [0.34, 0.32, 0.48], rot: [0, 0, -0.48], size: [0.38, 0.035, 0.04] },
    { pos: [-0.26, 0.02, 0.5], rot: [0, 0, -0.35], size: [0.28, 0.03, 0.04] },
    { pos: [0.26, 0.02, 0.5], rot: [0, 0, 0.35], size: [0.28, 0.03, 0.04] },
    { pos: [0, -0.14, 0.52], rot: [0, 0, 0], size: [0.04, 0.24, 0.04] }
  ];
  veinData.forEach((vd) => {
    const vMesh = new THREE.Mesh(new THREE.BoxGeometry(...vd.size), veinCrackMat);
    vMesh.position.set(...vd.pos);
    vMesh.rotation.set(...vd.rot);
    chest.add(vMesh);
    veinCracks.push(vMesh);
  });
  nodes.ChestVeins = veinCracks;

  // Back Carapace Dorsal Ridge with Spines
  for (let s = 0; s < 4; s++) {
    const dorsalSpine = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.36, 5), obsidianPlateMat);
    dorsalSpine.position.set(0, 0.24 - s * 0.16, -0.48);
    dorsalSpine.rotation.x = -1.15;
    chest.add(dorsalSpine);
  }

  // -----------------------------------------------------------
  // 4. ASYMMETRIC FOUR-TIERED PAULDRONS (Shoulders ~2.8m across)
  // -----------------------------------------------------------
  // LEFT PAULDRON: Sovereign Flared Demon-Horned Pauldron
  const leftPauldron = new THREE.Group();
  leftPauldron.position.set(-1.08, 0.48, 0);

  // Tier 1 - Grand outer curved carapace
  const lp1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.58, 0.42, 8, 1, false, -0.4, Math.PI * 0.9),
    obsidianPlateMat
  );
  lp1.rotation.z = 0.38;
  lp1.castShadow = true;
  leftPauldron.add(lp1);

  // Tier 2 - Antique Gold Filigree Rim
  const lp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.12, 8), antiqueGoldMat);
  lp2.position.set(0, -0.16, 0);
  lp2.rotation.z = 0.38;
  leftPauldron.add(lp2);

  // Tier 3 - Under-plate with pulsing runes
  const lp3 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.52), runeFullerMat);
  lp3.position.set(0.12, 0, 0);
  leftPauldron.add(lp3);

  // Tier 4 - Massive Sweeping Sovereign Horn
  const lHorn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.95, 6), obsidianPlateMat);
  lHorn.position.set(-0.06, 0.52, 0.02);
  lHorn.rotation.set(-0.25, 0, 0.65);
  lHorn.castShadow = true;
  leftPauldron.add(lHorn);

  chest.add(leftPauldron);

  // RIGHT PAULDRON: Reinforced Heavy Assault Spiked Pauldron
  const rightPauldron = new THREE.Group();
  rightPauldron.position.set(1.08, 0.48, 0);

  // Tier 1 - Stepped heavy assault plate
  const rp1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.56, 0.44, 8, 1, false, -Math.PI + 0.4, Math.PI * 0.9),
    obsidianPlateMat
  );
  rp1.rotation.z = -0.38;
  rp1.castShadow = true;
  rightPauldron.add(rp1);

  // Tier 2 - Gold Deflection Trim
  const rp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 0.12, 8), antiqueGoldMat);
  rp2.position.set(0, -0.16, 0);
  rp2.rotation.z = -0.38;
  rightPauldron.add(rp2);

  // Tier 3 - Spiked Demon Skull Boss Crest
  const rpBoss = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 5), antiqueGoldMat);
  rpBoss.position.set(0.38, 0.12, 0);
  rpBoss.rotation.z = -1.45;
  rightPauldron.add(rpBoss);

  // Tier 4 - Vertical Sword-Breaker Fin
  const rpFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.56, 0.32), wroughtSteelMat);
  rpFin.position.set(0.08, 0.38, 0);
  rpFin.rotation.z = -0.22;
  rightPauldron.add(rpFin);

  chest.add(rightPauldron);

  // -----------------------------------------------------------
  // 5. NECK, HEAD & INTIMIDATING DEMONIC CROWN-FACE (Head ~1/8 of body)
  // -----------------------------------------------------------
  const neck = new THREE.Group();
  neck.name = 'Neck';
  neck.position.set(0, 0.52, 0.08);
  chest.add(neck);
  nodes.Neck = neck;

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.32, 10), darkLeatherMat);
  neckMesh.position.set(0, 0.1, 0);
  neck.add(neckMesh);

  // Head Root
  const head = new THREE.Group();
  head.name = 'Head';
  head.position.set(0, 0.26, 0.04);
  neck.add(head);
  nodes.Head = head;

  // Sculpted Angular Skull Helm (NOT a sphere/cylinder!)
  // Upper Cranium Dome
  const craniumDome = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.42, 8), obsidianPlateMat);
  craniumDome.position.set(0, 0.2, -0.04);
  craniumDome.castShadow = true;
  head.add(craniumDome);

  // Chiseled Mandible & Sharp Angular Jaw
  const jawAngle = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.38), obsidianPlateMat);
  jawAngle.position.set(0, -0.02, 0.06);
  jawAngle.rotation.x = 0.22;
  jawAngle.castShadow = true;
  head.add(jawAngle);

  // Pointed Demonic Chin
  const sharpChin = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 4), obsidianPlateMat);
  sharpChin.position.set(0, -0.22, 0.16);
  sharpChin.rotation.x = 0.45;
  head.add(sharpChin);

  // High Cheekbone Armor Plates
  [-0.18, 0.18].forEach((cx, ci) => {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.22), wroughtSteelMat);
    cheek.position.set(cx, 0.06, 0.18);
    cheek.rotation.y = ci === 0 ? 0.3 : -0.3;
    head.add(cheek);
  });

  // Intimidating Furrowed Demonic Brow Ridge
  const browRidge = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.18), wroughtSteelMat);
  browRidge.position.set(0, 0.18, 0.22);
  browRidge.rotation.x = -0.15;
  head.add(browRidge);

  // Deep Shadow Eye Sockets & Piercing Radiant Violet/Cyan Eyes
  const eyes = [];
  [-0.12, 0.12].forEach((ex, ei) => {
    // Deep dark socket recess
    const socket = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.08), darkLeatherMat);
    socket.position.set(ex, 0.12, 0.21);
    head.add(socket);

    // Glowing Inner Slit Core
    const eyeCore = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.03, 0.04), sovereignEyeMat);
    eyeCore.position.set(ex, 0.12, 0.245);
    eyeCore.rotation.z = ei === 0 ? -0.18 : 0.18;
    head.add(eyeCore);
    eyes.push(eyeCore);

    // Outer Glow Iris Halo
    const halo = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), abyssCoreGlow);
    halo.position.set(ex, 0.12, 0.25);
    head.add(halo);
  });
  nodes.Eyes = eyes;

  // Demonic Grimace / Slotted Faceplate
  for (let v = 0; v < 4; v++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.03), darkLeatherMat);
    vent.position.set(0, -0.06 - v * 0.035, 0.26);
    head.add(vent);
  }

  // ARCHDAEMON SOVEREIGN CROWN (4 Sweeping Obsidian Horns + Antique Gold Peak)
  // Large Outer Sweeping Horns (curving back and upward)
  [-0.32, 0.32].forEach((hx, hi) => {
    const outerHorn = new THREE.Mesh(new THREE.ConeGeometry(0.11, 1.1, 6), obsidianPlateMat);
    outerHorn.position.set(hx, 0.44, -0.08);
    outerHorn.rotation.set(-0.45, 0, hi === 0 ? 0.9 : -0.9);
    outerHorn.castShadow = true;
    head.add(outerHorn);
  });

  // Inner Horns (rising menacingly)
  [-0.16, 0.16].forEach((hx, hi) => {
    const innerHorn = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.78, 6), obsidianPlateMat);
    innerHorn.position.set(hx, 0.48, 0.04);
    innerHorn.rotation.set(-0.25, 0, hi === 0 ? 0.45 : -0.45);
    innerHorn.castShadow = true;
    head.add(innerHorn);
  });

  // Central Antique Gold Sovereign Diadem Crest
  const centerCrown = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.55, 6), antiqueGoldMat);
  centerCrown.position.set(0, 0.52, 0.14);
  centerCrown.rotation.x = -0.15;
  head.add(centerCrown);

  // -----------------------------------------------------------
  // 6. RIGHT ARM & MASSIVE 2.6m ECLIPSE SOVEREIGN CLEAVER
  // -----------------------------------------------------------
  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'RightUpperArm';
  rightUpperArm.position.set(1.02, 0.38, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  // Bicep encased in gambeson with rerebrace
  const rBicep = createLimbMesh(0.19, 0.17, 0.86, darkLeatherMat);
  rBicep.position.set(0, -0.43, 0);
  rightUpperArm.add(rBicep);

  const rRerebrace = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.52, 8), obsidianPlateMat);
  rRerebrace.position.set(0, -0.38, 0);
  rRerebrace.castShadow = true;
  rightUpperArm.add(rRerebrace);

  // Elbow Couter
  const rCouter = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 5), wroughtSteelMat);
  rCouter.position.set(0, -0.86, -0.16);
  rCouter.rotation.x = -1.57;
  rightUpperArm.add(rCouter);

  // Forearm & Fluted Vambrace
  const rightForearm = new THREE.Group();
  rightForearm.name = 'RightForearm';
  rightForearm.position.set(0, -0.86, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rVambrace = createLimbMesh(0.18, 0.15, 0.8, obsidianPlateMat);
  rVambrace.position.set(0, -0.4, 0);
  rVambrace.castShadow = true;
  rightForearm.add(rVambrace);

  // Forearm Gold Inlay Band
  const rArmTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.08, 8), antiqueGoldMat);
  rArmTrim.position.set(0, -0.22, 0);
  rightForearm.add(rArmTrim);

  // Defined Articulated Right Gauntlet Hand
  const rightHand = new THREE.Group();
  rightHand.name = 'RightHand';
  rightHand.position.set(0, -0.8, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Gauntlet Palm & Wrist Plate
  const rPalm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.22), obsidianPlateMat);
  rPalm.position.set(0, -0.12, 0);
  rightHand.add(rPalm);

  // Articulated Knuckle Dusters
  const rKnuckles = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.08), antiqueGoldMat);
  rKnuckles.position.set(0, -0.22, 0.1);
  rightHand.add(rKnuckles);

  // Individual Fingers Curved around Hilt
  for (let f = 0; f < 4; f++) {
    const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.02, 0.14, 6), obsidianPlateMat);
    finger.position.set(-0.09 + f * 0.06, -0.26, 0.08);
    finger.rotation.x = -0.8;
    rightHand.add(finger);
  }
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 0.12, 6), obsidianPlateMat);
  thumb.position.set(-0.14, -0.14, 0.08);
  thumb.rotation.z = -0.6;
  rightHand.add(thumb);

  // -----------------------------------------------------------
  // WEAPON: 2.6m ECLIPSE SOVEREIGN CLEAVER (1.4x Player Height)
  // -----------------------------------------------------------
  const weaponSocket = new THREE.Group();
  weaponSocket.name = 'WeaponSocket';
  weaponSocket.position.set(0, -0.18, 0.18);
  weaponSocket.rotation.x = 0.18;
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // Heavy Spiked Pommel
  const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), antiqueGoldMat);
  pommel.position.set(0, -0.72, 0);
  weaponSocket.add(pommel);

  // Leather Wrapped Two-Handed Hilt
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.88, 8), darkLeatherMat);
  hilt.position.set(0, -0.28, 0);
  weaponSocket.add(hilt);

  // Demon-Wing Intimidating Crossguard
  const guard = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.18, 0.24), obsidianPlateMat);
  guard.position.set(0, 0.16, 0);
  weaponSocket.add(guard);

  // Crossguard Soul Gem Core
  const guardGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), abyssCoreGlow);
  guardGem.position.set(0, 0.16, 0.14);
  weaponSocket.add(guardGem);

  // Massive Jagged Obsidian Steel Blade (~2.2m long)
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.2, 0.08), bladeSteelMat);
  blade.position.set(0, 1.32, 0);
  blade.castShadow = true;
  weaponSocket.add(blade);

  // Serrated Blade Edge Teeth (Sovereign Silhouette)
  for (let b = 0; b < 5; b++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), bladeSteelMat);
    tooth.position.set(0.18, 0.6 + b * 0.32, 0);
    tooth.rotation.z = -1.2;
    weaponSocket.add(tooth);
  }

  // Glowing Abyssal Fuller Channel with Void Energy
  const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.95, 0.095), runeFullerMat);
  fuller.position.set(0, 1.28, 0);
  weaponSocket.add(fuller);
  nodes.BladeFuller = fuller;

  // -----------------------------------------------------------
  // 7. LEFT ARM & HEAVY DREAD GAUNTLET
  // -----------------------------------------------------------
  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'LeftUpperArm';
  leftUpperArm.position.set(-1.02, 0.38, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lBicep = createLimbMesh(0.19, 0.17, 0.86, darkLeatherMat);
  lBicep.position.set(0, -0.43, 0);
  leftUpperArm.add(lBicep);

  const lRerebrace = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.19, 0.52, 8), obsidianPlateMat);
  lRerebrace.position.set(0, -0.38, 0);
  lRerebrace.castShadow = true;
  leftUpperArm.add(lRerebrace);

  const lCouter = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 5), wroughtSteelMat);
  lCouter.position.set(0, -0.86, -0.16);
  lCouter.rotation.x = -1.57;
  leftUpperArm.add(lCouter);

  const leftForearm = new THREE.Group();
  leftForearm.name = 'LeftForearm';
  leftForearm.position.set(0, -0.86, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lVambrace = createLimbMesh(0.18, 0.15, 0.8, obsidianPlateMat);
  lVambrace.position.set(0, -0.4, 0);
  lVambrace.castShadow = true;
  leftForearm.add(lVambrace);

  const leftHand = new THREE.Group();
  leftHand.name = 'LeftHand';
  leftHand.position.set(0, -0.8, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  const lPalm = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.22), obsidianPlateMat);
  lPalm.position.set(0, -0.12, 0);
  leftHand.add(lPalm);

  const lKnuckles = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.08), antiqueGoldMat);
  lKnuckles.position.set(0, -0.22, 0.1);
  leftHand.add(lKnuckles);

  // Left Clawed Gauntlet Fingers
  for (let f = 0; f < 4; f++) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.16, 5), wroughtSteelMat);
    claw.position.set(-0.09 + f * 0.06, -0.3, 0.05);
    claw.rotation.x = -0.5;
    leftHand.add(claw);
  }

  // -----------------------------------------------------------
  // 8. LONG POWERFUL ARMORED LEGS & COLOSSAL DREAD BOOTS
  // -----------------------------------------------------------
  [-0.42, 0.42].forEach((lx, li) => {
    const isLeft = li === 0;
    const thigh = new THREE.Group();
    thigh.name = isLeft ? 'LeftThigh' : 'RightThigh';
    thigh.position.set(lx, -0.18, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    // Muscular Thigh in Gambeson
    const thighMesh = createLimbMesh(0.25, 0.2, 1.05, darkLeatherMat);
    thighMesh.position.set(0, -0.52, 0);
    thigh.add(thighMesh);

    // Layered Cuisses Plates
    const cuisse = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.22, 0.65, 8, 1, false, -Math.PI * 0.45, Math.PI * 0.9),
      obsidianPlateMat
    );
    cuisse.position.set(0, -0.42, 0.02);
    cuisse.castShadow = true;
    thigh.add(cuisse);

    // Knee Joint & Spiked Gothic Poleyn
    const calf = new THREE.Group();
    calf.name = isLeft ? 'LeftCalf' : 'RightCalf';
    calf.position.set(0, -1.05, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const poleyn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 5), antiqueGoldMat);
    poleyn.position.set(0, 0, 0.22);
    poleyn.rotation.x = 1.35;
    calf.add(poleyn);

    // Fluted Steel Greave
    const calfMesh = createLimbMesh(0.22, 0.18, 0.98, obsidianPlateMat);
    calfMesh.position.set(0, -0.49, 0);
    calfMesh.castShadow = true;
    calf.add(calfMesh);

    // Shin Vein Accent
    const shinVein = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.62, 0.04), veinCrackMat);
    shinVein.position.set(0, -0.45, 0.2);
    calf.add(shinVein);

    // Colossal Dread Sabaton Boot (~0.7m long)
    const bootGroup = new THREE.Group();
    bootGroup.position.set(0, -0.98, 0.12);

    // Stepped Articulated Steel Plate Soles & Body
    const bootMain = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.26, 0.72), obsidianPlateMat);
    bootMain.position.set(0, 0.1, 0);
    bootMain.castShadow = true;
    bootGroup.add(bootMain);

    // Segmented Toe Caps
    const toeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.22, 8), wroughtSteelMat);
    toeCap.position.set(0, 0.08, 0.38);
    toeCap.rotation.x = 0.4;
    bootGroup.add(toeCap);

    // Heavy Heel Spur
    const heelSpur = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 4), antiqueGoldMat);
    heelSpur.position.set(0, 0.12, -0.42);
    heelSpur.rotation.x = -1.4;
    bootGroup.add(heelSpur);

    calf.add(bootGroup);
  });

  // 9. Shadow Aura: Black smoke + violet particles + small cyan highlights
  const auraGroup = new THREE.Group();
  auraGroup.name = 'AbyssWarden_ShadowAura';

  // Ground black smoke disc
  const smokeDisc = new THREE.Mesh(new THREE.RingGeometry(0.6, 2.8, 24), smokeDiscMat);
  smokeDisc.rotation.x = -Math.PI / 2;
  smokeDisc.position.set(0, 0.04, 0);
  auraGroup.add(smokeDisc);

  // Violet particle aura ring
  const violetRing = new THREE.Mesh(new THREE.RingGeometry(0.8, 2.2, 18), violetRingMat);
  violetRing.rotation.x = -Math.PI / 2;
  violetRing.position.set(0, 0.08, 0);
  auraGroup.add(violetRing);

  // Cyan sparks around the perimeter
  for (let sp = 0; sp < 6; sp++) {
    const angle = (sp / 6) * Math.PI * 2;
    const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), cyanSparkMat);
    spark.position.set(Math.cos(angle) * 1.8, 0.25 + (sp % 2) * 0.15, Math.sin(angle) * 1.8);
    auraGroup.add(spark);
  }
  root.add(auraGroup);

  // Scale: 2.85x brings total height from ~1.9m base skeleton to ~5.4m colossal boss titan!
  root.scale.setScalar(2.85);

  return { root, nodes };
}

// -------------------------------------------------------------
// 6. GRAVE SOLDIER (Undead skeleton warrior, breastplate & broadsword)
// -------------------------------------------------------------
export function buildGraveSoldierModel(variantSeed = 0) {
  const root = new THREE.Group();
  root.name = 'GraveSoldier_Root';
  const nodes = {};

  const boneMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.65, metalness: 0.1 });
  const rustedIronMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8, roughness: 0.45 });
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.9, roughness: 0.25 });
  const soulGlow = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 2.5,
    roughness: 0.2,
    metalness: 0.1
  }); // Pale blue soul light

  nodes.Materials = {
    boneMat,
    rustedIronMat,
    darkSteelMat,
    eyeMat: soulGlow
  };

  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 0.92, 0);
  root.add(hips);
  nodes.Hips = hips;

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.2, 8), boneMat);
  hips.add(pelvis);

  // Spine & Ribcage
  const spine = new THREE.Group();
  spine.position.set(0, 0.12, 0);
  hips.add(spine);
  nodes.Spine = spine;

  const chest = new THREE.Group();
  chest.position.set(0, 0.26, 0);
  spine.add(chest);
  nodes.Chest = chest;

  // Skeleton Ribcage
  const ribs = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.4, 8), boneMat);
  ribs.castShadow = true;
  chest.add(ribs);

  // Weathered Rusted Breastplate
  const breastplate = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.32, 8, 1, false, -Math.PI * 0.45, Math.PI * 0.9), rustedIronMat);
  breastplate.position.set(0, 0.04, 0.02);
  chest.add(breastplate);

  // Skull Head
  const head = new THREE.Group();
  head.position.set(0, 0.32, 0);
  chest.add(head);
  nodes.Head = head;

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), boneMat);
  skull.castShadow = true;
  head.add(skull);

  // Soul Eyes
  [-0.055, 0.055].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), soulGlow);
    eye.position.set(x, 0.02, 0.14);
    head.add(eye);
  });

  // Right Arm (Notched Broadsword)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.32, 0.15, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArm = createLimbMesh(0.045, 0.04, 0.36, boneMat);
  rArm.position.set(0, -0.18, 0);
  rightUpperArm.add(rArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.36, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearm = createLimbMesh(0.04, 0.035, 0.34, boneMat);
  rForearm.position.set(0, -0.17, 0);
  rightForearm.add(rForearm);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.34, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Broadsword
  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.1);
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.1, 0.03), darkSteelMat);
  blade.position.set(0, 0.55, 0);
  weaponSocket.add(blade);

  // Left Arm (Rusted Iron Kite Shield)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.32, 0.15, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArm = createLimbMesh(0.045, 0.04, 0.36, boneMat);
  lArm.position.set(0, -0.18, 0);
  leftUpperArm.add(lArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.36, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearm = createLimbMesh(0.04, 0.035, 0.34, boneMat);
  lForearm.position.set(0, -0.17, 0);
  leftForearm.add(lForearm);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.34, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.65, 0.04), rustedIronMat);
  shield.position.set(0, 0, 0.12);
  leftHand.add(shield);

  // Skeletal Legs
  [-0.14, 0.14].forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.06, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.05, 0.04, 0.44, boneMat);
    thighMesh.position.set(0, -0.22, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.position.set(0, -0.44, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const calfMesh = createLimbMesh(0.045, 0.035, 0.42, boneMat);
    calfMesh.position.set(0, -0.21, 0);
    calf.add(calfMesh);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.22), boneMat);
    foot.position.set(0, -0.42, 0.06);
    calf.add(foot);
  });

  root.scale.setScalar(1.08);
  return { root, nodes };
}

// -------------------------------------------------------------
// 7. VOID ARCHER (Hooded wraith archer, recurve war bow)
// -------------------------------------------------------------
export function buildVoidArcherModel(variantSeed = 0) {
  const root = new THREE.Group();
  root.name = 'VoidArcher_Root';
  const nodes = {};

  const shroudMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.85, metalness: 0.1, side: THREE.DoubleSide });
  const voidGlowMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0x9333ea,
    emissiveIntensity: 2.8,
    roughness: 0.2,
    metalness: 0.1
  });
  const bowMat = new THREE.MeshStandardMaterial({ color: 0x312e81, metalness: 0.85, roughness: 0.25 });

  nodes.Materials = {
    shroudMat,
    voidGlowMat,
    bowMat,
    eyeMat: voidGlowMat
  };

  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 0.95, 0);
  root.add(hips);
  nodes.Hips = hips;

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.24, 8), shroudMat);
  hips.add(pelvis);

  // Spine & Chest
  const spine = new THREE.Group();
  spine.position.set(0, 0.14, 0);
  hips.add(spine);
  nodes.Spine = spine;

  const chest = new THREE.Group();
  chest.position.set(0, 0.24, 0);
  spine.add(chest);
  nodes.Chest = chest;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.44, 8), shroudMat);
  torso.castShadow = true;
  chest.add(torso);

  // Hooded Head
  const head = new THREE.Group();
  head.position.set(0, 0.34, 0);
  chest.add(head);
  nodes.Head = head;

  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.38, 8), shroudMat);
  hood.position.set(0, 0.1, -0.02);
  hood.rotation.x = -0.2;
  head.add(hood);

  // Glowing Purple Archer Eyes
  [-0.05, 0.05].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, 0.04), voidGlowMat);
    eye.position.set(x, 0.04, 0.15);
    head.add(eye);
  });

  // Right Arm (Drawing Hand)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.32, 0.15, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArm = createLimbMesh(0.055, 0.045, 0.36, shroudMat);
  rArm.position.set(0, -0.18, 0);
  rightUpperArm.add(rArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.36, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearm = createLimbMesh(0.05, 0.04, 0.34, shroudMat);
  rForearm.position.set(0, -0.17, 0);
  rightForearm.add(rForearm);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.34, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Left Arm (Recurve War Bow)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.32, 0.15, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArm = createLimbMesh(0.055, 0.045, 0.36, shroudMat);
  lArm.position.set(0, -0.18, 0);
  leftUpperArm.add(lArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.36, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearm = createLimbMesh(0.05, 0.04, 0.34, shroudMat);
  lForearm.position.set(0, -0.17, 0);
  leftForearm.add(lForearm);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.34, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.1);
  leftHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // Recurve Bow Curve
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 8, 24, Math.PI * 0.95), bowMat);
  bow.rotation.y = Math.PI / 2;
  weaponSocket.add(bow);

  // Bowstring with glowing void nock
  const nock = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), voidGlowMat);
  weaponSocket.add(nock);

  // Legs
  [-0.14, 0.14].forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.06, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.07, 0.055, 0.46, shroudMat);
    thighMesh.position.set(0, -0.23, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.position.set(0, -0.46, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const calfMesh = createLimbMesh(0.055, 0.045, 0.44, shroudMat);
    calfMesh.position.set(0, -0.22, 0);
    calf.add(calfMesh);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.24), shroudMat);
    foot.position.set(0, -0.44, 0.06);
    calf.add(foot);
  });

  root.scale.setScalar(1.1);
  return { root, nodes };
}
