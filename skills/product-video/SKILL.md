---
name: product-video
description: Make a short motion-graphics product video (under 30 seconds, Instagram- and website-ready MP4) from real footage of the user's own app — an iOS app in the Simulator, a website, or a browser extension — seeded with fixture data and styled only with the repo's own brand. Use this whenever the user asks for a product video, promo, motion graphics, a "what's new" or release video, a feature highlight reel, an Instagram post/Reel/Story video of the app, a video for the website or App Store, or says things like "make a video showing the latest updates", "show off the new features", "film the app", even if they don't say "motion graphics". Also use it for the caption that goes with such a video. In a repo with several applications it first works out which one the video is for.
user-invokable: true
---

# Product video

Make a short, dynamic video of a product from **real footage of the real app** and the **repo's own brand**. The result is an H.264 MP4 (default 1080×1350, 4:5) that works as an Instagram post and on a website.

Three ideas carry the whole skill:

- **Footage is a script, not a hand on the mouse.** Each shot is a UI test (iOS) or a shots file (web, extension) that performs the feature on fixture data, with pauses for the edit. It is repeatable, it shows a known data set, and it never films a real account.
- **The edit is code.** A composition is one HTML page whose every on-screen value is a function of time. `render.mjs` screenshots it frame by frame and encodes it, so a render is exact and the same on any machine.
- **Nothing is invented.** Colours, type and logo come from the repo's design system; copy says only what the product does today; the device shows recorded pixels, never a redrawn screen.

The kit is in this skill's `assets/kit/` and is used in place — do not copy the scripts into the repo:

| File | Job |
| --- | --- |
| `capture-ios.sh` | Records each shot UI test as a Simulator movie |
| `capture-web.mjs` | Records web pages (or pages with an unpacked extension) as frame sequences |
| `footage.sh` | `sheet`: numbered contact sheet. `cut`: movie → 30 fps frames |
| `template/` | The composition to copy: intro, one scene per feature, outro |
| `render.mjs` | Composition → MP4, single stills, or a live preview URL |
| `lib/motion.js` | Easing, springs, keyframe tracks, word reveals |

If the repo keeps its own copy of this skill (for example under a content or marketing app), use that copy's kit, and read any video README beside the repo's existing compositions: it records what was learned last time.

## 1. Which application?

A repo often holds several products: an iOS app, a website, a browser extension. Footage, data seeding and the device frame all depend on which one the video is about, so settle it before anything else.

1. **Look at the repo.** Read the README or agent instructions, list the app folders, and note what exists: an `.xcodeproj`/`.xcworkspace` (iOS), a web app (`next.config.*`, `vite.config.*`, …), an extension (`manifest.json`, Plasmo/WXT config). Note each one's product name; an app can have a different name from the company.
2. **Take it from the request when it is there.** "Video of the iPhone app", "for the extension", or a product name that belongs to one app is an answer. Words like "simulator" point at iOS. "For the website" usually names where the video will be *shown*, not which app it shows — don't read it as the subject on its own.
3. **Otherwise ask**, once, offering the applications you found (and "more than one" if that is plausible). This is the user's call: guessing wrong wastes the whole capture.

Then read the reference for that application before capturing:

- iOS app → `references/ios.md`
- Website → `references/website.md`
- Browser extension → `references/extension.md`

## 2. The brief

Fill these from the request; ask only for what you cannot find or sensibly default.

- **What to show.** For a "what's new" video, read that app's recent history: `git log` on its folder, release notes, changelog, store metadata. Pick 3–5 changes a user would notice and can be *seen* on screen. One feature per scene. Tell the user which you picked.
- **Name.** Use the name the user gave, exactly. Otherwise the product's listed name.
- **Format.** Default 1080×1350 (4:5): an Instagram post that also sits well on a web page. 1080×1920 for Reels/Stories. Under 30 seconds unless told otherwise; 20–28 is the sweet spot for four or five features.
- **Call to action.** Only something that exists today (the website; a store link only if the listing is live).

## 3. Brand

Find the design system before writing a line of the composition: a tokens file, Tailwind/theme config, a brand or design-system doc, the logo master, the font files. Read its rules as well as its values — which colour means what, how headlines are set, what is forbidden.

