import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon'
};
// Only browser-facing files are served. SQL, .env, documentation and scripts stay private.
const rootFiles = new Set(['index.html', 'setup.html', 'styles.css', 'config.js']);
const appRoutes = new Set(['/','/profile','/gm','/map','/regions','/politics','/encyclopedia','/techniques','/rp','/missions','/activities','/access','/gm-login','/designer']);
function publicFile(url) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname); }
  catch { return null; }
  if (appRoutes.has(pathname)) return resolve(root, 'index.html');
  if (pathname === '/setup' || pathname === '/setup/') return resolve(root, 'setup.html');
  if (pathname.includes('\\') || pathname.includes('\0')) return null;
  const candidate = resolve(root, '.' + pathname);
  const rel = relative(root, candidate);
  if (!rel || rel === '..' || rel.startsWith('..' + sep)) return null;
  const normalized = rel.split(sep).join('/');
  const allowed = rootFiles.has(normalized) || /^(js|css|public)\/[\w./-]+$/.test(normalized);
  if (!allowed || normalized.split('/').some(segment => segment.startsWith('.'))) return null;
  if (!Object.hasOwn(mime, extname(candidate).toLowerCase())) return null;
  return candidate;
}
function error(res, status, message) {
  res.writeHead(status, {'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(message);
}
const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return error(res, 405, 'Method Not Allowed');
  if ((req.url || '').split('?')[0] === '/healthz') {
    res.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
    return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ok:true,version:'14.9.3',time:new Date().toISOString()}));
  }
  const path = publicFile(req.url || '/');
  if (!path) return error(res, 404, 'Not Found');
  try {
    if (!(await stat(path)).isFile()) return error(res, 404, 'Not Found');
    const body = await readFile(path);
    res.writeHead(200, {'Content-Type':mime[extname(path).toLowerCase()], 'Content-Length':body.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    return error(res, err?.code === 'ENOENT' ? 404 : 500, err?.code === 'ENOENT' ? 'Not Found' : 'Internal Server Error');
  }
});
server.on('error', error => { console.error('SERVER ERROR:', error?.code === 'EADDRINUSE' ? `Port ${port} is already in use. Close the old KAGE//ZERO window and run START_WINDOWS.bat again.` : error); process.exitCode=1; });
server.listen(port, '127.0.0.1', () => {
  console.log(`KAGE//ZERO v14.9.3: http://localhost:${port} (setup: /setup, health: /healthz)`);
});
