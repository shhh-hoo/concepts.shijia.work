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
  const SETTLE_MS=220;
  const DWELL_MS=1300;

  let pointer=null;
  let autoTimer=0;
  let lastScrollAt=0;
  let suppressAutoUntilGesture=false;

  const projectActive=()=>
    scene.classList.contains("mobile-scan-active") &&
    scanWorld.classList.contains("show") &&
    !scanWorld.classList.contains("intro-magnifier") &&
    !scene.classList.contains("opened");

  const projectKey=()=>projectActive() ? (scanWorld.dataset.slug || "project") : null;

  function clearAuto(){
    if(autoTimer){
      clearTimeout(autoTimer);
      autoTimer=0;
    }
  }

  function enterActiveProject(){
    if(!projectActive()) return;
    clearAuto();
    suppressAutoUntilGesture=true;

    // Reuse the existing mobile project-open path. This is a single synchronous
    // click; there is no observer, polling loop, or repeating timer.
    hit.click();
  }

  function armDwellAfterSettle(){
    clearAuto();
    if(suppressAutoUntilGesture) return;

    autoTimer=setTimeout(()=>{
      autoTimer=0;
      if(suppressAutoUntilGesture || !projectActive()) return;

      const key=projectKey();
      if(!key) return;
      const settledAt=performance.now();

      autoTimer=setTimeout(()=>{
        autoTimer=0;
        if(suppressAutoUntilGesture || !projectActive()) return;
        if(projectKey()!==key) return;
        if(performance.now()-lastScrollAt < SETTLE_MS+DWELL_MS-20) return;
        if(performance.now()-settledAt < DWELL_MS-20) return;
        enterActiveProject();
      },DWELL_MS);
    },SETTLE_MS);
  }

  viewport.addEventListener("pointerdown",e=>{
    if(e.pointerType==="mouse" && e.button!==0) return;

    // A fresh physical gesture re-enables dwell after returning from a project.
    if(!scene.classList.contains("opened")) suppressAutoUntilGesture=false;
    clearAuto();

    if(!projectActive()){
      pointer=null;
      return;
    }

    pointer={
      id:e.pointerId,
      x:e.clientX,
      y:e.clientY,
      startedAt:performance.now(),
      moved:false
    };
  },true);

  viewport.addEventListener("pointermove",e=>{
    if(!pointer || e.pointerId!==pointer.id) return;
    const dx=e.clientX-pointer.x;
    const dy=e.clientY-pointer.y;
    if(Math.hypot(dx,dy)>MOVE_LIMIT){
      pointer.moved=true;
      clearAuto();
    }
  },true);

  viewport.addEventListener("pointerup",e=>{
    if(!pointer || e.pointerId!==pointer.id) return;

    const p=pointer;
    pointer=null;

    const elapsed=performance.now()-p.startedAt;
    const blockedTarget=e.target.closest?.("#backBtn,#projectWorld");
    if(projectActive() && !p.moved && elapsed<=TAP_MAX_MS && !blockedTarget){
      enterActiveProject();
      return;
    }

    // A drag will also generate scroll events; those own dwell scheduling.
  },true);

  viewport.addEventListener("pointercancel",()=>{
    pointer=null;
    clearAuto();
  },true);

  window.addEventListener("scroll",()=>{
    lastScrollAt=performance.now();
    clearAuto();

    if(pointer) pointer.moved=true;
    if(suppressAutoUntilGesture) return;

    // mobile-v2 updates the active scan in rAF. Waiting for settle ensures the
    // candidate is taken only after momentum and scan ownership have stabilized.
    armDwellAfterSettle();
  },{passive:true});

  window.addEventListener("resize",()=>{
    clearAuto();
    pointer=null;
  },{passive:true});

  // Long-press context menus are not useful while the project scan owns the
  // screen and can interfere with tap/scroll gesture recognition.
  viewport.addEventListener("contextmenu",e=>{
    if(projectActive()) e.preventDefault();
  },true);
})();
