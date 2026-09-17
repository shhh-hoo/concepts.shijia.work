"""Exercise the actual downloadable file format in a browser with networking."""
import asyncio, argparse, json, subprocess, sys
from pathlib import Path
from playwright.async_api import async_playwright

async def run(args):
    root=Path(args.root).resolve();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    html=out/'showbook-v3.html'
    subprocess.run([sys.executable,str(root/'wss/tools/build_preview.py'),str(html)],check=True)
    checks=[];complete=False
    async with async_playwright() as p:
        browser=await p.chromium.launch()
        try:
            for label,w,h in [('desktop',1440,1000),('phone',390,844)]:
                page=await browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce')
                await page.goto(html.resolve().as_uri())
                await page.wait_for_function('state==="opened"')
                assert await page.locator('[data-design="showbook-v3"]').count()==1
                await page.locator('.wss-bar [data-jump="wss-live"]').click()
                await page.locator('[data-live-start]').click()
                frame=page.frame_locator('iframe')
                await frame.locator('#enterBtn').wait_for(timeout=45000)
                assert await page.locator('iframe').get_attribute('src')=='https://shhh-hoo.github.io/WSS2/'
                if label=='desktop':
                    await frame.locator('#enterBtn').click()
                else:
                    await page.locator('[data-live-game]').click()
                await frame.locator('#start-btn').wait_for(timeout=45000)
                child=[f for f in page.frames if f.parent_frame is not None][0]
                assert child.url.endswith('/WSS2/wss2.html'), child.url
                checks.append(label+': downloaded file opens original WSS2 root; desktop uses native Enter and phone uses the explicit game fallback in the same iframe')
                await page.locator('[data-live-stop]').click()
                await page.locator('.wss-bar [data-return]').click()
                await page.wait_for_function('state==="index"')
                assert await page.locator('iframe,video').count()==0
                await page.go_forward()
                await page.wait_for_function('state==="opened"')
                checks.append(label+': file-url Back/Forward and iframe cleanup work')
                await page.close()
            complete=True
        finally:
            await browser.close()
            (out/'report.json').write_text(json.dumps({'completed':complete,'count':len(checks),'checks':checks,'format':'inlined publication format; CI parent-media fixtures, real HTTPS WSS2 root-to-game flow'},indent=2))
            html.unlink(missing_ok=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',default='.');p.add_argument('--output',default='/tmp/showbook-portable');asyncio.run(run(p.parse_args()))
