/* The original cross-origin application is loaded only after a deliberate action.
   Removing the iframe destroys its browsing context; no imitation game is used. */
(() => {
  'use strict';
  const ORIGIN = 'https://shhh-hoo.github.io/WSS2/';
  const entries = Object.freeze({game: `${ORIGIN}wss2.html`, landing: ORIGIN});
  function render(media, image) {
    return `<div class="wss-live" aria-label="Original WSS2 interactive website">
      <div class="wss-live-toolbar"><span class="wss-live-title">ORIGINAL WSS2</span><button type="button" data-web-open>PLAY HERE ↗</button><button type="button" data-web-stop hidden>CLOSE ×</button><div class="wss-live-tabs" aria-label="Original website entry points"><button type="button" data-web-entry="landing" aria-pressed="false">LANDING</button><button type="button" data-web-entry="game" aria-pressed="true">GAME</button></div><button type="button" class="wss-live-expand" data-web-expand aria-expanded="false">EXPAND ↗</button></div>
      <div class="wss-live-stage"><div class="wss-live-idle">${image('wss2-web',600,1200,1200,810,'The real WSS2 card-selection interface. Activate below to enter the original website.','(max-width: 700px) 100vw, 72vw')}<div class="wss-live-invite"><p>A card.<br>A question.<br>Your move.</p><button type="button" data-web-start>ENTER THE GAME ↗</button></div></div><div class="wss-live-screen" hidden></div></div>
      <div class="wss-live-bottom"><span data-web-status role="status">LIVE WEBSITE · LOADS ON REQUEST</span><button type="button" data-web-close hidden>CLOSE INTERACTION ×</button><a href="${entries.game}" data-web-external target="_blank" rel="noopener noreferrer">OPEN IN NEW TAB ↗</a></div>
      <p class="wss-live-notice" data-web-notice hidden>The original site is taking a moment. Use “Open in new tab” if it does not appear.</p>
    </div>`;
  }
  function mount(article, root, pauseMedia, signal) {
    const host = article.querySelector('.wss-live');
    const screen = host.querySelector('.wss-live-screen');
    const idle = host.querySelector('.wss-live-idle');
    const status = host.querySelector('[data-web-status]');
    const notice = host.querySelector('[data-web-notice]');
    const closeButton = host.querySelector('[data-web-close]');
    const expandButton = host.querySelector('[data-web-expand]');
    const startButton = host.querySelector('[data-web-start]');
    let frame = null, expanded = false, timer = 0, savedScroll = 0, selected = 'game';
    let disposed = false;
    function cancelTimer() { clearTimeout(timer); timer = 0; }
    function expand(enable) {
      if (enable === expanded) return;
      if (enable) savedScroll = root.scrollTop;
      expanded = enable;
      host.classList.toggle('is-expanded', enable);
      expandButton.setAttribute('aria-expanded', String(enable));
      expandButton.textContent = enable ? 'SHRINK ↙' : 'EXPAND ↗';
      root.style.overflow = enable ? 'hidden' : '';
      if (!enable) root.scrollTop = savedScroll;
    }
    function close(focus = true) {
      cancelTimer();
      if (frame) { frame.remove(); frame = null; }
      expand(false);
      screen.hidden = true;
      idle.hidden = false;
      closeButton.hidden = true;
      host.querySelector('[data-web-stop]').hidden = true;
      host.querySelector('[data-web-open]').hidden = false;
      notice.hidden = true;
      host.classList.remove('is-active');
      status.textContent = 'LIVE WEBSITE · LOADS ON REQUEST';
      if (focus && !disposed) startButton.focus({preventScroll:true});
    }
    function start(entry = selected) {
      if (disposed || !entries[entry]) return;
      close(false);
      selected = entry;
      pauseMedia();
      for (const button of host.querySelectorAll('[data-web-entry]')) button.setAttribute('aria-pressed', String(button.dataset.webEntry === entry));
      frame = document.createElement('iframe');
      frame.title = entry === 'game' ? 'Original WSS2 quiz application' : 'Original WSS2 landing page';
      frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-pointer-lock');
      frame.setAttribute('allow',"fullscreen; camera 'none'; microphone 'none'");
      frame.referrerPolicy = 'strict-origin-when-cross-origin';
      frame.src = entries[entry];
      const ownFrame = frame;
      frame.addEventListener('load', () => {
        if (disposed || frame !== ownFrame) return;
        cancelTimer();
        // A cross-origin load event is not proof of application readiness.
        status.textContent = 'ORIGINAL WEBSITE · INTERACT ABOVE';
      }, {once:true});
      screen.hidden = false;
      idle.hidden = true;
      closeButton.hidden = false;
      host.querySelector('[data-web-stop]').hidden = false;
      host.querySelector('[data-web-open]').hidden = true;
      host.classList.add('is-active');
      status.textContent = 'LOADING ORIGINAL WEBSITE…';
      host.querySelector('[data-web-external]').href = entries[entry];
      screen.appendChild(frame);
      timer = setTimeout(() => { if (frame === ownFrame) notice.hidden = false; }, 12000);
      // Full-height native mobile viewport, not a scaled-down desktop canvas.
      if (matchMedia('(max-width:699px)').matches) expand(true);
      else host.scrollIntoView({block:'nearest',behavior:'instant'});
      closeButton.focus({preventScroll:true});
    }
    host.addEventListener('click', event => {
      if (event.target.closest('[data-web-start],[data-web-open]')) start();
      const entry = event.target.closest('[data-web-entry]');
      if (entry) start(entry.dataset.webEntry);
      if (event.target.closest('[data-web-close],[data-web-stop]')) close();
      if (event.target.closest('[data-web-expand]')) expand(!expanded);
    }, {signal});
    // Escape outside the cross-origin frame closes this interaction first.
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape' && (frame || expanded)) {
        event.preventDefault(); event.stopImmediatePropagation(); close();
      }
    }, {signal,capture:true});
    const observer = new IntersectionObserver(entries => {
      if (frame && !expanded && !entries[0].isIntersecting) close(false);
    }, {root,threshold:0});
    observer.observe(host);
    return {
      get active() { return !!frame; }, get expanded() { return expanded; }, close,
      destroy() { disposed=true; observer.disconnect(); close(false); }
    };
  }
  window.WSSLive = Object.freeze({render,mount});
})();
