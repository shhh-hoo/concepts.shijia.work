(() => {
  const mobileQuery=window.matchMedia("(max-width:699px)");
  if(!mobileQuery.matches) return;

  const viewport=document.getElementById("viewport");
  const scene=document.getElementById("scene");
  const scanWorld=document.getElementById("scanWorld");
  const hit=document.getElementById("mobileScanHit");
  if(!viewport || !scene || !scanWorld || !hit) return;

  const MOVE_LIMIT=10;
  const TAP_MAX_MS=520;
  const HOLD_MS=1050;

  let pointer=null;
  let holdTimer=0;
  let opening=false;

  const projectActive=()=>
    scene.classList.contains("mobile-scan-active") &&
    scanWorld.classList.contains("show") &&
    !scanWorld.classList.contains("intro-magnifier") &&
    !scene.classList.contains("opened");

  function clearHold(){
    if(holdTimer){
      clearTimeout(holdTimer);
      holdTimer=0;
    }
  }

  function enterActiveProject(){
    if(opening || !projectActive()) return;
    opening=true;
    clearHold();

    // Reuse the existing, already-tested mobile project-open path. This is a
    // single synchronous click, not a recurring timer or observer loop.
    hit.click();

    // If opening was rejected because ownership changed on the same frame,
    // release the guard. Otherwise the opened state makes projectActive false.
    queueMicrotask(()=>{
      opening=scene.classList.contains("opened");
      if(!opening) opening=false;
    });
  }

  function cancelPointer(){
    clearHold();
    pointer=null;
  }

  viewport.addEventListener("pointerdown",e=>{
    if(!projectActive()) return;
    if(e.pointerType==="mouse" && e.button!==0) return;

    clearHold();
    pointer={
      id:e.pointerId,
      x:e.clientX,
      y:e.clientY,
      startedAt:performance.now(),
      moved:false,
      opened:false
    };

    const pointerId=e.pointerId;
    holdTimer=setTimeout(()=>{
      holdTimer=0;
      if(!pointer || pointer.id!==pointerId || pointer.moved) return;
      if(!projectActive()) return;
      pointer.opened=true;
      enterActiveProject();
    },HOLD_MS);
  },true);

  viewport.addEventListener("pointermove",e=>{
    if(!pointer || e.pointerId!==pointer.id) return;
    const dx=e.clientX-pointer.x;
    const dy=e.clientY-pointer.y;
    if(Math.hypot(dx,dy)>MOVE_LIMIT){
      pointer.moved=true;
      clearHold();
    }
  },true);

  viewport.addEventListener("pointerup",e=>{
    if(!pointer || e.pointerId!==pointer.id) return;

    const p=pointer;
    pointer=null;
    clearHold();

    if(p.opened) return;

    const elapsed=performance.now()-p.startedAt;
    const blockedTarget=e.target.closest?.("#backBtn,#projectWorld");
    if(projectActive() && !p.moved && elapsed<=TAP_MAX_MS && !blockedTarget){
      enterActiveProject();
    }
  },true);

  viewport.addEventListener("pointercancel",cancelPointer,true);

  // Any actual scroll cancels a pending long press. There are no scroll-settle
  // timers and no ambient auto-entry timers after the finger leaves the screen.
  window.addEventListener("scroll",()=>{
    if(pointer) pointer.moved=true;
    clearHold();
  },{passive:true});

  // Prevent the browser context menu from competing with the deliberate
  // project long-press gesture. Intro and opened project pages are unaffected.
  viewport.addEventListener("contextmenu",e=>{
    if(projectActive()) e.preventDefault();
  },true);
})();
