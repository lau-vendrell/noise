import { clamp } from '../utils/math';
import { readJson, writeJson } from '../utils/storage';

export type ControlMode = 'manual' | 'voice';
export type ThemeMode = 'dark' | 'sand';

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

export interface VoiceControlSettings {
  sensitivity: number;
  maxParticlesFromVoice: number;
  voiceToSpeed: number;
  voiceToNoise: number;
  threshold: number;
  calmDecay: number;
}

export interface AppSettings {
  activeMode: ControlMode;
  theme: ThemeMode;
  manual: SimulationSettings;
  voice: VoiceControlSettings;
}

export interface RuntimeSimulationControls {
  activeParticles: number;
  speed: number;
  noiseScale: number;
  noiseStrength: number;
  turbulence: number;
  trail: number;
}

export const PARTICLE_LIMITS = {
  min: 5000,
  max: 12000
} as const;

export const VOICE_PARTICLE_LIMITS = {
  min: 5000,
  max: 12000
} as const;

export const STORAGE_KEY = 'noise-field-settings-v2';

export const DEFAULT_SETTINGS: SimulationSettings = {
  particleCount: 5200,
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

export const DEFAULT_VOICE_SETTINGS: VoiceControlSettings = {
  sensitivity: 1.6,
  maxParticlesFromVoice: 12000,
  voiceToSpeed: 90,
  voiceToNoise: 2.2,
  threshold: 0.03,
  calmDecay: 0.96
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  activeMode: 'manual',
  theme: 'dark',
  manual: { ...DEFAULT_SETTINGS },
  voice: { ...DEFAULT_VOICE_SETTINGS }
};

export function clampManualSettings(settings: SimulationSettings): SimulationSettings {
  return {
    ...settings,
    particleCount: Math.round(clamp(settings.particleCount, PARTICLE_LIMITS.min, PARTICLE_LIMITS.max)),
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

export function clampVoiceSettings(settings: VoiceControlSettings): VoiceControlSettings {
  return {
    sensitivity: clamp(settings.sensitivity, 0.2, 4),
    maxParticlesFromVoice: Math.round(
      clamp(settings.maxParticlesFromVoice, VOICE_PARTICLE_LIMITS.min, VOICE_PARTICLE_LIMITS.max)
    ),
    voiceToSpeed: clamp(settings.voiceToSpeed, 10, 200),
    voiceToNoise: clamp(settings.voiceToNoise, 0.4, 4),
    threshold: clamp(settings.threshold, 0, 0.2),
    calmDecay: clamp(settings.calmDecay, 0.9, 0.995)
  };
}

export function getManualRuntime(settings: SimulationSettings): RuntimeSimulationControls {
  return {
    activeParticles: settings.particleCount,
    speed: settings.speed,
    noiseScale: settings.noiseScale,
    noiseStrength: settings.noiseStrength,
    turbulence: settings.turbulence,
    trail: settings.trail
  };
}

function getDefaultAppSettings(): AppSettings {
  return {
    ...DEFAULT_APP_SETTINGS,
    manual: { ...DEFAULT_SETTINGS },
    voice: { ...DEFAULT_VOICE_SETTINGS }
  };
}

export function loadAppSettings(): AppSettings {
  const parsed = readJson<Partial<AppSettings>>(STORAGE_KEY);
  if (!parsed) {
    return getDefaultAppSettings();
  }

  const activeMode = parsed.activeMode === 'voice' ? 'voice' : 'manual';
  const theme = parsed.theme === 'sand' ? 'sand' : 'dark';

  return {
    activeMode,
    theme,
    manual: clampManualSettings({ ...DEFAULT_SETTINGS, ...parsed.manual }),
    voice: clampVoiceSettings({ ...DEFAULT_VOICE_SETTINGS, ...parsed.voice })
  };
}

export function saveAppSettings(settings: AppSettings): void {
  writeJson(STORAGE_KEY, settings);
}
