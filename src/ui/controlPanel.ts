import {
  AppSettings,
  ControlMode,
  PARTICLE_LIMITS,
  SimulationSettings,
  VOICE_PARTICLE_LIMITS,
  VoiceControlSettings
} from '../sim/simulationState';
import { MicrophoneStatus } from '../audio/microphone';

interface SliderConfig<T extends string> {
  id: T;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
}

interface SliderRefs {
  input: HTMLInputElement;
  value: HTMLSpanElement;
  format?: (value: number) => string;
}

export interface ControlPanelActions {
  onModeChange: (mode: ControlMode) => void;
  onManualChange: (next: Partial<SimulationSettings>) => void;
  onVoiceChange: (next: Partial<VoiceControlSettings>) => void;
  onSeed: () => void;
  onReset: () => void;
  onTogglePause: () => void;
  onToggleMicrophone: () => void;
}

const CHEVRON_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>';

const manualSliders: SliderConfig<keyof Pick<SimulationSettings, 'particleCount' | 'speed' | 'noiseScale' | 'noiseStrength' | 'turbulence' | 'trail'>>[] = [
  { id: 'particleCount', label: 'Particle count', min: PARTICLE_LIMITS.min, max: PARTICLE_LIMITS.max, step: 100 },
  { id: 'speed', label: 'Speed', min: 5, max: 100, step: 1 },
  { id: 'noiseScale', label: 'Noise scale', min: 0.0005, max: 0.008, step: 0.0001, format: (value) => value.toFixed(4) },
  { id: 'noiseStrength', label: 'Noise strength', min: 0.2, max: 4, step: 0.05, format: (value) => value.toFixed(2) },
  { id: 'turbulence', label: 'Turbulence / Octaves', min: 1, max: 6, step: 1 },
  { id: 'trail', label: 'Trail', min: 0, max: 1, step: 0.01, format: (value) => value.toFixed(2) }
];

