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
  min: 2000,
  max: 12000
} as const;

export const VOICE_PARTICLE_LIMITS = {
  min: 2500,
  max: 14000
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
  maxParticlesFromVoice: 9000,
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
    particleCount: Math.min(PARTICLE_LIMITS.max, Math.max(PARTICLE_LIMITS.min, Math.round(settings.particleCount))),
    speed: Math.min(220, Math.max(5, settings.speed)),
    noiseScale: Math.min(0.008, Math.max(0.0005, settings.noiseScale)),
    noiseStrength: Math.min(4, Math.max(0.2, settings.noiseStrength)),
    turbulence: Math.min(6, Math.max(1, Math.round(settings.turbulence))),
    trail: Math.min(1, Math.max(0, settings.trail)),
    mouseStrength: Math.min(8, Math.max(0, settings.mouseStrength)),
    mouseRadius: Math.min(220, Math.max(4, settings.mouseRadius)),
    overlayDecay: Math.min(0.999, Math.max(0.8, settings.overlayDecay)),
    drawFlow: Boolean(settings.drawFlow),
    seed: settings.seed | 0,
    paused: Boolean(settings.paused)
  };
}

export function clampVoiceSettings(settings: VoiceControlSettings): VoiceControlSettings {
  return {
    sensitivity: Math.min(4, Math.max(0.2, settings.sensitivity)),
    maxParticlesFromVoice: Math.min(VOICE_PARTICLE_LIMITS.max, Math.max(VOICE_PARTICLE_LIMITS.min, Math.round(settings.maxParticlesFromVoice))),
    voiceToSpeed: Math.min(200, Math.max(10, settings.voiceToSpeed)),
    voiceToNoise: Math.min(4, Math.max(0.4, settings.voiceToNoise)),
    threshold: Math.min(0.2, Math.max(0, settings.threshold)),
    calmDecay: Math.min(0.995, Math.max(0.9, settings.calmDecay))
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

export function loadAppSettings(): AppSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      ...DEFAULT_APP_SETTINGS,
      manual: { ...DEFAULT_SETTINGS },
      voice: { ...DEFAULT_VOICE_SETTINGS }
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const activeMode = parsed.activeMode === 'voice' ? 'voice' : 'manual';
    const theme = parsed.theme === 'sand' ? 'sand' : 'dark';
    return {
      activeMode,
      theme,
      manual: clampManualSettings({ ...DEFAULT_SETTINGS, ...parsed.manual }),
      voice: clampVoiceSettings({ ...DEFAULT_VOICE_SETTINGS, ...parsed.voice })
    };
  } catch {
    return {
      ...DEFAULT_APP_SETTINGS,
      manual: { ...DEFAULT_SETTINGS },
      voice: { ...DEFAULT_VOICE_SETTINGS }
    };
  }
}

export function saveAppSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
