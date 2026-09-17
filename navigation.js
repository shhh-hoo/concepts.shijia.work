/* Navigation history + touch overscroll-to-index interaction. */
(() => {
  const rawOpenProject = openProject;
  const rawCloseProject = closeProject;

  const TOUCH_INTENT = 3;
  const TOUCH_COMMIT = 84;
  const RESET_MS = 180;
  const CLOSE_MS = 1220;

  let currentProjectIndex = null;
  let pendingRouteTimer = null;
  let returnCleanupTimer = null;

  let touchSession = null;
  const activeTouchMoveOptions = {passive:false};

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

  function setReturnPull(screenPx){
    const scale=Math.max(.01,currentScale());
    const pull=Math.max(0,screenPx);

    scene.classList.add("return-pulling");
    scene.classList.remove("return-resetting","return-committing");
    scene.style.setProperty("--return-pull",`${pull/scale}px`);
    scene.style.setProperty(
      "--return-progress",
      `${Math.min(1,pull/TOUCH_COMMIT)}`
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

    scene.classList.add("return-pulling","return-committing");
    scene.classList.remove("return-resetting");
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
    endTouchSession({cancelVisual:false});
    if(!scene.classList.contains("return-committing")) clearReturnPull(true);
    syncRoute();
  });

  /*
    Keep normal scrolling compositor-native:
    - there is no wheel listener at all
    - there is no permanent non-passive touchmove listener
    - a non-passive touchmove listener exists only for a gesture that STARTS
      while the project scroller is already at its top boundary
  */
  function removeActiveTouchMove(){
    projectScroll.removeEventListener("touchmove",onTopTouchMove,activeTouchMoveOptions);
  }

  function endTouchSession({cancelVisual=true}={}){
    removeActiveTouchMove();
    touchSession=null;
    if(cancelVisual) clearReturnPull();
  }

  function onTopTouchMove(e){
    if(!touchSession || state!=="opened" || e.touches.length!==1){
      endTouchSession();
      return;
    }

    const total=e.touches[0].clientY-touchSession.startY;

    if(!touchSession.engaged){
      if(total<=-TOUCH_INTENT){
        // This is a normal swipe into the project. Stop observing immediately
        // so the rest of the gesture stays on the browser's native scroll path.
        endTouchSession({cancelVisual:false});
        return;
      }

      if(total<TOUCH_INTENT) return;
      touchSession.engaged=true;
    }

    // Once the user has deliberately pulled beyond the top boundary,
    // own only this gesture. Movement is linear: finger pixels == screen pixels.
    e.preventDefault();
    touchSession.pull=Math.max(0,total);
    setReturnPull(touchSession.pull);
  }

  projectScroll.addEventListener("touchstart",e=>{
    if(state!=="opened" || e.touches.length!==1 || projectScroll.scrollTop>.5){
      return;
    }

    endTouchSession({cancelVisual:false});
    touchSession={
      startY:e.touches[0].clientY,
      pull:0,
      engaged:false
    };
    projectScroll.addEventListener("touchmove",onTopTouchMove,activeTouchMoveOptions);
  },{passive:true});

  projectScroll.addEventListener("touchend",()=>{
    if(!touchSession) return;

    const shouldReturn=
      touchSession.engaged &&
      touchSession.pull>=TOUCH_COMMIT &&
      state==="opened";

    removeActiveTouchMove();
    touchSession=null;

    if(shouldReturn) navigateToIndex({fromGesture:true});
    else clearReturnPull();
  },{passive:true});

  projectScroll.addEventListener("touchcancel",()=>{
    if(!touchSession) return;
    endTouchSession();
  },{passive:true});

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
