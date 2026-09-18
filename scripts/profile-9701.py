"""Measure scroll smoothness and parent-page layout work for the 9701 exhibition."""
import functools, http.server, json, pathlib, statistics, threading
from playwright.sync_api import sync_playwright

root = pathlib.Path.cwd()
out = root / "evidence"
out.mkdir(exist_ok=True)
server = http.server.ThreadingHTTPServer(("127.0.0.1", 8767), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = "http://127.0.0.1:8767/preview/concepts/"
results = []

METRICS = {"LayoutCount", "RecalcStyleCount", "LayoutDuration", "RecalcStyleDuration", "ScriptDuration", "TaskDuration", "JSHeapUsedSize"}

def metric_map(session):
    payload = session.send("Performance.getMetrics")
    return {item["name"]: item["value"] for item in payload["metrics"] if item["name"] in METRICS}

def delta(before, after):
    return {k: after.get(k,0) - before.get(k,0) for k in METRICS if k not in {"JSHeapUsedSize"}} | {
        "JSHeapUsedSize": after.get("JSHeapUsedSize",0)
    }

with sync_playwright() as p:
    browser = p.chromium.launch()
    for label, width, height, mobile in [
        ("desktop",1536,1024,False),
        ("mobile",390,844,True),
    ]:
        context = browser.new_context(viewport={"width":width,"height":height}, is_mobile=mobile, has_touch=mobile, color_scheme="light")
        page = context.new_page()
        page.goto(base + "index.html#9701")
        page.wait_for_selector("#scene.opened")
        page.frame_locator(".atlas-current iframe").locator("#homepage-hero-title").wait_for()
        page.wait_for_timeout(500)
        page.evaluate("""() => {
          window.__perfLongTasks = [];
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) window.__perfLongTasks.push(entry.duration);
          }).observe({entryTypes:['longtask']});
        }""")
        cdp = context.new_cdp_session(page)
        cdp.send("Performance.enable")
        before = metric_map(cdp)
        frame_data = page.evaluate("""async () => {
          const host = document.getElementById('projectScroll');
          const max = host.scrollHeight - host.clientHeight;
          const frames = [];
          let last = performance.now();
          for (let i = 0; i <= 240; i++) {
            await new Promise(resolve => requestAnimationFrame(now => {
              frames.push(now-last);
              last = now;
              host.scrollTop = max*(i/240);
              resolve();
            }));
          }
          await new Promise(resolve => setTimeout(resolve,250));
          return {
            intervals: frames.slice(1),
            scrollHeight: host.scrollHeight,
            clientHeight: host.clientHeight,
            iframeCount: document.querySelectorAll('.atlas9701 iframe').length
          };
        }""")
        after = metric_map(cdp)
        intervals = frame_data.pop("intervals")
        long_tasks = page.evaluate("window.__perfLongTasks")
        ordered = sorted(intervals)
        def pct(q):
            if not ordered: return 0
            idx = min(len(ordered)-1, max(0, round((len(ordered)-1)*q)))
            return ordered[idx]
        results.append({
            "label": label,
            "frames": len(intervals),
            "meanFrameMs": statistics.fmean(intervals),
            "p95FrameMs": pct(.95),
            "p99FrameMs": pct(.99),
            "framesOver20ms": sum(v>20 for v in intervals),
            "framesOver32ms": sum(v>32 for v in intervals),
            "longTaskCount": len(long_tasks),
            "longTaskTotalMs": sum(long_tasks),
            "metrics": delta(before, after),
            **frame_data
        })
        context.close()
    browser.close()
server.shutdown()
(out/"performance.json").write_text(json.dumps(results, indent=2))
print(json.dumps(results, indent=2))
