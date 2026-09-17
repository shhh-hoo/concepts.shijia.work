(() => {
  const mobileQuery=window.matchMedia("(max-width:699px)");
  mobileQuery.addEventListener?.("change",()=>window.location.reload());
  if(!mobileQuery.matches) return;

  const BAND=108;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const smooth=t=>t*t*(3-2*t);
  const lerp=(a,b,t)=>a+(b-a)*t;
  const topScanY=()=>Math.min(96,Math.max(76,window.innerHeight*.10));
  const workScanY=()=>Math.min(292,Math.max(250,window.innerHeight*.34));
  const bottomReleaseDistance=()=>Math.min(460,Math.max(320,window.innerHeight*.48));

  let lastScanProject=null;
  let scrollFrame=0;
  let savedScrollY=0;

  function buildMobileFrontpage(){
    stage.innerHTML="";

    const introBlock=document.createElement("header");
    introBlock.className="mobile-intro";
    intro.forEach(([text],i)=>{
      const line=document.createElement("div");
      line.className="mobile-intro-line";
      line.dataset.introLine=String(i);
      line.textContent=text;
      introBlock.appendChild(line);
    });
    stage.appendChild(introBlock);

    blocks.forEach((block,i)=>{
      const section=document.createElement("section");
      section.className="mobile-project";
      section.dataset.project=String(i);

      const xs=block.lines.map(([,x])=>x);
      const maxX=Math.max(...xs);
      const minX=Math.min(...xs);
      const range=Math.max(1,maxX-minX);
      const base=Math.min(86,window.innerWidth*.22);
      const maxShift=Math.min(74,window.innerWidth*.19);

      const number=document.createElement("div");
      number.className="mobile-project-index";
      number.textContent=projects[i].num;
      number.style.marginLeft=`${Math.min(window.innerWidth-40,base+18)}px`;
      section.appendChild(number);

      const copy=document.createElement("div");
      copy.className="mobile-project-copy";

      block.lines.forEach(([text,x])=>{
        const normalized=(maxX-x)/range;
        const left=Math.max(8,base-normalized*maxShift);
        const line=document.createElement("span");
        line.className="mobile-project-line";
        line.textContent=text;
        line.style.setProperty("--mobile-x",`${left}px`);
        copy.appendChild(line);
      });

      section.appendChild(copy);
      stage.appendChild(section);
    });
  }

  function installMobileScanDOM(){
    if(document.getElementById("mobileScanContent")) return;

    const content=document.createElement("div");
    content.className="mobile-scan-content";
    content.id="mobileScanContent";

    const magnifier=document.createElement("div");
    magnifier.className="mobile-intro-magnifier";
    magnifier.id="mobileIntroMagnifier";
    const magnifiedLine=document.createElement("div");
    magnifiedLine.className="mobile-magnified-line";
    magnifiedLine.id="mobileMagnifiedLine";
    magnifier.appendChild(magnifiedLine);

    const decor=document.createElement("div");
    decor.className="mobile-scan-decor";
    decor.id="mobileScanDecor";

    content.appendChild(magnifier);
    content.appendChild(decor);
    content.appendChild(scanKicker);
    content.appendChild(scanTitle);
    content.appendChild(scanStatement);
    scanWorld.appendChild(content);

    const hit=document.createElement("button");
    hit.type="button";
    hit.className="mobile-scan-hit";
    hit.id="mobileScanHit";
    hit.setAttribute("aria-label","Open scanned project");
    scene.appendChild(hit);
  }

  function scanDecor(slug){
    if(slug==="wss"){
      return `<div class="color-field wss-f1"></div><div class="color-field wss-f2"></div><div class="color-field wss-f3"></div>`;
    }
    if(slug==="bnc"){
      return `<div class="bnc-states"><div class="bnc-state bnc-block">BLOCK</div><div class="bnc-state bnc-net">NET</div><div class="bnc-state bnc-chain">CHAIN</div></div>`;
    }
    if(slug==="foundry"){
      return `<div class="color-field foundry-f1"></div><div class="color-field foundry-f2"></div><div class="color-field foundry-f3"></div>`;
    }
    if(slug==="cuelayer"){
      return `<div class="color-field cue-f1"></div><div class="color-field cue-f2"></div>`;
    }
    if(slug==="aidrb"){
      return `<div class="color-field aid-f1"></div><div class="color-field aid-f2"></div><div class="color-field aid-f3"></div>`;
    }
    return `<div class="gradient-set"><div class="gradient-panel gradient-home">HOME</div><div class="gradient-panel gradient-as">AS</div><div class="gradient-panel gradient-a2">A2</div><div class="gradient-panel gradient-interactive">INTERACTIVE</div></div>`;
  }

  function setMobileScanIdentity(i){
    const p=projects[i];
    scanWorld.classList.remove("intro-magnifier");
    setScanStyle(i);
    scanWorld.dataset.slug=p.slug;
    document.getElementById("mobileScanDecor").innerHTML=scanDecor(p.slug);

    if(p.slug==="wss") scanWorld.style.background="#050505";
    else if(p.slug==="bnc") scanWorld.style.background="#fff";
    else if(p.slug==="foundry") scanWorld.style.background="#202020";
    else if(p.slug==="cuelayer") scanWorld.style.background="#f5f4ee";
    else if(p.slug==="aidrb") scanWorld.style.background="#f7f7f4";
    else scanWorld.style.background="#faf8f4";
  }

  function entryDistance(){
    const first=stage.querySelector(".mobile-project");
    const firstTop=first?.offsetTop ?? 190;
    return clamp(firstTop-topScanY()+44,90,180);
  }

  function scanPosition(){
    const top=topScanY();
    const work=workScanY();
    const entry=smooth(clamp(window.scrollY/entryDistance(),0,1));
    let y=lerp(top,work,entry);

    if(entry>=1){
      const doc=document.documentElement;
      const maxScroll=Math.max(0,doc.scrollHeight-window.innerHeight);
      const remaining=Math.max(0,maxScroll-window.scrollY);
      const release=bottomReleaseDistance();
      const releaseProgress=smooth(clamp((release-remaining)/release,0,1));
      const bottomCenter=Math.max(BAND/2,window.innerHeight-BAND/2);
      y=lerp(work,bottomCenter,releaseProgress);
    }

    return y;
  }

  function applyScanClip(scanY){
    const viewportH=window.innerHeight;
    const top=Math.max(0,scanY-BAND/2);
    const bottom=Math.max(0,viewportH-scanY-BAND/2);
    scanWorld.style.clipPath=`inset(${top}px 0px ${bottom}px 0px)`;
    document.documentElement.style.setProperty("--mobile-scan-y",`${scanY}px`);
    document.documentElement.style.setProperty("--mobile-scan-band",`${BAND}px`);
  }

  function nearestIntroLine(scanY){
    const lines=[...stage.querySelectorAll(".mobile-intro-line")];
    if(!lines.length) return null;
    let best=lines[0];
    let bestDistance=Infinity;
    for(const line of lines){
      const rect=line.getBoundingClientRect();
      const center=rect.top+rect.height/2;
      const distance=Math.abs(center-scanY);
      if(distance<bestDistance){
        bestDistance=distance;
        best=line;
      }
    }
    return best;
  }

  function positionMagnifiedLine(source,scanY){
    const line=document.getElementById("mobileMagnifiedLine");
    const sourceRect=source.getBoundingClientRect();
    const sourceStyle=getComputedStyle(source);
    const sourceFont=parseFloat(sourceStyle.fontSize)||24;
    const maxWidth=Math.max(1,window.innerWidth-24);

    line.textContent=source.textContent;
    line.style.fontSize=`${sourceFont*1.22}px`;
    line.style.left="0px";
    line.style.top="0px";

    let width=line.getBoundingClientRect().width;
    if(width>maxWidth){
      const fittedFont=sourceFont*1.22*(maxWidth/width);
      line.style.fontSize=`${fittedFont}px`;
      width=line.getBoundingClientRect().width;
    }

    const height=line.getBoundingClientRect().height;
    const desiredLeft=sourceRect.left-(width-sourceRect.width)/2;
    const left=clamp(desiredLeft,12,Math.max(12,window.innerWidth-width-12));
    const top=scanY-height/2;

    line.style.left=`${left}px`;
    line.style.top=`${top}px`;
  }

  function showIntroMagnifier(scanY){
    const source=nearestIntroLine(scanY);
    if(!source){
      hideMobileScan();
      return;
    }

    active=null;
    lastScanProject=null;
    scanWorld.dataset.slug="intro";
    scanWorld.classList.add("intro-magnifier");
    scanWorld.style.background="#000";
    document.getElementById("mobileScanContent").style.transform="none";
    positionMagnifiedLine(source,scanY);

    applyScanClip(scanY);
    scanWorld.classList.add("show");
    scene.classList.remove("mobile-scan-active");
  }

  function hideMobileScan(){
    active=null;
    lastScanProject=null;
    scanWorld.classList.remove("show","intro-magnifier");
    scene.classList.remove("mobile-scan-active");
  }

  function updateMobileScan(){
    scrollFrame=0;
    if(state!=="index"){
      hideMobileScan();
      return;
    }

    const scanY=scanPosition();
    const sections=[...stage.querySelectorAll(".mobile-project")];
    const firstRect=sections[0]?.getBoundingClientRect();
    let match=null;

    for(const section of sections){
      const rect=section.getBoundingClientRect();
      if(rect.top<=scanY && rect.bottom>=scanY){
        match={section,rect,i:Number(section.dataset.project)};
        break;
      }
    }

    if(!match){
      if(firstRect && firstRect.top>scanY){
        showIntroMagnifier(scanY);
      }else{
        hideMobileScan();
      }
      return;
    }

    const {rect,i}=match;
    active=i;
    if(lastScanProject!==i || scanWorld.classList.contains("intro-magnifier")){
      setMobileScanIdentity(i);
      lastScanProject=i;
    }

    const progress=clamp((scanY-rect.top)/rect.height,0,1);
    const viewportH=window.innerHeight;
    const sampleY=BAND/2+progress*Math.max(1,viewportH-BAND);
    const translateY=scanY-sampleY;

    document.getElementById("mobileScanContent").style.transform=`translate3d(0,${translateY}px,0)`;
    applyScanClip(scanY);
    scanWorld.classList.add("show");
    scene.classList.add("mobile-scan-active");
  }

  function requestScanUpdate(){
    if(scrollFrame) return;
    scrollFrame=requestAnimationFrame(updateMobileScan);
  }

  function openMobileProject(){
    if(state!=="index" || active===null) return;
    savedScrollY=window.scrollY;
    state="opened";
    renderProjectPage(active);
    projectWorld.classList.add("visible");
    scene.classList.add("opened");
    stage.style.visibility="hidden";
    scanWorld.classList.remove("show");
    scene.classList.remove("mobile-scan-active");
    document.documentElement.style.overflow="hidden";
    document.body.style.overflow="hidden";
    window.WSSContent?.activate();
  }

  function closeMobileProject(){
    if(state!=="opened" && state!=="opening") return;
    window.WSSContent?.pause();
    state="index";
    scene.classList.remove("opened");
    projectWorld.classList.remove("visible");
    projectScroll.scrollTop=0;
    stage.style.visibility="visible";
    document.documentElement.style.overflow="";
    document.body.style.overflow="";
    active=null;
    lastScanProject=null;
    window.scrollTo(0,savedScrollY);
    window.WSSContent?.destroy();
    requestAnimationFrame(updateMobileScan);
  }

  function resetMobileGeometry(){
    scene.style.transform="none";
    scene.style.left="";
    scene.style.top="";
    requestScanUpdate();
  }

  buildMobileFrontpage();
  installMobileScanDOM();
  resetMobileGeometry();

  window.addEventListener("scroll",requestScanUpdate,{passive:true});
  window.addEventListener("resize",resetMobileGeometry,{passive:true});

  viewport.addEventListener("click",e=>{
    if(!mobileQuery.matches) return;
    if(e.target.closest("#backBtn") || e.target.closest("#projectWorld")) return;

    e.stopImmediatePropagation();
    if(e.target.closest("#mobileScanHit")) openMobileProject();
  },true);

  backBtn.addEventListener("click",e=>{
    if(!mobileQuery.matches || state!=="opened") return;
    e.preventDefault();
    e.stopImmediatePropagation();
    closeMobileProject();
  },true);

  window.addEventListener("keydown",e=>{
    if(e.key==="Escape" && mobileQuery.matches && state==="opened"){
      e.stopImmediatePropagation();
      if(!window.WSSContent?.closeInteraction()) closeMobileProject();
    }
  },true);

  requestAnimationFrame(updateMobileScan);
})();
