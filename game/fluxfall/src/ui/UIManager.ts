import type { GameSnapshot, GameMode, RunSummary, SaveData } from '../core/types';
import { ACHIEVEMENTS, MODULES, dateKey } from '../core/types';

export class UIManager {
  readonly root: HTMLElement;
  readonly gameLayer: HTMLElement;
  private hud!: HTMLElement;
  private toast!: HTMLElement;
  private screen!: HTMLElement;
  private callbacks: {
    start: (mode: GameMode) => void;
    pause: () => void;
    dash: () => void;
    ability: () => void;
    buy: (id: string) => void;
    sound: (enabled: boolean) => void;
    haptics: (enabled: boolean) => void;
  };

  constructor(root: HTMLElement, callbacks: UIManager['callbacks']) {
    this.root = root;
    this.callbacks = callbacks;
    root.className = 'fluxfall-app';
    root.innerHTML = `
      <section class="shell">
        <div id="game-layer" class="game-layer"></div>
        <div id="hud" class="hud" hidden>
          <div class="hud-top">
            <div class="stat"><span>SCORE</span><strong id="score">0</strong></div>
            <div class="stat"><span>WAVE</span><strong id="wave">0</strong></div>
            <div class="stat combo-stat"><span>CHAIN</span><strong id="combo">0x</strong></div>
            <button id="pause" class="icon-btn" aria-label="Pause">Ⅱ</button>
          </div>
          <div class="bars">
            <div><span class="bar-label">HULL</span><div class="bar"><i id="hp-bar"></i></div></div>
            <div><span class="bar-label">FLUX</span><div class="bar flux"><i id="flux-bar"></i></div></div>
          </div>
          <div class="boss-wrap" id="boss-wrap" hidden><span>CORE WARDEN</span><div class="bar boss"><i id="boss-bar"></i></div></div>
        </div>
        <div id="touch-controls" class="touch-controls" hidden>
          <button id="dash" class="action dash">DASH</button>
          <button id="ability" class="action ability">OVERDRIVE</button>
        </div>
        <div id="toast" class="toast" hidden></div>
        <div id="screen" class="screen"></div>
      </section>`;
    this.gameLayer = root.querySelector('#game-layer')!;
    this.hud = root.querySelector('#hud')!;
    this.toast = root.querySelector('#toast')!;
    this.screen = root.querySelector('#screen')!;
    root.querySelector('#pause')!.addEventListener('click', () => callbacks.pause());
    root.querySelector('#dash')!.addEventListener('click', () => callbacks.dash());
    root.querySelector('#ability')!.addEventListener('click', () => callbacks.ability());
  }

  mountMenu(save: SaveData): void {
    this.hud.hidden = true;
    this.root.querySelector('#touch-controls')!.setAttribute('hidden', '');
    this.screen.innerHTML = `
      <div class="panel hero">
        <div class="eyebrow">ORIGINAL ARCADE ROGUELITE</div>
        <h1>FLUX<span>FALL</span></h1>
        <p class="lead">Move through the storm. Dash through danger. Charge the Core. Break your own record.</p>
        <div class="hero-actions"><button class="primary" data-start="normal">START RUN</button><button class="secondary" data-start="daily">DAILY SHIFT</button></div>
        <div class="quick-grid"><div><b>${save.bestScore.toLocaleString()}</b><span>BEST SCORE</span></div><div><b>${save.totalKills}</b><span>TOTAL KILLS</span></div><div><b>${save.credits}</b><span>CREDITS</span></div></div>
        <div class="menu-links"><button data-screen="how">HOW TO PLAY</button><button data-screen="upgrade">UPGRADES</button><button data-screen="achievements">ACHIEVEMENTS</button></div>
      </div>`;
    this.bindMenu();
  }

  mountHow(): void {
    this.screen.innerHTML = `<div class="panel"><button class="back" data-screen="menu">← BACK</button><div class="eyebrow">10-SECOND TUTORIAL</div><h2>Move. Dash. Burst.</h2><div class="tutorial"><div><b>01</b><p>Use WASD / arrow keys, or the left touch area, to steer the craft.</p></div><div><b>02</b><p>Dash with Space/Shift to become briefly invulnerable and smash through enemies.</p></div><div><b>03</b><p>Collect teal Flux Shards. At 100% Flux, trigger Overdrive with E/Q or the right action control.</p></div><div><b>04</b><p>Build chain kills before the timer falls to zero. Every 5th wave summons a Core Warden.</p></div></div><button class="primary wide" data-start="normal">PLAY NOW</button></div>`;
    this.bindMenu();
  }

  mountUpgrades(save: SaveData): void {
    const cards = MODULES.map(m => {
      const owned = save.unlockedModules.includes(m.id);
      return `<article class="upgrade"><div class="upgrade-icon">✦</div><div><h3>${m.name}</h3><p>${m.desc}</p></div><button class="secondary" data-buy="${m.id}" ${owned || save.credits < m.cost ? 'disabled' : ''}>${owned ? 'OWNED' : `${m.cost} CR`}</button></article>`;
    }).join('');
    this.screen.innerHTML = `<div class="panel"><button class="back" data-screen="menu">← BACK</button><div class="eyebrow">PERSISTENT PROGRESSION</div><h2>Core Modules</h2><p>Spend Credits earned from completed runs. Modules are intentionally simple and stack with skill rather than replace it.</p><div class="upgrade-list">${cards}</div><div class="credit-line">AVAILABLE <b>${save.credits} CR</b></div></div>`;
    this.bindMenu();
    this.screen.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach(button => button.addEventListener('click', () => this.callbacks.buy(button.dataset.buy!)));
  }

