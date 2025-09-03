import React, { useEffect, useState } from 'react';
import { fileUrl } from '../api';
import type { Entry } from '../types';
import { VIDEO_DEBOUNCE_MS } from '../config';

export default function Preview({ path, entry, onLoaded, onLoadingStart }: { path: string; entry?: Entry; onLoaded?: (ok: boolean) => void; onLoadingStart?: () => void }) {
  // Always call hooks unconditionally to satisfy React rules
  const lower = (entry?.name ?? '').toLowerCase();
  const isVideo = /(\.mp4|\.webm|\.mov)$/.test(lower);
  const isImage = /(\.png|\.jpe?g|\.gif|\.webp|\.bmp|\.svg)$/.test(lower);
  const isText = /(\.md|\.txt|\.json|\.log|\.csv|\.tsv)$/.test(lower);

  useEffect(() => {
    if (!entry || entry.isDir) onLoaded?.(true);
  }, [entry, onLoaded]);

  const p = entry ? (path.endsWith('/') ? path + entry.name : path + '/' + entry.name) : '';
  const url = entry ? fileUrl(p) : '';

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
  if (isImage) {
    return <img key={url} src={url} alt={entry.name} className="max-w-full max-h-full object-contain" onLoad={() => onLoaded?.(true)} onError={() => onLoaded?.(false)} />;
  }
  if (isVideo) {
    const type = lower.endsWith('.webm') ? 'video/webm' : lower.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
    if (debouncedUrl !== url) {
      // Waiting for debounce timer; parent shows loading overlay
      return <div className="w-full h-full" />;
    }
    return (
      <video
        key={debouncedUrl}
        controls
        autoPlay
        muted
        playsInline
        className="w-full h-full"
        onLoadedData={() => onLoaded?.(true)}
        onCanPlayThrough={() => onLoaded?.(true)}
        onError={() => onLoaded?.(false)}
      >
        <source src={debouncedUrl} type={type} />
      </video>
    );
  }
  if (isText) {
    return <iframe key={url} src={url} className="w-full h-full" onLoad={() => onLoaded?.(true)} />;
  }
  return <div className="p-4">未対応の拡張子: {entry.name}</div>;
}
