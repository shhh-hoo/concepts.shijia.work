"""WSS content regression checks. Full HTTP mode exercises real browser history.

Offline mode inlines the actual local publication media and uses set_content;
it explicitly skips real-origin history checks. No mocked browser history.
Run: python wss/tests/browser_checks.py --offline --root . --output /tmp/wss-qa
     python wss/tests/browser_checks.py --base-url http://127.0.0.1:8765
"""
import argparse
import asyncio
import base64
import hashlib
import json
import os
from pathlib import Path
import re

from playwright.async_api import async_playwright


def inline_site(root: Path, *, offline: bool = False) -> str:
    html = (root / 'index.html').read_text()
    for path in re.findall(r'<link rel="stylesheet" href="([^"]+)"\s*/?>', html):
        html = re.sub(r'<link rel="stylesheet" href="' + re.escape(path) + r'"\s*/?>',
                      lambda _: '<style>' + (root / path).read_text() + '</style>', html)
    assets = {}
    for path in (root / 'wss/media').iterdir():
        if path.suffix in ('.webp', '.mp4'):
            mime = 'video/mp4' if path.suffix == '.mp4' else 'image/webp'
            assets[path.name] = 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()
    html = html.replace('<script src="data.js"></script>',
                        '<script>window.WSS_ASSET_MAP=' + json.dumps(assets) + '</script><script src="data.js"></script>')
    if offline:
        html = html.replace('<script src="navigation.js"></script>', '')
    for path in re.findall(r'<script src="([^"]+)"></script>', html):
        html = html.replace(f'<script src="{path}"></script>',
                            '<script data-media-base="https://offline.invalid/wss/media/">' +
                            (root / path).read_text().replace('</script>', '<\\/script>') + '</script>')
    return html


