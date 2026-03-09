export interface AppDomNodes {
  canvas: HTMLCanvasElement;
  panelRoot: HTMLDivElement;
}

export function getRequiredDomNodes(): AppDomNodes {
  const canvas = document.getElementById('noise-canvas');
  const panelRoot = document.getElementById('ui-root');

  if (!(canvas instanceof HTMLCanvasElement) || !(panelRoot instanceof HTMLDivElement)) {
    throw new Error('Missing required DOM nodes');
  }

  return { canvas, panelRoot };
}
