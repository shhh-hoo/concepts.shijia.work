import asyncio
import json
import mimetypes
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://wss-lab.test/'


def build_html():
    html = (ROOT / 'index.html').read_text()
    css = (ROOT / 'scrub-lab.css').read_text()
    js = (ROOT / 'scrub-lab.js').read_text()
    return html.replace('<link rel="stylesheet" href="scrub-lab.css">', f'<base href="{BASE}"><style>{css}</style>').replace('<script src="scrub-lab.js"></script>', f'<script>{js}</script>')


class Router:
    def __init__(self, delay=False):
        self.delay = delay
        self.delayed = set()

    async def handle(self, route):
        rel = route.request.url[len(BASE):].split('?', 1)[0]
        path = (ROOT / rel).resolve()
        if not str(path).startswith(str(ROOT)) or not path.is_file():
            return await route.fulfill(status=404, body=b'')
        body = path.read_bytes()
        mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        if self.delay and path.suffix.lower() in {'.mp4', '.mov'} and rel not in self.delayed:
            self.delayed.add(rel)
            await asyncio.sleep(.55)
        headers = {'Content-Type': mime, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store'}
        rng = route.request.headers.get('range')
        if rng and rng.startswith('bytes='):
            lo, hi = rng[6:].split(',', 1)[0].split('-', 1)
            start = int(lo) if lo else 0
            end = min(int(hi) if hi else len(body) - 1, len(body) - 1)
            if start >= len(body):
                return await route.fulfill(status=416, headers={'Content-Range': f'bytes */{len(body)}'}, body=b'')
            chunk = body[start:end + 1]
            headers.update({'Content-Range': f'bytes {start}-{end}/{len(body)}', 'Content-Length': str(len(chunk))})
            return await route.fulfill(status=206, headers=headers, body=chunk)
        headers['Content-Length'] = str(len(body))
        return await route.fulfill(status=200, headers=headers, body=body)


async def page_for(browser, viewport=None, reduced='no-preference', touch=False, delay=False):
    context = await browser.new_context(viewport=viewport or {'width': 1280, 'height': 800}, reduced_motion=reduced, has_touch=touch, is_mobile=touch)
    page = await context.new_page()
    router = Router(delay)
    await page.route(BASE + '**', router.handle)
    await page.set_content(build_html(), wait_until='load')
    return context, page


async def wait_media(page):
    await page.wait_for_function("""() => { const s=window.__WSSScrubLab?.getState(); return s && s.wss.readyState >= 1 && s.wss2.readyState >= 1; }""", timeout=10000)


async def set_progress(page, value, settle=120):
    await page.evaluate('(p)=>window.__WSSScrubLab.setProgress(p)', value)
    if settle:
        await page.wait_for_timeout(settle)


async def settled(page, timeout=5000):
    await page.wait_for_function("""() => { const s=window.__WSSScrubLab.getState(); const ok=x=>!x.error&&!x.seeking&&Math.abs(x.current-x.target)<.055; return ok(s.wss)&&ok(s.wss2); }""", timeout=timeout)
    return await page.evaluate('window.__WSSScrubLab.getState()')


async def compare(browser):
    result = {}
    for mode in ['source', 'baseline', 'scrub']:
        context, page = await page_for(browser, {'width': 1440, 'height': 1000})
        await wait_media(page)
        await page.evaluate('(m)=>window.__WSSScrubLab.setMode(m)', mode)
        await wait_media(page)
        for p in [0, .105, .21, .315, .42, .525, .63, .735, .84]:
            await set_progress(page, p, 130)
        state = await settled(page)
        result[mode] = {'wss': state['wss'], 'wss2': state['wss2']}
        await context.close()
    return result


async def behavior(browser):
    context, page = await page_for(browser)
    await wait_media(page)
    for p in [0, .2, .4, .6, .84]:
        await set_progress(page, p, 70)
    forward = await settled(page)
    for p in [.75, .35, .78, .22, .66]:
        await set_progress(page, p, 18)
    reversal = await settled(page)
    await set_progress(page, .62, 60)
    p0 = (await page.evaluate('window.__WSSScrubLab.getState()'))['progress']
    await page.evaluate('window.__WSSScrubLab.setReveal(8)')
    await page.evaluate('window.__WSSScrubLab.setReveal(92)')
    reveal_state = await page.evaluate('window.__WSSScrubLab.getState()')
    assert abs(reveal_state['progress'] - p0) < .005
    await set_progress(page, 1, 80)
    theme = await settled(page)
    assert theme['wss']['phase'] == 'THEME' and theme['wss2']['phase'] == 'THEME'
    await set_progress(page, .5, 80)
    reverse = await settled(page)
    assert reverse['wss']['phase'] == 'FILM' and reverse['wss2']['phase'] == 'FILM'
    keep = reverse['progress']
    await page.set_viewport_size({'width': 1100, 'height': 720})
    await page.wait_for_timeout(100)
    resized = await page.evaluate('window.__WSSScrubLab.getState()')
    assert abs(resized['progress'] - keep) < .01
    await page.evaluate('window.__WSSScrubLab.destroy()')
    cleared = await page.eval_on_selector_all('video', 'vs=>vs.every(v=>!v.getAttribute("src"))')
    assert cleared
    await context.close()
    return {'forward': forward, 'reversal': reversal, 'reveal': reveal_state, 'theme': theme, 'reverse': reverse, 'resize': resized, 'destroyed': cleared}


async def reduced(browser):
    context, page = await page_for(browser, reduced='reduce')
    await wait_media(page)
    await set_progress(page, .7, 80)
    s = await page.evaluate('window.__WSSScrubLab.getState()')
    assert s['wss']['seeks'] == 0 and s['wss2']['seeks'] == 0
    await set_progress(page, 1, 50)
    s2 = await page.evaluate('window.__WSSScrubLab.getState()')
    await context.close()
    return s2


async def delayed(browser):
    context, page = await page_for(browser, delay=True)
    await set_progress(page, .58, 0)
    await wait_media(page)
    s = await settled(page, 7000)
    await context.close()
    return s


async def mobile_contract(browser):
    context, page = await page_for(browser, {'width': 390, 'height': 844}, touch=True)
    await wait_media(page)
    await set_progress(page, .5, 80)
    before = await page.evaluate('window.__WSSScrubLab.getState()')
    handle = page.locator('[data-reveal-handle]')
    box = await handle.bounding_box()
    await page.dispatch_event('[data-reveal-handle]', 'pointerdown', {'pointerId': 7, 'pointerType': 'touch', 'clientX': box['x'] + box['width']/2, 'clientY': box['y'] + 30})
    await page.dispatch_event('[data-reveal-handle]', 'pointermove', {'pointerId': 7, 'pointerType': 'touch', 'clientX': 330, 'clientY': box['y'] + 30})
    await page.dispatch_event('[data-reveal-handle]', 'pointerup', {'pointerId': 7, 'pointerType': 'touch', 'clientX': 330, 'clientY': box['y'] + 30})
    after = await page.evaluate('window.__WSSScrubLab.getState()')
    contract = await page.evaluate("""() => ({screen:getComputedStyle(document.querySelector('[data-reveal]')).touchAction, handle:getComputedStyle(document.querySelector('[data-reveal-handle]')).touchAction})""")
    assert abs(after['progress'] - before['progress']) < .005 and after['reveal'] != before['reveal']
    assert contract == {'screen': 'pan-y', 'handle': 'none'}
    await context.close()
    return {'before': before, 'after': after, 'touch_action': contract}


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--autoplay-policy=no-user-gesture-required'])
        report = {
            'browser': {'engine': 'Chromium', 'version': browser.version},
            'comparison': await compare(browser),
            'behavior': await behavior(browser),
            'reduced': await reduced(browser),
            'delayed': await delayed(browser),
            'mobile_contract': await mobile_contract(browser),
        }
        await browser.close()
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    asyncio.run(main())
