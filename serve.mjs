#!/usr/bin/env node
/* Acuity.One-Landing dev server.
   Serves standalone-experience/ over HTTP with Range support so the
   scroll-scrubbed films (wisdom.mp4, apollo frames) can seek smoothly.
   Zero dependencies: node serve.mjs [port]                */

import http from "node:http";
import { promises as fs } from "node:fs";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "standalone-experience");
const PORT = Number(process.argv[2]) || 8740;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let filePath = path.normalize(path.join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }
    if (urlPath === "/" || urlPath.endsWith("/")) filePath = path.join(filePath, "index.html");

    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile()) {
      console.log(`${req.method} ${req.url} -> 404`);
      res.writeHead(404).end("Not found");
      return;
    }
    console.log(`${req.method} ${req.url}${req.headers.range ? ` [range: ${req.headers.range}]` : ""} -> ${stat.size}B`);

    const type = TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const base = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" };

    let start = 0;
    let end = stat.size - 1;
    let status = 200;
    let headers = { ...base, "Content-Length": String(stat.size) };

    // Range support: lets the browser fetch just the bytes a seek needs.
    const range = req.headers.range;
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match && (match[1] !== "" || match[2] !== "")) {
        if (match[1] === "") {
          // suffix range: last N bytes
          start = Math.max(0, stat.size - Number(match[2]));
          end = stat.size - 1;
        } else {
          start = Number(match[1]);
          end = match[2] === "" ? stat.size - 1 : Math.min(Number(match[2]), stat.size - 1);
        }
        if (start > end || start >= stat.size) {
          res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
          return;
        }
        status = 206;
        headers = {
          ...base,
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Content-Length": String(end - start + 1),
        };
      }
    }

    res.writeHead(status, headers);
    if (req.method === "HEAD") return res.end();
    // Stream from disk through one read stream per response. pipeline
    // honours backpressure and closes both sides on abort; never reuse
    // a buffer across queued writes or earlier chunks get overwritten.
    pipeline(createReadStream(filePath, { start, end }), res, (err) => {
      if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") console.error(err);
    });
  } catch (err) {
    if (!res.headersSent) res.writeHead(500).end("Server error");
    else res.end();
    console.error(err);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Acuity.One dev server → http://127.0.0.1:${PORT}/ (serving ${ROOT})`);
});
