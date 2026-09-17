/* WSS-only mobile history bridge. The existing mobile controller still owns
   entry, close, scan geometry, tap/dwell and pull-to-index gestures. */
(() => {
  if (!matchMedia('(max-width:699px)').matches) return;
  let applying = false, ownsEntry = false;
  const isWSS = () => !!document.querySelector('.wss-story');
  const open = () => { if (state !== 'index') return; active = 0; document.getElementById('mobileScanHit')?.click(); };
  document.addEventListener('wss:opened', () => {
    if (applying || location.hash === '#wss') return;
    // set_content test pages lack a navigable origin; never fake history there.
    if (location.protocol === 'about:') return;
    history.pushState({wssMobile:true}, '', '#wss'); ownsEntry = true;
  });
  document.addEventListener('wss:closed', () => {
    if (applying || location.hash !== '#wss') return;
    if (ownsEntry) { ownsEntry = false; history.back(); }
    else history.replaceState(null, '', location.pathname + location.search);
  });
  window.addEventListener('popstate', () => {
    applying = true;
    if (location.hash === '#wss') { ownsEntry = true; open(); }
    else if (isWSS()) { ownsEntry = false; document.getElementById('backBtn')?.click(); }
    applying = false;
  });
  if (location.hash === '#wss') requestAnimationFrame(() => { applying=true; open(); applying=false; });
})();
