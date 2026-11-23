// Minimal static server for the UpWell design preview (no dependencies).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };

function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  p = path.normalize(p).replace(/^(\.\.[/\\])+/, '');
  const candidates = [p, p + '.html', path.join(p, 'index.html')];
  for (const c of candidates) {
    const full = path.join(ROOT, c);
    if (!full.startsWith(ROOT)) continue;
    try { if (fs.statSync(full).isFile()) return full; } catch (e) { /* try next */ }
  }
  return null;
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  const file = resolve(req.url);
  if (!file) {
    res.writeHead(302, { Location: '/' });
    return res.end();
  }
  const ext = path.extname(file);
  res.writeHead(200, {
    'Content-Type': TYPES[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    'X-Robots-Tag': 'noindex',
  });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('UpWell preview on port ' + PORT));
