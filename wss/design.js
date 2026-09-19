/* WSS showbook: new compositions, not the former one-asset-per-section page. */
(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL(script.dataset.mediaBase || './media/', script.src || document.baseURI);
  const src = name => window.WSS_ASSET_MAP?.[name] || new URL(name, base).href;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pic = (stem, a, b, w, h, alt, sizes='(max-width: 700px) 100vw, 60vw') => `<img src="${src(`${stem}-${a}.webp`)}" srcset="${src(`${stem}-${a}.webp`)} ${a}w, ${src(`${stem}-${b}.webp`)} ${b}w" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
  const film = (name, title, duration, auto='', ratio='16/9') => `<figure class="wss-film" data-film="${name}"><div class="wss-film-screen" style="--film-ratio:${ratio}"><video data-source="${src(name+'.mp4')}" data-autoplay="${auto}" poster="${src(name+'-poster-1600.webp')}" aria-label="${title}" width="1600" height="${ratio==='3/2'?1067:900}" preload="none" controls muted playsinline ${auto==='loop'?'loop':''}></video></div><figcaption class="wss-film-caption"><span>${title} <b>${duration}</b></span><div class="wss-film-actions"><button type="button" data-toggle aria-label="Play ${title}">PLAY FILM</button><button type="button" data-sound aria-pressed="false">SOUND OFF</button></div></figcaption><p class="wss-media-error" role="status" hidden>Film unavailable. Press Play film to retry.</p></figure>`;
  const caption = (n,text) => `<figcaption><span>${n}</span>${text}</figcaption>`;
  function render(project) {
    return `<article class="wss-story wss-showbook" aria-labelledby="wss-title" data-design="layered-landing-v4">
      <nav class="wss-bar" aria-label="WSS project navigation"><span class="wss-brand">WSS / WSS2 <span>— SHOWBOOK</span></span><div class="wss-chapter-links"><button data-jump="wss-landing" aria-current="true">BOTH</button><button data-jump="wss-edition-one">I. WSS</button><button data-jump="wss-edition-two">II. WSS2</button><button data-jump="wss-live">IN PLAY</button></div><button data-return class="wss-return" aria-label="Back to concepts">INDEX <span aria-hidden="true">×</span></button></nav>
      <section id="wss-landing" class="wss-layered-landing" aria-labelledby="wss-title">\n        <h1 id="wss-title" class="wss-sr-only">WSS / WSS2 — Who’s Still Standing?</h1>
        <div class="wss-layered-meta"><span>TWO EDITIONS / ONE SHOW</span><span>DRAG / HOVER / ← →</span></div>
        <div class="wss-reveal" data-wss-reveal role="slider" tabindex="0" aria-label="Reveal WSS and WSS2 editions" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="WSS 50% / WSS2 50%" style="--reveal:50%">
          <div class="wss-edition-layer wss-layer--wss2" aria-hidden="true">
            <div class="wss-layer-grid">
              <div class="wss-layer-index"><span>02</span><b>WSS2</b><small>SECOND EDITION</small></div>
              <div class="wss-layer-copy wss2-layer-copy"><p>THE SAME QUESTION / A DIFFERENT WORLD</p><h2><em>Good.</em><small>or</small>Wicked.</h2><span>IDENTITY BECOMES SPACE<br>SPACE BECOMES THE SHOW.</span></div>
              <figure class="wss-layer-art wss2-layer-art">${pic('wss2-artwork',800,1376,1376,768,'WSS2 Good or Wicked main visual','(max-width: 700px) 100vw, 54vw')}</figure>
              <div class="wss-layer-folio">02 / WORLD-BUILDING<br>EMERALD / PEARL / GOLD</div>
            </div>
          </div>
          <div class="wss-edition-layer wss-layer--wss" aria-hidden="true">
            <div class="wss-layer-grid">
              <div class="wss-layer-index"><span>01</span><b>WSS</b><small>FIRST EDITION</small></div>
              <div class="wss-layer-copy wss-layer-copy--wss"><p>LIVE QUIZ COMPETITION / FIRST EDITION</p><h1 tabindex="-1">WHO’S<br>STILL<br>STANDING?</h1><span>REPEAT / AMPLIFY / ASSEMBLE<br>THE QUESTION BECOMES THE STAGE.</span></div>
              <figure class="wss-layer-art wss-layer-art--wss">${pic('wss-stage',1000,2400,6405,2666,'WSS stage artwork with repeated type and magenta and blue panels','(max-width: 700px) 100vw, 56vw')}</figure>
              <div class="wss-layer-folio">01 / SIGNAL SYSTEM<br>MAGENTA / BLUE / BLACK</div>
            </div>
          </div>
          <button type="button" class="wss-edition-switch wss-edition-switch--wss" data-edition="wss" aria-label="Focus WSS first edition"><b>01</b><span>WSS</span></button>
          <button type="button" class="wss-edition-switch wss-edition-switch--wss2" data-edition="wss2" aria-label="Focus WSS2 second edition"><b>02</b><span>WSS2</span></button>
          <div class="wss-reveal-bar" data-reveal-bar aria-hidden="true"><i></i><span>DRAG</span></div>
        </div>
          <div class="wss-landing-statement"><p>${esc(project.statement)}</p><div><span>IDENTITY</span><span>INVITATION</span><span>STAGE</span><span>INTERACTION</span></div></div>
      </section>
      <section id="wss-edition-one" class="wss-act-one" aria-label="WSS first edition details">
        <div class="wss-graphic-spread wss-pad">
          <header class="wss-graphic-note"><p class="wss-eyebrow">I / THE GRAPHIC LANGUAGE</p><h2>Not just<br>a question.<br><em>A signal.</em></h2><p>The same pulse runs through the invitation, the opening and the stage.</p></header>
          <figure class="wss-stage-sheet">${pic('wss-stage',1000,2400,6405,2666,'WSS stage artwork with repeated type and magenta and blue stage panels')}${caption('A','THE STAGE, COMPOSED / ARTWORK')}</figure>
          <div class="wss-signal-film">${film('wss-intro','OPENING SEQUENCE','00:09','loop')}</div>
          <figure class="wss-invite-sheet">${pic('wss-signup',800,1514,1514,750,'WSS signup graphic, with repeated Sign up Now lettering','(max-width: 700px) 85vw, 40vw')}${caption('B','THE SAME LANGUAGE / INVITATION')}</figure>
          <p class="wss-graphic-aside"><span>REPEAT.<br>AMPLIFY.<br>ASSEMBLE.</span>From a graphic on a screen<br>to a screen on a stage.</p>
        </div>
      </section>
      <section id="wss-edition-two" class="wss-act-two" aria-label="WSS2 second edition details">
        <div class="wss-preview-transition wss-pad">
          <div class="wss-running"><span>ACT II / PREVIEW</span><span>SCREEN → ROOM</span></div>
          <header class="wss-preview-copy"><p class="wss-eyebrow">THE WORLD MOVES FIRST</p><h2>The preview<br><em>opens the door.</em></h2><p>The visual world arrives in motion before it becomes a room people enter.</p></header>
          <div class="wss-preview-film">${film('wss2-teaser','WSS2 PREVIEW','00:13','once')}<div class="wss-preview-handoff"><span>VISUAL WORLD</span><i>→</i><span>PHYSICAL STAGE</span></div></div>
        </div>
        <section class="wss-spatial wss-pad" aria-labelledby="wss-space-title">
          <div class="wss-running"><span>WSS2 / IDENTITY → SPACE</span><span>SCREEN / ROOM / THRESHOLD</span></div>
          <div class="wss-spatial-grid">
            <header class="wss-space-copy"><p class="wss-eyebrow">ONE WORLD, THREE SCALES</p><h2 id="wss-space-title">An image.<br><em>A place.</em></h2><p>The emerald and pearl-pink world extends from the main visual to the room around it.</p></header>
            <figure class="wss-world-art">${pic('wss2-artwork',800,1376,1376,768,'WSS2 Good or Wicked main visual','(max-width: 700px) 85vw, 38vw')}${caption('01','THE WORLD ON SCREEN')}</figure>
            <figure class="wss-world-room">${pic('wss2-stage',900,2000,4032,3024,'The actual WSS2 stage with gears on one side and bubbles on the other')}${caption('02','THE WORLD IN THE ROOM')}</figure>
            <div class="wss-threshold-note"><span>02 → 03</span><p>Not only what the audience sees.<br><em>What they walk into.</em></p></div>
            <figure class="wss-world-door">${pic('wss2-entrance',600,1200,3665,4886,'The green and pink entrance built around a real doorway','(max-width: 700px) 62vw, 23vw')}${caption('03','CROSSING THE THRESHOLD')}</figure>
            <div class="wss-invitation-edit"><header><p class="wss-eyebrow">THE INVITATION</p><h3>The show begins<br><em>before the show.</em></h3></header>${film('wss2-invitation','SIGNUP FILM','00:49','','3/2')}<p class="wss-small-copy">An imagined transformation of the campus. The complete invitation film, on demand.</p></div>
          </div>
        </section>
        <section id="wss-live" class="wss-live-area wss-pad" aria-labelledby="wss-live-title">
          <div class="wss-running"><span>WSS2 / INTERACTION</span><span>THE ORIGINAL EXPERIENCE</span></div>
          <div class="wss-live-heading"><h2 id="wss-live-title">Enter the world.<br><em>Then the game.</em></h2><p>The original WSS2 opens here as it was built: first the visual world, then the live quiz.</p></div>
          <div class="wss-play-grid">
            <aside class="wss-play-guide"><span class="wss-eyebrow">ORIGINAL WSS2</span><ol><li><b>01</b><span>Enter the visual world.<small>The landing page is part of the experience.</small></span></li><li><b>02</b><span>Continue into WSS2.<small>The game opens inside the same frame.</small></span></li><li><b>03</b><span>Expand if you want stage scale.<small>Your session stays in place.</small></span></li></ol><p>Mouse or touch.<br>No camera required.</p><a href="https://shhh-hoo.github.io/WSS2/" target="_blank" rel="noopener noreferrer">OPEN ORIGINAL ↗</a></aside>
            <div class="wss-live-slot"><dialog open class="wss-live-panel" aria-label="WSS2 interactive workspace">
              <div class="wss-live-toolbar"><span>WSS2 <small>/ ORIGINAL SITE</small></span><div><button type="button" data-live-expand aria-expanded="false">EXPAND ↗</button><button type="button" data-live-game hidden>GAME →</button><button type="button" data-live-stop hidden>STOP ×</button></div></div>
              <div class="wss-live-viewport"><div class="wss-live-cover">${pic('wss2-artwork',800,1376,1376,768,'Good or Wicked visual world. Activate to open the original WSS2 website.')}<div class="wss-live-cover-text"><span>THE ORIGINAL WSS2 SITE</span><button type="button" data-live-start>ENTER WSS2 <span aria-hidden="true">↗</span></button><p>Loads the original landing experience. Internet required.</p></div></div><div data-live-frame class="wss-frame-mount"></div></div>
              <div class="wss-live-bottom"><p data-live-status aria-live="polite">Activate to enter the original WSS2 experience.</p><button type="button" data-live-retry hidden>RELOAD</button><a href="https://shhh-hoo.github.io/WSS2/" target="_blank" rel="noopener noreferrer">OPEN ORIGINAL ↗</a></div>
            </dialog></div>
          </div>
          <div class="wss-in-use"><figure>${pic('wss2-game',900,2000,3433,2289,'A participant reaching for a card on the large WSS2 screen','(max-width: 700px) 68vw, 30vw')}${caption('LIVE','THE INTERFACE AT HUMAN SCALE')}</figure><p>A card.<br>A question.<br><em>A live moment.</em></p><span>IDENTITY<br>INVITATION<br>STAGE<br>INTERACTION</span></div>
        </section>
      </section>
      <footer class="wss-finale wss-pad"><p>WSS <em>/</em> WSS2</p><span>TWO EDITIONS.<br>ONE QUESTION.</span><button data-return>BACK TO CONCEPTS ↙</button></footer>
    </article>`;
  }
  window.WSSDesign = { render };
})();
