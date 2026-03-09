import { PARTICLE_LIMITS, SimulationSettings, VOICE_PARTICLE_LIMITS, VoiceControlSettings } from '../../sim/simulationState';
import { SliderConfig } from './types';

export const manualSliders: SliderConfig<
  keyof Pick<SimulationSettings, 'particleCount' | 'speed' | 'noiseScale' | 'noiseStrength' | 'turbulence' | 'trail'>
>[] = [
  { id: 'particleCount', label: 'Particle count', min: PARTICLE_LIMITS.min, max: PARTICLE_LIMITS.max, step: 100 },
  { id: 'speed', label: 'Speed', min: 5, max: 100, step: 1 },
  { id: 'noiseScale', label: 'Noise scale', min: 0.0005, max: 0.008, step: 0.0001, format: (value) => value.toFixed(4) },
  { id: 'noiseStrength', label: 'Noise strength', min: 0.2, max: 4, step: 0.05, format: (value) => value.toFixed(2) },
  { id: 'turbulence', label: 'Turbulence / Octaves', min: 1, max: 6, step: 1 },
  { id: 'trail', label: 'Trail', min: 0, max: 1, step: 0.01, format: (value) => value.toFixed(2) }
];

export const voiceSliders: SliderConfig<keyof VoiceControlSettings>[] = [
  { id: 'sensitivity', label: 'Sensitivity', min: 0.2, max: 4, step: 0.05, format: (value) => value.toFixed(2) },
  {
    id: 'maxParticlesFromVoice',
    label: 'Max particles',
    min: VOICE_PARTICLE_LIMITS.min,
    max: VOICE_PARTICLE_LIMITS.max,
    step: 100
  },
  { id: 'voiceToSpeed', label: 'Voice to speed', min: 10, max: 200, step: 1 },
  { id: 'voiceToNoise', label: 'Voice to noise', min: 0.4, max: 4, step: 0.05, format: (value) => value.toFixed(2) },
  { id: 'threshold', label: 'Noise floor', min: 0, max: 0.2, step: 0.005, format: (value) => value.toFixed(3) },
  { id: 'calmDecay', label: 'Calm decay', min: 0.9, max: 0.995, step: 0.001, format: (value) => value.toFixed(3) }
];
