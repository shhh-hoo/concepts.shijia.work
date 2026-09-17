# WSS / WSS2 — composed content page, revision 2

This replaces the earlier media-stack layout with a project-specific editorial grid: a typographic WSS cover, its graphic-language spread, a dedicated complete WSS2 teaser, an artwork/entrance/stage spread, and the working original web experience beside instructions and event evidence. HISNOW is excluded.

## Integration and ownership

`content.js` renders the page and owns film lifecycle; `content.css` owns project-scoped layout. `live.js` embeds the original WSS2 landing/game URLs only on deliberate activation. It does not modify or simulate the application. An iframe is removed on close, project exit, or fully leaving its section when not expanded. Camera and microphone permission are denied; the original mouse/touch flow does not need them. The parent cannot intercept Escape while a cross-origin iframe has keyboard focus, so explicit Close controls remain above and below it.

The current main mobile scan/intro/tap/dwell/pull-return implementation is integrated. Its controller still owns mobile entry and exit. Only WSS lifecycle hooks and inner-interaction Escape precedence are added to `mobile-v2.js`. `mobile-route.js` bridges WSS to native mobile browser history without replacing scan geometry or gesture behavior. The concurrent desktop WSS pull-transform fix is retained in `navigation.css`.

## Original web inspection

Live workflow 35233598536 on 17 September 2026 captured the original application inside a restricted cross-origin iframe: entry, gathering sixteen cards, shuffle, selection, question, answer feedback and return. It also captured the mobile selection layout. No application code or question data were replaced. The idle web preview is a derivative of that real selection screenshot.

The application is an event interface, not a new single-question demo: users begin the ritual and collect sixteen cards before choosing a question. Both its original landing page and game are available in the page. Mobile activation expands the frame to the native viewport; an external-tab option remains available.

## Media and publication gate

The companion complete-site package contains 23 real publication files totaling 23,704,788 bytes, including the existing 21 unchanged derivatives and two new actual-web screenshot derivatives. The repository stores their checksums, not the video/image binaries. Do not deploy a source-only Actions artifact or the CI fixture directory. Provision `wss/media/` from the companion bundle and run:

```sh
python wss/tools/check_media.py
```

The original Drive assets remain untouched. WSS intro is the verified 8.6-second active segment; WSS2 teaser and signup film are complete. No R2 upload or production rollout is implied by this source change.

## Reproducible review and tests

```sh
python wss/tools/build_preview.py /tmp/WSS-WSS2-designed-preview.html
CHROMIUM_PATH=/usr/bin/chromium python wss/tests/browser_checks.py --offline --root . --output /tmp/wss-real-media-qa
python -m http.server 8765
# In a second shell, with real media provisioned:
python wss/tests/browser_checks.py --root . --base-url http://127.0.0.1:8765/ --live --output /tmp/wss-http-qa
python wss/tests/pull_checks.py --root . --base-url http://127.0.0.1:8765/ --output /tmp/wss-pull.json
```

The portable review embeds all local films/images; the original iframe still requires an internet connection. Offline QA deliberately uses inlined content and omits real-origin history and remote-app claims. HTTP CI uses labelled synthetic *portfolio media* to exercise behavior, but `--live` operates the genuine deployed WSS2 website. CI screenshots containing fixture media are not visual-quality evidence. Visual review must use the actual-media screenshots, while workflow reports record which functional checks completed.
