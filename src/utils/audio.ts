/**
 * IndianTimers High-Fidelity Audio Synthesizer Engine
 * 
 * Synthesizes pure Web Audio API tones so no external audio assets or downloads are required.
 * Handles modern browser Autoplay Policies, mobile iOS/Android audio context unlocking,
 * volume preferences, and customizable exam bells.
 */

export type SoundType = 'exam-bell' | 'digital-chime' | 'gong' | 'marimba';

class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private soundType: SoundType = 'exam-bell';
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('indiantimers_mute');
      if (storedMute) this.isMuted = storedMute === 'true';
      const storedVol = localStorage.getItem('indiantimers_volume');
      if (storedVol) this.volume = parseFloat(storedVol);
      const storedType = localStorage.getItem('indiantimers_sound_type');
      if (storedType && ['exam-bell', 'digital-chime', 'gong', 'marimba'].includes(storedType)) {
        this.soundType = storedType as SoundType;
      }

      // Proactively listen for first user interaction to unlock the AudioContext
      const unlockHandler = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
      };

      window.addEventListener('click', unlockHandler, { passive: true });
      window.addEventListener('touchstart', unlockHandler, { passive: true });
      window.addEventListener('keydown', unlockHandler, { passive: true });
    }
  }

  /**
   * Unlocks the Web Audio API context during a user gesture.
   * Plays a silent micro-buffer to satisfy iOS Safari & Chrome autoplay requirements.
   */
  public unlockAudio(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }

      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (!this.isUnlocked) {
          // Play a 1-sample silent buffer to unlock the hardware output
          const buffer = this.ctx.createBuffer(1, 1, 22050);
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(this.ctx.destination);
          source.start(0);
          this.isUnlocked = true;
        }
      }
    } catch {
      // Graceful fallback if audio is restricted in browser
    }
  }

  private initContext(): AudioContext | null {
    this.unlockAudio();
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('indiantimers_mute', String(muted));
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      localStorage.setItem('indiantimers_volume', String(this.volume));
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setSoundType(type: SoundType) {
    this.soundType = type;
    if (typeof window !== 'undefined') {
      localStorage.setItem('indiantimers_sound_type', type);
    }
  }

  public getSoundType(): SoundType {
    return this.soundType;
  }

  /**
   * Authentic Double-Strike Brass Examination Hall Bell
   * Designed to mirror traditional school/university warning and final bells.
   */
  public playExamBell(strikes: number = 2) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const baseNow = ctx.currentTime;
    const strikeInterval = 0.45;

    for (let s = 0; s < strikes; s++) {
      const strikeTime = baseNow + s * strikeInterval;

      // Realistic brass bell overtones: Fundamental + 2nd harmonic + partials
      const partials = [
        { freq: 440, gain: 0.5, decay: 1.8 },   // A4
        { freq: 880, gain: 0.35, decay: 1.4 },  // A5
        { freq: 1320, gain: 0.2, decay: 1.0 },  // E6
        { freq: 1760, gain: 0.15, decay: 0.8 }, // A6
      ];

      partials.forEach(({ freq, gain: partGain, decay }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, strikeTime);

        // Strike transient (attack)
        gainNode.gain.setValueAtTime(0, strikeTime);
        gainNode.gain.linearRampToValueAtTime(partGain * this.volume, strikeTime + 0.015);
        // Exponential ringing tail
        gainNode.gain.exponentialRampToValueAtTime(0.0001, strikeTime + decay);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(strikeTime);
        osc.stop(strikeTime + decay + 0.05);
      });
    }
  }

  /**
   * Digital Chime - Clean, modern electronic alert
   */
  public playDigitalChime() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6

    notes.forEach((freq, idx) => {
      const strikeTime = now + idx * 0.12;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, strikeTime);

      gainNode.gain.setValueAtTime(0, strikeTime);
      gainNode.gain.linearRampToValueAtTime(0.4 * this.volume, strikeTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 0.6);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(strikeTime);
      osc.stop(strikeTime + 0.65);
    });
  }

  /**
   * Resonant Gong / Tibetan Bowl - Deep focus & mindfulness
   */
  public playGong() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const tones = [
      { freq: 220, gain: 0.6, decay: 2.5 },
      { freq: 330, gain: 0.3, decay: 2.0 },
      { freq: 440, gain: 0.25, decay: 1.6 },
    ];

    tones.forEach(({ freq, gain: tGain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(tGain * this.volume, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  }

  /**
   * Marimba - Gentle melodic reminder
   */
  public playMarimba() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];

    notes.forEach((freq, idx) => {
      const strikeTime = now + idx * 0.1;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, strikeTime);

      gainNode.gain.setValueAtTime(0, strikeTime);
      gainNode.gain.linearRampToValueAtTime(0.35 * this.volume, strikeTime + 0.008);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 0.35);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(strikeTime);
      osc.stop(strikeTime + 0.4);
    });
  }

  /**
   * Plays the user's selected sound style for an alert
   */
  public playActiveSound(strikes: number = 2) {
    switch (this.soundType) {
      case 'digital-chime':
        this.playDigitalChime();
        break;
      case 'gong':
        this.playGong();
        break;
      case 'marimba':
        this.playMarimba();
        break;
      case 'exam-bell':
      default:
        this.playExamBell(strikes);
        break;
    }
  }

  /**
   * Warning Alert for Mock Test (30m or 5m remaining)
   */
  public playWarningAlert() {
    this.playActiveSound(2);
  }

  /**
   * Final Session Complete Bell (Mock Test / Pomodoro Concluded)
   */
  public playSessionComplete() {
    if (this.soundType === 'exam-bell') {
      this.playExamBell(3); // 3 long bell strikes for exam end
    } else {
      this.playActiveSound(3);
    }
  }

  /**
   * Subtle click for UI feedback or stopwatch lap
   */
  public playLapTick() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.12 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Quick confirmation feedback blip
   */
  public playFeedback() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now); // C6

    gain.gain.setValueAtTime(0.08 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Test Sound Preview
   */
  public testSound() {
    this.unlockAudio();
    this.playActiveSound(2);
  }
}

export const soundService = new SoundService();
