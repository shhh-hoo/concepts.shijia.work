/* WSS / WSS2: an asset-led content chapter, independent of the index geometry. */
(() => {
  'use strict';
  const script = document.currentScript;
  const mediaBase = new URL(script.dataset.mediaBase || './media/', script.src || document.baseURI);
  const media = name => window.WSS_ASSET_MAP?.[name] || new URL(name, mediaBase).href;
  const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let mounted = null;

  function image(stem, small, large, width, height, alt, sizes = '100vw') {
    return `<img src="${media(`${stem}-${small}.webp`)}" srcset="${media(`${stem}-${small}.webp`)} ${small}w, ${media(`${stem}-${large}.webp`)} ${large}w" sizes="${sizes}" width="${width}" height="${height}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  }
  function film(stem, label, description, mode = '', ratio = '16 / 9') {
    return `<figure class="wss-film" data-film="${stem}">
      <div class="wss-film-screen" style="--film-ratio:${ratio}">
        <video aria-label="${esc(description)}" data-source="${media(`${stem}.mp4`)}" data-autoplay="${mode}" poster="${media(`${stem}-poster-1600.webp`)}" width="1600" height="${ratio === '3 / 2' ? '1067' : '900'}" controls muted playsinline preload="none" ${mode === 'loop' ? 'loop' : ''}></video>
      </div>
      <figcaption class="wss-film-caption"><span>${label}</span><div class="wss-film-actions">
        <button type="button" data-toggle aria-label="Play ${esc(description)}">PLAY FILM</button>
        <button type="button" data-sound aria-pressed="false">SOUND OFF</button>
      </div></figcaption>
      <p class="wss-media-error" role="status" hidden>This film could not load. You can retry using Play film.</p>
    </figure>`;
  }

  function render(project) {
    return `<article class="wss-story" aria-labelledby="wss-title">
      <nav class="wss-bar" aria-label="WSS project navigation">
        <span class="wss-bar-id">01 <span>/ LIVE QUIZ SHOW</span></span>
        <div class="wss-chapter-links"><button type="button" data-jump="wss-edition-one" aria-current="true">WSS</button><span aria-hidden="true">/</span><button type="button" data-jump="wss-edition-two">WSS2</button></div>
        <button type="button" class="wss-return" data-return>INDEX <span aria-hidden="true">×</span></button>
      </nav>

      <section class="wss-first" id="wss-edition-one" aria-labelledby="wss-title">
        <header class="wss-opening wss-pad">
          <div class="wss-opening-title"><p class="wss-eyebrow">WHO’S STILL STANDING?</p><h1 id="wss-title" tabindex="-1">WSS<span class="wss-edition-number">01</span></h1></div>
          <div class="wss-opening-copy"><p>${esc(project.statement)}</p><span class="wss-micro">TWO EDITIONS. ONE QUESTION.</span></div>
        </header>
        ${film('wss-intro','I / THE OPENING · 00:09','WSS opening film','loop')}
        <div class="wss-first-details wss-pad">
          <div class="wss-section-heading"><span class="wss-eyebrow">THE FIRST EDITION</span><h2>Thoughts too loud.<br><em>Let it flow.</em></h2></div>
          <figure class="wss-panorama">${image('wss-stage',1000,2400,6405,2666,'WSS stage artwork: magenta and electric-blue banners surrounding the central competition screen')}<figcaption><span>01 / THE STAGE, COMPOSED</span><span>STAGE ARTWORK</span></figcaption></figure>
          <div class="wss-signup-row">
            <div class="wss-short-copy"><span class="wss-eyebrow">BEFORE THE SHOW</span><p>A repeated invitation.<br>A shared visual language.<br>From the first poster<br>to the last question.</p></div>
            <figure>${image('wss-signup',800,1514,1514,750,'The race is on: WSS signup poster with repeated Sign up Now typography','(max-width: 700px) 100vw, 64vw')}<figcaption><span>02 / THE INVITATION</span><span>SIGNUP POSTER</span></figcaption></figure>
          </div>
        </div>
      </section>

      <section class="wss-second" id="wss-edition-two" aria-labelledby="wss2-title">
        <header class="wss-chapter-heading wss-pad"><div><p class="wss-eyebrow">II / THE SECOND EDITION</p><h2 id="wss2-title">WSS2</h2></div><p>A different world.<br><em>The same question.</em></p></header>
        ${film('wss2-teaser','II / THE TEASER · 00:13','WSS2 Good or Wicked teaser','once')}
        <div class="wss-teaser-note wss-pad"><p>A familiar crest.<br>An unfamiliar world.</p><span class="wss-micro">GOOD / WICKED</span></div>

        <section class="wss-world-building wss-pad" aria-labelledby="wss-world-title">
          <div class="wss-world-heading"><span class="wss-eyebrow">A WORLD, BEYOND THE SCREEN</span><h3 id="wss-world-title">From image<br><em>to room.</em></h3></div>
          <figure class="wss-artwork">${image('wss2-artwork',800,1376,1376,768,'Good or Wicked main artwork: emerald machinery and a yellow road opposite pearl-pink bubbles and a castle','(max-width: 700px) 100vw, 68vw')}<figcaption><span>03 / THE WORLD ON SCREEN</span><span>MAIN VISUAL</span></figcaption></figure>
          <figure class="wss-room">${image('wss2-stage',900,2000,4032,3024,'The WSS2 stage with the main visual on screen, green-lit gears to the left and transparent bubbles to the right','(max-width: 700px) 100vw, 80vw')}<figcaption><span>04 / THE WORLD ON STAGE</span><span>THE PHYSICAL SETTING</span></figcaption></figure>
        </section>

        <section class="wss-invitation wss-pad" aria-labelledby="wss-invitation-title">
          <figure class="wss-door">${image('wss2-entrance',600,1200,3665,4886,'The WSS2 entrance, an illustrated green and pink arch installed around the doorway','(max-width: 700px) 100vw, 36vw')}<figcaption><span>05 / CROSSING THE THRESHOLD</span><span>ENTRANCE</span></figcaption></figure>
          <div class="wss-invitation-right"><div class="wss-invitation-heading"><span class="wss-eyebrow">THE INVITATION BECOMES A PLACE</span><h3 id="wss-invitation-title">Before the<br><em>first question.</em></h3></div>${film('wss2-invitation','06 / THE INVITATION · 00:49','WSS2 signup film','','3 / 2')}</div>
        </section>

        <section class="wss-in-play" aria-labelledby="wss-play-title">
          <div class="wss-play-heading wss-pad"><div><span class="wss-eyebrow">THE INTERACTION</span><h3 id="wss-play-title">The game,<br><em>in the room.</em></h3></div><a class="wss-open-live" href="https://shhh-hoo.github.io/WSS2/wss2.html" target="_blank" rel="noopener noreferrer">OPEN ORIGINAL WSS2 <span aria-hidden="true">↗</span><small>THE INTERACTIVE WEBSITE</small></a></div>
          <figure>${image('wss2-game',900,2000,3433,2289,'A participant reaching toward an illustrated question card on the large WSS2 display')}<figcaption class="wss-pad"><span>07 / A CARD. A QUESTION. A LIVE MOMENT.</span><span>WSS2 IN USE</span></figcaption></figure>
        </section>
      </section>
      <footer class="wss-end wss-pad"><p>Questions. Identity.<br>Stagecraft. Interaction.</p><div><span class="wss-eyebrow">WSS / WSS2</span><button type="button" data-return>BACK TO CONCEPTS <span aria-hidden="true">↙</span></button></div></footer>
    </article>`;
  }

  function destroy() {
    if (!mounted) return;
    const old = mounted;
    mounted = null;
    old.ready = false;
    old.abort.abort();
    old.filmsObserver.disconnect();
    old.chaptersObserver.disconnect();
    for (const video of old.videos.keys()) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    old.world.classList.remove('wss-world');
    old.scene.classList.remove('wss-scene');
    old.world.style.removeProperty('--wss-unscale');
    old.article.remove();
    old.root.removeAttribute('aria-label');
    old.root.removeAttribute('tabindex');
  }

  function mount(enabled, root) {
    if (!enabled) return;
    const article = root.querySelector('.wss-story');
    if (!article) return;
    const abort = new AbortController();
    const signal = abort.signal;
    const world = root.parentElement;
    const scene = world.parentElement;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    const ctx = { root, article, world, scene, abort, ready: false, videos: new Map(), reduced };
    mounted = ctx;
    world.classList.add('wss-world');
    scene.classList.add('wss-scene');
    root.setAttribute('aria-label', 'WSS / WSS2 project');
    root.tabIndex = -1;

    // Cancel only the outer fixed-canvas scale. The project itself lays out in
    // real viewport pixels; the monochrome index and moving sheets are untouched.
    function fitContent() {
      const transform = getComputedStyle(scene).transform;
      const scale = transform === 'none' ? 1 : Math.abs(new DOMMatrixReadOnly(transform).a);
      world.style.setProperty('--wss-unscale', String(1 / Math.max(.01, scale)));
      if (scene.classList.contains('opened')) {
        const ux = 700 / Math.hypot(700, 1000);
        const uy = -1000 / Math.hypot(700, 1000);
        const travel = Math.max(Math.hypot(700, 1000) * 1.48,
          (window.innerHeight / 2 + 1024 * scale / 2 + 24) / (Math.abs(uy) * scale));
        for (const sheet of scene.querySelectorAll('.field-sheet.exit')) {
          const sign = Math.sign(parseFloat(sheet.style.getPropertyValue('--dx'))) || 1;
          sheet.style.setProperty('--dx', `${sign * ux * travel}px`);
          sheet.style.setProperty('--dy', `${sign * uy * travel}px`);
        }
      }
    }
    fitContent();
    window.addEventListener('resize', fitContent, { signal });

    function source(video) {
      if (!video.getAttribute('src') || video.error) {
        video.src = video.dataset.source;
        video.load();
      }
    }
    function pauseOthers(except) {
      for (const [video, info] of ctx.videos) {
        if (video !== except && !video.paused) {
          info.systemPause = true;
          video.pause();
        }
      }
    }
    function play(video, user = false) {
      if (mounted !== ctx || !ctx.ready) return;
      const info = ctx.videos.get(video);
      if (user) { info.userPaused = false; info.done = false; }
      if (video.ended) video.currentTime = 0;
      info.figure.querySelector('.wss-media-error').hidden = true;
      source(video);
      pauseOthers(video);
      info.systemPause = false;
      const request = video.play();
      if (request) request.catch(error => {
        if (mounted !== ctx || error.name === 'AbortError') return;
        info.toggle.textContent = 'PLAY FILM';
        // Autoplay denial is a normal poster + play-button state, not a failure.
        if (error.name !== 'NotAllowedError') info.figure.querySelector('.wss-media-error').hidden = false;
      });
    }
    function reconsider() {
      if (!ctx.ready || document.hidden) return;
      const candidates = [...ctx.videos].filter(([v, info]) => v.dataset.autoplay && info.ratio >= .45 && !info.userPaused && !info.done);
      if (reduced.matches || connection?.saveData) return;
      candidates.sort((a, b) => b[1].ratio - a[1].ratio);
      const best = candidates[0];
      if (best && best[0].paused) play(best[0]);
    }

    ctx.filmsObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const video = entry.target;
        const info = ctx.videos.get(video);
        info.ratio = entry.intersectionRatio;
        if (info.ratio < .15 && !video.paused) {
          info.systemPause = true;
          video.pause();
        }
      }
      reconsider();
    }, { root, threshold: [0, .15, .45, .75, 1] });

    for (const video of article.querySelectorAll('video')) {
      const figure = video.closest('.wss-film');
      const toggle = figure.querySelector('[data-toggle]');
      const sound = figure.querySelector('[data-sound]');
      const info = { figure, toggle, sound, ratio: 0, userPaused: false, done: false, systemPause: false };
      ctx.videos.set(video, info);
      video.muted = true;
      ctx.filmsObserver.observe(video);
      toggle.addEventListener('click', () => {
        if (video.paused) play(video, true);
        else { info.userPaused = true; video.pause(); }
      }, { signal });
      sound.addEventListener('click', () => {
        video.muted = !video.muted;
        if (!video.muted && video.paused) play(video, true);
      }, { signal });
      // Native video controls stay available, including seeking and fullscreen.
      video.addEventListener('pointerdown', () => source(video), { signal });
      video.addEventListener('keydown', () => source(video), { signal });
      video.addEventListener('play', () => {
        info.systemPause = false;
        toggle.textContent = 'PAUSE FILM';
        toggle.setAttribute('aria-label', `Pause ${video.getAttribute('aria-label')}`);
        pauseOthers(video);
      }, { signal });
      video.addEventListener('pause', () => {
        if (!info.systemPause && ctx.ready && !document.hidden && info.ratio >= .15) info.userPaused = true;
        info.systemPause = false;
        toggle.textContent = video.ended ? 'REPLAY FILM' : 'PLAY FILM';
        toggle.setAttribute('aria-label', `Play ${video.getAttribute('aria-label')}`);
      }, { signal });
      video.addEventListener('ended', () => { info.done = true; toggle.textContent = 'REPLAY FILM'; }, { signal });
      video.addEventListener('volumechange', () => {
        sound.textContent = video.muted ? 'SOUND OFF' : 'SOUND ON';
        sound.setAttribute('aria-pressed', String(!video.muted));
      }, { signal });
      video.addEventListener('error', () => {
        if (video.getAttribute('src')) figure.querySelector('.wss-media-error').hidden = false;
      }, { signal });
    }

    ctx.chaptersObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        for (const button of article.querySelectorAll('[data-jump]')) {
          if (button.dataset.jump === entry.target.id) button.setAttribute('aria-current', 'true');
          else button.removeAttribute('aria-current');
        }
      }
    }, { root, rootMargin: '-60px 0px -70% 0px', threshold: 0 });
    for (const id of ['wss-edition-one', 'wss-edition-two']) ctx.chaptersObserver.observe(article.querySelector(`#${id}`));

    article.addEventListener('click', event => {
      const back = event.target.closest('[data-return]');
      if (back) { event.preventDefault(); window.closeProject(); return; }
      const jump = event.target.closest('[data-jump]');
      if (jump) {
        const target = article.querySelector(`#${jump.dataset.jump}`);
        const top = target.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 58;
        root.scrollTo({ top: Math.max(0, top), behavior: reduced.matches ? 'instant' : 'smooth' });
      }
    }, { signal });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        for (const [video, info] of ctx.videos) { info.systemPause = true; video.pause(); }
      } else reconsider();
    }, { signal });
    reduced.addEventListener('change', () => {
      if (reduced.matches) for (const [video, info] of ctx.videos) { info.systemPause = true; video.pause(); }
      else reconsider();
    }, { signal });
    ctx.reconsider = reconsider;
  }

  function activate() {
    if (!mounted) return;
    mounted.ready = true;
    mounted.article.querySelector('h1').focus({ preventScroll: true });
    mounted.reconsider();
  }
  function pause() {
    if (!mounted) return;
    mounted.ready = false;
    for (const [video, info] of mounted.videos) { info.systemPause = true; video.pause(); }
  }
  window.WSSContent = { render, mount, activate, pause, destroy };
})();
