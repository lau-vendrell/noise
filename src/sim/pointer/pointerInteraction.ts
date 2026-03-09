import { SimulationSettings } from '../simulationState';

const PRESS_RADIUS_FACTOR = 3.4;
const HOVER_RADIUS_FACTOR = 3.1;
const HOVER_DECAY = 0.962;
const HOVER_MIN_SPEED = 0.03;

interface PointerPosition {
  x: number;
  y: number;
}

export interface PointerInteractionState {
  down: boolean;
  tracked: boolean;
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  hoverEnergy: number;
}

export class PointerInteractionController {
  private state: PointerInteractionState = {
    down: false,
    tracked: false,
    x: 0,
    y: 0,
    dirX: 0,
    dirY: 0,
    hoverEnergy: 0
  };

  bind(canvas: HTMLCanvasElement, toWorldPosition: (event: PointerEvent) => PointerPosition): void {
    canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const pos = toWorldPosition(event);
      this.state.down = true;
      this.state.tracked = true;
      this.state.x = pos.x;
      this.state.y = pos.y;
      this.state.hoverEnergy = 0;
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener('pointermove', (event) => {
      const pos = toWorldPosition(event);
      const dx = pos.x - this.state.x;
      const dy = pos.y - this.state.y;
      const speed = Math.hypot(dx, dy);

      this.state.tracked = true;
      this.state.x = pos.x;
      this.state.y = pos.y;

      if (!this.state.down && speed > HOVER_MIN_SPEED) {
        const invSpeed = 1 / speed;
        const dirX = dx * invSpeed;
        const dirY = dy * invSpeed;
        this.state.dirX = this.state.dirX * 0.48 + dirX * 0.52;
        this.state.dirY = this.state.dirY * 0.48 + dirY * 0.52;
        this.state.hoverEnergy = Math.min(1, this.state.hoverEnergy * 0.18 + Math.min(1, speed / 18) * 0.82);
      }
    });

    canvas.addEventListener('pointerup', () => {
      this.state.down = false;
    });

    canvas.addEventListener('pointercancel', () => {
      this.reset();
    });

    canvas.addEventListener('pointerleave', () => {
      this.reset();
    });

    window.addEventListener('pointerup', () => {
      this.state.down = false;
    });
  }

  reset(): void {
    this.state.down = false;
    this.state.tracked = false;
    this.state.hoverEnergy = 0;
    this.state.dirX = 0;
    this.state.dirY = 0;
  }

  decay(): void {
    this.state.hoverEnergy *= HOVER_DECAY;
  }

  getState(): PointerInteractionState {
    return { ...this.state };
  }
}

export function computePointerForce(
  x: number,
  y: number,
  pointer: PointerInteractionState,
  settings: Pick<SimulationSettings, 'mouseRadius' | 'mouseStrength'>
): { vx: number; vy: number } {
  if (!pointer.tracked) {
    return { vx: 0, vy: 0 };
  }

  const dx = pointer.x - x;
  const dy = pointer.y - y;
  const dist = Math.hypot(dx, dy);

  if (dist < 0.0001) {
    return { vx: 0, vy: 0 };
  }

  if (pointer.down) {
    const influenceRadius = settings.mouseRadius * PRESS_RADIUS_FACTOR;
    if (dist > influenceRadius) {
      return { vx: 0, vy: 0 };
    }

    const invDist = 1 / dist;
    const falloff = (1 - dist / influenceRadius) ** 2;
    const tangentialX = -dy * invDist;
    const tangentialY = dx * invDist;
    const radialX = dx * invDist;
    const radialY = dy * invDist;

    const orbitalGain = settings.mouseStrength * 220 * falloff;
    const radialGain = orbitalGain * -0.22;

    return {
      vx: tangentialX * orbitalGain + radialX * radialGain,
      vy: tangentialY * orbitalGain + radialY * radialGain
    };
  }

  const influenceRadius = settings.mouseRadius * HOVER_RADIUS_FACTOR;
  if (dist > influenceRadius || pointer.hoverEnergy < 0.005) {
    return { vx: 0, vy: 0 };
  }

  const invDist = 1 / dist;
  const falloff = (1 - dist / influenceRadius) ** 2;
  const radialX = dx * invDist;
  const radialY = dy * invDist;

  const alignGain = settings.mouseStrength * 110 * pointer.hoverEnergy * falloff;
  const radialGain = settings.mouseStrength * 200 * pointer.hoverEnergy * falloff;

  return {
    vx: pointer.dirX * alignGain + radialX * radialGain,
    vy: pointer.dirY * alignGain + radialY * radialGain
  };
}
