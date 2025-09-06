import React, { useEffect, useRef, useState } from 'react';
import { fileUrl } from '../api';
import type { Entry } from '../types';
import { VIDEO_DEBOUNCE_MS } from '../config';

export default function Preview({ path, entry, onLoaded, onLoadingStart, scale = 1 }: { path: string; entry?: Entry; onLoaded?: (ok: boolean) => void; onLoadingStart?: () => void; scale?: number }) {
  // Always call hooks unconditionally to satisfy React rules
  const lower = (entry?.name ?? '').toLowerCase();
  const isVideo = /(\.mp4|\.webm|\.mov)$/.test(lower);
  const isImage = /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/.test(lower);

  useEffect(() => {
    if (!entry || entry.isDir) onLoaded?.(true);
  }, [entry, onLoaded]);

  const p = entry ? (path.endsWith('/') ? path + entry.name : path + '/' + entry.name) : '';
  const url = entry ? fileUrl(p) : '';

  // Measure container and intrinsic media size to compute fitted baseline
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [intrinsic, setIntrinsic] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new (window as any).ResizeObserver?.((entries: any[]) => {
      const cr = entries[0].contentRect;
      setContainerSize({ w: cr.width, h: cr.height });
    });
    if (ro && el) ro.observe(el);
    // Fallback initial size
    setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    return () => {
      if (ro && el) ro.unobserve(el);
    };
  }, [entry?.name]);

  // Debounce video load start
  const [debouncedUrl, setDebouncedUrl] = useState<string>('');
  useEffect(() => {
    if (!isVideo) {
      setDebouncedUrl('');
      return;
    }
    setDebouncedUrl('');
    const t = setTimeout(() => {
      onLoadingStart?.();
      setDebouncedUrl(url);
    }, VIDEO_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [url, isVideo]);
  if (!entry || entry.isDir) {
    return <div className="p-4 text-gray-500">ファイルを選択するとプレビュー</div>;
  }

  // Compute fitted width at scale=1, then multiply by scale
  const { w: cw, h: ch } = containerSize;
  const { w: iw, h: ih } = intrinsic;
  const fit = iw > 0 && ih > 0 && cw > 0 && ch > 0 ? Math.min(cw / iw, ch / ih) : 1;
  const displayWidth = iw > 0 ? Math.max(1, iw * fit * Math.max(0.01, scale)) : undefined;

  const mediaStyle: React.CSSProperties = displayWidth ? { width: `${displayWidth}px`, height: 'auto' } : {};
  const cls = 'object-contain';
  
  if (isImage) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <img
          key={url}
          src={url}
          alt={entry.name}
          className={cls}
          style={mediaStyle}
          onLoad={(e) => {
            const img = e.currentTarget;
            setIntrinsic({ w: img.naturalWidth || 0, h: img.naturalHeight || 0 });
            onLoaded?.(true);
          }}
          onError={() => onLoaded?.(false)}
        />
      </div>
    );
  }
  if (isVideo) {
    const type = lower.endsWith('.webm') ? 'video/webm' : lower.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
    if (debouncedUrl !== url) {
      // Waiting for debounce timer; parent shows loading overlay
      return <div ref={containerRef} className="w-full h-full flex items-center justify-center" />;
    }
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <video
          key={debouncedUrl}
          controls
          autoPlay
          loop
          muted
          playsInline
          className={cls}
          style={mediaStyle}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setIntrinsic({ w: v.videoWidth || 0, h: v.videoHeight || 0 });
          }}
          onLoadedData={() => onLoaded?.(true)}
          onCanPlayThrough={() => onLoaded?.(true)}
          onError={() => onLoaded?.(false)}
        >
          <source src={debouncedUrl} type={type} />
        </video>
      </div>
    );
  }
  return <div className="p-4">未対応の拡張子: {entry.name}</div>;
}
