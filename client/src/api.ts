import type { DirListing } from './types';

export async function list(pathname: string = '/') {
  const url = new URL('/api/list', location.origin);
  url.searchParams.set('path', pathname);
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<DirListing>;
}

export function fileUrl(pathname: string) {
  const url = new URL('/api/file', location.origin);
  url.searchParams.set('path', pathname);
  return url.toString();
}

