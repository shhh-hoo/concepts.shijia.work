# WSS showbook — structural redesign v3

This is a new content-page structure, not recovery of the previous media stack. `design.js` owns the new markup; `content.css` was replaced; `content.js` retains media lifecycle and concepts integration only. The previous render markup is removed.

The page contains a two-column WSS typographic/film opening, a compact graphic-language spread, a Good/Wicked typographic composition with the complete teaser, a spatial atlas that pairs artwork with the actual stage and entrance with invitation, and the real original WSS2 inside a controlled interaction surface. HISNOW is absent.

## Original experience, landing first

`live.js` loads https://shhh-hoo.github.io/WSS2/ only after explicit activation. The original Good/Wicked landing page is intentionally the first live state: visitors enter the visual world before using its native `进入 WSS2` link to continue to `wss2.html` in the same iframe. Direct game entry is no longer the portfolio default.

The idle portfolio cover uses the existing WSS2 main visual rather than a game-state screenshot, so the interaction section does not reveal the tool UI before the visitor enters the original experience. A native dialog expands the same iframe without moving/recreating it. Collapse preserves the browsing context and portfolio reading position. Stop, project exit, hiding the page, or scrolling fully away remove the iframe. Camera/microphone and unsolicited autoplay are denied. The original application is not rewritten.

Cross-origin app keystrokes cannot be intercepted by the parent: visible Collapse/Stop controls remain outside the iframe. The parent Escape handler collapses an expanded workspace when parent focus owns the key. No claim is made that an iframe load event alone proves the app is ready.

## Evidence and publication

Run `python wss/tests/showbook_checks.py --root . --offline --output /tmp/showbook-parent` for controller checks with actual inlined local media. This mode does not claim the remote app ran. Run with `--base-url http://127.0.0.1:8765/ --live` to verify the genuine HTTPS root landing, its in-frame transition to the game, and the start/gather/select/question/feedback flow. `portable_checks.py` verifies the same root-to-game path from the downloadable file-URL preview. The workflow `wss-showbook-v3.yml` also runs browser history tests over HTTP.

CI substitutes labelled synthetic portfolio images/videos; it does not substitute the embedded application. Use actual-media local screenshots for design review. Media binaries are in the companion publication bundle, not source-only GitHub artifacts. Original Drive files remain untouched.

This work is isolated on `feat/wss-showbook-v3`. No production deployment or merge is implied. Keep the PR draft until the separately advancing main/mobile controller is reconciled and real `wss/media/` files are provisioned and checksum-verified.
