// -------------------------------------------------------------
// SHADOW ASCENSION - REALISTIC 3D MONSTER MODEL BUILDER
// Builds rich, anatomical, original 3D dark fantasy monster models:
// 1. Ash Goblin (1.5m weak swarm hunter)
// 2. Grave Soldier (1.8m undead skeleton warrior)
// 3. Void Archer (1.9m hooded wraith archer)
// 4. Blood Knight (2.2m elite dreadknight)
// 5. Grave Warlord (2.8m commander general)
// 6. Abyss Warden (4.5m colossal boss titan)
// Fully equipped with PBR materials, hierarchical bone nodes, and weapons.
// -------------------------------------------------------------

import * as THREE from 'three';

// Helper to create smoothed capsule/cylinder limbs
function createLimbMesh(radiusTop, radiusBottom, height, material, radialSegments = 10) {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// -------------------------------------------------------------
// 1. ASH GOBLIN (1.5m)
// -------------------------------------------------------------
export function buildAshGoblinModel() {
  const root = new THREE.Group();
  root.name = 'AshGoblin_Root';
  const nodes = {};

  // PBR Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0x475549,
    roughness: 0.72,
    metalness: 0.08
  });
  const darkSkinMat = new THREE.MeshStandardMaterial({
    color: 0x333d34,
    roughness: 0.8,
    metalness: 0.05
  });
  const tuskMat = new THREE.MeshStandardMaterial({
    color: 0xedd99f,
    roughness: 0.45,
    metalness: 0.05
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x181005 });
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x2b1c14,
    roughness: 0.85,
    metalness: 0.1
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x4a474d,
    metalness: 0.82,
    roughness: 0.35
  });
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x3e4147,
    metalness: 0.9,
    roughness: 0.25
  });

  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 0.65, 0);
  root.add(hips);
  nodes.Hips = hips;

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.22, 8), skinMat);
  pelvis.castShadow = true;
  hips.add(pelvis);

  // Loincloth
  const loincloth = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.28), leatherMat);
  loincloth.position.set(0, -0.06, 0);
  hips.add(loincloth);

  // Spine / Hunched Torso
  const spine = new THREE.Group();
  spine.position.set(0, 0.1, 0);
  spine.rotation.x = 0.28; // Hunched forward
  hips.add(spine);
  nodes.Spine = spine;

  // Ribcage / Chest
  const chest = new THREE.Group();
  chest.position.set(0, 0.18, 0.06);
  spine.add(chest);
  nodes.Chest = chest;

  const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.32, 8), skinMat);
  torsoMesh.castShadow = true;
  chest.add(torsoMesh);

  // Back Spine Ridges / Nodules
  for (let i = 0; i < 3; i++) {
    const ridge = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 4), darkSkinMat);
    ridge.position.set(0, 0.08 - i * 0.09, -0.15);
    ridge.rotation.x = -1.2;
    chest.add(ridge);
  }

  // Leather Strap across chest
  const chestStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.06, 8), leatherMat);
  chestStrap.rotation.z = 0.6;
  chest.add(chestStrap);

  // Right Iron Scrap Pauldron
  const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), ironMat);
  pauldron.position.set(0.22, 0.16, 0);
  pauldron.rotation.z = -0.6;
  chest.add(pauldron);

  // Neck & Head
  const neck = new THREE.Group();
  neck.position.set(0, 0.22, 0.12);
  chest.add(neck);

  const head = new THREE.Group();
  head.position.set(0, 0.12, 0.08);
  neck.add(head);
  nodes.Head = head;

  // Skull
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), skinMat);
  cranium.scale.set(0.95, 1.0, 1.15);
  cranium.castShadow = true;
  head.add(cranium);

  // Wrinkled Brow Ridge
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.1), darkSkinMat);
  brow.position.set(0, 0.06, 0.14);
  head.add(brow);

  // Snout / Nose
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 5), darkSkinMat);
  snout.position.set(0, 0.0, 0.2);
  snout.rotation.x = 1.3;
  head.add(snout);

  // Eyes (Glowing Amber)
  [-0.07, 0.07].forEach((x) => {
    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(x, 0.04, 0.16);

    const eyeOrb = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), eyeMat);
    const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 4), pupilMat);
    pupil.position.set(0, 0, 0.032);
    eyeSocket.add(eyeOrb);
    eyeSocket.add(pupil);
    head.add(eyeSocket);
  });

  // Sharp Pointed Goblin Ears
  [-0.2, 0.2].forEach((x, i) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 4), skinMat);
    ear.position.set(x, 0.06, -0.04);
    ear.rotation.set(0.2, 0, i === 0 ? 1.2 : -1.2);
    ear.scale.set(0.5, 1.0, 0.7);
    head.add(ear);
  });

  // Jaw with Protruding Lower Tusks
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.16), skinMat);
  jaw.position.set(0, -0.09, 0.1);
  head.add(jaw);

  [-0.06, 0.06].forEach((x) => {
    const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.11, 4), tuskMat);
    tusk.position.set(x, 0.04, 0.08);
    tusk.rotation.x = -0.3;
    jaw.add(tusk);
  });

  // Right Arm (Weapon Arm)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.26, 0.12, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rBicep = createLimbMesh(0.065, 0.055, 0.26, skinMat);
  rBicep.position.set(0, -0.13, 0);
  rightUpperArm.add(rBicep);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.26, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearmMesh = createLimbMesh(0.055, 0.05, 0.28, skinMat);
  rForearmMesh.position.set(0, -0.14, 0);
  rightForearm.add(rForearmMesh);

  // Leather Armband
  const rArmband = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 8), leatherMat);
  rArmband.position.set(0, -0.08, 0);
  rightForearm.add(rArmband);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.28, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Weapon: Bone Cleaver
  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.08);
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // Handle
  const cleaverHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.28, 6), leatherMat);
  cleaverHandle.position.set(0, 0, 0);
  cleaverHandle.rotation.x = Math.PI / 2;
  weaponSocket.add(cleaverHandle);

  // Cleaver Heavy Blade with notched teeth
  const cleaverBlade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.38, 0.16), bladeMat);
  cleaverBlade.position.set(0, 0.12, 0.16);
  cleaverBlade.castShadow = true;
  weaponSocket.add(cleaverBlade);

  // Left Arm (Clawed Hand)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.26, 0.12, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lBicep = createLimbMesh(0.065, 0.055, 0.26, skinMat);
  lBicep.position.set(0, -0.13, 0);
  leftUpperArm.add(lBicep);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.26, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearmMesh = createLimbMesh(0.055, 0.05, 0.28, skinMat);
  lForearmMesh.position.set(0, -0.14, 0);
  leftForearm.add(lForearmMesh);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.28, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  // Claws
  [-0.02, 0, 0.02].forEach((x) => {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.07, 4), ironMat);
    claw.position.set(x, -0.06, 0.02);
    claw.rotation.x = 0.5;
    leftHand.add(claw);
  });

  // Legs: Left & Right Thighs & Calves
  const legXOffsets = [-0.12, 0.12];
  legXOffsets.forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.08, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.08, 0.065, 0.32, skinMat);
    thighMesh.position.set(0, -0.16, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.position.set(0, -0.32, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const calfMesh = createLimbMesh(0.065, 0.055, 0.32, skinMat);
    calfMesh.position.set(0, -0.16, 0);
    calf.add(calfMesh);

    // Foot with Claws
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.18), darkSkinMat);
    foot.position.set(0, -0.32, 0.04);
    calf.add(foot);
  });

  root.scale.setScalar(0.92); // ~1.45m height
  return { root, nodes };
}

