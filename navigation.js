/* Navigation history + overscroll-to-index interaction. */
(() => {
  const rawOpenProject = openProject;
  const rawCloseProject = closeProject;

  const TOUCH_DEAD_ZONE = 12;
  const TOUCH_COMMIT = 84;
  const DESKTOP_DEAD_ZONE = 28;
  const DESKTOP_COMMIT = 170;
  const DESKTOP_MIN_EVENTS = 3;
  const DESKTOP_MIN_DURATION = 150;
  const WHEEL_SETTLE_MS = 120;
  const RESET_MS = 240;
  const CLOSE_MS = 1220;

  let currentProjectIndex = null;
  let pendingRouteTimer = null;
  let returnCleanupTimer = null;

  let touchActive = false;
  let touchReady = false;
  let touchLastY = 0;
  let touchPull = 0;

  let wheelAccum = 0;
  let wheelEvents = 0;
  let wheelStartedAt = 0;
  let wheelTimer = null;

  function indexUrl(){
    return `${location.pathname}${location.search}`;
  }

  function projectIndexFromHash(hash=location.hash){
    const slug=decodeURIComponent((hash || "").replace(/^#/,""));
    return projects.findIndex(p=>p.slug===slug);
  }

  function projectUrl(i){
    return `#${encodeURIComponent(projects[i].slug)}`;
  }

  function currentScale(){
    const rect=scene.getBoundingClientRect();
    return rect.height ? rect.height/1024 : 1;
  }

  function pullVisualPx(raw,deadZone,commit){
    const effective=Math.max(0,raw-deadZone);
    const range=Math.max(1,commit-deadZone);
    const normalized=Math.min(1,effective/range);
    return 56*(1-Math.pow(1-normalized,1.7));
  }

  function setReturnPull(raw,deadZone,commit){
    const visual=pullVisualPx(raw,deadZone,commit);
    const scale=Math.max(.01,currentScale());
    scene.classList.add("return-pulling");
    scene.classList.remove("return-resetting");
    scene.style.setProperty("--return-pull",`${visual/scale}px`);
    scene.style.setProperty(
      "--return-progress",
      `${Math.min(1,Math.max(0,(raw-deadZone)/Math.max(1,commit-deadZone)))}`
    );
  }

  function clearReturnPull(immediate=false){
    if(returnCleanupTimer){
      clearTimeout(returnCleanupTimer);
      returnCleanupTimer=null;
    }

    scene.style.setProperty("--return-pull","0px");
    scene.style.setProperty("--return-progress","0");

    if(immediate){
      scene.classList.remove("return-pulling","return-resetting","return-committing");
      scene.style.removeProperty("--return-pull");
      scene.style.removeProperty("--return-progress");
      return;
    }

    scene.classList.add("return-resetting");
    returnCleanupTimer=setTimeout(()=>{
      scene.classList.remove("return-pulling","return-resetting","return-committing");
      scene.style.removeProperty("--return-pull");
      scene.style.removeProperty("--return-progress");
      returnCleanupTimer=null;
    },RESET_MS);
  }

  function prepareReturnCommit(){
    if(returnCleanupTimer){
      clearTimeout(returnCleanupTimer);
      returnCleanupTimer=null;
    }
    scene.classList.add("return-pulling","return-resetting","return-committing");
    scene.style.setProperty("--return-pull","0px");
    scene.style.setProperty("--return-progress","1");
    returnCleanupTimer=setTimeout(()=>{
      scene.classList.remove("return-pulling","return-resetting","return-committing");
      scene.style.removeProperty("--return-pull");
      scene.style.removeProperty("--return-progress");
      returnCleanupTimer=null;
    },CLOSE_MS);
  }

  function rememberIndexState(){
    const prior=history.state && typeof history.state==="object" ? history.state : {};
    history.replaceState(
      {...prior,conceptsView:"index",indexScrollY:window.scrollY || 0},
      "",
      indexUrl()
    );
  }

  function restoreIndexState(){
    const y=history.state && Number.isFinite(history.state.indexScrollY)
      ? history.state.indexScrollY
      : 0;
    requestAnimationFrame(()=>window.scrollTo(0,y));
  }

  function openProjectFromRoute(i){
    if(i<0 || i>=projects.length) return;

    if(state==="index"){
      clearReturnPull(true);
      active=i;
      scanY=512;
      setScanStyle(i);
      currentProjectIndex=i;
      rawOpenProject();
      return;
    }

    if(state==="opened" && currentProjectIndex===i) return;

    if(state==="opened"){
      rawCloseProject();
      currentProjectIndex=null;
      scheduleRouteSync(CLOSE_MS);
      return;
    }

    scheduleRouteSync(140);
  }

  function closeProjectFromRoute(){
    if(state==="opened"){
      rawCloseProject();
      currentProjectIndex=null;
      setTimeout(restoreIndexState,CLOSE_MS);
      return;
    }

    if(state==="index"){
      clearReturnPull(true);
      restoreIndexState();
      return;
    }

    scheduleRouteSync(140);
  }

  function syncRoute(){
    if(pendingRouteTimer){
      clearTimeout(pendingRouteTimer);
      pendingRouteTimer=null;
    }

    const i=projectIndexFromHash();
    if(i>=0) openProjectFromRoute(i);
    else closeProjectFromRoute();
  }

  function scheduleRouteSync(delay=140){
    if(pendingRouteTimer) clearTimeout(pendingRouteTimer);
    pendingRouteTimer=setTimeout(()=>{
      pendingRouteTimer=null;
      syncRoute();
    },delay);
  }

  function navigateToIndex({fromGesture=false}={}){
    if(state==="index" && projectIndexFromHash()<0) return;

    if(fromGesture) prepareReturnCommit();

    const hs=history.state && typeof history.state==="object" ? history.state : {};
    if(hs.conceptsView==="project" && hs.fromIndex===true){
      history.back();
      return;
    }

    history.replaceState(
      {conceptsView:"index",indexScrollY:0},
      "",
      indexUrl()
    );
    syncRoute();
  }

  openProject=function(){
    if(state!=="index" || active===null) return;

    const i=active;
    rememberIndexState();
    history.pushState(
      {conceptsView:"project",slug:projects[i].slug,fromIndex:true},
      "",
      projectUrl(i)
    );
    currentProjectIndex=i;
    rawOpenProject();
  };

  closeProject=function(){
    navigateToIndex();
  };

  backBtn.addEventListener("click",e=>{
    if(state!=="opened") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    navigateToIndex();
  },true);

  window.addEventListener("popstate",()=>{
    if(!scene.classList.contains("return-committing")) clearReturnPull(true);
    syncRoute();
  });

  function resetTouch(){
    touchActive=false;
    touchReady=false;
    touchLastY=0;
    touchPull=0;
  }

  projectScroll.addEventListener("touchstart",e=>{
    if(state!=="opened" || e.touches.length!==1){
      resetTouch();
      return;
    }

    touchActive=true;
    touchReady=projectScroll.scrollTop<=.5;
    touchLastY=e.touches[0].clientY;
    touchPull=0;
  },{passive:true});

  projectScroll.addEventListener("touchmove",e=>{
    if(!touchActive || state!=="opened" || e.touches.length!==1) return;

    const y=e.touches[0].clientY;
    const delta=y-touchLastY;
    touchLastY=y;

    if(!touchReady){
      if(projectScroll.scrollTop<=.5 && delta>0) touchReady=true;
      else return;
    }

    if(projectScroll.scrollTop>.5 && touchPull<=0){
      touchReady=false;
      return;
    }

    touchPull=Math.max(0,touchPull+delta);
    if(touchPull>0){
      e.preventDefault();
      setReturnPull(touchPull,TOUCH_DEAD_ZONE,TOUCH_COMMIT);
    }
  },{passive:false});

  function finishTouch(){
    if(!touchActive) return;
    const shouldReturn=touchReady && touchPull>=TOUCH_COMMIT && state==="opened";
    resetTouch();
    if(shouldReturn) navigateToIndex({fromGesture:true});
    else clearReturnPull();
  }

  projectScroll.addEventListener("touchend",finishTouch,{passive:true});
  projectScroll.addEventListener("touchcancel",()=>{
    resetTouch();
    clearReturnPull();
  },{passive:true});

  function resetWheel(cancelVisual=true){
    wheelAccum=0;
    wheelEvents=0;
    wheelStartedAt=0;
    if(wheelTimer){
      clearTimeout(wheelTimer);
      wheelTimer=null;
    }
    if(cancelVisual) clearReturnPull();
  }

  function normalizedWheelDelta(e){
    const unit=e.deltaMode===1 ? 16 : e.deltaMode===2 ? window.innerHeight : 1;
    return Math.abs(e.deltaY)*unit;
  }

  projectScroll.addEventListener("wheel",e=>{
    if(state!=="opened"){
      resetWheel(false);
      return;
    }

    if(projectScroll.scrollTop>.5 || e.deltaY>=0){
      if(wheelAccum>0) resetWheel();
      return;
    }

    e.preventDefault();

    const now=performance.now();
    if(!wheelStartedAt) wheelStartedAt=now;
    wheelAccum+=normalizedWheelDelta(e);
    wheelEvents+=1;
    setReturnPull(wheelAccum,DESKTOP_DEAD_ZONE,DESKTOP_COMMIT);

    if(wheelTimer) clearTimeout(wheelTimer);
    wheelTimer=setTimeout(()=>{
      const duration=performance.now()-wheelStartedAt;
      const shouldReturn=
        state==="opened" &&
        projectScroll.scrollTop<=.5 &&
        wheelAccum>=DESKTOP_COMMIT &&
        wheelEvents>=DESKTOP_MIN_EVENTS &&
        duration>=DESKTOP_MIN_DURATION;

      wheelTimer=null;
      wheelAccum=0;
      wheelEvents=0;
      wheelStartedAt=0;

      if(shouldReturn) navigateToIndex({fromGesture:true});
      else clearReturnPull();
    },WHEEL_SETTLE_MS);
  },{passive:false});

  const initialIndex=projectIndexFromHash();
  if(initialIndex>=0){
    const prior=history.state && typeof history.state==="object" ? history.state : {};
    history.replaceState(
      {...prior,conceptsView:"project",slug:projects[initialIndex].slug,fromIndex:false},
      "",
      location.href
    );
    requestAnimationFrame(()=>openProjectFromRoute(initialIndex));
  }else{
    history.replaceState(
      {conceptsView:"index",indexScrollY:window.scrollY || 0},
      "",
      indexUrl()
    );
  }
})();
