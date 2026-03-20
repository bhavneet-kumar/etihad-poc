import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, "dist");
const port = Number(process.env.PORT ?? "3000");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, { ...headers, "x-content-type-options": "nosniff" });
  res.end(body);
}

function isPathSafe(p) {
  const resolved = path.resolve(distDir, "." + p);
  return resolved === distDir || resolved.startsWith(distDir + path.sep);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    let reqPath = decodeURIComponent(url.pathname);
    if (reqPath === "/") reqPath = "/index.html";

    if (!isPathSafe(reqPath)) {
      return send(res, 400, "Bad Request");
    }

    const candidate = path.resolve(distDir, "." + reqPath);
    const ext = path.extname(candidate).toLowerCase();
    const type = contentTypes[ext] ?? "application/octet-stream";

    try {
      const data = await readFile(candidate);
      return send(res, 200, data, { "content-type": type });
    } catch {
      // SPA fallback
      const indexHtml = await readFile(path.join(distDir, "index.html"));
      return send(res, 200, indexHtml, { "content-type": contentTypes[".html"] });
    }
  } catch {
    return send(res, 500, "Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`Serving ${distDir} on http://0.0.0.0:${port}`);
});

