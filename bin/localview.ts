#!/usr/bin/env node
import { createServer } from '../server/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import { Command } from 'commander';
import fs from 'fs';
import http from 'http';

const program = new Command();
program
  .name('localview')
  .option('-r, --root <dir>', 'root directory', process.cwd())
  .option('-p, --port <port>', 'port', '5173')
  .option('-o, --open', 'open browser', false)
  .parse(process.argv);

const opts = program.opts();
const root = path.resolve(opts.root);
const port = parseInt(opts.port, 10);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate client/dist for both dev (tsx source) and prod (built) runs
const candidateClientDistDirs = [
  // Running from TS source: bin -> project root -> client/dist
  path.resolve(__dirname, '..', 'client', 'dist'),
  // Running from built JS: dist-server/bin -> project root -> client/dist
  path.resolve(__dirname, '..', '..', 'client', 'dist'),
  // Fallback: current working directory
  path.resolve(process.cwd(), 'client', 'dist'),
];

const clientDistDir = candidateClientDistDirs.find((p) => fs.existsSync(path.join(p, 'index.html')))
  || candidateClientDistDirs[0];

const app = createServer(root, clientDistDir);
const server = http.createServer(app);
server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`[localview] serving ${root} at ${url}`);
  if (opts.open) open(url);
});