// -------------------------------------------------------------
// 2. GRAVE SOLDIER (1.8m Undead Skeleton Warrior)
// -------------------------------------------------------------
export function buildGraveSoldierModel() {
  const root = new THREE.Group();
  root.name = 'GraveSoldier_Root';
  const nodes = {};

  // PBR Materials
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xd8d3c5, roughness: 0.65, metalness: 0.05 });
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x272a30, metalness: 0.88, roughness: 0.32 });
  const rustyIronMat = new THREE.MeshStandardMaterial({ color: 0x5a3424, metalness: 0.75, roughness: 0.55 });
  const surcoatMat = new THREE.MeshStandardMaterial({ color: 0x11131a, roughness: 0.88, metalness: 0.05 });
  const soulEyeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x525966, metalness: 0.92, roughness: 0.22 });

  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 0.88, 0);
  root.add(hips);
  nodes.Hips = hips;

  const pelvisBone = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.18, 8), boneMat);
  hips.add(pelvisBone);

  // Tattered Surcoat hanging down
  const surcoatFront = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.55), surcoatMat);
  surcoatFront.position.set(0, -0.22, 0.12);
  hips.add(surcoatFront);

  const surcoatBack = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.55), surcoatMat);
  surcoatBack.position.set(0, -0.22, -0.12);
  surcoatBack.rotation.y = Math.PI;
  hips.add(surcoatBack);

  // Spine & Ribcage
  const spine = new THREE.Group();
  spine.position.set(0, 0.1, 0);
  hips.add(spine);
  nodes.Spine = spine;

  // Vertebrae column
  for (let i = 0; i < 4; i++) {
    const vert = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 6), boneMat);
    vert.position.set(0, i * 0.06, 0);
    spine.add(vert);
  }

  // Chest & Corroded Breastplate
  const chest = new THREE.Group();
  chest.position.set(0, 0.26, 0);
  spine.add(chest);
  nodes.Chest = chest;

  // Damaged Steel Breastplate
  const breastplate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.32), darkSteelMat);
  breastplate.castShadow = true;
  chest.add(breastplate);

  // Battle Gouge on armor
  const gouge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 0.05), rustyIronMat);
  gouge.position.set(0.06, 0.04, 0.15);
  gouge.rotation.z = -0.4;
  chest.add(gouge);

  // Exposed Ribcage on back
  const ribMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.32, 6), boneMat);
  ribMesh.position.set(0, 0, -0.04);
  chest.add(ribMesh);

  // Spiked Steel Pauldrons
  [-0.32, 0.32].forEach((x, i) => {
    const pauldron = new THREE.Group();
    pauldron.position.set(x, 0.18, 0);

    const plate = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), darkSteelMat);
    plate.rotation.z = i === 0 ? 0.5 : -0.5;
    pauldron.add(plate);

    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 4), rustyIronMat);
    spike.position.set(0, 0.14, 0);
    pauldron.add(spike);

    chest.add(pauldron);
  });

  // Neck & Skull Head
  const neck = new THREE.Group();
  neck.position.set(0, 0.26, 0);
  chest.add(neck);

  const head = new THREE.Group();
  head.position.set(0, 0.16, 0);
  neck.add(head);
  nodes.Head = head;

  // Bone Skull
  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.26), boneMat);
  skull.castShadow = true;
  head.add(skull);

  // Horned Bascinet Helmet
  const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.18, 8), darkSteelMat);
  helmet.position.set(0, 0.12, 0);
  head.add(helmet);

  [-0.16, 0.16].forEach((hx, hi) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.22, 4), rustyIronMat);
    horn.position.set(hx, 0.16, 0);
    horn.rotation.z = hi === 0 ? 0.6 : -0.6;
    head.add(horn);
  });

  // Eerie Glowing Blue Soul Eyes inside sockets
  [-0.065, 0.065].forEach((x) => {
    const soulEye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), soulEyeMat);
    soulEye.position.set(x, 0.02, 0.135);
    head.add(soulEye);
  });

  // Skeletal Jaw
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.14), boneMat);
  jaw.position.set(0, -0.11, 0.06);
  head.add(jaw);

  // Right Arm (Sword Arm)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.32, 0.16, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArmBone = createLimbMesh(0.045, 0.04, 0.32, boneMat);
  rArmBone.position.set(0, -0.16, 0);
  rightUpperArm.add(rArmBone);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.32, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearmMesh = createLimbMesh(0.04, 0.035, 0.3, boneMat);
  rForearmMesh.position.set(0, -0.15, 0);
  rightForearm.add(rForearmMesh);

  // Armored Steel Gauntlet
  const rGauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.18, 6), darkSteelMat);
  rGauntlet.position.set(0, -0.18, 0);
  rightForearm.add(rGauntlet);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.3, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Weapon: Crypt Broadsword
  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.06);
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // Crossguard
  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.06), rustyIronMat);
  weaponSocket.add(crossguard);

  // Broadsword Blade with notches
  const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.02), bladeMat);
  swordBlade.position.set(0, 0.44, 0);
  swordBlade.castShadow = true;
  weaponSocket.add(swordBlade);

  // Left Arm (Skeletal Guard Arm)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.32, 0.16, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArmBone = createLimbMesh(0.045, 0.04, 0.32, boneMat);
  lArmBone.position.set(0, -0.16, 0);
  leftUpperArm.add(lArmBone);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.32, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearmMesh = createLimbMesh(0.04, 0.035, 0.3, boneMat);
  lForearmMesh.position.set(0, -0.15, 0);
  leftForearm.add(lForearmMesh);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.3, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  // Skeletal Legs with Steel Greaves
  [-0.14, 0.14].forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.06, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighBone = createLimbMesh(0.05, 0.045, 0.42, boneMat);
    thighBone.position.set(0, -0.21, 0);
    thigh.add(thighBone);

    const calf = new THREE.Group();
    calf.position.set(0, -0.42, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    // Steel Greave on calf
    const greave = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.36, 6), darkSteelMat);
    greave.position.set(0, -0.18, 0);
    calf.add(greave);

    // Steel Boot / Solleret
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.22), darkSteelMat);
    boot.position.set(0, -0.38, 0.04);
    calf.add(boot);
  });

  root.scale.setScalar(1.0); // ~1.8m height
  return { root, nodes };
}

