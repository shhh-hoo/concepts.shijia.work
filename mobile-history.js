(() => {
  const mobileQuery=window.matchMedia("(max-width:699px)");
  if(!mobileQuery.matches) return;

  const hit=document.getElementById("mobileScanHit");
  const backBtn=document.getElementById("backBtn");
  if(!hit || !backBtn) return;

  let routing=false;

  function indexUrl(){
    return `${location.pathname}${location.search}`;
  }

  function projectUrl(i){
    return `#${encodeURIComponent(projects[i].slug)}`;
  }

  function projectIndexFromHash(hash=location.hash){
    let slug="";
    try{
      slug=decodeURIComponent((hash || "").replace(/^#/,""));
    }catch{
      return -1;
    }
    return projects.findIndex(project=>project.slug===slug);
  }

  function rememberIndex(){
    const prior=history.state && typeof history.state==="object" ? history.state : {};
    history.replaceState(
      {...prior,conceptsView:"index",indexScrollY:window.scrollY || 0},
      "",
      indexUrl()
    );
  }

  function pushProject(i,{fromIndex=true}={}){
    if(i<0 || i>=projects.length) return;
    rememberIndex();
    history.pushState(
      {conceptsView:"project",slug:projects[i].slug,fromIndex},
      "",
      projectUrl(i)
    );
  }

  function openFromRoute(i){
    if(i<0 || i>=projects.length || state!=="index") return;
    active=i;
    routing=true;
    try{
      hit.click();
    }finally{
      routing=false;
    }
  }

  function closeFromRoute(){
    if(state!=="opened" && state!=="opening") return;
    window.dispatchEvent(new CustomEvent("mobile-history-return"));
    routing=true;
    try{
      backBtn.click();
    }finally{
      routing=false;
    }
  }

  function navigateToIndex(){
    const hs=history.state && typeof history.state==="object" ? history.state : null;
    if(hs?.conceptsView==="project"){
      history.back();
      return;
    }

    const y=window.scrollY || 0;
    history.replaceState(
      {conceptsView:"index",indexScrollY:y},
      "",
      indexUrl()
    );
    closeFromRoute();
  }

  document.addEventListener("click",event=>{
    if(routing || !mobileQuery.matches) return;

    const target=event.target instanceof Element ? event.target : null;
    if(!target) return;

    if(target.closest("#backBtn") && (state==="opened" || state==="opening")){
      event.preventDefault();
      event.stopImmediatePropagation();
      navigateToIndex();
      return;
    }

    if(target.closest("#mobileScanHit") && state==="index" && active!==null){
      pushProject(active);
    }
  },true);

  window.addEventListener("popstate",()=>{
    if(!mobileQuery.matches) return;

    const i=projectIndexFromHash();
    if(i>=0){
      if(state==="index"){
        requestAnimationFrame(()=>openFromRoute(i));
      }
      return;
    }

    if(state==="opened" || state==="opening"){
      closeFromRoute();
      return;
    }

    const y=history.state && Number.isFinite(history.state.indexScrollY)
      ? history.state.indexScrollY
      : 0;
    requestAnimationFrame(()=>window.scrollTo(0,y));
  });

  const initialProject=projectIndexFromHash();
  if(initialProject>=0){
    // Direct #slug loads still get an in-site index entry, so the first Back
    // returns to the portfolio before the browser leaves the site.
    history.replaceState(
      {conceptsView:"index",indexScrollY:0},
      "",
      indexUrl()
    );
    history.pushState(
      {conceptsView:"project",slug:projects[initialProject].slug,fromIndex:false},
      "",
      projectUrl(initialProject)
    );
    requestAnimationFrame(()=>openFromRoute(initialProject));
  }else{
    const prior=history.state && typeof history.state==="object" ? history.state : {};
    history.replaceState(
      {...prior,conceptsView:"index",indexScrollY:window.scrollY || 0},
      "",
      indexUrl()
    );
  }

  window.mobileConceptsHistory={
    navigateToIndex,
    projectIndexFromHash
  };
})();
