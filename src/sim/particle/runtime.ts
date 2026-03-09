import { RuntimeSimulationControls, SimulationSettings } from '../simulationState';
import { clamp } from '../../utils/math';
import { PARTICLE_SYSTEM_LIMITS } from './constants';

export function clampRuntimeSettings(settings: RuntimeSimulationControls): RuntimeSimulationControls {
  return {
    activeParticles: Math.round(
      clamp(settings.activeParticles, PARTICLE_SYSTEM_LIMITS.minActiveParticles, PARTICLE_SYSTEM_LIMITS.maxParticlePool)
    ),
    speed: clamp(settings.speed, 1, 240),
    noiseScale: clamp(settings.noiseScale, 0.0005, 0.008),
    noiseStrength: clamp(settings.noiseStrength, 0.2, 4),
    turbulence: Math.round(clamp(settings.turbulence, 1, 6)),
    trail: clamp(settings.trail, 0, 1)
  };
}

export function clampSimulationSettings(settings: SimulationSettings): SimulationSettings {
  return {
    ...settings,
    particleCount: Math.round(clamp(settings.particleCount, 300, PARTICLE_SYSTEM_LIMITS.maxParticlePool)),
    speed: clamp(settings.speed, 5, 100),
    noiseScale: clamp(settings.noiseScale, 0.0005, 0.008),
    noiseStrength: clamp(settings.noiseStrength, 0.2, 4),
    turbulence: Math.round(clamp(settings.turbulence, 1, 6)),
    trail: clamp(settings.trail, 0, 1),
    mouseStrength: clamp(settings.mouseStrength, 0, 8),
    mouseRadius: clamp(settings.mouseRadius, 4, 220),
    overlayDecay: clamp(settings.overlayDecay, 0.8, 0.999),
    drawFlow: Boolean(settings.drawFlow),
    seed: settings.seed | 0,
    paused: Boolean(settings.paused)
  };
}
