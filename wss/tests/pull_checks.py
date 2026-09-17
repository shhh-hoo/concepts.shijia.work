"""Regression: WSS inverse scaling must preserve the existing pull-to-index motion."""
import argparse
import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright
from browser_checks import inline_site

async def run(args):
    results = []
    async with async_playwright() as p:
        options = {'headless': True}
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        browser = await p.chromium.launch(**options)
        try:
            for width, height in [(390, 844), (844, 390)]:
                page = await browser.new_page(viewport={'width': width, 'height': height}, has_touch=True)
                if args.offline:
                    await page.set_content(inline_site(Path(args.root), offline=True))
                    await page.evaluate('active=0;openProject()')
                else:
                    await page.goto(args.base_url + '#wss')
                await page.wait_for_function('state === "opened"')
                geometry = await page.evaluate('''() => {
                    const rect = () => { const r=projectWorld.getBoundingClientRect();
                      return {x:r.x,y:r.y,w:r.width,h:r.height}; };
                    const before=rect();
                    const scale=scene.getBoundingClientRect().height/1024;
                    scene.classList.add('return-pulling');
                    scene.style.setProperty('--return-pull',`${60/scale}px`);
                    const pulled=rect();
                    scene.classList.remove('return-pulling');
                    scene.style.removeProperty('--return-pull');
                    return {before,pulled,restored:rect()};
                }''')
                a,b,c = (geometry[key] for key in ('before','pulled','restored'))
                assert abs(b['y']-a['y']-60)<1, geometry
                for key in ('x','w','h'):
                    assert abs(b[key]-a[key])<1, geometry
                assert all(abs(c[key]-a[key])<1 for key in a), geometry
                results.append({'viewport':[width,height], 'screen_pixel_tracking':'PASS', 'cancel_geometry':'PASS'})
                # Actual event handlers are available only on the HTTP origin.
                if not args.offline:
                    async def touch(kind, y):
                        await page.evaluate('''({kind,y}) => {
                          const target=projectScroll;
                          const t=new Touch({identifier:1,target,clientX:100,clientY:y,pageX:100,pageY:y});
                          target.dispatchEvent(new TouchEvent(kind,{bubbles:true,cancelable:true,
                            touches:kind==='touchend'?[]:[t],targetTouches:kind==='touchend'?[]:[t],changedTouches:[t]}));
                        }''', {'kind':kind,'y':y})
                    await touch('touchstart',200)
                    await touch('touchmove',250)
                    assert await page.evaluate('Math.abs(projectWorld.getBoundingClientRect().y-50)<1')
                    await touch('touchend',250)
                    await page.wait_for_timeout(250)
                    assert await page.evaluate('state === "opened" && Math.abs(projectWorld.getBoundingClientRect().y)<1')
                    await touch('touchstart',200)
                    await touch('touchmove',295)
                    await touch('touchend',295)
                    await page.wait_for_function('state === "index"')
                    assert await page.locator('video').count()==0
                    results[-1]['touch_cancel_and_commit']='PASS'
                await page.close()
        finally:
            await browser.close()
    report={'mode':'offline transform checks' if args.offline else 'HTTP touch events', 'completed':True, 'results':results}
    Path(args.output).write_text(json.dumps(report,indent=2))
    print(json.dumps(report),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',default='.')
    parser.add_argument('--offline',action='store_true')
    parser.add_argument('--base-url',default='http://127.0.0.1:8765/')
    parser.add_argument('--output',default='/tmp/wss-pull-report.json')
    asyncio.run(run(parser.parse_args()))
