'use strict';
/**
 * Docker / Compose healthcheck — must drain the HTTP response or Node may hang
 * waiting for the socket to close (see Node http.get docs).
 */
const http = require('http');
const port = process.env.API_PORT || process.env.PORT || '3001';
const url = `http://127.0.0.1:${port}/api/health`;

const req = http.get(url, (res) => {
  res.resume();
  res.on('end', () => process.exit(res.statusCode === 200 ? 0 : 1));
});

req.setTimeout(8000, () => {
  req.destroy();
  process.exit(1);
});

req.on('error', () => process.exit(1));
