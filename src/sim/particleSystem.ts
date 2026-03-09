import { ValueNoise3D } from './noise';
import { DEFAULT_SETTINGS, RuntimeSimulationControls, SimulationSettings, ThemeMode } from './simulationState';
import { clampRuntimeSettings, clampSimulationSettings } from './particle/runtime';
import { PARTICLE_SYSTEM_LIMITS, THEME_PALETTE } from './particle/constants';
import { computePointerForce, PointerInteractionController } from './pointer/pointerInteraction';

export class ParticleSystem {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;

  private settings: SimulationSettings;
  private runtime: RuntimeSimulationControls;
  private noise: ValueNoise3D;

  private width = 1;
  private height = 1;
  private dpr = 1;

  private backgroundRgb = THEME_PALETTE.dark.background;
  private strokeColor = THEME_PALETTE.dark.stroke;

  private poolSize = 1;
  private positionsX: Float32Array;
  private positionsY: Float32Array;
  private readPositionsX: Float32Array;
  private readPositionsY: Float32Array;

  private elapsed = 0;
  private lastTs = 0;
  private flockCols = 1;
  private flockRows = 1;
  private flockHead: Int32Array;
  private flockNext: Int32Array;

  private pointer = new PointerInteractionController();

  private cornerVx = 0;
  private cornerVy = 0;
  private separationVx = 0;
  private separationVy = 0;

