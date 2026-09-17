/* An opt-in original-site embed. No simulation, app rewrite or camera access. */
(() => {
  'use strict';
  const URL = 'https://shhh-hoo.github.io/WSS2/';
  function mount(article, root, onStart) {
    const panel=article.querySelector('.wss-live-panel'), slot=panel.parentElement;
    const frameMount=panel.querySelector('[data-live-frame]'), cover=panel.querySelector('.wss-live-cover');
    const start=panel.querySelector('[data-live-start]'), stop=panel.querySelector('[data-live-stop]');
    const expand=panel.querySelector('[data-live-expand]'), retry=panel.querySelector('[data-live-retry]');
    const status=panel.querySelector('[data-live-status]');
    const abort=new AbortController(), {signal}=abort;
    let frame=null, expanded=false, savedTop=0, alive=true;
    function collapse(focus=true) {
      if (!expanded) return;
      expanded=false; panel.close(); panel.show();
      slot.style.height=''; root.scrollTop=savedTop;
      expand.textContent='EXPAND ↗'; expand.setAttribute('aria-expanded','false');
      if (focus) expand.focus({preventScroll:true});
    }
    function unload(message='Stopped. Activate to return to the original WSS2 experience.', focus=false) {
      if (frame) { frame.remove(); frame=null; }
      cover.hidden=false; stop.hidden=true; retry.hidden=true;
      panel.classList.remove('is-live'); status.textContent=message;
      if (focus) start.focus({preventScroll:true});
    }
    function activate() {
      if (frame || !alive) return;
      onStart();
      frame=document.createElement('iframe');
      frame.title='Original WSS2 — visual world and live quiz experience';
      frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-pointer-lock');
      frame.setAttribute('allow',"fullscreen; camera 'none'; microphone 'none'; autoplay 'none'");
      frame.referrerPolicy='strict-origin-when-cross-origin';
      frame.src=URL;
      frameMount.appendChild(frame);
      cover.hidden=true; stop.hidden=false; retry.hidden=false;
      panel.classList.add('is-live');
      // Cross-origin load events are not proof the application is ready.
      status.textContent='Explore the original WSS2 landing world, then enter the game inside the same frame. EXPAND keeps the same session.';
      stop.focus({preventScroll:true});
    }
    start.addEventListener('click',activate,{signal});
    stop.addEventListener('click',()=>{collapse(false);unload(undefined,true);},{signal});
    retry.addEventListener('click',()=>{unload();activate();},{signal});
    expand.addEventListener('click',()=>{
      if (expanded) {collapse();return;}
      savedTop=root.scrollTop; slot.style.height=slot.getBoundingClientRect().height+'px';
      panel.close(); panel.showModal(); expanded=true;
      expand.textContent='COLLAPSE ↙';expand.setAttribute('aria-expanded','true');expand.focus();
    },{signal});
    panel.addEventListener('cancel',e=>{e.preventDefault();collapse();},{signal});
    window.addEventListener('keydown',e=>{
      if(e.key==='Escape' && expanded){e.preventDefault();e.stopImmediatePropagation();collapse();}
    },{signal,capture:true});
    // Close is always outside the cross-origin viewport. Native Tab navigation
    // can leave the iframe; app-specific keys are not intercepted.
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden && frame) unload('Live site stopped while the page was hidden. Activate to resume.');
    },{signal});
    const observer=new IntersectionObserver(entries=>{
      if(!expanded && frame && !entries[0].isIntersecting) unload('Live site stopped offscreen. Activate to resume.');
    },{root,threshold:0});
    observer.observe(panel);
    return {
      active:()=>Boolean(frame),
      stop:()=>{collapse(false);unload();},
      destroy:()=>{alive=false;abort.abort();observer.disconnect();collapse(false);unload();panel.close();}
    };
  }
  window.WSSLive={mount};
})();
