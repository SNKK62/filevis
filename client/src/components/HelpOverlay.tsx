import React from 'react';
import type { KeyHelpItem } from '../hooks/useKeyHelp';

export default function HelpOverlay({ items, onClose }: { items: KeyHelpItem[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded shadow p-4 max-w-3xl w-[90%] max-h-[70vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold mb-2">キーバインド一覧</h2>
        <ul className="text-xs grid grid-cols-2 gap-x-6 gap-y-1">
          {items.map((it) => (
            <li key={it.id} className="whitespace-nowrap">
              {it.keys.map((k, i) => (
                <kbd key={k} className={`px-1 border rounded ${i < it.keys.length - 1 ? 'mr-1' : 'mr-2'}`}>{k}</kbd>
              ))}
              {it.description}
            </li>
          ))}
        </ul>
        <div className="text-right mt-3">
          <button className="underline text-sm" onClick={onClose}>閉じる</button>
        </div>
      </div>
    </div>
  );
}

