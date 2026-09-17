(() => {
  const mobileQuery=window.matchMedia("(max-width:699px)");
  if(!mobileQuery.matches) return;

  const BAND=108;
  const START_Y=BAND/2;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const smooth=t=>t*t*(3-2*t);
  const lerp=(a,b,t)=>a+(b-a)*t;
  const workScanY=()=>Math.min(292,Math.max(250,window.innerHeight*.34));
  const introReadDistance=()=>Math.min(180,Math.max(150,window.innerHeight*.19));
  let frame=0;

  const steps=[0,.21,.405,.595,.79,1];

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
    const sourceLeft=source?.getBoundingClientRect().left ?? 14;
    const desiredLeft=sourceLeft-(width-(source?.getBoundingClientRect().width ?? width))/2;
    const left=clamp(desiredLeft,12,Math.max(12,window.innerWidth-width-12));

    line.style.left=`${left}px`;
    line.style.top=`${scanY-height/2}px`;
  }

  function renderSteppedIntro(){
    frame=0;
    const readDistance=introReadDistance();
    if(window.scrollY>readDistance) return;

    const scanWorld=document.getElementById("scanWorld");
    const scene=document.getElementById("scene");
    const magnifier=document.getElementById("mobileIntroMagnifier");
    const line=document.getElementById("mobileMagnifiedLine");
    if(!scanWorld || !scene || !magnifier || !line) return;

    const progress=clamp(window.scrollY/readDistance,0,1);
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

  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
  requestAnimationFrame(renderSteppedIntro);
})();
