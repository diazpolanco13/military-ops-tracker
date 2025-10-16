const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 8080;
const host = '0.0.0.0';
const distDir = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Para SPA, redirigir todas las rutas no encontradas a index.html
  if (!fs.existsSync(path.join(distDir, pathname)) || fs.statSync(path.join(distDir, pathname)).isDirectory()) {
    pathname = '/index.html';
  }

  const filePath = path.join(distDir, pathname);

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    }[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('File not found');
  }
});

server.listen(port, host, () => {
  console.log(`Servidor iniciado en http://${host}:${port}`);
  console.log(`También disponible en: http://89.116.30.133:${port}`);
});
