import React, { useEffect, useMemo, useRef, useState } from 'react';
import { list, fileUrl } from './api';
import type { Entry, DirListing } from './types';
import Pane from './components/Pane';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { PAGE_SIZE } from './config';
import Preview from './components/Preview';
import Breadcrumbs from './components/Breadcrumbs';
import { CommandRegistry, defaultCommands } from './commands';
import { loadKeymap } from './keymap';

const allowExt = (name: string) => /(\.(jpg|jpeg|png|gif|webp|mp4|webm|mov))$/i.test(name.toLowerCase());

export default function App() {
  // Left pane state
  const [leftPath, setLeftPath] = useState<string>('/');
  const [leftListing, setLeftListing] = useState<DirListing | null>(null);
  const [leftSelected, setLeftSelected] = useState(0);

  // Right pane state (contents of selected left directory)
  const [rightListing, setRightListing] = useState<DirListing | null>(null);
  const [rightSelected, setRightSelected] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [rightNavLoading, setRightNavLoading] = useState(false);
  const pendingRightTarget = useRef<string | null>(null);
  const rightNavLockRef = useRef(false);

  // UI state
  const [filter, setFilter] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activePane, setActivePane] = useState<'left' | 'right'>('left');
  const [previewMax, setPreviewMax] = useState(false);

  // Pending select name when shifting panes
  const pendingLeftSelect = useRef<string | null>(null);

  const cmds = useMemo(() => {
    const reg = new CommandRegistry();
    defaultCommands.forEach((c) => reg.register(c));
    return reg;
  }, []);

  const keymap = useMemo(() => loadKeymap(), []);

  // Load left listing when path changes
  useEffect(() => {
    (async () => {
      const dl = await list(leftPath);
      setLeftListing(dl);
    })();
  }, [leftPath]);

  const leftDirs = useMemo(() => leftListing?.entries.filter((e) => e.isDir) ?? [], [leftListing]);

  // If pending selection requested, apply after left listing loads
  useEffect(() => {
    if (!leftListing) return;
    if (pendingLeftSelect.current) {
      const idx = leftDirs.findIndex((d) => d.name === pendingLeftSelect.current);
      if (idx >= 0) {
        setLeftSelected(idx);
      } else {
        // target child missing; cancel nav safely
        pendingRightTarget.current = null;
        setRightNavLoading(false);
        rightNavLockRef.current = false;
        setLeftSelected(0);
      }
      pendingLeftSelect.current = null;
    } else {
      // Reset selection when path changes normally
      setLeftSelected(0);
    }
    // Clamp leftSelected within range (safety)
    if (leftSelected >= leftDirs.length) setLeftSelected(Math.max(0, leftDirs.length - 1));
  }, [leftListing]);

  const [rightPath, setRightPath] = useState<string>('');

  // Derive rightPath from left side (after left listing reflects leftPath)
  useEffect(() => {
    if (!leftListing || leftListing.path !== leftPath) return;
    const dirs = leftDirs;
    const idx = Math.min(Math.max(0, leftSelected), Math.max(0, dirs.length - 1));
    const target = dirs[idx] ? join(leftListing.path, dirs[idx].name) : '';
    if (target !== rightPath) {
      if (target) {
        pendingRightTarget.current = target;
        setRightNavLoading(true);
        setRightPath(target);
      } else {
        // No dir available; clear right pane
        pendingRightTarget.current = null;
        setRightPath('');
        setRightListing(null);
        setRightNavLoading(false);
        rightNavLockRef.current = false;
      }
    }
  }, [leftListing?.path, leftPath, leftDirs, leftSelected]);

  // Load right listing when rightPath changes
  useEffect(() => {
    (async () => {
      if (!rightPath) {
        setRightListing(null);
        return;
      }
      const dl = await list(rightPath);
      setRightListing(dl);
      setRightSelected(0);
    })();
  }, [rightPath]);

  // Proactively mark right navigation loading on any rightPath change
  const prevRightPath = useRef<string>('');
  useEffect(() => {
    if (rightPath && rightPath !== prevRightPath.current) {
      pendingRightTarget.current = rightPath;
      setRightNavLoading(true);
    }
    prevRightPath.current = rightPath;
  }, [rightPath]);

  // Resolve right navigation completion when target path is reached (after paint)
  useEffect(() => {
    if (pendingRightTarget.current && rightListing?.path === pendingRightTarget.current) {
      const finish = () => {
        rightNavLockRef.current = false;
        setRightNavLoading(false);
        pendingRightTarget.current = null;
      };
      if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
        window.requestAnimationFrame(() => window.requestAnimationFrame(finish));
      } else {
        setTimeout(finish, 0);
      }
    }
  }, [rightListing?.path]);

  const rightFiltered: Entry[] = useMemo(() => {
    const base = rightListing ? rightListing.entries.filter((e) => e.isDir || allowExt(e.name)) : [];
    if (!filter) return base;
    const f = filter.toLowerCase();
    return base.filter((e) => e.name.toLowerCase().includes(f));
  }, [rightListing, filter]);

  // Preview loading is managed by Preview component (debounced for videos)

  const ctx = useMemo(
    () => ({
      openSelected: () => {
        if (activePane === 'left') {
          // Move focus to right; don't change tree
          setActivePane('right');
          return;
        }
        // Right pane
        if (rightNavLoading || rightNavLockRef.current) return; // block until right pane finishes navigating
        const entry = rightFiltered[rightSelected];
        if (!entry) return;
        if (entry.isDir) {
          // Shift: right becomes new left, and select this dir in left
          pendingLeftSelect.current = entry.name;
          // Target right path will be oldRightPath/dirName
          pendingRightTarget.current = join(rightPath, entry.name);
          rightNavLockRef.current = true; // immediate lock against rapid key presses
          setRightNavLoading(true);
          setLeftPath(rightPath);
          // keep current focus (do not force to right). right shows loading only
        } else {
          // On file: do nothing for 'l' (openSelected)
        }
      },
      openFile: () => {
        if (activePane === 'left') {
          // If pressed Enter on left, just move focus to right
          setActivePane('right');
          return;
        }
        if (rightNavLoading || rightNavLockRef.current) return;
        const entry = rightFiltered[rightSelected];
        if (!entry || entry.isDir) return;
        if (previewLoading) return; // wait until preview ready
        const p = join(rightPath, entry.name);
        window.open(fileUrl(p), '_blank');
      },
      goParent: () => {
        if (activePane === 'right') {
          // Focus parent directory shown in left pane
          const dirName = base(rightPath);
          const idx = leftDirs.findIndex((d) => d.name === dirName);
          if (idx >= 0) setLeftSelected(idx);
          setActivePane('left');
          return;
        }
        // Left pane: move up directory
        if (leftPath === '/' || leftPath === '') return;
        const childName = base(leftPath);
        pendingLeftSelect.current = childName;
        setLeftPath(parent(leftPath));
      },
      moveUp: () => {
        if (activePane === 'left') setLeftSelected((s) => Math.max(0, s - 1));
        else {
          if (rightNavLoading) return;
          setRightSelected((s) => Math.max(0, s - 1));
        }
      },
      moveDown: () => {
        if (activePane === 'left') setLeftSelected((s) => Math.min(Math.max(0, leftDirs.length - 1), s + 1));
        else {
          if (rightNavLoading) return;
          setRightSelected((s) => Math.min(Math.max(0, rightFiltered.length - 1), s + 1));
        }
      },
      goTop: () => {
        if (activePane === 'left') setLeftSelected(0);
        else {
          if (rightNavLoading) return;
          setRightSelected(0);
        }
      },
      goBottom: () => {
        if (activePane === 'left') setLeftSelected(Math.max(0, leftDirs.length - 1));
        else {
          if (rightNavLoading) return;
          setRightSelected(Math.max(0, rightFiltered.length - 1));
        }
      },
      refresh: () => {
        setLeftPath((p) => p); // trigger reload via effect
      },
      openSearch: () => {
        setShowSearch((v) => !v);
      },
      togglePreviewMax: () => {
        const e = rightFiltered[rightSelected];
        if (!e || e.isDir) return;
        if (!allowExt(e.name)) return;
        setPreviewMax((v) => !v);
      },
    }),
    [activePane, leftDirs, leftSelected, rightFiltered, rightSelected, leftPath, rightPath, rightNavLoading, previewLoading]
  );

  // Global key handler to avoid focus issues
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'Tab') {
        e.preventDefault();
        setActivePane((p) => (p === 'left' ? 'right' : 'left'));
        return;
      }
      const b = keymap.find((k) => k.key === e.key);
      if (b) {
        e.preventDefault();
        cmds.run(b.command, ctx);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keymap, cmds, ctx]);

  const rightEntry = rightFiltered[rightSelected];

  return (
    <div className="h-screen flex flex-col">
      <Breadcrumbs path={rightPath || leftPath} onJump={(p) => setLeftPath(p)} />
      <div className="flex-1 grid" style={{ gridTemplateColumns: previewMax ? '1fr' : '1fr 1fr 1fr', minHeight: 0 }}>
        {!previewMax && (
        <div
          className={`border-r h-full overflow-auto ${activePane === 'left' ? 'bg-white' : ''}`}
          onClick={() => setActivePane('left')}
        >
          <Pane
            entries={leftDirs}
            selected={leftSelected}
            onSelect={(i) => { if (activePane === 'left') setLeftSelected(i); }}
            isActive={activePane === 'left'}
            pageSize={PAGE_SIZE}
          />
        </div>
        )}
        {!previewMax && (
        <div className={`border-r h-full overflow-auto relative`} onClick={() => { if (!rightNavLoading) setActivePane('right'); }}>
          {rightNavLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <div className="text-sm text-gray-500">Loading...</div>
            </div>
          ) : (
            <Pane
              entries={rightFiltered}
              selected={rightSelected}
              onSelect={(i) => { setRightSelected(i); }}
              isActive={activePane === 'right'}
              pageSize={PAGE_SIZE}
            />
          )}
        </div>
        )}
        <div className={`h-full overflow-auto relative ${previewMax ? 'flex items-center justify-center' : ''}`}>
          {!rightEntry || rightEntry.isDir ? null : (
            previewLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <div className="text-sm text-gray-500">Loading...</div>
              </div>
            )
          )}
          <Preview
            path={rightPath || '/'}
            entry={rightEntry}
            onLoadingStart={() => setPreviewLoading(true)}
            onLoaded={() => setPreviewLoading(false)}
          />
        </div>
      </div>

      {showSearch && (
        <div className="absolute bottom-2 left-2 bg-white border rounded p-2 shadow">
          <Input
            autoFocus
            className="w-64"
            placeholder="Filter... (/で開閉, Tabでペイン切替)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.key === '/') setShowSearch(false);
            }}
          />
        </div>
      )}

      <div className="border-t px-3 py-2 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
        <span>
          <kbd className="inline-block px-1 border rounded mr-1">j</kbd>
          <kbd className="inline-block px-1 border rounded mr-1">k</kbd>
          Move
        </span>
        <span>
          <kbd className="inline-block px-1 border rounded mr-1">h</kbd>
          Parent
        </span>
        <span>
          <kbd className="inline-block px-1 border rounded mr-1">l</kbd>
          Open dir (file: none)
        </span>
        <span>
          <kbd className="inline-block px-1 border rounded mr-1">Enter</kbd>
          Open file
        </span>
        <span>
          <kbd className="inline-block px-1 border rounded mr-1">Tab</kbd>
          Switch pane
        </span>
        <span>
          <kbd className="inline-block px-1 border rounded mr-1">/</kbd>
          Search
        </span>
        <span>
          <kbd className="inline-block px-1 border rounded mr-1">g</kbd>
          Top
        </span>
        <span>
          <kbd className="inline-block px-1 border rounded mr-1">G</kbd>
          Bottom
        </span>
        <span>
          <kbd className="inline-block px-1 border rounded mr-1">f</kbd>
          Toggle maximize
        </span>
        <span>
          <kbd className="inline-block px-1 border rounded mr-1">r</kbd>
          Refresh
        </span>
      </div>
    </div>
  );
}

function parent(p: string) {
  if (p === '/' || p === '') return '/';
  const parts = p.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}
function join(a: string, b: string) {
  return (a.endsWith('/') ? a : a + '/') + b;
}
function base(p: string) {
  const parts = p.split('/').filter(Boolean);
  return parts.pop() ?? '';
}
