import { useMemo } from 'react';
import { defaultCommands } from '../commands';
import { loadKeymap } from '../keymap';

export type KeyHelpItem = { id: string; keys: string[]; description: string };

export function useKeyHelp(): KeyHelpItem[] {
  const keymap = useMemo(() => loadKeymap(), []);
  return useMemo(() => {
    const cmdMap = new Map(defaultCommands.map((c) => [c.id, c.description ?? c.id]));
    const groups = new Map<string, string[]>();
    keymap.forEach(({ key, command }) => {
      if (!groups.has(command)) groups.set(command, []);
      groups.get(command)!.push(key);
    });
    // TODO: This is redundant
    const order = [
      'down','up','back','open','openFile','top','bottom',
      'togglePreviewMax','zoomIn','zoomOut','zoomReset','refresh','search','help'
    ];
    const items = Array.from(groups.entries()).map(([id, keys]) => ({
      id,
      keys: Array.from(new Set(keys)),
      description: cmdMap.get(id) || id,
    }));
    items.sort((a, b) => (order.indexOf(a.id) - order.indexOf(b.id)) || a.id.localeCompare(b.id));
    return items;
  }, [keymap]);
}

