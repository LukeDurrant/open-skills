// Shared by render.mjs and capture-web.mjs: find a Chromium driver the repo
// already has, and serve a directory over loopback HTTP.
import { createRequire } from "node:module";
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The git top level of `dir`, or `dir` itself outside a repository. */
export function repoRoot(dir) {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return dir;
  }
}

/**
 * `chromium` from patchright, playwright or playwright-core, whichever the
 * repo (or one of its workspaces) already depends on. `from` narrows the
 * search to one package directory.
 */
export function findChromium(root, from) {
  const dirs = from ? [path.resolve(from)] : [process.cwd(), root];
  if (!from) {
    for (const group of ["apps", "packages", "services"]) {
      const base = path.join(root, group);
      if (existsSync(base)) for (const name of readdirSync(base)) dirs.push(path.join(base, name));
    }
  }
  let stale = null;
  for (const dir of dirs) {
    if (!existsSync(path.join(dir, "package.json"))) continue;
    const require = createRequire(path.join(dir, "package.json"));
    for (const name of ["patchright", "playwright", "playwright-core"]) {
      let chromium;
      try {
        chromium = require(name).chromium;
      } catch {
        continue; // not installed here; keep looking
      }
      // A workspace can depend on a version whose browser was never
      // downloaded; prefer one that can actually launch.
      if (existsSync(chromium.executablePath())) return { chromium, name, dir };
      stale ??= { name, dir };
    }
  }
  throw new Error(
    stale
      ? `${stale.name} is installed in ${stale.dir} but its Chromium is not downloaded. Run \`npx ${stale.name} install chromium\` there.`
      : "No patchright or playwright found in this repo. Install one (for example `npm i -D playwright && npx playwright install chromium`), " +
          "or pass --browser-from <a directory whose package.json depends on it>.",
  );
}

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".ttf": "font/ttf", ".otf": "font/otf", ".woff": "font/woff", ".woff2": "font/woff2", ".json": "application/json",
};

/**
 * Serves `root` on a loopback port, plus this kit at /__kit/ so a
 * composition can import `/__kit/lib/motion.js` wherever it lives.
 * Returns { url(file), close() }.
 */
export async function serve(root) {
  const kit = path.dirname(fileURLToPath(import.meta.url));
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const base = pathname.startsWith("/__kit/") ? kit : root;
    const file = path.join(base, pathname.replace(/^\/__kit\//, "/"));
    if (!file.startsWith(base) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    url: (file) => `${origin}/${path.relative(root, file).split(path.sep).join("/")}`,
    close: () => server.close(),
  };
}

/** Value of `--name value` in argv, or undefined. `--name` alone gives true. */
export function flag(args, name) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const next = args[i + 1];
  return next === undefined || next.startsWith("--") ? true : next;
}
