import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import fssync from 'fs';
import mime from 'mime-types';
import { fileURLToPath } from 'url';
import { sanitizeAndResolve, listDir } from './fs-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer(rootDir: string, clientDistDir: string) {
  const app = express();

  const ROOT = path.resolve(rootDir);

  app.use((_, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  });

  app.get('/api/list', async (req, res) => {
    try {
      const rel = (req.query.path as string) || '/';
      const abs = sanitizeAndResolve(ROOT, rel);
      const entries = await listDir(abs);
      const relNormalized = path.posix.join('/', path.relative(ROOT, abs).split(path.sep).join('/'));
      res.json({ root: '/', path: relNormalized === '' ? '/' : relNormalized, entries });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Report current server root for debugging/UX
  app.get('/api/root', (_req, res) => {
    res.json({ root: ROOT });
  });

  app.get('/api/file', async (req, res) => {
    try {
      const rel = req.query.path as string;
      if (!rel) throw new Error('path is required');
      const abs = sanitizeAndResolve(ROOT, rel);
      const stat = await fs.stat(abs);
      if (!stat.isFile()) throw new Error('not a file');

      const type = (mime.lookup(abs) as string) || 'application/octet-stream';
      res.setHeader('Content-Type', type);

      const range = req.headers.range;
      if (range) {
        const size = stat.size;
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : Math.min(start + 1_000_000, size - 1);
        const chunkSize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': type,
        });
        fssync.createReadStream(abs, { start, end }).pipe(res);
      } else {
        res.setHeader('Content-Length', stat.size.toString());
        fssync.createReadStream(abs).pipe(res);
      }
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.use(express.static(clientDistDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });

  return app;
}
