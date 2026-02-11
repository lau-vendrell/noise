export interface SimulationSettings {
  particleCount: number;
  speed: number;
  noiseScale: number;
  noiseStrength: number;
  turbulence: number;
  trail: number;
  mouseStrength: number;
  mouseRadius: number;
  overlayDecay: number;
  drawFlow: boolean;
  seed: number;
  paused: boolean;
}

export const DEFAULT_SETTINGS: SimulationSettings = {
  particleCount: 5000,
  speed: 42,
  noiseScale: 0.0018,
  noiseStrength: 1.45,
  turbulence: 4,
  trail: 0.82,
  mouseStrength: 1.75,
  mouseRadius: 48,
  overlayDecay: 0.95,
  drawFlow: true,
  seed: 1337,
  paused: false
};

export const PARTICLE_LIMITS = {
  min: 2000,
  max: 10000
} as const;

export const STORAGE_KEY = 'noise-field-settings-v1';