const voiceSliders: SliderConfig<keyof VoiceControlSettings>[] = [
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

function formatValue(value: number, formatter?: (value: number) => string): string {
  if (formatter) return formatter(value);
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(Math.round(rounded)) : String(rounded);
}

function isMicOn(status: MicrophoneStatus): boolean {
  return status === 'listening';
}

function getMicIcon(status: MicrophoneStatus): string {
  if (isMicOn(status)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2"></path><path d="M19 10v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
}

function getMicButtonLabel(status: MicrophoneStatus): string {
  return isMicOn(status) ? 'Listening' : 'Start speaking';
}

export function createControlPanel(root: HTMLElement, initial: AppSettings, actions: ControlPanelActions) {
  root.innerHTML = '';
  let open = true;
  let visible = true;

  const panel = document.createElement('section');
  panel.className = 'control-panel glass-panel';

  const headerBtn = document.createElement('button');
  headerBtn.type = 'button';
  headerBtn.className = 'panel-header';

  const title = document.createElement('span');
  title.className = 'panel-title';
  title.textContent = 'Noise control';

  const chevron = document.createElement('span');
  chevron.className = 'panel-chevron';
  chevron.innerHTML = CHEVRON_ICON;

  headerBtn.appendChild(title);
  headerBtn.appendChild(chevron);

  const content = document.createElement('div');
  content.className = 'panel-content';

  const modeRow = document.createElement('div');
  modeRow.className = 'mode-row';

  const manualModeBtn = document.createElement('button');
  manualModeBtn.type = 'button';
  manualModeBtn.textContent = 'Manual';
  manualModeBtn.className = 'mode-btn';
  manualModeBtn.addEventListener('click', () => actions.onModeChange('manual'));

  const voiceModeBtn = document.createElement('button');
  voiceModeBtn.type = 'button';
  voiceModeBtn.textContent = 'Voice';
  voiceModeBtn.className = 'mode-btn';
  voiceModeBtn.addEventListener('click', () => actions.onModeChange('voice'));

  modeRow.appendChild(manualModeBtn);
  modeRow.appendChild(voiceModeBtn);
  content.appendChild(modeRow);

  const manualSection = document.createElement('section');
  manualSection.className = 'mode-section';
  const voiceSection = document.createElement('section');
  voiceSection.className = 'mode-section';

  const manualRefs = new Map<keyof SimulationSettings, SliderRefs>();
  const voiceRefs = new Map<keyof VoiceControlSettings, SliderRefs>();
  const pauseButtons: HTMLButtonElement[] = [];
  const resetButtons: HTMLButtonElement[] = [];
  const seedButtons: HTMLButtonElement[] = [];

  const createActionButtons = () => {
    const row = document.createElement('div');
    row.className = 'button-row';

    const pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.className = 'secondary-btn';
    pauseBtn.addEventListener('click', actions.onTogglePause);
    pauseButtons.push(pauseBtn);

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'secondary-btn';
    resetBtn.textContent = 'Reset (R)';
    resetBtn.addEventListener('click', actions.onReset);
    resetButtons.push(resetBtn);

    const seedBtn = document.createElement('button');
    seedBtn.type = 'button';
    seedBtn.className = 'secondary-btn';
    seedBtn.textContent = 'Seed (S)';
    seedBtn.addEventListener('click', actions.onSeed);
    seedButtons.push(seedBtn);

    row.appendChild(pauseBtn);
    row.appendChild(resetBtn);
    row.appendChild(seedBtn);
    return row;
  };

  manualSliders.forEach((config) => {
    const row = document.createElement('label');
    row.className = 'control-row';

    const label = document.createElement('span');
    label.className = 'control-label';
    label.textContent = config.label;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(config.min);
    input.max = String(config.max);
    input.step = String(config.step);
    input.value = String(initial.manual[config.id]);

    const value = document.createElement('span');
    value.className = 'control-value';
    value.textContent = formatValue(Number(input.value), config.format);

    input.addEventListener('input', () => {
      const numeric = Number(input.value);
      value.textContent = formatValue(numeric, config.format);
      actions.onManualChange({ [config.id]: numeric } as Partial<SimulationSettings>);
    });

    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(value);
    manualSection.appendChild(row);

    manualRefs.set(config.id, { input, value, format: config.format });
  });

  manualSection.appendChild(createActionButtons());

  const voiceStatusRow = document.createElement('div');
  voiceStatusRow.className = 'voice-row';

  const micButton = document.createElement('button');
  micButton.type = 'button';
  micButton.className = 'secondary-btn mic-btn';
  micButton.addEventListener('click', actions.onToggleMicrophone);

  const micIcon = document.createElement('span');
  micIcon.className = 'mic-icon';
  const micText = document.createElement('span');
  micText.className = 'mic-text';

  micButton.appendChild(micIcon);
  micButton.appendChild(micText);
  voiceStatusRow.appendChild(micButton);
  voiceSection.appendChild(voiceStatusRow);

  const meterRow = document.createElement('div');
  meterRow.className = 'meter-row';

  const meterLabel = document.createElement('div');
  meterLabel.className = 'meter-label';
  meterLabel.textContent = 'Input level';

  const meter = document.createElement('div');
  meter.className = 'meter';
  const meterFill = document.createElement('div');
  meterFill.className = 'meter-fill';
  meter.appendChild(meterFill);

  meterRow.appendChild(meterLabel);
  meterRow.appendChild(meter);
  voiceSection.appendChild(meterRow);

  voiceSliders.forEach((config) => {
    const row = document.createElement('label');
    row.className = 'control-row';

    const label = document.createElement('span');
    label.className = 'control-label';
    label.textContent = config.label;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(config.min);
    input.max = String(config.max);
    input.step = String(config.step);
    input.value = String(initial.voice[config.id]);

    const value = document.createElement('span');
    value.className = 'control-value';
    value.textContent = formatValue(Number(input.value), config.format);

    input.addEventListener('input', () => {
      const numeric = Number(input.value);
      value.textContent = formatValue(numeric, config.format);
      actions.onVoiceChange({ [config.id]: numeric } as Partial<VoiceControlSettings>);
    });

    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(value);
    voiceSection.appendChild(row);

    voiceRefs.set(config.id, { input, value, format: config.format });
  });

  voiceSection.appendChild(createActionButtons());

  content.appendChild(manualSection);
  content.appendChild(voiceSection);

  panel.appendChild(headerBtn);
  panel.appendChild(content);
  root.appendChild(panel);

  const syncSliders = <T extends string>(refs: Map<T, SliderRefs>, source: Record<string, number>) => {
    refs.forEach((ref, key) => {
      const value = source[key];
      if (typeof value !== 'number') return;
      ref.input.value = String(value);
      ref.value.textContent = formatValue(value, ref.format);
    });
  };

  const syncOpenState = () => {
    const collapsed = !open || !visible;
    panel.classList.toggle('is-collapsed', collapsed);
    panel.classList.toggle('is-hidden', !visible);
    headerBtn.setAttribute('aria-expanded', String(!collapsed));
    content.hidden = collapsed;
  };

  headerBtn.addEventListener('click', () => {
    open = !open;
    syncOpenState();
  });

  return {
    sync(settings: AppSettings) {
      const mobile = window.matchMedia('(max-width: 720px)').matches;
      const manualActive = settings.activeMode === 'manual';
      manualModeBtn.classList.toggle('active', manualActive);
      voiceModeBtn.classList.toggle('active', !manualActive);
      manualSection.classList.toggle('is-active', manualActive);
      voiceSection.classList.toggle('is-active', !manualActive);

      pauseButtons.forEach((btn) => {
        btn.textContent = settings.manual.paused ? (mobile ? 'Play' : 'Play (P)') : (mobile ? 'Pause' : 'Pause (P)');
      });
      resetButtons.forEach((btn) => {
        btn.textContent = mobile ? 'Reset' : 'Reset (R)';
      });
      seedButtons.forEach((btn) => {
        btn.textContent = mobile ? 'Seed' : 'Seed (S)';
      });

      syncSliders(manualRefs as Map<string, SliderRefs>, settings.manual as unknown as Record<string, number>);
      syncSliders(voiceRefs as Map<string, SliderRefs>, settings.voice as unknown as Record<string, number>);
      syncOpenState();
    },

    updateMicrophone(status: MicrophoneStatus, level: number) {
      micIcon.innerHTML = getMicIcon(status);
      micIcon.dataset.status = status;
      micText.textContent = getMicButtonLabel(status);
      micButton.classList.toggle('listening', isMicOn(status));
      micButton.setAttribute('aria-pressed', String(isMicOn(status)));
      meterFill.style.transform = `scaleX(${Math.min(1, Math.max(0, level))})`;
    },

    setVisible(nextVisible: boolean) {
      visible = nextVisible;
      syncOpenState();
    }
  };
}
