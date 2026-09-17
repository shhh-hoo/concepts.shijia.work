"""Integrated WSS checks. Offline = real-media layout/lifecycle only.
HTTP + --live = real routing AND the original cross-origin WSS2 application.
CI media fixtures are labelled explicitly; their screenshots are not visual proof.
"""
import argparse, asyncio, importlib.util, json, os
from pathlib import Path
from playwright.async_api import async_playwright, expect

async def run(args):
    root=Path(args.root).resolve();out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
    records=[];complete=False
    spec=importlib.util.spec_from_file_location('preview',root/'wss/tools/build_preview.py')
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    html=mod.inline_site(root,offline=True) if args.offline else None
    def passed(name): records.append({'check':name,'result':'PASS'});print('PASS',name,flush=True)
    async def load(page):
        if args.offline: await page.set_content(html,wait_until='load')
        else: await page.goto(args.base_url,wait_until='networkidle')
    async def enter(page,mobile):
        if mobile:
            await page.evaluate('window.scrollTo(0,320)')
            await page.wait_for_function('active===0 && scanWorld.classList.contains("show")')
            await page.touchscreen.tap(10,650)
        else:
            c=await page.evaluate('''()=>{let r=scene.getBoundingClientRect(),y=480,xs=boundaryXs(y);return{x:r.x+(xs[0]+xs[1])/2*r.width/1536,y:r.y+y*r.height/1024}}''')
            await page.mouse.click(c['x'],c['y'])
        await page.wait_for_function('state==="opened"')
        await page.wait_for_timeout(100)
    async def select_center(carousel):
        n=await carousel.evaluate('''el=>{const a=[...el.querySelectorAll('.carousel-item')],c=el.scrollLeft+el.clientWidth/2;let n=0;a.forEach((x,i)=>{if(Math.abs(x.offsetLeft+x.offsetWidth/2-c)<Math.abs(a[n].offsetLeft+a[n].offsetWidth/2-c))n=i});el.scrollLeft=a[n].offsetLeft+a[n].offsetWidth/2-el.clientWidth/2;return n}''')
        await carousel.locator('.arched-card').nth(n).click()
    async def live_round(page,label):
        f=page.frame_locator('.wss-live iframe')
        await f.locator('#start-btn:not(.pointer-events-none)').wait_for(timeout=45000)
        await f.locator('#start-btn').click()
        await f.locator('#view-gathering.active, #view-selection.active').wait_for(timeout=15000)
        for _ in range(16):
            if await f.locator('#view-gathering.active').count()==0: break
            await select_center(f.locator('#gatherCarousel'));await page.wait_for_timeout(1150)
        await f.locator('#view-selection.active').wait_for(timeout=15000)
        await select_center(f.locator('#selectCarousel'))
        await f.locator('#view-quiz.active').wait_for(timeout=10000)
        await page.screenshot(path=str(out/f'{label}-real-app-question.png'))
        await f.locator('#quiz-options button').first.click()
        await expect(f.locator('#feedback-msg')).not_to_be_empty()
        await f.locator('[data-action="backToSelection"]').click()
        await f.locator('#view-selection.active').wait_for()
        passed(f'{label}: real original app completes gather → shuffle → question → feedback → selection')
    async with async_playwright() as p:
        options={'headless':True}
        if os.environ.get('CHROMIUM_PATH'): options['executable_path']=os.environ['CHROMIUM_PATH']
        browser=await p.chromium.launch(**options)
        try:
            for label,w,h in [('desktop',1440,960),('phone',390,844)]:
                mobile=w<700
                context=await browser.new_context(viewport={'width':w,'height':h},has_touch=mobile)
                page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
                await load(page)
                assert await page.locator('video,iframe').count()==0
                passed(f'{label}: no project media or embedded app on index')
                if mobile:
                    geometry=await page.locator('.mobile-project[data-project="0"]').evaluate('(e)=>e.getBoundingClientRect().top+scrollY')
                await enter(page,mobile)
                passed(f'{label}: actual index interaction opens WSS (phone tap outside scan)')
                b=await page.locator('#projectWorld').bounding_box()
                assert abs(b['width']-w)<1 and abs(b['height']-h)<1 and abs(b['x'])<1 and abs(b['y'])<1,b
                assert await page.evaluate('projectScroll.scrollWidth<=projectScroll.clientWidth+1')
                assert await page.locator('.wss-story').count()==1 and await page.locator('video').count()==3
                passed(f'{label}: full viewport, no horizontal overflow, one content owner')
                intro=page.locator('[data-film="wss-intro"] video');teaser=page.locator('[data-film="wss2-teaser"] video')
                invitation=page.locator('[data-film="wss2-invitation"] video')
                await page.wait_for_function('document.querySelector("[data-film=wss-intro] video").readyState>=2')
                assert await intro.evaluate('(v)=>v.muted&&!v.paused&&v.loop&&Math.abs(v.duration-8.6)<.2')
                assert await teaser.get_attribute('src') is None and await invitation.get_attribute('src') is None
                passed(f'{label}: trimmed opening muted; other films and original web deferred')
                await page.locator('[data-film="wss-intro"] [data-toggle]').click()
                assert await intro.evaluate('(v)=>v.paused')
                initial_url=page.url
                await page.locator('.wss-chapter-links [data-jump="wss-edition-two"]').click();await page.wait_for_timeout(900)
                await page.wait_for_function('!document.querySelector("[data-film=wss2-teaser] video").paused')
                await page.locator('[data-film="wss2-teaser"] [data-sound]').click()
                await expect(page.locator('[data-film="wss2-teaser"] [data-sound]')).to_have_attribute('aria-pressed','true')
                # Exercise natural completion, not server-dependent HTTP seeking.
                await page.wait_for_function('document.querySelector("[data-film=wss2-teaser] video").readyState>=2')
                assert await teaser.evaluate('(v)=>!v.loop&&Math.abs(v.duration-13.034)<.2')
                await page.wait_for_function('document.querySelector("[data-film=wss2-teaser] video").ended',timeout=20000)
                await expect(page.locator('[data-film="wss2-teaser"] [data-toggle]')).to_have_text('REPLAY FILM')
                passed(f'{label}: complete teaser, explicit sound, event-driven controls and finite playback')
                await page.locator('[data-film="wss2-invitation"] [data-toggle]').click()
                await page.wait_for_function('!document.querySelector("[data-film=wss2-invitation] video").paused')
                passed(f'{label}: signup film is user initiated')
                await page.locator('.wss-chapter-links [data-jump="wss-interaction"]').click();await page.wait_for_timeout(900)
                assert page.url==initial_url and await invitation.evaluate('(v)=>v.paused')
                assert await page.locator('iframe').count()==0
                passed(f'{label}: chapter navigation preserves route and pauses offscreen films')
                await page.locator('[data-web-start]').click()
                frame=page.locator('.wss-live iframe')
                assert await frame.count()==1
                assert await frame.get_attribute('src')=='https://shhh-hoo.github.io/WSS2/wss2.html'
                assert "camera 'none'" in await frame.get_attribute('allow')
                passed(f'{label}: deliberate activation mounts original URL without camera/mic permission')
                if args.live: await live_round(page,label)
                if not mobile: await page.locator('[data-web-expand]').click()
                await expect(page.locator('.wss-live')).to_have_class('wss-live is-active is-expanded')
                box=await page.locator('.wss-live').bounding_box()
                assert abs(box['height']-h)<1 and abs(box['width']-w)<1,box
                passed(f'{label}: original web expands to native viewport, not a scaled desktop mockup')
                await page.locator('[data-web-close]').focus();await page.keyboard.press('Escape')
                assert await page.locator('iframe').count()==0 and await page.evaluate('state==="opened"')
                assert await page.locator('#projectScroll').evaluate('(e)=>e.style.overflow')==''
                passed(f'{label}: parent Escape closes only the embedded interaction and releases frame')
                await page.locator('[data-web-entry="landing"]').click()
                assert await frame.get_attribute('src')=='https://shhh-hoo.github.io/WSS2/'
                if args.live:
                    await page.frame_locator('.wss-live iframe').locator('#enterBtn').wait_for(timeout=45000)
                    passed(f'{label}: the actual original landing page also loads within the composition')
                await page.locator('[data-web-close]').click()
                await page.locator('.wss-bar [data-return]').click();await page.wait_for_function('state==="index"');await page.wait_for_timeout(100)
                assert await page.locator('video,iframe').count()==0
                assert not await page.evaluate('scene.classList.contains("wss-scene")')
                if mobile:
                    assert abs(await page.evaluate('scrollY')-320)<2
                    now=await page.locator('.mobile-project[data-project="0"]').evaluate('(e)=>e.getBoundingClientRect().top+scrollY')
                    assert abs(now-geometry)<1
                    await page.wait_for_timeout(1700);assert await page.evaluate('state==="index"')
                passed(f'{label}: return releases all media and preserves index position/geometry')
                for _ in range(2):
                    await enter(page,mobile);assert await page.locator('video').count()==3
                    await page.locator('.wss-bar [data-return]').click();await page.wait_for_function('state==="index"')
                    assert await page.locator('video,iframe').count()==0
                passed(f'{label}: repeated visits do not accumulate media players or frames')
                if not args.offline:
                    await enter(page,mobile);await page.go_back();await page.wait_for_function('state==="index"')
                    await page.go_forward();await page.wait_for_function('state==="opened"')
                    await page.reload();await page.wait_for_function('state==="opened"')
                    await page.locator('.wss-bar [data-return]').click();await page.wait_for_function('state==="index"')
                    passed(f'{label}: genuine browser Back, Forward, direct reload and return')
                assert not errors,errors
                passed(f'{label}: no uncaught JavaScript errors')
                await context.close()
            page=await browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce',has_touch=True)
            await load(page);await enter(page,True)
            assert await page.evaluate('[...document.querySelectorAll("video")].every(v=>v.paused&&!v.getAttribute("src"))')
            await page.locator('.wss-chapter-links [data-jump="wss-edition-two"]').click();await page.wait_for_timeout(100)
            assert await page.evaluate('[...document.querySelectorAll("video")].every(v=>v.paused&&!v.getAttribute("src"))')
            await page.locator('[data-film="wss2-teaser"] [data-toggle]').click()
            await page.wait_for_function('!document.querySelector("[data-film=wss2-teaser] video").paused')
            passed('Reduced motion: static posters, no automatic media loads, explicit play works')
            await page.close();complete=True
        finally:
            await browser.close()
            report={'completed':complete,'mode':'offline real publication media' if args.offline else 'HTTP integrated site',
              'original_app_live_tested':any('real original app completes' in r['check'] for r in records),'real_origin_history_tested':any('genuine browser' in r['check'] for r in records),
              'media':'actual publication files' if args.offline else os.environ.get('WSS_TEST_MEDIA','actual publication files'),
              'checks':records,'count':len(records)}
            (out/'report.json').write_text(json.dumps(report,indent=2))

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('--root',default='.');a.add_argument('--output',default='/tmp/wss-qa');a.add_argument('--offline',action='store_true');a.add_argument('--live',action='store_true');a.add_argument('--base-url',default='http://127.0.0.1:8765/');args=a.parse_args()
    if args.offline and args.live:a.error('Live network checks cannot be labelled offline')
    asyncio.run(run(args))