// -------------------------------------------------------------
// 3. VOID ARCHER (1.9m Hooded Shadow Wraith)
// -------------------------------------------------------------
export function buildVoidArcherModel() {
  const root = new THREE.Group();
  root.name = 'VoidArcher_Root';
  const nodes = {};

  const cloakMat = new THREE.MeshStandardMaterial({ color: 0x0f0b18, roughness: 0.85, metalness: 0.1 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x1a1524, roughness: 0.65, metalness: 0.2 });
  const boneMaskMat = new THREE.MeshStandardMaterial({ color: 0xeae5d8, roughness: 0.42, metalness: 0.05 });
  const voidGlowMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
  const bowMat = new THREE.MeshStandardMaterial({ color: 0x1e192a, metalness: 0.3, roughness: 0.5 });
  const bowStringMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });

  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 0.95, 0);
  root.add(hips);
  nodes.Hips = hips;

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.22, 8), leatherMat);
  hips.add(pelvis);

  // Quiver on Hip
  const quiver = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.5, 6), leatherMat);
  quiver.position.set(0.24, -0.05, -0.12);
  quiver.rotation.z = -0.3;
  quiver.rotation.x = -0.2;
  hips.add(quiver);

  // Arrows in Quiver
  for (let i = 0; i < 4; i++) {
    const arrow = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.25, 4), bowMat);
    arrow.position.set(0.23 + (i % 2) * 0.03, 0.22, -0.12 + Math.floor(i / 2) * 0.03);
    hips.add(arrow);
  }

  // Spine & Chest
  const spine = new THREE.Group();
  spine.position.set(0, 0.11, 0);
  hips.add(spine);
  nodes.Spine = spine;

  const chest = new THREE.Group();
  chest.position.set(0, 0.28, 0);
  spine.add(chest);
  nodes.Chest = chest;

  const cuirass = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.38, 8), leatherMat);
  chest.add(cuirass);

  // Flowing Cowl / Mantle over shoulders
  const mantle = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.24, 8), cloakMat);
  mantle.position.set(0, 0.12, 0);
  chest.add(mantle);

  // Long Cloak Tails
  const cloakTail = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.15), cloakMat);
  cloakTail.position.set(0, -0.45, -0.22);
  cloakTail.rotation.x = 0.12;
  chest.add(cloakTail);

  // Neck & Hooded Head
  const head = new THREE.Group();
  head.position.set(0, 0.36, 0);
  chest.add(head);
  nodes.Head = head;

  // Deep Hood
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.42, 8), cloakMat);
  hood.position.set(0, 0.08, -0.04);
  head.add(hood);

  // Carved Bone Mask inside hood
  const mask = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.24, 6), boneMaskMat);
  mask.position.set(0, 0.02, 0.08);
  head.add(mask);

  // Glowing Purple Void Slit Eyes
  [-0.05, 0.05].forEach((x, i) => {
    const voidSlit = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.015, 0.02), voidGlowMat);
    voidSlit.position.set(x, 0.05, 0.16);
    voidSlit.rotation.z = i === 0 ? 0.25 : -0.25;
    head.add(voidSlit);
  });

  // Left Arm (Holding Bow)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.32, 0.14, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArm = createLimbMesh(0.055, 0.045, 0.32, leatherMat);
  lArm.position.set(0, -0.16, 0);
  leftUpperArm.add(lArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.32, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearm = createLimbMesh(0.045, 0.04, 0.3, leatherMat);
  lForearm.position.set(0, -0.15, 0);
  leftForearm.add(lForearm);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.3, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  // Compound Recurve Bow in Left Hand
  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.05);
  leftHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // Bow Stave (Curved)
  const bowStaveTop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.012, 0.65, 6), bowMat);
  bowStaveTop.position.set(0, 0.32, 0.08);
  bowStaveTop.rotation.x = -0.3;
  weaponSocket.add(bowStaveTop);

  const bowStaveBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.012, 0.65, 6), bowMat);
  bowStaveBottom.position.set(0, -0.32, 0.08);
  bowStaveBottom.rotation.x = 0.3;
  weaponSocket.add(bowStaveBottom);

  // Ethereal Glowing Bowstring
  const bowString = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.25, 4), bowStringMat);
  bowString.position.set(0, 0, -0.06);
  weaponSocket.add(bowString);

  // Right Arm (Drawing Arm)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.32, 0.14, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArm = createLimbMesh(0.055, 0.045, 0.32, leatherMat);
  rArm.position.set(0, -0.16, 0);
  rightUpperArm.add(rArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.32, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearm = createLimbMesh(0.045, 0.04, 0.3, leatherMat);
  rForearm.position.set(0, -0.15, 0);
  rightForearm.add(rForearm);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.3, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Legs with Dark Trousers & Boots
  [-0.14, 0.14].forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.06, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.075, 0.06, 0.44, leatherMat);
    thighMesh.position.set(0, -0.22, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.position.set(0, -0.44, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const calfMesh = createLimbMesh(0.06, 0.05, 0.4, leatherMat);
    calfMesh.position.set(0, -0.2, 0);
    calf.add(calfMesh);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.22), cloakMat);
    boot.position.set(0, -0.4, 0.04);
    calf.add(boot);
  });

  root.scale.setScalar(1.05); // ~1.9m height
  return { root, nodes };
}

