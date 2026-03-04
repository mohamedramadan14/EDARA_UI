import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";

const DIST = "dist";
const ASSETS = join(DIST, "assets");

// Clean dist
if (existsSync(DIST)) rmSync(DIST, { recursive: true });
mkdirSync(ASSETS, { recursive: true });

// 1. Process Tailwind CSS
console.log("Processing CSS...");
const cssProc = Bun.spawn(
  ["bunx", "tailwindcss", "-i", "src/index.css", "-o", join(ASSETS, "style.css"), "--minify"],
  { stdout: "inherit", stderr: "inherit" }
);
const cssExit = await cssProc.exited;
if (cssExit !== 0) {
  console.error("CSS processing failed");
  process.exit(1);
}

// 2. Bundle JS/TSX
console.log("Bundling JS...");
const result = await Bun.build({
  entrypoints: ["./src/main.tsx"],
  outdir: ASSETS,
  naming: "[name]-[hash].[ext]",
  minify: true,
  sourcemap: "none",
  target: "browser",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// Find output JS file
const jsOutput = result.outputs.find((o) => o.path.endsWith(".js"));
if (!jsOutput) {
  console.error("No JS output found");
  process.exit(1);
}
const jsFilename = basename(jsOutput.path);

// 3. Generate index.html
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
    <script type="module" src="/assets/${jsFilename}"></script>
  </body>
</html>`;

await Bun.write(join(DIST, "index.html"), html);

// 3b. Copy index.html as 404.html for SPA fallback on Cloudflare Pages
await Bun.write(join(DIST, "404.html"), html);

// 4. Copy public assets
if (existsSync("public")) {
  cpSync("public", DIST, { recursive: true });
}

console.log("Build complete -> dist/");
