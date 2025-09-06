import React from 'react';
import type { KeyHelpItem } from '../hooks/useKeyHelp';

export default function FooterHelp({ items }: { items: KeyHelpItem[] }) {
  return (
    <div className="border-t px-3 py-2 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1 max-h-24 overflow-auto">
      {items.map((it) => (
        <span key={it.id} className="whitespace-nowrap">
          {it.keys.map((k, i) => (
            <kbd key={k} className={`inline-block px-1 border rounded ${i < it.keys.length - 1 ? 'mr-1' : 'mr-2'}`}>{k}</kbd>
          ))}
          {it.description}
        </span>
      ))}
    </div>
  );
}