async def run(args):
    root = Path(args.root).resolve()
    output = Path(args.output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    records = []
    html = inline_site(root, offline=True) if args.offline else None
    def passed(name):
        print('PASS', name, flush=True)
        records.append({'check': name, 'result': 'PASS'})

    async with async_playwright() as p:
        options = {'headless': True}
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = await p.chromium.launch(**options)
        try:
            for label, width, height in [('desktop', 1440, 1000), ('phone', 390, 844)]:
                page = await browser.new_page(viewport={'width': width, 'height': height})
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                if args.offline:
                    await page.set_content(html, wait_until='load')
                else:
                    await page.goto(args.base_url, wait_until='networkidle')
                await page.wait_for_timeout(100)
                baseline = await page.screenshot()
                assert await page.locator('video').count() == 0
                passed(f'{label}: no media players on the index')
                # Use the actual pointer hit region in the existing diagonal index.
                coords = await page.evaluate('''() => { const r=scene.getBoundingClientRect();
                    const y=480, xs=boundaryXs(y); return {x:r.x+(xs[0]+xs[1])/2*r.width/1536,y:r.y+y*r.height/1024}; }''')
                await page.mouse.move(coords['x'], coords['y'])
                await page.mouse.click(coords['x'], coords['y'])
                await page.wait_for_function('state === "opened"')
                await page.wait_for_timeout(350)
                assert await page.locator('.wss-story').count() == 1
                assert await page.locator('video').count() == 3
                passed(f'{label}: existing index hit region opens the integrated page')
                bounds = await page.evaluate('''() => { const r=projectWorld.getBoundingClientRect();
                    return {x:r.x,y:r.y,w:r.width,h:r.height,overflow:projectScroll.scrollWidth-projectScroll.clientWidth}; }''')
                assert abs(bounds['x']) < 1 and abs(bounds['y']) < 1, bounds
                assert abs(bounds['w'] - width) < 1 and abs(bounds['h'] - height) < 1, bounds
                assert bounds['overflow'] <= 1, bounds
                assert await page.evaluate('document.elementFromPoint(innerWidth-10,80).closest(".wss-story") !== null')
                passed(f'{label}: native viewport layout, no overflow or leftover diagonal panel')
                intro = page.locator('[data-film="wss-intro"] video')
                teaser = page.locator('[data-film="wss2-teaser"] video')
                invitation = page.locator('[data-film="wss2-invitation"] video')
                await page.wait_for_function('document.querySelector("[data-film=wss-intro] video").readyState >= 2')
                assert await intro.evaluate('(v)=>!v.paused && v.muted && v.loop && Math.abs(v.duration-8.6)<.2')
                assert await teaser.get_attribute('src') is None
                assert await invitation.get_attribute('src') is None
                passed(f'{label}: trimmed opening plays muted; secondary films remain unloaded')
                await page.screenshot(path=str(output / f'{label}-opening.png'))
                await page.locator('[data-film="wss-intro"] [data-toggle]').click()
                assert await intro.evaluate('(v)=>v.paused')
                await page.locator('[data-jump="wss-edition-two"]').click()
                await page.wait_for_timeout(1100)
                assert await page.locator('[data-jump="wss-edition-two"]').get_attribute('aria-current') == 'true'
                await teaser.scroll_into_view_if_needed()
                await page.wait_for_function('!document.querySelector("[data-film=wss2-teaser] video").paused')
                assert await intro.evaluate('(v)=>v.paused')
                assert await teaser.evaluate('(v)=>!v.loop && Math.abs(v.duration-13.034)<.2')
                passed(f'{label}: chapter jump selects the complete teaser and pauses the first film')
                if not args.offline:
                    assert page.url.endswith('#wss')
                    passed(f'{label}: chapter scrolling does not add a new route')
                await page.locator('[data-film="wss2-teaser"] [data-sound]').click()
                assert await teaser.evaluate('(v)=>!v.muted')
                assert await page.locator('[data-film="wss2-teaser"] [data-sound]').get_attribute('aria-pressed') == 'true'
                passed(f'{label}: explicit sound control updates playback and accessible state')
                await teaser.evaluate('(v)=>{v.currentTime=v.duration-.12}')
                await page.wait_for_function('document.querySelector("[data-film=wss2-teaser] video").ended')
                assert await page.locator('[data-film="wss2-teaser"] [data-toggle]').inner_text() == 'REPLAY FILM'
                await page.locator('[data-film="wss2-teaser"] [data-toggle]').click()
                assert await teaser.evaluate('(v)=>!v.paused && v.currentTime<2')
                passed(f'{label}: teaser ends once and can replay')
                await page.locator('[data-film="wss2-invitation"] [data-toggle]').scroll_into_view_if_needed()
                await page.wait_for_timeout(250)
                assert await invitation.get_attribute('src') is None
                assert await teaser.evaluate('(v)=>v.paused')
                await page.locator('[data-film="wss2-invitation"] [data-toggle]').click()
                await page.wait_for_function('document.querySelector("[data-film=wss2-invitation] video").readyState >= 2')
                assert await invitation.evaluate('(v)=>!v.paused && Math.abs(v.duration-49.216)<.2')
                passed(f'{label}: full signup film loads only on request; offscreen teaser pauses')
                await page.locator('[data-jump="wss-edition-one"]').click()
                await page.wait_for_timeout(1100)
                assert await intro.evaluate('(v)=>v.paused')
                assert await invitation.evaluate('(v)=>v.paused')
                passed(f'{label}: manual pause is respected after scrolling away and back')
                await page.set_viewport_size({'width':height,'height':width})
                await page.wait_for_timeout(350)
                await page.set_viewport_size({'width':width,'height':height})
                await page.wait_for_timeout(350)
                assert await page.evaluate('Math.abs(projectWorld.getBoundingClientRect().height-innerHeight)<1')
                assert await page.evaluate('document.elementFromPoint(innerWidth-10,80).closest(".wss-story") !== null')
                passed(f'{label}: portrait/landscape rotation preserves viewport fit')
                await page.keyboard.press('Escape')
                await page.wait_for_function('state === "index"')
                await page.mouse.move(1, 1)
                await page.wait_for_timeout(250)
                assert await page.locator('video').count() == 0
                assert not await page.evaluate('scene.classList.contains("wss-scene")')
                assert not await page.evaluate('projectWorld.classList.contains("wss-world")')
                restored = await page.screenshot()
                assert hashlib.sha256(baseline).hexdigest() == hashlib.sha256(restored).hexdigest(), 'Index pixel regression'
                passed(f'{label}: Escape removes players/listeners and returns a pixel-identical index')
                for _ in range(3):
                    await page.evaluate('active=0;openProject()')
                    await page.wait_for_function('state === "opened"')
                    assert await page.locator('video').count() == 3
                    await page.locator('.wss-bar [data-return]').click()
                    await page.wait_for_function('state === "index"')
                    assert await page.locator('video').count() == 0
                passed(f'{label}: repeated open/close does not accumulate players')
                assert not errors, errors
                passed(f'{label}: no JavaScript errors')
                await page.close()

            page = await browser.new_page(viewport={'width':390,'height':844}, reduced_motion='reduce')
            if args.offline:
                await page.set_content(html, wait_until='load')
                await page.evaluate('active=0;openProject()')
            else:
                await page.goto(args.base_url + '#wss')
            await page.wait_for_function('state === "opened"')
            await page.wait_for_timeout(250)
            assert await page.evaluate('[...document.querySelectorAll("video")].every(v=>v.paused&&!v.getAttribute("src"))')
            await page.locator('[data-jump="wss-edition-two"]').click()
            await page.wait_for_timeout(250)
            assert await page.evaluate('[...document.querySelectorAll("video")].every(v=>v.paused&&!v.getAttribute("src"))')
            passed('Reduced motion: both editions show static posters without auto-loading video')
            await page.locator('[data-film="wss2-teaser"] [data-toggle]').click()
            await page.wait_for_function('!document.querySelector("[data-film=wss2-teaser] video").paused')
            passed('Reduced motion: explicit play remains available')
            await page.close()

            if not args.offline:
                page = await browser.new_page(viewport={'width':1440,'height':1000})
                await page.goto(args.base_url)
                await page.evaluate('active=0;openProject()')
                await page.wait_for_function('state === "opened"')
                await page.go_back()
                await page.wait_for_function('state === "index"')
                assert await page.locator('video').count() == 0
                await page.go_forward()
                await page.wait_for_function('state === "opened"')
                assert await page.locator('video').count() == 3
                passed('HTTP: real browser Back / Forward route restoration')
                await page.reload()
                await page.wait_for_function('state === "opened"')
                await page.locator('.wss-bar [data-return]').click()
                await page.wait_for_function('state === "index"')
                passed('HTTP: direct #wss reload and index return')
                await page.close()
        finally:
            await browser.close()
            report = {'mode': 'offline actual publication media' if args.offline else 'HTTP browser',
                      'real_origin_history_tested': not args.offline,
                      'media': 'actual publication bundle' if args.offline else os.environ.get('WSS_TEST_MEDIA','local publication files'),
                      'checks': records, 'count': len(records)}
            (output / 'report.json').write_text(json.dumps(report, indent=2))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', default='.')
    parser.add_argument('--output', default='/tmp/wss-qa')
    parser.add_argument('--offline', action='store_true')
    parser.add_argument('--base-url', default='http://127.0.0.1:8765/')
    asyncio.run(run(parser.parse_args()))
