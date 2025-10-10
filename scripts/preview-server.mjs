import http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || process.argv[2]) || 4173;

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.txt', 'text/plain; charset=utf-8']
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const pathnameRaw = decodeURIComponent(requestUrl.pathname);

  if (pathnameRaw.startsWith('/api/openai-proxy')) {
    if (method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const downstreamPath = requestUrl.searchParams.get('path') || '';
    if (downstreamPath === '__health') {
      res.writeHead(200, { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    const authHeader = extractAuthHeader(req.headers['authorization']);
    if (!authHeader) {
      res.writeHead(401, { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Set OPENAI_API_KEY env or provide Authorization header.' }));
      return;
    }

    if (!downstreamPath) {
      res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Missing path query parameter.' }));
      return;
    }

    const upstreamUrl = new URL(downstreamPath, 'https://api.openai.com');

    try {
      const body = await readBody(req, method);
      const upstreamResponse = await fetch(upstreamUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body,
      });

      const text = await upstreamResponse.text();
      const contentType = upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8';
      res.writeHead(upstreamResponse.status, { ...CORS_HEADERS, 'Content-Type': contentType });
      res.end(text);
    } catch (error) {
      res.writeHead(502, { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: error?.message || 'Upstream error' }));
    }
    return;
  }

  if (method !== 'GET' && method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  try {
    let pathname = pathnameRaw;
    if (pathname.endsWith('/')) pathname += 'index.html';
    if (pathname === '/index.html' && !(await exists(path.join(projectRoot, 'index.html')))) {
      pathname = '/preview.html';
    }
    const filePath = path.join(projectRoot, pathname);
    if (!filePath.startsWith(projectRoot)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = mimeTypes.get(ext) || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    if (method === 'GET') res.end(content);
    else res.end();
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Static preview available at http://localhost:${port}/preview.html`);
  console.log('Press Ctrl+C to stop.');
});

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function extractAuthHeader(headerValue) {
  if (typeof headerValue === 'string' && headerValue.trim()) {
    return headerValue.trim();
  }
  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey) {
    return envKey.startsWith('Bearer ')
      ? envKey
      : `Bearer ${envKey}`;
  }
  return '';
}

async function readBody(req, method) {
  if (method === 'GET' || method === 'HEAD') return undefined;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  if (!buffer.length) return undefined;
  return buffer.toString();
}
