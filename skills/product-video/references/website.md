# Filming a website

The footage is Chromium's own screencast of the site while a shots file drives it. `capture-web.mjs` writes each shot straight to a 30 fps frame sequence, so there is no movie to cut. The capture and render path has been run against a live public page.

## 1. Decide what to point at

- **Public pages that need no account** (landing, browse, a public preview or demo page): film the deployed site or a local dev server. Reading public pages changes nothing.
- **Signed-in features**: use a local dev server with seed or demo data, a preview/demo mode, or a test account the repo provides in its seed or fixture files. Check what database the local server talks to before any shot that writes (adding, saving, deleting): many setups point local dev at production. If it does, film only read-only flows or use an isolated local database.
- **Never type real credentials.** If only a real account will do, run with `--profile <dir> --headed`, let the user sign in themselves in the window that opens, and keep that profile directory out of Git.
- **A repo-provided local login helper** (a script that mints a single-use sign-in link for a synthetic dev user) is the best case: redeem the link once in a persistent profile (`chromium.launchPersistentContext(profile)` → `page.goto(link)`), then run every shot with `--profile <dir>`. Copy the whole link — a base64url nonce can contain `-` and `_` — and never read or store the session token itself; the browser profile holds it.

Look for a page built to show the product with representative data (a public preview week, a demo basket, a sample report). That is the web equivalent of a screenshot fixture.

## 2. Choose the viewport

| The video is… | Viewport | Composition |
| --- | --- | --- |
| Portrait (4:5, 9:16) and the site works on mobile | `{ width: 402, height: 874, deviceScaleFactor: 3, isMobile: true }` | `frame: "phone"`, `footage: { width: 1206, height: 2622 }` (or capture with `--max-width 804`) |
| About the desktop experience | `{ width: 1440, height: 900, deviceScaleFactor: 2 }` with `--max-width 1880` | `frame: "browser"`, `footage: { width: 1880, height: 1175 }` |

In a portrait video a desktop browser window is small and leaves the lower canvas empty; the phone frame fills it. Prefer the mobile viewport unless the feature only exists, or only makes sense, on desktop. For a desktop-led video consider a square (1080×1080) canvas.

## 3. Write the shots file

Copy `assets/kit/template/shots.example.mjs` next to the composition and write one shot per feature:

```js
export default [
  {
    name: "search",
    url: "http://localhost:3000/",
    viewport: { width: 402, height: 874, deviceScaleFactor: 3, isMobile: true },
    async run(page, { pause, scroll, type }) {
      await pause(1.5);                                   // settled state to hold on
      await type(page.getByRole("searchbox"), "milk");   // human-paced typing
      await page.getByText("Fresh Milk").first().waitFor();
      await pause(1.5);
      await scroll(500, 1.2);                             // eased scroll, in seconds
      await pause(2);
    },
  },
];
```

- `page` is a Playwright page: use role and text locators; they survive restyling.
- Dismiss cookie or consent banners in the shot before the first pause, choosing the privacy-preserving option.
- Wait for images and data (`waitFor`, `page.waitForLoadState("networkidle")`) before the first hold, so the hold is not a skeleton.

## 4. Record

```sh
node <kit>/capture-web.mjs <video-dir>/shots.mjs --out <video-dir>/footage [--max-width 1880] [--only search]
<kit>/footage.sh sheet <video-dir>/footage/search sheet.jpg     # numbers × 8 = frame
```

Each shot becomes `footage/<name>/0001.jpg …`; the printed frame count is the scene's `count`. A dev server must already be running if the shots point at one — start it the way the repo documents.

## Things that go wrong

- **Blurry phone footage**: the shot used a desktop `deviceScaleFactor`. Mobile shots need 3.
- **A static page yields few distinct frames**: that is fine. The screencast only sends repaints and the script fills the gaps.
- **Bot protection or a login wall on a deployed site**: film the local dev server instead, or run `--headed`.
- **Hover-only UI** never appears on a mobile viewport. Film it on desktop or pick another feature.
- **No Playwright in the repo, or one without a downloaded Chromium**: `npm i playwright && npx playwright install chromium` in a scratch folder and pass `--browser-from <that folder>` to capture-web.mjs and render.mjs. Don't add it to the repo for a video.
- **A locator that matched in a browser inspector times out in the shot**: the page may be in a different state in a fresh context (a wizard remembers a choice, a step opens on a lookup first). Wait for either state with `a.or(b)` and branch, and prefer `getByPlaceholder`/exact names over role + partial name — `block 3` also matches `block 30`.
- **A result that arrives in pieces** (per-region columns, lazy sections): wait for the text that only appears when everything has loaded before the hold, or the hold shows spinners.
- **Shared development services**: film read-only pages and unsaved drafts only; pick dev fixture records (an e2e fixture merchant, a test company) so names on screen are already test data.
