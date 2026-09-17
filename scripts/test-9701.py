"""Real Chromium checks. No route interception or screenshot replacement."""
import functools
import http.server
import json
import pathlib
import threading
from playwright.sync_api import sync_playwright, expect

root = pathlib.Path.cwd()
out = root / 'evidence'
out.mkdir(exist_ok=True)
server = http.server.ThreadingHTTPServer(('127.0.0.1',8766),functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report=[]
base='http://127.0.0.1:8766/preview/concepts/'

def passed(name,**details):
    report.append({'test':name,'result':'pass',**details})

def pose(page,p):
    page.evaluate('(p)=>{const h=document.getElementById("projectScroll");h.scrollTop=p*h.clientHeight/(matchMedia("(max-width:699px)").matches?1.25:1);}',p)
    page.wait_for_timeout(300)

with sync_playwright() as p:
    browser=p.chromium.launch()
    for label,width,height in [('desktop',1536,1024),('mobile',390,844)]:
        context=browser.new_context(viewport={'width':width,'height':height},has_touch=label=='mobile',is_mobile=label=='mobile',color_scheme='light')
        page=context.new_page()
        page.set_default_timeout(18000)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        try:
            page.goto(base+'index.html#9701')
            page.wait_for_selector('#scene.opened')
            page.frame_locator('.atlas-current iframe').locator('#homepage-hero-title').wait_for()
            page.wait_for_timeout(400)
            assert page.locator('.atlas9701').count()==1
            passed(label+'/direct-hash')
            page.screenshot(path=str(out/(label+'-cover.png')))
            if label=='mobile':
                intro=page.locator('.atlas-intro').bounding_box()
                aperture=page.locator('.atlas-current .atlas-viewport').bounding_box()
                assert intro['y']+intro['height']<aperture['y']
                passed('mobile/cover-copy-not-obscured')
            for key,position in [('organise',.95),('connect',2.15),('rehearse',3.85),('finish',5)]:
                pose(page,position)
                selector='#diagramSvg' if key=='connect' else '#session-setup' if key in ['rehearse','finish'] else '#homepage-hero-title'
                child=page.frame_locator('.atlas-current iframe')
                child.locator(selector).wait_for(state='attached')
                if key in ['rehearse','finish']:
                    expect(child.locator('#session-start')).to_be_enabled(timeout=18000)
                    expect(child.locator('#current-set-summary')).not_to_contain_text('Loading',timeout=18000)
                page.wait_for_timeout(600)
                page.screenshot(path=str(out/(label+'-'+key+'.png')))
                assert page.locator('.atlas9701 iframe').count()<=2
                passed(label+'/'+key+'-render',frames=page.locator('.atlas9701 iframe').count())
            # Direct desktop hashes intentionally retain the site's original browser
            # history semantics. Its visible Index action returns within the site.
            page.locator('#backBtn').click()
            page.wait_for_function('!document.getElementById("scene").classList.contains("opened")')
            page.wait_for_timeout(1350)
            assert page.locator('.atlas9701 iframe').count()==0
            passed(label+'/direct-hash-index-button-cleanup')
            # Enter from the index through physical pointer/touch, not global calls.
            if label=='desktop':
                box=page.locator('#scene').bounding_box()
                x=box['x']+box['width']*.93
                y=box['y']+box['height']*.85
                page.mouse.move(x,y)
                page.mouse.click(x,y)
            else:
                page.locator('.mobile-project').nth(5).evaluate('(e)=>window.scrollTo(0,e.offsetTop-100)')
                page.wait_for_timeout(400)
                page.touchscreen.tap(330,650)
            page.wait_for_selector('#scene.opened')
            assert page.url.endswith('#9701')
            passed(label+'/physical-index-entry')
            page.go_back()
            page.wait_for_function('!document.getElementById("scene").classList.contains("opened")')
            page.wait_for_timeout(1350)
            assert page.locator('.atlas9701 iframe').count()==0
            passed(label+'/browser-back-and-cleanup')
            page.go_forward()
            page.wait_for_selector('#scene.opened')
            passed(label+'/browser-forward')
            page.locator('button[data-chapter="0"]').click()
            page.wait_for_timeout(1100)
            for route in ['as','a2','home']:
                page.locator('[data-route="'+route+'"]').click()
                page.frame_locator('.atlas-current iframe').locator('h1').wait_for()
                page.wait_for_timeout(250)
                passed(label+'/route-'+route)
            page.locator('button[data-chapter="1"]').click()
            page.wait_for_timeout(1100)
            frame=page.frame_locator('.atlas-current iframe')
            frame.locator('#graphBtn').wait_for(state='attached')
            before=page.locator('#projectScroll').evaluate('(e)=>e.scrollTop')
            page.locator('.atlas-current .atlas-enter').click()
            page.wait_for_selector('dialog.atlas-is-live:modal')
            frame.locator('#graphBtn').click()
            assert 'active' in (frame.locator('#graphBtn').get_attribute('class') or '')
            page.screenshot(path=str(out/(label+'-map-live.png')))
            passed(label+'/real-map-interaction')
            # Child-origin key events do not bubble to the parent. The visible
            # return control is the universal exit; Escape is only promised when
            # focus is in the exhibition/toolbar, not inside the remote product.
            page.locator('.atlas-is-live .atlas-leave').click()
            page.wait_for_function('!document.querySelector("dialog.atlas-is-live")')
            assert page.locator('#scene.opened').count()==1
            assert abs(page.locator('#projectScroll').evaluate('(e)=>e.scrollTop')-before)<2
            passed(label+'/return-control-restores-scroll')
            page.locator('.atlas-current .atlas-enter').click()
            page.locator('.atlas-is-live .atlas-leave').focus()
            page.keyboard.press('Escape')
            page.wait_for_function('!document.querySelector("dialog.atlas-is-live")')
            assert page.locator('#scene.opened').count()==1
            passed(label+'/toolbar-escape-does-not-exit-project')
            page.locator('button[data-chapter="2"]').click()
            page.wait_for_timeout(1100)
            frame=page.frame_locator('.atlas-current iframe')
            frame.locator('#session-start').wait_for(state='attached')
            page.locator('.atlas-current .atlas-enter').click()
            page.wait_for_selector('dialog.atlas-is-live:modal')
            frame.locator('#session-start').click()
            frame.locator('#practice-shell').wait_for(state='visible')
            frame.locator('#practice-shell textarea').first.fill('a deliberately incomplete answer')
            frame.locator('#check-blank').click()
            frame.locator('#reveal-blank').click()
            page.wait_for_timeout(300)
            page.screenshot(path=str(out/(label+'-practice-live.png')))
            passed(label+'/real-practice-check-and-reveal')
            page.locator('.atlas-is-live .atlas-leave').click()
            assert not errors,str(errors)
            passed(label+'/no-page-errors')
            page.locator('#backBtn').click()
            page.wait_for_timeout(1500)
            assert page.locator('.atlas9701 iframe').count()==0
            passed(label+'/button-exit-cleanup')
            page.goto(base+'index.html#cuelayer')
            page.wait_for_selector('#scene.opened')
            assert page.locator('.world-cuelayer').count()==1
            assert page.locator('.atlas9701-host').count()==0
            passed(label+'/other-project-unaffected')
        except Exception as exc:
            report.append({'test':label+'/flow','result':'FAIL','error':str(exc),'page_errors':errors})
            page.screenshot(path=str(out/(label+'-failure.png')))
        context.close()
    for width,height in [(320,568),(768,1024)]:
        page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
        try:
            page.goto(base+'index.html#9701')
            page.wait_for_selector('#scene.opened')
            page.frame_locator('.atlas-current iframe').locator('#homepage-hero-title').wait_for()
            page.screenshot(path=str(out/(str(width)+'-reduced-cover.png')))
            page.locator('button[data-chapter="1"]').click()
            page.frame_locator('.atlas-current iframe').locator('#diagramSvg').wait_for(state='attached')
            page.locator('.atlas-current .atlas-enter').click()
            page.wait_for_selector('dialog.atlas-is-live:modal')
            rect=page.locator('dialog.atlas-is-live').bounding_box()
            assert rect['x']>=0 and rect['x']+rect['width']<=width+1
            page.locator('.atlas-is-live .atlas-leave').click()
            passed(str(width)+'/reduced-motion-and-live-fit')
        except Exception as exc:
            report.append({'test':str(width)+'/edge','result':'FAIL','error':str(exc)})
        page.close()
    page=browser.new_page(viewport={'width':1440,'height':1000})
    try:
        page.goto('https://concepts.shijia.work/',timeout=20000)
        page.evaluate('''()=>{const f=document.createElement('iframe');f.id='real-embed-probe';f.src='https://9701.shijia.work/interactive/9701-as-organic-paths/?theme=light#diagramBtn';f.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:99999;background:white';document.body.append(f);}''')
        child=page.frame_locator('#real-embed-probe')
        child.locator('#graphBtn').click()
        assert 'active' in (child.locator('#graphBtn').get_attribute('class') or '')
        passed('production-origin/iframe-and-pointer-interaction')
    except Exception as exc:
        report.append({'test':'production-origin/iframe','result':'FAIL','error':str(exc)})
    try:
        page.goto((root/'preview/9701-live-exhibition.html').as_uri())
        page.frame_locator('.atlas-current iframe').locator('#homepage-hero-title').wait_for()
        page.locator('.atlas-current .atlas-enter').click()
        page.wait_for_selector('dialog.atlas-is-live:modal')
        page.locator('.atlas-is-live .atlas-leave').click()
        passed('standalone/local-html-with-live-remote-content')
    except Exception as exc:
        report.append({'test':'standalone/file','result':'FAIL','error':str(exc)})
    browser.close()
server.shutdown()
(out/'exhibition-tests.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
assert all(r['result']=='pass' for r in report),'See exhibition-tests.json and failure screenshots.'
