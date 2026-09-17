# WSS showbook — structural redesign v3

This is a new content-page structure, not recovery of the previous media stack. `design.js` owns the new markup; `content.css` was replaced; `content.js` retains media lifecycle and concepts integration only. The previous render markup is removed.

The page contains a two-column WSS typographic/film opening, a compact graphic-language spread, a Good/Wicked typographic composition with the complete teaser, a spatial atlas that pairs artwork with the actual stage and entrance with invitation, and the real original WSS2 inside a controlled interaction surface. HISNOW is absent.

## Original application, not a mock

`live.js` loads https://shhh-hoo.github.io/WSS2/wss2.html only after explicit activation. The idle image is clearly labelled as a preview. A native dialog expands the same iframe without moving/recreating it. Stop, project exit, hiding the page, or scrolling fully away remove the iframe. Camera/microphone and unsolicited autoplay are denied. The original application has not been rewritten. It begins with collecting sixteen cards, then selection, a timed question, feedback and return.

Cross-origin app keystrokes cannot be intercepted by the parent: visible Collapse/Stop controls remain outside the iframe. The parent Escape handler collapses an expanded workspace when parent focus owns the key. No claim is made that an iframe load event alone proves the app is ready.

## Evidence and publication

Run `python wss/tests/showbook_checks.py --root . --offline --output /tmp/showbook-parent` for controller checks with actual inlined local media. This mode does not claim the remote app ran. Run with `--base-url http://127.0.0.1:8765/ --live` for the genuine HTTPS start/gather/select/question/feedback flow inside the integrated page. The workflow `wss-showbook-v3.yml` also runs browser history tests over HTTP. CI substitutes labelled synthetic portfolio images/videos; it does not substitute the embedded application. Use actual-media local screenshots for design review.

Media binaries are in the companion publication bundle, not source-only GitHub artifacts. The 21 existing derivatives are unchanged. Two clearly labelled idle-web preview derivatives were added from the verified original-site selection screenshot. Original Drive files remain untouched. All source references retain the original public WSS2 URL.

This work is isolated on `feat/wss-showbook-v3` because `feat/wss-editorial-content` advanced concurrently. Its changes have not been overwritten. No production deployment or merge is implied. The separately advancing main/mobile controller requires reconciliation before a production rollout; the phone content layout is tested here, not claimed to be an integration test of that other controller.
