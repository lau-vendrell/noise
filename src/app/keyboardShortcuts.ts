export interface KeyboardShortcutHandlers {
  onTogglePause: () => void;
  onReset: () => void;
  onRandomizeSeed: () => void;
  onTogglePanel: () => void;
}

export function bindKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (key === 'p') {
      event.preventDefault();
      handlers.onTogglePause();
      return;
    }

    if (key === 'r') {
      handlers.onReset();
      return;
    }

    if (key === 's') {
      handlers.onRandomizeSeed();
      return;
    }

    if (key === 'h') {
      handlers.onTogglePanel();
    }
  });
}
