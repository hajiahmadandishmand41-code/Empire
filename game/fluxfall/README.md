# Fluxfall Arcade ⚡

Standalone browser game living under `game/fluxfall/` so it does not alter the Empire Shop application. Fluxfall is an original, procedural neon arcade roguelite: no external game assets, copied characters, maps, code, or branded designs.

## Run locally

```bash
cd game/fluxfall
npm install
npm run dev
```

Production build:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The game has no runtime API or database dependency. Progress, settings, best scores, unlocks and achievements are persisted locally in the browser with a versioned save key.

## Controls

Desktop: WASD / Arrow Keys = Move · Space / Shift = Dash · E / Q = Overdrive · P / Esc = Pause.

Mobile: drag on the left side to steer; use the action buttons on the right. Haptic feedback is used when supported by the browser/device.

## Game loop

Main Menu → 10-second Tutorial → Run → Waves → Elite/Boss every 5th wave → Rewards → Persistent Upgrades/Achievements → Daily Shift → Game Over → Replay.

## Performance

Canvas rendering is device-pixel-ratio aware and capped to 2×. Enemies, projectiles, pickups and particles use fixed-size pools to avoid per-frame object allocation. The game uses a fixed 60 Hz simulation step with bounded catch-up and a single render loop.

## Structure

```text
game/fluxfall/
├── src/
│   ├── audio/AudioEngine.ts
│   ├── core/types.ts
│   ├── entities/Entities.ts
│   ├── gameplay/Game.ts
│   ├── input/InputManager.ts
│   ├── save/SaveManager.ts
│   ├── ui/UIManager.ts
│   └── main.ts
├── tests/core.test.ts
├── GDD.md
├── index.html
├── package.json
├── tsconfig.json
└── styles.css
```

## Design notes

The visual language is procedural vector art: gradients, geometric silhouettes, particles, glow and controlled screen shake. Music and effects are synthesized through Web Audio so the prototype remains self-contained and legally clean.
