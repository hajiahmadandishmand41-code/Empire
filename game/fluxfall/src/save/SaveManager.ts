import type { SaveData } from './types';

const KEY = 'fluxfall.save.v1';

const defaults: SaveData = {
  version: 1,
  credits: 0,
  bestScore: 0,
  totalRuns: 0,
  totalKills: 0,
  longestCombo: 0,
  unlockedModules: [],
  achievements: [],
  settings: { sound: true, haptics: true },
  daily: { date: '', bestScore: 0, claimed: false },
};

function sanitize(value: unknown): SaveData {
  if (!value || typeof value !== 'object') return structuredClone(defaults);
  const input = value as Partial<SaveData>;
  const settings = input.settings && typeof input.settings === 'object' ? input.settings : defaults.settings;
  const daily = input.daily && typeof input.daily === 'object' ? input.daily : defaults.daily;
  return {
    version: 1,
    credits: Number.isFinite(input.credits) && input.credits! >= 0 ? Math.floor(input.credits!) : 0,
    bestScore: Number.isFinite(input.bestScore) && input.bestScore! >= 0 ? Math.floor(input.bestScore!) : 0,
    totalRuns: Number.isFinite(input.totalRuns) && input.totalRuns! >= 0 ? Math.floor(input.totalRuns!) : 0,
    totalKills: Number.isFinite(input.totalKills) && input.totalKills! >= 0 ? Math.floor(input.totalKills!) : 0,
    longestCombo: Number.isFinite(input.longestCombo) && input.longestCombo! >= 0 ? Math.floor(input.longestCombo!) : 0,
    unlockedModules: Array.isArray(input.unlockedModules) ? input.unlockedModules.filter((v): v is string => typeof v === 'string').slice(0, 20) : [],
    achievements: Array.isArray(input.achievements) ? input.achievements.filter((v): v is string => typeof v === 'string').slice(0, 50) : [],
    settings: { sound: settings.sound !== false, haptics: settings.haptics !== false },
    daily: {
      date: typeof daily.date === 'string' ? daily.date.slice(0, 10) : '',
      bestScore: Number.isFinite(daily.bestScore) && daily.bestScore! >= 0 ? Math.floor(daily.bestScore!) : 0,
      claimed: daily.claimed === true,
    },
  };
}

export class SaveManager {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(KEY);
      return sanitize(raw ? JSON.parse(raw) : null);
    } catch {
      return structuredClone(defaults);
    }
  }

  save(data: SaveData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(sanitize(data)));
    } catch {
      // Storage can fail in private or quota-limited contexts; gameplay remains usable.
    }
  }

  reset(): SaveData {
    const fresh = structuredClone(defaults);
    this.save(fresh);
    return fresh;
  }
}
