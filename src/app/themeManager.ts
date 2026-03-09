import { ThemeMode } from '../sim/simulationState';
import { MOON_ICON, SUN_ICON } from './constants';

interface ThemeManagerDeps {
  onThemeChange: (theme: ThemeMode) => void;
}

export interface ThemeManager {
  setTheme: (theme: ThemeMode) => void;
}

export function createThemeManager(initialTheme: ThemeMode, deps: ThemeManagerDeps): ThemeManager {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'theme-toggle-fab';

  let currentTheme = initialTheme;

  const syncButton = () => {
    button.innerHTML = currentTheme === 'sand' ? MOON_ICON : SUN_ICON;
    button.setAttribute('aria-label', currentTheme === 'sand' ? 'Switch to dark mode' : 'Switch to light mode');
  };

  button.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'sand' : 'dark';
    deps.onThemeChange(currentTheme);
    syncButton();
  });

  syncButton();
  document.body.appendChild(button);

  return {
    setTheme(theme: ThemeMode) {
      currentTheme = theme;
      syncButton();
    }
  };
}
