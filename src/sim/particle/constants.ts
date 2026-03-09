import { ThemeMode } from '../simulationState';

export const PARTICLE_SYSTEM_LIMITS = {
  flockCellSize: 36,
  flockSeparationRadius: 26,
  flockSeparationStrength: 44,
  flockMaxNeighbors: 20,
  maxParticlePool: 60000,
  minActiveParticles: 300,
  maxSeparationParticles: 14000,
  highDensityThreshold: 26000,
  cornerPushRadius: 92,
  cornerPushStrength: 12,
  wrapRespawnChance: 0.018
} as const;

export const THEME_PALETTE: Record<ThemeMode, { background: string; stroke: string }> = {
  dark: {
    background: '23, 23, 24',
    stroke: '#efe7d3'
  },
  sand: {
    background: '195, 190, 183',
    stroke: '#444444'
  }
};
