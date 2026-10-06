---
name: product-video
description: Make a short motion-graphics product video (under 30 seconds, Instagram- and website-ready MP4) from real footage of the user's own app — an iOS app in the Simulator, a website, or a browser extension — seeded with fixture data and styled only with the repo's own brand. Use this whenever the user asks for a product video, promo, motion graphics, a "what's new" or release video, a feature highlight reel, an Instagram post/Reel/Story video of the app, a video for the website or App Store, or says things like "make a video showing the latest updates", "show off the new features", "film the app", even if they don't say "motion graphics". It has two focuses: **product** (a what's-new or walkthrough that covers every change) and **marketing** (a promo, ad or brand piece that shows one or two features at the highest finish). Also use it for the caption that goes with such a video. In a repo with several applications it first works out which one the video is for.
user-invocable: true
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

If the repo keeps its own copy of this skill (for example in a marketing or content folder), use that copy's kit, and read any video README beside the repo's existing compositions: it records what was learned last time.

## Where everything goes: the main checkout, never a worktree

Sessions often run in a Git worktree that is deleted once its branch merges. Anything written inside a worktree — footage, renders, the caption, a signed-in browser profile — is lost with it. So the video's working folder **always lives in the repo's main checkout**, whichever checkout the session is in:

```sh
MAIN="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"   # the main checkout, from any worktree
VIDEO_DIR="$MAIN/videos/<name>"   # or beside the repo's existing videos, still under $MAIN
mkdir -p "$VIDEO_DIR"
printf '%s\n' 'videos/*/footage/' 'videos/*/out/' 'videos/*/.profile/' >> "$MAIN/.git/info/exclude"   # once; skip lines already there
```

- `<video-dir>` everywhere in this skill and its references means `$VIDEO_DIR` in the main checkout: the composition, `shots.mjs`, `footage/`, `out/` (stills, contact sheets, the MP4, poster and `caption.txt`), the browser profile (`$VIDEO_DIR/.profile`) and any raw Simulator movies (`$VIDEO_DIR/out/raw`). Never use a session scratchpad or `/tmp` for anything the user might want later.
- Keep the outputs out of Git with `.git/info/exclude`, not by editing a tracked `.gitignore` in the main checkout: the main checkout may be on a release branch and must stay clean.
- Never commit, switch branches or reset in the main checkout for a video. When the sources are committed (step 9), copy them into a branch worktree; the working copy stays in `$VIDEO_DIR`.
- A dev server, a build or a production-ref checkout may still run in a worktree. Only the video's files have to live under `$MAIN`. Pass `--root "$MAIN"` to `render.mjs` if the composition references repo assets such as the logo.

## 1. Which application?

A repo often holds several products: an iOS app, a website, a browser extension. Footage, data seeding and the device frame all depend on which one the video is about, so settle it before anything else.

1. **Look at the repo.** Read the README or agent instructions, list the app folders, and note what exists: an `.xcodeproj`/`.xcworkspace` (iOS), a web app (`next.config.*`, `vite.config.*`, …), an extension (`manifest.json`, Plasmo/WXT config). Note each one's product name; an app can have a different name from the company.
2. **Take it from the request when it is there.** "Video of the iPhone app", "for the extension", or a product name that belongs to one app is an answer. Words like "simulator" point at iOS. "For the website" usually names where the video will be *shown*, not which app it shows — don't read it as the subject on its own.
3. **Otherwise ask**, once, offering the applications you found (and "more than one" if that is plausible). This is the user's call: guessing wrong wastes the whole capture.

Then read the reference for that application before capturing (after settling the focus below):

- iOS app → `references/ios.md`
- Website → `references/website.md`
- Browser extension → `references/extension.md`

## 2. Focus: product or marketing

The focus decides how many features the video shows and how much finish each one gets. Settle it with the application, before the brief.

