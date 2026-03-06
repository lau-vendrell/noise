import { AudioFeatures } from './audioAnalysis';
import { RuntimeSimulationControls, SimulationSettings, VoiceControlSettings } from '../sim/simulationState';

export interface VoiceMappingResult extends RuntimeSimulationControls {
  level: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function ease(current: number, target: number, attack: number, release: number): number {
  const factor = target > current ? attack : release;
  return current + (target - current) * factor;
}

export class VoiceMapper {
  private level = 0;
  private activity = 0;
  private speed = 2;
  private noiseStrength = 0.2;
  private turbulence = 1;
  private activeParticles = 400;

  enterCalm(manual: SimulationSettings): void {
    this.level = 0;
    this.activity = 0;
    this.speed = Math.max(1, manual.speed * 0.08);
    this.noiseStrength = Math.max(0.2, manual.noiseStrength * 0.2);
    this.turbulence = 1;
    this.activeParticles = Math.max(350, Math.round(manual.particleCount * 0.18));
  }

  map(features: AudioFeatures, voice: VoiceControlSettings, manual: SimulationSettings): VoiceMappingResult {
    const attack = clamp(0.08 + voice.sensitivity * 0.03, 0.08, 0.24);
    const release = Math.max(0.004, 1 - voice.calmDecay);

    const gated = Math.max(0, features.rms - voice.threshold);
    const normalized = clamp(gated * voice.sensitivity * 3.4, 0, 1);
    const energyMix = clamp(normalized * 0.75 + features.energy * voice.sensitivity * 0.35, 0, 1);
    const fluxBoost = clamp(features.flux * 2.5, 0, 1);

    this.level = ease(this.level, energyMix, attack, release);
    const activityTarget = clamp(this.level * 0.9 + fluxBoost * 0.25, 0, 1);
    this.activity = ease(this.activity, activityTarget, attack * 0.8, release * 1.2);

    const minParticles = 350;
    const targetParticles = minParticles + this.level * (voice.maxParticlesFromVoice - minParticles);
    this.activeParticles = ease(this.activeParticles, targetParticles, attack * 0.55, release);

    const targetSpeed = 1 + this.activity * voice.voiceToSpeed + fluxBoost * 12;
    const targetNoiseStrength = 0.2 + this.activity * voice.voiceToNoise + features.centroid * 0.45;
    const targetTurbulence = clamp(1 + Math.round(this.activity * 5 + fluxBoost * 0.8), 1, 6);

    this.speed = ease(this.speed, targetSpeed, attack * 0.8, release * 1.1);
    this.noiseStrength = ease(this.noiseStrength, targetNoiseStrength, attack * 0.85, release * 0.9);
    this.turbulence = ease(this.turbulence, targetTurbulence, attack * 1.1, release * 0.65);

    return {
      activeParticles: Math.round(this.activeParticles),
      speed: this.speed,
      noiseScale: manual.noiseScale,
      noiseStrength: this.noiseStrength,
      turbulence: Math.round(this.turbulence),
      trail: manual.trail,
      level: this.level
    };
  }
}
