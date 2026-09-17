/* WSS media lifecycle and concepts integration. Layout lives in design.js. */
(() => {
  'use strict';
  let mounted = null;
  function render(project) { return window.WSSDesign.render(project); }
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
      video.pause(); video.removeAttribute('src'); video.load();
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
    // Only cancel the fixed-canvas scale; the index and moving sheets are untouched.
    function fitContent() {
      const transform = getComputedStyle(scene).transform;
      const scale = transform === 'none' ? 1 : Math.abs(new DOMMatrixReadOnly(transform).a);
      world.style.setProperty('--wss-unscale', String(1 / Math.max(.01, scale)));
      if (scene.classList.contains('opened')) {
        const ux = 700 / Math.hypot(700, 1000), uy = -1000 / Math.hypot(700, 1000);
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
      if (!video.getAttribute('src') || video.error) { video.src = video.dataset.source; video.load(); }
    }
    function pauseOthers(except) {
      for (const [video, info] of ctx.videos) {
        if (video !== except && !video.paused) { info.systemPause = true; video.pause(); }
      }
    }
    function play(video, user = false) {
      if (mounted !== ctx || !ctx.ready) return;
      const info = ctx.videos.get(video);
      if (user) { info.userPaused = false; info.done = false; }
      if (video.ended) video.currentTime = 0;
      info.figure.querySelector('.wss-media-error').hidden = true;
      source(video); pauseOthers(video); info.systemPause = false;
      const request = video.play();
      if (request) request.catch(error => {
        if (mounted !== ctx || error.name === 'AbortError') return;
        info.toggle.textContent = 'PLAY FILM';
        if (error.name !== 'NotAllowedError') info.figure.querySelector('.wss-media-error').hidden = false;
      });
    }
    function reconsider() {
      if (!ctx.ready || document.hidden || ctx.live?.active()) return;
      const candidates = [...ctx.videos].filter(([v, info]) => v.dataset.autoplay && info.ratio >= .45 && !info.userPaused && !info.done);
      if (reduced.matches || connection?.saveData) return;
      candidates.sort((a, b) => b[1].ratio - a[1].ratio);
      const best = candidates[0];
      if (best && best[0].paused) play(best[0]);
    }
    ctx.filmsObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const video = entry.target, info = ctx.videos.get(video);
        info.ratio = entry.intersectionRatio;
        if (info.ratio < .15 && !video.paused) { info.systemPause = true; video.pause(); }
      }
      reconsider();
    }, { root, threshold: [0, .15, .45, .75, 1] });
    for (const video of article.querySelectorAll('video')) {
      const figure = video.closest('.wss-film');
      const toggle = figure.querySelector('[data-toggle]'), sound = figure.querySelector('[data-sound]');
      const info = { figure, toggle, sound, ratio: 0, userPaused: false, done: false, systemPause: false };
      ctx.videos.set(video, info); video.muted = true; ctx.filmsObserver.observe(video);
      toggle.addEventListener('click', () => {
        if (video.paused) play(video, true);
        else { info.userPaused = true; video.pause(); }
      }, { signal });
      sound.addEventListener('click', () => {
        video.muted = !video.muted;
        if (!video.muted && video.paused) play(video, true);
      }, { signal });
      video.addEventListener('pointerdown', () => source(video), { signal });
      video.addEventListener('keydown', () => source(video), { signal });
      video.addEventListener('play', () => {
        info.systemPause = false; toggle.textContent = 'PAUSE FILM';
        toggle.setAttribute('aria-label', `Pause ${video.getAttribute('aria-label')}`); pauseOthers(video);
      }, { signal });
      video.addEventListener('pause', () => {
        if (!info.systemPause && ctx.ready && !document.hidden && info.ratio >= .15) info.userPaused = true;
        info.systemPause = false;
        toggle.textContent = video.ended ? 'REPLAY FILM' : 'PLAY FILM';
        toggle.setAttribute('aria-label', `Play ${video.getAttribute('aria-label')}`);
      }, { signal });
      video.addEventListener('ended', () => { info.done = true; toggle.textContent = 'REPLAY FILM'; }, { signal });
      video.addEventListener('volumechange', () => {
        sound.textContent = video.muted ? 'SOUND OFF' : 'SOUND ON'; sound.setAttribute('aria-pressed', String(!video.muted));
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
    for (const id of ['wss-edition-one', 'wss-edition-two', 'wss-live']) ctx.chaptersObserver.observe(article.querySelector(`#${id}`));
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
    ctx.live = window.WSSLive.mount(article, root, () => pauseOthers(null));
    ctx.reconsider = reconsider;
  }
  function activate() {
    if (!mounted) return;
    mounted.ready = true; mounted.article.querySelector('h1').focus({ preventScroll: true }); mounted.reconsider();
  }
  function pause() {
    if (!mounted) return;
    mounted.ready = false; mounted.live?.stop();
    for (const [video, info] of mounted.videos) { info.systemPause = true; video.pause(); }
  }
  window.WSSContent = { render, mount, activate, pause, destroy };
})();
