export type CommandCtx = {
  openSelected: () => void;
  openFile: () => void;
  goParent: () => void;
  moveUp: () => void;
  moveDown: () => void;
  goTop: () => void;
  goBottom: () => void;
  refresh: () => void;
  openSearch: () => void;
  togglePreviewMax: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  toggleHelp: () => void;
};

export interface Command {
  id: string;
  run: (ctx: CommandCtx) => void;
  description?: string;
}

export class CommandRegistry {
  private map = new Map<string, Command>();
  register(cmd: Command) { this.map.set(cmd.id, cmd); }
  run(id: string, ctx: CommandCtx) { this.map.get(id)?.run(ctx); }
  ids() { return [...this.map.keys()]; }
}

export const defaultCommands: Command[] = [
  { id: 'open', run: (c) => c.openSelected(), description: 'Open file/folder' },
  { id: 'openFile', run: (c) => c.openFile(), description: 'Open file (preview target)' },
  { id: 'back', run: (c) => c.goParent(), description: 'Go parent' },
  { id: 'up', run: (c) => c.moveUp(), description: 'Move up' },
  { id: 'down', run: (c) => c.moveDown(), description: 'Move down' },
  { id: 'top', run: (c) => c.goTop(), description: 'Go top' },
  { id: 'bottom', run: (c) => c.goBottom(), description: 'Go bottom' },
  { id: 'refresh', run: (c) => c.refresh(), description: 'Reload' },
  { id: 'search', run: (c) => c.openSearch(), description: 'Filter entries' },
  { id: 'togglePreviewMax', run: (c) => c.togglePreviewMax(), description: 'Toggle preview maximize' },
  { id: 'zoomIn', run: (c) => c.zoomIn(), description: 'Zoom in preview' },
  { id: 'zoomOut', run: (c) => c.zoomOut(), description: 'Zoom out preview' },
  { id: 'zoomReset', run: (c) => c.zoomReset(), description: 'Reset preview zoom' },
  { id: 'help', run: (c) => c.toggleHelp(), description: 'Show keybinds' },
];
