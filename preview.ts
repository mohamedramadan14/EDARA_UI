import { existsSync } from "node:fs";
import { join, extname } from "node:path";

const DIST = "dist";
const PORT = 4173;

if (!existsSync(DIST)) {
  console.error("dist/ folder not found. Run `bun run build` first.");
  process.exit(1);
}

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const filePath = join(DIST, url.pathname === "/" ? "index.html" : url.pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      const ext = extname(filePath);
      return new Response(file, {
        headers: { "Content-Type": MIME[ext] || "application/octet-stream" },
      });
    }

    // SPA fallback
    return new Response(Bun.file(join(DIST, "index.html")), {
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log(`\n  Preview server running at http://localhost:${server.port}\n`);
