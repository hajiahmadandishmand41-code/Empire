import type { Vec2 } from '../core/types';
import { clamp, normalize } from '../core/types';

export class InputManager {
  private readonly keys = new Set<string>();
  private pointerId: number | null = null;
  private stickOrigin: Vec2 = { x: 0, y: 0 };
  private stick: Vec2 = { x: 0, y: 0 };
  private dashEdge = false;
  private abilityEdge = false;
  private pauseEdge = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
    canvas.addEventListener('pointerup', this.onPointerUp, { passive: false });
    canvas.addEventListener('pointercancel', this.onPointerUp, { passive: false });
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
  }

  getMove(): Vec2 {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    const keyboard = normalize(x, y);
    if (keyboard.x !== 0 || keyboard.y !== 0) return keyboard;
    return this.stick;
  }

  consumeDash(): boolean {
    const value = this.dashEdge;
    this.dashEdge = false;
    return value;
  }

  consumeAbility(): boolean {
    const value = this.abilityEdge;
    this.abilityEdge = false;
    return value;
  }

  consumePause(): boolean {
    const value = this.pauseEdge;
    this.pauseEdge = false;
    return value;
  }

  triggerDash(): void { this.dashEdge = true; }
  triggerAbility(): void { this.abilityEdge = true; }
  triggerPause(): void { this.pauseEdge = true; }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    this.keys.add(key);
    if (key === 'shift' || key === ' ') this.dashEdge = true;
    if (key === 'e' || key === 'q') this.abilityEdge = true;
    if (key === 'escape' || key === 'p') this.pauseEdge = true;
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.key.toLowerCase());
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    this.canvas.setPointerCapture(event.pointerId);
    if (event.clientX < window.innerWidth * 0.55) {
      this.pointerId = event.pointerId;
      const rect = this.canvas.getBoundingClientRect();
      this.stickOrigin = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      this.updateStick(event);
    } else {
      this.abilityEdge = true;
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    event.preventDefault();
    this.updateStick(event);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    event.preventDefault();
    this.pointerId = null;
    this.stick = { x: 0, y: 0 };
  };

  private updateStick(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const dx = x - this.stickOrigin.x;
    const dy = y - this.stickOrigin.y;
    const magnitude = Math.min(Math.hypot(dx, dy), 88);
    const angle = Math.atan2(dy, dx);
    const deadZone = 10;
    this.stick = magnitude < deadZone ? { x: 0, y: 0 } : {
      x: clamp(Math.cos(angle) * magnitude / 88, -1, 1),
      y: clamp(Math.sin(angle) * magnitude / 88, -1, 1),
    };
  }
}
