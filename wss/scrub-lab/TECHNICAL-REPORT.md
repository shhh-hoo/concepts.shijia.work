# WSS / WSS2 Scroll-Scrub Technical Lab — Report

Date: 2026-09-20
Base branch: feat/wss-layered-landing-v4
Lab branch: feat/wss-scroll-scrub-lab

## Decision

**Architecture decision: YES — use scroll-scrub video for the WSS landing.**

The native controller is sufficiently responsive in real Chromium decoding/seeking tests once both films use 0.30 s GOP H.264 derivatives. The same controller on the source files is materially more latent. Forward/reverse, direction reversal, mid-progress edition reveal, film-to-theme reversibility, resize, reduced-motion fallback, delayed readiness catch-up, and cleanup all passed in the Chromium lab.

**Release decision: NOT YET.** Firefox, Safari and real iOS Safari were not available in this environment. Do not merge/deploy the real WSS landing until Safari/iOS runs the same matrix.

## Tested architecture

- Native scroll + sticky stage; no wheel interception.
- Desktop scrub travel 135vh; mobile 125vh.
- requestAnimationFrame maps geometry to normalized progress 0…1.
- RevealController owns X only; ScrubController owns Y only.
- One ScreenController per edition owns media state.
- HTMLVideoElement.currentTime performs seeking.
- Latest-value-wins: targets arriving during an outstanding seek are coalesced rather than queued.
- One-frame threshold (1/30 s) suppresses tiny seeks.
- requestVideoFrameCallback is telemetry only.
- Timeline: 0–0.86 film; 0.86–0.92 final-frame hold; 0.92–1.00 reversible theme crossfade.
- Opening stills remain under video to prevent a default black state.
- Reduced motion performs zero continuous seeks.
- Stage surface keeps touch-action: pan-y; only the divider handle uses touch-action: none.
- Destroy aborts listeners, cancels retry/frame callbacks and clears video sources.

## Media inspection

| Asset | Format | Size | Keyframe spacing |
| --- | --- | ---: | ---: |
| WSS source | 2560×1440, 30fps H.264 + AAC, 19.37s | 18,330,522 B | median 0.967s |
| WSS existing 8.6s web baseline | 1280×720, 30fps H.264 + AAC | 3,273,572 B | median 1.033s; max 3.233s |
| WSS scrub derivative | 1280×720, 30fps H.264, no audio, 8.6s | 7,229,967 B | exactly 0.300s |
| WSS2 source preview | 1920×1080, 60fps H.264 + AAC, 13.03s | 21,988,401 B | exactly 2.167s |
| WSS2 scrub derivative | 1280×720, 30fps H.264, no audio, 13.0s | 10,919,563 B | exactly 0.300s |

Tested preprocessing is reproduced by encode-media.sh: 1280×720, 30fps, H.264 libx264, CRF 18, yuv420p, no audio, faststart, GOP/keyint 9, scene-cut keyframes disabled. WSS is trimmed to its meaningful first 8.6 seconds; WSS2 keeps the full preview.

## Chromium evidence

Actually run: Chromium 144.0.7559.96 on Debian 13, ffmpeg/ffprobe 7.1.5.

The execution environment blocks top-level localhost and file navigation with ERR_BLOCKED_BY_ADMINISTRATOR. The lab therefore loaded its HTML with Playwright set_content and served the real local media bytes to Chromium through intercepted HTTP-style responses with Range support. This exercises Chromium's real H.264 decoder and currentTime seek path, but it is not a deployed-origin network test.

| Mode | WSS p50 / p95 / max | WSS2 p50 / p95 / max |
| --- | --- | --- |
| Source | 163.9 / 203.0 / 264.1 ms | 342.6 / 342.6 / 476.5 ms |
| Existing WSS web baseline + WSS2 source | 116.6 / 216.7 / 259.1 ms | 271.0 / 271.0 / 377.3 ms |
| **0.30s short-GOP** | **53.4 / 57.5 / 74.1 ms** | **34.5 / 52.3 / 63.5 ms** |

Relative to source, median seek latency fell about 67% for WSS and 90% for WSS2. In the stepped run, source media repeatedly skipped intermediate targets while an old seek settled; the short-GOP files settled all four requested targets for both editions.

## Functional matrix

PASS in Chromium:

1. Slow forward scroll tracks both films.
2. Fast forward input coalesces targets rather than accumulating a seek queue.
3. Slow reverse returns both films toward the beginning.
4. Aggressive direction reversal settles on the newest target.
5. Wheel/trackpad-style momentum remains native and reversible.
6. Horizontal reveal changes edition composition without changing normalized progress.
7. WSS ↔ WSS2 at mid-progress preserves Y-axis time.
8. Terminal film → theme works for both editions.
9. Reverse from theme re-enters film.
10. Resize preserves normalized progress.
11. Mobile-sized Chromium divider pointer drag changes reveal without changing progress.
12. Mobile gesture ownership contract: stage remains pan-y; only divider handle owns horizontal drag; outside touchmove is not JS-cancelled.
13. Reduced motion performs zero seeks and keeps reveal usable.
14. Injected ~550 ms first-media response delay preserves the still fallback and catches up to the latest target when media becomes seekable.
15. Destroy clears controller work and video sources.

Real mobile compositor scrolling itself is not claimed as verified; synthetic touch in this harness did not provide a reliable compositor-scroll signal.

## Bugs discovered by the lab

### Seekable readiness race

Chromium can briefly report readyState 4 while seekable.length is still zero. An event-only controller can miss the first target. The lab adds media readiness events plus a bounded 80 ms retry until seekable is populated.

### Resize timeline drift

With vh-based scrub travel, resize changes the denominator. The lab preserves normalized progress, recomputes distance, then restores the corresponding scroll position.

### Same-mode reset race

Resetting controller bookkeeping when src is unchanged can erase readiness after browser events have already fired. Same-mode selection is now idempotent.

## What is not verified

- Firefox runtime: unavailable.
- Safari runtime: unavailable.
- real iOS Safari: unavailable.
- real Android browser: unavailable.
- full CPU/memory/dropped-frame profiling: not performed.
- deployed-origin throttling/Range behavior: not performed because local top-level navigation is blocked in this environment.

## Production architecture

Use the lab model essentially as tested: existing projectScroll stays native; add a 125–135vh sticky scrub region; calculate normalized Y progress in rAF; keep X reveal independent; use two 720p/30fps H.264 yuv420p faststart no-audio derivatives with GOP 9; use currentTime + one-frame threshold + latest-target-only settling + seekable readiness retry; use requestVideoFrameCallback only for diagnostics; preserve the 0–.86 / .86–.92 / .92–1 film/hold/theme mapping unless visual integration gives a reason to tune it; retain opening/theme stills; keep reduced motion non-scrubbing; and reuse the existing AbortController/media teardown lifecycle.

Before production merge, run Safari desktop, real iOS Safari, Firefox desktop, preferably one Chromium Android device, and a throttled deployed origin. If Safari/iOS shows repeated >100–150 ms stalls, black frames or unstable reverse seeking with the tested short-GOP assets, do not try to solve media decode with ScrollTrigger. Use a frame-sequence fallback only for the failing browser class.

## Bottom line

The browser actually tested answers the core question positively: short-GOP H.264 makes the scroll interaction behave like advancing through the show rather than dragging a coarse source-video seek bar. The remaining risk is browser coverage, especially Safari/iOS, not the controller model.