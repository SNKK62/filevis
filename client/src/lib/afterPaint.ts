export function afterNextPaint(fn: () => void) {
  if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
    window.requestAnimationFrame(() => window.requestAnimationFrame(fn));
  } else {
    setTimeout(fn, 0);
  }
}

