import type { Vec2 } from '../core/types';
import { clamp, normalize } from '../core/types';

export type EnemyKind = 'chaser' | 'shooter' | 'splitter' | 'boss';

export interface Enemy {
  active: boolean;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  shootCd: number;
  phase: number;
}

export interface Shot {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
}

export interface Pickup {
  active: boolean;
  x: number;
  y: number;
  value: number;
  phase: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export class Player {
  position: Vec2 = { x: 500, y: 300 };
  hp = 100;
  maxHp = 100;
  flux = 0;
  maxFlux = 100;
  radius = 15;
  speed = 300;
  dashTimer = 0;
  dashCooldown = 0;
  abilityCooldown = 0;
  invulnerable = 0;
  angle = 0;

  reset(maxHp: number): void {
    this.position = { x: 500, y: 300 };
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.flux = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.abilityCooldown = 0;
    this.invulnerable = 0;
    this.angle = 0;
  }

  update(dt: number, move: Vec2, width: number, height: number): void {
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.abilityCooldown = Math.max(0, this.abilityCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    const speed = this.dashTimer > 0 ? this.speed * 3.2 : this.speed;
    this.position.x = clamp(this.position.x + move.x * speed * dt, 28, width - 28);
    this.position.y = clamp(this.position.y + move.y * speed * dt, 28, height - 28);
    if (move.x || move.y) this.angle = Math.atan2(move.y, move.x);
  }

  dash(move: Vec2): boolean {
    if (this.dashCooldown > 0 || (move.x === 0 && move.y === 0)) return false;
    this.dashTimer = 0.16;
    this.dashCooldown = 0.82;
    this.invulnerable = 0.24;
    return true;
  }

  takeDamage(amount: number): boolean {
    if (this.invulnerable > 0) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerable = 0.38;
    return true;
  }
}

export function resetEnemy(enemy: Enemy, kind: EnemyKind, x: number, y: number, scale: number): void {
  enemy.active = true;
  enemy.kind = kind;
  enemy.x = x;
  enemy.y = y;
  enemy.vx = 0;
  enemy.vy = 0;
  enemy.phase = 0;
  enemy.shootCd = kind === 'shooter' ? 1.2 : 0;
  if (kind === 'boss') {
    enemy.radius = 54;
    enemy.maxHp = enemy.hp = 850 * scale;
    enemy.speed = 68 + scale * 5;
  } else if (kind === 'splitter') {
    enemy.radius = 22;
    enemy.maxHp = enemy.hp = 90 * scale;
    enemy.speed = 95 + scale * 9;
  } else if (kind === 'shooter') {
    enemy.radius = 19;
    enemy.maxHp = enemy.hp = 70 * scale;
    enemy.speed = 78 + scale * 7;
  } else {
    enemy.radius = 16;
    enemy.maxHp = enemy.hp = 55 * scale;
    enemy.speed = 115 + scale * 11;
  }
}

export function steerEnemy(enemy: Enemy, target: Vec2, dt: number): void {
  const toTarget = normalize(target.x - enemy.x, target.y - enemy.y);
  let desired = toTarget;
  if (enemy.kind === 'shooter') {
    const distance = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    desired = distance < 260 ? normalize(enemy.x - target.x, enemy.y - target.y) : toTarget;
  }
  const turn = enemy.kind === 'boss' ? 2.1 : 3.5;
  enemy.vx += (desired.x * enemy.speed - enemy.vx) * Math.min(1, turn * dt);
  enemy.vy += (desired.y * enemy.speed - enemy.vy) * Math.min(1, turn * dt);
  enemy.x += enemy.vx * dt;
  enemy.y += enemy.vy * dt;
}
