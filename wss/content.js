/* WSS / WSS2: an editorial composition, with an opt-in original web experience. */
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
        <span class="wss-bar-id">01 <span>/ WSS · WSS2</span></span>
        <div class="wss-chapter-links"><button type="button" data-jump="wss-edition-one" aria-current="true">I. WSS</button><button type="button" data-jump="wss-edition-two">II. WSS2</button><button type="button" data-jump="wss-interaction">III. PLAY</button></div>
        <button type="button" class="wss-return" data-return>INDEX <span aria-hidden="true">×</span></button>
      </nav>
      <section id="wss-edition-one" class="wss-first" aria-labelledby="wss-title">
        <header class="wss-cover wss-pad">
          <div class="wss-cover-top"><span class="wss-eyebrow">A LIVE QUIZ COMPETITION</span><span class="wss-eyebrow">TWO EDITIONS / ONE QUESTION</span></div>
          <div class="wss-cover-type"><h1 id="wss-title" tabindex="-1">WHO’S<br>STILL<br><span>STANDING?</span></h1><p class="wss-statement">${esc(project.statement.toUpperCase())}</p></div>
          <div class="wss-cover-media"><div class="wss-edition-label"><strong>WSS</strong><span>THE FIRST EDITION<br>OPENING SEQUENCE</span></div>${film('wss-intro','01 / MOTION · 00:09','WSS opening film','loop')}<p class="wss-cover-note">Type sets the rhythm.<br> Colour sets the stage.</p></div>
          <div class="wss-disciplines" aria-label="Project areas"><span>01 / VISUAL IDENTITY</span><span>02 / MOTION</span><span>03 / STAGECRAFT</span><button type="button" data-jump="wss-interaction">04 / INTERACTION <span aria-hidden="true">↗</span></button></div>
        </header>
        <section class="wss-graphic wss-pad" aria-labelledby="wss-graphic-title">
          <div class="wss-graphic-intro"><span class="wss-eyebrow">I / THE GRAPHIC LANGUAGE</span><h2 id="wss-graphic-title">Thoughts<br>too loud.<br><em>Let it flow.</em></h2><p>Repeated words, electric colour, a stage built around the question.</p></div>
          <figure class="wss-panorama">${image('wss-stage',1000,2400,6405,2666,'WSS stage artwork: magenta and electric-blue banners surrounding the central competition screen','(max-width: 700px) 100vw, 65vw')}<figcaption><span>01 / A STAGE, COMPOSED</span><span>STAGE ARTWORK</span></figcaption></figure>
          <figure class="wss-signup">${image('wss-signup',800,1514,1514,750,'WSS signup poster: The race is on, with repeated Sign up Now typography','(max-width: 700px) 100vw, 42vw')}<figcaption><span>02 / THE INVITATION</span><span>PRINT</span></figcaption></figure>
          <div class="wss-graphic-note"><span class="wss-eyebrow">ONE IDENTITY, MULTIPLE SCALES</span><p>The same graphic language moves from an invitation to a screen, then across the stage.</p><div class="wss-colour-note" aria-label="Magenta, electric blue and black"><i></i><i></i><i></i></div></div>
        </section>
      </section>
      <section class="wss-second" id="wss-edition-two" aria-labelledby="wss2-title">
        <header class="wss-second-opening wss-pad">
          <div class="wss-second-top"><span class="wss-eyebrow">II / A DIFFERENT WORLD</span><span class="wss-eyebrow">WHO’S STILL STANDING? — SECOND EDITION</span></div>
          <div class="wss-second-type"><span class="wss-edition-word" id="wss2-title">WSS2</span><h2><span>GOOD</span><small>OR</small><em>WICKED?</em></h2><p>The same competition.<br>A new theatrical language.</p></div>
          <div class="wss-teaser-compose">${film('wss2-teaser','03 / THE TEASER · 00:13','WSS2 Good or Wicked teaser','once')}<div class="wss-teaser-credit"><span>A FAMILIAR CREST.<br>AN UNFAMILIAR WORLD.</span><span>COMPLETE ORIGINAL FILM</span></div></div>
        </header>
        <section class="wss-world-spread wss-pad" aria-labelledby="wss-world-title">
          <div class="wss-world-intro"><span class="wss-eyebrow">FROM VISUAL IDENTITY TO PHYSICAL SPACE</span><h3 id="wss-world-title">Not just<br>on screen.<br><em>In the room.</em></h3><p>Emerald machinery and pearl-pink light become a shared vocabulary for the artwork, the entrance and the stage.</p></div>
          <figure class="wss-artwork">${image('wss2-artwork',800,1376,1376,768,'Good or Wicked artwork: emerald machinery opposite pearl-pink bubbles and a castle','(max-width: 700px) 100vw, 59vw')}<figcaption><span>04 / THE WORLD, IMAGINED</span><span>MAIN VISUAL</span></figcaption></figure>
          <figure class="wss-door">${image('wss2-entrance',600,1200,3665,4886,'Illustrated green and pink entrance installed around the WSS2 doorway','(max-width: 700px) 43vw, 24vw')}<figcaption><span>05 / THE THRESHOLD</span><span>ENTRANCE</span></figcaption></figure>
          <figure class="wss-room">${image('wss2-stage',900,2000,4032,3024,'WSS2 physical stage: the main visual, green-lit gears and transparent bubbles','(max-width: 700px) 100vw, 44vw')}<figcaption><span>06 / THE WORLD, BUILT</span><span>PHYSICAL STAGE</span></figcaption></figure>
          <aside class="wss-world-notes"><div><span class="wss-eyebrow">THE SHOW STARTS<br>BEFORE THE FIRST QUESTION.</span><p>An invitation is not only information. It introduces the world you are about to enter.</p></div>${film('wss2-invitation','07 / INVITATION · 00:49','WSS2 signup film','','3 / 2')}</aside>
        </section>
      </section>
      <section class="wss-interaction wss-pad" id="wss-interaction" aria-labelledby="wss-play-title">
        <header class="wss-play-heading"><div><span class="wss-eyebrow">III / THE WORKING WEB EXPERIENCE</span><h2 id="wss-play-title">Now, take<br><em>your turn.</em></h2></div><p>The visual world becomes an interface.<br>Explore the original WSS2 website here—not a simulated demo.</p></header>
        <div class="wss-play-layout"><aside class="wss-play-guide"><div class="wss-guide-heading">HOW TO PLAY <span>↘</span></div><ol><li><b>Begin the ritual.</b><span>Choose “开启魔法仪式” in the game.</span></li><li><b>Gather sixteen.</b><span>Drag the cards sideways. Select the card in the centre, sixteen times.</span></li><li><b>Pick. Answer. Reveal.</b><span>After the shuffle, choose a card and answer before time runs out.</span></li></ol><figure class="wss-game-evidence">${image('wss2-game',900,2000,3433,2289,'A participant reaching for a card on the WSS2 display at the event','(max-width: 700px) 40vw, 20vw')}<figcaption><span>THE SAME INTERFACE,<br>AT EVENT SCALE.</span></figcaption></figure></aside>
          ${window.WSSLive.render(media, image)}
        </div>
      </section>
      <footer class="wss-end wss-pad"><div><span class="wss-eyebrow">WSS / WSS2</span><p>One question.<br><em>An entire show.</em></p></div><button type="button" data-return>BACK TO CONCEPTS <span aria-hidden="true">↙</span></button></footer>
    </article>`;
  }

  function destroy() {
    if (!mounted) return;
    const old = mounted;
    mounted = null;
    old.ready = false;
    old.live?.destroy();
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
    document.dispatchEvent(new CustomEvent('wss:closed'));
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
      if (!ctx.ready || document.hidden || ctx.live?.active) return;
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

    ctx.live = window.WSSLive.mount(article, root, () => pauseOthers(null), signal);

    ctx.chaptersObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        for (const button of article.querySelectorAll('[data-jump]')) {
          if (button.dataset.jump === entry.target.id) button.setAttribute('aria-current', 'true');
          else button.removeAttribute('aria-current');
        }
      }
    }, { root, rootMargin: '-60px 0px -70% 0px', threshold: 0 });
    for (const id of ['wss-edition-one', 'wss-edition-two', 'wss-interaction']) ctx.chaptersObserver.observe(article.querySelector(`#${id}`));

    article.addEventListener('click', event => {
      const back = event.target.closest('[data-return]');
      if (back) { event.preventDefault(); document.getElementById('backBtn').click(); return; }
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
    document.dispatchEvent(new CustomEvent('wss:opened'));
  }
  function pause() {
    if (!mounted) return;
    mounted.ready = false;
    mounted.live?.close(false);
    for (const [video, info] of mounted.videos) { info.systemPause = true; video.pause(); }
  }
  function closeInteraction() {
    if (!mounted?.live?.active && !mounted?.live?.expanded) return false;
    mounted.live.close(); return true;
  }
  window.WSSContent = { render, mount, activate, pause, destroy, closeInteraction };
})();
