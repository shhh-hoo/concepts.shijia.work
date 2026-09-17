(() => {
  const mobileQuery=window.matchMedia("(max-width:699px)");
  if(!mobileQuery.matches) return;

  const viewport=document.getElementById("viewport");
  const scene=document.getElementById("scene");
  const scanWorld=document.getElementById("scanWorld");
  const hit=document.getElementById("mobileScanHit");
  if(!viewport || !scene || !scanWorld || !hit) return;

  const TAP_MOVE=10;
  const TAP_MAX_MS=520;
  const SCROLL_SETTLE_MS=220;
  const DWELL_MS=1350;

  let pointer=null;
  let dwellTimer=0;
  let settleTimer=0;
  let lastProjectKey=null;
  let lastScrollAt=performance.now();
  let suppressDwellUntilScroll=false;
  let wasOpened=scene.classList.contains("opened");

  const projectActive=()=>
    scene.classList.contains("mobile-scan-active") &&
    scanWorld.classList.contains("show") &&
    !scanWorld.classList.contains("intro-magnifier") &&
    !scene.classList.contains("opened");

  const projectKey=()=>projectActive() ? (scanWorld.dataset.slug || "project") : null;

  function clearTimers(){
    if(dwellTimer){clearTimeout(dwellTimer);dwellTimer=0;}
    if(settleTimer){clearTimeout(settleTimer);settleTimer=0;}
    scene.classList.remove("mobile-dwell-arming");
  }

  function enterActiveProject(){
    if(!projectActive()) return;
    clearTimers();
    hit.click();
  }

  function armDwell(){
    clearTimers();
    if(suppressDwellUntilScroll || !projectActive()) return;

    const key=projectKey();
    if(!key) return;
    lastProjectKey=key;
    scene.classList.add("mobile-dwell-arming");

    dwellTimer=setTimeout(()=>{
      dwellTimer=0;
      scene.classList.remove("mobile-dwell-arming");
      if(!projectActive()) return;
      if(projectKey()!==key) return;
      if(performance.now()-lastScrollAt<SCROLL_SETTLE_MS) return;
      enterActiveProject();
    },DWELL_MS);
  }

  function scheduleDwell(){
    if(suppressDwellUntilScroll || !projectActive()){
      clearTimers();
      return;
    }
    if(settleTimer) clearTimeout(settleTimer);
    settleTimer=setTimeout(()=>{
      settleTimer=0;
      armDwell();
    },SCROLL_SETTLE_MS);
  }

  function cancelForInteraction(){
    clearTimers();
  }

  window.addEventListener("scroll",()=>{
    lastScrollAt=performance.now();
    suppressDwellUntilScroll=false;
    cancelForInteraction();
    scheduleDwell();
  },{passive:true});

  viewport.addEventListener("pointerdown",e=>{
    if(!projectActive()) return;
    if(e.pointerType==="mouse" && e.button!==0) return;
    pointer={
      id:e.pointerId,
      x:e.clientX,
      y:e.clientY,
      t:performance.now(),
      moved:false,
      startedOnHit:!!e.target.closest?.("#mobileScanHit")
    };
    cancelForInteraction();
  },true);

  viewport.addEventListener("pointermove",e=>{
    if(!pointer || e.pointerId!==pointer.id) return;
    const dx=e.clientX-pointer.x;
    const dy=e.clientY-pointer.y;
    if(Math.hypot(dx,dy)>TAP_MOVE){
      pointer.moved=true;
      cancelForInteraction();
    }
  },true);

  viewport.addEventListener("pointerup",e=>{
    if(!pointer || e.pointerId!==pointer.id) return;
    const p=pointer;
    pointer=null;

    const elapsed=performance.now()-p.t;
    const blockedTarget=e.target.closest?.("#backBtn,#projectWorld");

    if(projectActive() && !p.moved && elapsed<=TAP_MAX_MS && !blockedTarget){
      // The old scan-band button already handles taps that start on the band.
      // Everywhere else, synthesize the same button click so all open/close
      // behavior stays owned by the existing mobile implementation.
      if(!p.startedOnHit) enterActiveProject();
      return;
    }

    scheduleDwell();
  },true);

  viewport.addEventListener("pointercancel",()=>{
    pointer=null;
    scheduleDwell();
  },true);

  // Avoid the browser's context-menu path from fighting with the mobile dwell
  // interaction while a project owns the scan.
  viewport.addEventListener("contextmenu",e=>{
    if(projectActive()) e.preventDefault();
  },true);

  const observer=new MutationObserver(()=>{
    const opened=scene.classList.contains("opened");
    if(wasOpened && !opened){
      // Returning from a project should never immediately auto-open it again.
      suppressDwellUntilScroll=true;
      clearTimers();
    }
    wasOpened=opened;

    const key=projectKey();
    if(key!==lastProjectKey){
      lastProjectKey=key;
      clearTimers();
      scheduleDwell();
      return;
    }

    if(!projectActive()) clearTimers();
  });

  observer.observe(scene,{attributes:true,attributeFilter:["class"]});
  observer.observe(scanWorld,{attributes:true,attributeFilter:["class","data-slug"]});
})();
