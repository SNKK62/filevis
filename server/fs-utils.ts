import path from 'path';
import fs from 'fs/promises';

export function sanitizeAndResolve(root: string, rel: string) {
  const safeRel = rel.startsWith('/') ? rel.slice(1) : rel;
  const abs = path.resolve(root, safeRel);
  if (!abs.startsWith(path.resolve(root))) {
    throw new Error('path traversal detected');
  }
  return abs;
}

export async function listDir(absPath: string) {
  const dirents = await fs.readdir(absPath, { withFileTypes: true });
  const entries = await Promise.all(
    dirents.map(async (d) => {
      const fp = path.join(absPath, d.name);
      const st = await fs.stat(fp);
      return {
        name: d.name,
        isDir: d.isDirectory(),
        size: st.size,
        mtime: st.mtimeMs,
      };
    })
  );
  entries.sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
  return entries;
}

