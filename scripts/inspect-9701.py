"""Read-only browser evidence for the pinned 9701 exhibit source."""
import functools
import http.server
import json
import pathlib
import threading
from playwright.sync_api import sync_playwright

root = pathlib.Path.cwd()
out = root / 'evidence'
out.mkdir(exist_ok=True)
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
urls = {
    'home': '/student/', 'as': '/student/as/', 'a2': '/student/a2/',
    'hub': '/student/interactive/',
    'paths': '/student/interactive/9701-as-organic-paths/',
    'memory': '/student/interactive/9701-memorisation-bank/',
    'document': '/student/document.html?doc=chemistry%2F9701-equation-bank-as-alcohols-carbonyls',
}
report = {}
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width':1440, 'height':1000}, color_scheme='light')
    for key, url in urls.items():
        errors = []
        def error_listener(error): errors.append(str(error))
        page.on('pageerror', error_listener)
        page.goto('http://127.0.0.1:8765' + url)
        page.wait_for_timeout(1000)
        page.screenshot(path=str(out / (key + '.png')))
        report[key] = {
            'errors': list(errors), 'title':page.title(),
            'text':page.locator('body').inner_text()[:10000],
            'regions':page.locator('header, main, .layout, #library-panel, #session-setup, #practice-shell').evaluate_all('(els)=>els.map(e=>({id:e.id,cls:e.className,y:e.getBoundingClientRect().top,h:e.getBoundingClientRect().height}))'),
        }
        if key == 'paths':
            page.locator('.organic-paths-app').scroll_into_view_if_needed()
            page.screenshot(path=str(out / 'paths-tool.png'))
            page.locator('#graphBtn').click()
            report[key]['graph_activated'] = page.locator('#graphBtn').get_attribute('class')
        if key == 'memory':
            page.locator('#session-start').click()
            page.wait_for_timeout(300)
            page.locator('#practice-shell').scroll_into_view_if_needed()
            page.screenshot(path=str(out / 'memory-practice.png'))
            report[key]['practice_text'] = page.locator('#practice-shell').inner_text()[:5000]
            report[key]['practice_visible'] = page.locator('#practice-shell').is_visible()
        page.remove_listener('pageerror', error_listener)
    try:
        response = page.goto('https://9701.shijia.work/',timeout=15000)
        report['production'] = {'status':response.status,'headers':response.all_headers(),'url':page.url}
        page.screenshot(path=str(out / 'production.png'))
    except Exception as exc:
        report['production'] = {'error':str(exc)}
    browser.close()
server.shutdown()
(out / 'source-inspection.json').write_text(json.dumps(report,indent=2))