  constructor(canvas: HTMLCanvasElement, initialSettings: SimulationSettings) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('No se pudo crear contexto 2D');
    }

    this.canvas = canvas;
    this.ctx = ctx;
    this.settings = clampSimulationSettings({ ...DEFAULT_SETTINGS, ...initialSettings });
    this.runtime = clampRuntimeSettings({
      activeParticles: this.settings.particleCount,
      speed: this.settings.speed,
      noiseScale: this.settings.noiseScale,
      noiseStrength: this.settings.noiseStrength,
      turbulence: this.settings.turbulence,
      trail: this.settings.trail
    });
    this.noise = new ValueNoise3D(this.settings.seed);

    this.poolSize = this.runtime.activeParticles;
    this.positionsX = new Float32Array(this.poolSize);
    this.positionsY = new Float32Array(this.poolSize);
    this.readPositionsX = new Float32Array(this.poolSize);
    this.readPositionsY = new Float32Array(this.poolSize);
    this.flockHead = new Int32Array(1);
    this.flockNext = new Int32Array(this.poolSize);

    this.resize(window.innerWidth, window.innerHeight);
    this.resetParticles();
    this.clear();
    this.bindPointerEvents();
  }

  getSettings(): SimulationSettings {
    return { ...this.settings };
  }

  setTheme(mode: ThemeMode): void {
    const palette = THEME_PALETTE[mode];
    this.backgroundRgb = palette.background;
    this.strokeColor = palette.stroke;
    this.clear();
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
    this.resizeFlockGrid();
  }

  clear(): void {
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = `rgb(${this.backgroundRgb})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  resetDrawnFlow(): void {
    this.pointer.reset();
  }

  resetParticles(): void {
    for (let i = 0; i < this.poolSize; i += 1) {
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

  setRuntimeControls(next: Partial<RuntimeSimulationControls>): void {
    this.runtime = clampRuntimeSettings({ ...this.runtime, ...next });
    this.ensurePoolSize(this.runtime.activeParticles);
  }

  setSettings(next: Partial<SimulationSettings>, clearAfter = false): void {
    const prevSeed = this.settings.seed;
    this.settings = clampSimulationSettings({ ...this.settings, ...next });

    if (this.settings.seed !== prevSeed) {
      this.noise = new ValueNoise3D(this.settings.seed);
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
    this.readPositionsX.set(this.positionsX);
    this.readPositionsY.set(this.positionsY);
    this.rebuildFlockIndex();

    const fadeAlpha = Math.max(0.02, 1 - this.runtime.trail);
    this.ctx.globalAlpha = fadeAlpha;
    this.ctx.fillStyle = `rgb(${this.backgroundRgb})`;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.globalAlpha = 0.9;
    this.ctx.strokeStyle = this.strokeColor;
    this.ctx.beginPath();

    const count = Math.min(this.runtime.activeParticles, this.poolSize);
    const highDensity = count >= PARTICLE_SYSTEM_LIMITS.highDensityThreshold;
    const useSeparation = count <= PARTICLE_SYSTEM_LIMITS.maxSeparationParticles;
    const speed = this.runtime.speed;
    const scale = this.runtime.noiseScale;
    const strength = this.runtime.noiseStrength;
    const turbulence = this.runtime.turbulence;
    const pointerState = this.pointer.getState();

    for (let i = 0; i < count; i += 1) {
      const x = this.readPositionsX[i];
      const y = this.readPositionsY[i];

      const angle = this.noise.flowAngle(x, y, this.elapsed, scale, turbulence, strength);
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;

      const pointerForce = computePointerForce(x, y, pointerState, this.settings);
      vx += pointerForce.vx;
      vy += pointerForce.vy;

      if (useSeparation) {
        this.computeSeparationForce(i, x, y, count);
        vx += this.separationVx;
        vy += this.separationVy;
      }

      if (highDensity) {
        this.computeCornerPushForce(x, y);
        vx += this.cornerVx;
        vy += this.cornerVy;
      }

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

      if (wrapped && highDensity && Math.random() < PARTICLE_SYSTEM_LIMITS.wrapRespawnChance) {
        wrappedX = Math.random() * this.width;
        wrappedY = Math.random() * this.height;
      }

      this.positionsX[i] = wrappedX;
      this.positionsY[i] = wrappedY;
    }

    this.ctx.stroke();
    this.pointer.decay();
  }

  private computeCornerPushForce(x: number, y: number): void {
    const radius = PARTICLE_SYSTEM_LIMITS.cornerPushRadius;
    const radiusSq = radius * radius;
    let forceX = 0;
    let forceY = 0;

    const corner00X = x;
    const corner00Y = y;
    const dist00Sq = corner00X * corner00X + corner00Y * corner00Y;
    if (dist00Sq < radiusSq && dist00Sq > 0.0001) {
      const dist = Math.sqrt(dist00Sq);
      const influence = (1 - dist / radius) ** 2;
      forceX += (corner00X / dist) * influence;
      forceY += (corner00Y / dist) * influence;
    }

    const corner10X = x - this.width;
    const corner10Y = y;
    const dist10Sq = corner10X * corner10X + corner10Y * corner10Y;
    if (dist10Sq < radiusSq && dist10Sq > 0.0001) {
      const dist = Math.sqrt(dist10Sq);
      const influence = (1 - dist / radius) ** 2;
      forceX += (corner10X / dist) * influence;
      forceY += (corner10Y / dist) * influence;
    }

    const corner01X = x;
    const corner01Y = y - this.height;
    const dist01Sq = corner01X * corner01X + corner01Y * corner01Y;
    if (dist01Sq < radiusSq && dist01Sq > 0.0001) {
      const dist = Math.sqrt(dist01Sq);
      const influence = (1 - dist / radius) ** 2;
      forceX += (corner01X / dist) * influence;
      forceY += (corner01Y / dist) * influence;
    }

    const corner11X = x - this.width;
    const corner11Y = y - this.height;
    const dist11Sq = corner11X * corner11X + corner11Y * corner11Y;
    if (dist11Sq < radiusSq && dist11Sq > 0.0001) {
      const dist = Math.sqrt(dist11Sq);
      const influence = (1 - dist / radius) ** 2;
      forceX += (corner11X / dist) * influence;
      forceY += (corner11Y / dist) * influence;
    }

    this.cornerVx = forceX * PARTICLE_SYSTEM_LIMITS.cornerPushStrength;
    this.cornerVy = forceY * PARTICLE_SYSTEM_LIMITS.cornerPushStrength;
  }

  private ensurePoolSize(required: number): void {
    if (required <= this.poolSize) return;

    const nextSize = Math.min(
      PARTICLE_SYSTEM_LIMITS.maxParticlePool,
      Math.max(required, this.poolSize + 1000)
    );
    if (nextSize === this.poolSize) return;

    const nextX = new Float32Array(nextSize);
    const nextY = new Float32Array(nextSize);
    const nextReadX = new Float32Array(nextSize);
    const nextReadY = new Float32Array(nextSize);
    const nextFlock = new Int32Array(nextSize);

    nextX.set(this.positionsX);
    nextY.set(this.positionsY);
    nextReadX.set(this.readPositionsX);
    nextReadY.set(this.readPositionsY);
    nextFlock.set(this.flockNext);

    for (let i = this.poolSize; i < nextSize; i += 1) {
      nextX[i] = Math.random() * this.width;
      nextY[i] = Math.random() * this.height;
      nextReadX[i] = nextX[i];
      nextReadY[i] = nextY[i];
    }

    this.poolSize = nextSize;
    this.positionsX = nextX;
    this.positionsY = nextY;
    this.readPositionsX = nextReadX;
    this.readPositionsY = nextReadY;
    this.flockNext = nextFlock;
  }

  private bindPointerEvents(): void {
    this.pointer.bind(this.canvas, (event) => this.getPointerPosition(event));
  }

  private getPointerPosition(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.height;
    return { x, y };
  }

  private resizeFlockGrid(): void {
    this.flockCols = Math.max(1, Math.ceil(this.width / PARTICLE_SYSTEM_LIMITS.flockCellSize));
    this.flockRows = Math.max(1, Math.ceil(this.height / PARTICLE_SYSTEM_LIMITS.flockCellSize));
    this.flockHead = new Int32Array(this.flockCols * this.flockRows);
  }

  private rebuildFlockIndex(): void {
    this.flockHead.fill(-1);
    const count = Math.min(this.runtime.activeParticles, this.poolSize);
    for (let i = 0; i < count; i += 1) {
      const x = this.readPositionsX[i];
      const y = this.readPositionsY[i];
      const cx = Math.min(this.flockCols - 1, Math.max(0, Math.floor((x / this.width) * this.flockCols)));
      const cy = Math.min(this.flockRows - 1, Math.max(0, Math.floor((y / this.height) * this.flockRows)));
      const cellIdx = cy * this.flockCols + cx;
      this.flockNext[i] = this.flockHead[cellIdx];
      this.flockHead[cellIdx] = i;
    }
  }

  private computeSeparationForce(index: number, x: number, y: number, count: number): void {
    const cellX = Math.min(this.flockCols - 1, Math.max(0, Math.floor((x / this.width) * this.flockCols)));
    const cellY = Math.min(this.flockRows - 1, Math.max(0, Math.floor((y / this.height) * this.flockRows)));
    const radius = PARTICLE_SYSTEM_LIMITS.flockSeparationRadius;
    const radiusSq = radius * radius;
    const halfW = this.width * 0.5;
    const halfH = this.height * 0.5;
    let forceX = 0;
    let forceY = 0;
    let neighbors = 0;

    const minY = Math.max(0, cellY - 1);
    const maxY = Math.min(this.flockRows - 1, cellY + 1);
    const minX = Math.max(0, cellX - 1);
    const maxX = Math.min(this.flockCols - 1, cellX + 1);

    for (let cy = minY; cy <= maxY; cy += 1) {
      for (let cx = minX; cx <= maxX; cx += 1) {
        let node = this.flockHead[cy * this.flockCols + cx];
        while (node !== -1) {
          if (node < count && node !== index) {
            let dx = x - this.readPositionsX[node];
            let dy = y - this.readPositionsY[node];

            if (dx > halfW) dx -= this.width;
            else if (dx < -halfW) dx += this.width;
            if (dy > halfH) dy -= this.height;
            else if (dy < -halfH) dy += this.height;

            const distSq = dx * dx + dy * dy;
            if (distSq > 0.00001 && distSq < radiusSq) {
              const dist = Math.sqrt(distSq);
              const weight = 1 - dist / radius;
              forceX += (dx / dist) * weight;
              forceY += (dy / dist) * weight;
              neighbors += 1;

              if (neighbors >= PARTICLE_SYSTEM_LIMITS.flockMaxNeighbors) {
                const scale = PARTICLE_SYSTEM_LIMITS.flockSeparationStrength / neighbors;
                this.separationVx = forceX * scale;
                this.separationVy = forceY * scale;
                return;
              }
            }
          }
          node = this.flockNext[node];
        }
      }
    }

    if (neighbors === 0) {
      this.separationVx = 0;
      this.separationVy = 0;
      return;
    }

    const scale = PARTICLE_SYSTEM_LIMITS.flockSeparationStrength / neighbors;
    this.separationVx = forceX * scale;
    this.separationVy = forceY * scale;
  }
}
