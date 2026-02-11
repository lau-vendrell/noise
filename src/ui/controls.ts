import { DEFAULT_SETTINGS, PARTICLE_LIMITS, SimulationSettings, STORAGE_KEY } from '../sim/types';

export interface UIActions {
  onSettingChange: (next: Partial<SimulationSettings>) => void;
  onSeed: () => void;
  onReset: () => void;
  onTogglePause: () => void;
}

interface SliderConfig {
  id: keyof SimulationSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
}

const sliderConfigs: SliderConfig[] = [
  { id: 'particleCount', label: 'Particles', min: PARTICLE_LIMITS.min, max: PARTICLE_LIMITS.max, step: 100 },
  { id: 'speed', label: 'Speed', min: 5, max: 120, step: 1 },
  { id: 'noiseScale', label: 'Noise Scale', min: 0.0005, max: 0.008, step: 0.0001, format: (v) => v.toFixed(4) },
  { id: 'noiseStrength', label: 'Noise Strength', min: 0.2, max: 4, step: 0.05, format: (v) => v.toFixed(2) },
  { id: 'turbulence', label: 'Turbulence', min: 1, max: 6, step: 1 },
  { id: 'trail', label: 'Trail', min: 0, max: 1, step: 0.01, format: (v) => v.toFixed(2) },
  { id: 'mouseStrength', label: 'Mouse Strength', min: 0, max: 8, step: 0.05, format: (v) => v.toFixed(2) },
  { id: 'mouseRadius', label: 'Mouse Radius', min: 4, max: 220, step: 1 },
  { id: 'overlayDecay', label: 'Overlay Decay', min: 0.8, max: 0.999, step: 0.001, format: (v) => v.toFixed(3) }
];

function clampSettings(settings: SimulationSettings): SimulationSettings {
  return {
    ...settings,
    particleCount: Math.min(PARTICLE_LIMITS.max, Math.max(PARTICLE_LIMITS.min, Math.round(settings.particleCount))),
    speed: Math.min(120, Math.max(5, settings.speed)),
    noiseScale: Math.min(0.008, Math.max(0.0005, settings.noiseScale)),
    noiseStrength: Math.min(4, Math.max(0.2, settings.noiseStrength)),
    turbulence: Math.min(6, Math.max(1, Math.round(settings.turbulence))),
    trail: Math.min(1, Math.max(0, settings.trail)),
    mouseStrength: Math.min(8, Math.max(0, settings.mouseStrength)),
    mouseRadius: Math.min(220, Math.max(4, settings.mouseRadius)),
    overlayDecay: Math.min(0.999, Math.max(0.8, settings.overlayDecay)),
    drawFlow: Boolean(settings.drawFlow),
    seed: settings.seed | 0
  };
}

export function loadSettings(): SimulationSettings {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_SETTINGS };

  try {
    const parsed = JSON.parse(raw) as Partial<SimulationSettings>;
    return clampSettings({ ...DEFAULT_SETTINGS, ...parsed });
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: SimulationSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function createControls(root: HTMLElement, initial: SimulationSettings, actions: UIActions) {
  root.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'panel';

  const title = document.createElement('h1');
  title.textContent = 'Noise Field';
  panel.appendChild(title);

  const sliderInputs = new Map<keyof SimulationSettings, HTMLInputElement>();
  const valueSpans = new Map<keyof SimulationSettings, HTMLSpanElement>();

  sliderConfigs.forEach((cfg) => {
    const row = document.createElement('label');
    row.className = 'control-row';

    const name = document.createElement('span');
    name.className = 'control-label';
    name.textContent = cfg.label;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(cfg.min);
    input.max = String(cfg.max);
    input.step = String(cfg.step);
    input.value = String(initial[cfg.id]);

    const value = document.createElement('span');
    value.className = 'control-value';

    const updateValue = (num: number) => {
      const formatted = cfg.format ? cfg.format(num) : String(Math.round(num * 100) / 100);
      value.textContent = formatted;
    };

    updateValue(Number(input.value));

    input.addEventListener('input', () => {
      const num = Number(input.value);
      updateValue(num);
      actions.onSettingChange({ [cfg.id]: num } as Partial<SimulationSettings>);
    });

    row.appendChild(name);
    row.appendChild(input);
    row.appendChild(value);
    panel.appendChild(row);

    sliderInputs.set(cfg.id, input);
    valueSpans.set(cfg.id, value);
  });

  const drawRow = document.createElement('label');
  drawRow.className = 'control-row toggle-row';

  const drawLabel = document.createElement('span');
  drawLabel.className = 'control-label';
  drawLabel.textContent = 'Draw flow';

  const drawInput = document.createElement('input');
  drawInput.type = 'checkbox';
  drawInput.checked = initial.drawFlow;
  drawInput.addEventListener('change', () => {
    actions.onSettingChange({ drawFlow: drawInput.checked });
  });

  drawRow.appendChild(drawLabel);
  drawRow.appendChild(drawInput);
  panel.appendChild(drawRow);

  const buttons = document.createElement('div');
  buttons.className = 'buttons';

  const pauseBtn = document.createElement('button');
  pauseBtn.type = 'button';
  pauseBtn.textContent = initial.paused ? 'Play (Space)' : 'Pause (Space)';
  pauseBtn.addEventListener('click', actions.onTogglePause);

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.textContent = 'Reset (R)';
  resetBtn.addEventListener('click', actions.onReset);

  const seedBtn = document.createElement('button');
  seedBtn.type = 'button';
  seedBtn.textContent = 'New Seed (S)';
  seedBtn.addEventListener('click', actions.onSeed);

  buttons.appendChild(pauseBtn);
  buttons.appendChild(resetBtn);
  buttons.appendChild(seedBtn);
  panel.appendChild(buttons);

  const helper = document.createElement('p');
  helper.className = 'helper';
  helper.textContent = 'Hover: move/return · Drag: paint and keep · H: hide/show panel';
  panel.appendChild(helper);

  root.appendChild(panel);

  return {
    sync(settings: SimulationSettings) {
      sliderConfigs.forEach((cfg) => {
        const input = sliderInputs.get(cfg.id);
        const value = valueSpans.get(cfg.id);
        if (!input || !value) return;
        input.value = String(settings[cfg.id]);
        const formatted = cfg.format ? cfg.format(Number(input.value)) : String(Math.round(Number(input.value) * 100) / 100);
        value.textContent = formatted;
      });

      pauseBtn.textContent = settings.paused ? 'Play (Space)' : 'Pause (Space)';
      drawInput.checked = settings.drawFlow;
    },
    setVisible(visible: boolean) {
      panel.style.display = visible ? '' : 'none';
    }
  };
}
