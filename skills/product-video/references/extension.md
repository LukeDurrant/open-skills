# Filming a browser extension

An extension is filmed like a website (`references/website.md` — read it first), with the built extension loaded into the browser. The difference is where it runs: on **someone else's page**, usually signed in, in a headed browser.

This path is assembled from tested parts (`capture-web.mjs` records pages; `--extension` and `--profile` use Chromium's standard unpacked-extension flags) but has **not been run end to end** by this skill. Expect to adjust, and tell the user what you had to change.

## 1. Find the repo's own harness first

If the repo already captures screenshots of the extension (look for a capture script under the extension's `scripts/`, a `screenshots` package script, or a task doc about store or marketing screenshots), read it before anything else. It already knows:

- how to build the extension for capture and where the unpacked build lands,
- which host the extension talks to and how to point it at a local server,
- how sign-in is handled (a persistent profile, env-supplied test credentials),
- which real pages it works on and how to pick a product that still exists.

Mirror it. Often the cheapest route is to copy its page flow into a shots file.

## 2. Build and load

```sh
# build the unpacked extension the way the repo documents, then:
node <kit>/capture-web.mjs <video-dir>/shots.mjs --out <video-dir>/footage \
  --extension <path to unpacked build> --profile <profile dir kept out of Git> --max-width 1880
```

`--extension` forces a headed, persistent browser — Chromium does not load extensions otherwise. The window will appear on the user's screen; tell them before you start.

## 3. Sign-in and the host page

- **Sign-in.** Do not type the user's credentials. Reuse the profile directory the repo's screenshot harness already signed in, or open the profile once and let the user sign in themselves. Test credentials from the repo's own seed or example config are fine against a local server.
- **The host page is a third party's site.** Film only what a shopper would normally see, keep the visit short, and do not submit forms or add to a cart there. Sites with bot protection refuse headless browsers and data-centre IPs: this capture belongs on a developer machine, headed.
- **Pick a page that will still exist.** Choose the product or search at capture time (first result that has the extension's overlay), not a hardcoded URL that will go stale.

## 4. Shots that suit an extension

- **Before / after**: the page as the site serves it, then with the extension's overlay. If the harness can hide the overlay, film both and cut between them — it is the clearest way to show what the extension adds.
- **The popup**: open `chrome-extension://<id>/popup.html` as an ordinary page in a small viewport (`{ width: 380, height: 600, deviceScaleFactor: 3 }`) and film it in the phone-shaped frame, or crop it into a chip-sized card. Read the id from the service worker URL: `context.serviceWorkers()[0].url()`.
- **Wait for the overlay**, not the page: `await page.locator("<the overlay's host element>").first().waitFor()` before the first hold.

In the composition use `frame: "browser"` (see the viewport table in `references/website.md`).

## Before delivering

Check every frame for the signed-in account's name or email in the host site's header, a delivery address, a real cart, or a debug toggle in the popup. Crop the viewport, sign in to a clean test account, or drop the shot.
