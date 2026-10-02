// Deterministic motion helpers for frame-rendered compositions. Nothing here
// reads a clock: every value is a pure function of the time it is given, so
// the same frame always renders the same picture.
export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, p) => a + (b - a) * p;
/** Progress 0..1 of `t` through the window that starts at `start` and lasts `dur`. */
export const prog = (t, start, dur) => clamp((t - start) / dur);

export const ease = {
  linear: (p) => p,
  outCubic: (p) => 1 - (1 - p) ** 3,
  inCubic: (p) => p ** 3,
  inOutCubic: (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
  outQuint: (p) => 1 - (1 - p) ** 5,
  inQuint: (p) => p ** 5,
  inOutQuint: (p) => (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2),
  outExpo: (p) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p)),
  inExpo: (p) => (p <= 0 ? 0 : 2 ** (10 * p - 10)),
  outBack: (p, s = 1.70158) => 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2,
};

/**
 * An underdamped spring settling on 1: `p` is seconds since release.
 * Overshoots, then rings out. `freq` in Hz, `damping` 0..1.
 */
export function spring(seconds, { freq = 2.2, damping = 0.5 } = {}) {
  if (seconds <= 0) return 0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - damping * damping);
  return 1 - Math.exp(-damping * w * seconds) * (Math.cos(wd * seconds) + ((damping * w) / wd) * Math.sin(wd * seconds));
}

/**
 * Value on a keyframe track at time `t`. `keys` is [[time, value, easing?], …]
 * in time order; a key's easing shapes the move INTO it. Values may be
 * numbers or equal-length arrays of numbers.
 */
export function track(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e = ease.inOutCubic] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const p = e(clamp((t - t0) / (t1 - t0)));
      return Array.isArray(v1) ? v1.map((v, k) => lerp(v0[k], v, p)) : lerp(v0, v1, p);
    }
  }
  return keys[keys.length - 1][1];
}

/** Splits an element's text into word spans inside clipping masks, for staggered reveals. */
export function splitWords(el) {
  const words = [];
  const walk = (node, parent) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(" ");
            continue;
          }
          const mask = document.createElement("span");
          mask.className = "word-mask";
          const word = document.createElement("span");
          word.className = "word";
          word.textContent = part;
          mask.append(word);
          frag.append(mask);
          words.push(word);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child, node);
      }
    }
  };
  walk(el);
  return words;
}
