// -------------------------------------------------------------
// SHADOW ASCENSION - REALISTIC 3D MONSTER GLB EXPORTER SCRIPT
// Generates binary .glb files for all 6 original dark fantasy monsters:
// 1. ash_goblin.glb
// 2. grave_soldier.glb
// 3. void_archer.glb
// 4. blood_knight.glb
// 5. grave_warlord.glb
// 6. abyss_warden.glb
// -------------------------------------------------------------

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildAshGoblinModel,
  buildGraveSoldierModel,
  buildVoidArcherModel,
  buildBloodKnightModel,
  buildGraveWarlordModel,
  buildAbyssWardenModel
} from '../src/game/enemies/MonsterModelBuilder.js';

// Polyfill FileReader for Node.js
global.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
    });
  }
};

const monsters = [
  { name: 'ash_goblin', builder: buildAshGoblinModel },
  { name: 'grave_soldier', builder: buildGraveSoldierModel },
  { name: 'void_archer', builder: buildVoidArcherModel },
  { name: 'blood_knight', builder: buildBloodKnightModel },
  { name: 'grave_warlord', builder: buildGraveWarlordModel },
  { name: 'abyss_warden', builder: buildAbyssWardenModel }
];

const outDir = path.resolve('public/models');
fs.mkdirSync(outDir, { recursive: true });

const exporter = new GLTFExporter();

for (const m of monsters) {
  const { root } = m.builder();
  await new Promise((resolve, reject) => {
    exporter.parse(
      root,
      (glb) => {
        const filePath = path.join(outDir, `${m.name}.glb`);
        fs.writeFileSync(filePath, Buffer.from(glb));
        console.log(`✨ Generated ${m.name}.glb (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
        resolve();
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

console.log('🎉 All 6 monster 3D GLB models generated successfully!');
