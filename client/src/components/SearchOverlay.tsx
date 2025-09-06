import React from 'react';
import { Input } from './ui/input';

export default function SearchOverlay({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-2 left-2 bg-white border rounded p-2 shadow">
      <Input
        autoFocus
        className="w-64"
        placeholder="Filter... (/で開閉, Tabでペイン切替)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === '/') onClose();
        }}
      />
    </div>
  );
}

