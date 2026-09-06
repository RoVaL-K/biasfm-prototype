// server.js — Zero-dependency fast HTTP static & API server for bias.fm
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.ics': 'text/calendar; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Normalize path
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const safePath = path.normalize(path.join(ROOT, pathname));

  // Security: prevent directory traversal
  if (!safePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err) {
      // Fallback to index.html for SPA routing if path doesn't have an extension
      if (!path.extname(pathname)) {
        const indexPath = path.join(ROOT, 'index.html');
        fs.readFile(indexPath, (indexErr, data) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data);
        });
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    if (stats.isDirectory()) {
      const indexPath = path.join(safePath, 'index.html');
      fs.readFile(indexPath, (indexErr, data) => {
        if (indexErr) {
          res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Directory listing forbidden');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Simple cache headers
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  bias.fm — Premium Korean Music Platform running!`);
  console.log(`  Local URL:    http://localhost:${PORT}`);
  console.log(`  Network URL:  http://127.0.0.1:${PORT}`);
  console.log(`======================================================\n`);
});

process.on('SIGINT', () => {
  console.log('\nGracefully shutting down bias.fm server...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('\nGracefully shutting down bias.fm server...');
  server.close(() => process.exit(0));
});
