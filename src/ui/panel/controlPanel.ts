import { AppSettings, SimulationSettings, VoiceControlSettings } from '../../sim/simulationState';
import { CHEVRON_ICON } from './icons';
import { manualSliders, voiceSliders } from './sliderConfigs';
import {
  appendResearchNote,
  createActionButtons,
  createModeToggleRow,
  createVoiceStatusSection,
  mountSliderGroup,
  setModeActive,
  syncSliders,
  updateActionButtons,
  updateVoiceStatus
} from './sections';
import { ControlPanelActions, ControlPanelApi } from './types';

export function createControlPanel(root: HTMLElement, initial: AppSettings, actions: ControlPanelActions): ControlPanelApi {
  root.innerHTML = '';
  let open = true;
  let visible = true;

  const panel = document.createElement('section');
  panel.className = 'control-panel glass-panel';

  const headerButton = document.createElement('button');
  headerButton.type = 'button';
  headerButton.className = 'panel-header';

  const title = document.createElement('span');
  title.className = 'panel-title';
  title.textContent = 'Noise control';

  const chevron = document.createElement('span');
  chevron.className = 'panel-chevron';
  chevron.innerHTML = CHEVRON_ICON;

  headerButton.appendChild(title);
  headerButton.appendChild(chevron);

  const content = document.createElement('div');
  content.className = 'panel-content';

  const { row: modeRow, manualButton, voiceButton } = createModeToggleRow(
    () => actions.onModeChange('manual'),
    () => actions.onModeChange('voice')
  );
  content.appendChild(modeRow);

  const manualSection = document.createElement('section');
  manualSection.className = 'mode-section';

  const voiceSection = document.createElement('section');
  voiceSection.className = 'mode-section';

  const manualRows = document.createElement('div');
  manualRows.className = 'control-rows';
  manualSection.appendChild(manualRows);

  const manualRefs = mountSliderGroup(
    manualRows,
    manualSliders,
    initial.manual as unknown as Record<string, number>,
    (key, value) => actions.onManualChange({ [key]: value } as Partial<SimulationSettings>)
  );

  const pauseButtons: HTMLButtonElement[] = [];
  const resetButtons: HTMLButtonElement[] = [];
  const seedButtons: HTMLButtonElement[] = [];

  const manualActions = createActionButtons(actions.onTogglePause, actions.onReset, actions.onSeed);
  manualSection.appendChild(manualActions.row);
  pauseButtons.push(manualActions.pauseButton);
  resetButtons.push(manualActions.resetButton);
  seedButtons.push(manualActions.seedButton);

  const { container: voiceStatusSection, refs: voiceStatusRefs } = createVoiceStatusSection(actions.onToggleMicrophone);
  voiceSection.appendChild(voiceStatusSection);

  const voiceRows = document.createElement('div');
  voiceRows.className = 'control-rows';
  voiceSection.appendChild(voiceRows);

  const voiceRefs = mountSliderGroup(
    voiceRows,
    voiceSliders,
    initial.voice as unknown as Record<string, number>,
    (key, value) => actions.onVoiceChange({ [key]: value } as Partial<VoiceControlSettings>)
  );

  const voiceActions = createActionButtons(actions.onTogglePause, actions.onReset, actions.onSeed);
  voiceSection.appendChild(voiceActions.row);
  pauseButtons.push(voiceActions.pauseButton);
  resetButtons.push(voiceActions.resetButton);
  seedButtons.push(voiceActions.seedButton);

  content.appendChild(manualSection);
  content.appendChild(voiceSection);
  appendResearchNote(content);

  panel.appendChild(headerButton);
  panel.appendChild(content);
  root.appendChild(panel);

  const syncOpenState = () => {
    const collapsed = !open || !visible;
    panel.classList.toggle('is-collapsed', collapsed);
    panel.classList.toggle('is-hidden', !visible);
    headerButton.setAttribute('aria-expanded', String(!collapsed));
    content.hidden = collapsed;
  };

  headerButton.addEventListener('click', () => {
    open = !open;
    syncOpenState();
  });

  return {
    sync(settings: AppSettings) {
      setModeActive(settings.activeMode, manualButton, voiceButton, manualSection, voiceSection);
      updateActionButtons(pauseButtons, resetButtons, seedButtons, settings.manual);
      syncSliders(manualRefs, settings.manual as unknown as Record<string, number>);
      syncSliders(voiceRefs, settings.voice as unknown as Record<string, number>);
      syncOpenState();
    },

    updateMicrophone(status, level) {
      updateVoiceStatus(voiceStatusRefs, status, level);
    },

    setVisible(nextVisible: boolean) {
      visible = nextVisible;
      syncOpenState();
    }
  };
}
