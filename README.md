# open-skills

Agent skills for Claude Code (and other agents that read `SKILL.md` skills).

| Skill | What it does |
| --- | --- |
| [product-video](skills/product-video/SKILL.md) | Makes a short motion-graphics product video (MP4, Instagram- and website-ready) from scripted footage of your own iOS app, website or browser extension, styled with your repo's own brand. |

## Install

Copy a skill folder into your skills directory:

```sh
git clone https://github.com/LukeDurrant/open-skills.git
cp -R open-skills/skills/product-video ~/.claude/skills/
```

### product-video requirements

- Node.js and `ffmpeg` on `PATH`
- Playwright or Patchright with Chromium downloaded (in the target repo, or a scratch folder passed with `--browser-from`)
- Xcode and the iOS Simulator for iOS footage

## License

[MIT](LICENSE)
