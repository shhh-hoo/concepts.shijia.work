"""Observe the real app through visible mouse hits, without locator auto-scroll."""
import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/tmp/showbook-native');OUT.mkdir(exist_ok=True)
async def run():
 async with async_playwright() as p:
  browser=await p.chromium.launch()
  records=[]
  try:
   for label,w,h in [('phone',390,844),('desktop',1440,1000)]:
    page=await browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce')
    await page.goto('http://127.0.0.1:8765/#wss');await page.wait_for_function('state==="opened"')
    await page.locator('.wss-bar [data-jump="wss-live"]').click();await page.locator('[data-live-start]').click();await page.locator('[data-live-expand]').click()
    iframe=page.locator('iframe');frame=page.frame_locator('iframe')
    await frame.locator('#start-btn:not(.pointer-events-none)').wait_for(timeout=45000)
    async def click_point(selector,center=False):
     point=await frame.locator(selector).evaluate('''(el,center)=>{let target=el;if(center){const cards=[...el.querySelectorAll('.arched-card')];target=cards.reduce((a,b)=>{const r=x=>x.getBoundingClientRect();return Math.abs(r(a).x+r(a).width/2-innerWidth/2)<Math.abs(r(b).x+r(b).width/2-innerWidth/2)?a:b})}const r=target.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:innerWidth,h:innerHeight}}''',center)
     assert 0<point['x']<point['w'] and 0<point['y']<point['h'],point
     box=await iframe.bounding_box();await page.mouse.click(box['x']+point['x'],box['y']+point['y'])
    await click_point('#start-btn');await frame.locator('#view-gathering.active').wait_for(timeout=15000);await page.wait_for_timeout(800)
    for i in range(16):
     await click_point('#gatherCarousel',True)
     await frame.locator('#gather-count').filter(has_text=f'{i+1} / 16').wait_for(timeout=5000)
     await page.wait_for_timeout(150)
    await frame.locator('#view-selection.active').wait_for(timeout=15000);await page.wait_for_timeout(900)
    await click_point('#selectCarousel',True);await frame.locator('#view-quiz.active').wait_for(timeout=12000);await page.wait_for_timeout(1300)
    geometry=await frame.locator('#view-quiz .glass-panel').evaluate('''el=>{const r=el.getBoundingClientRect(),b=document.querySelector('#quiz-body').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,viewport:[innerWidth,innerHeight],scroll:[scrollX,scrollY],quizBody:{x:b.x,y:b.y,w:b.width,h:b.height}}}''')
    records.append({'viewport':label,'geometry':geometry});(OUT/'report.json').write_text(json.dumps(records,indent=2))
    await page.screenshot(path=str(OUT/(label+'-question.png')))
    assert geometry['x']>=-1 and geometry['x']+geometry['w']<=geometry['viewport'][0]+1,geometry
    await frame.locator('#quiz-body').evaluate('el=>el.scrollTop=el.scrollHeight')
    await page.wait_for_timeout(250);await page.screenshot(path=str(OUT/(label+'-options.png')))
    await page.close()
  finally:
   await browser.close()
   (OUT/'report.json').write_text(json.dumps(records,indent=2))
asyncio.run(run())