// -------------------------------------------------------------
// 4. BLOOD KNIGHT (2.2m Elite Dreadknight)
// -------------------------------------------------------------
export function buildBloodKnightModel() {
  const root = new THREE.Group();
  root.name = 'BloodKnight_Root';
  const nodes = {};

  const obsidianMat = new THREE.MeshStandardMaterial({ color: 0x111018, metalness: 0.88, roughness: 0.22 });
  const bloodTrimMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, metalness: 0.65, roughness: 0.28 });
  const runeGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.16 });

  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 1.05, 0);
  root.add(hips);
  nodes.Hips = hips;

  const faulds = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.32, 8), obsidianMat);
  hips.add(faulds);

  // Spine & Heavy Torso
  const spine = new THREE.Group();
  spine.position.set(0, 0.14, 0);
  hips.add(spine);
  nodes.Spine = spine;

  const chest = new THREE.Group();
  chest.position.set(0, 0.32, 0);
  spine.add(chest);
  nodes.Chest = chest;

  // Spiked Obsidian Cuirass
  const cuirass = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.58, 0.44), obsidianMat);
  cuirass.castShadow = true;
  chest.add(cuirass);

  // Crimson Inlay Heart Emblem
  const chestEmblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14), runeGlowMat);
  chestEmblem.position.set(0, 0.08, 0.24);
  chest.add(chestEmblem);

  // Massive Tiered Fluted Pauldrons
  [-0.48, 0.48].forEach((x, i) => {
    const pauldron = new THREE.Group();
    pauldron.position.set(x, 0.24, 0);

    const pPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.42), obsidianMat);
    pPlate.rotation.z = i === 0 ? 0.35 : -0.35;
    pauldron.add(pPlate);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.44), bloodTrimMat);
    trim.position.set(0, -0.1, 0);
    pauldron.add(trim);

    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 4), bloodTrimMat);
    spike.position.set(0, 0.22, 0);
    pauldron.add(spike);

    chest.add(pauldron);
  });

  // Horned Dread Greathelm
  const head = new THREE.Group();
  head.position.set(0, 0.42, 0);
  chest.add(head);
  nodes.Head = head;

  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.36), obsidianMat);
  helm.castShadow = true;
  head.add(helm);

  // Sweeping Demonic Horns
  [-0.22, 0.22].forEach((hx, hi) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.38, 5), bloodTrimMat);
    horn.position.set(hx, 0.22, 0.04);
    horn.rotation.z = hi === 0 ? 0.8 : -0.8;
    horn.rotation.x = -0.3;
    head.add(horn);
  });

  // Glowing Crimson Visor Slit
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.05), runeGlowMat);
  visor.position.set(0, 0.04, 0.19);
  head.add(visor);

  // Right Arm (Colossal Weapon Arm)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.48, 0.18, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArm = createLimbMesh(0.09, 0.08, 0.4, obsidianMat);
  rArm.position.set(0, -0.2, 0);
  rightUpperArm.add(rArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.4, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearm = createLimbMesh(0.08, 0.075, 0.38, obsidianMat);
  rForearm.position.set(0, -0.19, 0);
  rightForearm.add(rForearm);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.38, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Weapon: Colossal Blood Zweihander
  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.1);
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // Pommel & Handle
  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.52, 8), bloodTrimMat);
  hilt.position.set(0, -0.18, 0);
  weaponSocket.add(hilt);

  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.1), bloodTrimMat);
  crossguard.position.set(0, 0.08, 0);
  weaponSocket.add(crossguard);

  // Massive 1.6m Blade
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.6, 0.035), bladeMat);
  blade.position.set(0, 0.88, 0);
  blade.castShadow = true;
  weaponSocket.add(blade);

  // Glowing Blood Fuller Rune
  const bladeRune = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 0.04), runeGlowMat);
  bladeRune.position.set(0, 0.88, 0);
  weaponSocket.add(bladeRune);

  // Left Arm (Heavy Shield/Fist Arm)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.48, 0.18, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArm = createLimbMesh(0.09, 0.08, 0.4, obsidianMat);
  lArm.position.set(0, -0.2, 0);
  leftUpperArm.add(lArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.4, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearm = createLimbMesh(0.08, 0.075, 0.38, obsidianMat);
  lForearm.position.set(0, -0.19, 0);
  leftForearm.add(lForearm);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.38, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  // Massive Armored Legs
  [-0.2, 0.2].forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.08, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.11, 0.095, 0.52, obsidianMat);
    thighMesh.position.set(0, -0.26, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.position.set(0, -0.52, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    // Fluted Greaves
    const greave = createLimbMesh(0.095, 0.085, 0.48, obsidianMat);
    greave.position.set(0, -0.24, 0);
    calf.add(greave);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.32), obsidianMat);
    boot.position.set(0, -0.48, 0.06);
    calf.add(boot);
  });

  root.scale.setScalar(1.22); // ~2.2m height
  return { root, nodes };
}

