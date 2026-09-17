(() => {
  const mobileQuery=window.matchMedia("(max-width:699px)");
  if(!mobileQuery.matches) return;

  const BAND=108;
  const START_Y=BAND/2;
  const ENTRY_SCROLL=72;
  let frame=0;

  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const smooth=t=>t*t*(3-2*t);

  function nearestIntroLine(scanY){
    const lines=[...document.querySelectorAll("#stage .mobile-intro-line")];
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
    if(!line || !source) return;

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

    line.style.left=`${left}px`;
    line.style.top=`${scanY-height/2}px`;
  }

  function applyTopEdgeCorrection(){
    frame=0;
    if(window.scrollY>ENTRY_SCROLL) return;

    const scanWorld=document.getElementById("scanWorld");
    if(!scanWorld || !scanWorld.classList.contains("intro-magnifier")) return;

    const root=document.documentElement;
    const reported=parseFloat(getComputedStyle(root).getPropertyValue("--mobile-scan-y"))||START_Y;
    const t=smooth(clamp(window.scrollY/ENTRY_SCROLL,0,1));
    const scanY=START_Y+(reported-START_Y)*t;
    const viewportH=window.innerHeight;
    const top=Math.max(0,scanY-BAND/2);
    const bottom=Math.max(0,viewportH-scanY-BAND/2);

    scanWorld.style.clipPath=`inset(${top}px 0px ${bottom}px 0px)`;
    root.style.setProperty("--mobile-scan-y",`${scanY}px`);
    root.style.setProperty("--mobile-scan-band",`${BAND}px`);

    positionMagnifiedLine(nearestIntroLine(scanY),scanY);
  }

  function schedule(){
    if(frame) return;
    frame=requestAnimationFrame(applyTopEdgeCorrection);
  }

  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",schedule,{passive:true});
  requestAnimationFrame(applyTopEdgeCorrection);
})();
