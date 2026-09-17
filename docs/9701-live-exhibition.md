# 9701 / a working collection

This replaces the rejected PR #7 direction. The portfolio supplies a changing margin; the product supplies all of the interface. `student-site` is not modified.

## Spatial exploration and choice

Five compositions were explored with captures of the original product: an aperture, a near-full-frame takeover, an unequal contact sheet, a continuous reading window, and layered interface fragments. The contact sheet and fragments made the collection harder to read and would multiply embedded browsing contexts. A pure takeover offered little pacing; a permanently narrow aperture concealed too much of the product. The continuous reading window was selected: an offset opening, a readable library view, a broad map, then a more intimate practice surface. The final viewport recedes without a separate marketing CTA panel. ORGANISE / CONNECT / REHEARSE are camera states in one continuous composition, not three repeated case-study sections.

## Actual material

The production prototype embeds the real HTTPS product directly:

- `https://9701.shijia.work/?theme=light#homepage-hero-root`
- `/as/?theme=light#stage-hero-root`
- `/a2/?theme=light#stage-hero-root`
- `/interactive/9701-as-organic-paths/?theme=light#diagramBtn`
- `/interactive/9701-memorisation-bank/?theme=light#session-setup`

The source-inspection workflow also reads the interactive hub and an actual chemistry document. It checks the pinned `student-site` source at `bb75ae2dd7d349b1472188e538010109374c3c48`, and separately inspects the deployed product. Live iframe content can change independently of this portfolio commit. There is no fake reaction map, practice checker, recolouring, or screenshot substitution in the delivered runtime.

## Interaction contract

During exhibition scrolling, the visible iframe is inert and an explicit entry button owns pointer interaction. The same iframe enters a native top-layer dialog for use: full-size responsive content, no scaled reading controls and no reparent/reload on entry. A persistent Back to exhibition control returns to the same portfolio scroll position. The external Open separately link remains available.

Escape closes reading mode while focus is in the exhibition toolbar. Do not claim that the parent receives key events from the cross-origin product: after focus enters the iframe, the visible return button is the supported universal exit. Internal product navigation retains normal browser history semantics. Desktop direct-hash loads retain the existing navigation controller's behaviour: the Index button returns within the site, while browser Back may return to the previous external page. Normal index-to-project entry supports browser Back/Forward. Mobile direct hashes retain the existing synthetic index history entry.

No production cross-origin DOM reads, security-header changes, reverse proxy, copied product runtime, or undocumented embed query mode are needed. Loading completion is not treated as a cross-origin success assertion; automated tests inspect the real rendered child through browser automation instead.

## Integration and performance

`project-9701.js` wraps only the 9701 renderer. `project-9701.css` scopes the exhibition. `index.html` adds one stylesheet and one script before the mobile controllers. Shared desktop/mobile controllers are unchanged. At most two iframe contexts exist; leaving the project disconnects observers, aborts component listeners, cancels animation frames and removes the iframe contexts. Scroll updates are requestAnimationFrame-coalesced, with no perpetual animation loop. Reduced-motion mode removes transitions and steps between camera poses.

## Review and verification

`9701.html` is a standalone review entry. CI builds `9701-live-exhibition.html` with the exhibition CSS/JS inlined; it still requires internet access for the live product. The upload artifact contains exact preview source, browser screenshots, original-product inspection and JSON check results.

Reproduce from a parent directory containing `concepts/` and `student/`, as the workflow does:

```sh
python -m pip install playwright==1.55.0
python -m playwright install chromium
python concepts/scripts/inspect-9701.py
python concepts/scripts/test-9701.py
```

The workflow packages `preview/concepts/` before running the second command. Tests cover 1536x1024 and 390x844, direct hashes, physical index entry, Back/Forward, route choices, real map switching, real practice input/check/reveal, reading-mode return, scoped cleanup, another project, 320/768-pixel reduced-motion views, actual production-origin embedding, and the one-file HTML entry. Consult the run's `exhibition-tests.json` for results; the presence of a test is not a claim that it passed. Browser coverage is Chromium desktop and touch emulation, not physical-device Safari or Firefox certification.

No production merge or deployment is performed by this branch's workflow.
