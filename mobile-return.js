(() => {
  const mobileQuery=window.matchMedia("(max-width:699px)");
  if(!mobileQuery.matches) return;

  const scene=document.getElementById("scene");
  const projectScroll=document.getElementById("projectScroll");
  const backBtn=document.getElementById("backBtn");
  if(!scene || !projectScroll || !backBtn) return;

  const INTENT=4;
  const COMMIT=84;
  const RESET_MS=180;
  const COMMIT_MS=180;
  const activeMoveOptions={passive:false};

  let session=null;
  let cleanupTimer=0;
  let moveAttached=false;

  function clearCleanup(){
    if(!cleanupTimer) return;
    clearTimeout(cleanupTimer);
    cleanupTimer=0;
  }

  function removeMove(){
    if(!moveAttached) return;
    projectScroll.removeEventListener("touchmove",onTouchMove,activeMoveOptions);
    moveAttached=false;
  }

  function clearVisual(immediate=false){
    clearCleanup();
    scene.style.setProperty("--return-pull","0px");

    if(immediate){
      scene.classList.remove("return-pulling","return-resetting","return-committing");
      scene.style.removeProperty("--return-pull");
      return;
    }

    scene.classList.add("return-pulling","return-resetting");
    scene.classList.remove("return-committing");
    cleanupTimer=setTimeout(()=>{
      scene.classList.remove("return-pulling","return-resetting","return-committing");
      scene.style.removeProperty("--return-pull");
      cleanupTimer=0;
    },RESET_MS);
  }

  function endSession({reset=true}={}){
    removeMove();
    session=null;
    if(reset) clearVisual();
  }

  function setPull(px){
    const pull=Math.max(0,px);
    scene.classList.add("return-pulling");
    scene.classList.remove("return-resetting","return-committing");
    scene.style.setProperty("--return-pull",`${pull}px`);
  }

  function commitReturn(){
    clearCleanup();
    removeMove();
    session=null;

    scene.classList.add("return-pulling","return-committing");
    scene.classList.remove("return-resetting");

    cleanupTimer=setTimeout(()=>{
      cleanupTimer=0;
      // Reuse the mobile close path already owned by mobile-v2.js.
      backBtn.click();
      clearVisual(true);
    },COMMIT_MS);
  }

  function onTouchMove(e){
    if(!session || state!=="opened" || e.touches.length!==1){
      endSession();
      return;
    }

    const total=e.touches[0].clientY-session.startY;

    if(!session.engaged){
      if(total<=-INTENT){
        // Upward movement is ordinary project scrolling; relinquish immediately.
        endSession({reset:false});
        return;
      }
      if(total<INTENT) return;
      session.engaged=true;
    }

    e.preventDefault();
    session.pull=Math.max(0,total);
    setPull(session.pull);
  }

  projectScroll.addEventListener("touchstart",e=>{
    if(state!=="opened" || e.touches.length!==1 || projectScroll.scrollTop>.5) return;

    clearCleanup();
    clearVisual(true);
    removeMove();

    session={
      startY:e.touches[0].clientY,
      pull:0,
      engaged:false
    };

    projectScroll.addEventListener("touchmove",onTouchMove,activeMoveOptions);
    moveAttached=true;
  },{passive:true});

  projectScroll.addEventListener("touchend",()=>{
    if(!session) return;

    const shouldReturn=
      session.engaged &&
      session.pull>=COMMIT &&
      state==="opened";

    if(shouldReturn) commitReturn();
    else endSession();
  },{passive:true});

  projectScroll.addEventListener("touchcancel",()=>{
    if(!session) return;
    endSession();
  },{passive:true});

  window.addEventListener("resize",()=>{
    removeMove();
    session=null;
    clearVisual(true);
  },{passive:true});
})();
