import './styles.css';
import { ParticleSystem } from './sim/particleSystem';
import { DEFAULT_SETTINGS, SimulationSettings } from './sim/types';
import { createControls, loadSettings, saveSettings } from './ui/controls';

const canvas = document.getElementById('noise-canvas') as HTMLCanvasElement | null;
const panelRoot = document.getElementById('ui-root') as HTMLDivElement | null;

if (!canvas || !panelRoot) {
  throw new Error('Missing required DOM nodes');
}

const loaded = loadSettings();
const state: SimulationSettings = { ...DEFAULT_SETTINGS, ...loaded };
let panelVisible = true;

const sim = new ParticleSystem(canvas, state);

const controls = createControls(panelRoot, state, {
  onSettingChange(next) {
    Object.assign(state, next);
    sim.setSettings(next);
    saveSettings(state);
  },
  onSeed() {
    sim.randomizeSeed();
    Object.assign(state, sim.getSettings());
    saveSettings(state);
    controls.sync(state);
  },
  onReset() {
    sim.resetParticles();
    sim.clear();
  },
  onTogglePause() {
    state.paused = !state.paused;
    sim.setPaused(state.paused);
    saveSettings(state);
    controls.sync(state);
  }
});

controls.sync(state);

window.addEventListener('resize', () => {
  sim.resize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (key === ' ') {
    event.preventDefault();
    state.paused = !state.paused;
    sim.setPaused(state.paused);
    saveSettings(state);
    controls.sync(state);
    return;
  }

  if (key === 'r') {
    sim.resetParticles();
    sim.clear();
    return;
  }

  if (key === 's') {
    sim.randomizeSeed();
    Object.assign(state, sim.getSettings());
    saveSettings(state);
    controls.sync(state);
    return;
  }

  if (key === 'h') {
    panelVisible = !panelVisible;
    controls.setVisible(panelVisible);
  }
});

function loop(ts: number) {
  sim.step(ts);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