  mountAchievements(save: SaveData): void {
    const cards = ACHIEVEMENTS.map(a => `<div class="achievement ${save.achievements.includes(a.id) ? 'done' : ''}"><b>${save.achievements.includes(a.id) ? '✓' : '○'}</b><div><strong>${a.name}</strong><span>${a.desc}</span></div></div>`).join('');
    this.screen.innerHTML = `<div class="panel"><button class="back" data-screen="menu">← BACK</button><div class="eyebrow">MASTERY</div><h2>Achievements</h2><div class="achievement-list">${cards}</div></div>`;
    this.bindMenu();
  }

  showGameplay(): void {
    this.screen.innerHTML = '';
    this.hud.hidden = false;
    this.root.querySelector('#touch-controls')!.removeAttribute('hidden');
  }

  showPaused(): void {
    this.screen.innerHTML = `<div class="panel mini"><div class="eyebrow">SYSTEM PAUSED</div><h2>Catch your breath.</h2><button class="primary wide" id="resume">RESUME</button><button class="secondary wide" id="quit">QUIT RUN</button></div>`;
    this.screen.querySelector('#resume')!.addEventListener('click', () => this.callbacks.pause());
    this.screen.querySelector('#quit')!.addEventListener('click', () => { window.location.reload(); });
  }

  showRunEnd(summary: RunSummary, save: SaveData): void {
    this.hud.hidden = true;
    this.root.querySelector('#touch-controls')!.setAttribute('hidden', '');
    const title = summary.mode === 'daily' ? 'SHIFT COMPLETE' : summary.wave >= 10 ? 'STORM MASTER' : 'RUN COMPLETE';
    this.screen.innerHTML = `<div class="panel result"><div class="eyebrow">${title}</div><h2>${summary.score.toLocaleString()} <span>PTS</span></h2><div class="result-grid"><div><b>${summary.wave}</b><span>WAVE</span></div><div><b>${summary.kills}</b><span>KILLS</span></div><div><b>${summary.combo}x</b><span>CHAIN</span></div><div><b>+${summary.creditsEarned}</b><span>CREDITS</span></div></div><p>${summary.mode === 'daily' ? `Daily best: ${save.daily.bestScore.toLocaleString()} · ${dateKey()}` : 'Every defeat is data. Upgrade, change your route, and try again.'}</p><div class="hero-actions"><button class="primary" data-start="${summary.mode}">REPLAY</button><button class="secondary" data-screen="menu">MAIN MENU</button></div></div>`;
    this.bindMenu();
  }

  update(snapshot: GameSnapshot): void {
    (this.root.querySelector('#score') as HTMLElement).textContent = snapshot.score.toLocaleString();
    (this.root.querySelector('#wave') as HTMLElement).textContent = String(snapshot.wave);
    (this.root.querySelector('#combo') as HTMLElement).textContent = `${snapshot.combo}x`;
    (this.root.querySelector('#hp-bar') as HTMLElement).style.width = `${(snapshot.hp / snapshot.maxHp) * 100}%`;
    (this.root.querySelector('#flux-bar') as HTMLElement).style.width = `${(snapshot.flux / snapshot.maxFlux) * 100}%`;
    const boss = this.root.querySelector('#boss-wrap') as HTMLElement;
    boss.hidden = snapshot.bossHp === null;
    if (snapshot.bossHp !== null && snapshot.bossMaxHp !== null) (this.root.querySelector('#boss-bar') as HTMLElement).style.width = `${(snapshot.bossHp / snapshot.bossMaxHp) * 100}%`;
  }

  toastMessage(title: string, text: string): void {
    this.toast.hidden = false;
    this.toast.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
    window.clearTimeout(Number(this.toast.dataset.timer || 0));
    const timer = window.setTimeout(() => { this.toast.hidden = true; }, 2500);
    this.toast.dataset.timer = String(timer);
  }

  private bindMenu(): void {
    this.screen.querySelectorAll<HTMLButtonElement>('[data-start]').forEach(button => button.addEventListener('click', () => this.callbacks.start(button.dataset.start as GameMode)));
    this.screen.querySelectorAll<HTMLButtonElement>('[data-screen]').forEach(button => button.addEventListener('click', () => {
      const screen = button.dataset.screen;
      if (screen === 'menu') this.mountMenu(this.callbacksSave());
      else if (screen === 'how') this.mountHow();
      else if (screen === 'upgrade') this.mountUpgrades(this.callbacksSave());
      else if (screen === 'achievements') this.mountAchievements(this.callbacksSave());
    }));
  }

  private callbacksSave(): SaveData {
    return (window as unknown as { __fluxfallSave: SaveData }).__fluxfallSave;
  }
}
