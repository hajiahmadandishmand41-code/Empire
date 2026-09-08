# Fluxfall — Game Design Document

## High concept
Fluxfall is a fast arcade roguelite in which the player pilots a compact energy craft through a collapsing neon arena. Every run is a 90–180 second survival score chase: move, dash through danger, collect Flux Shards, trigger abilities, chain combos, defeat elite waves, and survive the arena core.

## Core loop
1. Spawn into a readable arena.
2. Move continuously and steer toward safe/valuable routes.
3. Dash through enemies/projectiles for invulnerability and bonus style points.
4. Defeat enemies to collect Flux Shards.
5. Fill Flux Meter and activate Overdrive.
6. Every fifth wave becomes an elite/Boss encounter.
7. End the run, bank rewards, unlock upgrades and replay with a new modifier.

## Progression
- Persistent Credits buy permanent ship modules.
- Three starting modules: Vanguard, Magnet, Pulse.
- Run score, best score, total kills and longest combo persist locally.
- Daily Challenge uses a deterministic date seed and special modifiers.
- Achievements unlock cosmetic titles and bonus Credits.

## Difficulty
Wave cadence increases every round. Enemy speed, count and projectile pressure scale with wave and score. Boss waves introduce zone attacks and a telegraphed charge pattern.

## Visual direction
Original neon-industrial sci-fi: deep void background, cyan/amber/purple energy, crisp vector geometry, bloom-like alpha layering, procedural particles, subtle screen shake, readable silhouettes and responsive UI. No external assets are required.

## Audio direction
Procedural Web Audio synth bed plus short, low-latency effects for dash, pickup, hit, ability, boss warning and victory. Audio is muted by default until first user interaction on browsers that require a gesture.

## Technical direction
- Canvas 2D, device-pixel-ratio aware.
- Fixed-step gameplay with interpolated rendering.
- Object pooling for enemies, particles and projectiles.
- LocalStorage persistence with versioned schema and validation.
- Pointer/touch + keyboard/controller-friendly input abstraction.
- No runtime network dependency.
