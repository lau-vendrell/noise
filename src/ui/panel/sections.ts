import { MicrophoneStatus } from '../../audio/microphone';
import { SimulationSettings } from '../../sim/simulationState';
import { formatControlValue } from '../controls/format';
import { createSliderRow } from '../controls/sliderControl';
import { getMicButtonLabel, getMicIcon, isMicOn } from './icons';
import { SliderConfig, SliderRefs } from './types';

export function createModeToggleRow(onManual: () => void, onVoice: () => void): {
  row: HTMLDivElement;
  manualButton: HTMLButtonElement;
  voiceButton: HTMLButtonElement;
} {
  const row = document.createElement('div');
  row.className = 'mode-row';

  const manualButton = document.createElement('button');
  manualButton.type = 'button';
  manualButton.textContent = 'Manual';
  manualButton.className = 'mode-btn';
  manualButton.addEventListener('click', onManual);

  const voiceButton = document.createElement('button');
  voiceButton.type = 'button';
  voiceButton.textContent = 'Voice';
  voiceButton.className = 'mode-btn';
  voiceButton.addEventListener('click', onVoice);

  row.appendChild(manualButton);
  row.appendChild(voiceButton);
  return { row, manualButton, voiceButton };
}

export function createActionButtons(onPause: () => void, onReset: () => void, onSeed: () => void): {
  row: HTMLDivElement;
  pauseButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  seedButton: HTMLButtonElement;
} {
  const row = document.createElement('div');
  row.className = 'button-row';

  const pauseButton = document.createElement('button');
  pauseButton.type = 'button';
  pauseButton.className = 'secondary-btn';
  pauseButton.addEventListener('click', onPause);

  const resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'secondary-btn';
  resetButton.textContent = 'Reset (R)';
  resetButton.addEventListener('click', onReset);

  const seedButton = document.createElement('button');
  seedButton.type = 'button';
  seedButton.className = 'secondary-btn';
  seedButton.textContent = 'Seed (S)';
  seedButton.addEventListener('click', onSeed);

  row.appendChild(pauseButton);
  row.appendChild(resetButton);
  row.appendChild(seedButton);

  return { row, pauseButton, resetButton, seedButton };
}

export function mountSliderGroup<T extends string>(
  parent: HTMLElement,
  configs: SliderConfig<T>[],
  source: Record<string, number>,
  onChange: (key: T, value: number) => void
): Map<T, SliderRefs> {
  const refs = new Map<T, SliderRefs>();

  configs.forEach((config) => {
    const { row, refs: sliderRefs } = createSliderRow({
      label: config.label,
      min: config.min,
      max: config.max,
      step: config.step,
      initialValue: source[config.id],
      format: config.format,
      onChange: (value) => onChange(config.id, value)
    });

    parent.appendChild(row);
    refs.set(config.id, sliderRefs);
  });

  return refs;
}

export interface VoiceStatusRefs {
  micButton: HTMLButtonElement;
  micIcon: HTMLSpanElement;
  micText: HTMLSpanElement;
  meterFill: HTMLDivElement;
}

export function createVoiceStatusSection(onToggleMicrophone: () => void): { container: HTMLDivElement; refs: VoiceStatusRefs } {
  const container = document.createElement('div');
  container.className = 'voice-status';

  const micButton = document.createElement('button');
  micButton.type = 'button';
  micButton.className = 'secondary-btn mic-btn';
  micButton.addEventListener('click', onToggleMicrophone);

  const micIcon = document.createElement('span');
  micIcon.className = 'mic-icon';

  const micText = document.createElement('span');
  micText.className = 'mic-text';

  micButton.appendChild(micIcon);
  micButton.appendChild(micText);

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

  container.appendChild(micButton);
  container.appendChild(meterRow);

  return {
    container,
    refs: { micButton, micIcon, micText, meterFill }
  };
}

export function appendResearchNote(parent: HTMLElement): void {
  const researchNote = document.createElement('span');
  researchNote.className = 'research-note';
  researchNote.innerHTML =
    'A creative experiment by Laura Vendrell<span class="sparkles" aria-hidden="true"><svg class="sparkle sparkle-main" viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"></path></svg><svg class="sparkle sparkle-small" viewBox="0 0 24 24"><path d="M12 4.5l1.2 3.3 3.3 1.2-3.3 1.2L12 13.5l-1.2-3.3L7.5 9l3.3-1.2L12 4.5z"></path></svg></span>';

  parent.appendChild(researchNote);
}

export function setModeActive(
  activeMode: 'manual' | 'voice',
  manualButton: HTMLButtonElement,
  voiceButton: HTMLButtonElement,
  manualSection: HTMLElement,
  voiceSection: HTMLElement
): void {
  const manualActive = activeMode === 'manual';
  manualButton.classList.toggle('active', manualActive);
  voiceButton.classList.toggle('active', !manualActive);
  manualSection.classList.toggle('is-active', manualActive);
  voiceSection.classList.toggle('is-active', !manualActive);
}

export function syncSliders<T extends string>(refs: Map<T, SliderRefs>, source: Record<string, number>): void {
  refs.forEach((ref, key) => {
    const value = source[key];
    if (typeof value !== 'number') return;
    ref.input.value = String(value);
    ref.value.textContent = formatControlValue(value, ref.format);
  });
}

export function updateActionButtons(
  pauseButtons: HTMLButtonElement[],
  resetButtons: HTMLButtonElement[],
  seedButtons: HTMLButtonElement[],
  settings: SimulationSettings
): void {
  const mobile = window.matchMedia('(max-width: 720px)').matches;

  pauseButtons.forEach((btn) => {
    btn.textContent = settings.paused ? (mobile ? 'Play' : 'Play (P)') : (mobile ? 'Pause' : 'Pause (P)');
  });

  resetButtons.forEach((btn) => {
    btn.textContent = mobile ? 'Reset' : 'Reset (R)';
  });

  seedButtons.forEach((btn) => {
    btn.textContent = mobile ? 'Seed' : 'Seed (S)';
  });
}

export function updateVoiceStatus(refs: VoiceStatusRefs, status: MicrophoneStatus, level: number): void {
  refs.micIcon.innerHTML = getMicIcon(status);
  refs.micIcon.dataset.status = status;
  refs.micText.textContent = getMicButtonLabel(status);
  refs.micButton.classList.toggle('listening', isMicOn(status));
  refs.micButton.setAttribute('aria-pressed', String(isMicOn(status)));
  refs.meterFill.style.transform = `scaleX(${Math.min(1, Math.max(0, level))})`;
}
