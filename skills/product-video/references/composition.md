# Composing the video

The template gives you an intro, one scene per feature and an outro. This file is about filling it well.

## Shape and pacing (product focus)

| Part | Length | What happens |
| --- | --- | --- |
| Intro | 2.5 s | Logo springs in, title reveals word by word, the kicker pill pops, then the lockup rides to the header |
| Scene × 3–5 | 4–5.5 s each | Beat A: headline over the device. Beat B: headline leaves, device moves up, chips name what is on screen |
| Outro | 3 s | Logo returns, title, byline, tagline, call-to-action pill |

Keep the total under 30 seconds. Four features at about 4.5 s each lands near 23–26 s. If there are more than five things to say, pick the five a user would notice and leave the rest for the caption.

**Read time is the constraint that gets broken.** A headline needs about 0.6 s to arrive and then at least 1.5 s on screen: set `beat` to 2.3 or more. Six words is a comfortable headline; nine is the limit. Chips need a second each.

## Copy

- **Headlines** say what the user can now do, in their words: "Tick it off as you go", not "In-store mode with persistent state". Sentence case. Wrap exactly one phrase in `<b>` for the accent colour — the part that is new.
- **Chips** name the thing on screen ("Search everything", "Saved to your list"). Keep them under about 24 characters. They do not repeat prices or numbers from the footage, and they must not cover the element they describe: place them beside it.
- **Only true things.** Every claim must be visible in the footage or stated in the repo's own release notes. No "fastest", "smartest", "#1".
- Follow the repo's content rules (tone, banned words, emoji policy, how other companies' names may appear).

## The edit: `frames`

`frames` maps scene time to footage frames: `[[sceneSeconds, footageFrame], …]`, linear between keys. It is the whole edit.

- Find each gesture's first and last frame on the contact sheet (`footage.sh sheet`).
- **Skip dead time by jumping**: a 2-second hold in the footage can be 0.4 s of video.
- **Play gestures near real speed** (frames advance about 30 per second). Typing and taps look wrong sped up more than about 2×; a long scroll can run 3× and reads as a confident flick.
- **Land the payoff inside beat B**, after the device has moved up and just as its chip appears. If the action happens during beat A, the headline is competing with it: shift the keys later.
- End each scene on a settled frame, not mid-gesture: the device turns edge-on to change footage and a moving screen makes the turn look like a glitch.

Example, from a clip where typing runs 56–128 and the tap lands at 240:

```js
{ clip: "other", count: 330, length: 4.0, beat: 1.7,
  headline: "Add <b>anything</b> to your list",
  frames: [[0, 10], [0.8, 50], [1.6, 130], [2.4, 225], [3.0, 262], [4.0, 300]],
  chips: [{ text: "Search everything", at: 2.5, y: 880 }, { text: "Saved to your list", at: 3.0, y: 1016 }] }
```

## Layout

- Canvas coordinates are pixels on a 1080-wide stage. Chip `y` is from the top; chips sit on the side away from the device (the template alternates sides per scene) and may overlap the device's edge.
- If the action is in the lower third of the screen (a bottom sheet, a keyboard), give the scene `pose: { y: 166, scale: 0.9 }` so the whole device is visible in beat B.
- For 9:16, set `height: 1920` and `safeTop: 220`, and keep chips above about `y = 1400` so the platform's own buttons do not cover them.

## Marketing

A marketing video uses the same template with fewer, longer, more finished scenes. The pacing table above is for product videos; for marketing use this one:

| Part | Length | What happens |
| --- | --- | --- |
| Intro | 2–3 s | A designed open: the logo built from its parts, or a single line of copy that sets up the problem |
| Hero scene × 1–2 (3 at most) | 5–7 s each | One idea. Headline lands, then the device carries the action in a single unhurried take; at most one chip, or none |
| Optional device-free beat | 2–3 s | The outcome as a graphic: a number, a before/after, a line of copy alone on brand colour |
| Outro | 3 s | Logo, one-line promise, call to action |

- **Copy is the outcome, not the feature.** "Never lose a thought", not "Shared notes". Five words or fewer for headlines; the footage explains the how.
- **Hold longer, cut less.** Let the payoff sit for a full second before anything else moves. Fewer device turns: one turn per scene, or a continuous take across two moments of the same clip.
- **Chips are optional.** Use one only if the screen is unclear without it, and make it feel like part of the design (the design system's pill or badge, placed with care), not a label.
- **More craft per second**: the inline-SVG logo build, a subtle push-in on the device during the payoff (scale 1 → 1.04 over the hold), staggered word reveals on every headline, and a device-free beat where it helps. Everything below in "Going beyond the template" is expected here, not optional.
- **Fixture data must look like a real, appealing product**: believable names and items, good imagery, a full but uncluttered screen. Empty states, placeholder text or "Test merchant" are reshoots.
- **Review every half second** of the render, not one or two moments per scene, and fix anything that would not work as a poster.

## Going beyond the template

The template is a floor. Make the piece feel designed for this product:

- **Build the logo instead of fading it in.** If the logo is simple SVG geometry, inline it and animate its parts into place in the intro (draw a stroke, drop a shape with a spring, let it settle). Use `spring()` and `track()`; replace the `#logo` image with the inline SVG and keep the same transform.
- **A scene without a device** for something that is not a screen: availability in new countries as rows of logo tiles springing in, a number counting up, a before/after pair. Hide the device for that scene's span and add your own elements, positioned and animated in `renderFrame`.
- **Use the design system's components** as shapes: its card radius, its pill, its badge, so on-screen graphics look like the product.

Keep the rules that make frames reproducible: no CSS animations or transitions, no timers, no randomness without a fixed seed. Everything is computed from `t`.

Motion taste, briefly: things arrive fast and settle slowly (`ease.outQuint`, `spring`), leave quickly (`ease.inCubic`), and never all move at once — stagger words and tiles by 40–90 ms. One idea moves at a time; the device drifts a few degrees while a headline is being read so the frame is never frozen.

## Review checklist

Render stills at one or two moments per scene plus intro and outro, tile them, and check:

- every headline fully visible, wrapping sensibly, and on screen long enough;
- chips legible, beside what they name, not clipped by the canvas;
- the payoff of each scene visible (not under a chip, a keyboard or the canvas edge);
- only brand colours and the brand font on screen; the logo undistorted;
- nothing private or broken in any footage frame;
- the outro's call to action is real.

Then render fully and cut a dense strip (every third frame) across the intro and one scene change to see the motion.

## Caption

Draft the post caption with the video (see SKILL.md step 7). A reliable shape when the repo has no rules of its own:

```
<what is new, in one plain sentence>. <where to go>
#tag #tag
```

Write a second variant from a different angle — the benefit to the viewer rather than the feature list — and let the user choose.
