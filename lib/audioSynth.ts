/**
 * Autonomous Procedural Web Audio API Synthesizer
 * Produces quantum-themed sound effects and continuous zero-point ambient drone
 * without external audio files.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private droneLFO: OscillatorNode | null = null;

  constructor() {
    // Lazily initialized on first user gesture to comply with browser autoplay policies
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const targetGain = muted ? 0 : 0.35;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Starts or restarts the 54 Hz Zero-Point Drone with slow chorus/LFO modulation
   */
  public startZeroPointDrone() {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    if (this.droneOsc) {
      try {
        this.droneOsc.stop();
        this.droneOsc.disconnect();
      } catch {
        // ignore
      }
    }

    this.droneGain = ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.08, ctx.currentTime);

    // 54 Hz fundamental sine drone
    this.droneOsc = ctx.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.setValueAtTime(54, ctx.currentTime);

    // LFO for subtle subatomic pulse (0.2 Hz)
    this.droneLFO = ctx.createOscillator();
    this.droneLFO.type = 'sine';
    this.droneLFO.frequency.setValueAtTime(0.2, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);

    this.droneLFO.connect(lfoGain);
    lfoGain.connect(this.droneOsc.frequency);

    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    this.droneOsc.start();
    this.droneLFO.start();
  }

  /**
   * Exponential frequency sweep triggered during scale transitions (Warp sweep)
   */
  public playScaleWarpSweep(direction: 'in' | 'out' = 'in') {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';

    const now = ctx.currentTime;
    const duration = 0.65;

    // Filter to give deep sci-fi warp resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(4.0, now);

    if (direction === 'in') {
      // Ascending warp 180 Hz -> 880 Hz
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + duration);
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(2400, now + duration);
    } else {
      // Descending warp 880 Hz -> 140 Hz
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + duration);
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Quantum Leap chime (880 Hz pure sine with crystal decay)
   */
  public playQuantumLeapChime() {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  /**
   * Quark Triad Harmonic Chords (432 Hz, 540 Hz, 648 Hz color charge state)
   */
  public playQuarkTriadTone() {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const freqs = [432, 540, 648];
    const now = ctx.currentTime;
    const duration = 0.55;

    freqs.forEach((freq, idx) => {
      if (!ctx || !this.masterGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.08 + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + idx * 0.04);
      osc.stop(now + duration);
    });
  }

  /**
   * String Theory Harmonic Overtone Series: f_n = f_0 * n (f_0 = 110 Hz)
   */
  public playStringHarmonic(mode: number = 1) {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const f0 = 110;
    const fundamental = f0 * mode;
    const now = ctx.currentTime;
    const duration = 0.9;

    // Harmonic overtone synthesis with fundamental + subtle 2nd and 3rd harmonics
    [1, 2, 3].forEach((h) => {
      if (!ctx || !this.masterGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = h === 1 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(fundamental * h, now);

      const amp = (0.2 / h);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Live Beta Decay weak force burst sound effect (quantum glitch + W- boson decay)
   */
  public playBetaDecayBurst() {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    const duration = 0.8;

    // Glitch noise burst
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseFilter.Q.setValueAtTime(6, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);

    // Deep sub bass impact (W- boson transition)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(160, now + 0.05);
    subOsc.frequency.exponentialRampToValueAtTime(42, now + duration);

    subGain.gain.setValueAtTime(0.3, now + 0.05);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(now + 0.05);
    subOsc.stop(now + duration);
  }

  /**
   * Subtle click / hover feedback
   */
  public playClick(pitch: number = 1200) {
    const ctx = this.initContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }
}

export const audioSynth = new AudioSynthesizer();
