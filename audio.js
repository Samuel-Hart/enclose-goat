// audio.js - Procedural Web Audio API Synthesizer for enclose.goat
// No external assets required: realistic goat bleats, woody thuds, cosmic portals, and comical escapes!

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio not supported", e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // Comical and surprisingly convincing goat bleat using formant filtering + vibrato
  playBleat(type = 'normal') {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = type === 'triumphant' ? 0.75 : type === 'smug' ? 0.5 : 0.6;
    const baseFreq = type === 'triumphant' ? 240 : type === 'baby' ? 320 : 190;

    // Carrier Oscillator (sawtooth + triangle for rich animal timbre)
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, t);
    // pitch swoop
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.15, t + dur * 0.3);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, t + dur);

    // Vibrato (the goat flutter "ba-a-a-ah")
    const vibrato = this.ctx.createOscillator();
    vibrato.frequency.setValueAtTime(14, t); // 14 Hz goat tremble
    const vibGain = this.ctx.createGain();
    vibGain.gain.setValueAtTime(baseFreq * 0.12, t);
    vibrato.connect(osc.frequency);
    vibrato.start(t);
    vibrato.stop(t + dur);

    // Formant Bandpass Filters (simulates mammalian throat and nasal cavity)
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(750, t);
    f1.Q.setValueAtTime(4.0, t);

    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(1800, t);
    f2.Q.setValueAtTime(3.5, t);

    // Gain envelope
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, t);
    gainNode.gain.linearRampToValueAtTime(0.28, t + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.2, t + dur * 0.6);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(gainNode);
    f2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + dur);
  }

  // Wooden fence placement "thwack / clatter"
  playPlaceFence() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);

    // Add wooden click snap
    this.playNoiseClick(t, 0.04, 1200, 0.15);
  }

  // Fence removal sound
  playRemoveFence() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.07);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);

    this.playNoiseClick(t, 0.03, 800, 0.1);
  }

  // Light grass hoofstep
  playFootstep() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const pitch = 140 + Math.random() * 40;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.04);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Wood munching sound
  playCrunch() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      this.playNoiseClick(t + i * 0.07, 0.05, 1400 + i * 200, 0.2);
    }
  }

  // Headbutt explosion / wood shatter
  playSmash() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Heavy impact thud
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);

    // Splinter noise crash
    this.playNoiseClick(t, 0.35, 2400, 0.4);
  }

  // Interdimensional Portal cosmic vortex sound
  playPortalDrone() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(80, t);
    osc1.frequency.linearRampToValueAtTime(220, t + 1.2);
    osc2.frequency.setValueAtTime(82, t);
    osc2.frequency.linearRampToValueAtTime(224, t + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(1400, t + 1.2);
    filter.Q.setValueAtTime(5.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 1.3);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 1.3);
    osc2.stop(t + 1.3);
  }

  // Portal exit whoosh & magical chime
  playPortalWoosh() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C E G C arpeggio chime
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.35);
    });
  }

  // Pole vault boing
  playBoing() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.28);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Mole goat dirt digging
  playDig() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      this.playNoiseClick(t + i * 0.08, 0.06, 600, 0.25);
    }
  }

  // Quantum tunnel glitch
  playGlitch() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(200 + Math.random() * 800, t + i * 0.04);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.04 + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.035);
    }
  }

  // Comical despair buzzer / trombone when farmer loses (which is always!)
  playFarmerDespair() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [311.13, 293.66, 277.18, 261.63]; // Eb, D, Db, C descending trombone
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.16);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t + idx * 0.16);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, t + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.16 + (idx === 3 ? 0.45 : 0.15));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.16);
      osc.stop(t + idx * 0.16 + (idx === 3 ? 0.45 : 0.15));
    });
  }

  // Helper noise generator
  playNoiseClick(startTime, duration, filterFreq, volume) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.Q.setValueAtTime(1.5, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }
}

window.soundEngine = new SoundEngine();
