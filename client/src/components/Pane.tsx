import React, { useEffect, useRef, useState } from 'react';
import type { Entry } from '../types';

type Props = {
  entries: Entry[];
  selected: number;
  onSelect: (idx: number) => void;
  isActive?: boolean;
  pageSize?: number;
};

export default function Pane({ entries, selected, onSelect, isActive = true, pageSize = 1000 }: Props) {
  const [visibleCount, setVisibleCount] = useState(Math.min(pageSize, entries.length));
  const ref = useRef<HTMLDivElement | null>(null);

  // Reset when entries change
  useEffect(() => {
    setVisibleCount(Math.min(pageSize, entries.length));
  }, [entries, pageSize]);

  // Ensure selected item is within visible window
  useEffect(() => {
    if (selected >= visibleCount) {
      setVisibleCount((c) => Math.min(entries.length, Math.max(selected + 1, c + pageSize)));
    }
  }, [selected, visibleCount, entries.length, pageSize]);

  const loadMore = () => {
    setVisibleCount((c) => Math.min(entries.length, c + pageSize));
  };

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
      loadMore();
    }
  };

  const slice = entries.slice(0, visibleCount);
  const remaining = entries.length - slice.length;

  // Auto-scroll selected row into view when focus/selection changes
  useEffect(() => {
    if (!isActive) return;
    const container = ref.current;
    if (!container) return;
    const el = container.querySelector<HTMLLIElement>(`li[data-idx="${selected}"]`);
    if (el) {
      // Use nearest to avoid jumping too much
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selected, visibleCount, isActive]);

  return (
    <div ref={ref} className="overflow-auto h-full" onScroll={onScroll}>
      <ul className="text-sm">
        {slice.map((e, i) => (
          <li
            key={e.name}
            data-idx={i}
            onMouseMove={() => { if (isActive) onSelect(i); }}
            className={`px-3 py-1 cursor-default ${isActive && i === selected ? 'bg-gray-200' : ''}`}
          >
            <span className="mr-2">{e.isDir ? '📁' : '📄'}</span>
            <span>{e.name}</span>
          </li>
        ))}
        {remaining > 0 && (
          <li className="px-3 py-2 text-sm text-gray-500 cursor-pointer" onClick={loadMore}>
            Load more… ({remaining} more)
          </li>
        )}
      </ul>
    </div>
  );
}