Use only what you find. If the user says "don't make up branding", that is the default here anyway: no new colours, no stock gradients, no substitute fonts. If something is missing (no dark device colour, no font file), use the nearest token and say so at the end.

## 4. Footage

Follow the application's reference. Whatever the surface, the rules are the same:

- **Film the released product.** For a "what's new" or release video, capture from a checkout of the production branch (`main`, `master`, `production` — whatever the repo deploys from), or from the deployed production/dev site when the pages are public. Never film from a development branch: a merged-but-unreleased feature must not appear in a video about what is live.
- **Seed from fixtures.** Use the repo's existing test fixtures, screenshot mode, demo data or seed scripts. If none covers a feature, add fixture data to the repo and commit it (generic product names; real data only where the repo already uses it). Never film a real user's account, and never write to a production database for a video.
- **One shot per feature**, written like a UI test that is being watched: act, pause 1–2.5 s, act. The pauses are what the edit holds on.
- **Check every shot for things that should not be public**: email addresses, tokens, debug panels, error banners, "session ended" states. Re-shoot or drop the shot; don't hope nobody pauses the video.
- **Look before you edit.** `footage.sh sheet` gives a numbered contact sheet. Use it to find where each gesture starts and ends; those numbers become the scene's `frames`.

## 5. Compose

Copy `assets/kit/template/` into the repo as the video's folder (next to earlier videos if there are any, otherwise where the repo keeps marketing or content work). Put the cut footage in its `footage/` folder and make sure Git ignores that folder. Then fill in the three marked blocks in `index.html`: **BRAND**, **VIDEO**, **SCENES**.

Read `references/composition.md` before you write scenes. It covers pacing, headline and chip copy, the two-beat scene, the edit (`frames`), and when to go beyond the template — for example building the logo from its SVG parts for the intro, or adding a scene with no device (a row of logos, a number).

## 6. Review, then render

A full render takes a minute or more, so look at stills first:

```sh
node <kit>/render.mjs <video-dir> --still 1,2.2,4,6.5,9,12,15,18,21,24,27   # JPEGs in <video-dir>/out/
node <kit>/render.mjs <video-dir> --out <somewhere ignored by Git>/<name>.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration,size <name>.mp4
```

Read the stills (tile them into one image to save effort). Look for: text that wraps badly or is clipped, a chip covering the thing it names, the action hidden below the canvas edge, a headline with too little time, a frame that shows something private. After the full render, cut a dense strip across one transition and the intro to check motion, since stills cannot show it.

`render.mjs` finds Chromium from a `patchright` or `playwright` dependency anywhere in the repo's workspaces; pass `--browser-from <dir>` if it cannot (a scratch folder with `playwright` installed is fine; don't add it to the repo for a video). It needs `ffmpeg` on `PATH`.

Leave a `README.md` beside the repo's videos recording what was learned (which fixture records film well, how to sign in, locator gotchas); the next video starts from it.

## 7. Caption

A video for a social post needs its caption. Draft it without being asked and save it beside the MP4 as `caption.txt`.

- Look for the repo's own caption rules first (a content studio, a social or brand voice doc, a product config with standing hashtags) and follow them, including case and hashtag count.
- With no house rules: one or two plain sentences that name what is new, then where to go. Two or three hashtags at most. No claims the video does not show, no "download now" unless the listing is live.
- Offer a second variant with a different angle (the benefit, rather than the list of features) so the user can choose.

## 8. Deliver

- Send the MP4 to the user (and a poster frame if it is going on a website: `ffmpeg -ss <t> -i video.mp4 -frames:v 1 poster.jpg`).
- Say plainly what you did not verify. You reviewed frames, not real-time playback: say so, and name any beat that feels short. Say the video is silent unless you added licensed music the repo already holds.
- Commit what makes the next video cheaper — the shot tests or shots file, any new fixtures, the composition folder — on a branch, as a draft PR if that is how the repo works, following its own conventions. Do not commit footage, frame sequences or rendered videos unless the repo already does.
- Posting is the user's decision. Do not publish to social accounts or wire the video into a page unless asked.
