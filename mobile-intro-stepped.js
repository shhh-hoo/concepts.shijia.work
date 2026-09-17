(() => {
  const mobileQuery=window.matchMedia("(max-width:699px)");
  if(!mobileQuery.matches) return;

  const BAND=108;
  const START_Y=BAND/2;
  const INTRO_READ_DISTANCE=180;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const smooth=t=>t*t*(3-2*t);
  const lerp=(a,b,t)=>a+(b-a)*t;
  const workScanY=()=>Math.min(292,Math.max(250,window.innerHeight*.34));
  let frame=0;

  const steps=[0,.21,.405,.595,.79,1];

  function alignFirstProjectStart(){
    const firstSection=stage.querySelector(':scope > .mobile-project[data-project="0"]')
      || stage.querySelector('.mobile-project[data-project="0"]');
    if(!firstSection) return;

    // The whole first project must START at the handoff, not merely place its
    // "01" label there. At the exact scroll position where the intro read ends:
    //
    //   firstProject.getBoundingClientRect().top === workScanY()
    //
    // so mobile-v2 computes project scan progress as 0 and the complete WSS
    // project world can subsequently pass through the fixed scan.
    firstSection.style.marginTop="0px";
    firstSection.style.paddingTop="12px";

    const naturalSectionTop=firstSection.getBoundingClientRect().top+window.scrollY;
    const targetDocumentTop=INTRO_READ_DISTANCE+workScanY();
    const requiredMargin=Math.max(0,targetDocumentTop-naturalSectionTop);
    firstSection.style.marginTop=`${requiredMargin}px`;
  }

  function applyClip(scanY){
    const scanWorld=document.getElementById("scanWorld");
    if(!scanWorld) return;
    const viewportH=window.innerHeight;
    const top=Math.max(0,scanY-BAND/2);
    const bottom=Math.max(0,viewportH-scanY-BAND/2);
    scanWorld.style.clipPath=`inset(${top}px 0px ${bottom}px 0px)`;
    document.documentElement.style.setProperty("--mobile-scan-y",`${scanY}px`);
    document.documentElement.style.setProperty("--mobile-scan-band",`${BAND}px`);
  }

  function stepIndex(progress){
    for(let i=0;i<steps.length-1;i++){
      if(progress<steps[i+1]) return i;
    }
    return 4;
  }

  function fitMagnifiedLine(text,index,scanY){
    const line=document.getElementById("mobileMagnifiedLine");
    if(!line) return;

    const source=document.querySelector(`#stage .mobile-intro-line[data-intro-line="${index}"]`);
    const sourceStyle=source ? getComputedStyle(source) : null;
    const sourceFont=parseFloat(sourceStyle?.fontSize)||24;
    const maxWidth=Math.max(1,window.innerWidth-24);

    line.textContent=text;
    line.style.fontSize=`${sourceFont*1.22}px`;
    line.style.left="12px";
    line.style.top="0px";

    let width=line.getBoundingClientRect().width;
    if(width>maxWidth){
      const fittedFont=sourceFont*1.22*(maxWidth/width);
      line.style.fontSize=`${fittedFont}px`;
      width=line.getBoundingClientRect().width;
    }

    const height=line.getBoundingClientRect().height;
    const sourceRect=source?.getBoundingClientRect();
    const sourceLeft=sourceRect?.left ?? 14;
    const sourceWidth=sourceRect?.width ?? width;
    const desiredLeft=sourceLeft-(width-sourceWidth)/2;
    const left=clamp(desiredLeft,12,Math.max(12,window.innerWidth-width-12));

    line.style.left=`${left}px`;
    line.style.top=`${scanY-height/2}px`;
  }

  function renderSteppedIntro(){
    frame=0;
    if(window.scrollY>INTRO_READ_DISTANCE) return;

    const scanWorld=document.getElementById("scanWorld");
    const scene=document.getElementById("scene");
    const magnifier=document.getElementById("mobileIntroMagnifier");
    const line=document.getElementById("mobileMagnifiedLine");
    if(!scanWorld || !scene || !magnifier || !line) return;

    const progress=clamp(window.scrollY/INTRO_READ_DISTANCE,0,1);
    const scanY=lerp(START_Y,workScanY(),smooth(progress));
    const index=stepIndex(progress);

    scanWorld.dataset.slug="intro";
    scanWorld.classList.add("intro-magnifier","show");
    scanWorld.style.background="#000";
    scene.classList.remove("mobile-scan-active");

    const decor=document.getElementById("mobileScanDecor");
    if(decor) decor.innerHTML="";
    const content=document.getElementById("mobileScanContent");
    if(content) content.style.transform="none";

    fitMagnifiedLine(intro[index][0],index,scanY);
    applyClip(scanY);
  }

  function schedule(){
    if(frame) return;
    frame=requestAnimationFrame(renderSteppedIntro);
  }

  alignFirstProjectStart();

  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",()=>{
    alignFirstProjectStart();
    schedule();
  },{passive:true});

  requestAnimationFrame(()=>{
    alignFirstProjectStart();
    renderSteppedIntro();
  });
})();
