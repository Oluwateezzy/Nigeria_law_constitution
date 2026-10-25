import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] ?? 'apps/app/dist');
const port = Number(process.env.PORT ?? 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
};

const headers = {
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

function insideRoot(path) {
  const normalized = normalize(path);
  return normalized === root || normalized.startsWith(`${root}${sep}`);
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const decoded = decodeURIComponent(url.pathname);
  const requested = resolve(root, `.${decoded}`);
  if (!insideRoot(requested)) {
    response.writeHead(403, headers);
    response.end();
    return;
  }
  void serve(requested, response);
});

async function serve(requested, response) {
  let path = requested;
  try {
    const info = await stat(path);
    if (info.isDirectory()) path = join(path, 'index.html');
    await access(path);
  } catch {
    if (extname(requested)) {
      response.writeHead(404, headers);
      response.end();
      return;
    }
    path = join(root, 'index.html');
  }
  response.writeHead(200, {
    ...headers,
    'Content-Type': types[extname(path)] ?? 'application/octet-stream',
  });
  createReadStream(path).pipe(response);
}

server.listen(port, '127.0.0.1');
