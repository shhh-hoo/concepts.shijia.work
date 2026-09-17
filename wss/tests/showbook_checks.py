"""Showbook composition/embed tests. --live checks the real deployed WSS2.
Offline mode tests only the parent controller, never claims the remote app ran.
"""
import argparse, asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright, expect
from browser_checks import inline_site

async def run(args):
    root=Path(args.root).resolve();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    records=[];completed=False
    def ok(text):
        records.append(text);print('PASS',text,flush=True)
    async with async_playwright() as p:
        options={'headless':True}
        if os.environ.get('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
        browser=await p.chromium.launch(**options)
        try:
            for label,width,height in [('desktop',1440,1000),('phone',390,844)]:
                page=await browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce')
                if args.offline:
                    await page.set_content(inline_site(root,offline=True),wait_until='load')
                    await page.evaluate('active=0;openProject()')
                else: await page.goto(args.base_url+'#wss')
                await page.wait_for_function('state==="opened"')
                assert await page.locator('[data-design="showbook-v3"]').count()==1
                assert await page.locator('.wss-opening,.wss-first-details,.wss-world-building').count()==0
                assert await page.locator('iframe').count()==0
                assert await page.locator('.wss-cover .wss-film').count()==1
                assert await page.locator('.wss-graphic-spread figure').count()==2
                assert await page.locator('.wss-spatial-grid figure').count()==4
                ok(label+': new DOM compositions; no old media-stack sections or eager iframe')
                await page.locator('.wss-bar [data-jump="wss-live"]').click()
                await page.locator('[data-live-start]').scroll_into_view_if_needed()
                await page.locator('[data-live-start]').click()
                iframe=page.locator('.wss-frame-mount iframe')
                assert await iframe.count()==1
                assert await iframe.get_attribute('src')=='https://shhh-hoo.github.io/WSS2/wss2.html'
                assert "camera 'none'" in await iframe.get_attribute('allow')
                assert "microphone 'none'" in await iframe.get_attribute('allow')
                assert await page.evaluate('[...document.querySelectorAll("video")].every(v=>v.paused)')
                ok(label+': explicit activation creates the original URL; cameras denied; films paused')
                await page.evaluate('window.testFrame=document.querySelector("iframe");window.testWindow=testFrame.contentWindow;window.testTop=projectScroll.scrollTop')
                await page.locator('[data-live-expand]').click()
                assert await page.locator('dialog:modal').count()==1
                assert await page.evaluate('testFrame===document.querySelector("iframe")&&testWindow===testFrame.contentWindow')
                bounds=await page.locator('dialog:modal').bounding_box()
                assert 0<=bounds['x']<20 and bounds['width']>width-35,bounds
                ok(label+': expanded native dialog keeps the same iframe/window, rather than reloading it')
                if args.live:
                    frame=page.frame_locator('.wss-frame-mount iframe')
                    await frame.locator('#start-btn:not(.pointer-events-none)').wait_for(timeout=45000)
                    await page.screenshot(path=str(out/(label+'-live-entry.png')))
                    restart=frame.locator('[data-action="restartProgress"]')
                    if await restart.is_visible():await restart.click()
                    await frame.locator('#start-btn').click()
                    await frame.locator('#view-gathering.active, #view-selection.active').wait_for(timeout=15000)
                    for _ in range(16):
                        if await frame.locator('#view-gathering.active').count()==0:break
                        carousel=frame.locator('#gatherCarousel')
                        index=await carousel.evaluate('''el=>{const items=[...el.querySelectorAll('.carousel-item')],c=el.scrollLeft+el.clientWidth/2;let best=0;items.forEach((x,i)=>{if(Math.abs(x.offsetLeft+x.offsetWidth/2-c)<Math.abs(items[best].offsetLeft+items[best].offsetWidth/2-c))best=i});el.scrollLeft=items[best].offsetLeft+items[best].offsetWidth/2-el.clientWidth/2;return best}''')
                        await carousel.locator('.arched-card').nth(index).click()
                        await page.wait_for_timeout(1150)
                    await frame.locator('#view-selection.active').wait_for(timeout=15000)
                    await page.screenshot(path=str(out/(label+'-live-selection.png')))
                    carousel=frame.locator('#selectCarousel')
                    index=await carousel.evaluate('''el=>{const items=[...el.querySelectorAll('.carousel-item')],c=el.scrollLeft+el.clientWidth/2;let best=0;items.forEach((x,i)=>{if(Math.abs(x.offsetLeft+x.offsetWidth/2-c)<Math.abs(items[best].offsetLeft+items[best].offsetWidth/2-c))best=i});el.scrollLeft=items[best].offsetLeft+items[best].offsetWidth/2-el.clientWidth/2;return best}''')
                    await carousel.locator('.arched-card').nth(index).click()
                    await frame.locator('#view-quiz.active').wait_for(timeout=10000)
                    await frame.locator('#quiz-options button').first.wait_for(state='visible')
                    await page.wait_for_timeout(1500)  # Original card-to-question animation must settle.
                    await page.screenshot(path=str(out/(label+'-live-question.png')))
                    await frame.locator('#quiz-options button').first.click()
                    await page.wait_for_timeout(700)
                    await frame.locator('[data-action="backToSelection"]').click()
                    await frame.locator('#view-selection.active').wait_for()
                    ok(label+': REAL HTTPS app — start, gather 16, select, answer, feedback, return')
                await page.locator('[data-live-expand]').click()
                assert await page.locator('dialog:modal').count()==0
                assert await page.evaluate('testFrame===document.querySelector("iframe")&&testWindow===testFrame.contentWindow')
                assert await page.evaluate('Math.abs(projectScroll.scrollTop-testTop)<2')
                ok(label+': collapse retains the app session and portfolio reading position')
                if args.live:
                    await page.wait_for_timeout(700)
                    await page.screenshot(path=str(out/(label+'-live-inline.png')))
                await page.locator('[data-live-expand]').click()
                await page.keyboard.press('Escape')
                assert await page.locator('dialog:modal').count()==0
                assert await page.evaluate('state==="opened"')
                ok(label+': Escape collapses the workspace without exiting the portfolio')
                await page.locator('[data-live-stop]').click()
                assert await page.locator('iframe').count()==0
                await expect(page.locator('[data-live-start]')).to_be_focused()
                ok(label+': STOP destroys the browsing context and restores keyboard focus')
                for _ in range(3):
                    await page.locator('[data-live-start]').click()
                    assert await page.locator('iframe').count()==1
                    await page.locator('[data-live-stop]').click()
                    assert await page.locator('iframe').count()==0
                ok(label+': three activation/stop cycles leave no duplicate frames')
                await page.locator('[data-live-start]').click()
                await page.locator('[data-jump="wss-edition-one"]').click()
                await page.wait_for_function('!document.querySelector("iframe")')
                ok(label+': scrolling away unloads the original app')
                await page.locator('.wss-bar [data-jump="wss-live"]').click()
                await page.locator('[data-live-start]').click()
                await page.locator('.wss-bar [data-return]').click()
                await page.wait_for_function('state==="index"')
                assert await page.locator('iframe,video').count()==0
                ok(label+': project return destroys all media and the live browsing context')
                await page.close()
            completed=True
        finally:
            await browser.close()
            (out/'report.json').write_text(json.dumps({'completed':completed,'mode':'actual remote app inside integrated page' if args.live else 'parent controller only','offline':args.offline,'count':len(records),'checks':records},indent=2))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root',default='.');parser.add_argument('--output',default='/tmp/wss-showbook');parser.add_argument('--base-url',default='http://127.0.0.1:8765/');parser.add_argument('--offline',action='store_true');parser.add_argument('--live',action='store_true');args=parser.parse_args()
    if args.offline and args.live:parser.error('Remote app verification requires real HTTP mode.')
    asyncio.run(run(args))
