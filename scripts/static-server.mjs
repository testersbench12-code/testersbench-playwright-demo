import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'fixtures', 'demo-site');
const port = Number(process.env.PORT || 4173);

/** Demo credentials — intentionally public for the local showcase (not real secrets). */
const DEMO_USER = {
  email: 'demo@example.com',
  password: 'demopass',
  name: 'Demo User',
};

/** @type {Map<string, { email: string, name: string }>} */
const sessions = new Map();
/** @type {{ id: string, title: string }[]} */
let items = [];

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(payload);
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const i = part.indexOf('=');
        return i === -1 ? [part, ''] : [part.slice(0, i), decodeURIComponent(part.slice(i + 1))];
      }),
  );
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function requireSession(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.tb_session;
  if (!token || !sessions.has(token)) {
    sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    return null;
  }
  return { token, user: sessions.get(token) };
}

async function handleApi(req, res, urlPath) {
  if (req.method === 'GET' && urlPath === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'testersbench-demo', items: items.length });
    return;
  }

  if (req.method === 'POST' && urlPath === '/api/login') {
    try {
      const body = await readBody(req);
      if (body.email !== DEMO_USER.email || body.password !== DEMO_USER.password) {
        sendJson(res, 401, { ok: false, error: 'Invalid email or password' });
        return;
      }
      const token = randomUUID();
      sessions.set(token, { email: DEMO_USER.email, name: DEMO_USER.name });
      sendJson(
        res,
        200,
        { ok: true, token, user: { email: DEMO_USER.email, name: DEMO_USER.name } },
        {
          'Set-Cookie': `tb_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`,
        },
      );
    } catch {
      sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
    }
    return;
  }

  if (req.method === 'POST' && urlPath === '/api/logout') {
    const cookies = parseCookies(req.headers.cookie || '');
    if (cookies.tb_session) sessions.delete(cookies.tb_session);
    sendJson(res, 200, { ok: true }, {
      'Set-Cookie': 'tb_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
    });
    return;
  }

  if (req.method === 'GET' && urlPath === '/api/me') {
    const session = requireSession(req, res);
    if (!session) return;
    sendJson(res, 200, { ok: true, user: session.user });
    return;
  }

  if (urlPath === '/api/items') {
    const session = requireSession(req, res);
    if (!session) return;

    if (req.method === 'GET') {
      sendJson(res, 200, { ok: true, items });
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await readBody(req);
        const title = String(body.title || '').trim();
        if (!title) {
          sendJson(res, 400, { ok: false, error: 'Title is required' });
          return;
        }
        const item = { id: randomUUID(), title };
        items.push(item);
        sendJson(res, 201, { ok: true, item, items });
      } catch {
        sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
      }
      return;
    }

    if (req.method === 'DELETE') {
      items = [];
      sendJson(res, 200, { ok: true, items });
      return;
    }
  }

  const deleteMatch = urlPath.match(/^\/api\/items\/([^/]+)$/);
  if (deleteMatch && req.method === 'DELETE') {
    const session = requireSession(req, res);
    if (!session) return;
    const id = decodeURIComponent(deleteMatch[1]);
    const before = items.length;
    items = items.filter((item) => item.id !== id);
    if (items.length === before) {
      sendJson(res, 404, { ok: false, error: 'Item not found' });
      return;
    }
    sendJson(res, 200, { ok: true, items });
    return;
  }

  if (req.method === 'POST' && urlPath === '/api/contact') {
    try {
      const body = await readBody(req);
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const errors = {};
      if (!name) errors.name = 'Name is required';
      if (!email) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';
      if (Object.keys(errors).length) {
        sendJson(res, 400, { ok: false, errors });
        return;
      }
      sendJson(res, 200, { ok: true, message: 'Form submitted successfully', contact: { name, email } });
    } catch {
      sendJson(res, 400, { ok: false, error: 'Invalid JSON' });
    }
    return;
  }

  sendJson(res, 404, { ok: false, error: 'API route not found' });
}

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  if (urlPath.startsWith('/api/')) {
    try {
      await handleApi(req, res, urlPath);
    } catch (error) {
      sendJson(res, 500, { ok: false, error: String(error) });
    }
    return;
  }

  let filePath = path.join(root, urlPath === '/' ? 'index.html' : urlPath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, '404.html');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(filePath));
    return;
  }

  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(filePath));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Demo SaaS app on http://127.0.0.1:${port}`);
});
