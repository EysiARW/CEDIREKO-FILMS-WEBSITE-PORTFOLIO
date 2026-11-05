/**
 * CEDIREKO Films Portfolio - Built-in Test HTTP Server
 * Serves project static files with accurate MIME types and tracks 404 errors.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

class ProjectHttpServer {
  constructor(rootDir, port = 0) {
    this.rootDir = rootDir;
    this.port = port;
    this.server = null;
    this.url = '';
    this.requests = [];
    this.errors404 = [];
    this.sockets = new Set();
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const decodedUrl = decodeURIComponent(req.url.split('?')[0]);
        let relativePath = decodedUrl === '/' ? '/index.html' : decodedUrl;
        const filePath = path.join(this.rootDir, relativePath);

        this.requests.push({
          method: req.method,
          url: req.url,
          timestamp: Date.now()
        });

        // Security check: ensure path stays inside rootDir
        if (!filePath.startsWith(this.rootDir)) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Forbidden');
          return;
        }

        fs.stat(filePath, (err, stats) => {
          if (err || !stats.isFile()) {
            this.errors404.push({
              url: req.url,
              filePath,
              timestamp: Date.now()
            });
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`404 Not Found: ${req.url}`);
            return;
          }

          const ext = path.extname(filePath).toLowerCase();
          const contentType = MIME_TYPES[ext] || 'application/octet-stream';

          // Range requests support for video media
          const range = req.headers.range;
          if (range && ext === '.mp4') {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
            const chunkSize = (end - start) + 1;
            const fileStream = fs.createReadStream(filePath, { start, end });

            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${stats.size}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunkSize,
              'Content-Type': contentType
            });
            fileStream.pipe(res);
          } else {
            res.writeHead(200, {
              'Content-Length': stats.size,
              'Content-Type': contentType,
              'Cache-Control': 'no-cache'
            });
            fs.createReadStream(filePath).pipe(res);
          }
        });
      });

      this.server.on('connection', (socket) => {
        this.sockets.add(socket);
        socket.on('close', () => this.sockets.delete(socket));
      });

      this.server.listen(this.port, '127.0.0.1', () => {
        const addr = this.server.address();
        this.port = addr.port;
        this.url = `http://127.0.0.1:${this.port}`;
        resolve(this.url);
      });

      this.server.on('error', reject);
    });
  }

  stop() {
    return new Promise((resolve) => {
      for (const socket of this.sockets) {
        try { socket.destroy(); } catch (e) {}
      }
      this.sockets.clear();

      if (this.server) {
        if (typeof this.server.closeAllConnections === 'function') {
          this.server.closeAllConnections();
        }
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  resetErrorTracking() {
    this.requests = [];
    this.errors404 = [];
  }
}

module.exports = { ProjectHttpServer };
