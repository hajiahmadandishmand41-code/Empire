export type GameMode = 'normal' | 'daily';

export interface Vec2 {
  x: number;
  y: number;
}

export interface SaveData {
  version: 1;
  credits: number;
  bestScore: number;
  totalRuns: number;
  totalKills: number;
  longestCombo: number;
  unlockedModules: string[];
  achievements: string[];
  settings: {
    sound: boolean;
    haptics: boolean;
  };
  daily: {
    date: string;
    bestScore: number;
    claimed: boolean;
  };
}

export interface RunSummary {
  score: number;
  kills: number;
  combo: number;
  wave: number;
  creditsEarned: number;
  mode: GameMode;
}

export interface GameSnapshot {
  score: number;
  wave: number;
  combo: number;
  multiplier: number;
  hp: number;
  maxHp: number;
  flux: number;
  maxFlux: number;
  kills: number;
  bossHp: number | null;
  bossMaxHp: number | null;
  time: number;
}

export const MODULES = [
  { id: 'vanguard', name: 'Vanguard', desc: '+25 max HP', cost: 80 },
  { id: 'magnet', name: 'Flux Magnet', desc: 'Pickup radius +45%', cost: 120 },
  { id: 'pulse', name: 'Pulse Core', desc: 'Ability power +35%', cost: 180 },
] as const;

export const ACHIEVEMENTS = [
  { id: 'first-run', name: 'First Spark', desc: 'Finish your first run' },
  { id: 'combo-20', name: 'Chain Reaction', desc: 'Reach a 20x combo' },
  { id: 'kill-100', name: 'Crowd Control', desc: 'Defeat 100 enemies' },
  { id: 'wave-10', name: 'Deep Dive', desc: 'Reach wave 10' },
  { id: 'score-25000', name: 'Overcharged', desc: 'Score 25,000 in one run' },
] as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function normalize(x: number, y: number): Vec2 {
  const len = Math.hypot(x, y);
  return len > 0.0001 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}

export function dateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
