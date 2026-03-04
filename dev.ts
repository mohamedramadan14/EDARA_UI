import { watch } from "node:fs";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, extname } from "node:path";

const DIST = "dist";
const ASSETS = join(DIST, "assets");
const PORT = 3000;

// Clean and prepare
if (existsSync(DIST)) rmSync(DIST, { recursive: true });
mkdirSync(ASSETS, { recursive: true });

// Copy public files
if (existsSync("public")) {
  cpSync("public", DIST, { recursive: true });
}

// Track connected SSE clients for live reload
const clients = new Set<ReadableStreamDefaultController>();

async function buildCSS() {
  const proc = Bun.spawn(
    ["bunx", "tailwindcss", "-i", "src/index.css", "-o", join(ASSETS, "style.css")],
    { stdout: "inherit", stderr: "inherit" }
  );
  await proc.exited;
}

async function buildJS() {
  const result = await Bun.build({
    entrypoints: ["./src/main.tsx"],
    outdir: ASSETS,
    naming: "bundle.js",
    sourcemap: "inline",
    target: "browser",
    define: {
      "process.env.NODE_ENV": '"development"',
    },
  });
  if (!result.success) {
    console.error("JS build failed:");
    for (const log of result.logs) console.error(log);
    return false;
  }
  return true;
}

async function generateHTML() {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>edara-hr-ui</title>
    <link rel="stylesheet" href="/assets/style.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/bundle.js"></script>
    <script>
      // Live reload via SSE
      const es = new EventSource("/__reload");
      es.onmessage = () => location.reload();
    </script>
  </body>
</html>`;
  await Bun.write(join(DIST, "index.html"), html);
}

// Initial build
console.log("Building...");
await buildCSS();
await buildJS();
await generateHTML();

// MIME types
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

// Start server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // SSE endpoint for live reload
    if (url.pathname === "/__reload") {
      const stream = new ReadableStream({
        start(controller) {
          clients.add(controller);
          req.signal.addEventListener("abort", () => clients.delete(controller));
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Serve static files from dist
    const filePath = join(DIST, url.pathname === "/" ? "index.html" : url.pathname);
    const file = Bun.file(filePath);
    if (await file.exists()) {
      const ext = extname(filePath);
      return new Response(file, {
        headers: {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": "no-store",
        },
      });
    }

    // SPA fallback
    return new Response(Bun.file(join(DIST, "index.html")), {
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log(`\n  Dev server running at http://localhost:${server.port}\n`);

// Watch for changes and rebuild
let rebuilding = false;
watch("src", { recursive: true }, async (_event, filename) => {
  if (rebuilding || !filename) return;
  rebuilding = true;

  const ext = extname(filename);
  console.log(`Change detected: ${filename}`);

  try {
    if (ext === ".css") {
      await buildCSS();
    } else {
      await buildJS();
      // Also rebuild CSS in case new Tailwind classes were added
      await buildCSS();
    }

    // Notify all connected clients to reload
    for (const client of clients) {
      try {
        client.enqueue(new TextEncoder().encode("data: reload\n\n"));
      } catch {
        clients.delete(client);
      }
    }
    console.log("Rebuilt successfully");
  } catch (err) {
    console.error("Rebuild error:", err);
  }

  rebuilding = false;
});