// -------------------------------------------------------------
// 5. GRAVE WARLORD (2.8m Legion Commander)
// -------------------------------------------------------------
export function buildGraveWarlordModel() {
  const root = new THREE.Group();
  root.name = 'GraveWarlord_Root';
  const nodes = {};

  const plateMat = new THREE.MeshStandardMaterial({ color: 0x181a24, metalness: 0.9, roughness: 0.25 });
  const goldTrimMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.95, roughness: 0.18 });
  const capeMat = new THREE.MeshStandardMaterial({ color: 0x4c0519, roughness: 0.9, metalness: 0.05 });
  const soulFireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const axeSteelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.94, roughness: 0.2 });

  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 1.35, 0);
  root.add(hips);
  nodes.Hips = hips;

  const fauld = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.4, 8), plateMat);
  hips.add(fauld);

  // Spine & Chest
  const spine = new THREE.Group();
  spine.position.set(0, 0.18, 0);
  hips.add(spine);
  nodes.Spine = spine;

  const chest = new THREE.Group();
  chest.position.set(0, 0.42, 0);
  spine.add(chest);
  nodes.Chest = chest;

  const breastplate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.72, 0.54), plateMat);
  breastplate.castShadow = true;
  chest.add(breastplate);

  // Gilded Ascension Seal on Chest
  const seal = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.18, 8), goldTrimMat);
  seal.position.set(0, 0.12, 0.28);
  chest.add(seal);

  // Regal Velvet Cape
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 1.8), capeMat);
  cape.position.set(0, -0.6, -0.32);
  cape.rotation.x = 0.12;
  chest.add(cape);

  // Fortress Pauldrons with Gold Borders
  [-0.6, 0.6].forEach((x, i) => {
    const pauldron = new THREE.Group();
    pauldron.position.set(x, 0.32, 0);

    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 0.52), plateMat);
    plate.rotation.z = i === 0 ? 0.3 : -0.3;
    pauldron.add(plate);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.54), goldTrimMat);
    trim.position.set(0, 0.14, 0);
    pauldron.add(trim);

    chest.add(pauldron);
  });

  // Crowned Skull Helm
  const head = new THREE.Group();
  head.position.set(0, 0.52, 0);
  chest.add(head);
  nodes.Head = head;

  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.44), plateMat);
  head.add(helm);

  // Spiked Crown
  for (let c = -2; c <= 2; c++) {
    const crownSpike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.28, 4), goldTrimMat);
    crownSpike.position.set(c * 0.09, 0.32, 0.16);
    head.add(crownSpike);
  }

  // Blazing Orange Soul Flames
  [-0.09, 0.09].forEach((x) => {
    const soulFlame = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), soulFireMat);
    soulFlame.position.set(x, 0.05, 0.23);
    head.add(soulFlame);
  });

  // Right Arm (War Axe Arm)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.6, 0.22, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArm = createLimbMesh(0.12, 0.1, 0.52, plateMat);
  rArm.position.set(0, -0.26, 0);
  rightUpperArm.add(rArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.52, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearm = createLimbMesh(0.1, 0.09, 0.48, plateMat);
  rForearm.position.set(0, -0.24, 0);
  rightForearm.add(rForearm);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.48, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Weapon: Double-Headed War Halberd / Axe
  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.12);
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  // Shaft
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), plateMat);
  shaft.position.set(0, 0.2, 0);
  weaponSocket.add(shaft);

  // Twin Axe Crescent Blades
  [-0.32, 0.32].forEach((bx) => {
    const axeBlade = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.05, 12, 1, false, 0, Math.PI), axeSteelMat);
    axeBlade.position.set(bx, 1.05, 0);
    axeBlade.rotation.z = bx > 0 ? -Math.PI / 2 : Math.PI / 2;
    axeBlade.castShadow = true;
    weaponSocket.add(axeBlade);
  });

  // Left Arm
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.6, 0.22, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArm = createLimbMesh(0.12, 0.1, 0.52, plateMat);
  lArm.position.set(0, -0.26, 0);
  leftUpperArm.add(lArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.52, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearm = createLimbMesh(0.1, 0.09, 0.48, plateMat);
  lForearm.position.set(0, -0.24, 0);
  leftForearm.add(lForearm);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.48, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  // Massive Armored Greaved Legs
  [-0.26, 0.26].forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.1, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.14, 0.12, 0.65, plateMat);
    thighMesh.position.set(0, -0.32, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.position.set(0, -0.65, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const greave = createLimbMesh(0.12, 0.11, 0.6, plateMat);
    greave.position.set(0, -0.3, 0);
    calf.add(greave);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.4), plateMat);
    boot.position.set(0, -0.6, 0.08);
    calf.add(boot);
  });

  root.scale.setScalar(1.55); // ~2.8m height
  return { root, nodes };
}

