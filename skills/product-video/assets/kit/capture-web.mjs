#!/usr/bin/env node
// Records web pages (a website, or pages with a browser extension loaded) as
// 30 fps JPEG sequences, one folder per shot, ready for a composition.
//
//   node capture-web.mjs <shots.mjs> --out <footage-dir> [--only name,name]
//                        [--max-width px] [--headed] [--profile dir] [--extension unpacked-dir]
//                        [--browser-from dir]
//
// shots.mjs default-exports an array of shots:
//   { name, url, viewport: { width, height, deviceScaleFactor, isMobile? },
//     async run(page, { pause, scroll, type }) { ... } }
// `run` performs the shot like a UI test: act, then pause so the edit has a
// state to hold on. Frames come from Chromium's own screencast at device
// pixels, so text stays sharp; the sequence is resampled to a steady 30 fps.
// --max-width scales frames down as they are captured (a desktop shot at
// 2x is 2880 px wide; about twice its width in the video is plenty).
//
// --extension loads an unpacked extension build and --profile keeps a signed-in
// browser profile between runs; both need --headed (Chromium only loads
// extensions in a headed, persistent context).
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { findChromium, flag, repoRoot } from "./browser.mjs";

const args = process.argv.slice(2);
const shotsFile = args[0] && !args[0].startsWith("--") ? path.resolve(args[0]) : null;
const outDir = flag(args, "out");
if (!shotsFile || typeof outDir !== "string") {
  console.error("usage: node capture-web.mjs <shots.mjs> --out <footage-dir> [--only a,b] [--headed] [--profile dir] [--extension dir]");
  process.exit(2);
}
const only = typeof flag(args, "only") === "string" ? flag(args, "only").split(",") : null;
const extension = flag(args, "extension");
const profile = flag(args, "profile");
const headed = flag(args, "headed") === true || Boolean(extension) || Boolean(profile);
const maxWidth = Number(flag(args, "max-width")) || 0;
const FPS = 30;

const shots = (await import(pathToFileURL(shotsFile).href)).default.filter((shot) => !only || only.includes(shot.name));
const { chromium } = findChromium(repoRoot(path.dirname(shotsFile)), flag(args, "browser-from"));

for (const shot of shots) {
  const viewport = { width: shot.viewport.width, height: shot.viewport.height };
  const contextOptions = {
    viewport,
    deviceScaleFactor: shot.viewport.deviceScaleFactor ?? 2,
    isMobile: shot.viewport.isMobile ?? false,
    hasTouch: shot.viewport.isMobile ?? false,
  };
  let browser = null;
  let context;
  if (profile || extension) {
    const launchArgs = [`--force-device-scale-factor=${contextOptions.deviceScaleFactor}`];
    if (extension) launchArgs.push(`--disable-extensions-except=${path.resolve(extension)}`, `--load-extension=${path.resolve(extension)}`);
    context = await chromium.launchPersistentContext(path.resolve(profile ?? path.join(outDir, ".profile")), {
      headless: false, args: launchArgs, ...contextOptions,
    });
  } else {
    browser = await chromium.launch({ headless: !headed, args: [`--force-device-scale-factor=${contextOptions.deviceScaleFactor}`] });
    context = await browser.newContext(contextOptions);
  }
  const page = context.pages()[0] ?? (await context.newPage());
  if (shot.url) await page.goto(shot.url, { waitUntil: "load" });

  const raw = path.join(outDir, `.raw-${shot.name}`);
  rmSync(raw, { recursive: true, force: true });
  mkdirSync(raw, { recursive: true });
  const frames = []; // { file, at } in arrival order; `at` is seconds
  const cdp = await context.newCDPSession(page);
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const file = path.join(raw, `${frames.length}.jpg`);
    writeFileSync(file, Buffer.from(data, "base64"));
    frames.push({ file, at: metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg", quality: 92, everyNthFrame: 1,
    ...(maxWidth ? { maxWidth, maxHeight: Math.round((maxWidth * viewport.height) / viewport.width) } : {}),
  });

  const pause = (seconds) => page.waitForTimeout(seconds * 1000);
  const helpers = {
    pause,
    /** Scrolls by `pixels` over `seconds` in small wheel steps, so it reads as a hand on the page. */
    async scroll(pixels, seconds = 1) {
      const eased = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2); // ease in and out
      const began = Date.now();
      let done = 0;
      while (done < 1) {
        await page.waitForTimeout(12);
        const next = Math.min(1, (Date.now() - began) / (seconds * 1000));
        await page.mouse.wheel(0, pixels * (eased(next) - eased(done)));
        done = next;
      }
    },
    /** Types into a locator one key at a time. */
    async type(locator, text, perKey = 0.09) {
      await locator.click();
      for (const character of text) {
        await page.keyboard.type(character);
        await page.waitForTimeout(perKey * 1000);
      }
    },
  };
  // The screencast only sends a frame when the page repaints, so nudge one
  // out before the shot starts and after it ends.
  await pause(0.3);
  // Frame timestamps are seconds since the epoch, the same clock as Date.now().
  const startedAt = Date.now() / 1000;
  let failure = null;
  try {
    await shot.run(page, helpers);
  } catch (error) {
    failure = error;
  }
  const endedAt = Date.now() / 1000;
  await cdp.send("Page.stopScreencast").catch(() => {});
  await context.close();
  if (browser) await browser.close();

  // Resample to a steady frame rate: each output frame is the newest
  // screencast frame at or before its time.
  const dest = path.join(outDir, shot.name);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  let cursor = 0;
  const total = Math.max(1, Math.ceil((endedAt - startedAt) * FPS));
  for (let n = 0; n < total && frames.length; n++) {
    const at = startedAt + n / FPS;
    while (cursor + 1 < frames.length && frames[cursor + 1].at <= at) cursor++;
    copyFileSync(frames[cursor].file, path.join(dest, `${String(n + 1).padStart(4, "0")}.jpg`));
  }
  rmSync(raw, { recursive: true, force: true });
  console.log(`${shot.name}: ${frames.length ? total : 0} frames (${(total / FPS).toFixed(1)}s) → ${dest}`);
  if (failure) {
    console.error(`  ${shot.name} failed part-way: ${failure.message}`);
    process.exitCode = 1;
  }
}