| | **Product** | **Marketing** |
| --- | --- | --- |
| Job | Tell existing users and the team what changed | Make someone who has never used it want it |
| Features | 3–5, one per scene — coverage matters | 1–2 hero moments, 3 at most — leave the rest out |
| Length | 20–28 s | 12–20 s |
| Scenes | 4–5.5 s, two beats, chips name the UI | 5–7 s, fewer cuts, one idea held long enough to land |
| Copy | What you can now do ("Tick it off as you go") | The outcome or feeling ("Never lose a thought") — no feature names |
| Bar | Accurate and complete | Every frame could be a poster; reshoot rather than accept a flawed take |

- **From the request.** "What's new", "release", "changelog", "walkthrough", "show the latest updates", "for a team update" → product. "Promo", "ad", "campaign", "launch", "brand", "hero video for the homepage", "make people want it" → marketing. Where the video will be posted (Instagram, website) does not decide it on its own.
- **Otherwise ask**, once, together with the application question if that is still open. Default to product only when the user is unavailable, and say so.

For **marketing**, choosing what to leave out is the work:

- Pick the one or two moments that are the most visual and most clearly valuable to a newcomer — not the newest or the hardest to build. A small, beautiful interaction beats a large feature that needs explaining.
- Tell the user what you picked **and what you dropped**, so they can swap.
- Spend the time the extra features would have taken on finish: a cleaner fixture data set (believable names, good imagery, no empty states), several takes of each shot, a designed intro (the logo built from its parts), and a device-free moment where it helps the story (see `references/composition.md` → Marketing).

Both focuses keep the same rules: real footage, real brand, nothing claimed that the product does not do today, filmed from production.

## 3. The brief

Fill these from the request; ask only for what you cannot find or sensibly default.

- **What to show.** For a product video, read that app's recent history: `git log` on its folder, release notes, changelog, store metadata. Pick 3–5 changes a user would notice and can be *seen* on screen. One feature per scene. For a marketing video, pick 1–2 hero moments from what the product does today (new or not) as above. Either way, tell the user which you picked.
- **Name.** Use the name the user gave, exactly. Otherwise the product's listed name.
- **Format.** Default 1080×1350 (4:5): an Instagram post that also sits well on a web page. 1080×1920 for Reels/Stories. Under 30 seconds unless told otherwise; 20–28 is the sweet spot for a product video of four or five features, 12–20 for a marketing video.
- **Call to action.** Only something that exists today (the website; a store link only if the listing is live).

## 4. Brand

Find the design system before writing a line of the composition: a tokens file, Tailwind/theme config, a brand or design-system doc, the logo master, the font files. Read its rules as well as its values — which colour means what, how headlines are set, what is forbidden.

Use only what you find. If the user says "don't make up branding", that is the default here anyway: no new colours, no stock gradients, no substitute fonts. If something is missing (no dark device colour, no font file), use the nearest token and say so at the end.

## 5. Footage

Follow the application's reference. Whatever the surface, the rules are the same:

- **Film the released product.** For a "what's new" or release video, capture from a checkout of the production branch (`main`, `master`, `production` — whatever the repo deploys from), or from the deployed production/dev site when the pages are public. Never film from a development branch: a merged-but-unreleased feature must not appear in a video about what is live.
- **Seed from fixtures.** Use the repo's existing test fixtures, screenshot mode, demo data or seed scripts. If none covers a feature, add fixture data to the repo and commit it (generic product names; real data only where the repo already uses it). Never film a real user's account, and never write to a production database for a video.
- **One shot per feature**, written like a UI test that is being watched: act, pause 1–2.5 s, act. The pauses are what the edit holds on.
- **Check every shot for things that should not be public**: email addresses, tokens, debug panels, error banners, "session ended" states. Re-shoot or drop the shot; don't hope nobody pauses the video.
- **Marketing: take the best of several.** Record each hero shot three or more times (vary the pace and the data) and edit from the cleanest take. A hesitant scroll, a loading spinner, a keyboard that flashes up or a half-loaded image is a reshoot, not something to cut around.
- **Look before you edit.** `footage.sh sheet` gives a numbered contact sheet. Use it to find where each gesture starts and ends; those numbers become the scene's `frames`.

