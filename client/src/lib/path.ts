export function parent(p: string) {
  if (p === '/' || p === '') return '/';
  const parts = p.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}
export function join(a: string, b: string) {
  return (a.endsWith('/') ? a : a + '/') + b;
}
export function base(p: string) {
  const parts = p.split('/').filter(Boolean);
  return parts.pop() ?? '';
}

