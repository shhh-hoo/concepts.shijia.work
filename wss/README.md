# WSS / WSS2 content page

This is the integrated WSS content chapter, not a separate redesign of the original quiz application. The recovered design is preserved: WSS opening film and stage artwork; a prominent complete WSS2 teaser; main visual and real stage photograph; entrance and invitation film; game-in-use photograph and original-site link. HISNOW is intentionally excluded.

## Recovery checkpoint — 17 September 2026

The source implementation and 28-check browser suite were recovered unchanged from the interrupted build. The original media and previous screenshots survived; derivative media had to be regenerated. The recovered implementation passed all 28 offline checks again with actual publication media. Offline checks use set_content and explicitly do not verify browser history.

GitHub Actions separately runs the same suite over a genuine local HTTP server, with isolated, visibly labelled synthetic media for functional testing. Those fixtures are never publication assets and their screenshots are not design evidence. See the workflow run for its actual outcome; merely adding the workflow does not mean the HTTP checks passed.

## Publication status

The branch is not deployed. Do not merge or deploy source without provisioning wss/media. Actual images and videos are supplied in the companion complete-site and media packages. Their checksum manifest is generated alongside the derivatives. Source-only GitHub Actions artifacts do not contain the real media.

No Cloudflare/R2 account credentials were available during recovery. No bucket was created, no originals were made public, and no hosting migration was performed. Existing wrangler.jsonc is retained. The largest derivative is under 14 MB, so R2 is optional rather than necessary to fit the Workers individual static asset limit.

For a local review, unpack the complete-site package and run `python3 -m http.server 8765` at its root. Open `http://localhost:8765/#wss`. For the existing Worker deployment, provision all media, verify checksums, then run `npx wrangler deploy` from that root with the intended Cloudflare account authenticated.

An optional R2/CDN prefix can be set on the script element: `<script src="wss/content.js" data-media-base="https://YOUR-ASSET-HOST/wss/"></script>`. Retain the exact derivative filenames and verify image/video responses and seeking after publication.

## Verification and scope

Run `python wss/tests/browser_checks.py --offline --root . --output /tmp/wss-qa` for real-media viewport, playback, cleanup and reduced-motion checks. Run the same script with `--base-url http://127.0.0.1:8765/` for actual Back/Forward, reload and route checks. Python Playwright 1.57.0 was used for the recovered suite.

Main does not yet contain the separate draft mobile-scan implementation in PR #3. This branch preserves main and does not overwrite or merge that work. Phone-width WSS content checks are not evidence that the separate mobile scan/tap/dwell branch was integration-tested. Reconcile and test that branch before a combined production rollout.

## Media behaviour

Videos start muted; sound is explicit. WSS's opening is trimmed to 8.6 seconds to remove the black tail. The complete WSS2 teaser is approximately 13 seconds and plays once when visible. The complete 49-second signup film is user-initiated. Secondary video sources are deferred; manual pause is respected; offscreen/closed players stop; closing removes sources and listeners. Reduced motion keeps static posters until explicit play.
