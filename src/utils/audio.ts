/**
 * Synthesizes pure Web Audio API tones so no external audio assets are required.
 * Gracefully handles blocked audio contexts and user mute preferences.
 */
class SoundService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('indiantimers_mute');
      if (storedMute) this.isMuted = storedMute === 'true';
      const storedVol = localStorage.getItem('indiantimers_volume');
      if (storedVol) this.volume = parseFloat(storedVol);
    }
  }

  private initContext() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
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

  /**
   * Harmonious three-bell chime for Pomodoro focus session completion
   */
  public playSessionComplete() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0, now + idx * 0.14);
      gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + idx * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.85);
    });
  }

  /**
   * Distinct dual-tone notification for mock test alert (e.g. 30m or 5m remaining)
   */
  public playWarningAlert() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [440, 554.37].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.2);

      gain.gain.setValueAtTime(0, now + idx * 0.2);
      gain.gain.linearRampToValueAtTime(0.35 * this.volume, now + idx * 0.2 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.2 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.2);
      osc.stop(now + idx * 0.2 + 0.5);
    });
  }

  /**
   * Subtle click for stopwatch lap
   */
  public playLapTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.15 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const soundService = new SoundService();
