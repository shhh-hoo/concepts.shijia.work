/* 9701 / a continuous window into the original, running product. */
(() => {
  const SOURCES = {
    home: { path: '/?theme=light#homepage-hero-root', name: '9701 · Home', label: 'The library', action: 'Explore the library' },
    as: { path: '/as/?theme=light#stage-hero-root', name: '9701 · AS Chemistry', label: 'AS Chemistry', action: 'Explore AS' },
    a2: { path: '/a2/?theme=light#stage-hero-root', name: '9701 · A2 Chemistry', label: 'A2 Chemistry', action: 'Explore A2' },
    paths: { path: '/interactive/9701-as-organic-paths/?theme=light#diagramBtn', name: '9701 · Organic Pathways', label: 'Organic Pathways', action: 'Try the map' },
    memory: { path: '/interactive/9701-memorisation-bank/?theme=light#session-setup', name: '9701 · Memorisation Bank', label: 'Memorisation Bank', action: 'Try a practice session' }
  };
  const chapters = ['ORGANISE', 'CONNECT', 'REHEARSE'];
  const descriptions = ['AS, A2 and a shared chemistry library.', 'Choose a reaction. Follow what changes.', 'A prompt, your answer, another attempt.'];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  let activeInstance = null;

  function mount(host, { base = 'https://9701.shijia.work', onExit = () => {} } = {}) {
    const events = new AbortController();
    const opts = { signal: events.signal };
    const sourceBase = base.replace(/\/$/, '');
    host.classList.add('atlas9701-host');
    host.innerHTML = `
      <article class="atlas9701" aria-label="9701 interactive exhibition">
        <div class="atlas-track"><div class="atlas-camera">
          <div class="atlas-colour" aria-hidden="true"></div>
          <header class="atlas-topline"><span>06 / 9701</span><a href="https://9701.shijia.work/" target="_blank" rel="noopener noreferrer">OPEN THE SITE ↗</a></header>
          <div class="atlas-cover">
            <p class="atlas-eyebrow">A-LEVEL CHEMISTRY / A WORKING COLLECTION</p>
            <h1>9701<span class="atlas-period">.</span></h1>
            <p class="atlas-intro">A place to find it.<br>A way to connect it.<br>A chance to try again.</p>
            <span class="atlas-cover-note">REFERENCE ↔ PRACTICE</span>
          </div>
          <div class="atlas-caption" aria-live="polite"><span class="atlas-chapter-number">01</span><h2>ORGANISE</h2><p>AS, A2 and a shared chemistry library.</p></div>
          <nav class="atlas-route-picker" aria-label="Explore the library routes"><button type="button" data-route="home" aria-pressed="true">HOME</button><button type="button" data-route="as" aria-pressed="false">AS</button><button type="button" data-route="a2" aria-pressed="false">A2</button></nav>
          <div class="atlas-portals"></div>
          <div class="atlas-finish"><p>9701.SHIJIA.WORK</p><button type="button" class="atlas-exit">↙ RETURN TO THE INDEX</button></div>
          <footer class="atlas-bottomline"><span class="atlas-scroll-cue">SCROLL TO UNFOLD ↓</span><nav aria-label="Exhibition chapters" class="atlas-chapters"><button type="button" data-chapter="0" aria-current="step">01 / ORGANISE</button><button type="button" data-chapter="1">02 / CONNECT</button><button type="button" data-chapter="2">03 / REHEARSE</button></nav><span class="atlas-page-count">01 — 03</span></footer>
          <div class="atlas-progress" aria-hidden="true"><span></span></div>
        </div></div>
      </article>`;
    const root = host.querySelector('.atlas9701');
    const portalRoot = root.querySelector('.atlas-portals');
    const caption = root.querySelector('.atlas-caption');
    const picker = root.querySelector('.atlas-route-picker');
    const cover = root.querySelector('.atlas-cover');
    const finish = root.querySelector('.atlas-finish');
    const scrollCue = root.querySelector('.atlas-scroll-cue');
    const progressBar = root.querySelector('.atlas-progress span');
    const chapterButtons = [...root.querySelectorAll('[data-chapter]')];
    const routeButtons = [...root.querySelectorAll('[data-route]')];
    const frames = new Map();
    let width = 0, height = 0, mobile = false, frameRequest = 0, chapter = -1;
    let route = 'home', currentKey = '', live = null, stopped = false;
    let savedScroll = 0, savedFocus = null, everOpened = false, cueText = '';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    function configureSource(record) {
      if (!record || !width) return;
      const nativeWidth = mobile ? Math.max(340, width - 24) : 1440;
      if (record.sourceWidth === nativeWidth) return;
      record.sourceWidth = nativeWidth;
      record.sourceHeight = 1150;
      for (const el of [record.iframe, record.loading]) {
        el.style.width = nativeWidth + 'px';
        el.style.height = record.sourceHeight + 'px';
      }
    }

    function retireInactiveFrames(keepKey) {
      if (live || stopped) return;
      for (const [key, record] of [...frames]) {
        if (key === keepKey) continue;
        record.dialog.remove();
        frames.delete(key);
      }
    }

    function applyPortalGeometry(record, x, y, w, h, cut) {
      configureSource(record);
      const px = x * width, py = y * height, pw = w * width, ph = h * height;
      const scale = pw / record.sourceWidth;
      const cutX = px + pw * cut / 100;
      const cutY = py + ph * cut / 100;
      const clip = `polygon(${cutX}px ${py}px,${px + pw}px ${py}px,${px + pw}px ${py + ph}px,${px}px ${py + ph}px,${px}px ${cutY}px)`;
      const sourceTransform = `translate3d(${px}px,${py}px,0) scale(${scale})`;
      record.viewport.style.clipPath = clip;
      record.enter.style.clipPath = clip;
      record.iframe.style.transform = sourceTransform;
      record.loading.style.transform = sourceTransform;
      record.enterLabel.style.transform = `translate3d(${px + pw - 22}px,${py + ph - 22}px,0) translate(-100%,-100%)`;
      record.portalCaption.style.transform = `translate3d(${px}px,${py + ph + 15}px,0)`;
      record.portalCaption.style.width = pw + 'px';
    }

    function makePortal(key) {
      if (frames.has(key)) return frames.get(key);
      // Current plus previous: at most two embedded browsing contexts.
      if (frames.size >= 2) {
        const oldest = [...frames.keys()].find(k => k !== currentKey);
        if (oldest) { frames.get(oldest).dialog.remove(); frames.delete(oldest); }
      }
      const source = SOURCES[key];
      const dialog = document.createElement('dialog');
      dialog.className = 'atlas-portal';
      dialog.dataset.source = key;
      dialog.setAttribute('open', '');
      dialog.setAttribute('aria-label', source.name);
      dialog.innerHTML = `
        <div class="atlas-portal-toolbar"><span>${source.label}</span><a href="https://9701.shijia.work${source.path}" target="_blank" rel="noopener noreferrer">OPEN SEPARATELY ↗</a><button type="button" class="atlas-leave">BACK TO EXHIBITION ×</button></div>
        <div class="atlas-viewport"><div class="atlas-loading"><span>9701</span><p>Opening ${source.label.toLowerCase()}…</p></div><iframe title="${source.name}" tabindex="-1" inert referrerpolicy="strict-origin-when-cross-origin"></iframe><button type="button" class="atlas-enter" aria-label="${source.action}"><span>${source.action} <b aria-hidden="true">↗</b></span></button></div>
        <div class="atlas-portal-caption"><span>${source.label}</span><span>THE REAL, RUNNING PRODUCT ↗</span></div>`;
      const iframe = dialog.querySelector('iframe');
      const record = {
        dialog,
        iframe,
        viewport: dialog.querySelector('.atlas-viewport'),
        loading: dialog.querySelector('.atlas-loading'),
        enter: dialog.querySelector('.atlas-enter'),
        enterLabel: dialog.querySelector('.atlas-enter > span'),
        portalCaption: dialog.querySelector('.atlas-portal-caption'),
        touched: false,
        sourceWidth: 0,
        sourceHeight: 1150
      };
      frames.set(key, record);
      portalRoot.append(dialog);
      // Remote document, not a DOM replica. No cross-origin DOM access.
      iframe.src = sourceBase + source.path;
      iframe.addEventListener('load', () => {
        // This event is NOT a success assertion. External links remain available.
        dialog.classList.add('atlas-load-ended');
        setTimeout(() => {
          if (!stopped && !live && currentKey === key) retireInactiveFrames(key);
        }, 700);
      }, opts);
      record.enter.addEventListener('click', () => enter(record), opts);
      dialog.querySelector('.atlas-leave').addEventListener('click', leave, opts);
      dialog.addEventListener('cancel', e => { e.preventDefault(); leave(); }, opts);
      return record;
    }
    function enter(record) {
      if (stopped || live) return;
      savedScroll = host.scrollTop;
      savedFocus = document.activeElement;
      live = record;
      record.touched = true;
      // Native top layer: no reparenting, no reload, no canvas-scaled reading text.
      record.dialog.close();
      record.dialog.classList.add('atlas-is-live');
      record.dialog.showModal();
      record.iframe.inert = false;
      record.iframe.tabIndex = 0;
      host.style.overflowY = 'hidden';
      root.classList.add('atlas-reading');
      record.dialog.querySelector('.atlas-leave').focus({ preventScroll: true });
    }
    function leave() {
      if (!live) return;
      const record = live;
      live = null;
      record.dialog.close();
      record.dialog.classList.remove('atlas-is-live');
      record.dialog.setAttribute('open', '');
      record.iframe.inert = true;
      record.iframe.tabIndex = -1;
      host.style.overflowY = '';
      root.classList.remove('atlas-reading');
      host.scrollTop = savedScroll;
      savedFocus?.focus?.({ preventScroll: true });
      requestUpdate();
    }
    function rectangle(p) {
      // [timeline, x/W, y/H, width/W, height/H, diagonal crop percent]
      const keys = mobile ? [
        [0,.08,.39,.96,.45,9],[.80,.035,.21,.93,.64,0],[1.45,.035,.21,.93,.64,0],
        [1.68,.035,.43,.93,.13,0],[1.91,.025,.18,.95,.67,0],[2.90,.025,.18,.95,.67,0],
        [3.18,.025,.43,.95,.13,0],[3.43,.055,.22,.89,.61,0],[4.20,.055,.22,.89,.61,0],[5,.25,.32,.50,.28,0]
      ] : [
        [0,.36,.34,.68,.52,7],[.80,.22,.205,.74,.66,0],[1.45,.22,.205,.74,.66,0],
        [1.68,.08,.48,.84,.08,0],[1.91,.075,.14,.875,.73,0],[2.90,.075,.14,.875,.73,0],
        [3.18,.075,.47,.875,.09,0],[3.43,.34,.22,.60,.64,0],[4.20,.34,.22,.60,.64,0],[5,.40,.32,.25,.33,0]
      ];
      let a = keys[0], b = keys[keys.length - 1];
      for (let i = 0; i < keys.length - 1; i++) {
        if (p >= keys[i][0] && p <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; }
      }
      const t = ease(clamp((p - a[0]) / Math.max(.001, b[0] - a[0])));
      return a.slice(1).map((v, i) => mix(v, b[i + 1], reduced.matches ? (t > .5 ? 1 : 0) : t));
    }
    function update() {
      frameRequest = 0;
      if (stopped || live) return;
      const p = clamp(host.scrollTop / Math.max(1, height) * (mobile ? 1.25 : 1), 0, 5);
      const nextChapter = p < 1.73 ? 0 : p < 3.23 ? 1 : 2;
      const key = nextChapter === 0 ? route : nextChapter === 1 ? 'paths' : 'memory';
      if (nextChapter !== chapter) {
        chapter = nextChapter;
        root.dataset.chapter = String(chapter);
        caption.querySelector('.atlas-chapter-number').textContent = `0${chapter + 1}`;
        caption.querySelector('h2').textContent = chapters[chapter];
        caption.querySelector('p').textContent = descriptions[chapter];
        chapterButtons.forEach(b => {
          if (Number(b.dataset.chapter) === chapter) b.setAttribute('aria-current', 'step');
          else b.removeAttribute('aria-current');
        });
      }
      if (key !== currentKey) {
        const record = makePortal(key);
        currentKey = key;
        frames.forEach((r, k) => { r.dialog.classList.toggle('atlas-current', k === key); r.dialog.inert = k !== key; });
        record.dialog.inert = false;
      }
      const [x,y,w,h,cut] = rectangle(p);
      const record = frames.get(currentKey);
      applyPortalGeometry(record, x, y, w, h, cut);
      const coverOpacity = 1-clamp(p/.63);
      const finishOpacity = clamp((p-4.40)/.40);
      cover.style.opacity = String(coverOpacity);
      cover.style.transform = `translate3d(0,${-p*(mobile?25:65)}px,0)`;
      caption.style.opacity = String(Math.min(clamp((p-.4)/.3),1-finishOpacity));
      finish.style.opacity = String(finishOpacity);
      progressBar.style.transform = `scaleX(${p/5})`;
      cover.inert=coverOpacity<.1;
      finish.inert=finishOpacity<.9;
      const hidePicker=chapter!==0||p<.6;
      if (picker.hidden !== hidePicker) picker.hidden=hidePicker;
      const nextCue=p>4.5?'END OF EXHIBITION':'SCROLL TO UNFOLD ↓';
      if (nextCue !== cueText) { cueText = nextCue; scrollCue.textContent = nextCue; }
    }
    function requestUpdate(){if(!frameRequest&&!stopped)frameRequest=requestAnimationFrame(update);}
    function resize(){
      if(live||stopped)return;
      width=host.clientWidth;height=host.clientHeight;
      mobile=matchMedia('(max-width:699px)').matches;
      root.style.setProperty('--atlas-h',`${height}px`);
      root.style.setProperty('--atlas-w',`${width}px`);
      root.style.setProperty('--track-length',mobile?5:6);
      frames.forEach(configureSource);
      requestUpdate();
    }
    host.addEventListener('scroll',requestUpdate,{...opts,passive:true});
    chapterButtons.forEach(button=>button.addEventListener('click',()=>{
      const p=[.95,2.15,3.85][Number(button.dataset.chapter)];
      host.scrollTo({top:p*height/(mobile?1.25:1),behavior:reduced.matches?'instant':'smooth'});
    },opts));
    routeButtons.forEach(button=>button.addEventListener('click',()=>{
      route=button.dataset.route;
      routeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      requestUpdate();
    },opts));
    root.querySelector('.atlas-exit').addEventListener('click',onExit,opts);
    const observer=new ResizeObserver(resize);observer.observe(host);
    window.addEventListener('resize',resize,opts);
    window.addEventListener('popstate',()=>{if(live)leave();},opts);
    const sharedScene=document.getElementById('scene');
    const lifecycle=new MutationObserver(()=>{
      if(sharedScene.classList.contains('opened'))everOpened=true;
      else if(everOpened)dispose();
    });
    if(sharedScene)lifecycle.observe(sharedScene,{attributes:true,attributeFilter:['class']});
    function dispose(){
      if(stopped)return;
      leave();stopped=true;
      events.abort();observer.disconnect();lifecycle.disconnect();cancelAnimationFrame(frameRequest);
      frames.forEach(record=>record.dialog.remove());frames.clear();
      host.style.overflowY='';host.classList.remove('atlas9701-host');
    }
    resize();
    return{dispose,leave,get isLive(){return!!live;}};
  }
  // Installed before shared Escape handlers; active product reading owns Escape.
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&activeInstance?.isLive){e.preventDefault();e.stopImmediatePropagation();activeInstance.leave();}
  },true);
  window.Atlas9701={mount(host,options){activeInstance?.dispose();activeInstance=mount(host,options);return activeInstance;}};
  if(typeof renderProjectPage==='function'){
    const baseRender=renderProjectPage;
    renderProjectPage=function(i){
      activeInstance?.dispose();activeInstance=null;
      if(projects[i]?.slug!=='9701')return baseRender(i);
      projectScroll.scrollTop=0;
      activeInstance=mount(projectScroll,{onExit:()=>backBtn.click()});
    };
  }
})();
