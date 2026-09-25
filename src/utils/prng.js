// -------------------------------------------------------------
// SHADOW ASCENSION - DETERMINISTIC PRNG (Mulberry32)
// Generates reproducible random numbers from a 32-bit integer seed
// -------------------------------------------------------------

export function createPrng(initialSeed = 1337) {
  let s = Math.abs(Math.floor(Number(initialSeed) || 1337)) >>> 0;
  if (s === 0) s = 1337;

  function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    seed: s,
    random: next,
    randFloat: (min, max) => min + next() * (max - min),
    randInt: (min, max) => Math.floor(min + next() * (max - min + 1)),
    choice: (arr) => (arr && arr.length > 0 ? arr[Math.floor(next() * arr.length)] : null),
    shuffle: (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
  };
}

export function generateSeed() {
  return (Math.floor(Math.random() * 900000) + 100000) >>> 0;
}