// -------------------------------------------------------------
// 6. ABYSS WARDEN (4.5m Colossal Boss Titan)
// -------------------------------------------------------------
export function buildAbyssWardenModel() {
  const root = new THREE.Group();
  root.name = 'AbyssWarden_Boss_Root';
  const nodes = {};

  const chitinMat = new THREE.MeshStandardMaterial({ color: 0x0e0d16, metalness: 0.7, roughness: 0.35 });
  const demonHideMat = new THREE.MeshStandardMaterial({ color: 0x1e152d, roughness: 0.65, metalness: 0.15 });
  const abyssCoreMat = new THREE.MeshBasicMaterial({ color: 0xd946ef });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x272036, metalness: 0.94, roughness: 0.18 });

  // Hips
  const hips = new THREE.Group();
  hips.position.set(0, 2.1, 0);
  root.add(hips);
  nodes.Hips = hips;

  const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.6, 10), chitinMat);
  hips.add(pelvis);

  // Spine & Colossal Torso
  const spine = new THREE.Group();
  spine.position.set(0, 0.3, 0);
  hips.add(spine);
  nodes.Spine = spine;

  const chest = new THREE.Group();
  chest.position.set(0, 0.65, 0);
  spine.add(chest);
  nodes.Chest = chest;

  // Massive Muscular Torso with Abyssal Chitin Plates
  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.85), demonHideMat);
  torso.castShadow = true;
  chest.add(torso);

  // Core Fissure / Ascension Abyss Heart
  const heartFissure = new THREE.Mesh(new THREE.OctahedronGeometry(0.28), abyssCoreMat);
  heartFissure.position.set(0, 0.2, 0.44);
  chest.add(heartFissure);

  // Spined Dorsal Ridge on back
  for (let s = 0; s < 5; s++) {
    const spinePlate = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.45, 4), chitinMat);
    spinePlate.position.set(0, 0.4 - s * 0.22, -0.48);
    spinePlate.rotation.x = -1.2;
    chest.add(spinePlate);
  }

  // Giant Spiked Pauldrons
  [-0.95, 0.95].forEach((x, i) => {
    const pauldron = new THREE.Group();
    pauldron.position.set(x, 0.5, 0);

    const plate = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), chitinMat);
    plate.rotation.z = i === 0 ? 0.4 : -0.4;
    pauldron.add(plate);

    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.65, 5), chitinMat);
    spike.position.set(0, 0.45, 0);
    pauldron.add(spike);

    chest.add(pauldron);
  });

  // Horned Sovereign Head
  const head = new THREE.Group();
  head.position.set(0, 0.85, 0);
  chest.add(head);
  nodes.Head = head;

  const skull = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.72, 0.68), chitinMat);
  skull.castShadow = true;
  head.add(skull);

  // Massive Sweeping Curling Demonic Horns
  [-0.45, 0.45].forEach((hx, hi) => {
    const hornBase = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.95, 6), chitinMat);
    hornBase.position.set(hx, 0.5, -0.05);
    hornBase.rotation.z = hi === 0 ? 0.9 : -0.9;
    hornBase.rotation.x = -0.4;
    head.add(hornBase);
  });

  // Radiant Glowing Purple Sovereign Eyes
  [-0.15, 0.15].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), abyssCoreMat);
    eye.position.set(x, 0.08, 0.35);
    head.add(eye);
  });

  // Right Arm (Giant Blade Arm)
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.95, 0.35, 0);
  chest.add(rightUpperArm);
  nodes.RightUpperArm = rightUpperArm;

  const rArm = createLimbMesh(0.2, 0.18, 0.85, demonHideMat);
  rArm.position.set(0, -0.42, 0);
  rightUpperArm.add(rArm);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.85, 0);
  rightUpperArm.add(rightForearm);
  nodes.RightForearm = rightForearm;

  const rForearm = createLimbMesh(0.18, 0.16, 0.8, chitinMat);
  rForearm.position.set(0, -0.4, 0);
  rightForearm.add(rForearm);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.8, 0);
  rightForearm.add(rightHand);
  nodes.RightHand = rightHand;

  // Weapon: 3.2m Abyssal Doom-Blade
  const weaponSocket = new THREE.Group();
  weaponSocket.position.set(0, 0, 0.2);
  rightHand.add(weaponSocket);
  nodes.WeaponSocket = weaponSocket;

  const hilt = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.9, 8), chitinMat);
  hilt.position.set(0, -0.3, 0);
  weaponSocket.add(hilt);

  const crossguard = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.24), chitinMat);
  crossguard.position.set(0, 0.15, 0);
  weaponSocket.add(crossguard);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.8, 0.06), bladeMat);
  blade.position.set(0, 1.55, 0);
  blade.castShadow = true;
  weaponSocket.add(blade);

  // Glowing Abyssal Energy Fissure along Blade
  const bladeFissure = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 0.075), abyssCoreMat);
  bladeFissure.position.set(0, 1.55, 0);
  weaponSocket.add(bladeFissure);

  // Left Arm (Heavy Clawed Fist)
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.95, 0.35, 0);
  chest.add(leftUpperArm);
  nodes.LeftUpperArm = leftUpperArm;

  const lArm = createLimbMesh(0.2, 0.18, 0.85, demonHideMat);
  lArm.position.set(0, -0.42, 0);
  leftUpperArm.add(lArm);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.85, 0);
  leftUpperArm.add(leftForearm);
  nodes.LeftForearm = leftForearm;

  const lForearm = createLimbMesh(0.18, 0.16, 0.8, chitinMat);
  lForearm.position.set(0, -0.4, 0);
  leftForearm.add(lForearm);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.8, 0);
  leftForearm.add(leftHand);
  nodes.LeftHand = leftHand;

  // Giant Legs
  [-0.42, 0.42].forEach((x, i) => {
    const isLeft = i === 0;
    const thigh = new THREE.Group();
    thigh.position.set(x, -0.15, 0);
    hips.add(thigh);
    if (isLeft) nodes.LeftThigh = thigh; else nodes.RightThigh = thigh;

    const thighMesh = createLimbMesh(0.24, 0.2, 1.05, demonHideMat);
    thighMesh.position.set(0, -0.52, 0);
    thigh.add(thighMesh);

    const calf = new THREE.Group();
    calf.position.set(0, -1.05, 0);
    thigh.add(calf);
    if (isLeft) nodes.LeftCalf = calf; else nodes.RightCalf = calf;

    const calfMesh = createLimbMesh(0.2, 0.18, 0.95, chitinMat);
    calfMesh.position.set(0, -0.48, 0);
    calf.add(calfMesh);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.24, 0.65), chitinMat);
    foot.position.set(0, -0.95, 0.12);
    calf.add(foot);
  });

  root.scale.setScalar(2.2); // ~4.5m massive boss height
  return { root, nodes };
}
