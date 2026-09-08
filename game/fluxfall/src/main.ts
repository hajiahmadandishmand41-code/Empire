import './styles.css';
import { Game } from './gameplay/Game';
import { UIManager } from './ui/UIManager';
import type { GameMode } from './core/types';

const app = document.querySelector<HTMLElement>('#app');
if (!app) throw new Error('Fluxfall mount node is missing.');

let game: Game;
let ui: UIManager;

const pressAction = (key: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
};

const callbacks = {
  start: (mode: GameMode) => {
    ui.showGameplay();
    game.start(mode);
    (window as unknown as { __fluxfallSave: ReturnType<Game['getSave']> }).__fluxfallSave = game.getSave();
  },
  pause: () => game.togglePause(),
  dash: () => pressAction(' '),
  ability: () => pressAction('e'),
  buy: (id: string) => {
    if (game.buyModule(id)) ui.mountUpgrades(game.getSave());
    else ui.toastMessage('NOT ENOUGH CREDIT', 'Complete runs to earn more Flux Credits.');
    (window as unknown as { __fluxfallSave: ReturnType<Game['getSave']> }).__fluxfallSave = game.getSave();
  },
  sound: (enabled: boolean) => game.setSound(enabled),
  haptics: (enabled: boolean) => game.setHaptics(enabled),
};

ui = new UIManager(app, callbacks);
game = new Game(ui.gameLayer, {
  onState: (state) => {
    if (state === 'paused') ui.showPaused();
    else if (state === 'running') ui.showGameplay();
  },
  onSnapshot: snapshot => ui.update(snapshot),
  onMessage: (title, text) => ui.toastMessage(title, text),
  onRunEnd: (summary, save) => {
    (window as unknown as { __fluxfallSave: typeof save }).__fluxfallSave = save;
    ui.showRunEnd(summary, save);
  },
  onHaptic: pattern => {
    if (game.getSave().settings.haptics && 'vibrate' in navigator) navigator.vibrate(pattern);
  },
});

(window as unknown as { __fluxfallSave: ReturnType<Game['getSave']> }).__fluxfallSave = game.getSave();
ui.mountMenu(game.getSave());

window.addEventListener('beforeunload', () => game.destroy());
