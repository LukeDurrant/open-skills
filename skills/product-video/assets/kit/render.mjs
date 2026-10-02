#!/usr/bin/env node
// Renders a frame-driven HTML composition to an H.264 MP4.
//
//   node render.mjs <composition-dir> [--out file.mp4] [--still 1.5,4,9] [--from s] [--to s]
//                   [--serve] [--root dir] [--browser-from dir]
//
// The composition's index.html sets
//   window.composition = { width, height, fps, duration, renderFrame(seconds), ready: true }
// where renderFrame resolves once that frame is fully drawn. Each frame is
// screenshotted in headless Chromium and piped to the system ffmpeg, so the
// result is exact and repeatable whatever the machine's speed.
//
// --still writes single JPEG frames instead of a video: review those before
// paying for a full render. --serve renders nothing: it prints a URL to open
// in a browser, where the composition plays in a loop (add ?t=12.5 for one frame). --root is the directory served to the page
// (default: the git top level), so a composition can load the repo's own
// fonts, logos and tokens by relative path.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { findChromium, flag, repoRoot, serve } from "./browser.mjs";

const args = process.argv.slice(2);
if (!args[0] || args[0].startsWith("--")) {
  console.error("usage: node render.mjs <composition-dir> [--out file.mp4] [--still 1.5,4] [--from s] [--to s]");
  process.exit(2);
}
const dir = path.resolve(args[0]);
const root = path.resolve(flag(args, "root") ?? repoRoot(dir));
const out = path.resolve(flag(args, "out") ?? path.join(dir, "out", `${path.basename(dir)}.mp4`));
mkdirSync(path.dirname(out), { recursive: true });

const server = await serve(root);
if (flag(args, "serve")) {
  console.log(`${server.url(path.join(dir, "index.html"))}\nCtrl-C to stop.`);
  await new Promise(() => {});
}
const { chromium, name: driver } = findChromium(root, flag(args, "browser-from"));
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
page.on("pageerror", (error) => {
  console.error(error);
  process.exitCode = 1;
});
// A missing font, logo, module or footage frame is the usual reason a
// composition never becomes ready: say which file.
page.on("response", (response) => {
  if (response.status() >= 400) console.error(`${response.status()} ${response.url()}`);
});
page.on("console", (message) => {
  if (message.type() === "error") console.error(message.text());
});
// patchright evaluates in an isolated world unless the third argument is
// false; playwright rejects a third argument. The composition lives in the page's own world.
const inPage = (fn, arg) => (driver === "patchright" ? page.evaluate(fn, arg, false) : page.evaluate(fn, arg));

await page.goto(`${server.url(path.join(dir, "index.html"))}?render=1`);
const deadline = Date.now() + 120_000;
while (!(await inPage(() => window.composition?.ready === true))) {
  if (Date.now() > deadline) throw new Error("The composition never set window.composition.ready — open it in a browser and check the console.");
  await new Promise((resolve) => setTimeout(resolve, 200));
}
const { width, height, fps, duration } = await inPage(() => {
  const { width, height, fps, duration } = window.composition;
  return { width, height, fps, duration };
});
await page.setViewportSize({ width, height });

const still = flag(args, "still");
if (still !== undefined) {
  for (const seconds of String(still).split(",").map(Number)) {
    await inPage((s) => window.composition.renderFrame(s), seconds);
    const file = out.replace(/\.mp4$/, `-${seconds.toFixed(2)}s.jpg`);
    writeFileSync(file, await page.screenshot({ type: "jpeg", quality: 90 }));
    console.log(file);
  }
} else {
  const first = Math.round(Number(flag(args, "from") ?? 0) * fps);
  const last = Math.round(Number(flag(args, "to") ?? duration) * fps);
  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-y", "-loglevel", "error",
      "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
      // A silent stereo track: some players and Instagram's uploader expect one.
      "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
      "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", out,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  for (let frame = first; frame < last; frame++) {
    await inPage((s) => window.composition.renderFrame(s), frame / fps);
    const png = await page.screenshot({ type: "png" });
    if (!ffmpeg.stdin.write(png)) await new Promise((resolve) => ffmpeg.stdin.once("drain", resolve));
    if ((frame - first) % fps === 0) process.stdout.write(`\r${(frame - first) / fps}s / ${Math.round((last - first) / fps)}s`);
  }
  ffmpeg.stdin.end();
  const code = await new Promise((resolve) => ffmpeg.on("close", resolve));
  if (code !== 0) process.exitCode = code;
  console.log(`\n${out}`);
}
await browser.close();
server.close();
