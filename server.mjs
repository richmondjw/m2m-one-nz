#!/usr/bin/env node
/**
 * server.mjs
 * Tiny dev server. Zero dependencies. Single file.
 *
 * - Serves dist/ on http://localhost:3000
 * - Watches src/ and public/, rebuilds on change
 * - No live-reload (refresh manually) - keeps it simple and dependency-free
 *
 * Run:  node server.mjs
 */

import { createServer } from 'node:http';
import { createReadStream, watch, existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, 'dist');
const PORT = process.env.PORT || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

function rebuild() {
  return new Promise((resolve) => {
    const proc = spawn('node', [join(ROOT, 'build.mjs')], { stdio: 'inherit' });
    proc.on('exit', resolve);
  });
}

function serveFile(req, res) {
  let url = req.url.split('?')[0];
  if (url.endsWith('/')) url += 'index.html';
  let path = join(DIST, url);
  // Try with .html suffix for clean URLs
  if (!existsSync(path) && existsSync(path + '.html')) path += '.html';
  if (!existsSync(path)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 not found');
    return;
  }
  if (statSync(path).isDirectory()) {
    path = join(path, 'index.html');
    if (!existsSync(path)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 not found');
      return;
    }
  }
  const ext = extname(path).toLowerCase();
  res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
  createReadStream(path).pipe(res);
}

async function main() {
  await rebuild();

  // Watch source folders, debounced rebuild
  let timer = null;
  const onChange = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      console.log('\n[watch] change detected, rebuilding...');
      await rebuild();
    }, 100);
  };
  for (const dir of ['src', 'public']) {
    const p = join(ROOT, dir);
    if (existsSync(p)) watch(p, { recursive: true }, onChange);
  }

  const server = createServer(serveFile);
  server.listen(PORT, () => {
    console.log(`\n  serving dist/ on http://localhost:${PORT}`);
    console.log(`  watching src/ and public/ - refresh to see changes\n`);
  });
}

main();