## 6. Compose

Copy `assets/kit/template/` into `$VIDEO_DIR` in the main checkout (see "Where everything goes"; put it beside earlier videos if the repo has any). Put the cut footage in its `footage/` folder; `.git/info/exclude` keeps it out of Git. Then fill in the three marked blocks in `index.html`: **BRAND**, **VIDEO**, **SCENES**.

Read `references/composition.md` before you write scenes; for a marketing video read its **Marketing** section too. It covers pacing, headline and chip copy, the two-beat scene, the edit (`frames`), and when to go beyond the template — for example building the logo from its SVG parts for the intro, or adding a scene with no device (a row of logos, a number).

## 7. Review, then render

A full render takes a minute or more, so look at stills first:

```sh
node <kit>/render.mjs <video-dir> --still 1,2.2,4,6.5,9,12,15,18,21,24,27   # JPEGs in <video-dir>/out/
node <kit>/render.mjs <video-dir> --out <video-dir>/out/<name>.mp4   # <video-dir> is $VIDEO_DIR in the main checkout
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration,size <name>.mp4
```

Read the stills (tile them into one image to save effort). Look for: text that wraps badly or is clipped, a chip covering the thing it names, the action hidden below the canvas edge, a headline with too little time, a frame that shows something private. After the full render, cut a dense strip across one transition and the intro to check motion, since stills cannot show it.

For a marketing video, raise the bar: render a still every half second, not one or two per scene, and treat any frame you would not use as a poster as a defect — a cramped layout, a chip that feels like a label rather than design, a moment where nothing moves or everything moves. Fix it and re-render; the extra passes are where the quality comes from.

`render.mjs` finds Chromium from a `patchright` or `playwright` dependency anywhere in the repo's workspaces; pass `--browser-from <dir>` if it cannot (a scratch folder with `playwright` installed is fine; don't add it to the repo for a video). It needs `ffmpeg` on `PATH`.

Leave a `README.md` beside the repo's videos recording what was learned (which fixture records film well, how to sign in, locator gotchas); the next video starts from it.

## 8. Caption

A video for a social post needs its caption. Draft it without being asked and save it beside the MP4 as `$VIDEO_DIR/out/caption.txt`.

- Look for the repo's own caption rules first (a content studio, a social or brand voice doc, a product config with standing hashtags) and follow them, including case and hashtag count.
- With no house rules: one or two plain sentences that name what is new, then where to go. Two or three hashtags at most. No claims the video does not show, no "download now" unless the listing is live.
- Offer a second variant with a different angle (the benefit, rather than the list of features) so the user can choose.
- For a marketing video, lead both variants with the benefit or the feeling, not a feature list, and keep them shorter: one line plus the call to action.

## 9. Deliver

- Send the MP4 to the user (and a poster frame if it is going on a website: `ffmpeg -ss <t> -i video.mp4 -frames:v 1 poster.jpg`).
- Say which focus you used, and for marketing, which features you left out.
- Say plainly what you did not verify. You reviewed frames, not real-time playback: say so, and name any beat that feels short. Say the video is silent unless you added licensed music the repo already holds.
- Send the files from `$VIDEO_DIR/out/` in the main checkout, and give the user that path, so they survive when the session's worktree is removed.
- Commit what makes the next video cheaper — the shot tests or shots file, any new fixtures, the composition, the README — on a branch, as a draft PR if that is how the repo works, following its own conventions. Make the branch in a new worktree from the repo's development branch, copy the sources there from `$VIDEO_DIR`, and commit from that worktree; the main checkout is never committed to. Do not commit footage, frame sequences or rendered videos unless the repo already does.
- Posting is the user's decision. Do not publish to social accounts or wire the video into a page unless asked.
