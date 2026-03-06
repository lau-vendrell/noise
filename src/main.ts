import './styles.css';
import { AudioFeatureExtractor } from './audio/audioAnalysis';
import { VoiceMapper } from './audio/audioMapping';
import { MicrophoneController, MicrophoneStatus } from './audio/microphone';
import { ParticleSystem } from './sim/particleSystem';
import {
  AppSettings,
  clampManualSettings,
  clampVoiceSettings,
  getManualRuntime,
  loadAppSettings,
  saveAppSettings,
  ThemeMode
} from './sim/simulationState';
import { createControlPanel } from './ui/controlPanel';

const canvas = document.getElementById('noise-canvas') as HTMLCanvasElement | null;
const panelRoot = document.getElementById('ui-root') as HTMLDivElement | null;

if (!canvas || !panelRoot) {
  throw new Error('Missing required DOM nodes');
}

const appState: AppSettings = loadAppSettings();
let panelVisible = true;
let micStatus: MicrophoneStatus = 'off';
let micLevel = 0;
const SUN_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
const MOON_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
const themeToggleBtn = document.createElement('button');
themeToggleBtn.type = 'button';
themeToggleBtn.className = 'theme-toggle-fab';
themeToggleBtn.addEventListener('click', () => {
  appState.theme = appState.theme === 'dark' ? 'sand' : 'dark';
  applyTheme(appState.theme);
  persistAndSync();
});
document.body.appendChild(themeToggleBtn);

const sim = new ParticleSystem(canvas, appState.manual);
applyTheme(appState.theme);
sim.setPaused(appState.manual.paused);
sim.setRuntimeControls(getManualRuntime(appState.manual));

const microphone = new MicrophoneController();
const extractor = new AudioFeatureExtractor();
const mapper = new VoiceMapper();
mapper.enterCalm(appState.manual);

if (appState.activeMode === 'voice') {
  sim.setRuntimeControls(mapper.map({ rms: 0, energy: 0, flux: 0, centroid: 0 }, appState.voice, appState.manual));
}

const controls = createControlPanel(panelRoot, appState, {
  onModeChange(mode) {
    if (appState.activeMode === mode) return;
    appState.activeMode = mode;

    if (mode === 'manual') {
      sim.setRuntimeControls(getManualRuntime(appState.manual));
    } else {
      mapper.enterCalm(appState.manual);
      sim.setRuntimeControls(mapper.map({ rms: 0, energy: 0, flux: 0, centroid: 0 }, appState.voice, appState.manual));
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

function applyTheme(theme: ThemeMode): void {
  document.body.dataset.theme = theme;
  sim.setTheme(theme);
  themeToggleBtn.innerHTML = theme === 'sand' ? MOON_ICON : SUN_ICON;
  themeToggleBtn.setAttribute('aria-label', theme === 'sand' ? 'Switch to dark mode' : 'Switch to light mode');
}

function persistAndSync(): void {
  saveAppSettings(appState);
  controls.sync(appState);
  controls.updateMicrophone(micStatus, micLevel);
}

controls.sync(appState);
controls.updateMicrophone(micStatus, micLevel);

microphone.subscribe((status) => {
  micStatus = status;
  if (status !== 'listening') {
    micLevel = 0;
  }
  controls.updateMicrophone(micStatus, micLevel);
});

window.addEventListener('resize', () => {
  sim.resize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (key === 'p') {
    event.preventDefault();
    appState.manual.paused = !appState.manual.paused;
    sim.setPaused(appState.manual.paused);
    persistAndSync();
    return;
  }

  if (key === 'r') {
    sim.resetDrawnFlow();
    sim.resetParticles();
    sim.clear();
    return;
  }

  if (key === 's') {
    sim.randomizeSeed();
    appState.manual.seed = sim.getSettings().seed;
    persistAndSync();
    return;
  }

  if (key === 'h') {
    panelVisible = !panelVisible;
    controls.setVisible(panelVisible);
  }
});

function loop(ts: number) {
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
}

requestAnimationFrame(loop);
