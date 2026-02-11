import { ValueNoise3D } from './noise';
import { DEFAULT_SETTINGS, PARTICLE_LIMITS, SimulationSettings } from './types';

const BACKGROUND_RGB = '23, 23, 23';
const OVERLAY_GRID_WIDTH = 120;
const OVERLAY_GRID_HEIGHT = 80;
const OVERLAY_MAX_COMPONENT = 420;

export class ParticleSystem {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  private settings: SimulationSettings;
  private noise: ValueNoise3D;

  private width = 1;
  private height = 1;
  private dpr = 1;

  private positionsX: Float32Array;
  private positionsY: Float32Array;

  private elapsed = 0;
  private lastTs = 0;
  private overlayVx: Float32Array;
  private overlayVy: Float32Array;
  private hoverVx: Float32Array;
  private hoverVy: Float32Array;
  private pointerDown = false;
  private pointerTracked = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  constructor(canvas: HTMLCanvasElement, initialSettings: SimulationSettings) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('No se pudo crear contexto 2D');
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.settings = { ...DEFAULT_SETTINGS, ...initialSettings };
    this.noise = new ValueNoise3D(this.settings.seed);

    this.positionsX = new Float32Array(this.settings.particleCount);
    this.positionsY = new Float32Array(this.settings.particleCount);
    this.overlayVx = new Float32Array(OVERLAY_GRID_WIDTH * OVERLAY_GRID_HEIGHT);
    this.overlayVy = new Float32Array(OVERLAY_GRID_WIDTH * OVERLAY_GRID_HEIGHT);
    this.hoverVx = new Float32Array(OVERLAY_GRID_WIDTH * OVERLAY_GRID_HEIGHT);
    this.hoverVy = new Float32Array(OVERLAY_GRID_WIDTH * OVERLAY_GRID_HEIGHT);

