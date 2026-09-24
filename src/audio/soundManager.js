// Web Audio API Synthesized Sound Manager
// High-energy anime RPG sound effects generated natively in the browser!

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.7;
    this.initAudio = this.initAudio.bind(this);
  }

  initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  setMuted(muted) {
    this.muted = muted;
  }

  // Basic slash / dagger swing
  playSlash() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // White noise burst for blade whoosh
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(2400, t + 0.1);
    noiseFilter.Q.setValueAtTime(3, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * this.volume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);

    // Blade tonal ring
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.12);

    gain.gain.setValueAtTime(0.25 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Heavy Impact / Critical hit
  playHit(isCrit = false) {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isCrit ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isCrit ? 160 : 120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + (isCrit ? 0.25 : 0.15));

    gain.gain.setValueAtTime((isCrit ? 0.6 : 0.35) * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isCrit ? 0.28 : 0.16));

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + (isCrit ? 0.3 : 0.18));

    if (isCrit) {
      // High frequency metallic snap
      const snap = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snap.type = 'sine';
      snap.frequency.setValueAtTime(1200, t);
      snap.frequency.exponentialRampToValueAtTime(300, t + 0.1);
      snapGain.gain.setValueAtTime(0.3 * this.volume, t);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      snap.connect(snapGain);
      snapGain.connect(this.ctx.destination);
      snap.start(t);
      snap.stop(t + 0.1);
    }
  }

  // Dash / Phantom Step
  playDash() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.22);

    gain.gain.setValueAtTime(0.35 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Shadow Slash (Q Skill)
  playShadowSlash() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.28);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(700, t);
    osc2.frequency.exponentialRampToValueAtTime(150, t + 0.28);

    gain.gain.setValueAtTime(0.45 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.32);
    osc2.stop(t + 0.32);
  }

  // Void Burst (E Skill)
  playVoidBurst() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.4);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(90, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.5);

    gain.gain.setValueAtTime(0.6 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.52);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    sub.start(t);
    osc.stop(t + 0.55);
    sub.stop(t + 0.55);
  }

  // Eclipse Dominion (R Ultimate)
  playUltimate() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Layered dark chord
    const freqs = [65.4, 98.0, 130.8, 196.0, 261.6]; // C dark chord
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.3);
      osc.frequency.exponentialRampToValueAtTime(f * 0.6, t + 1.1);

      g.gain.setValueAtTime(0.18 * this.volume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 1.25);
    });
  }

  // Shadow Extraction ritual sound
  playExtraction() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Ascending mysterious harmonics
    const notes = [220, 277.18, 329.63, 415.3, 554.37, 659.25];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startT = t + i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startT + 0.4);

      gain.gain.setValueAtTime(0.001, startT);
      gain.gain.linearRampToValueAtTime(0.2 * this.volume, startT + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startT);
      osc.stop(startT + 0.5);
    });
  }

  // Level Up Fanfare
  playLevelUp() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [
      { f: 392.00, time: 0.0 }, // G4
      { f: 523.25, time: 0.1 }, // C5
      { f: 659.25, time: 0.2 }, // E5
      { f: 783.99, time: 0.3 }, // G5
      { f: 1046.50, time: 0.45 } // C6
    ];

    chords.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + note.time;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, noteTime);

      gain.gain.setValueAtTime(0.25 * this.volume, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
    });
  }

  // Loot pickup
  playLoot() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0.2 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  // UI Button Click
  playClick() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.05);

    gain.gain.setValueAtTime(0.15 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Boss Roar / Telegraph
  playBossRoar() {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.4);
    osc.frequency.exponentialRampToValueAtTime(40, t + 1.2);

    gain.gain.setValueAtTime(0.5 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 1.25);
  }

  // Surface-Aware Footstep Synthesizer (Stone, Water Puddle, Wood Bridge)
  playFootstep(surface = 'stone') {
    if (this.muted) return;
    this.initAudio();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (surface === 'water') {
      // Wet splash sound
      const splash = this.ctx.createOscillator();
      const splashGain = this.ctx.createGain();
      splash.type = 'triangle';
      splash.frequency.setValueAtTime(320, t);
      splash.frequency.exponentialRampToValueAtTime(120, t + 0.08);

      splashGain.gain.setValueAtTime(0.2 * this.volume, t);
      splashGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      splash.connect(splashGain);
      splashGain.connect(this.ctx.destination);
      splash.start(t);
      splash.stop(t + 0.1);
    } else {
      // Heavy stone / boot heel strike
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.06);

      gain.gain.setValueAtTime(0.18 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);

      // Fine grit / dust scuff
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.2;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const nFilter = this.ctx.createBiquadFilter();
      nFilter.type = 'bandpass';
      nFilter.frequency.setValueAtTime(1400, t);
      nFilter.Q.setValueAtTime(2, t);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.06 * this.volume, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(t);
    }
  }
}

export const sound = new SoundManager();
