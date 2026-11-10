#!/usr/bin/env node
/* Static server for the Acuity.One membership page.
   Real 404s, byte ranges for film seeking, Brotli or gzip for text,
   and long-lived caching for fonts and images. */

import http from "node:http";
import { promises as fs } from "node:fs";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream";
import zlib from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || process.argv[2] || 8740);
const HOST = process.env.HOST || "0.0.0.0";

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

const COMPRESSIBLE = new Set([".html", ".css", ".js", ".mjs", ".svg", ".txt", ".xml", ".json", ".md"]);

const SECURITY = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:; media-src 'self'; object-src 'none'; frame-src 'self' https:; base-uri 'self'",
};

const INVITE_WEBHOOK = "https://n8n-production-f93d.up.railway.app/webhook/acuity-contact";
const INVITE_MAX_BODY = 12000;

function readLimited(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const fail = (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    };
    req.on("data", (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > limit) {
        fail(Object.assign(new Error("too_large"), { code: "too_large" }));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks));
      }
    });
    req.on("error", fail);
  });
}

async function handleInvitation(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { ...SECURITY, Allow: "POST", "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }).end(JSON.stringify({ ok: false, message: "Use POST." }));
    return;
  }
  let raw;
  try {
    raw = await readLimited(req, INVITE_MAX_BODY);
  } catch (err) {
    const tooLarge = err && err.code === "too_large";
    if (!res.headersSent) {
      const message = tooLarge ? "The request is too large." : "The request could not be read.";
      res.writeHead(tooLarge ? 413 : 400, { ...SECURITY, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ ok: false, message }), () => req.destroy());
    } else {
      req.destroy();
    }
    return;
  }
  let payload;
  try {
    payload = JSON.parse(raw.toString("utf8"));
  } catch {
    res.writeHead(400, { ...SECURITY, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }).end(JSON.stringify({ ok: false, status: "invalid", errors: ["Expected a JSON object."] }));
    return;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    res.writeHead(400, { ...SECURITY, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }).end(JSON.stringify({ ok: false, status: "invalid", errors: ["Expected a JSON object."] }));
    return;
  }

  const upstream = await fetch(INVITE_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  }).catch(() => null);

  if (!upstream) {
    res.writeHead(502, { ...SECURITY, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }).end(JSON.stringify({ ok: false, message: "The enquiry could not be confirmed. Please retry with the same submission_id." }));
    return;
  }
  const text = await upstream.text();
  res.writeHead(upstream.status, { ...SECURITY, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }).end(text || JSON.stringify({ ok: false, message: "Empty response from the form service." }));
}

function cacheControl(ext) {
  if (ext === ".html") return "public, max-age=0, must-revalidate";
  if (ext === ".xml" || ext === ".txt" || ext === ".md") return "public, max-age=3600";
  if (ext === ".woff2") return "public, max-age=31536000, immutable";
  if (ext === ".css" || ext === ".js" || ext === ".mjs") return "public, max-age=86400";
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png" || ext === ".webp" || ext === ".svg" || ext === ".mp4" || ext === ".webm" || ext === ".mp3") {
    return "public, max-age=2592000";
  }
  return "public, max-age=3600";
}

function negotiate(ext, header) {
  if (!COMPRESSIBLE.has(ext)) return null;
  const accept = header || "";
  if (accept.includes("br")) return "br";
  if (accept.includes("gzip")) return "gzip";
  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (urlPath === "/api/invitation") {
      await handleInvitation(req, res);
      return;
    }
    let filePath = path.normalize(path.join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403, SECURITY).end("Forbidden");
      return;
    }
    if (urlPath === "/" || urlPath.endsWith("/")) filePath = path.join(filePath, "index.html");

    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat || !stat.isFile()) {
      res.writeHead(404, {
        ...SECURITY,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      }).end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = TYPES[ext] || "application/octet-stream";
    const base = {
      ...SECURITY,
      "Content-Type": type,
      "Accept-Ranges": "bytes",
      "Cache-Control": cacheControl(ext),
      "Last-Modified": stat.mtime.toUTCString(),
    };

    let start = 0;
    let end = stat.size - 1;
    let status = 200;
    const headers = { ...base, "Content-Length": String(stat.size) };
    const range = req.headers.range;

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (match && (match[1] !== "" || match[2] !== "")) {
        if (match[1] === "") {
          start = Math.max(0, stat.size - Number(match[2]));
          end = stat.size - 1;
        } else {
          start = Number(match[1]);
          end = match[2] === "" ? stat.size - 1 : Math.min(Number(match[2]), stat.size - 1);
        }
        if (start > end || start >= stat.size) {
          res.writeHead(416, { ...SECURITY, "Content-Range": `bytes */${stat.size}` }).end();
          return;
        }
        status = 206;
        headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
        headers["Content-Length"] = String(end - start + 1);
      }
    }

    const encoding = status === 200 ? negotiate(ext, req.headers["accept-encoding"]) : null;
    if (encoding) {
      headers["Content-Encoding"] = encoding;
      headers.Vary = "Accept-Encoding";
      delete headers["Content-Length"];
    }

    res.writeHead(status, headers);
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    const stream = createReadStream(filePath, { start, end });
    const done = (err) => {
      if (err && err.code !== "ERR_STREAM_PREMATURE_CLOSE") console.error(err);
    };
    if (encoding === "br") {
      pipeline(stream, zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }), res, done);
    } else if (encoding === "gzip") {
      pipeline(stream, zlib.createGzip({ level: 6 }), res, done);
    } else {
      pipeline(stream, res, done);
    }
  } catch (err) {
    if (!res.headersSent) res.writeHead(500, SECURITY).end("Server error");
    else res.end();
    console.error(err);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Acuity.One → http://${HOST}:${PORT}/ (serving ${ROOT})`);
});
