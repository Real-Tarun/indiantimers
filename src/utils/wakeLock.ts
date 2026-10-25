/**
 * IndianTimers Universal Screen Wake Lock Engine
 * 
 * Prevents screens from sleeping / dimming / turning off during long mock exams,
 * pomodoro focus loops, stopwatches, and fullscreen countdown clocks (just like YouTube videos).
 * 
 * Features:
 * 1. Primary: Native W3C Screen Wake Lock API (`navigator.wakeLock.request('screen')`).
 * 2. Tab Visibility Recovery: Automatically re-acquires wake lock when the user switches tabs
 *    and returns (native wake locks are automatically released when visibilityState becomes hidden).
 * 3. YouTube-Style Silent Media Fallback: Invisible, muted, zero-overhead looping media stream
 *    for browsers/devices that restrict or lack the native Wake Lock API.
 * 4. Safe SSR / Node.js execution: No-op during Astro static generation or server builds.
 */

type WakeLockListener = (isActive: boolean) => void;

class WakeLockService {
  private sentinel: any = null;
  private isRequested: boolean = false;
  private isEnabledByUser: boolean = true;
  private listeners: Set<WakeLockListener> = new Set();
  private fallbackVideo: HTMLVideoElement | null = null;
  private requestCount: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('indiantimers_screen_wake_lock');
        if (stored !== null) {
          this.isEnabledByUser = stored === 'true';
        }
      } catch {
        // localStorage restricted
      }

      // Automatically re-request wake lock when returning to tab
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isRequested && this.isEnabledByUser) {
          this.reacquire();
        }
      });
    }
  }

  /**
   * Check if native or fallback screen wake lock is supported
   */
  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'wakeLock' in navigator || typeof document !== 'undefined';
  }

  /**
   * Check if wake lock is currently active
   */
  public isActive(): boolean {
    return this.isRequested && this.isEnabledByUser && (this.sentinel !== null || this.fallbackVideo !== null);
  }

  /**
   * Check if user has globally enabled or disabled wake lock
   */
  public isEnabled(): boolean {
    return this.isEnabledByUser;
  }

  /**
   * Allow user to toggle wake lock behavior
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabledByUser = enabled;
    try {
      localStorage.setItem('indiantimers_screen_wake_lock', String(enabled));
    } catch {}

    if (!enabled) {
      this.releaseNativeAndFallback();
    } else if (this.isRequested) {
      this.reacquire();
    }
    this.notify();
  }

  /**
   * Acquire a screen wake lock to keep the display active
   */
  public async acquire(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    this.requestCount++;
    this.isRequested = true;

    if (!this.isEnabledByUser) {
      return false;
    }

    return this.applyLock();
  }

  /**
   * Release a previously acquired wake lock
   */
  public release(): void {
    if (typeof window === 'undefined') return;

    this.requestCount = Math.max(0, this.requestCount - 1);
    if (this.requestCount === 0) {
      this.isRequested = false;
      this.releaseNativeAndFallback();
      this.notify();
    }
  }

  /**
   * Force full release regardless of request count (e.g. on test finish or reset)
   */
  public forceRelease(): void {
    if (typeof window === 'undefined') return;
    this.requestCount = 0;
    this.isRequested = false;
    this.releaseNativeAndFallback();
    this.notify();
  }

  /**
   * Subscribe to wake lock status changes
   */
  public subscribe(listener: WakeLockListener): () => void {
    this.listeners.add(listener);
    listener(this.isActive());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const active = this.isActive();
    this.listeners.forEach((fn) => {
      try {
        fn(active);
      } catch {}
    });
  }

  private async reacquire(): Promise<void> {
    if (!this.isRequested || !this.isEnabledByUser) return;
    await this.applyLock();
  }

  private async applyLock(): Promise<boolean> {
    let success = false;

    // 1. Try Native W3C Screen Wake Lock API
    if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
      try {
        if (!this.sentinel || this.sentinel.released) {
          const s = await (navigator as any).wakeLock.request('screen');
          this.sentinel = s;
          s.addEventListener('release', () => {
            if (this.sentinel === s) {
              this.sentinel = null;
              this.notify();
            }
          });
          success = true;
        } else {
          success = true;
        }
      } catch (err) {
        // Native wake lock can fail if low battery or permission denied.
        // Fall through to YouTube-style video fallback!
        this.sentinel = null;
      }
    }

    // 2. If native wake lock is not active, engage YouTube-style invisible looping video
    if (!success) {
      success = this.startFallbackVideo();
    }

    this.notify();
    return success;
  }

  /**
   * Invisible zero-footprint looping video fallback (like YouTube player).
   * Web browsers keep the operating system display active when media is actively playing.
   */
  private startFallbackVideo(): boolean {
    if (typeof document === 'undefined') return false;

    try {
      if (!this.fallbackVideo) {
        const vid = document.createElement('video');
        vid.setAttribute('playsinline', '');
        vid.setAttribute('webkit-playsinline', '');
        vid.muted = true;
        vid.loop = true;
        vid.style.position = 'fixed';
        vid.style.top = '-9999px';
        vid.style.left = '-9999px';
        vid.style.width = '1px';
        vid.style.height = '1px';
        vid.style.opacity = '0.001';
        vid.style.pointerEvents = 'none';
        vid.setAttribute('aria-hidden', 'true');

        // Generate tiny 1x1 blank canvas video stream if supported
        if (typeof HTMLCanvasElement !== 'undefined' && HTMLCanvasElement.prototype.captureStream) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const stream = canvas.captureStream(1); // 1 FPS, minimal CPU
            vid.srcObject = stream;
          } catch {
            vid.src = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAADpmcmVlAAAACm1kYXQAAAAAAAEAAABtYXZjQ0BEQAP/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEBAhEDEQY=';
          }
        } else {
          vid.src = 'data:video/mp4;base64,AAAAHGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAADpmcmVlAAAACm1kYXQAAAAAAAEAAABtYXZjQ0BEQAP/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEBAhEDEQY=';
        }

        document.body.appendChild(vid);
        this.fallbackVideo = vid;
      }

      const playPromise = this.fallbackVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Playback blocked until user gesture, or battery saver
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  private releaseNativeAndFallback(): void {
    if (this.sentinel) {
      try {
        this.sentinel.release();
      } catch {}
      this.sentinel = null;
    }

    if (this.fallbackVideo) {
      try {
        this.fallbackVideo.pause();
        this.fallbackVideo.srcObject = null;
        if (this.fallbackVideo.parentNode) {
          this.fallbackVideo.parentNode.removeChild(this.fallbackVideo);
        }
      } catch {}
      this.fallbackVideo = null;
    }
  }
}

export const wakeLockService = new WakeLockService();
