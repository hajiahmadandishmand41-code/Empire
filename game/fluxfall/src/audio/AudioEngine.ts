export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicTimer: number | null = null;
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.master) this.master.gain.value = enabled ? 0.12 : 0;
  }

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.12;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  blip(frequency: number, duration = 0.06, type: OscillatorType = 'sine', volume = 0.25): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  dash(): void { this.blip(180, 0.12, 'sawtooth', 0.18); this.blip(520, 0.09, 'triangle', 0.12); }
  pickup(): void { this.blip(680, 0.055, 'square', 0.10); }
  hit(): void { this.blip(90, 0.1, 'square', 0.16); }
  ability(): void { this.blip(260, 0.16, 'triangle', 0.20); this.blip(780, 0.24, 'sine', 0.15); }
  boss(): void { this.blip(110, 0.28, 'sawtooth', 0.18); this.blip(70, 0.42, 'square', 0.12); }
  win(): void { [440, 554, 659, 880].forEach((f, i) => window.setTimeout(() => this.blip(f, 0.16, 'triangle', 0.14), i * 90)); }

  startMusic(): void {
    if (this.musicTimer !== null) return;
    let step = 0;
    this.musicTimer = window.setInterval(() => {
      if (!this.enabled) return;
      const notes = [110, 138.59, 164.81, 196];
      this.blip(notes[step % notes.length], 0.12, 'sine', 0.045);
      step += 1;
    }, 520);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}
