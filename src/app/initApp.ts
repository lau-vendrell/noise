import { AudioFeatureExtractor } from '../audio/audioAnalysis';
import { VoiceMapper } from '../audio/audioMapping';
import { MicrophoneController, MicrophoneStatus } from '../audio/microphone';
import { ParticleSystem } from '../sim/particleSystem';
import {
  AppSettings,
  ThemeMode,
  clampManualSettings,
  clampVoiceSettings,
  getManualRuntime,
  loadAppSettings,
  saveAppSettings
} from '../sim/simulationState';
import { createControlPanel } from '../ui/panel/controlPanel';
import { SILENT_AUDIO_FEATURES } from './constants';
import { getRequiredDomNodes } from './dom';
import { bindKeyboardShortcuts } from './keyboardShortcuts';
import { createThemeManager } from './themeManager';

export function initApp(): void {
  const { canvas, panelRoot } = getRequiredDomNodes();

  const appState: AppSettings = loadAppSettings();
  let panelVisible = true;
  let micStatus: MicrophoneStatus = 'off';
  let micLevel = 0;

  const sim = new ParticleSystem(canvas, appState.manual);
  const microphone = new MicrophoneController();
  const extractor = new AudioFeatureExtractor();
  const mapper = new VoiceMapper();

  const applyTheme = (theme: ThemeMode) => {
    document.body.dataset.theme = theme;
    sim.setTheme(theme);
    themeManager.setTheme(theme);
  };

  const themeManager = createThemeManager(appState.theme, {
    onThemeChange(theme) {
      appState.theme = theme;
      applyTheme(theme);
      persistAndSync();
    }
  });

  mapper.enterCalm(appState.manual);
  sim.setPaused(appState.manual.paused);
  sim.setRuntimeControls(getManualRuntime(appState.manual));

  if (appState.activeMode === 'voice') {
    sim.setRuntimeControls(mapper.map(SILENT_AUDIO_FEATURES, appState.voice, appState.manual));
  }

  applyTheme(appState.theme);

  const controls = createControlPanel(panelRoot, appState, {
    onModeChange(mode) {
      if (appState.activeMode === mode) return;
      appState.activeMode = mode;

      if (mode === 'manual') {
        sim.setRuntimeControls(getManualRuntime(appState.manual));
      } else {
        mapper.enterCalm(appState.manual);
        sim.setRuntimeControls(mapper.map(SILENT_AUDIO_FEATURES, appState.voice, appState.manual));
      }

      persistAndSync();
    },

    onManualChange(next) {
      appState.manual = clampManualSettings({ ...appState.manual, ...next });
      sim.setSettings(next);
      sim.setPaused(appState.manual.paused);

      if (appState.activeMode === 'manual') {
        sim.setRuntimeControls(getManualRuntime(appState.manual));
      }

      persistAndSync();
    },

    onVoiceChange(next) {
      appState.voice = clampVoiceSettings({ ...appState.voice, ...next });
      persistAndSync();
    },

    onSeed() {
      sim.randomizeSeed();
      appState.manual.seed = sim.getSettings().seed;
      persistAndSync();
    },

    onReset() {
      sim.resetDrawnFlow();
      sim.resetParticles();
      sim.clear();
    },

    onTogglePause() {
      appState.manual.paused = !appState.manual.paused;
      sim.setPaused(appState.manual.paused);
      persistAndSync();
    },

    onToggleMicrophone() {
      if (micStatus === 'listening') {
        microphone.stopMicrophone();
        return;
      }
      void microphone.startMicrophone();
    }
  });

  const persistAndSync = () => {
    saveAppSettings(appState);
    controls.sync(appState);
    controls.updateMicrophone(micStatus, micLevel);
  };

  controls.sync(appState);
  controls.updateMicrophone(micStatus, micLevel);

  microphone.subscribe((status) => {
    micStatus = status;
    if (status !== 'listening') {
      micLevel = 0;
    }
    controls.updateMicrophone(micStatus, micLevel);
  });

  const getViewportSize = () => {
    const viewport = window.visualViewport;
    if (viewport) {
      return {
        width: Math.round(viewport.width),
        height: Math.round(viewport.height)
      };
    }

    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  };

  const syncViewport = () => {
    const { width, height } = getViewportSize();
    sim.resize(width, height);
  };

  syncViewport();
  window.addEventListener('resize', syncViewport);
  window.addEventListener('orientationchange', syncViewport);
  window.visualViewport?.addEventListener('resize', syncViewport);
  window.visualViewport?.addEventListener('scroll', syncViewport);

  bindKeyboardShortcuts({
    onTogglePause() {
      appState.manual.paused = !appState.manual.paused;
      sim.setPaused(appState.manual.paused);
      persistAndSync();
    },
    onReset() {
      sim.resetDrawnFlow();
      sim.resetParticles();
      sim.clear();
    },
    onRandomizeSeed() {
      sim.randomizeSeed();
      appState.manual.seed = sim.getSettings().seed;
      persistAndSync();
    },
    onTogglePanel() {
      panelVisible = !panelVisible;
      controls.setVisible(panelVisible);
    }
  });

  const loop = (ts: number) => {
    const audioFeatures = extractor.analyze(microphone.getAnalyserNode());

    if (micStatus === 'listening') {
      const targetLevel = audioFeatures.rms;
      const rise = 0.28;
      const fall = 0.08;
      const factor = targetLevel > micLevel ? rise : fall;
      micLevel += (targetLevel - micLevel) * factor;
    } else {
      micLevel *= 0.88;
      if (micLevel < 0.001) micLevel = 0;
    }

    if (appState.activeMode === 'voice') {
      const mapped = mapper.map(audioFeatures, appState.voice, appState.manual);
      sim.setRuntimeControls(mapped);
      controls.updateMicrophone(micStatus, mapped.level);
    } else {
      sim.setRuntimeControls(getManualRuntime(appState.manual));
      controls.updateMicrophone(micStatus, micLevel);
    }

    sim.step(ts);
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}
