export type KeyBinding = { key: string; command: string };
export type KeyMap = KeyBinding[];

export const defaultKeymap: KeyMap = [
  { key: 'j', command: 'down' },
  { key: 'k', command: 'up' },
  { key: 'h', command: 'back' },
  { key: 'l', command: 'open' },
  { key: 'Enter', command: 'openFile' },
  { key: 'g', command: 'top' },
  { key: 'G', command: 'bottom' },
  { key: 'r', command: 'refresh' },
  { key: '/', command: 'search' },
  { key: 'f', command: 'togglePreviewMax' },
  { key: '+', command: 'zoomIn' },
  { key: '=', command: 'zoomIn' },
  { key: '-', command: 'zoomOut' },
  { key: '_', command: 'zoomOut' },
  { key: '0', command: 'zoomReset' },
  { key: '?', command: 'help' },
];

export function loadKeymap(): KeyMap {
  try {
    const s = localStorage.getItem('localview.keymap');
    if (s) return JSON.parse(s);
  } catch {}
  return defaultKeymap;
}

export function saveKeymap(km: KeyMap) {
  localStorage.setItem('localview.keymap', JSON.stringify(km));
}
