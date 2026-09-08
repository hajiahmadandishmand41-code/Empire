import type { Enemy, Particle, Pickup, Shot } from '../entities/Entities';
import { resetEnemy, steerEnemy, Player } from '../entities/Entities';
import { clamp, dateKey, distSq, hashSeed, seededRandom, type GameMode, type GameSnapshot, type RunSummary, type SaveData, type Vec2 } from '../core/types';
import { InputManager } from '../input/InputManager';
import { AudioEngine } from '../audio/AudioEngine';
import { SaveManager } from '../save/SaveManager';

export interface GameCallbacks {
  onState: (state: 'running' | 'paused' | 'gameover' | 'victory') => void;
  onSnapshot: (snapshot: GameSnapshot) => void;
  onMessage: (title: string, text: string) => void;
  onRunEnd: (summary: RunSummary, save: SaveData) => void;
  onHaptic: (pattern: number | number[]) => void;
}

const WIDTH = 1000;
const HEIGHT = 600;
const POOL_ENEMIES = 96;
const POOL_SHOTS = 120;
const POOL_PICKUPS = 100;
const POOL_PARTICLES = 500;

export class Game {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly input: InputManager;
  private readonly audio: AudioEngine;
  private readonly saveManager: SaveManager;
  private readonly player = new Player();
  private readonly enemies: Enemy[] = Array.from({ length: POOL_ENEMIES }, () => ({ active: false, kind: 'chaser', x: 0, y: 0, vx: 0, vy: 0, hp: 0, maxHp: 0, radius: 0, speed: 0, shootCd: 0, phase: 0 }));
  private readonly shots: Shot[] = Array.from({ length: POOL_SHOTS }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, radius: 0, life: 0 }));
  private readonly pickups: Pickup[] = Array.from({ length: POOL_PICKUPS }, () => ({ active: false, x: 0, y: 0, value: 0, phase: 0 }));
  private readonly particles: Particle[] = Array.from({ length: POOL_PARTICLES }, () => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, hue: 0 }));
  private readonly callbacks: GameCallbacks;
  private save: SaveData;
  private mode: GameMode = 'normal';
  private running = false;
  private paused = false;
  private ended = false;
  private raf = 0;
  private lastTime = 0;
  private accumulator = 0;
  private elapsed = 0;
  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private kills = 0;
  private wave = 0;
  private spawnTimer = 0;
  private waveTimer = 0;
  private bossId: Enemy | null = null;
  private rng = Math.random;
  private shake = 0;
  private hitFlash = 0;
  private stars = Array.from({ length: 90 }, (_, i) => ({ x: (i * 83) % WIDTH, y: (i * 47) % HEIGHT, speed: 8 + (i % 7) * 4 }));

  constructor(container: HTMLElement, callbacks: GameCallbacks) {
    this.callbacks = callbacks;
    this.saveManager = new SaveManager();
    this.save = this.saveManager.load();
    this.canvas = document.createElement('canvas');
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;
    this.canvas.className = 'game-canvas';
    container.appendChild(this.canvas);
    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D context is unavailable.');
    this.ctx = context;
    this.input = new InputManager(this.canvas);
    this.audio = new AudioEngine();
    this.audio.setEnabled(this.save.settings.sound);
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.input.dispose();
    this.audio.stopMusic();
    window.removeEventListener('resize', this.resize);
  }

  getSave(): SaveData { return this.save; }

  start(mode: GameMode = 'normal'): void {
    this.mode = mode;
    this.running = true;
    this.paused = false;
    this.ended = false;
    this.elapsed = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.kills = 0;
    this.wave = 0;
    this.spawnTimer = 0.2;
    this.waveTimer = 0;
    this.bossId = null;
    this.rng = mode === 'daily' ? seededRandom(hashSeed(`fluxfall:${dateKey()}`)) : Math.random;
    this.player.reset(100 + (this.save.unlockedModules.includes('vanguard') ? 25 : 0));
    this.clearPool(this.enemies);
    this.clearPool(this.shots);
    this.clearPool(this.pickups);
    this.clearPool(this.particles);
    this.callbacks.onState('running');
    this.callbacks.onMessage('FLUXFALL', mode === 'daily' ? 'Daily Shift: survive the seeded storm.' : 'Move, dash and chain kills. Overdrive when the meter is full.');
    this.audio.startMusic();
    cancelAnimationFrame(this.raf);
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  togglePause(): void {
    if (!this.running || this.ended) return;
    this.paused = !this.paused;
    this.callbacks.onState(this.paused ? 'paused' : 'running');
    if (!this.paused) this.lastTime = performance.now();
  }

  setSound(enabled: boolean): void {
    this.save.settings.sound = enabled;
    this.audio.setEnabled(enabled);
    this.saveManager.save(this.save);
  }

  setHaptics(enabled: boolean): void {
    this.save.settings.haptics = enabled;
    this.saveManager.save(this.save);
  }

  buyModule(id: string): boolean {
    const module = ['vanguard', 'magnet', 'pulse'].find(value => value === id);
    const cost = id === 'vanguard' ? 80 : id === 'magnet' ? 120 : 180;
    if (!module || this.save.unlockedModules.includes(module) || this.save.credits < cost) return false;
    this.save.credits -= cost;
    this.save.unlockedModules.push(module);
    this.saveManager.save(this.save);
    return true;
  }

  private readonly resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr * rect.width / WIDTH, 0, 0, dpr * rect.height / HEIGHT, 0, 0);
  };

  private readonly frame = (now: number): void => {
    if (!this.running) return;
    const delta = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    if (this.input.consumePause()) this.togglePause();
    if (!this.paused) {
      this.accumulator += delta;
      const step = 1 / 60;
      let guard = 0;
      while (this.accumulator >= step && guard < 4) {
        this.update(step);
        this.accumulator -= step;
        guard += 1;
      }
    }
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  private update(dt: number): void {
    this.elapsed += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.shake = Math.max(0, this.shake - dt);
    this.comboTimer = Math.max(0, this.comboTimer - dt);
    if (this.comboTimer === 0) this.combo = 0;

    const move = this.input.getMove();
    if (this.input.consumeDash() && this.player.dash(move)) {
      this.audio.dash();
      this.callbacks.onHaptic(12);
      this.emitBurst(this.player.position.x, this.player.position.y, 28, 195, 1.6);
    }
    if (this.input.consumeAbility() && this.player.flux >= this.player.maxFlux && this.player.abilityCooldown <= 0) {
      this.overdrive();
    }

    this.player.update(dt, move, WIDTH, HEIGHT);
    this.spawnTimer -= dt;
    this.waveTimer += dt;
    if (this.waveTimer > 22 || (this.wave === 0 && this.elapsed > 1.5)) {
      this.wave += 1;
      this.waveTimer = 0;
      this.callbacks.onMessage(`WAVE ${this.wave}`, this.wave % 5 === 0 ? 'ELITE SIGNAL — the Core Warden is inbound.' : 'Pressure rising. Keep the chain alive.');
      this.emitBurst(WIDTH / 2, HEIGHT / 2, 30, this.wave % 5 === 0 ? 42 : 190, 1.2);
      if (this.wave % 5 === 0) this.spawnBoss();
    }
    if (this.spawnTimer <= 0) {
      this.spawnWaveUnit();
      const intensity = 0.72 - Math.min(0.46, this.wave * 0.021);
      this.spawnTimer = Math.max(0.18, intensity);
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.phase += dt * 3;
      steerEnemy(enemy, this.player.position, dt);
      enemy.x = clamp(enemy.x, -90, WIDTH + 90);
      enemy.y = clamp(enemy.y, -90, HEIGHT + 90);
      if (enemy.kind === 'shooter' || enemy.kind === 'boss') {
        enemy.shootCd -= dt;
        if (enemy.shootCd <= 0) {
          this.fireEnemyShot(enemy);
          enemy.shootCd = enemy.kind === 'boss' ? 0.62 : 1.4;
        }
      }
      if (distSq(enemy, this.player.position) < (enemy.radius + this.player.radius) ** 2) {
        if (this.player.takeDamage(enemy.kind === 'boss' ? 22 : 14)) {
          this.hitFlash = 0.12;
          this.shake = 0.18;
          this.audio.hit();
          this.callbacks.onHaptic(35);
          this.emitBurst(this.player.position.x, this.player.position.y, 20, 7, 1.1);
          if (this.player.hp <= 0) {
            this.endRun(false);
            return;
          }
        }
      }
    }

    for (const shot of this.shots) {
      if (!shot.active) continue;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      shot.life -= dt;
      if (shot.life <= 0 || shot.x < -20 || shot.y < -20 || shot.x > WIDTH + 20 || shot.y > HEIGHT + 20) shot.active = false;
      else if (distSq(shot, this.player.position) < (shot.radius + this.player.radius) ** 2 && this.player.takeDamage(10)) {
        shot.active = false;
        this.hitFlash = 0.08;
        this.shake = 0.12;
        this.audio.hit();
        this.callbacks.onHaptic(25);
        this.emitBurst(this.player.position.x, this.player.position.y, 12, 8, 1);
        if (this.player.hp <= 0) { this.endRun(false); return; }
      }
    }

    for (const pickup of this.pickups) {
      if (!pickup.active) continue;
      pickup.phase += dt * 5;
      const radiusBoost = this.save.unlockedModules.includes('magnet') ? 1.45 : 1;
      if (distSq(pickup, this.player.position) < (40 * radiusBoost) ** 2) {
        pickup.active = false;
        const gain = pickup.value;
        this.player.flux = clamp(this.player.flux + gain, 0, this.player.maxFlux);
        this.score += Math.round(gain * 4 * Math.max(1, this.combo * 0.15));
        this.audio.pickup();
        this.emitBurst(pickup.x, pickup.y, 8, 188, 0.8);
      }
    }

    for (const particle of this.particles) {
      if (!particle.active) continue;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.05, dt);
      particle.vy *= Math.pow(0.05, dt);
      particle.life -= dt;
      if (particle.life <= 0) particle.active = false;
    }

    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      const d2 = distSq(enemy, this.player.position);
      if (d2 < 0) continue;
      // Dash contact is offensive: passing through enemies awards score.
      if (this.player.dashTimer > 0 && d2 < (enemy.radius + 34) ** 2) {
        this.damageEnemy(enemy, 70 + this.wave * 7, true);
      }
    }

    this.score += Math.floor(dt * (1 + this.combo * 0.2));
    this.callbacks.onSnapshot({
      score: this.score, wave: this.wave, combo: this.combo, multiplier: Math.max(1, Math.floor(1 + this.combo / 5)),
      hp: this.player.hp, maxHp: this.player.maxHp, flux: this.player.flux, maxFlux: this.player.maxFlux,
      kills: this.kills, bossHp: this.bossId?.active ? this.bossId.hp : null, bossMaxHp: this.bossId?.active ? this.bossId.maxHp : null, time: this.elapsed,
    });
  }

  private spawnWaveUnit(): void {
    const alive = this.enemies.reduce((count, enemy) => count + (enemy.active ? 1 : 0), 0);
    const cap = Math.min(55, 8 + this.wave * 2);
    if (alive >= cap) return;
    const edge = Math.floor(this.rng() * 4);
    const x = edge === 1 ? WIDTH + 40 : edge === 3 ? -40 : this.rng() * WIDTH;
    const y = edge === 0 ? -40 : edge === 2 ? HEIGHT + 40 : this.rng() * HEIGHT;
    const r = this.rng();
    const kind = this.wave >= 7 && r < 0.18 ? 'splitter' : r < 0.28 ? 'shooter' : 'chaser';
    const enemy = this.enemies.find(item => !item.active);
    if (!enemy) return;
    const scale = 1 + this.wave * 0.075 + Math.min(2, this.elapsed / 160);
    resetEnemy(enemy, kind, x, y, scale);
  }

  private spawnBoss(): void {
    const enemy = this.enemies.find(item => !item.active);
    if (!enemy) return;
    resetEnemy(enemy, 'boss', WIDTH / 2, -80, 1 + this.wave * 0.12);
    this.bossId = enemy;
    this.audio.boss();
    this.shake = 0.45;
    this.callbacks.onHaptic([60, 40, 80]);
  }

  private fireEnemyShot(enemy: Enemy): void {
    const shot = this.shots.find(item => !item.active);
    if (!shot) return;
    const dx = this.player.position.x - enemy.x;
    const dy = this.player.position.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    const speed = enemy.kind === 'boss' ? 220 : 190;
    shot.active = true;
    shot.x = enemy.x; shot.y = enemy.y;
    shot.vx = dx / len * speed; shot.vy = dy / len * speed;
    shot.radius = enemy.kind === 'boss' ? 7 : 5;
    shot.life = 5;
    if (enemy.kind === 'boss') {
      for (let i = 0; i < 3; i += 1) {
        const a = Math.atan2(dy, dx) + (i - 1) * 0.2;
        const extra = this.shots.find(item => !item.active);
        if (!extra) break;
        extra.active = true; extra.x = enemy.x; extra.y = enemy.y; extra.vx = Math.cos(a) * speed; extra.vy = Math.sin(a) * speed; extra.radius = 6; extra.life = 4;
      }
    }
  }

  private damageEnemy(enemy: Enemy, amount: number, dashHit = false): void {
    if (!enemy.active) return;
    enemy.hp -= amount;
    this.emitBurst(enemy.x, enemy.y, dashHit ? 5 : 3, enemy.kind === 'boss' ? 42 : 190, dashHit ? 1.1 : 0.6);
    if (enemy.hp > 0) return;
    enemy.active = false;
    if (this.bossId === enemy) {
      this.bossId = null;
      this.score += 4000 + this.wave * 650;
      this.player.flux = this.player.maxFlux;
      this.emitBurst(enemy.x, enemy.y, 120, 44, 3.0);
      this.audio.win();
      this.callbacks.onMessage('WARDEN DOWN', 'Core breach stabilized. The next storm is already forming.');
    }
    this.kills += 1;
    this.combo = clamp(this.combo + 1, 0, 60);
    this.comboTimer = 3.1;
    const reward = 5 + Math.min(20, this.wave);
    this.spawnPickup(enemy.x, enemy.y, reward);
    this.player.flux = clamp(this.player.flux + 4, 0, this.player.maxFlux);
    this.score += (dashHit ? 140 : 90) * Math.max(1, 1 + Math.floor(this.combo / 5));
    if (enemy.kind === 'splitter') {
      for (let i = 0; i < 2; i += 1) this.spawnPickup(enemy.x + (i ? 14 : -14), enemy.y, 4);
    }
    this.emitBurst(enemy.x, enemy.y, 18, enemy.kind === 'boss' ? 45 : 175, 1.4);
  }

  private overdrive(): void {
    this.player.flux = 0;
    this.player.abilityCooldown = 1.1;
    const radius = this.save.unlockedModules.includes('pulse') ? 215 : 160;
    const power = this.save.unlockedModules.includes('pulse') ? 240 : 175;
    let removed = 0;
    for (const enemy of this.enemies) {
      if (!enemy.active || distSq(enemy, this.player.position) > radius ** 2) continue;
      this.damageEnemy(enemy, power, false);
      removed += 1;
    }
    this.score += 250 + removed * 90;
    this.audio.ability();
    this.shake = 0.32;
    this.callbacks.onHaptic([25, 30, 60]);
    this.emitBurst(this.player.position.x, this.player.position.y, 70, 278, 2.2);
    this.callbacks.onMessage('OVERDRIVE', `${removed} threats erased. Keep the rhythm.`);
  }

  private spawnPickup(x: number, y: number, value: number): void {
    const pickup = this.pickups.find(item => !item.active);
    if (!pickup) return;
    pickup.active = true; pickup.x = x; pickup.y = y; pickup.value = value; pickup.phase = 0;
  }

  private emitBurst(x: number, y: number, count: number, hue: number, life: number): void {
    let created = 0;
    for (const p of this.particles) {
      if (p.active) continue;
      const angle = this.rng() * Math.PI * 2;
      const speed = 35 + this.rng() * 170;
      p.active = true; p.x = x; p.y = y; p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed;
      p.maxLife = p.life = life * (0.55 + this.rng() * 0.7); p.size = 1.5 + this.rng() * 4; p.hue = hue + this.rng() * 28;
      created += 1;
      if (created >= count) break;
    }
  }

  private endRun(victory: boolean): void {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    this.audio.stopMusic();
    const creditsEarned = Math.max(5, Math.floor(this.score / 1100) + this.wave * 3);
    this.save.credits += creditsEarned;
    this.save.totalRuns += 1;
    this.save.totalKills += this.kills;
    this.save.bestScore = Math.max(this.save.bestScore, this.score);
    this.save.longestCombo = Math.max(this.save.longestCombo, this.combo);
    const today = dateKey();
    if (this.mode === 'daily') {
      if (this.save.daily.date !== today) this.save.daily = { date: today, bestScore: 0, claimed: false };
      this.save.daily.bestScore = Math.max(this.save.daily.bestScore, this.score);
      if (victory && !this.save.daily.claimed) { this.save.daily.claimed = true; this.save.credits += 50; }
    }
    this.evaluateAchievements();
    this.saveManager.save(this.save);
    const summary: RunSummary = { score: this.score, kills: this.kills, combo: this.combo, wave: this.wave, creditsEarned, mode: this.mode };
    this.callbacks.onState(victory ? 'victory' : 'gameover');
    this.callbacks.onHaptic(victory ? [30, 40, 90] : [70, 60, 40]);
    this.callbacks.onRunEnd(summary, this.save);
  }

  private evaluateAchievements(): void {
    const checks = [
      ['first-run', this.save.totalRuns >= 1],
      ['combo-20', this.combo >= 20],
      ['kill-100', this.save.totalKills >= 100],
      ['wave-10', this.wave >= 10],
      ['score-25000', this.score >= 25000],
    ] as const;
    for (const [id, ok] of checks) if (ok && !this.save.achievements.includes(id)) this.save.achievements.push(id);
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#06101c';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const grad = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 40, WIDTH / 2, HEIGHT / 2, 560);
    grad.addColorStop(0, '#11283b'); grad.addColorStop(1, '#06101c');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const star of this.stars) {
      star.y = (star.y + star.speed / 60) % HEIGHT;
      ctx.fillStyle = `rgba(150,210,255,${0.22 + (star.speed - 8) / 35})`;
      ctx.fillRect(star.x, star.y, 1, 1);
    }
    ctx.strokeStyle = 'rgba(92,177,255,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke(); }
    for (let y = 0; y <= HEIGHT; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke(); }

    const sx = (this.rng() - 0.5) * this.shake * 30;
    const sy = (this.rng() - 0.5) * this.shake * 30;
    ctx.translate(sx, sy);
    this.renderPickups(); this.renderShots(); this.renderEnemies(); this.renderPlayer(); this.renderParticles();
    ctx.restore();
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255,60,95,${this.hitFlash * 0.75})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  private renderPlayer(): void {
    const ctx = this.ctx;
    const p = this.player.position;
    ctx.save();
    ctx.translate(p.x, p.y); ctx.rotate(this.player.angle);
    ctx.shadowBlur = 22; ctx.shadowColor = '#42e8ff';
    ctx.fillStyle = '#b9f8ff';
    ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-12, -11); ctx.lineTo(-6, 0); ctx.lineTo(-12, 11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#33bde0'; ctx.beginPath(); ctx.arc(2, 0, 6, 0, Math.PI * 2); ctx.fill();
    if (this.player.invulnerable > 0) { ctx.strokeStyle = '#fff'; ctx.globalAlpha = 0.8; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 24 + Math.sin(this.elapsed * 40) * 3, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }

  private renderEnemies(): void {
    const ctx = this.ctx;
    for (const e of this.enemies) {
      if (!e.active) continue;
      ctx.save(); ctx.translate(e.x, e.y);
      const hue = e.kind === 'boss' ? 44 : e.kind === 'shooter' ? 285 : e.kind === 'splitter' ? 150 : 8;
      ctx.shadowBlur = e.kind === 'boss' ? 34 : 16; ctx.shadowColor = `hsl(${hue} 90% 62%)`;
      ctx.fillStyle = `hsl(${hue} 85% ${e.kind === 'boss' ? 55 : 60}%)`;
      if (e.kind === 'boss') {
        ctx.rotate(e.phase * 0.2);
        ctx.beginPath();
        for (let i = 0; i < 12; i += 1) { const a = i / 12 * Math.PI * 2; const r = i % 2 ? e.radius * 0.78 : e.radius; const x = Math.cos(a) * r; const y = Math.sin(a) * r; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#07111e'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill();
      } else if (e.kind === 'shooter') {
        ctx.rotate(Math.PI / 4); ctx.fillRect(-e.radius * 0.72, -e.radius * 0.72, e.radius * 1.44, e.radius * 1.44);
      } else {
        ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      if (e.kind === 'boss') {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(e.x - 70, e.y - e.radius - 17, 140, 5);
        ctx.fillStyle = '#ffd75a'; ctx.fillRect(e.x - 70, e.y - e.radius - 17, 140 * clamp(e.hp / e.maxHp, 0, 1), 5);
      }
    }
  }

  private renderShots(): void {
    const ctx = this.ctx;
    for (const s of this.shots) {
      if (!s.active) continue;
      ctx.shadowBlur = 12; ctx.shadowColor = '#ff557c'; ctx.fillStyle = '#ff8da6';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
    }
  }

  private renderPickups(): void {
    const ctx = this.ctx;
    for (const p of this.pickups) {
      if (!p.active) continue;
      ctx.save(); ctx.translate(p.x, p.y + Math.sin(p.phase) * 3); ctx.rotate(p.phase * 0.5);
      ctx.shadowBlur = 18; ctx.shadowColor = '#45f6db'; ctx.fillStyle = '#65ffe8';
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(8, 0); ctx.lineTo(0, 8); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  private renderParticles(): void {
    const ctx = this.ctx;
    for (const p of this.particles) {
      if (!p.active) continue;
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${p.hue} 90% 68%)`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private clearPool<T extends { active: boolean }>(pool: T[]): void { for (const item of pool) item.active = false; }
}