    this.resize(window.innerWidth, window.innerHeight);
    this.resetParticles();
    this.clear();
    this.bindPointerEvents();
  }

  getSettings(): SimulationSettings {
    return { ...this.settings };
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.dpr = Math.max(1, window.devicePixelRatio || 1);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.lineWidth = 1;
    this.ctx.lineCap = 'round';
  }

  clear(): void {
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = `rgb(${BACKGROUND_RGB})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resetParticles(): void {
    const count = this.settings.particleCount;
    for (let i = 0; i < count; i += 1) {
      this.positionsX[i] = Math.random() * this.width;
      this.positionsY[i] = Math.random() * this.height;
    }
  }

  randomizeSeed(): void {
    const seed = (Math.random() * 0x7fffffff) | 0;
    this.setSettings({ seed }, false);
    this.resetParticles();
  }

  setPaused(paused: boolean): void {
    this.settings.paused = paused;
  }

  setSettings(next: Partial<SimulationSettings>, clearAfter = false): void {
    const prevCount = this.settings.particleCount;
    const prevSeed = this.settings.seed;
    this.settings = { ...this.settings, ...next };

    this.settings.particleCount = Math.min(
      PARTICLE_LIMITS.max,
      Math.max(PARTICLE_LIMITS.min, Math.round(this.settings.particleCount))
    );
    this.settings.speed = Math.min(120, Math.max(5, this.settings.speed));
    this.settings.noiseScale = Math.min(0.008, Math.max(0.0005, this.settings.noiseScale));
    this.settings.noiseStrength = Math.min(4, Math.max(0.2, this.settings.noiseStrength));
    this.settings.turbulence = Math.min(6, Math.max(1, Math.round(this.settings.turbulence)));
    this.settings.trail = Math.min(1, Math.max(0, this.settings.trail));
    this.settings.mouseStrength = Math.min(8, Math.max(0, this.settings.mouseStrength));
    this.settings.mouseRadius = Math.min(220, Math.max(4, this.settings.mouseRadius));
    this.settings.overlayDecay = Math.min(0.999, Math.max(0.8, this.settings.overlayDecay));
    this.settings.drawFlow = Boolean(this.settings.drawFlow);

    if (this.settings.seed !== prevSeed) {
      this.noise = new ValueNoise3D(this.settings.seed);
      clearAfter = true;
    }

    if (prevCount !== this.settings.particleCount) {
      this.positionsX = new Float32Array(this.settings.particleCount);
      this.positionsY = new Float32Array(this.settings.particleCount);
      this.resetParticles();
      clearAfter = true;
    }

    if (clearAfter) {
      this.clear();
    }
  }

  step(ts: number): void {
    if (this.settings.paused) {
      this.lastTs = ts;
      return;
    }

    if (this.lastTs === 0) {
      this.lastTs = ts;
    }

    const dtMs = Math.min(33, ts - this.lastTs);
    this.lastTs = ts;
    const dt = dtMs / 1000;

    this.elapsed += dt;
    this.decayHoverOverlay();

    const fadeAlpha = Math.max(0.02, 1 - this.settings.trail);
    this.ctx.globalAlpha = fadeAlpha;
    this.ctx.fillStyle = `rgb(${BACKGROUND_RGB})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.globalAlpha = 0.9;
    this.ctx.strokeStyle = '#efe7d3';
    this.ctx.beginPath();

    const count = this.settings.particleCount;
    const speed = this.settings.speed;
    const scale = this.settings.noiseScale;
    const strength = this.settings.noiseStrength;
    const turbulence = this.settings.turbulence;

    for (let i = 0; i < count; i += 1) {
      let x = this.positionsX[i];
      let y = this.positionsY[i];

      const angle = this.noise.flowAngle(x, y, this.elapsed, scale, turbulence, strength);
      const overlay = this.sampleOverlay(x, y);
      const vx = Math.cos(angle) * speed + overlay.vx;
      const vy = Math.sin(angle) * speed + overlay.vy;
      const nx = x + vx * dt;
      const ny = y + vy * dt;

      let wrappedX = nx;
      let wrappedY = ny;
      let wrapped = false;

      if (wrappedX < 0) {
        wrappedX += this.width;
        wrapped = true;
      } else if (wrappedX >= this.width) {
        wrappedX -= this.width;
        wrapped = true;
      }

      if (wrappedY < 0) {
        wrappedY += this.height;
        wrapped = true;
      } else if (wrappedY >= this.height) {
        wrappedY -= this.height;
        wrapped = true;
      }

      if (!wrapped) {
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(wrappedX, wrappedY);
      }

      this.positionsX[i] = wrappedX;
      this.positionsY[i] = wrappedY;
    }

    this.ctx.stroke();
  }

  private bindPointerEvents(): void {
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const pos = this.getPointerPosition(event);
      this.pointerDown = true;
      this.pointerTracked = true;
      this.lastPointerX = pos.x;
      this.lastPointerY = pos.y;
      this.canvas.setPointerCapture(event.pointerId);
    });

    this.canvas.addEventListener('pointermove', (event) => {
      const pos = this.getPointerPosition(event);
      if (!this.pointerTracked) {
        this.lastPointerX = pos.x;
        this.lastPointerY = pos.y;
        this.pointerTracked = true;
        return;
      }
      const dx = pos.x - this.lastPointerX;
      const dy = pos.y - this.lastPointerY;
      this.lastPointerX = pos.x;
      this.lastPointerY = pos.y;

      if (!this.pointerDown) {
        this.paintHoverOverlay(pos.x, pos.y, dx, dy);
        return;
      }

      if (!this.settings.drawFlow) return;
      this.paintPersistentOverlay(pos.x, pos.y, dx, dy);
    });

    const stopDrawing = () => {
      this.pointerDown = false;
      this.pointerTracked = false;
    };

    this.canvas.addEventListener('pointerup', stopDrawing);
    this.canvas.addEventListener('pointercancel', stopDrawing);
    this.canvas.addEventListener('pointerleave', stopDrawing);
    window.addEventListener('pointerup', stopDrawing);
  }

  private getPointerPosition(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.height;
    return { x, y };
  }

  private paintPersistentOverlay(x: number, y: number, dx: number, dy: number): void {
    this.paintOverlayInto(this.overlayVx, this.overlayVy, x, y, dx, dy);
  }

  private paintHoverOverlay(x: number, y: number, dx: number, dy: number): void {
    this.paintOverlayInto(this.hoverVx, this.hoverVy, x, y, dx, dy);
  }

  private paintOverlayInto(
    targetVx: Float32Array,
    targetVy: Float32Array,
    x: number,
    y: number,
    dx: number,
    dy: number
  ): void {
    const baseVx = dx * this.settings.mouseStrength * 60;
    const baseVy = dy * this.settings.mouseStrength * 60;
    const radiusPx = this.settings.mouseRadius;
    const cellW = this.width / OVERLAY_GRID_WIDTH;
    const cellH = this.height / OVERLAY_GRID_HEIGHT;

    const centerX = Math.min(OVERLAY_GRID_WIDTH - 1, Math.max(0, Math.floor((x / this.width) * OVERLAY_GRID_WIDTH)));
    const centerY = Math.min(OVERLAY_GRID_HEIGHT - 1, Math.max(0, Math.floor((y / this.height) * OVERLAY_GRID_HEIGHT)));

    const radiusCellsX = Math.max(1, Math.ceil(radiusPx / cellW));
    const radiusCellsY = Math.max(1, Math.ceil(radiusPx / cellH));
    const minX = Math.max(0, centerX - radiusCellsX);
    const maxX = Math.min(OVERLAY_GRID_WIDTH - 1, centerX + radiusCellsX);
    const minY = Math.max(0, centerY - radiusCellsY);
    const maxY = Math.min(OVERLAY_GRID_HEIGHT - 1, centerY + radiusCellsY);

    for (let cy = minY; cy <= maxY; cy += 1) {
      const py = (cy + 0.5) * cellH;
      for (let cx = minX; cx <= maxX; cx += 1) {
        const px = (cx + 0.5) * cellW;
        const dist = Math.hypot(px - x, py - y);
        if (dist > radiusPx) continue;

        const influence = 1 - dist / radiusPx;
        const idx = cy * OVERLAY_GRID_WIDTH + cx;
        targetVx[idx] = this.clampOverlayComponent(targetVx[idx] + baseVx * influence);
        targetVy[idx] = this.clampOverlayComponent(targetVy[idx] + baseVy * influence);
      }
    }
  }

  private decayHoverOverlay(): void {
    const decay = this.settings.overlayDecay;
    for (let i = 0; i < this.hoverVx.length; i += 1) {
      this.hoverVx[i] *= decay;
      this.hoverVy[i] *= decay;
    }
  }

  private sampleOverlay(x: number, y: number): { vx: number; vy: number } {
    const cx = Math.min(OVERLAY_GRID_WIDTH - 1, Math.max(0, Math.floor((x / this.width) * OVERLAY_GRID_WIDTH)));
    const cy = Math.min(OVERLAY_GRID_HEIGHT - 1, Math.max(0, Math.floor((y / this.height) * OVERLAY_GRID_HEIGHT)));
    const idx = cy * OVERLAY_GRID_WIDTH + cx;
    return { vx: this.overlayVx[idx] + this.hoverVx[idx], vy: this.overlayVy[idx] + this.hoverVy[idx] };
  }

  private clampOverlayComponent(value: number): number {
    return Math.min(OVERLAY_MAX_COMPONENT, Math.max(-OVERLAY_MAX_COMPONENT, value));
  }
}
