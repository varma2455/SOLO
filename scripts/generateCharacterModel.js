// -------------------------------------------------------------
// SHADOW ASCENSION - KAEL HUMAN CHARACTER GLB GENERATOR
// Creates a high-fidelity, original humanoid fantasy hunter character
// with realistic anatomy, face, styled hair, tactical skin, and sword.
// -------------------------------------------------------------

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';
import path from 'node:path';

// Polyfill FileReader for Node.js
global.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};

export function buildKaelCharacterModel() {
  const root = new THREE.Group();
  root.name = 'Kael_Character_Root';

  // -------------------------------------------------------------
  // SHARED PBR MATERIALS
  // -------------------------------------------------------------
  // Realistic Human Skin
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xdfa596,
    roughness: 0.62,
    metalness: 0.05
  });

  // Dark Styled Hair with subtle purple/indigo specular sheen
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x13121d,
    roughness: 0.42,
    metalness: 0.15
  });

  // Lips
  const lipMat = new THREE.MeshStandardMaterial({
    color: 0xb87367,
    roughness: 0.55
  });

  // Eye Sclera (White)
  const scleraMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

  // Glowing Hunter Iris (Cyan/Blue gradient glow)
  const irisMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x020617 });

  // Eyebrows
  const browMat = new THREE.MeshStandardMaterial({ color: 0x0f0e17, roughness: 0.8 });

  // Dark Tactical Jacket Fabric (Charcoal)
  const coatFabricMat = new THREE.MeshStandardMaterial({
    color: 0x181924,
    roughness: 0.82,
    metalness: 0.08
  });

  // Inner Royal Purple Coat Lining
  const coatLiningMat = new THREE.MeshStandardMaterial({
    color: 0x3b0764,
    roughness: 0.65,
    metalness: 0.2
  });

  // Inner Tunic / Compression Shirt
  const innerShirtMat = new THREE.MeshStandardMaterial({
    color: 0x0f1017,
    roughness: 0.9,
    metalness: 0.05
  });

  // Leather Harness / Straps / Pouches
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x271d17,
    roughness: 0.68,
    metalness: 0.12
  });

  // Dark Armor Steel (Pauldrons, buckles, toe-caps)
  const steelArmorMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.88,
    roughness: 0.28
  });

  // Glowing Purple Runes / Inlays
  const runeGlowMat = new THREE.MeshBasicMaterial({
    color: 0xc084fc
  });

  // Combat Trousers Fabric
  const trousersMat = new THREE.MeshStandardMaterial({
    color: 0x1b1c26,
    roughness: 0.85,
    metalness: 0.05
  });

  // Heavy Rubber Boot Soles
  const rubberMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0f,
    roughness: 0.95,
    metalness: 0.0
  });

  // Sword Blade Steel
  const bladeSteelMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.95,
    roughness: 0.16
  });

  // -------------------------------------------------------------
  // HIERARCHICAL SKELETAL STRUCTURE
  // -------------------------------------------------------------
  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.y = 0.98;
  root.add(hips);

  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.y = 0.12;
  hips.add(spine);

  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.y = 0.24;
  spine.add(chest);

  // 1. CHEST & TORSO GEOMETRY
  // Muscular Torso Base
  const torsoMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.44, 12), innerShirtMat);
  torsoMesh.position.y = 0.16;
  torsoMesh.scale.set(1.15, 1, 0.78);
  torsoMesh.castShadow = true;
  chest.add(torsoMesh);

  // Asymmetrical Tactical Coat Vest Layer
  const coatVest = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.46, 0.36), coatFabricMat);
  coatVest.position.y = 0.17;
  coatVest.castShadow = true;
  chest.add(coatVest);

  // High Stand-up Collar
  const collarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.22), coatFabricMat);
  collarLeft.position.set(-0.16, 0.44, -0.02);
  collarLeft.rotation.z = -0.15;
  const collarRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.22), coatFabricMat);
  collarRight.position.set(0.16, 0.44, -0.02);
  collarRight.rotation.z = 0.15;
  const collarBack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.04), coatFabricMat);
  collarBack.position.set(0, 0.44, -0.12);
  chest.add(collarLeft, collarRight, collarBack);

  // Leather Chest Harness & Buckles
  const harness1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 0.38), leatherMat);
  harness1.position.y = 0.25;
  harness1.rotation.z = 0.35;
  const harness2 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 0.38), leatherMat);
  harness2.position.y = 0.12;
  harness2.rotation.z = -0.35;
  const centerBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), steelArmorMat);
  centerBuckle.position.set(0, 0.18, 0.19);
  chest.add(harness1, harness2, centerBuckle);

  // Center Shadow Energy Core Medallion
  const coreMedallion = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), runeGlowMat);
  coreMedallion.position.set(0, 0.28, 0.19);
  chest.add(coreMedallion);

  // 2. NECK, HEAD & REALISTIC FACE
  const neck = new THREE.Group();
  neck.name = 'Neck';
  neck.position.y = 0.42;
  chest.add(neck);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.16, 10), skinMat);
  neckMesh.position.y = 0.06;
  neckMesh.castShadow = true;
  neck.add(neckMesh);

  const head = new THREE.Group();
  head.name = 'Head';
  head.position.y = 0.15;
  neck.add(head);

  // Cranium / Head Shape (Proportional oval cranium)
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.165, 16, 16), skinMat);
  cranium.position.set(0, 0.08, 0);
  cranium.scale.set(0.92, 1.05, 1.0);
  cranium.castShadow = true;
  head.add(cranium);

  // Defined Jawline & Chin
  const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.075, 0.14, 8), skinMat);
  jaw.position.set(0, -0.01, 0.03);
  jaw.scale.set(0.95, 1.0, 1.15);
  jaw.castShadow = true;
  head.add(jaw);

  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), skinMat);
  chin.position.set(0, -0.07, 0.1);
  head.add(chin);

  // Cheekbones
  const leftCheek = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMat);
  leftCheek.position.set(-0.09, 0.03, 0.08);
  const rightCheek = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMat);
  rightCheek.position.set(0.09, 0.03, 0.08);
  head.add(leftCheek, rightCheek);

  // 3D Sculpted Nose (Bridge, tip, nostrils)
  const noseBridge = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.08, 0.04), skinMat);
  noseBridge.position.set(0, 0.05, 0.155);
  noseBridge.rotation.x = -0.2;
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), skinMat);
  noseTip.position.set(0, 0.02, 0.17);
  const leftNostril = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), skinMat);
  leftNostril.position.set(-0.022, 0.015, 0.16);
  const rightNostril = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), skinMat);
  rightNostril.position.set(0.022, 0.015, 0.16);
  head.add(noseBridge, noseTip, leftNostril, rightNostril);

  // 3D Sculpted Lips & Mouth
  const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.016, 0.02), lipMat);
  upperLip.position.set(0, -0.025, 0.145);
  const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.018, 0.022), lipMat);
  lowerLip.position.set(0, -0.045, 0.14);
  head.add(upperLip, lowerLip);

  // 3D Eyes (Sockets, Sclera, Colored Irises with hunter spark, Pupils)
  const eyeY = 0.07;
  const eyeZ = 0.138;
  const eyeSpacing = 0.058;

  // Left Eye
  const leftEyeGroup = new THREE.Group();
  leftEyeGroup.position.set(-eyeSpacing, eyeY, eyeZ);
  const leftSclera = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), scleraMat);
  leftSclera.scale.set(1.2, 0.75, 1);
  const leftIris = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), irisMat);
  leftIris.position.set(0, 0, 0.021);
  const leftPupil = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 8), pupilMat);
  leftPupil.position.set(0, 0, 0.022);
  leftEyeGroup.add(leftSclera, leftIris, leftPupil);

  // Right Eye
  const rightEyeGroup = new THREE.Group();
  rightEyeGroup.position.set(eyeSpacing, eyeY, eyeZ);
  const rightSclera = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), scleraMat);
  rightSclera.scale.set(1.2, 0.75, 1);
  const rightIris = new THREE.Mesh(new THREE.CircleGeometry(0.012, 10), irisMat);
  rightIris.position.set(0, 0, 0.021);
  const rightPupil = new THREE.Mesh(new THREE.CircleGeometry(0.0055, 8), pupilMat);
  rightPupil.position.set(0, 0, 0.022);
  rightEyeGroup.add(rightSclera, rightIris, rightPupil);

  head.add(leftEyeGroup, rightEyeGroup);

  // Sculpted Eyebrows
  const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.014, 0.02), browMat);
  leftBrow.position.set(-eyeSpacing, eyeY + 0.028, eyeZ + 0.01);
  leftBrow.rotation.z = -0.15;
  const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.014, 0.02), browMat);
  rightBrow.position.set(eyeSpacing, eyeY + 0.028, eyeZ + 0.01);
  rightBrow.rotation.z = 0.15;
  head.add(leftBrow, rightBrow);

  // Ears
  const leftEar = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.075, 0.04), skinMat);
  leftEar.position.set(-0.16, 0.05, -0.02);
  leftEar.rotation.y = -0.25;
  const rightEar = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.075, 0.04), skinMat);
  rightEar.position.set(0.16, 0.05, -0.02);
  rightEar.rotation.y = 0.25;
  head.add(leftEar, rightEar);

  // 3D STYLED DARK FANTASY HAIR ("Midnight Wind")
  const hairGroup = new THREE.Group();
  hairGroup.name = 'StyledHair';

  // Hair Crown Cap
  const hairCrown = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 14), hairMat);
  hairCrown.position.set(0, 0.1, -0.02);
  hairCrown.scale.set(0.96, 1.05, 1.05);
  hairGroup.add(hairCrown);

  // Front Swept Bangs / Fringe framing forehead & eyes
  const fringeTufts = [
    { pos: [-0.07, 0.14, 0.14], rot: [0.3, 0.2, -0.4], scale: [0.035, 0.12, 0.02] },
    { pos: [-0.02, 0.15, 0.16], rot: [0.35, 0.05, -0.15], scale: [0.038, 0.14, 0.02] },
    { pos: [0.04, 0.14, 0.15], rot: [0.3, -0.15, 0.2], scale: [0.035, 0.13, 0.02] },
    { pos: [0.09, 0.13, 0.13], rot: [0.25, -0.25, 0.45], scale: [0.032, 0.11, 0.02] },
    // Side locks framing temples
    { pos: [-0.15, 0.08, 0.06], rot: [0.1, 0.1, -0.3], scale: [0.028, 0.16, 0.04] },
    { pos: [0.15, 0.08, 0.06], rot: [0.1, -0.1, 0.3], scale: [0.028, 0.16, 0.04] },
    // Crown spikes / texture
    { pos: [-0.08, 0.24, -0.02], rot: [0.1, 0.2, -0.3], scale: [0.045, 0.1, 0.045] },
    { pos: [0.02, 0.26, -0.04], rot: [-0.15, 0, 0.1], scale: [0.05, 0.12, 0.05] },
    { pos: [0.08, 0.23, -0.03], rot: [0.1, -0.2, 0.3], scale: [0.045, 0.1, 0.045] },
    { pos: [0, 0.22, -0.12], rot: [-0.35, 0, 0], scale: [0.06, 0.14, 0.06] }
  ];

  fringeTufts.forEach((tuft) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 4), hairMat);
    m.position.set(...tuft.pos);
    m.rotation.set(...tuft.rot);
    m.scale.set(...tuft.scale);
    hairGroup.add(m);
  });
  head.add(hairGroup);

  // 3. ARMS, PAULDRONS & WEAPON
  // RIGHT ARM (Sword Hand)
  const rightShoulder = new THREE.Group();
  rightShoulder.name = 'RightShoulder';
  rightShoulder.position.set(0.32, 0.32, 0);
  chest.add(rightShoulder);

  // Heavy Articulated Steel Pauldron with Runic Engraving
  const rightPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.28), steelArmorMat);
  rightPauldron.position.set(0.04, 0.06, 0);
  rightPauldron.rotation.z = -0.3;
  rightPauldron.castShadow = true;
  const pauldronRune = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.29), runeGlowMat);
  pauldronRune.position.set(0.04, 0.06, 0);
  pauldronRune.rotation.z = -0.3;
  rightShoulder.add(rightPauldron, pauldronRune);

  const rightUpperArm = new THREE.Group();
  rightUpperArm.name = 'RightUpperArm';
  rightUpperArm.position.y = -0.04;
  rightShoulder.add(rightUpperArm);

  const rArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.28, 8), coatFabricMat);
  rArmMesh.position.y = -0.14;
  rArmMesh.castShadow = true;
  rightUpperArm.add(rArmMesh);

  const rightForearm = new THREE.Group();
  rightForearm.name = 'RightForearm';
  rightForearm.position.y = -0.28;
  rightUpperArm.add(rightForearm);

  // Vambrace / Forearm guard
  const rVambrace = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.065, 0.26, 8), leatherMat);
  rVambrace.position.y = -0.13;
  rVambrace.castShadow = true;
  const rVambracePlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.15), steelArmorMat);
  rVambracePlate.position.set(0.05, -0.13, 0);
  rightForearm.add(rVambrace, rVambracePlate);

  const rightHand = new THREE.Group();
  rightHand.name = 'RightHand';
  rightHand.position.y = -0.26;
  rightForearm.add(rightHand);

  // Tactical Glove Hand
  const rGlove = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.06), leatherMat);
  rGlove.position.y = -0.05;
  rGlove.castShadow = true;
  const rKnuckles = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.03, 0.04), steelArmorMat);
  rKnuckles.position.set(0, -0.05, 0.025);
  rightHand.add(rGlove, rKnuckles);

  // ORIGINAL 3D WEAPON: "Nightfall Cleaver" Longsword
  const weaponSocket = new THREE.Group();
  weaponSocket.name = 'WeaponSocket';
  weaponSocket.position.set(0, -0.08, 0.04);
  rightHand.add(weaponSocket);

  const swordGroup = new THREE.Group();
  swordGroup.name = 'NightfallCleaver';

  // Steel Pommel (Octahedral counterweight with gem)
  const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), steelArmorMat);
  pommel.position.y = -0.22;
  const pommelGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.02), runeGlowMat);
  pommelGem.position.y = -0.22;
  swordGroup.add(pommel, pommelGem);

  // Cord-Wrapped Grip Handle
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.22, 8), leatherMat);
  grip.position.y = -0.1;
  swordGroup.add(grip);

  // Winged Iron Crossguard
  const guardCenter = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.07), steelArmorMat);
  guardCenter.position.y = 0.02;
  const guardWingL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.05), steelArmorMat);
  guardWingL.position.set(-0.1, 0.04, 0);
  guardWingL.rotation.z = -0.2;
  const guardWingR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.05), steelArmorMat);
  guardWingR.position.set(0.1, 0.04, 0);
  guardWingR.rotation.z = 0.2;
  swordGroup.add(guardCenter, guardWingL, guardWingR);

  // 95cm Double-Edged Runic Blade
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.88, 0.018), bladeSteelMat);
  blade.position.y = 0.48;
  blade.castShadow = true;

  // Blade Fuller Channel with Glowing Purple Runes
  const bladeRune = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.76, 0.006), runeGlowMat);
  bladeRune.position.y = 0.48;

  // Blade Tapered Tip
  const bladeTip = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.12, 4), bladeSteelMat);
  bladeTip.position.y = 0.96;
  bladeTip.rotation.y = Math.PI / 4;

  swordGroup.add(blade, bladeRune, bladeTip);
  weaponSocket.add(swordGroup);

  // LEFT ARM (Offhand Balance & Fist)
  const leftShoulder = new THREE.Group();
  leftShoulder.name = 'LeftShoulder';
  leftShoulder.position.set(-0.32, 0.32, 0);
  chest.add(leftShoulder);

  // Studded Leather Shoulder Guard
  const leftPauldron = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.24), leatherMat);
  leftPauldron.position.set(-0.04, 0.05, 0);
  leftPauldron.rotation.z = 0.25;
  leftPauldron.castShadow = true;
  leftShoulder.add(leftPauldron);

  const leftUpperArm = new THREE.Group();
  leftUpperArm.name = 'LeftUpperArm';
  leftUpperArm.position.y = -0.04;
  leftShoulder.add(leftUpperArm);

  const lArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.28, 8), coatFabricMat);
  lArmMesh.position.y = -0.14;
  lArmMesh.castShadow = true;
  leftUpperArm.add(lArmMesh);

  const leftForearm = new THREE.Group();
  leftForearm.name = 'LeftForearm';
  leftForearm.position.y = -0.28;
  leftUpperArm.add(leftForearm);

  const lVambrace = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.065, 0.26, 8), leatherMat);
  lVambrace.position.y = -0.13;
  lVambrace.castShadow = true;
  leftForearm.add(lVambrace);

  const leftHand = new THREE.Group();
  leftHand.name = 'LeftHand';
  leftHand.position.y = -0.26;
  leftForearm.add(leftHand);

  const lGlove = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.06), leatherMat);
  lGlove.position.y = -0.05;
  lGlove.castShadow = true;
  leftHand.add(lGlove);

  // 4. UTILITY BELT & COAT TAILS
  const beltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.09, 0.32), leatherMat);
  beltMesh.position.y = 0.02;
  const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.03), steelArmorMat);
  beltBuckle.position.set(0, 0.02, 0.17);
  // Pouches
  const pouchL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.06), leatherMat);
  pouchL.position.set(-0.24, 0.01, 0.04);
  const pouchR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.06), leatherMat);
  pouchR.position.set(0.24, 0.01, 0.04);
  hips.add(beltMesh, beltBuckle, pouchL, pouchR);

  // Flowing Trenchcoat Skirt Tails (Left & Right)
  const coatTailLeft = new THREE.Group();
  coatTailLeft.name = 'CoatTailLeft';
  coatTailLeft.position.set(-0.14, 0.0, -0.16);
  const tailMeshL = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.85), coatFabricMat);
  tailMeshL.position.y = -0.42;
  tailMeshL.material.side = THREE.DoubleSide;
  coatTailLeft.add(tailMeshL);

  const coatTailRight = new THREE.Group();
  coatTailRight.name = 'CoatTailRight';
  coatTailRight.position.set(0.14, 0.0, -0.16);
  const tailMeshR = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.85), coatFabricMat);
  tailMeshR.position.y = -0.42;
  tailMeshR.material.side = THREE.DoubleSide;
  coatTailRight.add(tailMeshR);

  hips.add(coatTailLeft, coatTailRight);

  // 5. LEGS & COMBAT BOOTS
  // LEFT LEG
  const leftThigh = new THREE.Group();
  leftThigh.name = 'LeftThigh';
  leftThigh.position.set(-0.16, -0.05, 0);
  hips.add(leftThigh);

  const lThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.44, 8), trousersMat);
  lThighMesh.position.y = -0.22;
  lThighMesh.castShadow = true;
  leftThigh.add(lThighMesh);

  const leftCalf = new THREE.Group();
  leftCalf.name = 'LeftCalf';
  leftCalf.position.y = -0.44;
  leftThigh.add(leftCalf);

  // Knee Guard
  const lKnee = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.06), steelArmorMat);
  lKnee.position.set(0, 0, 0.08);
  leftCalf.add(lKnee);

  // Combat Boot Shaft
  const lBootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.09, 0.38, 8), leatherMat);
  lBootShaft.position.y = -0.18;
  lBootShaft.castShadow = true;

  // Lugged Sole Foot
  const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.26), leatherMat);
  lFoot.position.set(0, -0.4, 0.05);
  lFoot.castShadow = true;
  const lSole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.28), rubberMat);
  lSole.position.set(0, -0.45, 0.05);
  const lToePlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.06), steelArmorMat);
  lToePlate.position.set(0, -0.4, 0.16);

  leftCalf.add(lBootShaft, lFoot, lSole, lToePlate);

  // RIGHT LEG
  const rightThigh = new THREE.Group();
  rightThigh.name = 'RightThigh';
  rightThigh.position.set(0.16, -0.05, 0);
  hips.add(rightThigh);

  const rThighMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.44, 8), trousersMat);
  rThighMesh.position.y = -0.22;
  rThighMesh.castShadow = true;
  rightThigh.add(rThighMesh);

  const rightCalf = new THREE.Group();
  rightCalf.name = 'RightCalf';
  rightCalf.position.y = -0.44;
  rightThigh.add(rightCalf);

  // Knee Guard
  const rKnee = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.06), steelArmorMat);
  rKnee.position.set(0, 0, 0.08);
  rightCalf.add(rKnee);

  // Combat Boot Shaft
  const rBootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.09, 0.38, 8), leatherMat);
  rBootShaft.position.y = -0.18;
  rBootShaft.castShadow = true;

  // Lugged Sole Foot
  const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.26), leatherMat);
  rFoot.position.set(0, -0.4, 0.05);
  rFoot.castShadow = true;
  const rSole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.28), rubberMat);
  rSole.position.set(0, -0.45, 0.05);
  const rToePlate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.06), steelArmorMat);
  rToePlate.position.set(0, -0.4, 0.16);

  rightCalf.add(rBootShaft, rFoot, rSole, rToePlate);

  return root;
}

// Export as GLB file if run as script
const model = buildKaelCharacterModel();
const exporter = new GLTFExporter();
exporter.parse(
  model,
  (glb) => {
    const outPath = path.resolve('public/models/kael.glb');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, Buffer.from(glb));
    console.log(`✨ Successfully generated premium character model: ${outPath} (${fs.statSync(outPath).size} bytes)`);
  },
  (err) => console.error('Error generating GLB:', err),
  { binary: true }
);
