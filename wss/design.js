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
    return `<article class="wss-story wss-showbook" aria-labelledby="wss-title" data-design="showbook-v3">
      <nav class="wss-bar" aria-label="WSS project navigation"><span class="wss-brand">WSS / WSS2 <span>— SHOWBOOK</span></span><div class="wss-chapter-links"><button data-jump="wss-edition-one" aria-current="true">I. WSS</button><button data-jump="wss-edition-two">II. WSS2</button><button data-jump="wss-live">IN PLAY</button></div><button data-return class="wss-return" aria-label="Back to concepts">INDEX <span aria-hidden="true">×</span></button></nav>
      <section id="wss-edition-one" class="wss-act-one" aria-labelledby="wss-title">
        <header class="wss-cover wss-pad">
          <div class="wss-running"><span>01 / LIVE QUIZ COMPETITION</span><span>TWO EDITIONS. ONE QUESTION.</span></div>
          <div class="wss-cover-copy"><p class="wss-eyebrow">WHO’S STILL STANDING?</p><h1 id="wss-title" tabindex="-1">WHO’S <br>STILL<br>STANDING<span>?</span></h1><p class="wss-statement">${esc(project.statement)}</p></div>
          <div class="wss-cover-screen"><div class="wss-edition-line"><strong>WSS</strong><span>ACT I<br>TURN UP THE VOLUME.</span></div>${film('wss-intro','OPENING SEQUENCE','00:09','loop')}<p class="wss-cover-note">Type sets the rhythm.<br><em>Colour sets the stage.</em></p></div>
          <div class="wss-dimensions"><span>IDENTITY</span><span>INVITATION</span><span>STAGECRAFT</span><button data-jump="wss-live">INTERACTION ↗</button></div>
        </header>
        <div class="wss-graphic-spread wss-pad">
          <header class="wss-graphic-note"><p class="wss-eyebrow">I / THE GRAPHIC LANGUAGE</p><h2>Not just<br>a question.<br><em>A signal.</em></h2><p>The same pulse runs through the invitation, the opening and the stage.</p></header>
          <figure class="wss-stage-sheet">${pic('wss-stage',1000,2400,6405,2666,'WSS stage artwork with repeated type and magenta and blue stage panels')}${caption('A','THE STAGE, COMPOSED / ARTWORK')}</figure>
          <figure class="wss-invite-sheet">${pic('wss-signup',800,1514,1514,750,'WSS signup graphic, with repeated Sign up Now lettering','(max-width: 700px) 85vw, 40vw')}${caption('B','THE SAME LANGUAGE / INVITATION')}</figure>
          <p class="wss-graphic-aside"><span>REPEAT.<br>AMPLIFY.<br>ASSEMBLE.</span>From a graphic on a screen<br>to a screen on a stage.</p>
        </div>
      </section>
      <section id="wss-edition-two" class="wss-act-two" aria-labelledby="wss2-title">
        <div class="wss-overture wss-pad">
          <div class="wss-running"><span>ACT II / A CHANGE OF WORLD</span><span id="wss2-title">WSS2</span></div>
          <header class="wss-duality"><span class="wss-eyebrow">THE SAME QUESTION.</span><h2><em>Good.</em><small>OR</small>Wicked.</h2><p>A new visual world.<br>Before the first question.</p><span class="wss-overture-mark" aria-hidden="true">II</span></header>
          <div class="wss-teaser-composition">${film('wss2-teaser','THE TEASER','00:13','once')}<div class="wss-overture-notes"><span>THE CREST CHANGES.<br>THE WORLD FOLLOWS.</span><p>The second edition begins with a transformation, not an explanation.</p></div></div>
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
          <div class="wss-running"><span>WSS2 / INTERACTION</span><span>THE ORIGINAL WEB EXPERIENCE</span></div>
          <div class="wss-live-heading"><h2 id="wss-live-title">The show was<br><em>also software.</em></h2><p>Not a recording. Open the original WSS2 inside this page, then collect cards and play a question.</p></div>
          <div class="wss-play-grid">
            <aside class="wss-play-guide"><span class="wss-eyebrow">TAKE THE CONTROLS</span><ol><li><b>01</b><span>Start the ritual.<small>开启魔法仪式</small></span></li><li><b>02</b><span>Collect 16 cards.<small>Tap the central card to gather it.</small></span></li><li><b>03</b><span>Choose. Answer.<small>Pick a card, answer, then return.</small></span></li></ol><p>Mouse or touch.<br>No camera required.</p><a href="https://shhh-hoo.github.io/WSS2/" target="_blank" rel="noopener noreferrer">ORIGINAL LANDING ↗</a></aside>
            <div class="wss-live-slot"><dialog open class="wss-live-panel" aria-label="WSS2 interactive workspace">
              <div class="wss-live-toolbar"><span>WSS2 <small>/ LIVE WEBSITE</small></span><div><button type="button" data-live-expand aria-expanded="false">EXPAND ↗</button><button type="button" data-live-stop hidden>STOP ×</button></div></div>
              <div class="wss-live-viewport"><div class="wss-live-cover">${pic('wss2-live',900,1600,1200,810,'Preview of the original WSS2 card-selection screen. Activate to interact.')}<div class="wss-live-cover-text"><span>THE ORIGINAL APPLICATION</span><button type="button" data-live-start>ENTER THE INTERACTION <span aria-hidden="true">↗</span></button><p>Loads the live website. Internet required.</p></div></div><div data-live-frame class="wss-frame-mount"></div></div>
              <div class="wss-live-bottom"><p data-live-status aria-live="polite">Activate to begin. The surrounding page stays yours.</p><button type="button" data-live-retry hidden>RELOAD</button><a href="https://shhh-hoo.github.io/WSS2/wss2.html" target="_blank" rel="noopener noreferrer">OPEN ORIGINAL ↗</a></div>
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
